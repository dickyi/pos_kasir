<!--
    ProductList.svelte - Daftar Produk dengan Info Varian & Merk
    =====================================================================
    Grid view produk dengan:
    - Thumbnail gambar
    - Badge jumlah varian
    - Info Merk (jika ada)
    - Info stok
-->
<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import { 
        Package, Eye, Edit2, Trash2, AlertTriangle,
        ImageOff, Tag, Lock, Layers
    } from 'lucide-svelte';

    const dispatch = createEventDispatcher();

    export let products = [];
    export let totalProducts = 0;
    export let hasActiveFilters = false;
    export let canModify = true;

    // Format currency - handle decimal dari database
    function formatRupiah(num) {
        if (num === null || num === undefined) return 'Rp 0';
        
        let value = num;
        if (typeof num === 'string') {
            value = parseFloat(num);
        }
        value = Math.round(value);
        
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    // Get stock color
    function getStockColor(stock) {
        if (stock === 0) return 'bg-red-100 text-red-700';
        if (stock <= 10) return 'bg-amber-100 text-amber-700';
        if (stock <= 50) return 'bg-blue-100 text-blue-700';
        return 'bg-emerald-100 text-emerald-700';
    }

    // Get harga range untuk produk dengan varian
    function getHargaRange(produk) {
        if (!produk.variants || produk.variants.length === 0) {
            return { min: produk.harga_jual, max: produk.harga_jual, isRange: false };
        }
        
        const prices = produk.variants.map(v => parseFloat(v.harga_jual) || 0);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        
        return { min, max, isRange: min !== max };
    }

    // Event handlers
    function handleView(produk) {
        dispatch('view', produk);
    }

    function handleEdit(produk) {
        if (!canModify) return;
        dispatch('edit', produk);
    }

    function handleDelete(produk) {
        if (!canModify) return;
        dispatch('delete', produk);
    }

    function handleAdd() {
        if (!canModify) return;
        dispatch('add');
    }

    function handleClearFilters() {
        dispatch('clearFilters');
    }
</script>

{#if products.length > 0}
    <!-- Result Info -->
    <div class="flex items-center justify-between mb-4">
        <p class="text-sm text-slate-500">
            Menampilkan <span class="font-medium text-slate-700">{products.length}</span> 
            {#if hasActiveFilters}
                dari <span class="font-medium text-slate-700">{totalProducts}</span>
            {/if}
            produk
        </p>
    </div>

    <!-- Product Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each products as produk (produk.id)}
            {@const hargaRange = getHargaRange(produk)}
            {@const hasVariants = produk.variants && produk.variants.length > 0}
            
            <div 
                animate:flip={{ duration: 200 }}
                in:fly={{ y: 20, duration: 200 }}
                out:fade={{ duration: 150 }}
                class="group bg-white rounded-2xl border border-slate-200 overflow-hidden
                       hover:shadow-lg hover:border-slate-300 transition-all duration-200"
            >
                <!-- Image Section -->
                <div class="relative aspect-square bg-slate-100 overflow-hidden">
                    {#if produk.gambar}
                        <img 
                            src={produk.gambar} 
                            alt={produk.nama_produk}
                            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            on:error={(e) => e.target.style.display = 'none'}
                        />
                    {:else}
                        <div class="w-full h-full flex flex-col items-center justify-center text-slate-300">
                            <Package class="w-12 h-12 mb-2" />
                            <span class="text-xs">No Image</span>
                        </div>
                    {/if}

                    <!-- Badges Top Left -->
                    <div class="absolute top-3 left-3 flex flex-col gap-1.5">
                        {#if produk.status === 'nonaktif'}
                            <span class="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                                Nonaktif
                            </span>
                        {/if}
                        {#if hasVariants}
                            <span class="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full
                                        flex items-center gap-1">
                                <Layers class="w-3 h-3" />
                                {produk.variants.length} Varian
                            </span>
                        {/if}
                    </div>

                    <!-- Stock Warning Top Right -->
                    <div class="absolute top-3 right-3">
                        {#if produk.stok <= 10 && produk.stok > 0}
                            <span class="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full
                                        flex items-center gap-1">
                                <AlertTriangle class="w-3 h-3" />
                                Menipis
                            </span>
                        {:else if produk.stok === 0}
                            <span class="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                                Habis
                            </span>
                        {/if}
                    </div>

                    <!-- Hover Overlay -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent 
                                opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div class="absolute bottom-3 left-3 right-3 flex gap-2">
                            <button
                                on:click={() => handleView(produk)}
                                class="flex-1 h-9 bg-white/90 backdrop-blur-sm text-slate-700 
                                       rounded-lg text-sm font-medium hover:bg-white transition-colors
                                       flex items-center justify-center gap-1.5"
                            >
                                <Eye class="w-4 h-4" />
                                <span>Lihat</span>
                            </button>
                            
                            {#if canModify}
                                <button
                                    on:click={() => handleEdit(produk)}
                                    class="w-9 h-9 bg-white/90 backdrop-blur-sm text-blue-600 
                                           rounded-lg hover:bg-white transition-colors
                                           flex items-center justify-center"
                                    title="Edit Produk"
                                >
                                    <Edit2 class="w-4 h-4" />
                                </button>
                                <button
                                    on:click={() => handleDelete(produk)}
                                    class="w-9 h-9 bg-white/90 backdrop-blur-sm text-red-600 
                                           rounded-lg hover:bg-white transition-colors
                                           flex items-center justify-center"
                                    title="Hapus Produk"
                                >
                                    <Trash2 class="w-4 h-4" />
                                </button>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- Info Section -->
                <div class="p-4">
                    <!-- Kode, Kategori, Merk -->
                    <div class="flex items-center gap-2 mb-2 flex-wrap">
                        <span class="text-xs font-mono text-slate-400">{produk.kode_produk}</span>
                        {#if produk.nama_kategori}
                            <span class="text-slate-300">•</span>
                            <span class="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {produk.nama_kategori}
                            </span>
                        {/if}
                        {#if produk.nama_merk}
                            <span class="text-slate-300">•</span>
                            <span class="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                {produk.nama_merk}
                            </span>
                        {/if}
                    </div>

                    <!-- Nama Produk -->
                    <h3 class="font-semibold text-slate-800 line-clamp-2 min-h-[48px] mb-3">
                        {produk.nama_produk}
                    </h3>

                    <!-- Harga -->
                    <div class="flex items-baseline gap-2 mb-3 flex-wrap">
                        {#if hargaRange.isRange}
                            <span class="text-lg font-bold text-emerald-600">
                                {formatRupiah(hargaRange.min)}
                            </span>
                            <span class="text-slate-400">-</span>
                            <span class="text-lg font-bold text-emerald-600">
                                {formatRupiah(hargaRange.max)}
                            </span>
                        {:else}
                            <span class="text-lg font-bold text-emerald-600">
                                {formatRupiah(hargaRange.min)}
                            </span>
                            {#if parseFloat(produk.harga_beli) > 0 && canModify}
                                <span class="text-xs text-slate-400">
                                    Modal: {formatRupiah(produk.harga_beli)}
                                </span>
                            {/if}
                        {/if}
                    </div>

                    <!-- Stok -->
                    <div class="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center font-semibold rounded-full text-sm px-2.5 py-1 {getStockColor(produk.stok)}">
                                {produk.stok}
                            </span>
                            <span class="text-xs text-slate-400">{produk.satuan}</span>
                            {#if hasVariants}
                                <span class="text-xs text-slate-400">
                                    (total)
                                </span>
                            {/if}
                        </div>
                        
                        {#if parseFloat(produk.harga_beli) > 0 && parseFloat(produk.harga_jual) > parseFloat(produk.harga_beli) && canModify && !hasVariants}
                            {@const marginPct = ((parseFloat(produk.harga_jual) - parseFloat(produk.harga_beli)) / parseFloat(produk.harga_beli) * 100).toFixed(0)}
                            <span class="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                +{marginPct}%
                            </span>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>
{:else}
    <!-- Empty State -->
    <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {#if hasActiveFilters}
                <AlertTriangle class="w-8 h-8 text-slate-400" />
            {:else}
                <Package class="w-8 h-8 text-slate-400" />
            {/if}
        </div>

        <h3 class="text-lg font-semibold text-slate-800 mb-2">
            {#if hasActiveFilters}
                Tidak Ditemukan
            {:else}
                Belum Ada Produk
            {/if}
        </h3>

        <p class="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            {#if hasActiveFilters}
                Tidak ada produk yang cocok dengan filter. Coba ubah kriteria pencarian.
            {:else if !canModify}
                Belum ada produk yang dibuat. Hubungi Owner atau Admin untuk menambahkan produk.
            {:else}
                Mulai tambahkan produk untuk dijual di kasir Anda.
            {/if}
        </p>

        {#if hasActiveFilters}
            <button
                on:click={handleClearFilters}
                class="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 
                       text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
            >
                Reset Filter
            </button>
        {:else if canModify}
            <button
                on:click={handleAdd}
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white 
                       rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
                <Package class="w-4 h-4" />
                <span>Tambah Produk Pertama</span>
            </button>
        {:else}
            <div class="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-sm">
                <Lock class="w-4 h-4" />
                <span>Hubungi Owner/Admin untuk menambah produk</span>
            </div>
        {/if}
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