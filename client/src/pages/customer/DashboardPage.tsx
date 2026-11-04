import React, { useState, useMemo, useEffect } from 'react';
import DealCard from '../../components/deals/DealCard';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { FoodDeal } from '../../types';
import api from '../../services/api';
import {
  MOCK_ACTIVE_PASS,
  MOCK_COMMUNITY_STATS,
} from '../../data/mockDeals';
import { formatINR } from '../../utils/formatters';

export interface DashboardPageProps {
  onSelectDeal: (deal: FoodDeal) => void;
  onOpenLocationModal: () => void;
  currentLocationName: string;
  maxDistanceKm: number;
  onShowPassModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectDeal,
  onOpenLocationModal,
  currentLocationName,
  maxDistanceKm,
  onShowPassModal,
}) => {
  const [deals, setDeals] = useState<FoodDeal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceCapInr, setPriceCapInr] = useState<number | null>(null);

  useEffect(() => {
    api.getActiveListings()
      .then((backendDeals) => {
        if (backendDeals && backendDeals.length > 0) {
          const originalDeals = backendDeals.filter(
            (d: any) =>
              !d.isDemo &&
              !d.id?.startsWith('demo-') &&
              !d.title?.startsWith('[Demo]') &&
              !d.restaurantName?.startsWith('[Demo]')
          );
          setDeals(originalDeals);
        } else {
          setDeals([]);
        }
      })
      .catch(() => setDeals([]));
  }, []);

  // Dynamic filtering of deals for the dashboard
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      if (deal.distanceKm > maxDistanceKm) return false;
      if (priceCapInr !== null && deal.dealPriceInr > priceCapInr) return false;

      // Category filter (All, Meal, Bakery, Pantry)
      if (selectedCategory !== 'all') {
        const cat = deal.categoryId?.toLowerCase() || '';
        const catName = deal.categoryName?.toLowerCase() || '';
        if (selectedCategory === 'meal') {
          const isMeal =
            cat.includes('meal') ||
            cat.includes('buffet') ||
            cat.includes('asian') ||
            cat.includes('healthy') ||
            cat.includes('curry') ||
            catName.includes('meal') ||
            catName.includes('dinner') ||
            catName.includes('buffet') ||
            catName.includes('asian') ||
            catName.includes('pizza') ||
            catName.includes('chef') ||
            catName.includes('thali') ||
            catName.includes('burger');
          if (!isMeal) return false;
        } else if (selectedCategory === 'bakery') {
          const isBakery =
            cat.includes('bakery') ||
            catName.includes('bakery') ||
            catName.includes('bread') ||
            catName.includes('patisserie') ||
            catName.includes('pastry') ||
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

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          deal.title.toLowerCase().includes(q) ||
          deal.restaurantName.toLowerCase().includes(q) ||
          deal.description.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [searchQuery, selectedCategory, priceCapInr, maxDistanceKm]);

  return (
    <div className="flex flex-col gap-space-md w-full">
      {/* Top Greeting & Neighborhood HUD */}
      <section className="flex items-center justify-between gap-space-xs">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-headline-md text-headline-md text-on-surface truncate font-bold">
              Welcome back, Sarah
            </h2>
            <span className="text-xl">👋</span>
          </div>
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-left group"
          >
            <span
              className="material-symbols-outlined text-[18px] text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              location_on
            </span>
            <span className="font-label-md text-label-md truncate">
              {currentLocationName} • Within {maxDistanceKm} km
            </span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-colors">
              tune
            </span>
          </button>
        </div>

        {/* Quick Eco Status Spark */}
        <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-primary-fixed/30 text-primary shadow-xs">
          <span className="material-symbols-outlined text-[24px]">eco</span>
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-surface animate-pulse" />
        </div>
      </section>

      {/* Active Pickup Pass Banner (Stitch Design) */}
      <section className="bg-primary-container text-on-primary rounded-2xl p-space-sm sm:p-space-md flex items-center justify-between gap-space-sm shadow-sm relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-on-primary/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-3 min-w-0 z-10">
          <div className="w-11 h-11 rounded-xl bg-surface-container-lowest/15 backdrop-blur-sm flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-primary text-[24px]">shopping_bag</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="bg-secondary text-on-secondary font-label-sm text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                Tonight
              </span>
              <span className="font-title-md text-title-md truncate font-bold text-on-primary">
                {MOCK_ACTIVE_PASS.restaurantName}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-primary-container truncate mt-0.5">
              {MOCK_ACTIVE_PASS.pickupWindow} • {MOCK_ACTIVE_PASS.dealTitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onShowPassModal}
          className="shrink-0 bg-surface-container-lowest text-primary font-bold font-label-md text-label-md px-3.5 py-2 rounded-xl shadow-xs hover:bg-surface-container-low active:scale-95 transition-all z-10"
        >
          View Pass
        </button>
      </section>

      {/* Live Impact HUD Cards (2 Columns strictly from Stitch) */}
      <section className="grid grid-cols-2 gap-space-sm">
        {/* Meals Saved Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-sm sm:p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">
              Meals Saved
            </span>
            <div className="w-7 h-7 rounded-full bg-primary-fixed/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[16px]">takeout_dining</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-headline-lg text-headline-lg text-primary font-bold tabular-nums">
              {MOCK_COMMUNITY_STATS.mealsSavedUser}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
              Meals Enjoyed
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-primary font-bold mt-1">
            {formatINR(MOCK_COMMUNITY_STATS.moneySavedUserInr)} pocketed
          </p>
        </div>

        {/* CO2e Prevented Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-sm sm:p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">
              CO₂e Prevented
            </span>
            <div className="w-7 h-7 rounded-full bg-primary-fixed/30 flex items-center justify-center text-primary">
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                forest
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-headline-lg text-headline-lg text-on-surface font-bold tabular-nums">
              {MOCK_COMMUNITY_STATS.co2ePreventedUserKg}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">kg</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            ≈ 3 car trips prevented
          </p>
        </div>
      </section>

      {/* Search & Fast Controls Bar */}
      <section className="flex flex-col gap-space-xs">
        <div className="relative flex items-center w-full bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <span className="absolute left-3.5 material-symbols-outlined text-[20px] text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search delicious meals, bakeries, sushi, bowls..."
            className="w-full h-11 pl-10 pr-12 bg-transparent rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Quick Filter Pills Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar -mx-gutter-mobile px-gutter-mobile">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setPriceCapInr(null);
            }}
            className={`shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 ${
              selectedCategory === 'all' && priceCapInr === null
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low border border-outline-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">lunch_dining</span>
            <span>All</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory((prev) => (prev === 'meal' ? 'all' : 'meal'))}
            className={`shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 ${
              selectedCategory === 'meal'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low border border-outline-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">dinner_dining</span>
            <span>Meal</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory((prev) => (prev === 'bakery' ? 'all' : 'bakery'))}
            className={`shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 ${
              selectedCategory === 'bakery'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low border border-outline-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">bakery_dining</span>
            <span>Bakery</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory((prev) => (prev === 'pantry' ? 'all' : 'pantry'))}
            className={`shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 ${
              selectedCategory === 'pantry'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low border border-outline-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">inventory_2</span>
            <span>Pantry</span>
          </button>

          <button
            type="button"
            onClick={() => setPriceCapInr((prev) => (prev === 200 ? null : 200))}
            className={`shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all flex items-center gap-1 ${
              priceCapInr === 200
                ? 'bg-secondary text-on-secondary font-bold shadow-xs'
                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low border border-outline-variant/30'
            }`}
          >
            <span>Under ₹200</span>
            <span className="material-symbols-outlined text-[14px]">sell</span>
          </button>
        </div>
      </section>

      {/* Live Radar / Mini Map Snapshot Card */}
      <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-outline-variant/30 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <span className="font-title-md text-[14px] text-on-surface font-bold">
              {filteredDeals.length} Fresh meal offers nearby
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="font-label-sm text-label-sm text-primary flex items-center gap-0.5 hover:underline font-bold"
          >
            <span>Expand Area</span>
            <span className="material-symbols-outlined text-[14px]">map</span>
          </button>
        </div>

        {/* Map Snapshot Visual */}
        <div
          className="relative w-full h-28 rounded-xl overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-4 left-8 bg-primary text-on-primary px-2.5 py-0.5 rounded-full font-label-sm text-[10px] flex items-center gap-1 shadow-md font-bold">
            <span>🥐</span>
            <span>3 boxes</span>
          </div>
          <div className="absolute bottom-3 right-8 bg-secondary text-on-secondary px-2.5 py-0.5 rounded-full font-label-sm text-[10px] flex items-center gap-1 shadow-md font-bold">
            <span>🍱</span>
            <span>2 meals</span>
          </div>
          <div className="absolute bottom-2 left-3 text-white text-[11px] font-medium drop-shadow-md">
            📍 {currentLocationName} (within {maxDistanceKm} km)
          </div>
        </div>
      </section>

      {/* Nearby Food Deals Grid */}
      <section className="flex flex-col gap-space-sm pt-1">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            Recommended Meals For You
          </h3>
          <Badge variant="live" pulseDot pulseColor="primary">
            {filteredDeals.length} Available
          </Badge>
        </div>

        {filteredDeals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {filteredDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onClick={onSelectDeal}
                onReserve={onSelectDeal}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="restaurant"
            title="No Meals Found in Selected Category"
            description="Clear your filters to browse all fresh food deals near your neighborhood."
            actionText="View All Deals"
            onAction={() => {
              setSelectedCategory('all');
              setPriceCapInr(null);
              setSearchQuery('');
            }}
          />
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
