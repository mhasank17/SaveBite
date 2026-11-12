import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';
import LoadingState from '../../components/common/LoadingState';
import { formatINR } from '../../utils/formatters';

interface SuperAdminOrdersPageProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const SuperAdminOrdersPage: React.FC<SuperAdminOrdersPageProps> = ({ onShowToast }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getOrders();
      setOrders(data);
    } catch {
      onShowToast('error', 'Failed to retrieve master order stream.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const totalGmv = orders
    .filter((o) => o.paymentStatus === 'SUCCESS')
    .reduce((sum, o) => sum + (o.totalPriceInr || 0), 0);
  const platformCommission = Math.round(totalGmv * 0.15);

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    const matchesSearch =
      (o.orderNumber && o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customer?.fullName && o.customer.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.restaurant?.name && o.restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (loading) return <LoadingState message="Loading master orders ledger..." />;

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* SuperAdmin Order Stream Header (Light Themed) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Master Order Ledger</h1>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Live order monitoring, payment settlement status, and customer counter pickup audits.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all border border-slate-200 flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Refresh Ledger
        </button>
      </div>

      {/* Metrics Row (Light Themed) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Marketplace GMV</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{formatINR(totalGmv)}</div>
          <span className="text-xs text-slate-500 mt-1 block">From {orders.length} real transactions</span>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform Commission (15%)</span>
          <div className="text-2xl font-bold text-purple-800 mt-1">{formatINR(platformCommission)}</div>
          <span className="text-xs text-slate-500 mt-1 block">Earned platform margin</span>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Pickups</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {orders.filter((o) => o.orderStatus === 'COMPLETED').length} Orders
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Verified via OTP counter collection</span>
        </div>
      </div>

      {/* Filter and Search Bar (Light Themed) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <span className="absolute left-3.5 top-2.5 text-slate-400 material-symbols-outlined text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search order number, student, restaurant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto max-w-full">
          {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-purple-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table (Light Themed) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm overflow-hidden">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Recorded Orders ({filtered.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Partner Kitchen</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-900">{order.customer?.fullName || 'Campus Student'}</p>
                        <p className="text-xs text-slate-500">{order.customer?.email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <p className="font-semibold text-slate-900">{order.restaurant?.name || 'Partner Kitchen'}</p>
                      <p className="text-slate-500">{order.restaurant?.branchName}</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {formatINR(order.totalPriceInr || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          order.paymentStatus === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {order.paymentStatus || 'SUCCESS'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          order.orderStatus === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : order.orderStatus === 'CONFIRMED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
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

export default SuperAdminOrdersPage;
