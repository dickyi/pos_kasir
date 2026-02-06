<!--
    CartPanel.svelte
    Panel keranjang belanja untuk desktop (side panel)
    + Permission support untuk diskon
    UPDATED: 
    - Unique key untuk produk dengan varian
    - Support tampilan merk (conditional)
-->
<script>
    import { ShoppingCart, Pause, Trash2, Tag, X, CreditCard, Lock } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    import { formatRupiah } from '$lib/utils/format.js';
    import CartItem from './CartItem.svelte';

    /** @type {Array} Items di keranjang */
    export let cart = [];
    
    /** @type {number} Total items */
    export let totalItems = 0;
    
    /** @type {number} Subtotal */
    export let subtotal = 0;
    
    /** @type {number} Jumlah diskon */
    export let diskonAmount = 0;
    
    /** @type {number} Grand total */
    export let grandTotal = 0;
    
    /** @type {boolean} Apakah user bisa kasih diskon (Owner & Admin only) */
    export let canDiscount = true;

    /** @type {boolean} Tampilkan merk di keranjang (conditional dari setting) */
    export let showMerk = false;

    const dispatch = createEventDispatcher();

    /**
     * Generate unique key untuk cart item
     * Kombinasi produk_id dan varian_id untuk mencegah duplicate key
     */
    function getItemKey(item) {
        if (item.varian_id) {
            return `${item.id}-${item.varian_id}`;
        }
        return `${item.id}`;
    }

    function handleUpdateQty(event) {
        dispatch('updateQty', event.detail);
    }

    function handleRemove(event) {
        dispatch('remove', event.detail);
    }

    function handleHold() {
        dispatch('hold');
    }

    function handleClear() {
        dispatch('clear');
    }

    function handleDiscount() {
        if (!canDiscount) return; // Guard
        dispatch('openDiscount');
    }

    function handleClearDiscount() {
        dispatch('clearDiscount');
    }

    function handleCheckout() {
        dispatch('checkout');
    }
</script>

<div class="hidden lg:flex w-96 bg-white rounded-xl border border-slate-200 flex-col max-h-[calc(100vh-200px)]">
    
    <!-- Cart Header -->
    <div class="flex-shrink-0 p-4 bg-slate-800 text-white rounded-t-xl">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <ShoppingCart class="w-5 h-5" />
                <span class="font-semibold">Keranjang</span>
                {#if totalItems > 0}
                    <span class="bg-emerald-500 text-xs px-2 py-0.5 rounded-full font-medium">
                        {totalItems}
                    </span>
                {/if}
            </div>
            {#if cart.length > 0}
                <div class="flex items-center gap-1">
                    <button 
                        type="button" 
                        on:click={handleHold}
                        class="p-1.5 hover:bg-white/10 rounded-lg transition-colors" 
                        title="Tahan Transaksi"
                    >
                        <Pause class="w-4 h-4" />
                    </button>
                    <button 
                        type="button" 
                        on:click={handleClear}
                        class="p-1.5 hover:bg-white/10 rounded-lg transition-colors" 
                        title="Hapus Semua"
                    >
                        <Trash2 class="w-4 h-4" />
                    </button>
                </div>
            {/if}
        </div>
    </div>

    <!-- Cart Items -->
    <div class="flex-1 overflow-y-auto">
        {#if cart.length === 0}
            <div class="flex flex-col items-center justify-center py-16 text-slate-400">
                <ShoppingCart class="w-12 h-12 mb-2" />
                <p class="text-sm">Keranjang kosong</p>
            </div>
        {:else}
            <div class="p-3 space-y-2">
                {#each cart as item (getItemKey(item))}
                    <div transition:slide={{ duration: 150 }}>
                        <CartItem 
                            {item} 
                            mode="compact"
                            {showMerk}
                            on:updateQty={handleUpdateQty}
                            on:remove={handleRemove}
                        />
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Cart Summary -->
    <div class="flex-shrink-0 border-t border-slate-200 bg-slate-50 rounded-b-xl p-4 space-y-3">
        <!-- Subtotal -->
        <div class="flex justify-between text-sm">
            <span class="text-slate-500">Subtotal ({totalItems} item)</span>
            <span class="text-slate-700">{formatRupiah(subtotal)}</span>
        </div>
        
        <!-- Discount -->
        <div class="flex justify-between text-sm items-center">
            {#if canDiscount}
                <!-- Owner & Admin: Bisa klik untuk buka modal diskon -->
                <button 
                    type="button" 
                    on:click={handleDiscount}
                    class="text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                >
                    <Tag class="w-3.5 h-3.5" />
                    <span>Diskon</span>
                </button>
            {:else}
                <!-- Kasir: Disabled, tidak bisa klik -->
                <span class="text-slate-400 flex items-center gap-1 cursor-not-allowed" title="Hubungi Owner/Admin untuk diskon">
                    <Lock class="w-3.5 h-3.5" />
                    <span>Diskon</span>
                </span>
            {/if}
            
            {#if diskonAmount > 0}
                <div class="flex items-center gap-2">
                    <span class="text-red-500 font-medium">-{formatRupiah(diskonAmount)}</span>
                    {#if canDiscount}
                        <button 
                            type="button" 
                            on:click={handleClearDiscount} 
                            class="text-slate-400 hover:text-red-500"
                        >
                            <X class="w-3.5 h-3.5" />
                        </button>
                    {/if}
                </div>
            {:else}
                {#if !canDiscount}
                    <span class="text-xs text-slate-400">Hubungi Admin</span>
                {:else}
                    <span class="text-slate-400">-</span>
                {/if}
            {/if}
        </div>
        
        <!-- Grand Total -->
        <div class="flex justify-between text-lg font-bold pt-3 border-t border-slate-200">
            <span class="text-slate-800">Total</span>
            <span class="text-emerald-600">{formatRupiah(grandTotal)}</span>
        </div>
        
        <!-- Pay Button -->
        <button 
            type="button" 
            on:click={handleCheckout} 
            disabled={cart.length === 0}
            class="w-full h-12 bg-emerald-600 text-white rounded-xl font-semibold
                   hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors flex items-center justify-center gap-2"
        >
            <CreditCard class="w-5 h-5" />
            <span>Bayar</span>
        </button>
    </div>
</div>