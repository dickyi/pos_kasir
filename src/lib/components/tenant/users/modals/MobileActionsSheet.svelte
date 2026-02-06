<!--
    MobileActionsSheet.svelte - Action Sheet Mobile
    ================================================
    Bottom sheet untuk aksi user di mobile
-->
<script>
    import { 
        Edit, Key, KeyRound, RefreshCw, Unlock, 
        Archive, Trash2, Lock, MessageCircle
    } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';

    export let show = false;
    export let user = null;

    const dispatch = createEventDispatcher();

    function close() {
        dispatch('close');
    }

    function emit(event) {
        dispatch(event, user);
    }

    // Permission checks
    function canManagePin(user) {
        return user?.pin_status !== 'not_needed';
    }

    function canHardDelete(user) {
        return user?.can_delete === true;
    }
</script>

{#if show && user}
    <div 
        class="fixed inset-0 bg-black/40 z-50 flex items-end" 
        on:click|self={close}
        on:keydown={(e) => e.key === 'Escape' && close()}
        role="dialog"
        aria-modal="true"
    >
        <div class="bg-white rounded-t-xl w-full shadow-xl animate-slide-up">
            <!-- Header -->
            <div class="p-4 border-b border-gray-100">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium relative">
                        {user.nama.charAt(0).toUpperCase()}
                        {#if user.is_locked}
                            <div class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                <Lock size={10} class="text-white" />
                            </div>
                        {/if}
                    </div>
                    <div>
                        <p class="font-medium text-gray-900 text-sm">{user.nama}</p>
                        <p class="text-xs text-gray-500">{user.email}</p>
                    </div>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="p-2">
                <!-- Edit -->
                <button 
                    on:click={() => emit('edit')}
                    class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg text-left"
                >
                    <Edit size={18} class="text-gray-500" />
                    <span class="text-sm text-gray-700">Edit User</span>
                </button>
                
                <!-- Set/Change PIN -->
                {#if canManagePin(user)}
                    <button 
                        on:click={() => emit('setPin')}
                        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 rounded-lg text-left"
                    >
                        <KeyRound size={18} class="text-emerald-500" />
                        <span class="text-sm text-emerald-700">
                            {user.has_pin ? 'Ubah PIN' : 'Set PIN'}
                        </span>
                    </button>
                {/if}
                
                <!-- Share WhatsApp (only if has PIN) -->
                {#if user.has_pin}
                    <button 
                        on:click={() => emit('shareWA')}
                        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 rounded-lg text-left"
                    >
                        <MessageCircle size={18} class="text-green-500" />
                        <span class="text-sm text-green-700">Share via WhatsApp</span>
                    </button>
                {/if}
                
                <!-- Reset PIN (only if has PIN) -->
                {#if user.has_pin}
                    <button 
                        on:click={() => emit('resetPin')}
                        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 rounded-lg text-left"
                    >
                        <RefreshCw size={18} class="text-amber-500" />
                        <span class="text-sm text-amber-700">Reset PIN</span>
                    </button>
                {/if}
                
                <!-- Unlock (only if locked) -->
                {#if user.is_locked}
                    <button 
                        on:click={() => emit('unlock')}
                        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-lg text-left"
                    >
                        <Unlock size={18} class="text-red-500" />
                        <span class="text-sm text-red-700">Buka Kunci Akun</span>
                    </button>
                {/if}
                
                <!-- Reset Password -->
                <button 
                    on:click={() => emit('resetPassword')}
                    class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg text-left"
                >
                    <Key size={18} class="text-gray-500" />
                    <span class="text-sm text-gray-700">Reset Password</span>
                </button>
                
                <!-- Archive -->
                <button 
                    on:click={() => emit('archive')}
                    class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg text-left"
                >
                    <Archive size={18} class="text-gray-500" />
                    <span class="text-sm text-gray-700">Arsipkan User</span>
                </button>
                
                <!-- Hard Delete (only if can delete) -->
                {#if canHardDelete(user)}
                    <button 
                        on:click={() => emit('delete')}
                        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-lg text-left"
                    >
                        <Trash2 size={18} class="text-red-500" />
                        <span class="text-sm text-red-600">Hapus Permanen</span>
                    </button>
                {/if}
            </div>
            
            <!-- Close Button -->
            <div class="p-4 border-t border-gray-100">
                <button 
                    on:click={close} 
                    class="w-full py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    Tutup
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    @keyframes slide-up {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
    }
    .animate-slide-up {
        animation: slide-up 0.2s ease-out;
    }
</style>
