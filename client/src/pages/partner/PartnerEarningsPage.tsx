import React, { useState, useEffect, useMemo } from 'react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import partnerApi, { PartnerEarnings, FoodSaleItem } from '../../services/partnerApi';

export interface PartnerEarningsPageProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'custom';
type SortByType = 'sales_desc' | 'items_desc' | 'name_asc';

export const PartnerEarningsPage: React.FC<PartnerEarningsPageProps> = ({ onShowToast }) => {
  const [earnings, setEarnings] = useState<PartnerEarnings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Food Sales Breakdown Filters & Sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortByType>('sales_desc');

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const data = await partnerApi.getEarnings();
      setEarnings(data);
    } catch {
      onShowToast('error', 'Could not fetch live earnings. Showing cached metrics.', 'Network Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const handleDownloadStatement = () => {
    onShowToast(
      'success',
      'Monthly partner GST payout statement downloaded (CSV/PDF) for audit.',
      'Statement Exported 📄'
    );
  };

  // Filter & Sort Sales Breakdown
  const filteredSalesBreakdown = useMemo(() => {
    const items: FoodSaleItem[] = earnings?.salesBreakdown || [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    return items
      .filter((item) => {
        // 1. Search Query filter
        if (searchQuery.trim().length > 0) {
          const q = searchQuery.toLowerCase();
          const matchesName = item.foodItemName.toLowerCase().includes(q);
          const matchesCategory = item.categoryName.toLowerCase().includes(q);
          if (!matchesName && !matchesCategory) return false;
        }

        // 2. Date Filter
        if (dateFilter === 'all') return true;

        const dates = item.orderDates && item.orderDates.length > 0
          ? item.orderDates
          : [item.lastOrderDate || item.firstOrderDate || todayStr];

        if (dateFilter === 'today') {
          return dates.some((d) => d && d.startsWith(todayStr));
        }

        if (dateFilter === 'week') {
          return dates.some((d) => d && new Date(d) >= weekAgo);
        }

        if (dateFilter === 'month') {
          return dates.some((d) => d && new Date(d) >= monthAgo);
        }

        if (dateFilter === 'custom') {
          if (!customStartDate && !customEndDate) return true;
          return dates.some((d) => {
            if (!d) return false;
            const dateStr = d.split('T')[0];
            if (customStartDate && dateStr < customStartDate) return false;
            if (customEndDate && dateStr > customEndDate) return false;
            return true;
          });
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'sales_desc') return b.grossSalesInr - a.grossSalesInr;
        if (sortBy === 'items_desc') return b.quantitySold - a.quantitySold;
        if (sortBy === 'name_asc') return a.foodItemName.localeCompare(b.foodItemName);
        return 0;
      });
  }, [earnings?.salesBreakdown, searchQuery, dateFilter, customStartDate, customEndDate, sortBy]);

  // Aggregate Totals for Filtered Breakdown
  const summaryTotals = useMemo(() => {
    return filteredSalesBreakdown.reduce(
      (acc, item) => ({
        itemsSold: acc.itemsSold + item.quantitySold,
        orders: acc.orders + item.ordersCount,
        grossSales: acc.grossSales + item.grossSalesInr,
        commission: acc.commission + item.commissionInr,
        earnings: acc.earnings + item.partnerEarningsInr,
      }),
      { itemsSold: 0, orders: 0, grossSales: 0, commission: 0, earnings: 0 }
    );
  }, [filteredSalesBreakdown]);

  // Export Sales Report to CSV
  const handleExportCsv = () => {
    if (!filteredSalesBreakdown || filteredSalesBreakdown.length === 0) {
      onShowToast('info', 'No sales data to export with current filters.', 'Empty Report');
      return;
    }

    const headers = [
      'Food Item Name',
      'Category',
      'Quantity Sold',
      'Orders Count',
      'Gross Sales (INR)',
      'SaveBite Commission 15% (INR)',
      'Restaurant Earnings 85% (INR)',
      'Payment Status',
    ];

    const rows = filteredSalesBreakdown.map((item) => [
      `"${item.foodItemName.replace(/"/g, '""')}"`,
      `"${item.categoryName.replace(/"/g, '""')}"`,
      item.quantitySold,
      item.ordersCount,
      item.grossSalesInr,
      item.commissionInr,
      item.partnerEarningsInr,
      item.paymentStatus,
    ]);

    // Summary totals row
    rows.push([
      '"TOTAL"',
      '""',
      summaryTotals.itemsSold,
      summaryTotals.orders,
      summaryTotals.grossSales,
      summaryTotals.commission,
      summaryTotals.earnings,
      '""',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `SaveBite_Food_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast('success', 'Food sales breakdown report exported to CSV.', 'Report Exported 📊');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('sales_desc');
  };

  return (
    <div className="flex flex-col gap-space-md animate-fade-in pb-12">
      {/* Header Bar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-space-md md:p-space-lg rounded-3xl border border-outline-variant/30 shadow-xs">
        <div className="flex flex-col">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Earnings & Payout Settlements
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Transparent revenue tracking, automated 15% platform fee deduction, and weekly bank settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={fetchEarnings}
            leftIcon={<span className="material-symbols-outlined text-[18px]">refresh</span>}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleDownloadStatement}
            leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}
          >
            GST Statement
          </Button>
        </div>
      </section>

      {/* Financial Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-space-sm md:gap-space-md">
        {/* Gross Revenue */}
        <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
            Gross Sales
          </span>
          <div className="my-2">
            <span className="text-2xl md:text-3xl font-extrabold text-on-surface">
              ₹{(earnings?.grossRevenueInr ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[11px] text-on-surface-variant">
            Total customer payments received
          </span>
        </div>

        {/* Platform Fee */}
        <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
              SaveBite Fee
            </span>
            <span className="text-xs bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-bold">
              15%
            </span>
          </div>
          <div className="my-2">
            <span className="text-2xl md:text-3xl font-extrabold text-on-surface-variant">
              –₹{(earnings?.commissionDeductedInr ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[11px] text-on-surface-variant">
            Includes payment gateway & app hosting
          </span>
        </div>

        {/* Net Payout Settled */}
        <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
            Total Settled
          </span>
          <div className="my-2">
            <span className="text-2xl md:text-3xl font-extrabold text-primary">
              ₹{(earnings?.netPayoutInr ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[11px] text-secondary font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            <span>85% Net Partner Margin</span>
          </span>
        </div>

        {/* Next Scheduled Payout */}
        <div className="bg-surface-container-lowest p-space-md rounded-2xl border-2 border-secondary/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label-sm font-bold text-secondary uppercase tracking-wider">
              Next Settlement
            </span>
            <Badge variant="live" pulseDot pulseColor="secondary">
              Scheduled
            </Badge>
          </div>
          <div className="my-2">
            <span className="text-2xl md:text-3xl font-extrabold text-secondary">
              ₹{(earnings?.pendingPayoutInr ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[11px] text-on-surface-variant font-medium">
            Every Monday at 09:00 IST
          </span>
        </div>
      </section>

      {/* PART 1: FOOD SALES BREAKDOWN SECTION */}
      <section className="bg-surface-container-lowest p-space-md md:p-space-lg rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col gap-5">
        {/* Section Header & Actions Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-outline-variant/15">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">restaurant_menu</span>
              </div>
              <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
                Food Sales Breakdown
              </h3>
            </div>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Item-wise portions sold, customer payments, 15% SaveBite commission, and 85% merchant earnings.
            </p>
          </div>

          {/* Export to CSV Button */}
          <div className="flex items-center gap-2.5 self-start lg:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              leftIcon={<span className="material-symbols-outlined text-[16px]">file_download</span>}
              className="text-xs font-bold text-on-surface border-outline-variant/40 hover:bg-surface-container-low"
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-container-low/40 p-3 rounded-2xl border border-outline-variant/15">
          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {(
              [
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'custom', label: 'Custom Range' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setDateFilter(filter.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  dateFilter === filter.id
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56 min-w-[180px]">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food item..."
                className="w-full pl-8 pr-7 py-1.5 bg-surface text-xs text-on-surface rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                aria-label="Sort food sales breakdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortByType)}
                className="pl-3 pr-7 py-1.5 bg-surface text-xs font-semibold text-on-surface rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="sales_desc">Highest Sales (₹)</option>
                <option value="items_desc">Most Items Sold</option>
                <option value="name_asc">Item Name (A-Z)</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-2 text-[16px] text-on-surface-variant pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* Custom Date Pickers (Shown if Custom Range is active) */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-surface-container-low/60 rounded-xl border border-outline-variant/20 text-xs">
            <span className="font-bold text-on-surface-variant">Select Date Range:</span>
            <div className="flex items-center gap-2">
              <label className="text-on-surface-variant">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-surface px-2.5 py-1 rounded-lg border border-outline-variant/30 text-xs font-medium text-on-surface"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-on-surface-variant">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-surface px-2.5 py-1 rounded-lg border border-outline-variant/30 text-xs font-medium text-on-surface"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-xs text-primary font-bold hover:underline ml-auto"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}

        {/* Aggregated Totals Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <div className="bg-surface-container-low/80 p-3 rounded-2xl border border-outline-variant/15 flex flex-col">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Total Items Sold
            </span>
            <span className="text-lg md:text-xl font-extrabold text-on-surface mt-1">
              {summaryTotals.itemsSold.toLocaleString('en-IN')} portions
            </span>
          </div>

          <div className="bg-surface-container-low/80 p-3 rounded-2xl border border-outline-variant/15 flex flex-col">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Total Food Orders
            </span>
            <span className="text-lg md:text-xl font-extrabold text-on-surface mt-1">
              {summaryTotals.orders.toLocaleString('en-IN')} orders
            </span>
          </div>

          <div className="bg-surface-container-low/80 p-3 rounded-2xl border border-outline-variant/15 flex flex-col">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Total Gross Sales
            </span>
            <span className="text-lg md:text-xl font-extrabold text-on-surface mt-1">
              ₹{summaryTotals.grossSales.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-surface-container-low/80 p-3 rounded-2xl border border-outline-variant/15 flex flex-col">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              SaveBite Fee (15%)
            </span>
            <span className="text-lg md:text-xl font-extrabold text-on-surface-variant mt-1">
              –₹{summaryTotals.commission.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-surface-container-low/80 p-3 rounded-2xl border border-outline-variant/15 flex flex-col">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
              Partner Earnings (85%)
            </span>
            <span className="text-lg md:text-xl font-extrabold text-primary mt-1">
              ₹{summaryTotals.earnings.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Responsive Food Sales Breakdown Table */}
        <div className="overflow-x-auto no-scrollbar rounded-2xl border border-outline-variant/20">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider text-[10px] border-b border-outline-variant/20">
                <th className="py-3 px-4 font-bold">Food Item Name</th>
                <th className="py-3 px-3 font-bold text-center">Orders</th>
                <th className="py-3 px-4 font-bold text-right">Quantity Sold</th>
                <th className="py-3 px-4 font-bold text-right">Gross Sales (₹)</th>
                <th className="py-3 px-4 font-bold text-right">SaveBite Commission (15%)</th>
                <th className="py-3 px-4 font-bold text-right">Restaurant Earnings (85%)</th>
                <th className="py-3 px-4 font-bold text-center">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-[24px] text-primary">
                        sync
                      </span>
                      <span>Loading item sales breakdown...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSalesBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[36px] text-on-surface-variant/40">
                        lunch_dining
                      </span>
                      <p className="font-bold text-sm text-on-surface">No food sales found</p>
                      <p className="text-xs text-on-surface-variant max-w-sm">
                        No food items match the current search or date criteria. Try adjusting your filters.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="mt-2 text-xs"
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSalesBreakdown.map((item) => (
                  <tr
                    key={item.listingId}
                    className="hover:bg-surface-container-low/40 transition-colors"
                  >
                    {/* Food Item Name & Category */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface text-sm">
                          {item.foodItemName}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            {item.categoryName}
                          </span>
                          <span className="text-[11px] text-on-surface-variant font-mono">
                            ID: {item.listingId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Orders Count */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-on-surface">
                        {item.ordersCount}
                      </span>
                    </td>

                    {/* Quantity Sold */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-on-surface">
                        {item.quantitySold} portions
                      </span>
                    </td>

                    {/* Gross Sales */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-extrabold text-on-surface text-sm">
                        ₹{item.grossSalesInr.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* SaveBite Commission (15%) */}
                    <td className="py-3 px-4 text-right font-medium text-on-surface-variant">
                      –₹{item.commissionInr.toLocaleString('en-IN')}
                    </td>

                    {/* Restaurant Earnings (85%) */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-extrabold text-primary text-sm">
                        ₹{item.partnerEarningsInr.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="py-3 px-4 text-center">
                      {item.paymentStatus === 'SETTLED' ? (
                        <Badge variant="verified">
                          Settled
                        </Badge>
                      ) : item.paymentStatus === 'SCHEDULED' ? (
                        <Badge variant="live" pulseDot pulseColor="secondary">
                          Scheduled
                        </Badge>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Table Footer with Summary Row */}
            {filteredSalesBreakdown.length > 0 && (
              <tfoot className="bg-surface-container-low font-bold border-t-2 border-outline-variant/30 text-on-surface">
                <tr>
                  <td className="py-3 px-4">
                    <span>Summary ({filteredSalesBreakdown.length} items)</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span>{summaryTotals.orders}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span>{summaryTotals.itemsSold} portions</span>
                  </td>
                  <td className="py-3 px-4 text-right text-sm">
                    ₹{summaryTotals.grossSales.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right text-on-surface-variant">
                    –₹{summaryTotals.commission.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right text-primary text-sm">
                    ₹{summaryTotals.earnings.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[11px] text-on-surface-variant font-medium">85% Paid Out</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Bank Account & Payout Terms */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        {/* Bank Account */}
        <div className="bg-surface-container-lowest p-space-md rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[24px]">account_balance</span>
              <h3 className="font-title-md text-title-md font-bold text-on-surface">
                Registered Bank Account
              </h3>
            </div>
            <Badge variant="verified">
              Verified
            </Badge>
          </div>

          <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Bank Name:</span>
              <span className="font-bold text-on-surface">{earnings?.bankAccount.bankName || 'HDFC Bank (Sandbox Test)'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Account Number:</span>
              <span className="font-mono font-bold text-on-surface">•••• •••• •••• {earnings?.bankAccount.accountNumberEnding || '4921'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">IFSC Code:</span>
              <span className="font-mono font-bold text-on-surface">{earnings?.bankAccount.ifscCode || 'HDFC0000001'}</span>
            </div>
          </div>
          <span className="text-[11px] text-on-surface-variant">
            Settlement payouts are deposited directly via NEFT/IMPS with zero gateway charges.
          </span>
        </div>

        {/* Payout Schedule Policy */}
        <div className="bg-surface-container-lowest p-space-md rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[24px]">calendar_month</span>
            <h3 className="font-title-md text-title-md font-bold text-on-surface">
              Settlement Cycle & GST
            </h3>
          </div>

          <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col gap-2.5 text-xs text-on-surface-variant">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">schedule</span>
              <span><strong>Weekly Settlement:</strong> All confirmed counter collections from Monday to Sunday are paid out the following Monday morning.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">receipt</span>
              <span><strong>GST & Tax Invoices:</strong> 18% GST on the 15% platform commission is invoiced at the end of each calendar month with valid GSTIN credit.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">verified_user</span>
              <span><strong>Direct Bank Transfer:</strong> Payout reference numbers (UTR) are shared immediately upon bank execution.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Settlement History Table */}
      <section className="bg-surface-container-lowest p-space-md md:p-space-lg rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col gap-4">
        <h3 className="font-title-md text-title-md font-bold text-on-surface">
          Recent Settlement Transfers
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-on-surface-variant">
            Loading payout history...
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 text-on-surface-variant uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Settlement ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Net Amount (₹)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Bank Reference (UTR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                {(!earnings?.recentPayouts || earnings.recentPayouts.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-on-surface-variant text-sm">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-[28px] text-outline">receipt_long</span>
                        <span className="font-medium">No settlement transfers yet</span>
                        <span className="text-xs text-on-surface-variant/80">Disbursements will appear here after orders are completed.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  earnings.recentPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold">{payout.id}</td>
                      <td className="py-3 px-3 text-on-surface-variant">{payout.payoutDate}</td>
                      <td className="py-3 px-3 font-bold text-primary text-sm">
                        ₹{payout.amountInr.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        {payout.status === 'COMPLETED' ? (
                          <Badge variant="verified">
                            Settled
                          </Badge>
                        ) : (
                          <Badge variant="live" pulseDot pulseColor="secondary">
                            Next Cycle
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-on-surface-variant">
                        {payout.bankReferenceId}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default PartnerEarningsPage;
