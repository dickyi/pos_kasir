<!--
    StatCard.svelte - Kartu Statistik
    ============================================
    Komponen reusable untuk menampilkan statistik
-->
<script>
    import GrowthBadge from './GrowthBadge.svelte';

    export let title = '';
    export let value = '';
    export let icon = null;
    export let iconBg = 'bg-slate-100';
    export let iconColor = 'text-slate-600';
    export let growth = null; // number or null
    export let subtitle = null;
    export let valueColor = 'text-slate-800';
</script>

<div class="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
    <!-- Header with Icon and Growth -->
    <div class="flex items-center justify-between mb-2">
        <div class="w-8 h-8 {iconBg} rounded-lg flex items-center justify-center">
            {#if icon}
                <svelte:component this={icon} class="w-4 h-4 {iconColor}" />
            {/if}
        </div>
        
        {#if growth !== null && growth !== undefined}
            <GrowthBadge value={growth} />
        {/if}
    </div>

    <!-- Value -->
    <p class="text-lg sm:text-xl font-semibold {valueColor}">{value}</p>
    
    <!-- Title -->
    <p class="text-xs text-slate-500 mt-0.5">{title}</p>
    
    <!-- Optional Subtitle -->
    {#if subtitle}
        <p class="text-xs text-slate-400 mt-1 truncate">{subtitle}</p>
    {/if}
</div>