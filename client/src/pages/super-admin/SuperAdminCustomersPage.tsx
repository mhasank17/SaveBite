import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import LoadingState from '../../components/common/LoadingState';
import { formatINR } from '../../utils/formatters';

export interface CustomerRecord {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  ordersCount?: number;
  totalMealsRescued?: number;
  totalSpentInr?: number;
  createdAt: string;
}

interface SuperAdminCustomersPageProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const SuperAdminCustomersPage: React.FC<SuperAdminCustomersPageProps> = ({ onShowToast }) => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCustomers();
      setCustomers(data);
    } catch {
      onShowToast('error', 'Unable to retrieve customer accounts', 'Load Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  if (loading) {
    return <LoadingState message="Loading customer account registry..." />;
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Header (Light Themed) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-[24px]">group</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campus Customer Directory</h1>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Auditing campus student & faculty consumer accounts, meal rescue volumes, and dispute histories.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCustomers}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all border border-slate-200 flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Refresh
        </button>
      </div>

      {/* Search (Light Themed) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="relative w-full sm:w-96">
          <span className="absolute left-3.5 top-2.5 text-slate-400 material-symbols-outlined text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by student name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600"
          />
        </div>
      </div>

      {/* Customers Table (Light Themed) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm overflow-hidden">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Registered Campus Consumers ({filtered.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Consumer</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Orders Placed</th>
                <th className="py-3 px-4">Rescued Meals</th>
                <th className="py-3 px-4">Lifetime Spend</th>
                <th className="py-3 px-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No customers found matching the search.
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            customer.avatarUrl ||
                            `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(customer.fullName)}`
                          }
                          alt={customer.fullName}
                          className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{customer.fullName}</p>
                          <p className="text-xs text-slate-500">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                      {customer.phone || 'Not linked'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{customer.ordersCount || 0}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        <span className="material-symbols-outlined text-[15px]">lunch_dining</span>
                        {customer.totalMealsRescued || customer.ordersCount || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {formatINR(customer.totalSpentInr || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(customer.createdAt).toLocaleDateString()}
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

export default SuperAdminCustomersPage;
