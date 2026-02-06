<!--
    ForceCloseModal.svelte
    =====================================================
    Modal konfirmasi untuk menutup paksa shift (Owner only).
    
    Use case:
    - Kasir tidak hadir/sakit
    - Darurat, perlu tutup shift tanpa kasir
    - Kas tidak bisa dihitung secara normal
    
    Props:
    - open: boolean
    - shiftData: object - Data shift yang akan ditutup paksa
    - isLoading: boolean
    
    Events:
    - confirm: { shiftId, catatan }
    - close
=====================================================
-->
<script>
    import { 
        Power, X, User, Clock, Monitor, AlertTriangle,
        Loader2, XCircle, ShieldAlert, Banknote
    } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { fly, fade, scale } from 'svelte/transition';
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

    // ==========================================
    // DISPATCHER
    // ==========================================
    const dispatch = createEventDispatcher();

    // ==========================================
    // LOCAL STATE
    // ==========================================
    
    let catatan = '';
    let confirmText = '';
    let step = 1; // 1 = form, 2 = final confirm

    // ==========================================
    // REACTIVE
    // ==========================================
    
    $: if (open) {
        catatan = '';
        confirmText = '';
        step = 1;
    }
    
    $: canProceed = catatan.trim().length >= 5; // Minimal 5 karakter alasan
    $: canConfirm = confirmText.toUpperCase() === 'TUTUP PAKSA';

    // ==========================================
    // COMPUTED
    // ==========================================
    
    $: kasAkhirSistem = (parseFloat(shiftData?.modal_awal) || 0) + 
                        (parseFloat(shiftData?.penjualan_tunai) || 0) +
                        (parseFloat(shiftData?.total_kas_masuk) || 0) -
                        (parseFloat(shiftData?.total_kas_keluar) || 0);

    // ==========================================
    // FUNCTIONS
    // ==========================================
    
    function close() {
        if (isLoading) return;
        dispatch('close');
        open = false;
    }
    
    function goToStep2() {
        if (!canProceed) return;
        step = 2;
    }
    
    function goBack() {
        step = 1;
        confirmText = '';
    }
    
    function handleConfirm() {
        if (isLoading || !shiftData?.id || !canConfirm) return;
        
        dispatch('confirm', { 
            shiftId: shiftData.id,
            catatan: catatan.trim()
        });
    }
    
    function handleKeydown(e) {
        if (e.key === 'Escape' && !isLoading) {
            if (step === 2) {
                goBack();
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
            <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-red-50 to-rose-50">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                        <Power class="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-slate-800">Force Close Shift</h2>
                        <p class="text-xs text-red-500 font-medium">⚠️ Owner Only - Tindakan Darurat</p>
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
                {#if step === 1}
                    <!-- Step 1: Form -->
                    <div transition:fly={{ x: -20, duration: 200 }}>
                        <!-- Shift Info -->
                        <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                            <div class="flex items-center gap-3 mb-3">
                                <Monitor class="w-5 h-5 text-slate-400" />
                                <span class="font-medium text-slate-700">
                                    {shiftData.station_nama || 'Station'}
                                </span>
                            </div>
                            
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-slate-500">Kasir</span>
                                    <span class="font-medium">{shiftData.kasir_nama || '-'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-slate-500">Mulai</span>
                                    <span class="font-medium">{formatTime(shiftData.waktu_buka)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-slate-500">Transaksi</span>
                                    <span class="font-medium">{shiftData.total_transaksi || 0}</span>
                                </div>
                                <div class="flex justify-between border-t border-slate-200 pt-2 mt-2">
                                    <span class="text-slate-500">Kas Akhir (Sistem)</span>
                                    <span class="font-bold text-emerald-600">{formatRupiah(kasAkhirSistem)}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Severe Warning -->
                        <div class="p-4 bg-red-50 border-2 border-red-200 rounded-xl mb-4">
                            <div class="flex items-start gap-3">
                                <ShieldAlert class="w-6 h-6 text-red-500 flex-shrink-0" />
                                <div class="text-sm text-red-700">
                                    <p class="font-bold mb-2">PERINGATAN SERIUS!</p>
                                    <ul class="list-disc list-inside space-y-1 text-red-600">
                                        <li>Shift akan ditutup TANPA verifikasi kas</li>
                                        <li>Selisih kas akan di-set otomatis ke Rp 0</li>
                                        <li>Kasir asli tidak dapat memverifikasi</li>
                                        <li>Tindakan ini akan dicatat dalam log</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- Catatan Wajib -->
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">
                                Alasan Force Close <span class="text-red-500">*</span>
                            </label>
                            <textarea
                                bind:value={catatan}
                                placeholder="Jelaskan alasan menutup paksa shift ini (min. 5 karakter)..."
                                rows="3"
                                disabled={isLoading}
                                class="w-full px-4 py-3 border-2 rounded-xl text-sm
                                       {catatan.trim().length >= 5 
                                           ? 'border-slate-200 focus:border-red-500' 
                                           : 'border-red-200'}
                                       focus:outline-none focus:ring-2 focus:ring-red-500/20
                                       disabled:bg-slate-100 resize-none"
                            ></textarea>
                            {#if catatan.trim().length > 0 && catatan.trim().length < 5}
                                <p class="text-xs text-red-500 mt-1">Minimal 5 karakter</p>
                            {/if}
                        </div>
                    </div>
                {:else}
                    <!-- Step 2: Final Confirmation -->
                    <div transition:fly={{ x: 20, duration: 200 }}>
                        <!-- Danger Zone -->
                        <div 
                            class="text-center py-6 bg-red-50 rounded-xl border-2 border-red-200 mb-4"
                        >
                            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <XCircle class="w-10 h-10 text-red-500" />
                            </div>
                            <h3 class="text-lg font-bold text-red-800 mb-1">Konfirmasi Final</h3>
                            <p class="text-sm text-red-600">Tindakan ini tidak dapat dibatalkan!</p>
                        </div>

                        <!-- Confirmation Input -->
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">
                                Ketik <span class="font-bold text-red-600">TUTUP PAKSA</span> untuk konfirmasi
                            </label>
                            <input
                                type="text"
                                bind:value={confirmText}
                                placeholder="TUTUP PAKSA"
                                disabled={isLoading}
                                class="w-full h-14 px-4 border-2 rounded-xl text-center text-lg font-bold uppercase
                                       {canConfirm ? 'border-red-500 bg-red-50' : 'border-slate-200'}
                                       focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                                       disabled:bg-slate-100"
                            />
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Footer -->
            <div class="p-5 border-t border-slate-200 bg-slate-50">
                {#if step === 1}
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
                            on:click={goToStep2}
                            disabled={!canProceed || isLoading}
                            class="flex-1 h-12 bg-red-600 text-white rounded-xl font-semibold
                                   hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed
                                   transition-colors flex items-center justify-center gap-2"
                        >
                            <AlertTriangle class="w-5 h-5" />
                            <span>Lanjutkan</span>
                        </button>
                    </div>
                {:else}
                    <div class="flex gap-3">
                        <button 
                            type="button"
                            on:click={goBack}
                            disabled={isLoading}
                            class="flex-1 h-12 border border-slate-200 text-slate-600 rounded-xl font-semibold
                                   hover:bg-slate-100 disabled:opacity-50 transition-colors"
                        >
                            Kembali
                        </button>
                        <button 
                            type="button"
                            on:click={handleConfirm}
                            disabled={!canConfirm || isLoading}
                            class="flex-1 h-12 bg-red-600 text-white rounded-xl font-semibold
                                   hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed
                                   transition-colors flex items-center justify-center gap-2
                                   shadow-lg shadow-red-600/30"
                        >
                            {#if isLoading}
                                <Loader2 class="w-5 h-5 animate-spin" />
                                <span>Menutup...</span>
                            {:else}
                                <Power class="w-5 h-5" />
                                <span>Force Close</span>
                            {/if}
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}