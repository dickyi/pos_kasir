<!--
    ReportTable.svelte
    ============================================
    Tabel data dengan search, sort, pagination
    ============================================
-->
<script>
    import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';

    export let columns = []; // { key: string, label: string, format?: 'currency'|'date'|'number', sortable?: boolean }
    export let data = [];
    export let pageSize = 10;
    export let searchable = false;
    export let title = '';
    export let subtitle = '';
    export let showHeader = true;

    const dispatch = createEventDispatcher();

    let searchTerm = '';
    let currentPage = 1;
    let sortColumn = null;
    let sortDirection = 'asc';

    $: filteredData = searchable && searchTerm
        ? data.filter(row => {
                return columns.some(col => {
                    const value = row[col.key];
                    return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
                });
          })
        : data;

    $: sortedData = sortColumn
        ? [...filteredData].sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];
                let comparison = 0;

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    comparison = aVal - bVal;
                } else {
                    comparison = String(aVal || '').localeCompare(String(bVal || ''));
                }

                return sortDirection === 'asc' ? comparison : -comparison;
          })
        : filteredData;

    $: totalPages = Math.ceil(sortedData.length / pageSize);
    $: paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    function handleSort(column) {
        if (!column.sortable) return;

        if (sortColumn === column.key) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = column.key;
            sortDirection = 'asc';
        }

        currentPage = 1;
        dispatch('sort', { column: sortColumn, direction: sortDirection });
    }

    function handleRowClick(row) {
        dispatch('rowClick', row);
    }

    function formatCellValue(value, column) {
        if (value === null || value === undefined) return '-';

        switch (column.format) {
            case 'currency':
                return new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                }).format(value);
            case 'number':
                return (value || 0).toLocaleString('id-ID');
            case 'date':
                return new Date(value).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
            case 'datetime':
                return new Date(value).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            default:
                return value;
        }
    }

    function nextPage() {
        if (currentPage < totalPages) currentPage++;
    }

    function prevPage() {
        if (currentPage > 1) currentPage--;
    }

    function goToPage(page) {
        currentPage = page;
    }
</script>

<div class="bg-white rounded-xl border border-slate-200">
    <!-- Header -->
    {#if showHeader && (title || searchable)}
        <div class="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                {#if title}
                    <h2 class="text-base font-semibold text-slate-800">{title}</h2>
                {/if}
                {#if subtitle}
                    <p class="text-sm text-slate-500 mt-0.5">{subtitle}</p>
                {/if}
            </div>

            {#if searchable}
                <div class="relative">
                    <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        bind:value={searchTerm}
                        placeholder="Cari..."
                        class="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-emerald-500
                               focus:border-transparent w-full sm:w-64"
                        on:input={() => (currentPage = 1)}
                    />
                </div>
            {/if}
        </div>
    {/if}

    <!-- Table -->
    <div class="overflow-x-auto">
        <table class="w-full">
            <thead>
                <tr class="border-b border-slate-100 bg-slate-50">
                    {#each columns as column}
                        <th
                            class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider
                                {column.sortable ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}"
                            on:click={() => handleSort(column)}
                        >
                            <div class="flex items-center gap-1">
                                <span>{column.label}</span>
                                {#if column.sortable && sortColumn === column.key}
                                    {#if sortDirection === 'asc'}
                                        <ChevronUp class="w-3.5 h-3.5 text-emerald-600" />
                                    {:else}
                                        <ChevronDown class="w-3.5 h-3.5 text-emerald-600" />
                                    {/if}
                                {/if}
                            </div>
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
                {#if paginatedData.length > 0}
                    {#each paginatedData as row}
                        <tr
                            class="hover:bg-slate-50 transition-colors cursor-pointer"
                            on:click={() => handleRowClick(row)}
                        >
                            {#each columns as column}
                                <td class="px-5 py-4 text-sm text-slate-700">
                                    {formatCellValue(row[column.key], column)}
                                </td>
                            {/each}
                        </tr>
                    {/each}
                {:else}
                    <tr>
                        <td colspan={columns.length} class="px-5 py-12 text-center text-sm text-slate-500">
                            Data tidak tersedia
                        </td>
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
        <div class="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p class="text-sm text-slate-500">
                Menampilkan {Math.min((currentPage - 1) * pageSize + 1, sortedData.length)} - {Math.min(currentPage * pageSize, sortedData.length)} dari {sortedData.length} data
            </p>

            <div class="flex items-center gap-2">
                <button
                    on:click={prevPage}
                    disabled={currentPage === 1}
                    class="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft class="w-4 h-4" />
                </button>

                {#if totalPages <= 5}
                    {#each Array(totalPages) as _, i}
                        <button
                            on:click={() => goToPage(i + 1)}
                            class="min-w-[2.5rem] px-3 py-2 text-sm font-medium rounded-lg
                                {currentPage === i + 1
                                    ? 'bg-emerald-600 text-white'
                                    : 'border border-slate-200 hover:bg-slate-50 text-slate-700'}"
                        >
                            {i + 1}
                        </button>
                    {/each}
                {:else}
                    <!-- First page -->
                    <button
                        on:click={() => goToPage(1)}
                        class="min-w-[2.5rem] px-3 py-2 text-sm font-medium rounded-lg
                            {currentPage === 1 ? 'bg-emerald-600 text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'}"
                    >
                        1
                    </button>

                    {#if currentPage > 3}
                        <span class="text-slate-400">...</span>
                    {/if}

                    {#if currentPage > 2 && currentPage < totalPages - 1}
                        <button class="min-w-[2.5rem] px-3 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white">
                            {currentPage}
                        </button>
                    {/if}

                    {#if currentPage < totalPages - 2}
                        <span class="text-slate-400">...</span>
                    {/if}

                    <!-- Last page -->
                    <button
                        on:click={() => goToPage(totalPages)}
                        class="min-w-[2.5rem] px-3 py-2 text-sm font-medium rounded-lg
                            {currentPage === totalPages ? 'bg-emerald-600 text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'}"
                    >
                        {totalPages}
                    </button>
                {/if}

                <button
                    on:click={nextPage}
                    disabled={currentPage === totalPages}
                    class="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight class="w-4 h-4" />
                </button>
            </div>
        </div>
    {/if}
</div>