<script>
    import { Activity, Database, HardDrive, Users, Package, Calendar } from 'lucide-svelte';
    
    export let data = {
        labels: [],
        datasets: {
            tenants: [],
            produk: [],
            transaksi: [],
            storage: []
        }
    };
    export let period = '7 hari terakhir';
    
    let activeMetric = 'tenants';
    
    const metrics = [
        { key: 'tenants', label: 'Tenant', icon: Users, color: 'bg-blue-500', colorLight: 'bg-blue-100', textColor: 'text-blue-600' },
        { key: 'produk', label: 'Produk', icon: Package, color: 'bg-purple-500', colorLight: 'bg-purple-100', textColor: 'text-purple-600' },
        { key: 'transaksi', label: 'Transaksi', icon: Activity, color: 'bg-emerald-500', colorLight: 'bg-emerald-100', textColor: 'text-emerald-600' },
        { key: 'storage', label: 'Storage', icon: HardDrive, color: 'bg-amber-500', colorLight: 'bg-amber-100', textColor: 'text-amber-600' }
    ];
    
    $: currentData = data.datasets[activeMetric] || [];
    $: maxValue = Math.max(...currentData, 1);
    $: currentMetric = metrics.find(m => m.key === activeMetric);
    $: latestValue = currentData[currentData.length - 1] || 0;
    $: previousValue = currentData[currentData.length - 2] || 0;
    $: change = previousValue > 0 ? ((latestValue - previousValue) / previousValue * 100).toFixed(1) : 0;
    
    function formatNumber(num) {
        const n = Number(num) || 0;
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toLocaleString('id-ID');
    }
</script>

<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
            <h3 class="font-semibold text-gray-900 flex items-center gap-2">
                <Activity size={18} class="text-gray-400" />
                Resource Usage Trend
            </h3>
            <p class="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <Calendar size={12} />
                {period}
            </p>
        </div>
        <div class="text-right">
            <p class="text-2xl font-bold {currentMetric?.textColor}">{formatNumber(latestValue)}</p>
            <p class="text-xs {Number(change) >= 0 ? 'text-emerald-600' : 'text-red-600'}">
                {Number(change) >= 0 ? '+' : ''}{change}% from last
            </p>
        </div>
    </div>
    
    <!-- Metric Tabs -->
    <div class="px-6 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto">
        {#each metrics as metric}
            <button
                on:click={() => activeMetric = metric.key}
                class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                       {activeMetric === metric.key 
                           ? `${metric.colorLight} ${metric.textColor}` 
                           : 'text-gray-500 hover:bg-gray-50'}"
            >
                <svelte:component this={metric.icon} size={14} />
                {metric.label}
            </button>
        {/each}
    </div>
    
    <!-- Chart -->
    <div class="p-6">
        {#if currentData.length > 0}
            <div class="relative h-48">
                <!-- Y-axis labels -->
                <div class="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-xs text-gray-400 text-right pr-2">
                    <span>{formatNumber(maxValue)}</span>
                    <span>{formatNumber(maxValue / 2)}</span>
                    <span>0</span>
                </div>
                
                <!-- Chart area -->
                <div class="ml-12 h-full flex items-end gap-1">
                    {#each currentData as value, index}
                        {@const height = (value / maxValue) * 100}
                        <div class="flex-1 flex flex-col items-center group relative">
                            <!-- Bar -->
                            <div 
                                class="w-full {currentMetric?.color} rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer"
                                style="height: {Math.max(height, 2)}%"
                            ></div>
                            
                            <!-- Tooltip -->
                            <div class="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                {data.labels[index]}: {formatNumber(value)}
                            </div>
                            
                            <!-- X-axis label -->
                            {#if index % Math.ceil(currentData.length / 7) === 0 || index === currentData.length - 1}
                                <span class="absolute -bottom-5 text-[10px] text-gray-400 whitespace-nowrap">
                                    {data.labels[index]}
                                </span>
                            {/if}
                        </div>
                    {/each}
                </div>
                
                <!-- Grid lines -->
                <div class="absolute left-12 right-0 top-0 bottom-6 pointer-events-none">
                    <div class="h-full flex flex-col justify-between">
                        <div class="border-b border-dashed border-gray-100"></div>
                        <div class="border-b border-dashed border-gray-100"></div>
                        <div class="border-b border-gray-200"></div>
                    </div>
                </div>
            </div>
        {:else}
            <div class="h-48 flex items-center justify-center text-gray-400">
                Tidak ada data untuk ditampilkan
            </div>
        {/if}
    </div>
    
    <!-- Legend -->
    <div class="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-6 text-xs text-gray-500">
        {#each metrics as metric}
            <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded {metric.color}"></span>
                {metric.label}
            </span>
        {/each}
    </div>
</div>