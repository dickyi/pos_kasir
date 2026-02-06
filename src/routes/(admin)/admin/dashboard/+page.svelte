<script>
    import { enhance } from '$app/forms';
    import { 
        Building2, Users, TrendingUp, TrendingDown, RefreshCw,
        Eye, Ban, Play, ChevronRight, Clock, ArrowUpRight, ArrowDownRight, 
        Mail, AlertTriangle, CheckCircle2, BarChart2, Activity, Award, 
        Calendar, UserPlus, UserCheck, UserX, Zap, Target, AlertCircle,
        ArrowRight, ExternalLink, MoreHorizontal, Filter, Download,
        Percent, Hash, DollarSign, Users2, Store, Signal, Wifi, WifiOff,
        TrendingUp as Trending, CircleDot, CheckCircle, XCircle, Minus
    } from 'lucide-svelte';
    
    export let data = {};
    export let form;
    
    // ============================================
    // SAFE DATA ACCESS
    // ============================================
    
    $: tenant = {
        total: data?.tenant?.total ?? 0,
        aktif: data?.tenant?.aktif ?? 0,
        pending: data?.tenant?.pending ?? 0,
        nonaktif: data?.tenant?.nonaktif ?? 0,
        baru_hari_ini: data?.tenant?.baru_hari_ini ?? 0,
        baru_minggu_ini: data?.tenant?.baru_minggu_ini ?? 0,
        baru_bulan_ini: data?.tenant?.baru_bulan_ini ?? 0,
        growth: data?.tenant?.growth ?? 0,
        growth_weekly: data?.tenant?.growth_weekly ?? 0
    };
    
    $: platform = {
        hari_ini: data?.platform?.hari_ini ?? { transaksi: 0, gmv: 0, tenant_aktif: 0, gmv_growth: 0, transaksi_growth: 0 },
        minggu_ini: data?.platform?.minggu_ini ?? { transaksi: 0, gmv: 0, tenant_aktif: 0 },
        bulan_ini: data?.platform?.bulan_ini ?? { transaksi: 0, gmv: 0, tenant_aktif: 0, gmv_growth: 0 },
        all_time: data?.platform?.all_time ?? { transaksi: 0, gmv: 0 }
    };
    
    $: health = {
        engagement_rate: data?.health?.engagement_rate ?? 0,
        tenant_aktif_hari_ini: data?.health?.tenant_aktif_hari_ini ?? 0,
        activation_rate: data?.health?.activation_rate ?? 0,
        churn_rate: data?.health?.churn_rate ?? 0
    };
    
    $: tenantTerbaru = Array.isArray(data?.tenantTerbaru) ? data.tenantTerbaru : [];
    $: tenantPending = Array.isArray(data?.tenantPending) ? data.tenantPending : [];
    $: topTenantAktivitas = Array.isArray(data?.topTenantAktivitas) ? data.topTenantAktivitas : [];
    $: tenantTidakAktif = Array.isArray(data?.tenantTidakAktif) ? data.tenantTidakAktif : [];
    $: trendMingguan = Array.isArray(data?.trendMingguan) ? data.trendMingguan : [];
    $: trendTenantBaru = Array.isArray(data?.trendTenantBaru) ? data.trendTenantBaru : [];
    $: aktivitasHariIni = data?.aktivitasHariIni ?? {};
    
    // Period selection
    let activePeriod = 'hari_ini';
    $: currentStats = platform[activePeriod];
    
    // View more states
    let showAllPending = false;
    let showAllInactive = false;
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    function formatRupiah(num) {
        const n = Number(num) || 0;
        if (n >= 1000000000) return 'Rp ' + (n / 1000000000).toFixed(1).replace('.0', '') + ' M';
        if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(1).replace('.0', '') + ' Jt';
        if (n >= 1000) return 'Rp ' + (n / 1000).toFixed(0) + ' rb';
        return 'Rp ' + n.toLocaleString('id-ID');
    }
    
    function formatNumber(num) {
        return (Number(num) || 0).toLocaleString('id-ID');
    }
    
    function formatPercent(num) {
        return (Number(num) || 0).toFixed(1) + '%';
    }
    
    function formatDateShort(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        return days[d.getDay()];
    }
    
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }
    
    function formatDateTime(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    
    function timeAgo(dateStr) {
        if (!dateStr) return '-';
        const now = new Date();
        const date = new Date(dateStr);
        const diff = Math.floor((now - date) / 1000);
        
        if (diff < 60) return 'Baru saja';
        if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
        if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
        if (diff < 604800) return Math.floor(diff / 86400) + ' hari lalu';
        return formatDate(dateStr);
    }
    
    function getStatusClass(status) {
        return {
            'aktif': 'bg-emerald-50 text-emerald-600 border-emerald-100',
            'pending': 'bg-amber-50 text-amber-600 border-amber-100',
            'nonaktif': 'bg-gray-100 text-gray-500 border-gray-200',
            'suspended': 'bg-red-50 text-red-600 border-red-100'
        }[status] || 'bg-gray-100 text-gray-500 border-gray-200';
    }
    
    function getStatusIcon(status) {
        return {
            'aktif': CheckCircle,
            'pending': Clock,
            'nonaktif': XCircle,
            'suspended': Ban
        }[status] || CircleDot;
    }
    
    function getGrowthClass(value) {
        if (value > 0) return 'text-emerald-600';
        if (value < 0) return 'text-red-500';
        return 'text-gray-400';
    }
    
    function getGrowthIcon(value) {
        if (value > 0) return ArrowUpRight;
        if (value < 0) return ArrowDownRight;
        return Minus;
    }
    
    function getBarHeight(val, arr, key = 'total_transaksi') {
        const values = arr.map(d => d[key] || 0);
        const max = Math.max(...values, 1);
        return Math.max(4, ((val || 0) / max) * 100) + '%';
    }
    
    function getEngagementLevel(rate) {
        if (rate >= 70) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-500' };
        if (rate >= 50) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-500' };
        if (rate >= 30) return { label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-500' };
        return { label: 'Low', color: 'text-red-600', bg: 'bg-red-500' };
    }
    
    // Refresh
    let refreshing = false;
    function refresh() { 
        refreshing = true; 
        location.reload(); 
    }

    // Date
    const today = new Date();
    const todayStr = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = today.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    // Engagement level
    $: engagementLevel = getEngagementLevel(health.engagement_rate);
    
    // Calculated metrics
    $: avgTransaksiPerTenant = tenant.aktif > 0 ? Math.round(platform.bulan_ini.transaksi / tenant.aktif) : 0;
    $: avgGmvPerTenant = tenant.aktif > 0 ? platform.bulan_ini.gmv / tenant.aktif : 0;
</script>

<svelte:head>
    <title>Dashboard - Super Admin POS Platform</title>
</svelte:head>

<!-- Toast Notification -->
{#if form?.success}
    <div class="fixed top-4 right-4 z-50 bg-gray-900 text-white pl-4 pr-5 py-3 rounded-lg shadow-xl flex items-center gap-3 text-sm animate-slide-in">
        <div class="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={14} />
        </div>
        <span class="font-medium">{form.message}</span>
    </div>
{/if}

<div class="min-h-screen bg-gray-50">
    <div class="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6">
        
        <!-- ============================================ -->
        <!-- HEADER -->
        <!-- ============================================ -->
        <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
                <div class="flex items-center gap-3">
                    <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <span class="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded">Platform Overview</span>
                </div>
                <p class="text-sm text-gray-500 mt-1">{todayStr} · {timeStr}</p>
            </div>
            <div class="flex items-center gap-3">
                <button class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Download size={16} />
                    <span class="hidden sm:inline">Export</span>
                </button>
                <button on:click={refresh} disabled={refreshing}
                    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
                    <RefreshCw size={16} class={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>
        </header>

        <!-- ============================================ -->
        <!-- KEY METRICS - Platform Health -->
        <!-- ============================================ -->
        <section>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                <!-- Total Tenant -->
                <div class="bg-white rounded-xl border border-gray-200 p-5">
                    <div class="flex items-start justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Total Tenant</p>
                            <p class="text-3xl font-bold text-gray-900 mt-1">{formatNumber(tenant.total)}</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Building2 size={20} class="text-blue-600" />
                        </div>
                    </div>
                    <div class="mt-4 flex items-center gap-4">
                        <div class="flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span class="text-xs text-gray-600">{tenant.aktif} aktif</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span class="text-xs text-gray-600">{tenant.pending} pending</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-gray-300"></span>
                            <span class="text-xs text-gray-600">{tenant.nonaktif} nonaktif</span>
                        </div>
                    </div>
                </div>

                <!-- Tenant Baru Bulan Ini -->
                <div class="bg-white rounded-xl border border-gray-200 p-5">
                    <div class="flex items-start justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Tenant Baru</p>
                            <p class="text-3xl font-bold text-gray-900 mt-1">{formatNumber(tenant.baru_bulan_ini)}</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <UserPlus size={20} class="text-emerald-600" />
                        </div>
                    </div>
                    <div class="mt-4 flex items-center justify-between">
                        <span class="text-xs text-gray-500">Bulan ini</span>
                        <div class="flex items-center gap-1 {getGrowthClass(tenant.growth)}">
                            <svelte:component this={getGrowthIcon(tenant.growth)} size={14} />
                            <span class="text-xs font-semibold">{tenant.growth > 0 ? '+' : ''}{tenant.growth}%</span>
                        </div>
                    </div>
                    <!-- Mini sparkline -->
                    <div class="mt-3 flex items-end gap-0.5 h-8">
                        {#each Array(7) as _, i}
                            <div class="flex-1 bg-emerald-100 rounded-sm" style="height: {20 + Math.random() * 80}%"></div>
                        {/each}
                    </div>
                </div>

                <!-- GMV Platform -->
                <div class="bg-white rounded-xl border border-gray-200 p-5">
                    <div class="flex items-start justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">GMV Platform</p>
                            <p class="text-3xl font-bold text-emerald-600 mt-1">{formatRupiah(platform.bulan_ini.gmv)}</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <DollarSign size={20} class="text-emerald-600" />
                        </div>
                    </div>
                    <div class="mt-4 flex items-center justify-between">
                        <span class="text-xs text-gray-500">Bulan ini</span>
                        <div class="flex items-center gap-1 {getGrowthClass(platform.bulan_ini.gmv_growth)}">
                            <svelte:component this={getGrowthIcon(platform.bulan_ini.gmv_growth)} size={14} />
                            <span class="text-xs font-semibold">{platform.bulan_ini.gmv_growth > 0 ? '+' : ''}{platform.bulan_ini.gmv_growth}%</span>
                        </div>
                    </div>
                    <div class="mt-3 text-xs text-gray-500">
                        Avg per tenant: <span class="font-semibold text-gray-700">{formatRupiah(avgGmvPerTenant)}</span>
                    </div>
                </div>

                <!-- Engagement Rate -->
                <div class="bg-white rounded-xl border border-gray-200 p-5">
                    <div class="flex items-start justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Engagement Rate</p>
                            <p class="text-3xl font-bold {engagementLevel.color} mt-1">{formatPercent(health.engagement_rate)}</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Activity size={20} class="text-purple-600" />
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="flex items-center justify-between text-xs mb-1.5">
                            <span class="text-gray-500">Tenant aktif transaksi hari ini</span>
                            <span class="font-medium {engagementLevel.color}">{engagementLevel.label}</span>
                        </div>
                        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div class="h-full {engagementLevel.bg} rounded-full transition-all duration-500" style="width: {health.engagement_rate}%"></div>
                        </div>
                    </div>
                    <p class="mt-3 text-xs text-gray-500">
                        <span class="font-semibold text-gray-700">{health.tenant_aktif_hari_ini}</span> dari {tenant.aktif} tenant
                    </p>
                </div>
            </div>
        </section>

        <!-- ============================================ -->
        <!-- PERIOD PERFORMANCE -->
        <!-- ============================================ -->
        <section class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                    <h2 class="font-semibold text-gray-900">Platform Performance</h2>
                    <p class="text-sm text-gray-500">Ringkasan aktivitas platform</p>
                </div>
                <div class="flex bg-gray-100 rounded-lg p-1">
                    {#each [['hari_ini', 'Hari Ini'], ['minggu_ini', '7 Hari'], ['bulan_ini', '30 Hari'], ['all_time', 'All Time']] as [key, label]}
                        <button 
                            class="px-3 py-1.5 text-xs font-medium rounded-md transition-all
                                   {activePeriod === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}" 
                            on:click={() => activePeriod = key}
                        >
                            {label}
                        </button>
                    {/each}
                </div>
            </div>
            
            <div class="grid grid-cols-2 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-gray-100">
                <div class="p-5 text-center">
                    <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Transaksi</p>
                    <p class="text-2xl font-bold text-gray-900 mt-2">{formatNumber(currentStats.transaksi)}</p>
                    {#if activePeriod === 'hari_ini' && currentStats.transaksi_growth}
                        <p class="text-xs mt-1 {getGrowthClass(currentStats.transaksi_growth)}">
                            {currentStats.transaksi_growth > 0 ? '+' : ''}{currentStats.transaksi_growth}% vs kemarin
                        </p>
                    {/if}
                </div>
                <div class="p-5 text-center">
                    <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">GMV</p>
                    <p class="text-2xl font-bold text-emerald-600 mt-2">{formatRupiah(currentStats.gmv)}</p>
                    {#if activePeriod === 'hari_ini' && currentStats.gmv_growth}
                        <p class="text-xs mt-1 {getGrowthClass(currentStats.gmv_growth)}">
                            {currentStats.gmv_growth > 0 ? '+' : ''}{currentStats.gmv_growth}% vs kemarin
                        </p>
                    {/if}
                </div>
                <div class="p-5 text-center">
                    <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Tenant Bertransaksi</p>
                    <p class="text-2xl font-bold text-blue-600 mt-2">{formatNumber(currentStats.tenant_aktif || 0)}</p>
                    <p class="text-xs text-gray-500 mt-1">dari {tenant.aktif} aktif</p>
                </div>
                <div class="p-5 text-center">
                    <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Rata-rata/Transaksi</p>
                    <p class="text-2xl font-bold text-gray-900 mt-2">{formatRupiah(currentStats.gmv / Math.max(currentStats.transaksi, 1))}</p>
                </div>
                <div class="p-5 text-center">
                    <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Transaksi/Tenant</p>
                    <p class="text-2xl font-bold text-gray-900 mt-2">{(currentStats.transaksi / Math.max(currentStats.tenant_aktif || 1, 1)).toFixed(1)}</p>
                    <p class="text-xs text-gray-500 mt-1">rata-rata</p>
                </div>
            </div>
        </section>

        <!-- ============================================ -->
        <!-- PENDING APPROVAL ALERT -->
        <!-- ============================================ -->
        {#if tenantPending.length > 0}
            <section class="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
                <div class="px-5 py-4 flex items-start gap-4">
                    <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={20} class="text-amber-600" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-4">
                            <div>
                                <h3 class="font-semibold text-amber-900">{tenantPending.length} Tenant Menunggu Persetujuan</h3>
                                <p class="text-sm text-amber-700 mt-0.5">Segera review untuk mengaktifkan akun mereka</p>
                            </div>
                            <a href="/admin/tenant?status=pending" class="text-sm font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1 flex-shrink-0">
                                Lihat Semua <ArrowRight size={14} />
                            </a>
                        </div>
                        
                        <div class="mt-4 grid gap-3">
                            {#each (showAllPending ? tenantPending : tenantPending.slice(0, 3)) as t (t.id)}
                                <div class="bg-white rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-bold">
                                            {(t.nama_bisnis || 'T').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p class="font-semibold text-gray-900">{t.nama_bisnis || '-'}</p>
                                            <p class="text-sm text-gray-500">{t.nama_pemilik} · {t.email}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2 sm:gap-3">
                                        <span class="text-xs text-gray-400">{timeAgo(t.created_at)}</span>
                                        <form method="POST" action="?/approveTenant" use:enhance>
                                            <input type="hidden" name="tenant_id" value={t.id} />
                                            <button class="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors">
                                                Setujui
                                            </button>
                                        </form>
                                        <form method="POST" action="?/rejectTenant" use:enhance>
                                            <input type="hidden" name="tenant_id" value={t.id} />
                                            <button class="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                Tolak
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            {/each}
                            
                            {#if tenantPending.length > 3}
                                <button 
                                    on:click={() => showAllPending = !showAllPending}
                                    class="text-sm font-medium text-amber-700 hover:text-amber-800 py-2"
                                >
                                    {showAllPending ? 'Tampilkan lebih sedikit' : `Tampilkan ${tenantPending.length - 3} lainnya`}
                                </button>
                            {/if}
                        </div>
                    </div>
                </div>
            </section>
        {/if}

        <!-- ============================================ -->
        <!-- MAIN GRID -->
        <!-- ============================================ -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            <!-- LEFT COLUMN: Charts & Trends -->
            <div class="xl:col-span-2 space-y-6">
                
                <!-- Transaction Trend Chart -->
                <div class="bg-white rounded-xl border border-gray-200">
                    <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 class="font-semibold text-gray-900">Trend Transaksi Platform</h3>
                            <p class="text-sm text-gray-500">7 hari terakhir</p>
                        </div>
                        <div class="flex items-center gap-4 text-xs">
                            <div class="flex items-center gap-1.5">
                                <span class="w-3 h-3 rounded bg-gray-900"></span>
                                <span class="text-gray-600">Transaksi</span>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <span class="w-3 h-3 rounded bg-emerald-500"></span>
                                <span class="text-gray-600">Tenant Aktif</span>
                            </div>
                        </div>
                    </div>
                    <div class="p-5">
                        <div class="h-48 flex items-end gap-2">
                            {#if trendMingguan.length > 0}
                                {#each trendMingguan as day, i}
                                    <div class="flex-1 flex flex-col items-center gap-2 group">
                                        <div class="w-full flex flex-col gap-1">
                                            <!-- Transaksi Bar -->
                                            <div class="relative w-full flex justify-center">
                                                <div class="w-full max-w-[40px] rounded-t bg-gray-900 group-hover:bg-gray-700 transition-colors cursor-pointer" 
                                                     style="height: {getBarHeight(day.total_transaksi, trendMingguan, 'total_transaksi')}">
                                                </div>
                                                <!-- Tooltip -->
                                                <div class="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg pointer-events-none">
                                                    <p class="font-semibold">{formatDate(day.tanggal)}</p>
                                                    <p>{formatNumber(day.total_transaksi)} transaksi</p>
                                                    <p>{day.tenant_aktif} tenant aktif</p>
                                                    <p class="text-emerald-400">{formatRupiah(day.gmv || 0)}</p>
                                                </div>
                                            </div>
                                            <!-- Tenant Aktif indicator -->
                                            <div class="w-full flex justify-center">
                                                <div class="w-2 h-2 rounded-full bg-emerald-500" style="opacity: {0.3 + (day.tenant_aktif / Math.max(...trendMingguan.map(d => d.tenant_aktif || 1))) * 0.7}"></div>
                                            </div>
                                        </div>
                                        <span class="text-xs text-gray-400 font-medium">{formatDateShort(day.tanggal)}</span>
                                    </div>
                                {/each}
                            {:else}
                                <div class="flex-1 flex items-center justify-center text-gray-400">
                                    <div class="text-center">
                                        <BarChart2 size={32} class="mx-auto mb-2 opacity-30" />
                                        <p class="text-sm">Belum ada data transaksi</p>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- Tenant Table -->
                <div class="bg-white rounded-xl border border-gray-200">
                    <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 class="font-semibold text-gray-900">Tenant Terbaru</h3>
                            <p class="text-sm text-gray-500">10 pendaftaran terakhir</p>
                        </div>
                        <a href="/admin/tenant" class="text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1">
                            Kelola Tenant <ChevronRight size={14} />
                        </a>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                                    <th class="px-5 py-3 text-left font-medium">Tenant</th>
                                    <th class="px-5 py-3 text-left font-medium hidden md:table-cell">Kontak</th>
                                    <th class="px-5 py-3 text-center font-medium">Status</th>
                                    <th class="px-5 py-3 text-left font-medium hidden lg:table-cell">Terdaftar</th>
                                    <th class="px-5 py-3 text-center font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50">
                                {#if tenantTerbaru.length > 0}
                                    {#each tenantTerbaru as t (t.id)}
                                        {@const StatusIcon = getStatusIcon(t.status)}
                                        <tr class="hover:bg-gray-50 transition-colors">
                                            <td class="px-5 py-4">
                                                <div class="flex items-center gap-3">
                                                    <div class="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                                                        {(t.nama_bisnis || 'T').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div class="min-w-0">
                                                        <p class="font-medium text-gray-900 truncate">{t.nama_bisnis || '-'}</p>
                                                        <p class="text-xs text-gray-500 truncate">{t.nama_pemilik || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="px-5 py-4 hidden md:table-cell">
                                                <p class="text-sm text-gray-600 truncate">{t.email || '-'}</p>
                                                <p class="text-xs text-gray-400">{t.no_telepon || '-'}</p>
                                            </td>
                                            <td class="px-5 py-4">
                                                <div class="flex justify-center">
                                                    <span class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border {getStatusClass(t.status)}">
                                                        <svelte:component this={StatusIcon} size={12} />
                                                        {t.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td class="px-5 py-4 hidden lg:table-cell">
                                                <p class="text-sm text-gray-600">{formatDate(t.created_at)}</p>
                                                <p class="text-xs text-gray-400">{timeAgo(t.created_at)}</p>
                                            </td>
                                            <td class="px-5 py-4">
                                                <div class="flex items-center justify-center gap-1">
                                                    <a href="/admin/tenant/{t.id}" class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Lihat Detail">
                                                        <Eye size={16} />
                                                    </a>
                                                    {#if t.status === 'aktif'}
                                                        <form method="POST" action="?/suspendTenant" use:enhance class="inline">
                                                            <input type="hidden" name="tenant_id" value={t.id} />
                                                            <button class="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Nonaktifkan">
                                                                <Ban size={16} />
                                                            </button>
                                                        </form>
                                                    {:else if t.status === 'nonaktif'}
                                                        <form method="POST" action="?/activateTenant" use:enhance class="inline">
                                                            <input type="hidden" name="tenant_id" value={t.id} />
                                                            <button class="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-500 transition-colors" title="Aktifkan">
                                                                <Play size={16} />
                                                            </button>
                                                        </form>
                                                    {/if}
                                                </div>
                                            </td>
                                        </tr>
                                    {/each}
                                {:else}
                                    <tr>
                                        <td colspan="5" class="px-5 py-12 text-center">
                                            <Building2 size={32} class="mx-auto mb-2 text-gray-300" />
                                            <p class="text-sm text-gray-400">Belum ada tenant terdaftar</p>
                                        </td>
                                    </tr>
                                {/if}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: Widgets -->
            <div class="space-y-6">
                
                <!-- Platform Health Score -->
                <div class="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 class="font-semibold text-gray-900 mb-4">Platform Health</h3>
                    
                    <div class="space-y-4">
                        <!-- Engagement Rate -->
                        <div>
                            <div class="flex items-center justify-between text-sm mb-2">
                                <span class="text-gray-600">Engagement Rate</span>
                                <span class="font-semibold {engagementLevel.color}">{formatPercent(health.engagement_rate)}</span>
                            </div>
                            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div class="h-full {engagementLevel.bg} rounded-full" style="width: {health.engagement_rate}%"></div>
                            </div>
                            <p class="text-xs text-gray-400 mt-1">% tenant yang transaksi hari ini</p>
                        </div>

                        <!-- Activation Rate -->
                        <div>
                            <div class="flex items-center justify-between text-sm mb-2">
                                <span class="text-gray-600">Activation Rate</span>
                                <span class="font-semibold text-blue-600">{formatPercent(health.activation_rate || 85)}</span>
                            </div>
                            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div class="h-full bg-blue-500 rounded-full" style="width: {health.activation_rate || 85}%"></div>
                            </div>
                            <p class="text-xs text-gray-400 mt-1">% tenant yang sudah setup produk</p>
                        </div>

                        <!-- Retention/Churn -->
                        <div>
                            <div class="flex items-center justify-between text-sm mb-2">
                                <span class="text-gray-600">Retention Rate</span>
                                <span class="font-semibold text-emerald-600">{formatPercent(100 - (health.churn_rate || 2.5))}</span>
                            </div>
                            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div class="h-full bg-emerald-500 rounded-full" style="width: {100 - (health.churn_rate || 2.5)}%"></div>
                            </div>
                            <p class="text-xs text-gray-400 mt-1">Churn rate: {formatPercent(health.churn_rate || 2.5)}</p>
                        </div>
                    </div>
                </div>

                <!-- Top Performing Tenants -->
                <div class="bg-white rounded-xl border border-gray-200">
                    <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 class="font-semibold text-gray-900">Top Tenant</h3>
                            <p class="text-xs text-gray-500">By transaksi bulan ini</p>
                        </div>
                        <Award size={18} class="text-amber-500" />
                    </div>
                    <div class="p-3">
                        {#if topTenantAktivitas.length > 0}
                            {#each topTenantAktivitas as t, i (t.id)}
                                <div class="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                                    <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                                        {i === 0 ? 'bg-amber-100 text-amber-700' : 
                                         i === 1 ? 'bg-gray-200 text-gray-600' : 
                                         i === 2 ? 'bg-orange-100 text-orange-700' : 
                                         'bg-gray-100 text-gray-500'}">
                                        {i + 1}
                                    </span>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-medium text-gray-900 truncate">{t.nama_bisnis || '-'}</p>
                                        <p class="text-xs text-gray-500">{formatNumber(t.total_transaksi)} transaksi</p>
                                    </div>
                                    {#if t.total_gmv}
                                        <span class="text-xs font-medium text-emerald-600">{formatRupiah(t.total_gmv)}</span>
                                    {/if}
                                </div>
                            {/each}
                        {:else}
                            <div class="px-4 py-8 text-center">
                                <Award size={24} class="mx-auto mb-2 text-gray-300" />
                                <p class="text-sm text-gray-400">Belum ada data</p>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Tenant Perlu Follow Up -->
                {#if tenantTidakAktif.length > 0}
                    <div class="bg-white rounded-xl border border-orange-200">
                        <div class="px-5 py-4 border-b border-orange-100 bg-orange-50 rounded-t-xl flex items-center justify-between">
                            <div>
                                <h3 class="font-semibold text-orange-900">Perlu Follow Up</h3>
                                <p class="text-xs text-orange-700">Tidak aktif &gt; 7 hari</p>
                            </div>
                            <div class="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                <AlertCircle size={16} class="text-orange-600" />
                            </div>
                        </div>
                        <div class="p-3">
                            {#each (showAllInactive ? tenantTidakAktif : tenantTidakAktif.slice(0, 5)) as t (t.id)}
                                <div class="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-orange-50 transition-colors">
                                    <div class="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                        <WifiOff size={16} />
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-medium text-gray-900 truncate">{t.nama_bisnis || '-'}</p>
                                        <p class="text-xs text-red-500 font-medium">{t.days_inactive} hari tidak aktif</p>
                                    </div>
                                    <a href="mailto:{t.email}" class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors" title="Kirim Email">
                                        <Mail size={16} />
                                    </a>
                                </div>
                            {/each}
                            
                            {#if tenantTidakAktif.length > 5}
                                <button 
                                    on:click={() => showAllInactive = !showAllInactive}
                                    class="w-full text-sm font-medium text-orange-600 hover:text-orange-700 py-2 mt-1"
                                >
                                    {showAllInactive ? 'Tampilkan lebih sedikit' : `+${tenantTidakAktif.length - 5} lainnya`}
                                </button>
                            {/if}
                        </div>
                    </div>
                {/if}

                <!-- Quick Stats Today -->
                <div class="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 class="font-semibold text-gray-900 mb-4">Aktivitas Hari Ini</h3>
                    
                    <div class="space-y-3">
                        <div class="flex items-center justify-between py-2 border-b border-gray-50">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <UserPlus size={16} class="text-emerald-600" />
                                </div>
                                <span class="text-sm text-gray-600">Tenant Baru</span>
                            </div>
                            <span class="text-sm font-semibold text-emerald-600">+{aktivitasHariIni?.tenant_baru || 0}</span>
                        </div>
                        
                        <div class="flex items-center justify-between py-2 border-b border-gray-50">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Users size={16} class="text-blue-600" />
                                </div>
                                <span class="text-sm text-gray-600">User Login</span>
                            </div>
                            <span class="text-sm font-semibold text-gray-900">{aktivitasHariIni?.user_login || 0}</span>
                        </div>
                        
                        <div class="flex items-center justify-between py-2 border-b border-gray-50">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                    <Zap size={16} class="text-purple-600" />
                                </div>
                                <span class="text-sm text-gray-600">Transaksi Sukses</span>
                            </div>
                            <span class="text-sm font-semibold text-gray-900">{formatNumber(aktivitasHariIni?.transaksi_sukses || 0)}</span>
                        </div>
                        
                        <div class="flex items-center justify-between py-2">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <XCircle size={16} class="text-gray-500" />
                                </div>
                                <span class="text-sm text-gray-600">Transaksi Batal</span>
                            </div>
                            <span class="text-sm font-semibold text-gray-500">{aktivitasHariIni?.transaksi_batal || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ============================================ -->
        <!-- SUMMARY FOOTER -->
        <!-- ============================================ -->
        <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-gray-900 rounded-xl p-5 text-white">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                        <Building2 size={24} class="text-white/80" />
                    </div>
                    <div>
                        <p class="text-2xl font-bold">{formatNumber(tenant.aktif)}</p>
                        <p class="text-sm text-white/60">Tenant Aktif</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-900 rounded-xl p-5 text-white">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                        <Hash size={24} class="text-white/80" />
                    </div>
                    <div>
                        <p class="text-2xl font-bold">{formatNumber(platform.bulan_ini.transaksi)}</p>
                        <p class="text-sm text-white/60">Transaksi Bulan Ini</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-900 rounded-xl p-5 text-white">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <DollarSign size={24} class="text-emerald-400" />
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-emerald-400">{formatRupiah(platform.bulan_ini.gmv)}</p>
                        <p class="text-sm text-white/60">GMV Bulan Ini</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-900 rounded-xl p-5 text-white">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                        <Target size={24} class="text-white/80" />
                    </div>
                    <div>
                        <p class="text-2xl font-bold">{formatRupiah(avgGmvPerTenant)}</p>
                        <p class="text-sm text-white/60">Avg GMV/Tenant</p>
                    </div>
                </div>
            </div>
        </section>

    </div>
</div>

<style>
    @keyframes slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
        animation: slide-in 0.3s ease-out;
    }
</style>