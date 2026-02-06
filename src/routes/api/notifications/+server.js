/**
 * ============================================
 * NOTIFICATIONS API (Base)
 * File: src/routes/api/notifications/+server.js
 * ============================================
 */

import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';
import { getUserFromSession } from '$lib/auth.js';

/**
 * GET - Ambil daftar notifikasi
 */
export async function GET({ cookies, url }) {
    const user = getUserFromSession(cookies);
    
    if (!user || !user.pelanggan_id) {
        return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    try {
        // Cek apakah tabel notifications ada
        const tableCheck = await query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'notifications'
        `);

        if (!tableCheck || tableCheck[0]?.count === 0) {
            // Tabel belum ada, return empty
            console.log('⚠️ Tabel notifications belum dibuat!');
            return json({
                success: true,
                notifications: [],
                total: 0,
                unread: 0,
                message: 'Tabel notifications belum dibuat. Jalankan SQL di phpMyAdmin.'
            });
        }

        // Query notifikasi
        const notifications = await query(`
            SELECT 
                id,
                type,
                title,
                message,
                icon,
                link,
                data,
                is_read,
                read_at,
                created_at
            FROM notifications
            WHERE pelanggan_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [user.pelanggan_id, limit, offset]);

        // Hitung total dan unread
        const countResult = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread
            FROM notifications
            WHERE pelanggan_id = ?
        `, [user.pelanggan_id]);

        return json({
            success: true,
            notifications: notifications || [],
            total: countResult[0]?.total || 0,
            unread: countResult[0]?.unread || 0
        });

    } catch (error) {
        console.error('❌ Error fetching notifications:', error.message);
        return json({ 
            success: false, 
            error: error.message,
            notifications: [],
            total: 0,
            unread: 0
        }, { status: 500 });
    }
}

/**
 * PATCH - Mark notification as read
 */
export async function PATCH({ cookies, request }) {
    const user = getUserFromSession(cookies);
    
    if (!user || !user.pelanggan_id) {
        return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        
        if (body.all === true) {
            await query(`
                UPDATE notifications 
                SET is_read = 1, read_at = NOW()
                WHERE pelanggan_id = ? AND is_read = 0
            `, [user.pelanggan_id]);

            return json({ success: true, message: 'All marked as read' });
        }

        if (body.id) {
            await query(`
                UPDATE notifications 
                SET is_read = 1, read_at = NOW()
                WHERE id = ? AND pelanggan_id = ?
            `, [body.id, user.pelanggan_id]);

            return json({ success: true, message: 'Marked as read' });
        }

        return json({ success: false, error: 'Invalid request' }, { status: 400 });

    } catch (error) {
        console.error('❌ Error updating notification:', error.message);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * DELETE - Hapus notifikasi
 */
export async function DELETE({ cookies, request }) {
    const user = getUserFromSession(cookies);
    
    if (!user || !user.pelanggan_id) {
        return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        
        if (body.all === true) {
            await query(`DELETE FROM notifications WHERE pelanggan_id = ?`, [user.pelanggan_id]);
            return json({ success: true, message: 'All deleted' });
        }

        if (body.read_only === true) {
            await query(`DELETE FROM notifications WHERE pelanggan_id = ? AND is_read = 1`, [user.pelanggan_id]);
            return json({ success: true, message: 'Read notifications deleted' });
        }

        if (body.id) {
            await query(`DELETE FROM notifications WHERE id = ? AND pelanggan_id = ?`, [body.id, user.pelanggan_id]);
            return json({ success: true, message: 'Deleted' });
        }

        return json({ success: false, error: 'Invalid request' }, { status: 400 });

    } catch (error) {
        console.error('❌ Error deleting notification:', error.message);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}