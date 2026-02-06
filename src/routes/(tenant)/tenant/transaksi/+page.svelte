<!--
    +page.svelte - Halaman Transaksi (With Struk Integration)
    ==================================================
    - Kasir hanya lihat transaksi sendiri
    - Kasir & Admin tidak bisa void/batalkan
    - Integrasi cetak struk kustom
    ==================================================
-->
<script>
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import { ShoppingCart, AlertCircle, Lock, User } from 'lucide-svelte';

    // Import komponen transaksi
    import {
        SummaryCards,
        FilterSection,
        TransactionList,
        TransactionDetailModal
    } from '$lib/components/tenant/transaksi';

    // Props dari server
    export let data;
    export let form;

    // Safe data extraction with defaults
    $: user = data?.user || null;
    $: tenantUser = data?.tenantUser || null;
    $: transaksiList = data?.transaksi || [];
    $: summary = data?.summary || null;
    $: todaySummary = data?.todaySummary || null;
    
    // Permission
    $: permissions = data?.permissions || { canVoid: false, canViewAll: true };
    $: canVoid = permissions.canVoid;
    $: canViewAll = permissions.canViewAll;
    $: isKasir = tenantUser?.role === 'kasir';

    // ==========================================
    // STRUK SETTINGS (NEW)
    // ==========================================
    $: strukSettings = data?.strukSettings || {
        struk_logo: null,
        struk_header: '',
        struk_footer: 'Terima kasih atas kunjungan Anda!',
        tampilkan_logo: true,
        tampilkan_alamat: true,
        tampilkan_telepon: true,
        ukuran_kertas: '58mm',
        auto_print: false
    };

    $: tokoInfo = data?.tokoInfo || {
        nama_bisnis: user?.nama_bisnis || '',
        alamat: '',
        no_telepon: ''
    };

    // Filter State (client-side)
    let searchQuery = '';
    let startDate = '';
    let endDate = '';
    let statusFilter = '';
    let metodeFilter = '';

    // Loading & Modal State
    let isLoading = false;
    let showDetailModal = false;
    let selectedTransaksi = null;
    let transaksiDetail = [];

    // ==========================================
    // CLIENT-SIDE FILTERING
    // ==========================================
    $: filteredTransaksi = transaksiList.filter(trx => {
        const matchSearch = !searchQuery || 
            trx.no_invoice?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trx.nama_customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trx.kasir_nama?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchStatus = !statusFilter || trx.status === statusFilter;
        const matchMetode = !metodeFilter || trx.metode_bayar === metodeFilter;
        
        let matchDate = true;
        if (startDate || endDate) {
            const trxDate = new Date(trx.tanggal);
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (trxDate < start) matchDate = false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (trxDate > end) matchDate = false;
            }
        }
        
        return matchSearch && matchStatus && matchMetode && matchDate;
    });

    $: hasActiveFilters = searchQuery || startDate || endDate || statusFilter || metodeFilter;

    // ==========================================
    // HANDLE FORM RESPONSES
    // ==========================================
    $: if (form?.success && form?.transaksi) {
        selectedTransaksi = form.transaksi;
        transaksiDetail = form.detail || [];
        showDetailModal = true;
    }

    $: if (form?.success && form?.message?.includes('dibatalkan')) {
        goto(window.location.pathname, { invalidateAll: true });
    }

    // ==========================================
    // HANDLERS
    // ==========================================
    function clearFilters() {
        searchQuery = '';
        startDate = '';
        endDate = '';
        statusFilter = '';
        metodeFilter = '';
    }

    function handleLoadingStart() {
        isLoading = true;
    }

    function handleLoadingEnd() {
        isLoading = false;
    }

    function handleModalClose() {
        showDetailModal = false;
        selectedTransaksi = null;
        transaksiDetail = [];
    }
</script>

<svelte:head>
    <title>Transaksi - {user?.nama_bisnis || 'POSKasir'}</title>
</svelte:head>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <div class="flex items-center gap-2">
                <h1 class="text-xl font-semibold text-slate-800">Transaksi</h1>
                {#if tenantUser}
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium
                        {tenantUser.role === 'owner' ? 'bg-amber-100 text-amber-700' : 
                         tenantUser.role === 'admin' ? 'bg-blue-100 text-blue-700' : 
                         'bg-green-100 text-green-700'}">
                        {tenantUser.role === 'owner' ? 'Owner' : 
                         tenantUser.role === 'admin' ? 'Admin' : 'Kasir'}
                    </span>
                {/if}
            </div>
            <p class="text-slate-500 text-sm mt-1">
                {#if isKasir}
                    Riwayat transaksi Anda
                {:else}
                    Riwayat semua transaksi penjualan
                {/if}
            </p>
        </div>
        <a 
            href="/tenant/kasir"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 
                   bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 
                   transition-colors text-sm font-medium w-full sm:w-auto"
        >
            <ShoppingCart class="w-4 h-4" />
            <span>Buka Kasir</span>
        </a>
    </div>

    <!-- Info Banner untuk Kasir -->
    {#if isKasir}
        <div class="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div class="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User class="w-5 h-5 text-amber-600" />
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-amber-800 font-medium text-sm">Mode Kasir</p>
                <p class="text-amber-600 text-xs">
                    Anda hanya dapat melihat transaksi yang Anda buat. Untuk melihat semua transaksi atau membatalkan transaksi, hubungi Owner.
                </p>
            </div>
        </div>
    {/if}

    <!-- Info Banner untuk Admin -->
    {#if tenantUser?.role === 'admin' && !canVoid}
        <div class="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Lock class="w-5 h-5 text-blue-600" />
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-blue-800 font-medium text-sm">Mode Admin</p>
                <p class="text-blue-600 text-xs">
                    Anda dapat melihat semua transaksi. Untuk membatalkan transaksi, hubungi Owner.
                </p>
            </div>
        </div>
    {/if}

    <!-- Error Message -->
    {#if form?.message && !form?.success}
        <div class="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
            <p class="text-red-700 text-sm">{form.message}</p>
        </div>
    {/if}

    <!-- Summary Cards -->
    <SummaryCards {todaySummary} {summary} />

    <!-- Filter Section -->
    <FilterSection 
        bind:searchQuery
        bind:startDate
        bind:endDate
        bind:statusFilter
        bind:metodeFilter
    />

    <!-- Transaction List -->
    <TransactionList 
        transactions={filteredTransaksi}
        {hasActiveFilters}
        {isLoading}
        {canVoid}
        on:loadingStart={handleLoadingStart}
        on:loadingEnd={handleLoadingEnd}
        on:reset={clearFilters}
    />

    <!-- Result Info -->
    {#if transaksiList.length > 0}
        <p class="text-sm text-slate-500 text-center">
            Menampilkan {filteredTransaksi.length} dari {transaksiList.length} transaksi
            {#if isKasir}
                <span class="text-amber-600">(transaksi Anda)</span>
            {/if}
        </p>
    {/if}
</div>

<!-- Detail Modal - WITH STRUK INTEGRATION -->
<TransactionDetailModal 
    bind:open={showDetailModal}
    transaction={selectedTransaksi}
    details={transaksiDetail}
    storeName={user?.nama_bisnis}
    {canVoid}
    {strukSettings}
    {tokoInfo}
    on:close={handleModalClose}
/>