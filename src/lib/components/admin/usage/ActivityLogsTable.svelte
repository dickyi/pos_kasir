<script>
    import { 
        History, User, Settings, Package, ShoppingCart, LogIn, LogOut,
        Plus, Edit, Trash2, CheckCircle, XCircle, Eye, Filter,
        ChevronLeft, ChevronRight, Clock, Building2
    } from 'lucide-svelte';
    
    export let logs = [];
    export let pagination = { page: 1, limit: 20, total: 0, totalPages: 1 };
    export let filters = { action: '', tenant: '' };
    export let onPageChange = (page) => {};
    export let onFilter = (filters) => {};
    
    function formatDateTime(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
    
    function getActionConfig(action) {
        const configs = {
            'login': { label: 'Login', icon: LogIn, color: 'text-blue-600', bg: 'bg-blue-50' },
            'logout': { label: 'Logout', icon: LogOut, color: 'text-gray-600', bg: 'bg-gray-50' },
            'create': { label: 'Create', icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            'update': { label: 'Update', icon: Edit, color: 'text-amber-600', bg: 'bg-amber-50' },
            'delete': { label: 'Delete', icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
            'approve': { label: 'Approve', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            'reject': { label: 'Reject', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
            'view': { label: 'View', icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
            'settings': { label: 'Settings', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-50' },
            'transaksi': { label: 'Transaksi', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            'produk': { label: 'Produk', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' }
        };
        return configs[action] || { label: action, icon: History, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
    
    function getModuleIcon(module) {
        const icons = {
            'tenant': Building2,
            'produk': Package,
            'transaksi': ShoppingCart,
            'user': User,
            'settings': Settings,
            'auth': LogIn
        };
        return icons[module] || History;
    }
    
    let selectedAction = filters.action || '';
    
    const actionOptions = [
        { value: '', label: 'Semua Aksi' },
        { value: 'login', label: 'Login' },
        { value: 'logout', label: 'Logout' },
        { value: 'create', label: 'Create' },
        { value: 'update', label: 'Update' },
        { value: 'delete', label: 'Delete' },
        { value: 'transaksi', label: 'Transaksi' }
    ];
</script>

<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h3 class="font-semibold text-gray-900 flex items-center gap-2">
                <History size={18} class="text-gray-400" />
                Activity Logs
            </h3>
            <p class="text-sm text-gray-500 mt-0.5">Riwayat aktivitas dan audit trail</p>
        </div>
        <div class="flex items-center gap-2">
            <select
                bind:value={selectedAction}
                on:change={() => onFilter({ ...filters, action: selectedAction })}
                class="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
                {#each actionOptions as opt}
                    <option value={opt.value}>{opt.label}</option>
                {/each}
            </select>
        </div>
    </div>
    
    <!-- Logs List -->
    <div class="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
        {#if logs.length > 0}
            {#each logs as log (log.id)}
                {@const actionConfig = getActionConfig(log.action)}
                {@const ModuleIcon = getModuleIcon(log.module)}
                <div class="px-6 py-4 hover:bg-gray-50 transition-colors {log.is_suspicious ? 'bg-red-50 border-l-4 border-red-400' : ''}">
                    <div class="flex items-start gap-4">
                        <!-- Icon -->
                        <div class="w-10 h-10 rounded-lg {actionConfig.bg} flex items-center justify-center flex-shrink-0">
                            <svelte:component this={actionConfig.icon} size={18} class={actionConfig.color} />
                        </div>
                        
                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-medium text-gray-900">{log.user_name || 'System'}</span>
                                <span class="text-gray-400">•</span>
                                <span class="text-sm {actionConfig.color} font-medium">{actionConfig.label}</span>
                                {#if log.module}
                                    <span class="text-gray-400">•</span>
                                    <span class="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                        <svelte:component this={ModuleIcon} size={10} />
                                        {log.module}{log.sub_module ? `/${log.sub_module}` : ''}
                                    </span>
                                {/if}
                                {#if log.level && log.level !== 'info'}
                                    <span class="px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded
                                        {log.level === 'warning' ? 'bg-amber-100 text-amber-700' : ''}
                                        {log.level === 'error' ? 'bg-red-100 text-red-700' : ''}
                                        {log.level === 'critical' ? 'bg-red-200 text-red-800' : ''}">
                                        {log.level}
                                    </span>
                                {/if}
                                {#if log.is_suspicious}
                                    <span class="px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded bg-red-500 text-white">
                                        ⚠ Suspicious
                                    </span>
                                {/if}
                            </div>
                            
                            <p class="text-sm text-gray-600 mt-1">{log.description || '-'}</p>
                            
                            {#if log.tenant_name}
                                <p class="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                    <Building2 size={10} />
                                    {log.tenant_name}
                                </p>
                            {/if}
                            
                            {#if log.reference_type && log.reference_id}
                                <p class="text-xs text-gray-400 mt-0.5">
                                    Ref: {log.reference_type} #{log.reference_id}
                                </p>
                            {/if}
                        </div>
                        
                        <!-- Time -->
                        <div class="text-right flex-shrink-0">
                            <p class="text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={10} />
                                {formatDateTime(log.created_at)}
                            </p>
                            {#if log.ip_address}
                                <p class="text-xs text-gray-400 mt-1">{log.ip_address}</p>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        {:else}
            <div class="px-6 py-12 text-center">
                <History size={40} class="mx-auto text-gray-300 mb-3" />
                <p class="text-gray-500">Tidak ada activity log</p>
            </div>
        {/if}
    </div>
    
    <!-- Pagination -->
    {#if pagination.totalPages > 1}
        <div class="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <p class="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} - 
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div class="flex items-center gap-1">
                <button 
                    on:click={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={16} />
                </button>
                <span class="px-3 text-sm text-gray-600">{pagination.page} / {pagination.totalPages}</span>
                <button 
                    on:click={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    {/if}
</div>