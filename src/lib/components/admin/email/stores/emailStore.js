// ============================================
// EMAIL STORE - State Management untuk Email Settings
// File: src/lib/components/admin/email/stores/emailStore.js
// 
// Manages:
// - SSE connection state
// - Email statistics (real-time)
// - Recent email logs
// - Template statistics
// - Connection status & errors
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
    maxReconnectAttempts: 5,
    baseReconnectDelay: 3000,  // 3 seconds
    maxReconnectDelay: 30000,  // 30 seconds
};

// ============================================
// INITIAL STATES
// ============================================

const initialConnectionState = {
    status: 'disconnected', // 'disconnected' | 'connecting' | 'connected' | 'error'
    lastUpdate: null,
    error: null,
    reconnectAttempts: 0,
    uptime: null
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
    
    // ============================================
    // SSE CONNECTION METHODS
    // ============================================
    
    /**
     * Connect to SSE endpoint
     */
    function connect() {
        if (!browser) return;
        
        // Close existing connection
        disconnect();
        
        // Update state to connecting
        update(state => ({
            ...state,
            connection: {
                ...state.connection,
                status: 'connecting',
                error: null
            }
        }));
        
        try {
            eventSource = new EventSource(SSE_CONFIG.endpoint);
            
            // ---- Event: Connected ----
            eventSource.addEventListener('connected', (e) => {
                const data = JSON.parse(e.data);
                console.log('[EmailStore] Connected:', data.message);
                
                update(state => ({
                    ...state,
                    connection: {
                        status: 'connected',
                        lastUpdate: new Date(),
                        error: null,
                        reconnectAttempts: 0,
                        uptime: data.timestamp
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
                
                // Clear update indicator after animation
                if (data.updated) {
                    setTimeout(() => {
                        update(state => ({
                            ...state,
                            updateIndicators: {
                                ...state.updateIndicators,
                                stats: false
                            }
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
                
                // Clear update indicator
                if (data.updated) {
                    setTimeout(() => {
                        update(state => ({
                            ...state,
                            updateIndicators: {
                                ...state.updateIndicators,
                                logs: false
                            }
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
                            updateIndicators: {
                                ...state.updateIndicators,
                                templates: false
                            }
                        }));
                    }, 1000);
                }
            });
            
            // ---- Event: Heartbeat ----
            eventSource.addEventListener('heartbeat', () => {
                // Keep-alive, just update timestamp
                update(state => ({
                    ...state,
                    connection: {
                        ...state.connection,
                        lastUpdate: new Date()
                    }
                }));
            });
            
            // ---- Event: Timeout ----
            eventSource.addEventListener('timeout', () => {
                console.log('[EmailStore] Connection timeout, reconnecting...');
                reconnect();
            });
            
            // ---- Event: Error from server ----
            eventSource.addEventListener('error', (e) => {
                if (e.data) {
                    const data = JSON.parse(e.data);
                    console.error('[EmailStore] Server error:', data.message);
                    update(state => ({
                        ...state,
                        connection: {
                            ...state.connection,
                            error: data.message
                        }
                    }));
                }
            });
            
            // ---- Connection Error ----
            eventSource.onerror = () => {
                console.error('[EmailStore] Connection error');
                update(state => ({
                    ...state,
                    connection: {
                        ...state.connection,
                        status: 'error'
                    }
                }));
                reconnect();
            };
            
        } catch (error) {
            console.error('[EmailStore] Failed to connect:', error);
            update(state => ({
                ...state,
                connection: {
                    ...state.connection,
                    status: 'error',
                    error: error.message
                }
            }));
            reconnect();
        }
    }
    
    /**
     * Disconnect from SSE
     */
    function disconnect() {
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
     * Reconnect with exponential backoff
     */
    function reconnect() {
        const currentState = get({ subscribe });
        const attempts = currentState.connection.reconnectAttempts;
        
        if (attempts >= SSE_CONFIG.maxReconnectAttempts) {
            update(state => ({
                ...state,
                connection: {
                    ...state.connection,
                    status: 'error',
                    error: 'Gagal terhubung setelah beberapa percobaan. Klik untuk coba lagi.'
                }
            }));
            return;
        }
        
        // Exponential backoff with max limit
        const delay = Math.min(
            SSE_CONFIG.baseReconnectDelay * Math.pow(2, attempts),
            SSE_CONFIG.maxReconnectDelay
        );
        
        console.log(`[EmailStore] Reconnecting in ${delay/1000}s (attempt ${attempts + 1}/${SSE_CONFIG.maxReconnectAttempts})`);
        
        update(state => ({
            ...state,
            connection: {
                ...state.connection,
                status: 'disconnected',
                reconnectAttempts: attempts + 1
            }
        }));
        
        reconnectTimeout = setTimeout(() => {
            connect();
        }, delay);
    }
    
    /**
     * Manual reconnect (resets attempt counter)
     */
    function manualReconnect() {
        update(state => ({
            ...state,
            connection: {
                ...initialConnectionState,
                status: 'connecting'
            }
        }));
        connect();
    }
    
    // ============================================
    // DATA METHODS
    // ============================================
    
    /**
     * Initialize with server data
     */
    function initializeData(serverData) {
        update(state => ({
            ...state,
            stats: serverData.emailStats || state.stats,
            logs: serverData.recentLogs || state.logs,
            templates: serverData.templates || state.templates
        }));
    }
    
    /**
     * Update stats manually (after form submission)
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
     * Reset store to initial state
     */
    function reset() {
        disconnect();
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

/**
 * Connection status only
 */
export const connectionStatus = derived(
    emailStore,
    $store => $store.connection
);

/**
 * Email statistics only
 */
export const emailStats = derived(
    emailStore,
    $store => $store.stats
);

/**
 * Recent logs only
 */
export const recentLogs = derived(
    emailStore,
    $store => $store.logs
);

/**
 * Template stats only
 */
export const templateStats = derived(
    emailStore,
    $store => $store.templates
);

/**
 * Update indicators only
 */
export const updateIndicators = derived(
    emailStore,
    $store => $store.updateIndicators
);

/**
 * Is connected
 */
export const isConnected = derived(
    emailStore,
    $store => $store.connection.status === 'connected'
);

/**
 * Is connecting
 */
export const isConnecting = derived(
    emailStore,
    $store => $store.connection.status === 'connecting'
);

/**
 * Has error
 */
export const hasConnectionError = derived(
    emailStore,
    $store => $store.connection.status === 'error' || $store.connection.error !== null
);

// ============================================
// EXPORT DEFAULT
// ============================================

export default emailStore;