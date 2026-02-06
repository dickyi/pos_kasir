<script>
    import { BarChart3 } from 'lucide-svelte';
    
    export let data = [];
    export let title = 'Trend Transaksi';
    export let subtitle = '7 hari terakhir';
    export let valueKey = 'total_transaksi';
    export let labelKey = 'tanggal';
    export let tooltipSuffix = 'transaksi';
    export let barColor = 'from-blue-500 to-blue-400';
    export let barHoverColor = 'hover:from-blue-600 hover:to-blue-500';
    
    function formatDateShort(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
        });
    }
    
    function getBarHeight(value, maxValue) {
        if (!maxValue || !value) return '10%';
        return Math.max(10, (value / maxValue) * 100) + '%';
    }
    
    $: maxValue = Math.max(...(data?.map(d => d[valueKey]) || [1]));
</script>

<div class="bg-white rounded-xl border p-5">
    <div class="flex items-center justify-between mb-6">
        <div>
            <h3 class="font-semibold text-gray-900">{title}</h3>
            <p class="text-sm text-gray-500">{subtitle}</p>
        </div>
        <BarChart3 class="text-gray-400" size={20} />
    </div>
    <div class="h-48 flex items-end gap-2">
        {#each data as item, i}
            <div class="flex-1 flex flex-col items-center gap-2">
                <div 
                    class="w-full bg-gradient-to-t {barColor} rounded-t-lg transition-all {barHoverColor} relative group cursor-pointer"
                    style="height: {getBarHeight(item[valueKey], maxValue)}"
                >
                    <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {item[valueKey]} {tooltipSuffix}
                    </div>
                </div>
                <span class="text-xs text-gray-500">{formatDateShort(item[labelKey])}</span>
            </div>
        {:else}
            <div class="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Belum ada data
            </div>
        {/each}
    </div>
</div>