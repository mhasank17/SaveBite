import React, { useState, useEffect, useMemo } from 'react';
import { LocationOption } from '../../data/mockDeals';
import addressApi, { CustomerAddress } from '../../services/addressApi';
import AddressModal from './AddressModal';

export interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: LocationOption;
  currentRadiusKm?: number;
  onSelectLocation?: (location: LocationOption, radiusKm?: number) => void;
  onSelectAddress?: (address: CustomerAddress) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
  onSelectAddress,
  onShowToast,
}) => {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'Home' | 'Work' | 'Hostel' | 'Other'>('ALL');

  // Address modal controls for Add / Edit
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<CustomerAddress | null>(null);

  // Load addresses on open
  const loadAddresses = async () => {
    setIsLoading(true);
    try {
      const list = await addressApi.getAddresses();
      setAddresses(list);

      // Determine initial selection: saved in localStorage, or matching currentLocation, or default, or first
      const storedId = localStorage.getItem('savebite_selected_address_id');
      const matched = storedId
        ? list.find((a) => a.id === storedId)
        : currentLocation?.id
        ? list.find((a) => a.id === currentLocation.id)
        : null;
      const defaultAddr = matched || list.find((a) => a.isDefault) || list[0];

      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (err) {
      console.error('[LocationPickerModal] Failed to load addresses', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAddresses();
      setSearchQuery('');
      setFilterType('ALL');
    }
  }, [isOpen]);

  // Filter addresses by query and category
  const filteredAddresses = useMemo(() => {
    return addresses.filter((addr) => {
      if (filterType !== 'ALL' && addr.addressType !== filterType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const combined = `${addr.fullName} ${addr.houseFlatBuilding} ${addr.streetArea} ${addr.landmark || ''} ${addr.city} ${addr.postalCode} ${addr.state}`.toLowerCase();
        return combined.includes(q);
      }
      return true;
    });
  }, [addresses, filterType, searchQuery]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];

  const handleOpenAddModal = () => {
    setAddressToEdit(null);
    setIsAddressModalOpen(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, addr: CustomerAddress) => {
    e.stopPropagation();
    setAddressToEdit(addr);
    setIsAddressModalOpen(true);
  };

  const handleAddressSaved = (savedAddr: CustomerAddress) => {
    setIsAddressModalOpen(false);
    setAddressToEdit(null);
    loadAddresses();
    setSelectedAddressId(savedAddr.id);
    localStorage.setItem('savebite_selected_address_id', savedAddr.id);
    onShowToast?.('success', `Address saved: ${savedAddr.houseFlatBuilding}, ${savedAddr.streetArea}`, 'Address Saved');
  };

  const handleConfirm = () => {
    if (!selectedAddress) {
      onClose();
      return;
    }

    if (!selectedAddress.isServiceable) {
      onShowToast?.(
        'error',
        'Selected address is outside our delivery zone. Please choose a serviceable address or add a new one.',
        'Address Not Serviceable'
      );
      return;
    }

    // Persist selected address ID
    localStorage.setItem('savebite_selected_address_id', selectedAddress.id);

    // Call address callback if provided
    onSelectAddress?.(selectedAddress);

    // Construct LocationOption
    const loc: LocationOption = {
      id: selectedAddress.id,
      name: `${selectedAddress.houseFlatBuilding}, ${selectedAddress.streetArea}`,
      district: selectedAddress.city,
      distanceKm: selectedAddress.serviceableZone === 'campus' ? 1.5 : 4.0,
      isApproved: selectedAddress.isServiceable,
      type: selectedAddress.addressType.toLowerCase(),
    };

    onSelectLocation?.(loc);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-fade-in">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
          
          {/* Header */}
          <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006030] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">location_on</span>
              </div>
              <div>
                <h2 className="font-extrabold text-base md:text-lg text-slate-900 leading-tight">
                  Select Delivery Address
                </h2>
                <p className="text-xs text-slate-500">
                  Choose where your food deals should be delivered
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#006030] hover:bg-[#004d26] active:scale-95 text-white text-xs font-bold transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add Address</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </header>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            
            {/* Delivery Notice Banner */}
            <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/60 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#006030] text-[20px] shrink-0 mt-0.5">
                electric_moped
              </span>
              <div className="flex flex-col text-xs text-emerald-950">
                <span className="font-bold">Doorstep Delivery Available</span>
                <span className="text-emerald-800 leading-relaxed mt-0.5">
                  Orders are prepared fresh by partner kitchens and delivered directly to your doorstep across designated campus, residential, and commercial zones.
                </span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative flex items-center bg-slate-50 rounded-2xl px-3.5 py-1 focus-within:ring-2 focus-within:ring-[#006030] focus-within:bg-white transition-all border border-slate-200">
              <span className="material-symbols-outlined text-slate-400 text-[20px] pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by street, building, city, or PIN code..."
                className="w-full h-10 pl-2.5 pr-8 bg-transparent text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            {addresses.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {(['ALL', 'Home', 'Work', 'Hostel', 'Other'] as const).map((type) => {
                  const isSelected = filterType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {type === 'ALL' ? 'All Addresses' : type}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Address Cards List */}
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <span className="material-symbols-outlined animate-spin text-[32px] text-[#006030]">
                  progress_activity
                </span>
                <span className="text-xs font-semibold">Loading delivery addresses...</span>
              </div>
            ) : filteredAddresses.length > 0 ? (
              <div className="flex flex-col gap-3">
                {filteredAddresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  const isCampusZone = addr.serviceableZone === 'campus' || addr.addressType === 'Hostel';

                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`relative p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2.5 ${
                        isSelected
                          ? 'bg-emerald-50/50 border-[#006030] shadow-sm ring-2 ring-[#006030]'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Top Row: Address Type, Default Pill, Serviceability Badge, and Edit Button */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          {/* Radio indicator */}
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-[#006030] bg-[#006030]'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>

                          {/* Address Type Icon & Text */}
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                            <span className="material-symbols-outlined text-[14px]">
                              {addr.addressType === 'Home'
                                ? 'home'
                                : addr.addressType === 'Work'
                                ? 'work'
                                : addr.addressType === 'Hostel'
                                ? 'apartment'
                                : 'pin_drop'}
                            </span>
                            <span>{addr.addressType}</span>
                          </span>

                          {/* Default badge */}
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 rounded-lg bg-[#006030] text-white text-[10px] font-bold uppercase tracking-wider">
                              Default
                            </span>
                          )}
                        </div>

                        {/* Serviceability & Delivery Info */}
                        <div className="flex items-center gap-2">
                          {addr.isServiceable ? (
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${
                                isCampusZone
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-50 text-blue-800 border border-blue-200'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                {isCampusZone ? 'bolt' : 'local_shipping'}
                              </span>
                              <span>
                                {isCampusZone ? 'Express Zone • FREE Delivery' : 'Metro Zone • ₹40 Delivery'}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-red-100 text-red-800">
                              <span className="material-symbols-outlined text-[13px]">cancel</span>
                              <span>Out of Zone</span>
                            </span>
                          )}

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditModal(e, addr)}
                            className="p-1 rounded-lg text-slate-400 hover:text-[#006030] hover:bg-emerald-50 transition-colors"
                            title="Edit Address"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                        </div>
                      </div>

                      {/* Recipient details */}
                      <div className="flex flex-col text-xs text-slate-800 pl-6">
                        <div className="font-bold text-sm text-slate-900">
                          {addr.houseFlatBuilding}
                        </div>
                        <div className="text-slate-600 mt-0.5 leading-relaxed">
                          {addr.streetArea}
                          {addr.landmark ? `, near ${addr.landmark}` : ''}, {addr.city} - {addr.postalCode}, {addr.state}
                        </div>
                        <div className="text-slate-500 mt-1 flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{addr.fullName}</span>
                          <span>•</span>
                          <span>{addr.phoneNumber}</span>
                        </div>

                        {addr.deliveryInstructions && (
                          <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-start gap-1.5">
                            <span className="material-symbols-outlined text-slate-400 text-[14px] shrink-0 mt-0.5">
                              info
                            </span>
                            <span className="italic">&ldquo;{addr.deliveryInstructions}&rdquo;</span>
                          </div>
                        )}
                      </div>

                      {/* Warning if unserviceable */}
                      {!addr.isServiceable && (
                        <div className="mt-1 p-2 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-red-600 text-[15px] shrink-0">
                            warning
                          </span>
                          <span>
                            This address is outside our delivery area. Choose a serviceable address to place orders.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="py-10 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100/80 text-[#006030] flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[28px]">home_pin</span>
                </div>
                <div className="flex flex-col gap-1 max-w-sm">
                  <span className="font-extrabold text-sm text-slate-900">
                    {searchQuery ? 'No matching addresses found' : 'No delivery addresses saved yet'}
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {searchQuery
                      ? `We couldn't find any saved address matching "${searchQuery}".`
                      : 'Add your home, office, or campus address for fast 1-click delivery checkout.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006030] hover:bg-[#004d26] text-white text-xs font-bold transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">add_location_alt</span>
                  <span>Add New Delivery Address</span>
                </button>
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <footer className="p-4 md:px-6 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between gap-4">
            <div className="hidden sm:flex flex-col text-xs min-w-0">
              <span className="text-slate-400">Selected destination:</span>
              <span className="font-bold text-slate-800 truncate max-w-xs">
                {selectedAddress
                  ? `${selectedAddress.houseFlatBuilding}, ${selectedAddress.streetArea}`
                  : 'None selected'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedAddress || !selectedAddress.isServiceable}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#006030] hover:bg-[#004d26] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Confirm Delivery Address</span>
                <span className="material-symbols-outlined text-[16px]">check</span>
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* Embedded AddressModal for Add & Edit */}
      {isAddressModalOpen && (
        <AddressModal
          isOpen={isAddressModalOpen}
          onClose={() => {
            setIsAddressModalOpen(false);
            setAddressToEdit(null);
          }}
          addressToEdit={addressToEdit}
          onSaved={handleAddressSaved}
          onShowToast={onShowToast}
        />
      )}
    </>
  );
};

export default LocationPickerModal;
