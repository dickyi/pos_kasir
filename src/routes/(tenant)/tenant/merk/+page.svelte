<!--
    +page.svelte - Halaman Merk (FIXED + VIEW TOGGLE)
    ============================================
    FIXES:
    - Perbaikan tampilan semua merk
    - Tambah fitur toggle view: Card / List
    - UI konsisten dengan halaman lain (emerald theme)
-->
<script>
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { fly, fade, slide } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import { 
        Tag, Plus, Search, Edit2, Trash2,
        Package, Globe, CheckCircle, XCircle, AlertCircle,
        ExternalLink, X, LayoutGrid, List, Eye
    } from 'lucide-svelte';

    // Import modal
    import MerkFormModal from '$lib/components/tenant/merk/MerkFormModal.svelte';
    import DeleteConfirmModal from '$lib/components/tenant/merk/DeleteConfirmModal.svelte';

    export let data;
    export let form;

    $: merkList = data?.merkList || [];
    $: stats = data?.stats || {};
    $: user = data?.user;
    $: tenantUser = data?.tenantUser;

    // State
    let searchQuery = '';
    let statusFilter = 'semua'; // semua, aktif, nonaktif
    let viewMode = 'card'; // 'card' atau 'list'
    let showFormModal = false;
    let showDeleteModal = false;
    let editMerk = null;
    let deleteMerk = null;

    // Permission check
    $: canEdit = tenantUser?.role === 'owner' || tenantUser?.role === 'admin';

    // Filtered list
    $: filteredMerk = merkList.filter(m => {
        const matchSearch = !searchQuery || 
            m.nama_merk?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.kode_merk?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchStatus = statusFilter === 'semua' || m.status === statusFilter;
        
        return matchSearch && matchStatus;
    });

    // Functions
    function openAddModal() {
        editMerk = null;
        showFormModal = true;
    }

    function openEditModal(merk) {
        editMerk = merk;
        showFormModal = true;
    }

    function openDeleteModal(merk) {
        deleteMerk = merk;
        showDeleteModal = true;
    }

    function closeModals() {
        showFormModal = false;
        showDeleteModal = false;
        editMerk = null;
        deleteMerk = null;
    }

    function handleFormSuccess() {
        closeModals();
        invalidateAll();
    }

    // Format number
    function formatNumber(num) {
        return new Intl.NumberFormat('id-ID').format(num || 0);
    }

    // Get initials for avatar
    function getInitials(nama) {
        if (!nama) return 'M';
        return nama.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
    }

    // Toggle view mode
    function setViewMode(mode) {
        viewMode = mode;
        // Simpan preference ke localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('merkViewMode', mode);
        }
    }

    // Load saved view mode on mount
    import { onMount } from 'svelte';
    onMount(() => {
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('merkViewMode');
            if (saved === 'card' || saved === 'list') {
                viewMode = saved;
            }
        }
    });
</script>

<svelte:head>
    <title>Merk - {user?.nama_bisnis || 'POSKasir'}</title>
</svelte:head>

<div class="space-y-6">
    <!-- ============================================ -->
    <!-- HEADER -->
    <!-- ============================================ -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Merk / Brand</h1>
            <p class="text-sm text-slate-500 mt-1">
                Kelola merk atau brand produk Anda
            </p>
        </div>

        {#if canEdit}
            <button
                on:click={openAddModal}
                class="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white 
                       rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-all
                       shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40
                       hover:-translate-y-0.5 active:translate-y-0"
            >
                <Plus class="w-4 h-4" />
                <span>Tambah Merk</span>
            </button>
        {/if}
    </div>

    <!-- ============================================ -->
    <!-- STATS CARDS -->
    <!-- ============================================ -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Merk -->
        <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div class="flex items-center gap-3">
                <div class="p-2.5 bg-emerald-100 rounded-xl">
                    <Tag class="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-slate-800">{formatNumber(stats.total_merk)}</p>
                    <p class="text-xs text-slate-500">Total Merk</p>
                </div>
            </div>
        </div>

        <!-- Merk Aktif -->
        <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div class="flex items-center gap-3">
                <div class="p-2.5 bg-green-100 rounded-xl">
                    <CheckCircle class="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-slate-800">{formatNumber(stats.merk_aktif)}</p>
                    <p class="text-xs text-slate-500">Merk Aktif</p>
                </div>
            </div>
        </div>

        <!-- Merk Nonaktif -->
        <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div class="flex items-center gap-3">
                <div class="p-2.5 bg-slate-100 rounded-xl">
                    <XCircle class="w-5 h-5 text-slate-500" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-slate-800">{formatNumber(stats.merk_nonaktif)}</p>
                    <p class="text-xs text-slate-500">Nonaktif</p>
                </div>
            </div>
        </div>

        <!-- Produk Tanpa Merk -->
        <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div class="flex items-center gap-3">
                <div class="p-2.5 bg-amber-100 rounded-xl">
                    <Package class="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-slate-800">{formatNumber(stats.produk_tanpa_merk)}</p>
                    <p class="text-xs text-slate-500">Tanpa Merk</p>
                </div>
            </div>
        </div>
    </div>

    <!-- ============================================ -->
    <!-- FILTER & SEARCH + VIEW TOGGLE -->
    <!-- ============================================ -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div class="flex flex-col lg:flex-row gap-3">
            <!-- Search -->
            <div class="flex-1 relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Cari merk..."
                    class="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm
                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                           focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                />
                {#if searchQuery}
                    <button
                        on:click={() => searchQuery = ''}
                        class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    >
                        <X class="w-4 h-4" />
                    </button>
                {/if}
            </div>

            <!-- Status Filter + View Toggle -->
            <div class="flex flex-wrap items-center gap-2">
                <!-- Status Filter -->
                <div class="flex gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                        on:click={() => statusFilter = 'semua'}
                        class="px-3 py-1.5 rounded-md text-xs font-medium transition-all
                               {statusFilter === 'semua' 
                                   ? 'bg-white text-emerald-700 shadow-sm' 
                                   : 'text-slate-600 hover:text-slate-800'}"
                    >
                        Semua
                    </button>
                    <button
                        on:click={() => statusFilter = 'aktif'}
                        class="px-3 py-1.5 rounded-md text-xs font-medium transition-all
                               {statusFilter === 'aktif' 
                                   ? 'bg-white text-green-700 shadow-sm' 
                                   : 'text-slate-600 hover:text-slate-800'}"
                    >
                        Aktif
                    </button>
                    <button
                        on:click={() => statusFilter = 'nonaktif'}
                        class="px-3 py-1.5 rounded-md text-xs font-medium transition-all
                               {statusFilter === 'nonaktif' 
                                   ? 'bg-white text-slate-700 shadow-sm' 
                                   : 'text-slate-600 hover:text-slate-800'}"
                    >
                        Nonaktif
                    </button>
                </div>

                <!-- Divider -->
                <div class="hidden sm:block w-px h-8 bg-slate-200"></div>

                <!-- View Toggle -->
                <div class="flex gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                        on:click={() => setViewMode('card')}
                        class="p-2 rounded-md transition-all
                               {viewMode === 'card' 
                                   ? 'bg-white text-emerald-600 shadow-sm' 
                                   : 'text-slate-500 hover:text-slate-700'}"
                        title="Tampilan Card"
                    >
                        <LayoutGrid class="w-4 h-4" />
                    </button>
                    <button
                        on:click={() => setViewMode('list')}
                        class="p-2 rounded-md transition-all
                               {viewMode === 'list' 
                                   ? 'bg-white text-emerald-600 shadow-sm' 
                                   : 'text-slate-500 hover:text-slate-700'}"
                        title="Tampilan List"
                    >
                        <List class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- ============================================ -->
    <!-- MERK LIST -->
    <!-- ============================================ -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {#if filteredMerk.length === 0}
            <!-- Empty State -->
            <div class="p-12 text-center">
                <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Tag class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-800 mb-1">
                    {searchQuery || statusFilter !== 'semua' ? 'Tidak ada merk ditemukan' : 'Belum ada merk'}
                </h3>
                <p class="text-sm text-slate-500 mb-4">
                    {searchQuery || statusFilter !== 'semua' 
                        ? 'Coba ubah filter atau kata kunci pencarian' 
                        : 'Tambahkan merk untuk mengorganisir produk Anda'}
                </p>
                {#if canEdit && !searchQuery && statusFilter === 'semua'}
                    <button
                        on:click={openAddModal}
                        class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white 
                               rounded-xl font-medium text-sm hover:bg-emerald-700 transition-colors"
                    >
                        <Plus class="w-4 h-4" />
                        <span>Tambah Merk Pertama</span>
                    </button>
                {/if}
            </div>
        {:else}
            <!-- ============================================ -->
            <!-- CARD VIEW -->
            <!-- ============================================ -->
            {#if viewMode === 'card'}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {#each filteredMerk as merk (merk.id)}
                        <div
                            animate:flip={{ duration: 200 }}
                            transition:fade={{ duration: 150 }}
                            class="group relative bg-slate-50 hover:bg-white rounded-xl p-4 border border-slate-200
                                   hover:border-emerald-200 hover:shadow-md transition-all duration-200"
                        >
                            <!-- Status Badge -->
                            <div class="absolute top-3 right-3">
                                {#if merk.status === 'aktif'}
                                    <span class="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">
                                        Aktif
                                    </span>
                                {:else}
                                    <span class="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-medium rounded-full">
                                        Nonaktif
                                    </span>
                                {/if}
                            </div>

                            <!-- Merk Info -->
                            <div class="flex items-start gap-3">
                                <!-- Avatar/Logo -->
                                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500
                                            flex items-center justify-center text-white font-bold text-sm
                                            shadow-lg shadow-emerald-500/20 flex-shrink-0">
                                    {#if merk.logo}
                                        <img src={merk.logo} alt={merk.nama_merk} class="w-full h-full object-cover rounded-xl" />
                                    {:else}
                                        {getInitials(merk.nama_merk)}
                                    {/if}
                                </div>

                                <div class="flex-1 min-w-0">
                                    <h3 class="font-semibold text-slate-800 truncate">{merk.nama_merk}</h3>
                                    <p class="text-xs text-slate-500">{merk.kode_merk}</p>
                                    
                                    {#if merk.deskripsi}
                                        <p class="text-xs text-slate-500 mt-1 line-clamp-2">{merk.deskripsi}</p>
                                    {/if}
                                </div>
                            </div>

                            <!-- Stats -->
                            <div class="flex items-center gap-4 mt-4 pt-3 border-t border-slate-200">
                                <div class="flex items-center gap-1.5">
                                    <Package class="w-3.5 h-3.5 text-slate-400" />
                                    <span class="text-xs text-slate-600">
                                        <strong>{merk.jumlah_produk || 0}</strong> produk
                                    </span>
                                </div>
                                {#if merk.website}
                                    <a 
                                        href={merk.website.startsWith('http') ? merk.website : `https://${merk.website}`}
                                        target="_blank"
                                        rel="noopener"
                                        class="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                                    >
                                        <Globe class="w-3.5 h-3.5" />
                                        <span>Website</span>
                                        <ExternalLink class="w-3 h-3" />
                                    </a>
                                {/if}
                            </div>

                            <!-- Actions -->
                            {#if canEdit}
                                <div class="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                                    <button
                                        on:click={() => openEditModal(merk)}
                                        class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                                               bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700
                                               rounded-lg text-xs font-medium transition-colors"
                                    >
                                        <Edit2 class="w-3.5 h-3.5" />
                                        <span>Edit</span>
                                    </button>

                                    <!-- Toggle Status -->
                                    <form method="POST" action="?/toggleStatus" use:enhance={() => {
                                        return async ({ update }) => {
                                            await update();
                                            invalidateAll();
                                        };
                                    }}>
                                        <input type="hidden" name="id" value={merk.id} />
                                        <button
                                            type="submit"
                                            class="p-2 rounded-lg transition-colors
                                                   {merk.status === 'aktif'
                                                       ? 'bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-600'
                                                       : 'bg-slate-100 hover:bg-green-100 text-slate-500 hover:text-green-600'}"
                                            title={merk.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                                        >
                                            {#if merk.status === 'aktif'}
                                                <XCircle class="w-4 h-4" />
                                            {:else}
                                                <CheckCircle class="w-4 h-4" />
                                            {/if}
                                        </button>
                                    </form>

                                    <button
                                        on:click={() => openDeleteModal(merk)}
                                        class="p-2 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600
                                               rounded-lg transition-colors"
                                        title="Hapus"
                                    >
                                        <Trash2 class="w-4 h-4" />
                                    </button>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>

            <!-- ============================================ -->
            <!-- LIST VIEW -->
            <!-- ============================================ -->
            {:else}
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Merk
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Kode
                                </th>
                                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Produk
                                </th>
                                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Website
                                </th>
                                {#if canEdit}
                                    <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                {/if}
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            {#each filteredMerk as merk, index (merk.id)}
                                <tr 
                                    class="hover:bg-slate-50 transition-colors"
                                    animate:flip={{ duration: 200 }}
                                >
                                    <!-- Merk Info -->
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500
                                                        flex items-center justify-center text-white font-bold text-xs
                                                        shadow shadow-emerald-500/20 flex-shrink-0">
                                                {#if merk.logo}
                                                    <img src={merk.logo} alt={merk.nama_merk} class="w-full h-full object-cover rounded-lg" />
                                                {:else}
                                                    {getInitials(merk.nama_merk)}
                                                {/if}
                                            </div>
                                            <div class="min-w-0">
                                                <p class="font-semibold text-slate-800 truncate">{merk.nama_merk}</p>
                                                {#if merk.deskripsi}
                                                    <p class="text-xs text-slate-500 truncate max-w-[200px]">{merk.deskripsi}</p>
                                                {/if}
                                            </div>
                                        </div>
                                    </td>

                                    <!-- Kode -->
                                    <td class="px-4 py-3">
                                        <span class="text-sm text-slate-600 font-mono">{merk.kode_merk}</span>
                                    </td>

                                    <!-- Jumlah Produk -->
                                    <td class="px-4 py-3 text-center">
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 
                                                     text-slate-700 text-xs font-medium rounded-full">
                                            <Package class="w-3.5 h-3.5" />
                                            {merk.jumlah_produk || 0}
                                        </span>
                                    </td>

                                    <!-- Status -->
                                    <td class="px-4 py-3 text-center">
                                        {#if merk.status === 'aktif'}
                                            <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 
                                                         text-green-700 text-xs font-medium rounded-full">
                                                <CheckCircle class="w-3.5 h-3.5" />
                                                Aktif
                                            </span>
                                        {:else}
                                            <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 
                                                         text-slate-600 text-xs font-medium rounded-full">
                                                <XCircle class="w-3.5 h-3.5" />
                                                Nonaktif
                                            </span>
                                        {/if}
                                    </td>

                                    <!-- Website -->
                                    <td class="px-4 py-3">
                                        {#if merk.website}
                                            <a 
                                                href={merk.website.startsWith('http') ? merk.website : `https://${merk.website}`}
                                                target="_blank"
                                                rel="noopener"
                                                class="inline-flex items-center gap-1 text-xs text-emerald-600 
                                                       hover:text-emerald-700 hover:underline"
                                            >
                                                <Globe class="w-3.5 h-3.5" />
                                                <span class="truncate max-w-[150px]">{merk.website}</span>
                                                <ExternalLink class="w-3 h-3" />
                                            </a>
                                        {:else}
                                            <span class="text-xs text-slate-400">-</span>
                                        {/if}
                                    </td>

                                    <!-- Actions -->
                                    {#if canEdit}
                                        <td class="px-4 py-3">
                                            <div class="flex items-center justify-center gap-1">
                                                <button
                                                    on:click={() => openEditModal(merk)}
                                                    class="p-2 rounded-lg text-slate-500 hover:text-emerald-600 
                                                           hover:bg-emerald-50 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 class="w-4 h-4" />
                                                </button>

                                                <!-- Toggle Status -->
                                                <form method="POST" action="?/toggleStatus" use:enhance={() => {
                                                    return async ({ update }) => {
                                                        await update();
                                                        invalidateAll();
                                                    };
                                                }}>
                                                    <input type="hidden" name="id" value={merk.id} />
                                                    <button
                                                        type="submit"
                                                        class="p-2 rounded-lg transition-colors
                                                               {merk.status === 'aktif'
                                                                   ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                                                   : 'text-slate-500 hover:text-green-600 hover:bg-green-50'}"
                                                        title={merk.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                                                    >
                                                        {#if merk.status === 'aktif'}
                                                            <XCircle class="w-4 h-4" />
                                                        {:else}
                                                            <CheckCircle class="w-4 h-4" />
                                                        {/if}
                                                    </button>
                                                </form>

                                                <button
                                                    on:click={() => openDeleteModal(merk)}
                                                    class="p-2 rounded-lg text-slate-500 hover:text-red-600 
                                                           hover:bg-red-50 transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 class="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    {/if}
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}

            <!-- Count Info -->
            <div class="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center">
                <p class="text-sm text-slate-500">
                    Menampilkan <strong class="text-slate-700">{filteredMerk.length}</strong> dari 
                    <strong class="text-slate-700">{merkList.length}</strong> merk
                </p>
            </div>
        {/if}
    </div>
</div>

<!-- ============================================ -->
<!-- MODALS -->
<!-- ============================================ -->

<!-- Form Modal -->
<MerkFormModal
    bind:open={showFormModal}
    merk={editMerk}
    on:close={closeModals}
    on:success={handleFormSuccess}
/>

<!-- Delete Confirm Modal -->
<DeleteConfirmModal
    bind:open={showDeleteModal}
    merk={deleteMerk}
    on:close={closeModals}
    on:success={handleFormSuccess}
/>

<!-- Toast untuk feedback -->
{#if form?.success}
    <div 
        transition:fly={{ y: 50, duration: 300 }}
        class="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 
               bg-emerald-600 text-white rounded-xl shadow-lg"
    >
        <CheckCircle class="w-5 h-5" />
        <span class="text-sm font-medium">{form.message || 'Berhasil!'}</span>
    </div>
{/if}

{#if form?.error}
    <div 
        transition:fly={{ y: 50, duration: 300 }}
        class="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 
               bg-red-600 text-white rounded-xl shadow-lg"
    >
        <AlertCircle class="w-5 h-5" />
        <span class="text-sm font-medium">{form.error}</span>
    </div>
{/if}