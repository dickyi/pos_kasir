<!--
    ResetPasswordModal.svelte - Modal Reset Password
    =================================================
    Form untuk mereset password user
-->
<script>
    import { enhance } from '$app/forms';
    import { Key } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';

    export let show = false;
    export let user = null;
    export let isSubmitting = false;

    const dispatch = createEventDispatcher();

    let newPassword = '';

    // Reset when modal opens
    $: if (show && user) {
        newPassword = '';
    }

    function close() {
        dispatch('close');
    }

    function handleSubmit() {
        dispatch('submitting');
        return async ({ result }) => {
            dispatch('submitted', result);
        };
    }
</script>

{#if show && user}
    <div 
        class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" 
        on:click|self={close}
        on:keydown={(e) => e.key === 'Escape' && close()}
        role="dialog"
        aria-modal="true"
    >
        <div class="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <!-- Header -->
            <div class="p-5 text-center">
                <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Key size={24} class="text-gray-600" />
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Reset Password</h3>
                <p class="text-sm text-gray-500 mt-1">{user.nama}</p>
            </div>
            
            <!-- Form -->
            <form 
                method="POST" 
                action="?/resetPassword" 
                use:enhance={handleSubmit}
                class="px-5 pb-5 space-y-4"
            >
                <input type="hidden" name="user_id" value={user.id} />
                
                <div>
                    <input 
                        type="password" 
                        name="new_password" 
                        bind:value={newPassword}
                        required 
                        minlength="6"
                        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none" 
                        placeholder="Password baru (min. 6 karakter)" 
                    />
                </div>
                
                <div class="flex gap-3">
                    <button 
                        type="button" 
                        on:click={close} 
                        class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Batal
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting || newPassword.length < 6} 
                        class="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 rounded-lg transition-colors"
                    >
                        {isSubmitting ? 'Menyimpan...' : 'Reset'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}
