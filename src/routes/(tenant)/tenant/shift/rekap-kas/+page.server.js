/**
 * +page.server.js - Rekap Kas (SYNCED)
 * =====================================================
 * Halaman untuk melihat rekap kas dan selisih
 * 
 * SYNCED: Menggunakan struktur yang sama dengan Overview & Riwayat
 * - Menggunakan await parent() untuk auth
 * - Menggunakan pelanggan_id (bukan tenant_id)
 * =====================================================
 */

import { query } from '$lib/db';
import { error } from '@sveltejs/kit';

console.log('🟢 REKAP KAS PAGE.SERVER.JS LOADED');

export async function load({ parent, url }) {
    console.log('🟢 REKAP KAS LOAD FUNCTION CALLED');
    
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
        // 1. RINGKASAN KAS
        // =============================================
        const ringkasanKasResult = await query(`
            SELECT 
                COALESCE(SUM(s.modal_awal), 0) as total_modal,
                COALESCE(SUM(s.penjualan_tunai), 0) as total_penjualan_tunai,
                COALESCE(SUM(s.kas_akhir_sistem), 0) as total_kas_sistem,
                COALESCE(SUM(s.kas_akhir_aktual), 0) as total_kas_aktual,
                COALESCE(SUM(CASE WHEN s.status = 'closed' THEN s.selisih_kas ELSE 0 END), 0) as total_selisih,
                COALESCE(SUM(s.total_kas_masuk), 0) as total_kas_masuk,
                COALESCE(SUM(s.total_kas_keluar), 0) as total_kas_keluar,
                COUNT(s.id) as total_shift,
                SUM(CASE WHEN s.status = 'closed' AND s.selisih_kas > 0 THEN 1 ELSE 0 END) as shift_lebih,
                SUM(CASE WHEN s.status = 'closed' AND s.selisih_kas < 0 THEN 1 ELSE 0 END) as shift_kurang,
                SUM(CASE WHEN s.status = 'closed' AND (s.selisih_kas = 0 OR s.selisih_kas IS NULL) THEN 1 ELSE 0 END) as shift_seimbang
            FROM shifts s
            WHERE s.pelanggan_id = ?
                AND s.tanggal BETWEEN ? AND ?
        `, [pelangganId, dateFrom, dateTo]);
        
        const ringkasanKas = ringkasanKasResult[0] || {
            total_modal: 0,
            total_penjualan_tunai: 0,
            total_kas_sistem: 0,
            total_kas_aktual: 0,
            total_selisih: 0,
            total_kas_masuk: 0,
            total_kas_keluar: 0,
            total_shift: 0,
            shift_lebih: 0,
            shift_kurang: 0,
            shift_seimbang: 0
        };
        
        console.log('🟢 Ringkasan kas loaded');
        
        // =============================================
        // 2. TRANSAKSI KAS (dari kas_transaksi jika ada)
        // =============================================
        let kasTransaksi = [];
        try {
            kasTransaksi = await query(`
                SELECT 
                    kt.id,
                    kt.shift_id,
                    kt.tipe,
                    kt.jumlah,
                    kt.keterangan,
                    kt.created_at,
                    kk.nama as kategori_nama,
                    kk.icon as kategori_icon,
                    kk.warna as kategori_warna,
                    tu.nama as kasir_nama
                FROM kas_transaksi kt
                LEFT JOIN kategori_kas kk ON kt.kategori_id = kk.id
                LEFT JOIN shifts s ON kt.shift_id = s.id
                LEFT JOIN tenant_users tu ON s.tenant_user_id = tu.id
                WHERE s.pelanggan_id = ?
                    AND DATE(kt.created_at) BETWEEN ? AND ?
                ORDER BY kt.created_at DESC
                LIMIT 50
            `, [pelangganId, dateFrom, dateTo]);
        } catch (e) {
            console.log('🟡 kas_transaksi table may not exist or different structure');
        }
        
        console.log('🟢 Kas transaksi loaded:', kasTransaksi.length);
        
        // =============================================
        // 3. REKAP PER KATEGORI PENGELUARAN
        // =============================================
        let rekapKategori = [];
        try {
            rekapKategori = await query(`
                SELECT 
                    kk.nama as kategori,
                    kk.icon,
                    kk.warna,
                    kk.tipe,
                    COUNT(kt.id) as jumlah_transaksi,
                    COALESCE(SUM(kt.jumlah), 0) as total
                FROM kategori_kas kk
                LEFT JOIN kas_transaksi kt ON kt.kategori_id = kk.id
                LEFT JOIN shifts s ON kt.shift_id = s.id
                WHERE kk.pelanggan_id = ?
                    AND (s.pelanggan_id = ? OR s.pelanggan_id IS NULL)
                    AND (DATE(kt.created_at) BETWEEN ? AND ? OR kt.created_at IS NULL)
                GROUP BY kk.id, kk.nama, kk.icon, kk.warna, kk.tipe
                HAVING total > 0
                ORDER BY total DESC
            `, [pelangganId, pelangganId, dateFrom, dateTo]);
        } catch (e) {
            console.log('🟡 Error fetching kategori kas:', e.message);
        }
        
        console.log('🟢 Rekap kategori loaded:', rekapKategori.length);
        
        // =============================================
        // 4. DAFTAR SHIFT DENGAN SELISIH
        // =============================================
        const shiftSelisih = await query(`
            SELECT 
                s.id,
                s.tanggal,
                s.waktu_buka,
                s.waktu_tutup,
                s.modal_awal,
                s.kas_akhir_sistem,
                s.kas_akhir_aktual,
                s.selisih_kas as selisih,
                s.catatan_tutup as catatan_penutupan,
                s.status,
                tu.nama as kasir_nama
            FROM shifts s
            LEFT JOIN tenant_users tu ON s.tenant_user_id = tu.id
            WHERE s.pelanggan_id = ?
                AND s.tanggal BETWEEN ? AND ?
            ORDER BY s.tanggal DESC, s.waktu_buka DESC
        `, [pelangganId, dateFrom, dateTo]);
        
        console.log('🟢 Shift selisih loaded:', shiftSelisih.length);
        
        // =============================================
        // 5. TREND SELISIH HARIAN
        // =============================================
        const trendSelisih = await query(`
            SELECT 
                s.tanggal,
                COUNT(s.id) as jumlah_shift,
                COALESCE(SUM(CASE WHEN s.status = 'closed' THEN s.selisih_kas ELSE 0 END), 0) as total_selisih,
                COALESCE(SUM(s.kas_akhir_sistem), 0) as total_sistem,
                COALESCE(SUM(s.kas_akhir_aktual), 0) as total_aktual
            FROM shifts s
            WHERE s.pelanggan_id = ?
                AND s.tanggal BETWEEN ? AND ?
            GROUP BY s.tanggal
            ORDER BY s.tanggal ASC
        `, [pelangganId, dateFrom, dateTo]);
        
        console.log('🟢 Trend selisih loaded:', trendSelisih.length);
        
        // =============================================
        // 6. KASIR DENGAN SELISIH
        // =============================================
        const kasirSelisih = await query(`
            SELECT 
                tu.id as kasir_id,
                tu.nama as kasir_nama,
                COUNT(s.id) as total_shift,
                SUM(CASE WHEN s.status = 'closed' AND s.selisih_kas > 0 THEN 1 ELSE 0 END) as shift_lebih,
                SUM(CASE WHEN s.status = 'closed' AND s.selisih_kas < 0 THEN 1 ELSE 0 END) as shift_kurang,
                SUM(CASE WHEN s.status = 'closed' AND (s.selisih_kas = 0 OR s.selisih_kas IS NULL) THEN 1 ELSE 0 END) as shift_seimbang,
                COALESCE(SUM(CASE WHEN s.status = 'closed' THEN s.selisih_kas ELSE 0 END), 0) as total_selisih,
                COALESCE(AVG(CASE WHEN s.status = 'closed' THEN s.selisih_kas ELSE NULL END), 0) as avg_selisih
            FROM tenant_users tu
            LEFT JOIN shifts s ON s.tenant_user_id = tu.id 
                AND s.tanggal BETWEEN ? AND ?
                AND s.pelanggan_id = ?
            WHERE tu.pelanggan_id = ?
                AND tu.role IN ('kasir', 'admin', 'owner')
                AND tu.status = 'aktif'
            GROUP BY tu.id, tu.nama
            HAVING COUNT(s.id) > 0
            ORDER BY ABS(COALESCE(SUM(CASE WHEN s.status = 'closed' THEN s.selisih_kas ELSE 0 END), 0)) DESC
        `, [dateFrom, dateTo, pelangganId, pelangganId]);
        
        console.log('🟢 Kasir selisih loaded:', kasirSelisih.length);
        
        // =============================================
        // RETURN DATA
        // =============================================
        return {
            ringkasanKas,
            kasTransaksi: kasTransaksi || [],
            rekapKategori: rekapKategori || [],
            shiftSelisih: shiftSelisih || [],
            trendSelisih: trendSelisih || [],
            kasirSelisih: kasirSelisih || [],
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
        console.error('❌ Error loading rekap kas:', err);
        
        if (err.status) {
            throw err;
        }
        
        throw error(500, {
            message: 'Gagal memuat data rekap kas',
            details: err.message
        });
    }
}