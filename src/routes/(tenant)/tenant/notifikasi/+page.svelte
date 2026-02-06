<!--
    Halaman Notifikasi (Synced with Store)
    File: src/routes/(tenant)/tenant/notifikasi/+page.svelte
    ============================================
    FIXED: Unique key untuk mencegah duplicate key error
-->
<script>
    import { onMount } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import {
        Bell, ShoppingCart, AlertTriangle, CheckCircle, XCircle,
        QrCode, Building2, Banknote, Sparkles, Info, Trash2,
        Check, CheckCheck, Search, RefreshCw, Loader2,
        ChevronRight, Calendar, Radio, Wifi, WifiOff
    } from 'lucide-svelte';
    
    // Import store - ini kuncinya!
    import { 
        notificationStore, 
        connectionStatus,
        isConnected 
    } from '$lib/stores/notificationStore.js';

    export let data;
    $: user = data?.user;

    // Use store data directly - akan otomatis sync dengan dropdown!
    $: notifications = $notificationStore.notifications;
    $: unreadCount = $notificationStore.unreadCount;
    $: total = $notificationStore.total;
    $: loading = $notificationStore.loading;
    $: status = $connectionStatus;
    $: connected = $isConnected;

    // Local filter state
    let filterType = '';
    let filterRead = '';
    let searchQuery = '';
    let actionLoading = false;

    /**
     * Generate unique key untuk notification
     * Kombinasi id dan index untuk mencegah duplicate key
     */
    function getNotifKey(notif, index) {
        if (notif.id) {
            return `notif-${notif.id}-${index}`;
        }
        return `notif-idx-${index}`;
    }

    // Connect to SSE on mount (if not already connected)
    onMount(() => {
        if ($connectionStatus === 'disconnected') {
            notificationStore.connect();
        }
    });

    // Filter notifications
    $: filteredNotifications = notifications.filter(n => {
        const matchType = !filterType || n.type === filterType;
        const matchRead = filterRead === '' || 
                         (filterRead === 'unread' && !n.is_read) ||
                         (filterRead === 'read' && n.is_read);
        const matchSearch = !searchQuery || 
                           n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           n.message.toLowerCase().includes(searchQuery.toLowerCase());
        return matchType && matchRead && matchSearch;
    });

    // Stats from store
    $: statsTotal = notifications.length;
    $: statsUnread = unreadCount;
    $: statsRead = notifications.filter(n => n.is_read).length;
    $: statsStock = notifications.filter(n => n.type === 'stock').length;

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

    function getTypeColor(type) {
        const colors = {
            order: 'bg-blue-100 text-blue-600',
            stock: 'bg-amber-100 text-amber-600',
            transaction: 'bg-emerald-100 text-emerald-600',
            payment: 'bg-purple-100 text-purple-600',
            system: 'bg-red-100 text-red-600',
            info: 'bg-slate-100 text-slate-600'
        };
        return colors[type] || colors.info;
    }

    function getTypeLabel(type) {
        const labels = {
            order: 'Pesanan',
            stock: 'Stok',
            transaction: 'Transaksi',
            payment: 'Pembayaran',
            system: 'Sistem',
            info: 'Info'
        };
        return labels[type] || 'Lainnya';
    }

    function timeAgo(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 5) return 'Baru saja';
        if (diff < 60) return `${diff} detik lalu`;
        if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function getStatusInfo(status) {
        switch (status) {
            case 'connected':
                return { icon: Radio, text: 'Real-time', color: 'text-emerald-500', bg: 'bg-emerald-50' };
            case 'connecting':
                return { icon: Loader2, text: 'Connecting...', color: 'text-amber-500', bg: 'bg-amber-50', spin: true };
            case 'polling':
                return { icon: Wifi, text: 'Polling', color: 'text-blue-500', bg: 'bg-blue-50' };
            default:
                return { icon: WifiOff, text: 'Offline', color: 'text-red-500', bg: 'bg-red-50' };
        }
    }

    $: statusInfo = getStatusInfo(status);

    // Actions - menggunakan store methods (akan sync otomatis!)
    async function handleMarkAsRead(id) {
        await notificationStore.markAsRead(id);
    }

    async function handleMarkAllAsRead() {
        actionLoading = true;
        await notificationStore.markAllAsRead();
        actionLoading = false;
    }

    async function handleDelete(id) {
        await notificationStore.delete(id);
    }

    async function handleDeleteAllRead() {
        actionLoading = true;
        await notificationStore.deleteAllRead();
        actionLoading = false;
    }

    function handleRefresh() {
        notificationStore.refresh();
    }

    function handleNotificationClick(notif) {
        if (!notif.is_read) {
            handleMarkAsRead(notif.id);
        }
        if (notif.link) {
            goto(notif.link);
        }
    }
</script>

<svelte:head>
    <title>Notifikasi - {user?.nama_bisnis || 'POSKasir'}</title>
</svelte:head>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <div class="flex items-center gap-3">
                <h1 class="text-xl font-semibold text-slate-800">Notifikasi</h1>
                <!-- Connection Status Badge -->
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                            {statusInfo.bg} {statusInfo.color}">
                    <svelte:component 
                        this={statusInfo.icon} 
                        class="w-3.5 h-3.5 {statusInfo.spin ? 'animate-spin' : ''}" 
                    />
                    {statusInfo.text}
                </span>
            </div>
            <p class="text-slate-500 text-sm mt-1">
                {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
            </p>
        </div>
        <div class="flex gap-2">
            {#if unreadCount > 0}
                <button
                    on:click={handleMarkAllAsRead}
                    disabled={actionLoading}
                    class="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg
                           text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors
                           disabled:opacity-50"
                >
                    <CheckCheck class="w-4 h-4" />
                    <span class="hidden sm:inline">Tandai Semua Dibaca</span>
                </button>
            {/if}
            <button
                on:click={handleRefresh}
                disabled={loading}
                class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg
                       text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
                <RefreshCw class="w-4 h-4 {loading ? 'animate-spin' : ''}" />
                <span class="hidden sm:inline">Refresh</span>
            </button>
        </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Bell class="w-5 h-5 text-slate-600" />
                </div>
                <div>
                    <p class="text-2xl font-semibold text-slate-800">{statsTotal}</p>
                    <p class="text-sm text-slate-500">Total</p>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <Bell class="w-5 h-5 text-red-600" />
                </div>
                <div>
                    <p class="text-2xl font-semibold text-slate-800">{statsUnread}</p>
                    <p class="text-sm text-slate-500">Belum Dibaca</p>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Check class="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <p class="text-2xl font-semibold text-slate-800">{statsRead}</p>
                    <p class="text-sm text-slate-500">Sudah Dibaca</p>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                    <AlertTriangle class="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <p class="text-2xl font-semibold text-slate-800">{statsStock}</p>
                    <p class="text-sm text-slate-500">Peringatan Stok</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="flex flex-col sm:flex-row gap-3">
            <!-- Search -->
            <div class="relative flex-1">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Cari notifikasi..."
                    class="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm
                           focus:outline-none focus:border-emerald-500 transition-colors"
                />
            </div>

            <!-- Type Filter -->
            <select
                bind:value={filterType}
                class="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm
                       focus:outline-none focus:border-emerald-500"
            >
                <option value="">Semua Tipe</option>
                <option value="order">Pesanan</option>
                <option value="stock">Stok</option>
                <option value="transaction">Transaksi</option>
                <option value="payment">Pembayaran</option>
                <option value="info">Info</option>
            </select>

            <!-- Read Filter -->
            <select
                bind:value={filterRead}
                class="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm
                       focus:outline-none focus:border-emerald-500"
            >
                <option value="">Semua Status</option>
                <option value="unread">Belum Dibaca</option>
                <option value="read">Sudah Dibaca</option>
            </select>
        </div>
    </div>

    <!-- Notification List -->
    {#if loading && notifications.length === 0}
        <div class="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Loader2 class="w-8 h-8 animate-spin mx-auto text-emerald-500" />
            <p class="text-slate-500 mt-3">Memuat notifikasi...</p>
        </div>
    {:else if filteredNotifications.length > 0}
        <div class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            <!-- FIXED: Gunakan getNotifKey() untuk unique key -->
            {#each filteredNotifications as notif, index (getNotifKey(notif, index))}
                <div
                    transition:fly={{ x: -20, duration: 200 }}
                    class="group p-4 hover:bg-slate-50 transition-colors cursor-pointer
                           {!notif.is_read ? 'bg-emerald-50/30 border-l-2 border-l-emerald-500' : ''}"
                    on:click={() => handleNotificationClick(notif)}
                    on:keypress={(e) => e.key === 'Enter' && handleNotificationClick(notif)}
                    role="button"
                    tabindex="0"
                >
                    <div class="flex items-start gap-4">
                        <!-- Icon -->
                        <div class="relative flex-shrink-0">
                            <div class="p-2.5 rounded-xl {getTypeColor(notif.type)}">
                                <svelte:component this={getIcon(notif.icon)} class="w-5 h-5" />
                            </div>
                            {#if !notif.is_read}
                                <span class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full 
                                             border-2 border-white"></span>
                            {/if}
                        </div>

                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between gap-2">
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <h3 class="font-semibold text-slate-800 {!notif.is_read ? 'font-bold' : ''}">
                                            {notif.title}
                                        </h3>
                                    </div>
                                    <p class="text-sm text-slate-600 line-clamp-2">{notif.message}</p>
                                </div>

                                <!-- Type Badge -->
                                <span class="text-[10px] font-medium px-2 py-1 rounded-full whitespace-nowrap
                                            {getTypeColor(notif.type)}">
                                    {getTypeLabel(notif.type)}
                                </span>
                            </div>

                            <!-- Meta -->
                            <div class="flex items-center justify-between mt-3">
                                <div class="flex items-center gap-2 text-xs text-slate-400">
                                    <Calendar class="w-3.5 h-3.5" />
                                    <span>{timeAgo(notif.created_at)}</span>
                                </div>

                                <!-- Actions -->
                                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {#if !notif.is_read}
                                        <button
                                            on:click|stopPropagation={() => handleMarkAsRead(notif.id)}
                                            class="p-1.5 rounded-lg hover:bg-emerald-100 text-slate-400 hover:text-emerald-600
                                                   transition-colors"
                                            title="Tandai dibaca"
                                        >
                                            <Check class="w-4 h-4" />
                                        </button>
                                    {/if}
                                    <button
                                        on:click|stopPropagation={() => handleDelete(notif.id)}
                                        class="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600
                                               transition-colors"
                                        title="Hapus"
                                    >
                                        <Trash2 class="w-4 h-4" />
                                    </button>
                                    {#if notif.link}
                                        <ChevronRight class="w-4 h-4 text-slate-400" />
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Delete All Read Button -->
        {#if notifications.some(n => n.is_read)}
            <div class="text-center">
                <button
                    on:click={handleDeleteAllRead}
                    disabled={actionLoading}
                    class="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 
                           hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                    {#if actionLoading}
                        <Loader2 class="w-4 h-4 animate-spin" />
                    {:else}
                        <Trash2 class="w-4 h-4" />
                    {/if}
                    <span>Hapus Notifikasi yang Sudah Dibaca</span>
                </button>
            </div>
        {/if}
    {:else}
        <!-- Empty State -->
        <div class="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell class="w-8 h-8 text-slate-400" />
            </div>
            <h3 class="text-lg font-medium text-slate-800 mb-2">
                {searchQuery || filterType || filterRead ? 'Tidak Ditemukan' : 'Belum Ada Notifikasi'}
            </h3>
            <p class="text-slate-500 text-sm">
                {#if searchQuery || filterType || filterRead}
                    Tidak ada notifikasi yang sesuai dengan filter
                {:else}
                    Notifikasi baru akan muncul di sini secara real-time
                {/if}
            </p>
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