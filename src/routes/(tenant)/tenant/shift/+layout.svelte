<!--
    ============================================
    MONITORING SHIFT - LAYOUT (FIXED v3)
    ============================================
    Layout untuk semua halaman monitoring shift
    Dengan navigasi tab untuk Overview, Riwayat, Performa, Rekap Kas
    
    FIXED v3: Menggunakan $page.url.pathname langsung untuk reaktivitas real-time
    
    CATATAN: Layout ini TIDAK menggunakan +layout.server.js
    Semua data diambil dari masing-masing +page.server.js
    ============================================
-->
<script>
    import { page } from '$app/stores';
    import { 
        LayoutDashboard, 
        History, 
        Trophy, 
        Wallet,
        ArrowLeft,
        Clock
    } from 'lucide-svelte';
    
    export let data;
    
    // Navigation items with tab ID
    const navItems = [
        { 
            href: '/tenant/shift', 
            label: 'Overview', 
            icon: LayoutDashboard,
            tabId: 'overview'
        },
        { 
            href: '/tenant/shift/riwayat', 
            label: 'Riwayat', 
            icon: History,
            tabId: 'riwayat'
        },
        { 
            href: '/tenant/shift/performa', 
            label: 'Performa Kasir', 
            icon: Trophy,
            tabId: 'performa'
        },
        { 
            href: '/tenant/shift/rekap-kas', 
            label: 'Rekap Kas', 
            icon: Wallet,
            tabId: 'rekap-kas'
        }
    ];
    
    // ✅ FIXED: Function to determine active tab - menggunakan path parameter
    function getActiveTab(path) {
        // Normalize path - remove trailing slash
        const normalizedPath = path?.replace(/\/$/, '') || '/tenant/shift';
        
        // Check specific paths first (more specific = higher priority)
        if (normalizedPath.startsWith('/tenant/shift/performa')) return 'performa';
        if (normalizedPath.startsWith('/tenant/shift/rekap-kas')) return 'rekap-kas';
        if (normalizedPath.startsWith('/tenant/shift/riwayat')) return 'riwayat';
        // Check for shift detail page (numeric ID)
        if (normalizedPath.match(/^\/tenant\/shift\/\d+$/)) return 'riwayat';
        // Default to overview only for exact match
        if (normalizedPath === '/tenant/shift') return 'overview';
        // Fallback
        return 'overview';
    }
    
    // ✅ FIXED: Gunakan $page.url.pathname langsung di reactive statement
    // Ini akan otomatis update setiap kali URL berubah
    $: activeTab = getActiveTab($page.url.pathname);
    
    // Check if nav item is active - menggunakan activeTab yang sudah reactive
    function isActive(item, currentActiveTab) {
        return currentActiveTab === item.tabId;
    }
    
    // Safe access to todayStats - bisa dari layout atau dari page
    $: todayStats = data?.todayStats || null;
</script>

<div class="min-h-screen bg-slate-50">
    <!-- Header -->
    <div class="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4">
            <!-- Title Bar -->
            <div class="flex items-center justify-between py-4">
                <div class="flex items-center gap-3">
                    <a 
                        href="/tenant/dashboard" 
                        class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Kembali ke Dashboard"
                    >
                        <ArrowLeft class="w-5 h-5" />
                    </a>
                    <div>
                        <h1 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Clock class="w-5 h-5 text-emerald-600" />
                            Monitoring Shift
                        </h1>
                        <p class="text-sm text-slate-500">Kelola dan pantau shift kasir</p>
                    </div>
                </div>
                
                <!-- Quick Stats (optional) - dari data page -->
                {#if todayStats?.total_shift !== undefined}
                    <div class="hidden md:flex items-center gap-4 text-sm">
                        <div class="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                            {todayStats.total_shift || 0} shift hari ini
                        </div>
                    </div>
                {/if}
            </div>
            
            <!-- Navigation Tabs -->
            <nav class="flex gap-1 -mb-px overflow-x-auto" aria-label="Navigasi Monitoring Shift">
                {#each navItems as item (item.tabId)}
                    <a 
                        href={item.href}
                        class="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                            {isActive(item, activeTab) 
                                ? 'border-emerald-500 text-emerald-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
                        aria-current={isActive(item, activeTab) ? 'page' : undefined}
                    >
                        <svelte:component this={item.icon} class="w-4 h-4" />
                        {item.label}
                    </a>
                {/each}
            </nav>
        </div>
    </div>
    
    <!-- Content -->
    <div class="max-w-7xl mx-auto">
        <slot />
    </div>
</div>