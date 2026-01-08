<script>
    import { 
        Plus, 
        Search, 
        FolderOpen, 
        Edit, 
        Trash2, 
        X,
        AlertCircle,
        CheckCircle2
    } from 'lucide-svelte';

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

<div class="max-w-7xl mx-auto">
    <!-- ============================================ -->
    <!-- HEADER SECTION -->
    <!-- ============================================ -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
            <h1 class="text-2xl font-semibold text-gray-900 mb-1">Daftar Kategori</h1>
            <p class="text-sm text-gray-500">Kelola kategori produk toko Anda</p>
        </div>
        <button
            on:click={openAddModal}
            class="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium inline-flex items-center justify-center gap-2 shadow-sm"
        >
            <Plus class="w-4 h-4" />
            <span>Tambah Kategori</span>
        </button>
    </div>

    <!-- ============================================ -->
    <!-- ALERT MESSAGE -->
    <!-- ============================================ -->
    {#if form?.message}
        <div class="mb-4 p-4 rounded-lg flex items-center gap-3 {form?.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}">
            {#if form?.success}
                <CheckCircle2 class="w-5 h-5 flex-shrink-0" />
            {:else}
                <AlertCircle class="w-5 h-5 flex-shrink-0" />
            {/if}
            <span class="text-sm font-medium">{form.message}</span>
        </div>
    {/if}

    <!-- ============================================ -->
    <!-- SEARCH BOX -->
    <!-- ============================================ -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Cari kategori berdasarkan nama atau kode..."
                class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
        </div>
    </div>

    <!-- ============================================ -->
    <!-- STATISTICS -->
    <!-- ============================================ -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <p class="text-xs text-gray-500 mb-1">Total Kategori</p>
            <p class="text-2xl font-semibold text-gray-900">{kategori.length}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <p class="text-xs text-gray-500 mb-1">Aktif</p>
            <p class="text-2xl font-semibold text-green-600">{kategori.filter(k => k.status === 'aktif').length}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <p class="text-xs text-gray-500 mb-1">Nonaktif</p>
            <p class="text-2xl font-semibold text-red-600">{kategori.filter(k => k.status === 'nonaktif').length}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <p class="text-xs text-gray-500 mb-1">Hasil Pencarian</p>
            <p class="text-2xl font-semibold text-blue-600">{filteredKategori.length}</p>
        </div>
    </div>

    <!-- ============================================ -->
    <!-- GRID CARDS -->
    <!-- ============================================ -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each filteredKategori as k (k.id)}
            <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 group">
                <!-- Header Card -->
                <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FolderOpen class="w-6 h-6 text-amber-600" />
                    </div>
                    <span class="px-2.5 py-1 text-xs font-medium rounded-full {k.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        {k.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </span>
                </div>
                
                <!-- Content Card -->
                <p class="text-xs text-gray-400 font-mono mb-1">{k.kode_kategori}</p>
                <h3 class="font-semibold text-gray-900 mb-2 text-base">{k.nama_kategori}</h3>
                <p class="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">
                    {k.deskripsi || 'Tidak ada deskripsi'}
                </p>
                
                <!-- Action Buttons -->
                <div class="flex gap-2 pt-4 border-t border-gray-100">
                    <button 
                        on:click={() => openEditModal(k)} 
                        class="flex-1 px-3 py-2 text-sm font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                        <Edit class="w-3.5 h-3.5" />
                        <span>Edit</span>
                    </button>
                    <button 
                        on:click={() => openDeleteModal(k)} 
                        class="flex-1 px-3 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                        <Trash2 class="w-3.5 h-3.5" />
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
                <FolderOpen class="w-8 h-8 text-gray-400" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Tidak Ada Kategori</h3>
            <p class="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
                {searchQuery ? 'Tidak ada kategori yang cocok dengan pencarian Anda.' : 'Belum ada kategori yang ditambahkan.'}
            </p>
            {#if !searchQuery}
                <button
                    on:click={openAddModal}
                    class="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                    <Plus class="w-4 h-4" />
                    <span>Tambah Kategori Pertama</span>
                </button>
            {/if}
        </div>
    {/if}
</div>

<!-- ============================================ -->
<!-- MODAL TAMBAH / EDIT -->
<!-- ============================================ -->
{#if showModal}
    <div 
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        on:click={handleOutsideClick}
        on:keydown={(e) => e.key === 'Escape' && closeModal()}
        role="dialog"
        aria-modal="true"
    >
        <div class="bg-white rounded-2xl w-full max-w-md shadow-xl animate-scale-up">
            <!-- Modal Header -->
            <div class="p-5 border-b border-gray-200 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">
                    {isEdit ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </h3>
                <button 
                    on:click={closeModal}
                    class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <X class="w-5 h-5" />
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
                    <label for="kode-kategori" class="block text-sm font-medium text-gray-700 mb-1.5">
                        Kode Kategori
                    </label>
                    <input
                        id="kode-kategori"
                        type="text"
                        name="kode_kategori"
                        bind:value={formData.kode_kategori}
                        readonly
                        class="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
                    />
                    <p class="text-xs text-gray-500 mt-1">Kode dibuat otomatis oleh sistem</p>
                </div>

                <!-- Nama Kategori -->
                <div>
                    <label for="nama-kategori" class="block text-sm font-medium text-gray-700 mb-1.5">
                        Nama Kategori <span class="text-red-500">*</span>
                    </label>
                    <input
                        id="nama-kategori"
                        type="text"
                        name="nama_kategori"
                        bind:value={formData.nama_kategori}
                        required
                        placeholder="Contoh: Makanan, Minuman, Elektronik"
                        class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                </div>

                <!-- Deskripsi -->
                <div>
                    <label for="deskripsi" class="block text-sm font-medium text-gray-700 mb-1.5">
                        Deskripsi
                    </label>
                    <textarea
                        id="deskripsi"
                        name="deskripsi"
                        bind:value={formData.deskripsi}
                        rows="3"
                        placeholder="Deskripsi singkat tentang kategori ini..."
                        class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm"
                    ></textarea>
                </div>

                <!-- Status (hanya untuk edit) -->
                {#if isEdit}
                    <div>
                        <label for="status" class="block text-sm font-medium text-gray-700 mb-1.5">
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            bind:value={formData.status}
                            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        >
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif</option>
                        </select>
                    </div>
                {/if}

                <!-- Action Buttons -->
                <div class="flex gap-3 pt-4">
                    <button
                        type="button"
                        on:click={closeModal}
                        class="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        class="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
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
    <div 
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        on:click={handleOutsideClick}
        on:keydown={(e) => e.key === 'Escape' && closeModal()}
        role="dialog"
        aria-modal="true"
    >
        <div class="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-scale-up">
            <!-- Icon Warning -->
            <div class="text-center">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle class="w-8 h-8 text-red-600" />
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Hapus Kategori?</h3>
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
                    class="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    class="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm shadow-sm"
                >
                    Ya, Hapus
                </button>
            </form>
        </div>
    </div>
{/if}

<style>
    @keyframes scale-up {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    .animate-scale-up {
        animation: scale-up 0.2s ease-out;
    }
</style>