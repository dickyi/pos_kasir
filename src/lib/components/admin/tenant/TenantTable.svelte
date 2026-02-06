<script>
    import { enhance } from '$app/forms';
    import { 
        Building2, Mail, Phone, Eye, Edit, Ban, Play, Trash2,
        CheckCircle, Clock, XCircle, ArrowUpDown 
    } from 'lucide-svelte';
    
    export let tenants = [];
    export let sortBy = 'created_at';
    export let onSort = (column) => {};
    export let onView = (tenant) => {};
    export let onEdit = (tenant) => {};
    export let onDelete = (tenant) => {};
    
    // Helper functions
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
    
    function formatRupiah(num) {
        const n = Number(num) || 0;
        if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(1) + ' Jt';
        if (n >= 1000) return 'Rp ' + (n / 1000).toFixed(0) + ' rb';
        return 'Rp ' + n.toLocaleString('id-ID');
    }
    
    function formatNumber(num) {
        return (Number(num) || 0).toLocaleString('id-ID');
    }
    
    function getStatusConfig(status) {
        const configs = {
            'aktif': { 
                label: 'Aktif', 
                color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                icon: CheckCircle,
                dot: 'bg-emerald-500'
            },
            'pending': { 
                label: 'Pending', 
                color: 'bg-amber-50 text-amber-700 border-amber-200',
                icon: Clock,
                dot: 'bg-amber-500'
            },
            'nonaktif': { 
                label: 'Nonaktif', 
                color: 'bg-gray-100 text-gray-600 border-gray-200',
                icon: XCircle,
                dot: 'bg-gray-400'
            }
        };
        return configs[status] || configs['nonaktif'];
    }
    
    // Column definitions
    const columns = [
        { key: 'nama_bisnis', label: 'Tenant', sortable: true },
        { key: 'kontak', label: 'Kontak', sortable: false, hideOnMobile: true },
        { key: 'produk', label: 'Produk', sortable: false, hideOnTablet: true, center: true },
        { key: 'transaksi', label: 'Transaksi', sortable: false, hideOnTablet: true, center: true },
        { key: 'status', label: 'Status', sortable: true, center: true },
        { key: 'created_at', label: 'Terdaftar', sortable: true, hideOnMobile: true, center: true },
        { key: 'aksi', label: 'Aksi', sortable: false, center: true }
    ];
</script>

<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full">
            <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                    {#each columns as col}
                        <th class="px-4 py-3 {col.hideOnMobile ? 'hidden md:table-cell' : ''} {col.hideOnTablet ? 'hidden lg:table-cell' : ''}">
                            {#if col.sortable}
                                <button 
                                    on:click={() => onSort(col.key)} 
                                    class="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700
                                           {col.center ? 'mx-auto' : ''}"
                                >
                                    {col.label}
                                    {#if sortBy === col.key}
                                        <ArrowUpDown size={12} class="text-gray-900" />
                                    {/if}
                                </button>
                            {:else}
                                <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide {col.center ? 'block text-center' : ''}">
                                    {col.label}
                                </span>
                            {/if}
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                {#if tenants.length > 0}
                    {#each tenants as tenant (tenant.id)}
                        {@const statusConfig = getStatusConfig(tenant.status)}
                        <tr class="hover:bg-gray-50 transition-colors">
                            <!-- Tenant Info -->
                            <td class="px-4 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 
                                                flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        {(tenant.nama_bisnis || 'T').charAt(0).toUpperCase()}
                                    </div>
                                    <div class="min-w-0">
                                        <p class="font-semibold text-gray-900 truncate">{tenant.nama_bisnis || '-'}</p>
                                        <p class="text-sm text-gray-500 truncate">{tenant.nama_pemilik || '-'}</p>
                                        <p class="text-xs text-gray-400 font-mono">{tenant.kode_pelanggan}</p>
                                    </div>
                                </div>
                            </td>
                            
                            <!-- Kontak -->
                            <td class="px-4 py-4 hidden md:table-cell">
                                <div class="space-y-1">
                                    {#if tenant.email}
                                        <p class="text-sm text-gray-600 flex items-center gap-1.5">
                                            <Mail size={12} class="text-gray-400 flex-shrink-0" />
                                            <span class="truncate max-w-[180px]">{tenant.email}</span>
                                        </p>
                                    {/if}
                                    {#if tenant.no_telepon}
                                        <p class="text-sm text-gray-600 flex items-center gap-1.5">
                                            <Phone size={12} class="text-gray-400 flex-shrink-0" />
                                            {tenant.no_telepon}
                                        </p>
                                    {/if}
                                    {#if !tenant.email && !tenant.no_telepon}
                                        <span class="text-sm text-gray-400">-</span>
                                    {/if}
                                </div>
                            </td>
                            
                            <!-- Produk -->
                            <td class="px-4 py-4 text-center hidden lg:table-cell">
                                <span class="inline-flex items-center justify-center w-10 h-10 rounded-lg 
                                             bg-blue-50 text-blue-700 font-semibold text-sm">
                                    {tenant.total_produk || 0}
                                </span>
                            </td>
                            
                            <!-- Transaksi -->
                            <td class="px-4 py-4 text-center hidden lg:table-cell">
                                <div>
                                    <p class="font-semibold text-gray-900">{formatNumber(tenant.total_transaksi || 0)}</p>
                                    <p class="text-xs text-emerald-600">{formatRupiah(tenant.total_gmv || 0)}</p>
                                </div>
                            </td>
                            
                            <!-- Status -->
                            <td class="px-4 py-4 text-center">
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full 
                                             text-xs font-medium border {statusConfig.color}">
                                    <span class="w-1.5 h-1.5 rounded-full {statusConfig.dot}"></span>
                                    {statusConfig.label}
                                </span>
                            </td>
                            
                            <!-- Terdaftar -->
                            <td class="px-4 py-4 text-center hidden md:table-cell">
                                <p class="text-sm text-gray-600">{formatDate(tenant.created_at)}</p>
                            </td>
                            
                            <!-- Aksi -->
                            <td class="px-4 py-4">
                                <div class="flex items-center justify-center gap-1">
                                    <!-- View -->
                                    <button 
                                        on:click={() => onView(tenant)}
                                        class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                                        title="Lihat Detail"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    
                                    <!-- Edit -->
                                    <button 
                                        on:click={() => onEdit(tenant)}
                                        class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    
                                    <!-- Status Actions -->
                                    {#if tenant.status === 'pending'}
                                        <form method="POST" action="?/approve" use:enhance class="inline">
                                            <input type="hidden" name="id" value={tenant.id} />
                                            <button 
                                                type="submit"
                                                class="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                                                title="Setujui"
                                            >
                                                <CheckCircle size={16} />
                                            </button>
                                        </form>
                                    {:else if tenant.status === 'aktif'}
                                        <form method="POST" action="?/suspend" use:enhance class="inline">
                                            <input type="hidden" name="id" value={tenant.id} />
                                            <button 
                                                type="submit"
                                                class="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                                title="Nonaktifkan"
                                            >
                                                <Ban size={16} />
                                            </button>
                                        </form>
                                    {:else}
                                        <form method="POST" action="?/activate" use:enhance class="inline">
                                            <input type="hidden" name="id" value={tenant.id} />
                                            <button 
                                                type="submit"
                                                class="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                                                title="Aktifkan"
                                            >
                                                <Play size={16} />
                                            </button>
                                        </form>
                                    {/if}
                                    
                                    <!-- Delete -->
                                    <button 
                                        on:click={() => onDelete(tenant)}
                                        class="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Hapus"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                {:else}
                    <tr>
                        <td colspan="7" class="px-4 py-16 text-center">
                            <Building2 size={48} class="mx-auto mb-4 text-gray-300" />
                            <p class="text-gray-500 font-medium">Tidak ada tenant ditemukan</p>
                            <p class="text-sm text-gray-400 mt-1">Coba ubah filter pencarian atau tambah tenant baru</p>
                        </td>
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>
</div>