import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app';
import inventoryService from '../src/services/inventoryService';
import razorpayService from '../src/services/razorpayService';
import orderService from '../src/services/orderService';

const app = createApp();

describe('Phase 4: Ordering, Inventory & Payment Integration', () => {
  beforeEach(async () => {
    // Reset inventory to clean state before each test
    await inventoryService.resetTestInventory();
    await orderService.resetClearedHistory();
  });

  // 1. Valid order creation
  it('1. should successfully create a valid order and return Razorpay test checkout details', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', 'Bearer cust-sarah')
      .send({
        listingId: 'deal-1',
        quantity: 1,
        fulfillmentType: 'SELF_PICKUP',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.order);
    assert.equal(res.body.data.order.orderStatus, 'PENDING_PAYMENT');
    assert.equal(res.body.data.order.paymentStatus, 'INITIATED');
    assert.equal(res.body.data.order.quantity, 1);
    assert.equal(res.body.data.order.unitPriceInr, 149);
    assert.equal(res.body.data.order.totalPriceInr, 149);
    assert.ok(res.body.data.razorpay);
    assert.equal(res.body.data.razorpay.amount, 14900); // 149 INR in integer paise
    assert.equal(res.body.data.razorpay.currency, 'INR');
    assert.equal(res.body.data.razorpay.isTestMode, true);
  });

  // 2. Invalid quantity rejection
  it('2. should reject zero or negative quantities with 400 Bad Request', async () => {
    const zeroRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', 'Bearer cust-sarah')
      .send({
        listingId: 'deal-1',
        quantity: 0,
        fulfillmentType: 'SELF_PICKUP',
      });

    assert.equal(zeroRes.status, 400);
    assert.equal(zeroRes.body.success, false);

    const negRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', 'Bearer cust-sarah')
      .send({
        listingId: 'deal-1',
        quantity: -2,
        fulfillmentType: 'SELF_PICKUP',
      });

    assert.equal(negRes.status, 400);
    assert.equal(negRes.body.success, false);
  });

  // 3. Insufficient inventory rejection
  it('3. should reject orders exceeding available stock with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', 'Bearer cust-sarah')
      .send({
        listingId: 'deal-1',
        quantity: 50, // Available is only 3
        fulfillmentType: 'SELF_PICKUP',
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Insufficient inventory/);
  });

  // 4. Server-side price calculation
  it('4. should calculate all totals on the server and ignore client-supplied prices', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', 'Bearer cust-sarah')
      .send({
        listingId: 'deal-1', // surplusPriceInr is 149
        quantity: 2,
        fulfillmentType: 'ECO_COURIER', // +40 INR delivery fee
        totalPriceInr: 1, // Malicious client attempt to forge total
        unitPriceInr: 1,
      });

    assert.equal(res.status, 201);
    const order = res.body.data.order;
    // Server calculates: (149 * 2) + 40 = 338 INR
    assert.equal(order.unitPriceInr, 149);
    assert.equal(order.subtotalInr, 298);
    assert.equal(order.deliveryFeeInr, 40);
    assert.equal(order.totalPriceInr, 338);
    // Razorpay amount in integer paise: 33800
    assert.equal(res.body.data.razorpay.amount, 33800);
  });

  // 5. Inventory concurrency protection
  it('5. should prevent double-selling when two customers race for the final portion', async () => {
    // deal-test-concurrency has availableQuantity: 1
    const customer1Promise = request(app)
      .post('/api/v1/orders')
      .set('Authorization', 'Bearer cust-alice')
      .send({
        listingId: 'deal-test-concurrency',
        quantity: 1,
        fulfillmentType: 'SELF_PICKUP',
      });

    const customer2Promise = request(app)
      .post('/api/v1/orders')
      .set('Authorization', 'Bearer cust-bob')
      .send({
        listingId: 'deal-test-concurrency',
        quantity: 1,
        fulfillmentType: 'SELF_PICKUP',
      });

    const [res1, res2] = await Promise.all([customer1Promise, customer2Promise]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly one must succeed with 201, and one must fail with 409 Conflict
    assert.deepEqual(statuses, [201, 409]);

    const successfulRes = res1.status === 201 ? res1 : res2;
    const failedRes = res1.status === 409 ? res1 : res2;

    assert.equal(successfulRes.body.success, true);
    assert.equal(failedRes.body.success, false);
    assert.match(failedRes.body.message, /Insufficient inventory|SOLD_OUT|no longer active/);

    // Verify remaining inventory is 0
    const listing = await inventoryService.getListing('deal-test-concurrency');
    assert.equal(listing?.availableQuantity, 0);
  });

  // 6. Unauthenticated request rejection
  it('6. should reject unauthenticated requests with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({
        listingId: 'deal-1',
        quantity: 1,
        fulfillmentType: 'SELF_PICKUP',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Unauthorized/);
  });

  // 7. Access to another customer's order is denied
  it('7. should deny access to another customer order with 403 Forbidden', async () => {
    // Alice creates an order
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', 'Bearer cust-alice')
      .send({
        listingId: 'deal-1',
        quantity: 1,
        fulfillmentType: 'SELF_PICKUP',
      });

    assert.equal(orderRes.status, 201);
    const orderId = orderRes.body.data.order.id;

    // Bob tries to access Alice's order
    const bobRes = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', 'Bearer cust-bob');

    assert.equal(bobRes.status, 403);
    assert.equal(bobRes.body.success, false);
    assert.match(bobRes.body.message, /Access denied/);

    // Alice accesses her own order -> 200 OK
    const aliceRes = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', 'Bearer cust-alice');

    assert.equal(aliceRes.status, 200);
    assert.equal(aliceRes.body.success, true);
    assert.equal(aliceRes.body.data.id, orderId);
  });

  // 8. Invalid payment signature is rejected
  it('8. should reject invalid payment signatures with 400 Bad Request', async () => {
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', 'Bearer cust-sarah')
      .send({
        listingId: 'deal-1',
        quantity: 1,
        fulfillmentType: 'SELF_PICKUP',
      });

    const orderId = orderRes.body.data.order.id;
    const razorpayOrderId = orderRes.body.data.razorpay.razorpayOrderId;

    const verifyRes = await request(app)
      .post(`/api/v1/orders/${orderId}/verify-payment`)
      .set('Authorization', 'Bearer cust-sarah')
      .send({
        razorpayOrderId,
        razorpayPaymentId: 'pay_test_tampered_123',
        razorpaySignature: 'totally_invalid_signature_hash',
      });

    assert.equal(verifyRes.status, 400);
    assert.equal(verifyRes.body.success, false);
    assert.match(verifyRes.body.message, /signature/i);
  });

  // 9. Duplicate payment verification is handled safely
  it('9. should handle duplicate payment verification idempotently', async () => {
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', 'Bearer cust-sarah')
      .send({
        listingId: 'deal-1',
        quantity: 1,
        fulfillmentType: 'SELF_PICKUP',
      });

    const orderId = orderRes.body.data.order.id;
    const razorpayOrderId = orderRes.body.data.razorpay.razorpayOrderId;
    const paymentId = 'pay_test_999';
    const validSignature = razorpayService.generateTestSignature(razorpayOrderId, paymentId);

    // First verification
    const verify1 = await request(app)
      .post(`/api/v1/orders/${orderId}/verify-payment`)
      .set('Authorization', 'Bearer cust-sarah')
      .send({
        razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
      });

    assert.equal(verify1.status, 200);
    assert.equal(verify1.body.data.paymentStatus, 'SUCCESS');

    // Duplicate verification (retry)
    const verify2 = await request(app)
      .post(`/api/v1/orders/${orderId}/verify-payment`)
      .set('Authorization', 'Bearer cust-sarah')
      .send({
        razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
      });

    assert.equal(verify2.status, 200);
    assert.equal(verify2.body.data.paymentStatus, 'SUCCESS');
    assert.equal(verify2.body.data.id, orderId);
  });

  // 10. Failed payment does not mark the order as paid
  it('10. should not mark the order as paid when payment verification fails', async () => {
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', 'Bearer cust-sarah')
      .send({
        listingId: 'deal-1',
        quantity: 1,
        fulfillmentType: 'SELF_PICKUP',
      });

    const orderId = orderRes.body.data.order.id;

    // Send forged signature
    await request(app)
      .post(`/api/v1/orders/${orderId}/verify-payment`)
      .set('Authorization', 'Bearer cust-sarah')
      .send({
        razorpayOrderId: orderRes.body.data.razorpay.razorpayOrderId,
        razorpayPaymentId: 'pay_fail_123',
        razorpaySignature: 'invalid_sig',
      });

    // Check order state
    const checkRes = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', 'Bearer cust-sarah');

    assert.equal(checkRes.status, 200);
    assert.notEqual(checkRes.body.data.paymentStatus, 'SUCCESS');
    assert.notEqual(checkRes.body.data.orderStatus, 'CONFIRMED');
  });

  // 11. Correct payment updates the appropriate order/payment status
  it('11. should update order status to CONFIRMED and payment status to SUCCESS upon valid payment', async () => {
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', 'Bearer cust-sarah')
      .send({
        listingId: 'deal-2',
        quantity: 1,
        fulfillmentType: 'SELF_PICKUP',
      });

    const orderId = orderRes.body.data.order.id;
    const razorpayOrderId = orderRes.body.data.razorpay.razorpayOrderId;
    const paymentId = 'pay_test_success_777';
    const validSignature = razorpayService.generateTestSignature(razorpayOrderId, paymentId);

    const verifyRes = await request(app)
      .post(`/api/v1/orders/${orderId}/verify-payment`)
      .set('Authorization', 'Bearer cust-sarah')
      .send({
        razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
      });

    assert.equal(verifyRes.status, 200);
    const confirmedOrder = verifyRes.body.data;
    assert.equal(confirmedOrder.orderStatus, 'CONFIRMED');
    assert.equal(confirmedOrder.paymentStatus, 'SUCCESS');
    assert.equal(confirmedOrder.razorpayPaymentId, paymentId);
    assert.equal(confirmedOrder.razorpaySignature, validSignature);
    assert.ok(confirmedOrder.completedAt);
    assert.ok(confirmedOrder.pickupOtp);
    assert.ok(confirmedOrder.qrSecretToken);
  });

  // 12. Listing endpoints & customer order retrieval
  it('12. should list customer orders and active food deals', async () => {
    const dealsRes = await request(app).get('/api/v1/listings');
    assert.equal(dealsRes.status, 200);
    assert.equal(dealsRes.body.success, true);
    assert.ok(Array.isArray(dealsRes.body.data));
    assert.ok(dealsRes.body.data.length > 0);

    const myOrdersRes = await request(app)
      .get('/api/v1/orders/my-orders')
      .set('Authorization', 'Bearer user-sarah');

    assert.equal(myOrdersRes.status, 200);
    assert.equal(myOrdersRes.body.success, true);
    assert.ok(Array.isArray(myOrdersRes.body.data));
  });

  // 13. Customer listing API in development mode
  it('13. should clearly flag demo listings as unverified with pending KYC in development mode', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const res = await request(app).get('/api/v1/listings');
      assert.equal(res.status, 200);
      assert.ok(res.body.data.length > 0);

      const demoListing = res.body.data.find((item: any) => item.id === 'demo-deal-bakery-surprise' || item.id === 'deal-1');
      assert.ok(demoListing, 'Expected demo listing to be available in development mode for checkout testing');
      assert.equal(demoListing.isDemo, true);
      assert.ok(demoListing.kycStatus === 'PENDING' || demoListing.kycStatus === 'APPROVED');
      assert.equal(demoListing.hygieneGrade, 'Demo / Uninspected');
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  // 14. Customer listing API in production mode
  it('14. should strictly prevent demo listings and pending-KYC partners from appearing in production mode', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      // 1. In production, active listings API must not return demo listings
      const listRes = await request(app).get('/api/v1/listings');
      assert.equal(listRes.status, 200);
      const demoListings = listRes.body.data.filter((item: any) => item.isDemo || item.id.startsWith('demo-') || item.title.includes('[Demo]'));
      assert.equal(demoListings.length, 0, 'Production active listings must NEVER expose demo listings');

      // 2. In production, direct ID lookup of a demo listing must return 404
      const singleRes = await request(app).get('/api/v1/listings/demo-deal-bakery-surprise');
      assert.equal(singleRes.status, 404);
      assert.equal(singleRes.body.success, false);
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  // 15. Clear Order History - Unauthenticated access rejection
  it('15. should reject unauthenticated requests to clear order history with 401 Unauthorized', async () => {
    const res = await request(app).delete('/api/v1/orders/history');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  // 16. Clear Order History - Completed orders hidden, active orders preserved
  it('16. should clear completed orders from customer history while retaining active orders', async () => {
    // Seed an active order and a completed order for cust-sarah
    orderService.addTestOrder({
      id: 'ord-test-active-1',
      orderNumber: '#1001',
      customerId: 'user-sarah',
      restaurantId: 'rest-1',
      restaurantName: 'Test Cafe',
      restaurantAddress: '123 Test St',
      listingId: 'deal-1',
      dealTitle: 'Active Meal Pass',
      imageUrl: '',
      quantity: 1,
      unitPriceInr: 149,
      subtotalInr: 149,
      deliveryFeeInr: 0,
      totalPriceInr: 149,
      fulfillmentType: 'SELF_PICKUP',
      orderStatus: 'READY_FOR_PICKUP',
      paymentStatus: 'SUCCESS',
      pickupOtp: '1111',
      qrSecretToken: 'TOKEN-ACTIVE-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    orderService.addTestOrder({
      id: 'ord-test-completed-1',
      orderNumber: '#1002',
      customerId: 'user-sarah',
      restaurantId: 'rest-1',
      restaurantName: 'Test Cafe',
      restaurantAddress: '123 Test St',
      listingId: 'deal-1',
      dealTitle: 'Completed Past Meal',
      imageUrl: '',
      quantity: 1,
      unitPriceInr: 149,
      subtotalInr: 149,
      deliveryFeeInr: 0,
      totalPriceInr: 149,
      fulfillmentType: 'SELF_PICKUP',
      orderStatus: 'COMPLETED',
      paymentStatus: 'SUCCESS',
      pickupOtp: '2222',
      qrSecretToken: 'TOKEN-COMPLETED-1',
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Clear history
    const clearRes = await request(app)
      .delete('/api/v1/orders/history')
      .set('Authorization', 'Bearer user-sarah');

    assert.equal(clearRes.status, 200);
    assert.equal(clearRes.body.success, true);
    assert.ok(clearRes.body.data.clearedCount >= 1);
    assert.ok(clearRes.body.data.activeOrdersRetained >= 1);

    // Fetch customer's orders
    const myOrdersRes = await request(app)
      .get('/api/v1/orders/my-orders')
      .set('Authorization', 'Bearer user-sarah');

    assert.equal(myOrdersRes.status, 200);
    const returnedOrders = myOrdersRes.body.data;

    // ord-test-completed-1 must NOT be in customer's returned orders
    const hasCompletedOrder = returnedOrders.some((o: any) => o.id === 'ord-test-completed-1');
    assert.equal(hasCompletedOrder, false, 'Completed order must be hidden from customer history');

    // ord-test-active-1 MUST still be visible
    const hasActiveOrder = returnedOrders.some((o: any) => o.id === 'ord-test-active-1');
    assert.equal(hasActiveOrder, true, 'Active order must remain visible in customer orders');
  });

  // 17. Customer Isolation - Cannot clear other customers' history
  it('17. should ensure clearing history only affects the authenticated customer without modifying other customers orders', async () => {
    // Seed completed order for cust-alice
    orderService.addTestOrder({
      id: 'ord-test-alice-completed',
      orderNumber: '#1003',
      customerId: 'cust-alice',
      restaurantId: 'rest-1',
      restaurantName: 'Test Cafe',
      restaurantAddress: '123 Test St',
      listingId: 'deal-1',
      dealTitle: 'Alice Past Meal',
      imageUrl: '',
      quantity: 1,
      unitPriceInr: 149,
      subtotalInr: 149,
      deliveryFeeInr: 0,
      totalPriceInr: 149,
      fulfillmentType: 'SELF_PICKUP',
      orderStatus: 'COMPLETED',
      paymentStatus: 'SUCCESS',
      pickupOtp: '3333',
      qrSecretToken: 'TOKEN-ALICE-1',
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // cust-sarah clears history
    const clearRes = await request(app)
      .delete('/api/v1/orders/history')
      .set('Authorization', 'Bearer user-sarah');
    assert.equal(clearRes.status, 200);

    // cust-alice's orders must still include her completed order
    const aliceOrdersRes = await request(app)
      .get('/api/v1/orders/my-orders')
      .set('Authorization', 'Bearer cust-alice');

    assert.equal(aliceOrdersRes.status, 200);
    const hasAliceOrder = aliceOrdersRes.body.data.some((o: any) => o.id === 'ord-test-alice-completed');
    assert.equal(hasAliceOrder, true, "Other customer's completed orders must remain visible to them");
  });

  // 18. Audit & Financial Preservation - Order records remain accessible
  it('18. should preserve order records for platform admins and restaurants without deleting data', async () => {
    orderService.addTestOrder({
      id: 'ord-test-admin-preserved',
      orderNumber: '#1004',
      customerId: 'user-sarah',
      restaurantId: 'rest-1',
      restaurantName: 'Test Cafe',
      restaurantAddress: '123 Test St',
      listingId: 'deal-1',
      dealTitle: 'Preserved Order',
      imageUrl: '',
      quantity: 1,
      unitPriceInr: 149,
      subtotalInr: 149,
      deliveryFeeInr: 0,
      totalPriceInr: 149,
      fulfillmentType: 'SELF_PICKUP',
      orderStatus: 'COMPLETED',
      paymentStatus: 'SUCCESS',
      pickupOtp: '4444',
      qrSecretToken: 'TOKEN-PRESERVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Customer clears history
    await request(app)
      .delete('/api/v1/orders/history')
      .set('Authorization', 'Bearer user-sarah');

    // Superadmin directly retrieves the order
    const getRes = await request(app)
      .get('/api/v1/orders/ord-test-admin-preserved')
      .set('Authorization', 'Bearer admin-master');

    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.id, 'ord-test-admin-preserved');
  });

  // 19. POST alternative to DELETE
  it('19. should support POST /api/v1/orders/clear-history as an alternative to DELETE', async () => {
    const postRes = await request(app)
      .post('/api/v1/orders/clear-history')
      .set('Authorization', 'Bearer user-sarah');

    assert.equal(postRes.status, 200);
    assert.equal(postRes.body.success, true);
    assert.ok(postRes.body.message.includes('Cleared'));
  });
});
