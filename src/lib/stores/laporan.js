/**
 * ============================================
 * LAPORAN STORE
 * ============================================
 * State management untuk halaman laporan
 * ============================================
 */
import { writable, derived } from 'svelte/store';

// ==========================================
// REPORT FILTER STORE
// ==========================================

/** Periode laporan yang dipilih */
export const reportPeriod = writable('today'); // 'today', 'week', 'month', 'year', 'custom'

/** Tanggal awal untuk custom period */
export const reportStartDate = writable(null);

/** Tanggal akhir untuk custom period */
export const reportEndDate = writable(null);

/** Enable period comparison */
export const reportCompare = writable(false);

/** Jenis laporan yang sedang aktif */
export const reportType = writable('penjualan'); // 'penjualan', 'keuangan', 'stok', 'kasir'

/** Loading state */
export const reportLoading = writable(false);

/** Error state */
export const reportError = writable(null);

// ==========================================
// DERIVED STATES
// ==========================================

/** Tanggal range object berdasarkan filter */
export const dateRange = derived(
    [reportPeriod, reportStartDate, reportEndDate],
    ([$period, $start, $end]) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        if ($period === 'custom' && $start && $end) {
            return {
                startDate: new Date($start),
                endDate: new Date($end)
            };
        }

        switch ($period) {
            case 'today':
                return {
                    startDate: today,
                    endDate: tomorrow
                };
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                return {
                    startDate: weekStart,
                    endDate: tomorrow
                };
            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                return {
                    startDate: monthStart,
                    endDate: tomorrow
                };
            case 'year':
                const yearStart = new Date(now.getFullYear(), 0, 1);
                return {
                    startDate: yearStart,
                    endDate: tomorrow
                };
            default:
                return {
                    startDate: today,
                    endDate: tomorrow
                };
        }
    }
);

/** Periode sebelumnya untuk comparison */
export const previousDateRange = derived(dateRange, ($dateRange) => {
    const diff = $dateRange.endDate.getTime() - $dateRange.startDate.getTime();
    return {
        startDate: new Date($dateRange.startDate.getTime() - diff),
        endDate: $dateRange.startDate
    };
});

// ==========================================
// REPORT DATA STORES
// ==========================================

/** Data laporan penjualan */
export const penjualanData = writable({
    summary: null,
    chart: null,
    topProducts: [],
    categoryBreakdown: [],
    paymentBreakdown: [],
    transactions: []
});

/** Data laporan keuangan */
export const keuanganData = writable({
    summary: null,
    profitLoss: null,
    discountAnalysis: null,
    taxSummary: null
});

/** Data laporan stok */
export const stokData = writable({
    valuation: null,
    currentStock: [],
    fastMoving: [],
    slowMoving: []
});

/** Data laporan kasir */
export const kasirData = writable({
    performance: [],
    hourlyStats: [],
    voidTransactions: []
});

/** Data untuk comparison (periode sebelumnya) */
export const comparisonData = writable(null);

// ==========================================
// UI STATE STORES
// ==========================================

/** Modal state */
export const showExportModal = writable(false);

/** Export format yang dipilih */
export const exportFormat = writable('pdf'); // 'pdf' or 'excel'

/** Table page */
export const tablePage = writable(1);

/** Table page size */
export const tablePageSize = writable(10);

/** Table sort column */
export const tableSortColumn = writable('tanggal');

/** Table sort direction */
export const tableSortDirection = writable('desc');

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Set periode laporan
 * @param {string} period - 'today', 'week', 'month', 'year', 'custom'
 * @param {Date|null} start - Tanggal awal untuk custom
 * @param {Date|null} end - Tanggal akhir untuk custom
 */
export function setReportPeriod(period, start = null, end = null) {
    reportPeriod.set(period);
    if (period === 'custom' && start && end) {
        reportStartDate.set(start);
        reportEndDate.set(end);
    }
}

/**
 * Reset semua filter laporan
 */
export function resetReportFilters() {
    reportPeriod.set('today');
    reportStartDate.set(null);
    reportEndDate.set(null);
    reportCompare.set(false);
    tablePage.set(1);
}

/**
 * Set loading state
 * @param {boolean} loading
 */
export function setLoading(loading) {
    reportLoading.set(loading);
}

/**
 * Set error state
 * @param {Error|string|null} error
 */
export function setError(error) {
    reportError.set(error);
}

/**
 * Update penjualan data
 * @param {object} data
 */
export function updatePenjualanData(data) {
    penjualanData.set(data);
}

/**
 * Update keuangan data
 * @param {object} data
 */
export function updateKeuanganData(data) {
    keuanganData.set(data);
}

/**
 * Update stok data
 * @param {object} data
 */
export function updateStokData(data) {
    stokData.set(data);
}

/**
 * Update kasir data
 * @param {object} data
 */
export function updateKasirData(data) {
    kasirData.set(data);
}

/**
 * Update comparison data
 * @param {object|null} data
 */
export function updateComparisonData(data) {
    comparisonData.set(data);
}

/**
 * Refresh data laporan (trigger reload)
 */
export function refreshReport() {
    // This will be handled by the page's load function
    reportError.set(null);
}

/**
 * Open export modal
 * @param {string} format - 'pdf' or 'excel'
 */
export function openExportModal(format = 'pdf') {
    exportFormat.set(format);
    showExportModal.set(true);
}

/**
 * Close export modal
 */
export function closeExportModal() {
    showExportModal.set(false);
}

/**
 * Set table sorting
 * @param {string} column
 * @param {string} direction
 */
export function setTableSort(column, direction = 'asc') {
    tableSortColumn.set(column);
    tableSortDirection.set(direction);
    tablePage.set(1); // Reset to first page
}

/**
 * Set table page
 * @param {number} page
 */
export function setTablePage(page) {
    tablePage.set(page);
}
