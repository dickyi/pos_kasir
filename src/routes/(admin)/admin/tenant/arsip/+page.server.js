// ============================================
// ARSIP TENANT - SERVER
// File: src/routes/(admin)/admin/tenant/arsip/+page.server.js
// ============================================

import { query } from '$lib/db.js';

export async function load({ url }) {
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    try {
        // Build query - hanya status arsip
        let whereClause = `WHERE p.status = 'arsip'`;
        const params = [];
        
        if (search) {
            whereClause += ` AND (
                p.nama_bisnis LIKE ? OR 
                p.nama_pemilik LIKE ? OR 
                p.email LIKE ? OR 
                p.kode_pelanggan LIKE ?
            )`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        // Count
        const [countResult] = await query(`
            SELECT COUNT(*) as total FROM pelanggan p ${whereClause}
        `, params);
        
        const total = countResult?.total || 0;
        const totalPages = Math.ceil(total / limit);
        
        // Get archived tenants
        const tenants = await query(`
            SELECT 
                p.*,
                (SELECT COUNT(*) FROM produk pr WHERE pr.pelanggan_id = p.id) as total_produk,
                (SELECT COUNT(*) FROM transaksi t WHERE t.pelanggan_id = p.id) as total_transaksi,
                (SELECT COALESCE(SUM(t.total), 0) FROM transaksi t WHERE t.pelanggan_id = p.id AND t.status = 'success') as total_gmv
            FROM pelanggan p
            ${whereClause}
            ORDER BY p.archived_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);
        
        return {
            tenants: tenants || [],
            pagination: { page, limit, total, totalPages }
        };
        
    } catch (error) {
        console.error('Error loading archived tenants:', error);
        return {
            tenants: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
            error: error.message
        };
    }
}

export const actions = {
    // ----------------------------------------
    // RESTORE - Kembalikan tenant ke aktif
    // ----------------------------------------
    restore: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        
        if (!id) {
            return { success: false, message: 'ID tenant tidak valid' };
        }
        
        try {
            const [tenant] = await query('SELECT * FROM pelanggan WHERE id = ? AND status = ?', [id, 'arsip']);
            if (!tenant) {
                return { success: false, message: 'Tenant tidak ditemukan di arsip' };
            }
            
            const userId = locals?.user?.id || null;
            
            // Restore to aktif
            await query(`
                UPDATE pelanggan SET 
                    status = 'aktif',
                    restored_at = NOW(),
                    archived_at = NULL,
                    archived_by = NULL,
                    archive_reason = NULL,
                    updated_at = NOW()
                WHERE id = ?
            `, [id]);
            
            // Activate related users
            await query(
                'UPDATE users SET status = ?, updated_at = NOW() WHERE pelanggan_id = ?',
                ['aktif', id]
            ).catch(() => {});
            
            await query(
                'UPDATE tenant_users SET status = ?, updated_at = NOW() WHERE pelanggan_id = ?',
                ['aktif', id]
            ).catch(() => {});
            
            // Log restore
            await query(`
                INSERT INTO tenant_archive_logs 
                (pelanggan_id, action, reason, performed_by, old_status, new_status)
                VALUES (?, 'restore', 'Direstore dari arsip', ?, 'arsip', 'aktif')
            `, [id, userId]).catch(() => {});
            
            return { 
                success: true, 
                message: `Tenant "${tenant.nama_bisnis}" berhasil direstore!` 
            };
            
        } catch (error) {
            console.error('Error restoring tenant:', error);
            return { success: false, message: 'Gagal merestore tenant: ' + error.message };
        }
    },
    
    // ----------------------------------------
    // DELETE PERMANENT - Hapus permanen dari arsip
    // ----------------------------------------
    deletePermanent: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        
        if (!id) {
            return { success: false, message: 'ID tenant tidak valid' };
        }
        
        try {
            const [tenant] = await query('SELECT * FROM pelanggan WHERE id = ? AND status = ?', [id, 'arsip']);
            if (!tenant) {
                return { success: false, message: 'Tenant tidak ditemukan di arsip' };
            }
            
            const userId = locals?.user?.id || null;
            
            // Log before delete
            await query(`
                INSERT INTO tenant_archive_logs 
                (pelanggan_id, action, reason, performed_by, old_status, new_status, metadata)
                VALUES (?, 'delete_permanent', 'Dihapus permanen dari arsip', ?, 'arsip', NULL, ?)
            `, [
                id, 
                userId, 
                JSON.stringify({
                    nama_bisnis: tenant.nama_bisnis,
                    kode: tenant.kode_pelanggan,
                    email: tenant.email
                })
            ]).catch(() => {});
            
            // Delete all related data
            // Hapus transaksi detail dulu
            await query(`
                DELETE td FROM transaksi_detail td
                INNER JOIN transaksi t ON td.transaksi_id = t.id
                WHERE t.pelanggan_id = ?
            `, [id]).catch(() => {});
            
            // Hapus transaksi
            await query('DELETE FROM transaksi WHERE pelanggan_id = ?', [id]).catch(() => {});
            
            // Hapus produk varian
            await query(`
                DELETE pv FROM produk_varian pv
                INNER JOIN produk p ON pv.produk_id = p.id
                WHERE p.pelanggan_id = ?
            `, [id]).catch(() => {});
            
            // Hapus data lainnya
            await query('DELETE FROM produk WHERE pelanggan_id = ?', [id]).catch(() => {});
            await query('DELETE FROM kategori WHERE pelanggan_id = ?', [id]).catch(() => {});
            await query('DELETE FROM merk WHERE pelanggan_id = ?', [id]).catch(() => {});
            await query('DELETE FROM tenant_settings WHERE pelanggan_id = ?', [id]).catch(() => {});
            await query('DELETE FROM tenant_users WHERE pelanggan_id = ?', [id]).catch(() => {});
            await query('DELETE FROM tenant_activity_logs WHERE pelanggan_id = ?', [id]).catch(() => {});
            await query('DELETE FROM notifications WHERE pelanggan_id = ?', [id]).catch(() => {});
            await query('DELETE FROM users WHERE pelanggan_id = ?', [id]).catch(() => {});
            
            // Hapus tenant
            await query('DELETE FROM pelanggan WHERE id = ?', [id]);
            
            return { 
                success: true, 
                message: `Tenant "${tenant.nama_bisnis}" berhasil dihapus permanen` 
            };
            
        } catch (error) {
            console.error('Error permanently deleting tenant:', error);
            return { success: false, message: 'Gagal menghapus tenant: ' + error.message };
        }
    }
};