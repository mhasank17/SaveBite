import React, { useState, useMemo } from 'react';
import { LocationOption, MOCK_LOCATIONS } from '../../data/mockDeals';

export interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: LocationOption;
  currentRadiusKm?: number;
  onSelectLocation?: (location: LocationOption, radiusKm?: number) => void;
  onSelectAddress?: (address: any) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
  onShowToast,
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    currentLocation?.id || MOCK_LOCATIONS[0].id
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_LOCATIONS;
    const q = searchQuery.toLowerCase();
    return MOCK_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.district.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleConfirm = () => {
    const loc = MOCK_LOCATIONS.find((l) => l.id === selectedLocationId) || MOCK_LOCATIONS[0];
    onSelectLocation?.(loc);
    onShowToast?.('success', `Pickup location set to ${loc.name}.`, 'Location Updated');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006030] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">location_on</span>
            </div>
            <div>
              <h2 className="font-extrabold text-base md:text-lg text-slate-900 leading-tight">
                Select Pickup Location
              </h2>
              <p className="text-xs text-slate-500">
                Choose your campus area to find surplus meals near you
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {/* Notice Banner */}
          <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/60 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#006030] text-[20px] shrink-0 mt-0.5">
              storefront
            </span>
            <div className="flex flex-col text-xs text-emerald-950">
              <span className="font-bold">Counter Pickup Supported</span>
              <span className="text-emerald-800 leading-relaxed mt-0.5">
                Food deals are reserved online and collected directly from the partner restaurant counter during the scheduled pickup window.
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex items-center bg-slate-50 rounded-2xl px-3.5 py-1 focus-within:ring-2 focus-within:ring-[#006030] focus-within:bg-white transition-all border border-slate-200">
            <span className="material-symbols-outlined text-slate-400 text-[20px] shrink-0 mr-2">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campus or location area..."
              className="w-full h-9 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Locations List */}
          <div className="flex flex-col gap-2.5">
            {filteredLocations.map((loc) => {
              const isSelected = selectedLocationId === loc.id;
              return (
                <div
                  key={loc.id}
                  onClick={() => setSelectedLocationId(loc.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-[#006030] bg-emerald-50/40 shadow-xs ring-1 ring-[#006030]'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="radio"
                      name="pickup_location"
                      checked={isSelected}
                      onChange={() => setSelectedLocationId(loc.id)}
                      className="text-[#006030] focus:ring-[#006030]"
                    />
                  </div>

                  <div className="flex flex-col min-w-0 flex-1 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900">{loc.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                        {loc.district}
                      </span>
                    </div>
                    <span className="text-slate-500 mt-0.5">
                      Campus Zone • Ready for counter pickup
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-[#006030] hover:bg-[#004d26] text-white text-xs font-bold transition-all shadow-xs"
          >
            Select Location
          </button>
        </footer>
      </div>
    </div>
  );
};

export default LocationPickerModal;
