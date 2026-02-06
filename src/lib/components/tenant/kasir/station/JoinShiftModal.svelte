<!--
    JoinShiftModal.svelte
    =====================================================
    Modal konfirmasi untuk bergabung ke shift yang sudah ada.
    
    Use case:
    - Admin/Owner ingin membantu kasir yang sedang shift
    - User bergabung tanpa mengambil alih kepemilikan shift
    
    Props:
    - open: boolean
    - shiftData: object - Data shift yang akan di-join
    - isLoading: boolean
    
    Events:
    - confirm: { shiftId }
    - close
=====================================================
-->
<script>
    import { 
        Users, X, User, Clock, Monitor, AlertCircle,
        Loader2, CheckCircle, Info
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

    // ==========================================
    // DISPATCHER
    // ==========================================
    const dispatch = createEventDispatcher();

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
        dispatch('confirm', { shiftId: shiftData.id });
    }
    
    function handleKeydown(e) {
        if (e.key === 'Escape' && !isLoading) close();
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
            <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Users class="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-slate-800">Join Shift</h2>
                        <p class="text-xs text-slate-500">Bergabung ke shift yang ada</p>
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
                <!-- Shift Info Card -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Monitor class="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p class="font-semibold text-slate-800">
                                {shiftData.station_nama || 'Station'}
                            </p>
                            <p class="text-xs text-slate-500">{shiftData.no_shift || '-'}</p>
                        </div>
                    </div>
                    
                    <div class="space-y-2 text-sm">
                        <div class="flex items-center gap-2">
                            <User class="w-4 h-4 text-slate-400" />
                            <span class="text-slate-600">Kasir:</span>
                            <span class="font-medium text-slate-800">
                                {shiftData.kasir_nama || 'Unknown'}
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Clock class="w-4 h-4 text-slate-400" />
                            <span class="text-slate-600">Mulai:</span>
                            <span class="font-medium text-slate-800">
                                {formatTime(shiftData.waktu_buka)}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Info Box -->
                <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div class="flex items-start gap-3">
                        <Info class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div class="text-sm text-blue-700">
                            <p class="font-medium mb-1">Apa yang terjadi?</p>
                            <ul class="list-disc list-inside space-y-1 text-blue-600">
                                <li>Anda dapat melakukan transaksi di shift ini</li>
                                <li>Transaksi tercatat di shift yang sama</li>
                                <li>Kepemilikan shift tetap di kasir asli</li>
                                <li>Anda bisa keluar kapan saja</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-5 border-t border-slate-200 bg-slate-50">
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
                        class="flex-1 h-12 bg-blue-600 text-white rounded-xl font-semibold
                               hover:bg-blue-700 disabled:opacity-50 transition-colors
                               flex items-center justify-center gap-2
                               shadow-lg shadow-blue-600/30"
                    >
                        {#if isLoading}
                            <Loader2 class="w-5 h-5 animate-spin" />
                            <span>Bergabung...</span>
                        {:else}
                            <Users class="w-5 h-5" />
                            <span>Bergabung</span>
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}