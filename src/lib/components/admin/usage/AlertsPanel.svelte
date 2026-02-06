<script>
    import { 
        Bell, AlertTriangle, AlertCircle, Info, CheckCircle, X,
        Clock, ChevronRight, XCircle, Eye, ExternalLink
    } from 'lucide-svelte';
    
    export let alerts = [];
    export let onDismiss = (id) => {};
    export let onViewAll = () => {};
    export let onAction = (alert) => {};
    
    function formatTimeAgo(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Baru saja';
        if (minutes < 60) return `${minutes} menit lalu`;
        if (hours < 24) return `${hours} jam lalu`;
        if (days < 7) return `${days} hari lalu`;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }
    
    function getAlertConfig(type, severity) {
        const configs = {
            'critical': { 
                icon: XCircle, 
                color: 'text-red-600', 
                bg: 'bg-red-50', 
                border: 'border-red-200',
                badge: 'bg-red-100 text-red-700'
            },
            'warning': { 
                icon: AlertTriangle, 
                color: 'text-amber-600', 
                bg: 'bg-amber-50', 
                border: 'border-amber-200',
                badge: 'bg-amber-100 text-amber-700'
            },
            'info': { 
                icon: Info, 
                color: 'text-blue-600', 
                bg: 'bg-blue-50', 
                border: 'border-blue-200',
                badge: 'bg-blue-100 text-blue-700'
            },
            'success': { 
                icon: CheckCircle, 
                color: 'text-emerald-600', 
                bg: 'bg-emerald-50', 
                border: 'border-emerald-200',
                badge: 'bg-emerald-100 text-emerald-700'
            }
        };
        return configs[severity] || configs['info'];
    }
    
    $: criticalCount = alerts.filter(a => a.severity === 'critical').length;
    $: warningCount = alerts.filter(a => a.severity === 'warning').length;
    $: activeAlerts = alerts.filter(a => !a.dismissed).slice(0, 5);
</script>

<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="relative">
                <Bell size={20} class="text-gray-400" />
                {#if criticalCount > 0}
                    <span class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {criticalCount}
                    </span>
                {/if}
            </div>
            <div>
                <h3 class="font-semibold text-gray-900">Alerts & Warnings</h3>
                <p class="text-xs text-gray-500">
                    {criticalCount} critical, {warningCount} warning
                </p>
            </div>
        </div>
        {#if alerts.length > 5}
            <button 
                on:click={onViewAll}
                class="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
                View all
                <ChevronRight size={14} />
            </button>
        {/if}
    </div>
    
    <!-- Alerts List -->
    <div class="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {#if activeAlerts.length > 0}
            {#each activeAlerts as alert (alert.id)}
                {@const config = getAlertConfig(alert.type, alert.severity)}
                <div class="px-6 py-4 {config.bg} border-l-4 {config.border} relative group">
                    <div class="flex items-start gap-3">
                        <!-- Icon -->
                        <div class="flex-shrink-0 mt-0.5">
                            <svelte:component this={config.icon} size={18} class={config.color} />
                        </div>
                        
                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-medium text-gray-900">{alert.title}</span>
                                <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase {config.badge}">
                                    {alert.severity}
                                </span>
                            </div>
                            <p class="text-sm text-gray-600 mt-1">{alert.message}</p>
                            
                            {#if alert.tenant_name}
                                <p class="text-xs text-gray-500 mt-1">
                                    Tenant: <strong>{alert.tenant_name}</strong>
                                </p>
                            {/if}
                            
                            <div class="flex items-center gap-3 mt-2">
                                <span class="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock size={10} />
                                    {formatTimeAgo(alert.created_at)}
                                </span>
                                
                                {#if alert.action_url || alert.action_label}
                                    <button 
                                        on:click={() => onAction(alert)}
                                        class="text-xs {config.color} font-medium hover:underline flex items-center gap-1"
                                    >
                                        {alert.action_label || 'Lihat Detail'}
                                        <ExternalLink size={10} />
                                    </button>
                                {/if}
                            </div>
                        </div>
                        
                        <!-- Dismiss -->
                        <button 
                            on:click|stopPropagation={() => onDismiss(alert.id)}
                            class="flex-shrink-0 p-1 rounded hover:bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Dismiss"
                        >
                            <X size={14} class="text-gray-400" />
                        </button>
                    </div>
                </div>
            {/each}
        {:else}
            <div class="px-6 py-12 text-center">
                <CheckCircle size={40} class="mx-auto text-emerald-300 mb-3" />
                <p class="text-gray-500 font-medium">Tidak ada alert aktif</p>
                <p class="text-sm text-gray-400 mt-1">Sistem berjalan normal</p>
            </div>
        {/if}
    </div>
    
    <!-- Summary Footer -->
    {#if alerts.length > 0}
        <div class="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
            <div class="flex items-center gap-4">
                {#if criticalCount > 0}
                    <span class="flex items-center gap-1 text-red-600">
                        <XCircle size={12} />
                        {criticalCount} Critical
                    </span>
                {/if}
                {#if warningCount > 0}
                    <span class="flex items-center gap-1 text-amber-600">
                        <AlertTriangle size={12} />
                        {warningCount} Warning
                    </span>
                {/if}
            </div>
            <span class="text-gray-400">
                Total: {alerts.length} alerts
            </span>
        </div>
    {/if}
</div>