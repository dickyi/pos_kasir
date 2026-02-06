<!--
    ProductGrid.svelte
    Grid produk dengan search, filter kategori, filter merk (conditional), dan toggle Card/List view
    UPDATED: 
    - Support varian modal
    - Integrasi filter Merk (conditional based on showMerk)
-->
<script>
    import { Search, Package, LayoutGrid, List, Tag } from 'lucide-svelte';
    import { createEventDispatcher, onMount } from 'svelte';
    import ProductCard from './ProductCard.svelte';
    import ProductListItem from './ProductListItem.svelte';
    import VariantSelectModal from '../modals/VariantSelectModal.svelte';

    /** @type {Array} Daftar produk */
    export let products = [];
    
    /** @type {Array} Daftar kategori */
    export let kategori = [];

    /** @type {Array} Daftar merk (NEW!) */
    export let merk = [];

    /** @type {boolean} Tampilkan filter merk (NEW!) */
    export let showMerk = false;

    const dispatch = createEventDispatcher();

    // Local state untuk search & filter
    let searchQuery = '';
    let selectedKategori = '';
    let selectedMerk = '';  // NEW: Filter merk
    
    // View mode: 'card' atau 'list'
    let viewMode = 'card';

    // Variant modal state
    let showVariantModal = false;
    let selectedProduct = null;

    // Load view preference dari localStorage
    onMount(() => {
        if (typeof localStorage !== 'undefined') {
            const savedView = localStorage.getItem('kasir_view_mode');
            if (savedView === 'card' || savedView === 'list') {
                viewMode = savedView;
            }
        }
    });

    // Save view preference ke localStorage
    function setViewMode(mode) {
        viewMode = mode;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('kasir_view_mode', mode);
        }
    }

    // Filter produk - UPDATED: Include merk filter
    $: filteredProduk = products.filter(p => {
        const matchSearch = 
            p.nama_produk?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.kode_produk?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchKategori = !selectedKategori || p.kategori_id == selectedKategori;
        const matchMerk = !selectedMerk || p.merk_id == selectedMerk;  // NEW
        const matchStatus = p.status === 'aktif';
        return matchSearch && matchKategori && matchMerk && matchStatus;
    });

    // Check if any filter is active
    $: hasActiveFilter = selectedKategori || selectedMerk;

    // Clear all filters
    function clearFilters() {
        selectedKategori = '';
        selectedMerk = '';
    }

    function handleProductSelect(event) {
        const product = event.detail;
        
        // Jika produk punya varian, tampilkan modal pilih varian
        if (product.has_variant && product.variants?.length > 0) {
            selectedProduct = product;
            showVariantModal = true;
        } else {
            // Produk tanpa varian, langsung tambah ke keranjang
            dispatch('addToCart', product);
        }
    }

    function handleVariantAddToCart(event) {
        // Dispatch event dari variant modal
        dispatch('addToCart', event.detail);
        showVariantModal = false;
        selectedProduct = null;
    }

    // Expose focus search untuk keyboard shortcut
    export function focusSearch() {
        document.getElementById('kasir-search-input')?.focus();
    }
</script>

<div class="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col min-h-0 overflow-hidden">
    
    <!-- Search & Filter -->
    <div class="flex-shrink-0 p-3 border-b border-slate-100 space-y-2.5">
        <!-- Search Input + View Toggle -->
        <div class="flex gap-2">
            <!-- Search Input -->
            <div class="relative flex-1">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    id="kasir-search-input"
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Cari produk atau scan barcode..."
                    class="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm
                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 
                           focus:bg-white transition-colors"
                />
            </div>
            
            <!-- View Mode Toggle -->
            <div class="flex bg-slate-100 rounded-xl p-1 gap-0.5">
                <button
                    type="button"
                    on:click={() => setViewMode('card')}
                    class="p-2.5 rounded-lg transition-all
                        {viewMode === 'card' 
                            ? 'bg-white text-emerald-600 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'}"
                    title="Tampilan Card"
                >
                    <LayoutGrid class="w-4 h-4" />
                </button>
                <button
                    type="button"
                    on:click={() => setViewMode('list')}
                    class="p-2.5 rounded-lg transition-all
                        {viewMode === 'list' 
                            ? 'bg-white text-emerald-600 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'}"
                    title="Tampilan List"
                >
                    <List class="w-4 h-4" />
                </button>
            </div>
        </div>
        
        <!-- Category Pills - Horizontal scroll -->
        <div class="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
            <button
                type="button"
                on:click={() => selectedKategori = ''}
                class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95
                    {!selectedKategori 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
            >
                Semua
            </button>
            {#each kategori as kat}
                <button
                    type="button"
                    on:click={() => selectedKategori = kat.id}
                    class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95
                        {selectedKategori == kat.id 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
                >
                    {kat.nama_kategori}
                </button>
            {/each}
        </div>

        <!-- ============================================ -->
        <!-- MERK FILTER - CONDITIONAL (NEW!) -->
        <!-- Hanya tampil jika showMerk = true -->
        <!-- ============================================ -->
        {#if showMerk && merk.length > 0}
            <div class="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
                <!-- Label Merk -->
                <div class="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500">
                    <Tag class="w-3.5 h-3.5" />
                    <span class="font-medium">Merk:</span>
                </div>
                
                <!-- All Merk Button -->
                <button
                    type="button"
                    on:click={() => selectedMerk = ''}
                    class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95
                        {!selectedMerk 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'}"
                >
                    Semua Merk
                </button>
                
                {#each merk as m}
                    <button
                        type="button"
                        on:click={() => selectedMerk = m.id}
                        class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95
                            {selectedMerk == m.id 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'}"
                    >
                        {m.nama_merk}
                    </button>
                {/each}
            </div>
        {/if}

        <!-- Active Filter Indicator -->
        {#if hasActiveFilter}
            <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-slate-500">Filter aktif:</span>
                    {#if selectedKategori}
                        {@const selectedKat = kategori.find(k => k.id == selectedKategori)}
                        <span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                            {selectedKat?.nama_kategori || 'Kategori'}
                        </span>
                    {/if}
                    {#if selectedMerk}
                        {@const selectedM = merk.find(m => m.id == selectedMerk)}
                        <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            {selectedM?.nama_merk || 'Merk'}
                        </span>
                    {/if}
                </div>
                <button
                    type="button"
                    on:click={clearFilters}
                    class="text-slate-500 hover:text-red-600 transition-colors"
                >
                    Reset Filter
                </button>
            </div>
        {/if}
    </div>

    <!-- Products - Scrollable -->
    <div class="flex-1 overflow-y-auto p-3">
        {#if filteredProduk.length === 0}
            <div class="flex flex-col items-center justify-center py-16 text-slate-400">
                <Package class="w-12 h-12 mb-3" />
                <p class="font-medium">Produk tidak ditemukan</p>
                <p class="text-sm">Coba kata kunci lain atau reset filter</p>
                {#if hasActiveFilter}
                    <button
                        type="button"
                        on:click={clearFilters}
                        class="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 
                               rounded-lg text-sm font-medium transition-colors"
                    >
                        Reset Filter
                    </button>
                {/if}
            </div>
        {:else}
            <!-- Card View -->
            {#if viewMode === 'card'}
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                    {#each filteredProduk as product (product.id)}
                        <ProductCard 
                            {product}
                            {showMerk}
                            on:select={handleProductSelect}
                        />
                    {/each}
                </div>
            <!-- List View -->
            {:else}
                <div class="space-y-2">
                    {#each filteredProduk as product (product.id)}
                        <ProductListItem 
                            {product}
                            {showMerk}
                            on:select={handleProductSelect}
                        />
                    {/each}
                </div>
            {/if}
        {/if}
    </div>

    <!-- Result Count -->
    <div class="flex-shrink-0 px-3 py-2 border-t border-slate-100 bg-slate-50">
        <p class="text-xs text-slate-500 text-center">
            Menampilkan <strong class="text-slate-700">{filteredProduk.length}</strong> dari 
            <strong class="text-slate-700">{products.length}</strong> produk
        </p>
    </div>
</div>

<!-- Variant Selection Modal -->
<VariantSelectModal 
    bind:open={showVariantModal}
    product={selectedProduct}
    on:addToCart={handleVariantAddToCart}
    on:close={() => {
        showVariantModal = false;
        selectedProduct = null;
    }}
/>

<style>
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
</style>