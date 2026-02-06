<!--
    BukaShiftModal.svelte
    =====================================================
    Modal untuk membuka shift baru dengan 3 pilihan sumber modal:
    1. Manual - Input modal awal secara manual
    2. Shift Sebelumnya - Lanjutkan kas dari shift terakhir
    3. Auto - Gunakan modal default dari pengaturan
    
    UPDATED - Full 3 Mode Support:
    1. SINGLE MODE - 1 shift untuk seluruh toko
    2. PER USER MODE - Setiap kasir punya shift sendiri
    3. MULTI STATION MODE - 1 shift per mesin kasir
    
    Props baru:
    - kasirMode: 'single' | 'per_user' | 'multi'
    - isPerUserMode: boolean
    - isMultiMode: boolean
    - selectedStationName: string|null (untuk Multi Mode)
    =====================================================
-->
<script>
    import { 
        Play, X, Wallet, ArrowRight, Clock, RefreshCw, 
        Settings, AlertCircle, Loader2, Banknote,
        CheckCircle, Info, ChevronRight, History,
        User, Users, Monitor
    } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { fly, fade, scale } from 'svelte/transition';
    import { formatRupiah } from '$lib/utils/format.js';

    // ==========================================
    // PROPS
    // ==========================================
    
    /** @type {boolean} Apakah modal terbuka */
    export let open = false;
    
    /** @type {Object|null} Info shift terakhir yang sudah ditutup */
    export let lastShiftInfo = null;
    
    /** @type {number} Modal default dari pengaturan */
    export let defaultModal = 0;
    
    /** @type {boolean} Sedang dalam proses */
    export let isLoading = false;
    
    /** @type {string|null} Nama kasir/user yang buka shift */
    export let userName = '';
    
    /** @type {boolean} Apakah multi-shift diizinkan */
    export let allowMultiShift = false;
    
    /** @type {number} Shift ke berapa hari ini */
    export let shiftKeHariIni = 1;
    
    // ==========================================
    // NEW PROPS - 3 Mode Support
    // ==========================================
    
    /** @type {'single'|'per_user'|'multi'} Mode kasir aktif */
    export let kasirMode = 'single';
    
    /** @type {boolean} Apakah mode Per User */
    export let isPerUserMode = false;
    
    /** @type {boolean} Apakah mode Multi Station */
    export let isMultiMode = false;
    
    /** @type {string|null} Nama station yang dipilih (untuk Multi Mode) */
    export let selectedStationName = null;

    // ==========================================
    // DISPATCHER
    // ==========================================
    const dispatch = createEventDispatcher();

    // ==========================================
    // LOCAL STATE
    // ==========================================
    
    /** @type {'manual'|'shift_sebelumnya'|'auto'} Sumber modal yang dipilih */
    let sumberModal = 'manual';
    
    /** @type {number} Nilai modal awal (untuk input manual) */
    let modalAwal = 0;
    
    /** @type {string} Catatan pembukaan shift */
    let catatan = '';
    
    /** @type {string|null} Error message */
    let errorMessage = null;

    // ==========================================
    // MODE INFO
    // ==========================================
    const modeInfo = {
        'single': { 
            label: 'Single Mode', 
            icon: Monitor, 
            color: 'blue',
            description: 'Shift tunggal untuk seluruh toko'
        },
        'per_user': { 
            label: 'Per Kasir', 
            icon: User, 
            color: 'green',
            description: 'Shift pribadi untuk Anda'
        },
        'multi': { 
            label: 'Multi Station', 
            icon: Users, 
            color: 'purple',
            description: 'Shift untuk station tertentu'
        }
    };
    
    $: currentModeInfo = modeInfo[kasirMode] || modeInfo.single;

    // ==========================================
    // REACTIVE
    // ==========================================
    
    // Reset state ketika modal dibuka
    $: if (open) {
        resetState();
    }
    
    // Hitung modal final berdasarkan sumber yang dipilih
    $: modalFinal = calculateModalFinal(sumberModal, modalAwal, lastShiftInfo, defaultModal);
    
    // Validasi form
    $: canSubmit = validateForm(sumberModal, modalAwal, lastShiftInfo, defaultModal);
    
    // Cek apakah opsi shift sebelumnya tersedia
    $: hasLastShift = lastShiftInfo && lastShiftInfo.kas_akhir !== null && lastShiftInfo.kas_akhir !== undefined;
    
    // Cek apakah opsi auto tersedia
    $: hasDefaultModal = defaultModal > 0;

    // ==========================================
    // FUNCTIONS
    // ==========================================
    
    function resetState() {
        // Default ke manual jika tidak ada opsi lain
        if (hasLastShift) {
            sumberModal = 'shift_sebelumnya';
        } else if (hasDefaultModal) {
            sumberModal = 'auto';
        } else {
            sumberModal = 'manual';
        }
        modalAwal = 0;
        catatan = '';
        errorMessage = null;
    }
    
    function calculateModalFinal(sumber, manual, lastInfo, defaultVal) {
        switch (sumber) {
            case 'manual':
                return manual || 0;
            case 'shift_sebelumnya':
                return lastInfo?.kas_akhir || 0;
            case 'auto':
                return defaultVal || 0;
            default:
                return 0;
        }
    }
    
    function validateForm(sumber, manual, lastInfo, defaultVal) {
        switch (sumber) {
            case 'manual':
                return manual > 0;
            case 'shift_sebelumnya':
                return lastInfo && lastInfo.kas_akhir > 0;
            case 'auto':
                return defaultVal > 0;
            default:
                return false;
        }
    }
    
    function close() {
        if (isLoading) return;
        dispatch('close');
        open = false;
    }
    
    function handleSubmit() {
        if (!canSubmit || isLoading) return;
        
        errorMessage = null;
        
        // Validasi tambahan
        if (modalFinal < 0) {
            errorMessage = 'Modal awal tidak boleh negatif!';
            return;
        }
        
        dispatch('submit', {
            sumberModal,
            modalAwal: modalFinal,
            catatan: catatan.trim()
        });
    }
    
    function handleKeydown(e) {
        if (e.key === 'Escape' && !isLoading) close();
        if (e.key === 'Enter' && canSubmit && !isLoading) handleSubmit();
    }
    
    function selectSumberModal(sumber) {
        if (isLoading) return;
        
        // Validasi ketersediaan opsi
        if (sumber === 'shift_sebelumnya' && !hasLastShift) return;
        if (sumber === 'auto' && !hasDefaultModal) return;
        
        sumberModal = sumber;
        
        // Reset modal manual jika pindah dari manual
        if (sumber !== 'manual') {
            modalAwal = 0;
        }
    }
    
    function formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    function getCurrentTime() {
        return new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
    
    function getCurrentDate() {
        return new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
</script>

{#if open}
    <!-- Backdrop -->
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center"
        on:click={close}
        on:keydown={handleKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
    >
        <!-- Modal Container -->
        <div 
            transition:fly={{ y: 100, duration: 250 }}
            class="bg-white w-full lg:max-w-lg lg:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            style="padding-bottom: env(safe-area-inset-bottom);"
            on:click|stopPropagation
            on:keydown|stopPropagation
            role="document"
        >
            <!-- Drag Handle (Mobile) -->
            <div class="lg:hidden flex justify-center pt-3 pb-1">
                <div class="w-10 h-1 bg-slate-300 rounded-full"></div>
            </div>
            
            <!-- ==========================================
                 HEADER
            ========================================== -->
            <div class="flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 border-b border-slate-200 
                        {isPerUserMode ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 
                         isMultiMode ? 'bg-gradient-to-r from-purple-50 to-indigo-50' :
                         'bg-gradient-to-r from-emerald-50 to-teal-50'}">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 {isPerUserMode ? 'bg-green-500' : isMultiMode ? 'bg-purple-500' : 'bg-emerald-500'} rounded-xl flex items-center justify-center shadow-lg 
                                {isPerUserMode ? 'shadow-green-500/30' : isMultiMode ? 'shadow-purple-500/30' : 'shadow-emerald-500/30'}">
                        <Play class="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 id="modal-title" class="text-lg font-bold text-slate-800">
                            Buka Shift
                        </h2>
                        <p class="text-xs text-slate-500">
                            {getCurrentDate()}
                        </p>
                    </div>
                </div>
                <button 
                    type="button" 
                    on:click={close}
                    disabled={isLoading}
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-xl transition-colors disabled:opacity-50"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- ==========================================
                 BODY - Scrollable
            ========================================== -->
            <div class="flex-1 overflow-y-auto p-4 lg:p-5 space-y-4">
                
                <!-- ==========================================
                     MODE BADGE (NEW)
                ========================================== -->
                <div class="flex items-center gap-2 p-3 rounded-xl border
                            {isPerUserMode ? 'bg-green-50 border-green-200' : 
                             isMultiMode ? 'bg-purple-50 border-purple-200' : 
                             'bg-blue-50 border-blue-200'}">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center
                                {isPerUserMode ? 'bg-green-100' : 
                                 isMultiMode ? 'bg-purple-100' : 
                                 'bg-blue-100'}">
                        <svelte:component 
                            this={currentModeInfo.icon} 
                            class="w-4 h-4 {isPerUserMode ? 'text-green-600' : isMultiMode ? 'text-purple-600' : 'text-blue-600'}" 
                        />
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-semibold {isPerUserMode ? 'text-green-800' : isMultiMode ? 'text-purple-800' : 'text-blue-800'}">
                            {currentModeInfo.label}
                        </p>
                        <p class="text-xs {isPerUserMode ? 'text-green-600' : isMultiMode ? 'text-purple-600' : 'text-blue-600'}">
                            {currentModeInfo.description}
                        </p>
                    </div>
                    {#if isMultiMode && selectedStationName}
                        <div class="px-2 py-1 bg-purple-100 rounded-lg">
                            <p class="text-xs font-medium text-purple-700">
                                <Monitor class="w-3 h-3 inline mr-1" />
                                {selectedStationName}
                            </p>
                        </div>
                    {/if}
                </div>

                <!-- Info Kasir & Waktu -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 {isPerUserMode ? 'bg-green-100' : 'bg-blue-100'} rounded-lg flex items-center justify-center">
                                <Clock class="w-4 h-4 {isPerUserMode ? 'text-green-600' : 'text-blue-600'}" />
                            </div>
                            <div>
                                <p class="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Waktu</p>
                                <p class="text-sm font-semibold text-slate-700">{getCurrentTime()}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <History class="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                                <p class="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Shift Ke</p>
                                <p class="text-sm font-semibold text-slate-700">#{shiftKeHariIni}</p>
                            </div>
                        </div>
                    </div>
                    {#if userName}
                        <div class="mt-3 pt-3 border-t border-slate-200">
                            <p class="text-xs text-slate-500">
                                Kasir: <span class="font-semibold text-slate-700">{userName}</span>
                                {#if isPerUserMode}
                                    <span class="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium">
                                        Shift Pribadi
                                    </span>
                                {/if}
                            </p>
                        </div>
                    {/if}
                </div>

                <!-- Error Message -->
                {#if errorMessage}
                    <div 
                        transition:fly={{ y: -10, duration: 200 }}
                        class="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2"
                    >
                        <AlertCircle class="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p class="text-sm text-red-700">{errorMessage}</p>
                    </div>
                {/if}

                <!-- ==========================================
                     PILIHAN SUMBER MODAL
                ========================================== -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-3">
                        Pilih Sumber Modal Awal
                    </label>
                    
                    <div class="space-y-2">
                        <!-- Opsi 1: Manual -->
                        <button
                            type="button"
                            on:click={() => selectSumberModal('manual')}
                            disabled={isLoading}
                            class="w-full p-4 rounded-xl border-2 text-left transition-all
                                   {sumberModal === 'manual' 
                                       ? (isPerUserMode ? 'border-green-500 bg-green-50 ring-2 ring-green-500/20' : 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20')
                                       : 'border-slate-200 bg-white hover:border-slate-300'}"
                        >
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl flex items-center justify-center
                                            {sumberModal === 'manual' 
                                                ? (isPerUserMode ? 'bg-green-500 text-white' : 'bg-emerald-500 text-white')
                                                : 'bg-slate-100 text-slate-500'}">
                                    <Wallet class="w-5 h-5" />
                                </div>
                                <div class="flex-1">
                                    <p class="font-semibold text-slate-800">Input Manual</p>
                                    <p class="text-xs text-slate-500">Masukkan jumlah modal kas awal</p>
                                </div>
                                {#if sumberModal === 'manual'}
                                    <CheckCircle class="w-5 h-5 {isPerUserMode ? 'text-green-500' : 'text-emerald-500'}" />
                                {:else}
                                    <ChevronRight class="w-5 h-5 text-slate-300" />
                                {/if}
                            </div>
                        </button>

                        <!-- Opsi 2: Dari Shift Sebelumnya -->
                        <button
                            type="button"
                            on:click={() => selectSumberModal('shift_sebelumnya')}
                            disabled={isLoading || !hasLastShift}
                            class="w-full p-4 rounded-xl border-2 text-left transition-all
                                   {!hasLastShift ? 'opacity-50 cursor-not-allowed' : ''}
                                   {sumberModal === 'shift_sebelumnya' 
                                       ? (isPerUserMode ? 'border-green-500 bg-green-50 ring-2 ring-green-500/20' : 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20')
                                       : 'border-slate-200 bg-white hover:border-slate-300'}"
                        >
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl flex items-center justify-center
                                            {sumberModal === 'shift_sebelumnya' 
                                                ? (isPerUserMode ? 'bg-green-500 text-white' : 'bg-emerald-500 text-white')
                                                : 'bg-slate-100 text-slate-500'}">
                                    <RefreshCw class="w-5 h-5" />
                                </div>
                                <div class="flex-1">
                                    <p class="font-semibold text-slate-800">
                                        {#if isPerUserMode}
                                            Lanjutkan Shift Saya
                                        {:else}
                                            Lanjutkan Shift Sebelumnya
                                        {/if}
                                    </p>
                                    {#if hasLastShift}
                                        <p class="text-xs text-slate-500">
                                            Kas akhir: <span class="font-semibold {isPerUserMode ? 'text-green-600' : 'text-emerald-600'}">{formatRupiah(lastShiftInfo.kas_akhir)}</span>
                                        </p>
                                    {:else}
                                        <p class="text-xs text-slate-400">
                                            {#if isPerUserMode}
                                                Belum ada shift sebelumnya
                                            {:else}
                                                Tidak ada shift sebelumnya
                                            {/if}
                                        </p>
                                    {/if}
                                </div>
                                {#if sumberModal === 'shift_sebelumnya'}
                                    <CheckCircle class="w-5 h-5 {isPerUserMode ? 'text-green-500' : 'text-emerald-500'}" />
                                {:else}
                                    <ChevronRight class="w-5 h-5 text-slate-300" />
                                {/if}
                            </div>
                            
                            <!-- Detail Shift Sebelumnya -->
                            {#if hasLastShift && sumberModal === 'shift_sebelumnya'}
                                <div 
                                    transition:fly={{ y: -5, duration: 150 }}
                                    class="mt-3 pt-3 border-t {isPerUserMode ? 'border-green-200' : 'border-emerald-200'} text-xs text-slate-600 space-y-1"
                                >
                                    <div class="flex justify-between">
                                        <span>No. Shift:</span>
                                        <span class="font-medium">{lastShiftInfo.no_shift || '-'}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Ditutup:</span>
                                        <span class="font-medium">{formatDateTime(lastShiftInfo.waktu_tutup)}</span>
                                    </div>
                                </div>
                            {/if}
                        </button>

                        <!-- Opsi 3: Auto dari Setting -->
                        <button
                            type="button"
                            on:click={() => selectSumberModal('auto')}
                            disabled={isLoading || !hasDefaultModal}
                            class="w-full p-4 rounded-xl border-2 text-left transition-all
                                   {!hasDefaultModal ? 'opacity-50 cursor-not-allowed' : ''}
                                   {sumberModal === 'auto' 
                                       ? (isPerUserMode ? 'border-green-500 bg-green-50 ring-2 ring-green-500/20' : 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20')
                                       : 'border-slate-200 bg-white hover:border-slate-300'}"
                        >
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl flex items-center justify-center
                                            {sumberModal === 'auto' 
                                                ? (isPerUserMode ? 'bg-green-500 text-white' : 'bg-emerald-500 text-white')
                                                : 'bg-slate-100 text-slate-500'}">
                                    <Settings class="w-5 h-5" />
                                </div>
                                <div class="flex-1">
                                    <p class="font-semibold text-slate-800">Modal Default</p>
                                    {#if hasDefaultModal}
                                        <p class="text-xs text-slate-500">
                                            Dari pengaturan: <span class="font-semibold {isPerUserMode ? 'text-green-600' : 'text-emerald-600'}">{formatRupiah(defaultModal)}</span>
                                        </p>
                                    {:else}
                                        <p class="text-xs text-slate-400">Belum diatur di pengaturan</p>
                                    {/if}
                                </div>
                                {#if sumberModal === 'auto'}
                                    <CheckCircle class="w-5 h-5 {isPerUserMode ? 'text-green-500' : 'text-emerald-500'}" />
                                {:else}
                                    <ChevronRight class="w-5 h-5 text-slate-300" />
                                {/if}
                            </div>
                        </button>
                    </div>
                </div>

                <!-- ==========================================
                     INPUT MODAL (Jika Manual)
                ========================================== -->
                {#if sumberModal === 'manual'}
                    <div transition:fly={{ y: 10, duration: 200 }}>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">
                            Jumlah Modal Awal
                        </label>
                        <div class="relative">
                            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rp</span>
                            <input 
                                type="number" 
                                bind:value={modalAwal} 
                                placeholder="0"
                                inputmode="numeric"
                                disabled={isLoading}
                                class="w-full h-14 pl-12 pr-4 border-2 border-slate-200 rounded-xl text-xl font-bold
                                       focus:outline-none focus:ring-2 transition-all
                                       {isPerUserMode 
                                           ? 'focus:border-green-500 focus:ring-green-500/20' 
                                           : 'focus:border-emerald-500 focus:ring-emerald-500/20'}
                                       disabled:bg-slate-100 disabled:cursor-not-allowed
                                       number-input" 
                                min="0" 
                            />
                        </div>
                        
                        <!-- Quick Amount Buttons -->
                        <div class="flex flex-wrap gap-2 mt-3">
                            {#each [100000, 200000, 300000, 500000] as amount}
                                <button
                                    type="button"
                                    on:click={() => modalAwal = amount}
                                    disabled={isLoading}
                                    class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
                                           {modalAwal === amount 
                                               ? (isPerUserMode 
                                                   ? 'border-green-500 bg-green-50 text-green-700' 
                                                   : 'border-emerald-500 bg-emerald-50 text-emerald-700')
                                               : 'border-slate-200 text-slate-600 hover:border-slate-300'}"
                                >
                                    {formatRupiah(amount)}
                                </button>
                            {/each}
                        </div>
                    </div>
                {/if}

                <!-- ==========================================
                     CATATAN (Opsional)
                ========================================== -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">
                        Catatan <span class="font-normal text-slate-400">(Opsional)</span>
                    </label>
                    <textarea
                        bind:value={catatan}
                        placeholder="Tambahkan catatan jika perlu..."
                        rows="2"
                        disabled={isLoading}
                        class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm
                               focus:outline-none focus:ring-2 transition-all
                               {isPerUserMode 
                                   ? 'focus:border-green-500 focus:ring-green-500/20' 
                                   : 'focus:border-emerald-500 focus:ring-emerald-500/20'}
                               disabled:bg-slate-100 disabled:cursor-not-allowed
                               resize-none"
                    ></textarea>
                </div>

                <!-- ==========================================
                     PREVIEW MODAL FINAL
                ========================================== -->
                {#if modalFinal > 0}
                    <div 
                        transition:scale={{ start: 0.95, duration: 200 }}
                        class="rounded-xl p-4 text-white shadow-lg
                               {isPerUserMode 
                                   ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30' 
                                   : isMultiMode
                                       ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/30'
                                       : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'}"
                    >
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                <Banknote class="w-6 h-6" />
                            </div>
                            <div>
                                <p class="text-emerald-100 text-xs font-medium uppercase tracking-wide">Modal Awal</p>
                                <p class="text-2xl font-bold">{formatRupiah(modalFinal)}</p>
                            </div>
                        </div>
                        
                        <div class="mt-3 pt-3 border-t border-white/20 flex items-center gap-2 text-xs text-emerald-100">
                            <Info class="w-3.5 h-3.5" />
                            <span>
                                {#if sumberModal === 'manual'}
                                    Diinput manual
                                {:else if sumberModal === 'shift_sebelumnya'}
                                    {#if isPerUserMode}
                                        Dari shift saya sebelumnya
                                    {:else}
                                        Dari shift sebelumnya
                                    {/if}
                                {:else}
                                    Dari pengaturan default
                                {/if}
                            </span>
                        </div>
                    </div>
                {/if}

            </div>

            <!-- ==========================================
                 FOOTER
            ========================================== -->
            <div class="p-4 lg:p-5 border-t border-slate-200 bg-slate-50">
                <div class="flex gap-3">
                    <button 
                        type="button"
                        on:click={close}
                        disabled={isLoading}
                        class="flex-1 h-12 border border-slate-200 text-slate-600 rounded-xl font-semibold
                               hover:bg-slate-100 active:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed
                               transition-colors"
                    >
                        Batal
                    </button>
                    <button 
                        type="button"
                        on:click={handleSubmit}
                        disabled={isLoading || !canSubmit}
                        class="flex-1 h-12 text-white rounded-xl font-semibold
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-colors flex items-center justify-center gap-2 shadow-lg
                               {isPerUserMode 
                                   ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 shadow-green-600/30' 
                                   : isMultiMode
                                       ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 shadow-purple-600/30'
                                       : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/30'}"
                    >
                        {#if isLoading}
                            <Loader2 class="w-5 h-5 animate-spin" />
                            <span>Membuka...</span>
                        {:else}
                            <Play class="w-5 h-5" />
                            <span>
                                {#if isPerUserMode}
                                    Buka Shift Saya
                                {:else}
                                    Buka Shift
                                {/if}
                            </span>
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Hide number input spinners */
    .number-input::-webkit-inner-spin-button,
    .number-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    .number-input {
        -moz-appearance: textfield;
    }
</style>