<script>
    import { page } from '$app/stores';
    import { goto, invalidateAll } from '$app/navigation';
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { Activity, RefreshCw, Download, Settings, Filter } from 'lucide-svelte';
    
    // Import Components
    import SystemHealthCard from '$lib/components/admin/usage/SystemHealthCard.svelte';
    import TenantQuotaTable from '$lib/components/admin/usage/TenantQuotaTable.svelte';
    import ActivityLogsTable from '$lib/components/admin/usage/ActivityLogsTable.svelte';
    import TenantHealthScore from '$lib/components/admin/usage/TenantHealthScore.svelte';
    import AlertsPanel from '$lib/components/admin/usage/AlertsPanel.svelte';
    import ResourceUsageChart from '$lib/components/admin/usage/ResourceUsageChart.svelte';
    import Toast from '$lib/components/admin/shared/Toast.svelte';
    
    export let data = {};
    
    // Data from server
    $: systemHealth = data?.systemHealth ?? {};
    $: tenantQuotas = data?.tenantQuotas ?? [];
    $: activityLogs = data?.activityLogs ?? [];
    $: logsPagination = data?.logsPagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 };
    $: alerts = data?.alerts ?? [];
    $: tenantHealthData = data?.tenantHealthData ?? [];
    $: resourceUsage = data?.resourceUsage ?? { labels: [], datasets: {} };
    $: quotaLimits = data?.quotaLimits ?? { maxProduk: 100, maxUser: 5, maxStorage: 500 };
    
    // State
    let isRefreshing = false;
    let autoRefreshInterval = null;
    let sortBy = 'usage_percent';
    let sortOrder = 'desc';
    let logFilters = { action: '' };
    
    // Toast
    let showToast = false;
    let toastMessage = '';
    let toastType = 'success';
    
    // Auto refresh setiap 5 menit
    onMount(() => {
        if (browser) {
            autoRefreshInterval = setInterval(() => {
                refreshData(true);
            }, 5 * 60 * 1000);
        }
    });
    
    onDestroy(() => {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }
    });
    
    // Functions
    async function refreshData(silent = false) {
        if (!silent) isRefreshing = true;
        try {
            await invalidateAll();
            if (!silent) showToastMessage('Data berhasil diperbarui');
        } catch (error) {
            showToastMessage('Gagal memperbarui data', 'error');
        } finally {
            isRefreshing = false;
        }
    }
    
    function handleQuotaSort(column) {
        if (sortBy === column) {
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            sortBy = column;
            sortOrder = 'desc';
        }
        // Update URL params
        const params = new URLSearchParams($page.url.searchParams);
        params.set('quotaSort', sortBy);
        params.set('quotaOrder', sortOrder);
        goto(`?${params.toString()}`);
    }
    
    function handleLogFilter(filters) {
        logFilters = filters;
        const params = new URLSearchParams($page.url.searchParams);
        if (filters.action) {
            params.set('logAction', filters.action);
        } else {
            params.delete('logAction');
        }
        params.set('logPage', '1');
        goto(`?${params.toString()}`);
    }
    
    function handleLogPageChange(newPage) {
        const params = new URLSearchParams($page.url.searchParams);
        params.set('logPage', newPage.toString());
        goto(`?${params.toString()}`);
    }
    
    function handleDismissAlert(alertId) {
        // Kirim request ke server untuk dismiss alert
        // Untuk sekarang, hanya update local state
        alerts = alerts.map(a => a.id === alertId ? { ...a, dismissed: true } : a);
        showToastMessage('Alert dismissed');
    }
    
    function handleAlertAction(alert) {
        if (alert.action_url) {
            goto(alert.action_url);
        }
    }
    
    function handleViewTenantDetail(tenant) {
        goto(`/admin/tenant?search=${encodeURIComponent(tenant.nama_bisnis)}`);
    }
    
    function showToastMessage(message, type = 'success') {
        toastMessage = message;
        toastType = type;
        showToast = true;
        setTimeout(() => showToast = false, 3000);
    }
</script>

<svelte:head>
    <title>Status & Usage - Super Admin</title>
</svelte:head>

<!-- Toast -->
{#if showToast}
    <Toast message={toastMessage} type={toastType} />
{/if}

<div class="p-4 sm:p-6 max-w-[1800px] mx-auto space-y-6">
    
    <!-- ============================================ -->
    <!-- HEADER -->
    <!-- ============================================ -->
    <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Activity size={28} class="text-gray-400" />
                Status & Usage
            </h1>
            <p class="text-sm text-gray-500 mt-1">
                Monitoring sistem, resource usage, dan health check tenant
            </p>
        </div>
        <div class="flex items-center gap-3">
            <button 
                on:click={() => refreshData(false)}
                disabled={isRefreshing}
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 
                       bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors
                       disabled:opacity-50"
            >
                <RefreshCw size={16} class={isRefreshing ? 'animate-spin' : ''} />
                Refresh
            </button>
            <button 
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white 
                       bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
                <Download size={16} />
                Export Report
            </button>
        </div>
    </header>

    <!-- ============================================ -->
    <!-- SYSTEM HEALTH -->
    <!-- ============================================ -->
    <SystemHealthCard 
        health={systemHealth}
        onRefresh={() => refreshData(false)}
        {isRefreshing}
    />

    <!-- ============================================ -->
    <!-- ROW: ALERTS & HEALTH SCORE -->
    <!-- ============================================ -->
    <div class="grid lg:grid-cols-2 gap-6">
        <!-- Alerts Panel -->
        <AlertsPanel 
            {alerts}
            onDismiss={handleDismissAlert}
            onAction={handleAlertAction}
        />
        
        <!-- Tenant Health Score -->
        <TenantHealthScore 
            tenants={tenantHealthData}
            onViewDetail={handleViewTenantDetail}
        />
    </div>

    <!-- ============================================ -->
    <!-- RESOURCE USAGE CHART -->
    <!-- ============================================ -->
    <ResourceUsageChart 
        data={resourceUsage}
        period="7 hari terakhir"
    />

    <!-- ============================================ -->
    <!-- TENANT QUOTA TABLE -->
    <!-- ============================================ -->
    <TenantQuotaTable 
        tenants={tenantQuotas}
        {quotaLimits}
        {sortBy}
        {sortOrder}
        onSort={handleQuotaSort}
    />

    <!-- ============================================ -->
    <!-- ACTIVITY LOGS -->
    <!-- ============================================ -->
    <ActivityLogsTable 
        logs={activityLogs}
        pagination={logsPagination}
        filters={logFilters}
        onPageChange={handleLogPageChange}
        onFilter={handleLogFilter}
    />
</div>