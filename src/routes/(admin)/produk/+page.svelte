<script>
    // ============================================
    // DATA & STATE
    // ============================================
    
    // Data dari server (load function)
    export let data;
    export let form;

    // List produk dan kategori dari database
    let produk = data.produk;
    let kategori = data.kategori;
    
    // State untuk pencarian dan filter
    let searchQuery = '';
    let filterKategori = '';
    let filterStatus = '';
    
    // State untuk modal
    let showModal = false;
    let showDeleteModal = false;
    let isEdit = false;
    let selectedProduk = null;

    // State form data
    let formData = {
        id: '',
        kode_produk: '',
        nama_produk: '',
        kategori_id: '',
        harga_beli: 0,
        harga_jual: 0,
        stok: 0,
        satuan: 'pcs',
        status: 'aktif'
    };

    // Daftar satuan
    const satuanList = ['pcs', 'box', 'pack', 'botol', 'kaleng', 'kg', 'gram', 'liter', 'ml', 'lusin', 'rim', 'roll', 'sachet', 'bungkus', 'karton'];

    // ============================================
    // REACTIVE STATEMENTS
    // ============================================
    
    // Filter produk berdasarkan pencarian, kategori, dan status
    $: filteredProduk = produk.filter(p => {
        const matchSearch = 
            p.nama_produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.kode_produk.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchKategori = filterKategori === '' || p.kategori_id == filterKategori;
        const matchStatus = filterStatus === '' || p.status === filterStatus;
        
        return matchSearch && matchKategori && matchStatus;
    });

    // Hitung statistik
    $: totalProduk = produk.length;
    $: totalStok = produk.reduce((sum, p) => sum + (p.stok || 0), 0);
    $: stokRendah = produk.filter(p => p.stok < 10).length;
    $: nilaiInventori = produk.reduce((sum, p) => sum + (p.harga_jual * p.stok), 0);

    // Tutup modal otomatis setelah action berhasil
    $: if (form?.success) {
        closeModal();
    }

    // ============================================
    // FUNCTIONS
    // ============================================
    
    /**
     * Format angka ke format Rupiah
     */
    function formatRupiah(angka) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(angka || 0);
    }

    /**
     * Format angka dengan titik sebagai pemisah ribuan
     */
    function formatNumber(angka) {
        return new Intl.NumberFormat('id-ID').format(angka || 0);
    }

    /**
     * Generate kode produk baru secara otomatis
     */
    function generateKode() {
        if (produk.length === 0) {
            return 'PRD001';
        }
        
        const numbers = produk.map(p => {
            const num = parseInt(p.kode_produk.replace('PRD', ''));
            return isNaN(num) ? 0 : num;
        });
        const maxNum = Math.max(...numbers);
        
        return `PRD${String(maxNum + 1).padStart(3, '0')}`;
    }

    /**
     * Hitung margin/keuntungan
     */
    function hitungMargin(hargaBeli, hargaJual) {
        if (hargaBeli === 0) return 0;
        return ((hargaJual - hargaBeli) / hargaBeli * 100).toFixed(1);
    }

    /**
     * Buka modal untuk tambah produk baru
     */
    function openAddModal() {
        isEdit = false;
        formData = {
            id: '',
            kode_produk: generateKode(),
            nama_produk: '',
            kategori_id: '',
            harga_beli: 0,
            harga_jual: 0,
            stok: 0,
            satuan: 'pcs',
            status: 'aktif'
        };
        showModal = true;
    }

    /**
     * Buka modal untuk edit produk
     */
    function openEditModal(p) {
        isEdit = true;
        formData = { 
            id: p.id,
            kode_produk: p.kode_produk,
            nama_produk: p.nama_produk,
            kategori_id: p.kategori_id || '',
            harga_beli: p.harga_beli || 0,
            harga_jual: p.harga_jual || 0,
            stok: p.stok || 0,
            satuan: p.satuan || 'pcs',
            status: p.status
        };
        showModal = true;
    }

    /**
     * Buka modal konfirmasi hapus
     */
    function openDeleteModal(p) {
        selectedProduk = p;
        showDeleteModal = true;
    }

    /**
     * Tutup semua modal
     */
    function closeModal() {
        showModal = false;
        showDeleteModal = false;
        selectedProduk = null;
    }

    /**
     * Handle klik di luar modal untuk menutup
     */
    function handleOutsideClick(event) {
        if (event.target === event.currentTarget) {
            closeModal();
        }
    }

    /**
     * Reset semua filter
     */
    function resetFilter() {
        searchQuery = '';
        filterKategori = '';
        filterStatus = '';
    }
</script>

<!-- ============================================ -->
<!-- HEADER SECTION -->
<!-- ============================================ -->
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div>
        <h1 class="text-xl font-bold text-gray-800">Daftar Produk</h1>
        <p class="text-sm text-gray-500">Kelola semua produk toko Anda</p>
    </div>
    <button
        on:click={openAddModal}
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
    >
        <span>+</span>
        <span>Tambah Produk</span>
    </button>
</div>

<!-- ============================================ -->
<!-- ALERT MESSAGE -->
<!-- ============================================ -->
{#if form?.message}
    <div class="mb-4 p-4 rounded-lg flex items-center gap-3 {form?.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}">
        <span class="text-lg">{form?.success ? '✅' : '❌'}</span>
        <span>{form.message}</span>
    </div>
{/if}

<!-- ============================================ -->
<!-- STATISTICS CARDS -->
<!-- ============================================ -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📦</div>
            <div>
                <p class="text-xs text-gray-500">Total Produk</p>
                <p class="text-xl font-bold text-gray-800">{totalProduk}</p>
            </div>
        </div>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">📊</div>
            <div>
                <p class="text-xs text-gray-500">Total Stok</p>
                <p class="text-xl font-bold text-gray-800">{formatNumber(totalStok)}</p>
            </div>
        </div>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-xl">⚠️</div>
            <div>
                <p class="text-xs text-gray-500">Stok Rendah</p>
                <p class="text-xl font-bold text-red-600">{stokRendah}</p>
            </div>
        </div>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-xl">💰</div>
            <div>
                <p class="text-xs text-gray-500">Nilai Inventori</p>
                <p class="text-lg font-bold text-gray-800">{formatRupiah(nilaiInventori)}</p>
            </div>
        </div>
    </div>
</div>

<!-- ============================================ -->
<!-- SEARCH & FILTER -->
<!-- ============================================ -->
<div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div class="md:col-span-2">
            <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Cari nama atau kode produk..."
                    class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
        </div>
        
        <!-- Filter Kategori -->
        <div>
            <select
                bind:value={filterKategori}
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
                <option value="">Semua Kategori</option>
                {#each kategori as k}
                    <option value={k.id}>{k.nama_kategori}</option>
                {/each}
            </select>
        </div>
        
        <!-- Filter Status -->
        <div class="flex gap-2">
            <select
                bind:value={filterStatus}
                class="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
                <option value="">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
            </select>
            
            {#if searchQuery || filterKategori || filterStatus}
                <button
                    on:click={resetFilter}
                    class="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    title="Reset Filter"
                >
                    ✕
                </button>
            {/if}
        </div>
    </div>
    
    <!-- Filter Info -->
    {#if searchQuery || filterKategori || filterStatus}
        <div class="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
            Menampilkan {filteredProduk.length} dari {produk.length} produk
        </div>
    {/if}
</div>

<!-- ============================================ -->
<!-- TABLE DESKTOP -->
<!-- ============================================ -->
<div class="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
    <div class="overflow-x-auto">
        <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                    <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Produk</th>
                    <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kategori</th>
                    <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Harga Beli</th>
                    <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Harga Jual</th>
                    <th class="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stok</th>
                    <th class="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th class="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                {#each filteredProduk as p (p.id)}
                    <tr class="hover:bg-gray-50 transition-colors">
                        <!-- Produk Info -->
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                                    📦
                                </div>
                                <div>
                                    <p class="font-medium text-gray-800">{p.nama_produk}</p>
                                    <p class="text-xs text-gray-500 font-mono">{p.kode_produk}</p>
                                </div>
                            </div>
                        </td>
                        
                        <!-- Kategori -->
                        <td class="px-4 py-3">
                            <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                {p.nama_kategori || 'Tanpa Kategori'}
                            </span>
                        </td>
                        
                        <!-- Harga Beli -->
                        <td class="px-4 py-3 text-right text-sm text-gray-600">
                            {formatRupiah(p.harga_beli)}
                        </td>
                        
                        <!-- Harga Jual -->
                        <td class="px-4 py-3 text-right">
                            <p class="text-sm font-medium text-gray-800">{formatRupiah(p.harga_jual)}</p>
                            <p class="text-xs text-green-600">+{hitungMargin(p.harga_beli, p.harga_jual)}%</p>
                        </td>
                        
                        <!-- Stok -->
                        <td class="px-4 py-3 text-center">
                            <span class="px-2.5 py-1 text-xs font-medium rounded-full {p.stok < 10 ? 'bg-red-100 text-red-700' : p.stok < 30 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}">
                                {p.stok} {p.satuan}
                            </span>
                        </td>
                        
                        <!-- Status -->
                        <td class="px-4 py-3 text-center">
                            <span class="px-2 py-1 text-xs rounded-full {p.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                                {p.status}
                            </span>
                        </td>
                        
                        <!-- Aksi -->
                        <td class="px-4 py-3 text-center">
                            <div class="flex items-center justify-center gap-1">
                                <button 
                                    on:click={() => openEditModal(p)} 
                                    class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    ✏️
                                </button>
                                <button 
                                    on:click={() => openDeleteModal(p)} 
                                    class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Hapus"
                                >
                                    🗑️
                                </button>
                            </div>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

<!-- ============================================ -->
<!-- CARDS MOBILE/TABLET -->
<!-- ============================================ -->
<div class="lg:hidden space-y-3">
    {#each filteredProduk as p (p.id)}
        <div class="bg-white rounded-xl border border-gray-200 p-4">
            <!-- Header -->
            <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                        📦
                    </div>
                    <div>
                        <p class="font-medium text-gray-800">{p.nama_produk}</p>
                        <p class="text-xs text-gray-500 font-mono">{p.kode_produk}</p>
                    </div>
                </div>
                <span class="px-2 py-1 text-xs rounded-full {p.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                    {p.status}
                </span>
            </div>
            
            <!-- Info -->
            <div class="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                    <p class="text-gray-500">Kategori</p>
                    <p class="font-medium text-gray-800">{p.nama_kategori || '-'}</p>
                </div>
                <div>
                    <p class="text-gray-500">Stok</p>
                    <p class="font-medium {p.stok < 10 ? 'text-red-600' : 'text-gray-800'}">{p.stok} {p.satuan}</p>
                </div>
                <div>
                    <p class="text-gray-500">Harga Beli</p>
                    <p class="font-medium text-gray-800">{formatRupiah(p.harga_beli)}</p>
                </div>
                <div>
                    <p class="text-gray-500">Harga Jual</p>
                    <p class="font-medium text-gray-800">{formatRupiah(p.harga_jual)}</p>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="flex gap-2 pt-3 border-t border-gray-100">
                <button 
                    on:click={() => openEditModal(p)} 
                    class="flex-1 px-3 py-2 text-sm font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                >
                    ✏️ Edit
                </button>
                <button 
                    on:click={() => openDeleteModal(p)} 
                    class="flex-1 px-3 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                    🗑️ Hapus
                </button>
            </div>
        </div>
    {/each}
</div>

<!-- ============================================ -->
<!-- EMPTY STATE -->
<!-- ============================================ -->
{#if filteredProduk.length === 0}
    <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-3xl">📦</span>
        </div>
        <h3 class="text-lg font-medium text-gray-800 mb-2">Tidak Ada Produk</h3>
        <p class="text-gray-500 mb-4">
            {searchQuery || filterKategori || filterStatus 
                ? 'Tidak ada produk yang cocok dengan filter Anda.' 
                : 'Belum ada produk yang ditambahkan.'}
        </p>
        {#if searchQuery || filterKategori || filterStatus}
            <button
                on:click={resetFilter}
                class="text-blue-600 hover:underline text-sm"
            >
                Reset Filter
            </button>
        {:else}
            <button
                on:click={openAddModal}
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
                + Tambah Produk Pertama
            </button>
        {/if}
    </div>
{/if}

<!-- ============================================ -->
<!-- MODAL TAMBAH / EDIT -->
<!-- ============================================ -->
{#if showModal}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        on:click={handleOutsideClick}
        on:keydown={(e) => e.key === 'Escape' && closeModal()}
    >
        <div class="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <!-- Modal Header -->
            <div class="sticky top-0 bg-white p-5 border-b border-gray-200 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800">
                    {isEdit ? '✏️ Edit Produk' : '➕ Tambah Produk Baru'}
                </h3>
                <button 
                    on:click={closeModal}
                    class="text-gray-400 hover:text-gray-600 text-xl"
                >
                    ✕
                </button>
            </div>
            
            <!-- Modal Body - Form -->
            <form method="POST" action={isEdit ? '?/update' : '?/create'} class="p-5 space-y-4">
                {#if isEdit}
                    <input type="hidden" name="id" value={formData.id} />
                {/if}
                
                <!-- Row 1: Kode & Nama -->
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">Kode</label>
                        <input
                            type="text"
                            name="kode_produk"
                            bind:value={formData.kode_produk}
                            readonly
                            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm"
                        />
                    </div>
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">
                            Nama Produk <span class="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="nama_produk"
                            bind:value={formData.nama_produk}
                            required
                            placeholder="Nama produk"
                            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                </div>

                <!-- Row 2: Kategori & Satuan -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                        <select
                            name="kategori_id"
                            bind:value={formData.kategori_id}
                            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="">Pilih Kategori</option>
                            {#each kategori as k}
                                <option value={k.id}>{k.nama_kategori}</option>
                            {/each}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">Satuan</label>
                        <select
                            name="satuan"
                            bind:value={formData.satuan}
                            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {#each satuanList as s}
                                <option value={s}>{s}</option>
                            {/each}
                        </select>
                    </div>
                </div>

                <!-- Row 3: Harga -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">Harga Beli</label>
                        <div class="relative">
                            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                            <input
                                type="number"
                                name="harga_beli"
                                bind:value={formData.harga_beli}
                                min="0"
                                placeholder="0"
                                class="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">
                            Harga Jual <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                            <input
                                type="number"
                                name="harga_jual"
                                bind:value={formData.harga_jual}
                                min="0"
                                required
                                placeholder="0"
                                class="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                </div>

                <!-- Margin Info -->
                {#if formData.harga_beli > 0 && formData.harga_jual > 0}
                    <div class="p-3 rounded-lg {formData.harga_jual >= formData.harga_beli ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} text-sm">
                        Margin: {formatRupiah(formData.harga_jual - formData.harga_beli)} 
                        ({hitungMargin(formData.harga_beli, formData.harga_jual)}%)
                    </div>
                {/if}

                <!-- Row 4: Stok -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Stok Awal</label>
                    <input
                        type="number"
                        name="stok"
                        bind:value={formData.stok}
                        min="0"
                        placeholder="0"
                        class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>

                <!-- Row 5: Status (edit only) -->
                {#if isEdit}
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                        <select
                            name="status"
                            bind:value={formData.status}
                            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="aktif">✅ Aktif</option>
                            <option value="nonaktif">❌ Nonaktif</option>
                        </select>
                    </div>
                {/if}

                <!-- Action Buttons -->
                <div class="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        on:click={closeModal}
                        class="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        class="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        {isEdit ? 'Update' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- ============================================ -->
<!-- MODAL KONFIRMASI HAPUS -->
<!-- ============================================ -->
{#if showDeleteModal && selectedProduk}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        on:click={handleOutsideClick}
        on:keydown={(e) => e.key === 'Escape' && closeModal()}
    >
        <div class="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div class="text-center">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="text-3xl">⚠️</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Hapus Produk?</h3>
                <p class="text-sm text-gray-500 mb-6">
                    Apakah Anda yakin ingin menghapus produk 
                    <strong class="text-gray-700">"{selectedProduk.nama_produk}"</strong>? 
                    Tindakan ini tidak dapat dibatalkan.
                </p>
            </div>
            
            <form method="POST" action="?/delete" class="flex gap-3">
                <input type="hidden" name="id" value={selectedProduk.id} />
                <button
                    type="button"
                    on:click={closeModal}
                    class="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    class="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                    Ya, Hapus
                </button>
            </form>
        </div>
    </div>
{/if}