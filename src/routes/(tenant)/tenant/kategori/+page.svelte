<script>
    import { enhance } from '$app/forms';
    import { fade, fly } from 'svelte/transition';
    import {
        Plus,
        Search,
        FolderOpen,
        Edit2,
        Trash2,
        X,
        AlertCircle,
        CheckCircle2,
        Loader2,
        Lock,
        Eye
    } from 'lucide-svelte';

    // Data dari server
    export let data;
    export let form;

    $: user = data?.user;
    $: tenantUser = data?.tenantUser;
    $: kategori = data?.kategori || [];

    // ==========================================
    // PERMISSION CHECK
    // ==========================================
    // Kasir hanya bisa view, tidak bisa CRUD
    $: canModify = !tenantUser || ['owner', 'admin'].includes(tenantUser?.role);
    $: isKasir = tenantUser?.role === 'kasir';

    // State pencarian
    let searchQuery = '';

    // State modal
    let showModal = false;
    let showDeleteModal = false;
    let showViewModal = false;
    let isEdit = false;
    let selectedKategori = null;
    let viewKategori = null;
    let isSubmitting = false;

    // Form data
    let formData = {
        id: '',
        kode_kategori: '',
        nama_kategori: '',
        deskripsi: '',
        status: 'aktif'
    };

    // Reactive: filter kategori
    $: filteredKategori = kategori.filter(k =>
        k.nama_kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.kode_kategori.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Stats
    $: totalKategori = kategori.length;
    $: kategoriAktif = kategori.filter(k => k.status === 'aktif').length;
    $: kategoriNonaktif = kategori.filter(k => k.status === 'nonaktif').length;

    // Generate kode kategori baru
    function generateKode() {
        if (kategori.length === 0) {
            return 'KAT001';
        }

        const numbers = kategori.map(k => {
            const num = parseInt(k.kode_kategori.replace('KAT', ''));
            return isNaN(num) ? 0 : num;
        });
        const maxNum = Math.max(...numbers);

        return `KAT${String(maxNum + 1).padStart(3, '0')}`;
    }

    // Buka modal tambah
    function openAddModal() {
        if (!canModify) return;
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

    // Buka modal edit
    function openEditModal(k) {
        if (!canModify) return;
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

    // Buka modal view (untuk kasir)
    function openViewModal(k) {
        viewKategori = k;
        showViewModal = true;
    }

    // Buka modal hapus
    function openDeleteModal(k) {
        if (!canModify) return;
        selectedKategori = k;
        showDeleteModal = true;
    }

    // Tutup semua modal
    function closeModal() {
        showModal = false;
        showDeleteModal = false;
        showViewModal = false;
        selectedKategori = null;
        viewKategori = null;
        isSubmitting = false;
    }

    // Handle form submit
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

    // Handle delete submit
    function handleDelete() {
        isSubmitting = true;
        return async ({ result, update }) => {
            isSubmitting = false;
            if (result.type === 'success') {
                closeModal();
            }
            await update();
        };
    }
</script>

<svelte:head>
    <title>Kategori - {user?.nama_bisnis || 'Toko Saya'}</title>
</svelte:head>

<div class="space-y-5">
    <!-- ============================================ -->
    <!-- HEADER -->
    <!-- ============================================ -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800">Kategori Produk</h1>
            <p class="text-sm text-slate-500 mt-0.5">
                {#if isKasir}
                    Daftar kategori produk untuk referensi
                {:else}
                    Kelola kategori untuk produk Anda
                {/if}
            </p>
        </div>
        
        <!-- Tombol Tambah: Hanya tampil untuk Owner & Admin -->
        {#if canModify}
            <button
                on:click={openAddModal}
                class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium w-full sm:w-auto"
            >
                <Plus class="w-4 h-4" />
                <span>Tambah Kategori</span>
            </button>
        {:else}
            <!-- Info untuk Kasir -->
            <div class="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-500 rounded-lg text-sm">
                <Lock class="w-4 h-4" />
                <span>Mode Lihat Saja</span>
            </div>
        {/if}
    </div>

    <!-- ============================================ -->
    <!-- INFO BANNER UNTUK KASIR -->
    <!-- ============================================ -->
    {#if isKasir}
        <div class="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
            <Lock class="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p class="text-amber-700 text-sm">
                Anda login sebagai <strong>Kasir</strong>. Anda hanya dapat melihat daftar kategori. 
                Untuk menambah, edit, atau hapus kategori, hubungi Owner atau Admin.
            </p>
        </div>
    {/if}

    <!-- ============================================ -->
    <!-- ALERT MESSAGE -->
    <!-- ============================================ -->
    {#if form?.message}
        <div 
            transition:fly={{ y: -10, duration: 200 }}
            class="flex items-center gap-3 p-4 rounded-xl
                {form?.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}
            "
        >
            {#if form?.success}
                <CheckCircle2 class="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span class="text-sm font-medium text-emerald-700">{form.message}</span>
            {:else}
                <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0" />
                <span class="text-sm font-medium text-red-700">{form.message}</span>
            {/if}
        </div>
    {/if}

    <!-- ============================================ -->
    <!-- STATS -->
    <!-- ============================================ -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FolderOpen class="w-5 h-5 text-slate-600" />
                </div>
                <div>
                    <p class="text-2xl font-semibold text-slate-800">{totalKategori}</p>
                    <p class="text-sm text-slate-500">Total</p>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <CheckCircle2 class="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <p class="text-2xl font-semibold text-slate-800">{kategoriAktif}</p>
                    <p class="text-sm text-slate-500">Aktif</p>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <X class="w-5 h-5 text-red-600" />
                </div>
                <div>
                    <p class="text-2xl font-semibold text-slate-800">{kategoriNonaktif}</p>
                    <p class="text-sm text-slate-500">Nonaktif</p>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Search class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <p class="text-2xl font-semibold text-slate-800">{filteredKategori.length}</p>
                    <p class="text-sm text-slate-500">Hasil</p>
                </div>
            </div>
        </div>
    </div>

    <!-- ============================================ -->
    <!-- SEARCH -->
    <!-- ============================================ -->
    <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Cari kategori..."
                class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
        </div>
    </div>

    <!-- ============================================ -->
    <!-- KATEGORI GRID -->
    <!-- ============================================ -->
    {#if filteredKategori.length > 0}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each filteredKategori as k (k.id)}
                <div 
                    class="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all"
                    transition:fade={{ duration: 150 }}
                >
                    <!-- Header -->
                    <div class="flex items-start justify-between mb-3">
                        <div class="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                            <FolderOpen class="w-5 h-5 text-amber-600" />
                        </div>
                        <span class="text-xs font-medium px-2 py-1 rounded-full
                            {k.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                        ">
                            {k.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </div>

                    <!-- Content -->
                    <p class="text-xs text-slate-400 font-mono mb-1">{k.kode_kategori}</p>
                    <h3 class="font-semibold text-slate-800 mb-2">{k.nama_kategori}</h3>
                    <p class="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
                        {k.deskripsi || 'Tidak ada deskripsi'}
                    </p>

                    <!-- Actions -->
                    <div class="flex gap-2 pt-3 border-t border-slate-100">
                        {#if canModify}
                            <!-- Owner & Admin: Edit & Delete -->
                            <button
                                on:click={() => openEditModal(k)}
                                class="flex-1 px-3 py-2 text-sm font-medium bg-blue-50 text-blue-600 rounded-lg 
                                       hover:bg-blue-100 transition-colors inline-flex items-center justify-center gap-1.5"
                            >
                                <Edit2 class="w-3.5 h-3.5" />
                                <span>Edit</span>
                            </button>
                            <button
                                on:click={() => openDeleteModal(k)}
                                class="flex-1 px-3 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-lg 
                                       hover:bg-red-100 transition-colors inline-flex items-center justify-center gap-1.5"
                            >
                                <Trash2 class="w-3.5 h-3.5" />
                                <span>Hapus</span>
                            </button>
                        {:else}
                            <!-- Kasir: View Only -->
                            <button
                                on:click={() => openViewModal(k)}
                                class="flex-1 px-3 py-2 text-sm font-medium bg-slate-50 text-slate-600 rounded-lg 
                                       hover:bg-slate-100 transition-colors inline-flex items-center justify-center gap-1.5"
                            >
                                <Eye class="w-3.5 h-3.5" />
                                <span>Lihat Detail</span>
                            </button>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <!-- Empty State -->
        <div class="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen class="w-7 h-7 text-slate-400" />
            </div>
            <h3 class="text-base font-medium text-slate-800 mb-1">
                {searchQuery ? 'Tidak Ditemukan' : 'Belum Ada Kategori'}
            </h3>
            <p class="text-sm text-slate-500 mb-5 max-w-sm mx-auto">
                {searchQuery
                    ? 'Tidak ada kategori yang cocok dengan pencarian Anda.'
                    : isKasir 
                        ? 'Belum ada kategori yang dibuat oleh Owner/Admin.'
                        : 'Mulai dengan menambahkan kategori produk Anda.'}
            </p>
            {#if !searchQuery && canModify}
                <button
                    on:click={openAddModal}
                    class="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg 
                           hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                    <Plus class="w-4 h-4" />
                    <span>Tambah Kategori</span>
                </button>
            {/if}
        </div>
    {/if}
</div>

<!-- ============================================ -->
<!-- MODAL TAMBAH / EDIT (Owner & Admin Only) -->
<!-- ============================================ -->
{#if showModal && canModify}
    <div
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4"
        on:click|self={closeModal}
        role="dialog"
        aria-modal="true"
    >
        <div 
            transition:fly={{ y: 10, duration: 200 }}
            class="bg-white rounded-xl w-full max-w-md shadow-xl"
        >
            <!-- Header -->
            <div class="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 class="text-base font-semibold text-slate-800">
                    {isEdit ? 'Edit Kategori' : 'Tambah Kategori'}
                </h3>
                <button
                    on:click={closeModal}
                    class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Form -->
            <form
                method="POST"
                action={isEdit ? '?/update' : '?/create'}
                use:enhance={handleSubmit}
                class="p-4 space-y-4"
            >
                {#if isEdit}
                    <input type="hidden" name="id" value={formData.id} />
                {/if}

                <!-- Kode -->
                <div class="space-y-1.5">
                    <label for="kode_kategori" class="block text-sm font-medium text-slate-700">
                        Kode Kategori
                    </label>
                    <input
                        type="text"
                        id="kode_kategori"
                        name="kode_kategori"
                        bind:value={formData.kode_kategori}
                        readonly
                        class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm"
                    />
                    <p class="text-xs text-slate-500">Kode dibuat otomatis</p>
                </div>

                <!-- Nama -->
                <div class="space-y-1.5">
                    <label for="nama_kategori" class="block text-sm font-medium text-slate-700">
                        Nama Kategori <span class="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="nama_kategori"
                        name="nama_kategori"
                        bind:value={formData.nama_kategori}
                        required
                        placeholder="Contoh: Makanan, Minuman"
                        class="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm
                               placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                </div>

                <!-- Deskripsi -->
                <div class="space-y-1.5">
                    <label for="deskripsi" class="block text-sm font-medium text-slate-700">Deskripsi</label>
                    <textarea
                        id="deskripsi"
                        name="deskripsi"
                        bind:value={formData.deskripsi}
                        rows="3"
                        placeholder="Deskripsi singkat kategori..."
                        class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm
                               placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 resize-none transition-colors"
                    ></textarea>
                </div>

                <!-- Status (edit only) -->
                {#if isEdit}
                    <div class="space-y-1.5">
                        <label for="status" class="block text-sm font-medium text-slate-700">Status</label>
                        <select
                            id="status"
                            name="status"
                            bind:value={formData.status}
                            class="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm
                                   focus:outline-none focus:border-emerald-500 transition-colors"
                        >
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif</option>
                        </select>
                    </div>
                {/if}

                <!-- Buttons -->
                <div class="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                        type="button"
                        on:click={closeModal}
                        class="flex-1 h-10 border border-slate-200 text-slate-600 rounded-lg 
                               hover:bg-slate-50 transition-colors font-medium text-sm"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !formData.nama_kategori}
                        class="flex-1 h-10 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 
                               transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed
                               flex items-center justify-center gap-2"
                    >
                        {#if isSubmitting}
                            <Loader2 class="w-4 h-4 animate-spin" />
                        {/if}
                        <span>{isEdit ? 'Update' : 'Simpan'}</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- ============================================ -->
<!-- MODAL VIEW (Untuk Kasir) -->
<!-- ============================================ -->
{#if showViewModal && viewKategori}
    <div
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4"
        on:click|self={closeModal}
        role="dialog"
        aria-modal="true"
    >
        <div 
            transition:fly={{ y: 10, duration: 200 }}
            class="bg-white rounded-xl w-full max-w-md shadow-xl"
        >
            <!-- Header -->
            <div class="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 class="text-base font-semibold text-slate-800">Detail Kategori</h3>
                <button
                    on:click={closeModal}
                    class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Content -->
            <div class="p-4 space-y-4">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center">
                        <FolderOpen class="w-7 h-7 text-amber-600" />
                    </div>
                    <div>
                        <p class="text-xs text-slate-400 font-mono">{viewKategori.kode_kategori}</p>
                        <h4 class="font-semibold text-slate-800 text-lg">{viewKategori.nama_kategori}</h4>
                        <span class="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1
                            {viewKategori.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                        ">
                            {viewKategori.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </div>
                </div>

                <div class="p-3 bg-slate-50 rounded-lg">
                    <p class="text-xs font-medium text-slate-500 mb-1">Deskripsi</p>
                    <p class="text-sm text-slate-700">
                        {viewKategori.deskripsi || 'Tidak ada deskripsi'}
                    </p>
                </div>

                <button
                    on:click={closeModal}
                    class="w-full h-10 border border-slate-200 text-slate-600 rounded-lg 
                           hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                    Tutup
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- ============================================ -->
<!-- MODAL KONFIRMASI HAPUS (Owner & Admin Only) -->
<!-- ============================================ -->
{#if showDeleteModal && selectedKategori && canModify}
    <div
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4"
        on:click|self={closeModal}
        role="dialog"
        aria-modal="true"
    >
        <div 
            transition:fly={{ y: 10, duration: 200 }}
            class="bg-white rounded-xl w-full max-w-sm p-5 text-center"
        >
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 class="w-6 h-6 text-red-600" />
            </div>
            <h3 class="text-base font-semibold text-slate-800 mb-2">Hapus Kategori?</h3>
            <p class="text-slate-500 text-sm mb-5">
                <strong class="text-slate-700">"{selectedKategori.nama_kategori}"</strong> akan dihapus permanen.
            </p>

            <form 
                method="POST" 
                action="?/delete" 
                use:enhance={handleDelete}
                class="flex gap-3"
            >
                <input type="hidden" name="id" value={selectedKategori.id} />
                <button
                    type="button"
                    on:click={closeModal}
                    class="flex-1 h-10 border border-slate-200 text-slate-600 rounded-lg 
                           hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    class="flex-1 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 
                           transition-colors font-medium text-sm disabled:opacity-50
                           flex items-center justify-center gap-2"
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

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>