import prisma, { isDatabaseConfigured } from '../config/db';
import { ENV } from '../config/env';
import { getFoodFallbackImageUrl } from '../utils/foodImages';

export interface ListingInventoryRecord {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress?: string;
  title: string;
  description: string;
  imageUrl: string;
  categoryName: string;
  originalPriceInr: number;
  surplusPriceInr: number; // Customer Deal Price in INR
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  deliveryFeeInr: number;
  co2eSavingsKg: number;
  status: 'ACTIVE' | 'PAUSED' | 'SOLD_OUT' | 'EXPIRED';
  pickupWindowText: string;
  kycStatus?: string;
  hygieneGrade?: string;
  isDemo?: boolean;
}

// Initial active listings pre-seeded for development and testing (all demo-prefixed)
const INITIAL_LISTINGS: ListingInventoryRecord[] = [
  {
    id: 'demo-deal-bakery-surprise',
    restaurantId: 'demo-rest-daily-dough',
    restaurantName: '[Demo] The Daily Dough Bakery (Unverified Sample Partner)',
    restaurantAddress: '100 Demo Street, Sandbox Sector 1',
    title: '[Demo] Evening Bakery & Sourdough Surprise Pack',
    description:
      '[DEMO RECORD - NOT A REAL OFFER] Assorted artisanal bread and breakfast pastries for development and testing purposes only.',
    imageUrl:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Bakery',
    originalPriceInr: 550,
    surplusPriceInr: 149,
    totalQuantity: 15,
    availableQuantity: 3,
    reservedQuantity: 12,
    deliveryFeeInr: 0,
    co2eSavingsKg: 1.8,
    status: 'ACTIVE',
    pickupWindowText: '10:00 – 23:30',
    kycStatus: 'PENDING',
    hygieneGrade: 'Demo / Uninspected',
    isDemo: true,
  },
  {
    id: 'demo-deal-buffet-box',
    restaurantId: 'demo-rest-metro-banquet',
    restaurantName: '[Demo] Metro Banquet & Catering (Unverified Sample Partner)',
    restaurantAddress: '200 Demo Avenue, Sandbox Sector 2',
    title: '[Demo] Executive Buffet Meal Box',
    description:
      '[DEMO RECORD - NOT A REAL OFFER] Sample multi-course hot meal box curated for development order testing.',
    imageUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Meal',
    originalPriceInr: 700,
    surplusPriceInr: 199,
    totalQuantity: 25,
    availableQuantity: 4,
    reservedQuantity: 21,
    deliveryFeeInr: 0,
    co2eSavingsKg: 2.4,
    status: 'ACTIVE',
    pickupWindowText: '10:00 – 23:30',
    kycStatus: 'PENDING',
    hygieneGrade: 'Demo / Uninspected',
    isDemo: true,
  },
  {
    id: 'demo-deal-sushi-sampler',
    restaurantId: 'demo-rest-sakura-bowl',
    restaurantName: '[Demo] Sakura Bowl & Rolls (Unverified Sample Partner)',
    restaurantAddress: '300 Demo Cross, Sandbox Sector 3',
    title: '[Demo] Sushi & Maki Roll Sampler',
    description:
      '[DEMO RECORD - NOT A REAL OFFER] Mock Japanese maki and nigiri assortment for development verification.',
    imageUrl:
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Meal',
    originalPriceInr: 850,
    surplusPriceInr: 249,
    totalQuantity: 10,
    availableQuantity: 2,
    reservedQuantity: 8,
    deliveryFeeInr: 0,
    co2eSavingsKg: 2.1,
    status: 'ACTIVE',
    pickupWindowText: '10:00 – 23:30',
    kycStatus: 'PENDING',
    hygieneGrade: 'Demo / Uninspected',
    isDemo: true,
  },
  {
    id: 'demo-deal-biryani-feast',
    restaurantId: 'demo-rest-spice-symphony',
    restaurantName: '[Demo] Spice Symphony Kitchen (Unverified Sample Partner)',
    restaurantAddress: '400 Demo Circle, Sandbox Sector 4',
    title: '[Demo] Spiced Dum Biryani Combo',
    description:
      '[DEMO RECORD - NOT A REAL OFFER] Fictional handi biryani meal pack for test reservations and checkout.',
    imageUrl:
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Meal',
    originalPriceInr: 650,
    surplusPriceInr: 189,
    totalQuantity: 20,
    availableQuantity: 6,
    reservedQuantity: 14,
    deliveryFeeInr: 0,
    co2eSavingsKg: 1.9,
    status: 'ACTIVE',
    pickupWindowText: '10:00 – 23:30',
    kycStatus: 'PENDING',
    hygieneGrade: 'Demo / Uninspected',
    isDemo: true,
  },
  {
    id: 'demo-deal-pantry-staples',
    restaurantId: 'demo-rest-daily-dough',
    restaurantName: '[Demo] The Daily Dough Bakery (Unverified Sample Partner)',
    restaurantAddress: '100 Demo Street, Sandbox Sector 1',
    title: '[Demo] Organic Granola & Pantry Provisions',
    description:
      '[DEMO RECORD - NOT A REAL OFFER] Wholesome rolled oats, honey jars, and packaged pantry staples for testing.',
    imageUrl:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Pantry',
    originalPriceInr: 450,
    surplusPriceInr: 129,
    totalQuantity: 10,
    availableQuantity: 4,
    reservedQuantity: 6,
    deliveryFeeInr: 0,
    co2eSavingsKg: 1.5,
    status: 'ACTIVE',
    pickupWindowText: '10:00 – 23:30',
    kycStatus: 'PENDING',
    hygieneGrade: 'Demo / Uninspected',
    isDemo: true,
  },
  {
    id: 'demo-deal-concurrency-test',
    restaurantId: 'demo-rest-daily-dough',
    restaurantName: '[Demo] The Daily Dough Bakery (Unverified Sample Partner)',
    restaurantAddress: '100 Demo Street, Sandbox Sector 1',
    title: '[Demo] Concurrency Test Special (Final Portion)',
    description:
      '[DEMO RECORD - NOT A REAL OFFER] Single-portion test listing for race condition and stock locking verification.',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Bakery',
    originalPriceInr: 300,
    surplusPriceInr: 99,
    totalQuantity: 1,
    availableQuantity: 1,
    reservedQuantity: 0,
    deliveryFeeInr: 0,
    co2eSavingsKg: 1.0,
    status: 'ACTIVE',
    pickupWindowText: '10:00 – 23:30',
    kycStatus: 'PENDING',
    hygieneGrade: 'Demo / Uninspected',
    isDemo: true,
  },
  {
    id: 'demo-deal-neapolitan-pizza',
    restaurantId: 'demo-rest-metro-banquet',
    restaurantName: '[Demo] Metro Banquet & Catering (Unverified Sample Partner)',
    restaurantAddress: '200 Demo Avenue, Sandbox Sector 2',
    title: '[Demo] 12-inch Neapolitan Woodfire Pizza & Dough Balls',
    description:
      '[DEMO RECORD - NOT A REAL OFFER] Authentic stone-hearth slow-fermented pizza with San Marzano sauce and fior di latte.',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Meal',
    originalPriceInr: 650,
    surplusPriceInr: 189,
    totalQuantity: 16,
    availableQuantity: 4,
    reservedQuantity: 12,
    deliveryFeeInr: 0,
    co2eSavingsKg: 2.2,
    status: 'ACTIVE',
    pickupWindowText: '10:00 – 23:30',
    kycStatus: 'PENDING',
    hygieneGrade: 'Demo / Uninspected',
    isDemo: true,
  },
  {
    id: 'demo-deal-artisan-burger',
    restaurantId: 'demo-rest-metro-banquet',
    restaurantName: '[Demo] Metro Banquet & Catering (Unverified Sample Partner)',
    restaurantAddress: '200 Demo Avenue, Sandbox Sector 2',
    title: '[Demo] Gourmet Double Brioche Burger & Wedges',
    description:
      '[DEMO RECORD - NOT A REAL OFFER] Artisan grilled brioche burger with crisp potato wedges and signature house sauce.',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Meal',
    originalPriceInr: 499,
    surplusPriceInr: 169,
    totalQuantity: 12,
    availableQuantity: 5,
    reservedQuantity: 7,
    deliveryFeeInr: 0,
    co2eSavingsKg: 1.7,
    status: 'ACTIVE',
    pickupWindowText: '10:00 – 23:30',
    kycStatus: 'PENDING',
    hygieneGrade: 'Demo / Uninspected',
    isDemo: true,
  },
  {
    id: 'demo-deal-pastry-delight',
    restaurantId: 'demo-rest-daily-dough',
    restaurantName: '[Demo] The Daily Dough Bakery (Unverified Sample Partner)',
    restaurantAddress: '100 Demo Street, Sandbox Sector 1',
    title: '[Demo] Belgian Chocolate Ganache Cake & French Eclairs',
    description:
      '[DEMO RECORD - NOT A REAL OFFER] Handcrafted chocolate ganache layer cake slices and classic choux pastry eclairs.',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Bakery',
    originalPriceInr: 580,
    surplusPriceInr: 179,
    totalQuantity: 14,
    availableQuantity: 4,
    reservedQuantity: 10,
    deliveryFeeInr: 0,
    co2eSavingsKg: 1.6,
    status: 'ACTIVE',
    pickupWindowText: '10:00 – 23:30',
    kycStatus: 'PENDING',
    hygieneGrade: 'Demo / Uninspected',
    isDemo: true,
  },
  {
    id: 'demo-deal-sweet-treats',
    restaurantId: 'demo-rest-daily-dough',
    restaurantName: '[Demo] The Daily Dough Bakery (Unverified Sample Partner)',
    restaurantAddress: '100 Demo Street, Sandbox Sector 1',
    title: '[Demo] Artisan Glazed Doughnuts & Sweet Dessert Box',
    description:
      '[DEMO RECORD - NOT A REAL OFFER] Assorted artisanal glazed doughnuts, cinnamon swirls, and sweet dessert treats.',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Bakery',
    originalPriceInr: 420,
    surplusPriceInr: 139,
    totalQuantity: 15,
    availableQuantity: 6,
    reservedQuantity: 9,
    deliveryFeeInr: 0,
    co2eSavingsKg: 1.4,
    status: 'ACTIVE',
    pickupWindowText: '10:00 – 23:30',
    kycStatus: 'PENDING',
    hygieneGrade: 'Demo / Uninspected',
    isDemo: true,
  },
  {
    id: 'demo-deal-mystery-crate',
    restaurantId: 'demo-rest-spice-symphony',
    restaurantName: '[Demo] Spice Symphony Kitchen (Unverified Sample Partner)',
    restaurantAddress: '400 Demo Circle, Sandbox Sector 4',
    title: '[Demo] Chef’s Midnight Surprise Mystery Rescue Crate',
    description:
      '[DEMO RECORD - NOT A REAL OFFER] Generous mystery assortment of today’s finest kitchen surplus dishes and specialties.',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Meal',
    originalPriceInr: 750,
    surplusPriceInr: 219,
    totalQuantity: 10,
    availableQuantity: 3,
    reservedQuantity: 7,
    deliveryFeeInr: 0,
    co2eSavingsKg: 2.5,
    status: 'ACTIVE',
    pickupWindowText: '10:00 – 23:30',
    kycStatus: 'PENDING',
    hygieneGrade: 'Demo / Uninspected',
    isDemo: true,
  },
];

export interface PriceBreakdown {
  unitPricePaise: number;
  subtotalPaise: number;
  deliveryFeePaise: number;
  totalAmountPaise: number;
  unitPriceInr: number;
  subtotalInr: number;
  deliveryFeeInr: number;
  totalPriceInr: number;
}

export class InventoryService {
  // In-memory store for fallback / testing when PostgreSQL is offline
  private inMemoryListings: Map<string, ListingInventoryRecord> = new Map();
  // Per-listing concurrency lock (mutex) for in-memory operations
  private locks: Map<string, Promise<void>> = new Map();

  constructor() {
    this.resetInMemoryListings();
  }

  public resetInMemoryListings() {
    this.inMemoryListings.clear();
    for (const item of INITIAL_LISTINGS) {
      this.inMemoryListings.set(item.id, { ...item });
    }
  }

  public async resetTestInventory(): Promise<void> {
    this.resetInMemoryListings();
    if (isDatabaseConfigured()) {
      try {
        await prisma.listing.updateMany({
          where: { id: 'demo-deal-bakery-surprise' },
          data: { availableQuantity: 3, reservedQuantity: 12, surplusPriceInr: 149, status: 'ACTIVE' },
        });
        await prisma.listing.updateMany({
          where: { id: 'demo-deal-buffet-box' },
          data: { availableQuantity: 4, reservedQuantity: 21, status: 'ACTIVE' },
        });
        await prisma.listing.updateMany({
          where: { id: 'demo-deal-sushi-sampler' },
          data: { availableQuantity: 2, reservedQuantity: 8, status: 'ACTIVE' },
        });
        await prisma.listing.updateMany({
          where: { id: 'demo-deal-biryani-feast' },
          data: { availableQuantity: 6, reservedQuantity: 14, status: 'ACTIVE' },
        });
        await prisma.listing.updateMany({
          where: { id: 'demo-deal-concurrency-test' },
          data: { availableQuantity: 1, reservedQuantity: 0, status: 'ACTIVE' },
        });
      } catch {
        // DB offline, fallback
      }
    }
  }

  /**
   * Acquire a lock on a listing ID to ensure serialized execution during atomic in-memory updates
   */
  private async acquireLock(listingId: string): Promise<() => void> {
    while (this.locks.has(listingId)) {
      await this.locks.get(listingId);
    }
    let resolveLock!: () => void;
    const lockPromise = new Promise<void>((res) => {
      resolveLock = res;
    });
    this.locks.set(listingId, lockPromise);

    return () => {
      this.locks.delete(listingId);
      resolveLock();
    };
  }

  /**
   * Retrieve listing by ID (Prisma first, falling back to in-memory)
   */
  public async getListing(listingId: string): Promise<ListingInventoryRecord | null> {
    const isProduction = (process.env.NODE_ENV || ENV.NODE_ENV) === 'production';

    // Resolve legacy ID aliases to new demo- prefixed IDs
    const resolvedId =
      listingId === 'deal-1'
        ? 'demo-deal-bakery-surprise'
        : listingId === 'deal-2'
        ? 'demo-deal-buffet-box'
        : listingId === 'deal-3'
        ? 'demo-deal-sushi-sampler'
        : listingId === 'deal-4'
        ? 'demo-deal-biryani-feast'
        : listingId === 'deal-test-concurrency'
        ? 'demo-deal-concurrency-test'
        : listingId;

    if (isDatabaseConfigured()) {
      try {
        const dbListing = await prisma.listing.findUnique({
          where: { id: resolvedId },
          include: { restaurant: true, category: true },
        });

        if (dbListing) {
          const isDemo =
            Boolean(dbListing.isDemo) ||
            Boolean(dbListing.restaurant.isDemo) ||
            dbListing.id.startsWith('demo-') ||
            dbListing.title.includes('[Demo]') ||
            dbListing.restaurant.name.includes('[Demo]') ||
            (Array.isArray(dbListing.dietaryTags) &&
              dbListing.dietaryTags.includes('SYSTEM_DEMO_RECORD_V1'));

          // In production: Prohibit accessing demo listings or any listing from a non-approved restaurant
          if (isProduction && (isDemo || dbListing.restaurant.isDemo || dbListing.restaurant.kycStatus !== 'APPROVED')) {
            return null;
          }

          return {
            id: dbListing.id,
            restaurantId: dbListing.restaurantId,
            restaurantName: dbListing.restaurant.name,
            restaurantAddress: dbListing.restaurant.address,
            title: dbListing.title,
            description: dbListing.description,
            imageUrl: getFoodFallbackImageUrl({
              id: dbListing.id,
              title: dbListing.title,
              categoryName: dbListing.category.name,
              categoryId: dbListing.categoryId,
              imageUrl: dbListing.imageUrl,
            }),
            categoryName: dbListing.category.name,
            originalPriceInr: Number(dbListing.originalPriceInr),
            surplusPriceInr: Number(dbListing.surplusPriceInr),
            totalQuantity: dbListing.totalQuantity,
            availableQuantity: dbListing.availableQuantity,
            reservedQuantity: dbListing.reservedQuantity,
            deliveryFeeInr: 0,
            co2eSavingsKg: Number(dbListing.co2eSavingsKg),
            status: dbListing.status as any,
            pickupWindowText: `${dbListing.pickupStartTime} - ${dbListing.pickupEndTime}`,
            kycStatus: dbListing.restaurant.kycStatus,
            hygieneGrade: isDemo ? 'Demo / Uninspected' : dbListing.restaurant.hygieneGrade,
            isDemo,
          };
        }
      } catch {
        // Prisma DB unreachable, continue to fallback
      }
    }

    // In production, fallback in-memory demo records must not be returned
    if (isProduction) {
      return null;
    }

    return this.inMemoryListings.get(resolvedId) || this.inMemoryListings.get(listingId) || null;
  }

  /**
   * Get all active listings for customers.
   * Safety guardrails for development vs production modes:
   * - Production mode: Zero demo listings or pending-KYC restaurants are ever exposed.
   *   Only real, verified commercial partners (kycStatus === 'APPROVED') are returned.
   * - Development mode: Explicit demo listings are permitted for local development & checkout tests,
   *   clearly marked as unverified (hygieneGrade: 'Demo / Uninspected', kycStatus: 'PENDING', isDemo: true).
   */
  public async getAllActiveListings(): Promise<ListingInventoryRecord[]> {
    const isProduction = (process.env.NODE_ENV || ENV.NODE_ENV) === 'production';

    if (isDatabaseConfigured()) {
      try {
        const dbListings = await prisma.listing.findMany({
          where: isProduction ? { status: 'ACTIVE', isDemo: false } : { status: 'ACTIVE' },
          include: { restaurant: true, category: true },
        });

        // Filter: Only approved commercial restaurants in production; demo listings permitted in dev
        const eligibleListings = dbListings.filter((l) => {
          const isDemo =
            Boolean(l.isDemo) ||
            Boolean(l.restaurant.isDemo) ||
            l.id.startsWith('demo-') ||
            l.title.includes('[Demo]') ||
            l.restaurant.name.includes('[Demo]') ||
            (Array.isArray(l.dietaryTags) && l.dietaryTags.includes('SYSTEM_DEMO_RECORD_V1'));

          if (isProduction) {
            // Strictly exclude any demo listing or any restaurant without APPROVED KYC
            return !isDemo && l.restaurant.kycStatus === 'APPROVED' && !l.restaurant.isDemo;
          }

          // In development mode: Allow approved restaurants OR explicit demo listings
          return l.restaurant.kycStatus === 'APPROVED' || isDemo;
        });

        if (eligibleListings.length > 0) {
          return eligibleListings.map((l) => {
            const isDemo =
              Boolean(l.isDemo) ||
              Boolean(l.restaurant.isDemo) ||
              l.id.startsWith('demo-') ||
              l.title.includes('[Demo]') ||
              l.restaurant.name.includes('[Demo]') ||
              (Array.isArray(l.dietaryTags) && l.dietaryTags.includes('SYSTEM_DEMO_RECORD_V1'));

            return {
              id: l.id,
              restaurantId: l.restaurantId,
              restaurantName: l.restaurant.name,
              restaurantAddress: l.restaurant.address,
              title: l.title,
              description: l.description,
              imageUrl: getFoodFallbackImageUrl({
                id: l.id,
                title: l.title,
                categoryName: l.category.name,
                categoryId: l.categoryId,
                imageUrl: l.imageUrl,
              }),
              categoryName: l.category.name,
              originalPriceInr: Number(l.originalPriceInr),
              surplusPriceInr: Number(l.surplusPriceInr),
              totalQuantity: l.totalQuantity,
              availableQuantity: l.availableQuantity,
              reservedQuantity: l.reservedQuantity,
              deliveryFeeInr: 0,
              co2eSavingsKg: Number(l.co2eSavingsKg),
              status: l.status as any,
              pickupWindowText: `${l.pickupStartTime} - ${l.pickupEndTime}`,
              kycStatus: l.restaurant.kycStatus,
              hygieneGrade: isDemo ? 'Demo / Uninspected' : l.restaurant.hygieneGrade,
              isDemo,
            };
          });
        }
      } catch {
        // DB offline, fall back
      }
    }

    if (isProduction) {
      // In production mode, fallback in-memory demo records are never returned to customers
      return [];
    }

    return Array.from(this.inMemoryListings.values());
  }

  /**
   * Calculate exact prices entirely on the server using integer paise (1 INR = 100 paise).
   * Never trust client calculations or floating point arithmetic.
   */
  public calculatePrices(
    listing: ListingInventoryRecord,
    quantity: number,
    _fulfillmentType?: string
  ): PriceBreakdown {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`Quantity must be a positive integer, received: ${quantity}`);
    }

    // Unit price in integer paise
    const unitPricePaise = Math.round(listing.surplusPriceInr * 100);
    const subtotalPaise = unitPricePaise * quantity;

    // Counter Pickup only: Zero delivery fees
    const deliveryFeePaise = 0;
    const totalAmountPaise = subtotalPaise;

    return {
      unitPricePaise,
      subtotalPaise,
      deliveryFeePaise,
      totalAmountPaise,
      unitPriceInr: unitPricePaise / 100,
      subtotalInr: subtotalPaise / 100,
      deliveryFeeInr: 0,
      totalPriceInr: totalAmountPaise / 100,
    };
  }

  /**
   * Concurrency-safe atomic inventory reservation.
   * Decrements availableQuantity and increments reservedQuantity.
   * Guarantees two customers cannot simultaneously purchase the final stock.
   */
  public async reserveInventory(
    listingId: string,
    quantity: number
  ): Promise<ListingInventoryRecord> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`Invalid order quantity: ${quantity}. Must be greater than zero.`);
    }

    const resolvedId =
      listingId === 'deal-1'
        ? 'demo-deal-bakery-surprise'
        : listingId === 'deal-2'
        ? 'demo-deal-buffet-box'
        : listingId === 'deal-3'
        ? 'demo-deal-sushi-sampler'
        : listingId === 'deal-4'
        ? 'demo-deal-biryani-feast'
        : listingId === 'deal-test-concurrency'
        ? 'demo-deal-concurrency-test'
        : listingId;

    // Try Prisma database transaction if connected
    if (isDatabaseConfigured()) {
      try {
        const updated = await prisma.$transaction(async (tx) => {
          // Atomic conditional update
          const count = await tx.$executeRawUnsafe(
            `UPDATE listings 
             SET available_quantity = available_quantity - $1, 
                 reserved_quantity = reserved_quantity + $1,
                 status = CASE WHEN available_quantity - $1 = 0 THEN 'SOLD_OUT'::"ListingStatus" ELSE status END
             WHERE id = $2 AND status = 'ACTIVE' AND available_quantity >= $1`,
            quantity,
            resolvedId
          );

          if (count === 0) {
            const existing = await tx.listing.findUnique({ where: { id: resolvedId } });
            if (!existing) {
              // Fall through to in-memory fallback if listing is not seeded in database yet
              throw new Error(`DB_FALLBACK: Listing ${resolvedId} not found in database.`);
            }
            if (existing.status !== 'ACTIVE') {
              throw new Error(`Listing is no longer available (Status: ${existing.status}).`);
            }
            if (existing.availableQuantity < quantity) {
              throw new Error(
                `Insufficient inventory: Only ${existing.availableQuantity} portions available, requested ${quantity}.`
              );
            }
            throw new Error('Could not reserve inventory due to concurrency collision.');
          }

          const freshListing = await tx.listing.findUniqueOrThrow({
            where: { id: resolvedId },
            include: { restaurant: true, category: true },
          });

          return freshListing;
        });

        const isDemo =
          updated.id.startsWith('demo-') ||
          updated.title.includes('[Demo]') ||
          updated.restaurant.name.includes('[Demo]');

        return {
          id: updated.id,
          restaurantId: updated.restaurantId,
          restaurantName: updated.restaurant.name,
          restaurantAddress: updated.restaurant.address,
          title: updated.title,
          description: updated.description,
          imageUrl: updated.imageUrl,
          categoryName: updated.category.name,
          originalPriceInr: Number(updated.originalPriceInr),
          surplusPriceInr: Number(updated.surplusPriceInr),
          totalQuantity: updated.totalQuantity,
          availableQuantity: updated.availableQuantity,
          reservedQuantity: updated.reservedQuantity,
          deliveryFeeInr: 0,
          co2eSavingsKg: Number(updated.co2eSavingsKg),
          status: updated.status as any,
          pickupWindowText: `${updated.pickupStartTime} - ${updated.pickupEndTime}`,
          kycStatus: updated.restaurant.kycStatus,
          hygieneGrade: isDemo ? 'Demo / Uninspected' : updated.restaurant.hygieneGrade,
          isDemo,
        };
      } catch (err) {
        const errMsg = (err as Error).message || '';
        if (errMsg.startsWith('DB_FALLBACK:')) {
          // Fall through to in-memory reservation below
        } else if (
          errMsg.includes('Insufficient inventory') ||
          errMsg.includes('Listing is no longer available')
        ) {
          throw err;
        } else if (errMsg.includes('not found') && !errMsg.includes('Transaction')) {
          if (!this.inMemoryListings.has(resolvedId) && !this.inMemoryListings.has(listingId)) {
            throw err;
          }
          // If present in memory, fall through
        }
      }
    }

    // Atomic In-Memory Reservation with Mutex Lock
    const releaseLock = await this.acquireLock(resolvedId);
    try {
      const listing = this.inMemoryListings.get(resolvedId) || this.inMemoryListings.get(listingId);
      if (!listing) {
        throw new Error(`Listing with ID '${listingId}' was not found.`);
      }

      if (listing.status !== 'ACTIVE') {
        throw new Error(`Listing is not active for ordering (Current status: ${listing.status}).`);
      }

      if (listing.availableQuantity < quantity) {
        throw new Error(
          `Insufficient inventory: Only ${listing.availableQuantity} portion(s) available, but requested ${quantity}.`
        );
      }

      // Concurrency-safe atomic mutation
      listing.availableQuantity -= quantity;
      listing.reservedQuantity += quantity;
      if (listing.availableQuantity === 0) {
        listing.status = 'SOLD_OUT';
      }

      return { ...listing };
    } finally {
      releaseLock();
    }
  }

  /**
   * Release reserved inventory on payment failure, cancellation, or expiry.
   */
  public async releaseReservedInventory(
    listingId: string,
    quantity: number
  ): Promise<void> {
    const resolvedId =
      listingId === 'deal-1'
        ? 'demo-deal-bakery-surprise'
        : listingId === 'deal-2'
        ? 'demo-deal-buffet-box'
        : listingId === 'deal-3'
        ? 'demo-deal-sushi-sampler'
        : listingId === 'deal-4'
        ? 'demo-deal-biryani-feast'
        : listingId === 'deal-test-concurrency'
        ? 'demo-deal-concurrency-test'
        : listingId;

    if (isDatabaseConfigured()) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE listings 
           SET available_quantity = available_quantity + $1, 
               reserved_quantity = GREATEST(0, reserved_quantity - $1),
               status = CASE WHEN status = 'SOLD_OUT' AND available_quantity + $1 > 0 THEN 'ACTIVE'::"ListingStatus" ELSE status END
           WHERE id = $2`,
          quantity,
          resolvedId
        );
        return;
      } catch {
        // DB offline, fall back
      }
    }

    const releaseLock = await this.acquireLock(resolvedId);
    try {
      const listing = this.inMemoryListings.get(resolvedId) || this.inMemoryListings.get(listingId);
      if (listing) {
        listing.availableQuantity += quantity;
        listing.reservedQuantity = Math.max(0, listing.reservedQuantity - quantity);
        if (listing.status === 'SOLD_OUT' && listing.availableQuantity > 0) {
          listing.status = 'ACTIVE';
        }
      }
    } finally {
      releaseLock();
    }
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
