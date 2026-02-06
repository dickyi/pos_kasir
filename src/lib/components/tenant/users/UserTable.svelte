<!--
    UserTable.svelte - Tabel User Desktop
    ======================================
    Menampilkan daftar user dalam format tabel untuk desktop
    Includes: PIN status with hidden toggle, actions, archived section
    
    UPDATED: PIN Hidden by default dengan toggle visibility
-->
<script>
    import { 
        Users, Edit, Key, Archive, RotateCcw, Trash2,
        Lock, KeyRound, RefreshCw, Unlock,
        ShieldCheck, ShieldAlert, ShieldX, Shield,
        Crown, UserCog, User, MessageCircle,
        Eye, EyeOff, Copy, Check
    } from 'lucide-svelte';
    import { createEventDispatcher, onDestroy } from 'svelte';
    import { getRoleLabel, getStatusLabel, getStatusColor, formatRelativeTime } from './index.js';

    export let activeUsers = [];
    export let archivedUsers = [];
    export let showArchived = false;

    const dispatch = createEventDispatcher();

    // ==========================================
    // PIN VISIBILITY STATE
    // ==========================================
    
    // Track which PINs are currently visible { odId: boolean }
    let visiblePins = {};
    
    // Track copy status { odId: boolean }
    let copiedPins = {};
    
    // Auto-hide timers
    let hideTimers = {};
    
    // Auto-hide delay (5 seconds)
    const AUTO_HIDE_DELAY = 5000;

    // Cleanup timers on destroy
    onDestroy(() => {
        Object.values(hideTimers).forEach(timer => clearTimeout(timer));
    });

    // ==========================================
    // PIN VISIBILITY FUNCTIONS
    // ==========================================
    
    function togglePinVisibility(userId) {
        // Clear existing timer for this user
        if (hideTimers[userId]) {
            clearTimeout(hideTimers[userId]);
        }
        
        // Toggle visibility
        visiblePins[userId] = !visiblePins[userId];
        visiblePins = visiblePins; // Trigger reactivity
        
        // Set auto-hide timer if PIN is now visible
        if (visiblePins[userId]) {
            hideTimers[userId] = setTimeout(() => {
                visiblePins[userId] = false;
                visiblePins = visiblePins; // Trigger reactivity
            }, AUTO_HIDE_DELAY);
        }
    }
    
    async function copyPin(userId, pin) {
        try {
            await navigator.clipboard.writeText(pin);
            copiedPins[userId] = true;
            copiedPins = copiedPins; // Trigger reactivity
            
            // Reset after 2 seconds
            setTimeout(() => {
                copiedPins[userId] = false;
                copiedPins = copiedPins;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy PIN:', err);
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = pin;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            copiedPins[userId] = true;
            copiedPins = copiedPins;
            setTimeout(() => {
                copiedPins[userId] = false;
                copiedPins = copiedPins;
            }, 2000);
        }
    }
    
    function maskPin(pin) {
        if (!pin) return '••••••';
        return '•'.repeat(pin.length);
    }

    // ==========================================
    // PIN STATUS BADGE
    // ==========================================

    function getPinStatusBadge(user) {
        if (user.is_locked) {
            return { label: 'Terkunci', color: 'bg-red-100 text-red-600', icon: Lock };
        }
        if (user.is_pin_weak) {
            return { label: 'PIN Lemah', color: 'bg-amber-100 text-amber-600', icon: ShieldAlert };
        }
        if (user.pin_status === 'set') {
            return { label: 'PIN Aktif', color: 'bg-emerald-50 text-emerald-600', icon: ShieldCheck };
        }
        if (user.pin_status === 'required') {
            return { label: 'Perlu PIN', color: 'bg-red-50 text-red-600', icon: ShieldX };
        }
        if (user.pin_status === 'optional') {
            return { label: 'PIN Opsional', color: 'bg-gray-100 text-gray-500', icon: Shield };
        }
        return { label: 'Tidak Perlu', color: 'bg-gray-50 text-gray-400', icon: Shield };
    }

    // ==========================================
    // PERMISSION CHECKS
    // ==========================================

    function canManagePin(user) {
        return user.pin_status !== 'not_needed';
    }

    function canHardDelete(user) {
        return user.can_delete === true;
    }

    function getDeleteReason(user) {
        return user.delete_reason || 'Memiliki data terkait';
    }

    // Event dispatchers
    function emit(event, user) {
        dispatch(event, user);
    }
</script>

<div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
    {#if activeUsers.length === 0 && archivedUsers.length === 0}
        <div class="p-12 text-center">
            <Users size={40} class="mx-auto text-gray-300 mb-3" />
            <p class="text-gray-500 font-medium">Tidak ada user ditemukan</p>
            <p class="text-gray-400 text-sm mt-1">Coba ubah filter atau kata kunci</p>
        </div>
    {:else}
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-gray-100">
                        <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">PIN Status</th>
                        <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Login</th>
                        <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    {#each activeUsers as user (user.id)}
                        {@const pinBadge = getPinStatusBadge(user)}
                        {@const isPinVisible = visiblePins[user.id]}
                        {@const isCopied = copiedPins[user.id]}
                        <tr class="hover:bg-gray-50/50 transition-colors {user.status !== 'aktif' ? 'opacity-60' : ''} {user.is_locked ? 'bg-red-50/30' : ''}">
                            <!-- User Info -->
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm relative">
                                        {user.nama.charAt(0).toUpperCase()}
                                        {#if user.is_locked}
                                            <div class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                                <Lock size={10} class="text-white" />
                                            </div>
                                        {/if}
                                    </div>
                                    <div>
                                        <div class="flex items-center gap-2">
                                            <p class="font-medium text-gray-900 text-sm">{user.nama}</p>
                                            {#if user.is_primary}
                                                <span class="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">PRIMARY</span>
                                            {/if}
                                        </div>
                                        <p class="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                            </td>
                            
                            <!-- Role -->
                            <td class="px-6 py-4">
                                <span class="text-sm text-gray-600">{getRoleLabel(user.role)}</span>
                            </td>
                            
                            <!-- PIN Status -->
                            <td class="px-6 py-4">
                                <div class="space-y-1.5">
                                    <!-- PIN Badge -->
                                    <div class="flex items-center gap-1.5">
                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium {pinBadge.color}">
                                            <svelte:component this={pinBadge.icon} size={12} />
                                            {pinBadge.label}
                                        </span>
                                        {#if user.is_locked && user.lock_time_remaining}
                                            <span class="text-[10px] text-red-500">({user.lock_time_remaining})</span>
                                        {/if}
                                    </div>
                                    
                                    <!-- PIN Value (Hidden by default) -->
                                    {#if user.has_pin && user.pin}
                                        <div class="flex items-center gap-1">
                                            <!-- PIN Display -->
                                            <div class="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-md">
                                                <code class="text-xs font-mono {isPinVisible ? 'text-gray-700' : 'text-gray-400'} tracking-wider select-none">
                                                    {isPinVisible ? user.pin : maskPin(user.pin)}
                                                </code>
                                            </div>
                                            
                                            <!-- Toggle Visibility Button -->
                                            <button 
                                                type="button"
                                                on:click={() => togglePinVisibility(user.id)}
                                                class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all duration-200"
                                                title={isPinVisible ? 'Sembunyikan PIN' : 'Lihat PIN (5 detik)'}
                                            >
                                                {#if isPinVisible}
                                                    <EyeOff size={14} />
                                                {:else}
                                                    <Eye size={14} />
                                                {/if}
                                            </button>
                                            
                                            <!-- Copy Button (only visible when PIN is shown) -->
                                            {#if isPinVisible}
                                                <button 
                                                    type="button"
                                                    on:click={() => copyPin(user.id, user.pin)}
                                                    class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all duration-200"
                                                    title={isCopied ? 'Tersalin!' : 'Copy PIN'}
                                                >
                                                    {#if isCopied}
                                                        <Check size={14} class="text-emerald-500" />
                                                    {:else}
                                                        <Copy size={14} />
                                                    {/if}
                                                </button>
                                            {/if}
                                        </div>
                                        
                                        <!-- Auto-hide indicator -->
                                        {#if isPinVisible}
                                            <p class="text-[10px] text-gray-400 flex items-center gap-1">
                                                <RefreshCw size={10} class="animate-spin" />
                                                Otomatis tersembunyi dalam 5 detik
                                            </p>
                                        {/if}
                                    {/if}
                                </div>
                            </td>
                            
                            <!-- Status -->
                            <td class="px-6 py-4">
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {getStatusColor(user.status)}">
                                    {getStatusLabel(user.status)}
                                </span>
                            </td>
                            
                            <!-- Login Info -->
                            <td class="px-6 py-4">
                                <p class="text-xs text-gray-500">{formatRelativeTime(user.last_login)}</p>
                                {#if user.login_count > 0}
                                    <p class="text-[10px] text-gray-400">{user.login_count}x login</p>
                                {:else}
                                    <p class="text-[10px] text-amber-500">Belum pernah</p>
                                {/if}
                            </td>
                            
                            <!-- Actions -->
                            <td class="px-6 py-4 text-right">
                                {#if !user.is_primary}
                                    <div class="flex items-center justify-end gap-1">
                                        <!-- Edit -->
                                        <button 
                                            on:click={() => emit('edit', user)}
                                            class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" 
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        
                                        <!-- Set/Change PIN -->
                                        {#if canManagePin(user)}
                                            <button 
                                                on:click={() => emit('setPin', user)}
                                                class="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" 
                                                title={user.has_pin ? 'Ubah PIN' : 'Set PIN'}
                                            >
                                                <KeyRound size={16} />
                                            </button>
                                        {/if}
                                        
                                        <!-- Share WhatsApp (only if has PIN) -->
                                        {#if user.has_pin}
                                            <button 
                                                on:click={() => emit('shareWA', user)}
                                                class="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" 
                                                title="Share via WhatsApp"
                                            >
                                                <MessageCircle size={16} />
                                            </button>
                                        {/if}
                                        
                                        <!-- Reset PIN (only if has PIN) -->
                                        {#if user.has_pin}
                                            <button 
                                                on:click={() => emit('resetPin', user)}
                                                class="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" 
                                                title="Reset PIN"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                        {/if}
                                        
                                        <!-- Unlock (only if locked) -->
                                        {#if user.is_locked}
                                            <button 
                                                on:click={() => emit('unlock', user)}
                                                class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                                                title="Unlock Akun"
                                            >
                                                <Unlock size={16} />
                                            </button>
                                        {/if}
                                        
                                        <!-- Reset Password -->
                                        <button 
                                            on:click={() => emit('resetPassword', user)}
                                            class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" 
                                            title="Reset Password"
                                        >
                                            <Key size={16} />
                                        </button>
                                        
                                        <!-- Archive -->
                                        <button 
                                            on:click={() => emit('archive', user)}
                                            class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" 
                                            title="Arsipkan"
                                        >
                                            <Archive size={16} />
                                        </button>
                                        
                                        <!-- Hard Delete -->
                                        {#if canHardDelete(user)}
                                            <button 
                                                on:click={() => emit('delete', user)}
                                                class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                                                title="Hapus Permanen"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        {/if}
                                    </div>
                                {:else}
                                    <span class="text-[10px] text-gray-400">Primary</span>
                                {/if}
                            </td>
                        </tr>
                    {/each}

                    <!-- Archived Section -->
                    {#if showArchived && archivedUsers.length > 0}
                        <tr class="bg-gray-50">
                            <td colspan="6" class="px-6 py-2">
                                <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Diarsipkan ({archivedUsers.length})
                                </span>
                            </td>
                        </tr>
                        {#each archivedUsers as user (user.id)}
                            <tr class="bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                                <!-- User Info -->
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3 opacity-50">
                                        <div class="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 font-medium text-sm">
                                            {user.nama.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-700 text-sm">{user.nama}</p>
                                            <p class="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                
                                <!-- Role -->
                                <td class="px-6 py-4">
                                    <span class="text-sm text-gray-500">{getRoleLabel(user.role)}</span>
                                </td>
                                
                                <!-- PIN Status -->
                                <td class="px-6 py-4">
                                    <span class="text-xs text-gray-400">—</span>
                                </td>
                                
                                <!-- Status -->
                                <td class="px-6 py-4">
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                                        Diarsipkan
                                    </span>
                                </td>
                                
                                <!-- Deleted At -->
                                <td class="px-6 py-4">
                                    <p class="text-xs text-gray-400">{formatRelativeTime(user.deleted_at)}</p>
                                </td>
                                
                                <!-- Actions -->
                                <td class="px-6 py-4 text-right">
                                    <div class="flex items-center justify-end gap-1">
                                        <button 
                                            on:click={() => emit('restore', user)}
                                            class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                                        >
                                            <RotateCcw size={14} /> Restore
                                        </button>
                                        {#if canHardDelete(user)}
                                            <button 
                                                on:click={() => emit('delete', user)}
                                                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 size={14} /> Hapus
                                            </button>
                                        {:else}
                                            <span 
                                                class="text-[10px] text-gray-400 px-2 cursor-help" 
                                                title="Tidak dapat dihapus: {getDeleteReason(user)}"
                                            >
                                                🔒 Protected
                                            </span>
                                        {/if}
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    {/if}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<style>
    /* Animasi untuk PIN visibility */
    code {
        transition: color 0.2s ease;
    }
    
    /* Hover effect untuk row dengan PIN visible */
    tr:has(.pin-visible) {
        background-color: rgba(16, 185, 129, 0.02);
    }
</style>