<!-- ============================================
CONNECTION STATUS COMPONENT
File: src/lib/components/admin/email/components/ConnectionStatus.svelte

Displays real-time SSE connection status with:
- Live indicator (pulsing dot)
- Last update timestamp
- Reconnect button
- Error messages
============================================ -->

<script>
    import { RefreshCw, Wifi, WifiOff, Circle, Clock } from 'lucide-svelte';
    import { connectionStatus, isConnected, isConnecting, emailStore } from '../stores/emailStore.js';
    import { formatRelativeTime } from '../utils/helpers.js';
    
    // Props
    export let showLastUpdate = true;
    export let showReconnectButton = true;
    export let compact = false;
    
    // Reactive
    $: status = $connectionStatus;
    $: connected = $isConnected;
    $: connecting = $isConnecting;
    
    // Auto-update relative time
    let currentTime = new Date();
    let interval;
    
    import { onMount, onDestroy } from 'svelte';
    
    onMount(() => {
        interval = setInterval(() => {
            currentTime = new Date();
        }, 1000);
    });
    
    onDestroy(() => {
        if (interval) clearInterval(interval);
    });
    
    // Handlers
    function handleReconnect() {
        emailStore.reconnect();
    }
</script>

<div class="flex items-center gap-3">
    <!-- Status Badge -->
    <div class="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300
                {connected ? 'bg-emerald-50 border-emerald-200' : 
                 connecting ? 'bg-amber-50 border-amber-200' : 
                 'bg-gray-50 border-gray-200'}">
        
        {#if connected}
            <!-- Connected State -->
            <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span class="text-xs font-medium text-emerald-700">
                {compact ? 'Live' : 'Real-time Active'}
            </span>
            
        {:else if connecting}
            <!-- Connecting State -->
            <RefreshCw size={14} class="text-amber-600 animate-spin" />
            <span class="text-xs font-medium text-amber-700">
                {compact ? 'Connecting' : 'Menghubungkan...'}
            </span>
            
        {:else}
            <!-- Disconnected State -->
            <Circle size={10} class="text-gray-400" />
            <span class="text-xs font-medium text-gray-600">
                {compact ? 'Offline' : 'Tidak Terhubung'}
            </span>
        {/if}
    </div>
    
    <!-- Last Update -->
    {#if showLastUpdate && status.lastUpdate && connected}
        <div class="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
            <Clock size={12} />
            <span>{formatRelativeTime(status.lastUpdate)}</span>
        </div>
    {/if}
    
    <!-- Reconnect Attempt Counter -->
    {#if status.reconnectAttempts > 0 && !connected}
        <div class="hidden sm:flex items-center gap-1.5 text-xs text-amber-600">
            <RefreshCw size={12} />
            <span>Percobaan {status.reconnectAttempts}/5</span>
        </div>
    {/if}
    
    <!-- Reconnect Button -->
    {#if showReconnectButton && !connected && !connecting}
        <button 
            on:click={handleReconnect}
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 
                   bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
        >
            <RefreshCw size={12} />
            <span class="hidden sm:inline">Reconnect</span>
        </button>
    {/if}
</div>

<!-- Error Message (if any) -->
{#if status.error && !connecting}
    <div class="mt-2 flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
        <WifiOff size={14} class="text-red-500 flex-shrink-0 mt-0.5" />
        <p class="text-xs text-red-700">{status.error}</p>
    </div>
{/if}