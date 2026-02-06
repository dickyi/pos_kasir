<!--
    VariantSection.svelte - Section Varian dalam Form Produk (COMPLETE)
    ============================================
    Menampilkan dan mengelola daftar varian produk
    dengan info lengkap: atribut, gambar, berat
-->
<script>
    import { createEventDispatcher } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import { 
        Plus, Edit2, Trash2, Package, Star, GripVertical,
        ChevronRight, AlertCircle, Image as ImageIcon, Weight, Tag
    } from 'lucide-svelte';
    import VariantFormModal from './modals/VariantFormModal.svelte';

    const dispatch = createEventDispatcher();

    export let variants = [];
    export let produkKode = '';

    // Modal state
    let showVariantModal = false;
    let variantModalMode = 'add';
    let selectedVariant = null;
    let selectedVariantIndex = -1;

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

    // Generate unique key untuk variant
    function getVariantKey(variant, index) {
        if (variant.id) return `db-${variant.id}`;
        if (variant.temp_id) return `temp-${variant.temp_id}`;
        if (variant.kode_varian) return `code-${variant.kode_varian}`;
        return `idx-${index}`;
    }

    function handleAddVariant() {
        variantModalMode = 'add';
        selectedVariant = null;
        selectedVariantIndex = -1;
        showVariantModal = true;
    }

    function handleEditVariant(variant, index) {
        variantModalMode = 'edit';
        selectedVariant = { ...variant };
        selectedVariantIndex = index;
        showVariantModal = true;
    }

    function handleDeleteVariant(variant, index) {
        const nama = variant.nama_varian || 'Varian ini';
        if (confirm(`Hapus varian "${nama}"?`)) {
            variants = variants.filter((_, i) => i !== index);
            dispatch('change', variants);
        }
    }

    function handleSaveVariant(event) {
        const variantData = event.detail;
        
        if (variantModalMode === 'add') {
            const newVariant = {
                id: null,
                temp_id: variantData.temp_id,
                kode_varian: variantData.kode_varian,
                nama_varian: variantData.nama_varian,
                harga_jual: variantData.harga_jual,
                harga_modal: variantData.harga_modal,
                barcode: variantData.barcode,
                stok: variantData.stok,
                stok_minimum: variantData.stok_minimum,
                is_default: variantData.is_default,
                gambar: variantData.gambar,
                berat: variantData.berat,
                atribut: variantData.atribut
            };
            
            if (newVariant.is_default || variants.length === 0) {
                variants = variants.map(v => ({ ...v, is_default: false }));
                newVariant.is_default = true;
            }
            
            variants = [...variants, newVariant];
        } else {
            variants = variants.map((v, i) => {
                if (i === selectedVariantIndex) {
                    return {
                        ...v,
                        kode_varian: variantData.kode_varian || v.kode_varian,
                        nama_varian: variantData.nama_varian,
                        harga_jual: variantData.harga_jual,
                        harga_modal: variantData.harga_modal,
                        barcode: variantData.barcode,
                        stok: variantData.stok,
                        stok_minimum: variantData.stok_minimum,
                        is_default: variantData.is_default,
                        gambar: variantData.gambar,
                        berat: variantData.berat,
                        atribut: variantData.atribut
                    };
                }
                if (variantData.is_default) {
                    return { ...v, is_default: false };
                }
                return v;
            });
        }
        
        dispatch('change', variants);
    }

    function setDefaultVariant(targetIndex) {
        variants = variants.map((v, i) => ({
            ...v,
            is_default: i === targetIndex
        }));
        dispatch('change', variants);
    }

    // Get total stok dari semua varian
    $: totalStok = variants.reduce((sum, v) => sum + (parseInt(v.stok) || 0), 0);
    $: hasDefault = variants.some(v => v.is_default);
</script>

<div class="space-y-4">
    <!-- Variant List -->
    {#if variants.length > 0}
        <div class="space-y-2">
            {#each variants as variant, index (getVariantKey(variant, index))}
                {@const atributs = parseAtribut(variant.atribut)}
                {@const berat = formatBerat(variant.berat)}
                
                <div 
                    animate:flip={{ duration: 200 }}
                    class="group bg-slate-50 rounded-xl border border-slate-200 
                           hover:border-slate-300 transition-colors overflow-hidden"
                >
                    <div class="flex items-start gap-3 p-3">
                        <!-- Gambar Varian -->
                        <div class="flex-shrink-0">
                            {#if variant.gambar}
                                <img 
                                    src={variant.gambar} 
                                    alt={variant.nama_varian}
                                    class="w-14 h-14 rounded-lg object-cover border border-slate-200"
                                />
                            {:else}
                                <div class="w-14 h-14 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400">
                                    <Package class="w-6 h-6" />
                                </div>
                            {/if}
                        </div>

                        <!-- Variant Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="font-medium text-slate-800">
                                    {variant.nama_varian || 'Tanpa Nama'}
                                </h4>
                                {#if variant.is_default}
                                    <span class="px-1.5 py-0.5 bg-amber-100 text-amber-700 
                                                 text-[10px] font-medium rounded">
                                        Default
                                    </span>
                                {/if}
                                {#if !variant.id}
                                    <span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 
                                                 text-[10px] font-medium rounded">
                                        Baru
                                    </span>
                                {/if}
                            </div>
                            
                            <!-- Harga & Stok -->
                            <div class="flex items-center gap-3 mt-1 text-sm">
                                <span class="text-emerald-600 font-semibold">
                                    {formatRupiah(variant.harga_jual)}
                                </span>
                                <span class="text-slate-400">•</span>
                                <span class="text-slate-500 {parseInt(variant.stok) <= 10 ? 'text-amber-600 font-medium' : ''}">
                                    Stok: {parseInt(variant.stok) || 0}
                                </span>
                                {#if berat}
                                    <span class="text-slate-400">•</span>
                                    <span class="text-slate-500 flex items-center gap-1">
                                        <Weight class="w-3 h-3" />
                                        {berat}
                                    </span>
                                {/if}
                            </div>

                            <!-- Atribut -->
                            {#if atributs.length > 0}
                                <div class="flex items-center gap-2 mt-2 flex-wrap">
                                    {#each atributs as attr}
                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-200 
                                                     text-slate-600 text-xs rounded-full">
                                            <Tag class="w-3 h-3" />
                                            {attr.key}: {attr.value}
                                        </span>
                                    {/each}
                                </div>
                            {/if}

                            <!-- Barcode -->
                            {#if variant.barcode}
                                <div class="mt-1">
                                    <span class="text-slate-400 font-mono text-xs">{variant.barcode}</span>
                                </div>
                            {/if}
                        </div>

                        <!-- Actions -->
                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {#if !variant.is_default}
                                <button
                                    type="button"
                                    on:click={() => setDefaultVariant(index)}
                                    class="p-1.5 text-slate-400 hover:text-amber-500 
                                           hover:bg-amber-50 rounded-lg transition-colors"
                                    title="Jadikan Default"
                                >
                                    <Star class="w-4 h-4" />
                                </button>
                            {/if}
                            <button
                                type="button"
                                on:click={() => handleEditVariant(variant, index)}
                                class="p-1.5 text-slate-400 hover:text-blue-600 
                                       hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Varian"
                            >
                                <Edit2 class="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                on:click={() => handleDeleteVariant(variant, index)}
                                class="p-1.5 text-slate-400 hover:text-red-600 
                                       hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus Varian"
                            >
                                <Trash2 class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Summary -->
        <div class="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <span class="text-sm text-emerald-700">
                Total {variants.length} varian
            </span>
            <span class="text-sm font-medium text-emerald-700">
                Total Stok: {totalStok}
            </span>
        </div>

        <!-- Warning jika belum ada default -->
        {#if !hasDefault && variants.length > 0}
            <div class="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <AlertCircle class="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span class="text-sm text-amber-700">
                    Pilih salah satu varian sebagai default untuk ditampilkan di kasir
                </span>
            </div>
        {/if}
    {:else}
        <!-- Empty state -->
        <div class="p-4 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Package class="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p class="text-sm">Belum ada varian. Tambah varian untuk produk dengan pilihan berbeda.</p>
        </div>
    {/if}

    <!-- Add Variant Button -->
    <button
        type="button"
        on:click={handleAddVariant}
        class="w-full h-12 border-2 border-dashed border-slate-300 rounded-xl
               text-slate-500 font-medium hover:border-emerald-400 hover:text-emerald-600
               hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
    >
        <Plus class="w-5 h-5" />
        <span>Tambah Varian</span>
    </button>
</div>

<!-- Variant Form Modal -->
<VariantFormModal
    bind:open={showVariantModal}
    mode={variantModalMode}
    variant={selectedVariant}
    {produkKode}
    on:save={handleSaveVariant}
    on:close={() => showVariantModal = false}
/>