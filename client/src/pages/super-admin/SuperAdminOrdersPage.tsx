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
    <div className="flex flex-col gap-6 pb-12">
      {/* SuperAdmin Order Stream Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-purple-400 text-3xl">receipt_long</span>
            <h1 className="text-2xl font-bold text-white">Platform Master Order Ledger</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Live order monitoring, payment settlement status, and customer counter pickup audits.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Refresh Ledger
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Marketplace GMV</span>
          <div className="text-2xl font-bold text-white mt-1">{formatINR(totalGmv)}</div>
          <span className="text-xs text-slate-400 mt-1 block">From {orders.length} real transactions</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform Commission (15%)</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{formatINR(platformCommission)}</div>
          <span className="text-xs text-emerald-400/80 mt-1 block">Earned platform margin</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Pickups</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {orders.filter((o) => o.orderStatus === 'COMPLETED').length} Orders
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Verified via OTP counter collection</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <span className="absolute left-3.5 top-2.5 text-slate-500 material-symbols-outlined text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search order number, student, restaurant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold overflow-x-auto max-w-full">
          {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden">
        <h2 className="text-base font-bold text-white mb-4">
          Recorded Orders ({filtered.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold text-xs uppercase">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Partner Kitchen</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white text-xs">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-white">{order.customer?.fullName || 'Campus Student'}</p>
                        <p className="text-xs text-slate-400">{order.customer?.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-semibold text-white">{order.restaurant?.name || 'Partner Kitchen'}</p>
                      <p className="text-slate-400">{order.restaurant?.branchName}</p>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400">
                      {formatINR(order.totalPriceInr || 0)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          order.paymentStatus === 'SUCCESS'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {order.paymentStatus || 'SUCCESS'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          order.orderStatus === 'COMPLETED'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : order.orderStatus === 'CONFIRMED'
                            ? 'bg-blue-950/80 text-blue-400 border border-blue-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
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
