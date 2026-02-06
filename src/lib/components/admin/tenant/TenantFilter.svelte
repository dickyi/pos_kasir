<script>
    import { Search, ArrowUpDown, X, Filter } from 'lucide-svelte';
    
    export let searchQuery = '';
    export let statusFilter = '';
    export let sortBy = 'created_at';
    export let sortOrder = 'desc';
    export let onSearch = () => {};
    export let onReset = () => {};
    
    function handleKeydown(e) {
        if (e.key === 'Enter') {
            onSearch();
        }
    }
    
    function toggleSortOrder() {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        onSearch();
    }
    
    $: hasActiveFilters = searchQuery || statusFilter;
</script>

<div class="bg-white rounded-xl border border-gray-200 p-4">
    <div class="flex flex-col lg:flex-row gap-4">
        <!-- Search Input -->
        <div class="flex-1 relative">
            <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                placeholder="Cari nama bisnis, pemilik, email, kode..."
                bind:value={searchQuery}
                on:keydown={handleKeydown}
                class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm 
                       focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
        </div>
        
        <!-- Filters -->
        <div class="flex items-center gap-3">
            <!-- Status Filter -->
            <select
                bind:value={statusFilter}
                on:change={onSearch}
                class="px-4 py-2.5 border border-gray-200 rounded-lg text-sm 
                       focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white min-w-[140px]"
            >
                <option value="">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="pending">Pending</option>
                <option value="nonaktif">Nonaktif</option>
            </select>
            
            <!-- Sort By -->
            <select
                bind:value={sortBy}
                on:change={onSearch}
                class="px-4 py-2.5 border border-gray-200 rounded-lg text-sm 
                       focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white hidden sm:block min-w-[150px]"
            >
                <option value="created_at">Tanggal Daftar</option>
                <option value="nama_bisnis">Nama Bisnis</option>
                <option value="nama_pemilik">Nama Pemilik</option>
                <option value="status">Status</option>
            </select>
            
            <!-- Sort Order Toggle -->
            <button
                on:click={toggleSortOrder}
                class="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hidden sm:flex items-center justify-center"
                title="Urutan: {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}"
            >
                <ArrowUpDown size={18} class="text-gray-500" />
            </button>
            
            <!-- Search Button -->
            <button
                on:click={onSearch}
                class="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 
                       flex items-center gap-2"
            >
                <Search size={16} />
                <span class="hidden sm:inline">Cari</span>
            </button>
            
            <!-- Reset Button -->
            {#if hasActiveFilters}
                <button
                    on:click={onReset}
                    class="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    title="Reset filter"
                >
                    <X size={18} />
                </button>
            {/if}
        </div>
    </div>
    
    <!-- Active Filters Tags -->
    {#if hasActiveFilters}
        <div class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <Filter size={14} class="text-gray-400" />
            <span class="text-xs text-gray-500">Filter aktif:</span>
            
            {#if searchQuery}
                <span class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                    Pencarian: "{searchQuery}"
                    <button on:click={() => { searchQuery = ''; onSearch(); }} class="hover:text-red-500 ml-1">
                        <X size={12} />
                    </button>
                </span>
            {/if}
            
            {#if statusFilter}
                <span class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                    Status: {statusFilter}
                    <button on:click={() => { statusFilter = ''; onSearch(); }} class="hover:text-red-500 ml-1">
                        <X size={12} />
                    </button>
                </span>
            {/if}
        </div>
    {/if}
</div>