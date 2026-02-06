// ============================================
// EMAIL STATS STREAM - Server-Sent Events (SSE)
// File: src/routes/api/email/stats/stream/+server.js
// 
// Real-time streaming endpoint untuk:
// - Email statistics (total_sent, total_failed, today, queue)
// - Recent email logs
// - Template stats
// 
// Fitur:
// - Auto-reconnect jika koneksi putus
// - Heartbeat setiap 30 detik untuk keep-alive
// - Delta update (hanya kirim jika ada perubahan)
// - Rate limiting (max 1 update per detik)
// ============================================

import { query } from '$lib/db.js';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    // Interval check untuk perubahan data (ms)
    CHECK_INTERVAL: 2000,  // 2 detik
    
    // Heartbeat interval untuk keep-alive (ms)
    HEARTBEAT_INTERVAL: 30000,  // 30 detik
    
    // Max connection time (ms) - auto close setelah ini
    MAX_CONNECTION_TIME: 5 * 60 * 1000,  // 5 menit
    
    // Jumlah recent logs yang dikirim
    RECENT_LOGS_LIMIT: 10
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Ambil email stats dari database
 */
async function getEmailStats() {
    try {
        // Coba gunakan view jika ada
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
        console.error('[SSE] Error getting recent logs:', error.message);
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
        console.error('[SSE] Error getting template stats:', error.message);
        return [];
    }
}

/**
 * Format SSE message
 */
function formatSSE(event, data) {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Generate hash dari data untuk deteksi perubahan
 */
function hashData(data) {
    return JSON.stringify(data);
}

// ============================================
// SSE ENDPOINT
// ============================================

export async function GET({ request }) {
    // Check for SSE support via Accept header
    const accept = request.headers.get('accept');
    
    // Variables untuk tracking state
    let lastStatsHash = '';
    let lastLogsHash = '';
    let lastTemplateHash = '';
    let isActive = true;
    let checkInterval;
    let heartbeatInterval;
    let connectionTimeout;
    
    // Create readable stream
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            
            /**
             * Send data to client
             */
            const send = (event, data) => {
                try {
                    controller.enqueue(encoder.encode(formatSSE(event, data)));
                } catch (e) {
                    // Connection closed
                    isActive = false;
                }
            };
            
            /**
             * Send initial data
             */
            const sendInitialData = async () => {
                try {
                    const stats = await getEmailStats();
                    const logs = await getRecentLogs();
                    const templates = await getTemplateStats();
                    
                    // Store hashes
                    lastStatsHash = hashData(stats);
                    lastLogsHash = hashData(logs);
                    lastTemplateHash = hashData(templates);
                    
                    // Send connected event
                    send('connected', {
                        message: 'Connected to email stats stream',
                        timestamp: new Date().toISOString(),
                        config: {
                            checkInterval: CONFIG.CHECK_INTERVAL,
                            heartbeatInterval: CONFIG.HEARTBEAT_INTERVAL
                        }
                    });
                    
                    // Send initial data
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
            
            /**
             * Check for updates and send delta
             */
            const checkUpdates = async () => {
                if (!isActive) return;
                
                try {
                    // Check stats
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
                    
                    // Check logs
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
                    
                    // Check templates (less frequently - every 5 checks)
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
            
            /**
             * Send heartbeat for keep-alive
             */
            const sendHeartbeat = () => {
                if (!isActive) return;
                send('heartbeat', {
                    timestamp: new Date().toISOString(),
                    uptime: Date.now()
                });
            };
            
            /**
             * Cleanup function
             */
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
            
            // Set max connection timeout
            connectionTimeout = setTimeout(() => {
                send('timeout', {
                    message: 'Connection timeout, please reconnect',
                    timestamp: new Date().toISOString()
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
    
    // Return SSE response
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',  // Disable nginx buffering
            'Access-Control-Allow-Origin': '*'
        }
    });
}