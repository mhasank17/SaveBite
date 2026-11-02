import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

interface AdminCustomersPageProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const AdminCustomersPage: React.FC<AdminCustomersPageProps> = ({ onShowToast }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCustomers();
      setCustomers(data);
    } catch {
      onShowToast('error', 'Failed to fetch customer directory.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  if (loading) return <LoadingState message="Loading registered customers..." />;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Customer Directory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800">
              {customers.length} Registered
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Verified customer accounts authorized to reserve meal deals and receive deliveries.
          </p>
        </div>

        <div className="w-full md:w-72">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* Directory Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No customers found"
          description="Try adjusting your search criteria."
          icon="group_off"
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Student / Customer</th>
                  <th className="py-3.5 px-4">University Email</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4 text-center">Meals Rescued</th>
                  <th className="py-3.5 px-4">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {c.fullName ? c.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span>{c.fullName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{c.email}</td>
                    <td className="py-3.5 px-4 text-slate-600">{c.phone || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                        CUSTOMER
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {c.ordersCount ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomersPage;
