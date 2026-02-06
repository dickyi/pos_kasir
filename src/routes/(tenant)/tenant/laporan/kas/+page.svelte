<!--
    /tenant/laporan/kas/+page.svelte
    ============================================
    Halaman laporan kas masuk/keluar
    
    Fitur:
    - Filter tanggal
    - Filter tipe, kategori, user
    - Summary statistik
    - Chart harian
    - List transaksi dengan pagination
    - Export (TODO)
    ============================================
-->
<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { 
        Wallet, TrendingUp, TrendingDown, Calendar,
        Filter, Search, ChevronLeft, ChevronRight,
        Download, RefreshCw, X, BarChart3
    } from 'lucide-svelte';
    import { formatRupiah, formatDate } from '$lib/utils/format.js';
    
    // Import components
    import KasCard from '$lib/components/tenant/kasir/kas/KasCard.svelte';
    
    /** @type {import('./$types').PageData} */
    export let data;
    
    // State
    let showFilter = false;
    let searchQuery = data.filters?.search || '';
    
    // Filter state (untuk form)
    let filterStartDate = data.filters?.startDate || '';
    let filterEndDate = data.filters?.endDate || '';
    let filterTipe = data.filters?.tipe || '';
    let filterKategori = data.filters?.kategoriId || '';
    let filterUser = data.filters?.userId || '';
    
    // Computed
    $: kasList = data.kasList || [];
    $: pagination = data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 };
    $: summary = data.summary || { total_masuk: 0, total_keluar: 0, count_masuk: 0, count_keluar: 0 };
    $: summaryByKategori = data.summaryByKategori || [];
    $: summaryPerDay = data.summaryPerDay || [];
    $: kategoriList = data.kategoriList || [];
    $: userList = data.userList || [];
    $: isKasir = data.isKasir;
    $: filters = data.filters || {};
    
    // Net kas
    $: netKas = summary.total_masuk - summary.total_keluar;
    
    // Has active filters
    $: hasActiveFilters = filters.tipe || filters.kategoriId || filters.userId || filters.search;
    
    /**
     * Apply filters and navigate
     */
    function applyFilters() {
        const params = new URLSearchParams();
        
        if (filterStartDate) params.set('start', filterStartDate);
        if (filterEndDate) params.set('end', filterEndDate);
        if (filterTipe) params.set('tipe', filterTipe);
        if (filterKategori) params.set('kategori', filterKategori);
        if (filterUser) params.set('user', filterUser);
        if (searchQuery) params.set('q', searchQuery);
        
        goto(`?${params.toString()}`);
        showFilter = false;
    }
    
    /**
     * Clear all filters
     */
    function clearFilters() {
        filterStartDate = '';
        filterEndDate = '';
        filterTipe = '';
        filterKategori = '';
        filterUser = '';
        searchQuery = '';
        
        goto('?');
        showFilter = false;
    }
    
    /**
     * Handle search
     */
    function handleSearch() {
        const params = new URLSearchParams($page.url.search);
        if (searchQuery) {
            params.set('q', searchQuery);
        } else {
            params.delete('q');
        }
        params.set('page', '1');
        goto(`?${params.toString()}`);
    }
    
    /**
     * Navigate pagination
     */
    function goToPage(pageNum) {
        const params = new URLSearchParams($page.url.search);
        params.set('page', pageNum.toString());
        goto(`?${params.toString()}`);
    }
    
    /**
     * Quick date filter
     */
    function setQuickDate(type) {
        const today = new Date();
        let start, end;
        
        switch (type) {
            case 'today':
                start = end = today.toISOString().slice(0, 10);
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                start = end = yesterday.toISOString().slice(0, 10);
                break;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 6);
                start = weekAgo.toISOString().slice(0, 10);
                end = today.toISOString().slice(0, 10);
                break;
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                start = monthStart.toISOString().slice(0, 10);
                end = today.toISOString().slice(0, 10);
                break;
            default:
                return;
        }
        
        filterStartDate = start;
        filterEndDate = end;
        applyFilters();
    }
    
    function handleViewKas(event) {
        // TODO: Open detail modal
        console.log('View kas:', event.detail);
    }
</script>

<svelte:head>
    <title>Laporan Kas | Laporan</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
    <!-- Header -->
    <div class="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div class="max-w-6xl mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Wallet class="w-6 h-6 text-emerald-600" />
                        Laporan Kas
                    </h1>
                    <p class="text-sm text-slate-500 mt-0.5">
                        {#if filters.startDate && filters.endDate}
                            {formatDate(filters.startDate)} - {formatDate(filters.endDate)}
                        {:else}
                            Semua periode
                        {/if}
                    </p>
                </div>
                
                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        on:click={() => showFilter = !showFilter}
                        class="p-2 text-slate-600 hover:bg-slate-100 rounded-lg relative"
                    >
                        <Filter class="w-5 h-5" />
                        {#if hasActiveFilters}
                            <span class="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
                        {/if}
                    </button>
                    
                    <button
                        type="button"
                        on:click={() => goto($page.url.pathname)}
                        class="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        <RefreshCw class="w-5 h-5" />
                    </button>
                </div>
            </div>
            
            <!-- Quick Date Filters -->
            <div class="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                <button
                    type="button"
                    on:click={() => setQuickDate('today')}
                    class="px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap
                           bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                    Hari Ini
                </button>
                <button
                    type="button"
                    on:click={() => setQuickDate('yesterday')}
                    class="px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap
                           bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                    Kemarin
                </button>
                <button
                    type="button"
                    on:click={() => setQuickDate('week')}
                    class="px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap
                           bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                    7 Hari
                </button>
                <button
                    type="button"
                    on:click={() => setQuickDate('month')}
                    class="px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap
                           bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                    Bulan Ini
                </button>
            </div>
        </div>
    </div>
    
    <div class="max-w-6xl mx-auto px-4 py-4 space-y-4">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <!-- Kas Masuk -->
            <div class="bg-white rounded-xl border border-slate-200 p-4">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <TrendingUp class="w-4 h-4 text-emerald-600" />
                    </div>
                    <span class="text-xs font-medium text-slate-500">Kas Masuk</span>
                </div>
                <p class="text-xl font-bold text-emerald-600">
                    {formatRupiah(summary.total_masuk)}
                </p>
                <p class="text-xs text-slate-400 mt-1">{summary.count_masuk} transaksi</p>
            </div>
            
            <!-- Kas Keluar -->
            <div class="bg-white rounded-xl border border-slate-200 p-4">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <TrendingDown class="w-4 h-4 text-red-600" />
                    </div>
                    <span class="text-xs font-medium text-slate-500">Kas Keluar</span>
                </div>
                <p class="text-xl font-bold text-red-600">
                    {formatRupiah(summary.total_keluar)}
                </p>
                <p class="text-xs text-slate-400 mt-1">{summary.count_keluar} transaksi</p>
            </div>
            
            <!-- Net -->
            <div class="bg-white rounded-xl border border-slate-200 p-4">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Wallet class="w-4 h-4 text-slate-600" />
                    </div>
                    <span class="text-xs font-medium text-slate-500">Selisih</span>
                </div>
                <p class="text-xl font-bold {netKas >= 0 ? 'text-emerald-600' : 'text-red-600'}">
                    {netKas >= 0 ? '+' : ''}{formatRupiah(netKas)}
                </p>
                <p class="text-xs text-slate-400 mt-1">Net kas</p>
            </div>
            
            <!-- Total Transaksi -->
            <div class="bg-white rounded-xl border border-slate-200 p-4">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BarChart3 class="w-4 h-4 text-blue-600" />
                    </div>
                    <span class="text-xs font-medium text-slate-500">Total</span>
                </div>
                <p class="text-xl font-bold text-slate-800">
                    {summary.count_masuk + summary.count_keluar}
                </p>
                <p class="text-xs text-slate-400 mt-1">Transaksi</p>
            </div>
        </div>
        
        <!-- Summary by Kategori -->
        {#if summaryByKategori.length > 0}
            <div class="bg-white rounded-xl border border-slate-200 p-4">
                <h3 class="text-sm font-semibold text-slate-700 mb-3">Per Kategori</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {#each summaryByKategori.slice(0, 8) as item}
                        <div class="p-3 rounded-lg {item.tipe === 'masuk' ? 'bg-emerald-50' : 'bg-red-50'}">
                            <p class="text-xs text-slate-500 truncate">{item.kategori_nama}</p>
                            <p class="text-sm font-bold mt-1 {item.tipe === 'masuk' ? 'text-emerald-600' : 'text-red-600'}">
                                {formatRupiah(item.total)}
                            </p>
                            <p class="text-xs text-slate-400">{item.jumlah_transaksi}x</p>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
        
        <!-- Search -->
        <div class="bg-white rounded-xl border border-slate-200 p-3">
            <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    bind:value={searchQuery}
                    on:keydown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Cari keterangan, penerima, no kas..."
                    class="w-full h-10 pl-10 pr-4 border border-slate-200 rounded-lg text-sm
                           focus:outline-none focus:border-emerald-500"
                />
            </div>
        </div>
        
        <!-- Active Filters Display -->
        {#if hasActiveFilters}
            <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs text-slate-500">Filter aktif:</span>
                {#if filters.tipe}
                    <span class="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                        {filters.tipe === 'masuk' ? 'Kas Masuk' : 'Kas Keluar'}
                    </span>
                {/if}
                {#if filters.search}
                    <span class="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                        "{filters.search}"
                    </span>
                {/if}
                <button
                    type="button"
                    on:click={clearFilters}
                    class="text-xs text-red-600 hover:underline"
                >
                    Hapus filter
                </button>
            </div>
        {/if}
        
        <!-- Kas List -->
        <div class="space-y-3">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-semibold text-slate-700">
                    Daftar Transaksi
                </h2>
                <span class="text-xs text-slate-500">
                    {pagination.total} transaksi
                </span>
            </div>
            
            {#if kasList.length === 0}
                <div class="bg-white rounded-xl border border-slate-200 p-8 text-center">
                    <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wallet class="w-8 h-8 text-slate-400" />
                    </div>
                    <p class="text-slate-500">Tidak ada transaksi kas</p>
                    {#if hasActiveFilters}
                        <button
                            type="button"
                            on:click={clearFilters}
                            class="mt-4 text-sm text-emerald-600 hover:underline"
                        >
                            Hapus filter
                        </button>
                    {/if}
                </div>
            {:else}
                <div class="space-y-2">
                    {#each kasList as kas (kas.id)}
                        <KasCard 
                            {kas} 
                            showActions={false}
                            on:view={handleViewKas}
                        />
                    {/each}
                </div>
                
                <!-- Pagination -->
                {#if pagination.totalPages > 1}
                    <div class="flex items-center justify-center gap-2 pt-4">
                        <button
                            type="button"
                            on:click={() => goToPage(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            class="p-2 rounded-lg border border-slate-200 text-slate-600 
                                   hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft class="w-5 h-5" />
                        </button>
                        
                        <span class="px-4 py-2 text-sm text-slate-600">
                            Halaman {pagination.page} dari {pagination.totalPages}
                        </span>
                        
                        <button
                            type="button"
                            on:click={() => goToPage(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            class="p-2 rounded-lg border border-slate-200 text-slate-600 
                                   hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight class="w-5 h-5" />
                        </button>
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</div>

<!-- Filter Slide Panel -->
{#if showFilter}
    <div class="fixed inset-0 z-50 flex justify-end">
        <!-- Backdrop -->
        <div 
            class="absolute inset-0 bg-black/50"
            on:click={() => showFilter = false}
            on:keypress={() => {}}
            role="button"
            tabindex="-1"
        ></div>
        
        <!-- Panel -->
        <div class="relative w-full max-w-sm bg-white h-full overflow-y-auto">
            <div class="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <h3 class="font-semibold text-slate-800">Filter</h3>
                <button
                    type="button"
                    on:click={() => showFilter = false}
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>
            
            <div class="p-4 space-y-4">
                <!-- Tanggal -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Tanggal</label>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-xs text-slate-500 mb-1">Dari</label>
                            <input
                                type="date"
                                bind:value={filterStartDate}
                                class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label class="block text-xs text-slate-500 mb-1">Sampai</label>
                            <input
                                type="date"
                                bind:value={filterEndDate}
                                class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                            />
                        </div>
                    </div>
                </div>
                
                <!-- Tipe -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Tipe</label>
                    <select
                        bind:value={filterTipe}
                        class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                        <option value="">Semua Tipe</option>
                        <option value="masuk">Kas Masuk</option>
                        <option value="keluar">Kas Keluar</option>
                    </select>
                </div>
                
                <!-- Kategori -->
                {#if kategoriList.length > 0}
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
                        <select
                            bind:value={filterKategori}
                            class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                        >
                            <option value="">Semua Kategori</option>
                            {#each kategoriList as kat}
                                <option value={kat.id}>{kat.nama}</option>
                            {/each}
                        </select>
                    </div>
                {/if}
                
                <!-- User (hanya untuk owner/admin) -->
                {#if !isKasir && userList.length > 0}
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">User</label>
                        <select
                            bind:value={filterUser}
                            class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                        >
                            <option value="">Semua User</option>
                            {#each userList as u}
                                <option value={u.id}>{u.nama} ({u.role})</option>
                            {/each}
                        </select>
                    </div>
                {/if}
            </div>
            
            <!-- Actions -->
            <div class="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex gap-3">
                <button
                    type="button"
                    on:click={clearFilters}
                    class="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl 
                           font-medium hover:bg-slate-50"
                >
                    Reset
                </button>
                <button
                    type="button"
                    on:click={applyFilters}
                    class="flex-1 py-3 bg-emerald-600 text-white rounded-xl 
                           font-medium hover:bg-emerald-700"
                >
                    Terapkan
                </button>
            </div>
        </div>
    </div>
{/if}