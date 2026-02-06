// ============================================
// KELOLA TENANT - SERVER (Clean Version)
// File: src/routes/(admin)/admin/tenant/+page.server.js
// 
// Email templates sudah dipisahkan ke:
// - src/lib/email/emailTemplates.js
// - src/lib/email/emailService.js
// ============================================

import { query } from '$lib/db.js';
import { 
    sendApprovalEmail, 
    sendRejectionEmail 
} from '$lib/email/index.js';

// ============================================
// LOAD FUNCTION
// ============================================
export async function load({ url, locals }) {
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const sort = url.searchParams.get('sort') || 'created_at';
    const order = url.searchParams.get('order') || 'desc';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    try {
        // Stats
        const [stats] = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as aktif,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'nonaktif' THEN 1 ELSE 0 END) as nonaktif
            FROM pelanggan WHERE status != 'arsip'
        `);
        
        const [arsipCount] = await query(`
            SELECT COUNT(*) as total FROM pelanggan WHERE status = 'arsip'
        `);
        
        // Build query
        let whereClause = `WHERE p.status != 'arsip'`;
        const params = [];
        
        if (search) {
            whereClause += ` AND (
                p.nama_bisnis LIKE ? OR p.nama_pemilik LIKE ? OR 
                p.email LIKE ? OR p.kode_pelanggan LIKE ? OR p.no_telepon LIKE ?
            )`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        if (status && status !== 'arsip') {
            whereClause += ` AND p.status = ?`;
            params.push(status);
        }
        
        const allowedSortColumns = ['created_at', 'nama_bisnis', 'nama_pemilik', 'status', 'updated_at'];
        const sortColumn = allowedSortColumns.includes(sort) ? sort : 'created_at';
        const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
        
        // Count
        const [countResult] = await query(`SELECT COUNT(*) as total FROM pelanggan p ${whereClause}`, params);
        const total = countResult?.total || 0;
        const totalPages = Math.ceil(total / limit);
        
        // Get tenants
        const tenants = await query(`
            SELECT 
                p.*,
                (SELECT COUNT(*) FROM produk pr WHERE pr.pelanggan_id = p.id) as total_produk,
                (SELECT COUNT(*) FROM transaksi t WHERE t.pelanggan_id = p.id AND t.status = 'success') as total_transaksi,
                (SELECT COALESCE(SUM(t.total), 0) FROM transaksi t WHERE t.pelanggan_id = p.id AND t.status = 'success') as total_gmv
            FROM pelanggan p ${whereClause}
            ORDER BY p.${sortColumn} ${sortOrder}
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);
        
        return {
            tenants: tenants || [],
            stats: {
                total: Number(stats?.total) || 0,
                aktif: Number(stats?.aktif) || 0,
                pending: Number(stats?.pending) || 0,
                nonaktif: Number(stats?.nonaktif) || 0,
                arsip: Number(arsipCount?.total) || 0
            },
            pagination: { page, limit, total, totalPages },
            filters: { search, status, sort, order }
        };
        
    } catch (error) {
        console.error('Error loading tenants:', error);
        return {
            tenants: [],
            stats: { total: 0, aktif: 0, pending: 0, nonaktif: 0, arsip: 0 },
            pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
            filters: { search: '', status: '', sort: 'created_at', order: 'desc' },
            error: error.message
        };
    }
}

// ============================================
// ACTIONS
// ============================================
export const actions = {
    
    // ----------------------------------------
    // CREATE
    // ----------------------------------------
    create: async ({ request }) => {
        const formData = await request.formData();
        
        const data = {
            kode_pelanggan: formData.get('kode_pelanggan')?.toString().trim(),
            nama_bisnis: formData.get('nama_bisnis')?.toString().trim(),
            nama_pemilik: formData.get('nama_pemilik')?.toString().trim(),
            email: formData.get('email')?.toString().trim().toLowerCase() || null,
            no_telepon: formData.get('no_telepon')?.toString().trim() || null,
            alamat: formData.get('alamat')?.toString().trim() || null,
            jenis_usaha: formData.get('jenis_usaha')?.toString().trim() || null,
            status: formData.get('status')?.toString() || 'aktif',
            password: formData.get('password')?.toString() || '123456'
        };
        
        if (!data.kode_pelanggan) return { success: false, message: 'Kode tenant wajib diisi' };
        if (!data.nama_bisnis) return { success: false, message: 'Nama bisnis wajib diisi' };
        if (!data.nama_pemilik) return { success: false, message: 'Nama pemilik wajib diisi' };
        
        try {
            const [existing] = await query('SELECT id FROM pelanggan WHERE kode_pelanggan = ?', [data.kode_pelanggan]);
            if (existing) return { success: false, message: 'Kode tenant sudah digunakan' };
            
            if (data.email) {
                const [existingEmail] = await query('SELECT id FROM pelanggan WHERE email = ?', [data.email]);
                if (existingEmail) return { success: false, message: 'Email sudah terdaftar' };
            }
            
            const pelangganResult = await query(`
                INSERT INTO pelanggan (
                    kode_pelanggan, nama_bisnis, nama_pemilik, email, no_telepon,
                    alamat, jenis_usaha, status, tanggal_daftar, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, NOW(), NOW())
            `, [data.kode_pelanggan, data.nama_bisnis, data.nama_pemilik, data.email, 
                data.no_telepon, data.alamat, data.jenis_usaha, data.status]);
            
            const pelangganId = pelangganResult.insertId;
            
            if (data.email) {
                const [lastUser] = await query('SELECT kode_user FROM tenant_users ORDER BY id DESC LIMIT 1');
                let newKodeUser = 'USR001';
                if (lastUser?.kode_user) {
                    const lastNum = parseInt(lastUser.kode_user.replace('USR', '')) || 0;
                    newKodeUser = `USR${String(lastNum + 1).padStart(3, '0')}`;
                }
                
                await query(`
                    INSERT INTO tenant_users (
                        pelanggan_id, kode_user, email, password, nama, no_telepon,
                        role, is_primary, status, bahasa, tema, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, 'owner', 1, ?, 'id', 'light', NOW(), NOW())
                `, [pelangganId, newKodeUser, data.email, data.password, data.nama_pemilik, 
                    data.no_telepon, data.status === 'aktif' ? 'aktif' : 'pending']);
            }
            
            return { success: true, message: 'Tenant berhasil ditambahkan!' };
            
        } catch (error) {
            console.error('Error creating tenant:', error);
            return { success: false, message: 'Gagal menambahkan tenant: ' + error.message };
        }
    },
    
    // ----------------------------------------
    // UPDATE
    // ----------------------------------------
    update: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        
        const data = {
            nama_bisnis: formData.get('nama_bisnis')?.toString().trim(),
            nama_pemilik: formData.get('nama_pemilik')?.toString().trim(),
            email: formData.get('email')?.toString().trim().toLowerCase() || null,
            no_telepon: formData.get('no_telepon')?.toString().trim() || null,
            alamat: formData.get('alamat')?.toString().trim() || null,
            jenis_usaha: formData.get('jenis_usaha')?.toString().trim() || null,
            status: formData.get('status')?.toString() || 'aktif'
        };
        
        if (!id) return { success: false, message: 'ID tenant tidak valid' };
        if (!data.nama_bisnis) return { success: false, message: 'Nama bisnis wajib diisi' };
        if (!data.nama_pemilik) return { success: false, message: 'Nama pemilik wajib diisi' };
        
        try {
            const [existing] = await query('SELECT * FROM pelanggan WHERE id = ?', [id]);
            if (!existing) return { success: false, message: 'Tenant tidak ditemukan' };
            
            if (data.email) {
                const [existingEmail] = await query('SELECT id FROM pelanggan WHERE email = ? AND id != ?', [data.email, id]);
                if (existingEmail) return { success: false, message: 'Email sudah digunakan tenant lain' };
            }
            
            await query(`
                UPDATE pelanggan SET
                    nama_bisnis = ?, nama_pemilik = ?, email = ?, no_telepon = ?,
                    alamat = ?, jenis_usaha = ?, status = ?, updated_at = NOW()
                WHERE id = ?
            `, [data.nama_bisnis, data.nama_pemilik, data.email, data.no_telepon, 
                data.alamat, data.jenis_usaha, data.status, id]);
            
            const userStatus = data.status === 'aktif' ? 'aktif' : 'nonaktif';
            await query('UPDATE tenant_users SET status = ?, updated_at = NOW() WHERE pelanggan_id = ? AND deleted_at IS NULL', 
                [userStatus, id]).catch(() => {});
            
            return { success: true, message: 'Tenant berhasil diperbarui!' };
            
        } catch (error) {
            console.error('Error updating tenant:', error);
            return { success: false, message: 'Gagal memperbarui tenant: ' + error.message };
        }
    },
    
    // ----------------------------------------
    // APPROVE + KIRIM EMAIL
    // ----------------------------------------
    approve: async ({ request, url }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        
        if (!id) return { success: false, message: 'ID tenant tidak valid' };
        
        try {
            const [tenant] = await query('SELECT * FROM pelanggan WHERE id = ?', [id]);
            if (!tenant) return { success: false, message: 'Tenant tidak ditemukan' };
            
            // Update status
            await query('UPDATE pelanggan SET status = ?, updated_at = NOW() WHERE id = ?', ['aktif', id]);
            
            // Update/create user
            if (tenant.email) {
                const [existingOwner] = await query(
                    'SELECT id FROM tenant_users WHERE pelanggan_id = ? AND is_primary = 1 AND deleted_at IS NULL', [id]
                );
                
                if (existingOwner) {
                    await query('UPDATE tenant_users SET status = ?, updated_at = NOW() WHERE pelanggan_id = ? AND deleted_at IS NULL', 
                        ['aktif', id]);
                } else {
                    const [lastUser] = await query('SELECT kode_user FROM tenant_users ORDER BY id DESC LIMIT 1');
                    let newKodeUser = 'USR001';
                    if (lastUser?.kode_user) {
                        const lastNum = parseInt(lastUser.kode_user.replace('USR', '')) || 0;
                        newKodeUser = `USR${String(lastNum + 1).padStart(3, '0')}`;
                    }
                    
                    await query(`
                        INSERT INTO tenant_users (
                            pelanggan_id, kode_user, email, password, nama, no_telepon,
                            role, is_primary, status, bahasa, tema, created_at, updated_at
                        ) VALUES (?, ?, ?, '123456', ?, ?, 'owner', 1, 'aktif', 'id', 'light', NOW(), NOW())
                    `, [id, newKodeUser, tenant.email, tenant.nama_pemilik, tenant.no_telepon]);
                }
            }
            
            // KIRIM EMAIL (async)
            sendApprovalEmail(tenant, url.origin, false)
                .then(result => console.log('📧 Approval email sent:', result))
                .catch(err => console.error('📧 Approval email error:', err));
            
            return { 
                success: true, 
                message: `Tenant "${tenant.nama_bisnis}" berhasil diaktifkan! Email notifikasi telah dikirim.`
            };
            
        } catch (error) {
            console.error('Error approving tenant:', error);
            return { success: false, message: 'Gagal mengaktifkan tenant: ' + error.message };
        }
    },
    
    // ----------------------------------------
    // SUSPEND + KIRIM EMAIL
    // ----------------------------------------
    suspend: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const reason = formData.get('reason')?.toString().trim() || '';
        
        if (!id) return { success: false, message: 'ID tenant tidak valid' };
        
        try {
            const [tenant] = await query('SELECT * FROM pelanggan WHERE id = ?', [id]);
            if (!tenant) return { success: false, message: 'Tenant tidak ditemukan' };
            
            await query('UPDATE pelanggan SET status = ?, updated_at = NOW() WHERE id = ?', ['nonaktif', id]);
            await query('UPDATE tenant_users SET status = ?, updated_at = NOW() WHERE pelanggan_id = ? AND deleted_at IS NULL', 
                ['nonaktif', id]).catch(() => {});
            
            // KIRIM EMAIL (async)
            sendRejectionEmail(tenant, reason, true)
                .then(result => console.log('📧 Suspend email sent:', result))
                .catch(err => console.error('📧 Suspend email error:', err));
            
            return { success: true, message: 'Tenant berhasil dinonaktifkan. Email notifikasi telah dikirim.' };
            
        } catch (error) {
            console.error('Error suspending tenant:', error);
            return { success: false, message: 'Gagal menonaktifkan tenant: ' + error.message };
        }
    },
    
    // ----------------------------------------
    // ACTIVATE + KIRIM EMAIL
    // ----------------------------------------
    activate: async ({ request, url }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        
        if (!id) return { success: false, message: 'ID tenant tidak valid' };
        
        try {
            const [tenant] = await query('SELECT * FROM pelanggan WHERE id = ?', [id]);
            if (!tenant) return { success: false, message: 'Tenant tidak ditemukan' };
            
            await query('UPDATE pelanggan SET status = ?, updated_at = NOW() WHERE id = ?', ['aktif', id]);
            
            if (tenant.email) {
                const [existingOwner] = await query(
                    'SELECT id FROM tenant_users WHERE pelanggan_id = ? AND is_primary = 1 AND deleted_at IS NULL', [id]
                );
                
                if (existingOwner) {
                    await query('UPDATE tenant_users SET status = ?, updated_at = NOW() WHERE pelanggan_id = ? AND deleted_at IS NULL', 
                        ['aktif', id]);
                } else {
                    const [lastUser] = await query('SELECT kode_user FROM tenant_users ORDER BY id DESC LIMIT 1');
                    let newKodeUser = 'USR001';
                    if (lastUser?.kode_user) {
                        const lastNum = parseInt(lastUser.kode_user.replace('USR', '')) || 0;
                        newKodeUser = `USR${String(lastNum + 1).padStart(3, '0')}`;
                    }
                    
                    await query(`
                        INSERT INTO tenant_users (
                            pelanggan_id, kode_user, email, password, nama, no_telepon,
                            role, is_primary, status, bahasa, tema, created_at, updated_at
                        ) VALUES (?, ?, ?, '123456', ?, ?, 'owner', 1, 'aktif', 'id', 'light', NOW(), NOW())
                    `, [id, newKodeUser, tenant.email, tenant.nama_pemilik, tenant.no_telepon]);
                }
            }
            
            // KIRIM EMAIL (async)
            sendApprovalEmail(tenant, url.origin, true)
                .then(result => console.log('📧 Reactivate email sent:', result))
                .catch(err => console.error('📧 Reactivate email error:', err));
            
            return { success: true, message: 'Tenant berhasil diaktifkan! Email notifikasi telah dikirim.' };
            
        } catch (error) {
            console.error('Error activating tenant:', error);
            return { success: false, message: 'Gagal mengaktifkan tenant: ' + error.message };
        }
    },
    
    // ----------------------------------------
    // DELETE
    // ----------------------------------------
    delete: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const reason = formData.get('reason')?.toString().trim() || 'Tidak ada alasan';
        
        if (!id) return { success: false, message: 'ID tenant tidak valid' };
        
        try {
            const [tenant] = await query('SELECT * FROM pelanggan WHERE id = ?', [id]);
            if (!tenant) return { success: false, message: 'Tenant tidak ditemukan' };
            
            const [trxCount] = await query('SELECT COUNT(*) as count FROM transaksi WHERE pelanggan_id = ?', [id]);
            const userId = locals?.user?.id || null;
            
            if (trxCount?.count > 0) {
                // SOFT DELETE (ARSIP)
                await query(`
                    UPDATE pelanggan SET status = 'arsip', archived_at = NOW(), 
                    archived_by = ?, archive_reason = ?, updated_at = NOW() WHERE id = ?
                `, [userId, reason, id]);
                
                await query('UPDATE tenant_users SET status = ?, updated_at = NOW() WHERE pelanggan_id = ?', 
                    ['nonaktif', id]).catch(() => {});
                
                await query(`
                    INSERT INTO tenant_archive_logs (pelanggan_id, action, reason, performed_by, old_status, new_status)
                    VALUES (?, 'archive', ?, ?, ?, 'arsip')
                `, [id, reason, userId, tenant.status]).catch(() => {});
                
                // Kirim email
                sendRejectionEmail(tenant, reason, true).catch(() => {});
                
                return { 
                    success: true, 
                    message: `Tenant "${tenant.nama_bisnis}" dipindahkan ke arsip`,
                    action: 'archived'
                };
                
            } else {
                // HARD DELETE
                await query(`
                    INSERT INTO tenant_archive_logs (pelanggan_id, action, reason, performed_by, old_status, new_status, metadata)
                    VALUES (?, 'delete_permanent', ?, ?, ?, NULL, ?)
                `, [id, reason, userId, tenant.status, 
                    JSON.stringify({ nama_bisnis: tenant.nama_bisnis, kode: tenant.kode_pelanggan })
                ]).catch(() => {});
                
                // Hapus data terkait
                const tablesToDelete = [
                    'transaksi_detail', 'transaksi', 'hold_bill_details', 'hold_bills',
                    'harga_grosir', 'produk_varian', 'stok_log', 'produk', 'kategori', 'merk',
                    'kas_transaksi', 'shift_users', 'shifts', 'stations', 'tenant_settings',
                    'pengaturan', 'tenant_user_sessions', 'tenant_activity_logs', 'notifications',
                    'member_poin_history', 'tenant_users', 'users'
                ];
                
                for (const table of tablesToDelete) {
                    await query(`DELETE FROM ${table} WHERE pelanggan_id = ?`, [id]).catch(() => {});
                }
                
                await query('DELETE FROM pelanggan WHERE id = ?', [id]);
                
                return { 
                    success: true, 
                    message: `Tenant "${tenant.nama_bisnis}" berhasil dihapus permanen`,
                    action: 'deleted'
                };
            }
            
        } catch (error) {
            console.error('Error deleting tenant:', error);
            return { success: false, message: 'Gagal menghapus tenant: ' + error.message };
        }
    }
};