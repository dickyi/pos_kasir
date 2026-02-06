/**
 * ============================================
 * REPORT UTILITIES
 * ============================================
 * Helper functions untuk laporan dan analisis
 * ============================================
 */

/**
 * Hitung pertumbuhan (growth) antara current dan previous
 * @param {number} current - Nilai saat ini
 * @param {number} previous - Nilai sebelumnya
 * @returns {number} - Persentase growth
 */
export function calculateGrowth(current, previous) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
}

/**
 * Tentukan trend berdasarkan growth
 * @param {number} growth - Persentase growth
 * @returns {object} - { trend: 'up'|'down'|'neutral', label: string, color: string }
 */
export function getGrowthTrend(growth) {
    if (growth > 0) {
        return {
            trend: 'up',
            label: `+${growth.toFixed(1)}%`,
            color: 'text-green-600'
        };
    } else if (growth < 0) {
        return {
            trend: 'down',
            label: `${growth.toFixed(1)}%`,
            color: 'text-red-600'
        };
    }
    return {
        trend: 'neutral',
        label: '0%',
        color: 'text-gray-600'
    };
}

/**
 * Format angka ke persentase
 * @param {number} angka - Angka 0-100
 * @param {number} decimals - Jumlah desimal
 * @returns {string}
 */
export function formatPercent(angka, decimals = 1) {
    if (!angka && angka !== 0) return '0%';
    return `${angka.toFixed(decimals)}%`;
}

/**
 * Hitung profit margin
 * @param {number} revenue - Total pendapatan
 * @param {number} cost - Total modal/hpp
 * @returns {number} - Persentase profit margin
 */
export function calculateProfitMargin(revenue, cost) {
    if (!revenue || revenue === 0) return 0;
    const profit = revenue - cost;
    return (profit / revenue) * 100;
}

/**
 * Dapatkan tanggal awal dan akhir berdasarkan periode
 * @param {string} period - 'today', 'week', 'month', 'year'
 * @returns {object} - { startDate: Date, endDate: Date }
 */
export function getDateRange(period, customStart = null, customEnd = null) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (period === 'custom' && customStart && customEnd) {
        return {
            startDate: new Date(customStart),
            endDate: new Date(customEnd)
        };
    }

    switch (period) {
        case 'today':
            return {
                startDate: today,
                endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000)
            };
        case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay()); // Minggu ini
            return {
                startDate: weekStart,
                endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000)
            };
        case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return {
                startDate: monthStart,
                endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000)
            };
        case 'year':
            const yearStart = new Date(now.getFullYear(), 0, 1);
            return {
                startDate: yearStart,
                endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000)
            };
        default:
            return {
                startDate: today,
                endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000)
            };
    }
}

/**
 * Dapatkan periode sebelumnya untuk perbandingan
 * @param {Date} startDate - Tanggal mulai periode saat ini
 * @param {Date} endDate - Tanggal akhir periode saat ini
 * @returns {object} - { startDate: Date, endDate: Date }
 */
export function getPreviousPeriod(startDate, endDate) {
    const diff = endDate.getTime() - startDate.getTime();
    return {
        startDate: new Date(startDate.getTime() - diff),
        endDate: startDate
    };
}

/**
 * Format label chart berdasarkan periode
 * @param {string} period - 'daily', 'weekly', 'monthly'
 * @param {Date|string} date - Tanggal
 * @returns {string}
 */
export function formatChartLabel(period, date) {
    const d = new Date(date);

    switch (period) {
        case 'hourly':
            return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        case 'daily':
            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        case 'weekly':
            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        case 'monthly':
            return d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        default:
            return d.toLocaleDateString('id-ID');
    }
}

/**
 * Generate array tanggal untuk chart labels
 * @param {Date} startDate - Tanggal mulai
 * @param {Date} endDate - Tanggal akhir
 * @param {string} granularity - 'day', 'week', 'month'
 * @returns {Array} - Array of dates
 */
export function generateDateArray(startDate, endDate, granularity = 'day') {
    const dates = [];
    const current = new Date(startDate);

    while (current <= endDate) {
        dates.push(new Date(current));

        switch (granularity) {
            case 'hour':
                current.setHours(current.getHours() + 1);
                break;
            case 'day':
                current.setDate(current.getDate() + 1);
                break;
            case 'week':
                current.setDate(current.getDate() + 7);
                break;
            case 'month':
                current.setMonth(current.getMonth() + 1);
                break;
            default:
                current.setDate(current.getDate() + 1);
        }
    }

    return dates;
}

/**
 * Sort data array by key
 * @param {Array} data - Array data
 * @param {string} key - Key untuk sort
 * @param {string} order - 'asc' atau 'desc'
 * @returns {Array}
 */
export function sortData(data, key, order = 'asc') {
    return [...data].sort((a, b) => {
        if (order === 'asc') {
            return a[key] > b[key] ? 1 : -1;
        }
        return a[key] < b[key] ? 1 : -1;
    });
}

/**
 * Group data array by key
 * @param {Array} data - Array data
 * @param {string} key - Key untuk grouping
 * @returns {object} - Object dengan grouped data
 */
export function groupBy(data, key) {
    return data.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
}

/**
 * Aggregate sum data array by key
 * @param {Array} data - Array data
 * @param {string} sumKey - Key untuk di-sum
 * @param {string} groupKey - Key untuk grouping (optional)
 * @returns {number|object}
 */
export function aggregateSum(data, sumKey, groupKey = null) {
    if (groupKey) {
        const grouped = groupBy(data, groupKey);
        return Object.entries(grouped).map(([key, items]) => ({
            [groupKey]: key,
            [sumKey]: items.reduce((sum, item) => sum + (item[sumKey] || 0), 0)
        }));
    }
    return data.reduce((sum, item) => sum + (item[sumKey] || 0), 0);
}

/**
 * Format metode pembayaran
 * @param {string} metode - Kode metode pembayaran
 * @returns {string}
 */
export function formatPaymentMethod(metode) {
    const methods = {
        'cash': 'Tunai',
        'card': 'Kartu Debit/Kredit',
        'transfer': 'Transfer',
        'qr': 'QRIS',
        'e-wallet': 'E-Wallet'
    };
    return methods[metode] || metode;
}

/**
 * Format status transaksi
 * @param {string} status - Kode status
 * @returns {object} - { label: string, color: string }
 */
export function formatTransactionStatus(status) {
    const statuses = {
        'success': { label: 'Berhasil', color: 'bg-green-100 text-green-800' },
        'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
        'cancelled': { label: 'Batal', color: 'bg-red-100 text-red-800' },
        'refunded': { label: 'Refund', color: 'bg-orange-100 text-orange-800' }
    };
    return statuses[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
}
