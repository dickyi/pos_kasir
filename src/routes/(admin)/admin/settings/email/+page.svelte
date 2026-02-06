<!-- ============================================
EMAIL SETTINGS PAGE (FIXED - NO DOUBLE NOTIFICATION)
File: src/routes/(admin)/admin/settings/email/+page.svelte

FIXED: SMTP Test tidak lagi trigger 2x notifikasi
============================================ -->

<script>
    import { onMount, onDestroy } from 'svelte';
    import { Mail } from 'lucide-svelte';
    
    // Import components from email module
    import {
        // Stores
        emailStore,
        isConnected,
        
        // Components
        ConnectionStatus,
        NotificationToast,
        EmailStatsCards,
        EmailRecentLogs,
        SmtpConfigForm,
        SmtpTestSection,
        SmtpInfoCards,
        SmtpResetButton,
        TemplateList,
        NotificationSettings,
        TabNavigation
    } from '$lib/components/admin/email';
    
    // Server data
    export let data;
    export let form;
    
    // ============================================
    // STATE
    // ============================================
    
    let activeTab = 'smtp';
    let notification = null;
    let notificationTimer = null;
    
    // ✅ FIXED: Track jika notifikasi sudah ditampilkan
    let lastNotificationKey = null;
    
    // ============================================
    // LIFECYCLE
    // ============================================
    
    onMount(() => {
        // Initialize store with server data
        emailStore.initializeData({
            emailStats: data.emailStats,
            recentLogs: data.recentLogs,
            templates: data.templates
        });
        
        // Connect to SSE
        emailStore.connect();
    });
    
    onDestroy(() => {
        // Cleanup SSE connection
        emailStore.disconnect();
        
        // Clear notification timer
        if (notificationTimer) {
            clearTimeout(notificationTimer);
        }
    });
    
    // ============================================
    // NOTIFICATION HANDLING (FIXED - NO DUPLICATES)
    // ============================================
    
    /**
     * Show notification toast
     * ✅ FIXED: Prevent duplicate notifications dengan key tracking
     */
    function showNotification(message, type = 'success', duration = 4000) {
        // ✅ Create unique key untuk prevent duplicates
        const notifKey = `${type}-${message}-${Date.now()}`;
        
        // ✅ Check jika notifikasi sama baru saja ditampilkan (dalam 500ms)
        if (lastNotificationKey && lastNotificationKey.startsWith(`${type}-${message}`)) {
            const lastTime = parseInt(lastNotificationKey.split('-').pop());
            if (Date.now() - lastTime < 500) {
                console.log('[Toast] Duplicate notification prevented:', message);
                return; // Skip duplicate
            }
        }
        
        // Save last notification key
        lastNotificationKey = notifKey;
        
        // Clear existing timer if any
        if (notificationTimer) {
            clearTimeout(notificationTimer);
        }
        
        // Set new notification
        notification = { message, type };
        
        // Auto-dismiss after duration
        if (duration > 0) {
            notificationTimer = setTimeout(() => {
                notification = null;
                notificationTimer = null;
            }, duration);
        }
    }
    
    /**
     * Dismiss notification manually
     */
    function dismissNotification() {
        if (notificationTimer) {
            clearTimeout(notificationTimer);
            notificationTimer = null;
        }
        notification = null;
        lastNotificationKey = null;
    }
    
    // ============================================
    // FORM HANDLING
    // ============================================
    
    // Handle form responses
    $: if (form?.success === true) {
        showNotification(form.message || 'Berhasil!', 'success');
        if (form.tab) activeTab = form.tab;
    }
    
    $: if (form?.success === false) {
        showNotification(form.message || 'Terjadi kesalahan', 'error');
        if (form.tab) activeTab = form.tab;
    }
    
    // Handle tab change
    function handleTabChange(event) {
        activeTab = event.detail;
    }
    
    // Handle component results
    function handleResult(event) {
        const result = event.detail;
        
        // ✅ Log untuk debugging
        console.log('[Page] handleResult called:', result);
        
        // Direct success/error handling
        if (result?.success !== undefined) {
            showNotification(
                result.message || (result.success ? 'Berhasil!' : 'Terjadi kesalahan'),
                result.success ? 'success' : 'error'
            );
            return;
        }
        
        // Handle JSON data results
        if (result?.data) {
            try {
                const parsed = JSON.parse(result.data);
                if (Array.isArray(parsed)) {
                    const first = parsed[0];
                    if (first?.success !== undefined) {
                        showNotification(
                            first.message || (first.success ? 'Berhasil!' : 'Terjadi kesalahan'),
                            first.success ? 'success' : 'error'
                        );
                    }
                }
            } catch (e) {
                console.error('[Page] Failed to parse result:', e);
            }
        }
    }
    
    // Handle SMTP preset apply
    function handlePresetApply(event) {
        const { provider } = event.detail;
        showNotification(
            `Preset ${provider} akan diterapkan. Silakan simpan untuk menyimpan perubahan.`, 
            'info',
            5000
        );
    }
    
    // ✅ FIXED: Handle SMTP test result - single handler only
    function handleSmtpTestResult(event) {
        const result = event.detail;
        
        // ✅ Log untuk debugging
        console.log('[Page] handleSmtpTestResult called:', result);
        
        // ✅ Handle berbagai format response
        let success = false;
        let message = '';
        
        // Format 1: Direct { success, message }
        if (result?.success !== undefined) {
            success = result.success;
            message = result.message || '';
        }
        // Format 2: { data: JSON string }
        else if (result?.data) {
            try {
                const parsed = JSON.parse(result.data);
                if (Array.isArray(parsed) && parsed[0]) {
                    success = parsed[0].success;
                    message = parsed[0].message || '';
                } else if (parsed.success !== undefined) {
                    success = parsed.success;
                    message = parsed.message || '';
                }
            } catch (e) {
                console.error('[Page] Failed to parse SMTP test result:', e);
                success = false;
                message = 'Gagal memproses response';
            }
        }
        // Format 3: type === 'success' | 'failure'
        else if (result?.type) {
            success = result.type === 'success';
            message = result.message || '';
        }
        
        // Show notification
        showNotification(
            message || (success ? 'Test email berhasil dikirim!' : 'Test email gagal dikirim'),
            success ? 'success' : 'error',
            success ? 4000 : 6000
        );
    }
</script>

<svelte:head>
    <title>Pengaturan Email - Admin</title>
</svelte:head>

<!-- ============================================
MAIN CONTAINER
============================================ -->
<div class="p-4 sm:p-6 max-w-[1400px] mx-auto">
    
    <!-- ============================================
    HEADER
    ============================================ -->
    <header class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <!-- Title -->
            <div>
                <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div class="p-2 bg-violet-100 rounded-xl">
                        <Mail class="w-6 h-6 text-violet-600" />
                    </div>
                    Pengaturan Email
                </h1>
                <p class="mt-1 text-gray-500 text-sm">
                    Konfigurasi SMTP, template email, dan notifikasi
                </p>
            </div>
            
            <!-- Connection Status -->
            <ConnectionStatus showLastUpdate={true} showReconnectButton={true} />
        </div>
    </header>
    
    <!-- ============================================
    NOTIFICATION TOAST
    ============================================ -->
    {#if notification}
        <NotificationToast 
            message={notification.message}
            type={notification.type}
            duration={4000}
            dismissible={true}
            position="top-right"
            on:dismiss={dismissNotification}
        />
    {/if}
    
    <!-- ============================================
    STATS CARDS
    ============================================ -->
    <div class="mb-6">
        <EmailStatsCards />
    </div>
    
    <!-- ============================================
    TAB NAVIGATION
    ============================================ -->
    <TabNavigation bind:activeTab on:change={handleTabChange} />
    
    <!-- ============================================
    TAB CONTENT
    ============================================ -->
    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm">
        
        <!-- ==================== SMTP TAB ==================== -->
        {#if activeTab === 'smtp'}
            <div class="p-6">
                <SmtpConfigForm 
                    settings={data.smtpSettings} 
                    status={data.smtpStatus}
                    on:result={handleResult}
                />
                
                <div class="mt-4">
                    <SmtpResetButton on:result={handleResult} />
                </div>
                
                <div class="mt-8 pt-6 border-t border-gray-200">
                    <!-- ✅ FIXED: Only use on:result, not on:success/on:error -->
                    <SmtpTestSection 
                        disabled={!data.smtpStatus?.configured}
                        on:result={handleSmtpTestResult}
                    />
                </div>
                
                <div class="mt-6">
                    <SmtpInfoCards 
                        providers={['gmail', 'zoho']}
                        on:apply={handlePresetApply}
                    />
                </div>
                
                <!-- Recent Logs Section -->
                {#if data.recentLogs && data.recentLogs.length > 0}
                    <div class="mt-8 pt-6 border-t border-gray-200">
                        <EmailRecentLogs 
                            title="Log Email Terbaru"
                            showRealTimeIndicator={true}
                            maxRows={10}
                        />
                    </div>
                {/if}
            </div>
        {/if}
        
        <!-- ==================== TEMPLATE TAB ==================== -->
        {#if activeTab === 'template'}
            <div class="p-6">
                <TemplateList 
                    templates={data.templates}
                    on:toggle={handleResult}
                    on:update={handleResult}
                />
            </div>
        {/if}
        
        <!-- ==================== NOTIFICATION TAB ==================== -->
        {#if activeTab === 'notification'}
            <div class="p-6">
                <NotificationSettings 
                    settings={data.notifSettings}
                    smtpConfigured={data.smtpStatus?.configured}
                    on:result={handleResult}
                />
            </div>
        {/if}
    </div>
</div>

<!-- ============================================
STYLES
============================================ -->
<style>
    /* Smooth transitions */
    :global(.transition-all) {
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
    }
    
    /* Animation for notification */
    :global(.animate-slide-in) {
        animation: slide-in 0.3s ease-out;
    }
    
    @keyframes slide-in {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    
    ::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
    }
    
    ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
    }
</style>