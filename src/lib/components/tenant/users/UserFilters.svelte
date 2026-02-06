<!--
    UserFilters.svelte - Filter & Search untuk Kelola User
    =======================================================
    Komponen untuk filter role, status, PIN status dan search
-->
<script>
    import { Search, ChevronDown, X } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';

    export let searchQuery = '';
    export let filterRole = 'all';
    export let filterStatus = 'all';
    export let filterPinStatus = 'all';
    export let showArchived = false;
    export let archivedCount = 0;
    export let filteredCount = 0;

    const dispatch = createEventDispatcher();

    function resetFilters() {
        searchQuery = '';
        filterRole = 'all';
        filterStatus = 'all';
        filterPinStatus = 'all';
        dispatch('reset');
    }

    function toggleShowArchived() {
        dispatch('toggleArchived', !showArchived);
    }

    // Emit changes
    $: dispatch('filterChange', { searchQuery, filterRole, filterStatus, filterPinStatus });
</script>

<div class="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
    <div class="flex flex-col lg:flex-row gap-3">
        <!-- Search -->
        <div class="flex-1 relative">
            <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" 
                bind:value={searchQuery} 
                placeholder="Cari nama, email, atau kode user..."
                class="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none" 
            />
        </div>
        
        <!-- Filter Role -->
        <div class="relative">
            <select 
                bind:value={filterRole}
                class="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none bg-white min-w-[130px]"
            >
                <option value="all">Semua Role</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="kasir">Kasir</option>
            </select>
            <ChevronDown size={14} class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        
        <!-- Filter Status -->
        <div class="relative">
            <select 
                bind:value={filterStatus}
                class="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none bg-white min-w-[130px]"
            >
                <option value="all">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
            </select>
            <ChevronDown size={14} class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        
        <!-- Filter PIN Status -->
        <div class="relative">
            <select 
                bind:value={filterPinStatus}
                class="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none bg-white min-w-[140px]"
            >
                <option value="all">Semua PIN</option>
                <option value="has_pin">Punya PIN</option>
                <option value="no_pin">Belum Punya</option>
                <option value="weak_pin">PIN Lemah</option>
                <option value="locked">Terkunci</option>
            </select>
            <ChevronDown size={14} class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        
        <!-- Reset Filter -->
        {#if searchQuery || filterRole !== 'all' || filterStatus !== 'all' || filterPinStatus !== 'all'}
            <button 
                on:click={resetFilters}
                class="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
                <X size={14} />
                <span>Reset</span>
            </button>
        {/if}
    </div>
    
    <!-- Toggle Archived -->
    <div class="flex items-center justify-between pt-3 border-t border-gray-100">
        <label class="flex items-center gap-3 cursor-pointer select-none">
            <div class="relative">
                <input 
                    type="checkbox" 
                    checked={showArchived} 
                    on:change={toggleShowArchived} 
                    class="peer sr-only" 
                />
                <div class="w-9 h-5 bg-gray-200 peer-checked:bg-gray-900 rounded-full transition-colors"></div>
                <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
            </div>
            <span class="text-sm text-gray-600">
                Tampilkan diarsipkan 
                {#if archivedCount > 0}
                    <span class="text-gray-400">({archivedCount})</span>
                {/if}
            </span>
        </label>
        <span class="text-xs text-gray-400 hidden sm:block">{filteredCount} user</span>
    </div>
</div>
