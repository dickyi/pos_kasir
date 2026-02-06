<!--
    StationSelector.svelte
    =====================================================
    Komponen untuk memilih station sebelum buka shift
    atau melihat status station yang ada.
    
    Digunakan di:
    - Mode Multi Station: Pilih station sebelum buka shift
    - Mode Single Station: Auto-select default station
    
    Props:
    - stations: array - Daftar station
    - activeShifts: array - Daftar shift aktif
    - isMultiMode: boolean - Mode multi station
    - currentUserId: number - ID user saat ini
    - userRole: string - Role user (owner/admin/kasir)
    - permissions: object - Izin user
    
    Events:
    - selectStation: { station, shift }
    - openShift: { stationId }
    - joinShift: { shiftId }
    - takeOver: { shiftId }
    - forceClose: { shiftId }
=====================================================
-->
<script>
    import { 
        Monitor, Play, Users, Clock, User, AlertTriangle,
        CheckCircle, XCircle, LogIn, RefreshCw, Power,
        ChevronRight, Activity, Banknote, Receipt
    } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { fly, fade, scale } from 'svelte/transition';
    import { formatRupiah } from '$lib/utils/format.js';

    // ==========================================
    // PROPS
    // ==========================================
    
    /** @type {Array} Daftar station */
    export let stations = [];
    
    /** @type {Array} Daftar shift aktif */
    export let activeShifts = [];
    
    /** @type {boolean} Mode multi station */
    export let isMultiMode = false;
    
    /** @type {number|null} ID user saat ini */
    export let currentUserId = null;
    
    /** @type {string} Role user */
    export let userRole = 'kasir';
    
    /** @type {Object} Permissions */
    export let permissions = {
        canJoinShift: false,
        canTakeOver: false,
        canForceClose: false
    };
    
    /** @type {boolean} Loading state */
    export let isLoading = false;

    // ==========================================
    // DISPATCHER
    // ==========================================
    const dispatch = createEventDispatcher();

    // ==========================================
    // COMPUTED
    // ==========================================
    
    // Map shift by station_id
    $: shiftByStation = activeShifts.reduce((acc, shift) => {
        if (shift.station_id) {
            acc[shift.station_id] = shift;
        }
        return acc;
    }, {});
    
    // Stations with shift info
    $: stationsWithInfo = stations.map(station => ({
        ...station,
        activeShift: shiftByStation[station.id] || null,
        hasActiveShift: !!shiftByStation[station.id],
        isMyShift: shiftByStation[station.id]?.tenant_user_id === currentUserId
    }));
    
    // Count active stations
    $: activeStationCount = stationsWithInfo.filter(s => s.hasActiveShift).length;
    
    // Check if user already has a shift
    $: userHasShift = activeShifts.some(s => s.tenant_user_id === currentUserId);

    // ==========================================
    // FUNCTIONS
    // ==========================================
    
    function handleOpenShift(stationId) {
        if (isLoading) return;
        dispatch('openShift', { stationId });
    }
    
    function handleJoinShift(shiftId) {
        if (isLoading || !permissions.canJoinShift) return;
        dispatch('joinShift', { shiftId });
    }
    
    function handleTakeOver(shiftId) {
        if (isLoading || !permissions.canTakeOver) return;
        dispatch('takeOver', { shiftId });
    }
    
    function handleForceClose(shiftId) {
        if (isLoading || !permissions.canForceClose) return;
        dispatch('forceClose', { shiftId });
    }
    
    function handleSelectStation(station) {
        if (isLoading) return;
        
        const shift = shiftByStation[station.id];
        dispatch('selectStation', { station, shift });
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
    
    function formatDuration(startTime) {
        if (!startTime) return '-';
        const start = new Date(startTime);
        const now = new Date();
        const diffMs = now - start;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}j ${minutes}m`;
    }
</script>

<!-- ==========================================
     SINGLE MODE: Simple Warning/Status
========================================== -->
{#if !isMultiMode}
    <!-- Single mode handled by ShiftStatusBar -->
    <slot />
{:else}
    <!-- ==========================================
         MULTI MODE: Station Selector Grid
    ========================================== -->
    <div 
        transition:fly={{ y: -10, duration: 200 }}
        class="mb-4"
    >
        <!-- Header -->
        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
                <Monitor class="w-5 h-5 text-slate-600" />
                <h3 class="font-semibold text-slate-800">Pilih Station</h3>
                <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                    Multi Mode
                </span>
            </div>
            <div class="text-sm text-slate-500">
                {activeStationCount}/{stations.length} aktif
            </div>
        </div>

        <!-- Station Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {#each stationsWithInfo as station (station.id)}
                <div 
                    transition:scale={{ start: 0.95, duration: 200 }}
                    class="relative bg-white rounded-xl border-2 overflow-hidden transition-all
                           {station.hasActiveShift 
                               ? station.isMyShift 
                                   ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' 
                                   : 'border-amber-400 shadow-lg shadow-amber-400/20'
                               : 'border-slate-200 hover:border-slate-300'}"
                >
                    <!-- Station Header -->
                    <div class="p-4">
                        <div class="flex items-start justify-between">
                            <div class="flex items-center gap-3">
                                <!-- Station Icon -->
                                <div class="w-12 h-12 rounded-xl flex items-center justify-center
                                            {station.hasActiveShift 
                                                ? station.isMyShift 
                                                    ? 'bg-emerald-100 text-emerald-600'
                                                    : 'bg-amber-100 text-amber-600'
                                                : 'bg-slate-100 text-slate-500'}">
                                    <Monitor class="w-6 h-6" />
                                </div>
                                
                                <!-- Station Info -->
                                <div>
                                    <h4 class="font-semibold text-slate-800">{station.nama}</h4>
                                    <p class="text-xs text-slate-500">{station.kode}</p>
                                </div>
                            </div>
                            
                            <!-- Status Badge -->
                            {#if station.hasActiveShift}
                                <span class="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                                             {station.isMyShift 
                                                 ? 'bg-emerald-100 text-emerald-700'
                                                 : 'bg-amber-100 text-amber-700'}">
                                    <span class="w-1.5 h-1.5 rounded-full animate-pulse
                                                 {station.isMyShift ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                                    {station.isMyShift ? 'Shift Anda' : 'Sedang Digunakan'}
                                </span>
                            {:else}
                                <span class="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
                                    <span class="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                    Tersedia
                                </span>
                            {/if}
                        </div>
                        
                        <!-- Shift Info (if active) -->
                        {#if station.activeShift}
                            <div class="mt-4 pt-4 border-t border-slate-100 space-y-2">
                                <!-- Kasir -->
                                <div class="flex items-center gap-2 text-sm">
                                    <User class="w-4 h-4 text-slate-400" />
                                    <span class="text-slate-600">
                                        {station.activeShift.kasir_nama || 'Kasir'}
                                    </span>
                                    {#if station.activeShift.kasir_role}
                                        <span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded uppercase">
                                            {station.activeShift.kasir_role}
                                        </span>
                                    {/if}
                                </div>
                                
                                <!-- Waktu & Durasi -->
                                <div class="flex items-center gap-2 text-sm">
                                    <Clock class="w-4 h-4 text-slate-400" />
                                    <span class="text-slate-600">
                                        Mulai {formatTime(station.activeShift.waktu_buka)}
                                    </span>
                                    <span class="text-slate-300">•</span>
                                    <span class="font-mono text-slate-500">
                                        {formatDuration(station.activeShift.waktu_buka)}
                                    </span>
                                </div>
                                
                                <!-- Stats -->
                                <div class="flex items-center gap-4 text-sm">
                                    <div class="flex items-center gap-1">
                                        <Receipt class="w-4 h-4 text-blue-500" />
                                        <span class="text-slate-600">
                                            {station.activeShift.total_transaksi || 0} trx
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <Banknote class="w-4 h-4 text-emerald-500" />
                                        <span class="text-slate-600">
                                            {formatRupiah(station.activeShift.total_penjualan || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                    
                    <!-- Actions -->
                    <div class="px-4 pb-4">
                        {#if station.hasActiveShift}
                            {#if station.isMyShift}
                                <!-- My Shift: Continue Button -->
                                <button
                                    type="button"
                                    on:click={() => handleSelectStation(station)}
                                    disabled={isLoading}
                                    class="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold
                                           hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50
                                           transition-colors flex items-center justify-center gap-2"
                                >
                                    <Activity class="w-5 h-5" />
                                    Lanjutkan Kasir
                                </button>
                            {:else}
                                <!-- Other's Shift: Join/Take Over Options -->
                                <div class="space-y-2">
                                    {#if permissions.canJoinShift}
                                        <button
                                            type="button"
                                            on:click={() => handleJoinShift(station.activeShift.id)}
                                            disabled={isLoading}
                                            class="w-full py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-medium
                                                   hover:bg-blue-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Users class="w-4 h-4" />
                                            Join Shift
                                        </button>
                                    {/if}
                                    
                                    {#if permissions.canTakeOver}
                                        <button
                                            type="button"
                                            on:click={() => handleTakeOver(station.activeShift.id)}
                                            disabled={isLoading}
                                            class="w-full py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-medium
                                                   hover:bg-amber-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw class="w-4 h-4" />
                                            Take Over
                                        </button>
                                    {/if}
                                    
                                    {#if permissions.canForceClose}
                                        <button
                                            type="button"
                                            on:click={() => handleForceClose(station.activeShift.id)}
                                            disabled={isLoading}
                                            class="w-full py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl font-medium
                                                   hover:bg-red-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Power class="w-4 h-4" />
                                            Force Close
                                        </button>
                                    {/if}
                                    
                                    {#if !permissions.canJoinShift && !permissions.canTakeOver}
                                        <div class="py-2.5 bg-slate-50 text-slate-500 rounded-xl text-center text-sm">
                                            Station sedang digunakan
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        {:else}
                            <!-- Empty Station: Open Shift -->
                            <button
                                type="button"
                                on:click={() => handleOpenShift(station.id)}
                                disabled={isLoading}
                                class="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold
                                       hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50
                                       transition-colors flex items-center justify-center gap-2"
                            >
                                <Play class="w-5 h-5" />
                                Buka Shift
                            </button>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
        
        <!-- Empty State -->
        {#if stations.length === 0}
            <div class="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                <Monitor class="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p class="text-slate-600 font-medium">Belum ada station</p>
                <p class="text-sm text-slate-400 mt-1">Tambahkan station di Pengaturan</p>
            </div>
        {/if}
        
        <!-- User Already Has Shift Warning -->
        {#if userHasShift && !isLoading}
            <div 
                transition:fly={{ y: 10, duration: 200 }}
                class="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2"
            >
                <CheckCircle class="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <p class="text-sm text-emerald-700">
                    Anda sudah memiliki shift aktif. Pilih station Anda untuk melanjutkan.
                </p>
            </div>
        {/if}
    </div>
{/if}