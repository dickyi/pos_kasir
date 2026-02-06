<!--
    +page.svelte - Riwayat Shift (FIXED)
    =====================================================
    Halaman untuk melihat history semua shift
    
    FIXED: 
    - Safe access untuk semua property
    - Handle undefined/null data
    - Proper error handling
-->
<script>
    import { 
        Clock, User, Receipt, Filter, Download, Eye, ChevronLeft, ChevronRight,
        Calendar, UserCircle, CheckCircle, XCircle, TrendingUp, Search, AlertCircle
    } from 'lucide-svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { formatRupiah } from '$lib/utils/format.js';

    export let data;

    // ✅ FIXED: Safe access dengan default values
    $: shifts = data?.shifts || [];
    $: kasirList = data?.kasirList || [];
    $: pagination = data?.pagination || { page: 1, limit: 20, totalRecords: 0, totalPages: 1, hasNext: false, hasPrev: false };
    $: filters = data?.filters || { tanggal: '', kasir: '', status: '' };

    // Filter state - initialize dari filters
    let filterTanggal = '';
    let filterKasir = '';
    let filterStatus = '';

    // ✅ FIXED: Reactive update filter state saat data berubah
    $: {
        filterTanggal = filters.tanggal || '';
        filterKasir = filters.kasir || '';
        filterStatus = filters.status || '';
    }

    // Apply filter
    function applyFilter() {
        const params = new URLSearchParams();
        
        if (filterTanggal) params.set('tanggal', filterTanggal);
        if (filterKasir) params.set('kasir', filterKasir);
        if (filterStatus) params.set('status', filterStatus);
        params.set('page', '1');
        
        goto(`/tenant/shift/riwayat?${params.toString()}`);
    }

    // Reset filter
    function resetFilter() {
        filterTanggal = '';
        filterKasir = '';
        filterStatus = '';
        goto('/tenant/shift/riwayat');
    }

    // Pagination
    function goToPage(pageNum) {
        const params = new URLSearchParams();
        
        if (filterTanggal) params.set('tanggal', filterTanggal);
        if (filterKasir) params.set('kasir', filterKasir);
        if (filterStatus) params.set('status', filterStatus);
        params.set('page', pageNum.toString());
        
        goto(`/tenant/shift/riwayat?${params.toString()}`);
    }

    // ✅ FIXED: Helper functions dengan null check
    function formatDate(dateString) {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return '-';
        }
    }

    function formatTime(dateString) {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '-';
        }
    }

    function formatDuration(start, end) {
        if (!start) return '-';
        try {
            const endTime = end ? new Date(end) : new Date();
            const diffMs = endTime - new Date(start);
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}j ${minutes}m`;
        } catch (e) {
            return '-';
        }
    }

    function getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    // ✅ FIXED: Safe rupiah format
    function safeFormatRupiah(value) {
        try {
            return formatRupiah(value || 0);
        } catch (e) {
            return 'Rp 0';
        }
    }

    // ✅ FIXED: Helper untuk hitung penjualan shift dengan fallback
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
</script>

<svelte:head>
    <title>Riwayat Shift - Monitoring Kasir</title>
</svelte:head>

<div class="space-y-6">
    <!-- ==========================================
         FILTER SECTION
    ========================================== -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-4">
            <Filter class="w-5 h-5 text-slate-400" />
            <h3 class="font-semibold text-slate-800">Filter Data</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Filter Tanggal -->
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                    Tanggal
                </label>
                <div class="relative">
                    <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="date"
                        bind:value={filterTanggal}
                        class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>
            </div>

            <!-- Filter Kasir -->
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                    Kasir
                </label>
                <div class="relative">
                    <UserCircle class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                        bind:value={filterKasir}
                        class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                               appearance-none bg-white"
                    >
                        <option value="">Semua Kasir</option>
                        {#each kasirList as kasir}
                            <option value={kasir.id}>{kasir.nama || kasir.email || 'Unknown'}</option>
                        {/each}
                    </select>
                </div>
            </div>

            <!-- Filter Status -->
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                    Status
                </label>
                <select
                    bind:value={filterStatus}
                    class="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm
                           focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                    <option value="">Semua Status</option>
                    <option value="open">Aktif</option>
                    <option value="closed">Selesai</option>
                </select>
            </div>

            <!-- Buttons -->
            <div class="flex items-end gap-2">
                <button
                    on:click={applyFilter}
                    class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium
                           hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Search class="w-4 h-4" />
                    Cari
                </button>
                <button
                    on:click={resetFilter}
                    class="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium
                           hover:bg-slate-50 transition-colors"
                >
                    Reset
                </button>
            </div>
        </div>
    </div>

    <!-- ==========================================
         TABLE
    ========================================== -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
                <h3 class="font-semibold text-slate-800 flex items-center gap-2">
                    <Clock class="w-5 h-5 text-slate-400" />
                    Riwayat Shift
                </h3>
                <p class="text-sm text-slate-500 mt-1">
                    Total: {pagination.totalRecords || 0} shift
                </p>
            </div>
            <button
                class="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium
                       hover:bg-slate-50 transition-colors"
            >
                <Download class="w-4 h-4" />
                <span class="hidden sm:inline">Export</span>
            </button>
        </div>

        {#if !shifts || shifts.length === 0}
            <div class="text-center py-12">
                <div class="w-16 h-16 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                    <Receipt class="w-8 h-8 text-slate-300" />
                </div>
                <p class="text-slate-500 font-medium">Tidak ada data shift</p>
                <p class="text-sm text-slate-400 mt-1">Belum ada shift yang dibuat atau sesuai filter</p>
            </div>
        {:else}
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="bg-slate-50 text-left">
                            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">No Shift</th>
                            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kasir</th>
                            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Waktu</th>
                            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Transaksi</th>
                            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Penjualan</th>
                            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Selisih</th>
                            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
                            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each shifts as shift (shift?.id || Math.random())}
                            {#if shift}
                                <tr class="hover:bg-slate-50 transition-colors">
                                    <td class="px-4 py-3">
                                        <div>
                                            <p class="text-sm font-medium text-slate-800">{shift.no_shift || '-'}</p>
                                            <p class="text-xs text-slate-400">{formatDate(shift.tanggal)}</p>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center
                                                        text-xs font-bold text-slate-600">
                                                {getInitials(shift.kasir_nama)}
                                            </div>
                                            <div>
                                                <p class="text-sm font-medium text-slate-800">{shift.kasir_nama || 'Unknown'}</p>
                                                <p class="text-xs text-slate-400">{shift.kasir_email || '-'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3">
                                        <p class="text-sm text-slate-700">{formatTime(shift.waktu_buka)}</p>
                                        {#if shift.waktu_tutup}
                                            <p class="text-xs text-slate-400">- {formatTime(shift.waktu_tutup)}</p>
                                            <p class="text-xs text-slate-500 mt-0.5">
                                                ({formatDuration(shift.waktu_buka, shift.waktu_tutup)})
                                            </p>
                                        {:else}
                                            <p class="text-xs text-emerald-600 font-medium">Sedang Aktif</p>
                                        {/if}
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <span class="text-sm font-medium text-slate-700">{shift.total_transaksi || 0}</span>
                                    </td>
                                    <td class="px-4 py-3 text-right">
                                        <span class="text-sm font-semibold text-emerald-600">
                                            {safeFormatRupiah(getShiftPenjualan(shift))}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        {#if shift.selisih_kas !== null && shift.selisih_kas !== undefined}
                                            {@const selisih = parseFloat(shift.selisih_kas) || 0}
                                            <span class="text-sm font-medium {
                                                selisih === 0 ? 'text-slate-600' :
                                                selisih > 0 ? 'text-blue-600' : 'text-red-600'
                                            }">
                                                {safeFormatRupiah(selisih)}
                                            </span>
                                        {:else}
                                            <span class="text-xs text-slate-400">-</span>
                                        {/if}
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
                            {/if}
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            {#if pagination.totalPages > 1}
                <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
                    <p class="text-sm text-slate-500">
                        Halaman {pagination.page} dari {pagination.totalPages}
                    </p>
                    <div class="flex gap-2">
                        <button
                            on:click={() => goToPage(pagination.page - 1)}
                            disabled={!pagination.hasPrev}
                            class="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm
                                   hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                                   flex items-center gap-1"
                        >
                            <ChevronLeft class="w-4 h-4" />
                            <span class="hidden sm:inline">Prev</span>
                        </button>
                        <button
                            on:click={() => goToPage(pagination.page + 1)}
                            disabled={!pagination.hasNext}
                            class="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm
                                   hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                                   flex items-center gap-1"
                        >
                            <span class="hidden sm:inline">Next</span>
                            <ChevronRight class="w-4 h-4" />
                        </button>
                    </div>
                </div>
            {/if}
        {/if}
    </div>
</div>