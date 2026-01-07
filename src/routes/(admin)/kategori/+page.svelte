<script>
    // ============================================
    // DATA & STATE
    // ============================================
    
    // Data dari server (load function)
    export let data;
    export let form;

    // List kategori dari database
    let kategori = data.kategori;
    
    // State untuk pencarian
    let searchQuery = '';
    
    // State untuk modal
    let showModal = false;
    let showDeleteModal = false;
    let isEdit = false;
    let selectedKategori = null;

    // State form data
    let formData = {
        id: '',
        kode_kategori: '',
        nama_kategori: '',
        deskripsi: '',
        status: 'aktif'
    };

    // ============================================
    // REACTIVE STATEMENTS
    // ============================================
    
    // Filter kategori berdasarkan pencarian
    $: filteredKategori = kategori.filter(k =>
        k.nama_kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.kode_kategori.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Tutup modal otomatis setelah action berhasil
    $: if (form?.success) {
        closeModal();
    }

    // ============================================
    // FUNCTIONS
    // ============================================
    
    /**
     * Generate kode kategori baru secara otomatis
     * Format: KTG001, KTG002, dst
     */
    function generateKode() {
        if (kategori.length === 0) {
            return 'KTG001';
        }
        
        // Ambil nomor terbesar dari kode yang ada
        const numbers = kategori.map(k => {
            const num = parseInt(k.kode_kategori.replace('KTG', ''));
            return isNaN(num) ? 0 : num;
        });
        const maxNum = Math.max(...numbers);
        
        // Generate kode baru dengan nomor + 1
        return `KTG${String(maxNum + 1).padStart(3, '0')}`;
    }

    /**
     * Buka modal untuk tambah kategori baru
     */
    function openAddModal() {
        isEdit = false;
        formData = {
            id: '',
            kode_kategori: generateKode(),
            nama_kategori: '',
            deskripsi: '',
            status: 'aktif'
        };
        showModal = true;
    }

    /**
     * Buka modal untuk edit kategori
     * @param {Object} k - Data kategori yang akan diedit
     */
    function openEditModal(k) {
        isEdit = true;
        formData = { 
            id: k.id,
            kode_kategori: k.kode_kategori,
            nama_kategori: k.nama_kategori,
            deskripsi: k.deskripsi || '',
            status: k.status
        };
        showModal = true;
    }

    /**
     * Buka modal konfirmasi hapus
     * @param {Object} k - Data kategori yang akan dihapus
     */
    function openDeleteModal(k) {
        selectedKategori = k;
        showDeleteModal = true;
    }

    /**
     * Tutup semua modal
     */
    function closeModal() {
        showModal = false;
        showDeleteModal = false;
        selectedKategori = null;
    }

    /**
     * Handle klik di luar modal untuk menutup
     * @param {Event} event
     */
    function handleOutsideClick(event) {
        if (event.target === event.currentTarget) {
            closeModal();
        }
    }
</script>

<!-- ============================================ -->
<!-- HEADER SECTION -->
<!-- ============================================ -->
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div>
        <h1 class="text-xl font-bold text-gray-800">Daftar Kategori</h1>
        <p class="text-sm text-gray-500">Kelola kategori produk toko Anda</p>
    </div>
    <button
        on:click={openAddModal}
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
    >
        <span>+</span>
        <span>Tambah Kategori</span>
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
<!-- SEARCH BOX -->
<!-- ============================================ -->
<div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
    <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
            type="text"
            bind:value={searchQuery}
            placeholder="Cari kategori berdasarkan nama atau kode..."
            class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
    </div>
</div>

<!-- ============================================ -->
<!-- STATISTICS -->
<!-- ============================================ -->
<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-sm text-gray-500">Total Kategori</p>
        <p class="text-2xl font-bold text-gray-800">{kategori.length}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-sm text-gray-500">Aktif</p>
        <p class="text-2xl font-bold text-green-600">{kategori.filter(k => k.status === 'aktif').length}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-sm text-gray-500">Nonaktif</p>
        <p class="text-2xl font-bold text-red-600">{kategori.filter(k => k.status === 'nonaktif').length}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-sm text-gray-500">Hasil Pencarian</p>
        <p class="text-2xl font-bold text-blue-600">{filteredKategori.length}</p>
    </div>
</div>

<!-- ============================================ -->
<!-- GRID CARDS -->
<!-- ============================================ -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {#each filteredKategori as k (k.id)}
        <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 group">
            <!-- Header Card -->
            <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    📁
                </div>
                <span class="px-2.5 py-1 text-xs font-medium rounded-full {k.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                    {k.status === 'aktif' ? '● Aktif' : '● Nonaktif'}
                </span>
            </div>
            
            <!-- Content Card -->
            <p class="text-xs text-gray-400 font-mono mb-1">{k.kode_kategori}</p>
            <h3 class="font-semibold text-gray-800 mb-2 text-lg">{k.nama_kategori}</h3>
            <p class="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">
                {k.deskripsi || 'Tidak ada deskripsi'}
            </p>
            
            <!-- Action Buttons -->
            <div class="flex gap-2 pt-4 border-t border-gray-100">
                <button 
                    on:click={() => openEditModal(k)} 
                    class="flex-1 px-3 py-2 text-sm font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center justify-center gap-1"
                >
                    <span>✏️</span>
                    <span>Edit</span>
                </button>
                <button 
                    on:click={() => openDeleteModal(k)} 
                    class="flex-1 px-3 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors inline-flex items-center justify-center gap-1"
                >
                    <span>🗑️</span>
                    <span>Hapus</span>
                </button>
            </div>
        </div>
    {/each}
</div>

<!-- ============================================ -->
<!-- EMPTY STATE -->
<!-- ============================================ -->
{#if filteredKategori.length === 0}
    <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-3xl">📁</span>
        </div>
        <h3 class="text-lg font-medium text-gray-800 mb-2">Tidak Ada Kategori</h3>
        <p class="text-gray-500 mb-4">
            {searchQuery ? 'Tidak ada kategori yang cocok dengan pencarian Anda.' : 'Belum ada kategori yang ditambahkan.'}
        </p>
        {#if !searchQuery}
            <button
                on:click={openAddModal}
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
                + Tambah Kategori Pertama
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
        <div class="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <!-- Modal Header -->
            <div class="p-5 border-b border-gray-200 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800">
                    {isEdit ? '✏️ Edit Kategori' : '➕ Tambah Kategori Baru'}
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
                <!-- Hidden ID untuk edit -->
                {#if isEdit}
                    <input type="hidden" name="id" value={formData.id} />
                {/if}
                
                <!-- Kode Kategori -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">
                        Kode Kategori
                    </label>
                    <input
                        type="text"
                        name="kode_kategori"
                        bind:value={formData.kode_kategori}
                        readonly
                        class="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p class="text-xs text-gray-400 mt-1">Kode dibuat otomatis oleh sistem</p>
                </div>

                <!-- Nama Kategori -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">
                        Nama Kategori <span class="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="nama_kategori"
                        bind:value={formData.nama_kategori}
                        required
                        placeholder="Contoh: Makanan, Minuman, Elektronik"
                        class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>

                <!-- Deskripsi -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">
                        Deskripsi
                    </label>
                    <textarea
                        name="deskripsi"
                        bind:value={formData.deskripsi}
                        rows="3"
                        placeholder="Deskripsi singkat tentang kategori ini..."
                        class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    ></textarea>
                </div>

                <!-- Status (hanya untuk edit) -->
                {#if isEdit}
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">
                            Status
                        </label>
                        <select
                            name="status"
                            bind:value={formData.status}
                            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            <option value="aktif">✅ Aktif</option>
                            <option value="nonaktif">❌ Nonaktif</option>
                        </select>
                    </div>
                {/if}

                <!-- Action Buttons -->
                <div class="flex gap-3 pt-4">
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
{#if showDeleteModal && selectedKategori}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        on:click={handleOutsideClick}
        on:keydown={(e) => e.key === 'Escape' && closeModal()}
    >
        <div class="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <!-- Icon Warning -->
            <div class="text-center">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="text-3xl">⚠️</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Hapus Kategori?</h3>
                <p class="text-sm text-gray-500 mb-6">
                    Apakah Anda yakin ingin menghapus kategori 
                    <strong class="text-gray-700">"{selectedKategori.nama_kategori}"</strong>? 
                    Tindakan ini tidak dapat dibatalkan.
                </p>
            </div>
            
            <!-- Action Buttons -->
            <form method="POST" action="?/delete" class="flex gap-3">
                <input type="hidden" name="id" value={selectedKategori.id} />
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