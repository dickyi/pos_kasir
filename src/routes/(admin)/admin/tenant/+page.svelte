<script>
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { Plus, Download, Building2, Archive } from 'lucide-svelte';
    
    // Import Tenant Components (dari src/lib/components/)
    import TenantStats from '$lib/components/admin/tenant/TenantStats.svelte';
    import TenantFilter from '$lib/components/admin/tenant/TenantFilter.svelte';
    import TenantTable from '$lib/components/admin/tenant/TenantTable.svelte';
    import TenantForm from '$lib/components/admin/tenant/TenantForm.svelte';
    import TenantDetail from '$lib/components/admin/tenant/TenantDetail.svelte';
    import TenantPagination from '$lib/components/admin/tenant/TenantPagination.svelte';
    import TenantDeleteConfirm from '$lib/components/admin/tenant/TenantDeleteConfirm.svelte';
    
    // Shared Components
    import Toast from '$lib/components/admin/shared/Toast.svelte';
    
    export let data = {};
    export let form;
    
    // Data dengan default values
    $: tenants = data?.tenants ?? [];
    $: pagination = data?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 };
    $: stats = data?.stats ?? { total: 0, aktif: 0, pending: 0, nonaktif: 0, arsip: 0 };
    
    // Filter State
    let searchQuery = '';
    let statusFilter = '';
    let sortBy = 'created_at';
    let sortOrder = 'desc';
    
    // Modal State
    let showAddModal = false;
    let showEditModal = false;
    let showDetailModal = false;
    let showDeleteModal = false;
    let selectedTenant = null;
    
    // Toast State
    let showToast = false;
    let toastMessage = '';
    let toastType = 'success';
    
    // Initialize filters dari URL
    onMount(() => {
        if (browser) {
            const params = $page.url.searchParams;
            searchQuery = params.get('search') || '';
            statusFilter = params.get('status') || '';
            sortBy = params.get('sort') || 'created_at';
            sortOrder = params.get('order') || 'desc';
        }
    });
    
    // ============================================
    // NAVIGATION FUNCTIONS
    // ============================================
    
    function applyFilters() {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (statusFilter) params.set('status', statusFilter);
        if (sortBy !== 'created_at') params.set('sort', sortBy);
        if (sortOrder !== 'desc') params.set('order', sortOrder);
        params.set('page', '1');
        goto(`?${params.toString()}`);
    }
    
    function handleFilterChange(status) {
        statusFilter = status;
        applyFilters();
    }
    
    function handleSort(column) {
        if (sortBy === column) {
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            sortBy = column;
            sortOrder = 'desc';
        }
        applyFilters();
    }
    
    function handlePageChange(newPage) {
        const params = new URLSearchParams($page.url.searchParams);
        params.set('page', newPage.toString());
        goto(`?${params.toString()}`);
    }
    
    function resetFilters() {
        searchQuery = '';
        statusFilter = '';
        sortBy = 'created_at';
        sortOrder = 'desc';
        goto('/admin/tenant');
    }
    
    // ============================================
    // MODAL FUNCTIONS
    // ============================================
    
    function openAddModal() {
        selectedTenant = null;
        showAddModal = true;
    }
    
    function openEditModal(tenant) {
        selectedTenant = tenant;
        showEditModal = true;
    }
    
    function openDetailModal(tenant) {
        selectedTenant = tenant;
        showDetailModal = true;
    }
    
    function openDeleteModal(tenant) {
        selectedTenant = tenant;
        showDeleteModal = true;
    }
    
    function closeModals() {
        showAddModal = false;
        showEditModal = false;
        showDetailModal = false;
        showDeleteModal = false;
        selectedTenant = null;
    }
    
    // ============================================
    // TOAST FUNCTION
    // ============================================
    
    function showToastMessage(message, type = 'success') {
        toastMessage = message;
        toastType = type;
        showToast = true;
        setTimeout(() => showToast = false, 3000);
    }
    
    // Handle form results
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
    <title>Kelola Tenant - Super Admin</title>
</svelte:head>

<!-- Toast Notification -->
{#if showToast}
    <Toast message={toastMessage} type={toastType} />
{/if}

<div class="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
    
    <!-- ============================================ -->
    <!-- HEADER -->
    <!-- ============================================ -->
    <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Kelola Tenant</h1>
            <p class="text-sm text-gray-500 mt-1">Kelola semua UMKM/toko yang menggunakan platform</p>
        </div>
        <div class="flex items-center gap-3">
            {#if stats.arsip > 0}
                <a 
                    href="/admin/tenant/arsip"
                    class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 
                           bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                >
                    <Archive size={16} />
                    <span class="hidden sm:inline">Arsip</span>
                    <span class="px-1.5 py-0.5 text-xs bg-amber-200 text-amber-800 rounded-full">{stats.arsip}</span>
                </a>
            {/if}
            <button 
                class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 
                       bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <Download size={16} />
                <span class="hidden sm:inline">Export</span>
            </button>
            <button 
                on:click={openAddModal}
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white 
                       bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
                <Plus size={16} />
                Tambah Tenant
            </button>
        </div>
    </header>

    <!-- ============================================ -->
    <!-- STATS CARDS -->
    <!-- ============================================ -->
    <TenantStats 
        {stats} 
        activeFilter={statusFilter} 
        onFilterChange={handleFilterChange} 
    />

    <!-- ============================================ -->
    <!-- FILTER & SEARCH -->
    <!-- ============================================ -->
    <TenantFilter 
        bind:searchQuery
        bind:statusFilter
        bind:sortBy
        bind:sortOrder
        onSearch={applyFilters}
        onReset={resetFilters}
    />

    <!-- ============================================ -->
    <!-- TABLE -->
    <!-- ============================================ -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <TenantTable 
            {tenants}
            {sortBy}
            onSort={handleSort}
            onView={openDetailModal}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
        />
        
        <!-- Pagination -->
        <TenantPagination 
            {pagination}
            onPageChange={handlePageChange}
        />
    </div>
</div>

<!-- ============================================ -->
<!-- MODALS -->
<!-- ============================================ -->

<!-- Add Modal -->
<TenantForm 
    mode="add"
    show={showAddModal}
    onClose={closeModals}
/>

<!-- Edit Modal -->
<TenantForm 
    mode="edit"
    tenant={selectedTenant}
    show={showEditModal}
    onClose={closeModals}
/>

<!-- Detail Modal -->
<TenantDetail 
    tenant={selectedTenant}
    show={showDetailModal}
    onClose={closeModals}
    onEdit={openEditModal}
/>

<!-- Delete Confirmation Modal -->
<TenantDeleteConfirm 
    tenant={selectedTenant}
    show={showDeleteModal}
    onClose={closeModals}
/>