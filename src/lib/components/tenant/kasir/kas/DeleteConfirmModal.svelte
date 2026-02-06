<!--
    DeleteConfirmModal.svelte
    ============================================
    Modal konfirmasi hapus kas dengan input alasan
    - Lebih user-friendly dari browser confirm()
    - Mendukung input alasan penghapusan
    - Responsive (mobile-friendly)
    ============================================
-->
<script>
    import { createEventDispatcher } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { 
        X, AlertTriangle, Trash2, Loader2
    } from 'lucide-svelte';
    import { formatRupiah } from '$lib/utils/format.js';

    /** @type {boolean} */
    export let open = false;

    /** @type {Object|null} - Data kas yang akan dihapus */
    export let kas = null;

    /** @type {string} - Alasan penghapusan */
    export let reason = '';

    /** @type {boolean} - Sedang proses hapus */
    export let isLoading = false;

    const dispatch = createEventDispatcher();

    function close() {
        if (isLoading) return;
        dispatch('close');
        open = false;
    }

    function confirm() {
        dispatch('confirm');
    }

    function handleKeydown(e) {
        if (e.key === 'Escape' && !isLoading) close();
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open && kas}
    <!-- Backdrop -->
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        on:click={close}
        on:keypress={() => {}}
        role="button"
        tabindex="-1"
    >
        <!-- Modal -->
        <div 
            transition:fly={{ y: 50, duration: 200 }}
            class="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl"
            on:click|stopPropagation
            on:keypress|stopPropagation
            role="dialog"
            aria-modal="true"
        >
            <!-- Header -->
            <div class="bg-red-50 px-6 py-4 border-b border-red-100">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle class="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h2 class="text-lg font-semibold text-red-800">Hapus Kas</h2>
                        <p class="text-sm text-red-600">Tindakan ini tidak dapat dibatalkan</p>
                    </div>
                </div>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-4">
                <!-- Kas Info -->
                <div class="bg-slate-50 rounded-xl p-4 space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-slate-500">No. Referensi</span>
                        <span class="text-sm font-medium text-slate-800">{kas.no_referensi}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-slate-500">Tipe</span>
                        <span class="text-sm font-medium px-2 py-0.5 rounded-full
                                    {kas.tipe === 'masuk' 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : 'bg-red-100 text-red-700'}">
                            {kas.tipe === 'masuk' ? 'Kas Masuk' : 'Kas Keluar'}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-slate-500">Jumlah</span>
                        <span class="text-sm font-bold {kas.tipe === 'masuk' ? 'text-emerald-600' : 'text-red-600'}">
                            {kas.tipe === 'masuk' ? '+' : '-'}{formatRupiah(kas.jumlah)}
                        </span>
                    </div>
                    {#if kas.keterangan}
                        <div class="pt-2 border-t border-slate-200">
                            <span class="text-sm text-slate-500">Keterangan:</span>
                            <p class="text-sm text-slate-700 mt-1">{kas.keterangan}</p>
                        </div>
                    {/if}
                </div>

                <!-- Warning -->
                <div class="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p class="text-xs text-amber-700">
                        Kas yang dihapus akan masuk ke arsip dan tidak akan dihitung dalam laporan. 
                        Data tidak akan hilang sepenuhnya dan bisa dilihat oleh admin.
                    </p>
                </div>

                <!-- Reason Input -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                        Alasan Penghapusan <span class="text-slate-400">(opsional)</span>
                    </label>
                    <textarea
                        bind:value={reason}
                        disabled={isLoading}
                        rows="2"
                        placeholder="Contoh: Input salah, double entry, dll."
                        class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none
                               focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100
                               disabled:bg-slate-50 disabled:text-slate-400"
                    ></textarea>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                    type="button"
                    on:click={close}
                    disabled={isLoading}
                    class="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl 
                           font-medium hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                    Batal
                </button>
                <button
                    type="button"
                    on:click={confirm}
                    disabled={isLoading}
                    class="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium 
                           hover:bg-red-700 disabled:opacity-50 transition-colors
                           flex items-center justify-center gap-2"
                >
                    {#if isLoading}
                        <Loader2 class="w-5 h-5 animate-spin" />
                        <span>Menghapus...</span>
                    {:else}
                        <Trash2 class="w-5 h-5" />
                        <span>Hapus Kas</span>
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}