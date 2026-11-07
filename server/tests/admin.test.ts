import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Phase 7: SuperAdmin Portal & Governance', () => {
  const adminAuth = 'Bearer test-admin-super';
  const partnerAuth = 'Bearer test-partner-baker';
  const customerAuth = 'Bearer test-customer-sarah';

  // 1. Unauthenticated rejection
  it('1. should reject unauthenticated requests to admin endpoints with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/admin/overview');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  // 2. Customer role rejection
  it('2. should reject customer tokens from accessing admin endpoints with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/overview')
      .set('Authorization', customerAuth);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access restricted to \[ADMIN\]/i);
  });

  // 3. Partner role rejection
  it('3. should reject partner tokens from accessing admin endpoints with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/overview')
      .set('Authorization', partnerAuth);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access restricted to \[ADMIN\]/i);
  });

  // 4. Platform overview metrics retrieval
  it('4. should retrieve platform-wide metrics for authenticated admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/overview')
      .set('Authorization', adminAuth);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data);
    assert.equal(typeof res.body.data.grossRevenueInr, 'number');
    assert.equal(typeof res.body.data.commissionCollectedInr, 'number');
    assert.equal(typeof res.body.data.totalMealsRescued, 'number');
    assert.equal(typeof res.body.data.totalRestaurantsCount, 'number');
    assert.equal(res.body.data.systemHealth, 'OPERATIONAL');
  });

  // 5. Vendor listing with KYC status
  it('5. should retrieve all partner vendors with compliance and KYC status', async () => {
    const res = await request(app)
      .get('/api/v1/admin/vendors')
      .set('Authorization', adminAuth);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data[0].licenseNumber);
    assert.ok(res.body.data[0].kycStatus);
  });

  // 6. Vendor KYC status update
  it('6. should update vendor KYC status to APPROVED with audit log', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/vendors/demo-rest-metro-banquet/kyc')
      .set('Authorization', adminAuth)
      .send({
        kycStatus: 'APPROVED',
        adminNotes: 'FSSAI certificate and kitchen hygiene inspection verified',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.kycStatus, 'APPROVED');
  });

  // 7. Vendor store status toggle (suspend / open)
  it('7. should allow admin to toggle vendor store status', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/vendors/demo-rest-daily-dough/status')
      .set('Authorization', adminAuth)
      .send({
        isStoreLive: false,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.isStoreLive, false);
  });

  // 8. Listings moderation directory
  it('8. should list platform food deals across all vendors', async () => {
    const res = await request(app)
      .get('/api/v1/admin/listings')
      .set('Authorization', adminAuth);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data[0].title);
  });

  // 9. Moderate listing (delist / pause)
  it('9. should allow admin to pause/delist a listing for compliance', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/listings/demo-deal-bakery-surprise/status')
      .set('Authorization', adminAuth)
      .send({
        status: 'PAUSED',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'PAUSED');
  });

  // 10. Customer disputes feed
  it('10. should retrieve open and resolved customer quality disputes', async () => {
    const res = await request(app)
      .get('/api/v1/admin/disputes')
      .set('Authorization', adminAuth);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data[0].reason);
  });

  // 11. Resolve dispute with refund
  it('11. should resolve a customer dispute and issue refund', async () => {
    const res = await request(app)
      .post('/api/v1/admin/disputes/disp-001/resolve')
      .set('Authorization', adminAuth)
      .send({
        resolution: 'RESOLVED_REFUNDED',
        refundAmountInr: 149,
        adminNotes: 'Confirmed outlet was closed during pickup window. Full refund issued.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'RESOLVED_REFUNDED');
  });

  // 12. Payouts queue
  it('12. should retrieve partner settlement queue', async () => {
    const res = await request(app)
      .get('/api/v1/admin/payouts')
      .set('Authorization', adminAuth);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
  });

  // 13. Process batch payout with bank UTR generation
  it('13. should process batch payout and generate bank UTR reference', async () => {
    const res = await request(app)
      .post('/api/v1/admin/payouts/process-batch')
      .set('Authorization', adminAuth)
      .send({
        payoutIds: ['pay-20261027-002', 'pay-20261027-003'],
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'COMPLETED');
    assert.ok(res.body.data.bankReferenceId.startsWith('UTR-SB-BATCH-'));
  });

  // 14. Sensitive admin actions recording in audit logs
  it('14. should record sensitive governance actions in audit logs', async () => {
    const modRes = await request(app)
      .patch('/api/v1/admin/listings/demo-deal-bakery-surprise/status')
      .set('Authorization', adminAuth)
      .send({ status: 'ACTIVE' });
    assert.equal(modRes.status, 200);

    const overviewRes = await request(app)
      .get('/api/v1/admin/overview')
      .set('Authorization', adminAuth);
    assert.equal(overviewRes.status, 200);
    assert.ok(Array.isArray(overviewRes.body.data.recentActivity));
    assert.ok(overviewRes.body.data.recentActivity.length > 0);
  });

  // 15. Restaurant-wise sales & settlements aggregation
  it('15. should retrieve restaurant-wise sales ledger with 15% commission, 85% earnings, and deal breakdown', async () => {
    const res = await request(app)
      .get('/api/v1/admin/settlements')
      .set('Authorization', adminAuth);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.summary);
    assert.equal(typeof res.body.data.summary.totalPendingInr, 'number');
    assert.equal(typeof res.body.data.summary.partnersAwaitingTransfer, 'number');
    assert.equal(typeof res.body.data.summary.totalSettledInr, 'number');
    assert.ok(Array.isArray(res.body.data.restaurants));
    assert.ok(res.body.data.restaurants.length > 0);

    const first = res.body.data.restaurants[0];
    assert.ok(first.restaurantId);
    assert.ok(first.restaurantName);
    assert.equal(typeof first.ordersCount, 'number');
    assert.equal(typeof first.itemsSold, 'number');
    assert.equal(typeof first.totalSalesInr, 'number');
    assert.equal(typeof first.commissionInr, 'number');
    assert.equal(typeof first.restaurantEarningsInr, 'number');
    assert.equal(typeof first.alreadyPaidInr, 'number');
    assert.equal(typeof first.pendingAmountInr, 'number');
    assert.ok(Array.isArray(first.dealBreakdown));
    assert.ok(Array.isArray(first.settlementHistory));
  });

  // 16. Date filtering on settlements
  it('16. should support date filters on settlements (all, today, this_month)', async () => {
    const resToday = await request(app)
      .get('/api/v1/admin/settlements?filter=today')
      .set('Authorization', adminAuth);
    assert.equal(resToday.status, 200);
    assert.equal(resToday.body.data.summary.periodLabel, 'Today');

    const resMonth = await request(app)
      .get('/api/v1/admin/settlements?filter=this_month')
      .set('Authorization', adminAuth);
    assert.equal(resMonth.status, 200);
    assert.equal(resMonth.body.data.summary.periodLabel, 'This Month');
  });

  // 17. Settle full restaurant payout and verify UTR (FULL SETTLEMENT ONLY)
  it('17. should process full restaurant settlement and disburse complete outstanding amount with verified UTR', async () => {
    // Get a restaurant with pending amount
    const ledgerRes = await request(app)
      .get('/api/v1/admin/settlements')
      .set('Authorization', adminAuth);

    assert.equal(ledgerRes.status, 200);
    assert.ok(Array.isArray(ledgerRes.body.data.history));

    const candidate = ledgerRes.body.data.restaurants.find((r: any) => r.pendingAmountInr > 0);
    if (candidate) {
      const expectedFullAmount = candidate.pendingAmountInr;

      const payRes = await request(app)
        .post('/api/v1/admin/settlements/pay')
        .set('Authorization', adminAuth)
        .send({
          restaurantId: candidate.restaurantId,
          notes: 'Full settlement verification',
        });

      assert.equal(payRes.status, 200);
      assert.equal(payRes.body.success, true);
      assert.equal(payRes.body.data.payout.status, 'COMPLETED');
      assert.equal(payRes.body.data.payout.amountInr, expectedFullAmount);
      assert.equal(payRes.body.data.summary.remainingPendingInr, 0);
      assert.equal(payRes.body.data.summary.isFullySettled, true);
      assert.ok(payRes.body.data.payout.bankReferenceId.startsWith('UTR-SB-RZP-'));
    }
  });

  // 18. Partial settlement rejection (Strictly full settlement only)
  it('18. should strictly reject partial settlement requests and custom amount payloads with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/admin/settlements/pay')
      .set('Authorization', adminAuth)
      .send({
        restaurantId: 'demo-rest-daily-dough',
        amountInr: 500, // Attempted partial settlement
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Partial or custom settlement amounts are strictly prohibited/i);
  });

  // 19. Duplicate settlement prevention
  it('19. should prevent duplicate settlements when a partner has already been fully settled', async () => {
    // Check if a restaurant is already fully settled or settle one
    const ledgerRes = await request(app)
      .get('/api/v1/admin/settlements')
      .set('Authorization', adminAuth);

    const fullySettled = ledgerRes.body.data.restaurants.find((r: any) => r.pendingAmountInr === 0);
    if (fullySettled) {
      const dupRes = await request(app)
        .post('/api/v1/admin/settlements/pay')
        .set('Authorization', adminAuth)
        .send({
          restaurantId: fullySettled.restaurantId,
        });

      assert.equal(dupRes.status, 400);
      assert.equal(dupRes.body.success, false);
      assert.match(dupRes.body.message, /already been fully settled/i);
    }
  });

  // 20. Non-existent restaurant rejection
  it('20. should reject settlement requests for non-existent restaurant with 404 Not Found', async () => {
    const invalidRes = await request(app)
      .post('/api/v1/admin/settlements/pay')
      .set('Authorization', adminAuth)
      .send({
        restaurantId: 'non-existent-restaurant-xyz',
      });

    assert.equal(invalidRes.status, 404);
    assert.equal(invalidRes.body.success, false);
  });

  // 21. Admin Profile Retrieval
  it('21. should retrieve authenticated SuperAdmin profile with clean avatar state', async () => {
    const res = await request(app)
      .get('/api/v1/admin/profile')
      .set('Authorization', adminAuth);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.role, 'ADMIN');
    assert.ok(res.body.data.fullName);
    assert.ok(res.body.data.email);
    // Explicitly verify no unsplash or human photograph URL
    assert.ok(!res.body.data.avatarUrl || !res.body.data.avatarUrl.includes('unsplash.com/photo-'));
  });

  // 22. Admin Profile Edit
  it('22. should update admin profile details and save changes in database and memory', async () => {
    const updatedName = 'Chief Campus SuperAdmin';
    const updatedPhone = '+919999900001';

    const res = await request(app)
      .patch('/api/v1/admin/profile')
      .set('Authorization', adminAuth)
      .send({
        fullName: updatedName,
        phone: updatedPhone,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.fullName, updatedName);
    assert.equal(res.body.data.phone, updatedPhone);

    // Verify retrieval reflects the updated name
    const verifyRes = await request(app)
      .get('/api/v1/admin/profile')
      .set('Authorization', adminAuth);

    assert.equal(verifyRes.body.data.fullName, updatedName);
  });

  // 23. Admin Password Change & Validation
  it('23. should validate current password and securely handle SuperAdmin password update', async () => {
    // Attempt with incorrect current password
    const failRes = await request(app)
      .post('/api/v1/admin/change-password')
      .set('Authorization', adminAuth)
      .send({
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewSecurePassword2026!',
        confirmPassword: 'NewSecurePassword2026!',
      });

    assert.equal(failRes.status, 400);
    assert.equal(failRes.body.success, false);
    assert.match(failRes.body.message, /Current password is incorrect/i);

    // Attempt with matching real password
    const successRes = await request(app)
      .post('/api/v1/admin/change-password')
      .set('Authorization', adminAuth)
      .send({
        currentPassword: 'SuperAdmin@SaveBite2026!',
        newPassword: 'SaveBite@Master2026!',
        confirmPassword: 'SaveBite@Master2026!',
      });

    assert.equal(successRes.status, 200);
    assert.equal(successRes.body.success, true);

    // Reset password back to SuperAdmin@SaveBite2026!
    await request(app)
      .post('/api/v1/admin/change-password')
      .set('Authorization', adminAuth)
      .send({
        currentPassword: 'SaveBite@Master2026!',
        newPassword: 'SuperAdmin@SaveBite2026!',
        confirmPassword: 'SuperAdmin@SaveBite2026!',
      });
  });

  // 24. Real Admin Login Verification
  it('24. should authenticate real SuperAdmin login with registered credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({
        email: 'admin@savebite.in',
        password: 'SuperAdmin@SaveBite2026!',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'ADMIN');
    assert.equal(res.body.data.user.email, 'admin@savebite.in');
    assert.ok(res.body.data.token);
  });

  // 25. Old Demo Admin Login Failure
  it('25. should strictly reject old demo admin credentials with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({
        email: 'admin@savebite.in',
        password: 'Admin@SaveBite2026!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Invalid administrator credentials/i);
  });

  // 26. Invalid Admin Credentials Rejection
  it('26. should reject invalid admin credentials and unregistered emails', async () => {
    const wrongPassRes = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({
        email: 'admin@savebite.in',
        password: 'completely-wrong-password',
      });

    assert.equal(wrongPassRes.status, 401);
    assert.equal(wrongPassRes.body.success, false);

    const wrongEmailRes = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({
        email: 'fakeadmin@savebite.in',
        password: 'SuperAdmin@SaveBite2026!',
      });

    assert.equal(wrongEmailRes.status, 401);
    assert.equal(wrongEmailRes.body.success, false);
  });

  // 27. Customer and Partner Logins Unaffected
  it('27. should ensure customer and restaurant partner logins continue working normally', async () => {
    // Customer login
    const custRes = await request(app)
      .post('/api/v1/auth/customer/login')
      .send({
        email: 'sarah@savebite.in',
        password: 'Customer@123!',
      });

    assert.equal(custRes.status, 200);
    assert.equal(custRes.body.success, true);
    assert.equal(custRes.body.data.user.role, 'CUSTOMER');
    assert.ok(custRes.body.data.token);

    // Partner login
    const partnerRes = await request(app)
      .post('/api/v1/auth/partner/login')
      .send({
        email: 'baker@savebite.in',
        password: 'Partner@123!',
      });

    assert.equal(partnerRes.status, 200);
    assert.equal(partnerRes.body.success, true);
    assert.equal(partnerRes.body.data.user.role, 'PARTNER');
    assert.ok(partnerRes.body.data.token);
  });

  // 28. Admin cannot access SuperAdmin audit logs
  it('28. should reject standard admin tokens from accessing SuperAdmin audit logs with 403 Forbidden', async () => {
    const regularAdminAuth = 'Bearer test-admin-regular';
    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', regularAdminAuth);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /SuperAdmin platform authority/i);
  });

  // 29. Regular admin rejected from dedicated SuperAdmin routes
  it('29. should reject regular admin tokens from dedicated /api/v1/super-admin/telemetry with 403 Forbidden', async () => {
    const regularAdminAuth = 'Bearer test-admin-regular';
    const res = await request(app)
      .get('/api/v1/super-admin/telemetry')
      .set('Authorization', regularAdminAuth);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /SuperAdmin platform authority/i);
  });

  // 30. SuperAdmin allowed on dedicated SuperAdmin routes
  it('30. should allow SuperAdmin tokens to access /api/v1/super-admin/telemetry with 200 OK', async () => {
    const res = await request(app)
      .get('/api/v1/super-admin/telemetry')
      .set('Authorization', adminAuth);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data);
  });

  // 31. Unadvertised secure admin login route verification
  it('31. should support unadvertised secure administrator login route /api/v1/auth/secure-admin-access/login', async () => {
    // Valid login
    const res = await request(app)
      .post('/api/v1/auth/secure-admin-access/login')
      .send({
        email: 'admin@savebite.in',
        password: 'SuperAdmin@SaveBite2026!',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'ADMIN');
    assert.ok(res.body.data.token);

    // Invalid credentials rejected
    const invalidRes = await request(app)
      .post('/api/v1/auth/secure-admin-access/login')
      .send({
        email: 'admin@savebite.in',
        password: 'wrong-admin-password',
      });

    assert.equal(invalidRes.status, 401);
    assert.equal(invalidRes.body.success, false);
  });
});
