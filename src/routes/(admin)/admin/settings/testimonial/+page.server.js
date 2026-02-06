// ============================================
// ADMIN: KELOLA TESTIMONIAL - SERVER (IMPROVED)
// File: src/routes/(admin)/admin/settings/testimonial/+page.server.js
// ============================================

import { query } from '$lib/db.js';
import { fail } from '@sveltejs/kit';

export async function load({ url, locals }) {
    const status = url.searchParams.get('status') || '';
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    try {
        // ============================================
        // STATS - Handle NULL status (legacy data)
        // ============================================
        const [statsResult] = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' OR (status IS NULL AND is_active = 1) THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM landing_testimonials
        `);
        
        const stats = {
            total: Number(statsResult?.total) || 0,
            pending: Number(statsResult?.pending) || 0,
            approved: Number(statsResult?.approved) || 0,
            rejected: Number(statsResult?.rejected) || 0
        };
        
        // ============================================
        // BUILD QUERY - Handle NULL status
        // ============================================
        let whereClause = '1=1';
        const params = [];
        
        if (status) {
            if (status === 'approved') {
                // Include legacy data (NULL status but is_active = 1)
                whereClause += ' AND (status = ? OR (status IS NULL AND is_active = 1))';
            } else {
                whereClause += ' AND status = ?';
            }
            params.push(status);
        }
        
        if (search) {
            whereClause += ' AND (name LIKE ? OR business_name LIKE ? OR email LIKE ? OR testimonial LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        // ============================================
        // COUNT & GET DATA
        // ============================================
        const [countResult] = await query(`
            SELECT COUNT(*) as total FROM landing_testimonials WHERE ${whereClause}
        `, params);
        
        const total = countResult?.total || 0;
        const totalPages = Math.ceil(total / limit);
        
        const testimonials = await query(`
            SELECT * FROM landing_testimonials 
            WHERE ${whereClause}
            ORDER BY 
                CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
                COALESCE(submitted_at, created_at) DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);
        
        return {
            testimonials,
            stats,
            pagination: { page, limit, total, totalPages }
        };
        
    } catch (error) {
        console.error('Error loading testimonials:', error);
        return {
            testimonials: [],
            stats: { total: 0, pending: 0, approved: 0, rejected: 0 },
            pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
            error: error.message
        };
    }
}

export const actions = {
    // ============================================
    // APPROVE TESTIMONIAL
    // ============================================
    approve: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        
        try {
            await query(`
                UPDATE landing_testimonials 
                SET status = 'approved', 
                    is_active = 1,
                    reviewed_at = NOW(),
                    reviewed_by = ?
                WHERE id = ?
            `, [locals.user?.id || null, id]);
            
            return { success: true, message: 'Testimoni berhasil disetujui' };
        } catch (error) {
            console.error('Error approving testimonial:', error);
            return fail(500, { error: true, message: 'Gagal menyetujui testimoni' });
        }
    },
    
    // ============================================
    // REJECT TESTIMONIAL
    // ============================================
    reject: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const reject_reason = formData.get('reject_reason') || null;
        
        try {
            await query(`
                UPDATE landing_testimonials 
                SET status = 'rejected', 
                    is_active = 0,
                    reviewed_at = NOW(),
                    reviewed_by = ?,
                    reject_reason = ?
                WHERE id = ?
            `, [locals.user?.id || null, reject_reason, id]);
            
            return { success: true, message: 'Testimoni berhasil ditolak' };
        } catch (error) {
            console.error('Error rejecting testimonial:', error);
            return fail(500, { error: true, message: 'Gagal menolak testimoni' });
        }
    },
    
    // ============================================
    // TOGGLE VISIBILITY (is_active)
    // ============================================
    toggleVisibility: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const is_active = formData.get('is_active') === '1' ? 1 : 0;
        
        try {
            await query(`
                UPDATE landing_testimonials SET is_active = ? WHERE id = ?
            `, [is_active, id]);
            
            return { success: true, message: is_active ? 'Testimoni ditampilkan' : 'Testimoni disembunyikan' };
        } catch (error) {
            console.error('Error toggling visibility:', error);
            return fail(500, { error: true, message: 'Gagal mengubah visibilitas' });
        }
    },
    
    // ============================================
    // DELETE TESTIMONIAL
    // ============================================
    delete: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        
        try {
            await query(`DELETE FROM landing_testimonials WHERE id = ?`, [id]);
            return { success: true, message: 'Testimoni berhasil dihapus' };
        } catch (error) {
            console.error('Error deleting testimonial:', error);
            return fail(500, { error: true, message: 'Gagal menghapus testimoni' });
        }
    },
    
    // ============================================
    // ADD TESTIMONIAL (Manual by Admin)
    // ============================================
    add: async ({ request, locals }) => {
        const formData = await request.formData();
        
        try {
            await query(`
                INSERT INTO landing_testimonials 
                (name, role, business_name, business_type, email, phone, testimonial, rating, location, is_featured, sort_order, is_active, status, submitted_at, reviewed_at, reviewed_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', NOW(), NOW(), ?)
            `, [
                formData.get('name'),
                formData.get('role') || null,
                formData.get('business_name') || null,
                formData.get('business_type') || null,
                formData.get('email') || null,
                formData.get('phone') || null,
                formData.get('testimonial'),
                parseInt(formData.get('rating')) || 5,
                formData.get('location') || null,
                formData.has('is_featured') ? 1 : 0,
                parseInt(formData.get('sort_order')) || 0,
                formData.has('is_active') ? 1 : 1, // Default aktif
                locals.user?.id || null
            ]);
            
            return { success: true, message: 'Testimoni berhasil ditambahkan' };
        } catch (error) {
            console.error('Error adding testimonial:', error);
            return fail(500, { error: true, message: 'Gagal menambahkan testimoni' });
        }
    },
    
    // ============================================
    // UPDATE TESTIMONIAL
    // ============================================
    update: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        
        try {
            await query(`
                UPDATE landing_testimonials SET
                    name = ?,
                    role = ?,
                    business_name = ?,
                    business_type = ?,
                    email = ?,
                    phone = ?,
                    testimonial = ?,
                    rating = ?,
                    location = ?,
                    is_featured = ?,
                    sort_order = ?,
                    is_active = ?
                WHERE id = ?
            `, [
                formData.get('name'),
                formData.get('role') || null,
                formData.get('business_name') || null,
                formData.get('business_type') || null,
                formData.get('email') || null,
                formData.get('phone') || null,
                formData.get('testimonial'),
                parseInt(formData.get('rating')) || 5,
                formData.get('location') || null,
                formData.has('is_featured') ? 1 : 0,
                parseInt(formData.get('sort_order')) || 0,
                formData.has('is_active') ? 1 : 0,
                id
            ]);
            
            return { success: true, message: 'Testimoni berhasil diupdate' };
        } catch (error) {
            console.error('Error updating testimonial:', error);
            return fail(500, { error: true, message: 'Gagal mengupdate testimoni' });
        }
    }
};