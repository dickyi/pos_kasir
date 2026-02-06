<!--
    NotificationDropdown.svelte (SSE Real-time Version)
    ============================================
    Real-time notifications dengan Server-Sent Events
    FIXED: Unique key untuk mencegah duplicate key error
-->
<script>
    import { onMount, onDestroy } from 'svelte';
    import { scale, fly, fade } from 'svelte/transition';
    import { backOut } from 'svelte/easing';
    import { goto } from '$app/navigation';
    import { 
        Bell, ShoppingCart, AlertTriangle, CheckCircle, XCircle,
        QrCode, Building2, Banknote, Sparkles, Info, X,
        Check, Loader2, RefreshCw, Wifi, WifiOff, Radio
    } from 'lucide-svelte';
    import { 
        notificationStore, 
        unreadCount, 
        connectionStatus,
        isConnected 
    } from '$lib/stores/notificationStore.js';

    export let darkMode = false;

    let isOpen = false;
    let loading = false;
    let showNewBadge = false;
    let previousUnread = 0;

    // Subscribe to store
    $: notifications = $notificationStore.notifications;
    $: unread = $notificationStore.unreadCount;
    $: total = $notificationStore.total;
    $: storeLoading = $notificationStore.loading;
    $: status = $connectionStatus;
    $: connected = $isConnected;

    // Watch for new notifications - trigger animation
    $: if (unread > previousUnread && previousUnread !== 0) {
        showNewBadge = true;
        setTimeout(() => showNewBadge = false, 3000);
    }
    $: previousUnread = unread;

    /**
     * Generate unique key untuk notification
     * Kombinasi id dan index untuk mencegah duplicate key
     */
    function getNotifKey(notif, index) {
        // Gunakan id jika ada, fallback ke index
        if (notif.id) {
            return `notif-${notif.id}-${index}`;
        }
        return `notif-idx-${index}`;
    }

    onMount(() => {
        // Connect to SSE
        notificationStore.connect();
    });

    onDestroy(() => {
        notificationStore.disconnect();
    });

    function toggle() {
        isOpen = !isOpen;
        if (isOpen) {
            showNewBadge = false;
        }
    }

    function close() {
        isOpen = false;
    }

    // Icon mapping
    function getIcon(iconName) {
        const icons = {
            'ShoppingCart': ShoppingCart,
            'AlertTriangle': AlertTriangle,
            'CheckCircle': CheckCircle,
            'XCircle': XCircle,
            'QrCode': QrCode,
            'Building2': Building2,
            'Banknote': Banknote,
            'Sparkles': Sparkles,
            'Info': Info
        };
        return icons[iconName] || Bell;
    }

    // Color mapping
    function getTypeColor(type) {
        const colors = {
            order: darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600',
            stock: darkMode ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-600',
            transaction: darkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-600',
            payment: darkMode ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600',
            system: darkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600',
            info: darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600'
        };
        return colors[type] || colors.info;
    }

    // Time formatting
    function timeAgo(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 5) return 'Baru saja';
        if (diff < 60) return `${diff} detik lalu`;
        if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }

    // Connection status info
    function getStatusInfo(status) {
        switch (status) {
            case 'connected':
                return { icon: Radio, text: 'Real-time', color: 'text-emerald-500' };
            case 'connecting':
                return { icon: Loader2, text: 'Connecting...', color: 'text-amber-500', spin: true };
            case 'polling':
                return { icon: Wifi, text: 'Polling', color: 'text-blue-500' };
            case 'error':
                return { icon: WifiOff, text: 'Offline', color: 'text-red-500' };
            default:
                return { icon: WifiOff, text: 'Disconnected', color: 'text-slate-400' };
        }
    }

    $: statusInfo = getStatusInfo(status);

    // Handlers
    async function handleNotificationClick(notif) {
        if (!notif.is_read) {
            await notificationStore.markAsRead(notif.id);
        }
        if (notif.link) {
            close();
            goto(notif.link);
        }
    }

    async function handleMarkAllRead() {
        loading = true;
        await notificationStore.markAllAsRead();
        loading = false;
    }

    async function handleDelete(e, id) {
        e.stopPropagation();
        await notificationStore.delete(id);
    }

    function handleRefresh() {
        notificationStore.refresh();
    }

    // Close on click outside
    function handleClickOutside(event) {
        if (!event.target.closest('.notification-container')) {
            close();
        }
    }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="relative notification-container">
    <!-- Trigger Button -->
    <button 
        on:click|stopPropagation={toggle}
        class="relative p-2.5 rounded-xl transition-all duration-200
               {isOpen 
                   ? darkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-800'
                   : darkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}
               {showNewBadge ? 'animate-bounce' : ''}"
        aria-label="Notifikasi"
    >
        <Bell class="w-5 h-5" />
        
        <!-- Unread Badge -->
        {#if unread > 0}
            <span 
                class="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center
                       text-[10px] font-bold text-white bg-red-500 rounded-full px-1
                       ring-2 {darkMode ? 'ring-slate-800' : 'ring-white'}
                       {showNewBadge ? 'animate-pulse' : ''}"
            >
                {unread > 99 ? '99+' : unread}
            </span>
        {/if}
        
        <!-- Connection Status Indicator -->
        <span 
            class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2
                   {darkMode ? 'ring-slate-800' : 'ring-white'}
                   {status === 'connected' ? 'bg-emerald-400' : 
                    status === 'connecting' ? 'bg-amber-400 animate-pulse' :
                    status === 'polling' ? 'bg-blue-400' : 'bg-slate-400'}"
        ></span>
    </button>

    <!-- Dropdown -->
    {#if isOpen}
        <div 
            transition:scale={{ duration: 200, start: 0.95, easing: backOut }}
            class="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl overflow-hidden z-50
                   shadow-2xl {darkMode ? 'shadow-black/30' : 'shadow-slate-900/10'}
                   {darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}"
            on:click|stopPropagation
        >
            <!-- Header -->
            <div class="p-4 border-b {darkMode ? 'border-slate-700' : 'border-slate-100'}">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <h3 class="font-bold {darkMode ? 'text-white' : 'text-slate-800'}">
                            Notifikasi
                        </h3>
                        {#if unread > 0}
                            <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                {unread} baru
                            </span>
                        {/if}
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <!-- Connection Status -->
                        <div class="flex items-center gap-1 text-[10px] {statusInfo.color}">
                            <svelte:component 
                                this={statusInfo.icon} 
                                class="w-3 h-3 {statusInfo.spin ? 'animate-spin' : ''}" 
                            />
                            <span>{statusInfo.text}</span>
                        </div>
                        
                        <!-- Refresh Button -->
                        <button 
                            on:click={handleRefresh}
                            disabled={storeLoading}
                            class="p-1.5 rounded-lg transition-colors
                                   {darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}"
                            title="Refresh"
                        >
                            <RefreshCw class="w-4 h-4 {storeLoading ? 'animate-spin' : ''}" />
                        </button>
                    </div>
                </div>
                
                <!-- Mark All as Read -->
                {#if unread > 0}
                    <button 
                        on:click={handleMarkAllRead}
                        disabled={loading}
                        class="mt-2 w-full text-xs font-medium text-emerald-500 hover:text-emerald-600 
                               py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 
                               transition-colors flex items-center justify-center gap-1"
                    >
                        {#if loading}
                            <Loader2 class="w-3 h-3 animate-spin" />
                        {:else}
                            <Check class="w-3 h-3" />
                        {/if}
                        <span>Tandai semua sudah dibaca</span>
                    </button>
                {/if}
            </div>

            <!-- Notification List -->
            <div class="max-h-80 overflow-y-auto">
                {#if storeLoading && notifications.length === 0}
                    <div class="p-8 text-center">
                        <Loader2 class="w-6 h-6 animate-spin mx-auto {darkMode ? 'text-slate-500' : 'text-slate-400'}" />
                        <p class="text-sm {darkMode ? 'text-slate-500' : 'text-slate-400'} mt-2">
                            Memuat notifikasi...
                        </p>
                    </div>
                {:else if notifications.length === 0}
                    <div class="p-8 text-center">
                        <div class="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center
                                    {darkMode ? 'bg-slate-700' : 'bg-slate-100'}">
                            <Bell class="w-6 h-6 {darkMode ? 'text-slate-500' : 'text-slate-400'}" />
                        </div>
                        <p class="text-sm font-medium {darkMode ? 'text-slate-400' : 'text-slate-600'}">
                            Belum ada notifikasi
                        </p>
                        <p class="text-xs {darkMode ? 'text-slate-500' : 'text-slate-400'} mt-1">
                            {status === 'connected' 
                                ? 'Notifikasi akan muncul secara real-time'
                                : 'Menunggu koneksi...'}
                        </p>
                    </div>
                {:else}
                    <!-- FIXED: Gunakan getNotifKey() untuk unique key -->
                    {#each notifications as notif, index (getNotifKey(notif, index))}
                        <div 
                            in:fly={{ x: 20, duration: 200, delay: index * 20 }}
                            class="group relative p-4 border-b cursor-pointer transition-all duration-200
                                   {darkMode 
                                       ? 'border-slate-700/50 hover:bg-slate-700/50' 
                                       : 'border-slate-50 hover:bg-slate-50'}
                                   {!notif.is_read 
                                       ? darkMode ? 'bg-emerald-900/10 border-l-2 border-l-emerald-500' : 'bg-emerald-50/50 border-l-2 border-l-emerald-500' 
                                       : ''}"
                            on:click={() => handleNotificationClick(notif)}
                            on:keypress={(e) => e.key === 'Enter' && handleNotificationClick(notif)}
                            role="button"
                            tabindex="0"
                        >
                            <div class="flex gap-3">
                                <!-- Icon -->
                                <div class="relative flex-shrink-0">
                                    <div class="p-2 rounded-lg {getTypeColor(notif.type)}">
                                        <svelte:component this={getIcon(notif.icon)} class="w-4 h-4" />
                                    </div>
                                    {#if !notif.is_read}
                                        <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                                    {/if}
                                </div>

                                <!-- Content -->
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm {darkMode ? 'text-white' : 'text-slate-800'}
                                              {!notif.is_read ? 'font-semibold' : 'font-medium'}">
                                        {notif.title}
                                    </p>
                                    <p class="text-xs {darkMode ? 'text-slate-400' : 'text-slate-500'} line-clamp-2 mt-0.5">
                                        {notif.message}
                                    </p>
                                    <p class="text-[10px] {darkMode ? 'text-slate-500' : 'text-slate-400'} mt-1.5 flex items-center gap-1">
                                        <span class="w-1 h-1 rounded-full {!notif.is_read ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
                                        {timeAgo(notif.created_at)}
                                    </p>
                                </div>

                                <!-- Delete Button -->
                                <button 
                                    on:click={(e) => handleDelete(e, notif.id)}
                                    class="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all self-start
                                           {darkMode 
                                               ? 'hover:bg-slate-600 text-slate-500 hover:text-red-400' 
                                               : 'hover:bg-slate-200 text-slate-400 hover:text-red-500'}"
                                    title="Hapus"
                                >
                                    <X class="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>

            <!-- Footer -->
            {#if notifications.length > 0}
                <div class="p-3 {darkMode ? 'bg-slate-700/30' : 'bg-slate-50'}">
                    <a 
                        href="/tenant/notifikasi"
                        on:click={close}
                        class="block text-center text-sm font-medium text-emerald-500 hover:text-emerald-600
                               py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                    >
                        Lihat Semua Notifikasi ({total})
                    </a>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>