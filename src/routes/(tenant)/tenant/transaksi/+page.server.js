// ============================================
// RIWAYAT TRANSAKSI TENANT - SERVER
// File: src/routes/(tenant)/tenant/transaksi/+page.server.js
// ============================================

import { query } from '$lib/db.js';

export async function load({ parent, url }) {
    const parentData = await parent();
    const user = parentData?.user;

    if (!user) {
        return {
            transaksi: [],
            summary: null,
            error: 'User tidak valid'
        };
    }

    // Cari pelanggan_id
    let pelangganId = user.pelanggan_id;
    if (!pelangganId) {
        try {
            const pelangganResult = await query(
                'SELECT id FROM pelanggan WHERE email = ?',
                [user.email]
            );
            if (pelangganResult.length > 0) {
                pelangganId = pelangganResult[0].id;
            }
        } catch (e) {
            console.log('Error finding pelanggan:', e);
        }
    }

    if (!pelangganId) {
        return {
            transaksi: [],
            summary: null,
            error: 'Tenant tidak terhubung'
        };
    }

    try {
        // Get filter parameters
        const searchParams = url.searchParams;
        const search = searchParams.get('search') || '';
        const startDate = searchParams.get('start_date') || '';
        const endDate = searchParams.get('end_date') || '';
        const status = searchParams.get('status') || '';

        // Build query conditions
        let conditions = ['t.pelanggan_id = ?'];
        let params = [pelangganId];

        if (search) {
            conditions.push('(t.no_invoice LIKE ? OR t.nama_customer LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
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

        // ----------------------------------------
        // Load transaksi dengan detail count
        // ----------------------------------------
        const transaksi = await query(`
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
                t.created_at,
                u.nama as kasir_nama,
                (SELECT COUNT(*) FROM transaksi_detail td WHERE td.transaksi_id = t.id) as jumlah_item,
                (SELECT SUM(qty) FROM transaksi_detail td WHERE td.transaksi_id = t.id) as total_qty
            FROM transaksi t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE ${whereClause}
            ORDER BY t.tanggal DESC, t.waktu DESC
            LIMIT 100
        `, params);

        // ----------------------------------------
        // Summary statistik
        // ----------------------------------------
        const summaryResult = await query(`
            SELECT 
                COUNT(*) as total_transaksi,
                COALESCE(SUM(total), 0) as total_penjualan,
                COALESCE(SUM(CASE WHEN status = 'success' THEN total ELSE 0 END), 0) as penjualan_sukses,
                COALESCE(SUM(CASE WHEN status = 'cancelled' THEN total ELSE 0 END), 0) as penjualan_batal,
                COUNT(CASE WHEN status = 'success' THEN 1 END) as transaksi_sukses,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as transaksi_batal
            FROM transaksi t
            WHERE ${whereClause}
        `, params);

        // Summary hari ini
        const todaySummary = await query(`
            SELECT 
                COUNT(*) as total_transaksi,
                COALESCE(SUM(total), 0) as total_penjualan
            FROM transaksi
            WHERE pelanggan_id = ? 
            AND tanggal = CURDATE()
            AND status = 'success'
        `, [pelangganId]);

        return {
            transaksi: transaksi,
            summary: summaryResult[0] || null,
            todaySummary: todaySummary[0] || null,
            filters: {
                search,
                startDate,
                endDate,
                status
            }
        };

    } catch (error) {
        console.error('Error loading transaksi:', error);
        return {
            transaksi: [],
            summary: null,
            error: 'Gagal memuat data: ' + error.message
        };
    }
}

// ============================================
// ACTIONS
// ============================================
export const actions = {
    // Get detail transaksi
    getDetail: async ({ request, parent }) => {
        const parentData = await parent();
        const user = parentData?.user;

        if (!user) {
            return { success: false, message: 'Unauthorized' };
        }

        // Cari pelanggan_id
        let pelangganId = user.pelanggan_id;
        if (!pelangganId) {
            try {
                const pelangganResult = await query(
                    'SELECT id FROM pelanggan WHERE email = ?',
                    [user.email]
                );
                if (pelangganResult.length > 0) {
                    pelangganId = pelangganResult[0].id;
                }
            } catch (e) {
                return { success: false, message: 'Tenant tidak valid' };
            }
        }

        try {
            const formData = await request.formData();
            const transaksiId = formData.get('transaksi_id');

            // Get transaksi header
            const transaksiResult = await query(`
                SELECT 
                    t.*,
                    u.nama as kasir_nama,
                    p.nama_bisnis,
                    p.alamat as alamat_toko
                FROM transaksi t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN pelanggan p ON t.pelanggan_id = p.id
                WHERE t.id = ? AND t.pelanggan_id = ?
            `, [transaksiId, pelangganId]);

            if (transaksiResult.length === 0) {
                return { success: false, message: 'Transaksi tidak ditemukan' };
            }

            // Get transaksi detail
            const detailResult = await query(`
                SELECT 
                    td.*,
                    p.satuan
                FROM transaksi_detail td
                LEFT JOIN produk p ON td.produk_id = p.id
                WHERE td.transaksi_id = ?
            `, [transaksiId]);

            return {
                success: true,
                transaksi: transaksiResult[0],
                detail: detailResult
            };

        } catch (error) {
            console.error('Error getting detail:', error);
            return { success: false, message: 'Gagal memuat detail' };
        }
    },

    // Batalkan transaksi
    batalkan: async ({ request, parent }) => {
        const parentData = await parent();
        const user = parentData?.user;

        if (!user) {
            return { success: false, message: 'Unauthorized' };
        }

        let pelangganId = user.pelanggan_id;
        if (!pelangganId) {
            try {
                const pelangganResult = await query(
                    'SELECT id FROM pelanggan WHERE email = ?',
                    [user.email]
                );
                if (pelangganResult.length > 0) {
                    pelangganId = pelangganResult[0].id;
                }
            } catch (e) {
                return { success: false, message: 'Tenant tidak valid' };
            }
        }

        try {
            const formData = await request.formData();
            const transaksiId = formData.get('transaksi_id');

            // Cek transaksi
            const transaksi = await query(
                'SELECT * FROM transaksi WHERE id = ? AND pelanggan_id = ?',
                [transaksiId, pelangganId]
            );

            if (transaksi.length === 0) {
                return { success: false, message: 'Transaksi tidak ditemukan' };
            }

            if (transaksi[0].status === 'cancelled') {
                return { success: false, message: 'Transaksi sudah dibatalkan' };
            }

            // Get detail untuk kembalikan stok
            const details = await query(
                'SELECT * FROM transaksi_detail WHERE transaksi_id = ?',
                [transaksiId]
            );

            // Kembalikan stok
            for (const item of details) {
                await query(
                    'UPDATE produk SET stok = stok + ? WHERE id = ?',
                    [item.qty, item.produk_id]
                );
            }

            // Update status transaksi
            await query(
                'UPDATE transaksi SET status = ? WHERE id = ?',
                ['cancelled', transaksiId]
            );

            return { success: true, message: 'Transaksi berhasil dibatalkan' };

        } catch (error) {
            console.error('Error cancelling:', error);
            return { success: false, message: 'Gagal membatalkan transaksi' };
        }
    }
};