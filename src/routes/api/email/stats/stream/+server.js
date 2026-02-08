// ============================================
// EMAIL STATS STREAM - Server-Sent Events (SSE)
// File: src/routes/api/email/stats/stream/+server.js
// 
// ✅ UPDATED: Vercel-friendly version
// 
// Perubahan dari versi sebelumnya:
// - MAX_CONNECTION_TIME dikurangi ke 25 detik (di bawah Vercel timeout)
// - CHECK_INTERVAL diperbesar ke 5 detik (kurangi DB queries)
// - Menambahkan header X-Data-Source untuk deteksi di client
// - Graceful close saat mendekati timeout
// 
// CATATAN: Di Vercel, SSE akan timeout setelah ~25 detik.
// Client (emailStore.js) akan otomatis fallback ke polling.
// Di VPS/dedicated server, SSE tetap berjalan normal.
// ============================================

import { query } from '$lib/db.js';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    // Interval check untuk perubahan data (ms)
    CHECK_INTERVAL: 5000,  // 5 detik (lebih hemat DB queries)
    
    // Heartbeat interval untuk keep-alive (ms)
    HEARTBEAT_INTERVAL: 15000,  // 15 detik
    
    // ✅ UPDATED: Max connection time - 25 detik untuk Vercel compatibility
    // Vercel Pro: 60s timeout, Free: 10s timeout
    // Kita pakai 25 detik supaya aman di semua plan
    MAX_CONNECTION_TIME: 25 * 1000,  // 25 detik
    
    // Jumlah recent logs yang dikirim
    RECENT_LOGS_LIMIT: 10
};

// ============================================
// HELPER FUNCTIONS
// ============================================

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
        console.error('[SSE] Error getting email stats:', error.message);
        return {
            total_sent: 0,
            total_failed: 0,
            today_sent: 0,
            queue_pending: 0
        };
    }
}

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
        console.error('[SSE] Error getting recent logs:', error.message);
        return [];
    }
}

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
        console.error('[SSE] Error getting template stats:', error.message);
        return [];
    }
}

function formatSSE(event, data) {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function hashData(data) {
    return JSON.stringify(data);
}

// ============================================
// SSE ENDPOINT
// ============================================

export async function GET({ request }) {
    let lastStatsHash = '';
    let lastLogsHash = '';
    let lastTemplateHash = '';
    let isActive = true;
    let checkInterval;
    let heartbeatInterval;
    let connectionTimeout;
    
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            
            const send = (event, data) => {
                try {
                    controller.enqueue(encoder.encode(formatSSE(event, data)));
                } catch (e) {
                    isActive = false;
                }
            };
            
            const sendInitialData = async () => {
                try {
                    const stats = await getEmailStats();
                    const logs = await getRecentLogs();
                    const templates = await getTemplateStats();
                    
                    lastStatsHash = hashData(stats);
                    lastLogsHash = hashData(logs);
                    lastTemplateHash = hashData(templates);
                    
                    // ✅ Send connected event dengan info source
                    send('connected', {
                        message: 'Connected to email stats stream',
                        timestamp: new Date().toISOString(),
                        source: 'sse',
                        config: {
                            checkInterval: CONFIG.CHECK_INTERVAL,
                            heartbeatInterval: CONFIG.HEARTBEAT_INTERVAL,
                            maxConnectionTime: CONFIG.MAX_CONNECTION_TIME
                        }
                    });
                    
                    send('stats', {
                        ...stats,
                        timestamp: new Date().toISOString()
                    });
                    
                    send('logs', {
                        logs,
                        count: logs.length,
                        timestamp: new Date().toISOString()
                    });
                    
                    send('templates', {
                        templates,
                        count: templates.length,
                        timestamp: new Date().toISOString()
                    });
                    
                } catch (error) {
                    console.error('[SSE] Error sending initial data:', error);
                    send('error', { message: error.message });
                }
            };
            
            const checkUpdates = async () => {
                if (!isActive) return;
                
                try {
                    const stats = await getEmailStats();
                    const statsHash = hashData(stats);
                    
                    if (statsHash !== lastStatsHash) {
                        lastStatsHash = statsHash;
                        send('stats', {
                            ...stats,
                            timestamp: new Date().toISOString(),
                            updated: true
                        });
                    }
                    
                    const logs = await getRecentLogs();
                    const logsHash = hashData(logs);
                    
                    if (logsHash !== lastLogsHash) {
                        lastLogsHash = logsHash;
                        send('logs', {
                            logs,
                            count: logs.length,
                            timestamp: new Date().toISOString(),
                            updated: true
                        });
                    }
                    
                    const templates = await getTemplateStats();
                    const templateHash = hashData(templates);
                    
                    if (templateHash !== lastTemplateHash) {
                        lastTemplateHash = templateHash;
                        send('templates', {
                            templates,
                            count: templates.length,
                            timestamp: new Date().toISOString(),
                            updated: true
                        });
                    }
                    
                } catch (error) {
                    console.error('[SSE] Error checking updates:', error);
                }
            };
            
            const sendHeartbeat = () => {
                if (!isActive) return;
                send('heartbeat', {
                    timestamp: new Date().toISOString(),
                    uptime: Date.now()
                });
            };
            
            const cleanup = () => {
                isActive = false;
                if (checkInterval) clearInterval(checkInterval);
                if (heartbeatInterval) clearInterval(heartbeatInterval);
                if (connectionTimeout) clearTimeout(connectionTimeout);
                
                try {
                    controller.close();
                } catch (e) {
                    // Already closed
                }
            };
            
            // Send initial data
            await sendInitialData();
            
            // Start periodic checks
            checkInterval = setInterval(checkUpdates, CONFIG.CHECK_INTERVAL);
            
            // Start heartbeat
            heartbeatInterval = setInterval(sendHeartbeat, CONFIG.HEARTBEAT_INTERVAL);
            
            // ✅ UPDATED: Shorter timeout for Vercel compatibility
            // Client akan otomatis reconnect atau fallback ke polling
            connectionTimeout = setTimeout(() => {
                send('timeout', {
                    message: 'Connection timeout, client should fallback to polling',
                    timestamp: new Date().toISOString(),
                    shouldFallback: true
                });
                cleanup();
            }, CONFIG.MAX_CONNECTION_TIME);
            
            // Handle client disconnect
            request.signal.addEventListener('abort', cleanup);
        },
        
        cancel() {
            isActive = false;
        }
    });
    
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
            'X-Data-Source': 'sse',
            'Access-Control-Allow-Origin': '*'
        }
    });
}