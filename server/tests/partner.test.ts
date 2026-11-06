process.env.NODE_ENV = 'test';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app';
import inventoryService from '../src/services/inventoryService';
import partnerService from '../src/services/partnerService';
import emailService from '../src/services/emailService';

// Configure mock transporter for test suite to prevent external SMTP network calls
emailService.setTransporter({
  sendMail: async () => ({
    messageId: '<test-partner-otp@savebite.in>',
    response: '250 2.0.0 OK: message accepted',
  }),
  verify: async () => true,
} as any);

const app = createApp();

describe('Phase 5: Restaurant Partner Portal', () => {
  const partnerAuth = 'Bearer test-partner-baker';
  const customerAuth = 'Bearer cust-sarah';

  beforeEach(async () => {
    await inventoryService.resetTestInventory();
    partnerService.resetDeletedListings();
  });

  // 1. Partner authentication check
  it('1. should reject unauthenticated requests to partner endpoints with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/partner/restaurant');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  // 2. Customer role rejection (role-based access control)
  it('2. should reject customers from accessing partner portal with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/partner/restaurant')
      .set('Authorization', customerAuth);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access restricted/);
  });

  // 3. Partner restaurant profile & metrics retrieval
  it('3. should retrieve restaurant details and live dashboard metrics for authenticated partner', async () => {
    const res = await request(app)
      .get('/api/v1/partner/restaurant')
      .set('Authorization', partnerAuth);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data);
    assert.ok(res.body.data.name);
    assert.ok(res.body.data.licenseNumber);
    assert.ok(res.body.data.metrics);
    assert.equal(typeof res.body.data.metrics.activeListingsCount, 'number');
    assert.equal(typeof res.body.data.metrics.totalMealsRescued, 'number');
    assert.equal(typeof res.body.data.metrics.totalRevenueInr, 'number');
  });

  // 4. Toggle store live status
  it('4. should allow partner to toggle store live status (pause/resume orders)', async () => {
    const pauseRes = await request(app)
      .patch('/api/v1/partner/restaurant/status')
      .set('Authorization', partnerAuth)
      .send({ isStoreLive: false });

    assert.equal(pauseRes.status, 200);
    assert.equal(pauseRes.body.success, true);
    assert.equal(pauseRes.body.data.isStoreLive, false);

    const resumeRes = await request(app)
      .patch('/api/v1/partner/restaurant/status')
      .set('Authorization', partnerAuth)
      .send({ isStoreLive: true });

    assert.equal(resumeRes.status, 200);
    assert.equal(resumeRes.body.success, true);
    assert.equal(resumeRes.body.data.isStoreLive, true);
  });

  // 5. Get partner restaurant listings
  it('5. should list all food deal listings for the partner restaurant', async () => {
    const res = await request(app)
      .get('/api/v1/partner/listings')
      .set('Authorization', partnerAuth);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);

    const firstListing = res.body.data[0];
    assert.ok(firstListing.id);
    assert.ok(firstListing.title);
    assert.equal(typeof firstListing.availableQuantity, 'number');
    assert.equal(typeof firstListing.surplusPriceInr, 'number');
  });

  // 6. Create new food deal listing
  it('6. should allow partner to create a new food deal listing', async () => {
    const res = await request(app)
      .post('/api/v1/partner/listings')
      .set('Authorization', partnerAuth)
      .send({
        title: '[Demo] Fresh Afternoon Sourdough Loaves',
        description: 'Freshly baked artisanal country loaves packed fresh for afternoon tea.',
        categoryId: 'demo-cat-bakery',
        originalPriceInr: 400,
        surplusPriceInr: 120,
        totalQuantity: 5,
        pickupStartTime: '16:00',
        pickupEndTime: '18:00',
        dietaryTags: ['Vegetarian', 'Demo Record'],
        allergenNotice: 'Contains Wheat Gluten',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.id);
    assert.equal(res.body.data.title, '[Demo] Fresh Afternoon Sourdough Loaves');
    assert.equal(res.body.data.totalQuantity, 5);
    assert.equal(res.body.data.availableQuantity, 5);
    assert.equal(res.body.data.surplusPriceInr, 120);

    // Clean up created test listing so test runs don't leave residual database records
    await request(app)
      .delete(`/api/v1/partner/listings/${res.body.data.id}`)
      .set('Authorization', partnerAuth);
  });

  // 7. Update listing quantity and pricing
  it('7. should allow partner to update available quantity or pricing of an existing listing', async () => {
    const res = await request(app)
      .patch('/api/v1/partner/listings/demo-deal-bakery-surprise')
      .set('Authorization', partnerAuth)
      .send({
        availableQuantity: 5,
        surplusPriceInr: 159,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.availableQuantity, 5);
    assert.equal(res.body.data.surplusPriceInr, 159);
  });

  // 8. Get partner orders
  it('8. should list all orders received by the partner restaurant', async () => {
    const res = await request(app)
      .get('/api/v1/partner/orders')
      .set('Authorization', partnerAuth);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  // 9. Verify Pickup OTP at counter
  it('9. should verify customer 4-digit pickup OTP and mark order as collected', async () => {
    // First, create an order to verify
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', 'Bearer cust-sarah')
      .send({
        listingId: 'demo-deal-bakery-surprise',
        quantity: 1,
        fulfillmentType: 'SELF_PICKUP',
      });

    assert.equal(orderRes.status, 201);
    const order = orderRes.body.data.order;
    const pickupOtp = order.pickupOtp;
    assert.ok(pickupOtp);

    // Partner verifies the OTP
    const verifyRes = await request(app)
      .post('/api/v1/partner/orders/verify-pickup')
      .set('Authorization', partnerAuth)
      .send({
        pickupOtp,
      });

    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body.success, true);
    assert.ok(verifyRes.body.data.completedAt || verifyRes.body.data.alreadyCompleted);
  });

  // 10. Reject invalid OTP with 400 Bad Request
  it('10. should reject invalid OTP codes with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/partner/orders/verify-pickup')
      .set('Authorization', partnerAuth)
      .send({
        pickupOtp: '0000', // Non-existent OTP
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Invalid Pickup OTP/);
  });

  // 11. Partner earnings & payout schedule
  it('11. should retrieve partner revenue, platform commission deduction, and net payout in INR', async () => {
    const res = await request(app)
      .get('/api/v1/partner/earnings')
      .set('Authorization', partnerAuth);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data);
    assert.equal(typeof res.body.data.grossRevenueInr, 'number');
    assert.equal(typeof res.body.data.netPayoutInr, 'number');
    assert.equal(res.body.data.commissionPercent, 15);
    assert.ok(res.body.data.bankAccount);
    assert.ok(Array.isArray(res.body.data.recentPayouts));
  });

  // 12. Reject unauthenticated listing deletion
  it('12. should reject unauthenticated requests to delete a food deal with 401 Unauthorized', async () => {
    const res = await request(app).delete('/api/v1/partner/listings/demo-deal-bakery-surprise');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  // 13. Reject customer attempting to delete food deal
  it('13. should reject customer tokens from deleting partner food deals with 403 Forbidden', async () => {
    const res = await request(app)
      .delete('/api/v1/partner/listings/demo-deal-bakery-surprise')
      .set('Authorization', customerAuth);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access restricted/);
  });

  // 14. Return 404 for non-existent deal deletion
  it('14. should return 404 Not Found when attempting to delete a non-existent food deal', async () => {
    const res = await request(app)
      .delete('/api/v1/partner/listings/non-existent-deal-xyz-999')
      .set('Authorization', partnerAuth);

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not found/i);
  });

  // 15. Prevent partner from deleting another restaurant's food deal (authorization gate)
  it('15. should prevent partner from deleting a food deal belonging to another restaurant with 403 Forbidden', async () => {
    const res = await request(app)
      .delete('/api/v1/partner/listings/demo-deal-buffet-box')
      .set('Authorization', partnerAuth);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /own restaurant/i);
  });

  // 16. Safely soft-delete/archive food deal, immediately removing it from listings while preserving historical orders
  it('16. should safely soft-delete a food deal, remove it from active listings, and preserve historical orders', async () => {
    // 1. Create a deal
    const createRes = await request(app)
      .post('/api/v1/partner/listings')
      .set('Authorization', partnerAuth)
      .send({
        title: '[Demo] Fresh Safe Delete Test Croissant Pack',
        description: 'Assorted warm croissants for safe deletion testing.',
        categoryId: 'demo-cat-bakery',
        originalPriceInr: 350,
        surplusPriceInr: 110,
        totalQuantity: 4,
        pickupStartTime: '17:00',
        pickupEndTime: '19:00',
        dietaryTags: ['Vegetarian', 'Demo Record'],
        allergenNotice: 'Contains Wheat, Dairy',
      });

    assert.equal(createRes.status, 201);
    const createdDealId = createRes.body.data.id;
    assert.ok(createdDealId);

    // 2. Customer places an order for this deal to verify historical preservation
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', customerAuth)
      .send({
        listingId: createdDealId,
        quantity: 1,
        fulfillmentType: 'SELF_PICKUP',
      });

    assert.equal(orderRes.status, 201);
    const orderId = orderRes.body.data.order.id;
    assert.ok(orderId);

    // 3. Partner deletes the listing
    const deleteRes = await request(app)
      .delete(`/api/v1/partner/listings/${createdDealId}`)
      .set('Authorization', partnerAuth);

    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body.success, true);
    assert.match(deleteRes.body.message, /removed/i);
    assert.equal(deleteRes.body.data.status, 'EXPIRED');
    assert.equal(deleteRes.body.data.isArchived, true);

    // 4. Verify deal is removed from partner listings
    const partnerListingsRes = await request(app)
      .get('/api/v1/partner/listings')
      .set('Authorization', partnerAuth);

    assert.equal(partnerListingsRes.status, 200);
    const foundInPartner = partnerListingsRes.body.data.find((l: any) => l.id === createdDealId);
    assert.equal(foundInPartner, undefined, 'Deleted deal must not appear in partner active listings');

    // 5. Verify deal is removed from customer-facing active listings
    const customerListingsRes = await request(app).get('/api/v1/listings');
    assert.equal(customerListingsRes.status, 200);
    const foundInCustomer = customerListingsRes.body.data.find((l: any) => l.id === createdDealId);
    assert.equal(foundInCustomer, undefined, 'Deleted deal must immediately be removed from customer discovery');

    // 6. Verify historical order is completely intact and preserved
    const myOrdersRes = await request(app)
      .get('/api/v1/orders/my-orders')
      .set('Authorization', customerAuth);

    assert.equal(myOrdersRes.status, 200);
    const historicalOrder = myOrdersRes.body.data.find((o: any) => o.id === orderId);
    assert.ok(historicalOrder, 'Historical order must remain intact in database after deal deletion');
    assert.equal(historicalOrder.listingId, createdDealId);
  });

  // 17. Partner Profile Retrieval
  it('17. should retrieve partner user profile and restaurant details', async () => {
    const res = await request(app)
      .get('/api/v1/partner/profile')
      .set('Authorization', partnerAuth);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.user);
    assert.ok(res.body.data.restaurant);
    assert.equal(res.body.data.user.role, 'PARTNER');
  });

  // 18. Partner Profile Update
  it('18. should update permitted partner profile information (name and branch)', async () => {
    const res = await request(app)
      .patch('/api/v1/partner/profile')
      .set('Authorization', partnerAuth)
      .send({
        fullName: 'Vikram Joshi (Executive Baker)',
        branchName: 'Sandbox Outlet - Bandra West (Updated)',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.fullName, 'Vikram Joshi (Executive Baker)');
  });

  // 19. Partner Password Change
  it('19. should validate current password and update partner password securely', async () => {
    // Rejection with incorrect current password
    const failRes = await request(app)
      .post('/api/v1/partner/change-password')
      .set('Authorization', partnerAuth)
      .send({
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPartnerPassword2026!',
      });

    assert.equal(failRes.status, 400);
    assert.equal(failRes.body.success, false);

    // Success with correct password
    const successRes = await request(app)
      .post('/api/v1/partner/change-password')
      .set('Authorization', partnerAuth)
      .send({
        currentPassword: 'Partner@123!',
        newPassword: 'NewPartnerPassword2026!',
      });

    assert.equal(successRes.status, 200);
    assert.equal(successRes.body.success, true);

    // Restore original password for other tests
    await request(app)
      .post('/api/v1/partner/change-password')
      .set('Authorization', partnerAuth)
      .send({
        currentPassword: 'NewPartnerPassword2026!',
        newPassword: 'Partner@123!',
      });
  });

  // 20. Partner Email OTP Request & Verification
  it('20. should request email change OTP and verify to update account email', async () => {
    const newEmail = 'updated.baker@savebite.in';

    // 1. Request OTP
    const reqRes = await request(app)
      .post('/api/v1/partner/email/request-otp')
      .set('Authorization', partnerAuth)
      .send({ newEmail });

    assert.equal(reqRes.status, 200);
    assert.equal(reqRes.body.success, true);

    // 2. Extract OTP from partnerService map or service state
    const otpsMap = (partnerService as any).emailChangeOtps;
    let foundOtp = '';
    // Look for matching entry
    for (const [key, val] of otpsMap.entries()) {
      if (val.newEmail === newEmail) {
        // Find OTP by testing digits 100000..999999 or checking hash
        const crypto = require('crypto');
        for (let i = 100000; i <= 999999; i++) {
          const testStr = i.toString();
          const hash = crypto.createHash('sha256').update(testStr).digest('hex');
          if (hash === val.otpHash) {
            foundOtp = testStr;
            break;
          }
        }
        break;
      }
    }

    assert.ok(foundOtp, '6-digit OTP should be generated and stored');

    // 3. Verify OTP
    const verifyRes = await request(app)
      .post('/api/v1/partner/email/verify-otp')
      .set('Authorization', partnerAuth)
      .send({ newEmail, otp: foundOtp });

    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body.success, true);
    assert.equal(verifyRes.body.data.user.email, newEmail);
    assert.ok(verifyRes.body.data.token);

    // Restore original email for subsequent test consistency
    const restoreOtpReq = await request(app)
      .post('/api/v1/partner/email/request-otp')
      .set('Authorization', `Bearer ${verifyRes.body.data.token}`)
      .send({ newEmail: 'baker@savebite.in' });

    assert.equal(restoreOtpReq.status, 200);
    let restoreOtp = '';
    for (const [key, val] of otpsMap.entries()) {
      if (val.newEmail === 'baker@savebite.in') {
        const crypto = require('crypto');
        for (let i = 100000; i <= 999999; i++) {
          const testStr = i.toString();
          if (crypto.createHash('sha256').update(testStr).digest('hex') === val.otpHash) {
            restoreOtp = testStr;
            break;
          }
        }
        break;
      }
    }

    await request(app)
      .post('/api/v1/partner/email/verify-otp')
      .set('Authorization', `Bearer ${verifyRes.body.data.token}`)
      .send({ newEmail: 'baker@savebite.in', otp: restoreOtp });
  });

  // 21. Partner Avatar Upload
  it('21. should upload custom partner avatar photo and return image URL', async () => {
    const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const uploadRes = await request(app)
      .post('/api/v1/partner/avatar')
      .set('Authorization', partnerAuth)
      .send({
        filename: 'partner-avatar-test.png',
        mimeType: 'image/png',
        base64: `data:image/png;base64,${tinyPngBase64}`,
      });

    assert.equal(uploadRes.status, 200);
    assert.equal(uploadRes.body.success, true);
    assert.ok(uploadRes.body.data.avatarUrl);

    // Verify profile shows uploaded avatar
    const profileRes = await request(app)
      .get('/api/v1/partner/profile')
      .set('Authorization', partnerAuth);

    assert.equal(profileRes.status, 200);
    assert.equal(profileRes.body.data.user.avatarUrl, uploadRes.body.data.avatarUrl);
  });

  // 22. Partner Avatar Removal
  it('22. should remove partner avatar photo and restore default null avatar', async () => {
    const removeRes = await request(app)
      .delete('/api/v1/partner/avatar')
      .set('Authorization', partnerAuth);

    assert.equal(removeRes.status, 200);
    assert.equal(removeRes.body.success, true);
    assert.equal(removeRes.body.data.avatarUrl, null);

    // Verify profile reflects null avatar
    const profileRes = await request(app)
      .get('/api/v1/partner/profile')
      .set('Authorization', partnerAuth);

    assert.equal(profileRes.status, 200);
    assert.equal(profileRes.body.data.user.avatarUrl, null);
  });
});
