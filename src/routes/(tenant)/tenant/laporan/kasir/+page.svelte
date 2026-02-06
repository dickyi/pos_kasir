<!--
    +page.svelte - Laporan Kasir
    ============================================
    Performa kasir, leaderboard, shift
-->
<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { fly, slide } from 'svelte/transition';
    import {
        Users, Receipt, Target, Award, Clock, 
        AlertTriangle, ChevronDown, Banknote, QrCode, Building2
    } from 'lucide-svelte';

    // Import komponen
    import { PeriodFilter, StatCard } from '$lib/components/tenant/laporan';

    // Import utils
    import { 
        formatRupiah, 
        formatRupiahShort, 
        formatNumber 
    } from '$lib/utils/format.js';

    export let data;

    $: user = data?.user;
    $: performance = data?.performance || [];
    $: hourlyStats = data?.hourlyStats || [];
    $: shiftStats = data?.shiftStats || [];
    $: voidTransactions = data?.voidTransactions || [];
    $: topProductsByCashier = data?.topProductsByCashier || {};
    $: paymentMethodsByCashier = data?.paymentMethodsByCashier || {};
    $: leaderboard = data?.leaderboard || [];
    $: comparison = data?.comparison;
    $: error = data?.error;

    // Get period from URL
    $: period = $page.url.searchParams.get('period') || 'today';

    // UI State
    let loading = false;

    // Calculate totals
    $: totalKasir = performance.length;
    $: totalPenjualan = performance.reduce((sum, p) => sum + p.total_penjualan, 0);
    $: totalTransaksi = performance.reduce((sum, p) => sum + p.total_transaksi, 0);
    $: avgPerKasir = totalKasir > 0 ? totalPenjualan / totalKasir : 0;

    // Payment method icons
    const paymentIcons = {
        cash: Banknote,
        qris: QrCode,
        transfer: Building2
    };

    const paymentLabels = {
        cash: 'Tunai',
        qris: 'QRIS',
        transfer: 'Transfer'
    };

    function getPaymentIcon(method) {
        return paymentIcons[method] || Banknote;
    }

    function getPaymentLabel(method) {
        return paymentLabels[method] || method;
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
</script>

<svelte:head>
    <title>Laporan Kasir - {user?.nama_bisnis || 'Toko Saya'}</title>
</svelte:head>

<div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-3">
        <div>
            <h1 class="text-lg sm:text-xl font-semibold text-slate-800">Laporan Kasir</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-0.5">Performa & produktivitas</p>
        </div>

        <!-- Period Filter -->
        <PeriodFilter 
            {period} 
            {loading}
            on:change={handlePeriodChange}
            on:refresh={handleRefresh}
        />
    </div>

    <!-- Error State -->
    {#if error}
        <div class="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 text-red-500 flex-shrink-0" />
            <p class="text-red-700 text-sm">{error}</p>
        </div>
    {/if}

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 gap-3">
        <StatCard
            title="Kasir Aktif"
            value={totalKasir}
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
        />

        <StatCard
            title="Transaksi"
            value={formatNumber(totalTransaksi)}
            icon={Receipt}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            growth={comparison?.transaksi?.change}
        />

        <StatCard
            title="Rata-rata/Kasir"
            value={formatRupiahShort(avgPerKasir)}
            icon={Target}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
        />

        <StatCard
            title={leaderboard[0]?.nama_kasir || '-'}
            value={formatRupiahShort(leaderboard[0]?.total_penjualan || 0)}
            icon={Award}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
        />
    </div>

    <!-- Leaderboard -->
    {#if leaderboard.length > 0}
        <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4 sm:p-6">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                    <Award class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                    <h3 class="text-base sm:text-lg font-semibold text-amber-900">Leaderboard</h3>
                    <p class="text-xs sm:text-sm text-amber-700">Top 3 Kasir</p>
                </div>
            </div>

            <!-- Top 3 Cards -->
            <div class="space-y-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0">
                {#each leaderboard.slice(0, 3) as cashier, index}
                    <div
                        class="relative bg-white rounded-xl p-4 border-2 shadow-sm
                            {index === 0 ? 'border-amber-400' : index === 1 ? 'border-slate-300' : 'border-orange-300'}"
                        transition:fly={{ y: 20, delay: index * 100, duration: 300 }}
                    >
                        <!-- Badge -->
                        <div class="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md
                            {index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : 'bg-orange-400'}">
                            <span class="text-sm">{index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'}</span>
                        </div>
                        
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0
                                {index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-100 text-orange-700'}">
                                {index + 1}
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-semibold text-slate-800 truncate">{cashier.nama_kasir}</p>
                                <p class="text-xs text-slate-500">{formatNumber(cashier.total_transaksi)} transaksi</p>
                            </div>
                            <div class="text-right">
                                <p class="text-base sm:text-lg font-bold text-slate-800">{formatRupiahShort(cashier.total_penjualan)}</p>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Shift Performance -->
    {#if shiftStats.length > 0}
        <div class="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
            <div class="flex items-center gap-2 mb-4">
                <Clock class="w-5 h-5 text-slate-400" />
                <h3 class="text-sm sm:text-base font-semibold text-slate-800">Performa per Shift</h3>
            </div>

            <div class="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide sm:grid sm:grid-cols-4 sm:overflow-visible">
                {#each shiftStats as shift}
                    <div class="flex-shrink-0 w-32 sm:w-auto p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p class="text-xs font-medium text-slate-600 truncate">{shift.shift}</p>
                        <p class="text-lg font-bold text-slate-800 mt-1">{formatRupiahShort(shift.total)}</p>
                        <p class="text-xs text-slate-500">{formatNumber(shift.jumlah_transaksi)} trx</p>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Detail Table -->
    {#if leaderboard.length > 0}
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-200">
                <h3 class="text-sm sm:text-base font-semibold text-slate-800">Detail Performa</h3>
            </div>

            <!-- Desktop Table -->
            <div class="hidden lg:block overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b border-slate-100 bg-slate-50">
                            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Rank</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Kasir</th>
                            <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Transaksi</th>
                            <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Total</th>
                            <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Rata-rata</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each leaderboard as cashier}
                            <tr class="hover:bg-slate-50">
                                <td class="px-4 py-3">
                                    <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                                        {cashier.rank <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}">
                                        {cashier.rank}
                                    </div>
                                </td>
                                <td class="px-4 py-3 font-medium text-slate-800">{cashier.nama_kasir}</td>
                                <td class="px-4 py-3 text-right text-sm text-slate-600">{formatNumber(cashier.total_transaksi)}</td>
                                <td class="px-4 py-3 text-right font-semibold text-slate-800">{formatRupiah(cashier.total_penjualan)}</td>
                                <td class="px-4 py-3 text-right text-sm text-slate-600">{formatRupiah(cashier.rata_rata_transaksi)}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- Mobile Card View -->
            <div class="lg:hidden divide-y divide-slate-100">
                {#each leaderboard as cashier}
                    <div class="p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                                {cashier.rank <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}">
                                {cashier.rank}
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-medium text-slate-800 truncate">{cashier.nama_kasir}</p>
                                <p class="text-xs text-slate-500">{formatNumber(cashier.total_transaksi)} transaksi</p>
                            </div>
                            <div class="text-right">
                                <p class="font-semibold text-slate-800">{formatRupiahShort(cashier.total_penjualan)}</p>
                                <p class="text-xs text-slate-500">avg {formatRupiahShort(cashier.rata_rata_transaksi)}</p>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Void Transactions -->
    {#if voidTransactions.length > 0}
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                <AlertTriangle class="w-4 h-4 text-amber-600" />
                <h3 class="text-sm font-semibold text-slate-800">Transaksi Dibatalkan</h3>
            </div>
            
            <div class="divide-y divide-slate-100">
                {#each voidTransactions as item}
                    <div class="px-4 py-3 flex items-center justify-between">
                        <span class="text-sm text-slate-700">{item.nama_kasir}</span>
                        <div class="flex items-center gap-3">
                            <span class="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                {item.jumlah_void}x
                            </span>
                            <span class="text-sm font-medium text-red-600">{formatRupiahShort(item.nilai_void)}</span>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Accordion Sections -->
    <div class="space-y-3">
        <!-- Top Products per Cashier -->
        {#if Object.keys(topProductsByCashier).length > 0}
            <details class="bg-white rounded-xl border border-slate-200 group">
                <summary class="px-4 py-3 flex items-center justify-between cursor-pointer list-none">
                    <h3 class="text-sm font-semibold text-slate-800">Top Produk per Kasir</h3>
                    <ChevronDown class="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <div class="px-4 pb-4 space-y-3">
                    {#each Object.entries(topProductsByCashier) as [cashierName, products]}
                        <div class="p-3 rounded-lg bg-slate-50">
                            <p class="text-xs font-semibold text-slate-700 mb-2">{cashierName}</p>
                            <div class="space-y-1.5">
                                {#each products.slice(0, 3) as product, i}
                                    <div class="flex items-center justify-between text-xs">
                                        <div class="flex items-center gap-2">
                                            <span class="w-4 h-4 rounded bg-slate-200 flex items-center justify-center text-[10px] font-medium text-slate-600">
                                                {i + 1}
                                            </span>
                                            <span class="text-slate-600 truncate">{product.nama_produk}</span>
                                        </div>
                                        <span class="font-medium text-slate-800">{product.total_qty}</span>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            </details>
        {/if}

        <!-- Payment Methods per Cashier -->
        {#if Object.keys(paymentMethodsByCashier).length > 0}
            <details class="bg-white rounded-xl border border-slate-200 group">
                <summary class="px-4 py-3 flex items-center justify-between cursor-pointer list-none">
                    <h3 class="text-sm font-semibold text-slate-800">Metode Pembayaran</h3>
                    <ChevronDown class="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <div class="px-4 pb-4 space-y-3">
                    {#each Object.entries(paymentMethodsByCashier) as [cashierName, methods]}
                        <div class="p-3 rounded-lg bg-slate-50">
                            <p class="text-xs font-semibold text-slate-700 mb-2">{cashierName}</p>
                            <div class="space-y-1.5">
                                {#each methods as method}
                                    <div class="flex items-center justify-between text-xs">
                                        <div class="flex items-center gap-2">
                                            <svelte:component this={getPaymentIcon(method.metode)} class="w-3.5 h-3.5 text-slate-400" />
                                            <span class="text-slate-600">{getPaymentLabel(method.metode)}</span>
                                        </div>
                                        <span class="font-medium text-slate-800">{formatRupiahShort(method.total)}</span>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            </details>
        {/if}
    </div>

    <!-- Empty State -->
    {#if performance.length === 0 && !error}
        <div class="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users class="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" />
            </div>
            <h3 class="text-sm sm:text-base font-medium text-slate-800 mb-1">Belum ada data</h3>
            <p class="text-slate-500 text-xs sm:text-sm">
                Data akan muncul setelah ada transaksi
            </p>
        </div>
    {/if}
</div>

<style>
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    
    details > summary::-webkit-details-marker {
        display: none;
    }
</style>