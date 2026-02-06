<!--
    +page.svelte - Laporan Stok
    ============================================
    Inventory, valuasi, fast/slow moving
-->
<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { slide } from 'svelte/transition';
    import {
        Boxes, DollarSign, AlertTriangle, TrendingUp, TrendingDown,
        ChevronDown, Search
    } from 'lucide-svelte';

    // Import komponen
    import { PeriodFilter, StatCard } from '$lib/components/tenant/laporan';

    // Import utils
    import { 
        formatRupiahShort, 
        formatNumber,
        calculatePercentage
    } from '$lib/utils/format.js';

    export let data;

    $: user = data?.user;
    $: valuation = data?.valuation;
    $: fastMoving = data?.fastMoving || [];
    $: slowMoving = data?.slowMoving || [];
    $: lowStock = data?.lowStock || [];
    $: currentStock = data?.currentStock || [];
    $: categoryBreakdown = data?.categoryBreakdown || [];

    // Get period from URL
    $: period = $page.url.searchParams.get('period') || 'today';

    // UI State
    let loading = false;
    let showAllFastMoving = false;
    let showAllSlowMoving = false;
    let showAllLowStock = false;
    let searchQuery = '';

    // Filtered stock
    $: filteredStock = searchQuery
        ? currentStock.filter(p => 
            p.nama_produk?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.nama_kategori?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : currentStock;

    // Stock status helper
    function getStockStatus(stok, threshold = 10) {
        if (stok <= 0) return { label: 'Habis', class: 'bg-red-100 text-red-700' };
        if (stok <= threshold) return { label: 'Menipis', class: 'bg-amber-100 text-amber-700' };
        return { label: 'Tersedia', class: 'bg-emerald-100 text-emerald-700' };
    }

    // Event handlers
    function handlePeriodChange(event) {
        loading = true;
        const params = new URLSearchParams();
        params.set('period', event.detail.period);
        goto(`?${params.toString()}`, { replaceState: true }).then(() => {
            loading = false;
        });
    }

    function handleRefresh() {
        loading = true;
        window.location.reload();
    }

    function goToProduct(productName) {
        goto(`/tenant/produk?search=${productName}`);
    }
</script>

<svelte:head>
    <title>Laporan Stok - {user?.nama_bisnis || 'Toko Saya'}</title>
</svelte:head>

<div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-3">
        <div>
            <h1 class="text-lg sm:text-xl font-semibold text-slate-800">Laporan Stok</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-0.5">Inventory & valuasi</p>
        </div>

        <!-- Period Filter -->
        <PeriodFilter 
            {period} 
            {loading}
            on:change={handlePeriodChange}
            on:refresh={handleRefresh}
        />
    </div>

    <!-- Summary Cards -->
    {#if valuation}
        <div class="grid grid-cols-2 gap-3">
            <StatCard
                title="Nilai Modal"
                value={formatRupiahShort(valuation.total_nilai_modal)}
                icon={Boxes}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                subtitle="{valuation.total_produk} produk"
            />

            <StatCard
                title="Potensi Revenue"
                value={formatRupiahShort(valuation.total_nilai_jual)}
                icon={DollarSign}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                subtitle="+{formatRupiahShort(valuation.potential_profit)}"
            />

            <StatCard
                title="Stok Menipis"
                value={valuation.produk_low_stock}
                icon={AlertTriangle}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                valueColor="text-amber-600"
            />

            <StatCard
                title="Stok Habis"
                value={valuation.produk_out_of_stock}
                icon={TrendingDown}
                iconBg="bg-red-50"
                iconColor="text-red-600"
                valueColor="text-red-600"
            />
        </div>
    {/if}

    <!-- Low Stock Alert -->
    {#if lowStock.length > 0}
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div class="flex items-center gap-2 mb-3">
                <AlertTriangle class="w-5 h-5 text-amber-600" />
                <h3 class="text-sm font-semibold text-amber-800">Perlu Restock!</h3>
                <span class="text-xs text-amber-600 ml-auto">{lowStock.length} produk</span>
            </div>
            
            <div class="space-y-2">
                {#each (showAllLowStock ? lowStock : lowStock.slice(0, 4)) as product}
                    <button
                        on:click={() => goToProduct(product.nama_produk)}
                        class="w-full p-2.5 bg-white rounded-lg flex items-center justify-between 
                               hover:bg-amber-100 active:scale-[0.98] transition-all"
                    >
                        <span class="text-sm text-slate-700 truncate">{product.nama_produk}</span>
                        <span class="text-sm font-semibold text-red-600 flex-shrink-0 ml-2">
                            {product.stok} {product.satuan}
                        </span>
                    </button>
                {/each}
            </div>
            
            {#if lowStock.length > 4}
                <button
                    on:click={() => showAllLowStock = !showAllLowStock}
                    class="w-full mt-3 py-2 text-sm font-medium text-amber-700 flex items-center justify-center gap-1"
                >
                    {showAllLowStock ? 'Tutup' : `Lihat semua (${lowStock.length})`}
                    <ChevronDown class="w-4 h-4 transition-transform {showAllLowStock ? 'rotate-180' : ''}" />
                </button>
            {/if}
        </div>
    {/if}

    <!-- Fast Moving Products -->
    {#if fastMoving.length > 0}
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <TrendingUp class="w-4 h-4 text-emerald-600" />
                    <h3 class="text-sm font-semibold text-slate-800">Fast Moving</h3>
                </div>
                <span class="text-xs text-slate-500">Terlaris</span>
            </div>
            
            <div class="divide-y divide-slate-100">
                {#each (showAllFastMoving ? fastMoving : fastMoving.slice(0, 5)) as product, index}
                    <div class="px-4 py-3 flex items-center gap-3" transition:slide={{ duration: 200 }}>
                        <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                            {index < 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}">
                            {index + 1}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-slate-800 truncate">{product.nama_produk}</p>
                            <p class="text-xs text-slate-500">{product.nama_kategori || 'Umum'}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-semibold text-emerald-600">{product.total_terjual} terjual</p>
                            <p class="text-xs text-slate-500">Stok: {product.stok_saat_ini}</p>
                        </div>
                    </div>
                {/each}
            </div>
            
            {#if fastMoving.length > 5}
                <button
                    on:click={() => showAllFastMoving = !showAllFastMoving}
                    class="w-full px-4 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 
                           flex items-center justify-center gap-1 border-t border-slate-100"
                >
                    {showAllFastMoving ? 'Tutup' : `Lihat semua`}
                    <ChevronDown class="w-4 h-4 transition-transform {showAllFastMoving ? 'rotate-180' : ''}" />
                </button>
            {/if}
        </div>
    {/if}

    <!-- Slow Moving / Dead Stock -->
    {#if slowMoving.length > 0}
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <TrendingDown class="w-4 h-4 text-red-600" />
                    <h3 class="text-sm font-semibold text-slate-800">Slow Moving</h3>
                </div>
                <span class="text-xs text-slate-500">Jarang terjual</span>
            </div>
            
            <div class="divide-y divide-slate-100">
                {#each (showAllSlowMoving ? slowMoving : slowMoving.slice(0, 5)) as product}
                    <div class="px-4 py-3 flex items-center gap-3" transition:slide={{ duration: 200 }}>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-slate-800 truncate">{product.nama_produk}</p>
                            <p class="text-xs text-slate-500">{product.nama_kategori || 'Umum'} • Stok: {product.stok}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-semibold text-red-600">{formatRupiahShort(product.nilai_modal_tersumbat)}</p>
                            <p class="text-xs text-slate-500">{product.total_terjual} terjual</p>
                        </div>
                    </div>
                {/each}
            </div>
            
            {#if slowMoving.length > 5}
                <button
                    on:click={() => showAllSlowMoving = !showAllSlowMoving}
                    class="w-full px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 
                           flex items-center justify-center gap-1 border-t border-slate-100"
                >
                    {showAllSlowMoving ? 'Tutup' : `Lihat semua`}
                    <ChevronDown class="w-4 h-4 transition-transform {showAllSlowMoving ? 'rotate-180' : ''}" />
                </button>
            {/if}
        </div>
    {/if}

    <!-- Category Breakdown -->
    {#if categoryBreakdown.length > 0}
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <h3 class="text-sm font-semibold text-slate-800 mb-3">Valuasi per Kategori</h3>
            
            <div class="space-y-3">
                {#each categoryBreakdown as category}
                    {@const percentage = calculatePercentage(category.total_nilai_modal, valuation?.total_nilai_modal)}
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-sm text-slate-700">{category.nama_kategori || 'Tanpa Kategori'}</span>
                            <span class="text-sm font-medium text-slate-800">{formatRupiahShort(category.total_nilai_modal)}</span>
                        </div>
                        <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                class="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style="width: {percentage}%"
                            ></div>
                        </div>
                        <p class="text-xs text-slate-500 mt-0.5">
                            {category.jumlah_produk} produk • {formatNumber(category.total_stok)} unit
                        </p>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Current Stock - Searchable List -->
    {#if currentStock.length > 0}
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-200">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-semibold text-slate-800">Semua Stok</h3>
                    <span class="text-xs text-slate-500">{formatNumber(currentStock.length)} produk</span>
                </div>
                
                <!-- Search -->
                <div class="relative">
                    <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        bind:value={searchQuery}
                        placeholder="Cari produk..."
                        class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                </div>
            </div>
            
            <div class="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {#each filteredStock.slice(0, 20) as product}
                    {@const status = getStockStatus(product.stok)}
                    <button
                        on:click={() => goToProduct(product.nama_produk)}
                        class="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 
                               active:bg-slate-100 transition-colors text-left"
                    >
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-slate-800 truncate">{product.nama_produk}</p>
                            <p class="text-xs text-slate-500">{product.nama_kategori || 'Umum'}</p>
                        </div>
                        <div class="text-right flex items-center gap-2">
                            <div>
                                <p class="text-sm font-semibold text-slate-800">{product.stok} {product.satuan}</p>
                                <p class="text-xs text-slate-500">{formatRupiahShort(product.nilai_modal)}</p>
                            </div>
                            <span class="px-2 py-0.5 rounded text-xs font-medium {status.class}">
                                {status.label}
                            </span>
                        </div>
                    </button>
                {/each}
                
                {#if filteredStock.length === 0}
                    <div class="px-4 py-8 text-center text-sm text-slate-500">
                        Tidak ada produk ditemukan
                    </div>
                {/if}
                
                {#if filteredStock.length > 20}
                    <div class="px-4 py-3 text-center text-xs text-slate-500 bg-slate-50">
                        Menampilkan 20 dari {formatNumber(filteredStock.length)} produk
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    <!-- Empty State -->
    {#if !valuation}
        <div class="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Boxes class="w-6 h-6 text-slate-400" />
            </div>
            <h3 class="text-sm font-medium text-slate-800 mb-1">Belum ada data</h3>
            <p class="text-slate-500 text-xs">Tambahkan produk untuk melihat laporan stok</p>
        </div>
    {/if}
</div>