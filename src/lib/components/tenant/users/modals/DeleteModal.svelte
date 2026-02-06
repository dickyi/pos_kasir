<!--
    DeleteModal.svelte - Modal Hapus Permanen
    ==========================================
    Konfirmasi untuk menghapus user secara permanen
-->
<script>
    import { enhance } from '$app/forms';
    import { AlertTriangle } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';

    export let show = false;
    export let user = null;
    export let isSubmitting = false;

    const dispatch = createEventDispatcher();

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
                <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={24} class="text-red-600" />
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Hapus Permanen?</h3>
                <p class="text-sm text-gray-500 mt-1">{user.nama}</p>
            </div>
            
            <!-- Warning -->
            <div class="px-5 pb-3">
                <div class="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700 space-y-1.5">
                    <p class="font-medium flex items-center gap-1.5">
                        <AlertTriangle size={12} />
                        Peringatan!
                    </p>
                    <p>• Data user akan dihapus <strong>permanen</strong></p>
                    <p>• Tindakan ini <strong>tidak dapat dibatalkan</strong></p>
                    <p>• Pastikan user ini memang tidak diperlukan</p>
                </div>
            </div>
            
            <!-- Form -->
            <form 
                method="POST" 
                action="?/delete" 
                use:enhance={handleSubmit}
                class="px-5 pb-5"
            >
                <input type="hidden" name="user_id" value={user.id} />
                
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
                        disabled={isSubmitting} 
                        class="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors"
                    >
                        {isSubmitting ? 'Menghapus...' : 'Hapus Permanen'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}
