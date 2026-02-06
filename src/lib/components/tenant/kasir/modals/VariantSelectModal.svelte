<!--
    VariantSelectModal.svelte
    Modal untuk memilih varian produk saat checkout di kasir
    FIXED: Include nama_merk saat dispatch addToCart
-->
<script>
    import { createEventDispatcher } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { X, Package, Plus, Minus, Check, AlertCircle, Tag } from 'lucide-svelte';
    import { formatRupiah } from '$lib/utils/format.js';

    const dispatch = createEventDispatcher();

    /** @type {boolean} */
    export let open = false;

    /** @type {Object|null} Produk yang dipilih */
    export let product = null;

    // Local state
    let selectedVariant = null;
    let quantity = 1;

    // Reset state saat modal dibuka
    $: if (open && product) {
        // Pilih varian default atau varian pertama
        const defaultVariant = product.variants?.find(v => v.is_default) || product.variants?.[0];
        selectedVariant = defaultVariant || null;
        quantity = 1;
    }

    // Computed
    $: variants = product?.variants || [];
    $: hasVariants = variants.length > 0;
    $: selectedStock = selectedVariant?.stok || 0;
    $: canAdd = selectedVariant && quantity > 0 && quantity <= selectedStock;
    
    // Check if product has merk
    $: hasMerk = product?.nama_merk;

    function close() {
        open = false;
        selectedVariant = null;
        quantity = 1;
        dispatch('close');
    }

    function selectVariant(variant) {
        selectedVariant = variant;
        // Reset quantity jika melebihi stok varian baru
        if (quantity > variant.stok) {
            quantity = Math.max(1, variant.stok);
        }
    }

    function incrementQty() {
        if (quantity < selectedStock) {
            quantity += 1;
        }
    }

    function decrementQty() {
        if (quantity > 1) {
            quantity -= 1;
        }
    }

    function handleAddToCart() {
        if (!canAdd) return;

        // Dispatch event dengan data produk + varian + merk
        dispatch('addToCart', {
            id: product.id,
            kode_produk: product.kode_produk,
            nama_produk: product.nama_produk,
            gambar: product.gambar,
            satuan: product.satuan,
            // ============================================
            // FIXED: Include merk info dari parent product
            // ============================================
            merk_id: product.merk_id || null,
            nama_merk: product.nama_merk || null,
            // ============================================
            // Info varian
            varian_id: selectedVariant.id,
            kode_varian: selectedVariant.kode_varian,
            nama_varian: selectedVariant.nama_varian,
            harga_jual: selectedVariant.harga_jual,
            stok: selectedVariant.stok,
            // Quantity
            qty: quantity,
            // Flag
            has_variant: true
        });

        close();
    }

    // Handle click outside
    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            close();
        }
    }
</script>

{#if open && product}
    <!-- Backdrop -->
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
        on:click={handleBackdropClick}
        on:keypress={(e) => e.key === 'Escape' && close()}
        role="button"
        tabindex="-1"
    >
        <!-- Modal -->
        <div 
            transition:fly={{ y: 100, duration: 200 }}
            class="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl 
                   max-h-[85vh] flex flex-col overflow-hidden"
        >
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b border-slate-100">
                <div class="flex items-center gap-3">
                    <!-- Product Image -->
                    <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        {#if product.gambar}
                            <img 
                                src={product.gambar} 
                                alt={product.nama_produk}
                                class="w-full h-full object-cover rounded-xl"
                            />
                        {:else}
                            <Package class="w-6 h-6 text-slate-400" />
                        {/if}
                    </div>
                    <div class="min-w-0">
                        <h3 class="font-semibold text-slate-800 truncate">{product.nama_produk}</h3>
                        <div class="flex items-center gap-2 flex-wrap">
                            <p class="text-xs text-slate-500">{variants.length} varian tersedia</p>
                            <!-- Show Merk Badge if exists -->
                            {#if hasMerk}
                                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-medium rounded">
                                    <Tag class="w-2.5 h-2.5" />
                                    {product.nama_merk}
                                </span>
                            {/if}
                        </div>
                    </div>
                </div>
                <button 
                    type="button"
                    on:click={close}
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
                <!-- Variant Selection -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                        Pilih Varian
                    </label>
                    <div class="space-y-2">
                        {#each variants as variant (variant.id)}
                            {@const isSelected = selectedVariant?.id === variant.id}
                            {@const isOutOfStock = variant.stok <= 0}
                            
                            <button
                                type="button"
                                on:click={() => !isOutOfStock && selectVariant(variant)}
                                disabled={isOutOfStock}
                                class="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                                       {isSelected 
                                           ? 'border-emerald-500 bg-emerald-50' 
                                           : isOutOfStock
                                               ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                                               : 'border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50'}"
                            >
                                <!-- Radio Circle -->
                                <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                            {isSelected 
                                                ? 'border-emerald-500 bg-emerald-500' 
                                                : 'border-slate-300'}">
                                    {#if isSelected}
                                        <Check class="w-3 h-3 text-white" />
                                    {/if}
                                </div>

                                <!-- Variant Info -->
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <span class="font-medium text-slate-800">{variant.nama_varian}</span>
                                        {#if variant.is_default}
                                            <span class="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-medium rounded">
                                                Default
                                            </span>
                                        {/if}
                                    </div>
                                    <p class="text-xs text-slate-500 mt-0.5">
                                        {variant.kode_varian}
                                    </p>
                                </div>

                                <!-- Price & Stock -->
                                <div class="text-right flex-shrink-0">
                                    <p class="font-bold text-emerald-600">{formatRupiah(variant.harga_jual)}</p>
                                    <p class="text-xs {variant.stok > 10 ? 'text-slate-500' : variant.stok > 0 ? 'text-amber-600' : 'text-red-500'}">
                                        {#if isOutOfStock}
                                            Habis
                                        {:else}
                                            Stok: {variant.stok}
                                        {/if}
                                    </p>
                                </div>
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Quantity Selector -->
                {#if selectedVariant}
                    <div class="pt-2 border-t border-slate-100">
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                            Jumlah
                        </label>
                        <div class="flex items-center gap-4">
                            <div class="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                                <button
                                    type="button"
                                    on:click={decrementQty}
                                    disabled={quantity <= 1}
                                    class="w-10 h-10 flex items-center justify-center rounded-lg
                                           bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed
                                           hover:bg-slate-50 transition-colors"
                                >
                                    <Minus class="w-4 h-4" />
                                </button>
                                <span class="w-12 text-center font-bold text-lg text-slate-800">
                                    {quantity}
                                </span>
                                <button
                                    type="button"
                                    on:click={incrementQty}
                                    disabled={quantity >= selectedStock}
                                    class="w-10 h-10 flex items-center justify-center rounded-lg
                                           bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed
                                           hover:bg-slate-50 transition-colors"
                                >
                                    <Plus class="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div class="flex-1 text-right">
                                <p class="text-sm text-slate-500">Subtotal</p>
                                <p class="text-xl font-bold text-emerald-600">
                                    {formatRupiah(selectedVariant.harga_jual * quantity)}
                                </p>
                            </div>
                        </div>

                        <!-- Stock Warning -->
                        {#if selectedStock <= 5 && selectedStock > 0}
                            <div class="flex items-center gap-2 mt-3 p-2 bg-amber-50 rounded-lg">
                                <AlertCircle class="w-4 h-4 text-amber-500" />
                                <span class="text-xs text-amber-700">Stok tinggal {selectedStock} item</span>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-slate-100 bg-slate-50">
                <button
                    type="button"
                    on:click={handleAddToCart}
                    disabled={!canAdd}
                    class="w-full h-12 bg-emerald-600 text-white rounded-xl font-semibold
                           hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors flex items-center justify-center gap-2"
                >
                    <Plus class="w-5 h-5" />
                    <span>Tambah ke Keranjang</span>
                </button>
            </div>
        </div>
    </div>
{/if}