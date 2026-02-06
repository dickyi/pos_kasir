/**
 * +page.server.js - Monitoring Kasir Overview (SYNCED)
 * =====================================================
 * Halaman overview untuk monitoring shift kasir
 * 
 * SYNCED: Semua nama variabel sudah cocok dengan +page.svelte
 * 
 * Data yang ditampilkan:
 * - Shift aktif saat ini (activeShifts)
 * - Statistik hari ini (todayStats)
 * - Semua shift hari ini (todayShifts)
 * - Performa kasir (kasirPerformance)
 * - Shift terakhir ditutup (recentClosedShifts)
 * =====================================================
 */

import { query } from '$lib/db';
import { error } from '@sveltejs/kit';

console.log('🟢 SHIFT MONITORING PAGE.SERVER.JS LOADED');

export async function load({ parent }) {
    console.log('🟢 SHIFT MONITORING LOAD FUNCTION CALLED');
    
    try {
        const { user, tenantUser, settings } = await parent();
        
        if (!user || !user.pelanggan_id) {
            throw error(401, 'Unauthorized');
        }

        // Cek role - hanya owner dan admin
        const allowedRoles = ['owner', 'admin'];
        if (!allowedRoles.includes(tenantUser?.role?.toLowerCase())) {
            throw error(403, 'Anda tidak memiliki akses ke halaman ini');
        }
        
        const pelangganId = user.pelanggan_id;
        const today = new Date().toISOString().split('T')[0];
        
        console.log('🟢 Loading shift data for pelanggan:', pelangganId);
        console.log('🟢 Today:', today);
        
        // =============================================
        // 1. SHIFT AKTIF (yang sedang buka)
        // =============================================
        const activeShifts = await query(`
            SELECT 
                s.*,
                tu.nama as kasir_nama,
                tu.email as kasir_email,
                tu.role as kasir_role,
                TIMESTAMPDIFF(MINUTE, s.waktu_buka, NOW()) as durasi_menit
            FROM shifts s
            LEFT JOIN tenant_users tu ON s.tenant_user_id = tu.id
            WHERE s.pelanggan_id = ? 
              AND s.status = 'open'
            ORDER BY s.waktu_buka DESC
        `, [pelangganId]);
        
        console.log('🟢 Active shifts loaded:', activeShifts.length);
        
        // =============================================
        // 2. STATISTIK HARI INI (todayStats)
        // Nama field harus cocok dengan +page.svelte
        // =============================================
        const todayStatsResult = await query(`
            SELECT 
                COUNT(*) as total_shift,
                COUNT(CASE WHEN status = 'open' THEN 1 END) as shift_aktif,
                COUNT(CASE WHEN status = 'closed' THEN 1 END) as shift_selesai,
                COALESCE(SUM(total_transaksi), 0) as total_transaksi,
                COALESCE(SUM(total_penjualan), 0) as total_penjualan,
                COALESCE(SUM(total_penjualan_bersih), 0) as total_penjualan_bersih,
                COALESCE(SUM(total_diskon), 0) as total_diskon,
                COALESCE(SUM(penjualan_tunai), 0) as total_tunai,
                COALESCE(SUM(penjualan_qris), 0) as total_qris,
                COALESCE(SUM(penjualan_transfer), 0) as total_transfer,
                COALESCE(SUM(penjualan_debit), 0) as total_debit,
                COALESCE(SUM(penjualan_kredit), 0) as total_kredit,
                COALESCE(SUM(total_kas_masuk), 0) as total_kas_masuk,
                COALESCE(SUM(total_kas_keluar), 0) as total_kas_keluar,
                COALESCE(SUM(CASE WHEN status = 'closed' THEN selisih_kas ELSE 0 END), 0) as total_selisih
            FROM shifts
            WHERE pelanggan_id = ? 
              AND tanggal = ?
        `, [pelangganId, today]);
        
        const todayStats = todayStatsResult[0] || {
            total_shift: 0,
            shift_aktif: 0,
            shift_selesai: 0,
            total_transaksi: 0,
            total_penjualan: 0,
            total_penjualan_bersih: 0,
            total_diskon: 0,
            total_tunai: 0,
            total_qris: 0,
            total_transfer: 0,
            total_debit: 0,
            total_kredit: 0,
            total_kas_masuk: 0,
            total_kas_keluar: 0,
            total_selisih: 0
        };
        
        console.log('🟢 Today stats loaded');
        
        // =============================================
        // 3. SEMUA SHIFT HARI INI (todayShifts)
        // =============================================
        const todayShifts = await query(`
            SELECT 
                s.*,
                tu.nama as kasir_nama,
                tu.email as kasir_email,
                tu.role as kasir_role,
                closed_by_user.nama as closed_by_nama,
                TIMESTAMPDIFF(MINUTE, s.waktu_buka, COALESCE(s.waktu_tutup, NOW())) as durasi_menit
            FROM shifts s
            LEFT JOIN tenant_users tu ON s.tenant_user_id = tu.id
            LEFT JOIN tenant_users closed_by_user ON s.closed_by = closed_by_user.id
            WHERE s.pelanggan_id = ?
              AND s.tanggal = ?
            ORDER BY s.waktu_buka DESC
        `, [pelangganId, today]);
        
        console.log('🟢 Today shifts loaded:', todayShifts.length);
        
        // =============================================
        // 4. PERFORMA KASIR HARI INI (kasirPerformance)
        // =============================================
        const kasirPerformance = await query(`
            SELECT 
                tu.id as kasir_id,
                tu.nama as kasir_nama,
                tu.role as kasir_role,
                COUNT(s.id) as jumlah_shift,
                COALESCE(SUM(s.total_transaksi), 0) as total_transaksi,
                COALESCE(SUM(s.total_penjualan_bersih), 0) as total_penjualan,
                COALESCE(SUM(CASE WHEN s.status = 'closed' THEN s.selisih_kas ELSE 0 END), 0) as total_selisih,
                MAX(CASE WHEN s.status = 'open' THEN 1 ELSE 0 END) as sedang_shift
            FROM tenant_users tu
            LEFT JOIN shifts s ON tu.id = s.tenant_user_id 
                AND s.tanggal = ? 
                AND s.pelanggan_id = ?
            WHERE tu.pelanggan_id = ?
              AND tu.status = 'aktif'
              AND tu.role IN ('kasir', 'admin', 'owner')
            GROUP BY tu.id, tu.nama, tu.role
            HAVING jumlah_shift > 0 OR sedang_shift > 0
            ORDER BY total_penjualan DESC
        `, [today, pelangganId, pelangganId]);
        
        console.log('🟢 Kasir performance loaded:', kasirPerformance.length);
        
        // =============================================
        // 5. SHIFT TERAKHIR DITUTUP (recentClosedShifts)
        // =============================================
        const recentClosedShifts = await query(`
            SELECT 
                s.*,
                tu.nama as kasir_nama,
                tu.role as kasir_role
            FROM shifts s
            LEFT JOIN tenant_users tu ON s.tenant_user_id = tu.id
            WHERE s.pelanggan_id = ?
              AND s.status = 'closed'
            ORDER BY s.waktu_tutup DESC
            LIMIT 5
        `, [pelangganId]);
        
        console.log('🟢 Recent closed shifts loaded:', recentClosedShifts.length);
        
        // =============================================
        // 6. GET KASIR MODE SETTING
        // =============================================
        let kasirMode = 'single';
        try {
            const settingsResult = await query(`
                SELECT kasir_mode 
                FROM pengaturan 
                WHERE pelanggan_id = ?
            `, [pelangganId]);
            
            if (settingsResult && settingsResult[0]) {
                kasirMode = settingsResult[0].kasir_mode || 'single';
            }
        } catch (err) {
            console.log('🟡 Kasir mode setting not found, using default');
        }
        
        // =============================================
        // RETURN DATA (sesuai dengan +page.svelte)
        // =============================================
        return {
            activeShifts: activeShifts || [],
            todayStats,
            todayShifts: todayShifts || [],
            kasirPerformance: kasirPerformance || [],
            recentClosedShifts: recentClosedShifts || [],
            kasirMode,
            today,
            currentUser: {
                id: tenantUser?.id,
                nama: tenantUser?.nama,
                role: tenantUser?.role
            }
        };
        
    } catch (err) {
        console.error('❌ Error loading shift monitoring:', err);
        
        if (err.status) {
            throw err;
        }
        
        throw error(500, {
            message: 'Gagal memuat data monitoring shift',
            details: err.message
        });
    }
}