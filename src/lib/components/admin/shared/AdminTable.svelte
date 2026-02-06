<script>
    /**
     * AdminTable - Komponen table yang konsisten untuk halaman admin
     *
     * @usage
     * <AdminTable
     *   columns={[
     *     { key: 'name', label: 'Nama', sortable: true },
     *     { key: 'email', label: 'Email' },
     *     { key: 'actions', label: 'Aksi', align: 'center' }
     *   ]}
     *   data={items}
     *   sortBy="name"
     *   sortOrder="asc"
     *   on:sort={(e) => console.log(e.detail)}
    *   let:item
    * >
    *   <span slot="cell-name">{item.name}</span>
    *   <span slot="cell-actions">
    *     <button>Edit</button>
    *   </span>
    * </AdminTable>
     */

    export let columns = [];
    export let data = [];
    export let sortBy = null;
    export let sortOrder = 'asc';
    export let emptyMessage = 'Tidak ada data';
    export let emptyIcon = null;
    export let loading = false;

    import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-svelte';

    function handleSort(key) {
        if (sortBy === key) {
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            sortBy = key;
            sortOrder = 'asc';
        }
        dispatch('sort', { key, order: sortOrder });
    }

    function getSortIcon(key) {
        if (sortBy !== key) return ArrowUpDown;
        return sortOrder === 'asc' ? ArrowUp : ArrowDown;
    }

    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    $: sortedData = sortBy
        ? [...data].sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return sortOrder === 'asc' ? cmp : -cmp;
        })
        : data;
</script>

<div class="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full">
            <thead>
                <tr class="bg-slate-50/50 border-b border-slate-100">
                    {#each columns as col}
                        <th
                            class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider
                                   {col.align === 'center' ? 'text-center' : ''}
                                   {col.align === 'right' ? 'text-right' : ''}
                                   {col.class || ''}"
                        >
                            {#if col.sortable}
                                <button
                                    on:click={() => handleSort(col.key)}
                                    class="flex items-center gap-1 hover:text-slate-700 transition-colors
                                           {col.align === 'center' ? 'justify-center' : ''}"
                                >
                                    {col.label}
                                    <svelte:component this={getSortIcon(col.key)} size={14} class={sortBy === col.key ? '' : 'opacity-30'} />
                                </button>
                            {:else}
                                    {col.label}
                            {/if}
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
                {#if loading}
                    <tr>
                        <td colspan={columns.length} class="px-5 py-12 text-center text-slate-400">
                            <p class="text-sm">Loading...</p>
                        </td>
                    </tr>
                {:else if sortedData.length > 0}
                    {#each sortedData as item (item.id || item.key)}
                        <tr class="hover:bg-slate-50/50 transition-colors">
                            {#each columns as col}
                                <td
                                    class="px-5 py-4
                                           {col.align === 'center' ? 'text-center' : ''}
                                           {col.align === 'right' ? 'text-right' : ''}
                                           {col.cellClass || ''}"
                                >
                                    {#if $$slots[`cell-${col.key}`]}
                                        <slot name={`cell-${col.key}`} {item} />
                                    {:else}
                                        {item[col.key] ?? '-'}
                                    {/if}
                                </td>
                            {/each}
                        </tr>
                    {/each}
                {:else}
                    <tr>
                        <td colspan={columns.length} class="px-5 py-12 text-center">
                            {#if emptyIcon}
                                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svelte:component this={emptyIcon} size={32} class="text-slate-300" />
                                </div>
                            {/if}
                            <p class="text-slate-500 font-medium">{emptyMessage}</p>
                            {#if $$slots.empty}
                                <div class="mt-2">
                                    <slot name="empty" />
                                </div>
                            {/if}
                        </td>
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>

    {#if $$slots.footer}
        <div class="px-5 py-4 border-t border-slate-100">
            <slot name="footer" />
        </div>
    {/if}
</div>
