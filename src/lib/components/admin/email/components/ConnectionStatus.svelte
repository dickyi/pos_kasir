<!-- ============================================
CONNECTION STATUS COMPONENT (UPDATED)
File: src/lib/components/admin/email/components/ConnectionStatus.svelte

✅ UPDATED: Shows SSE vs Polling mode indicator
============================================ -->

<script>
    import { Wifi, WifiOff, RefreshCw, Radio, RotateCw } from 'lucide-svelte';
    import { connectionStatus, emailStore } from '../stores/emailStore.js';
    
    // Props
    export let showLastUpdate = true;
    export let showReconnectButton = true;
    
    // Computed
    $: status = $connectionStatus.status;
    $: mode = $connectionStatus.mode;
    $: lastUpdate = $connectionStatus.lastUpdate;
    $: error = $connectionStatus.error;
    
    // Status config
    $: statusConfig = getStatusConfig(status, mode);
    
    function getStatusConfig(status, mode) {
        switch (status) {
            case 'connected':
                if (mode === 'sse') {
                    return {
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-50 border-emerald-200',
                        dot: 'bg-emerald-500',
                        label: 'Real-time (SSE)',
                        icon: Radio
                    };
                } else if (mode === 'polling') {
                    return {
                        color: 'text-blue-600',
                        bg: 'bg-blue-50 border-blue-200',
                        dot: 'bg-blue-500',
                        label: 'Near Real-time (Polling)',
                        icon: RotateCw
                    };
                }
                return {
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50 border-emerald-200',
                    dot: 'bg-emerald-500',
                    label: 'Terhubung',
                    icon: Wifi
                };
            case 'connecting':
                return {
                    color: 'text-amber-600',
                    bg: 'bg-amber-50 border-amber-200',
                    dot: 'bg-amber-500',
                    label: 'Menghubungkan...',
                    icon: RefreshCw
                };
            case 'error':
                return {
                    color: 'text-red-600',
                    bg: 'bg-red-50 border-red-200',
                    dot: 'bg-red-500',
                    label: 'Terputus',
                    icon: WifiOff
                };
            default:
                return {
                    color: 'text-gray-500',
                    bg: 'bg-gray-50 border-gray-200',
                    dot: 'bg-gray-400',
                    label: 'Tidak terhubung',
                    icon: WifiOff
                };
        }
    }
    
    function formatTime(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    function handleReconnect() {
        emailStore.reconnect();
    }
</script>

<div class="flex items-center gap-3">
    <!-- Status Badge -->
    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium
                {statusConfig.bg} {statusConfig.color}">
        
        <!-- Animated dot -->
        <span class="relative flex h-2 w-2">
            {#if status === 'connected'}
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 {statusConfig.dot}"></span>
            {/if}
            <span class="relative inline-flex rounded-full h-2 w-2 {statusConfig.dot}"></span>
        </span>
        
        <!-- Icon -->
        <svelte:component this={statusConfig.icon} size={12} 
            class={status === 'connecting' ? 'animate-spin' : ''} />
        
        <!-- Label -->
        <span>{statusConfig.label}</span>
    </div>
    
    <!-- Last Update -->
    {#if showLastUpdate && lastUpdate && status === 'connected'}
        <span class="text-xs text-gray-400">
            Update: {formatTime(lastUpdate)}
        </span>
    {/if}
    
    <!-- Error message -->
    {#if error && status === 'error'}
        <span class="text-xs text-red-500 max-w-[200px] truncate" title={error}>
            {error}
        </span>
    {/if}
    
    <!-- Reconnect Button -->
    {#if showReconnectButton && (status === 'error' || status === 'disconnected')}
        <button 
            on:click={handleReconnect}
            class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium
                   text-violet-600 bg-violet-50 border border-violet-200 rounded-full
                   hover:bg-violet-100 transition-colors"
        >
            <RefreshCw size={12} />
            Hubungkan
        </button>
    {/if}
</div>