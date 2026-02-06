<!--
    DeleteConfirmModal.svelte - Modal Konfirmasi Hapus Merk
    ============================================
-->
<script>
    import { enhance } from '$app/forms';
    import { createEventDispatcher } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { 
        X, AlertTriangle, Trash2, Loader2
    } from 'lucide-svelte';

    const dispatch = createEventDispatcher();

    export let open = false;
    export let merk = null;

    let isSubmitting = false;
    let errorMessage = '';

    $: if (open) {
        errorMessage = '';
    }

    function close() {
        open = false;
        dispatch('close');
    }

    function handleSubmit() {
        isSubmitting = true;
        return async ({ result, update }) => {
            isSubmitting = false;
            
            if (result.type === 'success') {
                dispatch('success');
                close();
            } else if (result.type === 'failure') {
                errorMessage = result.data?.error || 'Gagal menghapus merk';
            }
            await update();
        };
    }
</script>

{#if open && merk}
    <!-- Backdrop -->
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
        on:click={close}
        on:keypress={(e) => e.key === 'Escape' && close()}
        role="button"
        tabindex="-1"
    ></div>

    <!-- Modal -->
    <div 
        transition:fly={{ y: 20, duration: 200 }}
        class="fixed inset-x-4 top-[20%] sm:inset-auto sm:left-1/2 sm:top-1/2 
               sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm
               bg-white rounded-2xl shadow-2xl z-50"
    >
        <div class="p-6 text-center">
            <!-- Icon -->
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle class="w-8 h-8 text-red-600" />
            </div>

            <!-- Title -->
            <h3 class="text-lg font-bold text-slate-800 mb-2">Hapus Merk?</h3>
            
            <!-- Message -->
            <p class="text-sm text-slate-600 mb-2">
                Anda yakin ingin menghapus merk:
            </p>
            <p class="text-base font-semibold text-slate-800 mb-4">
                "{merk.nama_merk}"
            </p>

            {#if merk.jumlah_produk > 0}
                <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                    <p class="text-sm text-amber-700">
                        ⚠️ Merk ini memiliki <strong>{merk.jumlah_produk}</strong> produk terkait.
                        Hapus atau pindahkan produk terlebih dahulu.
                    </p>
                </div>
            {/if}

            <!-- Error Message -->
            {#if errorMessage}
                <div class="p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-left">
                    <p class="text-sm text-red-600">{errorMessage}</p>
                </div>
            {/if}

            <!-- Actions -->
            <div class="flex gap-3">
                <button
                    type="button"
                    on:click={close}
                    class="flex-1 h-11 bg-slate-100 text-slate-700 rounded-xl font-semibold
                           hover:bg-slate-200 transition-colors"
                >
                    Batal
                </button>
                
                <form method="POST" action="?/delete" use:enhance={handleSubmit} class="flex-1">
                    <input type="hidden" name="id" value={merk.id} />
                    <button
                        type="submit"
                        disabled={isSubmitting || merk.jumlah_produk > 0}
                        class="w-full h-11 bg-red-600 text-white rounded-xl font-semibold
                               hover:bg-red-700 transition-colors disabled:opacity-50 
                               disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {#if isSubmitting}
                            <Loader2 class="w-4 h-4 animate-spin" />
                        {:else}
                            <Trash2 class="w-4 h-4" />
                        {/if}
                        <span>Hapus</span>
                    </button>
                </form>
            </div>
        </div>
    </div>
{/if}