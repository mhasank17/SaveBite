import React, { useState, useEffect } from 'react';
import { MOCK_COMMUNITY_STATS } from '../../data/mockDeals';
import { formatINR } from '../../utils/formatters';
import { AuthUser, DEFAULT_CARTOON_AVATARS } from '../../services/authApi';
import addressApi, { CustomerAddress } from '../../services/addressApi';
import AddressModal from '../../components/customer/AddressModal';
import Button from '../../components/common/Button';

export interface AccountPageProps {
  onOpenLocationPicker: () => void;
  currentLocationName: string;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenAvatarSelector?: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  onOpenLocationPicker,
  currentLocationName,
  currentUser,
  onLogout,
  onOpenAvatarSelector,
  onShowToast,
}) => {
  const isCustomer = !!currentUser && currentUser.role === 'CUSTOMER';

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const fetchAddresses = async () => {
    if (!isCustomer) {
      setAddresses([]);
      setIsLoadingAddresses(false);
      return;
    }
    setIsLoadingAddresses(true);
    try {
      const list = await addressApi.getAddresses();
      setAddresses(list);
    } catch (err) {
      console.warn('[AccountPage] Failed to fetch addresses:', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [isCustomer]);

  if (!isCustomer || !currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 text-[#006030] flex items-center justify-center mx-auto mb-5 shadow-xs">
          <span className="material-symbols-outlined text-[40px]">person</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Welcome to SaveBite</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-8 leading-relaxed">
          Sign in to your customer account to view your past orders, manage delivery addresses, and save meals from local restaurants.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            type="button"
            variant="primary"
            onClick={onLogout ? onLogout : undefined}
            className="w-full sm:w-auto px-8 py-3 bg-[#006030] hover:bg-[#004d26] text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">login</span>
            <span>Sign In / Register</span>
          </Button>
        </div>
      </div>
    );
  }

  const name = currentUser.fullName;
  const email = currentUser.email;
  const phone = currentUser.phone || 'Not provided';
  const avatar = currentUser.avatarUrl || DEFAULT_CARTOON_AVATARS[0].url;

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const handleEditAddress = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setIsAddressModalOpen(true);
  };

  const handleSetDefault = async (id: string) => {
    setActionInProgressId(id);
    try {
      const updated = await addressApi.setDefaultAddress(id);
      setAddresses((prev) =>
        prev
          .map((a) => ({ ...a, isDefault: a.id === id }))
          .sort((a, b) => (b.id === id ? 1 : 0) - (a.id === id ? 1 : 0))
      );
      onShowToast?.(
        'success',
        `Default delivery address set to ${updated.houseFlatBuilding}`,
        'Default Updated'
      );
    } catch (err: any) {
      onShowToast?.('error', err.message || 'Failed to set default address.', 'Error');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const target = addresses.find((a) => a.id === id);
    const confirmDelete = window.confirm(
      `Remove delivery address "${target?.houseFlatBuilding || 'this address'}"?`
    );
    if (!confirmDelete) return;

    setActionInProgressId(id);
    try {
      await addressApi.deleteAddress(id);
      setAddresses((prev) => {
        const remaining = prev.filter((a) => a.id !== id);
        if (target?.isDefault && remaining.length > 0) {
          remaining[0].isDefault = true;
        }
        return remaining;
      });
      onShowToast?.('success', 'Delivery address removed successfully.', 'Address Removed');
    } catch (err: any) {
      onShowToast?.('error', err.message || 'Failed to remove address.', 'Error');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleAddressSaved = (saved: CustomerAddress) => {
    setAddresses((prev) => {
      const exists = prev.some((a) => a.id === saved.id);
      let updatedList: CustomerAddress[];
      if (exists) {
        updatedList = prev.map((a) => {
          if (a.id === saved.id) return saved;
          if (saved.isDefault) return { ...a, isDefault: false };
          return a;
        });
      } else {
        updatedList = saved.isDefault
          ? [saved, ...prev.map((a) => ({ ...a, isDefault: false }))]
          : [...prev, saved];
      }
      return updatedList.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
    });
  };

  return (
    <div className="flex flex-col gap-5 w-full pb-20 max-w-2xl mx-auto pt-2 px-4">
      {/* Profile Header */}
      <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onOpenAvatarSelector}
            className="relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-full"
            title="Click to change your cartoon avatar"
            aria-label="Change cartoon avatar"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-600/30 shadow-xs shrink-0 bg-emerald-50 transition-transform group-hover:scale-105">
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#006030] text-white flex items-center justify-center shadow-xs border-2 border-white group-hover:bg-emerald-700 transition-colors">
              <span className="material-symbols-outlined text-[13px]">edit</span>
            </div>
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-lg text-slate-900">{name}</h2>
              <span className="bg-emerald-100 text-[#006030] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Verified Member
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">{email}</p>
            <p className="text-xs text-slate-400 mt-0.5">{phone}</p>
            {onOpenAvatarSelector && (
              <button
                type="button"
                onClick={onOpenAvatarSelector}
                className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-semibold mt-1 w-fit group"
              >
                <span>Change avatar</span>
                <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Environmental Impact Summary */}
      <section className="bg-[#006030] text-white rounded-3xl p-5 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-emerald-300">
              eco
            </span>
            <h3 className="font-bold text-sm">Your Environmental Impact</h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-200">Verified Rescue</span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 flex flex-col items-center text-center">
            <span className="text-xl font-bold text-white">
              {MOCK_COMMUNITY_STATS.mealsSavedUser}
            </span>
            <span className="text-[11px] text-emerald-200 mt-0.5">Meals Rescued</span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 flex flex-col items-center text-center">
            <span className="text-xl font-bold text-white">
              {MOCK_COMMUNITY_STATS.co2ePreventedUserKg} kg
            </span>
            <span className="text-[11px] text-emerald-200 mt-0.5">CO₂e Prevented</span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 flex flex-col items-center text-center">
            <span className="text-xl font-bold text-white">
              {formatINR(MOCK_COMMUNITY_STATS.moneySavedUserInr)}
            </span>
            <span className="text-[11px] text-emerald-200 mt-0.5">Money Saved</span>
          </div>
        </div>
      </section>

      {/* Saved Delivery Addresses Section */}
      <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">home_pin</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Saved Delivery Addresses</h3>
              <p className="text-[11px] text-slate-500">Manage saved home, work, and campus delivery addresses</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddNewAddress}
            className="text-xs"
          >
            <span className="material-symbols-outlined text-[16px] mr-1">add</span>
            <span>Add Address</span>
          </Button>
        </div>

        {/* Addresses List */}
        {isLoadingAddresses ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
            <span className="material-symbols-outlined text-[28px] animate-spin text-[#006030]">
              refresh
            </span>
            <span className="text-xs">Loading saved delivery addresses...</span>
          </div>
        ) : addresses.length === 0 ? (
          <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">location_off</span>
            </div>
            <p className="text-xs font-semibold text-slate-700">No delivery addresses saved yet</p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Add your home, office, or campus address for fast 1-click delivery checkout.
            </p>
            <Button variant="primary" size="sm" onClick={handleAddNewAddress} className="mt-1">
              + Add First Address
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-1">
            {addresses.map((addr) => {
              const isCampus = addr.serviceableZone === 'campus' || addr.addressType === 'Hostel';
              return (
                <div
                  key={addr.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    addr.isDefault
                      ? 'border-[#006030]/40 bg-emerald-50/30 shadow-xs'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Top Bar: Type, Badges & Actions */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Address Type Chip */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        <span className="material-symbols-outlined text-[13px]">
                          {addr.addressType === 'Hostel'
                            ? 'school'
                            : addr.addressType === 'Home'
                            ? 'home'
                            : addr.addressType === 'Work'
                            ? 'work'
                            : 'location_on'}
                        </span>
                        <span>{addr.addressType}</span>
                      </span>

                      {/* Default Badge */}
                      {addr.isDefault && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#006030] text-white">
                          <span className="material-symbols-outlined text-[12px]">check</span>
                          <span>Default</span>
                        </span>
                      )}

                      {/* Serviceability Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          addr.isServiceable
                            ? isCampus
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {addr.isServiceable
                          ? isCampus
                            ? 'Express Free Delivery'
                            : 'Metro Delivery (₹40)'
                          : 'Out of Service Zone'}
                      </span>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditAddress(addr)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                        title="Edit address"
                        aria-label="Edit address"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        type="button"
                        disabled={actionInProgressId === addr.id}
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Delete address"
                        aria-label="Delete address"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Address Body */}
                  <div className="flex flex-col gap-0.5 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{addr.fullName}</span>
                      <span className="font-mono text-slate-500 font-normal">{addr.phoneNumber}</span>
                    </div>
                    <div className="text-slate-700">
                      {addr.houseFlatBuilding}, {addr.streetArea}
                    </div>
                    {addr.landmark && (
                      <div className="text-slate-500 text-[11px]">
                        Landmark: {addr.landmark}
                      </div>
                    )}
                    <div className="text-slate-600 font-medium">
                      {addr.city}, {addr.state} - <span className="font-mono">{addr.postalCode}</span>
                    </div>

                    {addr.deliveryInstructions && (
                      <div className="mt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-slate-400 shrink-0 mt-0.5">
                          chat
                        </span>
                        <span>Instructions: {addr.deliveryInstructions}</span>
                      </div>
                    )}

                    {addr.latitude && addr.longitude && (
                      <div className="text-[10px] text-emerald-800 font-mono flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-[12px]">my_location</span>
                        <span>GPS Coordinates: {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}</span>
                      </div>
                    )}
                  </div>

                  {/* Set as Default Action (if not already default) */}
                  {!addr.isDefault && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        disabled={actionInProgressId === addr.id}
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-xs font-bold text-[#006030] hover:text-emerald-800 hover:underline inline-flex items-center gap-1 disabled:opacity-40"
                      >
                        <span>Set as Default Delivery Address</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Account Settings & Preferences */}
      <section className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col gap-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
          Delivery Preferences
        </h3>

        <button
          type="button"
          onClick={onOpenLocationPicker}
          className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006030] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">pin_drop</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900">Delivery Address</span>
              <span className="text-xs text-slate-500">{currentLocationName}</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[20px]">
            chevron_right
          </span>
        </button>

        <div className="h-px bg-slate-100 my-2" />

        <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs text-emerald-900 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-emerald-700 text-[20px] shrink-0">
            security
          </span>
          <div>
            <strong>Secure Handover:</strong> For resident and courier safety, meals are delivered directly to your verified address or designated reception point.
          </div>
        </div>

        {/* Sign Out Button */}
        {onLogout && (
          <div className="pt-3">
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-3 px-4 rounded-2xl border border-red-100 bg-red-50/60 hover:bg-red-100 text-red-700 font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Sign Out of Customer Account</span>
            </button>
          </div>
        )}
      </section>

      {/* Address Edit / Add Modal */}
      {isAddressModalOpen && (
        <AddressModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          addressToEdit={editingAddress}
          onSaved={handleAddressSaved}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};

export default AccountPage;
