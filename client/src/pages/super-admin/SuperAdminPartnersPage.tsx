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
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-emerald-400 text-3xl">storefront</span>
            <h1 className="text-2xl font-bold text-white">Partner Kitchen Registry & Compliance</h1>
          </div>
          <p className="text-slate-400 text-sm">
            SuperAdmin authority for merchant onboarding, FSSAI verification, and emergency operational overrides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchVendors}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <span className="absolute left-3.5 top-2.5 text-slate-500 material-symbols-outlined text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by restaurant, branch, license..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === status
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Partners List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden">
        <h2 className="text-base font-bold text-white mb-4">
          Partner Establishments ({filteredVendors.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold text-xs uppercase">
                <th className="py-3 px-4">Restaurant & Branch</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">FSSAI License</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4">Store State</th>
                <th className="py-3 px-4 text-right">SuperAdmin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No partner kitchens found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-white">{vendor.name}</p>
                        <p className="text-xs text-slate-400">{vendor.branchName}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {vendor.city} • {vendor.phone || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-slate-300">{vendor.licenseNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          vendor.kycStatus === 'APPROVED'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : vendor.kycStatus === 'PENDING'
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                            : 'bg-red-950/80 text-red-400 border border-red-800'
                        }`}
                      >
                        {vendor.kycStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStoreLive(vendor.id, vendor.isStoreLive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                          vendor.isStoreLive
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${vendor.isStoreLive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <span>{vendor.isStoreLive ? 'Live' : 'Offline'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {vendor.kycStatus !== 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateKyc(vendor.id, 'APPROVED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                          >
                            Approve
                          </button>
                        )}
                        {vendor.kycStatus !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateKyc(vendor.id, 'REJECTED')}
                            className="px-2.5 py-1 rounded-lg bg-red-900/60 hover:bg-red-800 border border-red-700 text-red-200 text-xs font-bold"
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
