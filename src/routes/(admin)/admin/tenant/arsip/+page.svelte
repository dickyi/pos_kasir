<script>
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { enhance } from '$app/forms';
    import { 
        Archive, ArrowLeft, Search, RefreshCw, Trash2, RotateCcw,
        Building2, Mail, Phone, Calendar, AlertTriangle, X,
        ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
        CheckCircle2, XCircle, Eye, Clock
    } from 'lucide-svelte';
    
    // Shared Components
    import Toast from '$lib/components/admin/shared/Toast.svelte';
    
    export let data = {};
    export let form;
    
    // Data
    $: archivedTenants = data?.tenants ?? [];
    $: pagination = data?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 };
    
    // State
    let searchQuery = '';
    let showRestoreModal = false;
    let showDeleteModal = false;
    let showDetailModal = false;
    let selectedTenant = null;
    
    // Toast
    let showToast = false;
    let toastMessage = '';
    let toastType = 'success';
    
    // Initialize
    onMount(() => {
        if (browser) {
            searchQuery = $page.url.searchParams.get('search') || '';
        }
    });
    
    // ============================================
    // FUNCTIONS
    // ============================================
    
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
    
    function formatDateTime(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    function formatNumber(num) {
        return (Number(num) || 0).toLocaleString('id-ID');
    }
    
    function formatRupiah(num) {
        const n = Number(num) || 0;
        if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(1) + ' Jt';
        if (n >= 1000) return 'Rp ' + (n / 1000).toFixed(0) + ' rb';
        return 'Rp ' + n.toLocaleString('id-ID');
    }
    
    function applySearch() {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        params.set('page', '1');
        goto(`?${params.toString()}`);
    }
    
    function changePage(newPage) {
        const params = new URLSearchParams($page.url.searchParams);
        params.set('page', newPage.toString());
        goto(`?${params.toString()}`);
    }
    
    function openRestoreModal(tenant) {
        selectedTenant = tenant;
        showRestoreModal = true;
    }
    
    function openDeleteModal(tenant) {
        selectedTenant = tenant;
        showDeleteModal = true;
    }
    
    function openDetailModal(tenant) {
        selectedTenant = tenant;
        showDetailModal = true;
    }
    
    function closeModals() {
        showRestoreModal = false;
        showDeleteModal = false;
        showDetailModal = false;
        selectedTenant = null;
    }
    
    function showToastMessage(message, type = 'success') {
        toastMessage = message;
        toastType = type;
        showToast = true;
        setTimeout(() => showToast = false, 3000);
    }
    
    // Handle form result
    $: if (form) {
        if (form.success) {
            showToastMessage(form.message, 'success');
            closeModals();
        } else if (form.message) {
            showToastMessage(form.message, 'error');
        }
    }
</script>

<svelte:head>
    <title>Arsip Tenant - Super Admin</title>
</svelte:head>

<!-- Toast -->
{#if showToast}
    <Toast message={toastMessage} type={toastType} />
{/if}

<div class="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
    
    <!-- ============================================ -->
    <!-- HEADER -->
    <!-- ============================================ -->
    <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
            <a href="/admin/tenant" class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2">
                <ArrowLeft size={16} />
                Kembali ke Kelola Tenant
            </a>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Archive size={28} class="text-gray-400" />
                Arsip Tenant
            </h1>
            <p class="text-sm text-gray-500 mt-1">
                Tenant yang diarsipkan ({pagination.total} data)
            </p>
        </div>
    </header>

    <!-- ============================================ -->
    <!-- INFO BOX -->
    <!-- ============================================ -->
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Archive size={20} class="text-blue-600" />
        </div>
        <div>
            <p class="font-medium text-blue-900">Tentang Arsip Tenant</p>
            <p class="text-sm text-blue-700 mt-1">
                Tenant yang diarsipkan adalah tenant yang dihapus tetapi masih memiliki data transaksi. 
                Anda dapat <strong>merestore</strong> tenant ke status aktif atau <strong>menghapus permanen</strong> jika sudah tidak diperlukan.
            </p>
        </div>
    </div>

    <!-- ============================================ -->
    <!-- SEARCH -->
    <!-- ============================================ -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex gap-3">
            <div class="flex-1 relative">
                <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Cari nama bisnis, pemilik, email..."
                    bind:value={searchQuery}
                    on:keydown={(e) => e.key === 'Enter' && applySearch()}
                    class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm 
                           focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
            </div>
            <button
                on:click={applySearch}
                class="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
                Cari
            </button>
        </div>
    </div>

    <!-- ============================================ -->
    <!-- TABLE -->
    <!-- ============================================ -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tenant</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Kontak</th>
                        <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Transaksi</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Diarsipkan</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">Alasan</th>
                        <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    {#if archivedTenants.length > 0}
                        {#each archivedTenants as tenant (tenant.id)}
                            <tr class="hover:bg-gray-50 transition-colors">
                                <!-- Tenant Info -->
                                <td class="px-4 py-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm">
                                            {(tenant.nama_bisnis || 'T').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p class="font-semibold text-gray-900">{tenant.nama_bisnis || '-'}</p>
                                            <p class="text-sm text-gray-500">{tenant.nama_pemilik || '-'}</p>
                                            <p class="text-xs text-gray-400 font-mono">{tenant.kode_pelanggan}</p>
                                        </div>
                                    </div>
                                </td>
                                
                                <!-- Kontak -->
                                <td class="px-4 py-4 hidden md:table-cell">
                                    <div class="space-y-1 text-sm text-gray-600">
                                        {#if tenant.email}
                                            <p class="flex items-center gap-1.5">
                                                <Mail size={12} class="text-gray-400" />
                                                {tenant.email}
                                            </p>
                                        {/if}
                                        {#if tenant.no_telepon}
                                            <p class="flex items-center gap-1.5">
                                                <Phone size={12} class="text-gray-400" />
                                                {tenant.no_telepon}
                                            </p>
                                        {/if}
                                    </div>
                                </td>
                                
                                <!-- Transaksi -->
                                <td class="px-4 py-4 text-center hidden lg:table-cell">
                                    <p class="font-semibold text-gray-900">{formatNumber(tenant.total_transaksi || 0)}</p>
                                    <p class="text-xs text-emerald-600">{formatRupiah(tenant.total_gmv || 0)}</p>
                                </td>
                                
                                <!-- Tanggal Arsip -->
                                <td class="px-4 py-4 hidden lg:table-cell">
                                    <p class="text-sm text-gray-600">{formatDateTime(tenant.archived_at)}</p>
                                </td>
                                
                                <!-- Alasan -->
                                <td class="px-4 py-4 hidden xl:table-cell">
                                    <p class="text-sm text-gray-600 max-w-[200px] truncate" title={tenant.archive_reason || '-'}>
                                        {tenant.archive_reason || '-'}
                                    </p>
                                </td>
                                
                                <!-- Aksi -->
                                <td class="px-4 py-4">
                                    <div class="flex items-center justify-center gap-1">
                                        <button 
                                            on:click={() => openDetailModal(tenant)}
                                            class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                                            title="Lihat Detail"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button 
                                            on:click={() => openRestoreModal(tenant)}
                                            class="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600"
                                            title="Restore"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                        <button 
                                            on:click={() => openDeleteModal(tenant)}
                                            class="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                                            title="Hapus Permanen"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    {:else}
                        <tr>
                            <td colspan="6" class="px-4 py-16 text-center">
                                <Archive size={48} class="mx-auto mb-4 text-gray-300" />
                                <p class="text-gray-500 font-medium">Tidak ada tenant diarsipkan</p>
                                <p class="text-sm text-gray-400 mt-1">Tenant yang dihapus akan muncul di sini</p>
                            </td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        </div>
        
        <!-- Pagination -->
        {#if pagination.totalPages > 1}
            <div class="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p class="text-sm text-gray-500">
                    Menampilkan {(pagination.page - 1) * pagination.limit + 1} - 
                    {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total}
                </p>
                <div class="flex items-center gap-1">
                    <button on:click={() => changePage(1)} disabled={pagination.page === 1}
                        class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50">
                        <ChevronsLeft size={16} />
                    </button>
                    <button on:click={() => changePage(pagination.page - 1)} disabled={pagination.page === 1}
                        class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50">
                        <ChevronLeft size={16} />
                    </button>
                    <span class="px-3 py-1 text-sm">{pagination.page} / {pagination.totalPages}</span>
                    <button on:click={() => changePage(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                        class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50">
                        <ChevronRight size={16} />
                    </button>
                    <button on:click={() => changePage(pagination.totalPages)} disabled={pagination.page === pagination.totalPages}
                        class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50">
                        <ChevronsRight size={16} />
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>

<!-- ============================================ -->
<!-- MODAL: RESTORE -->
<!-- ============================================ -->
{#if showRestoreModal && selectedTenant}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black/50" on:click={closeModals}></div>
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <RotateCcw size={20} class="text-emerald-500" />
                        Restore Tenant
                    </h3>
                    <button on:click={closeModals} class="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} class="text-gray-500" />
                    </button>
                </div>
                
                <div class="p-6">
                    <p class="text-gray-700">
                        Restore tenant <strong>"{selectedTenant.nama_bisnis}"</strong> dari arsip?
                    </p>
                    <p class="text-sm text-gray-500 mt-2">
                        Tenant akan dikembalikan ke status <strong>Aktif</strong> dan dapat digunakan kembali.
                    </p>
                    
                    <div class="bg-gray-50 rounded-lg p-4 mt-4 space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-500">Kode</span>
                            <span class="font-mono text-gray-900">{selectedTenant.kode_pelanggan}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">Total Transaksi</span>
                            <span class="text-gray-900">{formatNumber(selectedTenant.total_transaksi || 0)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">Diarsipkan</span>
                            <span class="text-gray-900">{formatDateTime(selectedTenant.archived_at)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                    <button on:click={closeModals}
                        class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                        Batal
                    </button>
                    <form method="POST" action="?/restore" use:enhance={() => {
                        return async ({ result, update }) => {
                            if (result.type === 'success' && result.data?.success) closeModals();
                            await update();
                        };
                    }}>
                        <input type="hidden" name="id" value={selectedTenant.id} />
                        <button type="submit"
                            class="px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-2">
                            <RotateCcw size={16} />
                            Ya, Restore
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
{/if}

<!-- ============================================ -->
<!-- MODAL: DELETE PERMANENT -->
<!-- ============================================ -->
{#if showDeleteModal && selectedTenant}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black/50" on:click={closeModals}></div>
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <AlertTriangle size={20} class="text-red-500" />
                        Hapus Permanen
                    </h3>
                    <button on:click={closeModals} class="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} class="text-gray-500" />
                    </button>
                </div>
                
                <div class="p-6">
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p class="text-sm text-red-800 font-medium">⚠️ Peringatan!</p>
                        <p class="text-sm text-red-700 mt-1">
                            Tindakan ini akan menghapus semua data tenant secara permanen termasuk:
                        </p>
                        <ul class="text-sm text-red-700 mt-2 list-disc list-inside">
                            <li>Data tenant</li>
                            <li>Semua produk ({formatNumber(selectedTenant.total_produk || 0)})</li>
                            <li>Riwayat transaksi ({formatNumber(selectedTenant.total_transaksi || 0)})</li>
                            <li>User terkait</li>
                        </ul>
                    </div>
                    
                    <p class="text-gray-700">
                        Hapus permanen <strong>"{selectedTenant.nama_bisnis}"</strong>?
                    </p>
                </div>
                
                <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                    <button on:click={closeModals}
                        class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                        Batal
                    </button>
                    <form method="POST" action="?/deletePermanent" use:enhance={() => {
                        return async ({ result, update }) => {
                            if (result.type === 'success' && result.data?.success) closeModals();
                            await update();
                        };
                    }}>
                        <input type="hidden" name="id" value={selectedTenant.id} />
                        <button type="submit"
                            class="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2">
                            <Trash2 size={16} />
                            Ya, Hapus Permanen
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
{/if}

<!-- ============================================ -->
<!-- MODAL: DETAIL -->
<!-- ============================================ -->
{#if showDetailModal && selectedTenant}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black/50" on:click={closeModals}></div>
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900">Detail Tenant (Arsip)</h3>
                    <button on:click={closeModals} class="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} class="text-gray-500" />
                    </button>
                </div>
                
                <div class="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                    <!-- Header -->
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl">
                            {(selectedTenant.nama_bisnis || 'T').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-900 text-lg">{selectedTenant.nama_bisnis}</h4>
                            <p class="text-gray-500">{selectedTenant.nama_pemilik}</p>
                            <p class="text-xs font-mono text-gray-400 mt-1">{selectedTenant.kode_pelanggan}</p>
                        </div>
                    </div>
                    
                    <!-- Info -->
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-gray-500">Email</p>
                            <p class="text-gray-900">{selectedTenant.email || '-'}</p>
                        </div>
                        <div>
                            <p class="text-gray-500">Telepon</p>
                            <p class="text-gray-900">{selectedTenant.no_telepon || '-'}</p>
                        </div>
                        <div>
                            <p class="text-gray-500">Jenis Usaha</p>
                            <p class="text-gray-900">{selectedTenant.jenis_usaha || '-'}</p>
                        </div>
                        <div>
                            <p class="text-gray-500">Terdaftar</p>
                            <p class="text-gray-900">{formatDate(selectedTenant.created_at)}</p>
                        </div>
                    </div>
                    
                    <!-- Stats -->
                    <div class="grid grid-cols-3 gap-3">
                        <div class="bg-gray-50 rounded-lg p-3 text-center">
                            <p class="text-xl font-bold text-gray-900">{formatNumber(selectedTenant.total_produk || 0)}</p>
                            <p class="text-xs text-gray-500">Produk</p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-3 text-center">
                            <p class="text-xl font-bold text-gray-900">{formatNumber(selectedTenant.total_transaksi || 0)}</p>
                            <p class="text-xs text-gray-500">Transaksi</p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-3 text-center">
                            <p class="text-xl font-bold text-emerald-600">{formatRupiah(selectedTenant.total_gmv || 0)}</p>
                            <p class="text-xs text-gray-500">GMV</p>
                        </div>
                    </div>
                    
                    <!-- Archive Info -->
                    <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p class="font-medium text-amber-900 flex items-center gap-2">
                            <Archive size={16} />
                            Info Arsip
                        </p>
                        <div class="mt-2 space-y-1 text-sm">
                            <p class="text-amber-700">
                                <span class="text-amber-600">Diarsipkan:</span> {formatDateTime(selectedTenant.archived_at)}
                            </p>
                            <p class="text-amber-700">
                                <span class="text-amber-600">Alasan:</span> {selectedTenant.archive_reason || 'Tidak ada alasan'}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                    <button on:click={() => { closeModals(); openRestoreModal(selectedTenant); }}
                        class="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 flex items-center gap-2">
                        <RotateCcw size={16} />
                        Restore
                    </button>
                    <button on:click={closeModals}
                        class="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}