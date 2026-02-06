<!--
    HoldModal.svelte
    Modal untuk melihat dan melanjutkan transaksi yang ditahan
-->
<script>
    import { Pause, Play, Trash2, X } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { formatRupiah, formatTime } from '$lib/utils/format.js';

    /** @type {boolean} Apakah modal terbuka */
    export let open = false;
    
    /** @type {Array} Daftar transaksi yang ditahan */
    export let holdTransactions = [];

    const dispatch = createEventDispatcher();

    function close() {
        open = false;
    }

    function handleResume(holdId) {
        dispatch('resume', { id: holdId });
    }

    function handleDelete(holdId) {
        dispatch('delete', { id: holdId });
    }

    function handleKeydown(e) {
        if (e.key === 'Escape') close();
    }
</script>

{#if open}
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center"
        on:click={close}
        on:keydown={handleKeydown}
        role="dialog" 
        aria-modal="true"
    >
        <div 
            transition:fly={{ y: 100, duration: 250 }}
            class="bg-white w-full lg:max-w-md lg:rounded-xl rounded-t-2xl max-h-[80vh] flex flex-col"
            style="padding-bottom: env(safe-area-inset-bottom);"
            on:click|stopPropagation 
            on:keydown|stopPropagation 
            role="document"
        >
            <!-- Drag Handle (Mobile) -->
            <div class="lg:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                <div class="w-10 h-1 bg-slate-300 rounded-full"></div>
            </div>
            
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 flex-shrink-0">
                <h2 class="font-semibold text-slate-800 flex items-center gap-2">
                    <Pause class="w-5 h-5 text-amber-600" />
                    Transaksi Ditahan ({holdTransactions.length})
                </h2>
                <button 
                    type="button" 
                    on:click={close}
                    class="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {#if holdTransactions.length === 0}
                    <div class="text-center py-12 text-slate-400">
                        <Pause class="w-12 h-12 mx-auto mb-2" />
                        <p>Tidak ada transaksi ditahan</p>
                    </div>
                {:else}
                    {#each holdTransactions as hold (hold.id)}
                        <div class="bg-slate-50 rounded-xl p-4">
                            <div class="flex items-start justify-between mb-2">
                                <div>
                                    <p class="font-medium text-slate-800">{hold.customer}</p>
                                    <p class="text-xs text-slate-500">{formatTime(hold.time)} • {hold.items.length} item</p>
                                </div>
                                <p class="font-bold text-emerald-600">{formatRupiah(hold.total)}</p>
                            </div>
                            
                            <!-- Items Preview (optional) -->
                            <div class="text-xs text-slate-500 mb-3 line-clamp-2">
                                {hold.items.map(i => `${i.nama_produk} (${i.qty})`).join(', ')}
                            </div>
                            
                            <div class="flex gap-2">
                                <button 
                                    type="button" 
                                    on:click={() => handleResume(hold.id)}
                                    class="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium
                                           flex items-center justify-center gap-1.5 active:bg-emerald-700"
                                >
                                    <Play class="w-4 h-4" />
                                    Lanjutkan
                                </button>
                                <button 
                                    type="button" 
                                    on:click={() => handleDelete(hold.id)}
                                    class="py-2.5 px-4 border border-red-200 text-red-600 rounded-xl active:bg-red-50"
                                >
                                    <Trash2 class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>