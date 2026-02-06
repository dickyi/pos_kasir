/**
 * ============================================
 * LAPORAN SHIFT - SERVER LOAD
 * ============================================
 * Load data shift untuk halaman laporan
 * - Filter berdasarkan periode
 * - Summary statistik shift
 * - Detail per shift dengan rekap
 * ============================================
 */

import { query } from '$lib/db.js';
import { redirect } from '@sveltejs/kit';

export async function load({ parent, url }) {
    // Get user from parent
    const parentData = await parent();
    const user = parentData?.user;

    // Auth check
    if (!user) {
        throw redirect(302, '/tenant/login');
    }

    const pelangganId = user.pelanggan_id;
    const tenantRole = user.tenant_role;

    // Permission check - kasir tidak bisa akses
    if (tenantRole === 'kasir') {
        throw redirect(302, '/tenant/laporan');
    }

    // Get period filter
    const period = url.searchParams.get('period') || 'today';
    const { startDate, endDate, comparisonStart, comparisonEnd } = getDateRange(period);

    try {
        // Get shifts data
        const shifts = await getShifts(pelangganId, startDate, endDate);
        
        // Get summary
        const summary = await getSummary(pelangganId, startDate, endDate);
        
        // Get comparison summary (periode sebelumnya)
        const comparisonSummary = await getSummary(pelangganId, comparisonStart, comparisonEnd);
        
        // Get shift by kasir breakdown
        const kasirBreakdown = await getKasirBreakdown(pelangganId, startDate, endDate);
        
        // Get daily summary (untuk chart)
        const dailySummary = await getDailySummary(pelangganId, startDate, endDate);
        
        // Get selisih summary
        const selisihSummary = await getSelisihSummary(pelangganId, startDate, endDate);

        return {
            user,
            shifts,
            summary,
            comparisonSummary,
            kasirBreakdown,
            dailySummary,
            selisihSummary,
            period,
            dateRange: { startDate, endDate }
        };
    } catch (error) {
        console.error('Error loading shift report:', error);
        return {
            user,
            shifts: [],
            summary: null,
            comparisonSummary: null,
            kasirBreakdown: [],
            dailySummary: [],
            selisihSummary: null,
            period,
            dateRange: { startDate, endDate },
            error: 'Gagal memuat data laporan shift'
        };
    }
}

/**
 * Helper: Get date range based on period
 */
function getDateRange(period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate, endDate, comparisonStart, comparisonEnd;
    
    switch (period) {
        case 'yesterday':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 1);
            endDate = new Date(startDate);
            // Comparison: 2 hari lalu
            comparisonStart = new Date(startDate);
            comparisonStart.setDate(comparisonStart.getDate() - 1);
            comparisonEnd = new Date(comparisonStart);
            break;
            
        case 'week':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 6);
            endDate = new Date(today);
            // Comparison: 7 hari sebelumnya
            comparisonStart = new Date(startDate);
            comparisonStart.setDate(comparisonStart.getDate() - 7);
            comparisonEnd = new Date(startDate);
            comparisonEnd.setDate(comparisonEnd.getDate() - 1);
            break;
            
        case 'month':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 29);
            endDate = new Date(today);
            // Comparison: 30 hari sebelumnya
            comparisonStart = new Date(startDate);
            comparisonStart.setDate(comparisonStart.getDate() - 30);
            comparisonEnd = new Date(startDate);
            comparisonEnd.setDate(comparisonEnd.getDate() - 1);
            break;
            
        case 'today':
        default:
            startDate = new Date(today);
            endDate = new Date(today);
            // Comparison: kemarin
            comparisonStart = new Date(today);
            comparisonStart.setDate(comparisonStart.getDate() - 1);
            comparisonEnd = new Date(comparisonStart);
            break;
    }
    
    return {
        startDate: formatDateForDB(startDate),
        endDate: formatDateForDB(endDate),
        comparisonStart: formatDateForDB(comparisonStart),
        comparisonEnd: formatDateForDB(comparisonEnd)
    };
}

/**
 * Helper: Format date for database query
 */
function formatDateForDB(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Get shifts data dengan detail
 */
async function getShifts(pelangganId, startDate, endDate) {
    const rows = await query(`
        SELECT 
            s.id,
            s.no_shift,
            s.tanggal,
            s.shift_ke,
            s.waktu_buka,
            s.waktu_tutup,
            s.modal_awal,
            s.sumber_modal,
            s.total_transaksi,
            s.total_penjualan,
            s.total_diskon,
            s.total_penjualan_bersih,
            s.penjualan_tunai,
            s.penjualan_qris,
            s.penjualan_transfer,
            s.penjualan_debit,
            s.penjualan_kredit,
            s.total_kas_masuk,
            s.total_kas_keluar,
            s.kas_akhir_sistem,
            s.kas_akhir_aktual,
            s.selisih_kas,
            s.status_selisih,
            s.status,
            s.catatan_buka,
            s.catatan_tutup,
            tu.nama AS kasir_nama,
            tu.email AS kasir_email,
            tu2.nama AS closed_by_nama,
            TIMESTAMPDIFF(MINUTE, s.waktu_buka, COALESCE(s.waktu_tutup, NOW())) AS durasi_menit
        FROM shifts s
        JOIN tenant_users tu ON s.tenant_user_id = tu.id
        LEFT JOIN tenant_users tu2 ON s.closed_by = tu2.id
        WHERE s.pelanggan_id = ?
        AND s.tanggal BETWEEN ? AND ?
        ORDER BY s.tanggal DESC, s.shift_ke DESC
    `, [pelangganId, startDate, endDate]);
    
    return rows || [];
}

/**
 * Get summary statistik
 */
async function getSummary(pelangganId, startDate, endDate) {
    const rows = await query(`
        SELECT
            COUNT(*) AS total_shift,
            SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS shift_closed,
            SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS shift_open,
            COALESCE(SUM(modal_awal), 0) AS total_modal,
            COALESCE(SUM(total_transaksi), 0) AS total_transaksi,
            COALESCE(SUM(total_penjualan_bersih), 0) AS total_penjualan,
            COALESCE(SUM(penjualan_tunai), 0) AS total_tunai,
            COALESCE(SUM(penjualan_qris), 0) AS total_qris,
            COALESCE(SUM(penjualan_transfer), 0) AS total_transfer,
            COALESCE(SUM(penjualan_debit), 0) AS total_debit,
            COALESCE(SUM(penjualan_kredit), 0) AS total_kredit,
            COALESCE(SUM(total_kas_masuk), 0) AS total_kas_masuk,
            COALESCE(SUM(total_kas_keluar), 0) AS total_kas_keluar,
            COALESCE(SUM(selisih_kas), 0) AS total_selisih,
            SUM(CASE WHEN status_selisih = 'seimbang' THEN 1 ELSE 0 END) AS shift_seimbang,
            SUM(CASE WHEN status_selisih = 'lebih' THEN 1 ELSE 0 END) AS shift_lebih,
            SUM(CASE WHEN status_selisih = 'kurang' THEN 1 ELSE 0 END) AS shift_kurang,
            AVG(TIMESTAMPDIFF(MINUTE, waktu_buka, waktu_tutup)) AS avg_durasi_menit
        FROM shifts
        WHERE pelanggan_id = ?
        AND tanggal BETWEEN ? AND ?
    `, [pelangganId, startDate, endDate]);
    
    return rows?.[0] || null;
}

/**
 * Get breakdown per kasir
 */
async function getKasirBreakdown(pelangganId, startDate, endDate) {
    const rows = await query(`
        SELECT
            tu.id AS kasir_id,
            tu.nama AS kasir_nama,
            COUNT(s.id) AS jumlah_shift,
            COALESCE(SUM(s.total_transaksi), 0) AS total_transaksi,
            COALESCE(SUM(s.total_penjualan_bersih), 0) AS total_penjualan,
            COALESCE(SUM(s.selisih_kas), 0) AS total_selisih,
            SUM(CASE WHEN s.status_selisih = 'seimbang' THEN 1 ELSE 0 END) AS shift_seimbang,
            SUM(CASE WHEN s.status_selisih = 'lebih' THEN 1 ELSE 0 END) AS shift_lebih,
            SUM(CASE WHEN s.status_selisih = 'kurang' THEN 1 ELSE 0 END) AS shift_kurang,
            AVG(TIMESTAMPDIFF(MINUTE, s.waktu_buka, s.waktu_tutup)) AS avg_durasi
        FROM shifts s
        JOIN tenant_users tu ON s.tenant_user_id = tu.id
        WHERE s.pelanggan_id = ?
        AND s.tanggal BETWEEN ? AND ?
        GROUP BY tu.id, tu.nama
        ORDER BY total_penjualan DESC
    `, [pelangganId, startDate, endDate]);
    
    return rows || [];
}

/**
 * Get daily summary untuk chart
 */
async function getDailySummary(pelangganId, startDate, endDate) {
    const rows = await query(`
        SELECT
            tanggal,
            COUNT(*) AS jumlah_shift,
            COALESCE(SUM(total_transaksi), 0) AS total_transaksi,
            COALESCE(SUM(total_penjualan_bersih), 0) AS total_penjualan,
            COALESCE(SUM(penjualan_tunai), 0) AS total_tunai,
            COALESCE(SUM(penjualan_qris), 0) AS total_qris,
            COALESCE(SUM(penjualan_transfer), 0) AS total_transfer
        FROM shifts
        WHERE pelanggan_id = ?
        AND tanggal BETWEEN ? AND ?
        GROUP BY tanggal
        ORDER BY tanggal ASC
    `, [pelangganId, startDate, endDate]);
    
    return rows || [];
}

/**
 * Get selisih summary
 */
async function getSelisihSummary(pelangganId, startDate, endDate) {
    const rows = await query(`
        SELECT
            SUM(CASE WHEN selisih_kas > 0 THEN selisih_kas ELSE 0 END) AS total_lebih,
            SUM(CASE WHEN selisih_kas < 0 THEN ABS(selisih_kas) ELSE 0 END) AS total_kurang,
            COUNT(CASE WHEN status_selisih = 'seimbang' THEN 1 END) AS count_seimbang,
            COUNT(CASE WHEN status_selisih = 'lebih' THEN 1 END) AS count_lebih,
            COUNT(CASE WHEN status_selisih = 'kurang' THEN 1 END) AS count_kurang
        FROM shifts
        WHERE pelanggan_id = ?
        AND tanggal BETWEEN ? AND ?
        AND status = 'closed'
    `, [pelangganId, startDate, endDate]);
    
    return rows?.[0] || null;
}