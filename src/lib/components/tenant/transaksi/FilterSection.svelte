<!--
    FilterSection.svelte
    Search bar dan filter untuk transaksi
    - Client-side filtering (tanpa reload)
-->
<script>
    import { Search, Filter, Calendar, ChevronDown, RefreshCw, X } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';

    /** @type {string} Search query */
    export let searchQuery = '';
    
    /** @type {string} Start date */
    export let startDate = '';
    
    /** @type {string} End date */
    export let endDate = '';
    
    /** @type {string} Status filter */
    export let statusFilter = '';
    
    /** @type {string} Metode bayar filter */
    export let metodeFilter = '';

    const dispatch = createEventDispatcher();

    let showFilters = false;

    $: hasActiveFilters = searchQuery || startDate || endDate || statusFilter || metodeFilter;
    $: activeFilterCount = (startDate ? 1 : 0) + (endDate ? 1 : 0) + (statusFilter ? 1 : 0) + (metodeFilter ? 1 : 0);

    function clearSearch() {
        searchQuery = '';
    }

    function clearFilters() {
        searchQuery = '';
        startDate = '';
        endDate = '';
        statusFilter = '';
        metodeFilter = '';
        showFilters = false;
    }
</script>

<div class="bg-white rounded-xl border border-slate-200 p-4">
    <div class="flex flex-col sm:flex-row gap-3">
        <!-- Search Input - Real-time client-side -->
        <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Cari no. invoice atau nama customer..."
                class="w-full h-10 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-sm 
                       placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 
                       focus:bg-white transition-colors"
            />
            {#if searchQuery}
                <button
                    type="button"
                    on:click={clearSearch}
                    class="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 
                           hover:text-slate-600 rounded transition-colors"
                >
                    <X class="w-4 h-4" />
                </button>
            {/if}
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
            <button
                type="button"
                on:click={() => showFilters = !showFilters}
                class="inline-flex items-center gap-2 px-4 h-10 border border-slate-200 rounded-lg 
                       text-sm text-slate-600 hover:bg-slate-50 transition-colors
                       {showFilters ? 'bg-slate-50' : ''}"
            >
                <Filter class="w-4 h-4" />
                <span class="hidden sm:inline">Filter</span>
                {#if activeFilterCount > 0}
                    <span class="w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {activeFilterCount}
                    </span>
                {:else if hasActiveFilters}
                    <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                {/if}
            </button>

            {#if hasActiveFilters}
                <button
                    type="button"
                    on:click={clearFilters}
                    class="inline-flex items-center gap-2 px-4 h-10 border border-slate-200 rounded-lg 
                           text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    title="Reset semua filter"
                >
                    <RefreshCw class="w-4 h-4" />
                    <span class="hidden sm:inline">Reset</span>
                </button>
            {/if}
        </div>
    </div>

    <!-- Filter Options -->
    {#if showFilters}
        <div 
            transition:slide={{ duration: 150 }}
            class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100"
        >
            <!-- Start Date -->
            <div class="relative">
                <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                    type="date"
                    bind:value={startDate}
                    class="w-full h-10 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm 
                           focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Dari tanggal"
                />
            </div>

            <!-- End Date -->
            <div class="relative">
                <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                    type="date"
                    bind:value={endDate}
                    class="w-full h-10 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm 
                           focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Sampai tanggal"
                />
            </div>

            <!-- Status Filter -->
            <div class="relative">
                <select
                    bind:value={statusFilter}
                    class="w-full h-10 px-3 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-sm 
                           focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                >
                    <option value="">Semua Status</option>
                    <option value="success">Sukses</option>
                    <option value="cancelled">Dibatalkan</option>
                    <option value="pending">Pending</option>
                </select>
                <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <!-- Metode Bayar Filter -->
            <div class="relative">
                <select
                    bind:value={metodeFilter}
                    class="w-full h-10 px-3 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-sm 
                           focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                >
                    <option value="">Semua Metode</option>
                    <option value="cash">Tunai</option>
                    <option value="qris">QRIS</option>
                    <option value="transfer">Transfer</option>
                </select>
                <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
        </div>
    {/if}
</div>