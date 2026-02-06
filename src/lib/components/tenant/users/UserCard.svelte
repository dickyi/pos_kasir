<!--
    UserCard.svelte - Card User Mobile
    ===================================
    Menampilkan daftar user dalam format card untuk mobile
    
    UPDATED: PIN Hidden by default dengan toggle visibility
-->
<script>
    import { 
        Users, MoreVertical, Lock, RotateCcw, Trash2,
        ShieldCheck, ShieldAlert, ShieldX, Shield,
        Eye, EyeOff, Copy, Check, RefreshCw
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
    
    let visiblePins = {};
    let copiedPins = {};
    let hideTimers = {};
    const AUTO_HIDE_DELAY = 5000;

    onDestroy(() => {
        Object.values(hideTimers).forEach(timer => clearTimeout(timer));
    });

    // ==========================================
    // PIN VISIBILITY FUNCTIONS
    // ==========================================
    
    function togglePinVisibility(userId) {
        if (hideTimers[userId]) {
            clearTimeout(hideTimers[userId]);
        }
        
        visiblePins[userId] = !visiblePins[userId];
        visiblePins = visiblePins;
        
        if (visiblePins[userId]) {
            hideTimers[userId] = setTimeout(() => {
                visiblePins[userId] = false;
                visiblePins = visiblePins;
            }, AUTO_HIDE_DELAY);
        }
    }
    
    async function copyPin(userId, pin, event) {
        event.stopPropagation();
        
        try {
            await navigator.clipboard.writeText(pin);
            copiedPins[userId] = true;
            copiedPins = copiedPins;
            
            setTimeout(() => {
                copiedPins[userId] = false;
                copiedPins = copiedPins;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy PIN:', err);
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

    function canHardDelete(user) {
        return user.can_delete === true;
    }

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
        <div class="divide-y divide-gray-100">
            {#each activeUsers as user (user.id)}
                {@const pinBadge = getPinStatusBadge(user)}
                {@const isPinVisible = visiblePins[user.id]}
                {@const isCopied = copiedPins[user.id]}
                <div class="p-4 {user.status !== 'aktif' ? 'opacity-60' : ''} {user.is_locked ? 'bg-red-50/30' : ''}">
                    <div class="flex items-start gap-3">
                        <!-- Avatar -->
                        <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium flex-shrink-0 relative">
                            {user.nama.charAt(0).toUpperCase()}
                            {#if user.is_locked}
                                <div class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                    <Lock size={10} class="text-white" />
                                </div>
                            {/if}
                        </div>
                        
                        <!-- User Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <p class="font-medium text-gray-900 text-sm">{user.nama}</p>
                                {#if user.is_primary}
                                    <span class="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">PRIMARY</span>
                                {/if}
                            </div>
                            <p class="text-xs text-gray-500 truncate">{user.email}</p>
                            
                            <!-- Badges Row -->
                            <div class="flex flex-wrap items-center gap-2 mt-2">
                                <span class="text-xs text-gray-500">{getRoleLabel(user.role)}</span>
                                <span class="text-gray-300">•</span>
                                <span class="text-xs px-1.5 py-0.5 rounded {getStatusColor(user.status)}">
                                    {getStatusLabel(user.status)}
                                </span>
                                <span class="text-gray-300">•</span>
                                <span class="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded {pinBadge.color}">
                                    <svelte:component this={pinBadge.icon} size={10} />
                                    {pinBadge.label}
                                </span>
                            </div>
                            
                            <!-- PIN Display (Hidden by default) -->
                            {#if user.has_pin && user.pin}
                                <div class="mt-2 flex items-center gap-2">
                                    <div class="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-md">
                                        <code class="text-xs font-mono {isPinVisible ? 'text-gray-700' : 'text-gray-400'} tracking-wider">
                                            {isPinVisible ? user.pin : maskPin(user.pin)}
                                        </code>
                                    </div>
                                    
                                    <!-- Toggle Button -->
                                    <button 
                                        type="button"
                                        on:click={() => togglePinVisibility(user.id)}
                                        class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                                        title={isPinVisible ? 'Sembunyikan' : 'Lihat PIN'}
                                    >
                                        {#if isPinVisible}
                                            <EyeOff size={14} />
                                        {:else}
                                            <Eye size={14} />
                                        {/if}
                                    </button>
                                    
                                    <!-- Copy Button -->
                                    {#if isPinVisible}
                                        <button 
                                            type="button"
                                            on:click={(e) => copyPin(user.id, user.pin, e)}
                                            class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                                            title="Copy PIN"
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
                                    <p class="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                        <RefreshCw size={10} class="animate-spin" />
                                        Otomatis tersembunyi dalam 5 detik
                                    </p>
                                {/if}
                            {/if}
                        </div>
                        
                        <!-- Action Button -->
                        {#if !user.is_primary}
                            <button 
                                on:click={() => emit('openMobileActions', user)} 
                                class="p-1.5 text-gray-400 hover:text-gray-600"
                            >
                                <MoreVertical size={18} />
                            </button>
                        {/if}
                    </div>
                </div>
            {/each}

            <!-- Archived Mobile -->
            {#if showArchived && archivedUsers.length > 0}
                <div class="px-4 py-2 bg-gray-50">
                    <span class="text-xs font-medium text-gray-500 uppercase">
                        Diarsipkan ({archivedUsers.length})
                    </span>
                </div>
                {#each archivedUsers as user (user.id)}
                    <div class="p-4 bg-gray-50/50">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 font-medium flex-shrink-0 opacity-50">
                                {user.nama.charAt(0).toUpperCase()}
                            </div>
                            <div class="flex-1 min-w-0 opacity-50">
                                <p class="font-medium text-gray-700 text-sm">{user.nama}</p>
                                <p class="text-xs text-gray-500">{formatRelativeTime(user.deleted_at)}</p>
                            </div>
                            <div class="flex gap-1">
                                <button 
                                    on:click={() => emit('restore', user)} 
                                    class="p-2 text-gray-500 hover:text-gray-700"
                                >
                                    <RotateCcw size={18} />
                                </button>
                                {#if canHardDelete(user)}
                                    <button 
                                        on:click={() => emit('delete', user)} 
                                        class="p-2 text-red-400 hover:text-red-600"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    {/if}
</div>

<style>
    code {
        transition: color 0.2s ease;
    }
</style>