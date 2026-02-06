<!--
    ShiftStatusBar.svelte
    =====================================================
    Komponen untuk menampilkan status shift aktif di halaman kasir.
    
    UPDATED - Full 3 Mode Support:
    1. SINGLE MODE - 1 shift untuk seluruh toko
       - Join/Take Over tersedia untuk Admin/Owner
    2. PER USER MODE - Setiap kasir punya shift sendiri
       - Tidak ada Join/Take Over (shift milik sendiri)
    3. MULTI STATION MODE - Handled by StationSelector
    
    Props baru:
    - kasirMode: 'single' | 'per_user' | 'multi'
    - isPerUserMode: boolean
    =====================================================
-->
<script>
    import { 
        Play, Square, Clock, User, AlertTriangle, 
        CheckCircle, Banknote, Receipt, TrendingUp,
        ChevronRight, Timer, Activity, Users, RefreshCw, 
        Power, Monitor, UserPlus, User as UserIcon
    } from 'lucide-svelte';
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    import { fly, fade, slide } from 'svelte/transition';
    import { formatRupiah } from '$lib/utils/format.js';

    // ==========================================
    // PROPS
    // ==========================================
    
    /** @type {Object|null} Data shift aktif */
    export let activeShift = null;
    
    /** @type {boolean} Apakah wajib buka shift untuk transaksi */
    export let wajibBukaShift = true;
    
    /** @type {string} Nama kasir */
    export let userName = '';
    
    /** @type {boolean} Sedang loading */
    export let isLoading = false;
    
    /** @type {boolean} Mode compact (untuk mobile) */
    export let compact = false;
    
    // ==========================================
    // HYBRID MODE PROPS
    // ==========================================
    
    /** @type {number|null} Current user tenant_user_id */
    export let currentUserId = null;
    
    /** @type {string} Current user role */
    export let userRole = 'kasir';
    
    /** @type {Object} Permissions */
    export let permissions = {
        canJoinShift: false,
        canTakeOver: false,
        canForceClose: false
    };
    
    // ==========================================
    // NEW PROPS - 3 Mode Support
    // ==========================================
    
    /** @type {'single'|'per_user'|'multi'} Mode kasir aktif */
    export let kasirMode = 'single';
    
    /** @type {boolean} Apakah mode Per User */
    export let isPerUserMode = false;

    // ==========================================
    // DISPATCHER
    // ==========================================
    const dispatch = createEventDispatcher();

    // ==========================================
    // LOCAL STATE
    // ==========================================
    
    /** @type {string} Durasi shift berjalan */
    let duration = '00:00';
    
    /** @type {number|null} Interval untuk update durasi */
    let durationInterval = null;
    
    /** @type {boolean} Expand detail di mobile */
    let expanded = false;
    
    /** @type {boolean} Show action menu */
    let showActionMenu = false;

    // ==========================================
    // MODE LABELS
    // ==========================================
    const modeInfo = {
        'single': { label: 'Single', color: 'blue', description: 'Satu shift untuk semua' },
        'per_user': { label: 'Per Kasir', color: 'green', description: 'Shift milik Anda' },
        'multi': { label: 'Multi Station', color: 'purple', description: 'Per mesin kasir' }
    };
    
    $: currentModeInfo = modeInfo[kasirMode] || modeInfo.single;

    // ==========================================
    // REACTIVE
    // ==========================================
    
    $: hasActiveShift = activeShift && activeShift.id;
    $: showWarning = wajibBukaShift && !hasActiveShift;
    
    // Check if this is current user's shift
    $: isMyShift = hasActiveShift && activeShift.tenant_user_id === currentUserId;
    
    // ==========================================
    // PER USER MODE: Tidak perlu Join/Take Over
    // Karena setiap kasir punya shift sendiri
    // ==========================================
    $: canInteractWithShift = !isPerUserMode && hasActiveShift && !isMyShift && (permissions.canJoinShift || permissions.canTakeOver);
    
    // Info shift - FIXED kolom names
    $: noShift = activeShift?.no_shift || '-';
    $: shiftKe = activeShift?.shift_ke || 1;
    $: modalAwal = parseFloat(activeShift?.modal_awal) || 0;
    $: totalPenjualan = parseFloat(activeShift?.total_penjualan) || 0;
    $: jumlahTransaksi = activeShift?.total_transaksi || 0;
    $: penjualanCash = parseFloat(activeShift?.penjualan_tunai) || 0;
    
    // Station info
    $: stationNama = activeShift?.station_nama || null;
    $: stationKode = activeShift?.station_kode || null;
    
    // Kasir info
    $: kasirNama = activeShift?.kasir_nama || 'Kasir';
    $: kasirRole = activeShift?.kasir_role || '';

    // ==========================================
    // LIFECYCLE
    // ==========================================
    
    onMount(() => {
        if (hasActiveShift) {
            updateDuration();
            durationInterval = setInterval(updateDuration, 60000);
        }
    });
    
    onDestroy(() => {
        if (durationInterval) {
            clearInterval(durationInterval);
        }
    });
    
    $: if (hasActiveShift && activeShift?.waktu_buka) {
        updateDuration();
        if (!durationInterval) {
            durationInterval = setInterval(updateDuration, 60000);
        }
    } else {
        duration = '00:00';
        if (durationInterval) {
            clearInterval(durationInterval);
            durationInterval = null;
        }
    }

    // ==========================================
    // FUNCTIONS
    // ==========================================
    
    function updateDuration() {
        if (!activeShift?.waktu_buka) {
            duration = '00:00';
            return;
        }
        
        const start = new Date(activeShift.waktu_buka);
        const now = new Date();
        const diffMs = now - start;
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        duration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    
    function handleOpenShift() {
        if (isLoading) return;
        dispatch('openShift');
    }
    
    function handleCloseShift() {
        if (isLoading || !hasActiveShift) return;
        dispatch('closeShift');
    }
    
    function handleJoinShift() {
        // Block Join di Per User Mode
        if (isPerUserMode) return;
        if (isLoading || !hasActiveShift || !permissions.canJoinShift) return;
        showActionMenu = false;
        dispatch('joinShift', { shiftId: activeShift.id });
    }
    
    function handleTakeOver() {
        // Block Take Over di Per User Mode
        if (isPerUserMode) return;
        if (isLoading || !hasActiveShift || !permissions.canTakeOver) return;
        showActionMenu = false;
        dispatch('takeOver', { shiftId: activeShift.id });
    }
    
    function handleForceClose() {
        if (isLoading || !hasActiveShift || !permissions.canForceClose) return;
        showActionMenu = false;
        dispatch('forceClose', { shiftId: activeShift.id });
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
    
    function toggleExpand() {
        expanded = !expanded;
    }
    
    function toggleActionMenu() {
        showActionMenu = !showActionMenu;
    }
    
    // Close action menu when clicking outside
    function handleClickOutside(event) {
        if (showActionMenu) {
            showActionMenu = false;
        }
    }
</script>

<svelte:window on:click={handleClickOutside} />

<!-- ==========================================
     WARNING: Belum Ada Shift Aktif
========================================== -->
{#if showWarning && !hasActiveShift}
    <div 
        transition:fly={{ y: -10, duration: 200 }}
        class="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl"
    >
        <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle class="w-5 h-5 text-amber-600" />
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                    <p class="font-semibold text-amber-800">Shift Belum Dibuka</p>
                    <!-- Mode Badge -->
                    {#if isPerUserMode}
                        <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                            <UserIcon class="w-3 h-3 inline mr-1" />
                            Mode Per Kasir
                        </span>
                    {/if}
                </div>
                <p class="text-sm text-amber-700 mt-0.5">
                    {#if isPerUserMode}
                        Buka shift Anda untuk memulai transaksi.
                    {:else}
                        Anda harus membuka shift terlebih dahulu untuk memulai transaksi.
                    {/if}
                </p>
            </div>
            <button
                type="button"
                on:click={handleOpenShift}
                disabled={isLoading}
                class="px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold text-sm
                       hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50
                       transition-colors flex items-center gap-2 flex-shrink-0"
            >
                <Play class="w-4 h-4" />
                <span class="hidden sm:inline">Buka Shift</span>
            </button>
        </div>
    </div>
{/if}

<!-- ==========================================
     SHIFT AKTIF MILIK ORANG LAIN (Single Mode Only)
     Di Per User Mode, ini tidak akan tampil
========================================== -->
{#if hasActiveShift && !isMyShift && canInteractWithShift && !isPerUserMode}
    <div 
        transition:fly={{ y: -10, duration: 200 }}
        class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl"
    >
        <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users class="w-5 h-5 text-blue-600" />
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                    <p class="font-semibold text-blue-800">Shift Sedang Aktif</p>
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                        Single Mode
                    </span>
                </div>
                <p class="text-sm text-blue-700 mt-0.5">
                    Shift sedang dibuka oleh <span class="font-semibold">{kasirNama}</span>
                    {#if kasirRole}
                        <span class="text-blue-500">({kasirRole})</span>
                    {/if}
                </p>
                <div class="flex items-center gap-3 mt-2 text-xs text-blue-600">
                    <span class="flex items-center gap-1">
                        <Clock class="w-3 h-3" />
                        Mulai {formatTime(activeShift.waktu_buka)}
                    </span>
                    <span>•</span>
                    <span class="flex items-center gap-1">
                        <Receipt class="w-3 h-3" />
                        {jumlahTransaksi} transaksi
                    </span>
                    <span>•</span>
                    <span class="font-semibold">{formatRupiah(totalPenjualan)}</span>
                </div>
            </div>
        </div>
        
        <!-- Action Buttons (Single Mode Only) -->
        <div class="flex flex-wrap gap-2 mt-4 pt-3 border-t border-blue-200">
            {#if permissions.canJoinShift}
                <button
                    type="button"
                    on:click|stopPropagation={handleJoinShift}
                    disabled={isLoading}
                    class="flex-1 sm:flex-none px-4 py-2 bg-blue-500 text-white rounded-xl font-medium text-sm
                           hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    <UserPlus class="w-4 h-4" />
                    <span>Join Shift</span>
                </button>
            {/if}
            
            {#if permissions.canTakeOver}
                <button
                    type="button"
                    on:click|stopPropagation={handleTakeOver}
                    disabled={isLoading}
                    class="flex-1 sm:flex-none px-4 py-2 bg-amber-500 text-white rounded-xl font-medium text-sm
                           hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    <RefreshCw class="w-4 h-4" />
                    <span>Take Over</span>
                </button>
            {/if}
            
            {#if permissions.canForceClose}
                <button
                    type="button"
                    on:click|stopPropagation={handleForceClose}
                    disabled={isLoading}
                    class="flex-1 sm:flex-none px-4 py-2 bg-red-500 text-white rounded-xl font-medium text-sm
                           hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    <Power class="w-4 h-4" />
                    <span>Force Close</span>
                </button>
            {/if}
        </div>
    </div>
{/if}

<!-- ==========================================
     SHIFT STATUS BAR (Shift Aktif Milik Saya)
     Tampil di Single Mode & Per User Mode
========================================== -->
{#if hasActiveShift && (isMyShift || isPerUserMode)}
    <div 
        transition:fly={{ y: -10, duration: 200 }}
        class="mb-4 bg-gradient-to-r {isPerUserMode ? 'from-green-500 to-emerald-500' : 'from-emerald-500 to-teal-500'} rounded-xl shadow-lg {isPerUserMode ? 'shadow-green-500/20' : 'shadow-emerald-500/20'} overflow-hidden"
    >
        <!-- Main Bar -->
        <div class="p-3 lg:p-4">
            <div class="flex items-center justify-between gap-3">
                <!-- Left: Shift Info -->
                <div class="flex items-center gap-3 min-w-0">
                    <!-- Status Indicator -->
                    <div class="relative flex-shrink-0">
                        <div class="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                            {#if isPerUserMode}
                                <UserIcon class="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                            {:else}
                                <Activity class="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                            {/if}
                        </div>
                        <div class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-300 rounded-full border-2 {isPerUserMode ? 'border-green-500' : 'border-emerald-500'} animate-pulse"></div>
                    </div>
                    
                    <!-- Info -->
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <p class="font-bold text-white text-sm lg:text-base truncate">
                                {#if isPerUserMode}
                                    Shift Saya
                                {:else}
                                    Shift #{shiftKe}
                                {/if}
                            </p>
                            <span class="hidden sm:inline-flex items-center px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-medium text-emerald-100">
                                Aktif
                            </span>
                            {#if isPerUserMode}
                                <span class="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-[10px] font-medium text-emerald-100">
                                    <UserIcon class="w-3 h-3" />
                                    Per Kasir
                                </span>
                            {:else if stationNama}
                                <span class="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-[10px] font-medium text-emerald-100">
                                    <Monitor class="w-3 h-3" />
                                    {stationNama}
                                </span>
                            {/if}
                        </div>
                        <div class="flex items-center gap-2 text-emerald-100 text-xs lg:text-sm mt-0.5">
                            <Clock class="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                            <span>Mulai {formatTime(activeShift.waktu_buka)}</span>
                            <span class="text-emerald-200/60">•</span>
                            <div class="flex items-center gap-1">
                                <Timer class="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                                <span class="font-mono font-semibold">{duration}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Right: Actions & Stats -->
                <div class="flex items-center gap-2 lg:gap-3">
                    <!-- Quick Stats (Desktop) -->
                    <div class="hidden lg:flex items-center gap-4 mr-2">
                        <div class="text-right">
                            <p class="text-[10px] uppercase tracking-wide text-emerald-200">Transaksi</p>
                            <p class="font-bold text-white">{jumlahTransaksi}</p>
                        </div>
                        <div class="w-px h-8 bg-white/20"></div>
                        <div class="text-right">
                            <p class="text-[10px] uppercase tracking-wide text-emerald-200">Penjualan</p>
                            <p class="font-bold text-white">{formatRupiah(totalPenjualan)}</p>
                        </div>
                    </div>
                    
                    <!-- Expand Button (Mobile) -->
                    <button
                        type="button"
                        on:click={toggleExpand}
                        class="lg:hidden p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                        <ChevronRight class="w-4 h-4 text-white transition-transform {expanded ? 'rotate-90' : ''}" />
                    </button>
                    
                    <!-- Close Shift Button -->
                    <button
                        type="button"
                        on:click={handleCloseShift}
                        disabled={isLoading}
                        class="px-3 lg:px-4 py-2 lg:py-2.5 bg-white {isPerUserMode ? 'text-green-700' : 'text-emerald-700'} rounded-xl font-semibold text-sm
                               hover:bg-emerald-50 active:bg-emerald-100 disabled:opacity-50
                               transition-colors flex items-center gap-1.5 lg:gap-2 shadow-lg"
                    >
                        <Square class="w-4 h-4" />
                        <span class="hidden sm:inline">Tutup Shift</span>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Expanded Details (Mobile) -->
        {#if expanded}
            <div 
                transition:slide={{ duration: 200 }}
                class="lg:hidden px-3 pb-3 border-t border-white/20"
            >
                <div class="grid grid-cols-3 gap-3 pt-3">
                    <!-- Modal Awal -->
                    <div class="bg-white/10 backdrop-blur rounded-lg p-2.5 text-center">
                        <div class="w-7 h-7 mx-auto mb-1 bg-white/20 rounded-lg flex items-center justify-center">
                            <Banknote class="w-3.5 h-3.5 text-white" />
                        </div>
                        <p class="text-[9px] uppercase tracking-wide text-emerald-200">Modal</p>
                        <p class="text-xs font-bold text-white mt-0.5">{formatRupiah(modalAwal)}</p>
                    </div>
                    
                    <!-- Transaksi -->
                    <div class="bg-white/10 backdrop-blur rounded-lg p-2.5 text-center">
                        <div class="w-7 h-7 mx-auto mb-1 bg-white/20 rounded-lg flex items-center justify-center">
                            <Receipt class="w-3.5 h-3.5 text-white" />
                        </div>
                        <p class="text-[9px] uppercase tracking-wide text-emerald-200">Transaksi</p>
                        <p class="text-xs font-bold text-white mt-0.5">{jumlahTransaksi}</p>
                    </div>
                    
                    <!-- Penjualan -->
                    <div class="bg-white/10 backdrop-blur rounded-lg p-2.5 text-center">
                        <div class="w-7 h-7 mx-auto mb-1 bg-white/20 rounded-lg flex items-center justify-center">
                            <TrendingUp class="w-3.5 h-3.5 text-white" />
                        </div>
                        <p class="text-[9px] uppercase tracking-wide text-emerald-200">Penjualan</p>
                        <p class="text-xs font-bold text-white mt-0.5">{formatRupiah(totalPenjualan)}</p>
                    </div>
                </div>
                
                <!-- Additional Info -->
                <div class="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-emerald-100">
                    <div class="flex items-center gap-1.5">
                        <User class="w-3.5 h-3.5" />
                        <span>{userName || 'Kasir'}</span>
                        {#if isPerUserMode}
                            <span class="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">Per Kasir</span>
                        {/if}
                    </div>
                    <span class="font-mono text-[10px] text-emerald-200">{noShift}</span>
                </div>
            </div>
        {/if}
    </div>
{/if}

<!-- ==========================================
     COMPACT MODE
========================================== -->
{#if compact && hasActiveShift}
    <div class="flex items-center gap-2 text-sm">
        <div class="flex items-center gap-1.5 px-2.5 py-1.5 {isPerUserMode ? 'bg-green-100 text-green-700' : 'bg-emerald-100 text-emerald-700'} rounded-lg">
            <div class="w-2 h-2 {isPerUserMode ? 'bg-green-500' : 'bg-emerald-500'} rounded-full animate-pulse"></div>
            <span class="font-medium">
                {#if isPerUserMode}
                    My Shift
                {:else}
                    Shift #{shiftKe}
                {/if}
            </span>
        </div>
        <span class="text-slate-400">•</span>
        <span class="text-slate-600 font-mono">{duration}</span>
        {#if !isMyShift && !isPerUserMode}
            <span class="text-slate-400">•</span>
            <span class="text-slate-500 text-xs">({kasirNama})</span>
        {/if}
    </div>
{/if}

{#if compact && !hasActiveShift && wajibBukaShift}
    <button
        type="button"
        on:click={handleOpenShift}
        disabled={isLoading}
        class="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg
               hover:bg-amber-200 transition-colors text-sm font-medium"
    >
        <AlertTriangle class="w-3.5 h-3.5" />
        <span>Buka Shift</span>
    </button>
{/if}