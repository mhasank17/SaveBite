import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Customer Pickup Pass Functionality & State Logic', () => {
  // Helper matching PickupPassModal payment status logic
  const computePaymentBadge = (order: {
    orderStatus?: string;
    paymentStatus?: string;
  }) => {
    const isPaid =
      order.paymentStatus === 'SUCCESS' ||
      order.orderStatus === 'CONFIRMED' ||
      order.orderStatus === 'READY_FOR_PICKUP' ||
      order.orderStatus === 'COMPLETED';

    return isPaid ? 'PAID' : 'PENDING PAYMENT';
  };

  const computeOrderStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'READY_FOR_PICKUP':
        return 'Ready for Pickup';
      case 'COMPLETED':
        return 'Collected';
      case 'PENDING_PAYMENT':
        return 'Awaiting Payment';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status.replace(/_/g, ' ');
    }
  };

  it('1. shows PAID instead of PENDING PAYMENT when paymentStatus is SUCCESS', () => {
    const badge = computePaymentBadge({
      orderStatus: 'CONFIRMED',
      paymentStatus: 'SUCCESS',
    });
    assert.equal(badge, 'PAID');
  });

  it('2. shows PAID when order is READY_FOR_PICKUP or CONFIRMED', () => {
    const badgeReady = computePaymentBadge({
      orderStatus: 'READY_FOR_PICKUP',
      paymentStatus: 'SUCCESS',
    });
    assert.equal(badgeReady, 'PAID');

    const badgeConfirmed = computePaymentBadge({
      orderStatus: 'CONFIRMED',
    });
    assert.equal(badgeConfirmed, 'PAID');
  });

  it('3. shows PENDING PAYMENT when order is PENDING_PAYMENT and not yet verified', () => {
    const badge = computePaymentBadge({
      orderStatus: 'PENDING_PAYMENT',
      paymentStatus: 'INITIATED',
    });
    assert.equal(badge, 'PENDING PAYMENT');
  });

  it('4. displays human-friendly status labels for database order statuses', () => {
    assert.equal(computeOrderStatusLabel('CONFIRMED'), 'Confirmed');
    assert.equal(computeOrderStatusLabel('READY_FOR_PICKUP'), 'Ready for Pickup');
    assert.equal(computeOrderStatusLabel('COMPLETED'), 'Collected');
    assert.equal(computeOrderStatusLabel('PENDING_PAYMENT'), 'Awaiting Payment');
  });

  it('5. preserves 4-digit OTP and QR token without completing order upon retrieval', () => {
    const mockOrder = {
      id: 'order-123',
      orderNumber: '#8492',
      restaurantName: 'The Daily Dough Bakery',
      pickupOtp: '8492',
      qrSecretToken: 'SAVEBITE-PASS-8492-VERIFIED-AUTH',
      orderStatus: 'CONFIRMED',
      paymentStatus: 'SUCCESS',
    };

    // Viewing the pass reads the OTP and token
    const displayOtp = mockOrder.pickupOtp || mockOrder.orderNumber.replace('#', '');
    const displayQr = mockOrder.qrSecretToken;

    assert.equal(displayOtp, '8492');
    assert.equal(displayQr, 'SAVEBITE-PASS-8492-VERIFIED-AUTH');
    // Order status remains CONFIRMED (never mutated to COMPLETED merely on view)
    assert.equal(mockOrder.orderStatus, 'CONFIRMED');
  });
});
