/**
 * ============================================
 * FORMAT UTILITIES
 * ============================================
 * Helper functions untuk formatting data
 * 
 * @module lib/utils/format
 * 
 * @example
 * import { formatRupiah, formatRupiahShort, formatNumber } from '$lib/utils/format';
 * ============================================
 */

// ============================================
// CURRENCY FORMATTING
// ============================================

/**
 * Format angka ke Rupiah (Rp 10.000)
 * @param {number} angka 
 * @returns {string}
 */
export function formatRupiah(angka) {
    if (!angka && angka !== 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

/**
 * Format angka ke Rupiah singkat (Rp 10rb, Rp 1.5jt)
 * @param {number} angka 
 * @returns {string}
 */
export function formatRupiahShort(angka) {
    if (!angka && angka !== 0) return 'Rp 0';
    if (angka >= 1000000000) return 'Rp ' + (angka / 1000000000).toFixed(1) + 'M';
    if (angka >= 1000000) {
        const juta = angka / 1000000;
        return 'Rp ' + (juta % 1 === 0 ? juta : juta.toFixed(1)) + 'jt';
    }
    if (angka >= 1000) return 'Rp ' + Math.round(angka / 1000) + 'rb';
    return 'Rp ' + angka;
}

/**
 * Format angka ke Rupiah singkat tanpa prefix (10rb, 1.5jt)
 * @param {number} angka 
 * @returns {string}
 */
export function formatRupiahCompact(angka) {
    if (!angka && angka !== 0) return '0';
    if (angka >= 1000000000) return (angka / 1000000000).toFixed(1) + 'M';
    if (angka >= 1000000) {
        const juta = angka / 1000000;
        return (juta % 1 === 0 ? juta : juta.toFixed(1)) + 'jt';
    }
    if (angka >= 1000) return Math.round(angka / 1000) + 'rb';
    return angka.toString();
}

// ============================================
// NUMBER FORMATTING
// ============================================

/**
 * Format angka dengan separator ribuan (1.000.000)
 * @param {number} num 
 * @returns {string}
 */
export function formatNumber(num) {
    if (!num && num !== 0) return '0';
    return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format persentase (25.5%)
 * @param {number} num 
 * @param {number} decimals 
 * @returns {string}
 */
export function formatPercent(num, decimals = 1) {
    if (!num && num !== 0) return '0%';
    return num.toFixed(decimals) + '%';
}

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format tanggal lengkap (Senin, 1 Januari 2024)
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Format tanggal lengkap - alias untuk formatDate (Senin, 1 Januari 2024)
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export function formatDateLong(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Format tanggal singkat (1 Jan 2024)
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export function formatDateShort(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Format tanggal medium (1 Januari)
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export function formatDateMedium(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
    });
}

/**
 * Format tanggal ISO (2024-01-15)
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export function formatDateISO(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
}

// ============================================
// TIME FORMATTING
// ============================================

/**
 * Format waktu (14:30)
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export function formatTime(dateStr) {
    if (!dateStr) return '-';
    
    // Handle time string format (HH:mm:ss)
    if (typeof dateStr === 'string' && dateStr.includes(':') && !dateStr.includes('T')) {
        return dateStr.substring(0, 5);
    }
    
    return new Date(dateStr).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

/**
 * Format waktu dengan detik (14:30:45)
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export function formatTimeWithSeconds(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

/**
 * Format tanggal dan waktu (1 Jan 2024, 14:30)
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }) + ', ' + date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

/**
 * Format tanggal dan waktu lengkap (Senin, 1 Januari 2024, 14:30)
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export function formatDateTimeLong(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }) + ', ' + date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// ============================================
// DURATION FORMATTING
// ============================================

/**
 * Format durasi dalam menit ke format jam dan menit
 * @param {number} menit 
 * @returns {string}
 */
export function formatDuration(menit) {
    if (!menit && menit !== 0) return '-';
    const jam = Math.floor(menit / 60);
    const sisaMenit = Math.round(menit % 60);
    if (jam > 0) {
        return `${jam} jam ${sisaMenit} menit`;
    }
    return `${sisaMenit} menit`;
}

/**
 * Format durasi singkat (2j 30m)
 * @param {number} menit 
 * @returns {string}
 */
export function formatDurationShort(menit) {
    if (!menit && menit !== 0) return '-';
    const jam = Math.floor(menit / 60);
    const sisaMenit = Math.round(menit % 60);
    if (jam > 0) {
        return sisaMenit > 0 ? `${jam}j ${sisaMenit}m` : `${jam}j`;
    }
    return `${sisaMenit}m`;
}

// ============================================
// CALCULATION HELPERS
// ============================================

/**
 * Hitung persentase growth
 * @param {number} current 
 * @param {number} previous 
 * @returns {number}
 */
export function calculateGrowth(current, previous) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
}

/**
 * Hitung persentase dari total
 * @param {number} value 
 * @param {number} total 
 * @returns {number}
 */
export function calculatePercentage(value, total) {
    if (!total || total === 0) return 0;
    return (value / total) * 100;
}