<script>
    /**
     * ============================================
     * HALAMAN PRODUK TENANT
     * File: src/routes/(tenant)/tenant/produk/+page.svelte
     * ============================================
     */
    import { enhance } from '$app/forms';
    import { 
        Plus, Search, Edit2, Trash2, X, Package, Filter,
        AlertCircle, Check, Loader2, Image, ChevronDown,
        Eye, EyeOff, MoreVertical, ArrowUpDown, Tags
    } from 'lucide-svelte';
    
    export let data;
    export let form;
    
    $: user = data?.user;
    $: produkList = data?.produk || [];
    $: kategoriList = data?.kategori || [];
    
    // State
    let showModal = false;
    let modalMode = 'add'; // 'add' | 'edit' | 'view'
    let selectedProduk = null;
    let isSubmitting = false;
    let searchQuery = '';
    let filterKategori = '';
    let filterStatus = '';
    let showDeleteConfirm = false;
    let produkToDelete = null;
    let showFilters = false;

    // Form data
    let formData = {
        nama_produk: '',
        kategori_id: '',
        harga_beli: '',
        harga_jual: '',
        stok: '',
        satuan: 'pcs',
        status: 'aktif'
    };

    // Satuan options
    const satuanOptions = [
        { value: 'pcs', label: 'Pcs' },
        { value: 'porsi', label: 'Porsi' },
        { value: 'gelas', label: 'Gelas' },
        { value: 'botol', label: 'Botol' },
        { value: 'bungkus', label: 'Bungkus' },
        { value: 'kg', label: 'Kilogram' },
        { value: 'gram', label: 'Gram' },
        { value: 'liter', label: 'Liter' },
        { value: 'ml', label: 'Mililiter' },
        { value: 'box', label: 'Box' },
        { value: 'lusin', label: 'Lusin' },
    ];

    // Filtered produk
    $: filteredProduk = produkList.filter(p => {
        const matchSearch = p.nama_produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.kode_produk.toLowerCase().includes(searchQuery.toLowerCase());
        const matchKategori = !filterKategori || p.kategori_id == filterKategori;
        const matchStatus = !filterStatus || p.status === filterStatus;
        return matchSearch && matchKategori && matchStatus;
    });

    // Stats
    $: totalProduk = produkList.length;
    $: produkAktif = produkList.filter(p => p.status === 'aktif').length;
    $: stokMenipis = produkList.filter(p => p.stok <= 10 && p.stok > 0).length;
    $: stokHabis = produkList.filter(p => p.stok === 0).length;

    function openAddModal() {
        modalMode = 'add';
        formData = {
            nama_produk: '',
            kategori_id: '',
            harga_beli: '',
            harga_jual: '',
            stok: '',
            satuan: 'pcs',
            status: 'aktif'
        };
        showModal = true;
    }

    function openEditModal(produk) {
        modalMode = 'edit';
        selectedProduk = produk;
        formData = {
            nama_produk: produk.nama_produk,
            kategori_id: produk.kategori_id || '',
            harga_beli: produk.harga_beli?.toString() || '',
            harga_jual: produk.harga_jual?.toString() || '',
            stok: produk.stok?.toString() || '',
            satuan: produk.satuan || 'pcs',
            status: produk.status
        };
        showModal = true;
    }

    function openViewModal(produk) {
        modalMode = 'view';
        selectedProduk = produk;
        showModal = true;
    }

    function closeModal() {
        showModal = false;
        selectedProduk = null;
    }

    function openDeleteConfirm(produk) {
        produkToDelete = produk;
        showDeleteConfirm = true;
    }

    function closeDeleteConfirm() {
        showDeleteConfirm = false;
        produkToDelete = null;
    }

    function handleSubmit() {
        isSubmitting = true;
        return async ({ result, update }) => {
            isSubmitting = false;
            if (result.type === 'success') {
                closeModal();
            }
            await update();
        };
    }

    function handleDelete() {
        isSubmitting = true;
        return async ({ result, update }) => {
            isSubmitting = false;
            closeDeleteConfirm();
            await update();
        };
    }

    function formatRupiah(num) {
        if (!num) return 'Rp 0';
        return 'Rp ' + new Intl.NumberFormat('id-ID').format(num);
    }

    function getMargin(hargaBeli, hargaJual) {
        if (!hargaBeli || !hargaJual || hargaBeli === 0) return 0;
        return Math.round(((hargaJual - hargaBeli) / hargaBeli) * 100);
    }

    function getStokBadge(stok) {
        if (stok === 0) return { text: 'Habis', class: 'bg-red-100 text-red-700' };
        if (stok <= 10) return { text: 'Menipis', class: 'bg-amber-100 text-amber-700' };
        return { text: 'Tersedia', class: 'bg-emerald-100 text-emerald-700' };
    }

    function clearFilters() {
        searchQuery = '';
        filterKategori = '';
        filterStatus = '';
    }

    $: hasActiveFilters = searchQuery || filterKategori || filterStatus;
</script>

<svelte:head>
    <title>Produk - {user?.nama_bisnis || 'POSKasir'}</title>
</svelte:head>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 class="text-xl sm:text-2xl font-bold text-slate-800">Produk Saya</h1>
            <p class="text-slate-500 text-sm mt-1">
                Kelola daftar produk untuk dijual di kasir
            </p>
        </div>
        <button 
            on:click={openAddModal}
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-sm font-semibold shadow-md shadow-emerald-500/20"
        >
            <Plus class="w-4 h-4" />
            <span>Tambah Produk</span>
        </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-100">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <p class="text-xl font-bold text-slate-800">{totalProduk}</p>
                    <p class="text-xs text-slate-500">Total Produk</p>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-100">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Check class="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <p class="text-xl font-bold text-slate-800">{produkAktif}</p>
                    <p class="text-xs text-slate-500">Produk Aktif</p>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-100">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <AlertCircle class="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <p class="text-xl font-bold text-slate-800">{stokMenipis}</p>
                    <p class="text-xs text-slate-500">Stok Menipis</p>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-100">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <X class="w-5 h-5 text-red-600" />
                </div>
                <div>
                    <p class="text-xl font-bold text-slate-800">{stokHabis}</p>
                    <p class="text-xs text-slate-500">Stok Habis</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Alert Messages -->
    {#if form?.success}
        <div class="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
            <div class="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check class="w-4 h-4 text-emerald-600" />
            </div>
            <p class="text-emerald-700 text-sm font-medium">{form.message}</p>
        </div>
    {/if}

    {#if form?.error}
        <div class="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle class="w-4 h-4 text-red-600" />
            </div>
            <p class="text-red-700 text-sm font-medium">{form.message}</p>
        </div>
    {/if}

    <!-- Search & Filter -->
    <div class="bg-white rounded-xl border border-slate-100 p-4">
        <div class="flex flex-col lg:flex-row gap-3">
            <!-- Search -->
            <div class="relative flex-1">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Cari nama atau kode produk..."
                    class="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
            </div>

            <!-- Filter Buttons -->
            <div class="flex gap-2">
                <button
                    on:click={() => showFilters = !showFilters}
                    class="inline-flex items-center gap-2 px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors {showFilters ? 'bg-slate-50' : ''}"
                >
                    <Filter class="w-4 h-4" />
                    <span>Filter</span>
                    {#if hasActiveFilters}
                        <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    {/if}
                </button>

                {#if hasActiveFilters}
                    <button
                        on:click={clearFilters}
                        class="inline-flex items-center gap-2 px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <X class="w-4 h-4" />
                        <span>Reset</span>
                    </button>
                {/if}
            </div>
        </div>

        <!-- Filter Options -->
        {#if showFilters}
            <div class="grid sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                <!-- Filter Kategori -->
                <div class="relative">
                    <select
                        bind:value={filterKategori}
                        class="w-full h-11 px-4 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                    >
                        <option value="">Semua Kategori</option>
                        {#each kategoriList as kat}
                            <option value={kat.id}>{kat.nama_kategori}</option>
                        {/each}
                    </select>
                    <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <!-- Filter Status -->
                <div class="relative">
                    <select
                        bind:value={filterStatus}
                        class="w-full h-11 px-4 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                    >
                        <option value="">Semua Status</option>
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Nonaktif</option>
                    </select>
                    <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>
        {/if}
    </div>

    <!-- Produk List -->
    {#if filteredProduk.length > 0}
        <!-- Mobile Cards -->
        <div class="lg:hidden space-y-3">
            {#each filteredProduk as produk}
                <div class="bg-white rounded-xl border border-slate-100 p-4">
                    <div class="flex items-start gap-3">
                        <!-- Image/Icon -->
                        <div class="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {#if produk.gambar}
                                <img src={produk.gambar} alt={produk.nama_produk} class="w-full h-full object-cover rounded-lg" />
                            {:else}
                                <Package class="w-6 h-6 text-slate-400" />
                            {/if}
                        </div>

                        <!-- Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between gap-2">
                                <div>
                                    <p class="text-xs text-slate-400 font-medium">{produk.kode_produk}</p>
                                    <h3 class="font-semibold text-slate-800 truncate">{produk.nama_produk}</h3>
                                </div>
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getStokBadge(produk.stok).class}">
                                    {getStokBadge(produk.stok).text}
                                </span>
                            </div>
                            
                            <div class="flex items-center gap-2 mt-1">
                                {#if produk.nama_kategori}
                                    <span class="inline-flex items-center gap-1 text-xs text-slate-500">
                                        <Tags class="w-3 h-3" />
                                        {produk.nama_kategori}
                                    </span>
                                {/if}
                            </div>

                            <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                <div>
                                    <p class="text-lg font-bold text-emerald-600">{formatRupiah(produk.harga_jual)}</p>
                                    <p class="text-xs text-slate-500">Stok: {produk.stok} {produk.satuan}</p>
                                </div>
                                <div class="flex items-center gap-1">
                                    <button 
                                        on:click={() => openViewModal(produk)}
                                        class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Eye class="w-4 h-4" />
                                    </button>
                                    <button 
                                        on:click={() => openEditModal(produk)}
                                        class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 class="w-4 h-4" />
                                    </button>
                                    <button 
                                        on:click={() => openDeleteConfirm(produk)}
                                        class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 class="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Desktop Table -->
        <div class="hidden lg:block bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th class="px-5 py-4">Produk</th>
                            <th class="px-5 py-4">Kategori</th>
                            <th class="px-5 py-4">Harga Beli</th>
                            <th class="px-5 py-4">Harga Jual</th>
                            <th class="px-5 py-4">Margin</th>
                            <th class="px-5 py-4">Stok</th>
                            <th class="px-5 py-4">Status</th>
                            <th class="px-5 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each filteredProduk as produk}
                            <tr class="hover:bg-slate-50/50 transition-colors">
                                <td class="px-5 py-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            {#if produk.gambar}
                                                <img src={produk.gambar} alt="" class="w-full h-full object-cover rounded-lg" />
                                            {:else}
                                                <Package class="w-5 h-5 text-slate-400" />
                                            {/if}
                                        </div>
                                        <div>
                                            <p class="font-medium text-slate-800">{produk.nama_produk}</p>
                                            <p class="text-xs text-slate-400">{produk.kode_produk}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-5 py-4">
                                    {#if produk.nama_kategori}
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                                            <Tags class="w-3 h-3" />
                                            {produk.nama_kategori}
                                        </span>
                                    {:else}
                                        <span class="text-slate-400 text-sm">-</span>
                                    {/if}
                                </td>
                                <td class="px-5 py-4">
                                    <span class="text-sm text-slate-600">{formatRupiah(produk.harga_beli)}</span>
                                </td>
                                <td class="px-5 py-4">
                                    <span class="text-sm font-semibold text-slate-800">{formatRupiah(produk.harga_jual)}</span>
                                </td>
                                <td class="px-5 py-4">
                                    {@const margin = getMargin(produk.harga_beli, produk.harga_jual)}
                                    <span class="text-sm font-medium {margin > 0 ? 'text-emerald-600' : 'text-slate-400'}">
                                        {margin > 0 ? '+' : ''}{margin}%
                                    </span>
                                </td>
                                <td class="px-5 py-4">
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm text-slate-800">{produk.stok}</span>
                                        <span class="text-xs text-slate-400">{produk.satuan}</span>
                                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium {getStokBadge(produk.stok).class}">
                                            {getStokBadge(produk.stok).text}
                                        </span>
                                    </div>
                                </td>
                                <td class="px-5 py-4">
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                        {produk.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}
                                    ">
                                        {produk.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </td>
                                <td class="px-5 py-4">
                                    <div class="flex items-center justify-center gap-1">
                                        <button 
                                            on:click={() => openViewModal(produk)}
                                            class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Lihat Detail"
                                        >
                                            <Eye class="w-4 h-4" />
                                        </button>
                                        <button 
                                            on:click={() => openEditModal(produk)}
                                            class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 class="w-4 h-4" />
                                        </button>
                                        <button 
                                            on:click={() => openDeleteConfirm(produk)}
                                            class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Hapus"
                                        >
                                            <Trash2 class="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Result Count -->
        <div class="text-sm text-slate-500 text-center">
            Menampilkan {filteredProduk.length} dari {produkList.length} produk
        </div>
    {:else}
        <!-- Empty State -->
        <div class="bg-white rounded-xl border border-slate-100 p-12 text-center">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package class="w-8 h-8 text-slate-400" />
            </div>
            <h3 class="text-lg font-semibold text-slate-800 mb-2">
                {hasActiveFilters ? 'Produk tidak ditemukan' : 'Belum ada produk'}
            </h3>
            <p class="text-slate-500 text-sm mb-4">
                {hasActiveFilters ? 'Coba ubah kata kunci atau filter pencarian' : 'Mulai dengan menambahkan produk pertama Anda'}
            </p>
            {#if hasActiveFilters}
                <button 
                    on:click={clearFilters}
                    class="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                    <X class="w-4 h-4" />
                    <span>Reset Filter</span>
                </button>
            {:else}
                <button 
                    on:click={openAddModal}
                    class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                    <Plus class="w-4 h-4" />
                    <span>Tambah Produk</span>
                </button>
            {/if}
        </div>
    {/if}
</div>

<!-- ============================================ -->
<!-- ADD/EDIT MODAL -->
<!-- ============================================ -->
{#if showModal && modalMode !== 'view'}
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
                <h2 class="text-lg font-semibold text-slate-800">
                    {modalMode === 'add' ? 'Tambah Produk Baru' : 'Edit Produk'}
                </h2>
                <button 
                    on:click={closeModal}
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Modal Body -->
            <form 
                method="POST" 
                action={modalMode === 'add' ? '?/create' : '?/update'}
                use:enhance={handleSubmit}
                class="p-5 space-y-4 overflow-y-auto flex-1"
            >
                {#if modalMode === 'edit'}
                    <input type="hidden" name="id" value={selectedProduk?.id} />
                {/if}

                <!-- Nama Produk -->
                <div class="space-y-1.5">
                    <label for="nama_produk" class="block text-sm font-medium text-slate-700">
                        Nama Produk <span class="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="nama_produk"
                        name="nama_produk"
                        bind:value={formData.nama_produk}
                        required
                        placeholder="Contoh: Ayam Geprek Original"
                        class="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                </div>

                <!-- Kategori -->
                <div class="space-y-1.5">
                    <label for="kategori_id" class="block text-sm font-medium text-slate-700">
                        Kategori
                    </label>
                    <div class="relative">
                        <select
                            id="kategori_id"
                            name="kategori_id"
                            bind:value={formData.kategori_id}
                            class="w-full h-11 px-4 pr-10 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                        >
                            <option value="">Pilih Kategori</option>
                            {#each kategoriList as kat}
                                <option value={kat.id}>{kat.nama_kategori}</option>
                            {/each}
                        </select>
                        <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <!-- Harga Row -->
                <div class="grid grid-cols-2 gap-4">
                    <!-- Harga Beli -->
                    <div class="space-y-1.5">
                        <label for="harga_beli" class="block text-sm font-medium text-slate-700">
                            Harga Beli <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                            <input
                                type="number"
                                id="harga_beli"
                                name="harga_beli"
                                bind:value={formData.harga_beli}
                                required
                                min="0"
                                placeholder="0"
                                class="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                        </div>
                    </div>

                    <!-- Harga Jual -->
                    <div class="space-y-1.5">
                        <label for="harga_jual" class="block text-sm font-medium text-slate-700">
                            Harga Jual <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                            <input
                                type="number"
                                id="harga_jual"
                                name="harga_jual"
                                bind:value={formData.harga_jual}
                                required
                                min="0"
                                placeholder="0"
                                class="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <!-- Margin Preview -->
                {#if formData.harga_beli && formData.harga_jual}
                    {@const margin = getMargin(Number(formData.harga_beli), Number(formData.harga_jual))}
                    <div class="p-3 bg-slate-50 rounded-lg">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-slate-600">Margin Keuntungan:</span>
                            <span class="font-semibold {margin > 0 ? 'text-emerald-600' : margin < 0 ? 'text-red-600' : 'text-slate-600'}">
                                {margin > 0 ? '+' : ''}{margin}% ({formatRupiah(Number(formData.harga_jual) - Number(formData.harga_beli))})
                            </span>
                        </div>
                    </div>
                {/if}

                <!-- Stok & Satuan Row -->
                <div class="grid grid-cols-2 gap-4">
                    <!-- Stok -->
                    <div class="space-y-1.5">
                        <label for="stok" class="block text-sm font-medium text-slate-700">
                            Stok Awal <span class="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            id="stok"
                            name="stok"
                            bind:value={formData.stok}
                            required
                            min="0"
                            placeholder="0"
                            class="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                    </div>

                    <!-- Satuan -->
                    <div class="space-y-1.5">
                        <label for="satuan" class="block text-sm font-medium text-slate-700">
                            Satuan
                        </label>
                        <div class="relative">
                            <select
                                id="satuan"
                                name="satuan"
                                bind:value={formData.satuan}
                                class="w-full h-11 px-4 pr-10 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                            >
                                {#each satuanOptions as opt}
                                    <option value={opt.value}>{opt.label}</option>
                                {/each}
                            </select>
                            <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <!-- Status -->
                <div class="space-y-1.5">
                    <label class="block text-sm font-medium text-slate-700">Status</label>
                    <div class="flex gap-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="status"
                                value="aktif"
                                bind:group={formData.status}
                                class="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                            />
                            <span class="text-sm text-slate-700">Aktif</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="status"
                                value="nonaktif"
                                bind:group={formData.status}
                                class="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                            />
                            <span class="text-sm text-slate-700">Nonaktif</span>
                        </label>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        on:click={closeModal}
                        class="flex-1 h-11 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !formData.nama_produk || !formData.harga_beli || !formData.harga_jual}
                        class="flex-1 h-11 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {#if isSubmitting}
                            <Loader2 class="w-4 h-4 animate-spin" />
                            <span>Menyimpan...</span>
                        {:else}
                            <span>{modalMode === 'add' ? 'Simpan Produk' : 'Update Produk'}</span>
                        {/if}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- ============================================ -->
<!-- VIEW MODAL -->
<!-- ============================================ -->
{#if showModal && modalMode === 'view' && selectedProduk}
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-5 border-b border-slate-100">
                <h2 class="text-lg font-semibold text-slate-800">Detail Produk</h2>
                <button 
                    on:click={closeModal}
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Modal Body -->
            <div class="p-5">
                <!-- Product Header -->
                <div class="flex items-start gap-4 mb-6">
                    <div class="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                        {#if selectedProduk.gambar}
                            <img src={selectedProduk.gambar} alt="" class="w-full h-full object-cover rounded-xl" />
                        {:else}
                            <Package class="w-8 h-8 text-slate-400" />
                        {/if}
                    </div>
                    <div class="flex-1">
                        <p class="text-xs text-slate-400 font-medium">{selectedProduk.kode_produk}</p>
                        <h3 class="text-lg font-semibold text-slate-800">{selectedProduk.nama_produk}</h3>
                        {#if selectedProduk.nama_kategori}
                            <span class="inline-flex items-center gap-1 mt-1 text-xs text-slate-500">
                                <Tags class="w-3 h-3" />
                                {selectedProduk.nama_kategori}
                            </span>
                        {/if}
                    </div>
                </div>

                <!-- Details -->
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-3 bg-slate-50 rounded-lg">
                            <p class="text-xs text-slate-500 mb-1">Harga Beli</p>
                            <p class="text-sm font-semibold text-slate-800">{formatRupiah(selectedProduk.harga_beli)}</p>
                        </div>
                        <div class="p-3 bg-emerald-50 rounded-lg">
                            <p class="text-xs text-emerald-600 mb-1">Harga Jual</p>
                            <p class="text-sm font-semibold text-emerald-700">{formatRupiah(selectedProduk.harga_jual)}</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-4">
                        <div class="p-3 bg-slate-50 rounded-lg text-center">
                            <p class="text-xs text-slate-500 mb-1">Margin</p>
                            <p class="text-sm font-semibold text-emerald-600">+{getMargin(selectedProduk.harga_beli, selectedProduk.harga_jual)}%</p>
                        </div>
                        <div class="p-3 bg-slate-50 rounded-lg text-center">
                            <p class="text-xs text-slate-500 mb-1">Stok</p>
                            <p class="text-sm font-semibold text-slate-800">{selectedProduk.stok}</p>
                        </div>
                        <div class="p-3 bg-slate-50 rounded-lg text-center">
                            <p class="text-xs text-slate-500 mb-1">Satuan</p>
                            <p class="text-sm font-semibold text-slate-800 capitalize">{selectedProduk.satuan}</p>
                        </div>
                    </div>

                    <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span class="text-sm text-slate-600">Status</span>
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                            {selectedProduk.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}
                        ">
                            {selectedProduk.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-3 mt-6">
                    <button
                        on:click={closeModal}
                        class="flex-1 h-11 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                        Tutup
                    </button>
                    <button
                        on:click={() => { closeModal(); openEditModal(selectedProduk); }}
                        class="flex-1 h-11 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                    >
                        <Edit2 class="w-4 h-4" />
                        <span>Edit Produk</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<!-- ============================================ -->
<!-- DELETE CONFIRMATION MODAL -->
<!-- ============================================ -->
{#if showDeleteConfirm}
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 class="w-7 h-7 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-slate-800 mb-2">Hapus Produk?</h3>
            <p class="text-slate-500 text-sm mb-6">
                Produk <strong class="text-slate-700">"{produkToDelete?.nama_produk}"</strong> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </p>
            
            <form 
                method="POST" 
                action="?/delete"
                use:enhance={handleDelete}
                class="flex gap-3"
            >
                <input type="hidden" name="id" value={produkToDelete?.id} />
                <button
                    type="button"
                    on:click={closeDeleteConfirm}
                    class="flex-1 h-11 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    class="flex-1 h-11 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {#if isSubmitting}
                        <Loader2 class="w-4 h-4 animate-spin" />
                    {/if}
                    <span>Hapus</span>
                </button>
            </form>
        </div>
    </div>
{/if}