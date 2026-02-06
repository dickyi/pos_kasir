<!--
    /tenant/kasir/kas/+page.svelte (IMPROVED)
    ============================================
    IMPROVEMENTS:
    1. ✅ Modal konfirmasi hapus (bukan browser confirm)
    2. ✅ Filter by status (semua/pending/approved)
    3. ✅ Visual berbeda untuk pending
    4. ✅ Badge pending count
    5. ✅ Approval section untuk owner/admin
    ============================================
-->
<script>
    import { invalidateAll, goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { 
        ArrowDownCircle, ArrowUpCircle, Plus, Wallet,
        TrendingUp, TrendingDown, History, AlertCircle,
        RefreshCw, Search, ArrowLeft, Clock, Filter,
        CheckCircle, XCircle, Shield
    } from 'lucide-svelte';
    import { formatRupiah } from '$lib/utils/format.js';
    
    // Import components
    import { ShiftStatusBar } from '$lib/components/tenant/kasir';
    import KasInputModal from '$lib/components/tenant/kasir/kas/KasInputModal.svelte';
    import KasCard from '$lib/components/tenant/kasir/kas/KasCard.svelte';
    import DeleteConfirmModal from '$lib/components/tenant/kasir/kas/DeleteConfirmModal.svelte';
    import KasApprovalModal from '$lib/components/tenant/kasir/kas/KasApprovalModal.svelte';
    
    /** @type {import('./$types').PageData} */
    export let data;
    
    // State
    let showInputModal = false;
    let initialTipe = null;
    let isLoading = false;
    let searchQuery = '';
    let filterTipe = 'semua'; // semua, masuk, keluar
    
    // Delete modal state
    let showDeleteModal = false;
    let kasToDelete = null;
    let deleteReason = '';
    let isDeleting = false;
    
    // Approval modal state
    let showApprovalModal = false;
    let kasToApprove = null;
    let approvalAction = 'approve'; // approve or reject
    let rejectReason = '';
    let isProcessingApproval = false;
    
    // Toast state
    let toast = { show: false, message: '', type: 'success' };
    
    // Computed
    $: activeShift = data.activeShift;
    $: kasList = data.kasList || [];
    $: summary = data.summary || { total_masuk: 0, total_keluar: 0, count_masuk: 0, count_keluar: 0, count_pending: 0 };
    $: kategoriList = data.kategoriList || [];
    $: pengaturan = data.pengaturan || {};
    $: isKasir = data.isKasir;
    $: isOwnerOrAdmin = data.isOwnerOrAdmin;
    $: limitKasKeluar = data.limitKasKeluar ?? -1;
    $: pendingKas = data.pendingKas || [];
    $: statusFilter = data.statusFilter || 'semua';
    
    // Filtered list
    $: filteredKas = kasList.filter(kas => {
        // Filter by tipe
        if (filterTipe !== 'semua' && kas.tipe !== filterTipe) return false;
        
        // Filter by search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                kas.keterangan?.toLowerCase().includes(q) ||
                kas.penerima?.toLowerCase().includes(q) ||
                kas.no_referensi?.toLowerCase().includes(q) ||
                kas.kategori_nama?.toLowerCase().includes(q)
            );
        }
        
        return true;
    });
    
    // Net kas
    $: netKas = summary.total_masuk - summary.total_keluar;
    
    // Check if kasir can do kas keluar
    $: kasirCanKasKeluar = !isKasir || limitKasKeluar !== 0;
    
    function openInputModal(tipe = null) {
        initialTipe = tipe;
        showInputModal = true;
    }
    
    function showToast(message, type = 'success') {
        toast = { show: true, message, type };
        setTimeout(() => {
            toast.show = false;
        }, 3000);
    }
    
    async function handleSubmitKas(event) {
        isLoading = true;
        
        const formData = new FormData();
        formData.append('tipe', event.detail.tipe);
        formData.append('jumlah', event.detail.jumlah);
        formData.append('kategori_kas_id', event.detail.kategori_kas_id || '');
        formData.append('keterangan', event.detail.keterangan);
        formData.append('penerima', event.detail.penerima || '');
        formData.append('shift_id', event.detail.shift_id || '');
        
        try {
            const response = await fetch('?/simpanKas', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.type === 'success' || result.data?.success) {
                showToast(result.data?.message || (event.detail.tipe === 'masuk' ? 'Kas masuk berhasil!' : 'Kas keluar berhasil!'));
                showInputModal = false;
                await invalidateAll();
            } else {
                showToast(result.data?.error || 'Gagal menyimpan kas', 'error');
            }
        } catch (err) {
            console.error('Error saving kas:', err);
            showToast('Terjadi kesalahan', 'error');
        } finally {
            isLoading = false;
        }
    }
    
    // ✅ IMPROVED: Open delete confirmation modal instead of browser confirm
    function handleDeleteKas(event) {
        kasToDelete = event.detail;
        deleteReason = '';
        showDeleteModal = true;
    }
    
    // ✅ IMPROVED: Confirm delete with reason
    async function confirmDelete() {
        if (!kasToDelete) return;
        
        isDeleting = true;
        
        const formData = new FormData();
        formData.append('kas_id', kasToDelete.id);
        formData.append('delete_reason', deleteReason || 'Tidak ada alasan');
        
        try {
            const response = await fetch('?/hapusKas', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.type === 'success' || result.data?.success) {
                showToast('Kas berhasil dihapus');
                showDeleteModal = false;
                kasToDelete = null;
                await invalidateAll();
            } else {
                showToast(result.data?.error || 'Gagal menghapus kas', 'error');
            }
        } catch (err) {
            showToast('Terjadi kesalahan', 'error');
        } finally {
            isDeleting = false;
        }
    }
    
    function handleViewKas(event) {
        // TODO: Open detail modal
        console.log('View kas:', event.detail);
    }
    
    // ✅ NEW: Handle approval action
    function openApprovalModal(kas, action = 'approve') {
        kasToApprove = kas;
        approvalAction = action;
        rejectReason = '';
        showApprovalModal = true;
    }
    
    async function processApproval() {
        if (!kasToApprove) return;
        
        isProcessingApproval = true;
        
        const formData = new FormData();
        formData.append('kas_id', kasToApprove.id);
        
        if (approvalAction === 'reject') {
            formData.append('reject_reason', rejectReason || 'Tidak ada alasan');
        }
        
        const actionUrl = approvalAction === 'approve' ? '?/approveKas' : '?/rejectKas';
        
        try {
            const response = await fetch(actionUrl, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.type === 'success' || result.data?.success) {
                showToast(approvalAction === 'approve' ? 'Kas berhasil disetujui' : 'Kas berhasil ditolak');
                showApprovalModal = false;
                kasToApprove = null;
                await invalidateAll();
            } else {
                showToast(result.data?.error || 'Gagal memproses kas', 'error');
            }
        } catch (err) {
            showToast('Terjadi kesalahan', 'error');
        } finally {
            isProcessingApproval = false;
        }
    }
    
    async function handleRefresh() {
        await invalidateAll();
        showToast('Data diperbarui');
    }
    
    // ✅ NEW: Change status filter via URL
    function changeStatusFilter(newStatus) {
        const url = new URL($page.url);
        if (newStatus === 'semua') {
            url.searchParams.delete('status');
        } else {
            url.searchParams.set('status', newStatus);
        }
        goto(url.toString(), { replaceState: true, invalidateAll: true });
    }
</script>

<svelte:head>
    <title>Kas Masuk/Keluar | Kasir</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
    <!-- Shift Status Bar -->
    <ShiftStatusBar shift={activeShift} />
    
    <!-- Header -->
    <div class="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div class="max-w-4xl mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <a 
                        href="/tenant/kasir" 
                        class="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        <ArrowLeft class="w-5 h-5" />
                    </a>
                    <div>
                        <h1 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Wallet class="w-6 h-6 text-emerald-600" />
                            Kas Masuk/Keluar
                        </h1>
                        <p class="text-sm text-slate-500 mt-0.5">Hari ini</p>
                    </div>
                </div>
                
                <button
                    type="button"
                    on:click={handleRefresh}
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                    <RefreshCw class="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
    
    <div class="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <!-- Warning jika tidak ada shift aktif -->
        {#if !activeShift}
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p class="font-medium text-amber-800">Tidak ada shift aktif</p>
                    <p class="text-sm text-amber-600 mt-1">
                        Kas tetap bisa dicatat, tapi tidak akan terhubung dengan shift manapun.
                        <a href="/tenant/kasir" class="underline font-medium">Buka shift dulu</a>
                    </p>
                </div>
            </div>
        {/if}
        
        <!-- ✅ NEW: Pending Approval Alert for Owner/Admin -->
        {#if isOwnerOrAdmin && pendingKas.length > 0}
            <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock class="w-5 h-5 text-orange-600" />
                    </div>
                    <div class="flex-1">
                        <p class="font-semibold text-orange-800 flex items-center gap-2">
                            Menunggu Approval
                            <span class="px-2 py-0.5 bg-orange-200 text-orange-700 rounded-full text-xs font-bold">
                                {pendingKas.length}
                            </span>
                        </p>
                        <p class="text-sm text-orange-600 mt-1">
                            Ada {pendingKas.length} kas keluar yang perlu disetujui
                        </p>
                        
                        <!-- Quick Approval List -->
                        <div class="mt-3 space-y-2">
                            {#each pendingKas.slice(0, 3) as kas}
                                <div class="flex items-center justify-between p-2 bg-white rounded-lg border border-orange-200">
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-medium text-slate-800 truncate">
                                            {kas.keterangan}
                                        </p>
                                        <p class="text-xs text-slate-500">
                                            {kas.nama_user} • {formatRupiah(kas.jumlah)}
                                        </p>
                                    </div>
                                    <div class="flex items-center gap-1 ml-2">
                                        <button
                                            type="button"
                                            on:click={() => openApprovalModal(kas, 'approve')}
                                            class="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg"
                                            title="Setujui"
                                        >
                                            <CheckCircle class="w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            on:click={() => openApprovalModal(kas, 'reject')}
                                            class="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"
                                            title="Tolak"
                                        >
                                            <XCircle class="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            {/each}
                            
                            {#if pendingKas.length > 3}
                                <button
                                    type="button"
                                    on:click={() => changeStatusFilter('pending')}
                                    class="w-full py-2 text-sm text-orange-600 hover:bg-orange-100 rounded-lg font-medium"
                                >
                                    Lihat semua ({pendingKas.length} pending)
                                </button>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        {/if}
        
        <!-- Summary Cards -->
        <div class="grid grid-cols-3 gap-3">
            <!-- Kas Masuk -->
            <div class="bg-white rounded-xl border border-slate-200 p-4">
                <div class="flex items-center gap-2 text-emerald-600 mb-2">
                    <div class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <TrendingUp class="w-4 h-4" />
                    </div>
                    <span class="text-xs font-medium text-slate-500">Masuk</span>
                </div>
                <p class="text-lg font-bold text-emerald-600">
                    +{formatRupiah(summary.total_masuk)}
                </p>
                <p class="text-xs text-slate-400 mt-1">{summary.count_masuk} transaksi</p>
            </div>
            
            <!-- Kas Keluar -->
            <div class="bg-white rounded-xl border border-slate-200 p-4">
                <div class="flex items-center gap-2 text-red-600 mb-2">
                    <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <TrendingDown class="w-4 h-4" />
                    </div>
                    <span class="text-xs font-medium text-slate-500">Keluar</span>
                </div>
                <p class="text-lg font-bold text-red-600">
                    -{formatRupiah(summary.total_keluar)}
                </p>
                <div class="flex items-center gap-2 mt-1">
                    <p class="text-xs text-slate-400">{summary.count_keluar} transaksi</p>
                    {#if summary.count_pending > 0}
                        <span class="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[10px] font-medium">
                            +{summary.count_pending} pending
                        </span>
                    {/if}
                </div>
            </div>
            
            <!-- Net -->
            <div class="bg-white rounded-xl border border-slate-200 p-4">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Wallet class="w-4 h-4 text-slate-600" />
                    </div>
                    <span class="text-xs font-medium text-slate-500">Net</span>
                </div>
                <p class="text-lg font-bold {netKas >= 0 ? 'text-emerald-600' : 'text-red-600'}">
                    {netKas >= 0 ? '+' : ''}{formatRupiah(netKas)}
                </p>
                <p class="text-xs text-slate-400 mt-1">Selisih kas</p>
            </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="grid grid-cols-2 gap-3">
            <button
                type="button"
                on:click={() => openInputModal('masuk')}
                class="flex items-center justify-center gap-2 py-4 px-4 bg-emerald-600 
                       text-white rounded-xl font-medium hover:bg-emerald-700 
                       transition-colors active:scale-[0.98]"
            >
                <ArrowDownCircle class="w-5 h-5" />
                <span>Kas Masuk</span>
            </button>
            
            <button
                type="button"
                on:click={() => openInputModal('keluar')}
                disabled={!kasirCanKasKeluar}
                class="flex items-center justify-center gap-2 py-4 px-4 bg-red-600 
                       text-white rounded-xl font-medium hover:bg-red-700 
                       transition-colors active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ArrowUpCircle class="w-5 h-5" />
                <span>Kas Keluar</span>
            </button>
        </div>
        
        <!-- Info Limit untuk Kasir -->
        {#if isKasir && limitKasKeluar > 0}
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                ℹ️ Limit kas keluar Anda: <span class="font-semibold">{formatRupiah(limitKasKeluar)}</span> per transaksi
            </div>
        {/if}
        
        {#if isKasir && limitKasKeluar === 0}
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                ⚠️ Anda tidak memiliki izin untuk kas keluar. Hubungi Owner/Admin.
            </div>
        {/if}
        
        <!-- Filter & Search -->
        <div class="bg-white rounded-xl border border-slate-200 p-3 space-y-3">
            <!-- ✅ NEW: Status Filter -->
            {#if isOwnerOrAdmin}
                <div class="flex items-center gap-2">
                    <Filter class="w-4 h-4 text-slate-400" />
                    <span class="text-xs text-slate-500">Status:</span>
                    <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <button
                            type="button"
                            on:click={() => changeStatusFilter('semua')}
                            class="px-3 py-1.5 rounded-md text-xs font-medium transition-all
                                   {statusFilter === 'semua' 
                                       ? 'bg-white text-slate-800 shadow-sm' 
                                       : 'text-slate-500 hover:text-slate-700'}"
                        >
                            Semua
                        </button>
                        <button
                            type="button"
                            on:click={() => changeStatusFilter('approved')}
                            class="px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1
                                   {statusFilter === 'approved' 
                                       ? 'bg-emerald-100 text-emerald-700' 
                                       : 'text-slate-500 hover:text-slate-700'}"
                        >
                            <CheckCircle class="w-3 h-3" />
                            Approved
                        </button>
                        <button
                            type="button"
                            on:click={() => changeStatusFilter('pending')}
                            class="px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1
                                   {statusFilter === 'pending' 
                                       ? 'bg-orange-100 text-orange-700' 
                                       : 'text-slate-500 hover:text-slate-700'}"
                        >
                            <Clock class="w-3 h-3" />
                            Pending
                            {#if summary.count_pending > 0}
                                <span class="px-1 py-0.5 bg-orange-200 text-orange-700 rounded text-[10px]">
                                    {summary.count_pending}
                                </span>
                            {/if}
                        </button>
                    </div>
                </div>
            {/if}
            
            <div class="flex items-center gap-3">
                <!-- Search -->
                <div class="flex-1 relative">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        bind:value={searchQuery}
                        placeholder="Cari keterangan, penerima, no referensi..."
                        class="w-full h-10 pl-10 pr-4 border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:border-emerald-500"
                    />
                </div>
                
                <!-- Filter Tipe -->
                <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    <button
                        type="button"
                        on:click={() => filterTipe = 'semua'}
                        class="px-3 py-1.5 rounded-md text-xs font-medium transition-all
                               {filterTipe === 'semua' 
                                   ? 'bg-white text-slate-800 shadow-sm' 
                                   : 'text-slate-500 hover:text-slate-700'}"
                    >
                        Semua
                    </button>
                    <button
                        type="button"
                        on:click={() => filterTipe = 'masuk'}
                        class="px-3 py-1.5 rounded-md text-xs font-medium transition-all
                               {filterTipe === 'masuk' 
                                   ? 'bg-emerald-100 text-emerald-700' 
                                   : 'text-slate-500 hover:text-slate-700'}"
                    >
                        Masuk
                    </button>
                    <button
                        type="button"
                        on:click={() => filterTipe = 'keluar'}
                        class="px-3 py-1.5 rounded-md text-xs font-medium transition-all
                               {filterTipe === 'keluar' 
                                   ? 'bg-red-100 text-red-700' 
                                   : 'text-slate-500 hover:text-slate-700'}"
                    >
                        Keluar
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Kas List -->
        <div class="space-y-3">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <History class="w-4 h-4" />
                    Riwayat Hari Ini
                </h2>
                <span class="text-xs text-slate-500">{filteredKas.length} transaksi</span>
            </div>
            
            {#if filteredKas.length === 0}
                <div class="bg-white rounded-xl border border-slate-200 p-8 text-center">
                    <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wallet class="w-8 h-8 text-slate-400" />
                    </div>
                    <p class="text-slate-500">
                        {#if statusFilter === 'pending'}
                            Tidak ada kas pending
                        {:else}
                            Belum ada transaksi kas hari ini
                        {/if}
                    </p>
                    {#if statusFilter === 'semua'}
                        <button
                            type="button"
                            on:click={() => openInputModal()}
                            class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm 
                                   font-medium hover:bg-emerald-700 inline-flex items-center gap-2"
                        >
                            <Plus class="w-4 h-4" />
                            Tambah Kas
                        </button>
                    {/if}
                </div>
            {:else}
                <div class="space-y-2">
                    {#each filteredKas as kas (kas.id)}
                        <KasCard 
                            {kas} 
                            {isOwnerOrAdmin}
                            on:view={handleViewKas}
                            on:delete={handleDeleteKas}
                            on:approve={() => openApprovalModal(kas, 'approve')}
                            on:reject={() => openApprovalModal(kas, 'reject')}
                        />
                    {/each}
                </div>
            {/if}
        </div>
    </div>
    
    <!-- Floating Action Button (Mobile) -->
    <div class="fixed bottom-6 right-6 sm:hidden">
        <button
            type="button"
            on:click={() => openInputModal()}
            class="w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg 
                   flex items-center justify-center hover:bg-emerald-700 
                   active:scale-95 transition-all"
        >
            <Plus class="w-6 h-6" />
        </button>
    </div>
</div>

<!-- Input Modal -->
<KasInputModal
    bind:open={showInputModal}
    {initialTipe}
    {kategoriList}
    {activeShift}
    limitKasKeluar={limitKasKeluar}
    {isKasir}
    {isLoading}
    on:submit={handleSubmitKas}
    on:close={() => showInputModal = false}
/>

<!-- ✅ NEW: Delete Confirm Modal -->
<DeleteConfirmModal
    bind:open={showDeleteModal}
    kas={kasToDelete}
    bind:reason={deleteReason}
    isLoading={isDeleting}
    on:confirm={confirmDelete}
    on:close={() => {
        showDeleteModal = false;
        kasToDelete = null;
    }}
/>

<!-- ✅ NEW: Approval Modal -->
{#if isOwnerOrAdmin}
    <KasApprovalModal
        bind:open={showApprovalModal}
        kas={kasToApprove}
        action={approvalAction}
        bind:rejectReason={rejectReason}
        isLoading={isProcessingApproval}
        on:confirm={processApproval}
        on:close={() => {
            showApprovalModal = false;
            kasToApprove = null;
        }}
    />
{/if}

<!-- Toast -->
{#if toast.show}
    <div 
        class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg
               flex items-center gap-2 animate-slide-up
               {toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}"
    >
        {#if toast.type === 'success'}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        {:else}
            <AlertCircle class="w-5 h-5" />
        {/if}
        <span class="font-medium">{toast.message}</span>
    </div>
{/if}

<style>
    @keyframes slide-up {
        from {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    
    .animate-slide-up {
        animation: slide-up 0.3s ease-out;
    }
</style>