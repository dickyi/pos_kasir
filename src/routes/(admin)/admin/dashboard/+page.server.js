// ============================================
// SUPER ADMIN DASHBOARD SERVER - Final Fixed
// File: src/routes/(admin)/admin/dashboard/+page.server.js
// Disesuaikan dengan struktur database yang ada
// ============================================

import { query } from '$lib/db.js';

export async function load({ parent }) {
    const parentData = await parent();
    
    try {
        // ============================================
        // 1. STATISTIK TENANT (dari tabel pelanggan)
        // Status: pending, aktif, nonaktif
        // ============================================
        
        const [tenantStats] = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as aktif,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'nonaktif' THEN 1 ELSE 0 END) as nonaktif
            FROM pelanggan
        `);
        
        // Tenant baru hari ini
        const [tenantBaruHariIni] = await query(`
            SELECT COUNT(*) as count FROM pelanggan
            WHERE DATE(created_at) = CURDATE()
        `);
        
        // Tenant baru minggu ini
        const [tenantBaruMingguIni] = await query(`
            SELECT COUNT(*) as count FROM pelanggan
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        `);
        
        // Tenant baru bulan ini
        const [tenantBaruBulanIni] = await query(`
            SELECT COUNT(*) as count FROM pelanggan
            WHERE MONTH(created_at) = MONTH(CURDATE()) 
            AND YEAR(created_at) = YEAR(CURDATE())
        `);
        
        // Tenant minggu lalu (untuk growth)
        const [tenantMingguLalu] = await query(`
            SELECT COUNT(*) as count FROM pelanggan
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
            AND created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        `);
        
        // Tenant bulan lalu
        const [tenantBulanLalu] = await query(`
            SELECT COUNT(*) as count FROM pelanggan
            WHERE MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
            AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        `);

        // ============================================
        // 2. STATISTIK TRANSAKSI PLATFORM
        // Status transaksi: pending, success, cancelled, refund
        // ============================================
        
        // Statistik hari ini
        const [statsHariIni] = await query(`
            SELECT 
                COUNT(*) as total_transaksi,
                COALESCE(SUM(total), 0) as gmv,
                COUNT(DISTINCT pelanggan_id) as tenant_aktif
            FROM transaksi
            WHERE DATE(tanggal) = CURDATE()
            AND status = 'success'
        `);
        
        // Statistik kemarin
        const [statsKemarin] = await query(`
            SELECT 
                COUNT(*) as total_transaksi,
                COALESCE(SUM(total), 0) as gmv,
                COUNT(DISTINCT pelanggan_id) as tenant_aktif
            FROM transaksi
            WHERE DATE(tanggal) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            AND status = 'success'
        `);
        
        // Statistik minggu ini
        const [statsMingguIni] = await query(`
            SELECT 
                COUNT(*) as total_transaksi,
                COALESCE(SUM(total), 0) as gmv,
                COUNT(DISTINCT pelanggan_id) as tenant_aktif
            FROM transaksi
            WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            AND status = 'success'
        `);
        
        // Statistik bulan ini
        const [statsBulanIni] = await query(`
            SELECT 
                COUNT(*) as total_transaksi,
                COALESCE(SUM(total), 0) as gmv,
                COUNT(DISTINCT pelanggan_id) as tenant_aktif
            FROM transaksi
            WHERE MONTH(tanggal) = MONTH(CURDATE())
            AND YEAR(tanggal) = YEAR(CURDATE())
            AND status = 'success'
        `);
        
        // Statistik bulan lalu
        const [statsBulanLalu] = await query(`
            SELECT 
                COUNT(*) as total_transaksi,
                COALESCE(SUM(total), 0) as gmv
            FROM transaksi
            WHERE MONTH(tanggal) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
            AND YEAR(tanggal) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
            AND status = 'success'
        `);
        
        // Statistik all time
        const [statsAllTime] = await query(`
            SELECT 
                COUNT(*) as total_transaksi,
                COALESCE(SUM(total), 0) as gmv,
                COUNT(DISTINCT pelanggan_id) as tenant_aktif
            FROM transaksi
            WHERE status = 'success'
        `);

        // ============================================
        // 3. PLATFORM HEALTH METRICS
        // ============================================
        
        const totalTenantAktif = Number(tenantStats?.aktif) || 0;
        const tenantTransaksiHariIni = Number(statsHariIni?.tenant_aktif) || 0;
        
        // Engagement Rate: % tenant aktif yang transaksi hari ini
        const engagementRate = totalTenantAktif > 0 
            ? Math.round((tenantTransaksiHariIni / totalTenantAktif) * 100) 
            : 0;
        
        // Activation Rate: % tenant yang sudah punya produk
        const [activationStats] = await query(`
            SELECT COUNT(DISTINCT p.id) as with_products
            FROM pelanggan p
            INNER JOIN produk pr ON pr.pelanggan_id = p.id
            WHERE p.status = 'aktif'
        `);
        const activationRate = totalTenantAktif > 0 
            ? Math.round((Number(activationStats?.with_products) || 0) / totalTenantAktif * 100) 
            : 0;
        
        // Churn Rate: tenant yang jadi nonaktif bulan ini
        const [churnStats] = await query(`
            SELECT COUNT(*) as churned FROM pelanggan
            WHERE status = 'nonaktif'
            AND MONTH(updated_at) = MONTH(CURDATE())
            AND YEAR(updated_at) = YEAR(CURDATE())
        `);
        const totalTenant = Number(tenantStats?.total) || 1;
        const churnRate = ((Number(churnStats?.churned) || 0) / totalTenant * 100).toFixed(1);

        // ============================================
        // 4. TENANT LISTS
        // ============================================
        
        // Tenant terbaru (10 terakhir)
        const tenantTerbaru = await query(`
            SELECT 
                id,
                kode_pelanggan,
                nama_bisnis,
                nama_pemilik,
                email,
                no_telepon,
                status,
                created_at
            FROM pelanggan
            ORDER BY created_at DESC
            LIMIT 10
        `);

        // Tenant pending (butuh approval)
        const tenantPending = await query(`
            SELECT 
                id,
                kode_pelanggan,
                nama_bisnis,
                nama_pemilik,
                email,
                no_telepon,
                created_at
            FROM pelanggan
            WHERE status = 'pending'
            ORDER BY created_at ASC
        `);

        // Top 5 tenant by transaksi bulan ini
        const topTenantAktivitas = await query(`
            SELECT 
                p.id,
                p.nama_bisnis,
                p.nama_pemilik,
                p.status,
                COUNT(t.id) as total_transaksi,
                COALESCE(SUM(t.total), 0) as total_gmv
            FROM pelanggan p
            LEFT JOIN transaksi t ON t.pelanggan_id = p.id 
                AND t.status = 'success'
                AND MONTH(t.tanggal) = MONTH(CURDATE())
                AND YEAR(t.tanggal) = YEAR(CURDATE())
            WHERE p.status = 'aktif'
            GROUP BY p.id, p.nama_bisnis, p.nama_pemilik, p.status
            HAVING total_transaksi > 0
            ORDER BY total_transaksi DESC
            LIMIT 5
        `);

        // Tenant tidak aktif > 7 hari (perlu follow up)
        const tenantTidakAktif = await query(`
            SELECT 
                p.id,
                p.nama_bisnis,
                p.nama_pemilik,
                p.email,
                p.status,
                p.created_at,
                MAX(t.tanggal) as last_transaction,
                DATEDIFF(CURDATE(), COALESCE(MAX(t.tanggal), DATE(p.created_at))) as days_inactive
            FROM pelanggan p
            LEFT JOIN transaksi t ON t.pelanggan_id = p.id AND t.status = 'success'
            WHERE p.status = 'aktif'
            GROUP BY p.id, p.nama_bisnis, p.nama_pemilik, p.email, p.status, p.created_at
            HAVING days_inactive > 7
            ORDER BY days_inactive DESC
            LIMIT 10
        `);

        // ============================================
        // 5. TREND 7 HARI TERAKHIR
        // ============================================
        
        const trendMingguan = await query(`
            SELECT 
                DATE(tanggal) as tanggal,
                COUNT(*) as total_transaksi,
                COALESCE(SUM(total), 0) as gmv,
                COUNT(DISTINCT pelanggan_id) as tenant_aktif
            FROM transaksi
            WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            AND status = 'success'
            GROUP BY DATE(tanggal)
            ORDER BY tanggal ASC
        `);

        // ============================================
        // 6. AKTIVITAS HARI INI
        // ============================================
        
        const [aktivitasHariIni] = await query(`
            SELECT 
                (SELECT COUNT(*) FROM pelanggan WHERE DATE(created_at) = CURDATE()) as tenant_baru,
                (SELECT COUNT(*) FROM users WHERE DATE(last_login) = CURDATE()) as user_login,
                (SELECT COUNT(*) FROM transaksi WHERE DATE(tanggal) = CURDATE() AND status = 'success') as transaksi_sukses,
                (SELECT COUNT(*) FROM transaksi WHERE DATE(tanggal) = CURDATE() AND status = 'cancelled') as transaksi_batal
        `);

        // ============================================
        // CALCULATE GROWTH RATES
        // ============================================
        
        // Tenant growth weekly
        const tenantMingguIniCount = Number(tenantBaruMingguIni?.count) || 0;
        const tenantMingguLaluCount = Number(tenantMingguLalu?.count) || 0;
        const tenantGrowthWeekly = tenantMingguLaluCount > 0 
            ? Math.round(((tenantMingguIniCount - tenantMingguLaluCount) / tenantMingguLaluCount) * 100)
            : tenantMingguIniCount > 0 ? 100 : 0;
        
        // Tenant growth monthly
        const tenantBulanIniCount = Number(tenantBaruBulanIni?.count) || 0;
        const tenantBulanLaluCount = Number(tenantBulanLalu?.count) || 0;
        const tenantGrowthMonthly = tenantBulanLaluCount > 0 
            ? Math.round(((tenantBulanIniCount - tenantBulanLaluCount) / tenantBulanLaluCount) * 100)
            : tenantBulanIniCount > 0 ? 100 : 0;
        
        // Transaksi growth (hari ini vs kemarin)
        const trxHariIni = Number(statsHariIni?.total_transaksi) || 0;
        const trxKemarin = Number(statsKemarin?.total_transaksi) || 0;
        const transaksiGrowth = trxKemarin > 0
            ? Math.round(((trxHariIni - trxKemarin) / trxKemarin) * 100)
            : trxHariIni > 0 ? 100 : 0;

        // GMV growth harian
        const gmvHariIni = Number(statsHariIni?.gmv) || 0;
        const gmvKemarin = Number(statsKemarin?.gmv) || 0;
        const gmvGrowthHarian = gmvKemarin > 0
            ? Math.round(((gmvHariIni - gmvKemarin) / gmvKemarin) * 100)
            : gmvHariIni > 0 ? 100 : 0;
        
        // GMV growth bulanan
        const gmvBulanIni = Number(statsBulanIni?.gmv) || 0;
        const gmvBulanLalu = Number(statsBulanLalu?.gmv) || 0;
        const gmvGrowthBulanan = gmvBulanLalu > 0
            ? Math.round(((gmvBulanIni - gmvBulanLalu) / gmvBulanLalu) * 100)
            : gmvBulanIni > 0 ? 100 : 0;

        // ============================================
        // RETURN DATA
        // ============================================
        
        return {
            user: parentData.user,
            
            tenant: {
                total: Number(tenantStats?.total) || 0,
                aktif: Number(tenantStats?.aktif) || 0,
                pending: Number(tenantStats?.pending) || 0,
                nonaktif: Number(tenantStats?.nonaktif) || 0,
                baru_hari_ini: Number(tenantBaruHariIni?.count) || 0,
                baru_minggu_ini: tenantMingguIniCount,
                baru_bulan_ini: tenantBulanIniCount,
                growth: tenantGrowthMonthly,
                growth_weekly: tenantGrowthWeekly
            },
            
            platform: {
                hari_ini: {
                    transaksi: trxHariIni,
                    gmv: gmvHariIni,
                    tenant_aktif: tenantTransaksiHariIni,
                    transaksi_growth: transaksiGrowth,
                    gmv_growth: gmvGrowthHarian
                },
                minggu_ini: {
                    transaksi: Number(statsMingguIni?.total_transaksi) || 0,
                    gmv: Number(statsMingguIni?.gmv) || 0,
                    tenant_aktif: Number(statsMingguIni?.tenant_aktif) || 0
                },
                bulan_ini: {
                    transaksi: Number(statsBulanIni?.total_transaksi) || 0,
                    gmv: gmvBulanIni,
                    tenant_aktif: Number(statsBulanIni?.tenant_aktif) || 0,
                    gmv_growth: gmvGrowthBulanan
                },
                all_time: {
                    transaksi: Number(statsAllTime?.total_transaksi) || 0,
                    gmv: Number(statsAllTime?.gmv) || 0,
                    tenant_aktif: Number(statsAllTime?.tenant_aktif) || 0
                }
            },
            
            health: {
                engagement_rate: engagementRate,
                tenant_aktif_hari_ini: tenantTransaksiHariIni,
                activation_rate: activationRate,
                churn_rate: parseFloat(churnRate) || 0
            },
            
            tenantTerbaru: tenantTerbaru || [],
            tenantPending: tenantPending || [],
            topTenantAktivitas: topTenantAktivitas || [],
            tenantTidakAktif: tenantTidakAktif || [],
            trendMingguan: trendMingguan || [],
            aktivitasHariIni: aktivitasHariIni || {}
        };
        
    } catch (error) {
        console.error('Dashboard Admin Error:', error);
        
        // Return default data jika error
        return {
            user: parentData?.user,
            tenant: { 
                total: 0, aktif: 0, pending: 0, nonaktif: 0, 
                baru_hari_ini: 0, baru_minggu_ini: 0, baru_bulan_ini: 0, 
                growth: 0, growth_weekly: 0 
            },
            platform: {
                hari_ini: { transaksi: 0, gmv: 0, tenant_aktif: 0, transaksi_growth: 0, gmv_growth: 0 },
                minggu_ini: { transaksi: 0, gmv: 0, tenant_aktif: 0 },
                bulan_ini: { transaksi: 0, gmv: 0, tenant_aktif: 0, gmv_growth: 0 },
                all_time: { transaksi: 0, gmv: 0, tenant_aktif: 0 }
            },
            health: { engagement_rate: 0, tenant_aktif_hari_ini: 0, activation_rate: 0, churn_rate: 0 },
            tenantTerbaru: [],
            tenantPending: [],
            topTenantAktivitas: [],
            tenantTidakAktif: [],
            trendMingguan: [],
            aktivitasHariIni: {},
            error: error.message
        };
    }
}

// ============================================
// ACTIONS - Manage Tenant
// ============================================

export const actions = {
    // Approve tenant pending
    approveTenant: async ({ request }) => {
        const formData = await request.formData();
        const tenantId = formData.get('tenant_id');
        
        try {
            await query(`UPDATE pelanggan SET status = 'aktif', updated_at = NOW() WHERE id = ?`, [tenantId]);
            
            // Update users yang terkait dengan tenant ini (jika ada)
            await query(`UPDATE users SET status = 'aktif', updated_at = NOW() WHERE pelanggan_id = ?`, [tenantId]).catch(() => {});
            
            // Update tenant_users jika ada
            await query(`UPDATE tenant_users SET status = 'aktif', updated_at = NOW() WHERE pelanggan_id = ?`, [tenantId]).catch(() => {});
            
            return { success: true, message: 'Tenant berhasil diaktifkan!' };
        } catch (error) {
            console.error('Error approving tenant:', error);
            return { success: false, message: 'Gagal mengaktifkan tenant: ' + error.message };
        }
    },
    
    // Reject tenant pending
    rejectTenant: async ({ request }) => {
        const formData = await request.formData();
        const tenantId = formData.get('tenant_id');
        
        try {
            await query(`UPDATE pelanggan SET status = 'nonaktif', updated_at = NOW() WHERE id = ?`, [tenantId]);
            await query(`UPDATE users SET status = 'nonaktif', updated_at = NOW() WHERE pelanggan_id = ?`, [tenantId]).catch(() => {});
            await query(`UPDATE tenant_users SET status = 'nonaktif', updated_at = NOW() WHERE pelanggan_id = ?`, [tenantId]).catch(() => {});
            
            return { success: true, message: 'Tenant ditolak' };
        } catch (error) {
            console.error('Error rejecting tenant:', error);
            return { success: false, message: 'Gagal menolak tenant: ' + error.message };
        }
    },
    
    // Suspend/Nonaktifkan tenant
    suspendTenant: async ({ request }) => {
        const formData = await request.formData();
        const tenantId = formData.get('tenant_id');
        
        try {
            await query(`UPDATE pelanggan SET status = 'nonaktif', updated_at = NOW() WHERE id = ?`, [tenantId]);
            await query(`UPDATE users SET status = 'nonaktif', updated_at = NOW() WHERE pelanggan_id = ?`, [tenantId]).catch(() => {});
            await query(`UPDATE tenant_users SET status = 'nonaktif', updated_at = NOW() WHERE pelanggan_id = ?`, [tenantId]).catch(() => {});
            
            return { success: true, message: 'Tenant dinonaktifkan' };
        } catch (error) {
            console.error('Error suspending tenant:', error);
            return { success: false, message: 'Gagal menonaktifkan tenant: ' + error.message };
        }
    },
    
    // Aktifkan kembali tenant
    activateTenant: async ({ request }) => {
        const formData = await request.formData();
        const tenantId = formData.get('tenant_id');
        
        try {
            await query(`UPDATE pelanggan SET status = 'aktif', updated_at = NOW() WHERE id = ?`, [tenantId]);
            await query(`UPDATE users SET status = 'aktif', updated_at = NOW() WHERE pelanggan_id = ?`, [tenantId]).catch(() => {});
            await query(`UPDATE tenant_users SET status = 'aktif', updated_at = NOW() WHERE pelanggan_id = ?`, [tenantId]).catch(() => {});
            
            return { success: true, message: 'Tenant diaktifkan kembali!' };
        } catch (error) {
            console.error('Error activating tenant:', error);
            return { success: false, message: 'Gagal mengaktifkan tenant: ' + error.message };
        }
    }
};