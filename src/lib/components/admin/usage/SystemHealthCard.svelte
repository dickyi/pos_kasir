<script>
    import { 
        Server, Database, Wifi, HardDrive, Clock, CheckCircle, 
        AlertTriangle, XCircle, RefreshCw, Activity 
    } from 'lucide-svelte';
    
    export let health = {
        database: { status: 'healthy', latency: 0, message: '' },
        server: { status: 'healthy', uptime: '0d 0h', memory: 0, cpu: 0 },
        storage: { used: 0, total: 100, unit: 'MB' },
        lastCheck: null
    };
    
    export let onRefresh = () => {};
    export let isRefreshing = false;
    
    function getStatusConfig(status) {
        const configs = {
            'healthy': { label: 'Healthy', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle, dot: 'bg-emerald-500' },
            'warning': { label: 'Warning', color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertTriangle, dot: 'bg-amber-500' },
            'critical': { label: 'Critical', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle, dot: 'bg-red-500' },
            'unknown': { label: 'Unknown', color: 'text-gray-500', bg: 'bg-gray-50', icon: Activity, dot: 'bg-gray-400' }
        };
        return configs[status] || configs['unknown'];
    }
    
    function formatDateTime(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }
    
    $: dbStatus = getStatusConfig(health.database?.status);
    $: serverStatus = getStatusConfig(health.server?.status);
    $: storagePercent = health.storage?.total > 0 ? (health.storage.used / health.storage.total * 100).toFixed(1) : 0;
    $: storageStatus = storagePercent > 90 ? 'critical' : storagePercent > 75 ? 'warning' : 'healthy';
    $: storageConfig = getStatusConfig(storageStatus);
    
    $: overallStatus = 
        health.database?.status === 'critical' || health.server?.status === 'critical' || storageStatus === 'critical' ? 'critical' :
        health.database?.status === 'warning' || health.server?.status === 'warning' || storageStatus === 'warning' ? 'warning' : 'healthy';
    $: overallConfig = getStatusConfig(overallStatus);
</script>

<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between {overallConfig.bg}">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center">
                <Server size={20} class={overallConfig.color} />
            </div>
            <div>
                <h3 class="font-semibold text-gray-900">System Health</h3>
                <div class="flex items-center gap-2 mt-0.5">
                    <span class="w-2 h-2 rounded-full {overallConfig.dot} animate-pulse"></span>
                    <span class="text-sm {overallConfig.color} font-medium">{overallConfig.label}</span>
                </div>
            </div>
        </div>
        <button 
            on:click={onRefresh}
            disabled={isRefreshing}
            class="p-2 rounded-lg hover:bg-white/50 transition-colors disabled:opacity-50"
            title="Refresh Status"
        >
            <RefreshCw size={18} class="text-gray-600 {isRefreshing ? 'animate-spin' : ''}" />
        </button>
    </div>
    
    <!-- Status Grid -->
    <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Database -->
        <div class="p-4 rounded-xl border border-gray-100 {dbStatus.bg}">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <Database size={18} class={dbStatus.color} />
                    <span class="font-medium text-gray-900">Database</span>
                </div>
                <svelte:component this={dbStatus.icon} size={18} class={dbStatus.color} />
            </div>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-500">Status</span>
                    <span class="font-medium {dbStatus.color}">{dbStatus.label}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-500">Latency</span>
                    <span class="text-gray-900">{health.database?.latency || 0} ms</span>
                </div>
                {#if health.database?.message}
                    <p class="text-xs {dbStatus.color} mt-2">{health.database.message}</p>
                {/if}
            </div>
        </div>
        
        <!-- Server -->
        <div class="p-4 rounded-xl border border-gray-100 {serverStatus.bg}">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <Wifi size={18} class={serverStatus.color} />
                    <span class="font-medium text-gray-900">Server</span>
                </div>
                <svelte:component this={serverStatus.icon} size={18} class={serverStatus.color} />
            </div>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-500">Uptime</span>
                    <span class="text-gray-900">{health.server?.uptime || '-'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-500">Memory</span>
                    <span class="text-gray-900">{health.server?.memory || 0}%</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-500">CPU</span>
                    <span class="text-gray-900">{health.server?.cpu || 0}%</span>
                </div>
            </div>
        </div>
        
        <!-- Storage -->
        <div class="p-4 rounded-xl border border-gray-100 {storageConfig.bg}">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <HardDrive size={18} class={storageConfig.color} />
                    <span class="font-medium text-gray-900">Storage</span>
                </div>
                <svelte:component this={storageConfig.icon} size={18} class={storageConfig.color} />
            </div>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-500">Used</span>
                    <span class="text-gray-900">{health.storage?.used || 0} / {health.storage?.total || 0} {health.storage?.unit || 'MB'}</span>
                </div>
                <div class="mt-2">
                    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            class="h-full transition-all duration-500 {storageStatus === 'critical' ? 'bg-red-500' : storageStatus === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}"
                            style="width: {storagePercent}%"
                        ></div>
                    </div>
                    <p class="text-xs text-right mt-1 {storageConfig.color}">{storagePercent}%</p>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Footer -->
    <div class="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span class="flex items-center gap-1">
            <Clock size={12} />
            Last check: {formatDateTime(health.lastCheck)}
        </span>
        <span>Auto-refresh setiap 5 menit</span>
    </div>
</div>