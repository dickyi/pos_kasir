<!--
    GrowthBadge.svelte - Badge Pertumbuhan
    ============================================
    Menampilkan persentase growth dengan warna yang sesuai
-->
<script>
    import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-svelte';

    export let value = 0; // persentase
    export let showIcon = true;
    export let size = 'sm'; // 'sm' | 'md'

    $: isPositive = value > 0;
    $: isNegative = value < 0;
    $: isNeutral = value === 0;

    $: colorClass = isPositive 
        ? 'text-emerald-600' 
        : isNegative 
            ? 'text-red-600' 
            : 'text-slate-500';

    $: sizeClass = size === 'md' ? 'text-sm' : 'text-xs';
</script>

{#if value !== null && value !== undefined}
    <div class="flex items-center gap-0.5 {colorClass} {sizeClass} font-medium">
        {#if showIcon}
            {#if isPositive}
                <ArrowUpRight class="w-3 h-3" />
            {:else if isNegative}
                <ArrowDownRight class="w-3 h-3" />
            {:else}
                <Minus class="w-3 h-3" />
            {/if}
        {/if}
        <span>
            {isPositive ? '+' : ''}{value.toFixed(1)}%
        </span>
    </div>
{/if}