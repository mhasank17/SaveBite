import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
const prisma = new PrismaClient();

const PRESERVED_EMAILS = [
  'sanaullak294@gmail.com',
  'mhasan786k@gmail.com',
  'baker@savebite.in',
  'admin@savebite.in', // Admin / SuperAdmin governance login account
];

async function executeCleanup() {
  console.log('🚀 Starting database cleanup execution...');

  // 1. Identify users to preserve
  const preservedUsers = await prisma.user.findMany({
    where: { email: { in: PRESERVED_EMAILS } },
    select: { id: true, email: true, fullName: true, role: true },
  });
  const preservedUserIds = preservedUsers.map((u) => u.id);

  console.log(`✅ Identified ${preservedUsers.length} preserved users:`);
  preservedUsers.forEach((u) => console.log(`   - [${u.role}] ${u.email} (${u.fullName})`));

  // 2. Identify restaurants to preserve
  const preservedRestaurants = await prisma.restaurant.findMany({
    where: { ownerUserId: { in: preservedUserIds } },
    select: { id: true, name: true, ownerUserId: true },
  });
  const preservedRestaurantIds = preservedRestaurants.map((r) => r.id);

  console.log(`\n✅ Identified ${preservedRestaurants.length} preserved restaurant(s):`);
  preservedRestaurants.forEach((r) => console.log(`   - ${r.name} (${r.id})`));

  // 3. Delete demo listings in preserved restaurants (with '[Demo]' in title and 0 orders)
  const deletedDemoListings = await prisma.listing.deleteMany({
    where: {
      restaurantId: { in: preservedRestaurantIds },
      OR: [{ title: { contains: '[Demo]' } }, { isDemo: true }],
      orders: { none: {} },
    },
  });
  console.log(`\n🗑️ Deleted ${deletedDemoListings.count} expired demo listings from preserved restaurants.`);

  // 4. Identify and delete unwanted demo restaurants
  const restaurantsToDelete = await prisma.restaurant.findMany({
    where: { id: { notIn: preservedRestaurantIds } },
    select: { id: true, name: true },
  });
  const deleteRestaurantIds = restaurantsToDelete.map((r) => r.id);

  if (deleteRestaurantIds.length > 0) {
    // Delete any listings belonging to these restaurants first
    await prisma.listing.deleteMany({
      where: { restaurantId: { in: deleteRestaurantIds } },
    });
    // Delete any payouts or reviews if any
    await prisma.payout.deleteMany({
      where: { restaurantId: { in: deleteRestaurantIds } },
    });
    await prisma.review.deleteMany({
      where: { restaurantId: { in: deleteRestaurantIds } },
    });

    const deletedRestaurants = await prisma.restaurant.deleteMany({
      where: { id: { in: deleteRestaurantIds } },
    });
    console.log(`🗑️ Deleted ${deletedRestaurants.count} unwanted demo restaurants:`);
    restaurantsToDelete.forEach((r) => console.log(`   - ${r.name} (${r.id})`));
  }

  // 5. Identify and delete unwanted users
  const usersToDelete = await prisma.user.findMany({
    where: { id: { notIn: preservedUserIds } },
    select: { id: true, email: true },
  });
  const deleteUserIds = usersToDelete.map((u) => u.id);

  if (deleteUserIds.length > 0) {
    // Clean up any addresses or reviews for safety
    await prisma.address.deleteMany({
      where: { userId: { in: deleteUserIds } },
    });
    await prisma.review.deleteMany({
      where: { customerId: { in: deleteUserIds } },
    });
    await prisma.dispute.deleteMany({
      where: { raisedByUserId: { in: deleteUserIds } },
    });

    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: deleteUserIds } },
    });
    console.log(`🗑️ Deleted ${deletedUsers.count} unwanted demo/test user accounts.`);
  }

  // 6. Final verification & count of remaining database state
  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true },
  });
  const remainingRestaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true, ownerUserId: true },
  });
  const remainingListings = await prisma.listing.findMany({
    select: { id: true, title: true, status: true, availableQuantity: true, surplusPriceInr: true },
  });
  const remainingOrders = await prisma.order.findMany({
    select: { id: true, orderNumber: true, customerId: true, orderStatus: true, totalPriceInr: true },
  });

  console.log('\n================ POST-CLEANUP DATABASE STATE ================');
  console.log(`👥 Remaining Users (${remainingUsers.length}):`);
  remainingUsers.forEach((u) => console.log(`   - [${u.role}] ${u.email} (${u.fullName})`));

  console.log(`\n🏪 Remaining Restaurants (${remainingRestaurants.length}):`);
  remainingRestaurants.forEach((r) => console.log(`   - ${r.name} (${r.id})`));

  console.log(`\n🍲 Remaining Listings (${remainingListings.length}):`);
  remainingListings.forEach((l) =>
    console.log(`   - ${l.title} [Status: ${l.status}, Avail: ${l.availableQuantity}, ₹${l.surplusPriceInr}]`)
  );

  console.log(`\n📦 Remaining Orders (${remainingOrders.length}):`);
  remainingOrders.forEach((o) =>
    console.log(`   - Order ${o.orderNumber} (ID: ${o.id}, Status: ${o.orderStatus}, ₹${o.totalPriceInr})`)
  );
  console.log('=============================================================\n');

  await prisma.$disconnect();
}

executeCleanup().catch((e) => {
  console.error('❌ Cleanup failed:', e);
  process.exit(1);
});
