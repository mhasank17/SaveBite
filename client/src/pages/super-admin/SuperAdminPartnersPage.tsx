import React, { useState, useEffect } from 'react';
import adminApi, { AdminVendor } from '../../services/adminApi';
import LoadingState from '../../components/common/LoadingState';

interface SuperAdminPartnersPageProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const SuperAdminPartnersPage: React.FC<SuperAdminPartnersPageProps> = ({ onShowToast }) => {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getVendors();
      setVendors(data);
    } catch {
      onShowToast('error', 'Failed to retrieve partner directory', 'Load Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleUpdateKyc = async (vendorId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      await adminApi.updateVendorKyc(vendorId, newStatus);
      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, kycStatus: newStatus } : v))
      );
      onShowToast('success', `Partner status updated to ${newStatus}.`, 'KYC Updated');
    } catch {
      onShowToast('error', 'Could not update partner KYC status.', 'Action Failed');
    }
  };

  const handleToggleStoreLive = async (vendorId: string, currentLive: boolean) => {
    try {
      await adminApi.toggleVendorStatus(vendorId, !currentLive);
      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, isStoreLive: !currentLive } : v))
      );
      onShowToast('info', `Store visibility is now ${!currentLive ? 'LIVE' : 'OFFLINE'}.`, 'Store Updated');
    } catch {
      onShowToast('error', 'Failed to toggle store live status.', 'Action Failed');
    }
  };

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.kycStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingState message="Loading partner kitchen registry..." />;
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Header (Light Themed) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-[24px]">storefront</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Partner Kitchen Registry & Compliance</h1>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            SuperAdmin authority for merchant onboarding, FSSAI verification, and emergency operational overrides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchVendors}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all border border-slate-200 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Filter & Search Bar (Light Themed) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <span className="absolute left-3.5 top-2.5 text-slate-400 material-symbols-outlined text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by restaurant, branch, license..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === status
                  ? 'bg-purple-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Partners List (Light Themed) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm overflow-hidden">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Partner Establishments ({filteredVendors.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Restaurant & Branch</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">FSSAI License</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4">Store State</th>
                <th className="py-3 px-4 text-right">SuperAdmin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No partner kitchens found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{vendor.name}</p>
                        <p className="text-xs text-slate-500">{vendor.branchName}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {vendor.city} • {vendor.phone || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs text-slate-700">{vendor.licenseNumber}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          vendor.kycStatus === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : vendor.kycStatus === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {vendor.kycStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStoreLive(vendor.id, vendor.isStoreLive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                          vendor.isStoreLive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${vendor.isStoreLive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{vendor.isStoreLive ? 'Live' : 'Offline'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {vendor.kycStatus !== 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateKyc(vendor.id, 'APPROVED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs"
                          >
                            Approve
                          </button>
                        )}
                        {vendor.kycStatus !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateKyc(vendor.id, 'REJECTED')}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPartnersPage;
