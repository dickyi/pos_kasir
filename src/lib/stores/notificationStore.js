/**
 * ============================================
 * NOTIFICATION STORE (Fixed - With Deduplication)
 * File: src/lib/stores/notificationStore.js
 * ============================================
 * FIXED: Mencegah duplicate notifikasi di frontend
 * ============================================
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

const CONFIG = {
    SSE_URL: '/api/notifications/stream',
    API_URL: '/api/notifications',
    FALLBACK_POLLING_INTERVAL: 10000,
    RECONNECT_DELAY: 3000,
    MAX_RECONNECT_ATTEMPTS: 5,
    ENABLE_SOUND: true,
    ENABLE_BROWSER_NOTIFICATION: true
};

function createNotificationStore() {
    const { subscribe, set, update } = writable({
        notifications: [],
        unreadCount: 0,
        total: 0,
        loading: true,
        error: null,
        connectionStatus: 'disconnected',
        lastUpdate: null
    });

    let eventSource = null;
    let reconnectAttempts = 0;
    let reconnectTimeout = null;
    let fallbackInterval = null;

    // ========================================
    // HELPER: Deduplicate notifications by ID
    // ========================================
    function deduplicateNotifications(notifications) {
        const seen = new Set();
        return notifications.filter(notif => {
            if (seen.has(notif.id)) {
                return false;
            }
            seen.add(notif.id);
            return true;
        });
    }

    // ========================================
    // SOUND
    // ========================================
    function playSound() {
        if (!browser || !CONFIG.ENABLE_SOUND) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch (e) { /* silent */ }
    }

    // ========================================
    // BROWSER NOTIFICATION
    // ========================================
    async function showBrowserNotification(notif) {
        if (!browser || !CONFIG.ENABLE_BROWSER_NOTIFICATION) return;
        try {
            if (Notification.permission === 'granted') {
                new Notification(notif.title, {
                    body: notif.message,
                    icon: '/favicon.png',
                    tag: `notif-${notif.id}`
                });
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    showBrowserNotification(notif);
                }
            }
        } catch (e) { /* silent */ }
    }

    // ========================================
    // SSE CONNECTION
    // ========================================
    function connect() {
        if (!browser) return;
        
        disconnect();
        
        console.log('🔔 Connecting to SSE...');
        update(s => ({ ...s, connectionStatus: 'connecting', error: null }));

        try {
            if (typeof EventSource === 'undefined') {
                console.log('❌ EventSource not supported, using polling');
                startFallbackPolling();
                return;
            }

            eventSource = new EventSource(CONFIG.SSE_URL);

            eventSource.onopen = () => {
                console.log('✅ SSE Connected');
                reconnectAttempts = 0;
                update(s => ({ ...s, connectionStatus: 'connected', error: null }));
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleMessage(data);
                } catch (e) {
                    console.error('SSE parse error:', e);
                }
            };

            eventSource.onerror = (e) => {
                console.error('❌ SSE Error', e);
                
                if (eventSource) {
                    eventSource.close();
                    eventSource = null;
                }
                
                update(s => ({ ...s, connectionStatus: 'error' }));
                scheduleReconnect();
            };

        } catch (error) {
            console.error('SSE setup error:', error);
            update(s => ({ ...s, connectionStatus: 'error', error: error.message }));
            startFallbackPolling();
        }
    }

    function disconnect() {
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
        if (fallbackInterval) {
            clearInterval(fallbackInterval);
            fallbackInterval = null;
        }
    }

    function scheduleReconnect() {
        if (reconnectAttempts >= CONFIG.MAX_RECONNECT_ATTEMPTS) {
            console.log('⚠️ Max reconnect attempts, falling back to polling');
            startFallbackPolling();
            return;
        }

        reconnectAttempts++;
        const delay = CONFIG.RECONNECT_DELAY * reconnectAttempts;
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);

        reconnectTimeout = setTimeout(connect, delay);
    }

    // ========================================
    // MESSAGE HANDLER (FIXED!)
    // ========================================
    function handleMessage(data) {
        console.log('📨 SSE Message:', data.type);

        switch (data.type) {
            case 'connected':
                console.log('SSE:', data.message);
                break;

            case 'error':
                console.error('SSE Error:', data.message);
                update(s => ({ ...s, error: data.message, loading: false }));
                break;

            case 'initial':
                // FIXED: Deduplicate pada initial load
                const initialNotifs = deduplicateNotifications(data.notifications || []);
                update(s => ({
                    ...s,
                    notifications: initialNotifs,
                    unreadCount: data.unread || 0,
                    total: initialNotifs.length,
                    loading: false,
                    lastUpdate: new Date()
                }));
                break;

            case 'new':
                if (data.notifications?.length > 0) {
                    update(s => {
                        // FIXED: Cek apakah notifikasi sudah ada berdasarkan ID
                        const existingIds = new Set(s.notifications.map(n => n.id));
                        const trulyNewNotifs = data.notifications.filter(n => !existingIds.has(n.id));
                        
                        if (trulyNewNotifs.length === 0) {
                            console.log('⏭️ All notifications already exist, skipping');
                            return s;
                        }
                        
                        // Play sound dan browser notification hanya untuk yang benar-benar baru
                        trulyNewNotifs.forEach(n => {
                            playSound();
                            showBrowserNotification(n);
                        });

                        // Gabungkan dan deduplicate
                        const combined = [...trulyNewNotifs, ...s.notifications];
                        const deduplicated = deduplicateNotifications(combined);

                        return {
                            ...s,
                            notifications: deduplicated,
                            unreadCount: data.unread ?? (s.unreadCount + trulyNewNotifs.length),
                            total: deduplicated.length,
                            lastUpdate: new Date()
                        };
                    });
                }
                break;
        }
    }

    // ========================================
    // FALLBACK POLLING
    // ========================================
    function startFallbackPolling() {
        if (fallbackInterval) return;
        
        console.log('📡 Starting fallback polling...');
        update(s => ({ ...s, connectionStatus: 'polling' }));

        fetchNotifications();
        fallbackInterval = setInterval(fetchNotifications, CONFIG.FALLBACK_POLLING_INTERVAL);
    }

    async function fetchNotifications() {
        if (!browser) return;

        try {
            const response = await fetch(`${CONFIG.API_URL}?limit=20`);
            const data = await response.json();

            if (data.success) {
                update(s => {
                    // FIXED: Deduplicate dari server response
                    const serverNotifs = deduplicateNotifications(data.notifications || []);
                    
                    // Check for truly new notifications (untuk sound)
                    const currentIds = new Set(s.notifications.map(n => n.id));
                    const newOnes = serverNotifs.filter(n => !currentIds.has(n.id) && !n.is_read);

                    if (newOnes.length > 0 && s.notifications.length > 0) {
                        newOnes.forEach(n => {
                            playSound();
                            showBrowserNotification(n);
                        });
                    }

                    return {
                        ...s,
                        notifications: serverNotifs,
                        unreadCount: data.unread || 0,
                        total: data.total || 0,
                        loading: false,
                        lastUpdate: new Date()
                    };
                });
            } else {
                update(s => ({ 
                    ...s, 
                    loading: false, 
                    error: data.error || data.message 
                }));
            }
        } catch (error) {
            console.error('Polling error:', error);
            update(s => ({ ...s, loading: false, error: error.message }));
        }
    }

    // ========================================
    // ACTIONS
    // ========================================
    async function markAsRead(id) {
        if (!browser) return;
        try {
            const res = await fetch(CONFIG.API_URL, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                update(s => ({
                    ...s,
                    notifications: s.notifications.map(n =>
                        n.id === id ? { ...n, is_read: 1 } : n
                    ),
                    unreadCount: Math.max(0, s.unreadCount - 1)
                }));
            }
        } catch (e) { console.error(e); }
    }

    async function markAllAsRead() {
        if (!browser) return;
        try {
            const res = await fetch(CONFIG.API_URL, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ all: true })
            });
            if (res.ok) {
                update(s => ({
                    ...s,
                    notifications: s.notifications.map(n => ({ ...n, is_read: 1 })),
                    unreadCount: 0
                }));
            }
        } catch (e) { console.error(e); }
    }

    async function deleteNotification(id) {
        if (!browser) return;
        try {
            const res = await fetch(CONFIG.API_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                update(s => {
                    const notif = s.notifications.find(n => n.id === id);
                    return {
                        ...s,
                        notifications: s.notifications.filter(n => n.id !== id),
                        unreadCount: notif && !notif.is_read ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
                        total: Math.max(0, s.total - 1)
                    };
                });
            }
        } catch (e) { console.error(e); }
    }

    async function deleteAllRead() {
        if (!browser) return;
        try {
            const res = await fetch(CONFIG.API_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read_only: true })
            });
            if (res.ok) {
                update(s => ({
                    ...s,
                    notifications: s.notifications.filter(n => !n.is_read),
                    total: s.unreadCount
                }));
            }
        } catch (e) { console.error(e); }
    }

    function refresh() {
        fetchNotifications();
    }

    function reset() {
        disconnect();
        set({
            notifications: [],
            unreadCount: 0,
            total: 0,
            loading: true,
            error: null,
            connectionStatus: 'disconnected',
            lastUpdate: null
        });
    }

    return {
        subscribe,
        connect,
        disconnect,
        markAsRead,
        markAllAsRead,
        delete: deleteNotification,
        deleteAllRead,
        refresh,
        reset,
        enableSound: (v) => { CONFIG.ENABLE_SOUND = v; },
        enableBrowserNotification: (v) => { CONFIG.ENABLE_BROWSER_NOTIFICATION = v; }
    };
}

export const notificationStore = createNotificationStore();

export const unreadCount = derived(notificationStore, $s => $s.unreadCount);
export const recentNotifications = derived(notificationStore, $s => $s.notifications.slice(0, 5));
export const connectionStatus = derived(notificationStore, $s => $s.connectionStatus);
export const isConnected = derived(notificationStore, $s => 
    $s.connectionStatus === 'connected' || $s.connectionStatus === 'polling'
);