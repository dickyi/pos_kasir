<!--
    CartItem.svelte
    Item di dalam keranjang belanja
    UPDATED: 
    - Support tampilan info varian
    - Support tampilan info merk (conditional)
    - Format label teks: "Merk: xxx" dan "Varian: xxx"
-->
<script>
    import { Package, Plus, Minus, X, Layers, Tag } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { formatRupiah } from '$lib/utils/format.js';

    /** @type {Object} Item keranjang */
    export let item;
    
    /** @type {'compact'|'full'} Tampilan mode */
    export let mode = 'compact';

    /** @type {boolean} Tampilkan merk (conditional dari setting) */
    export let showMerk = false;

    const dispatch = createEventDispatcher();

    // Computed
    $: hasVariant = item.varian_id || item.nama_varian;
    $: hasMerk = showMerk && item.nama_merk;
    $: displayName = item.nama_produk;

    function increment() {
        dispatch('updateQty', { id: item.id, varianId: item.varian_id, qty: item.qty + 1 });
    }

    function decrement() {
        dispatch('updateQty', { id: item.id, varianId: item.varian_id, qty: item.qty - 1 });
    }

    function remove() {
        dispatch('remove', { id: item.id, varianId: item.varian_id });
    }
</script>

{#if mode === 'compact'}
    <!-- Compact Mode - untuk desktop cart panel -->
    <div class="bg-slate-50 rounded-xl p-3">
        <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex-1 min-w-0">
                <p class="font-medium text-slate-800 text-sm truncate">{displayName}</p>
                
                <!-- Merk Label -->
                {#if hasMerk}
                    <div class="flex items-center gap-1 mt-0.5">
                        <Tag class="w-3 h-3 text-purple-500" />
                        <span class="text-xs text-purple-600 truncate">
                            Merk: {item.nama_merk}
                        </span>
                    </div>
                {/if}
                
                <!-- Variant Label -->
                {#if hasVariant}
                    <div class="flex items-center gap-1 mt-0.5">
                        <Layers class="w-3 h-3 text-slate-400" />
                        <span class="text-xs text-slate-500 truncate">
                            Varian: {item.nama_varian}
                        </span>
                    </div>
                {/if}
                
                <p class="text-emerald-600 text-sm font-semibold mt-1">{formatRupiah(item.harga_jual)}</p>
            </div>
            <button 
                type="button" 
                on:click={remove}
                class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
                <X class="w-4 h-4" />
            </button>
        </div>
        
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-1">
                <button 
                    type="button" 
                    on:click={decrement}
                    class="w-8 h-8 bg-white border border-slate-200 rounded-lg 
                           flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                    <Minus class="w-4 h-4" />
                </button>
                <span class="w-10 text-center font-semibold text-sm">{item.qty}</span>
                <button 
                    type="button" 
                    on:click={increment}
                    class="w-8 h-8 bg-white border border-slate-200 rounded-lg 
                           flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                    <Plus class="w-4 h-4" />
                </button>
            </div>
            <p class="font-bold text-slate-800">{formatRupiah(item.harga_jual * item.qty)}</p>
        </div>
    </div>

{:else}
    <!-- Full Mode - untuk mobile bottom sheet -->
    <div class="bg-slate-50 rounded-xl p-3">
        <div class="flex items-start gap-3">
            <!-- Thumbnail -->
            <div class="w-12 h-12 bg-white rounded-lg border border-slate-200 
                        flex items-center justify-center flex-shrink-0 relative">
                {#if item.gambar}
                    <img 
                        src={item.gambar} 
                        alt={item.nama_produk}
                        class="w-full h-full object-cover rounded-lg"
                    />
                {:else}
                    <Package class="w-5 h-5 text-slate-300" />
                {/if}
                
                <!-- Variant indicator -->
                {#if hasVariant}
                    <div class="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full 
                                flex items-center justify-center">
                        <Layers class="w-2.5 h-2.5 text-white" />
                    </div>
                {/if}
            </div>
            
            <div class="flex-1 min-w-0">
                <p class="font-medium text-slate-800 text-sm truncate">{displayName}</p>
                
                <!-- Merk Label -->
                {#if hasMerk}
                    <p class="text-xs text-purple-600 mt-0.5 flex items-center gap-1">
                        <Tag class="w-3 h-3" />
                        Merk: {item.nama_merk}
                    </p>
                {/if}
                
                <!-- Variant Label -->
                {#if hasVariant}
                    <p class="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Layers class="w-3 h-3" />
                        Varian: {item.nama_varian}
                    </p>
                {/if}
                
                <p class="text-emerald-600 font-semibold text-sm mt-1">{formatRupiah(item.harga_jual)}</p>
            </div>
            
            <button 
                type="button" 
                on:click={remove}
                class="p-2 text-slate-400 active:text-red-500 active:bg-red-50 rounded-lg flex-shrink-0"
            >
                <X class="w-4 h-4" />
            </button>
        </div>
        
        <!-- Qty Controls -->
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
            <div class="flex items-center gap-2">
                <button 
                    type="button" 
                    on:click={decrement}
                    class="w-10 h-10 bg-white border border-slate-200 rounded-xl 
                           flex items-center justify-center active:bg-slate-100"
                >
                    <Minus class="w-4 h-4" />
                </button>
                <span class="w-10 text-center font-bold text-lg">{item.qty}</span>
                <button 
                    type="button" 
                    on:click={increment}
                    class="w-10 h-10 bg-white border border-slate-200 rounded-xl 
                           flex items-center justify-center active:bg-slate-100"
                >
                    <Plus class="w-4 h-4" />
                </button>
            </div>
            <p class="font-bold text-slate-800 text-lg">{formatRupiah(item.harga_jual * item.qty)}</p>
        </div>
    </div>
{/if}