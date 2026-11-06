import React, { useState, useMemo } from 'react';
import { FoodDeal } from '../../types';
import { formatINR } from '../../utils/formatters';

export interface FilterCriteria {
  maxPriceInr: number;
  maxDistanceKm: number;
  pickupWindowHours: number; // hours cutoff: 1, 2, 4, 12 (or 24 for anytime)
  dietaryTags: string[];
}

export interface FiltersBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  criteria: FilterCriteria;
  onApply: (newCriteria: FilterCriteria) => void;
  onClear: () => void;
  deals: FoodDeal[];
}

export const FiltersBottomSheet: React.FC<FiltersBottomSheetProps> = ({
  isOpen,
  onClose,
  criteria,
  onApply,
  onClear,
  deals,
}) => {
  const [activeSegment, setActiveSegment] = useState<'filters' | 'dietary'>('filters');
  const [localCriteria, setLocalCriteria] = useState<FilterCriteria>(criteria);

  // Sync state when opened
  React.useEffect(() => {
    if (isOpen) {
      setLocalCriteria(criteria);
    }
  }, [isOpen, criteria]);

  // Compute highest price in catalog
  const highestPrice = useMemo(() => {
    if (!deals || deals.length === 0) return 1000;
    return Math.max(...deals.map((d) => d.dealPriceInr), 800);
  }, [deals]);

  // Count matching deals with current local criteria
  const matchCount = useMemo(() => {
    return deals.filter((deal) => {
      if (deal.dealPriceInr > localCriteria.maxPriceInr) return false;
      if (deal.distanceKm > localCriteria.maxDistanceKm) return false;

      if (localCriteria.pickupWindowHours < 24) {
        const hoursLeft = (deal.pickupWindow?.expiresInSeconds || 3600) / 3600;
        if (hoursLeft > localCriteria.pickupWindowHours) return false;
      }

      if (localCriteria.dietaryTags.length > 0) {
        const dealTags = (deal.dietaryTags || []).map((t) => t.toLowerCase());
        const hasAllSelected = localCriteria.dietaryTags.every((st) =>
          dealTags.some((dt) => dt.includes(st.toLowerCase()))
        );
        if (!hasAllSelected) return false;
      }

      return true;
    }).length;
  }, [deals, localCriteria]);

  if (!isOpen) return null;

  const toggleDietaryTag = (tag: string) => {
    setLocalCriteria((prev) => {
      const exists = prev.dietaryTags.includes(tag);
      return {
        ...prev,
        dietaryTags: exists
          ? prev.dietaryTags.filter((t) => t !== tag)
          : [...prev.dietaryTags, tag],
      };
    });
  };

  const handleClearAll = () => {
    const cleared: FilterCriteria = {
      maxPriceInr: highestPrice,
      maxDistanceKm: 20,
      pickupWindowHours: 24,
      dietaryTags: [],
    };
    setLocalCriteria(cleared);
    onClear();
  };

  const handleApply = () => {
    onApply(localCriteria);
    onClose();
  };

  const availableDietaryTags = [
    'Vegetarian Friendly',
    '100% Vegan',
    'Gluten Free',
    'Nut-Free Facility',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden z-10 transition-transform">
        
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1" />

        {/* Top Header & Segmented Control */}
        <div className="p-4 pb-2 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900">Refine Deals</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Segmented Control: "Filters" | "Dietary" */}
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSegment('filters')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                activeSegment === 'filters'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Filters
            </button>
            <button
              type="button"
              onClick={() => setActiveSegment('dietary')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeSegment === 'dietary'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Dietary</span>
              {localCriteria.dietaryTags.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#006030] text-white text-[10px] flex items-center justify-center">
                  {localCriteria.dietaryTags.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-6 flex-1">
          {activeSegment === 'filters' ? (
            <>
              {/* 1. Price Range Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800">Max Deal Price</label>
                  <span className="text-sm font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">
                    Up to {formatINR(localCriteria.maxPriceInr)}
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max={highestPrice}
                  step="25"
                  value={localCriteria.maxPriceInr}
                  onChange={(e) =>
                    setLocalCriteria((prev) => ({
                      ...prev,
                      maxPriceInr: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-orange-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>₹0</span>
                  <span>{formatINR(highestPrice)}</span>
                </div>
              </div>

              {/* 2. Distance Chips (<3 km, <5 km, <10 km, <20 km) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800">Maximum Distance</label>
                  <span className="text-xs font-semibold text-slate-500">
                    Within {localCriteria.maxDistanceKm} km
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 10, 20].map((dist) => {
                    const isSelected = localCriteria.maxDistanceKm === dist;
                    return (
                      <button
                        key={dist}
                        type="button"
                        onClick={() =>
                          setLocalCriteria((prev) => ({ ...prev, maxDistanceKm: dist }))
                        }
                        className={`py-2 rounded-xl text-xs font-semibold transition-all border text-center ${
                          isSelected
                            ? 'bg-[#006030] text-white border-[#006030] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        &lt; {dist} km
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Pickup Window Slider / Range */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800">Pickup Window Cutoff</label>
                  <span className="text-xs font-semibold text-slate-500">
                    {localCriteria.pickupWindowHours >= 24
                      ? 'Anytime today'
                      : `Within ${localCriteria.pickupWindowHours} hour${localCriteria.pickupWindowHours > 1 ? 's' : ''}`}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={localCriteria.pickupWindowHours > 12 ? 12 : localCriteria.pickupWindowHours}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLocalCriteria((prev) => ({
                      ...prev,
                      pickupWindowHours: val === 12 ? 24 : val,
                    }));
                  }}
                  className="w-full accent-[#006030] cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>1 hr (Ending soon)</span>
                  <span>4 hrs</span>
                  <span>Anytime</span>
                </div>
              </div>
            </>
          ) : (
            /* Dietary Preferences Tab */
            <div className="flex flex-col gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Dietary Preferences</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filter deals tagged with verified dietary guidelines.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {availableDietaryTags.map((tag) => {
                  const isChecked = localCriteria.dietaryTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleDietaryTag(tag)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm">{tag}</span>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          isChecked
                            ? 'bg-[#006030] border-[#006030] text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isChecked && (
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col gap-2">
          <button
            type="button"
            onClick={handleApply}
            className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-1.5"
          >
            <span>Apply Filters</span>
            <span>({matchCount} deals)</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="text-center text-xs font-semibold text-slate-500 hover:text-slate-800 py-1 transition-colors"
          >
            Clear filters
          </button>
        </div>

      </div>
    </div>
  );
};

export default FiltersBottomSheet;
