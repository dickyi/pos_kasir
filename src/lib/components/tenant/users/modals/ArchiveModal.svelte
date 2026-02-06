<!--
    ArchiveModal.svelte - Modal Arsipkan User
    ==========================================
    Konfirmasi untuk mengarsipkan (soft delete) user
-->
<script>
    import { enhance } from '$app/forms';
    import { Archive } from 'lucide-svelte';
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
                <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Archive size={24} class="text-gray-600" />
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Arsipkan User?</h3>
                <p class="text-sm text-gray-500 mt-1">{user.nama}</p>
            </div>
            
            <!-- Info -->
            <div class="px-5 pb-3">
                <div class="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1.5">
                    <p>• User tidak muncul di daftar utama</p>
                    <p>• User tidak dapat login</p>
                    <p>• PIN akan dihapus</p>
                    <p>• Data transaksi tetap tersimpan</p>
                    <p>• Dapat dikembalikan kapan saja</p>
                </div>
            </div>
            
            <!-- Form -->
            <form 
                method="POST" 
                action="?/archive" 
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
                        class="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 rounded-lg transition-colors"
                    >
                        {isSubmitting ? 'Mengarsipkan...' : 'Arsipkan'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}
