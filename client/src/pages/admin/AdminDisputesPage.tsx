import React, { useEffect, useState } from 'react';
import adminApi, { AdminDispute } from '../../services/adminApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

interface AdminDisputesPageProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const AdminDisputesPage: React.FC<AdminDisputesPageProps> = ({ onShowToast }) => {
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Resolution modal state
  const [selectedDispute, setSelectedDispute] = useState<AdminDispute | null>(null);
  const [resolutionType, setResolutionType] = useState<'RESOLVED_REFUNDED' | 'RESOLVED_REJECTED'>(
    'RESOLVED_REFUNDED'
  );
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getDisputes();
      setDisputes(data);
    } catch {
      onShowToast('error', 'Failed to load customer disputes.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleOpenResolution = (
    dispute: AdminDispute,
    type: 'RESOLVED_REFUNDED' | 'RESOLVED_REJECTED'
  ) => {
    setSelectedDispute(dispute);
    setResolutionType(type);
    setRefundAmount(dispute.refundAmountInr || dispute.order?.totalPriceInr || 149);
    setAdminNotes(
      type === 'RESOLVED_REFUNDED'
        ? 'Confirmed outlet closure before pickup window expiry. Full refund issued to original payment method.'
        : 'Quality claim investigated; evidence verified with merchant. Dispute rejected.'
    );
  };

  const handleConfirmResolution = async () => {
    if (!selectedDispute) return;
    setIsSubmitting(true);
    try {
      await adminApi.resolveDispute(
        selectedDispute.id,
        resolutionType,
        resolutionType === 'RESOLVED_REFUNDED' ? refundAmount : 0,
        adminNotes
      );

      setDisputes((prev) =>
        prev.map((d) =>
          d.id === selectedDispute.id
            ? {
                ...d,
                status: resolutionType,
                refundAmountInr: resolutionType === 'RESOLVED_REFUNDED' ? refundAmount : 0,
                adminNotes,
                resolvedAt: new Date().toISOString(),
              }
            : d
        )
      );

      onShowToast(
        'success',
        `Dispute ${selectedDispute.id} resolved (${resolutionType}).`,
        'Resolution Recorded'
      );
      setSelectedDispute(null);
    } catch {
      onShowToast('error', 'Failed to resolve dispute.', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'OPEN') return d.status === 'OPEN' || d.status === 'UNDER_REVIEW';
    if (filterStatus === 'RESOLVED')
      return (
        d.status === 'RESOLVED' ||
        d.status === 'RESOLVED_REFUNDED' ||
        d.status === 'RESOLVED_REJECTED' ||
        d.status === 'REJECTED'
      );
    return d.status === filterStatus;
  });

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-sm text-2xl font-bold text-on-surface">
              Customer Disputes & Refund Arbitration
            </h1>
            <Badge variant="neutral">{disputes.length} Cases</Badge>
          </div>
          <p className="font-body-sm text-on-surface-variant text-sm mt-0.5">
            Fair customer resolution queue for late counter closures, unmet food quality standards, or unverified orders.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchDisputes}
          leftIcon={<span className="material-symbols-outlined text-[18px]">refresh</span>}
        >
          Refresh Disputes
        </Button>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-surface-container-lowest p-2 rounded-2xl border border-outline-variant/30 shadow-xs overflow-x-auto no-scrollbar">
        {(['ALL', 'OPEN', 'RESOLVED'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterStatus === status
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {status === 'ALL' ? 'All Disputes' : status === 'OPEN' ? 'Needs Review (Open)' : 'Resolved Cases'}
          </button>
        ))}
      </div>

      {/* Dispute List */}
      {loading ? (
        <LoadingState message="Loading customer dispute tickets..." />
      ) : filteredDisputes.length === 0 ? (
        <EmptyState
          title="No disputes found"
          description="There are currently no customer dispute tickets matching this status."
          icon="gavel"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filteredDisputes.map((dispute) => {
            const isPending = dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW';

            return (
              <div
                key={dispute.id}
                className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary font-bold shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[26px]">gavel</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-on-surface-variant">
                        {dispute.id}
                      </span>
                      <span className="text-xs font-bold text-primary">
                        Order {dispute.order?.orderNumber || '#SB-ORDER'}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          isPending
                            ? 'bg-amber-100 text-amber-800'
                            : dispute.status.includes('REFUND')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {dispute.status}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-on-surface mt-1.5">
                      "{dispute.reason}"
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant mt-2">
                      <span>Customer: {dispute.order?.customer?.fullName || dispute.user?.fullName || 'Customer'}</span>
                      <span>•</span>
                      <span>Partner: {dispute.order?.restaurant?.name || 'Partner Outlet'}</span>
                      <span>•</span>
                      <span className="font-bold text-on-surface">
                        Amount: ₹{dispute.order?.totalPriceInr || dispute.refundAmountInr || 149}
                      </span>
                    </div>

                    {dispute.adminNotes && (
                      <div className="mt-2.5 p-2.5 bg-surface-container-low rounded-xl text-xs text-on-surface-variant border border-outline-variant/20">
                        <span className="font-bold text-on-surface">Admin Resolution: </span>
                        {dispute.adminNotes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dispute Actions */}
                {isPending && (
                  <div className="flex items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-outline-variant/20">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenResolution(dispute, 'RESOLVED_REFUNDED')}
                    >
                      Issue Full Refund
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50"
                      onClick={() => handleOpenResolution(dispute, 'RESOLVED_REJECTED')}
                    >
                      Dismiss Claim
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resolution Modal */}
      {selectedDispute && (
        <Modal
          isOpen={!!selectedDispute}
          onClose={() => setSelectedDispute(null)}
          title={`Resolve Dispute: ${selectedDispute.id}`}
        >
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-surface-container-low rounded-xl text-sm">
              <div className="font-semibold text-on-surface">
                Order {selectedDispute.order?.orderNumber} • {selectedDispute.order?.restaurant?.name}
              </div>
              <p className="text-xs text-on-surface-variant mt-1">"{selectedDispute.reason}"</p>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-1.5">
                Resolution Action
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResolutionType('RESOLVED_REFUNDED')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    resolutionType === 'RESOLVED_REFUNDED'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  Approve & Refund Customer
                </button>
                <button
                  type="button"
                  onClick={() => setResolutionType('RESOLVED_REJECTED')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    resolutionType === 'RESOLVED_REJECTED'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  Reject & Dismiss Claim
                </button>
              </div>
            </div>

            {resolutionType === 'RESOLVED_REFUNDED' && (
              <div>
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-1.5">
                  Refund Amount (INR / ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-on-surface-variant text-sm font-bold">₹</span>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 bg-surface-container-low rounded-xl border border-outline-variant/30 text-sm font-bold text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-1.5">
                Resolution Notes & Justification
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Explain the arbitration verdict..."
                className="w-full p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 text-sm text-on-surface focus:outline-none focus:border-primary placeholder:text-on-surface-variant/60"
              />
            </div>

            <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-outline-variant/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDispute(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmResolution}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Verdict'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDisputesPage;
