import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../.env') });
const prisma = new PrismaClient();

async function backup() {
  console.log('🔄 Starting complete database backup...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../../backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupPath = path.join(backupDir, `db_backup_${timestamp}.json`);

  const users = await prisma.user.findMany();
  const restaurants = await prisma.restaurant.findMany();
  const categories = await prisma.foodCategory.findMany();
  const listings = await prisma.listing.findMany();
  const orders = await prisma.order.findMany();
  const disputes = await prisma.dispute.findMany();
  const reviews = await prisma.review.findMany();
  const payouts = await prisma.payout.findMany();
  const auditLogs = await prisma.systemAuditLog.findMany();
  const addresses = await prisma.address.findMany();

  const backupData = {
    timestamp: new Date().toISOString(),
    counts: {
      users: users.length,
      restaurants: restaurants.length,
      categories: categories.length,
      listings: listings.length,
      orders: orders.length,
      disputes: disputes.length,
      reviews: reviews.length,
      payouts: payouts.length,
      auditLogs: auditLogs.length,
      addresses: addresses.length,
    },
    data: {
      users,
      restaurants,
      categories,
      listings,
      orders,
      disputes,
      reviews,
      payouts,
      auditLogs,
      addresses,
    },
  };

  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`✅ Complete database backup successfully saved to: ${backupPath}`);
  console.log('📊 Backup table counts:', JSON.stringify(backupData.counts, null, 2));

  await prisma.$disconnect();
}

backup().catch((e) => {
  console.error('❌ Backup failed:', e);
  process.exit(1);
});
