import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import addressApi, {
  CustomerAddress,
  AddressType,
  CreateAddressInput,
  ServiceabilityResult,
} from '../../services/addressApi';
import AddressMapPicker, { LocationCoordinates } from './AddressMapPicker';

export interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  addressToEdit?: CustomerAddress | null;
  onSaved: (address: CustomerAddress) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

const INSTRUCTION_SUGGESTIONS = [
  'Leave at reception / doorstep table',
  'Call upon arrival at main gate',
  'Leave with floor security guard',
  'Ring doorbell twice',
];

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  addressToEdit,
  onSaved,
  onShowToast,
}) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [houseFlatBuilding, setHouseFlatBuilding] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [addressType, setAddressType] = useState<AddressType>('Hostel');
  const [isDefault, setIsDefault] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  const [serviceability, setServiceability] = useState<ServiceabilityResult | null>(null);
  const [isCheckingServiceability, setIsCheckingServiceability] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // Populate form when editing or opening
  useEffect(() => {
    if (addressToEdit) {
      setFullName(addressToEdit.fullName);
      // Clean phone number for input
      const cleanPhone = addressToEdit.phoneNumber.replace(/^\+91\s*/, '').replace(/\s+/g, '');
      setPhoneNumber(cleanPhone);
      setHouseFlatBuilding(addressToEdit.houseFlatBuilding);
      setStreetArea(addressToEdit.streetArea);
      setLandmark(addressToEdit.landmark || '');
      setPostalCode(addressToEdit.postalCode);
      setCity(addressToEdit.city);
      setState(addressToEdit.state);
      setAddressType(addressToEdit.addressType);
      setIsDefault(addressToEdit.isDefault);
      setDeliveryInstructions(addressToEdit.deliveryInstructions || '');
      setLatitude(addressToEdit.latitude);
      setLongitude(addressToEdit.longitude);
      checkPinServiceability(addressToEdit.postalCode, addressToEdit.city);
    } else {
      // Defaults for new address
      setFullName('Sarah Mehta');
      setPhoneNumber('9777722222');
      setHouseFlatBuilding('');
      setStreetArea('');
      setLandmark('');
      setPostalCode('560092');
      setCity('Bengaluru');
      setState('Karnataka');
      setAddressType('Hostel');
      setIsDefault(false);
      setDeliveryInstructions('Leave on hostel reception drop table');
      setLatitude(13.0827);
      setLongitude(77.5877);
      checkPinServiceability('560092', 'Bengaluru');
    }
    setFormErrors({});
  }, [addressToEdit, isOpen]);

  // Check serviceability when 6-digit PIN code is typed
  const checkPinServiceability = async (pin: string, c?: string) => {
    const cleanPin = pin.trim();
    if (cleanPin.length === 6 && /^[1-9][0-9]{5}$/.test(cleanPin)) {
      setIsCheckingServiceability(true);
      try {
        const res = await addressApi.checkServiceability(cleanPin, c);
        setServiceability(res);
      } catch {
        setServiceability(null);
      } finally {
        setIsCheckingServiceability(false);
      }
    } else {
      setServiceability(null);
    }
  };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPostalCode(val);
    if (val.length === 6) {
      checkPinServiceability(val, city);
    } else {
      setServiceability(null);
    }
  };

  const handleCoordinatesSelected = (coords: LocationCoordinates) => {
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
    if (coords.postalCode) {
      setPostalCode(coords.postalCode);
      checkPinServiceability(coords.postalCode, coords.city || city);
    }
    if (coords.city) setCity(coords.city);
    if (coords.label && !landmark) {
      setLandmark(coords.label);
    }
    onShowToast?.('info', `Coordinates saved: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`, 'Location Pinned');
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phoneNumber = 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210)';
    }

    if (!houseFlatBuilding.trim()) {
      errors.houseFlatBuilding = 'House, flat, building, or room number is required';
    }

    if (!streetArea.trim()) {
      errors.streetArea = 'Street, area, locality, or sector is required';
    }

    if (!/^[1-9][0-9]{5}$/.test(postalCode.trim())) {
      errors.postalCode = 'PIN code must be a valid 6-digit number (e.g. 560092)';
    }

    if (!city.trim()) {
      errors.city = 'City is required';
    }

    if (!state.trim()) {
      errors.state = 'State is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12
        ? `+${cleanPhone}`
        : `+91 ${cleanPhone.slice(-10)}`;

      const input: CreateAddressInput = {
        fullName: fullName.trim(),
        phoneNumber: formattedPhone,
        houseFlatBuilding: houseFlatBuilding.trim(),
        streetArea: streetArea.trim(),
        landmark: landmark.trim() || undefined,
        postalCode: postalCode.trim(),
        city: city.trim(),
        state: state.trim(),
        addressType,
        isDefault,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        latitude,
        longitude,
      };

      let saved: CustomerAddress;
      if (addressToEdit) {
        saved = await addressApi.updateAddress(addressToEdit.id, input);
        onShowToast?.('success', 'Delivery address updated successfully.', 'Address Saved');
      } else {
        saved = await addressApi.createAddress(input);
        onShowToast?.('success', 'New delivery address added successfully.', 'Address Created');
      }

      onSaved(saved);
      onClose();
    } catch (err: any) {
      console.error('[AddressModal.handleSave]', err);
      const msg = err.message || 'Failed to save address. Please check your inputs.';
      setFormErrors({ form: msg });
      onShowToast?.('error', msg, 'Save Failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={isSaving ? () => {} : onClose}
        title={addressToEdit ? 'Edit Delivery Address' : 'Add Delivery Address'}
        subtitle="Save campus hostel or home delivery details with instant serviceability check"
        variant="bottomSheet"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="material-symbols-outlined text-[16px] text-emerald-700">lock</span>
              <span>Encrypted address storage</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={isSaving} onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? 'Saving...' : addressToEdit ? 'Save Changes' : 'Save Address'}
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4 text-left">
          {formErrors.form && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
              <span>{formErrors.form}</span>
            </div>
          )}

          {/* Map Coordinates Button */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#006030] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">pin_drop</span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Map Coordinates & GPS</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {latitude && longitude
                    ? `Pinned: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                    : 'Pin exact hostel gate or house location'}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMapPickerOpen(true)}
            >
              {latitude && longitude ? 'Change Pin' : 'Select on Map'}
            </Button>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sarah Mehta"
                className={`w-full h-10 px-3 rounded-xl bg-white border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006030] ${
                  formErrors.fullName ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                }`}
              />
              {formErrors.fullName && (
                <span className="text-[11px] text-red-600 font-medium">{formErrors.fullName}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">
                10-Digit Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-slate-500 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className={`w-full h-10 pl-11 pr-3 rounded-xl bg-white border text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006030] ${
                    formErrors.phoneNumber ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                  }`}
                />
              </div>
              {formErrors.phoneNumber && (
                <span className="text-[11px] text-red-600 font-medium">{formErrors.phoneNumber}</span>
              )}
            </div>
          </div>

          {/* Address Fields */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">
              Flat, House No., Building, Company, or Hostel Room <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={houseFlatBuilding}
              onChange={(e) => setHouseFlatBuilding(e.target.value)}
              placeholder="e.g. Hostel Block A, Room 204 or Flat 302, Green Meadows"
              className={`w-full h-10 px-3 rounded-xl bg-white border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006030] ${
                formErrors.houseFlatBuilding ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
              }`}
            />
            {formErrors.houseFlatBuilding && (
              <span className="text-[11px] text-red-600 font-medium">{formErrors.houseFlatBuilding}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">
              Area, Street, Sector, or Village <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={streetArea}
              onChange={(e) => setStreetArea(e.target.value)}
              placeholder="e.g. North Campus Road or 12th Main Road, Indiranagar"
              className={`w-full h-10 px-3 rounded-xl bg-white border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006030] ${
                formErrors.streetArea ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
              }`}
            />
            {formErrors.streetArea && (
              <span className="text-[11px] text-red-600 font-medium">{formErrors.streetArea}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">
              Landmark <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near University Gate 2 or Opposite City Park"
              className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006030]"
            />
          </div>

          {/* Postal Code, City & State with Serviceability Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  PIN Code <span className="text-red-500">*</span>
                </label>
                {isCheckingServiceability && (
                  <span className="text-[10px] text-emerald-700 animate-pulse">Checking...</span>
                )}
              </div>
              <input
                type="text"
                value={postalCode}
                onChange={handlePostalCodeChange}
                placeholder="6-digit PIN"
                className={`w-full h-10 px-3 rounded-xl bg-white border text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006030] ${
                  formErrors.postalCode ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                }`}
              />
              {formErrors.postalCode && (
                <span className="text-[11px] text-red-600 font-medium">{formErrors.postalCode}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">
                Town / City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru"
                className={`w-full h-10 px-3 rounded-xl bg-white border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006030] ${
                  formErrors.city ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                }`}
              />
              {formErrors.city && (
                <span className="text-[11px] text-red-600 font-medium">{formErrors.city}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Karnataka"
                className={`w-full h-10 px-3 rounded-xl bg-white border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006030] ${
                  formErrors.state ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                }`}
              />
              {formErrors.state && (
                <span className="text-[11px] text-red-600 font-medium">{formErrors.state}</span>
              )}
            </div>
          </div>

          {/* Real-time Serviceability Feedback Banner */}
          {serviceability && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 transition-all ${
                serviceability.isServiceable
                  ? serviceability.zone === 'campus'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-blue-50/80 border-blue-200 text-blue-900'
                  : 'bg-red-50/80 border-red-200 text-red-900'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
                {serviceability.isServiceable ? 'check_circle' : 'warning'}
              </span>
              <div>
                <div className="font-bold flex items-center gap-1.5">
                  <span>{serviceability.zoneName}</span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white/70">
                    {serviceability.zone === 'campus'
                      ? 'Free Campus Delivery'
                      : serviceability.zone === 'metro_city'
                      ? '₹40 Delivery Fee'
                      : 'Out of Zone'}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5 opacity-90">{serviceability.message}</p>
              </div>
            </div>
          )}

          {/* Address Type Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Address Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(['Hostel', 'Home', 'Work', 'Other'] as AddressType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAddressType(type)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    addressType === type
                      ? 'bg-[#006030] text-white border-[#006030] shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {type === 'Hostel'
                      ? 'school'
                      : type === 'Home'
                      ? 'home'
                      : type === 'Work'
                      ? 'work'
                      : 'location_on'}
                  </span>
                  <span>{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Instructions */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Delivery Instructions <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder="e.g. Leave on hostel reception drop table"
              className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006030]"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {INSTRUCTION_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDeliveryInstructions(sug)}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Set as Default Address Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-[#006030] focus:ring-emerald-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-800">
                Make this my default delivery address
              </span>
            </label>
          </div>
        </form>
      </Modal>

      {/* Embedded Map Picker Modal */}
      {isMapPickerOpen && (
        <AddressMapPicker
          isOpen={isMapPickerOpen}
          onClose={() => setIsMapPickerOpen(false)}
          initialLat={latitude || 13.0827}
          initialLng={longitude || 77.5877}
          onSelectCoordinates={handleCoordinatesSelected}
        />
      )}
    </>
  );
};

export default AddressModal;
