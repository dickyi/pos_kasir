<script>
    import { TrendingUp, TrendingDown, Minus } from 'lucide-svelte';

    /**
     * AdminStats - Komponen stats card untuk dashboard admin
     *
     * @usage
     * <AdminStats
     *   title="Total Tenant"
     *   value={150}
     *   icon={Store}
     *   iconBg="bg-blue-50"
     *   iconColor="text-blue-600"
     *   growth={15}
     *   growthPeriod="bulan ini"
     * />
     */

    export let title = '';
    export let value = 0;
    export let icon = null;
    export let iconBg = 'bg-blue-50';
    export let iconColor = 'text-blue-600';
    export let growth = null;
    export let growthPeriod = '';
    export let valuePrefix = '';
    export let valueSuffix = '';
    export let formatValue = true;
    export let badges = [];
    export let href = '';

    // Format angka
    function formatNumber(num) {
        if (formatValue === false) return num;
        return Number(num || 0).toLocaleString('id-ID');
    }

    // Growth indicator
    $: growthIndicator = growth === null ? null
        : growth > 0 ? 'text-emerald-600'
        : growth < 0 ? 'text-red-500'
        : 'text-slate-400';

    $: growthIcon = growth === null ? null
        : growth > 0 ? TrendingUp
        : growth < 0 ? TrendingDown
        : Minus;

    // Wrapper component
    const Wrapper = href ? 'a' : 'div';
</script>

<Wrapper href={href} class="bg-white rounded-xl border border-slate-200/60 {href ? 'hover:shadow-md hover:border-slate-300/60 transition-all cursor-pointer' : ''}">
    <div class="p-5">
        <div class="flex items-center justify-between {growth !== null ? 'mb-3' : ''}">
            <span class="text-sm font-medium text-slate-500">{title}</span>
            {#if icon}
                <div class="p-2 rounded-xl {iconBg}">
                    <svelte:component this={icon} size={18} class={iconColor} />
                </div>
            {/if}
        </div>

        <p class="text-3xl font-bold text-slate-900">
            {valuePrefix}{formatNumber(value)}{valueSuffix}
        </p>

        {#if growth !== null}
            <div class="flex items-center gap-2 mt-3">
                {#if growthIcon}
                    <svelte:component this={growthIcon} size={16} class={growthIndicator} />
                {/if}
                <span class="text-sm font-semibold {growthIndicator}">
                    {growth > 0 ? '+' : ''}{growth}%
                </span>
                {#if growthPeriod}
                    <span class="text-xs text-slate-400">{growthPeriod}</span>
                {/if}
            </div>
        {/if}

        {#if badges && badges.length > 0}
            <div class="flex gap-2 mt-3 flex-wrap">
                {#each badges as badge}
                    <span class="text-xs font-medium px-2.5 py-1 rounded-lg {badge.color}">
                        {badge.label}
                    </span>
                {/each}
            </div>
        {/if}

        {#if $$slots.extra}
            <div class="mt-3">
                <slot name="extra" />
            </div>
        {/if}
    </div>
</Wrapper>
