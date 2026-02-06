<!--
    +page.svelte - Monitoring Kasir Overview (FIXED)
    =====================================================
    FIXED: 
    - Fallback untuk penjualan jika total_penjualan_bersih = 0
    - Menggunakan penjualan_tunai + qris + transfer + debit + kredit sebagai fallback
-->
<script>
    import { 
        Activity, Users, Receipt, Banknote, TrendingUp, TrendingDown,
        Clock, User, Monitor, Play, Square, AlertTriangle,
        ArrowUpRight, ArrowDownRight, Wallet, QrCode, Building2,
        CreditCard, ChevronRight, RefreshCw, Eye, CheckCircle,
        XCircle, Crown, Shield, Zap
    } from 'lucide-svelte';
    import { onMount } from 'svelte';
    import { invalidateAll } from '$app/navigation';
    import { formatRupiah } from '$lib/utils/format.js';

    export let data;

    $: activeShifts = data?.activeShifts || [];
    $: todayStats = data?.todayStats || {};
    $: todayShifts = data?.todayShifts || [];
    $: kasirPerformance = data?.kasirPerformance || [];
    $: recentClosedShifts = data?.recentClosedShifts || [];
    $: kasirMode = data?.kasirMode || 'single';

    // Auto refresh setiap 30 detik
    let refreshInterval;
    
    onMount(() => {
        refreshInterval = setInterval(() => {
            invalidateAll();
        }, 30000);

        return () => {
            if (refreshInterval) clearInterval(refreshInterval);
        };
    });

    // Manual refresh
    let isRefreshing = false;
    async function handleRefresh() {
        isRefreshing = true;
        await invalidateAll();
        setTimeout(() => isRefreshing = false, 500);
    }

    // ✅ FIXED: Helper untuk hitung total penjualan dengan fallback
    function getTotalPenjualan(stats) {
        // Coba total_penjualan_bersih dulu
        const bersih = parseFloat(stats?.total_penjualan_bersih) || 0;
        if (bersih > 0) return bersih;
        
        // Fallback: hitung dari per metode bayar
        const tunai = parseFloat(stats?.total_tunai) || 0;
        const qris = parseFloat(stats?.total_qris) || 0;
        const transfer = parseFloat(stats?.total_transfer) || 0;
        const debit = parseFloat(stats?.total_debit) || 0;
        const kredit = parseFloat(stats?.total_kredit) || 0;
        
        return tunai + qris + transfer + debit + kredit;
    }

    // ✅ FIXED: Helper untuk hitung penjualan shift individual
    function getShiftPenjualan(shift) {
        const bersih = parseFloat(shift?.total_penjualan_bersih) || 0;
        if (bersih > 0) return bersih;
        
        const total = parseFloat(shift?.total_penjualan) || 0;
        if (total > 0) return total;
        
        // Fallback: hitung dari per metode
        const tunai = parseFloat(shift?.penjualan_tunai) || 0;
        const qris = parseFloat(shift?.penjualan_qris) || 0;
        const transfer = parseFloat(shift?.penjualan_transfer) || 0;
        const debit = parseFloat(shift?.penjualan_debit) || 0;
        const kredit = parseFloat(shift?.penjualan_kredit) || 0;
        
        return tunai + qris + transfer + debit + kredit;
    }

    // Helper functions
    function formatDuration(minutes) {
        if (!minutes) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}j ${mins}m`;
        }
        return `${mins} menit`;
    }

    function formatTime(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatDateTime(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getRoleBadge(role) {
        switch(role?.toLowerCase()) {
            case 'owner': return { color: 'bg-amber-100 text-amber-700', icon: Crown };
            case 'admin': return { color: 'bg-purple-100 text-purple-700', icon: Shield };
            default: return { color: 'bg-slate-100 text-slate-600', icon: User };
        }
    }

    function getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    // Safe format rupiah
    function safeFormatRupiah(value) {
        try {
            return formatRupiah(value || 0);
        } catch (e) {
            return 'Rp 0';
        }
    }

    // ✅ FIXED: Stats cards dengan fallback penjualan
    $: totalPenjualanHariIni = getTotalPenjualan(todayStats);
    
    $: statsCards = [
        {
            label: 'Total Penjualan',
            value: safeFormatRupiah(totalPenjualanHariIni),
            subValue: `${todayStats.total_transaksi || 0} transaksi`,
            icon: TrendingUp,
            color: 'emerald',
            bgGradient: 'from-emerald-500 to-teal-500'
        },
        {
            label: 'Shift Aktif',
            value: activeShifts.length,
            subValue: `dari ${todayStats.total_shift || 0} shift hari ini`,
            icon: Activity,
            color: 'blue',
            bgGradient: 'from-blue-500 to-indigo-500'
        },
        {
            label: 'Total Kas Masuk',
            value: safeFormatRupiah(todayStats.total_kas_masuk || 0),
            subValue: 'Non-penjualan',
            icon: ArrowUpRight,
            color: 'cyan',
            bgGradient: 'from-cyan-500 to-blue-500'
        },
        {
            label: 'Total Kas Keluar',
            value: safeFormatRupiah(todayStats.total_kas_keluar || 0),
            subValue: 'Pengeluaran',
            icon: ArrowDownRight,
            color: 'rose',
            bgGradient: 'from-rose-500 to-pink-500'
        }
    ];
</script>

<svelte:head>
    <title>Monitoring Kasir - Overview</title>
</svelte:head>

<div class="space-y-6">
    <!-- ==========================================
         HEADER WITH REFRESH
    ========================================== -->
    <div class="flex items-center justify-between">
        <div>
            <p class="text-sm text-slate-500">
                Data hari ini: <span class="font-medium text-slate-700">{data?.today || '-'}</span>
            </p>
        </div>
        <button
            on:click={handleRefresh}
            disabled={isRefreshing}
            class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600
                   bg-white border border-slate-200 rounded-lg hover:bg-slate-50
                   disabled:opacity-50 transition-all"
        >
            <RefreshCw class="w-4 h-4 {isRefreshing ? 'animate-spin' : ''}" />
            <span class="hidden sm:inline">Refresh</span>
        </button>
    </div>

    <!-- ==========================================
         STATS CARDS
    ========================================== -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {#each statsCards as card}
            <div class="bg-white rounded-xl border border-slate-200 p-4 lg:p-5 shadow-sm
                        hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-3">
                    <div class="p-2.5 rounded-xl bg-gradient-to-br {card.bgGradient} shadow-lg">
                        <svelte:component this={card.icon} class="w-5 h-5 text-white" />
                    </div>
                </div>
                <p class="text-xl lg:text-2xl font-bold text-slate-800 mb-1">
                    {card.value}
                </p>
                <p class="text-xs text-slate-500">{card.label}</p>
                <p class="text-[11px] text-slate-400 mt-1">{card.subValue}</p>
            </div>
        {/each}
    </div>

    <!-- ==========================================
         PENJUALAN PER METODE BAYAR
    ========================================== -->
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Wallet class="w-5 h-5 text-slate-400" />
            Penjualan per Metode Bayar
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div class="p-3 bg-green-50 rounded-xl border border-green-100">
                <div class="flex items-center gap-2 mb-2">
                    <Banknote class="w-4 h-4 text-green-600" />
                    <span class="text-xs font-medium text-green-700">Tunai</span>
                </div>
                <p class="text-sm font-bold text-green-800">{safeFormatRupiah(todayStats.total_tunai)}</p>
            </div>
            <div class="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <div class="flex items-center gap-2 mb-2">
                    <QrCode class="w-4 h-4 text-purple-600" />
                    <span class="text-xs font-medium text-purple-700">QRIS</span>
                </div>
                <p class="text-sm font-bold text-purple-800">{safeFormatRupiah(todayStats.total_qris)}</p>
            </div>
            <div class="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div class="flex items-center gap-2 mb-2">
                    <Building2 class="w-4 h-4 text-blue-600" />
                    <span class="text-xs font-medium text-blue-700">Transfer</span>
                </div>
                <p class="text-sm font-bold text-blue-800">{safeFormatRupiah(todayStats.total_transfer)}</p>
            </div>
            <div class="p-3 bg-orange-50 rounded-xl border border-orange-100">
                <div class="flex items-center gap-2 mb-2">
                    <CreditCard class="w-4 h-4 text-orange-600" />
                    <span class="text-xs font-medium text-orange-700">Debit</span>
                </div>
                <p class="text-sm font-bold text-orange-800">{safeFormatRupiah(todayStats.total_debit)}</p>
            </div>
            <div class="p-3 bg-red-50 rounded-xl border border-red-100">
                <div class="flex items-center gap-2 mb-2">
                    <CreditCard class="w-4 h-4 text-red-600" />
                    <span class="text-xs font-medium text-red-700">Kredit</span>
                </div>
                <p class="text-sm font-bold text-red-800">{safeFormatRupiah(todayStats.total_kredit)}</p>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- ==========================================
             SHIFT AKTIF SAAT INI
        ========================================== -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 class="font-semibold text-slate-800 flex items-center gap-2">
                    <Activity class="w-5 h-5 text-emerald-500" />
                    Shift Aktif Saat Ini
                </h3>
                <span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                    {activeShifts.length} Aktif
                </span>
            </div>

            <div class="p-4">
                {#if activeShifts.length === 0}
                    <div class="text-center py-8">
                        <div class="w-16 h-16 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                            <Clock class="w-8 h-8 text-slate-300" />
                        </div>
                        <p class="text-slate-500 font-medium">Tidak ada shift aktif</p>
                        <p class="text-sm text-slate-400 mt-1">Belum ada kasir yang membuka shift</p>
                    </div>
                {:else}
                    <div class="space-y-3">
                        {#each activeShifts as shift}
                            {@const roleBadge = getRoleBadge(shift.kasir_role)}
                            {@const shiftPenjualan = getShiftPenjualan(shift)}
                            <div class="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                                <div class="flex items-start justify-between mb-3">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500
                                                    flex items-center justify-center text-white font-bold text-sm">
                                            {getInitials(shift.kasir_nama)}
                                        </div>
                                        <div>
                                            <p class="font-semibold text-slate-800">{shift.kasir_nama || 'Unknown'}</p>
                                            <div class="flex items-center gap-2 mt-0.5">
                                                <span class="text-xs px-1.5 py-0.5 rounded {roleBadge.color}">
                                                    {shift.kasir_role || 'kasir'}
                                                </span>
                                                {#if shift.station_nama}
                                                    <span class="text-xs text-purple-600 flex items-center gap-1">
                                                        <Monitor class="w-3 h-3" />
                                                        {shift.station_nama}
                                                    </span>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-1 px-2 py-1 bg-emerald-500 rounded-full">
                                        <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                        <span class="text-[10px] font-bold text-white">AKTIF</span>
                                    </div>
                                </div>

                                <div class="grid grid-cols-3 gap-3 text-center">
                                    <div>
                                        <p class="text-[10px] uppercase text-slate-400">Durasi</p>
                                        <p class="text-sm font-semibold text-slate-700">
                                            {formatDuration(shift.durasi_menit)}
                                        </p>
                                    </div>
                                    <div>
                                        <p class="text-[10px] uppercase text-slate-400">Transaksi</p>
                                        <p class="text-sm font-semibold text-slate-700">
                                            {shift.total_transaksi || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <p class="text-[10px] uppercase text-slate-400">Penjualan</p>
                                        <p class="text-sm font-semibold text-emerald-600">
                                            {safeFormatRupiah(shiftPenjualan)}
                                        </p>
                                    </div>
                                </div>

                                <div class="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between">
                                    <span class="text-xs text-slate-500">
                                        Mulai: {formatTime(shift.waktu_buka)}
                                    </span>
                                    <a
                                        href="/tenant/shift/{shift.id}"
                                        class="text-xs font-medium text-emerald-600 hover:text-emerald-700
                                               flex items-center gap-1"
                                    >
                                        Lihat Detail
                                        <ChevronRight class="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <!-- ==========================================
             PERFORMA KASIR HARI INI
        ========================================== -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100">
                <h3 class="font-semibold text-slate-800 flex items-center gap-2">
                    <Users class="w-5 h-5 text-indigo-500" />
                    Performa Kasir Hari Ini
                </h3>
            </div>

            <div class="p-4">
                {#if kasirPerformance.length === 0}
                    <div class="text-center py-8">
                        <div class="w-16 h-16 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                            <Users class="w-8 h-8 text-slate-300" />
                        </div>
                        <p class="text-slate-500 font-medium">Belum ada data</p>
                        <p class="text-sm text-slate-400 mt-1">Belum ada kasir yang shift hari ini</p>
                    </div>
                {:else}
                    <div class="space-y-3">
                        {#each kasirPerformance as kasir, index}
                            {@const roleBadge = getRoleBadge(kasir.kasir_role)}
                            {@const kasirPenjualan = parseFloat(kasir.total_penjualan) || 0}
                            <div class="flex items-center gap-3 p-3 rounded-xl
                                        {kasir.sedang_shift ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-100'}">
                                <!-- Rank -->
                                <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                            {index === 0 ? 'bg-amber-100 text-amber-700' : 
                                             index === 1 ? 'bg-slate-200 text-slate-600' :
                                             index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}">
                                    {index + 1}
                                </div>

                                <!-- Info -->
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <p class="font-medium text-slate-800 truncate">{kasir.kasir_nama || 'Unknown'}</p>
                                        {#if kasir.sedang_shift}
                                            <span class="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500 rounded text-[9px] text-white font-bold">
                                                <span class="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                                                AKTIF
                                            </span>
                                        {/if}
                                    </div>
                                    <div class="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span>{kasir.jumlah_shift || 0} shift</span>
                                        <span>•</span>
                                        <span>{kasir.total_transaksi || 0} trx</span>
                                    </div>
                                </div>

                                <!-- Penjualan -->
                                <div class="text-right">
                                    <p class="text-sm font-bold text-emerald-600">
                                        {safeFormatRupiah(kasirPenjualan)}
                                    </p>
                                    {#if kasir.total_selisih && kasir.total_selisih !== 0}
                                        <p class="text-[10px] {parseFloat(kasir.total_selisih) > 0 ? 'text-blue-600' : 'text-red-600'}">
                                            Selisih: {safeFormatRupiah(kasir.total_selisih)}
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- ==========================================
         SHIFT HARI INI (TABLE)
    ========================================== -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2">
                <Clock class="w-5 h-5 text-slate-400" />
                Semua Shift Hari Ini
            </h3>
            <a
                href="/tenant/shift/riwayat"
                class="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
                Lihat Semua
                <ChevronRight class="w-4 h-4" />
            </a>
        </div>

        {#if todayShifts.length === 0}
            <div class="text-center py-12">
                <div class="w-16 h-16 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                    <Receipt class="w-8 h-8 text-slate-300" />
                </div>
                <p class="text-slate-500 font-medium">Belum ada shift hari ini</p>
            </div>
        {:else}
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="bg-slate-50 text-left">
                            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kasir</th>
                            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Waktu</th>
                            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Transaksi</th>
                            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Penjualan</th>
                            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
                            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each todayShifts as shift}
                            {@const shiftPenjualan = getShiftPenjualan(shift)}
                            <tr class="hover:bg-slate-50 transition-colors">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center
                                                    text-xs font-bold text-slate-600">
                                            {getInitials(shift.kasir_nama)}
                                        </div>
                                        <div>
                                            <p class="text-sm font-medium text-slate-800">{shift.kasir_nama || 'Unknown'}</p>
                                            <p class="text-xs text-slate-400">{shift.no_shift || '-'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <p class="text-sm text-slate-700">{formatTime(shift.waktu_buka)}</p>
                                    <p class="text-xs text-slate-400">
                                        {shift.waktu_tutup ? `- ${formatTime(shift.waktu_tutup)}` : '- Aktif'}
                                    </p>
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <span class="text-sm font-medium text-slate-700">{shift.total_transaksi || 0}</span>
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <span class="text-sm font-semibold text-emerald-600">
                                        {safeFormatRupiah(shiftPenjualan)}
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-center">
                                    {#if shift.status === 'open'}
                                        <span class="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 
                                                     rounded-full text-xs font-medium">
                                            <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                            Aktif
                                        </span>
                                    {:else}
                                        <span class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 
                                                     rounded-full text-xs font-medium">
                                            <CheckCircle class="w-3 h-3" />
                                            Selesai
                                        </span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <a
                                        href="/tenant/shift/{shift.id}"
                                        class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium
                                               text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        <Eye class="w-3 h-3" />
                                        Detail
                                    </a>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>