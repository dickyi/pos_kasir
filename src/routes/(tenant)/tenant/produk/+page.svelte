<!--
    +page.svelte - Halaman Produk (With Permission Check + Merk Integration)
    =====================================================
    Kasir hanya bisa melihat, tidak bisa CRUD
    Merk terintegrasi conditional berdasarkan pengaturan
-->
<script>
    import { fly } from 'svelte/transition';
    import { Plus, Check, AlertCircle, Lock } from 'lucide-svelte';

    // Import komponen produk
    import {
        ProductStats,
        ProductFilter,
        ProductList,
        ProductFormModal,
        ProductViewModal,
        ProductDeleteModal
    } from '$lib/components/tenant/produk';

    export let data;
    export let form;
    $: console.log('=== DEBUG MERK ===');
$: console.log('merkList:', data?.merk);
$: console.log('showMerk:', data?.showMerk);
$: console.log('==================');

    $: user = data?.user;
    $: tenantUser = data?.tenantUser;
    $: produkList = data?.produk || [];
    $: kategoriList = data?.kategori || [];
    $: merkList = data?.merk || [];           // ✅ TAMBAHAN
    $: showMerk = data?.showMerk || false;    // ✅ TAMBAHAN

    // ==========================================
    // PERMISSION CHECK
    // ==========================================
    $: canModify = !tenantUser || ['owner', 'admin'].includes(tenantUser?.role);
    $: isKasir = tenantUser?.role === 'kasir';

    // ==========================================
    // FILTER STATE
    // ==========================================
    let searchQuery = '';
    let filterKategori = '';
    let filterStatus = '';
    let filterMerk = '';  // ✅ TAMBAHAN - Filter by Merk

    // Filtered produk - ✅ UPDATED dengan filter merk
    $: filteredProduk = produkList.filter(p => {
        const matchSearch = p.nama_produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.kode_produk.toLowerCase().includes(searchQuery.toLowerCase());
        const matchKategori = !filterKategori || p.kategori_id == filterKategori;
        const matchStatus = !filterStatus || p.status === filterStatus;
        const matchMerk = !filterMerk || p.merk_id == filterMerk;  // ✅ TAMBAHAN
        return matchSearch && matchKategori && matchStatus && matchMerk;
    });

    $: hasActiveFilters = searchQuery || filterKategori || filterStatus || filterMerk;

    // ==========================================
    // MODAL STATE
    // ==========================================
    let showFormModal = false;
    let formModalMode = 'add';
    let selectedProduk = null;

    let showViewModal = false;
    let viewProduk = null;

    let showDeleteModal = false;
    let deleteProduk = null;

    // ==========================================
    // HANDLERS
    // ==========================================
    function handleAdd() {
        if (!canModify) return;
        formModalMode = 'add';
        selectedProduk = null;
        showFormModal = true;
    }

    function handleView(event) {
        viewProduk = event.detail;
        showViewModal = true;
    }

    function handleEdit(event) {
        if (!canModify) return;
        formModalMode = 'edit';
        selectedProduk = event.detail;
        showFormModal = true;
    }

    function handleDelete(event) {
        if (!canModify) return;
        deleteProduk = event.detail;
        showDeleteModal = true;
    }

    function handleEditFromView(event) {
        if (!canModify) return;
        viewProduk = null;
        showViewModal = false;
        formModalMode = 'edit';
        selectedProduk = event.detail;
        showFormModal = true;
    }

    function clearFilters() {
        searchQuery = '';
        filterKategori = '';
        filterStatus = '';
        filterMerk = '';  // ✅ TAMBAHAN
    }
</script>

<svelte:head>
    <title>Produk - {user?.nama_bisnis || 'POSKasir'}</title>
</svelte:head>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800">Produk</h1>
            <p class="text-slate-500 text-sm mt-1">
                {#if isKasir}
                    Daftar produk untuk referensi di kasir
                {:else}
                    Kelola daftar produk untuk dijual di kasir
                {/if}
            </p>
        </div>
        
        {#if canModify}
            <button 
                on:click={handleAdd}
                class="inline-flex items-center justify-center gap-2 px-4 py-2.5 
                       bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 
                       transition-colors text-sm font-medium w-full sm:w-auto"
            >
                <Plus class="w-4 h-4" />
                <span>Tambah Produk</span>
            </button>
        {:else}
            <div class="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-500 rounded-lg text-sm">
                <Lock class="w-4 h-4" />
                <span>Mode Lihat Saja</span>
            </div>
        {/if}
    </div>

    <!-- Info Banner untuk Kasir -->
    {#if isKasir}
        <div class="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
            <Lock class="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p class="text-amber-700 text-sm">
                Anda login sebagai <strong>Kasir</strong>. Anda hanya dapat melihat daftar produk. 
                Untuk menambah, edit, atau hapus produk, hubungi Owner atau Admin.
            </p>
        </div>
    {/if}

    <!-- Stats Cards -->
    <ProductStats {produkList} />

    <!-- Alert Messages -->
    {#if form?.success}
        <div 
            transition:fly={{ y: -10, duration: 200 }}
            class="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3"
        >
            <Check class="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p class="text-emerald-700 text-sm">{form.message}</p>
        </div>
    {/if}

    {#if form?.error}
        <div 
            transition:fly={{ y: -10, duration: 200 }}
            class="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
        >
            <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0" />
            <p class="text-red-700 text-sm">{form.message}</p>
        </div>
    {/if}

    <!-- Search & Filter - ✅ UPDATED dengan filter Merk -->
    <ProductFilter 
        bind:searchQuery
        bind:filterKategori
        bind:filterStatus
        bind:filterMerk
        {kategoriList}
        {merkList}
        {showMerk}
    />

    <!-- Product List -->
    <ProductList 
        products={filteredProduk}
        totalProducts={produkList.length}
        {hasActiveFilters}
        {canModify}
        on:view={handleView}
        on:edit={handleEdit}
        on:delete={handleDelete}
        on:add={handleAdd}
        on:clearFilters={clearFilters}
    />
</div>

<!-- Modals -->
{#if canModify}
    <!-- ✅ UPDATED - Pass merkList dan showMerk -->
    <ProductFormModal 
        bind:open={showFormModal}
        mode={formModalMode}
        produk={selectedProduk}
        {kategoriList}
        {merkList}
        {showMerk}
        on:close={() => showFormModal = false}
    />

    <ProductDeleteModal 
        bind:open={showDeleteModal}
        produk={deleteProduk}
        on:close={() => showDeleteModal = false}
    />
{/if}

<ProductViewModal 
    bind:open={showViewModal}
    produk={viewProduk}
    {canModify}
    on:close={() => showViewModal = false}
    on:edit={handleEditFromView}
/>