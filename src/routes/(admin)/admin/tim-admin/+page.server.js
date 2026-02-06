// ============================================
// TIM ADMIN - SERVER
// File: src/routes/(admin)/admin/tim-admin/+page.server.js
// ============================================

import { query } from '$lib/db.js';
import { fail } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';

export async function load({ url }) {
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const role = url.searchParams.get('role') || '';
    const online = url.searchParams.get('online') === 'true';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    try {
        // ============================================
        // STATS
        // ============================================
        const [statsResult] = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as aktif,
                SUM(CASE WHEN status = 'nonaktif' THEN 1 ELSE 0 END) as nonaktif,
                SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) as super_admin,
                SUM(CASE WHEN last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 1 ELSE 0 END) as online_now
            FROM admin_users
        `);
        
        const stats = {
            total: Number(statsResult?.total) || 0,
            aktif: Number(statsResult?.aktif) || 0,
            nonaktif: Number(statsResult?.nonaktif) || 0,
            superAdmin: Number(statsResult?.super_admin) || 0,
            onlineNow: Number(statsResult?.online_now) || 0
        };
        
        // ============================================
        // ADMIN LIST
        // ============================================
        let whereClause = '1=1';
        const params = [];
        
        if (search) {
            whereClause += ` AND (nama LIKE ? OR username LIKE ? OR email LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        if (status) {
            whereClause += ` AND status = ?`;
            params.push(status);
        }
        
        if (role) {
            whereClause += ` AND role = ?`;
            params.push(role);
        }
        
        if (online) {
            whereClause += ` AND last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)`;
        }
        
        // Count total
        const [countResult] = await query(`
            SELECT COUNT(*) as total FROM admin_users WHERE ${whereClause}
        `, params);
        
        const total = countResult?.total || 0;
        const totalPages = Math.ceil(total / limit);
        
        // Get admins
        const admins = await query(`
            SELECT 
                id, nama, username, email, no_telepon, role, status,
                avatar, last_login, last_activity, created_at
            FROM admin_users
            WHERE ${whereClause}
            ORDER BY 
                CASE WHEN last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 0 ELSE 1 END,
                created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);
        
        // ============================================
        // RECENT ACTIVITIES
        // ============================================
        const activities = await query(`
            SELECT 
                al.id,
                al.action,
                al.description,
                al.target,
                al.ip_address,
                al.created_at,
                au.nama as admin_name
            FROM admin_activity_logs al
            LEFT JOIN admin_users au ON al.admin_id = au.id
            ORDER BY al.created_at DESC
            LIMIT 15
        `).catch(() => []);
        
        return {
            stats,
            admins,
            activities,
            pagination: { page, limit, total, totalPages }
        };
        
    } catch (error) {
        console.error('Error loading admin team data:', error);
        return {
            stats: { total: 0, aktif: 0, nonaktif: 0, superAdmin: 0, onlineNow: 0 },
            admins: [],
            activities: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
            error: error.message
        };
    }
}

export const actions = {
    // ============================================
    // CREATE ADMIN
    // ============================================
    create: async ({ request }) => {
        const formData = await request.formData();
        const nama = formData.get('nama');
        const username = formData.get('username');
        const email = formData.get('email');
        const no_telepon = formData.get('no_telepon');
        const password = formData.get('password');
        const role = formData.get('role');
        
        try {
            // Validate
            if (!nama || !username || !email || !password) {
                return fail(400, { error: true, message: 'Semua field wajib diisi' });
            }
            
            // Check existing username/email
            const [existing] = await query(`
                SELECT id FROM admin_users WHERE username = ? OR email = ?
            `, [username, email]);
            
            if (existing) {
                return fail(400, { error: true, message: 'Username atau email sudah digunakan' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);
            
            // Insert
            await query(`
                INSERT INTO admin_users (nama, username, email, no_telepon, password, role, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'aktif', NOW())
            `, [nama, username, email, no_telepon || null, hashedPassword, role]);
            
            return { success: true, message: 'Admin berhasil ditambahkan' };
            
        } catch (error) {
            console.error('Error creating admin:', error);
            return fail(500, { error: true, message: 'Gagal menambahkan admin' });
        }
    },
    
    // ============================================
    // UPDATE ADMIN
    // ============================================
    update: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const nama = formData.get('nama');
        const username = formData.get('username');
        const email = formData.get('email');
        const no_telepon = formData.get('no_telepon');
        const password = formData.get('password');
        const role = formData.get('role');
        const status = formData.get('status');
        
        try {
            // Check existing username/email (exclude current)
            const [existing] = await query(`
                SELECT id FROM admin_users WHERE (username = ? OR email = ?) AND id != ?
            `, [username, email, id]);
            
            if (existing) {
                return fail(400, { error: true, message: 'Username atau email sudah digunakan' });
            }
            
            // Build update query
            let updateQuery = `
                UPDATE admin_users SET 
                    nama = ?, username = ?, email = ?, no_telepon = ?, role = ?, status = ?
            `;
            let params = [nama, username, email, no_telepon || null, role, status];
            
            // Update password if provided
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 12);
                updateQuery += `, password = ?`;
                params.push(hashedPassword);
            }
            
            updateQuery += ` WHERE id = ?`;
            params.push(id);
            
            await query(updateQuery, params);
            
            return { success: true, message: 'Admin berhasil diperbarui' };
            
        } catch (error) {
            console.error('Error updating admin:', error);
            return fail(500, { error: true, message: 'Gagal memperbarui admin' });
        }
    },
    
    // ============================================
    // DELETE ADMIN
    // ============================================
    delete: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        
        try {
            // Check if super_admin (prevent delete last super_admin)
            const [admin] = await query(`SELECT role FROM admin_users WHERE id = ?`, [id]);
            
            if (admin?.role === 'super_admin') {
                const [superAdminCount] = await query(`
                    SELECT COUNT(*) as count FROM admin_users WHERE role = 'super_admin'
                `);
                
                if (superAdminCount?.count <= 1) {
                    return fail(400, { error: true, message: 'Tidak dapat menghapus Super Admin terakhir' });
                }
            }
            
            // Delete admin
            await query(`DELETE FROM admin_users WHERE id = ?`, [id]);
            
            // Delete related activity logs
            await query(`DELETE FROM admin_activity_logs WHERE admin_id = ?`, [id]);
            
            return { success: true, message: 'Admin berhasil dihapus' };
            
        } catch (error) {
            console.error('Error deleting admin:', error);
            return fail(500, { error: true, message: 'Gagal menghapus admin' });
        }
    },
    
    // ============================================
    // RESET PASSWORD
    // ============================================
    resetPassword: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const new_password = formData.get('new_password');
        
        try {
            if (!new_password || new_password.length < 8) {
                return fail(400, { error: true, message: 'Password minimal 8 karakter' });
            }
            
            const hashedPassword = await bcrypt.hash(new_password, 12);
            
            await query(`
                UPDATE admin_users SET password = ? WHERE id = ?
            `, [hashedPassword, id]);
            
            // Invalidate all sessions (logout all devices)
            await query(`DELETE FROM admin_sessions WHERE admin_id = ?`, [id]).catch(() => {});
            
            return { success: true, message: 'Password berhasil direset' };
            
        } catch (error) {
            console.error('Error resetting password:', error);
            return fail(500, { error: true, message: 'Gagal mereset password' });
        }
    },
    
    // ============================================
    // TOGGLE STATUS
    // ============================================
    toggleStatus: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const status = formData.get('status');
        
        try {
            await query(`
                UPDATE admin_users SET status = ? WHERE id = ?
            `, [status, id]);
            
            // If deactivating, logout all sessions
            if (status === 'nonaktif') {
                await query(`DELETE FROM admin_sessions WHERE admin_id = ?`, [id]).catch(() => {});
            }
            
            return { success: true, message: `Admin berhasil ${status === 'aktif' ? 'diaktifkan' : 'dinonaktifkan'}` };
            
        } catch (error) {
            console.error('Error toggling status:', error);
            return fail(500, { error: true, message: 'Gagal mengubah status admin' });
        }
    },
    
    // ============================================
    // LOGOUT ALL DEVICES
    // ============================================
    logoutAll: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        
        try {
            await query(`DELETE FROM admin_sessions WHERE admin_id = ?`, [id]).catch(() => {});
            
            return { success: true, message: 'Admin berhasil di-logout dari semua device' };
            
        } catch (error) {
            console.error('Error logging out all devices:', error);
            return fail(500, { error: true, message: 'Gagal logout admin' });
        }
    }
};