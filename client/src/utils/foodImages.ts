import React from 'react';

/**
 * SaveBite Curated Realistic High-Quality Food Images
 * Organized by food categories as required:
 * - Bread and sourdough loaves
 * - Cakes and pastries
 * - Burgers and sandwiches
 * - Pizza
 * - Rice meals and biryani
 * - Snacks and desserts
 * - Freshly prepared meals
 * - Mystery food boxes
 * - Pantry provisions
 */
export const FOOD_CATEGORY_IMAGES = {
  bread_sourdough: [
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', // Artisanal sourdough & country loaves
    'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80', // French hearth baguettes & brioche
    'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80', // Crusty artisanal boule
  ],
  cakes_pastries: [
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', // Gourmet Belgian chocolate ganache cake
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80', // Flaky golden butter croissants
    'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80', // Strawberry cheesecake & tart
  ],
  burgers_sandwiches: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', // Double brioche burger & wedges
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80', // Gourmet craft burger & golden fries
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80', // Toasted artisan club sandwich
  ],
  pizza: [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80', // Woodfire Neapolitan pizza with mozzarella & basil
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80', // Stone oven artisanal pizza slice
  ],
  rice_biryani: [
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80', // Royal fragrant dum biryani
    'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80', // Spiced curry & basmati rice thali bowl
  ],
  snacks_desserts: [
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80', // Glazed artisan doughnuts & sweet treats
    'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=800&q=80', // Glazed cinnamon buns & swirl pastries
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80', // Gourmet dessert sundae & scoops
  ],
  fresh_meals: [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', // Chef dinner banquet bowl & warm greens
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', // Fresh sushi & maki bento platter
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', // Hot continental chef dinner platter
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80', // Wok noodles & ramen bowl
  ],
  mystery_box: [
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80', // Curated mystery surprise meal box
    'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&w=800&q=80', // Eco-friendly food rescue mystery box
    'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800&q=80', // Surprise chef meal bag
  ],
  pantry: [
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80', // Oats, grains & superfood provisions
    'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=800&q=80', // Roasted almonds & packaged snacks
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80', // Pure honey jars & preserves
    'https://images.unsplash.com/photo-1517093157656-b9ec81640a23?auto=format&fit=crop&w=800&q=80', // Crispy granola & muesli
  ],
};

export type FoodCategoryType = keyof typeof FOOD_CATEGORY_IMAGES;

/**
 * Simple deterministic hash for a string to stably index into an array
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export interface FoodDealMeta {
  id?: string;
  title?: string;
  description?: string;
  categoryName?: string;
  categoryId?: string;
  isMysteryBox?: boolean;
  imageUrl?: string;
}

/**
 * Classifies a deal or item metadata into one of the specialized food categories.
 */
export function detectFoodCategory(deal?: FoodDealMeta | null): FoodCategoryType {
  if (!deal) return 'fresh_meals';

  const text = `${deal.title || ''} ${deal.description || ''} ${deal.categoryName || ''} ${deal.categoryId || ''}`.toLowerCase();

  // 1. Mystery Box check (explicit or keyword)
  if (deal.isMysteryBox || text.includes('mystery') || text.includes('surprise') || text.includes('rescue crate')) {
    return 'mystery_box';
  }

  // 2. Pizza
  if (text.includes('pizza') || text.includes('calzone') || text.includes('neapolitan') || text.includes('dough ball')) {
    return 'pizza';
  }

  // 3. Burgers & Sandwiches
  if (
    text.includes('burger') ||
    text.includes('sandwich') ||
    text.includes('panini') ||
    text.includes('melt') ||
    text.includes('toastie') ||
    text.includes('club sandwich')
  ) {
    return 'burgers_sandwiches';
  }

  // 4. Rice Meals & Biryani
  if (
    text.includes('biryani') ||
    text.includes('rice') ||
    text.includes('pulao') ||
    text.includes('thali') ||
    text.includes('curry') ||
    text.includes('dal')
  ) {
    return 'rice_biryani';
  }

  // 5. Snacks & Desserts
  if (
    text.includes('doughnut') ||
    text.includes('donut') ||
    text.includes('cinnamon bun') ||
    text.includes('cinnamon roll') ||
    text.includes('dessert') ||
    text.includes('sundae') ||
    text.includes('ice cream') ||
    text.includes('snack') ||
    text.includes('churro') ||
    text.includes('sweet')
  ) {
    return 'snacks_desserts';
  }

  // 6. Cakes & Pastries
  if (
    text.includes('cake') ||
    text.includes('patisserie') ||
    text.includes('croissant') ||
    text.includes('pastry') ||
    text.includes('pastries') ||
    text.includes('tart') ||
    text.includes('eclair') ||
    text.includes('danish')
  ) {
    return 'cakes_pastries';
  }

  // 7. Bread & Sourdough Loaves
  if (
    text.includes('sourdough') ||
    text.includes('bread') ||
    text.includes('baguette') ||
    text.includes('brioche') ||
    text.includes('loaf') ||
    text.includes('loaves') ||
    text.includes('boule') ||
    text.includes('boulangerie')
  ) {
    return 'bread_sourdough';
  }

  // 8. Pantry Provisions
  if (
    text.includes('pantry') ||
    text.includes('granola') ||
    text.includes('oats') ||
    text.includes('honey') ||
    text.includes('almond') ||
    text.includes('superfood') ||
    text.includes('grocery')
  ) {
    return 'pantry';
  }

  // 9. Bakery category fallback
  if (text.includes('bakery')) {
    return 'bread_sourdough';
  }

  // 10. Default to fresh prepared meals
  return 'fresh_meals';
}

/**
 * Deterministically returns a relevant, high-quality image URL for a food deal.
 * If the deal already has a valid imageUrl, returns it.
 * Otherwise, determines the category and stably hashes deal.id/deal.title
 * so the image never changes randomly upon refresh.
 */
export function getFoodFallbackImageUrl(deal?: FoodDealMeta | null): string {
  if (deal?.imageUrl && deal.imageUrl.trim() !== '') {
    // If the image is the legacy repeated bakery image AND this is not the designated bakery surprise deal,
    // generate a distinct category-specific image to avoid repeating the bakery image across different deals
    const isLegacyRepeatedBakery =
      deal.imageUrl.includes('photo-1509440159596-0249088772ff') &&
      deal.id !== 'demo-deal-bakery-surprise' &&
      deal.id !== 'deal-1';

    if (!isLegacyRepeatedBakery) {
      return deal.imageUrl;
    }
  }

  const category = detectFoodCategory(deal);
  const pool = FOOD_CATEGORY_IMAGES[category] || FOOD_CATEGORY_IMAGES.fresh_meals;
  const key = deal?.id || deal?.title || 'savebite-food-deal';
  const index = hashString(key) % pool.length;

  return pool[index];
}

/**
 * Safe image onError handler to replace broken or failed images with a
 * category-appropriate fallback without infinite error loops.
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string
): void {
  const target = e.currentTarget;
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
}
