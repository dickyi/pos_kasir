<script>
    import { 
        Package, Users, Image, HardDrive, AlertTriangle, 
        CheckCircle, XCircle, ChevronUp, ChevronDown, Search,
        Settings, ExternalLink
    } from 'lucide-svelte';
    
    export let tenants = [];
    export let quotaLimits = {
        maxProduk: 100,
        maxUser: 5,
        maxStorage: 500 // MB
    };
    export let sortBy = 'usage_percent';
    export let sortOrder = 'desc';
    export let onSort = (column) => {};
    export let onManageQuota = (tenant) => {};
    
    function formatNumber(num) {
        return (Number(num) || 0).toLocaleString('id-ID');
    }
    
    function getUsageStatus(used, max) {
        const percent = max > 0 ? (used / max) * 100 : 0;
        if (percent >= 100) return { status: 'exceeded', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle };
        if (percent >= 80) return { status: 'critical', color: 'text-red-500', bg: 'bg-red-50', icon: AlertTriangle };
        if (percent >= 60) return { status: 'warning', color: 'text-amber-500', bg: 'bg-amber-50', icon: AlertTriangle };
        return { status: 'normal', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle };
    }
    
    function calcOverallUsage(tenant) {
        const produkUsage = quotaLimits.maxProduk > 0 ? (tenant.total_produk / quotaLimits.maxProduk) * 100 : 0;
        const userUsage = quotaLimits.maxUser > 0 ? (tenant.total_user / quotaLimits.maxUser) * 100 : 0;
        const storageUsage = quotaLimits.maxStorage > 0 ? (tenant.storage_used / quotaLimits.maxStorage) * 100 : 0;
        return Math.max(produkUsage, userUsage, storageUsage);
    }
</script>

<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
            <h3 class="font-semibold text-gray-900 flex items-center gap-2">
                <Package size={18} class="text-gray-400" />
                Tenant Quota & Limits
            </h3>
            <p class="text-sm text-gray-500 mt-0.5">Monitor penggunaan resource per tenant</p>
        </div>
        <div class="text-right text-xs text-gray-500">
            <p>Default Limits: {quotaLimits.maxProduk} produk, {quotaLimits.maxUser} user, {quotaLimits.maxStorage} MB</p>
        </div>
    </div>
    
    <!-- Table -->
    <div class="overflow-x-auto">
        <table class="w-full">
            <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                    <th class="px-4 py-3 text-left">
                        <span class="text-xs font-semibold text-gray-500 uppercase">Tenant</span>
                    </th>
                    <th class="px-4 py-3 text-center">
                        <button 
                            on:click={() => onSort('total_produk')}
                            class="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mx-auto hover:text-gray-700"
                        >
                            <Package size={12} />
                            Produk
                            {#if sortBy === 'total_produk'}
                                {#if sortOrder === 'desc'}<ChevronDown size={12} />{:else}<ChevronUp size={12} />{/if}
                            {/if}
                        </button>
                    </th>
                    <th class="px-4 py-3 text-center hidden md:table-cell">
                        <button 
                            on:click={() => onSort('total_user')}
                            class="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mx-auto hover:text-gray-700"
                        >
                            <Users size={12} />
                            User
                            {#if sortBy === 'total_user'}
                                {#if sortOrder === 'desc'}<ChevronDown size={12} />{:else}<ChevronUp size={12} />{/if}
                            {/if}
                        </button>
                    </th>
                    <th class="px-4 py-3 text-center hidden lg:table-cell">
                        <button 
                            on:click={() => onSort('storage_used')}
                            class="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mx-auto hover:text-gray-700"
                        >
                            <HardDrive size={12} />
                            Storage
                            {#if sortBy === 'storage_used'}
                                {#if sortOrder === 'desc'}<ChevronDown size={12} />{:else}<ChevronUp size={12} />{/if}
                            {/if}
                        </button>
                    </th>
                    <th class="px-4 py-3 text-center">
                        <button 
                            on:click={() => onSort('usage_percent')}
                            class="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mx-auto hover:text-gray-700"
                        >
                            Overall
                            {#if sortBy === 'usage_percent'}
                                {#if sortOrder === 'desc'}<ChevronDown size={12} />{:else}<ChevronUp size={12} />{/if}
                            {/if}
                        </button>
                    </th>
                    <th class="px-4 py-3 text-center">
                        <span class="text-xs font-semibold text-gray-500 uppercase">Status</span>
                    </th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                {#if tenants.length > 0}
                    {#each tenants as tenant (tenant.id)}
                        {@const produkUsage = getUsageStatus(tenant.total_produk, tenant.quota_produk || quotaLimits.maxProduk)}
                        {@const userUsage = getUsageStatus(tenant.total_user, tenant.quota_user || quotaLimits.maxUser)}
                        {@const storageUsage = getUsageStatus(tenant.storage_used, tenant.quota_storage || quotaLimits.maxStorage)}
                        {@const overallPercent = calcOverallUsage(tenant)}
                        {@const overallUsage = getUsageStatus(overallPercent, 100)}
                        <tr class="hover:bg-gray-50 transition-colors">
                            <!-- Tenant -->
                            <td class="px-4 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                                        {(tenant.nama_bisnis || 'T').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p class="font-medium text-gray-900">{tenant.nama_bisnis}</p>
                                        <p class="text-xs text-gray-500">{tenant.kode_pelanggan}</p>
                                    </div>
                                </div>
                            </td>
                            
                            <!-- Produk -->
                            <td class="px-4 py-4">
                                <div class="flex flex-col items-center">
                                    <span class="text-sm font-medium {produkUsage.color}">
                                        {formatNumber(tenant.total_produk)} / {formatNumber(tenant.quota_produk || quotaLimits.maxProduk)}
                                    </span>
                                    <div class="w-20 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                        <div 
                                            class="h-full {produkUsage.bg.replace('bg-', 'bg-').replace('-50', '-400')}"
                                            style="width: {Math.min((tenant.total_produk / (tenant.quota_produk || quotaLimits.maxProduk)) * 100, 100)}%"
                                        ></div>
                                    </div>
                                </div>
                            </td>
                            
                            <!-- User -->
                            <td class="px-4 py-4 hidden md:table-cell">
                                <div class="flex flex-col items-center">
                                    <span class="text-sm font-medium {userUsage.color}">
                                        {formatNumber(tenant.total_user)} / {formatNumber(tenant.quota_user || quotaLimits.maxUser)}
                                    </span>
                                    <div class="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                        <div 
                                            class="h-full {userUsage.bg.replace('bg-', 'bg-').replace('-50', '-400')}"
                                            style="width: {Math.min((tenant.total_user / (tenant.quota_user || quotaLimits.maxUser)) * 100, 100)}%"
                                        ></div>
                                    </div>
                                </div>
                            </td>
                            
                            <!-- Storage -->
                            <td class="px-4 py-4 hidden lg:table-cell">
                                <div class="flex flex-col items-center">
                                    <span class="text-sm font-medium {storageUsage.color}">
                                        {tenant.storage_used || 0} / {tenant.quota_storage || quotaLimits.maxStorage} MB
                                    </span>
                                    <div class="w-20 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                        <div 
                                            class="h-full {storageUsage.bg.replace('bg-', 'bg-').replace('-50', '-400')}"
                                            style="width: {Math.min((tenant.storage_used / (tenant.quota_storage || quotaLimits.maxStorage)) * 100, 100)}%"
                                        ></div>
                                    </div>
                                </div>
                            </td>
                            
                            <!-- Overall -->
                            <td class="px-4 py-4">
                                <div class="flex flex-col items-center">
                                    <span class="text-sm font-bold {overallUsage.color}">
                                        {overallPercent.toFixed(0)}%
                                    </span>
                                </div>
                            </td>
                            
                            <!-- Status -->
                            <td class="px-4 py-4">
                                <div class="flex items-center justify-center gap-2">
                                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium {overallUsage.bg} {overallUsage.color}">
                                        <svelte:component this={overallUsage.icon} size={12} />
                                        {overallUsage.status === 'exceeded' ? 'Exceeded' : 
                                         overallUsage.status === 'critical' ? 'Critical' :
                                         overallUsage.status === 'warning' ? 'Warning' : 'Normal'}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    {/each}
                {:else}
                    <tr>
                        <td colspan="6" class="px-4 py-12 text-center text-gray-500">
                            Tidak ada data tenant
                        </td>
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>
</div>