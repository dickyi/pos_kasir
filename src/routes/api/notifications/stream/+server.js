/**
 * ============================================
 * SSE Stream Endpoint (Fixed)
 * File: src/routes/api/notifications/stream/+server.js
 * ============================================
 */

import { query } from '$lib/db.js';
import { getUserFromSession } from '$lib/auth.js';

// Track last notification ID per user
const lastIds = new Map();

export async function GET({ cookies, request }) {
    const user = getUserFromSession(cookies);
    
    if (!user || !user.pelanggan_id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const pelangganId = user.pelanggan_id;
    const encoder = new TextEncoder();
    let isActive = true;

    const stream = new ReadableStream({
        async start(controller) {
            // Helper untuk send data
            const send = (data) => {
                try {
                    if (isActive) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                    }
                } catch (e) {
                    console.error('SSE send error:', e.message);
                }
            };

            // Send connected message
            send({ type: 'connected', message: 'SSE Connected', timestamp: new Date().toISOString() });

            // Cek apakah tabel notifications ada
            try {
                const tableCheck = await query(`
                    SELECT COUNT(*) as count 
                    FROM information_schema.tables 
                    WHERE table_schema = DATABASE() 
                    AND table_name = 'notifications'
                `);

                if (!tableCheck || tableCheck[0]?.count === 0) {
                    send({ 
                        type: 'error', 
                        message: 'Tabel notifications belum dibuat',
                        hint: 'Jalankan file notifications.sql di phpMyAdmin'
                    });
                    // Tetap jalan tapi tanpa data
                }
            } catch (e) {
                console.error('Table check error:', e.message);
            }

            // Load initial notifications
            try {
                const notifications = await query(`
                    SELECT id, type, title, message, icon, link, data, is_read, created_at
                    FROM notifications
                    WHERE pelanggan_id = ?
                    ORDER BY created_at DESC
                    LIMIT 20
                `, [pelangganId]);

                const countResult = await query(`
                    SELECT COUNT(*) as unread FROM notifications
                    WHERE pelanggan_id = ? AND is_read = 0
                `, [pelangganId]);

                // Store last ID
                if (notifications && notifications.length > 0) {
                    lastIds.set(pelangganId, notifications[0].id);
                }

                send({
                    type: 'initial',
                    notifications: notifications || [],
                    unread: countResult?.[0]?.unread || 0
                });

            } catch (e) {
                console.error('Initial load error:', e.message);
                send({ type: 'initial', notifications: [], unread: 0 });
            }

            // Heartbeat setiap 25 detik
            const heartbeat = setInterval(() => {
                if (isActive) {
                    try {
                        controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
                    } catch (e) {
                        clearInterval(heartbeat);
                    }
                }
            }, 25000);

            // Check new notifications setiap 3 detik
            const checkNew = setInterval(async () => {
                if (!isActive) {
                    clearInterval(checkNew);
                    return;
                }

                try {
                    const lastId = lastIds.get(pelangganId) || 0;

                    const newNotifs = await query(`
                        SELECT id, type, title, message, icon, link, data, is_read, created_at
                        FROM notifications
                        WHERE pelanggan_id = ? AND id > ?
                        ORDER BY created_at DESC
                    `, [pelangganId, lastId]);

                    if (newNotifs && newNotifs.length > 0) {
                        lastIds.set(pelangganId, newNotifs[0].id);

                        const countResult = await query(`
                            SELECT COUNT(*) as unread FROM notifications
                            WHERE pelanggan_id = ? AND is_read = 0
                        `, [pelangganId]);

                        send({
                            type: 'new',
                            notifications: newNotifs,
                            unread: countResult?.[0]?.unread || 0
                        });
                    }
                } catch (e) {
                    // Silent fail untuk check periodic
                }
            }, 3000);

            // Cleanup saat connection closed
            request.signal.addEventListener('abort', () => {
                isActive = false;
                clearInterval(heartbeat);
                clearInterval(checkNew);
                lastIds.delete(pelangganId);
            });
        },

        cancel() {
            isActive = false;
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
            'Access-Control-Allow-Origin': '*'
        }
    });
}