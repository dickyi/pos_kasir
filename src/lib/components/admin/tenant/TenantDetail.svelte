<script>
    import { enhance } from '$app/forms';
    import { 
        X, Copy, Mail, Phone, MapPin, Store, Users,
        Package, ShoppingCart, TrendingUp, Calendar,
        CheckCircle, Clock, XCircle, Edit, Ban, Play
    } from 'lucide-svelte';
    
    export let tenant = null;
    export let show = false;
    export let onClose = () => {};
    export let onEdit = (tenant) => {};
    
    // Helper functions
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
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
    
    function formatRupiah(num) {
        const n = Number(num) || 0;
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
                dot: 'bg-emerald-500'
            },
            'pending': { 
                label: 'Pending', 
                color: 'bg-amber-50 text-amber-700 border-amber-200',
                dot: 'bg-amber-500'
            },
            'nonaktif': { 
                label: 'Nonaktif', 
                color: 'bg-gray-100 text-gray-600 border-gray-200',
                dot: 'bg-gray-400'
            }
        };
        return configs[status] || configs['nonaktif'];
    }
    
    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        }
    }
    
    $: statusConfig = tenant ? getStatusConfig(tenant.status) : null;
</script>

{#if show && tenant}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div 
            class="fixed inset-0 bg-black/50 transition-opacity" 
            on:click={onClose}
            on:keydown={(e) => e.key === 'Escape' && onClose()}
            role="button"
            tabindex="0"
        ></div>
        
        <!-- Modal -->
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-modal-in">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900">Detail Tenant</h3>
                    <button 
                        on:click={onClose} 
                        class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} class="text-gray-500" />
                    </button>
                </div>
                
                <!-- Content -->
                <div class="p-6 max-h-[70vh] overflow-y-auto">
                    <!-- Header Info -->
                    <div class="flex items-start gap-4 mb-6">
                        <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 
                                    flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                            {(tenant.nama_bisnis || 'T').charAt(0).toUpperCase()}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between gap-4">
                                <div>
                                    <h4 class="text-xl font-bold text-gray-900">{tenant.nama_bisnis || '-'}</h4>
                                    <p class="text-gray-500">{tenant.nama_pemilik || '-'}</p>
                                </div>
                                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                                             text-sm font-medium border {statusConfig.color} flex-shrink-0">
                                    <span class="w-2 h-2 rounded-full {statusConfig.dot}"></span>
                                    {statusConfig.label}
                                </span>
                            </div>
                            <div class="flex items-center gap-2 mt-2">
                                <span class="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600">
                                    {tenant.kode_pelanggan}
                                </span>
                                <button 
                                    on:click={() => copyToClipboard(tenant.kode_pelanggan)}
                                    class="p-1 hover:bg-gray-100 rounded transition-colors"
                                    title="Salin kode"
                                >
                                    <Copy size={12} class="text-gray-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Info Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Kontak -->
                        <div class="space-y-4">
                            <h5 class="font-semibold text-gray-900 flex items-center gap-2">
                                <Users size={16} class="text-gray-400" />
                                Informasi Kontak
                            </h5>
                            <div class="space-y-3 text-sm">
                                <div class="flex items-center gap-3">
                                    <Mail size={16} class="text-gray-400 flex-shrink-0" />
                                    <span class="text-gray-600">{tenant.email || '-'}</span>
                                </div>
                                <div class="flex items-center gap-3">
                                    <Phone size={16} class="text-gray-400 flex-shrink-0" />
                                    <span class="text-gray-600">{tenant.no_telepon || '-'}</span>
                                </div>
                                <div class="flex items-start gap-3">
                                    <MapPin size={16} class="text-gray-400 flex-shrink-0 mt-0.5" />
                                    <span class="text-gray-600">{tenant.alamat || '-'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Bisnis Info -->
                        <div class="space-y-4">
                            <h5 class="font-semibold text-gray-900 flex items-center gap-2">
                                <Store size={16} class="text-gray-400" />
                                Informasi Bisnis
                            </h5>
                            <div class="space-y-3 text-sm">
                                <div class="flex items-center justify-between">
                                    <span class="text-gray-500">Jenis Usaha</span>
                                    <span class="text-gray-900 font-medium">{tenant.jenis_usaha || '-'}</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-gray-500">Tanggal Daftar</span>
                                    <span class="text-gray-900 font-medium">{formatDate(tenant.created_at)}</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-gray-500">Terakhir Update</span>
                                    <span class="text-gray-900 font-medium">{formatDateTime(tenant.updated_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Stats Cards -->
                    <div class="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
                        <div class="text-center p-4 bg-blue-50 rounded-xl">
                            <Package size={24} class="mx-auto text-blue-600 mb-2" />
                            <p class="text-2xl font-bold text-blue-700">{formatNumber(tenant.total_produk || 0)}</p>
                            <p class="text-xs text-blue-600">Total Produk</p>
                        </div>
                        <div class="text-center p-4 bg-purple-50 rounded-xl">
                            <ShoppingCart size={24} class="mx-auto text-purple-600 mb-2" />
                            <p class="text-2xl font-bold text-purple-700">{formatNumber(tenant.total_transaksi || 0)}</p>
                            <p class="text-xs text-purple-600">Total Transaksi</p>
                        </div>
                        <div class="text-center p-4 bg-emerald-50 rounded-xl">
                            <TrendingUp size={24} class="mx-auto text-emerald-600 mb-2" />
                            <p class="text-2xl font-bold text-emerald-700">{formatRupiah(tenant.total_gmv || 0)}</p>
                            <p class="text-xs text-emerald-600">Total GMV</p>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <!-- Status Actions -->
                    <div class="flex items-center gap-2">
                        {#if tenant.status === 'pending'}
                            <form method="POST" action="?/approve" use:enhance={() => {
                                return async ({ result, update }) => {
                                    if (result.type === 'success' && result.data?.success) {
                                        onClose();
                                    }
                                    await update();
                                };
                            }}>
                                <input type="hidden" name="id" value={tenant.id} />
                                <button 
                                    type="submit" 
                                    class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 
                                           rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                >
                                    <CheckCircle size={16} />
                                    Setujui Tenant
                                </button>
                            </form>
                        {:else if tenant.status === 'aktif'}
                            <form method="POST" action="?/suspend" use:enhance={() => {
                                return async ({ result, update }) => {
                                    if (result.type === 'success' && result.data?.success) {
                                        onClose();
                                    }
                                    await update();
                                };
                            }}>
                                <input type="hidden" name="id" value={tenant.id} />
                                <button 
                                    type="submit" 
                                    class="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 
                                           rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                                >
                                    <Ban size={16} />
                                    Nonaktifkan
                                </button>
                            </form>
                        {:else}
                            <form method="POST" action="?/activate" use:enhance={() => {
                                return async ({ result, update }) => {
                                    if (result.type === 'success' && result.data?.success) {
                                        onClose();
                                    }
                                    await update();
                                };
                            }}>
                                <input type="hidden" name="id" value={tenant.id} />
                                <button 
                                    type="submit" 
                                    class="px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 
                                           rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2"
                                >
                                    <Play size={16} />
                                    Aktifkan
                                </button>
                            </form>
                        {/if}
                    </div>
                    
                    <!-- Edit & Close -->
                    <div class="flex items-center gap-2">
                        <button
                            on:click={() => { onClose(); onEdit(tenant); }}
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 
                                   rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <Edit size={16} />
                            Edit
                        </button>
                        <button
                            on:click={onClose}
                            class="px-4 py-2 text-sm font-medium text-white bg-gray-900 
                                   rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    @keyframes modal-in {
        from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }
    
    .animate-modal-in {
        animation: modal-in 0.2s ease-out;
    }
</style>