<!--
    ProductListItem.svelte
    List item untuk menampilkan satu produk di list view
    UPDATED: 
    - Support varian badge
    - Support merk badge (conditional)
-->
<script>
    import { Package, Layers, Tag, Plus } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { formatRupiah } from '$lib/utils/format.js';

    /** @type {Object} Produk yang ditampilkan */
    export let product;

    /** @type {boolean} Tampilkan badge merk (NEW!) */
    export let showMerk = false;

    const dispatch = createEventDispatcher();

    // Computed
    $: hasVariants = product.has_variant && product.variants?.length > 0;
    $: variantCount = product.variants?.length || 0;
    $: hasMerk = showMerk && product.nama_merk;
    
    // Harga range untuk produk dengan varian
    $: priceRange = hasVariants ? getPriceRange(product.variants) : null;

    function getPriceRange(variants) {
        if (!variants || variants.length === 0) return null;
        const prices = variants.map(v => v.harga_jual);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return { min, max, isSame: min === max };
    }

    function handleClick() {
        if (isOutOfStock) return;
        dispatch('select', product);
    }

    // Cek apakah produk out of stock
    $: isOutOfStock = hasVariants 
        ? product.variants.every(v => v.stok <= 0)
        : product.stok <= 0;

    // Total stok
    $: displayStock = hasVariants
        ? product.variants.reduce((sum, v) => sum + v.stok, 0)
        : product.stok;
</script>

<button
    type="button"
    on:click={handleClick}
    disabled={isOutOfStock}
    class="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-emerald-50 
           active:bg-emerald-100 border border-slate-200 hover:border-emerald-200 
           rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed
           active:scale-[0.99] text-left"
>
    <!-- Product Image -->
    <div class="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-lg flex items-center 
                justify-center border border-slate-100 flex-shrink-0 overflow-hidden">
        {#if product.gambar}
            <img 
                src={product.gambar} 
                alt={product.nama_produk}
                class="w-full h-full object-cover rounded-lg"
            />
        {:else}
            <Package class="w-6 h-6 text-slate-300" />
        {/if}
    </div>
    
    <!-- Product Info -->
    <div class="flex-1 min-w-0">
        <div class="flex items-start gap-2">
            <p class="font-medium text-slate-800 text-sm truncate flex-1">
                {product.nama_produk}
            </p>
            
            <!-- Badges -->
            <div class="flex items-center gap-1 flex-shrink-0">
                {#if hasVariants}
                    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 
                                 text-purple-700 text-[10px] font-semibold rounded">
                        <Layers class="w-3 h-3" />
                        {variantCount}
                    </span>
                {/if}
            </div>
        </div>
        
        <!-- Merk & Category -->
        <div class="flex items-center gap-2 mt-0.5 flex-wrap">
            {#if hasMerk}
                <span class="inline-flex items-center gap-1 text-[10px] text-purple-600">
                    <Tag class="w-3 h-3" />
                    {product.nama_merk}
                </span>
            {/if}
            {#if product.nama_kategori}
                <span class="text-[10px] text-slate-500">
                    {product.nama_kategori}
                </span>
            {/if}
        </div>
        
        <!-- Price & Stock -->
        <div class="flex items-center justify-between mt-1.5">
            <!-- Harga -->
            {#if hasVariants && priceRange}
                {#if priceRange.isSame}
                    <p class="text-emerald-600 font-bold text-sm">
                        {formatRupiah(priceRange.min)}
                    </p>
                {:else}
                    <p class="text-emerald-600 font-bold text-xs">
                        {formatRupiah(priceRange.min)} - {formatRupiah(priceRange.max)}
                    </p>
                {/if}
            {:else}
                <p class="text-emerald-600 font-bold text-sm">
                    {formatRupiah(product.harga_jual)}
                </p>
            {/if}
            
            <!-- Stock Badge -->
            <span class="text-[10px] px-1.5 py-0.5 rounded font-medium
                {displayStock > 10 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : displayStock > 0 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-red-100 text-red-700'}">
                Stok: {displayStock}
            </span>
        </div>
    </div>
    
    <!-- Add Button -->
    <div class="flex-shrink-0">
        <div class="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 rounded-xl 
                    flex items-center justify-center text-white transition-colors
                    {isOutOfStock ? 'opacity-50' : ''}">
            <Plus class="w-5 h-5" />
        </div>
    </div>
</button>