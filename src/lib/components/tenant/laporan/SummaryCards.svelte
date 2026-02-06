<!--
    SummaryCards.svelte
    ============================================
    Kartu statistik untuk halaman laporan
    ============================================
-->
<script>
    import { TrendingUp, TrendingDown, Minus } from 'lucide-svelte';

    export let cards = [];

    // Format rupiah
    function formatRupiahShort(num) {
        if (!num && num !== 0) return 'Rp 0';
        if (num >= 1000000000) {
            return 'Rp ' + (num / 1000000000).toFixed(1) + 'M';
        } else if (num >= 1000000) {
            return 'Rp ' + (num / 1000000).toFixed(1) + 'jt';
        } else if (num >= 1000) {
            return 'Rp ' + Math.round(num / 1000) + 'rb';
        }
        return 'Rp ' + num;
    }

    // Get growth trend info
    function getGrowthTrend(value) {
        if (!value || value === 0) {
            return { trend: 'neutral', color: 'text-slate-400', label: '0%' };
        }
        if (value > 0) {
            return { trend: 'up', color: 'text-emerald-600', label: `+${value.toFixed(1)}%` };
        }
        return { trend: 'down', color: 'text-red-600', label: `${value.toFixed(1)}%` };
    }

    // Process cards with growth info
    $: displayCards = cards.map(card => ({
        ...card,
        growthInfo: getGrowthTrend(card.change || card.growth || 0)
    }));
</script>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {#each displayCards as card}
        <div class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
            <div class="flex items-center justify-between">
                <!-- Icon -->
                <div class="w-10 h-10 {card.iconBg || 'bg-slate-100'} rounded-lg flex items-center justify-center">
                    <svelte:component this={card.icon} class="w-5 h-5 {card.iconColor || 'text-slate-600'}" />
                </div>

                <!-- Growth Indicator -->
                {#if card.growthInfo.trend !== 'neutral'}
                    <div class="flex items-center gap-1 {card.growthInfo.color}">
                        {#if card.growthInfo.trend === 'up'}
                            <TrendingUp class="w-3.5 h-3.5" />
                        {:else if card.growthInfo.trend === 'down'}
                            <TrendingDown class="w-3.5 h-3.5" />
                        {/if}
                        <span class="text-xs font-medium">{card.growthInfo.label}</span>
                    </div>
                {/if}
            </div>

            <!-- Value -->
            <div class="mt-4">
                <p class="text-2xl font-semibold text-slate-800">
                    {#if card.format === 'currency'}
                        {formatRupiahShort(card.value)}
                    {:else if card.format === 'number'}
                        {(card.value || 0).toLocaleString('id-ID')}
                    {:else}
                        {card.value}
                    {/if}
                </p>
                <p class="text-sm text-slate-500 mt-1">{card.label}</p>
            </div>

            <!-- Additional Info -->
            {#if card.additional}
                <p class="text-xs text-slate-400 mt-2 truncate">{card.additional}</p>
            {/if}
        </div>
    {/each}
</div>