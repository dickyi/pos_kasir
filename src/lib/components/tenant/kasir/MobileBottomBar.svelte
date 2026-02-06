<!--
    MobileBottomBar.svelte
    Fixed bottom bar untuk mobile - preview keranjang + tombol bayar
-->
<script>
    import { ShoppingCart, ChevronUp, CreditCard } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { formatRupiah } from '$lib/utils/format.js';

    /** @type {number} Total items di keranjang */
    export let totalItems = 0;
    
    /** @type {number} Grand total */
    export let grandTotal = 0;

    const dispatch = createEventDispatcher();

    function handleOpenCart() {
        dispatch('openCart');
    }

    function handleCheckout() {
        dispatch('checkout');
    }
</script>

<div 
    class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 z-40"
    style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom));"
>
    {#if totalItems > 0}
        <div class="flex items-center gap-3">
            <!-- Cart Preview - Tap to expand -->
            <button 
                type="button" 
                on:click={handleOpenCart}
                class="flex-1 flex items-center gap-3 p-3 bg-slate-50 rounded-xl active:bg-slate-100 transition-colors"
            >
                <div class="relative flex-shrink-0">
                    <ShoppingCart class="w-6 h-6 text-slate-600" />
                    <span class="absolute -top-2 -right-2 w-5 h-5 bg-emerald-600 text-white text-xs 
                                 rounded-full flex items-center justify-center font-bold">
                        {totalItems}
                    </span>
                </div>
                <div class="flex-1 text-left min-w-0">
                    <p class="text-xs text-slate-500">{totalItems} item</p>
                    <p class="font-bold text-slate-800 truncate">{formatRupiah(grandTotal)}</p>
                </div>
                <ChevronUp class="w-5 h-5 text-slate-400 flex-shrink-0" />
            </button>
            
            <!-- Pay Button -->
            <button 
                type="button" 
                on:click={handleCheckout}
                class="h-14 px-5 sm:px-6 bg-emerald-600 text-white rounded-xl font-semibold
                       active:bg-emerald-700 transition-colors flex items-center gap-2 flex-shrink-0"
            >
                <CreditCard class="w-5 h-5" />
                <span>Bayar</span>
            </button>
        </div>
    {:else}
        <div class="text-center py-1 text-slate-400 text-sm">
            Pilih produk untuk memulai transaksi
        </div>
    {/if}
</div>