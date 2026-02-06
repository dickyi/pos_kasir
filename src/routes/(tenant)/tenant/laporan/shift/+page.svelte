<!--
    +page.svelte - Laporan Shift
    ============================================
    History shift, rekap per shift, selisih kas
-->
<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { slide, fly } from 'svelte/transition';
    import {
        Clock, Receipt, Banknote, AlertTriangle, 
        ChevronDown, ChevronRight, CheckCircle, XCircle,
        TrendingUp, TrendingDown, Minus, Users, QrCode, 
        Building2, CreditCard, Wallet, Eye
    } from 'lucide-svelte';

    // Import komponen
    import { PeriodFilter, StatCard } from '$lib/components/tenant/laporan';
    import ShiftDetailModal from '$lib/components/tenant/laporan/ShiftDetailModal.svelte';

    // Import utils
    import { 
        formatRupiah, 
        formatRupiahShort, 
        formatNumber,
        formatDateMedium,
        formatTime,
        calculateGrowth
    } from '$lib/utils/format.js';

    export let data;

    $: user = data?.user;
    $: shifts = data?.shifts || [];
    $: summary = data?.summary;
    $: comparisonSummary = data?.comparisonSummary;
    $: kasirBreakdown = data?.kasirBreakdown || [];
    $: dailySummary = data?.dailySummary || [];
    $: selisihSummary = data?.selisihSummary;
    $: error = data?.error;

    // Get period from URL
    $: period = $page.url.searchParams.get('period') || 'today';

    // UI State
    let loading = false;
    let showAllShifts = false;
    let selectedShift = null;
    let showDetailModal = false;

    // Payment method icons
    const paymentIcons = {
        tunai: Banknote,
        qris: QrCode,
        transfer: Building2,
        debit: CreditCard,
        kredit: Wallet
    };

    // Status badge colors
    function getStatusColor(status) {
        return status === 'open' 
            ? 'bg-emerald-100 text-emerald-700' 
            : 'bg-slate-100 text-slate-600';
    }

    function getSelisihColor(statusSelisih) {
        switch (statusSelisih) {
            case 'seimbang': return 'text-emerald-600';
            case 'lebih': return 'text-blue-600';
            case 'kurang': return 'text-red-600';
            default: return 'text-slate-600';
        }
    }

    function getSelisihIcon(statusSelisih) {
        switch (statusSelisih) {
            case 'seimbang': return CheckCircle;
            case 'lebih': return TrendingUp;
            case 'kurang': return TrendingDown;
            default: return Minus;
        }
    }

    function getSelisihBadgeColor(statusSelisih) {
        switch (statusSelisih) {
            case 'seimbang': return 'bg-emerald-100 text-emerald-700';
            case 'lebih': return 'bg-blue-100 text-blue-700';
            case 'kurang': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    }

    // Format durasi
    function formatDurasi(menit) {
        if (!menit) return '-';
        const jam = Math.floor(menit / 60);
        const sisaMenit = Math.round(menit % 60);
        if (jam > 0) {
            return `${jam}j ${sisaMenit}m`;
        }
        return `${sisaMenit}m`;
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

    function openShiftDetail(shift) {
        selectedShift = shift;
        showDetailModal = true;
    }

    function closeDetailModal() {
        showDetailModal = false;
        selectedShift = null;
    }
</script>

<svelte:head>
    <title>Laporan Shift - {user?.nama_bisnis || 'Toko Saya'}</title>
</svelte:head>

<div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-3">
        <div>
            <h1 class="text-lg sm:text-xl font-semibold text-slate-800">Laporan Shift</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-0.5">History shift & rekap kas</p>
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
    {#if summary}
        <div class="grid grid-cols-2 gap-3">
            <StatCard
                title="Total Shift"
                value={formatNumber(summary.total_shift)}
                icon={Clock}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                subtitle="{summary.shift_closed || 0} selesai, {summary.shift_open || 0} aktif"
            />

            <StatCard
                title="Total Penjualan"
                value={formatRupiahShort(summary.total_penjualan)}
                icon={Receipt}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                growth={comparisonSummary ? calculateGrowth(summary.total_penjualan, comparisonSummary.total_penjualan) : null}
            />

            <StatCard
                title="Total Transaksi"
                value={formatNumber(summary.total_transaksi)}
                icon={Banknote}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
            />

            <StatCard
                title="Rata-rata Durasi"
                value={formatDurasi(summary.avg_durasi_menit)}
                icon={Clock}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
            />
        </div>
    {/if}

    <!-- Selisih Summary -->
    {#if selisihSummary && (selisihSummary.count_seimbang > 0 || selisihSummary.count_lebih > 0 || selisihSummary.count_kurang > 0)}
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <h3 class="text-sm font-semibold text-slate-800 mb-3">Rekap Selisih Kas</h3>
            
            <div class="grid grid-cols-3 gap-3">
                <!-- Seimbang -->
                <div class="p-3 bg-emerald-50 rounded-lg text-center">
                    <div class="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <CheckCircle class="w-4 h-4 text-emerald-600" />
                    </div>
                    <p class="text-lg font-bold text-emerald-700">{selisihSummary.count_seimbang || 0}</p>
                    <p class="text-xs text-emerald-600">Seimbang</p>
                </div>
                
                <!-- Lebih -->
                <div class="p-3 bg-blue-50 rounded-lg text-center">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <TrendingUp class="w-4 h-4 text-blue-600" />
                    </div>
                    <p class="text-lg font-bold text-blue-700">{selisihSummary.count_lebih || 0}</p>
                    <p class="text-xs text-blue-600">Lebih</p>
                    {#if selisihSummary.total_lebih > 0}
                        <p class="text-xs text-blue-500 mt-1">+{formatRupiahShort(selisihSummary.total_lebih)}</p>
                    {/if}
                </div>
                
                <!-- Kurang -->
                <div class="p-3 bg-red-50 rounded-lg text-center">
                    <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <TrendingDown class="w-4 h-4 text-red-600" />
                    </div>
                    <p class="text-lg font-bold text-red-700">{selisihSummary.count_kurang || 0}</p>
                    <p class="text-xs text-red-600">Kurang</p>
                    {#if selisihSummary.total_kurang > 0}
                        <p class="text-xs text-red-500 mt-1">-{formatRupiahShort(selisihSummary.total_kurang)}</p>
                    {/if}
                </div>
            </div>
        </div>
    {/if}

    <!-- Payment Breakdown -->
    {#if summary && summary.total_penjualan > 0}
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <h3 class="text-sm font-semibold text-slate-800 mb-3">Penjualan per Metode Bayar</h3>
            
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {#each [
                    { key: 'tunai', label: 'Tunai', value: summary.total_tunai, icon: Banknote },
                    { key: 'qris', label: 'QRIS', value: summary.total_qris, icon: QrCode },
                    { key: 'transfer', label: 'Transfer', value: summary.total_transfer, icon: Building2 },
                    { key: 'debit', label: 'Debit', value: summary.total_debit, icon: CreditCard },
                    { key: 'kredit', label: 'Kredit', value: summary.total_kredit, icon: Wallet }
                ] as payment}
                    {#if payment.value > 0}
                        <div class="p-3 bg-slate-50 rounded-lg">
                            <div class="flex items-center gap-2 mb-2">
                                <svelte:component this={payment.icon} class="w-4 h-4 text-slate-500" />
                                <span class="text-xs font-medium text-slate-600">{payment.label}</span>
                            </div>
                            <p class="text-base font-semibold text-slate-800">{formatRupiahShort(payment.value)}</p>
                        </div>
                    {/if}
                {/each}
            </div>
        </div>
    {/if}

    <!-- Kasir Breakdown -->
    {#if kasirBreakdown.length > 0}
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                <Users class="w-4 h-4 text-slate-400" />
                <h3 class="text-sm font-semibold text-slate-800">Performa Kasir</h3>
            </div>
            
            <div class="divide-y divide-slate-100">
                {#each kasirBreakdown as kasir}
                    <div class="px-4 py-3">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                    <span class="text-sm font-medium text-slate-600">
                                        {kasir.kasir_nama?.charAt(0) || '?'}
                                    </span>
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-slate-800">{kasir.kasir_nama}</p>
                                    <p class="text-xs text-slate-500">{kasir.jumlah_shift} shift • {formatNumber(kasir.total_transaksi)} trx</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-sm font-semibold text-slate-800">{formatRupiahShort(kasir.total_penjualan)}</p>
                                {#if kasir.total_selisih !== 0}
                                    <p class="text-xs {kasir.total_selisih >= 0 ? 'text-blue-600' : 'text-red-600'}">
                                        Selisih: {kasir.total_selisih >= 0 ? '+' : ''}{formatRupiahShort(kasir.total_selisih)}
                                    </p>
                                {/if}
                            </div>
                        </div>
                        
                        <!-- Selisih breakdown mini -->
                        <div class="flex items-center gap-2 mt-2">
                            <span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">
                                ✓ {kasir.shift_seimbang || 0}
                            </span>
                            {#if kasir.shift_lebih > 0}
                                <span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                    ↑ {kasir.shift_lebih}
                                </span>
                            {/if}
                            {#if kasir.shift_kurang > 0}
                                <span class="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                    ↓ {kasir.shift_kurang}
                                </span>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Shift List -->
    {#if shifts.length > 0}
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-slate-800">Daftar Shift</h3>
                <span class="text-xs text-slate-500">{shifts.length} shift</span>
            </div>
            
            <div class="divide-y divide-slate-100">
                {#each (showAllShifts ? shifts : shifts.slice(0, 5)) as shift}
                    <button
                        on:click={() => openShiftDetail(shift)}
                        class="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 active:bg-slate-100 
                               transition-colors text-left"
                        transition:slide={{ duration: 200 }}
                    >
                        <!-- Status indicator -->
                        <div class="flex-shrink-0">
                            <div class="w-10 h-10 rounded-lg flex items-center justify-center
                                {shift.status === 'open' ? 'bg-emerald-100' : 'bg-slate-100'}">
                                <Clock class="w-5 h-5 {shift.status === 'open' ? 'text-emerald-600' : 'text-slate-500'}" />
                            </div>
                        </div>
                        
                        <!-- Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <p class="text-sm font-medium text-slate-800">{shift.no_shift}</p>
                                <span class="px-1.5 py-0.5 rounded text-xs font-medium {getStatusColor(shift.status)}">
                                    {shift.status === 'open' ? 'Aktif' : 'Selesai'}
                                </span>
                            </div>
                            <p class="text-xs text-slate-500 mt-0.5">
                                {shift.kasir_nama} • {formatDateMedium(shift.tanggal)} 
                                {formatTime(shift.waktu_buka)}
                                {#if shift.waktu_tutup}
                                    - {formatTime(shift.waktu_tutup)}
                                {/if}
                            </p>
                        </div>
                        
                        <!-- Right side -->
                        <div class="text-right flex-shrink-0">
                            <p class="text-sm font-semibold text-slate-800">{formatRupiahShort(shift.total_penjualan_bersih)}</p>
                            {#if shift.status === 'closed' && shift.status_selisih}
                                <div class="flex items-center justify-end gap-1 mt-0.5">
                                    <svelte:component 
                                        this={getSelisihIcon(shift.status_selisih)} 
                                        class="w-3 h-3 {getSelisihColor(shift.status_selisih)}" 
                                    />
                                    <span class="text-xs {getSelisihColor(shift.status_selisih)}">
                                        {#if shift.selisih_kas === 0}
                                            Seimbang
                                        {:else}
                                            {shift.selisih_kas > 0 ? '+' : ''}{formatRupiahShort(shift.selisih_kas)}
                                        {/if}
                                    </span>
                                </div>
                            {:else if shift.status === 'open'}
                                <p class="text-xs text-emerald-600">{shift.total_transaksi} transaksi</p>
                            {/if}
                        </div>
                        
                        <ChevronRight class="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </button>
                {/each}
            </div>
            
            {#if shifts.length > 5}
                <button
                    on:click={() => showAllShifts = !showAllShifts}
                    class="w-full px-4 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 
                           flex items-center justify-center gap-1 transition-colors"
                >
                    {showAllShifts ? 'Tutup' : `Lihat semua (${shifts.length})`}
                    <ChevronDown class="w-4 h-4 transition-transform {showAllShifts ? 'rotate-180' : ''}" />
                </button>
            {/if}
        </div>
    {/if}

    <!-- Empty State -->
    {#if shifts.length === 0 && !error}
        <div class="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock class="w-6 h-6 text-slate-400" />
            </div>
            <h3 class="text-sm font-medium text-slate-800 mb-1">Belum ada data shift</h3>
            <p class="text-slate-500 text-xs">Data akan muncul setelah kasir membuka shift</p>
        </div>
    {/if}
</div>

<!-- Shift Detail Modal -->
{#if showDetailModal && selectedShift}
    <ShiftDetailModal 
        shift={selectedShift}
        on:close={closeDetailModal}
    />
{/if}