import React, { useState, useMemo, useEffect } from 'react';
import { FoodDeal } from '../../types';
import DealCard from '../../components/deals/DealCard';
import FoodDealCarousel from '../../components/deals/FoodDealCarousel';
import DealCardSkeleton from '../../components/deals/DealCardSkeleton';
import FiltersBottomSheet, { FilterCriteria } from '../../components/customer/FiltersBottomSheet';
import api from '../../services/api';
import { getFoodFallbackImageUrl } from '../../utils/foodImages';

export interface ExplorePageProps {
  onSelectDeal: (deal: FoodDeal) => void;
  onOpenLocationModal: () => void;
  currentLocationName: string;
  maxDistanceKm: number;
  onOpenAccount?: () => void;
}

// 4 categories supported in SaveBite: All, Meal, Bakery, Pantry
const CATEGORY_TABS = [
  { id: 'all', name: 'All', icon: 'lunch_dining' },
  { id: 'meal', name: 'Meal', icon: 'dinner_dining' },
  { id: 'bakery', name: 'Bakery', icon: 'bakery_dining' },
  { id: 'pantry', name: 'Pantry', icon: 'inventory_2' },
];

export const ExplorePage: React.FC<ExplorePageProps> = ({
  onSelectDeal,
  onOpenLocationModal,
  currentLocationName,
  maxDistanceKm,
  onOpenAccount: _onOpenAccount,
}) => {
  const [deals, setDeals] = useState<FoodDeal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [viewAllSection, setViewAllSection] = useState<'near_you' | 'pickup_now' | null>(null);

  // Initial filter criteria
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    maxPriceInr: 1000,
    dealType: 'all',
    maxDistanceKm: maxDistanceKm,
    pickupWindowHours: 24,
    dietaryTags: [],
  });

  // Sync prop maxDistanceKm
  useEffect(() => {
    setFilterCriteria((prev) => ({ ...prev, maxDistanceKm }));
  }, [maxDistanceKm]);

  // Load deals from API (Original partner data only)
  const fetchDeals = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      // Fetch active listings from backend
      const backendDeals = await api.getActiveListings();
      if (backendDeals && backendDeals.length > 0) {
        // Strictly filter out any demo items so customers only see original partner listings
        const originalDeals = backendDeals.filter((d: any) => {
          const isDemo =
            Boolean(d.isDemo) ||
            d.id?.startsWith('demo-') ||
            d.title?.startsWith('[Demo]') ||
            d.restaurantName?.startsWith('[Demo]') ||
            (Array.isArray(d.dietaryTags) && d.dietaryTags.includes('SYSTEM_DEMO_RECORD_V1'));
          return !isDemo;
        });

        // Map live partner deals
        const mapped: FoodDeal[] = originalDeals.map((d: any) => ({
          ...d,
          imageUrl: d.imageUrl || getFoodFallbackImageUrl(d),
          dealPriceInr: d.dealPriceInr ?? d.surplusPriceInr ?? 149,
          originalPriceInr: d.originalPriceInr ?? 450,
          discountPercent:
            d.discountPercent ??
            (d.originalPriceInr && (d.dealPriceInr ?? d.surplusPriceInr)
              ? Math.round(
                  ((d.originalPriceInr - (d.dealPriceInr ?? d.surplusPriceInr)) /
                    d.originalPriceInr) *
                    100
                )
              : 65),
          savingsInr:
            d.savingsInr ??
            Math.max(0, (d.originalPriceInr || 450) - (d.dealPriceInr ?? d.surplusPriceInr ?? 149)),
          distanceKm: d.distanceKm ?? 1.2,
          pickupWindow: d.pickupWindow ?? {
            date: 'Today',
            startTime: '19:00',
            endTime: '21:00',
            displayText: d.pickupWindowText || 'Tonight, 7:00 PM – 9:00 PM',
            expiresInSeconds: 3200,
          },
          dietaryTags: d.dietaryTags ?? ['Freshly Prepared', 'Vegetarian Friendly'],
          hygieneGrade: d.hygieneGrade ?? 'Grade A',
          isMysteryBox: d.isMysteryBox ?? (d.categoryName?.toLowerCase().includes('bakery') || false),
        }));
        setDeals(mapped);
      } else {
        setDeals([]);
      }
    } catch {
      setDeals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // Filter deals client-side
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      // 1. Distance filter
      if (deal.distanceKm > filterCriteria.maxDistanceKm) return false;

      // 2. Price filter
      if (deal.dealPriceInr > filterCriteria.maxPriceInr) return false;

      // 3. Category filter (All, Meal, Bakery, Pantry)
      if (selectedCategory !== 'all') {
        const cat = deal.categoryId?.toLowerCase() || '';
        const catName = deal.categoryName?.toLowerCase() || '';
        if (selectedCategory === 'meal' || selectedCategory === 'meals') {
          const isMeal =
            cat.includes('meal') ||
            cat.includes('buffet') ||
            cat.includes('asian') ||
            cat.includes('curry') ||
            catName.includes('meal') ||
            catName.includes('dinner') ||
            catName.includes('buffet') ||
            catName.includes('asian') ||
            catName.includes('pizza') ||
            catName.includes('chef') ||
            catName.includes('thali') ||
            catName.includes('rice') ||
            catName.includes('burger') ||
            catName.includes('noodle');
          if (!isMeal) return false;
        } else if (selectedCategory === 'bakery') {
          const isBakery =
            cat.includes('bakery') ||
            catName.includes('bakery') ||
            catName.includes('bread') ||
            catName.includes('patisserie') ||
            catName.includes('pastry') ||
            catName.includes('croissant') ||
            catName.includes('cake') ||
            catName.includes('doughnut') ||
            catName.includes('dessert');
          if (!isBakery) return false;
        } else if (selectedCategory === 'pantry') {
          const isPantry =
            cat.includes('pantry') ||
            cat.includes('produce') ||
            cat.includes('grocery') ||
            catName.includes('pantry') ||
            catName.includes('grocery') ||
            catName.includes('snack') ||
            catName.includes('cereal') ||
            catName.includes('superfood');
          if (!isPantry) return false;
        }
      }

      // 4. Deal type filter
      if (filterCriteria.dealType === 'mystery' && !deal.isMysteryBox) return false;
      if (filterCriteria.dealType === 'meal' && deal.isMysteryBox) return false;

      // 5. Pickup window cutoff
      if (filterCriteria.pickupWindowHours < 24) {
        const hoursLeft = (deal.pickupWindow?.expiresInSeconds || 3600) / 3600;
        if (hoursLeft > filterCriteria.pickupWindowHours) return false;
      }

      // 6. Dietary tags
      if (filterCriteria.dietaryTags.length > 0) {
        const dealTags = (deal.dietaryTags || []).map((t) => t.toLowerCase());
        const matchesAll = filterCriteria.dietaryTags.every((st) =>
          dealTags.some((dt) => dt.includes(st.toLowerCase()))
        );
        if (!matchesAll) return false;
      }

      // 7. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = deal.title?.toLowerCase().includes(q);
        const matchesRest = deal.restaurantName?.toLowerCase().includes(q);
        const matchesDesc = deal.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesRest && !matchesDesc) return false;
      }

      return true;
    });
  }, [deals, filterCriteria, selectedCategory, searchQuery]);

  // Section 1: "NEAR YOU" (sorted by distance ascending)
  const nearYouDeals = useMemo(() => {
    return [...filteredDeals].sort((a, b) => a.distanceKm - b.distanceKm);
  }, [filteredDeals]);

  // Section 2: "PICKUP NOW" (ending soon, sorted by expiresInSeconds ascending)
  const pickupNowDeals = useMemo(() => {
    return [...filteredDeals].sort(
      (a, b) =>
        (a.pickupWindow?.expiresInSeconds || 9999) -
        (b.pickupWindow?.expiresInSeconds || 9999)
    );
  }, [filteredDeals]);

  const hasActiveFilters =
    filterCriteria.dealType !== 'all' ||
    filterCriteria.dietaryTags.length > 0 ||
    filterCriteria.pickupWindowHours < 24 ||
    filterCriteria.maxPriceInr < 800;

  return (
    <div className="flex flex-col w-full pb-20">
      
      {/* 1. TOP BLOCK: Forest Green with Rounded Bottom Corners */}
      <section className="bg-[#006030] text-white rounded-b-[2rem] md:rounded-b-3xl shadow-sm pb-5 pt-3.5 px-4 md:px-8">
        <div className="w-full flex flex-col gap-3.5">
          
          {/* Row a: Pickup location */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onOpenLocationModal}
              className="flex flex-col items-start text-left group"
              aria-label="Change current location"
            >
              <span className="text-[11px] text-emerald-200/90 font-medium flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[13px] text-emerald-300">location_on</span>
                <span>Current location</span>
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </span>
              <span className="text-sm md:text-base font-bold text-white group-hover:text-emerald-100 transition-colors truncate max-w-[280px] sm:max-w-md md:max-w-xl">
                {currentLocationName}
              </span>
            </button>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-800/80 border border-emerald-700/60 text-emerald-100 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SaveBite Verified</span>
            </span>
          </div>

          {/* Row b: White rounded search bar + Filter button beside it */}
          <div className="flex items-center gap-2.5 max-w-2xl mx-auto w-full">
            <div className="flex-1 relative flex items-center bg-white rounded-full px-3.5 py-1 shadow-sm">
              <span className="material-symbols-outlined text-slate-400 text-[18px] mr-2">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find food or restaurant…"
                className="w-full h-9 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center shrink-0 shadow-xs relative transition-colors"
              aria-label="Open filter settings"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
              {hasActiveFilters && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-orange-500 border border-white" />
              )}
            </button>
          </div>

          {/* Row c: 1 row of 4 category tabs with small icons and underline on active tab */}
          <div className="border-t border-white/10 pt-2.5">
            <div className="grid grid-cols-4 gap-1 sm:gap-4 max-w-lg mx-auto">
              {CATEGORY_TABS.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setViewAllSection(null);
                    }}
                    className={`flex flex-col items-center gap-1 py-1.5 transition-all text-center relative ${
                      isActive ? 'text-white font-bold' : 'text-emerald-100/75 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] md:text-[20px]">{cat.icon}</span>
                    <span className="text-[11px] md:text-xs leading-none">{cat.name}</span>
                    {isActive && (
                      <span className="absolute -bottom-2 inset-x-2 h-0.5 bg-white rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* Slim notice strip under the header */}
      <div className="w-full px-4 md:px-8 pt-3">
        <div className="py-2.5 px-4 bg-emerald-50/90 border border-emerald-200/60 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[18px] text-[#006030] shrink-0">
              storefront
            </span>
            <span className="font-medium truncate">Counter Pickup only • Direct from local partner kitchens</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold shrink-0 pl-2">
            Counter Pickup
          </span>
        </div>
      </div>

      {/* Main Body: Sections / States */}
      <div className="w-full px-4 md:px-8 pt-4 flex flex-col gap-8">

        {/* ERROR STATE with Retry */}
        {isError && (
          <div className="p-6 bg-white rounded-2xl border border-red-200 text-center flex flex-col items-center gap-3 shadow-xs max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">error_outline</span>
            </div>
            <div className="flex flex-col">
              <h4 className="font-bold text-sm text-slate-900">Unable to load deals</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Check your network connection and try reloading the active listings.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchDeals}
              className="px-4 py-2 bg-[#006030] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-800 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING SKELETON STATE */}
        {isLoading && !isError && (
          <div className="flex flex-col gap-8">
            <div>
              <div className="h-5 bg-slate-200 rounded w-36 mb-3 animate-pulse" />
              <div className="flex gap-4 overflow-x-hidden pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                {[1, 2, 3, 4].map((i) => (
                  <DealCardSkeleton key={i} horizontal />
                ))}
              </div>
            </div>
            <div>
              <div className="h-5 bg-slate-200 rounded w-44 mb-3 animate-pulse" />
              <div className="flex gap-4 overflow-x-hidden pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                {[4, 5, 6, 7].map((i) => (
                  <DealCardSkeleton key={i} horizontal />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW ALL EXPANDED VIEW */}
        {!isLoading && !isError && viewAllSection !== null && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewAllSection(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
                  aria-label="Back to explore overview"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                <h3 className="font-bold text-sm md:text-base tracking-wider text-slate-800 uppercase">
                  {viewAllSection === 'near_you' ? 'NEAR YOU' : 'PICKUP NOW'} (
                  {viewAllSection === 'near_you' ? nearYouDeals.length : pickupNowDeals.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewAllSection(null)}
                className="text-xs md:text-sm text-[#006030] font-semibold hover:underline"
              >
                Close View
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {(viewAllSection === 'near_you' ? nearYouDeals : pickupNowDeals).map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onClick={onSelectDeal}
                  onReserve={onSelectDeal}
                />
              ))}
            </div>
          </div>
        )}

        {/* DEFAULT HORIZONTAL SECTIONS */}
        {!isLoading && !isError && viewAllSection === null && (
          <>
            {/* EMPTY STATE */}
            {filteredDeals.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-slate-100 text-center flex flex-col items-center gap-3 shadow-xs my-4 max-w-xl mx-auto">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#006030] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">
                    {deals.length === 0 ? 'storefront' : 'search_off'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <h4 className="font-bold text-base text-slate-900">
                    {deals.length === 0
                      ? 'No surplus meals listed right now'
                      : 'No meals available matching your filters'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    {deals.length === 0
                      ? `Partner restaurants near ${currentLocationName} post their surplus food as closing hours approach. Check back soon for fresh counter pickup deals!`
                      : `Partner restaurants offer counter pickup near ${currentLocationName}. Try resetting category or dietary filters to view all available offers.`}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  {deals.length === 0 ? (
                    <button
                      type="button"
                      onClick={fetchDeals}
                      className="px-4 py-2.5 bg-[#006030] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-800 transition-colors inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      Refresh Deals
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setFilterCriteria({
                          maxPriceInr: 1000,
                          dealType: 'all',
                          maxDistanceKm: 20,
                          pickupWindowHours: 24,
                          dietaryTags: [],
                        });
                      }}
                      className="px-4 py-2.5 bg-[#006030] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-800 transition-colors"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Section 1: "MEALS NEAR YOU" (Swipeable & Draggable Food Deal Carousel) */}
                <FoodDealCarousel
                  title="MEALS NEAR YOU"
                  subtitle="Partner kitchens ready for quick counter pickup"
                  deals={nearYouDeals}
                  onSelectDeal={onSelectDeal}
                  onViewAll={() => setViewAllSection('near_you')}
                  testId="meals-near-you-carousel"
                />

                {/* Section 2: "PICKUP TONIGHT" (Swipeable & Draggable Food Deal Carousel) */}
                <FoodDealCarousel
                  title="PICKUP TONIGHT"
                  badge="Ending soon"
                  subtitle="Last surplus meals reserved before kitchen closing"
                  deals={pickupNowDeals}
                  onSelectDeal={onSelectDeal}
                  onViewAll={() => setViewAllSection('pickup_now')}
                  className="pt-2"
                  testId="pickup-tonight-carousel"
                />
              </>
            )}
          </>
        )}

      </div>

      {/* Filters Bottom Sheet */}
      <FiltersBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        criteria={filterCriteria}
        onApply={(newCriteria) => setFilterCriteria(newCriteria)}
        onClear={() =>
          setFilterCriteria({
            maxPriceInr: 1000,
            dealType: 'all',
            maxDistanceKm: 20,
            pickupWindowHours: 24,
            dietaryTags: [],
          })
        }
        deals={deals}
      />
    </div>
  );
};

export default ExplorePage;
