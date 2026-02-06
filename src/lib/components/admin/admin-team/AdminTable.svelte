<script>
    import { 
        User, Mail, Phone, Shield, ShieldCheck, ShieldAlert,
        Eye, Edit, Trash2, Key, LogOut, MoreVertical,
        CheckCircle, XCircle, Clock, Calendar, Activity
    } from 'lucide-svelte';
    
    export let admins = [];
    export let onView = (admin) => {};
    export let onEdit = (admin) => {};
    export let onDelete = (admin) => {};
    export let onResetPassword = (admin) => {};
    export let onToggleStatus = (admin) => {};
    export let onLogoutAll = (admin) => {};
    
    let openDropdown = null;
    
    function formatDateTime(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
    
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    }
    
    function getTimeSince(dateStr) {
        if (!dateStr) return 'Belum pernah';
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 5) return 'Baru saja';
        if (minutes < 60) return `${minutes} menit lalu`;
        if (hours < 24) return `${hours} jam lalu`;
        if (days < 7) return `${days} hari lalu`;
        return formatDate(dateStr);
    }
    
    function getRoleConfig(role) {
        const configs = {
            'super_admin': { 
                label: 'Super Admin', 
                icon: ShieldCheck, 
                color: 'text-purple-700', 
                bg: 'bg-purple-50',
                border: 'border-purple-200'
            },
            'admin': { 
                label: 'Admin', 
                icon: Shield, 
                color: 'text-blue-700', 
                bg: 'bg-blue-50',
                border: 'border-blue-200'
            },
            'support': { 
                label: 'Support', 
                icon: ShieldAlert, 
                color: 'text-amber-700', 
                bg: 'bg-amber-50',
                border: 'border-amber-200'
            }
        };
        return configs[role] || configs['admin'];
    }
    
    function getStatusConfig(status) {
        if (status === 'aktif') {
            return { label: 'Aktif', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' };
        }
        return { label: 'Nonaktif', color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400' };
    }
    
    function isOnline(lastActivity) {
        if (!lastActivity) return false;
        const diff = Date.now() - new Date(lastActivity).getTime();
        return diff < 5 * 60 * 1000;
    }
    
    function toggleDropdown(id) {
        openDropdown = openDropdown === id ? null : id;
    }
    
    function handleAction(action, admin) {
        openDropdown = null;
        action(admin);
    }
</script>

<svelte:window on:click={() => openDropdown = null} />

<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full">
            <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Admin</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Kontak</th>
                    <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Role</th>
                    <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Login Terakhir</th>
                    <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">Bergabung</th>
                    <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                {#if admins.length > 0}
                    {#each admins as admin (admin.id)}
                        {@const roleConfig = getRoleConfig(admin.role)}
                        {@const statusConfig = getStatusConfig(admin.status)}
                        {@const online = isOnline(admin.last_activity)}
                        <tr class="hover:bg-gray-50 transition-colors">
                            <!-- Admin Info -->
                            <td class="px-4 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="relative">
                                        {#if admin.avatar}
                                            <img src={admin.avatar} alt="" class="w-10 h-10 rounded-full object-cover" />
                                        {:else}
                                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-sm">
                                                {(admin.nama || 'A').charAt(0).toUpperCase()}
                                            </div>
                                        {/if}
                                        {#if online}
                                            <span class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                                        {/if}
                                    </div>
                                    <div class="min-w-0">
                                        <p class="font-semibold text-gray-900 truncate">{admin.nama || '-'}</p>
                                        <p class="text-xs text-gray-500 truncate">@{admin.username}</p>
                                    </div>
                                </div>
                            </td>
                            
                            <!-- Kontak -->
                            <td class="px-4 py-4 hidden md:table-cell">
                                <div class="space-y-1">
                                    {#if admin.email}
                                        <p class="text-sm text-gray-600 flex items-center gap-1.5">
                                            <Mail size={12} class="text-gray-400" />
                                            {admin.email}
                                        </p>
                                    {/if}
                                    {#if admin.no_telepon}
                                        <p class="text-sm text-gray-600 flex items-center gap-1.5">
                                            <Phone size={12} class="text-gray-400" />
                                            {admin.no_telepon}
                                        </p>
                                    {/if}
                                </div>
                            </td>
                            
                            <!-- Role -->
                            <td class="px-4 py-4 text-center">
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border {roleConfig.bg} {roleConfig.color} {roleConfig.border}">
                                    <svelte:component this={roleConfig.icon} size={12} />
                                    {roleConfig.label}
                                </span>
                            </td>
                            
                            <!-- Status -->
                            <td class="px-4 py-4 text-center">
                                <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium {statusConfig.bg} {statusConfig.color}">
                                    <span class="w-1.5 h-1.5 rounded-full {statusConfig.dot}"></span>
                                    {statusConfig.label}
                                </span>
                            </td>
                            
                            <!-- Login Terakhir -->
                            <td class="px-4 py-4 text-center hidden lg:table-cell">
                                <span class="text-sm {online ? 'text-emerald-600 font-medium' : 'text-gray-700'}">
                                    {online ? '🟢 Online' : getTimeSince(admin.last_login)}
                                </span>
                            </td>
                            
                            <!-- Bergabung -->
                            <td class="px-4 py-4 text-center hidden xl:table-cell">
                                <span class="text-sm text-gray-600">{formatDate(admin.created_at)}</span>
                            </td>
                            
                            <!-- Aksi -->
                            <td class="px-4 py-4">
                                <div class="flex items-center justify-center gap-1">
                                    <button 
                                        on:click={() => onView(admin)}
                                        class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                                        title="Lihat Detail"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button 
                                        on:click={() => onEdit(admin)}
                                        class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    
                                    <!-- More Actions Dropdown -->
                                    <div class="relative">
                                        <button 
                                            on:click|stopPropagation={() => toggleDropdown(admin.id)}
                                            class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                        
                                        {#if openDropdown === admin.id}
                                            <div class="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                                <button 
                                                    on:click={() => handleAction(onResetPassword, admin)}
                                                    class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Key size={14} />
                                                    Reset Password
                                                </button>
                                                <button 
                                                    on:click={() => handleAction(onToggleStatus, admin)}
                                                    class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    {#if admin.status === 'aktif'}
                                                        <XCircle size={14} />
                                                        Nonaktifkan
                                                    {:else}
                                                        <CheckCircle size={14} />
                                                        Aktifkan
                                                    {/if}
                                                </button>
                                                <button 
                                                    on:click={() => handleAction(onLogoutAll, admin)}
                                                    class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <LogOut size={14} />
                                                    Logout Semua Device
                                                </button>
                                                <hr class="my-1" />
                                                <button 
                                                    on:click={() => handleAction(onDelete, admin)}
                                                    class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <Trash2 size={14} />
                                                    Hapus Admin
                                                </button>
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    {/each}
                {:else}
                    <tr>
                        <td colspan="7" class="px-4 py-16 text-center">
                            <User size={48} class="mx-auto mb-4 text-gray-300" />
                            <p class="text-gray-500 font-medium">Tidak ada admin ditemukan</p>
                            <p class="text-sm text-gray-400 mt-1">Tambahkan admin baru untuk mulai</p>
                        </td>
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>
</div>