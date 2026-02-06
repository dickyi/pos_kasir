<!--
    +page.svelte - Laporan Keuangan
    ============================================
    Profit/loss, margin, analisis diskon
-->
<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { slide } from 'svelte/transition';
    import {
        DollarSign, TrendingUp, TrendingDown, Percent, Receipt,
        ChevronDown
    } from 'lucide-svelte';

    // Import komponen
    import { PeriodFilter, StatCard, GrowthBadge } from '$lib/components/tenant/laporan';

    // Import utils
    import { 
        formatRupiah, 
        formatRupiahShort,
        calculateGrowth,
        calculatePercentage
    } from '$lib/utils/format.js';

    export let data;

    $: user = data?.user;
    $: profitLoss = data?.profitLoss;
    $: discountAnalysis = data?.discountAnalysis;
    $: taxSummary = data?.taxSummary;
    $: netProfit = data?.netProfit;
    $: chartData = data?.chartData || [];
    $: comparisonSummary = data?.comparisonSummary;

    // Get period from URL
    $: period = $page.url.searchParams.get('period') || 'today';

    // UI State
    let loading = false;
    let showBreakdown = false;

    // Calculate profit margin
    $: profitMargin = profitLoss && profitLoss.total_penjualan > 0
        ? ((profitLoss.total_penjualan - profitLoss.total_modal) / profitLoss.total_penjualan * 100)
        : 0;

    // Calculate ROI
    $: roi = profitLoss?.total_modal > 0 
        ? ((profitLoss?.profit || 0) / profitLoss.total_modal * 100)
        : 0;

    // Net revenue
    $: netRevenue = (profitLoss?.total_penjualan || 0) - (discountAnalysis?.total_diskon_semua || 0);

    // Total biaya
    $: totalBiaya = (profitLoss?.total_modal || 0) + (taxSummary || 0);

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
</script>

<svelte:head>
    <title>Laporan Keuangan - {user?.nama_bisnis || 'Toko Saya'}</title>
</svelte:head>

<div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-3">
        <div>
            <h1 class="text-lg sm:text-xl font-semibold text-slate-800">Laporan Keuangan</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-0.5">Profit, margin & analisis</p>
        </div>

        <!-- Period Filter -->
        <PeriodFilter 
            {period} 
            {loading}
            on:change={handlePeriodChange}
            on:refresh={handleRefresh}
        />
    </div>

    <!-- Net Profit Hero Card -->
    {#if profitLoss}
        <div class="bg-gradient-to-br {(netProfit || 0) >= 0 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-rose-600'} 
                    rounded-xl p-4 sm:p-6 text-white">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-white/80 text-xs sm:text-sm font-medium">
                        {(netProfit || 0) >= 0 ? 'Net Profit' : 'Net Loss'}
                    </p>
                    <p class="text-2xl sm:text-3xl font-bold mt-1">
                        {formatRupiah(netProfit || 0)}
                    </p>
                </div>
                <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    {#if (netProfit || 0) >= 0}
                        <TrendingUp class="w-5 h-5" />
                    {:else}
                        <TrendingDown class="w-5 h-5" />
                    {/if}
                </div>
            </div>
            
            <div class="flex items-center gap-2 text-sm">
                <span class="text-white/80">Profit Margin:</span>
                <span class="font-semibold">{profitMargin.toFixed(1)}%</span>
            </div>
            
            <!-- Mini Stats -->
            <div class="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/20">
                <div>
                    <p class="text-white/70 text-xs">Revenue</p>
                    <p class="text-base sm:text-lg font-semibold">{formatRupiahShort(profitLoss.total_penjualan)}</p>
                </div>
                <div>
                    <p class="text-white/70 text-xs">Modal</p>
                    <p class="text-base sm:text-lg font-semibold">{formatRupiahShort(profitLoss.total_modal)}</p>
                </div>
            </div>
        </div>
    {/if}

    <!-- Summary Cards -->
    {#if profitLoss}
        <div class="grid grid-cols-2 gap-3">
            <StatCard
                title="Total Revenue"
                value={formatRupiahShort(profitLoss.total_penjualan)}
                icon={DollarSign}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                growth={comparisonSummary ? calculateGrowth(profitLoss.total_penjualan, comparisonSummary.total_penjualan) : null}
            />

            <StatCard
                title="Modal (HPP)"
                value={formatRupiahShort(profitLoss.total_modal)}
                icon={Receipt}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
            />

            <StatCard
                title="Gross Profit"
                value={formatRupiahShort(profitLoss.profit)}
                icon={profitLoss.profit >= 0 ? TrendingUp : TrendingDown}
                iconBg={profitLoss.profit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}
                iconColor={profitLoss.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}
                valueColor={profitLoss.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}
            />

            <StatCard
                title="Profit Margin"
                value="{profitMargin.toFixed(1)}%"
                icon={Percent}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
            />
        </div>
    {/if}

    <!-- Financial Breakdown - Accordion -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
            on:click={() => showBreakdown = !showBreakdown}
            class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
            <h3 class="text-sm font-semibold text-slate-800">Detail Breakdown</h3>
            <ChevronDown class="w-4 h-4 text-slate-400 transition-transform {showBreakdown ? 'rotate-180' : ''}" />
        </button>
        
        {#if showBreakdown}
            <div class="px-4 pb-4 space-y-4" transition:slide={{ duration: 200 }}>
                <!-- Revenue Breakdown -->
                <div class="p-3 bg-slate-50 rounded-lg">
                    <p class="text-xs font-semibold text-slate-600 mb-3">REVENUE</p>
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-600">Penjualan Kotor</span>
                            <span class="font-medium text-slate-800">{formatRupiah(profitLoss?.total_penjualan || 0)}</span>
                        </div>
                        {#if discountAnalysis}
                            <div class="flex justify-between text-sm">
                                <span class="text-slate-600">Diskon Transaksi</span>
                                <span class="text-red-600">-{formatRupiah(discountAnalysis.total_diskon_transaksi || 0)}</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-slate-600">Diskon Member</span>
                                <span class="text-red-600">-{formatRupiah(discountAnalysis.total_diskon_member || 0)}</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-slate-600">Diskon Item</span>
                                <span class="text-red-600">-{formatRupiah(discountAnalysis.total_diskon_item || 0)}</span>
                            </div>
                        {/if}
                        <div class="flex justify-between text-sm pt-2 border-t border-slate-200">
                            <span class="font-medium text-slate-700">Net Revenue</span>
                            <span class="font-semibold text-blue-600">{formatRupiah(netRevenue)}</span>
                        </div>
                    </div>
                </div>

                <!-- Cost Breakdown -->
                <div class="p-3 bg-slate-50 rounded-lg">
                    <p class="text-xs font-semibold text-slate-600 mb-3">BIAYA</p>
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-600">HPP (Modal)</span>
                            <span class="font-medium text-slate-800">{formatRupiah(profitLoss?.total_modal || 0)}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-600">Pajak Terkumpul</span>
                            <span class="font-medium text-slate-800">{formatRupiah(taxSummary || 0)}</span>
                        </div>
                        <div class="flex justify-between text-sm pt-2 border-t border-slate-200">
                            <span class="font-medium text-slate-700">Total Biaya</span>
                            <span class="font-semibold text-amber-600">{formatRupiah(totalBiaya)}</span>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Key Metrics -->
    <div class="bg-white rounded-xl border border-slate-200 p-4">
        <h3 class="text-sm font-semibold text-slate-800 mb-3">Metrik Utama</h3>
        
        <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-blue-50 rounded-lg">
                <p class="text-xs text-blue-600 font-medium">Profit Margin</p>
                <p class="text-xl font-bold text-blue-700 mt-1">{profitMargin.toFixed(1)}%</p>
            </div>
            
            <div class="p-3 bg-emerald-50 rounded-lg">
                <p class="text-xs text-emerald-600 font-medium">Gross Profit</p>
                <p class="text-xl font-bold text-emerald-700 mt-1">{formatRupiahShort(profitLoss?.profit || 0)}</p>
            </div>
            
            <div class="p-3 bg-amber-50 rounded-lg">
                <p class="text-xs text-amber-600 font-medium">Total Diskon</p>
                <p class="text-xl font-bold text-amber-700 mt-1">{formatRupiahShort(discountAnalysis?.total_diskon_semua || 0)}</p>
            </div>
            
            <div class="p-3 bg-purple-50 rounded-lg">
                <p class="text-xs text-purple-600 font-medium">ROI</p>
                <p class="text-xl font-bold text-purple-700 mt-1">{roi.toFixed(1)}%</p>
            </div>
        </div>
    </div>

    <!-- Empty State -->
    {#if !profitLoss}
        <div class="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp class="w-6 h-6 text-slate-400" />
            </div>
            <h3 class="text-sm font-medium text-slate-800 mb-1">Belum ada data</h3>
            <p class="text-slate-500 text-xs">Data akan muncul setelah ada transaksi</p>
        </div>
    {/if}
</div>