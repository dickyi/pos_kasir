<!--
    ProductViewModal.svelte - Modal Detail Produk dengan Varian (COMPLETE)
    =======================================================================
    Menampilkan detail lengkap produk termasuk:
    - Gambar produk
    - Info harga & stok
    - Daftar varian dengan atribut, gambar, berat
-->
<script>
    import { createEventDispatcher } from 'svelte';
    import { fly, fade, slide } from 'svelte/transition';
    import { 
        X, Package, Edit2, Tag, DollarSign, 
        TrendingUp, Archive, Calendar, ImageOff, Lock,
        ChevronDown, ChevronUp, Weight, Layers
    } from 'lucide-svelte';

    const dispatch = createEventDispatcher();

    export let open = false;
    export let produk = null;
    export let canModify = true;

    // State untuk expand varian
    let showVariants = true;

    // Get stock color
    function getStockColor(stock) {
        if (stock === 0) return 'bg-red-100 text-red-700';
        if (stock <= 10) return 'bg-amber-100 text-amber-700';
        if (stock <= 50) return 'bg-blue-100 text-blue-700';
        return 'bg-emerald-100 text-emerald-700';
    }

    function close() {
        open = false;
        dispatch('close');
    }

    function handleEdit() {
        if (!canModify) return;
        dispatch('edit', produk);
    }

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

    // Format date
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Format berat
    function formatBerat(berat) {
        if (!berat) return null;
        const val = parseFloat(berat);
        if (val >= 1000) {
            return `${(val / 1000).toFixed(1)} kg`;
        }
        return `${val} g`;
    }

    // Parse atribut untuk display
    function parseAtribut(atribut) {
        if (!atribut) return [];
        
        try {
            let obj = atribut;
            if (typeof atribut === 'string') {
                obj = JSON.parse(atribut);
            }
            
            if (typeof obj === 'object' && !Array.isArray(obj)) {
                return Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }));
            }
            
            return [];
        } catch (e) {
            return [];
        }
    }

    // Calculate margin
    $: margin = produk ? (parseFloat(produk.harga_jual) - parseFloat(produk.harga_beli)) : 0;
    $: marginPercent = produk && parseFloat(produk.harga_beli) > 0 
        ? ((margin / parseFloat(produk.harga_beli)) * 100).toFixed(1) 
        : 0;
    $: hasVariants = produk?.variants && produk.variants.length > 0;
</script>

{#if open && produk}
    <!-- Backdrop -->
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
        on:click={close}
        on:keypress={(e) => e.key === 'Escape' && close()}
        role="button"
        tabindex="-1"
    ></div>

    <!-- Modal -->
    <div 
        transition:fly={{ y: 20, duration: 200 }}
        class="fixed inset-x-4 top-[2%] bottom-[2%] sm:inset-auto sm:left-1/2 sm:top-1/2 
               sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg
               bg-white rounded-2xl shadow-2xl z-50 flex flex-col max-h-[96vh] overflow-hidden"
    >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Package class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-slate-800">Detail Produk</h2>
                    <p class="text-xs text-slate-500">{produk.kode_produk}</p>
                </div>
            </div>
            <button
                on:click={close}
                class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 
                       rounded-lg transition-colors"
            >
                <X class="w-5 h-5" />
            </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
            <!-- Gambar -->
            <div class="relative aspect-video bg-slate-100">
                {#if produk.gambar}
                    <img 
                        src={produk.gambar} 
                        alt={produk.nama_produk}
                        class="w-full h-full object-contain"
                    />
                {:else}
                    <div class="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <ImageOff class="w-16 h-16 mb-2" />
                        <span class="text-sm">Tidak ada gambar</span>
                    </div>
                {/if}

                <!-- Status Badge -->
                <div class="absolute top-3 right-3 flex gap-2">
                    {#if hasVariants}
                        <span class="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {produk.variants.length} Varian
                        </span>
                    {/if}
                    <span class="px-3 py-1.5 rounded-full text-xs font-medium
                        {produk.status === 'aktif' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'}">
                        {produk.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </span>
                </div>
            </div>

            <!-- Info -->
            <div class="p-4 space-y-4">
                <!-- Nama & Kategori -->
                <div>
                    <h3 class="text-xl font-bold text-slate-800 mb-2">
                        {produk.nama_produk}
                    </h3>
                    {#if produk.nama_kategori}
                        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg">
                            <Tag class="w-3.5 h-3.5 text-slate-500" />
                            <span class="text-sm text-slate-600">{produk.nama_kategori}</span>
                        </div>
                    {/if}
                </div>

                <!-- Harga (jika tidak ada varian) -->
                {#if !hasVariants}
                    <div class="grid grid-cols-2 gap-3">
                        <div class="p-3 bg-slate-50 rounded-xl">
                            <div class="flex items-center gap-2 text-slate-500 mb-1">
                                <DollarSign class="w-4 h-4" />
                                <span class="text-xs">Harga Jual</span>
                            </div>
                            <p class="text-lg font-bold text-emerald-600">
                                {formatRupiah(produk.harga_jual)}
                            </p>
                        </div>
                        <div class="p-3 bg-slate-50 rounded-xl">
                            <div class="flex items-center gap-2 text-slate-500 mb-1">
                                <DollarSign class="w-4 h-4" />
                                <span class="text-xs">Harga Beli</span>
                            </div>
                            <p class="text-lg font-bold text-slate-700">
                                {formatRupiah(produk.harga_beli)}
                            </p>
                        </div>
                    </div>

                    <!-- Margin -->
                    {#if parseFloat(produk.harga_beli) > 0 && canModify}
                        <div class="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2 text-emerald-600">
                                    <TrendingUp class="w-4 h-4" />
                                    <span class="text-sm font-medium">Margin Keuntungan</span>
                                </div>
                                <div class="text-right">
                                    <p class="text-lg font-bold text-emerald-600">
                                        {formatRupiah(margin)}
                                    </p>
                                    <p class="text-xs text-emerald-500">
                                        +{marginPercent}% per unit
                                    </p>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Stok & Satuan -->
                    <div class="grid grid-cols-2 gap-3">
                        <div class="p-3 bg-slate-50 rounded-xl">
                            <div class="flex items-center gap-2 text-slate-500 mb-1">
                                <Archive class="w-4 h-4" />
                                <span class="text-xs">Stok</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="inline-flex items-center font-bold rounded-full text-base px-3 py-1.5 {getStockColor(produk.stok)}">
                                    {produk.stok}
                                </span>
                            </div>
                        </div>
                        <div class="p-3 bg-slate-50 rounded-xl">
                            <div class="flex items-center gap-2 text-slate-500 mb-1">
                                <Package class="w-4 h-4" />
                                <span class="text-xs">Satuan</span>
                            </div>
                            <p class="text-lg font-semibold text-slate-700 capitalize">
                                {produk.satuan}
                            </p>
                        </div>
                    </div>
                {/if}

                <!-- Varian Section -->
                {#if hasVariants}
                    <div class="border border-slate-200 rounded-xl overflow-hidden">
                        <button
                            type="button"
                            on:click={() => showVariants = !showVariants}
                            class="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                            <div class="flex items-center gap-2">
                                <Layers class="w-5 h-5 text-slate-600" />
                                <span class="font-semibold text-slate-800">
                                    Daftar Varian ({produk.variants.length})
                                </span>
                            </div>
                            {#if showVariants}
                                <ChevronUp class="w-5 h-5 text-slate-400" />
                            {:else}
                                <ChevronDown class="w-5 h-5 text-slate-400" />
                            {/if}
                        </button>

                        {#if showVariants}
                            <div class="divide-y divide-slate-100" transition:slide={{ duration: 150 }}>
                                {#each produk.variants as variant}
                                    {@const atributs = parseAtribut(variant.atribut)}
                                    {@const berat = formatBerat(variant.berat)}
                                    
                                    <div class="p-4 bg-white">
                                        <div class="flex items-start gap-3">
                                            <!-- Gambar Varian -->
                                            {#if variant.gambar}
                                                <img 
                                                    src={variant.gambar} 
                                                    alt={variant.nama_varian}
                                                    class="w-16 h-16 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                                                />
                                            {:else}
                                                <div class="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                                                    <Package class="w-6 h-6" />
                                                </div>
                                            {/if}

                                            <!-- Info Varian -->
                                            <div class="flex-1 min-w-0">
                                                <div class="flex items-center gap-2 flex-wrap">
                                                    <h4 class="font-semibold text-slate-800">
                                                        {variant.nama_varian}
                                                    </h4>
                                                    {#if variant.is_default}
                                                        <span class="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
                                                            Default
                                                        </span>
                                                    {/if}
                                                </div>

                                                <!-- Harga & Stok -->
                                                <div class="flex items-center gap-3 mt-1 text-sm">
                                                    <span class="text-emerald-600 font-bold">
                                                        {formatRupiah(variant.harga_jual)}
                                                    </span>
                                                    {#if canModify && parseFloat(variant.harga_modal) > 0}
                                                        <span class="text-slate-400">
                                                            Modal: {formatRupiah(variant.harga_modal)}
                                                        </span>
                                                    {/if}
                                                </div>

                                                <div class="flex items-center gap-3 mt-1 text-sm">
                                                    <span class="{getStockColor(variant.stok)} px-2 py-0.5 rounded-full text-xs font-semibold">
                                                        Stok: {variant.stok}
                                                    </span>
                                                    {#if berat}
                                                        <span class="text-slate-500 flex items-center gap-1">
                                                            <Weight class="w-3 h-3" />
                                                            {berat}
                                                        </span>
                                                    {/if}
                                                    {#if variant.barcode}
                                                        <span class="text-slate-400 font-mono text-xs">
                                                            {variant.barcode}
                                                        </span>
                                                    {/if}
                                                </div>

                                                <!-- Atribut -->
                                                {#if atributs.length > 0}
                                                    <div class="flex items-center gap-2 mt-2 flex-wrap">
                                                        {#each atributs as attr}
                                                            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 
                                                                         text-slate-600 text-xs rounded-full">
                                                                <Tag class="w-3 h-3" />
                                                                {attr.key}: {attr.value}
                                                            </span>
                                                        {/each}
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>

                            <!-- Total Stok Varian -->
                            <div class="p-3 bg-emerald-50 border-t border-emerald-100">
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-emerald-700">Total Stok Semua Varian:</span>
                                    <span class="font-bold text-emerald-700">{produk.stok}</span>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- Timestamps -->
                <div class="pt-4 border-t border-slate-100 space-y-2">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-slate-500 flex items-center gap-2">
                            <Calendar class="w-4 h-4" />
                            Dibuat
                        </span>
                        <span class="text-slate-700">{formatDate(produk.created_at)}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-slate-500 flex items-center gap-2">
                            <Calendar class="w-4 h-4" />
                            Diperbarui
                        </span>
                        <span class="text-slate-700">{formatDate(produk.updated_at)}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="flex gap-3 p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex-shrink-0">
            <button
                on:click={close}
                class="flex-1 h-11 border border-slate-200 text-slate-600 rounded-xl
                       hover:bg-slate-100 transition-colors font-medium text-sm"
            >
                Tutup
            </button>
            
            {#if canModify}
                <button
                    on:click={handleEdit}
                    class="flex-1 h-11 bg-blue-600 text-white rounded-xl hover:bg-blue-700
                           transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                    <Edit2 class="w-4 h-4" />
                    <span>Edit Produk</span>
                </button>
            {:else}
                <div class="flex-1 h-11 bg-slate-100 text-slate-400 rounded-xl 
                            flex items-center justify-center gap-2 text-sm">
                    <Lock class="w-4 h-4" />
                    <span>Mode Lihat Saja</span>
                </div>
            {/if}
        </div>
    </div>
{/if}