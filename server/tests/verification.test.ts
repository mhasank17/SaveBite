import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma, { isDatabaseConfigured } from '../src/config/db';
import inventoryService from '../src/services/inventoryService';

const app = createApp();

describe('Phase 6: QR/OTP Counter Pickup Verification & Security Gates', () => {
  const partnerAuth = 'Bearer test-partner-baker'; // Owns demo-rest-daily-dough
  const customerAuth = 'Bearer cust-sarah';

  beforeEach(async () => {
    await inventoryService.resetTestInventory();
  });

  // Helper to create a confirmed test order via standard API
  const createTestOrder = async (listingId = 'demo-deal-bakery-surprise') => {
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', customerAuth)
      .send({
        listingId,
        quantity: 1,
        fulfillmentType: 'SELF_PICKUP',
      });

    assert.equal(orderRes.status, 201, `Failed to create order: ${JSON.stringify(orderRes.body)}`);
    return orderRes.body.data.order;
  };

  // 1. Valid 4-digit OTP verification
  it('1. should successfully verify a valid 4-digit counter OTP and mark order as COMPLETED', async () => {
    const order = await createTestOrder('demo-deal-bakery-surprise');
    assert.ok(order.pickupOtp);

    const res = await request(app)
      .post('/api/v1/partner/orders/verify-pickup')
      .set('Authorization', partnerAuth)
      .send({
        pickupOtp: order.pickupOtp,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.orderNumber, order.orderNumber);
    assert.ok(res.body.data.completedAt, 'completedAt timestamp must be set');
    assert.match(res.body.message, /verified and marked as collected/i);

    // Verify order in database or memory has COMPLETED status
    if (isDatabaseConfigured()) {
      const dbOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      if (dbOrder) {
        assert.equal(dbOrder.orderStatus, 'COMPLETED');
        assert.ok(dbOrder.completedAt !== null);
      }
    }
  });

  // 2. Valid QR code secret token verification
  it('2. should successfully verify a valid QR code secret token and complete order', async () => {
    const order = await createTestOrder('demo-deal-bakery-surprise');
    assert.ok(order.qrSecretToken);

    const res = await request(app)
      .post('/api/v1/partner/orders/verify-pickup')
      .set('Authorization', partnerAuth)
      .send({
        qrSecretToken: order.qrSecretToken,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.orderNumber, order.orderNumber);
    assert.ok(res.body.data.completedAt);
  });

  // 3. Invalid OTP rejection
  it('3. should reject invalid OTP codes with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/partner/orders/verify-pickup')
      .set('Authorization', partnerAuth)
      .send({
        pickupOtp: '0999', // Non-existent OTP
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Invalid Pickup OTP or QR code/i);
  });

  // 4. Expired code rejection
  it('4. should prevent verification of expired orders with 400 Bad Request', async () => {
    const order = await createTestOrder('demo-deal-bakery-surprise');

    // Manually expire order timestamp
    const expiredDate = new Date(Date.now() - 3600000);
    if (isDatabaseConfigured()) {
      try {
        await prisma.order.updateMany({
          where: { id: order.id },
          data: { expiresAt: expiredDate },
        });
      } catch {}
    }

    const { orderService } = await import('../src/services/orderService');
    const inMem = (orderService as any).inMemoryOrders?.get(order.id);
    if (inMem) {
      inMem.expiresAt = expiredDate.toISOString();
    }

    const res = await request(app)
      .post('/api/v1/partner/orders/verify-pickup')
      .set('Authorization', partnerAuth)
      .send({
        pickupOtp: order.pickupOtp,
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Expired pickup code/i);
  });

  // 5. Duplicate verification prevention
  it('5. should prevent duplicate verification for already completed orders with 409 Conflict', async () => {
    const order = await createTestOrder('demo-deal-bakery-surprise');

    // First verification passes
    const firstRes = await request(app)
      .post('/api/v1/partner/orders/verify-pickup')
      .set('Authorization', partnerAuth)
      .send({
        pickupOtp: order.pickupOtp,
      });
    assert.equal(firstRes.status, 200);

    // Second verification must fail with 409 Conflict
    const secondRes = await request(app)
      .post('/api/v1/partner/orders/verify-pickup')
      .set('Authorization', partnerAuth)
      .send({
        pickupOtp: order.pickupOtp,
      });

    assert.equal(secondRes.status, 409);
    assert.equal(secondRes.body.success, false);
    assert.match(secondRes.body.message, /Duplicate verification/i);
  });

  // 6. Unauthorized partner verification prevention
  it('6. should reject unauthorized partner attempting to verify another restaurant order with 403 Forbidden', async () => {
    // Create order for Grand Palace Buffet Box (belongs to demo-rest-metro-banquet)
    const order = await createTestOrder('demo-deal-buffet-box');

    // Partner Baker (demo-rest-daily-dough) tries to verify Metro Banquet's order
    const res = await request(app)
      .post('/api/v1/partner/orders/verify-pickup')
      .set('Authorization', partnerAuth)
      .send({
        pickupOtp: order.pickupOtp,
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Unauthorized partner.*another restaurant/i);
  });

  // 7. Unauthorized customer access prevention
  it('7. should reject customer tokens from calling partner verification endpoint with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/partner/orders/verify-pickup')
      .set('Authorization', customerAuth)
      .send({
        pickupOtp: '8492',
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Forbidden.*Access restricted/i);
  });

  // 8. Missing payload validation
  it('8. should reject empty request body with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/partner/orders/verify-pickup')
      .set('Authorization', partnerAuth)
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Please provide either a 4-digit Pickup OTP or a valid QR token/i);
  });
});
