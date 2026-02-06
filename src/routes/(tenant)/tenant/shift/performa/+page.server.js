/**
 * +page.server.js - Performa Kasir (SYNCED)
 * =====================================================
 * Halaman untuk melihat ranking dan statistik kasir
 * 
 * SYNCED: Menggunakan struktur yang sama dengan Overview & Riwayat
 * - Menggunakan await parent() untuk auth
 * - Menggunakan pelanggan_id (bukan tenant_id)
 * =====================================================
 */

import { query } from '$lib/db';
import { error } from '@sveltejs/kit';

console.log('🟢 PERFORMA KASIR PAGE.SERVER.JS LOADED');

export async function load({ parent, url }) {
    console.log('🟢 PERFORMA KASIR LOAD FUNCTION CALLED');
    
    try {
        const { user, tenantUser } = await parent();
        
        if (!user || !user.pelanggan_id) {
            throw error(401, 'Unauthorized');
        }

        // Cek role - hanya owner dan admin
        const allowedRoles = ['owner', 'admin'];
        if (!allowedRoles.includes(tenantUser?.role?.toLowerCase())) {
            throw error(403, 'Anda tidak memiliki akses ke halaman ini');
        }
        
        const pelangganId = user.pelanggan_id;
        
        // =============================================
        // FILTER PARAMETERS
        // =============================================
        const periode = url.searchParams.get('periode') || 'bulan_ini';
        const startDate = url.searchParams.get('start');
        const endDate = url.searchParams.get('end');
        
        // Calculate date range based on periode
        const today = new Date();
        let dateFrom, dateTo;
        
        switch (periode) {
            case 'hari_ini':
                dateFrom = today.toISOString().split('T')[0];
                dateTo = dateFrom;
                break;
            case 'minggu_ini':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                dateFrom = weekStart.toISOString().split('T')[0];
                dateTo = today.toISOString().split('T')[0];
                break;
            case 'bulan_ini':
                dateFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
                dateTo = today.toISOString().split('T')[0];
                break;
            case 'bulan_lalu':
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                dateFrom = lastMonth.toISOString().split('T')[0];
                dateTo = lastMonthEnd.toISOString().split('T')[0];
                break;
            case 'custom':
                dateFrom = startDate || today.toISOString().split('T')[0];
                dateTo = endDate || today.toISOString().split('T')[0];
                break;
            default:
                dateFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
                dateTo = today.toISOString().split('T')[0];
        }
        
        console.log('🟢 Date range:', dateFrom, 'to', dateTo);
        
        // =============================================
        // 1. RANKING KASIR (Berdasarkan Penjualan)
        // =============================================
        const kasirRanking = await query(`
            SELECT 
                tu.id as kasir_id,
                tu.nama as nama_kasir,
                tu.email,
                tu.role,
                COUNT(DISTINCT s.id) as total_shift,
                COALESCE(SUM(s.total_transaksi), 0) as total_transaksi,
                COALESCE(SUM(s.total_penjualan_bersih), 0) as total_penjualan,
                COALESCE(AVG(CASE WHEN s.total_transaksi > 0 THEN s.total_penjualan_bersih / s.total_transaksi ELSE 0 END), 0) as avg_per_transaksi,
                COALESCE(SUM(TIMESTAMPDIFF(MINUTE, s.waktu_buka, COALESCE(s.waktu_tutup, NOW()))), 0) as total_menit_kerja,
                COALESCE(SUM(CASE WHEN s.status = 'closed' THEN s.selisih_kas ELSE 0 END), 0) as total_selisih
            FROM tenant_users tu
            LEFT JOIN shifts s ON s.tenant_user_id = tu.id 
                AND s.tanggal BETWEEN ? AND ?
                AND s.pelanggan_id = ?
            WHERE tu.pelanggan_id = ?
                AND tu.role IN ('kasir', 'admin', 'owner')
                AND tu.status = 'aktif'
            GROUP BY tu.id, tu.nama, tu.email, tu.role
            HAVING total_shift > 0
            ORDER BY total_penjualan DESC
        `, [dateFrom, dateTo, pelangganId, pelangganId]);
        
        console.log('🟢 Kasir ranking loaded:', kasirRanking.length);
        
        // =============================================
        // 2. STATISTIK KESELURUHAN
        // =============================================
        const overallStatsResult = await query(`
            SELECT 
                COUNT(DISTINCT s.id) as total_shift,
                COUNT(DISTINCT s.tenant_user_id) as total_kasir_aktif,
                COALESCE(SUM(s.total_transaksi), 0) as total_transaksi,
                COALESCE(SUM(s.total_penjualan_bersih), 0) as total_penjualan,
                COALESCE(AVG(CASE WHEN s.total_transaksi > 0 THEN s.total_penjualan_bersih / s.total_transaksi ELSE 0 END), 0) as avg_per_transaksi,
                COALESCE(SUM(s.penjualan_tunai), 0) as total_tunai,
                COALESCE(SUM(s.penjualan_qris), 0) as total_qris,
                COALESCE(SUM(s.penjualan_transfer), 0) as total_transfer
            FROM shifts s
            WHERE s.pelanggan_id = ?
                AND s.tanggal BETWEEN ? AND ?
        `, [pelangganId, dateFrom, dateTo]);
        
        const overallStats = overallStatsResult[0] || {
            total_shift: 0,
            total_kasir_aktif: 0,
            total_transaksi: 0,
            total_penjualan: 0,
            avg_per_transaksi: 0,
            total_tunai: 0,
            total_qris: 0,
            total_transfer: 0
        };
        
        // =============================================
        // 3. TREND HARIAN
        // =============================================
        const trendHarian = await query(`
            SELECT 
                s.tanggal,
                COUNT(DISTINCT s.id) as jumlah_shift,
                COALESCE(SUM(s.total_transaksi), 0) as jumlah_transaksi,
                COALESCE(SUM(s.total_penjualan_bersih), 0) as total_penjualan
            FROM shifts s
            WHERE s.pelanggan_id = ?
                AND s.tanggal BETWEEN ? AND ?
            GROUP BY s.tanggal
            ORDER BY s.tanggal ASC
        `, [pelangganId, dateFrom, dateTo]);
        
        console.log('🟢 Trend harian loaded:', trendHarian.length);
        
        // =============================================
        // 4. TOP PERFORMER
        // =============================================
        const topPerformer = kasirRanking.length > 0 ? kasirRanking[0] : null;
        
        // =============================================
        // 5. PERBANDINGAN DENGAN PERIODE SEBELUMNYA
        // =============================================
        const daysDiff = Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24)) + 1;
        const prevDateTo = new Date(dateFrom);
        prevDateTo.setDate(prevDateTo.getDate() - 1);
        const prevDateFrom = new Date(prevDateTo);
        prevDateFrom.setDate(prevDateFrom.getDate() - daysDiff + 1);
        
        const prevStatsResult = await query(`
            SELECT 
                COALESCE(SUM(s.total_transaksi), 0) as total_transaksi,
                COALESCE(SUM(s.total_penjualan_bersih), 0) as total_penjualan
            FROM shifts s
            WHERE s.pelanggan_id = ?
                AND s.tanggal BETWEEN ? AND ?
        `, [pelangganId, prevDateFrom.toISOString().split('T')[0], prevDateTo.toISOString().split('T')[0]]);
        
        const prevStats = prevStatsResult[0] || { total_transaksi: 0, total_penjualan: 0 };
        
        // Hitung growth
        const penjualanGrowth = prevStats.total_penjualan > 0 
            ? ((overallStats.total_penjualan - prevStats.total_penjualan) / prevStats.total_penjualan) * 100 
            : 0;
        const transaksiGrowth = prevStats.total_transaksi > 0
            ? ((overallStats.total_transaksi - prevStats.total_transaksi) / prevStats.total_transaksi) * 100
            : 0;
        
        // =============================================
        // 6. DISTRIBUSI METODE PEMBAYARAN
        // =============================================
        const metodePembayaran = [
            { metode: 'Tunai', total: overallStats.total_tunai || 0 },
            { metode: 'QRIS', total: overallStats.total_qris || 0 },
            { metode: 'Transfer', total: overallStats.total_transfer || 0 }
        ].filter(m => m.total > 0);
        
        // =============================================
        // RETURN DATA
        // =============================================
        return {
            kasirRanking: kasirRanking || [],
            overallStats: {
                ...overallStats,
                penjualan_growth: penjualanGrowth,
                transaksi_growth: transaksiGrowth
            },
            trendHarian: trendHarian || [],
            topPerformer,
            metodePembayaran,
            filter: {
                periode,
                dateFrom,
                dateTo
            },
            currentUser: {
                id: tenantUser?.id,
                nama: tenantUser?.nama,
                role: tenantUser?.role
            }
        };
        
    } catch (err) {
        console.error('❌ Error loading performa kasir:', err);
        
        if (err.status) {
            throw err;
        }
        
        throw error(500, {
            message: 'Gagal memuat data performa kasir',
            details: err.message
        });
    }
}