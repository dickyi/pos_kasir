<!--
    ============================================
    PERFORMA KASIR - PAGE SVELTE (FIXED)
    ============================================
    Halaman untuk melihat ranking dan statistik kasir
    FIXED: Export button menggunakan function untuk generate URL
    ============================================
-->
<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { 
        formatRupiah, 
        formatRupiahShort, 
        formatNumber, 
        formatPercent,
        formatDurationShort,
        formatDateShort
    } from '$lib/utils/format';
    import { 
        Trophy, 
        TrendingUp, 
        TrendingDown,
        Users, 
        ShoppingCart, 
        Clock,
        Award,
        Medal,
        Star,
        Calendar,
        Filter,
        Download,
        RefreshCw,
        CreditCard,
        Wallet,
        Smartphone
    } from 'lucide-svelte';
    
    export let data;
    
    // Reactive data dengan safe defaults
    $: kasirRanking = data?.kasirRanking || [];
    $: overallStats = data?.overallStats || {
        total_shift: 0,
        total_kasir_aktif: 0,
        total_transaksi: 0,
        total_penjualan: 0,
        avg_per_transaksi: 0,
        penjualan_growth: 0,
        transaksi_growth: 0
    };
    $: trendHarian = data?.trendHarian || [];
    $: topPerformer = data?.topPerformer;
    $: metodePembayaran = data?.metodePembayaran || [];
    $: filter = data?.filter || { periode: 'bulan_ini', dateFrom: '', dateTo: '' };
    
    // Filter state - menggunakan $: untuk reaktivitas
    $: selectedPeriode = filter?.periode || 'bulan_ini';
    $: customStart = filter?.dateFrom || '';
    $: customEnd = filter?.dateTo || '';
    let isLoading = false;
    
    // Period options
    const periodeOptions = [
        { value: 'hari_ini', label: 'Hari Ini' },
        { value: 'minggu_ini', label: 'Minggu Ini' },
        { value: 'bulan_ini', label: 'Bulan Ini' },
        { value: 'bulan_lalu', label: 'Bulan Lalu' },
        { value: 'custom', label: 'Custom' }
    ];
    
    // Apply filter
    async function applyFilter() {
        isLoading = true;
        let params = new URLSearchParams();
        params.set('periode', selectedPeriode);
        if (selectedPeriode === 'custom') {
            params.set('start', customStart);
            params.set('end', customEnd);
        }
        await goto(`?${params.toString()}`, { replaceState: true });
        isLoading = false;
    }
    
    // ✅ FIXED: Function untuk handle export
    function handleExport() {
        // Build URL secara manual tanpa karakter tersembunyi
        let url = '/tenant/shift/export?type=performa&periode=' + encodeURIComponent(selectedPeriode);
        
        // Hanya tambahkan start/end jika periode = custom
        if (selectedPeriode === 'custom' && customStart && customEnd) {
            url += '&start=' + encodeURIComponent(customStart);
            url += '&end=' + encodeURIComponent(customEnd);
        }
        
        console.log('Export URL:', url); // Debug
        window.location.href = url;
    }
    
    // Get rank badge
    function getRankBadge(index) {
        if (index === 0) return { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-100' };
        if (index === 1) return { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-100' };
        if (index === 2) return { icon: Award, color: 'text-amber-600', bg: 'bg-amber-100' };
        return { icon: Star, color: 'text-slate-400', bg: 'bg-slate-100' };
    }
    
    // Get growth indicator
    function getGrowthIndicator(value) {
        if (value > 0) return { icon: TrendingUp, color: 'text-emerald-600', label: '+' + formatPercent(value) };
        if (value < 0) return { icon: TrendingDown, color: 'text-red-600', label: formatPercent(value) };
        return { icon: null, color: 'text-slate-400', label: '0%' };
    }
    
    // Calculate max for chart
    $: maxPenjualan = Math.max(...trendHarian.map(t => t.total_penjualan || 0), 1);
    
    // Helper untuk format tanggal dari berbagai format
    function getTanggal(item) {
        return item.tanggal || item.date;
    }
    
    // Metode pembayaran icon
    function getMetodeIcon(metode) {
        switch (metode.toLowerCase()) {
            case 'tunai': return Wallet;
            case 'qris': return Smartphone;
            case 'transfer': return CreditCard;
            default: return Wallet;
        }
    }
</script>

<svelte:head>
    <title>Performa Kasir | Monitoring Shift</title>
</svelte:head>

<div class="p-4 md:p-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Performa Kasir</h1>
            <p class="text-slate-500 mt-1">Analisis dan ranking performa kasir</p>
        </div>
        
        <!-- ✅ FIXED: Export Button menggunakan on:click -->
        <button 
            on:click={handleExport}
            class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
            <Download class="w-4 h-4" />
            Export Excel
        </button>
    </div>
    
    <!-- Filter Section -->
    <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="flex flex-wrap items-end gap-4">
            <div>
                <label for="periode-select" class="block text-sm font-medium text-slate-700 mb-1">Periode</label>
                <select 
                    id="periode-select"
                    bind:value={selectedPeriode}
                    on:change={() => selectedPeriode !== 'custom' && applyFilter()}
                    class="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                    {#each periodeOptions as opt}
                        <option value={opt.value}>{opt.label}</option>
                    {/each}
                </select>
            </div>
            
            {#if selectedPeriode === 'custom'}
                <div>
                    <label for="date-start" class="block text-sm font-medium text-slate-700 mb-1">Dari</label>
                    <input 
                        id="date-start"
                        type="date" 
                        bind:value={customStart}
                        class="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div>
                    <label for="date-end" class="block text-sm font-medium text-slate-700 mb-1">Sampai</label>
                    <input 
                        id="date-end"
                        type="date" 
                        bind:value={customEnd}
                        class="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <button 
                    on:click={applyFilter}
                    disabled={isLoading}
                    class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {#if isLoading}
                        <RefreshCw class="w-4 h-4 animate-spin" />
                    {:else}
                        <Filter class="w-4 h-4" />
                    {/if}
                    Terapkan
                </button>
            {/if}
            
            <div class="text-sm text-slate-500">
                <Calendar class="w-4 h-4 inline mr-1" />
                {formatDateShort(filter.dateFrom)} - {formatDateShort(filter.dateTo)}
            </div>
        </div>
    </div>
    
    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Total Penjualan -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <div class="flex items-center justify-between">
                <p class="text-sm text-slate-500">Total Penjualan</p>
                {#if overallStats.penjualan_growth}
                    {@const growth = getGrowthIndicator(overallStats.penjualan_growth)}
                    <span class="text-xs {growth.color} flex items-center gap-1">
                        {#if growth.icon}
                            <svelte:component this={growth.icon} class="w-3 h-3" />
                        {/if}
                        {growth.label}
                    </span>
                {/if}
            </div>
            <p class="text-2xl font-bold text-slate-800 mt-1">
                {formatRupiahShort(overallStats.total_penjualan || 0)}
            </p>
        </div>
        
        <!-- Total Transaksi -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <div class="flex items-center justify-between">
                <p class="text-sm text-slate-500">Total Transaksi</p>
                {#if overallStats.transaksi_growth}
                    {@const growth = getGrowthIndicator(overallStats.transaksi_growth)}
                    <span class="text-xs {growth.color} flex items-center gap-1">
                        {#if growth.icon}
                            <svelte:component this={growth.icon} class="w-3 h-3" />
                        {/if}
                        {growth.label}
                    </span>
                {/if}
            </div>
            <p class="text-2xl font-bold text-slate-800 mt-1">
                {formatNumber(overallStats.total_transaksi || 0)}
            </p>
        </div>
        
        <!-- Rata-rata per Transaksi -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <p class="text-sm text-slate-500">Rata-rata/Transaksi</p>
            <p class="text-2xl font-bold text-slate-800 mt-1">
                {formatRupiahShort(overallStats.avg_per_transaksi || 0)}
            </p>
        </div>
        
        <!-- Kasir Aktif -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <p class="text-sm text-slate-500">Kasir Aktif</p>
            <p class="text-2xl font-bold text-slate-800 mt-1">
                {formatNumber(overallStats.total_kasir_aktif || 0)}
            </p>
        </div>
    </div>
    
    <div class="grid md:grid-cols-3 gap-6">
        <!-- Ranking Kasir -->
        <div class="md:col-span-2 bg-white rounded-xl border border-slate-200">
            <div class="p-4 border-b border-slate-200">
                <h2 class="font-semibold text-slate-800 flex items-center gap-2">
                    <Trophy class="w-5 h-5 text-yellow-500" />
                    Ranking Kasir
                </h2>
            </div>
            
            {#if kasirRanking.length === 0}
                <div class="p-8 text-center text-slate-500">
                    <Users class="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Belum ada data kasir untuk periode ini</p>
                </div>
            {:else}
                <div class="divide-y divide-slate-100">
                    {#each kasirRanking as kasir, index}
                        {@const badge = getRankBadge(index)}
                        <div class="p-4 hover:bg-slate-50 transition-colors">
                            <div class="flex items-center gap-4">
                                <!-- Rank Badge -->
                                <div class="w-10 h-10 rounded-full {badge.bg} flex items-center justify-center">
                                    {#if index < 3}
                                        <svelte:component this={badge.icon} class="w-5 h-5 {badge.color}" />
                                    {:else}
                                        <span class="font-bold text-slate-500">{index + 1}</span>
                                    {/if}
                                </div>
                                
                                <!-- Info -->
                                <div class="flex-1 min-w-0">
                                    <p class="font-medium text-slate-800 truncate">{kasir.nama_kasir}</p>
                                    <p class="text-sm text-slate-500">
                                        {kasir.total_shift} shift • {kasir.total_transaksi} transaksi
                                    </p>
                                </div>
                                
                                <!-- Stats -->
                                <div class="text-right">
                                    <p class="font-bold text-emerald-600">{formatRupiah(kasir.total_penjualan)}</p>
                                    <p class="text-sm text-slate-500">
                                        Avg: {formatRupiahShort(kasir.avg_per_transaksi)}
                                    </p>
                                </div>
                            </div>
                            
                            <!-- Progress Bar -->
                            {#if index === 0 && kasir.total_penjualan > 0}
                                <div class="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div class="h-full bg-emerald-500 rounded-full" style="width: 100%"></div>
                                </div>
                            {:else if kasirRanking[0]?.total_penjualan > 0}
                                <div class="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        class="h-full bg-emerald-300 rounded-full" 
                                        style="width: {(kasir.total_penjualan / kasirRanking[0].total_penjualan) * 100}%"
                                    ></div>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
        
        <!-- Side Panel -->
        <div class="space-y-6">
            <!-- Top Performer Card -->
            {#if topPerformer}
                <div class="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl p-5 text-white">
                    <div class="flex items-center gap-2 mb-3">
                        <Trophy class="w-6 h-6" />
                        <span class="font-semibold">Top Performer</span>
                    </div>
                    <p class="text-2xl font-bold mb-1">{topPerformer.nama_kasir}</p>
                    <p class="text-yellow-100 text-sm mb-4">{topPerformer.total_transaksi} transaksi</p>
                    <div class="bg-white/20 rounded-lg p-3">
                        <p class="text-yellow-100 text-xs">Total Penjualan</p>
                        <p class="text-xl font-bold">{formatRupiah(topPerformer.total_penjualan)}</p>
                    </div>
                </div>
            {/if}
            
            <!-- Metode Pembayaran -->
            <div class="bg-white rounded-xl border border-slate-200 p-4">
                <h3 class="font-semibold text-slate-800 mb-4">Metode Pembayaran</h3>
                
                {#if metodePembayaran.length === 0}
                    <p class="text-slate-500 text-sm text-center py-4">Belum ada data</p>
                {:else}
                    <div class="space-y-3">
                        {#each metodePembayaran as metode}
                            {@const Icon = getMetodeIcon(metode.metode)}
                            {@const total = metodePembayaran.reduce((a, b) => a + b.total, 0)}
                            {@const persen = total > 0 ? (metode.total / total) * 100 : 0}
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <span class="flex items-center gap-2 text-sm text-slate-600">
                                        <Icon class="w-4 h-4" />
                                        {metode.metode}
                                    </span>
                                    <span class="text-sm font-medium">{formatRupiahShort(metode.total)}</span>
                                </div>
                                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        class="h-full bg-emerald-500 rounded-full transition-all"
                                        style="width: {persen}%"
                                    ></div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
            
            <!-- Trend Chart -->
            <div class="bg-white rounded-xl border border-slate-200 p-4">
                <h3 class="font-semibold text-slate-800 mb-4">Trend Penjualan</h3>
                
                {#if trendHarian.length === 0}
                    <p class="text-slate-500 text-sm text-center py-4">Belum ada data</p>
                {:else}
                    <div class="flex items-end gap-1 h-32">
                        {#each trendHarian as day, i}
                            {@const height = maxPenjualan > 0 ? (day.total_penjualan / maxPenjualan) * 100 : 0}
                            <div class="flex-1 flex flex-col items-center gap-1">
                                <div 
                                    class="w-full bg-emerald-500 rounded-t hover:bg-emerald-600 transition-colors cursor-pointer group relative"
                                    style="height: {Math.max(height, 2)}%"
                                    role="img"
                                    aria-label="{formatDateShort(day.tanggal)}: {formatRupiah(day.total_penjualan)}"
                                >
                                    <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        {formatRupiahShort(day.total_penjualan)}
                                    </div>
                                </div>
                                <span class="text-[10px] text-slate-400">
                                    {new Date(day.tanggal).getDate()}
                                </span>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
    
    <!-- Detail Table -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="p-4 border-b border-slate-200">
            <h2 class="font-semibold text-slate-800">Detail Performa Kasir</h2>
        </div>
        
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-slate-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">#</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kasir</th>
                        <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Shift</th>
                        <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Transaksi</th>
                        <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total Penjualan</th>
                        <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Avg/Transaksi</th>
                        <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Durasi Kerja</th>
                        <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Selisih Kas</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    {#each kasirRanking as kasir, index}
                        <tr class="hover:bg-slate-50">
                            <td class="px-4 py-3 text-sm text-slate-500">{index + 1}</td>
                            <td class="px-4 py-3">
                                <p class="font-medium text-slate-800">{kasir.nama_kasir}</p>
                                <p class="text-xs text-slate-500">{kasir.role}</p>
                            </td>
                            <td class="px-4 py-3 text-center text-sm">{kasir.total_shift}</td>
                            <td class="px-4 py-3 text-center text-sm">{kasir.total_transaksi}</td>
                            <td class="px-4 py-3 text-right font-medium text-emerald-600">
                                {formatRupiah(kasir.total_penjualan)}
                            </td>
                            <td class="px-4 py-3 text-right text-sm text-slate-600">
                                {formatRupiah(kasir.avg_per_transaksi)}
                            </td>
                            <td class="px-4 py-3 text-center text-sm text-slate-600">
                                {formatDurationShort(kasir.total_menit_kerja)}
                            </td>
                            <td class="px-4 py-3 text-right text-sm">
                                {#if kasir.total_selisih === 0}
                                    <span class="text-emerald-600">Seimbang</span>
                                {:else if kasir.total_selisih > 0}
                                    <span class="text-blue-600">+{formatRupiah(kasir.total_selisih)}</span>
                                {:else}
                                    <span class="text-red-600">{formatRupiah(kasir.total_selisih)}</span>
                                {/if}
                            </td>
                        </tr>
                    {:else}
                        <tr>
                            <td colspan="8" class="px-4 py-8 text-center text-slate-500">
                                Belum ada data kasir untuk periode ini
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>