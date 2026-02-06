<!-- ============================================
EMAIL STATS CARDS COMPONENT
File: src/lib/components/admin/email/components/EmailStatsCards.svelte

Displays email statistics in cards:
- Total Sent
- Total Failed  
- Today's Count
- Queue Pending

Features:
- Real-time updates via store
- Flash animation on update
- Responsive grid
============================================ -->

<script>
    import { CheckCircle, XCircle, Send, Clock, TrendingUp, TrendingDown } from 'lucide-svelte';
    import { emailStats, updateIndicators } from '../stores/emailStore.js';
    import { formatNumber } from '../utils/helpers.js';
    
    // Props
    export let showTrends = false;
    export let previousStats = null;
    
    // Reactive
    $: stats = $emailStats;
    $: indicators = $updateIndicators;
    
    // Calculate trends if previous stats provided
    $: trends = previousStats ? {
        sent: stats.total_sent - (previousStats.total_sent || 0),
        failed: stats.total_failed - (previousStats.total_failed || 0),
        today: stats.today_sent - (previousStats.today_sent || 0),
        queue: stats.queue_pending - (previousStats.queue_pending || 0)
    } : null;
    
    // Card configurations
    const cards = [
        {
            key: 'total_sent',
            label: 'Total Terkirim',
            icon: CheckCircle,
            bgColor: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            ringColor: 'ring-emerald-400',
            trendKey: 'sent'
        },
        {
            key: 'total_failed',
            label: 'Total Gagal',
            icon: XCircle,
            bgColor: 'bg-red-100',
            iconColor: 'text-red-600',
            ringColor: 'ring-red-400',
            trendKey: 'failed'
        },
        {
            key: 'today_sent',
            label: 'Hari Ini',
            icon: Send,
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600',
            ringColor: 'ring-blue-400',
            trendKey: 'today'
        },
        {
            key: 'queue_pending',
            label: 'Dalam Antrian',
            icon: Clock,
            bgColor: 'bg-amber-100',
            iconColor: 'text-amber-600',
            ringColor: 'ring-amber-400',
            trendKey: 'queue'
        }
    ];
</script>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {#each cards as card}
        {@const value = stats[card.key] || 0}
        {@const isUpdating = indicators.stats}
        {@const trend = trends?.[card.trendKey] || 0}
        
        <div 
            class="relative bg-white rounded-2xl border border-gray-200 p-4 overflow-hidden
                   transition-all duration-300
                   {isUpdating ? `ring-2 ${card.ringColor} ring-opacity-50` : ''}"
        >
            <!-- Content -->
            <div class="flex items-center gap-3">
                <div class="p-2.5 {card.bgColor} rounded-xl flex-shrink-0">
                    <svelte:component this={card.icon} size={20} class={card.iconColor} />
                </div>
                <div class="min-w-0 flex-1">
                    <p class="text-xs text-gray-500 font-medium truncate">{card.label}</p>
                    <div class="flex items-baseline gap-2">
                        <p class="text-2xl font-bold text-gray-900">{formatNumber(value)}</p>
                        
                        <!-- Trend indicator -->
                        {#if showTrends && trend !== 0}
                            <span class="flex items-center text-xs font-medium
                                        {trend > 0 ? 'text-emerald-600' : 'text-red-600'}">
                                {#if trend > 0}
                                    <TrendingUp size={12} class="mr-0.5" />
                                    +{trend}
                                {:else}
                                    <TrendingDown size={12} class="mr-0.5" />
                                    {trend}
                                {/if}
                            </span>
                        {/if}
                    </div>
                </div>
            </div>
            
            <!-- Update flash overlay -->
            {#if isUpdating}
                <div class="absolute inset-0 {card.bgColor} opacity-20 animate-pulse pointer-events-none"></div>
            {/if}
        </div>
    {/each}
</div>

<style>
    /* Smooth number transition */
    .text-2xl {
        transition: all 0.3s ease;
    }
</style>