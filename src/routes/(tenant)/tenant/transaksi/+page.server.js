// ============================================
// TRANSAKSI TENANT - SERVER (With Struk Integration)
// File: src/routes/(tenant)/tenant/transaksi/+page.server.js
// ============================================

import { query } from '$lib/db.js';
import { fail } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/auth.js';

// ============================================
// HELPER: Get Pelanggan ID from User
// ============================================
async function getPelangganId(user) {
    if (!user) return null;
    
    if (user.pelanggan_id) return user.pelanggan_id;
    
    if (user.email) {
        try {
            const result = await query(
                'SELECT id FROM pelanggan WHERE email = ? LIMIT 1',
                [user.email]
            );
            return result?.[0]?.id || null;
        } catch (e) {
            console.error('Error finding pelanggan:', e);
        }
    }
    
    return null;
}

// ============================================
// HELPER: Permission Check
// ============================================
function canVoidTransaction(user) {
    if (!user) return false;
    
    if (user.tenant_role) {
        if (user.tenant_role === 'owner') return true;
        return false;
    }
    
    if (user.login_type === 'users' && user.pelanggan_id) return true;
    if (!user.login_type && user.pelanggan_id) return true;
    
    return false;
}

function canViewAllTransactions(user) {
    if (!user) return false;
    
    if (user.tenant_role) {
        if (user.tenant_role === 'owner' || user.tenant_role === 'admin') return true;
        if (user.tenant_role === 'kasir') return false;
    }
    
    if (user.login_type === 'users') return true;
    if (!user.login_type && user.pelanggan_id) return true;
    
    return true;
}

// ============================================
// LOAD FUNCTION
// ============================================
export async function load({ parent, url }) {
    const parentData = await parent();
    const user = parentData?.user;
    const tenantUser = parentData?.tenantUser;

    const emptyResponse = {
        transaksi: [],
        summary: null,
        todaySummary: null,
        filters: { search: '', startDate: '', endDate: '', status: '' },
        permissions: { canVoid: false, canViewAll: true },
        tenantUser: null,
        strukSettings: null,
        tokoInfo: null
    };

    if (!user) {
        return { ...emptyResponse, error: 'User tidak valid' };
    }

    const pelangganId = await getPelangganId(user);

    if (!pelangganId) {
        return { ...emptyResponse, error: 'Tenant tidak terhubung' };
    }

    // Permission flags
    const canVoid = canVoidTransaction(user);
    const canViewAll = canViewAllTransactions(user);
    
    console.log('=== TRANSAKSI PERMISSION DEBUG ===');
    console.log('User:', user?.nama || user?.email);
    console.log('tenant_role:', user?.tenant_role);
    console.log('canViewAll:', canViewAll);
    console.log('canVoid:', canVoid);
    console.log('================================');

    // Get filter parameters
    const search = url.searchParams.get('search') || '';
    const startDate = url.searchParams.get('start_date') || '';
    const endDate = url.searchParams.get('end_date') || '';
    const status = url.searchParams.get('status') || '';

    // Build WHERE conditions
    let conditions = ['t.pelanggan_id = ?'];
    let params = [pelangganId];

    // Filter by Kasir
    if (!canViewAll) {
        if (user.tenant_user_id) {
            conditions.push('t.tenant_user_id = ?');
            params.push(user.tenant_user_id);
        } else if (user.nama) {
            conditions.push('t.kasir_nama = ?');
            params.push(user.nama);
        }
    }

    if (search) {
        conditions.push('(t.no_invoice LIKE ? OR t.nama_customer LIKE ? OR t.kasir_nama LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (startDate) {
        conditions.push('t.tanggal >= ?');
        params.push(startDate);
    }
    if (endDate) {
        conditions.push('t.tanggal <= ?');
        params.push(endDate);
    }
    if (status) {
        conditions.push('t.status = ?');
        params.push(status);
    }

    const whereClause = conditions.join(' AND ');

    // Load transaksi
    let transaksiData = [];
    try {
        transaksiData = await query(`
            SELECT 
                t.id,
                t.no_invoice,
                t.tanggal,
                t.waktu,
                t.subtotal,
                t.diskon,
                t.pajak,
                t.total,
                t.bayar,
                t.kembalian,
                t.metode_bayar,
                t.nama_customer,
                t.status,
                t.tenant_user_id,
                t.kasir_nama,
                (SELECT COUNT(*) FROM transaksi_detail WHERE transaksi_id = t.id) as jumlah_item,
                (SELECT COALESCE(SUM(qty), 0) FROM transaksi_detail WHERE transaksi_id = t.id) as total_qty
            FROM transaksi t
            WHERE ${whereClause}
            ORDER BY t.id DESC
            LIMIT 100
        `, params);
    } catch (error) {
        console.error('Error loading transaksi:', error);
    }

    // Summary
    let summaryData = null;
    try {
        let summaryConditions = ['pelanggan_id = ?'];
        let summaryParams = [pelangganId];
        
        if (!canViewAll && user.tenant_user_id) {
            summaryConditions.push('tenant_user_id = ?');
            summaryParams.push(user.tenant_user_id);
        }
        
        const summaryWhere = summaryConditions.join(' AND ');
        
        const result = await query(`
            SELECT 
                COUNT(*) as total_transaksi,
                COALESCE(SUM(total), 0) as total_penjualan,
                COALESCE(SUM(CASE WHEN status = 'success' THEN total ELSE 0 END), 0) as penjualan_sukses,
                SUM(status = 'success') as transaksi_sukses,
                SUM(status = 'cancelled') as transaksi_batal
            FROM transaksi
            WHERE ${summaryWhere}
        `, summaryParams);
        summaryData = result?.[0] || null;
    } catch (error) {
        console.error('Error loading summary:', error);
    }

    // Today's summary
    let todaySummaryData = null;
    try {
        let todayConditions = ['pelanggan_id = ?', 'tanggal = CURDATE()', "status = 'success'"];
        let todayParams = [pelangganId];
        
        if (!canViewAll && user.tenant_user_id) {
            todayConditions.push('tenant_user_id = ?');
            todayParams.push(user.tenant_user_id);
        }
        
        const todayWhere = todayConditions.join(' AND ');
        
        const result = await query(`
            SELECT 
                COUNT(*) as total_transaksi,
                COALESCE(SUM(total), 0) as total_penjualan
            FROM transaksi
            WHERE ${todayWhere}
        `, todayParams);
        todaySummaryData = result?.[0] || null;
    } catch (error) {
        console.error('Error loading today summary:', error);
    }

    // ============================================
    // LOAD STRUK SETTINGS (NEW)
    // ============================================
    let strukSettings = null;
    try {
        const strukResult = await query(`
            SELECT 
                struk_logo,
                struk_header,
                struk_footer,
                tampilkan_logo,
                tampilkan_alamat,
                tampilkan_telepon,
                ukuran_kertas,
                auto_print
            FROM pengaturan 
            WHERE pelanggan_id = ?
        `, [pelangganId]);

        strukSettings = strukResult[0] || {
            struk_logo: null,
            struk_header: '',
            struk_footer: 'Terima kasih atas kunjungan Anda!',
            tampilkan_logo: true,
            tampilkan_alamat: true,
            tampilkan_telepon: true,
            ukuran_kertas: '58mm',
            auto_print: false
        };
    } catch (error) {
        console.error('Error loading struk settings:', error);
    }

    // ============================================
    // LOAD TOKO INFO (NEW)
    // ============================================
    let tokoInfo = null;
    try {
        const tokoResult = await query(`
            SELECT 
                nama_bisnis,
                alamat,
                no_telepon
            FROM pelanggan 
            WHERE id = ?
        `, [pelangganId]);

        tokoInfo = tokoResult[0] || {
            nama_bisnis: user.nama_bisnis || 'Toko',
            alamat: '',
            no_telepon: ''
        };
    } catch (error) {
        console.error('Error loading toko info:', error);
    }

    return {
        transaksi: transaksiData || [],
        summary: summaryData,
        todaySummary: todaySummaryData,
        filters: { search, startDate, endDate, status },
        permissions: { canVoid, canViewAll },
        tenantUser: tenantUser || null,
        strukSettings,
        tokoInfo
    };
}

// ============================================
// ACTIONS
// ============================================
export const actions = {

    // ----------------------------------------
    // GET DETAIL
    // ----------------------------------------
    getDetail: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);

        if (!user) {
            return fail(401, { success: false, message: 'Sesi telah berakhir' });
        }

        const pelangganId = await getPelangganId(user);
        if (!pelangganId) {
            return fail(400, { success: false, message: 'Tenant tidak valid' });
        }

        try {
            const formData = await request.formData();
            const transaksiId = formData.get('transaksi_id');

            if (!transaksiId) {
                return fail(400, { success: false, message: 'ID tidak valid' });
            }

            let queryConditions = ['t.id = ?', 't.pelanggan_id = ?'];
            let queryParams = [transaksiId, pelangganId];
            
            if (!canViewAllTransactions(user) && user.tenant_user_id) {
                queryConditions.push('t.tenant_user_id = ?');
                queryParams.push(user.tenant_user_id);
            }

            const transaksiResult = await query(`
                SELECT t.*, p.nama_bisnis, p.alamat as alamat_toko, p.no_telepon as telepon_toko
                FROM transaksi t
                LEFT JOIN pelanggan p ON t.pelanggan_id = p.id
                WHERE ${queryConditions.join(' AND ')}
                LIMIT 1
            `, queryParams);

            if (!transaksiResult?.length) {
                return fail(404, { success: false, message: 'Transaksi tidak ditemukan' });
            }

            const detailResult = await query(`
                SELECT 
                    td.id,
                    td.produk_id,
                    td.kode_produk,
                    td.nama_produk,
                    td.qty,
                    td.harga,
                    td.diskon_item,
                    td.subtotal,
                    p.gambar
                FROM transaksi_detail td
                LEFT JOIN produk p ON td.produk_id = p.id
                WHERE td.transaksi_id = ?
                ORDER BY td.id
            `, [transaksiId]);

            return {
                success: true,
                transaksi: transaksiResult[0],
                detail: detailResult || []
            };

        } catch (error) {
            console.error('Error getting detail:', error);
            return fail(500, { success: false, message: 'Gagal memuat detail' });
        }
    },

    // ----------------------------------------
    // BATALKAN - HANYA OWNER
    // ----------------------------------------
    batalkan: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);

        if (!user) {
            return fail(401, { success: false, message: 'Sesi telah berakhir' });
        }

        if (!canVoidTransaction(user)) {
            return fail(403, { 
                success: false, 
                message: 'Anda tidak memiliki izin untuk membatalkan transaksi. Hanya Owner yang dapat melakukan ini.' 
            });
        }

        const pelangganId = await getPelangganId(user);
        if (!pelangganId) {
            return fail(400, { success: false, message: 'Tenant tidak valid' });
        }

        try {
            const formData = await request.formData();
            const transaksiId = formData.get('transaksi_id');

            if (!transaksiId) {
                return fail(400, { success: false, message: 'ID tidak valid' });
            }

            const transaksi = await query(
                'SELECT id, status, no_invoice FROM transaksi WHERE id = ? AND pelanggan_id = ? LIMIT 1',
                [transaksiId, pelangganId]
            );

            if (!transaksi?.length) {
                return fail(404, { success: false, message: 'Transaksi tidak ditemukan' });
            }

            if (transaksi[0].status === 'cancelled') {
                return fail(400, { success: false, message: 'Sudah dibatalkan' });
            }

            // Restore stock
            await query(`
                UPDATE produk p
                INNER JOIN transaksi_detail td ON p.id = td.produk_id
                SET p.stok = p.stok + td.qty
                WHERE td.transaksi_id = ?
            `, [transaksiId]);

            // Update status
            await query(
                'UPDATE transaksi SET status = ? WHERE id = ?',
                ['cancelled', transaksiId]
            );

            return { 
                success: true, 
                message: `Transaksi ${transaksi[0].no_invoice} berhasil dibatalkan` 
            };

        } catch (error) {
            console.error('Error cancelling:', error);
            return fail(500, { success: false, message: 'Gagal membatalkan' });
        }
    }
};