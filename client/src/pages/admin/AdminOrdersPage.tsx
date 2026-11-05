import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

interface AdminOrdersPageProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const AdminOrdersPage: React.FC<AdminOrdersPageProps> = ({ onShowToast }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getOrders();
      setOrders(data);
    } catch {
      onShowToast('error', 'Failed to fetch platform orders.', 'Connection Error');
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

  const filtered = orders.filter(
    (o) => statusFilter === 'ALL' || o.orderStatus === statusFilter
  );

  if (loading) return <LoadingState message="Loading genuine platform orders..." />;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Financials Header */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Platform GMV
          </span>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
            ₹{totalGmv.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Calculated strictly from {orders.length} real orders
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Platform Commission (15%)
          </span>
          <div className="text-2xl md:text-3xl font-extrabold text-emerald-700 mt-1">
            ₹{platformCommission.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-emerald-600 mt-1 block">
            Retained university operations margin
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Merchant Net Payable
          </span>
          <div className="text-2xl md:text-3xl font-extrabold text-orange-600 mt-1">
            ₹{(totalGmv - platformCommission).toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-orange-600 mt-1 block">
            Disbursed to verified restaurant partners
          </span>
        </div>
      </section>

      {/* Filter and Title */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Orders Stream</h1>
          <p className="text-sm text-slate-500 mt-1">
            Genuine customer reservations and counter pickup orders across all merchants.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </section>

      {/* Orders Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title={orders.length === 0 ? "No orders yet" : "No orders found"}
          description={
            orders.length === 0
              ? "Customer orders across all restaurants will appear here in real-time."
              : "There are currently no orders matching this filter."
          }
          icon="receipt_long"
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Order Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Restaurant</th>
                  <th className="py-3.5 px-4">Meal Deal</th>
                  <th className="py-3.5 px-4">Fulfillment Mode</th>
                  <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {o.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{o.customerName}</div>
                      <div className="text-xs text-slate-400 font-mono">{o.customerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{o.restaurantName}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate">
                      {o.dealTitle} ({o.quantity}x)
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs font-medium">
                        <span className="material-symbols-outlined text-[14px]">storefront</span>
                        <span>Counter Pickup</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{o.totalPriceInr}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          o.orderStatus === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.orderStatus === 'CONFIRMED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {o.orderStatus}
                      </span>
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

export default AdminOrdersPage;
