<!--
    CartBottomSheet.svelte
    Bottom sheet keranjang untuk mobile
    + Permission support untuk diskon
    UPDATED: 
    - Unique key untuk produk dengan varian
    - Support tampilan merk (conditional)
-->
<script>
    import { ShoppingCart, Pause, Trash2, Tag, X, CreditCard, Lock } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { formatRupiah } from '$lib/utils/format.js';
    import CartItem from './CartItem.svelte';

    /** @type {boolean} Apakah sheet terbuka */
    export let open = false;
    
    /** @type {Array} Items di keranjang */
    export let cart = [];
    
    /** @type {number} Total items */
    export let totalItems = 0;
    
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

    function close() {
        open = false;
    }

    function handleUpdateQty(event) {
        dispatch('updateQty', event.detail);
    }

    function handleRemove(event) {
        dispatch('remove', event.detail);
        // Tutup sheet jika cart kosong setelah remove
        if (cart.length <= 1) {
            close();
        }
    }

    function handleHold() {
        dispatch('hold');
        close();
    }

    function handleClear() {
        dispatch('clear');
        close();
    }

    function handleDiscount() {
        if (!canDiscount) return; // Guard
        dispatch('openDiscount');
        close();
    }

    function handleCheckout() {
        dispatch('checkout');
        close();
    }

    function handleKeydown(e) {
        if (e.key === 'Escape') close();
    }
</script>

{#if open}
    <div 
        transition:fade={{ duration: 150 }}
        class="lg:hidden fixed inset-0 bg-black/50 z-50"
        on:click={close}
        on:keydown={handleKeydown}
        role="dialog"
        aria-modal="true"
    >
        <div 
            transition:fly={{ y: 500, duration: 300 }}
            class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col"
            style="padding-bottom: env(safe-area-inset-bottom);"
            on:click|stopPropagation
            on:keydown|stopPropagation
            role="document"
        >
            <!-- Drag Handle -->
            <div class="flex justify-center pt-3 pb-2 flex-shrink-0">
                <div class="w-10 h-1 bg-slate-300 rounded-full"></div>
            </div>
            
            <!-- Header -->
            <div class="flex items-center justify-between px-4 pb-3 border-b border-slate-100 flex-shrink-0">
                <div class="flex items-center gap-2">
                    <ShoppingCart class="w-5 h-5 text-slate-700" />
                    <span class="font-semibold text-slate-800">Keranjang</span>
                    <span class="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        {totalItems} item
                    </span>
                </div>
                <div class="flex items-center gap-1">
                    <button 
                        type="button" 
                        on:click={handleHold}
                        class="p-2 text-amber-600 active:bg-amber-50 rounded-lg"
                        title="Tahan Transaksi"
                    >
                        <Pause class="w-5 h-5" />
                    </button>
                    <button 
                        type="button" 
                        on:click={handleClear}
                        class="p-2 text-red-500 active:bg-red-50 rounded-lg"
                        title="Hapus Semua"
                    >
                        <Trash2 class="w-5 h-5" />
                    </button>
                    <button 
                        type="button" 
                        on:click={close}
                        class="p-2 text-slate-400 active:bg-slate-100 rounded-lg"
                        title="Tutup"
                    >
                        <X class="w-5 h-5" />
                    </button>
                </div>
            </div>

            <!-- Cart Items -->
            <div class="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {#each cart as item (getItemKey(item))}
                    <CartItem 
                        {item} 
                        mode="full"
                        {showMerk}
                        on:updateQty={handleUpdateQty}
                        on:remove={handleRemove}
                    />
                {/each}
            </div>

            <!-- Summary & Pay -->
            <div class="flex-shrink-0 border-t border-slate-200 p-4 space-y-3 bg-slate-50">
                <!-- Discount -->
                {#if canDiscount}
                    <!-- Owner & Admin: Bisa klik untuk buka modal diskon -->
                    <button 
                        type="button" 
                        on:click={handleDiscount}
                        class="w-full flex items-center justify-between py-2 active:bg-slate-100 -mx-2 px-2 rounded-lg"
                    >
                        <span class="text-slate-600 flex items-center gap-2">
                            <Tag class="w-4 h-4" />
                            Diskon
                        </span>
                        {#if diskonAmount > 0}
                            <span class="text-red-500 font-medium">-{formatRupiah(diskonAmount)}</span>
                        {:else}
                            <span class="text-slate-400 text-sm">Tambah →</span>
                        {/if}
                    </button>
                {:else}
                    <!-- Kasir: Disabled, tampilkan info -->
                    <div class="w-full flex items-center justify-between py-2 -mx-2 px-2 rounded-lg bg-amber-50 border border-amber-100">
                        <span class="text-amber-700 flex items-center gap-2">
                            <Lock class="w-4 h-4" />
                            Diskon
                        </span>
                        {#if diskonAmount > 0}
                            <span class="text-red-500 font-medium">-{formatRupiah(diskonAmount)}</span>
                        {:else}
                            <span class="text-amber-600 text-xs">Hubungi Admin</span>
                        {/if}
                    </div>
                {/if}
                
                <!-- Total -->
                <div class="flex items-center justify-between py-3 border-t border-slate-200">
                    <span class="text-slate-600 font-medium">Total</span>
                    <span class="text-2xl font-bold text-emerald-600">{formatRupiah(grandTotal)}</span>
                </div>
                
                <!-- Pay Button -->
                <button 
                    type="button" 
                    on:click={handleCheckout}
                    class="w-full h-14 bg-emerald-600 text-white rounded-xl font-semibold text-lg
                           active:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                    <CreditCard class="w-6 h-6" />
                    <span>Bayar</span>
                </button>
            </div>
        </div>
    </div>
{/if}