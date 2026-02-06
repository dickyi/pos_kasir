<script>
    import { 
        History, LogIn, LogOut, Settings, Shield, User, Edit,
        Trash2, Plus, Eye, CheckCircle, XCircle, Clock
    } from 'lucide-svelte';
    
    export let activities = [];
    export let loading = false;
    
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
    
    function getActivityIcon(action) {
        const icons = {
            'login': LogIn,
            'logout': LogOut,
            'create': Plus,
            'update': Edit,
            'delete': Trash2,
            'view': Eye,
            'approve': CheckCircle,
            'reject': XCircle,
            'settings': Settings
        };
        return icons[action] || History;
    }
    
    function getActivityColor(action) {
        const colors = {
            'login': 'text-blue-600 bg-blue-50',
            'logout': 'text-gray-600 bg-gray-50',
            'create': 'text-emerald-600 bg-emerald-50',
            'update': 'text-amber-600 bg-amber-50',
            'delete': 'text-red-600 bg-red-50',
            'view': 'text-purple-600 bg-purple-50',
            'approve': 'text-emerald-600 bg-emerald-50',
            'reject': 'text-red-600 bg-red-50',
            'settings': 'text-gray-600 bg-gray-50'
        };
        return colors[action] || 'text-gray-600 bg-gray-50';
    }
</script>

<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="font-semibold text-gray-900 flex items-center gap-2">
            <History size={18} class="text-gray-400" />
            Aktivitas Admin Terbaru
        </h3>
    </div>
    
    <div class="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {#if loading}
            <div class="p-8 text-center">
                <div class="w-8 h-8 border-3 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                <p class="text-sm text-gray-500 mt-3">Memuat aktivitas...</p>
            </div>
        {:else if activities.length > 0}
            {#each activities as activity}
                {@const ActivityIcon = getActivityIcon(activity.action)}
                {@const colorClass = getActivityColor(activity.action)}
                <div class="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div class="flex items-start gap-4">
                        <!-- Icon -->
                        <div class="w-9 h-9 rounded-lg {colorClass} flex items-center justify-center flex-shrink-0">
                            <svelte:component this={ActivityIcon} size={16} />
                        </div>
                        
                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-medium text-gray-900">{activity.admin_name || 'System'}</span>
                                <span class="text-gray-400">•</span>
                                <span class="text-sm text-gray-600">{activity.description || activity.action}</span>
                            </div>
                            {#if activity.target}
                                <p class="text-xs text-gray-500 mt-0.5">Target: {activity.target}</p>
                            {/if}
                        </div>
                        
                        <!-- Time -->
                        <div class="text-right flex-shrink-0">
                            <span class="text-xs text-gray-400 flex items-center gap-1">
                                <Clock size={10} />
                                {formatTimeAgo(activity.created_at)}
                            </span>
                            {#if activity.ip_address}
                                <p class="text-[10px] text-gray-300 mt-0.5">{activity.ip_address}</p>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        {:else}
            <div class="px-6 py-12 text-center">
                <History size={36} class="mx-auto text-gray-300 mb-3" />
                <p class="text-gray-500">Belum ada aktivitas</p>
            </div>
        {/if}
    </div>
</div>