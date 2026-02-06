<!--
    ProductCard.svelte
    Card untuk menampilkan satu produk di grid
    UPDATED: 
    - Support varian badge
    - Support merk badge (conditional)
-->
<script>
    import { Package, Layers, Tag } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { formatRupiah, formatRupiahShort } from '$lib/utils/format.js';

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
        if (product.stok <= 0 && !hasVariants) {
            return;
        }
        
        // Untuk produk dengan varian, cek total stok varian
        if (hasVariants) {
            const totalVariantStock = product.variants.reduce((sum, v) => sum + v.stok, 0);
            if (totalVariantStock <= 0) {
                return;
            }
        }
        
        dispatch('select', product);
    }

    // Cek apakah produk out of stock
    $: isOutOfStock = hasVariants 
        ? product.variants.every(v => v.stok <= 0)
        : product.stok <= 0;

    // Total stok (untuk produk dengan varian, ambil dari varian)
    $: displayStock = hasVariants
        ? product.variants.reduce((sum, v) => sum + v.stok, 0)
        : product.stok;
</script>

<button
    type="button"
    on:click={handleClick}
    disabled={isOutOfStock}
    class="group relative bg-slate-50 active:bg-emerald-50 border border-slate-200 
           active:border-emerald-300 rounded-xl p-2.5 sm:p-3 text-left transition-all 
           disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]
           hover:bg-emerald-50 hover:border-emerald-200"
>
    <!-- Badges Container (Top Right) -->
    <div class="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
        <!-- Variant Badge -->
        {#if hasVariants}
            <span class="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 
                         text-[10px] font-semibold rounded-lg shadow-sm">
                <Layers class="w-3 h-3" />
                {variantCount}
            </span>
        {/if}
    </div>

    <!-- Product Image -->
    <div class="w-full aspect-square bg-white rounded-lg flex items-center 
                justify-center mb-2 border border-slate-100 overflow-hidden">
        {#if product.gambar}
            <img 
                src={product.gambar} 
                alt={product.nama_produk}
                class="w-full h-full object-cover rounded-lg"
            />
        {:else}
            <Package class="w-6 h-6 sm:w-8 sm:h-8 text-slate-300 group-hover:text-emerald-400 
                            group-active:text-emerald-500 transition-colors" />
        {/if}
    </div>
    
    <!-- Product Info -->
    <p class="font-medium text-slate-800 text-xs sm:text-sm truncate leading-tight">
        {product.nama_produk}
    </p>

    <!-- Merk Badge (Conditional) - Di bawah nama produk -->
    {#if hasMerk}
        <div class="flex items-center gap-1 mt-0.5">
            <Tag class="w-3 h-3 text-purple-500" />
            <span class="text-[10px] text-purple-600 font-medium truncate">
                {product.nama_merk}
            </span>
        </div>
    {/if}
    
    <div class="flex items-center justify-between mt-1.5 gap-1">
        <!-- Harga -->
        <div class="min-w-0 flex-1">
            {#if hasVariants && priceRange}
                <!-- Range harga untuk produk dengan varian -->
                {#if priceRange.isSame}
                    <p class="text-emerald-600 font-bold text-xs sm:text-sm">
                        <span class="sm:hidden">{formatRupiahShort(priceRange.min)}</span>
                        <span class="hidden sm:inline">{formatRupiah(priceRange.min)}</span>
                    </p>
                {:else}
                    <p class="text-emerald-600 font-bold text-[10px] sm:text-xs truncate">
                        <span class="sm:hidden">
                            {formatRupiahShort(priceRange.min)}-{formatRupiahShort(priceRange.max)}
                        </span>
                        <span class="hidden sm:inline">
                            {formatRupiah(priceRange.min)} - {formatRupiah(priceRange.max)}
                        </span>
                    </p>
                {/if}
            {:else}
                <!-- Harga tunggal untuk produk tanpa varian -->
                <p class="text-emerald-600 font-bold text-xs sm:text-sm">
                    <span class="sm:hidden">{formatRupiahShort(product.harga_jual)}</span>
                    <span class="hidden sm:inline">{formatRupiah(product.harga_jual)}</span>
                </p>
            {/if}
        </div>
        
        <!-- Stock Badge -->
        <span class="text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0
            {displayStock > 10 
                ? 'bg-emerald-100 text-emerald-700' 
                : displayStock > 0 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-red-100 text-red-700'}">
            {displayStock}
        </span>
    </div>
</button>