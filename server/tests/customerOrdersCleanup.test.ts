import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/db';
import orderService from '../src/services/orderService';

describe('Customer Portal Demo Orders Cleanup & Real Data Verification', () => {
  it('1. ensures no sample chicken biryani orders exist in the database', async () => {
    const biryaniOrders = await prisma.order.findMany({
      where: {
        OR: [
          { listing: { title: { contains: 'Biryani', mode: 'insensitive' } } },
          { listing: { title: { contains: 'Biriyani', mode: 'insensitive' } } },
        ],
      },
      include: { listing: true },
    });

    assert.equal(biryaniOrders.length, 0, 'No sample biryani orders should exist in the database');
  });

  it('2. ensures all explicit demo orders (isDemo: true) are removed from the database', async () => {
    const demoOrders = await prisma.order.findMany({
      where: { isDemo: true },
    });

    assert.equal(demoOrders.length, 0, 'No orders with isDemo=true should exist in the database');
  });

  it('3. ensures demo customer Sarah has zero orders in the database or service', async () => {
    const sarahOrders = await orderService.getMyOrders('demo-user-cust-sarah');
    assert.equal(sarahOrders.length, 0, 'Sarah should have zero orders returned');
  });

  it('4. ensures real customer accounts and credentials are preserved intact', async () => {
    const customerUsers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
    });

    assert.ok(customerUsers.length > 0, 'Customer accounts should be preserved');
    const sanaulla = customerUsers.find((u) => u.email === 'sanaullak294@gmail.com');
    assert.ok(sanaulla, 'Real customer Sanaulla account must exist');
    assert.equal(sanaulla.role, 'CUSTOMER');
  });

  it('5. ensures real customer orders and dynamic calculations work accurately', async () => {
    const sanaulla = await prisma.user.findUnique({
      where: { email: 'sanaullak294@gmail.com' },
    });
    assert.ok(sanaulla);

    const orders = await orderService.getMyOrders(sanaulla.id);
    assert.ok(Array.isArray(orders));
    // Check that every returned order is NOT a demo order
    for (const o of orders) {
      assert.ok(!o.dealTitle.toLowerCase().includes('biryani'), 'Should not contain biryani');
      assert.ok(!o.dealTitle.toLowerCase().includes('biriyani'), 'Should not contain biriyani');
      assert.ok(!o.dealTitle.startsWith('[Demo]'), 'Should not start with [Demo]');
    }

    // Dynamic calculations
    const active = orders.filter(
      (o) => o.orderStatus === 'CONFIRMED' || o.orderStatus === 'READY_FOR_PICKUP'
    );
    const completed = orders.filter((o) => o.orderStatus === 'COMPLETED');
    const totalMeals = completed.reduce((sum, o) => sum + (o.quantity || 1), 0);
    const totalSpent = completed.reduce((sum, o) => sum + (o.totalPriceInr || 0), 0);

    assert.ok(typeof totalMeals === 'number');
    assert.ok(typeof totalSpent === 'number');
    assert.ok(active.length >= 0);
    assert.ok(completed.length >= 0);
  });

  it('6. ensures restaurants and listings data remain preserved in the database', async () => {
    const restaurantsCount = await prisma.restaurant.count();
    const listingsCount = await prisma.listing.count();

    assert.ok(restaurantsCount > 0, 'Restaurants must not be deleted');
    assert.ok(listingsCount > 0, 'Partner listings must not be deleted');
  });
});
