<script>
    import { page } from '$app/stores';
    import { goto, invalidateAll } from '$app/navigation';
    import { enhance } from '$app/forms';
    import { 
        MessageSquare, Star, Eye, EyeOff, Check, X, Trash2, Edit2,
        Clock, CheckCircle, XCircle, Search, RefreshCw, Plus,
        ChevronLeft, ChevronRight, User, Building2, Mail, Phone, MapPin
    } from 'lucide-svelte';
    
    export let data;
    export let form;
    
    // Data
    $: testimonials = data?.testimonials ?? [];
    $: stats = data?.stats ?? { total: 0, pending: 0, approved: 0, rejected: 0 };
    $: pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 };
    
    // State
    let statusFilter = $page.url.searchParams.get('status') || '';
    let searchQuery = '';
    let isLoading = false;
    let selectedTestimonial = null;
    let showDetailModal = false;
    let showRejectModal = false;
    let showAddModal = false;
    let showEditModal = false;
    let rejectReason = '';
    
    // Form data for add/edit
    let formData = {
        name: '',
        role: '',
        business_name: '',
        business_type: '',
        email: '',
        phone: '',
        testimonial: '',
        rating: 5,
        location: '',
        is_featured: false,
        is_active: true,
        sort_order: 0
    };
    
    const businessTypes = [
        'Kuliner / F&B',
        'Retail / Toko',
        'Fashion',
        'Jasa',
        'Lainnya'
    ];
    
    // Toast
    let showToast = false;
    let toastMessage = '';
    let toastType = 'success';
    
    // React to form result
    $: if (form?.success) {
        showToastMessage(form.message || 'Berhasil!');
        showRejectModal = false;
        showAddModal = false;
        showEditModal = false;
        rejectReason = '';
        resetFormData();
    } else if (form?.error) {
        showToastMessage(form.message || 'Terjadi kesalahan', 'error');
    }
    
    function showToastMessage(message, type = 'success') {
        toastMessage = message;
        toastType = type;
        showToast = true;
        setTimeout(() => showToast = false, 3000);
    }
    
    function resetFormData() {
        formData = {
            name: '',
            role: '',
            business_name: '',
            business_type: '',
            email: '',
            phone: '',
            testimonial: '',
            rating: 5,
            location: '',
            is_featured: false,
            is_active: true,
            sort_order: 0
        };
    }
    
    function applyFilter() {
        const params = new URLSearchParams();
        if (statusFilter) params.set('status', statusFilter);
        if (searchQuery) params.set('search', searchQuery);
        goto(`?${params.toString()}`);
    }
    
    function changePage(newPage) {
        const params = new URLSearchParams($page.url.searchParams);
        params.set('page', newPage.toString());
        goto(`?${params.toString()}`);
    }
    
    function openDetail(testimonial) {
        selectedTestimonial = testimonial;
        showDetailModal = true;
    }
    
    function openRejectModal(testimonial) {
        selectedTestimonial = testimonial;
        rejectReason = '';
        showRejectModal = true;
    }
    
    function openAddModal() {
        resetFormData();
        showAddModal = true;
    }
    
    function openEditModal(testimonial) {
        selectedTestimonial = testimonial;
        formData = {
            name: testimonial.name || '',
            role: testimonial.role || '',
            business_name: testimonial.business_name || '',
            business_type: testimonial.business_type || '',
            email: testimonial.email || '',
            phone: testimonial.phone || '',
            testimonial: testimonial.testimonial || '',
            rating: testimonial.rating || 5,
            location: testimonial.location || '',
            is_featured: testimonial.is_featured || false,
            is_active: testimonial.is_active || false,
            sort_order: testimonial.sort_order || 0
        };
        showEditModal = true;
    }
    
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
    
    function getStatusConfig(status) {
        const configs = {
            'pending': { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock },
            'approved': { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle },
            'rejected': { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', icon: XCircle }
        };
        return configs[status] || configs['approved']; // Default approved for legacy data
    }
    
    async function refreshData() {
        isLoading = true;
        await invalidateAll();
        isLoading = false;
        showToastMessage('Data berhasil diperbarui');
    }
</script>

<svelte:head>
    <title>Kelola Testimonial - Admin</title>
</svelte:head>

<!-- Toast Notification -->
{#if showToast}
    <div class="fixed top-4 right-4 z-50 animate-slide-in">
        <div class="px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 {toastType === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}">
            {#if toastType === 'success'}
                <CheckCircle size={18} />
            {:else}
                <XCircle size={18} />
            {/if}
            <span class="text-sm font-medium">{toastMessage}</span>
        </div>
    </div>
{/if}

<div class="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
    
    <!-- Header -->
    <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <MessageSquare size={28} class="text-gray-400" />
                Kelola Testimonial
            </h1>
            <p class="text-sm text-gray-500 mt-1">Moderasi dan kelola testimoni dari pengguna</p>
        </div>
        <div class="flex items-center gap-2">
            <button 
                on:click={refreshData}
                disabled={isLoading}
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 
                       bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors
                       disabled:opacity-50"
            >
                <RefreshCw size={16} class={isLoading ? 'animate-spin' : ''} />
                Refresh
            </button>
            <button 
                on:click={openAddModal}
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white 
                       bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
                <Plus size={16} />
                Tambah Manual
            </button>
        </div>
    </header>
    
    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
            on:click={() => { statusFilter = ''; applyFilter(); }}
            class="p-4 rounded-xl border-2 transition-all text-left
                   {!statusFilter ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-200'}"
        >
            <p class="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p class="text-sm text-gray-500">Total</p>
        </button>
        <button 
            on:click={() => { statusFilter = 'pending'; applyFilter(); }}
            class="p-4 rounded-xl border-2 transition-all text-left
                   {statusFilter === 'pending' ? 'border-amber-500 bg-amber-50' : 'border-gray-100 bg-white hover:border-amber-200'}"
        >
            <p class="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p class="text-sm text-gray-500">Pending</p>
        </button>
        <button 
            on:click={() => { statusFilter = 'approved'; applyFilter(); }}
            class="p-4 rounded-xl border-2 transition-all text-left
                   {statusFilter === 'approved' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-white hover:border-emerald-200'}"
        >
            <p class="text-2xl font-bold text-emerald-600">{stats.approved}</p>
            <p class="text-sm text-gray-500">Approved</p>
        </button>
        <button 
            on:click={() => { statusFilter = 'rejected'; applyFilter(); }}
            class="p-4 rounded-xl border-2 transition-all text-left
                   {statusFilter === 'rejected' ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-white hover:border-red-200'}"
        >
            <p class="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p class="text-sm text-gray-500">Rejected</p>
        </button>
    </div>
    
    <!-- Filter & Search -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1 relative">
                <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Cari nama, usaha, email..."
                    bind:value={searchQuery}
                    on:keydown={(e) => e.key === 'Enter' && applyFilter()}
                    class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
            </div>
            <button
                on:click={applyFilter}
                class="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
                Cari
            </button>
        </div>
    </div>
    
    <!-- Testimonials Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pengirim</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Testimoni</th>
                        <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Rating</th>
                        <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Tanggal</th>
                        <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    {#if testimonials.length > 0}
                        {#each testimonials as item (item.id)}
                            {@const statusConfig = getStatusConfig(item.status)}
                            <tr class="hover:bg-gray-50 transition-colors">
                                <!-- Pengirim -->
                                <td class="px-4 py-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            {(item.name || 'A').charAt(0).toUpperCase()}
                                        </div>
                                        <div class="min-w-0">
                                            <p class="font-medium text-gray-900 truncate">{item.name}</p>
                                            <p class="text-xs text-gray-500 truncate">{item.business_name || '-'}</p>
                                            {#if item.location}
                                                <p class="text-xs text-gray-400 flex items-center gap-1">
                                                    <MapPin size={10} />{item.location}
                                                </p>
                                            {/if}
                                        </div>
                                    </div>
                                </td>
                                
                                <!-- Testimoni -->
                                <td class="px-4 py-4 hidden md:table-cell">
                                    <p class="text-sm text-gray-600 line-clamp-2 max-w-xs">{item.testimonial}</p>
                                </td>
                                
                                <!-- Rating -->
                                <td class="px-4 py-4 text-center">
                                    <div class="flex items-center justify-center gap-0.5">
                                        {#each Array(5) as _, i}
                                            <Star size={14} class="{i < item.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}" />
                                        {/each}
                                    </div>
                                </td>
                                
                                <!-- Status -->
                                <td class="px-4 py-4 text-center">
                                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium {statusConfig.bg} {statusConfig.color}">
                                        <svelte:component this={statusConfig.icon} size={12} />
                                        {statusConfig.label}
                                    </span>
                                </td>
                                
                                <!-- Tanggal -->
                                <td class="px-4 py-4 text-center hidden lg:table-cell">
                                    <span class="text-sm text-gray-500">{formatDate(item.submitted_at || item.created_at)}</span>
                                </td>
                                
                                <!-- Aksi -->
                                <td class="px-4 py-4">
                                    <div class="flex items-center justify-center gap-1">
                                        <!-- View Detail -->
                                        <button 
                                            on:click={() => openDetail(item)}
                                            class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                                            title="Lihat Detail"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        
                                        <!-- Edit -->
                                        <button 
                                            on:click={() => openEditModal(item)}
                                            class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        
                                        {#if item.status === 'pending'}
                                            <!-- Approve -->
                                            <form method="POST" action="?/approve" use:enhance class="inline">
                                                <input type="hidden" name="id" value={item.id} />
                                                <button 
                                                    type="submit"
                                                    class="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                                                    title="Setujui"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            </form>
                                            
                                            <!-- Reject -->
                                            <button 
                                                on:click={() => openRejectModal(item)}
                                                class="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                                title="Tolak"
                                            >
                                                <X size={16} />
                                            </button>
                                        {:else}
                                            <!-- Toggle Visibility (is_active) -->
                                            <form method="POST" action="?/toggleVisibility" use:enhance class="inline">
                                                <input type="hidden" name="id" value={item.id} />
                                                <input type="hidden" name="is_active" value={item.is_active ? '0' : '1'} />
                                                <button 
                                                    type="submit"
                                                    class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                    title={item.is_active ? 'Sembunyikan' : 'Tampilkan'}
                                                >
                                                    {#if item.is_active}
                                                        <EyeOff size={16} />
                                                    {:else}
                                                        <Eye size={16} />
                                                    {/if}
                                                </button>
                                            </form>
                                        {/if}
                                        
                                        <!-- Delete -->
                                        <form method="POST" action="?/delete" use:enhance class="inline" on:submit|preventDefault={(e) => {
                                            if (confirm('Hapus testimoni ini?')) e.target.submit();
                                        }}>
                                            <input type="hidden" name="id" value={item.id} />
                                            <button 
                                                type="submit"
                                                class="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                                title="Hapus"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    {:else}
                        <tr>
                            <td colspan="6" class="px-4 py-16 text-center">
                                <MessageSquare size={48} class="mx-auto mb-4 text-gray-300" />
                                <p class="text-gray-500 font-medium">Tidak ada testimoni</p>
                                <button on:click={openAddModal} class="mt-4 text-emerald-600 hover:underline text-sm">
                                    + Tambah testimoni pertama
                                </button>
                            </td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        </div>
        
        <!-- Pagination -->
        {#if pagination.totalPages > 1}
            <div class="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <p class="text-sm text-gray-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div class="flex items-center gap-1">
                    <button on:click={() => changePage(pagination.page - 1)} disabled={pagination.page === 1}
                        class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                        <ChevronLeft size={16} />
                    </button>
                    <span class="px-3 text-sm">{pagination.page} / {pagination.totalPages}</span>
                    <button on:click={() => changePage(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                        class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>

<!-- Detail Modal -->
{#if showDetailModal && selectedTestimonial}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black/50" on:click={() => showDetailModal = false}></div>
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 class="font-semibold text-gray-900">Detail Testimoni</h3>
                    <button on:click={() => showDetailModal = false} class="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} class="text-gray-500" />
                    </button>
                </div>
                <div class="p-6 space-y-4">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl">
                            {(selectedTestimonial.name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="font-semibold text-gray-900">{selectedTestimonial.name}</p>
                            <p class="text-sm text-gray-500">{selectedTestimonial.role || ''} {selectedTestimonial.business_name}</p>
                            {#if selectedTestimonial.business_type}
                                <p class="text-xs text-gray-400">{selectedTestimonial.business_type}</p>
                            {/if}
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="flex items-center gap-2">
                            <Mail size={14} class="text-gray-400" />
                            <span class="text-gray-600">{selectedTestimonial.email || '-'}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Phone size={14} class="text-gray-400" />
                            <span class="text-gray-600">{selectedTestimonial.phone || '-'}</span>
                        </div>
                        {#if selectedTestimonial.location}
                            <div class="flex items-center gap-2 col-span-2">
                                <MapPin size={14} class="text-gray-400" />
                                <span class="text-gray-600">{selectedTestimonial.location}</span>
                            </div>
                        {/if}
                    </div>
                    
                    <div class="flex items-center gap-1">
                        {#each Array(5) as _, i}
                            <Star size={20} class="{i < selectedTestimonial.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}" />
                        {/each}
                    </div>
                    
                    <div class="p-4 bg-gray-50 rounded-xl">
                        <p class="text-gray-700 italic">"{selectedTestimonial.testimonial}"</p>
                    </div>
                    
                    <div class="text-sm text-gray-500">
                        <p>Dikirim: {formatDate(selectedTestimonial.submitted_at || selectedTestimonial.created_at)}</p>
                        {#if selectedTestimonial.reviewed_at}
                            <p>Direview: {formatDate(selectedTestimonial.reviewed_at)}</p>
                        {/if}
                        {#if selectedTestimonial.reject_reason}
                            <p class="text-red-600">Alasan ditolak: {selectedTestimonial.reject_reason}</p>
                        {/if}
                    </div>
                </div>
                <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button on:click={() => showDetailModal = false} class="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<!-- Reject Modal -->
{#if showRejectModal && selectedTestimonial}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black/50" on:click={() => showRejectModal = false}></div>
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="font-semibold text-gray-900">Tolak Testimoni</h3>
                </div>
                <form method="POST" action="?/reject" use:enhance class="p-6">
                    <input type="hidden" name="id" value={selectedTestimonial.id} />
                    <p class="text-sm text-gray-600 mb-4">
                        Tolak testimoni dari <strong>{selectedTestimonial.name}</strong>?
                    </p>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Alasan (opsional)</label>
                        <textarea
                            name="reject_reason"
                            bind:value={rejectReason}
                            rows="3"
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                            placeholder="Masukkan alasan penolakan..."
                        ></textarea>
                    </div>
                    <div class="flex gap-3">
                        <button type="button" on:click={() => showRejectModal = false}
                            class="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                            Batal
                        </button>
                        <button type="submit"
                            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                            Tolak
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
{/if}

<!-- Add/Edit Modal -->
{#if showAddModal || showEditModal}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black/50" on:click={() => { showAddModal = false; showEditModal = false; }}></div>
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                    <h3 class="font-semibold text-gray-900">{showEditModal ? 'Edit' : 'Tambah'} Testimoni</h3>
                    <button on:click={() => { showAddModal = false; showEditModal = false; }} class="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} class="text-gray-500" />
                    </button>
                </div>
                <form method="POST" action={showEditModal ? '?/update' : '?/add'} use:enhance class="p-6 space-y-4">
                    {#if showEditModal && selectedTestimonial}
                        <input type="hidden" name="id" value={selectedTestimonial.id} />
                    {/if}
                    
                    <!-- Rating -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                        <div class="flex items-center gap-1">
                            {#each [1, 2, 3, 4, 5] as star}
                                <button
                                    type="button"
                                    on:click={() => formData.rating = star}
                                    class="p-1"
                                >
                                    <Star size={24} class="{formData.rating >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}" />
                                </button>
                            {/each}
                            <input type="hidden" name="rating" value={formData.rating} />
                        </div>
                    </div>
                    
                    <!-- Name & Role -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                            <input type="text" name="name" bind:value={formData.name} required
                                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                            <input type="text" name="role" bind:value={formData.role}
                                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                                placeholder="Owner / Manager" />
                        </div>
                    </div>
                    
                    <!-- Business Name & Type -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Usaha</label>
                            <input type="text" name="business_name" bind:value={formData.business_name}
                                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Jenis Usaha</label>
                            <select name="business_type" bind:value={formData.business_type}
                                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <option value="">Pilih jenis</option>
                                {#each businessTypes as type}
                                    <option value={type}>{type}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                    
                    <!-- Email & Phone -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" name="email" bind:value={formData.email}
                                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                            <input type="text" name="phone" bind:value={formData.phone}
                                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                    </div>
                    
                    <!-- Location -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                        <input type="text" name="location" bind:value={formData.location}
                            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                            placeholder="Kota / Kabupaten" />
                    </div>
                    
                    <!-- Testimonial -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Testimoni *</label>
                        <textarea name="testimonial" bind:value={formData.testimonial} required rows="4"
                            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            placeholder="Isi testimoni..."></textarea>
                    </div>
                    
                    <!-- Sort Order -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                        <input type="number" name="sort_order" bind:value={formData.sort_order}
                            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    
                    <!-- Checkboxes -->
                    <div class="flex items-center gap-6">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="is_active" bind:checked={formData.is_active} class="rounded text-emerald-600" />
                            <span class="text-sm">Aktif (tampil di landing)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="is_featured" bind:checked={formData.is_featured} class="rounded text-emerald-600" />
                            <span class="text-sm">Featured</span>
                        </label>
                    </div>
                    
                    <!-- Submit -->
                    <div class="flex gap-3 pt-2">
                        <button type="button" on:click={() => { showAddModal = false; showEditModal = false; }}
                            class="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                            Batal
                        </button>
                        <button type="submit"
                            class="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                            {showEditModal ? 'Update' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
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
    
    @keyframes slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
        animation: slide-in 0.3s ease-out;
    }
</style>