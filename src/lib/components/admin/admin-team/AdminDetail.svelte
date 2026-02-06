<script>
    import { 
        X, User, Mail, Phone, Shield, ShieldCheck, ShieldAlert,
        Calendar, Clock, Activity, MapPin, Monitor, Smartphone,
        Edit, Key, LogOut, CheckCircle, XCircle
    } from 'lucide-svelte';
    
    export let admin = null;
    export let show = false;
    export let onClose = () => {};
    export let onEdit = (admin) => {};
    export let onResetPassword = (admin) => {};
    
    function formatDateTime(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
    
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    }
    
    function getRoleConfig(role) {
        const configs = {
            'super_admin': { label: 'Super Admin', icon: ShieldCheck, color: 'text-purple-700', bg: 'bg-purple-50' },
            'admin': { label: 'Admin', icon: Shield, color: 'text-blue-700', bg: 'bg-blue-50' },
            'support': { label: 'Support', icon: ShieldAlert, color: 'text-amber-700', bg: 'bg-amber-50' }
        };
        return configs[role] || configs['admin'];
    }
    
    function isOnline(lastActivity) {
        if (!lastActivity) return false;
        const diff = Date.now() - new Date(lastActivity).getTime();
        return diff < 5 * 60 * 1000;
    }
    
    $: roleConfig = admin ? getRoleConfig(admin.role) : null;
    $: online = admin ? isOnline(admin.last_activity) : false;
</script>

{#if show && admin}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 transition-opacity" on:click={onClose}></div>
        
        <!-- Modal -->
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-modal-in">
                <!-- Header -->
                <div class="relative px-6 py-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-2xl">
                    <button 
                        on:click={onClose} 
                        class="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={20} class="text-white/70" />
                    </button>
                    
                    <div class="flex items-center gap-4">
                        <div class="relative">
                            {#if admin.avatar}
                                <img src={admin.avatar} alt="" class="w-20 h-20 rounded-xl object-cover border-4 border-white/20" />
                            {:else}
                                <div class="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl border-4 border-white/10">
                                    {(admin.nama || 'A').charAt(0).toUpperCase()}
                                </div>
                            {/if}
                            {#if online}
                                <span class="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-3 border-gray-900 rounded-full"></span>
                            {/if}
                        </div>
                        <div class="flex-1">
                            <h3 class="text-xl font-bold text-white">{admin.nama || '-'}</h3>
                            <p class="text-white/60">@{admin.username}</p>
                            <div class="flex items-center gap-2 mt-2">
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {roleConfig.bg} {roleConfig.color}">
                                    <svelte:component this={roleConfig.icon} size={12} />
                                    {roleConfig.label}
                                </span>
                                <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
                                            {admin.status === 'aktif' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-500/20 text-gray-300'}">
                                    <span class="w-1.5 h-1.5 rounded-full {admin.status === 'aktif' ? 'bg-emerald-400' : 'bg-gray-400'}"></span>
                                    {admin.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                                </span>
                                {#if online}
                                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
                                        🟢 Online
                                    </span>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="p-6 max-h-[50vh] overflow-y-auto">
                    <!-- Info Grid -->
                    <div class="grid md:grid-cols-2 gap-6 mb-6">
                        <!-- Kontak -->
                        <div class="space-y-4">
                            <h4 class="font-semibold text-gray-900 flex items-center gap-2">
                                <User size={16} class="text-gray-400" />
                                Informasi Kontak
                            </h4>
                            <div class="space-y-3 text-sm">
                                <div class="flex items-center gap-3">
                                    <Mail size={16} class="text-gray-400" />
                                    <span class="text-gray-700">{admin.email || '-'}</span>
                                </div>
                                <div class="flex items-center gap-3">
                                    <Phone size={16} class="text-gray-400" />
                                    <span class="text-gray-700">{admin.no_telepon || '-'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Timeline -->
                        <div class="space-y-4">
                            <h4 class="font-semibold text-gray-900 flex items-center gap-2">
                                <Calendar size={16} class="text-gray-400" />
                                Timeline
                            </h4>
                            <div class="space-y-3 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Bergabung</span>
                                    <span class="text-gray-900">{formatDate(admin.created_at)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Login Terakhir</span>
                                    <span class="text-gray-900">{formatDateTime(admin.last_login)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Aktivitas Terakhir</span>
                                    <span class="text-gray-900">{formatDateTime(admin.last_activity)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Stats -->
                    <div class="grid grid-cols-3 gap-4 mb-6">
                        <div class="bg-blue-50 rounded-xl p-4 text-center">
                            <p class="text-2xl font-bold text-blue-700">{admin.total_actions || 0}</p>
                            <p class="text-xs text-blue-600">Total Aksi</p>
                        </div>
                        <div class="bg-emerald-50 rounded-xl p-4 text-center">
                            <p class="text-2xl font-bold text-emerald-700">{admin.approved_tenants || 0}</p>
                            <p class="text-xs text-emerald-600">Tenant Disetujui</p>
                        </div>
                        <div class="bg-purple-50 rounded-xl p-4 text-center">
                            <p class="text-2xl font-bold text-purple-700">{admin.login_count || 0}</p>
                            <p class="text-xs text-purple-600">Total Login</p>
                        </div>
                    </div>
                    
                    <!-- Recent Sessions -->
                    {#if admin.recent_sessions && admin.recent_sessions.length > 0}
                        <div class="mb-6">
                            <h4 class="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                                <Monitor size={16} class="text-gray-400" />
                                Sesi Aktif
                            </h4>
                            <div class="space-y-2">
                                {#each admin.recent_sessions as session}
                                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div class="flex items-center gap-3">
                                            {#if session.device_type === 'mobile'}
                                                <Smartphone size={16} class="text-gray-400" />
                                            {:else}
                                                <Monitor size={16} class="text-gray-400" />
                                            {/if}
                                            <div>
                                                <p class="text-sm text-gray-900">{session.browser || 'Unknown'}</p>
                                                <p class="text-xs text-gray-500">{session.ip_address || '-'}</p>
                                            </div>
                                        </div>
                                        <span class="text-xs text-gray-500">{formatDateTime(session.last_activity)}</span>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                    
                    <!-- Permissions -->
                    {#if admin.permissions && admin.permissions.length > 0}
                        <div>
                            <h4 class="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                                <Shield size={16} class="text-gray-400" />
                                Permissions
                            </h4>
                            <div class="flex flex-wrap gap-2">
                                {#each admin.permissions as perm}
                                    <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">{perm}</span>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
                
                <!-- Footer -->
                <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <button
                            on:click={() => onResetPassword(admin)}
                            class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 
                                   rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <Key size={14} />
                            Reset Password
                        </button>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            on:click={() => { onClose(); onEdit(admin); }}
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 
                                   rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <Edit size={14} />
                            Edit
                        </button>
                        <button
                            on:click={onClose}
                            class="px-4 py-2 text-sm font-medium text-white bg-gray-900 
                                   rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    @keyframes modal-in {
        from { opacity: 0; transform: scale(0.95) translateY(-10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-modal-in { animation: modal-in 0.2s ease-out; }
</style>