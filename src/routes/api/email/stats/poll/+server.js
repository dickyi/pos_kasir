// ============================================
// EMAIL STATS POLL - Polling API Endpoint
// File: src/routes/api/email/stats/poll/+server.js
// 
// ✅ VERCEL COMPATIBLE - Pengganti SSE untuk serverless
// 
// Endpoint ini mengembalikan data email stats dalam 
// satu request (stateless), cocok untuk:
// - Vercel Serverless Functions
// - Cloudflare Workers
// - Netlify Functions
// - Atau hosting serverless lainnya
//
// Digunakan oleh emailStore.js sebagai fallback
// ketika SSE tidak tersedia/timeout
// ============================================

import { query } from '$lib/db.js';
import { json } from '@sveltejs/kit';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    RECENT_LOGS_LIMIT: 10,
    CACHE_CONTROL: 'no-cache, no-store, must-revalidate'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Ambil email stats dari database
 */
async function getEmailStats() {
    try {
        const stats = await query(`
            SELECT 
                (SELECT COUNT(*) FROM email_logs WHERE status = 'sent') as total_sent,
                (SELECT COUNT(*) FROM email_logs WHERE status = 'failed') as total_failed,
                (SELECT COUNT(*) FROM email_logs WHERE DATE(created_at) = CURDATE() AND status = 'sent') as today_sent,
                (SELECT COUNT(*) FROM email_queue WHERE status = 'pending') as queue_pending
        `);
        
        return stats[0] || {
            total_sent: 0,
            total_failed: 0,
            today_sent: 0,
            queue_pending: 0
        };
    } catch (error) {
        console.error('[Poll] Error getting email stats:', error.message);
        return {
            total_sent: 0,
            total_failed: 0,
            today_sent: 0,
            queue_pending: 0
        };
    }
}

/**
 * Ambil recent email logs
 */
async function getRecentLogs() {
    try {
        const logs = await query(`
            SELECT 
                id,
                template_key,
                recipient_email,
                recipient_name,
                subject,
                status,
                error_message,
                sent_at,
                created_at
            FROM email_logs
            ORDER BY created_at DESC
            LIMIT ?
        `, [CONFIG.RECENT_LOGS_LIMIT]);
        
        return logs || [];
    } catch (error) {
        console.error('[Poll] Error getting recent logs:', error.message);
        return [];
    }
}

/**
 * Ambil template stats
 */
async function getTemplateStats() {
    try {
        const templates = await query(`
            SELECT 
                template_key,
                template_name,
                is_active,
                total_sent,
                total_failed,
                last_sent_at
            FROM email_template_settings
            ORDER BY sort_order ASC
        `);
        
        return templates || [];
    } catch (error) {
        console.error('[Poll] Error getting template stats:', error.message);
        return [];
    }
}

// ============================================
// GET ENDPOINT - Fetch all email stats
// ============================================

export async function GET({ url }) {
    try {
        // Optional: hanya ambil data tertentu via query param
        // ?only=stats atau ?only=logs atau ?only=templates
        const only = url.searchParams.get('only');
        
        const response = {
            timestamp: new Date().toISOString(),
            success: true
        };
        
        if (!only || only === 'stats' || only === 'all') {
            response.stats = await getEmailStats();
        }
        
        if (!only || only === 'logs' || only === 'all') {
            const logs = await getRecentLogs();
            response.logs = logs;
            response.logsCount = logs.length;
        }
        
        if (!only || only === 'templates' || only === 'all') {
            const templates = await getTemplateStats();
            response.templates = templates;
            response.templatesCount = templates.length;
        }
        
        return json(response, {
            headers: {
                'Cache-Control': CONFIG.CACHE_CONTROL,
                'X-Data-Source': 'poll'
            }
        });
        
    } catch (error) {
        console.error('[Poll] Error:', error);
        return json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }, {
            status: 500,
            headers: {
                'Cache-Control': CONFIG.CACHE_CONTROL
            }
        });
    }
}