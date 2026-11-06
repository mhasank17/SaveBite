import { PrismaClient, UserRole, KycStatus, ListingStatus } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

// =============================================================================
// Positive System Demo Identifiers & Markers
// All demo records MUST positively carry these exact system markers.
// =============================================================================
export const DEMO_SYSTEM_MARKER = 'SYSTEM_DEMO_RECORD_V1';
export const DEMO_LICENSE_DOC_URL = 'https://savebite.invalid/DEMO_DATA_MARKER_V1.pdf';
export const DEMO_UID_PREFIX = 'SYSTEM_DEMO_UID:';
export const DEMO_EMAIL_DOMAIN = '@savebite.invalid';

// =============================================================================
// Configurable Pickup Window for Development Testing
// Allows overriding via env vars: SEED_PICKUP_DATE, SEED_PICKUP_START_TIME, SEED_PICKUP_END_TIME
// Default is today's date with a wide 10:00 to 23:30 active testing window
// =============================================================================
const SEED_CONFIG = {
  pickupDate: process.env.SEED_PICKUP_DATE ? new Date(process.env.SEED_PICKUP_DATE) : new Date(),
  pickupStartTime: process.env.SEED_PICKUP_START_TIME || '10:00',
  pickupEndTime: process.env.SEED_PICKUP_END_TIME || '23:30',
};

// =============================================================================
// Strict Safeguard: Positive Multi-Factor Demo Identity Verification
// If a record with the same ID/identifier already exists, it MUST satisfy
// ALL model-specific system markers. If ANY check fails, execution aborts immediately.
// =============================================================================
function assertPositiveDemoIdentity(record: any, modelName: string): void {
  if (!record) return;

  let isPositivelyDemo = false;

  switch (modelName) {
    case 'Listing':
      // Must have demo-deal- prefix, dietary marker tag, AND explicit isDemo === true column
      isPositivelyDemo =
        Boolean(record.id?.startsWith('demo-deal-')) &&
        record.isDemo === true &&
        Array.isArray(record.dietaryTags) &&
        record.dietaryTags.includes(DEMO_SYSTEM_MARKER);
      break;

    case 'Restaurant':
      // Must have demo-rest- prefix, exact demo license doc URL, license prefix, AND explicit isDemo === true column
      isPositivelyDemo =
        Boolean(record.id?.startsWith('demo-rest-')) &&
        record.isDemo === true &&
        record.licenseDocumentUrl === DEMO_LICENSE_DOC_URL &&
        typeof record.licenseNumber === 'string' &&
        record.licenseNumber.startsWith('DEMO-FSSAI-');
      break;

    case 'User':
      // Must have demo-user- prefix and synthetic UID prefix
      isPositivelyDemo =
        Boolean(record.id?.startsWith('demo-user-')) &&
        typeof record.firebaseUid === 'string' &&
        record.firebaseUid.startsWith(DEMO_UID_PREFIX);
      break;

    case 'FoodCategory':
      // Must have demo-cat- prefix AND explicit isDemo === true column
      isPositivelyDemo =
        Boolean(record.id?.startsWith('demo-cat-')) &&
        record.isDemo === true;
      break;

    default:
      isPositivelyDemo = false;
  }

  if (!isPositivelyDemo) {
    throw new Error(
      `🚨 STRICT SAFEGUARD HALT: Existing ${modelName} record with ID "${record.id}" could NOT be positively identified as safe demo data. ` +
        `Required system markers or isDemo column flag missing/false. Script execution ABORTED immediately to prevent modifying production or commercial data.`
    );
  }
}

async function main() {
  console.log('🌱 Starting SaveBite safe development database seed (Idempotent with Strict Safeguards)...');
  console.log(`🕒 Configured Test Pickup Window: ${SEED_CONFIG.pickupStartTime} – ${SEED_CONFIG.pickupEndTime}`);

  // ---------------------------------------------------------------------------
  // 1. Fictional Users (.invalid reserved domain per RFC 2606)
  // All IDs explicitly prefixed with demo-user- and tagged with SYSTEM_DEMO_UID:
  // ---------------------------------------------------------------------------
  const sampleUsers = [
    {
      id: 'demo-user-partner-baker',
      firebaseUid: `${DEMO_UID_PREFIX}demo-partner-baker`,
      email: `demo.baker${DEMO_EMAIL_DOMAIN}`,
      fullName: 'Demo Partner Baker (Sample)',
      phone: '+910000000001',
      role: UserRole.PARTNER,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      isDemo: true,
    },
    {
      id: 'demo-user-partner-banquet',
      firebaseUid: `${DEMO_UID_PREFIX}demo-partner-banquet`,
      email: `demo.banquet${DEMO_EMAIL_DOMAIN}`,
      fullName: 'Demo Partner Banquet (Sample)',
      phone: '+910000000002',
      role: UserRole.PARTNER,
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
      isDemo: true,
    },
    {
      id: 'demo-user-partner-sushi',
      firebaseUid: `${DEMO_UID_PREFIX}demo-partner-sushi`,
      email: `demo.sushi${DEMO_EMAIL_DOMAIN}`,
      fullName: 'Demo Partner Sushi (Sample)',
      phone: '+910000000003',
      role: UserRole.PARTNER,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      isDemo: true,
    },
    {
      id: 'demo-user-partner-biryani',
      firebaseUid: `${DEMO_UID_PREFIX}demo-partner-biryani`,
      email: `demo.biryani${DEMO_EMAIL_DOMAIN}`,
      fullName: 'Demo Partner Biryani (Sample)',
      phone: '+910000000004',
      role: UserRole.PARTNER,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
      isDemo: true,
    },
    // Fictional test customer accounts
    {
      id: 'demo-user-cust-sarah',
      firebaseUid: `${DEMO_UID_PREFIX}cust-sarah`,
      email: `demo.customer.sarah${DEMO_EMAIL_DOMAIN}`,
      fullName: 'Sarah Jenkins (Test Customer)',
      phone: '+910000000010',
      role: UserRole.CUSTOMER,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
      isDemo: true,
    },
    {
      id: 'demo-user-cust-alice',
      firebaseUid: `${DEMO_UID_PREFIX}cust-alice`,
      email: `demo.customer.alice${DEMO_EMAIL_DOMAIN}`,
      fullName: 'Alice Test (Test Customer)',
      phone: '+910000000011',
      role: UserRole.CUSTOMER,
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80',
      isDemo: true,
    },
    {
      id: 'demo-user-cust-bob',
      firebaseUid: `${DEMO_UID_PREFIX}cust-bob`,
      email: `demo.customer.bob${DEMO_EMAIL_DOMAIN}`,
      fullName: 'Bob Test (Test Customer)',
      phone: '+910000000012',
      role: UserRole.CUSTOMER,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
      isDemo: true,
    },
  ];

  for (const user of sampleUsers) {
    const existing = await prisma.user.findUnique({ where: { id: user.id } });
    if (existing) {
      assertPositiveDemoIdentity(existing, 'User');
      await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          isDemo: true,
        },
      });
    } else {
      await prisma.user.create({ data: user });
    }
  }
  console.log(`✅ Verified & safely seeded ${sampleUsers.length} fictional sample users.`);

  // ---------------------------------------------------------------------------
  // 2. Food Categories (Standard Marketplace Taxonomy)
  // All IDs explicitly prefixed with demo-cat-
  // ---------------------------------------------------------------------------
  const sampleCategories = [
    { id: 'demo-cat-meal', slug: 'meal', name: 'Meal', iconName: 'dinner_dining', isDemo: true },
    { id: 'demo-cat-bakery', slug: 'bakery', name: 'Bakery', iconName: 'bakery_dining', isDemo: true },
    { id: 'demo-cat-pantry', slug: 'pantry', name: 'Pantry', iconName: 'inventory_2', isDemo: true },
    { id: 'demo-cat-meals', slug: 'meals', name: 'Meal', iconName: 'dinner_dining', isDemo: true },
    { id: 'demo-cat-buffet', slug: 'buffet', name: 'Meal', iconName: 'dinner_dining', isDemo: true },
    { id: 'demo-cat-asian', slug: 'asian', name: 'Meal', iconName: 'dinner_dining', isDemo: true },
    { id: 'demo-cat-healthy', slug: 'healthy', name: 'Meal', iconName: 'dinner_dining', isDemo: true },
    { id: 'demo-cat-cafe', slug: 'cafe', name: 'Meal', iconName: 'dinner_dining', isDemo: true },
  ];

  for (const cat of sampleCategories) {
    const existing = await prisma.foodCategory.findUnique({ where: { id: cat.id } });
    if (existing) {
      assertPositiveDemoIdentity(existing, 'FoodCategory');
      await prisma.foodCategory.update({
        where: { id: cat.id },
        data: { name: cat.name, slug: cat.slug, iconName: cat.iconName, isDemo: true },
      });
    } else {
      await prisma.foodCategory.create({ data: cat });
    }
  }
  console.log(`✅ Verified & safely seeded ${sampleCategories.length} food categories.`);

  // ---------------------------------------------------------------------------
  // 3. Fictional Demo Restaurants
  // All IDs explicitly prefixed with demo-rest- and carry DEMO_LICENSE_DOC_URL
  // Explicitly marked:
  // - kycStatus: PENDING (unverified)
  // - hygieneGrade: 'Demo / Uninspected'
  // - rating: 0.0, reviewCount: 0
  // ---------------------------------------------------------------------------
  const sampleRestaurants = [
    {
      id: 'demo-rest-daily-dough',
      ownerUserId: 'demo-user-partner-baker',
      name: '[Demo] The Daily Dough Bakery (Unverified Sample Partner)',
      branchName: 'Sandbox Outlet - Bandra West',
      address: '100 Demo Street, Sandbox Sector 1',
      city: 'Mumbai',
      latitude: 19.0596,
      longitude: 72.8295,
      phone: '+910000000001',
      hygieneGrade: 'Demo / Uninspected',
      licenseNumber: 'DEMO-FSSAI-00000000000001-SAMPLE',
      licenseDocumentUrl: DEMO_LICENSE_DOC_URL,
      kycStatus: KycStatus.PENDING,
      isStoreLive: true,
      isDemo: true,
      rating: 0.0,
      reviewCount: 0,
    },
    {
      id: 'demo-rest-metro-banquet',
      ownerUserId: 'demo-user-partner-banquet',
      name: '[Demo] Metro Banquet & Catering (Unverified Sample Partner)',
      branchName: 'Sandbox Central Hub - BKC',
      address: '200 Demo Avenue, Sandbox Sector 2',
      city: 'Mumbai',
      latitude: 19.0688,
      longitude: 72.8681,
      phone: '+910000000002',
      hygieneGrade: 'Demo / Uninspected',
      licenseNumber: 'DEMO-FSSAI-00000000000002-SAMPLE',
      licenseDocumentUrl: DEMO_LICENSE_DOC_URL,
      kycStatus: KycStatus.PENDING,
      isStoreLive: true,
      isDemo: true,
      rating: 0.0,
      reviewCount: 0,
    },
    {
      id: 'demo-rest-sakura-bowl',
      ownerUserId: 'demo-user-partner-sushi',
      name: '[Demo] Sakura Bowl & Rolls (Unverified Sample Partner)',
      branchName: 'Sandbox South Outlet - Koramangala',
      address: '300 Demo Cross, Sandbox Sector 3',
      city: 'Bengaluru',
      latitude: 12.9352,
      longitude: 77.6245,
      phone: '+910000000003',
      hygieneGrade: 'Demo / Uninspected',
      licenseNumber: 'DEMO-FSSAI-00000000000003-SAMPLE',
      licenseDocumentUrl: DEMO_LICENSE_DOC_URL,
      kycStatus: KycStatus.PENDING,
      isStoreLive: true,
      isDemo: true,
      rating: 0.0,
      reviewCount: 0,
    },
    {
      id: 'demo-rest-spice-symphony',
      ownerUserId: 'demo-user-partner-biryani',
      name: '[Demo] Spice Symphony Kitchen (Unverified Sample Partner)',
      branchName: 'Sandbox North Outlet - Connaught Place',
      address: '400 Demo Circle, Sandbox Sector 4',
      city: 'New Delhi',
      latitude: 28.6315,
      longitude: 77.2167,
      phone: '+910000000004',
      hygieneGrade: 'Demo / Uninspected',
      licenseNumber: 'DEMO-FSSAI-00000000000004-SAMPLE',
      licenseDocumentUrl: DEMO_LICENSE_DOC_URL,
      kycStatus: KycStatus.PENDING,
      isStoreLive: true,
      isDemo: true,
      rating: 0.0,
      reviewCount: 0,
    },
  ];

  for (const rest of sampleRestaurants) {
    const existing = await prisma.restaurant.findUnique({ where: { id: rest.id } });
    if (existing) {
      assertPositiveDemoIdentity(existing, 'Restaurant');
      await prisma.restaurant.update({
        where: { id: rest.id },
        data: {
          name: rest.name,
          branchName: rest.branchName,
          address: rest.address,
          city: rest.city,
          latitude: rest.latitude,
          longitude: rest.longitude,
          phone: rest.phone,
          hygieneGrade: rest.hygieneGrade,
          licenseNumber: rest.licenseNumber,
          licenseDocumentUrl: rest.licenseDocumentUrl,
          // Retain permanent SuperAdmin approval status if already granted
          kycStatus: existing.kycStatus === KycStatus.APPROVED ? KycStatus.APPROVED : rest.kycStatus,
          isStoreLive: rest.isStoreLive,
          isDemo: true,
          rating: rest.rating,
          reviewCount: rest.reviewCount,
        },
      });
    } else {
      await prisma.restaurant.create({ data: rest });
    }
  }
  console.log(`✅ Verified & safely seeded ${sampleRestaurants.length} fictional sample restaurants.`);

  // ---------------------------------------------------------------------------
  // 4. Sample Food Deals (Listings with Valid Test Windows & System Markers)
  // All IDs explicitly prefixed with demo-deal- and tagged with DEMO_SYSTEM_MARKER
  // On re-run: Preserves availableQuantity, reservedQuantity, and totalQuantity
  // ---------------------------------------------------------------------------
  const sampleListings = [
    {
      id: 'demo-deal-bakery-surprise',
      restaurantId: 'demo-rest-daily-dough',
      categoryId: 'demo-cat-bakery',
      title: '[Demo] Evening Bakery & Sourdough Assortment',
      description:
        '[DEMO RECORD - NOT A REAL OFFER] Assorted artisanal bread and breakfast pastries for development and testing purposes only.',
      imageUrl:
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
      originalPriceInr: 550.0,
      surplusPriceInr: 149.0,
      totalQuantity: 15,
      availableQuantity: 3,
      reservedQuantity: 12,
      pickupDate: SEED_CONFIG.pickupDate,
      pickupStartTime: SEED_CONFIG.pickupStartTime,
      pickupEndTime: SEED_CONFIG.pickupEndTime,
      dietaryTags: ['Demo Record', 'Vegetarian (Sample)', 'Testing Only', DEMO_SYSTEM_MARKER],
      allergenNotice: 'Demo notice: Synthetic sample data. Not for actual consumption.',
      co2eSavingsKg: 1.8,
      status: ListingStatus.ACTIVE,
      isDemo: true,
    },
    {
      id: 'demo-deal-buffet-box',
      restaurantId: 'demo-rest-metro-banquet',
      categoryId: 'demo-cat-meal',
      title: '[Demo] Executive Buffet Meal Box',
      description:
        '[DEMO RECORD - NOT A REAL OFFER] Sample multi-course hot meal box curated for development order testing.',
      imageUrl:
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      originalPriceInr: 700.0,
      surplusPriceInr: 199.0,
      totalQuantity: 25,
      availableQuantity: 4,
      reservedQuantity: 21,
      pickupDate: SEED_CONFIG.pickupDate,
      pickupStartTime: SEED_CONFIG.pickupStartTime,
      pickupEndTime: SEED_CONFIG.pickupEndTime,
      dietaryTags: ['Demo Record', 'Hot Meal Guarantee (Test)', 'Testing Only', DEMO_SYSTEM_MARKER],
      allergenNotice: 'Demo notice: Synthetic sample data. Not for actual consumption.',
      co2eSavingsKg: 2.4,
      status: ListingStatus.ACTIVE,
      isDemo: true,
    },
    {
      id: 'demo-deal-sushi-sampler',
      restaurantId: 'demo-rest-sakura-bowl',
      categoryId: 'demo-cat-meal',
      title: '[Demo] Sushi & Maki Roll Sampler',
      description:
        '[DEMO RECORD - NOT A REAL OFFER] Mock Japanese maki and nigiri assortment for development verification.',
      imageUrl:
        'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
      originalPriceInr: 850.0,
      surplusPriceInr: 249.0,
      totalQuantity: 10,
      availableQuantity: 2,
      reservedQuantity: 8,
      pickupDate: SEED_CONFIG.pickupDate,
      pickupStartTime: SEED_CONFIG.pickupStartTime,
      pickupEndTime: SEED_CONFIG.pickupEndTime,
      dietaryTags: ['Demo Record', 'Pescatarian (Sample)', 'Testing Only', DEMO_SYSTEM_MARKER],
      allergenNotice: 'Demo notice: Synthetic sample data. Not for actual consumption.',
      co2eSavingsKg: 2.1,
      status: ListingStatus.ACTIVE,
      isDemo: true,
    },
    {
      id: 'demo-deal-biryani-feast',
      restaurantId: 'demo-rest-spice-symphony',
      categoryId: 'demo-cat-meal',
      title: '[Demo] Spiced Dum Biryani Combo',
      description:
        '[DEMO RECORD - NOT A REAL OFFER] Fictional handi biryani meal pack for test reservations and checkout.',
      imageUrl:
        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
      originalPriceInr: 650.0,
      surplusPriceInr: 189.0,
      totalQuantity: 20,
      availableQuantity: 6,
      reservedQuantity: 14,
      pickupDate: SEED_CONFIG.pickupDate,
      pickupStartTime: SEED_CONFIG.pickupStartTime,
      pickupEndTime: SEED_CONFIG.pickupEndTime,
      dietaryTags: ['Demo Record', 'Chef Special (Test)', 'Testing Only', DEMO_SYSTEM_MARKER],
      allergenNotice: 'Demo notice: Synthetic sample data. Not for actual consumption.',
      co2eSavingsKg: 1.9,
      status: ListingStatus.ACTIVE,
      isDemo: true,
    },
    {
      id: 'demo-deal-concurrency-test',
      restaurantId: 'demo-rest-daily-dough',
      categoryId: 'demo-cat-bakery',
      title: '[Demo] Concurrency Test Special (Final Portion)',
      description:
        '[DEMO RECORD - NOT A REAL OFFER] Single-portion test listing for race condition and stock locking verification.',
      imageUrl:
        'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
      originalPriceInr: 300.0,
      surplusPriceInr: 99.0,
      totalQuantity: 1,
      availableQuantity: 1,
      reservedQuantity: 0,
      pickupDate: SEED_CONFIG.pickupDate,
      pickupStartTime: SEED_CONFIG.pickupStartTime,
      pickupEndTime: SEED_CONFIG.pickupEndTime,
      dietaryTags: ['Demo Record', 'Concurrency Test', DEMO_SYSTEM_MARKER],
      allergenNotice: 'Testing data only.',
      co2eSavingsKg: 1.0,
      status: ListingStatus.ACTIVE,
      isDemo: true,
    },
    {
      id: 'demo-deal-neapolitan-pizza',
      restaurantId: 'demo-rest-metro-banquet',
      categoryId: 'demo-cat-meal',
      title: '[Demo] 12-inch Neapolitan Woodfire Pizza & Dough Balls',
      description:
        '[DEMO RECORD - NOT A REAL OFFER] Authentic stone-hearth slow-fermented pizza with San Marzano sauce and fior di latte.',
      imageUrl:
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      originalPriceInr: 650.0,
      surplusPriceInr: 189.0,
      totalQuantity: 16,
      availableQuantity: 4,
      reservedQuantity: 12,
      pickupDate: SEED_CONFIG.pickupDate,
      pickupStartTime: SEED_CONFIG.pickupStartTime,
      pickupEndTime: SEED_CONFIG.pickupEndTime,
      dietaryTags: ['Demo Record', 'Vegetarian Friendly', 'Stone Hearth Baked', DEMO_SYSTEM_MARKER],
      allergenNotice: 'Contains wheat gluten and milk.',
      co2eSavingsKg: 2.2,
      status: ListingStatus.ACTIVE,
      isDemo: true,
    },
    {
      id: 'demo-deal-artisan-burger',
      restaurantId: 'demo-rest-metro-banquet',
      categoryId: 'demo-cat-meal',
      title: '[Demo] Gourmet Double Brioche Burger & Wedges',
      description:
        '[DEMO RECORD - NOT A REAL OFFER] Artisan grilled brioche burger with crisp potato wedges and signature house sauce.',
      imageUrl:
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      originalPriceInr: 499.0,
      surplusPriceInr: 169.0,
      totalQuantity: 12,
      availableQuantity: 5,
      reservedQuantity: 7,
      pickupDate: SEED_CONFIG.pickupDate,
      pickupStartTime: SEED_CONFIG.pickupStartTime,
      pickupEndTime: SEED_CONFIG.pickupEndTime,
      dietaryTags: ['Demo Record', 'Chef Special (Test)', DEMO_SYSTEM_MARKER],
      allergenNotice: 'Contains sesame seeds and gluten.',
      co2eSavingsKg: 1.7,
      status: ListingStatus.ACTIVE,
      isDemo: true,
    },
    {
      id: 'demo-deal-pastry-delight',
      restaurantId: 'demo-rest-daily-dough',
      categoryId: 'demo-cat-bakery',
      title: '[Demo] Belgian Chocolate Ganache Cake & French Eclairs',
      description:
        '[DEMO RECORD - NOT A REAL OFFER] Handcrafted chocolate ganache layer cake slices and classic choux pastry eclairs.',
      imageUrl:
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
      originalPriceInr: 580.0,
      surplusPriceInr: 179.0,
      totalQuantity: 14,
      availableQuantity: 4,
      reservedQuantity: 10,
      pickupDate: SEED_CONFIG.pickupDate,
      pickupStartTime: SEED_CONFIG.pickupStartTime,
      pickupEndTime: SEED_CONFIG.pickupEndTime,
      dietaryTags: ['Demo Record', 'Vegetarian (Sample)', 'Handmade Daily', DEMO_SYSTEM_MARKER],
      allergenNotice: 'Contains dairy, wheat, and eggs.',
      co2eSavingsKg: 1.6,
      status: ListingStatus.ACTIVE,
      isDemo: true,
    },
    {
      id: 'demo-deal-sweet-treats',
      restaurantId: 'demo-rest-daily-dough',
      categoryId: 'demo-cat-bakery',
      title: '[Demo] Artisan Glazed Doughnuts & Sweet Dessert Box',
      description:
        '[DEMO RECORD - NOT A REAL OFFER] Assorted artisanal glazed doughnuts, cinnamon swirls, and sweet dessert treats.',
      imageUrl:
        'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
      originalPriceInr: 420.0,
      surplusPriceInr: 139.0,
      totalQuantity: 15,
      availableQuantity: 6,
      reservedQuantity: 9,
      pickupDate: SEED_CONFIG.pickupDate,
      pickupStartTime: SEED_CONFIG.pickupStartTime,
      pickupEndTime: SEED_CONFIG.pickupEndTime,
      dietaryTags: ['Demo Record', 'Vegetarian Friendly', DEMO_SYSTEM_MARKER],
      allergenNotice: 'Contains dairy and wheat.',
      co2eSavingsKg: 1.4,
      status: ListingStatus.ACTIVE,
      isDemo: true,
    },
    {
      id: 'demo-deal-curry-special',
      restaurantId: 'demo-rest-spice-symphony',
      categoryId: 'demo-cat-meal',
      title: '[Demo] Chef’s Midnight Surplus Rice & Curry Banquet',
      description:
        '[DEMO RECORD - NOT A REAL OFFER] Generous evening assortment of today’s finest kitchen surplus dishes and specialties.',
      imageUrl:
        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      originalPriceInr: 750.0,
      surplusPriceInr: 219.0,
      totalQuantity: 10,
      availableQuantity: 3,
      reservedQuantity: 7,
      pickupDate: SEED_CONFIG.pickupDate,
      pickupStartTime: SEED_CONFIG.pickupStartTime,
      pickupEndTime: SEED_CONFIG.pickupEndTime,
      dietaryTags: ['Demo Record', 'Chef Selection', 'Zero Waste', DEMO_SYSTEM_MARKER],
      allergenNotice: 'Contains dairy and spices. Inquire at counter.',
      co2eSavingsKg: 2.5,
      status: ListingStatus.ACTIVE,
      isDemo: true,
    },
    {
      id: 'demo-deal-pantry-staples',
      restaurantId: 'demo-rest-daily-dough',
      categoryId: 'demo-cat-pantry',
      title: '[Demo] Organic Granola, Oats & Superfood Pantry Box',
      description:
        '[DEMO RECORD - NOT A REAL OFFER] Wholesome rolled oats, honey jars, and packaged pantry provisions.',
      imageUrl:
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
      originalPriceInr: 450.0,
      surplusPriceInr: 129.0,
      totalQuantity: 10,
      availableQuantity: 4,
      reservedQuantity: 6,
      pickupDate: SEED_CONFIG.pickupDate,
      pickupStartTime: SEED_CONFIG.pickupStartTime,
      pickupEndTime: SEED_CONFIG.pickupEndTime,
      dietaryTags: ['Demo Record', '100% Vegan', 'Gluten Free', DEMO_SYSTEM_MARKER],
      allergenNotice: 'Contains tree nuts.',
      co2eSavingsKg: 1.5,
      status: ListingStatus.ACTIVE,
      isDemo: true,
    },
  ];

  for (const deal of sampleListings) {
    const existing = await prisma.listing.findUnique({ where: { id: deal.id } });
    if (existing) {
      assertPositiveDemoIdentity(existing, 'Listing');
      console.log(
        `ℹ️ Safe re-run: Preserving live inventory for ${deal.id} (Available: ${existing.availableQuantity}, Reserved: ${existing.reservedQuantity})`
      );
      // Safeguard: Preserve existing quantities & status from checkout testing
      await prisma.listing.update({
        where: { id: deal.id },
        data: {
          title: deal.title,
          description: deal.description,
          imageUrl: deal.imageUrl,
          originalPriceInr: deal.originalPriceInr,
          surplusPriceInr: deal.surplusPriceInr,
          pickupDate: deal.pickupDate,
          pickupStartTime: deal.pickupStartTime,
          pickupEndTime: deal.pickupEndTime,
          dietaryTags: deal.dietaryTags,
          allergenNotice: deal.allergenNotice,
          co2eSavingsKg: deal.co2eSavingsKg,
          isDemo: true,
          // Quantities (totalQuantity, availableQuantity, reservedQuantity, status) are NOT overwritten!
        },
      });
    } else {
      await prisma.listing.create({ data: deal });
    }
  }

  console.log(`✅ Verified & safely seeded ${sampleListings.length} fictional sample food deals.`);
  console.log('🎉 Development seed script finished without creating, updating, or deleting any orders.');
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
