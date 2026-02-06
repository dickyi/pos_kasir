<!--
    DiscountModal.svelte
    Modal untuk menambah/edit diskon
-->
<script>
    import { Tag, X } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { formatRupiah } from '$lib/utils/format.js';

    /** @type {boolean} Apakah modal terbuka */
    export let open = false;
    
    /** @type {'nominal'|'persen'} Tipe diskon */
    export let diskonType = 'nominal';
    
    /** @type {number} Nilai diskon */
    export let diskonValue = 0;
    
    /** @type {number} Subtotal untuk kalkulasi */
    export let subtotal = 0;

    const dispatch = createEventDispatcher();

    // Local state untuk editing
    let localType = diskonType;
    let localValue = diskonValue;

    // Sync ketika modal dibuka
    $: if (open) {
        localType = diskonType;
        localValue = diskonValue;
    }

    // Calculate preview
    $: diskonAmount = localType === 'persen' 
        ? Math.round(subtotal * (localValue / 100))
        : localValue;
    
    $: grandTotal = Math.max(0, subtotal - diskonAmount);

    function close() {
        open = false;
    }

    function handleApply() {
        dispatch('apply', { type: localType, value: localValue });
        close();
    }

    function handleClear() {
        dispatch('apply', { type: 'nominal', value: 0 });
        close();
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
            class="bg-white w-full lg:max-w-sm lg:rounded-xl rounded-t-2xl"
            style="padding-bottom: env(safe-area-inset-bottom);"
            on:click|stopPropagation 
            on:keydown|stopPropagation 
            role="document"
        >
            <!-- Drag Handle (Mobile) -->
            <div class="lg:hidden flex justify-center pt-3 pb-1">
                <div class="w-10 h-1 bg-slate-300 rounded-full"></div>
            </div>
            
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <h2 class="font-semibold text-slate-800 flex items-center gap-2">
                    <Tag class="w-5 h-5 text-emerald-600" />
                    Tambah Diskon
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
            <div class="p-4 space-y-4">
                <!-- Type Toggle -->
                <div class="flex rounded-xl border border-slate-200 overflow-hidden">
                    <button 
                        type="button" 
                        on:click={() => localType = 'nominal'}
                        class="flex-1 py-3 text-sm font-medium transition-colors
                            {localType === 'nominal' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'}"
                    >
                        Nominal (Rp)
                    </button>
                    <button 
                        type="button" 
                        on:click={() => localType = 'persen'}
                        class="flex-1 py-3 text-sm font-medium transition-colors
                            {localType === 'persen' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'}"
                    >
                        Persentase (%)
                    </button>
                </div>

                <!-- Value Input -->
                <div class="relative">
                    {#if localType === 'nominal'}
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
                        <input 
                            type="number" 
                            bind:value={localValue} 
                            placeholder="0" 
                            inputmode="numeric"
                            class="w-full h-14 pl-12 pr-4 border border-slate-200 rounded-xl text-xl font-bold
                                   focus:outline-none focus:border-emerald-500 number-input" 
                            min="0" 
                            max={subtotal} 
                        />
                    {:else}
                        <input 
                            type="number" 
                            bind:value={localValue} 
                            placeholder="0" 
                            inputmode="numeric"
                            class="w-full h-14 pl-4 pr-12 border border-slate-200 rounded-xl text-xl font-bold
                                   focus:outline-none focus:border-emerald-500 number-input" 
                            min="0" 
                            max="100" 
                        />
                        <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                    {/if}
                </div>

                <!-- Preview -->
                {#if localValue > 0}
                    <div class="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
                        <div class="flex justify-between">
                            <span class="text-slate-500">Subtotal</span>
                            <span>{formatRupiah(subtotal)}</span>
                        </div>
                        <div class="flex justify-between text-red-500">
                            <span>Diskon</span>
                            <span>-{formatRupiah(diskonAmount)}</span>
                        </div>
                        <div class="flex justify-between font-semibold pt-2 border-t border-slate-200">
                            <span>Total Baru</span>
                            <span class="text-emerald-600">{formatRupiah(grandTotal)}</span>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-slate-200 flex gap-3">
                <button 
                    type="button" 
                    on:click={handleClear}
                    class="flex-1 h-12 border border-slate-200 text-slate-600 rounded-xl font-medium active:bg-slate-50"
                >
                    Hapus
                </button>
                <button 
                    type="button" 
                    on:click={handleApply}
                    class="flex-1 h-12 bg-emerald-600 text-white rounded-xl font-medium active:bg-emerald-700"
                >
                    Terapkan
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .number-input::-webkit-inner-spin-button,
    .number-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    .number-input {
        -moz-appearance: textfield;
    }
</style>