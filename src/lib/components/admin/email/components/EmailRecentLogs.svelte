<!-- ============================================
EMAIL RECENT LOGS COMPONENT
File: src/lib/components/admin/email/components/EmailRecentLogs.svelte

Displays recent email logs in a table:
- Recipient
- Subject
- Status badge
- Timestamp

Features:
- Real-time updates
- Flash animation on new logs
- Empty state
- Expandable error details
============================================ -->

<script>
    import { 
        Activity, CheckCircle, XCircle, Clock, AlertTriangle,
        ChevronDown, ChevronUp, ExternalLink, Mail
    } from 'lucide-svelte';
    import { recentLogs, updateIndicators, isConnected } from '../stores/emailStore.js';
    import { formatDate, formatRelativeTime, getStatusBadge, truncate } from '../utils/helpers.js';
    
    // Props
    export let title = 'Log Email Terbaru';
    export let showRealTimeIndicator = true;
    export let maxRows = 10;
    export let showErrorDetails = true;
    
    // State
    let expandedLogId = null;
    
    // Reactive
    $: logs = $recentLogs.slice(0, maxRows);
    $: indicators = $updateIndicators;
    $: connected = $isConnected;
    
    // Toggle error details
    function toggleDetails(logId) {
        expandedLogId = expandedLogId === logId ? null : logId;
    }
    
    // Get status icon component
    function getStatusIcon(status) {
        switch (status) {
            case 'sent':
            case 'delivered':
                return CheckCircle;
            case 'failed':
            case 'bounced':
                return XCircle;
            case 'pending':
            case 'queued':
                return Clock;
            default:
                return AlertTriangle;
        }
    }
</script>

<div class="mt-8 pt-6 border-t border-gray-200">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity size={20} class="text-violet-600" />
            {title}
        </h3>
        
        {#if showRealTimeIndicator && connected}
            <span class="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Real-time
            </span>
        {/if}
    </div>
    
    {#if logs.length > 0}
        <!-- Table -->
        <div class="overflow-x-auto rounded-xl border border-gray-200 transition-all duration-300
                    {indicators.logs ? 'ring-2 ring-emerald-400 ring-opacity-50' : ''}">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Penerima</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Subject</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Waktu</th>
                        {#if showErrorDetails}
                            <th class="px-4 py-3 text-center font-medium text-gray-600 w-12"></th>
                        {/if}
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    {#each logs as log, index (log.id)}
                        {@const badge = getStatusBadge(log.status)}
                        {@const StatusIcon = getStatusIcon(log.status)}
                        {@const isNew = index === 0 && indicators.logs}
                        {@const hasError = log.status === 'failed' && log.error_message}
                        {@const isExpanded = expandedLogId === log.id}
                        
                        <tr class="hover:bg-gray-50 transition-colors
                                   {isNew ? 'bg-emerald-50' : ''}">
                            <!-- Recipient -->
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Mail size={14} class="text-gray-500" />
                                    </div>
                                    <div class="min-w-0">
                                        <p class="font-medium text-gray-900 truncate">{log.recipient_email}</p>
                                        {#if log.recipient_name}
                                            <p class="text-xs text-gray-500 truncate">{log.recipient_name}</p>
                                        {/if}
                                    </div>
                                </div>
                            </td>
                            
                            <!-- Subject -->
                            <td class="px-4 py-3">
                                <p class="text-gray-700 truncate max-w-[200px]" title={log.subject}>
                                    {truncate(log.subject, 40)}
                                </p>
                                {#if log.template_key}
                                    <p class="text-xs text-gray-400 mt-0.5">
                                        {log.template_key}
                                    </p>
                                {/if}
                            </td>
                            
                            <!-- Status -->
                            <td class="px-4 py-3">
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium 
                                            {badge.bg} {badge.text}">
                                    <svelte:component this={StatusIcon} size={12} />
                                    {badge.label}
                                </span>
                            </td>
                            
                            <!-- Timestamp -->
                            <td class="px-4 py-3">
                                <p class="text-gray-600 text-xs">{formatDate(log.created_at)}</p>
                                <p class="text-gray-400 text-xs mt-0.5">{formatRelativeTime(log.created_at)}</p>
                            </td>
                            
                            <!-- Expand button (for errors) -->
                            {#if showErrorDetails}
                                <td class="px-4 py-3 text-center">
                                    {#if hasError}
                                        <button 
                                            on:click={() => toggleDetails(log.id)}
                                            class="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                            title="Lihat detail error"
                                        >
                                            {#if isExpanded}
                                                <ChevronUp size={16} class="text-gray-500" />
                                            {:else}
                                                <ChevronDown size={16} class="text-gray-500" />
                                            {/if}
                                        </button>
                                    {/if}
                                </td>
                            {/if}
                        </tr>
                        
                        <!-- Error details row -->
                        {#if showErrorDetails && hasError && isExpanded}
                            <tr>
                                <td colspan="5" class="px-4 py-3 bg-red-50">
                                    <div class="flex items-start gap-2">
                                        <AlertTriangle size={14} class="text-red-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p class="text-xs font-medium text-red-800">Error Message:</p>
                                            <p class="text-xs text-red-700 mt-1">{log.error_message}</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        {/if}
                    {/each}
                </tbody>
            </table>
        </div>
        
        <!-- View all link -->
        {#if logs.length >= maxRows}
            <div class="mt-3 text-center">
                <a href="/admin/email/logs" class="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium">
                    Lihat semua log
                    <ExternalLink size={14} />
                </a>
            </div>
        {/if}
        
    {:else}
        <!-- Empty State -->
        <div class="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Mail size={24} class="text-gray-400" />
            </div>
            <h4 class="text-gray-700 font-medium mb-1">Belum Ada Log Email</h4>
            <p class="text-sm text-gray-500">
                Log email akan muncul di sini setelah ada email yang dikirim.
            </p>
        </div>
    {/if}
</div>

<style>
    /* Smooth row transition */
    tbody tr {
        transition: background-color 0.3s ease;
    }
    
    /* New row animation */
    @keyframes highlight {
        0% { background-color: rgb(209 250 229); }
        100% { background-color: transparent; }
    }
    
    .bg-emerald-50 {
        animation: highlight 2s ease-out;
    }
</style>