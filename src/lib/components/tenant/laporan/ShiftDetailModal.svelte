<!--
    ShiftDetailModal.svelte
    ============================================
    Modal detail rekap shift dengan breakdown:
    - Info shift (kasir, waktu, durasi)
    - Rekap penjualan per metode bayar
    - Kas masuk/keluar
    - Selisih kas
    ============================================
-->
<script>
    import { createEventDispatcher } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { 
        X, Clock, User, Calendar, Banknote, QrCode, 
        Building2, CreditCard, Wallet, ArrowDownCircle,
        ArrowUpCircle, CheckCircle, TrendingUp, TrendingDown,
        Receipt, AlertCircle, FileText
    } from 'lucide-svelte';

    // Import utils
    import { 
        formatRupiah, 
        formatRupiahShort, 
        formatNumber,
        formatDateLong,
        formatTime
    } from '$lib/utils/format.js';

    export let shift;

    const dispatch = createEventDispatcher();

    // Format durasi
    function formatDurasi(menit) {
        if (!menit) return '-';
        const jam = Math.floor(menit / 60);
        const sisaMenit = Math.round(menit % 60);
        if (jam > 0) {
            return `${jam} jam ${sisaMenit} menit`;
        }
        return `${sisaMenit} menit`;
    }

    // Get status color
    function getStatusColor(status) {
        return status === 'open' 
            ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
            : 'bg-slate-100 text-slate-700 border-slate-200';
    }

    function getSelisihColor(statusSelisih) {
        switch (statusSelisih) {
            case 'seimbang': return 'bg-emerald-50 border-emerald-200';
            case 'lebih': return 'bg-blue-50 border-blue-200';
            case 'kurang': return 'bg-red-50 border-red-200';
            default: return 'bg-slate-50 border-slate-200';
        }
    }

    function getSelisihTextColor(statusSelisih) {
        switch (statusSelisih) {
            case 'seimbang': return 'text-emerald-700';
            case 'lebih': return 'text-blue-700';
            case 'kurang': return 'text-red-700';
            default: return 'text-slate-700';
        }
    }

    function getSelisihIcon(statusSelisih) {
        switch (statusSelisih) {
            case 'seimbang': return CheckCircle;
            case 'lebih': return TrendingUp;
            case 'kurang': return TrendingDown;
            default: return AlertCircle;
        }
    }

    function getSelisihLabel(statusSelisih) {
        switch (statusSelisih) {
            case 'seimbang': return 'Kas Seimbang';
            case 'lebih': return 'Kas Lebih';
            case 'kurang': return 'Kas Kurang';
            default: return '-';
        }
    }

    // Sumber modal label
    function getSumberModalLabel(sumber) {
        switch (sumber) {
            case 'manual': return 'Input Manual';
            case 'shift_sebelumnya': return 'Dari Shift Sebelumnya';
            default: return sumber || '-';
        }
    }

    function close() {
        dispatch('close');
    }

    // Close on escape
    function handleKeydown(e) {
        if (e.key === 'Escape') close();
    }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Backdrop -->
<div 
    class="fixed inset-0 bg-black/50 z-50"
    transition:fade={{ duration: 200 }}
    on:click={close}
    on:keypress={() => {}}
    role="button"
    tabindex="-1"
></div>

<!-- Modal -->
<div 
    class="fixed inset-x-4 top-[5%] bottom-[5%] sm:inset-auto sm:top-1/2 sm:left-1/2 
           sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg
           bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
    transition:fly={{ y: 50, duration: 300 }}
>
    <!-- Header -->
    <div class="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <div>
            <h2 class="text-base sm:text-lg font-semibold text-slate-800">Detail Shift</h2>
            <p class="text-xs sm:text-sm text-slate-500">{shift.no_shift}</p>
        </div>
        <button
            on:click={close}
            class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
            <X class="w-5 h-5 text-slate-500" />
        </button>
    </div>

    <!-- Content - Scrollable -->
    <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        <!-- Status Badge -->
        <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full text-sm font-medium border {getStatusColor(shift.status)}">
                {shift.status === 'open' ? '🟢 Shift Aktif' : '✓ Shift Selesai'}
            </span>
        </div>

        <!-- Info Section -->
        <div class="bg-slate-50 rounded-xl p-4 space-y-3">
            <!-- Kasir -->
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <User class="w-4 h-4 text-slate-500" />
                </div>
                <div class="flex-1">
                    <p class="text-xs text-slate-500">Kasir</p>
                    <p class="text-sm font-medium text-slate-800">{shift.kasir_nama}</p>
                </div>
            </div>

            <!-- Tanggal & Waktu -->
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <Calendar class="w-4 h-4 text-slate-500" />
                </div>
                <div class="flex-1">
                    <p class="text-xs text-slate-500">Waktu</p>
                    <p class="text-sm font-medium text-slate-800">
                        {formatDateLong(shift.tanggal)}
                    </p>
                    <p class="text-xs text-slate-600">
                        {formatTime(shift.waktu_buka)}
                        {#if shift.waktu_tutup}
                            - {formatTime(shift.waktu_tutup)}
                        {:else}
                            - Sekarang
                        {/if}
                    </p>
                </div>
            </div>

            <!-- Durasi -->
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <Clock class="w-4 h-4 text-slate-500" />
                </div>
                <div class="flex-1">
                    <p class="text-xs text-slate-500">Durasi</p>
                    <p class="text-sm font-medium text-slate-800">{formatDurasi(shift.durasi_menit)}</p>
                </div>
            </div>

            <!-- Closed By (jika berbeda) -->
            {#if shift.closed_by_nama && shift.closed_by_nama !== shift.kasir_nama}
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <User class="w-4 h-4 text-slate-500" />
                    </div>
                    <div class="flex-1">
                        <p class="text-xs text-slate-500">Ditutup Oleh</p>
                        <p class="text-sm font-medium text-slate-800">{shift.closed_by_nama}</p>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Rekap Penjualan -->
        <div class="bg-white border border-slate-200 rounded-xl p-4">
            <div class="flex items-center gap-2 mb-3">
                <Receipt class="w-4 h-4 text-slate-400" />
                <h3 class="text-sm font-semibold text-slate-800">Rekap Penjualan</h3>
            </div>

            <div class="space-y-2">
                <div class="flex justify-between text-sm">
                    <span class="text-slate-600">Total Transaksi</span>
                    <span class="font-medium text-slate-800">{formatNumber(shift.total_transaksi)} transaksi</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-slate-600">Total Penjualan</span>
                    <span class="font-medium text-slate-800">{formatRupiah(shift.total_penjualan)}</span>
                </div>
                {#if shift.total_diskon > 0}
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-600">Total Diskon</span>
                        <span class="font-medium text-red-600">-{formatRupiah(shift.total_diskon)}</span>
                    </div>
                {/if}
                <div class="flex justify-between text-sm pt-2 border-t border-slate-100">
                    <span class="font-medium text-slate-700">Penjualan Bersih</span>
                    <span class="font-semibold text-emerald-600">{formatRupiah(shift.total_penjualan_bersih)}</span>
                </div>
            </div>
        </div>

        <!-- Metode Pembayaran -->
        <div class="bg-white border border-slate-200 rounded-xl p-4">
            <h3 class="text-sm font-semibold text-slate-800 mb-3">Per Metode Pembayaran</h3>
            
            <div class="space-y-2">
                {#if shift.penjualan_tunai > 0}
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <Banknote class="w-4 h-4 text-emerald-500" />
                            <span class="text-sm text-slate-600">Tunai</span>
                        </div>
                        <span class="text-sm font-medium text-slate-800">{formatRupiah(shift.penjualan_tunai)}</span>
                    </div>
                {/if}
                {#if shift.penjualan_qris > 0}
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <QrCode class="w-4 h-4 text-purple-500" />
                            <span class="text-sm text-slate-600">QRIS</span>
                        </div>
                        <span class="text-sm font-medium text-slate-800">{formatRupiah(shift.penjualan_qris)}</span>
                    </div>
                {/if}
                {#if shift.penjualan_transfer > 0}
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <Building2 class="w-4 h-4 text-blue-500" />
                            <span class="text-sm text-slate-600">Transfer</span>
                        </div>
                        <span class="text-sm font-medium text-slate-800">{formatRupiah(shift.penjualan_transfer)}</span>
                    </div>
                {/if}
                {#if shift.penjualan_debit > 0}
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <CreditCard class="w-4 h-4 text-orange-500" />
                            <span class="text-sm text-slate-600">Debit</span>
                        </div>
                        <span class="text-sm font-medium text-slate-800">{formatRupiah(shift.penjualan_debit)}</span>
                    </div>
                {/if}
                {#if shift.penjualan_kredit > 0}
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <Wallet class="w-4 h-4 text-pink-500" />
                            <span class="text-sm text-slate-600">Kredit</span>
                        </div>
                        <span class="text-sm font-medium text-slate-800">{formatRupiah(shift.penjualan_kredit)}</span>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Rekap Kas -->
        <div class="bg-white border border-slate-200 rounded-xl p-4">
            <div class="flex items-center gap-2 mb-3">
                <Banknote class="w-4 h-4 text-slate-400" />
                <h3 class="text-sm font-semibold text-slate-800">Rekap Kas</h3>
            </div>

            <div class="space-y-2">
                <div class="flex justify-between text-sm">
                    <span class="text-slate-600">Modal Awal</span>
                    <span class="font-medium text-slate-800">{formatRupiah(shift.modal_awal)}</span>
                </div>
                <div class="flex justify-between text-xs">
                    <span class="text-slate-400 pl-4">Sumber: {getSumberModalLabel(shift.sumber_modal)}</span>
                </div>
                
                <div class="flex justify-between text-sm">
                    <span class="text-slate-600">+ Penjualan Tunai</span>
                    <span class="font-medium text-emerald-600">+{formatRupiah(shift.penjualan_tunai)}</span>
                </div>
                
                {#if shift.total_kas_masuk > 0}
                    <div class="flex justify-between text-sm">
                        <div class="flex items-center gap-1">
                            <ArrowDownCircle class="w-3 h-3 text-emerald-500" />
                            <span class="text-slate-600">Kas Masuk</span>
                        </div>
                        <span class="font-medium text-emerald-600">+{formatRupiah(shift.total_kas_masuk)}</span>
                    </div>
                {/if}
                
                {#if shift.total_kas_keluar > 0}
                    <div class="flex justify-between text-sm">
                        <div class="flex items-center gap-1">
                            <ArrowUpCircle class="w-3 h-3 text-red-500" />
                            <span class="text-slate-600">Kas Keluar</span>
                        </div>
                        <span class="font-medium text-red-600">-{formatRupiah(shift.total_kas_keluar)}</span>
                    </div>
                {/if}
                
                <div class="flex justify-between text-sm pt-2 border-t border-slate-100">
                    <span class="font-medium text-slate-700">Kas Akhir (Sistem)</span>
                    <span class="font-semibold text-slate-800">{formatRupiah(shift.kas_akhir_sistem)}</span>
                </div>
                
                {#if shift.status === 'closed' && shift.kas_akhir_aktual !== null}
                    <div class="flex justify-between text-sm">
                        <span class="font-medium text-slate-700">Kas Akhir (Aktual)</span>
                        <span class="font-semibold text-slate-800">{formatRupiah(shift.kas_akhir_aktual)}</span>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Selisih Kas (jika shift sudah closed) -->
        {#if shift.status === 'closed' && shift.status_selisih}
            <div class="rounded-xl p-4 border {getSelisihColor(shift.status_selisih)}">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                        <svelte:component 
                            this={getSelisihIcon(shift.status_selisih)} 
                            class="w-5 h-5 {getSelisihTextColor(shift.status_selisih)}" 
                        />
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-semibold {getSelisihTextColor(shift.status_selisih)}">
                            {getSelisihLabel(shift.status_selisih)}
                        </p>
                        <p class="text-lg font-bold {getSelisihTextColor(shift.status_selisih)}">
                            {#if shift.selisih_kas === 0}
                                Rp 0
                            {:else}
                                {shift.selisih_kas > 0 ? '+' : ''}{formatRupiah(shift.selisih_kas)}
                            {/if}
                        </p>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Catatan -->
        {#if shift.catatan_buka || shift.catatan_tutup}
            <div class="bg-white border border-slate-200 rounded-xl p-4">
                <div class="flex items-center gap-2 mb-3">
                    <FileText class="w-4 h-4 text-slate-400" />
                    <h3 class="text-sm font-semibold text-slate-800">Catatan</h3>
                </div>
                
                {#if shift.catatan_buka}
                    <div class="mb-2">
                        <p class="text-xs text-slate-500 mb-1">Catatan Buka:</p>
                        <p class="text-sm text-slate-700 bg-slate-50 p-2 rounded">{shift.catatan_buka}</p>
                    </div>
                {/if}
                
                {#if shift.catatan_tutup}
                    <div>
                        <p class="text-xs text-slate-500 mb-1">Catatan Tutup:</p>
                        <p class="text-sm text-slate-700 bg-slate-50 p-2 rounded">{shift.catatan_tutup}</p>
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Footer -->
    <div class="px-4 py-3 sm:px-5 sm:py-4 border-t border-slate-200 flex-shrink-0">
        <button
            on:click={close}
            class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 
                   font-medium rounded-xl transition-colors"
        >
            Tutup
        </button>
    </div>
</div>