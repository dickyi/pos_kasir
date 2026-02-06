<script>
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { 
        Users, Plus, Search, RefreshCw,
        ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
    } from 'lucide-svelte';
    
    // Import Components
    import AdminStatsCard from '$lib/components/admin/admin-team/AdminStatsCard.svelte';
    import AdminTable from '$lib/components/admin/admin-team/AdminTable.svelte';
    import AdminForm from '$lib/components/admin/admin-team/AdminForm.svelte';
    import AdminDetail from '$lib/components/admin/admin-team/AdminDetail.svelte';
    import AdminDeleteConfirm from '$lib/components/admin/admin-team/AdminDeleteConfirm.svelte';
    import ResetPasswordModal from '$lib/components/admin/admin-team/ResetPasswordModal.svelte';
    import AdminActivityLog from '$lib/components/admin/admin-team/AdminActivityLog.svelte';
    import Toast from '$lib/components/admin/shared/Toast.svelte';
    
    export let data;
    export let form;
    
    // Data
    $: stats = data?.stats ?? {};
    $: admins = data?.admins ?? [];
    $: activities = data?.activities ?? [];
    $: pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 };
    
    // State
    let searchQuery = '';
    let statusFilter = '';
    let roleFilter = '';
    let isLoading = false;
    
    // Modal states
    let showFormModal = false;
    let formMode = 'add';
    let showDetailModal = false;
    let showDeleteModal = false;
    let showResetPasswordModal = false;
    let selectedAdmin = null;
    
    // Toast
    let showToast = false;
    let toastMessage = '';
    let toastType = 'success';
    
    // React to form result
    $: if (form?.success) {
        showToastMessage(form.message || 'Operasi berhasil');
        closeAllModals();
    } else if (form?.error) {
        showToastMessage(form.message || 'Terjadi kesalahan', 'error');
    }
    
    // Initialize
    onMount(() => {
        if (browser) {
            const params = $page.url.searchParams;
            searchQuery = params.get('search') || '';
            statusFilter = params.get('status') || '';
            roleFilter = params.get('role') || '';
        }
    });
    
    // Functions
    function applyFilters() {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (statusFilter) params.set('status', statusFilter);
        if (roleFilter) params.set('role', roleFilter);
        params.set('page', '1');
        goto(`?${params.toString()}`);
    }
    
    function handleFilterChange(filter) {
        if (filter === 'online') {
            const params = new URLSearchParams();
            params.set('online', 'true');
            goto(`?${params.toString()}`);
        } else if (filter === 'super_admin') {
            roleFilter = filter;
            statusFilter = '';
            applyFilters();
        } else if (filter === 'aktif' || filter === 'nonaktif') {
            statusFilter = filter;
            roleFilter = '';
            applyFilters();
        } else {
            searchQuery = '';
            statusFilter = '';
            roleFilter = '';
            goto('?');
        }
    }
    
    function changePage(newPage) {
        const params = new URLSearchParams($page.url.searchParams);
        params.set('page', newPage.toString());
        goto(`?${params.toString()}`);
    }
    
    function openAddModal() {
        formMode = 'add';
        selectedAdmin = null;
        showFormModal = true;
    }
    
    function openEditModal(admin) {
        formMode = 'edit';
        selectedAdmin = admin;
        showFormModal = true;
    }
    
    function openDetailModal(admin) {
        selectedAdmin = admin;
        showDetailModal = true;
    }
    
    function openDeleteModal(admin) {
        selectedAdmin = admin;
        showDeleteModal = true;
    }
    
    function openResetPasswordModal(admin) {
        selectedAdmin = admin;
        showResetPasswordModal = true;
    }
    
    function closeAllModals() {
        showFormModal = false;
        showDetailModal = false;
        showDeleteModal = false;
        showResetPasswordModal = false;
        selectedAdmin = null;
    }
    
    async function handleToggleStatus(admin) {
        const formData = new FormData();
        formData.set('id', admin.id);
        formData.set('status', admin.status === 'aktif' ? 'nonaktif' : 'aktif');
        
        const response = await fetch('?/toggleStatus', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            showToastMessage(`Admin ${admin.status === 'aktif' ? 'dinonaktifkan' : 'diaktifkan'}`);
            goto($page.url.pathname + $page.url.search, { invalidateAll: true });
        }
    }
    
    async function handleLogoutAll(admin) {
        const formData = new FormData();
        formData.set('id', admin.id);
        
        const response = await fetch('?/logoutAll', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            showToastMessage(`${admin.nama} telah di-logout dari semua device`);
        }
    }
    
    function showToastMessage(message, type = 'success') {
        toastMessage = message;
        toastType = type;
        showToast = true;
        setTimeout(() => showToast = false, 3000);
    }
    
    function refreshData() {
        isLoading = true;
        goto($page.url.pathname + $page.url.search, { invalidateAll: true })
            .finally(() => {
                isLoading = false;
                showToastMessage('Data berhasil diperbarui');
            });
    }
</script>

<svelte:head>
    <title>Tim Admin - Super Admin</title>
</svelte:head>

{#if showToast}
    <Toast message={toastMessage} type={toastType} />
{/if}

<div class="p-4 sm:p-6 max-w-[1800px] mx-auto space-y-6">
    
    <!-- HEADER -->
    <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Users size={28} class="text-gray-400" />
                Tim Admin
            </h1>
            <p class="text-sm text-gray-500 mt-1">Kelola administrator dan hak akses platform</p>
        </div>
        <div class="flex items-center gap-3">
            <button 
                on:click={refreshData}
                disabled={isLoading}
                class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 
                       bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors
                       disabled:opacity-50"
            >
                <RefreshCw size={16} class={isLoading ? 'animate-spin' : ''} />
            </button>
            <button 
                on:click={openAddModal}
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white 
                       bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
                <Plus size={16} />
                Tambah Admin
            </button>
        </div>
    </header>

    <!-- STATS -->
    <AdminStatsCard 
        {stats}
        activeFilter={statusFilter || roleFilter || ($page.url.searchParams.get('online') ? 'online' : '')}
        onFilterChange={handleFilterChange}
    />

    <!-- MAIN CONTENT -->
    <div class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
            <!-- Search & Filter -->
            <div class="bg-white rounded-xl border border-gray-200 p-4">
                <div class="flex flex-col sm:flex-row gap-4">
                    <div class="flex-1 relative">
                        <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari admin..."
                            bind:value={searchQuery}
                            on:keydown={(e) => e.key === 'Enter' && applyFilters()}
                            class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm 
                                   focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                    </div>
                    <div class="flex items-center gap-2">
                        <select
                            bind:value={roleFilter}
                            on:change={applyFilters}
                            class="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white 
                                   focus:outline-none focus:ring-2 focus:ring-gray-900"
                        >
                            <option value="">Semua Role</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="admin">Admin</option>
                            <option value="support">Support</option>
                        </select>
                        <button
                            on:click={applyFilters}
                            class="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
                        >
                            Cari
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Table -->
            <AdminTable 
                {admins}
                onView={openDetailModal}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
                onResetPassword={openResetPasswordModal}
                onToggleStatus={handleToggleStatus}
                onLogoutAll={handleLogoutAll}
            />
            
            <!-- Pagination -->
            {#if pagination.totalPages > 1}
                <div class="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p class="text-sm text-gray-500">
                        Menampilkan {(pagination.page - 1) * pagination.limit + 1} - 
                        {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} admin
                    </p>
                    <div class="flex items-center gap-1">
                        <button on:click={() => changePage(1)} disabled={pagination.page === 1}
                            class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronsLeft size={16} />
                        </button>
                        <button on:click={() => changePage(pagination.page - 1)} disabled={pagination.page === 1}
                            class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronLeft size={16} />
                        </button>
                        
                        {#each Array(Math.min(5, pagination.totalPages)) as _, i}
                            {@const pageNum = pagination.page <= 3 ? i + 1 : pagination.page + i - 2}
                            {#if pageNum > 0 && pageNum <= pagination.totalPages}
                                <button
                                    on:click={() => changePage(pageNum)}
                                    class="w-9 h-9 rounded-lg text-sm font-medium transition-colors
                                           {pageNum === pagination.page ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}"
                                >
                                    {pageNum}
                                </button>
                            {/if}
                        {/each}
                        
                        <button on:click={() => changePage(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                            class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronRight size={16} />
                        </button>
                        <button on:click={() => changePage(pagination.totalPages)} disabled={pagination.page === pagination.totalPages}
                            class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            {/if}
        </div>
        
        <!-- Activity Log -->
        <div>
            <AdminActivityLog {activities} />
        </div>
    </div>
</div>

<!-- Modals -->
<AdminForm 
    mode={formMode}
    admin={selectedAdmin}
    show={showFormModal}
    onClose={() => showFormModal = false}
/>

<AdminDetail 
    admin={selectedAdmin}
    show={showDetailModal}
    onClose={() => showDetailModal = false}
    onEdit={(admin) => { showDetailModal = false; openEditModal(admin); }}
    onResetPassword={openResetPasswordModal}
/>

<AdminDeleteConfirm 
    admin={selectedAdmin}
    show={showDeleteModal}
    onClose={() => showDeleteModal = false}
/>

<ResetPasswordModal 
    admin={selectedAdmin}
    show={showResetPasswordModal}
    onClose={() => showResetPasswordModal = false}
/>