// ============================================
// EMAIL STORE - State Management untuk Email Settings
// File: src/lib/components/admin/email/stores/emailStore.js
// 
// ✅ UPDATED: Hybrid SSE + Polling
// 
// Strategi:
// 1. Pertama, coba koneksi SSE (real-time)
// 2. Jika SSE gagal/timeout (seperti di Vercel), 
//    otomatis fallback ke polling
// 3. Polling interval: 5 detik (near real-time)
// 4. Saat polling aktif, tetap coba SSE secara berkala
//    (setiap 2 menit) untuk kasus Vercel cold start
//
// Pattern: Svelte Writable Store dengan custom methods
// ============================================

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

// ============================================
// CONFIGURATION
// ============================================

const SSE_CONFIG = {
    endpoint: '/api/email/stats/stream',
    maxReconnectAttempts: 3,       // ✅ Dikurangi dari 5 → 3 (lebih cepat fallback)
    baseReconnectDelay: 2000,      // 2 seconds
    maxReconnectDelay: 10000,      // 10 seconds
};

const POLL_CONFIG = {
    endpoint: '/api/email/stats/poll',
    interval: 5000,                // ✅ Poll setiap 5 detik
    retryInterval: 10000,          // Retry setiap 10 detik jika gagal
    sseRetryInterval: 120000,      // ✅ Coba SSE lagi setiap 2 menit
    maxConsecutiveErrors: 5,       // Max error berturut-turut sebelum stop
};

// ============================================
// INITIAL STATES
// ============================================

const initialConnectionState = {
    status: 'disconnected',    // 'disconnected' | 'connecting' | 'connected' | 'error'
    mode: 'none',              // ✅ NEW: 'sse' | 'polling' | 'none'
    lastUpdate: null,
    error: null,
    reconnectAttempts: 0,
    uptime: null,
    pollErrors: 0              // ✅ NEW: Track consecutive poll errors
};

const initialEmailStats = {
    total_sent: 0,
    total_failed: 0,
    today_sent: 0,
    queue_pending: 0
};

const initialState = {
    connection: { ...initialConnectionState },
    stats: { ...initialEmailStats },
    logs: [],
    templates: [],
    updateIndicators: {
        stats: false,
        logs: false,
        templates: false
    }
};

// ============================================
// CREATE STORES
// ============================================

function createEmailStore() {
    const { subscribe, set, update } = writable({ ...initialState });
    
    // Internal references
    let eventSource = null;
    let reconnectTimeout = null;
    let pollInterval = null;
    let sseRetryTimeout = null;
    let isDestroyed = false;
    
    // ✅ Track data hashes untuk delta detection di polling
    let lastStatsHash = '';
    let lastLogsHash = '';
    let lastTemplateHash = '';
    
    // ============================================
    // UTILITY: Simple hash untuk perbandingan data
    // ============================================
    
    function simpleHash(data) {
        return JSON.stringify(data);
    }
    
    // ============================================
    // SSE CONNECTION METHODS
    // ============================================
    
    /**
     * Connect - entry point utama
     * Coba SSE dulu, fallback ke polling jika gagal
     */
    function connect() {
        if (!browser || isDestroyed) return;
        
        // Cleanup existing connections
        disconnectAll();
        
        // Update state
        update(state => ({
            ...state,
            connection: {
                ...state.connection,
                status: 'connecting',
                mode: 'sse',
                error: null
            }
        }));
        
        // Coba SSE dulu
        connectSSE();
    }
    
    /**
     * Connect via SSE
     */
    function connectSSE() {
        if (!browser || isDestroyed) return;
        
        // Close existing SSE
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
        
        try {
            console.log('[EmailStore] Trying SSE connection...');
            eventSource = new EventSource(SSE_CONFIG.endpoint);
            
            // Track jika sudah pernah connected (untuk deteksi timeout vs error)
            let hasConnected = false;
            let sseTimeout = null;
            
            // ✅ Timeout: jika tidak connected dalam 10 detik, fallback ke polling
            sseTimeout = setTimeout(() => {
                if (!hasConnected && eventSource) {
                    console.log('[EmailStore] SSE connection timeout, falling back to polling');
                    eventSource.close();
                    eventSource = null;
                    startPolling();
                }
            }, 10000);
            
            // ---- Event: Connected ----
            eventSource.addEventListener('connected', (e) => {
                hasConnected = true;
                if (sseTimeout) clearTimeout(sseTimeout);
                
                const data = JSON.parse(e.data);
                console.log('[EmailStore] SSE Connected:', data.message);
                
                update(state => ({
                    ...state,
                    connection: {
                        status: 'connected',
                        mode: 'sse',
                        lastUpdate: new Date(),
                        error: null,
                        reconnectAttempts: 0,
                        uptime: data.timestamp,
                        pollErrors: 0
                    }
                }));
            });
            
            // ---- Event: Stats Update ----
            eventSource.addEventListener('stats', (e) => {
                const data = JSON.parse(e.data);
                
                update(state => ({
                    ...state,
                    stats: {
                        total_sent: data.total_sent || 0,
                        total_failed: data.total_failed || 0,
                        today_sent: data.today_sent || 0,
                        queue_pending: data.queue_pending || 0
                    },
                    connection: {
                        ...state.connection,
                        lastUpdate: new Date()
                    },
                    updateIndicators: {
                        ...state.updateIndicators,
                        stats: data.updated || false
                    }
                }));
                
                if (data.updated) {
                    setTimeout(() => {
                        update(state => ({
                            ...state,
                            updateIndicators: { ...state.updateIndicators, stats: false }
                        }));
                    }, 1000);
                }
            });
            
            // ---- Event: Logs Update ----
            eventSource.addEventListener('logs', (e) => {
                const data = JSON.parse(e.data);
                
                update(state => ({
                    ...state,
                    logs: data.logs || [],
                    connection: {
                        ...state.connection,
                        lastUpdate: new Date()
                    },
                    updateIndicators: {
                        ...state.updateIndicators,
                        logs: data.updated || false
                    }
                }));
                
                if (data.updated) {
                    setTimeout(() => {
                        update(state => ({
                            ...state,
                            updateIndicators: { ...state.updateIndicators, logs: false }
                        }));
                    }, 1000);
                }
            });
            
            // ---- Event: Templates Update ----
            eventSource.addEventListener('templates', (e) => {
                const data = JSON.parse(e.data);
                
                update(state => ({
                    ...state,
                    templates: data.templates || [],
                    updateIndicators: {
                        ...state.updateIndicators,
                        templates: data.updated || false
                    }
                }));
                
                if (data.updated) {
                    setTimeout(() => {
                        update(state => ({
                            ...state,
                            updateIndicators: { ...state.updateIndicators, templates: false }
                        }));
                    }, 1000);
                }
            });
            
            // ---- Event: Heartbeat ----
            eventSource.addEventListener('heartbeat', () => {
                update(state => ({
                    ...state,
                    connection: {
                        ...state.connection,
                        lastUpdate: new Date()
                    }
                }));
            });
            
            // ---- Event: Timeout ----
            eventSource.addEventListener('timeout', (e) => {
                console.log('[EmailStore] SSE timeout event received');
                
                let shouldFallback = false;
                try {
                    const data = JSON.parse(e.data);
                    shouldFallback = data.shouldFallback || false;
                } catch (err) {
                    // ignore parse error
                }
                
                if (eventSource) {
                    eventSource.close();
                    eventSource = null;
                }
                
                if (shouldFallback) {
                    // ✅ Server menyarankan fallback ke polling (Vercel timeout)
                    console.log('[EmailStore] Server suggests fallback to polling');
                    startPolling();
                } else {
                    // Coba reconnect SSE
                    reconnectSSE();
                }
            });
            
            // ---- Event: Server Error ----
            eventSource.addEventListener('error', (e) => {
                if (e.data) {
                    try {
                        const data = JSON.parse(e.data);
                        console.error('[EmailStore] Server error:', data.message);
                        update(state => ({
                            ...state,
                            connection: {
                                ...state.connection,
                                error: data.message
                            }
                        }));
                    } catch (err) {
                        // ignore
                    }
                }
            });
            
            // ---- Connection Error (browser level) ----
            eventSource.onerror = () => {
                if (sseTimeout) clearTimeout(sseTimeout);
                
                if (!hasConnected) {
                    // Belum pernah connected → langsung fallback ke polling
                    console.log('[EmailStore] SSE failed to connect, falling back to polling');
                    if (eventSource) {
                        eventSource.close();
                        eventSource = null;
                    }
                    startPolling();
                } else {
                    // Pernah connected tapi putus → coba reconnect SSE
                    console.error('[EmailStore] SSE connection lost');
                    update(state => ({
                        ...state,
                        connection: {
                            ...state.connection,
                            status: 'error',
                            mode: 'sse'
                        }
                    }));
                    reconnectSSE();
                }
            };
            
        } catch (error) {
            console.error('[EmailStore] Failed to create SSE:', error);
            // Langsung fallback ke polling
            startPolling();
        }
    }
    
    /**
     * Reconnect SSE with exponential backoff
     * Jika sudah max attempts, fallback ke polling
     */
    function reconnectSSE() {
        if (isDestroyed) return;
        
        const currentState = get({ subscribe });
        const attempts = currentState.connection.reconnectAttempts;
        
        if (attempts >= SSE_CONFIG.maxReconnectAttempts) {
            // ✅ Max attempts reached → fallback ke polling
            console.log('[EmailStore] SSE max reconnect attempts, falling back to polling');
            startPolling();
            return;
        }
        
        const delay = Math.min(
            SSE_CONFIG.baseReconnectDelay * Math.pow(2, attempts),
            SSE_CONFIG.maxReconnectDelay
        );
        
        console.log(`[EmailStore] SSE reconnecting in ${delay/1000}s (attempt ${attempts + 1}/${SSE_CONFIG.maxReconnectAttempts})`);
        
        update(state => ({
            ...state,
            connection: {
                ...state.connection,
                status: 'connecting',
                reconnectAttempts: attempts + 1
            }
        }));
        
        reconnectTimeout = setTimeout(() => {
            connectSSE();
        }, delay);
    }
    
    // ============================================
    // POLLING METHODS
    // ============================================
    
    /**
     * Start polling mode
     * Digunakan sebagai fallback ketika SSE tidak tersedia
     */
    function startPolling() {
        if (isDestroyed) return;
        
        // Stop SSE jika masih jalan
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
        
        // Stop existing poll
        stopPolling();
        
        console.log('[EmailStore] Starting polling mode (interval: ' + POLL_CONFIG.interval/1000 + 's)');
        
        update(state => ({
            ...state,
            connection: {
                ...state.connection,
                status: 'connected',
                mode: 'polling',
                error: null,
                reconnectAttempts: 0,
                pollErrors: 0
            }
        }));
        
        // Fetch immediately
        fetchPollData();
        
        // Start interval
        pollInterval = setInterval(fetchPollData, POLL_CONFIG.interval);
        
        // ✅ Periodically try SSE again (mungkin Vercel cold start sudah selesai)
        sseRetryTimeout = setTimeout(() => {
            retrySseFromPolling();
        }, POLL_CONFIG.sseRetryInterval);
    }
    
    /**
     * Stop polling
     */
    function stopPolling() {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
        if (sseRetryTimeout) {
            clearTimeout(sseRetryTimeout);
            sseRetryTimeout = null;
        }
    }
    
    /**
     * Fetch data via polling endpoint
     */
    async function fetchPollData() {
        if (isDestroyed) return;
        
        try {
            const response = await fetch(POLL_CONFIG.endpoint, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Poll failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Poll returned error');
            }
            
            // ✅ Delta detection: hanya update jika data berubah
            let statsUpdated = false;
            let logsUpdated = false;
            let templatesUpdated = false;
            
            if (data.stats) {
                const statsHash = simpleHash(data.stats);
                if (statsHash !== lastStatsHash) {
                    lastStatsHash = statsHash;
                    statsUpdated = true;
                }
            }
            
            if (data.logs) {
                const logsHash = simpleHash(data.logs);
                if (logsHash !== lastLogsHash) {
                    lastLogsHash = logsHash;
                    logsUpdated = true;
                }
            }
            
            if (data.templates) {
                const templateHash = simpleHash(data.templates);
                if (templateHash !== lastTemplateHash) {
                    lastTemplateHash = templateHash;
                    templatesUpdated = true;
                }
            }
            
            // Update store
            update(state => ({
                ...state,
                stats: data.stats ? {
                    total_sent: data.stats.total_sent || 0,
                    total_failed: data.stats.total_failed || 0,
                    today_sent: data.stats.today_sent || 0,
                    queue_pending: data.stats.queue_pending || 0
                } : state.stats,
                logs: data.logs || state.logs,
                templates: data.templates || state.templates,
                connection: {
                    ...state.connection,
                    status: 'connected',
                    lastUpdate: new Date(),
                    error: null,
                    pollErrors: 0
                },
                updateIndicators: {
                    stats: statsUpdated,
                    logs: logsUpdated,
                    templates: templatesUpdated
                }
            }));
            
            // Clear update indicators after animation
            if (statsUpdated || logsUpdated || templatesUpdated) {
                setTimeout(() => {
                    update(state => ({
                        ...state,
                        updateIndicators: {
                            stats: false,
                            logs: false,
                            templates: false
                        }
                    }));
                }, 1000);
            }
            
        } catch (error) {
            console.error('[EmailStore] Poll error:', error.message);
            
            const currentState = get({ subscribe });
            const pollErrors = (currentState.connection.pollErrors || 0) + 1;
            
            update(state => ({
                ...state,
                connection: {
                    ...state.connection,
                    error: `Polling error: ${error.message}`,
                    pollErrors: pollErrors
                }
            }));
            
            // ✅ Jika terlalu banyak error, slow down polling
            if (pollErrors >= POLL_CONFIG.maxConsecutiveErrors) {
                console.warn('[EmailStore] Too many poll errors, slowing down...');
                stopPolling();
                
                // Retry dengan interval lebih lama
                pollInterval = setInterval(fetchPollData, POLL_CONFIG.retryInterval);
                
                update(state => ({
                    ...state,
                    connection: {
                        ...state.connection,
                        status: 'error',
                        error: 'Koneksi bermasalah. Mencoba ulang...'
                    }
                }));
            }
        }
    }
    
    /**
     * Periodically try SSE again while in polling mode
     * Berguna jika Vercel function sempat cold start
     */
    function retrySseFromPolling() {
        if (isDestroyed) return;
        
        const currentState = get({ subscribe });
        
        // Hanya retry jika sedang dalam mode polling
        if (currentState.connection.mode !== 'polling') return;
        
        console.log('[EmailStore] Retrying SSE from polling mode...');
        
        // Coba SSE tanpa menghentikan polling dulu
        // Polling akan dihentikan jika SSE berhasil connect
        try {
            const testSource = new EventSource(SSE_CONFIG.endpoint);
            let connected = false;
            
            const testTimeout = setTimeout(() => {
                if (!connected) {
                    testSource.close();
                    // SSE masih gagal, tetap di polling
                    // Schedule retry lagi
                    sseRetryTimeout = setTimeout(() => {
                        retrySseFromPolling();
                    }, POLL_CONFIG.sseRetryInterval);
                }
            }, 8000); // 8 detik timeout untuk test
            
            testSource.addEventListener('connected', () => {
                connected = true;
                clearTimeout(testTimeout);
                testSource.close();
                
                // ✅ SSE berhasil! Switch dari polling ke SSE
                console.log('[EmailStore] SSE available again, switching from polling');
                stopPolling();
                connectSSE();
            });
            
            testSource.onerror = () => {
                if (!connected) {
                    clearTimeout(testTimeout);
                    testSource.close();
                    
                    // Tetap di polling, retry lagi nanti
                    sseRetryTimeout = setTimeout(() => {
                        retrySseFromPolling();
                    }, POLL_CONFIG.sseRetryInterval);
                }
            };
            
        } catch (e) {
            // SSE tidak tersedia, tetap di polling
            sseRetryTimeout = setTimeout(() => {
                retrySseFromPolling();
            }, POLL_CONFIG.sseRetryInterval);
        }
    }
    
    // ============================================
    // DISCONNECT METHODS
    // ============================================
    
    /**
     * Disconnect SSE only
     */
    function disconnectSSE() {
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
    }
    
    /**
     * Disconnect everything (SSE + Polling)
     */
    function disconnectAll() {
        disconnectSSE();
        stopPolling();
    }
    
    /**
     * Public disconnect
     */
    function disconnect() {
        isDestroyed = true;
        disconnectAll();
        
        update(state => ({
            ...state,
            connection: {
                ...initialConnectionState,
                status: 'disconnected'
            }
        }));
    }
    
    /**
     * Manual reconnect (resets everything dan mulai dari awal)
     */
    function manualReconnect() {
        isDestroyed = false;
        disconnectAll();
        
        // Reset hashes
        lastStatsHash = '';
        lastLogsHash = '';
        lastTemplateHash = '';
        
        update(state => ({
            ...state,
            connection: {
                ...initialConnectionState,
                status: 'connecting'
            }
        }));
        
        // Mulai dari SSE, akan fallback ke polling jika gagal
        connect();
    }
    
    // ============================================
    // DATA METHODS
    // ============================================
    
    /**
     * Initialize with server data (dari load function)
     */
    function initializeData(serverData) {
        update(state => ({
            ...state,
            stats: serverData.emailStats || state.stats,
            logs: serverData.recentLogs || state.logs,
            templates: serverData.templates || state.templates
        }));
        
        // Set initial hashes
        if (serverData.emailStats) lastStatsHash = simpleHash(serverData.emailStats);
        if (serverData.recentLogs) lastLogsHash = simpleHash(serverData.recentLogs);
        if (serverData.templates) lastTemplateHash = simpleHash(serverData.templates);
    }
    
    /**
     * Update stats manually (setelah form submission)
     */
    function refreshStats(newStats) {
        update(state => ({
            ...state,
            stats: { ...state.stats, ...newStats }
        }));
    }
    
    /**
     * Add new log entry (optimistic update)
     */
    function addLogEntry(logEntry) {
        update(state => ({
            ...state,
            logs: [logEntry, ...state.logs].slice(0, 10)
        }));
    }
    
    /**
     * Force refresh - fetch data immediately regardless of mode
     */
    async function forceRefresh() {
        try {
            const response = await fetch(POLL_CONFIG.endpoint);
            const data = await response.json();
            
            if (data.success) {
                update(state => ({
                    ...state,
                    stats: data.stats ? {
                        total_sent: data.stats.total_sent || 0,
                        total_failed: data.stats.total_failed || 0,
                        today_sent: data.stats.today_sent || 0,
                        queue_pending: data.stats.queue_pending || 0
                    } : state.stats,
                    logs: data.logs || state.logs,
                    templates: data.templates || state.templates,
                    connection: {
                        ...state.connection,
                        lastUpdate: new Date()
                    }
                }));
            }
        } catch (error) {
            console.error('[EmailStore] Force refresh failed:', error);
        }
    }
    
    /**
     * Reset store to initial state
     */
    function reset() {
        disconnect();
        lastStatsHash = '';
        lastLogsHash = '';
        lastTemplateHash = '';
        set({ ...initialState });
    }
    
    // ============================================
    // RETURN STORE API
    // ============================================
    
    return {
        subscribe,
        // Connection methods
        connect,
        disconnect,
        reconnect: manualReconnect,
        // ✅ NEW methods
        forceRefresh,
        // Data methods
        initializeData,
        refreshStats,
        addLogEntry,
        reset
    };
}

// ============================================
// CREATE SINGLETON INSTANCE
// ============================================

export const emailStore = createEmailStore();

// ============================================
// DERIVED STORES
// ============================================

export const connectionStatus = derived(
    emailStore,
    $store => $store.connection
);

export const emailStats = derived(
    emailStore,
    $store => $store.stats
);

export const recentLogs = derived(
    emailStore,
    $store => $store.logs
);

export const templateStats = derived(
    emailStore,
    $store => $store.templates
);

export const updateIndicators = derived(
    emailStore,
    $store => $store.updateIndicators
);

export const isConnected = derived(
    emailStore,
    $store => $store.connection.status === 'connected'
);

export const isConnecting = derived(
    emailStore,
    $store => $store.connection.status === 'connecting'
);

export const hasConnectionError = derived(
    emailStore,
    $store => $store.connection.status === 'error' || $store.connection.error !== null
);

// ✅ NEW: Connection mode (sse/polling/none)
export const connectionMode = derived(
    emailStore,
    $store => $store.connection.mode
);

// ============================================
// EXPORT DEFAULT
// ============================================

export default emailStore;