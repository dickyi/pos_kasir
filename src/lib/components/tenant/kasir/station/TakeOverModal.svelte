<!--
    TakeOverModal.svelte
    =====================================================
    Modal konfirmasi untuk mengambil alih shift dari kasir lain.
    
    Use case:
    - Admin/Owner perlu mengambil alih kasir yang sedang istirahat
    - Pergantian shift tanpa menutup shift terlebih dahulu
    
    Props:
    - open: boolean
    - shiftData: object - Data shift yang akan di-take over
    - isLoading: boolean
    
    Events:
    - confirm: { shiftId, catatan }
    - close
=====================================================
-->
<script>
    import { 
        RefreshCw, X, User, Clock, Monitor, AlertTriangle,
        Loader2, ArrowRight, Shield
    } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { formatRupiah } from '$lib/utils/format.js';

    // ==========================================
    // PROPS
    // ==========================================
    
    /** @type {boolean} Modal terbuka */
    export let open = false;
    
    /** @type {Object|null} Data shift */
    export let shiftData = null;
    
    /** @type {boolean} Loading state */
    export let isLoading = false;
    
    /** @type {string} Nama user saat ini */
    export let currentUserName = '';

    // ==========================================
    // DISPATCHER
    // ==========================================
    const dispatch = createEventDispatcher();

    // ==========================================
    // LOCAL STATE
    // ==========================================
    
    let catatan = '';
    let confirmed = false;

    // ==========================================
    // REACTIVE
    // ==========================================
    
    $: if (open) {
        catatan = '';
        confirmed = false;
    }

    // ==========================================
    // FUNCTIONS
    // ==========================================
    
    function close() {
        if (isLoading) return;
        dispatch('close');
        open = false;
    }
    
    function handleConfirm() {
        if (isLoading || !shiftData?.id) return;
        
        if (!confirmed) {
            confirmed = true;
            return;
        }
        
        dispatch('confirm', { 
            shiftId: shiftData.id,
            catatan: catatan.trim()
        });
    }
    
    function cancelConfirm() {
        confirmed = false;
    }
    
    function handleKeydown(e) {
        if (e.key === 'Escape' && !isLoading) {
            if (confirmed) {
                confirmed = false;
            } else {
                close();
            }
        }
    }
    
    function formatTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
</script>

{#if open && shiftData}
    <!-- Backdrop -->
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center"
        on:click={close}
        on:keydown={handleKeydown}
        role="dialog"
        aria-modal="true"
    >
        <!-- Modal -->
        <div 
            transition:fly={{ y: 100, duration: 250 }}
            class="bg-white w-full lg:max-w-md lg:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl"
            style="padding-bottom: env(safe-area-inset-bottom);"
            on:click|stopPropagation
            on:keydown|stopPropagation
            role="document"
        >
            <!-- Drag Handle (Mobile) -->
            <div class="lg:hidden flex justify-center pt-3 pb-1">
                <div class="w-10 h-1 bg-slate-300 rounded-full"></div>
            </div>
            
            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <RefreshCw class="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-slate-800">Take Over Shift</h2>
                        <p class="text-xs text-slate-500">Ambil alih shift dari kasir</p>
                    </div>
                </div>
                <button 
                    type="button" 
                    on:click={close}
                    disabled={isLoading}
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-xl transition-colors"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Body -->
            <div class="p-5 space-y-4">
                <!-- Transfer Visual -->
                <div class="flex items-center justify-center gap-4 py-4">
                    <!-- From -->
                    <div class="text-center">
                        <div class="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <User class="w-7 h-7 text-slate-500" />
                        </div>
                        <p class="text-sm font-medium text-slate-700">
                            {shiftData.kasir_nama || 'Kasir'}
                        </p>
                        <p class="text-xs text-slate-400">Sekarang</p>
                    </div>
                    
                    <!-- Arrow -->
                    <div class="flex-shrink-0">
                        <ArrowRight class="w-8 h-8 text-amber-500" />
                    </div>
                    
                    <!-- To -->
                    <div class="text-center">
                        <div class="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Shield class="w-7 h-7 text-amber-600" />
                        </div>
                        <p class="text-sm font-medium text-slate-700">
                            {currentUserName || 'Anda'}
                        </p>
                        <p class="text-xs text-amber-600 font-medium">Mengambil Alih</p>
                    </div>
                </div>

                <!-- Shift Info -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div class="flex items-center gap-3 mb-3">
                        <Monitor class="w-5 h-5 text-slate-400" />
                        <span class="font-medium text-slate-700">
                            {shiftData.station_nama || 'Station'}
                        </span>
                        <span class="text-slate-400">•</span>
                        <span class="text-sm text-slate-500">{shiftData.no_shift || '-'}</span>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p class="text-slate-400 text-xs">Transaksi</p>
                            <p class="font-semibold text-slate-700">{shiftData.total_transaksi || 0}</p>
                        </div>
                        <div>
                            <p class="text-slate-400 text-xs">Penjualan</p>
                            <p class="font-semibold text-emerald-600">
                                {formatRupiah(shiftData.total_penjualan || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Warning Box -->
                <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div class="flex items-start gap-3">
                        <AlertTriangle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div class="text-sm text-amber-700">
                            <p class="font-medium mb-1">Perhatian!</p>
                            <ul class="list-disc list-inside space-y-1 text-amber-600">
                                <li>Kasir sebelumnya akan keluar otomatis</li>
                                <li>Semua transaksi setelah ini atas nama Anda</li>
                                <li>Anda bertanggung jawab atas kas shift ini</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Catatan -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                        Catatan Take Over <span class="font-normal text-slate-400">(Opsional)</span>
                    </label>
                    <textarea
                        bind:value={catatan}
                        placeholder="Alasan take over..."
                        rows="2"
                        disabled={isLoading}
                        class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm
                               focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
                               disabled:bg-slate-100 resize-none"
                    ></textarea>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-5 border-t border-slate-200 bg-slate-50">
                {#if confirmed}
                    <!-- Final Confirmation -->
                    <div 
                        transition:fly={{ y: 10, duration: 200 }}
                        class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-center"
                    >
                        <p class="text-sm text-red-700 font-medium">
                            Yakin mengambil alih shift dari {shiftData.kasir_nama}?
                        </p>
                    </div>
                    
                    <div class="flex gap-3">
                        <button 
                            type="button"
                            on:click={cancelConfirm}
                            disabled={isLoading}
                            class="flex-1 h-12 border border-slate-200 text-slate-600 rounded-xl font-semibold
                                   hover:bg-slate-100 disabled:opacity-50 transition-colors"
                        >
                            Kembali
                        </button>
                        <button 
                            type="button"
                            on:click={handleConfirm}
                            disabled={isLoading}
                            class="flex-1 h-12 bg-amber-600 text-white rounded-xl font-semibold
                                   hover:bg-amber-700 disabled:opacity-50 transition-colors
                                   flex items-center justify-center gap-2"
                        >
                            {#if isLoading}
                                <Loader2 class="w-5 h-5 animate-spin" />
                                <span>Mengambil Alih...</span>
                            {:else}
                                <RefreshCw class="w-5 h-5" />
                                <span>Ya, Ambil Alih</span>
                            {/if}
                        </button>
                    </div>
                {:else}
                    <div class="flex gap-3">
                        <button 
                            type="button"
                            on:click={close}
                            disabled={isLoading}
                            class="flex-1 h-12 border border-slate-200 text-slate-600 rounded-xl font-semibold
                                   hover:bg-slate-100 disabled:opacity-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            type="button"
                            on:click={handleConfirm}
                            disabled={isLoading}
                            class="flex-1 h-12 bg-amber-600 text-white rounded-xl font-semibold
                                   hover:bg-amber-700 disabled:opacity-50 transition-colors
                                   flex items-center justify-center gap-2
                                   shadow-lg shadow-amber-600/30"
                        >
                            <RefreshCw class="w-5 h-5" />
                            <span>Take Over</span>
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}