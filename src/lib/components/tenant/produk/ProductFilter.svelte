<!--
    ProductFilter.svelte - Search & Filter Produk dengan Merk Integration
    =====================================================================
    Komponen untuk mencari dan memfilter produk
    - Filter by Kategori
    - Filter by Status
    - Filter by Merk (conditional - hanya muncul jika showMerk = true)
-->
<script>
    import { slide } from 'svelte/transition';
    import { Search, Filter, RefreshCw, ChevronDown } from 'lucide-svelte';

    export let searchQuery = '';
    export let filterKategori = '';
    export let filterStatus = '';
    export let filterMerk = '';      // ✅ TAMBAHAN - Filter Merk
    export let kategoriList = [];
    export let merkList = [];        // ✅ TAMBAHAN - List Merk
    export let showMerk = false;     // ✅ TAMBAHAN - Toggle tampilan filter Merk

    // UI State
    let showFilters = false;

    // ✅ UPDATED - Include filterMerk in hasActiveFilters
    $: hasActiveFilters = searchQuery || filterKategori || filterStatus || filterMerk;

    // ✅ UPDATED - Clear filterMerk juga
    function clearFilters() {
        searchQuery = '';
        filterKategori = '';
        filterStatus = '';
        filterMerk = '';
    }

    // ✅ Hitung jumlah kolom grid berdasarkan showMerk
    $: gridCols = showMerk && merkList && merkList.length > 0 
        ? 'sm:grid-cols-3' 
        : 'sm:grid-cols-2';
</script>

<div class="bg-white rounded-xl border border-slate-200 p-4">
    <div class="flex flex-col sm:flex-row gap-3">
        <!-- Search Input -->
        <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Cari nama atau kode produk..."
                class="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm 
                       placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
        </div>

        <!-- Filter Buttons -->
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
                {#if hasActiveFilters}
                    <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                {/if}
            </button>

            {#if hasActiveFilters}
                <button
                    type="button"
                    on:click={clearFilters}
                    class="inline-flex items-center gap-2 px-4 h-10 border border-slate-200 rounded-lg 
                           text-sm text-slate-600 hover:bg-slate-50 transition-colors"
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
            class="grid {gridCols} gap-3 mt-4 pt-4 border-t border-slate-100"
        >
            <!-- Kategori Filter -->
            <div class="relative">
                <label class="block text-xs font-medium text-slate-500 mb-1.5">Kategori</label>
                <div class="relative">
                    <select
                        bind:value={filterKategori}
                        class="w-full h-10 px-3 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-sm 
                               focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                    >
                        <option value="">Semua Kategori</option>
                        {#each kategoriList as kat}
                            <option value={kat.id}>{kat.nama_kategori}</option>
                        {/each}
                    </select>
                    <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>

            <!-- ✅ TAMBAHAN - Merk Filter (Conditional) -->
            {#if showMerk && merkList && merkList.length > 0}
                <div class="relative">
                    <label class="block text-xs font-medium text-slate-500 mb-1.5">Merk / Brand</label>
                    <div class="relative">
                        <select
                            bind:value={filterMerk}
                            class="w-full h-10 px-3 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-sm 
                                   focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                        >
                            <option value="">Semua Merk</option>
                            {#each merkList as merk}
                                <option value={merk.id}>{merk.nama_merk}</option>
                            {/each}
                        </select>
                        <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            {/if}

            <!-- Status Filter -->
            <div class="relative">
                <label class="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
                <div class="relative">
                    <select
                        bind:value={filterStatus}
                        class="w-full h-10 px-3 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-sm 
                               focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                    >
                        <option value="">Semua Status</option>
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Nonaktif</option>
                    </select>
                    <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>
        </div>

        <!-- Active Filters Summary -->
        {#if hasActiveFilters}
            <div class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                {#if filterKategori}
                    {@const selectedKat = kategoriList.find(k => k.id == filterKategori)}
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 
                                 text-xs font-medium rounded-full">
                        Kategori: {selectedKat?.nama_kategori || filterKategori}
                        <button 
                            type="button"
                            on:click={() => filterKategori = ''}
                            class="hover:text-emerald-900"
                        >×</button>
                    </span>
                {/if}
                
                {#if filterMerk}
                    {@const selectedMerk = merkList.find(m => m.id == filterMerk)}
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 
                                 text-xs font-medium rounded-full">
                        Merk: {selectedMerk?.nama_merk || filterMerk}
                        <button 
                            type="button"
                            on:click={() => filterMerk = ''}
                            class="hover:text-purple-900"
                        >×</button>
                    </span>
                {/if}
                
                {#if filterStatus}
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 
                                 text-xs font-medium rounded-full">
                        Status: {filterStatus === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        <button 
                            type="button"
                            on:click={() => filterStatus = ''}
                            class="hover:text-blue-900"
                        >×</button>
                    </span>
                {/if}
            </div>
        {/if}
    {/if}
</div>