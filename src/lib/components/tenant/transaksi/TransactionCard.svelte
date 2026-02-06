<!--
    TransactionCard.svelte
    Card transaksi untuk tampilan mobile
    + Permission support untuk void/batalkan
    + Modal konfirmasi batalkan
-->
<script>
    import { enhance } from '$app/forms';
    import { Eye, XCircle, Check, Clock, Banknote, QrCode, Building2, CreditCard, Loader2, Lock, UserCircle, AlertTriangle, X } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { fly, fade } from 'svelte/transition';

    /** @type {Object} Data transaksi */
    export let transaction;
    
    /** @type {boolean} Loading state */
    export let isLoading = false;
    
    /** @type {boolean} Apakah user bisa void/batalkan (Owner only) */
    export let canVoid = false;

    const dispatch = createEventDispatcher();

    // State untuk modal konfirmasi
    let showConfirmModal = false;
    let isCancelling = false;

    // Formatting
    function formatRupiah(angka) {
        if (!angka && angka !== 0) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    function formatTime(timeStr) {
        if (!timeStr) return '-';
        return timeStr.slice(0, 5);
    }

    // Status helpers
    function getStatusText(status) {
        switch(status) {
            case 'success': return 'Sukses';
            case 'cancelled': return 'Batal';
            case 'pending': return 'Pending';
            default: return status || '-';
        }
    }

    function getStatusClass(status) {
        switch(status) {
            case 'success': return 'bg-emerald-50 text-emerald-600';
            case 'cancelled': return 'bg-red-50 text-red-600';
            case 'pending': return 'bg-amber-50 text-amber-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    }

    function getMetodeText(metode) {
        switch(metode) {
            case 'cash': return 'Tunai';
            case 'qris': return 'QRIS';
            case 'transfer': return 'Transfer';
            default: return metode || '-';
        }
    }

    function getMetodeClass(metode) {
        switch(metode) {
            case 'cash': return 'text-emerald-600';
            case 'qris': return 'text-purple-600';
            case 'transfer': return 'text-blue-600';
            default: return 'text-slate-600';
        }
    }

    function handleDetailSubmit() {
        dispatch('loadingStart');
        return async ({ result, update }) => {
            dispatch('loadingEnd');
            await update();
        };
    }

    function handleCancelSubmit() {
        isCancelling = true;
        dispatch('loadingStart');
        return async ({ result, update }) => {
            isCancelling = false;
            showConfirmModal = false;
            dispatch('loadingEnd');
            await update();
        };
    }

    function openConfirmModal() {
        showConfirmModal = true;
    }

    function closeConfirmModal() {
        showConfirmModal = false;
    }
</script>

<div class="p-4">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3 mb-3">
        <div class="min-w-0">
            <p class="font-medium text-slate-800">{transaction.no_invoice}</p>
            <p class="text-xs text-slate-500 mt-0.5">
                {formatDate(transaction.tanggal)} • {formatTime(transaction.waktu)}
            </p>
            <!-- Tampilkan kasir_nama jika ada -->
            {#if transaction.kasir_nama}
                <p class="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <UserCircle class="w-3 h-3" />
                    {transaction.kasir_nama}
                </p>
            {/if}
        </div>
        <span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded flex-shrink-0 {getStatusClass(transaction.status)}">
            {#if transaction.status === 'success'}
                <Check class="w-3 h-3" />
            {:else if transaction.status === 'cancelled'}
                <XCircle class="w-3 h-3" />
            {:else}
                <Clock class="w-3 h-3" />
            {/if}
            <span>{getStatusText(transaction.status)}</span>
        </span>
    </div>
    
    <!-- Info Row -->
    <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3 text-sm text-slate-500">
            <span class="flex items-center gap-1 {getMetodeClass(transaction.metode_bayar)}">
                {#if transaction.metode_bayar === 'cash'}
                    <Banknote class="w-4 h-4" />
                {:else if transaction.metode_bayar === 'qris'}
                    <QrCode class="w-4 h-4" />
                {:else if transaction.metode_bayar === 'transfer'}
                    <Building2 class="w-4 h-4" />
                {:else}
                    <CreditCard class="w-4 h-4" />
                {/if}
                <span>{getMetodeText(transaction.metode_bayar)}</span>
            </span>
            <span>•</span>
            <span>{transaction.total_qty || transaction.jumlah_item || 0} item</span>
        </div>
        <p class="font-semibold text-slate-800">{formatRupiah(transaction.total)}</p>
    </div>

    <!-- Actions -->
    <div class="flex gap-2 pt-3 border-t border-slate-100">
        <!-- Tombol Detail - Semua bisa akses -->
        <form method="POST" action="?/getDetail" use:enhance={handleDetailSubmit} class="flex-1">
            <input type="hidden" name="transaksi_id" value={transaction.id} />
            <button 
                type="submit" 
                disabled={isLoading}
                class="w-full py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 
                       transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {#if isLoading}
                    <Loader2 class="w-4 h-4 animate-spin" />
                {:else}
                    <Eye class="w-4 h-4" />
                {/if}
                <span>Detail</span>
            </button>
        </form>
        
        <!-- Tombol Batalkan - Hanya Owner -->
        {#if transaction.status === 'success'}
            {#if canVoid}
                <div class="flex-1">
                    <button 
                        type="button"
                        on:click={openConfirmModal}
                        disabled={isLoading}
                        class="w-full py-2 text-sm border border-red-200 text-red-600 rounded-lg 
                               hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                        Batalkan
                    </button>
                </div>
            {:else}
                <!-- Disabled button untuk non-Owner -->
                <div class="flex-1">
                    <button 
                        type="button"
                        disabled
                        class="w-full py-2 text-sm border border-slate-200 text-slate-400 rounded-lg 
                               bg-slate-50 cursor-not-allowed flex items-center justify-center gap-1"
                    >
                        <Lock class="w-3 h-3" />
                        <span>Batalkan</span>
                    </button>
                </div>
            {/if}
        {/if}
    </div>
</div>

<!-- Modal Konfirmasi Batalkan -->
{#if showConfirmModal}
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        on:click={closeConfirmModal}
        on:keypress={(e) => e.key === 'Escape' && closeConfirmModal()}
        role="dialog"
        tabindex="-1"
    >
        <div 
            transition:fly={{ y: 20, duration: 200 }}
            class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            on:click|stopPropagation
            on:keypress|stopPropagation
            role="document"
        >
            <!-- Header -->
            <div class="p-5 text-center">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle class="w-8 h-8 text-red-600" />
                </div>
                <h3 class="text-lg font-semibold text-slate-800 mb-2">
                    Batalkan Transaksi?
                </h3>
                <p class="text-slate-500 text-sm">
                    Anda akan membatalkan transaksi <span class="font-semibold text-slate-700">{transaction.no_invoice}</span>
                </p>
            </div>

            <!-- Info Transaksi -->
            <div class="px-5 pb-4">
                <div class="bg-slate-50 rounded-xl p-4 space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-500">Total</span>
                        <span class="font-semibold text-slate-800">{formatRupiah(transaction.total)}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-500">Item</span>
                        <span class="text-slate-700">{transaction.total_qty || transaction.jumlah_item || 0} produk</span>
                    </div>
                    {#if transaction.kasir_nama}
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500">Kasir</span>
                            <span class="text-slate-700">{transaction.kasir_nama}</span>
                        </div>
                    {/if}
                </div>
                
                <div class="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <p class="text-amber-700 text-xs flex items-start gap-2">
                        <AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Stok produk akan dikembalikan ke inventori. Tindakan ini tidak dapat dibatalkan.</span>
                    </p>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 p-5 border-t border-slate-200 bg-slate-50">
                <button
                    type="button"
                    on:click={closeConfirmModal}
                    disabled={isCancelling}
                    class="flex-1 h-11 border border-slate-200 text-slate-600 rounded-xl
                           hover:bg-slate-100 transition-colors font-medium text-sm disabled:opacity-50"
                >
                    Batal
                </button>
                <form 
                    method="POST" 
                    action="?/batalkan" 
                    use:enhance={handleCancelSubmit}
                    class="flex-1"
                >
                    <input type="hidden" name="transaksi_id" value={transaction.id} />
                    <button 
                        type="submit"
                        disabled={isCancelling}
                        class="w-full h-11 bg-red-600 text-white rounded-xl hover:bg-red-700
                               transition-colors font-medium text-sm flex items-center justify-center gap-2
                               disabled:opacity-50"
                    >
                        {#if isCancelling}
                            <Loader2 class="w-4 h-4 animate-spin" />
                            <span>Membatalkan...</span>
                        {:else}
                            <XCircle class="w-4 h-4" />
                            <span>Ya, Batalkan</span>
                        {/if}
                    </button>
                </form>
            </div>
        </div>
    </div>
{/if}