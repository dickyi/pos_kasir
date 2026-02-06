<!--
    PeriodFilter.svelte - Filter Periode Laporan
    ============================================
    Komponen reusable untuk filter periode di semua laporan
-->
<script>
    import { createEventDispatcher } from 'svelte';
    import { RefreshCw } from 'lucide-svelte';

    export let period = 'today';
    export let loading = false;
    export let showRefresh = true;

    const dispatch = createEventDispatcher();

    const periods = [
        { value: 'today', label: 'Hari Ini' },
        { value: 'yesterday', label: 'Kemarin' },
        { value: 'week', label: '7 Hari' },
        { value: 'month', label: '30 Hari' }
    ];

    function handlePeriodChange(newPeriod) {
        dispatch('change', { period: newPeriod });
    }

    function handleRefresh() {
        dispatch('refresh');
    }
</script>

<div class="flex items-center gap-2">
    <!-- Period Buttons -->
    <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide flex-1">
        {#each periods as p}
            <button
                type="button"
                on:click={() => handlePeriodChange(p.value)}
                disabled={loading}
                class="px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                       disabled:opacity-50
                       {period === p.value 
                         ? 'bg-emerald-600 text-white' 
                         : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}"
            >
                {p.label}
            </button>
        {/each}
    </div>

    <!-- Refresh Button -->
    {#if showRefresh}
        <button
            type="button"
            on:click={handleRefresh}
            disabled={loading}
            class="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 
                   disabled:opacity-50 active:scale-95 transition-all flex-shrink-0"
        >
            <RefreshCw class="w-4 h-4 text-slate-600 {loading ? 'animate-spin' : ''}" />
        </button>
    {/if}
</div>

<style>
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
</style>