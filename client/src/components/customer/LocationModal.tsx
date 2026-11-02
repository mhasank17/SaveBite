import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { MOCK_LOCATIONS, LocationOption } from '../../data/mockDeals';

export interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: LocationOption;
  currentRadiusKm: number;
  onSelectLocation: (location: LocationOption, radiusKm: number) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  currentRadiusKm,
  onSelectLocation,
}) => {
  const [selectedLoc, setSelectedLoc] = useState<LocationOption>(currentLocation);
  const [radiusKm, setRadiusKm] = useState<number>(currentRadiusKm);

  const handleConfirm = () => {
    onSelectLocation(selectedLoc, radiusKm);
    onClose();
  };

  const radiusOptions = [1, 2, 3, 5, 10];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Your Neighborhood"
      subtitle="Discover fresh meals available near your location"
      variant="bottomSheet"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirm}>
            Update Location
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-space-md">
        {/* Neighborhood List */}
        <div className="flex flex-col gap-2">
          <label className="font-label-md text-label-md text-on-surface-variant font-bold">
            Popular Neighborhoods
          </label>
          <div className="flex flex-col gap-2">
            {MOCK_LOCATIONS.map((loc) => {
              const isSelected = selectedLoc.id === loc.id;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setSelectedLoc(loc)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-primary-fixed/25 border-primary text-primary font-bold shadow-xs'
                      : 'bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        isSelected ? 'text-primary' : 'text-outline'
                      }`}
                      style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      location_on
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-title-md text-[14px] truncate">{loc.name}</span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant truncate">
                        {loc.district}
                      </span>
                    </div>
                  </div>
                  <span className="font-label-sm text-[11px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant shrink-0">
                    {loc.distanceKm} km
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Discovery Radius Options */}
        <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20">
          <div className="flex items-center justify-between">
            <label className="font-label-md text-label-md text-on-surface font-bold">
              Discovery Radius
            </label>
            <span className="font-label-sm text-primary font-bold">Within {radiusKm} km</span>
          </div>

          <div className="flex items-center gap-2">
            {radiusOptions.map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setRadiusKm(km)}
                className={`flex-1 py-1.5 rounded-lg font-label-sm text-label-sm font-semibold transition-all ${
                  radiusKm === km
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LocationModal;
