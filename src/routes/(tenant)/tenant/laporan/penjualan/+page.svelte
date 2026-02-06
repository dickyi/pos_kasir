<!--
    +page.svelte - Laporan Penjualan
    ============================================
    Analisis penjualan, top produk, kategori
-->
<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { slide } from 'svelte/transition';
    import {
        DollarSign, Receipt, Package, CreditCard, 
        ChevronDown, ChevronRight, Banknote, QrCode, Building2
    } from 'lucide-svelte';

    // Import komponen
    import { PeriodFilter, StatCard } from '$lib/components/tenant/laporan';

    // Import utils
    import { 
        formatRupiah, 
        formatRupiahShort, 
        formatNumber,
        formatDateMedium,
        formatTime,
        calculateGrowth,
        calculatePercentage
    } from '$lib/utils/format.js';

    export let data;

    $: user = data?.user;
    $: summary = data?.summary;
    $: chartData = data?.chartData || [];
    $: topProducts = data?.topProducts || [];
    $: categoryBreakdown = data?.categoryBreakdown || [];
    $: paymentBreakdown = data?.paymentBreakdown || [];
    $: transactions = data?.transactions || [];
    $: comparisonSummary = data?.comparisonSummary;

    // Get period from URL
    $: period = $page.url.searchParams.get('period') || 'today';

    // UI State
    let loading = false;
    let showAllProducts = false;
    let showAllTransactions = false;

    // Payment method icons
    const paymentIcons = {
        cash: Banknote,
        qris: QrCode,
        transfer: Building2
    };

    function getPaymentIcon(method) {
        return paymentIcons[method?.toLowerCase()] || Banknote;
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

    function goToTransaction(invoice) {
        goto(`/tenant/transaksi?search=${invoice}`);
    }
</script>

<svelte:head>
    <title>Laporan Penjualan - {user?.nama_bisnis || 'Toko Saya'}</title>
</svelte:head>

<div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-3">
        <div>
            <h1 class="text-lg sm:text-xl font-semibold text-slate-800">Laporan Penjualan</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-0.5">Analisis penjualan & tren</p>
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
    {#if summary}
        <div class="grid grid-cols-2 gap-3">
            <StatCard
                title="Total Penjualan"
                value={formatRupiahShort(summary.total_penjualan)}
                icon={DollarSign}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                growth={comparisonSummary ? calculateGrowth(summary.total_penjualan, comparisonSummary.total_penjualan) : null}
            />

            <StatCard
                title="Transaksi"
                value={formatNumber(summary.total_transaksi)}
                icon={Receipt}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
            />

            <StatCard
                title="Rata-rata"
                value={formatRupiahShort(summary.rata_rata_transaksi)}
                icon={Package}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
            />

            <StatCard
                title="Diskon"
                value={formatRupiahShort(summary.total_diskon)}
                icon={CreditCard}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
            />
        </div>
    {/if}

    <!-- Top Products -->
    {#if topProducts.length > 0}
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-slate-800">Top Produk Terlaris</h3>
                <span class="text-xs text-slate-500">{topProducts.length} produk</span>
            </div>
            
            <div class="divide-y divide-slate-100">
                {#each (showAllProducts ? topProducts : topProducts.slice(0, 5)) as product, index}
                    <div class="px-4 py-3 flex items-center gap-3" transition:slide={{ duration: 200 }}>
                        <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                            {index < 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}">
                            {index + 1}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-slate-800 truncate">{product.nama_produk}</p>
                            <p class="text-xs text-slate-500">{product.jumlah_transaksi} transaksi</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-semibold text-slate-800">{product.total_qty} pcs</p>
                            <p class="text-xs text-slate-500">{formatRupiahShort(product.total_penjualan)}</p>
                        </div>
                    </div>
                {/each}
            </div>
            
            {#if topProducts.length > 5}
                <button
                    on:click={() => showAllProducts = !showAllProducts}
                    class="w-full px-4 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 
                           flex items-center justify-center gap-1 transition-colors"
                >
                    {showAllProducts ? 'Tutup' : `Lihat semua (${topProducts.length})`}
                    <ChevronDown class="w-4 h-4 transition-transform {showAllProducts ? 'rotate-180' : ''}" />
                </button>
            {/if}
        </div>
    {/if}

    <!-- Category Breakdown -->
    {#if categoryBreakdown.length > 0}
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <h3 class="text-sm font-semibold text-slate-800 mb-3">Penjualan per Kategori</h3>
            
            <div class="space-y-3">
                {#each categoryBreakdown as category}
                    {@const percentage = calculatePercentage(category.total, summary?.total_penjualan)}
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-sm text-slate-700">{category.nama_kategori || 'Tanpa Kategori'}</span>
                            <span class="text-sm font-medium text-slate-800">{formatRupiahShort(category.total)}</span>
                        </div>
                        <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                class="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                style="width: {percentage}%"
                            ></div>
                        </div>
                        <p class="text-xs text-slate-500 mt-0.5">{percentage.toFixed(1)}% • {category.jumlah_transaksi} transaksi</p>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Payment Methods -->
    {#if paymentBreakdown.length > 0}
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <h3 class="text-sm font-semibold text-slate-800 mb-3">Metode Pembayaran</h3>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {#each paymentBreakdown as payment}
                    <div class="p-3 bg-slate-50 rounded-lg">
                        <div class="flex items-center gap-2 mb-2">
                            <svelte:component this={getPaymentIcon(payment.metode_bayar)} class="w-4 h-4 text-slate-500" />
                            <span class="text-xs font-medium text-slate-600 capitalize">{payment.metode_bayar}</span>
                        </div>
                        <p class="text-base font-semibold text-slate-800">{formatRupiahShort(payment.total)}</p>
                        <p class="text-xs text-slate-500">{payment.jumlah_transaksi} trx</p>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Recent Transactions -->
    {#if transactions.length > 0}
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-slate-800">Transaksi Terbaru</h3>
                <a href="/tenant/transaksi" class="text-xs text-emerald-600 font-medium">Lihat Semua</a>
            </div>
            
            <div class="divide-y divide-slate-100">
                {#each (showAllTransactions ? transactions : transactions.slice(0, 5)) as trx}
                    <button
                        on:click={() => goToTransaction(trx.no_invoice)}
                        class="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 active:bg-slate-100 
                               transition-colors text-left"
                    >
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-slate-800">{trx.no_invoice}</p>
                            <p class="text-xs text-slate-500">
                                {formatDateMedium(trx.tanggal)} {formatTime(trx.waktu)} • {trx.nama_customer || 'Umum'}
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-semibold text-slate-800">{formatRupiahShort(trx.total)}</p>
                            <p class="text-xs text-slate-500 capitalize">{trx.metode_bayar}</p>
                        </div>
                        <ChevronRight class="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </button>
                {/each}
            </div>
            
            {#if transactions.length > 5}
                <button
                    on:click={() => showAllTransactions = !showAllTransactions}
                    class="w-full px-4 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 
                           flex items-center justify-center gap-1 transition-colors"
                >
                    {showAllTransactions ? 'Tutup' : `Lihat lebih banyak`}
                    <ChevronDown class="w-4 h-4 transition-transform {showAllTransactions ? 'rotate-180' : ''}" />
                </button>
            {/if}
        </div>
    {/if}

    <!-- Empty State -->
    {#if !summary || summary.total_transaksi === 0}
        <div class="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign class="w-6 h-6 text-slate-400" />
            </div>
            <h3 class="text-sm font-medium text-slate-800 mb-1">Belum ada data</h3>
            <p class="text-slate-500 text-xs">Data akan muncul setelah ada transaksi</p>
        </div>
    {/if}
</div>