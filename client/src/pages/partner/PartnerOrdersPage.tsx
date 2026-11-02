import React, { useState, useEffect } from 'react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import partnerApi from '../../services/partnerApi';

export interface PartnerOrderSummary {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  dealTitle: string;
  quantity: number;
  totalPriceInr: number;
  orderStatus: 'PENDING_PAYMENT' | 'CONFIRMED' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  pickupOtp?: string;
  placedAt: string;
  pickupWindow?: string;
  fulfillmentType?: 'PICKUP' | 'DELIVERY';
}

export interface PartnerOrdersPageProps {
  onOpenVerifyOtpModal: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const PartnerOrdersPage: React.FC<PartnerOrdersPageProps> = ({
  onOpenVerifyOtpModal,
  onShowToast,
}) => {
  const [orders, setOrders] = useState<PartnerOrderSummary[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('PENDING');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await partnerApi.getOrders();
      if (data && data.length > 0) {
        setOrders(data);
      } else {
        // Fallback demo orders matching Indian bakery context
        setOrders([
          {
            id: 'demo-order-1',
            orderNumber: 'SB-20261024-8492',
            customerName: 'Sarah Jenkins',
            customerPhone: '+91 98200 11223',
            dealTitle: '[Demo] Evening Mystery Patisserie & Sourdough Bag',
            quantity: 1,
            totalPriceInr: 149,
            orderStatus: 'CONFIRMED',
            pickupOtp: '8492',
            placedAt: '12 mins ago',
            pickupWindow: 'Tonight, 8:00 PM – 9:00 PM',
            fulfillmentType: 'PICKUP',
          },
          {
            id: 'demo-order-2',
            orderNumber: 'SB-20261024-3310',
            customerName: 'Rahul Sharma',
            customerPhone: '+91 98190 44556',
            dealTitle: '[Demo] Evening Mystery Patisserie & Sourdough Bag',
            quantity: 2,
            totalPriceInr: 298,
            orderStatus: 'READY_FOR_PICKUP',
            pickupOtp: '3310',
            placedAt: '28 mins ago',
            pickupWindow: 'Tonight, 8:00 PM – 9:00 PM',
            fulfillmentType: 'PICKUP',
          },
          {
            id: 'demo-order-3',
            orderNumber: 'SB-20261024-1102',
            customerName: 'Priya Mehta',
            customerPhone: '+91 97690 77889',
            dealTitle: '[Demo] Artisan Baguette & Brioche Hearth Bundle',
            quantity: 1,
            totalPriceInr: 120,
            orderStatus: 'COMPLETED',
            placedAt: '1 hr ago',
            pickupWindow: 'Collected at 18:45 IST',
            fulfillmentType: 'PICKUP',
          },
          {
            id: 'demo-order-4',
            orderNumber: 'SB-20261024-0985',
            customerName: 'Amit Patel',
            customerPhone: '+91 98210 99001',
            dealTitle: '[Demo] Evening Mystery Patisserie & Sourdough Bag',
            quantity: 1,
            totalPriceInr: 149,
            orderStatus: 'COMPLETED',
            placedAt: '2 hrs ago',
            pickupWindow: 'Collected at 17:30 IST',
            fulfillmentType: 'PICKUP',
          },
        ]);
      }
    } catch {
      onShowToast('error', 'Could not load orders. Showing offline copy.', 'Network Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const pendingOrders = orders.filter(
    (o) => o.orderStatus === 'CONFIRMED' || o.orderStatus === 'READY_FOR_PICKUP'
  );
  const completedOrders = orders.filter((o) => o.orderStatus === 'COMPLETED');
  const cancelledOrders = orders.filter((o) => o.orderStatus === 'CANCELLED');

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return o.orderStatus === 'CONFIRMED' || o.orderStatus === 'READY_FOR_PICKUP';
    if (filter === 'COMPLETED') return o.orderStatus === 'COMPLETED';
    if (filter === 'CANCELLED') return o.orderStatus === 'CANCELLED';
    return true;
  });

  return (
    <div className="flex flex-col gap-space-md animate-fade-in pb-12">
      {/* Header bar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-space-md md:p-space-lg rounded-3xl border border-outline-variant/30 shadow-xs">
        <div className="flex flex-col">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Counter Pickup & Orders
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Verify customer 4-digit pickup OTPs at the counter to securely hand over reserved deals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={fetchOrders}
            leftIcon={<span className="material-symbols-outlined text-[18px]">refresh</span>}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onOpenVerifyOtpModal}
            leftIcon={<span className="material-symbols-outlined text-[20px]">pin</span>}
          >
            Verify Pickup OTP
          </Button>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setFilter('PENDING')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'PENDING'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Pending Pickups ({pendingOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'ALL'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
          }`}
        >
          All Orders ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('COMPLETED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'COMPLETED'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Completed ({completedOrders.length})
        </button>
        {cancelledOrders.length > 0 && (
          <button
            type="button"
            onClick={() => setFilter('CANCELLED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'CANCELLED'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Cancelled ({cancelledOrders.length})
          </button>
        )}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-on-surface-variant">Fetching partner orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon="receipt_long"
          title="No orders found"
          description={
            filter === 'PENDING'
              ? 'No customers are currently waiting for pickup.'
              : `No orders matching status "${filter}".`
          }
          actionText="Verify Counter OTP"
          onAction={onOpenVerifyOtpModal}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredOrders.map((order) => {
            const isPending = order.orderStatus === 'CONFIRMED' || order.orderStatus === 'READY_FOR_PICKUP';

            return (
              <div
                key={order.id}
                className="bg-surface-container-lowest p-4 md:p-5 rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-outline-variant/60 transition-all"
              >
                {/* Order Details Left */}
                <div className="flex items-start gap-4">
                  {/* Customer Avatar */}
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                    {(order.customerName || 'C').charAt(0).toUpperCase()}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-on-surface tracking-wide">
                        {order.orderNumber}
                      </span>
                      {isPending ? (
                        <Badge variant="urgent" pulseDot pulseColor="secondary">
                          Awaiting Counter Pickup
                        </Badge>
                      ) : order.orderStatus === 'COMPLETED' ? (
                        <Badge variant="verified">
                          Collected & Verified
                        </Badge>
                      ) : (
                        <Badge variant="error">
                          Cancelled
                        </Badge>
                      )}
                      <span className="text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full font-medium">
                        {order.fulfillmentType || 'PICKUP'}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-on-surface mt-1">
                      {order.quantity}x {order.dealTitle}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-0.5 flex-wrap">
                      <span>Customer: <strong>{order.customerName || 'Anonymous Customer'}</strong></span>
                      {order.customerPhone && (
                        <>
                          <span>•</span>
                          <span>{order.customerPhone}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Placed: {order.placedAt}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Payment & Counter Action */}
                <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-outline-variant/20">
                  <div className="flex flex-col md:items-end">
                    <span className="text-[11px] text-on-surface-variant font-medium">Customer Paid</span>
                    <span className="font-title-md text-title-md font-bold text-primary">
                      ₹{order.totalPriceInr}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      {order.pickupWindow || 'Tonight'}
                    </span>
                  </div>

                  {isPending && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onOpenVerifyOtpModal}
                      leftIcon={<span className="material-symbols-outlined text-[16px]">pin</span>}
                    >
                      Verify Pass
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PartnerOrdersPage;
