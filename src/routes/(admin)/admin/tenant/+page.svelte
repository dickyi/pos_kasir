<script>
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { Plus, Download, Building2, Archive, SlidersHorizontal, X, Search, RotateCcw } from 'lucide-svelte';
    
    // Import Tenant Components
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
    
    // Mobile filter drawer
    let showMobileFilter = false;
    
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
    
    // Computed
    $: hasActiveFilters = searchQuery || statusFilter || sortBy !== 'created_at' || sortOrder !== 'desc';
    $: activeFilterCount = [searchQuery, statusFilter, sortBy !== 'created_at', sortOrder !== 'desc'].filter(Boolean).length;
    
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
        showMobileFilter = false;
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
        showMobileFilter = false;
        goto('/admin/tenant');
    }

    // ============================================
    // QUICK SEARCH (mobile inline)
    // ============================================
    let searchTimeout;
    function handleSearchInput(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyFilters();
        }, 500);
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

<div class="min-h-screen bg-gray-50/50">
    <div class="px-4 py-4 sm:px-6 sm:py-6 max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
        
        <!-- ============================================ -->
        <!-- HEADER - Mobile optimized -->
        <!-- ============================================ -->
        <header class="space-y-3">
            <!-- Title row -->
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                    <h1 class="text-xl sm:text-2xl font-bold text-gray-900 truncate">Kelola Tenant</h1>
                    <p class="text-xs sm:text-sm text-gray-500 mt-0.5">
                        Kelola semua UMKM/toko yang menggunakan platform
                    </p>
                </div>
                
                <!-- Desktop actions -->
                <div class="hidden sm:flex items-center gap-2">
                    {#if stats.arsip > 0}
                        <a 
                            href="/admin/tenant/arsip"
                            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 
                                   bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                            <Archive size={16} />
                            <span>Arsip</span>
                            <span class="px-1.5 py-0.5 text-xs bg-amber-200 text-amber-800 rounded-full">{stats.arsip}</span>
                        </a>
                    {/if}
                    <button 
                        class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 
                               bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Download size={16} />
                        <span>Export</span>
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
            </div>

            <!-- Mobile action buttons -->
            <div class="flex sm:hidden items-center gap-2">
                <button 
                    on:click={openAddModal}
                    class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium 
                           text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Plus size={16} />
                    Tambah Tenant
                </button>

                <div class="flex items-center gap-2">
                    {#if stats.arsip > 0}
                        <a 
                            href="/admin/tenant/arsip"
                            class="relative inline-flex items-center justify-center w-10 h-10 text-amber-700 
                                   bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                            <Archive size={18} />
                            <span class="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center 
                                         text-[10px] font-bold bg-amber-500 text-white rounded-full">
                                {stats.arsip}
                            </span>
                        </a>
                    {/if}
                    <button 
                        class="inline-flex items-center justify-center w-10 h-10 text-gray-600 
                               bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Download size={18} />
                    </button>
                </div>
            </div>
        </header>

        <!-- ============================================ -->
        <!-- STATS CARDS - Horizontal scroll on mobile -->
        <!-- ============================================ -->
        <div class="-mx-4 px-4 sm:mx-0 sm:px-0">
            <TenantStats 
                {stats} 
                activeFilter={statusFilter} 
                onFilterChange={handleFilterChange} 
            />
        </div>

        <!-- ============================================ -->
        <!-- SEARCH BAR - Always visible, inline on mobile -->
        <!-- ============================================ -->
        <div class="flex items-center gap-2">
            <!-- Search input -->
            <div class="flex-1 relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input 
                    type="text"
                    bind:value={searchQuery}
                    on:input={handleSearchInput}
                    on:keydown={(e) => e.key === 'Enter' && applyFilters()}
                    placeholder="Cari nama bisnis, email, atau kode..."
                    class="w-full h-10 sm:h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm
                           placeholder:text-gray-400 focus:outline-none focus:border-gray-400 
                           focus:ring-2 focus:ring-gray-200 transition-all"
                />
                {#if searchQuery}
                    <button 
                        on:click={() => { searchQuery = ''; applyFilters(); }}
                        class="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 
                               hover:text-gray-600 transition-colors"
                    >
                        <X size={14} />
                    </button>
                {/if}
            </div>

            <!-- Filter button (mobile: icon only, desktop: with text) -->
            <button 
                on:click={() => showMobileFilter = !showMobileFilter}
                class="relative inline-flex items-center justify-center gap-2 h-10 sm:h-11 px-3 sm:px-4
                       text-sm font-medium bg-white border border-gray-200 rounded-lg 
                       hover:bg-gray-50 transition-colors
                       {hasActiveFilters ? 'text-gray-900 border-gray-400' : 'text-gray-600'}"
            >
                <SlidersHorizontal size={16} />
                <span class="hidden sm:inline">Filter</span>
                {#if activeFilterCount > 0}
                    <span class="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center 
                                 text-[10px] font-bold bg-gray-900 text-white rounded-full">
                        {activeFilterCount}
                    </span>
                {/if}
            </button>

            <!-- Reset button (show only when filters active) -->
            {#if hasActiveFilters}
                <button 
                    on:click={resetFilters}
                    class="inline-flex items-center justify-center h-10 sm:h-11 px-3
                           text-sm font-medium text-red-600 bg-red-50 border border-red-200 
                           rounded-lg hover:bg-red-100 transition-colors"
                    title="Reset semua filter"
                >
                    <RotateCcw size={16} />
                </button>
            {/if}
        </div>

        <!-- ============================================ -->
        <!-- EXPANDABLE FILTER PANEL -->
        <!-- ============================================ -->
        {#if showMobileFilter}
            <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-4 
                        shadow-sm animate-in slide-in-from-top duration-200">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-gray-800">Filter & Sortir</h3>
                    <button 
                        on:click={() => showMobileFilter = false}
                        class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
                
                <TenantFilter 
                    bind:searchQuery
                    bind:statusFilter
                    bind:sortBy
                    bind:sortOrder
                    onSearch={applyFilters}
                    onReset={resetFilters}
                />
            </div>
        {/if}

        <!-- ============================================ -->
        <!-- RESULT INFO (mobile) -->
        <!-- ============================================ -->
        <div class="flex items-center justify-between text-xs sm:text-sm text-gray-500">
            <span>
                {#if pagination.total > 0}
                    Menampilkan {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} tenant
                {:else}
                    Tidak ada data
                {/if}
            </span>
            {#if statusFilter}
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                    Status: {statusFilter}
                    <button on:click={() => handleFilterChange('')} class="ml-0.5 text-gray-400 hover:text-gray-600">
                        <X size={12} />
                    </button>
                </span>
            {/if}
        </div>

        <!-- ============================================ -->
        <!-- TABLE / CARD LIST -->
        <!-- ============================================ -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <!-- Desktop: Table view -->
            <div class="hidden md:block">
                <TenantTable 
                    {tenants}
                    {sortBy}
                    onSort={handleSort}
                    onView={openDetailModal}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                />
            </div>

            <!-- Mobile: Card view -->
            <div class="md:hidden divide-y divide-gray-100">
                {#if tenants.length === 0}
                    <div class="px-4 py-12 text-center">
                        <Building2 class="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p class="text-sm text-gray-500">Tidak ada tenant ditemukan</p>
                        {#if hasActiveFilters}
                            <button 
                                on:click={resetFilters}
                                class="mt-2 text-sm text-gray-900 font-medium hover:underline"
                            >
                                Reset filter
                            </button>
                        {/if}
                    </div>
                {:else}
                    {#each tenants as tenant}
                        <button 
                            on:click={() => openDetailModal(tenant)}
                            class="w-full text-left px-4 py-3.5 hover:bg-gray-50 
                                   active:bg-gray-100 transition-colors"
                        >
                            <div class="flex items-start gap-3">
                                <!-- Avatar / Initial -->
                                <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold
                                            {tenant.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' :
                                             tenant.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                             tenant.status === 'nonaktif' ? 'bg-red-100 text-red-700' :
                                             'bg-gray-100 text-gray-700'}">
                                    {(tenant.nama_bisnis || 'T').charAt(0).toUpperCase()}
                                </div>

                                <!-- Info -->
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <h3 class="text-sm font-semibold text-gray-900 truncate">
                                            {tenant.nama_bisnis || 'Tanpa Nama'}
                                        </h3>
                                        <!-- Status badge -->
                                        <span class="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 
                                                      rounded text-[10px] font-semibold uppercase tracking-wider
                                                      {tenant.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' :
                                                       tenant.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                       tenant.status === 'nonaktif' ? 'bg-red-100 text-red-700' :
                                                       'bg-gray-100 text-gray-600'}">
                                            {tenant.status}
                                        </span>
                                    </div>
                                    
                                    <p class="text-xs text-gray-500 truncate mt-0.5">
                                        {tenant.email || '-'}
                                    </p>

                                    <!-- Meta info row -->
                                    <div class="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                                        {#if tenant.kode_pelanggan}
                                            <span class="font-mono">{tenant.kode_pelanggan}</span>
                                        {/if}
                                        {#if tenant.no_hp}
                                            <span>{tenant.no_hp}</span>
                                        {/if}
                                        {#if tenant.created_at}
                                            <span>
                                                {new Date(tenant.created_at).toLocaleDateString('id-ID', { 
                                                    day: 'numeric', month: 'short', year: '2-digit' 
                                                })}
                                            </span>
                                        {/if}
                                    </div>
                                </div>

                                <!-- Arrow indicator -->
                                <svg class="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    {/each}
                {/if}
            </div>

            <!-- Pagination -->
            <TenantPagination 
                {pagination}
                onPageChange={handlePageChange}
            />
        </div>
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

<style>
    /* Smooth animation for filter panel */
    @keyframes slide-in-from-top {
        from {
            opacity: 0;
            transform: translateY(-8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .animate-in {
        animation: slide-in-from-top 0.2s ease-out;
    }
</style>