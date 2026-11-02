import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  label?: string;
  postalCode?: string;
  city?: string;
}

export interface AddressMapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
  onSelectCoordinates: (coords: LocationCoordinates) => void;
}

const CAMPUS_PRESETS: LocationCoordinates[] = [
  {
    latitude: 13.0827,
    longitude: 77.5877,
    label: 'University North Campus - Hostels Gate',
    postalCode: '560092',
    city: 'Bengaluru',
  },
  {
    latitude: 13.0815,
    longitude: 77.5892,
    label: 'Central University Library & SAC Hub',
    postalCode: '560092',
    city: 'Bengaluru',
  },
  {
    latitude: 28.6903,
    longitude: 77.2075,
    label: 'Delhi University North Campus - Arts Faculty',
    postalCode: '110007',
    city: 'Delhi',
  },
  {
    latitude: 19.1334,
    longitude: 72.9133,
    label: 'Powai Campus & Hostel Belt Gate',
    postalCode: '400076',
    city: 'Mumbai',
  },
  {
    latitude: 12.9716,
    longitude: 77.6412,
    label: 'Indiranagar Metro District (Outside Campus)',
    postalCode: '560038',
    city: 'Bengaluru',
  },
];

export const AddressMapPicker: React.FC<AddressMapPickerProps> = ({
  isOpen,
  onClose,
  initialLat = 13.0827,
  initialLng = 77.5877,
  onSelectCoordinates,
}) => {
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [selectedLabel, setSelectedLabel] = useState<string>('Selected Location');
  const [postalCode, setPostalCode] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Check if live map provider key is configured
  const hasMapsApiKey = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const newLat = parseFloat(pos.coords.latitude.toFixed(6));
        const newLng = parseFloat(pos.coords.longitude.toFixed(6));
        setLat(newLat);
        setLng(newLng);
        setSelectedLabel('Current GPS Location');
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission was denied. Please allow location access or select a preset location below.');
        } else {
          setGeoError('Unable to retrieve device GPS location. You can enter coordinates manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleApplyPreset = (preset: LocationCoordinates) => {
    setLat(preset.latitude);
    setLng(preset.longitude);
    setSelectedLabel(preset.label || 'Campus Location');
    if (preset.postalCode) setPostalCode(preset.postalCode);
    if (preset.city) setCity(preset.city);
    setGeoError(null);
  };

  const handleConfirm = () => {
    onSelectCoordinates({
      latitude: lat,
      longitude: lng,
      label: selectedLabel,
      postalCode: postalCode || undefined,
      city: city || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pin Delivery Location & Coordinates"
      subtitle="Select your delivery spot via GPS, map coordinates, or approved campus presets"
      variant="center"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 font-mono">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirm}>
              Confirm Location
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Transparent Notice about External Map Key */}
        {!hasMapsApiKey && (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-amber-700 text-[20px] shrink-0 mt-0.5">
              info
            </span>
            <div>
              <p className="font-bold">Map Provider Notice</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Live interactive satellite tiles require a configured Google Maps API key (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_GOOGLE_MAPS_API_KEY</code>). Device GPS detection, coordinate saving, and campus drop point presets are fully functional.
              </p>
            </div>
          </div>
        )}

        {/* GPS Location Button */}
        <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#006030] text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">my_location</span>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Device GPS Location</div>
              <div className="text-[11px] text-slate-500">Auto-detect your precise hostel or gate coordinates</div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isLocating}
            onClick={handleUseCurrentLocation}
          >
            {isLocating ? 'Locating...' : 'Use GPS'}
          </Button>
        </div>

        {geoError && (
          <div className="p-2.5 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{geoError}</span>
          </div>
        )}

        {/* Visual Simulated Map Display with Pin Marker */}
        <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
          {/* Subtle grid pattern background to represent map cartography */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px), radial-gradient(#059669 1px, #0f172a 1px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px',
            }}
          />

          {/* Radar Circles */}
          <div className="absolute w-36 h-36 rounded-full border border-emerald-500/30 animate-ping opacity-25" />
          <div className="absolute w-24 h-24 rounded-full border border-emerald-400/40" />

          {/* Central Pin */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
              <span className="material-symbols-outlined text-[20px]">pin_drop</span>
            </div>
            <div className="mt-2 px-3 py-1 bg-black/80 backdrop-blur-xs rounded-full border border-emerald-500/40 text-[11px] font-mono font-bold text-emerald-300">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </div>
          </div>

          <div className="absolute bottom-2 left-3 right-3 text-center text-[10px] text-slate-400 bg-slate-950/70 py-1 px-2 rounded-lg">
            📍 {selectedLabel}
          </div>
        </div>

        {/* Manual Coordinate Adjustments */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-700">Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
              className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006030]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-700">Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={lng}
              onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
              className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006030]"
            />
          </div>
        </div>

        {/* Verified University Campus Presets */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-emerald-700">school</span>
            <span>Quick Campus & Metro Presets</span>
          </label>
          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
            {CAMPUS_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`w-full p-2.5 rounded-xl border text-left text-xs transition-colors flex items-center justify-between ${
                  lat === preset.latitude && lng === preset.longitude
                    ? 'bg-emerald-50 border-[#006030] text-[#006030] font-bold'
                    : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{preset.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    PIN: {preset.postalCode} | {preset.latitude.toFixed(4)}, {preset.longitude.toFixed(4)}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[18px]">
                  {lat === preset.latitude && lng === preset.longitude ? 'check_circle' : 'add_location'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddressMapPicker;
