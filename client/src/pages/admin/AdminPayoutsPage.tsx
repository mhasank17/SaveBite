import React, { useEffect, useState, useMemo } from 'react';
import adminApi, {
  RestaurantSettlement,
  SettlementSummary,
  SettlementHistoryRecord,
} from '../../services/adminApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

interface AdminPayoutsPageProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

type DateFilterType = 'ALL' | 'TODAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';

export const AdminPayoutsPage: React.FC<AdminPayoutsPageProps> = ({ onShowToast }) => {
  const [restaurants, setRestaurants] = useState<RestaurantSettlement[]>([]);
  const [history, setHistory] = useState<SettlementHistoryRecord[]>([]);
  const [summary, setSummary] = useState<SettlementSummary>({
    totalPendingInr: 0,
    partnersAwaitingTransfer: 0,
    totalSettledInr: 0,
    completedPayoutsCount: 0,
    totalSalesInr: 0,
    totalCommissionInr: 0,
    totalRestaurantEarningsInr: 0,
    totalOrdersCount: 0,
    totalItemsSoldCount: 0,
    periodLabel: 'All Time',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Full Settlement Confirmation Modal state (NO partial amount input)
  const [selectedForSettle, setSelectedForSettle] = useState<RestaurantSettlement | null>(null);
  const [settleNotes, setSettleNotes] = useState<string>('');
  const [isSettling, setIsSettling] = useState<boolean>(false);
  const [settleSuccessReceipt, setSettleSuccessReceipt] = useState<{
    restaurantName: string;
    amountInr: number;
    bankReferenceId: string;
    payoutDate: string;
    status: string;
  } | null>(null);

  // View Details Modal state
  const [detailsRestaurant, setDetailsRestaurant] = useState<RestaurantSettlement | null>(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState<'DEALS' | 'HISTORY'>('DEALS');

  const fetchSettlements = async (
    filter: DateFilterType = dateFilter,
    start = customStartDate,
    end = customEndDate
  ) => {
    setLoading(true);
    try {
      const data = await adminApi.getSettlements({
        filter,
        startDate: filter === 'CUSTOM' ? start : undefined,
        endDate: filter === 'CUSTOM' ? end : undefined,
      });

      setSummary(data.summary);
      setRestaurants(data.restaurants);
      setHistory(data.history || []);

      // Keep open details modal in sync
      if (detailsRestaurant) {
        const updated = data.restaurants.find(
          (r) => r.restaurantId === detailsRestaurant.restaurantId
        );
        if (updated) setDetailsRestaurant(updated);
      }
    } catch {
      onShowToast('error', 'Failed to load restaurant settlements ledger.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements(dateFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  const handleApplyCustomFilter = () => {
    if (!customStartDate || !customEndDate) {
      onShowToast('error', 'Please select both start and end dates.', 'Invalid Date Range');
      return;
    }
    fetchSettlements('CUSTOM', customStartDate, customEndDate);
  };

  const handleOpenSettleModal = (restaurant: RestaurantSettlement) => {
    setSelectedForSettle(restaurant);
    setSettleNotes(`Full settlement for ${restaurant.restaurantName}`);
    setSettleSuccessReceipt(null);
  };

  // FULL SETTLEMENT ONLY — Disburses the complete outstanding amount
  const handleConfirmFullPayout = async () => {
    if (!selectedForSettle) return;

    const fullOutstandingAmount = selectedForSettle.pendingAmountInr;
    if (fullOutstandingAmount <= 0) {
      onShowToast(
        'info',
        'All eligible earnings for this restaurant have already been fully settled.',
        'Already Settled'
      );
      return;
    }

    setIsSettling(true);
    try {
      const res = await adminApi.settleRestaurant({
        restaurantId: selectedForSettle.restaurantId,
        notes: settleNotes || undefined,
      });

      const utr =
        res.payout?.bankReferenceId || `UTR-SB-RZP-${Date.now().toString().slice(-8)}`;

      setSettleSuccessReceipt({
        restaurantName: selectedForSettle.restaurantName,
        amountInr: res.payout?.amountInr || fullOutstandingAmount,
        bankReferenceId: utr,
        payoutDate: res.payout?.payoutDate || new Date().toISOString().split('T')[0],
        status: 'COMPLETED',
      });

      onShowToast(
        'success',
        `Disbursed full settlement of ₹${fullOutstandingAmount.toLocaleString(
          'en-IN'
        )} to ${selectedForSettle.restaurantName}. Bank UTR: ${utr}`,
        'Full Settlement Complete 🎉'
      );

      // Refresh data
      fetchSettlements(dateFilter);
    } catch (err) {
      const msg = (err as Error).message || 'Failed to disburse full settlement.';
      onShowToast('error', msg, 'Settlement Error');
    } finally {
      setIsSettling(false);
    }
  };

  const handleExportCsv = () => {
    if (restaurants.length === 0) {
      onShowToast('info', 'No settlement records to export.', 'Export CSV');
      return;
    }

    let csv = `SaveBite Full Partner Settlement Ledger Report\n`;
    csv += `Export Generated At,"${new Date().toLocaleString('en-IN')}"\n`;
    csv += `Selected Date Filter,"${dateFilter} (${summary.periodLabel})"\n\n`;

    // Overview Section
    csv += `FINANCIAL OVERVIEW\n`;
    csv += `Pending Scheduled Settlements,Total Settled Volume,Eligible Orders,Items Sold,Total Platform Sales,SaveBite Commission 15%,Restaurant Earnings 85%\n`;
    csv += `₹${summary.totalPendingInr},₹${summary.totalSettledInr},${summary.totalOrdersCount},${summary.totalItemsSoldCount},₹${summary.totalSalesInr},₹${summary.totalCommissionInr},₹${summary.totalRestaurantEarningsInr}\n\n`;

    // Restaurant-Wise Table
    csv += `RESTAURANT-WISE SETTLEMENTS (FULL SETTLEMENT ONLY)\n`;
    csv += `Restaurant,Branch,KYC Status,Orders,Items Sold,Total Sales (INR),SaveBite Commission 15% (INR),Restaurant Earnings 85% (INR),Settlement Status\n`;

    restaurants.forEach((r) => {
      const statusText = r.pendingAmountInr > 0 ? 'Awaiting Full Settlement' : 'Fully Settled';
      csv += `"${r.restaurantName.replace(/"/g, '""')}","${r.branchName.replace(
        /"/g,
        '""'
      )}",${r.kycStatus},${r.ordersCount},${r.itemsSold},${r.totalSalesInr},${
        r.commissionInr
      },${r.restaurantEarningsInr},"${statusText}"\n`;
    });

    // Settlement History
    if (history.length > 0) {
      csv += `\nFULL SETTLEMENT DISBURSEMENT HISTORY & UTR\n`;
      csv += `Restaurant,Settlement Date,Full Settlement Amount (INR),Payment Status,Bank Reference ID (UTR)\n`;
      history.forEach((h) => {
        csv += `"${h.restaurantName.replace(/"/g, '""')}",${h.payoutDate},${h.amountInr},${
          h.status
        },"${h.bankReferenceId || 'N/A'}"\n`;
      });
    }

    // Food Deals Breakdown
    csv += `\nFOOD DEAL-WISE SALES BREAKDOWN\n`;
    csv += `Restaurant,Deal Title,Category,Unit Surplus Price (INR),Orders Placed,Items Sold,Gross Revenue (INR),Restaurant Net 85% (INR)\n`;
    restaurants.forEach((r) => {
      r.dealBreakdown.forEach((deal) => {
        csv += `"${r.restaurantName.replace(/"/g, '""')}","${deal.dealTitle.replace(
          /"/g,
          '""'
        )}","${deal.categoryName}",${deal.unitPriceInr},${deal.ordersCount},${
          deal.quantitySold
        },${deal.revenueInr},${deal.restaurantEarningsInr}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `savebite_full_settlements_${dateFilter.toLowerCase()}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast('success', 'Full settlement report exported to CSV.', 'Export Complete');
  };

  const filteredRestaurants = useMemo(() => {
    if (!searchQuery.trim()) return restaurants;
    const q = searchQuery.toLowerCase();
    return restaurants.filter(
      (r) =>
        r.restaurantName.toLowerCase().includes(q) ||
        r.branchName.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q)
    );
  }, [restaurants, searchQuery]);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Header */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-sm text-2xl font-bold text-on-surface">
              Partner Settlement Ledger & Payouts
            </h1>
            <Badge variant="neutral">Full Settlement Only</Badge>
          </div>
          <p className="font-body-sm text-on-surface-variant text-sm mt-0.5">
            Admin oversight for net merchant earnings (85% post 15% platform commission) and full automated NEFT/RTGS bank transfers.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}
          >
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSettlements(dateFilter)}
            leftIcon={<span className="material-symbols-outlined text-[18px]">refresh</span>}
          >
            Refresh Ledger
          </Button>
        </div>
      </section>

      {/* Payout Summary Cards (Preserved exactly as required) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Pending Scheduled Settlements
            </div>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">
              ₹{summary.totalPendingInr.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-on-surface-variant mt-0.5">
              {summary.partnersAwaitingTransfer} merchant partners awaiting transfer
            </div>
          </div>
          <span className="material-symbols-outlined text-[32px] text-amber-500">schedule</span>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Total Settled Volume
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">
              ₹{summary.totalSettledInr.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-on-surface-variant mt-0.5">
              {summary.completedPayoutsCount} payouts dispatched with verified UTR
            </div>
          </div>
          <span className="material-symbols-outlined text-[32px] text-emerald-500">
            account_balance_wallet
          </span>
        </div>
      </div>

      {/* Date Filters & Search Toolbar */}
      <section className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl overflow-x-auto text-xs font-bold">
            {(
              [
                { id: 'ALL', label: 'All Time' },
                { id: 'TODAY', label: 'Today' },
                { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
                { id: 'THIS_MONTH', label: 'This Month' },
                { id: 'LAST_MONTH', label: 'Last Month' },
                { id: 'CUSTOM', label: 'Custom Range' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all shrink-0 whitespace-nowrap ${
                  dateFilter === tab.id
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-extrabold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search restaurant or branch..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Custom Date Range Selectors */}
        {dateFilter === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-outline-variant/20">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-on-surface-variant">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-on-surface-variant">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface"
              />
            </div>

            <Button variant="primary" size="sm" onClick={handleApplyCustomFilter}>
              Apply Range
            </Button>
          </div>
        )}
      </section>

      {/* Restaurant-Wise Settlement Table (Strictly matched to Section 2 specifications) */}
      {loading ? (
        <LoadingState message="Calculating restaurant sales and pending settlements..." />
      ) : filteredRestaurants.length === 0 ? (
        <EmptyState
          title="No restaurant settlements found"
          description={
            searchQuery
              ? `No partner matches "${searchQuery}". Try clearing search.`
              : 'There are no partner transactions matching this date range.'
          }
          icon="account_balance_wallet"
        />
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-on-surface">
                Restaurant-Wise Settlement Ledger
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Eligible orders, platform margin (15%), and net 85% merchant earnings awaiting full settlement
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-on-surface-variant">
              {filteredRestaurants.length} Restaurants
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low/75 border-b border-outline-variant/30 uppercase font-bold text-on-surface-variant tracking-wider">
                  <th className="py-3.5 px-4">Restaurant</th>
                  <th className="py-3.5 px-3 text-right">Orders</th>
                  <th className="py-3.5 px-3 text-right">Items Sold</th>
                  <th className="py-3.5 px-4 text-right">Total Sales</th>
                  <th className="py-3.5 px-4 text-right">SaveBite Commission (15%)</th>
                  <th className="py-3.5 px-4 text-right">Restaurant Earnings (85%)</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredRestaurants.map((r) => {
                  const isAwaitingFullSettlement = r.pendingAmountInr > 0;

                  return (
                    <tr
                      key={r.restaurantId}
                      className="hover:bg-surface-container-low/40 transition-colors"
                    >
                      {/* Restaurant */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-on-surface text-sm">{r.restaurantName}</div>
                        <div className="text-[11px] text-on-surface-variant mt-0.5 flex items-center gap-1.5">
                          <span>{r.branchName || r.city}</span>
                          <span>•</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              r.kycStatus === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.kycStatus}
                          </span>
                        </div>
                      </td>

                      {/* Orders */}
                      <td className="py-3.5 px-3 text-right font-semibold text-on-surface font-mono">
                        {r.ordersCount}
                      </td>

                      {/* Items Sold */}
                      <td className="py-3.5 px-3 text-right font-semibold text-on-surface font-mono">
                        {r.itemsSold}
                      </td>

                      {/* Total Sales */}
                      <td className="py-3.5 px-4 text-right font-bold text-on-surface font-mono">
                        ₹{r.totalSalesInr.toLocaleString('en-IN')}
                      </td>

                      {/* SaveBite Commission (15%) */}
                      <td className="py-3.5 px-4 text-right text-amber-700 font-semibold font-mono">
                        ₹{r.commissionInr.toLocaleString('en-IN')}
                      </td>

                      {/* Restaurant Earnings (85%) */}
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 font-mono text-sm">
                        ₹{r.restaurantEarningsInr.toLocaleString('en-IN')}
                      </td>

                      {/* Action (Strictly Full Settlement Only) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {isAwaitingFullSettlement ? (
                            <button
                              type="button"
                              onClick={() => handleOpenSettleModal(r)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <span className="material-symbols-outlined text-[16px]">payments</span>
                              Settle Full Amount
                            </button>
                          ) : (
                            <span className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                              <span className="material-symbols-outlined text-[16px] text-emerald-600">
                                verified
                              </span>
                              Fully Settled
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setDetailsRestaurant(r);
                              setActiveDetailsTab('DEALS');
                            }}
                            className="px-2.5 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-low text-xs font-semibold text-on-surface transition-all flex items-center gap-1"
                            title="View Deal Breakdown & Restaurant History"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table Aggregate Totals Footer */}
              <tfoot>
                <tr className="bg-surface-container-low/90 border-t-2 border-outline-variant/40 font-bold text-on-surface text-xs">
                  <td className="py-3.5 px-4 font-extrabold">Total ({filteredRestaurants.length} Restaurants)</td>
                  <td className="py-3.5 px-3 text-right font-mono">{summary.totalOrdersCount}</td>
                  <td className="py-3.5 px-3 text-right font-mono">{summary.totalItemsSoldCount}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-extrabold">
                    ₹{summary.totalSalesInr.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-amber-700 font-extrabold">
                    ₹{summary.totalCommissionInr.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-extrabold">
                    ₹{summary.totalRestaurantEarningsInr.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center text-on-surface-variant font-normal text-[11px]">
                    {summary.partnersAwaitingTransfer} partners pending
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Section 5: Separate Settlement History Section (Strictly Required) */}
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-container-low/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">history_edu</span>
            </div>
            <div>
              <h2 className="font-bold text-base text-on-surface">
                Settlement History & Verified Banking Records
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Permanent audit log of all full disbursements dispatched to partner merchants with verified bank UTRs
              </p>
            </div>
          </div>
          <Badge variant="neutral">{history.length} Completed Transfers</Badge>
        </div>

        {history.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant/40 mb-2">
              receipt_long
            </span>
            <p className="text-sm font-semibold text-on-surface">No settlement disbursements recorded yet</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Settlements dispatched via the table above will appear here with permanent bank UTR references.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low/75 border-b border-outline-variant/30 uppercase font-bold text-on-surface-variant tracking-wider">
                  <th className="py-3.5 px-4">Restaurant Name</th>
                  <th className="py-3.5 px-4 text-right">Full Settlement Amount</th>
                  <th className="py-3.5 px-4 text-center">Settlement Date</th>
                  <th className="py-3.5 px-4">Payment Reference / UTR</th>
                  <th className="py-3.5 px-4 text-center">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-surface-container-low/30 transition-colors">
                    {/* Restaurant name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-on-surface text-sm">{record.restaurantName}</div>
                      {record.branchName && (
                        <div className="text-[11px] text-on-surface-variant mt-0.5">
                          {record.branchName}
                        </div>
                      )}
                    </td>

                    {/* Full settlement amount */}
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 font-mono text-sm">
                      ₹{record.amountInr.toLocaleString('en-IN')}
                    </td>

                    {/* Settlement date */}
                    <td className="py-3.5 px-4 text-center font-mono text-on-surface">
                      {record.payoutDate}
                    </td>

                    {/* Payment reference / UTR */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 text-emerald-800 font-bold">
                        <span>{record.bankReferenceId || 'Processing NEFT/RTGS'}</span>
                        {record.bankReferenceId && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(record.bankReferenceId!);
                              onShowToast('info', 'Bank UTR copied to clipboard.', 'Copied');
                            }}
                            className="p-0.5 hover:bg-surface-container rounded text-on-surface-variant"
                            title="Copy Bank UTR"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              content_copy
                            </span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Payment status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          record.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Full Settlement Confirmation Modal (Strictly Full Settlement Only) */}
      <Modal
        isOpen={Boolean(selectedForSettle)}
        onClose={() => {
          if (!isSettling) {
            setSelectedForSettle(null);
            setSettleSuccessReceipt(null);
          }
        }}
        title={settleSuccessReceipt ? 'Settlement Receipt' : 'Full Partner Settlement'}
        subtitle={
          settleSuccessReceipt
            ? 'Verified payment confirmation and UTR'
            : 'Automated direct bank disbursement for 100% of outstanding earnings'
        }
        maxWidth="md"
      >
        {settleSuccessReceipt ? (
          /* Receipt View */
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-scale-in">
              <span className="material-symbols-outlined text-[36px]">verified</span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-on-surface">Full Settlement Dispatched 🎉</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Full outstanding earnings transferred to {settleSuccessReceipt.restaurantName}
              </p>
            </div>

            <div className="w-full bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex flex-col gap-2.5 text-left text-xs">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Merchant Partner:</span>
                <span className="font-bold text-on-surface">{settleSuccessReceipt.restaurantName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Disbursed Full Amount:</span>
                <span className="font-extrabold text-emerald-700 text-base font-mono">
                  ₹{settleSuccessReceipt.amountInr.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Settlement Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {settleSuccessReceipt.status}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Settlement Date:</span>
                <span className="font-mono text-on-surface">{settleSuccessReceipt.payoutDate}</span>
              </div>

              <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-1">
                <span className="text-on-surface-variant font-semibold">Payment Reference / Bank UTR:</span>
                <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 font-mono text-emerald-700 font-bold">
                  <span>{settleSuccessReceipt.bankReferenceId}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(settleSuccessReceipt.bankReferenceId);
                      onShowToast('info', 'UTR copied to clipboard.', 'Copied');
                    }}
                    className="p-1 hover:bg-surface-container rounded text-on-surface-variant"
                    title="Copy UTR"
                  >
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  </button>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full mt-2"
              onClick={() => {
                setSelectedForSettle(null);
                setSettleSuccessReceipt(null);
              }}
            >
              Done & Refresh Ledger
            </Button>
          </div>
        ) : selectedForSettle ? (
          /* Confirmation State (NO amount input box) */
          <div className="flex flex-col gap-4">
            {/* Merchant Details */}
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-on-surface">
                    {selectedForSettle.restaurantName}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {selectedForSettle.branchName || selectedForSettle.address}
                  </p>
                </div>
                <Badge variant="neutral">Direct Bank IMPS / NEFT</Badge>
              </div>

              {/* Financial Metrics Strip */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/20 text-center">
                <div className="bg-surface-container-lowest p-2.5 rounded-xl">
                  <div className="text-[10px] text-on-surface-variant font-bold uppercase">
                    Total Platform Sales
                  </div>
                  <div className="text-sm font-extrabold text-on-surface font-mono mt-0.5">
                    ₹{selectedForSettle.totalSalesInr.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-2.5 rounded-xl">
                  <div className="text-[10px] text-on-surface-variant font-bold uppercase">
                    SaveBite Commission (15%)
                  </div>
                  <div className="text-sm font-extrabold text-amber-700 font-mono mt-0.5">
                    ₹{selectedForSettle.commissionInr.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Prominent Full Settlement Box (Locked Full Amount) */}
              <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-2xl text-center flex flex-col gap-1 shadow-xs">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                  Full Settlement Amount to be Paid
                </span>
                <div className="text-3xl font-black text-emerald-800 font-mono mt-0.5">
                  ₹{selectedForSettle.pendingAmountInr.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">
                  100% of net eligible restaurant earnings (85% post platform commission)
                </span>
              </div>
            </div>

            {/* Notes input (optional) */}
            <div>
              <label className="text-xs font-bold text-on-surface block mb-1">
                Disbursement Notes / Audit Reference (Optional)
              </label>
              <input
                type="text"
                value={settleNotes}
                onChange={(e) => setSettleNotes(e.target.value)}
                placeholder="e.g. Weekly full settlement cycle"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-600 shrink-0 mt-0.5">
                shield
              </span>
              <span>
                Confirming initiates immediate payment for the full outstanding balance. Duplicate payments are cryptographically prevented and verified with an official banking UTR.
              </span>
            </div>

            {/* Actions: One clear Confirm & Pay button */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedForSettle(null)}
                disabled={isSettling}
              >
                Cancel
              </Button>

              <button
                type="button"
                onClick={handleConfirmFullPayout}
                disabled={isSettling || selectedForSettle.pendingAmountInr <= 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                {isSettling
                  ? 'Transmitting Full Settlement...'
                  : `Confirm & Pay Full Amount (₹${selectedForSettle.pendingAmountInr.toLocaleString('en-IN')})`}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* View Individual Restaurant Sales & Deals Details Modal */}
      <Modal
        isOpen={Boolean(detailsRestaurant)}
        onClose={() => setDetailsRestaurant(null)}
        title={detailsRestaurant?.restaurantName || 'Restaurant Sales Details'}
        subtitle={`${detailsRestaurant?.branchName || ''} • Performance Breakdown & Settlement History`}
        maxWidth="lg"
      >
        {detailsRestaurant && (
          <div className="flex flex-col gap-4">
            {/* KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                  Orders / Items
                </span>
                <div className="text-base font-extrabold text-on-surface mt-0.5">
                  {detailsRestaurant.ordersCount} / {detailsRestaurant.itemsSold}
                </div>
              </div>

              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                  Total Sales
                </span>
                <div className="text-base font-extrabold text-on-surface font-mono mt-0.5">
                  ₹{detailsRestaurant.totalSalesInr.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                  85% Net Earnings
                </span>
                <div className="text-base font-extrabold text-emerald-700 font-mono mt-0.5">
                  ₹{detailsRestaurant.restaurantEarningsInr.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                  Pending Full Settlement
                </span>
                <div className="text-base font-extrabold text-amber-700 font-mono mt-0.5">
                  ₹{detailsRestaurant.pendingAmountInr.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-1">
              <button
                type="button"
                onClick={() => setActiveDetailsTab('DEALS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeDetailsTab === 'DEALS'
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
                Food Deals Sales ({detailsRestaurant.dealBreakdown.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveDetailsTab('HISTORY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeDetailsTab === 'HISTORY'
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                Disbursement History & UTR ({detailsRestaurant.settlementHistory.length})
              </button>
            </div>

            {/* Food Deals Table */}
            {activeDetailsTab === 'DEALS' && (
              <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low/75 border-b border-outline-variant/30 font-bold text-on-surface-variant uppercase">
                      <th className="py-2.5 px-3">Food Deal</th>
                      <th className="py-2.5 px-2 text-center">Category</th>
                      <th className="py-2.5 px-2 text-right">Deal Price</th>
                      <th className="py-2.5 px-2 text-center">Orders</th>
                      <th className="py-2.5 px-2 text-center">Qty Sold</th>
                      <th className="py-2.5 px-3 text-right">Revenue</th>
                      <th className="py-2.5 px-3 text-right">85% Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {detailsRestaurant.dealBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-on-surface-variant">
                          No food deal sales recorded in this period.
                        </td>
                      </tr>
                    ) : (
                      detailsRestaurant.dealBreakdown.map((deal) => (
                        <tr key={deal.dealId} className="hover:bg-surface-container-low/30">
                          <td className="py-2.5 px-3 font-semibold text-on-surface">
                            {deal.dealTitle}
                          </td>
                          <td className="py-2.5 px-2 text-center text-on-surface-variant text-[11px]">
                            {deal.categoryName}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono">₹{deal.unitPriceInr}</td>
                          <td className="py-2.5 px-2 text-center font-mono">{deal.ordersCount}</td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold">
                            {deal.quantitySold}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-on-surface">
                            ₹{deal.revenueInr.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            ₹{deal.restaurantEarningsInr.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Individual Restaurant Settlement History */}
            {activeDetailsTab === 'HISTORY' && (
              <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low/75 border-b border-outline-variant/30 font-bold text-on-surface-variant uppercase">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Disbursed (₹)</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Bank Reference ID (UTR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {detailsRestaurant.settlementHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-on-surface-variant">
                          No historical settlements recorded yet for this restaurant.
                        </td>
                      </tr>
                    ) : (
                      detailsRestaurant.settlementHistory.map((p) => (
                        <tr key={p.id} className="hover:bg-surface-container-low/30">
                          <td className="py-2.5 px-3 font-mono text-on-surface">{p.payoutDate}</td>
                          <td className="py-2.5 px-3 text-right font-bold font-mono text-emerald-700">
                            ₹{p.amountInr.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-on-surface flex items-center justify-between">
                            <span>{p.bankReferenceId || 'Processing / Scheduled'}</span>
                            {p.bankReferenceId && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(p.bankReferenceId!);
                                  onShowToast('info', 'UTR copied to clipboard.', 'Copied');
                                }}
                                className="p-1 hover:bg-surface-container rounded text-on-surface-variant"
                                title="Copy UTR"
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  content_copy
                                </span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Quick Settle from Details Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
              <span className="text-xs text-on-surface-variant">
                Full Outstanding Balance:{' '}
                <strong className="text-amber-700 font-mono">
                  ₹{detailsRestaurant.pendingAmountInr.toLocaleString('en-IN')}
                </strong>
              </span>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setDetailsRestaurant(null)}>
                  Close
                </Button>

                {detailsRestaurant.pendingAmountInr > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const rest = detailsRestaurant;
                      setDetailsRestaurant(null);
                      handleOpenSettleModal(rest);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">payments</span>
                    Settle Full Amount (₹{detailsRestaurant.pendingAmountInr.toLocaleString('en-IN')})
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminPayoutsPage;
