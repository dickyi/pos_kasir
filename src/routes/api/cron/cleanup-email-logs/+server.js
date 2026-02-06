// ============================================
// CRON: Email Weekly Cleanup
// File: src/routes/api/cron/cleanup-email-logs/+server.js
//
// Konversi dari MySQL Event: evt_email_weekly_cleanup
// Schedule: Setiap minggu (weekly)
// 
// Fungsi:
// - Hapus email_logs yang lebih dari 90 hari
// - Hapus email_queue (sent/failed/cancelled) lebih dari 90 hari
// ============================================

import { query } from '$lib/db.js';
import { json } from '@sveltejs/kit';

const CRON_SECRET = process.env.CRON_SECRET || '';

function verifyCronAuth(request) {
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return false;
    }
    return true;
}

export async function GET({ request }) {
    if (!verifyCronAuth(request)) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const daysToKeep = 90;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        // Hapus email_logs lama
        const logsResult = await query(
            `DELETE FROM email_logs WHERE DATE(created_at) < DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
            [daysToKeep]
        );

        // Hapus email_queue yang sudah selesai dan lama
        const queueResult = await query(
            `DELETE FROM email_queue 
             WHERE status IN ('sent', 'failed', 'cancelled')
             AND DATE(created_at) < DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
            [daysToKeep]
        );

        const summary = {
            success: true,
            deleted: {
                email_logs: logsResult.affectedRows || 0,
                email_queue: queueResult.affectedRows || 0
            },
            cutoff_date: cutoffDate.toISOString().split('T')[0],
            days_kept: daysToKeep,
            timestamp: new Date().toISOString()
        };

        console.log('[Cron] Email weekly cleanup:', summary);
        return json(summary);

    } catch (error) {
        console.error('[Cron] Error email cleanup:', error);
        return json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}