<!--
    ProductDeleteModal.svelte - Modal Konfirmasi Hapus
    ============================================
    Konfirmasi sebelum menghapus produk
-->
<script>
    import { createEventDispatcher } from 'svelte';
    import { enhance } from '$app/forms';
    import { fade, fly } from 'svelte/transition';
    import { Trash2, Loader2 } from 'lucide-svelte';

    export let open = false;
    export let produk = null;

    const dispatch = createEventDispatcher();

    let isSubmitting = false;

    function closeModal() {
        open = false;
        dispatch('close');
    }

    function handleDelete() {
        isSubmitting = true;
        return async ({ result, update }) => {
            isSubmitting = false;
            if (result.type === 'success') {
                closeModal();
            }
            await update();
        };
    }
</script>

{#if open && produk}
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4"
        on:click|self={closeModal}
        role="dialog"
        aria-modal="true"
    >
        <div 
            transition:fly={{ y: 10, duration: 200 }}
            class="bg-white rounded-xl w-full max-w-sm p-5 text-center"
        >
            <!-- Icon -->
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 class="w-6 h-6 text-red-600" />
            </div>

            <!-- Title -->
            <h3 class="text-base font-semibold text-slate-800 mb-2">Hapus Produk?</h3>
            
            <!-- Description -->
            <p class="text-slate-500 text-sm mb-5">
                <strong class="text-slate-700">"{produk.nama_produk}"</strong> akan dihapus permanen.
            </p>
            
            <!-- Form -->
            <form 
                method="POST" 
                action="?/delete"
                use:enhance={handleDelete}
                class="flex gap-3"
            >
                <input type="hidden" name="id" value={produk.id} />
                
                <button
                    type="button"
                    on:click={closeModal}
                    class="flex-1 h-10 border border-slate-200 text-slate-600 rounded-lg 
                           hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                    Batal
                </button>
                
                <button
                    type="submit"
                    disabled={isSubmitting}
                    class="flex-1 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 
                           transition-colors text-sm font-medium disabled:opacity-50
                           flex items-center justify-center gap-2"
                >
                    {#if isSubmitting}
                        <Loader2 class="w-4 h-4 animate-spin" />
                    {/if}
                    <span>Hapus</span>
                </button>
            </form>
        </div>
    </div>
{/if}