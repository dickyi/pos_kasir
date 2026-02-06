<script>
    import { enhance } from '$app/forms';
    import { AlertTriangle, X, Trash2, Archive } from 'lucide-svelte';
    
    export let tenant = null;
    export let show = false;
    export let onClose = () => {};
    
    let reason = '';
    let isSubmitting = false;
    
    // Reset reason saat modal dibuka
    $: if (show) {
        reason = '';
        isSubmitting = false;
    }
    
    function formatNumber(num) {
        return (Number(num) || 0).toLocaleString('id-ID');
    }
    
    $: hasTransactions = tenant?.total_transaksi > 0;
    $: actionType = hasTransactions ? 'arsip' : 'hapus permanen';
    $: actionIcon = hasTransactions ? Archive : Trash2;
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
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md animate-modal-in">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <AlertTriangle size={20} class="text-red-500" />
                        Konfirmasi {hasTransactions ? 'Arsip' : 'Hapus'}
                    </h3>
                    <button 
                        on:click={onClose} 
                        class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} class="text-gray-500" />
                    </button>
                </div>
                
                <!-- Content -->
                <div class="p-6">
                    <div class="flex items-start gap-4 mb-4">
                        <div class="w-12 h-12 rounded-xl {hasTransactions ? 'bg-amber-100' : 'bg-red-100'} flex items-center justify-center flex-shrink-0">
                            <svelte:component this={actionIcon} size={24} class={hasTransactions ? 'text-amber-600' : 'text-red-600'} />
                        </div>
                        <div>
                            <p class="text-gray-900 font-medium">
                                {hasTransactions ? 'Arsipkan' : 'Hapus'} tenant "{tenant.nama_bisnis}"?
                            </p>
                            <p class="text-sm text-gray-500 mt-1">
                                Kode: <span class="font-mono">{tenant.kode_pelanggan}</span>
                            </p>
                        </div>
                    </div>
                    
                    <!-- Warning -->
                    <div class="{hasTransactions ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4 mb-4">
                        <p class="text-sm {hasTransactions ? 'text-amber-800' : 'text-red-800'}">
                            <strong>Perhatian:</strong> 
                            {#if hasTransactions}
                                Tenant ini memiliki <strong>{formatNumber(tenant.total_transaksi)} transaksi</strong>.
                            {:else}
                                Tindakan ini tidak dapat dibatalkan.
                            {/if}
                        </p>
                        <p class="text-sm {hasTransactions ? 'text-amber-700' : 'text-red-700'} mt-2">
                            {#if hasTransactions}
                                Data akan dipindahkan ke <strong>Arsip</strong> dan bisa direstore nanti.
                            {:else}
                                Tenant ini belum memiliki transaksi. Data akan <strong>dihapus permanen</strong>.
                            {/if}
                        </p>
                    </div>
                    
                    <!-- Info tenant -->
                    <div class="bg-gray-50 rounded-lg p-4 space-y-2 text-sm mb-4">
                        <div class="flex justify-between">
                            <span class="text-gray-500">Pemilik</span>
                            <span class="text-gray-900">{tenant.nama_pemilik || '-'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">Email</span>
                            <span class="text-gray-900">{tenant.email || '-'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">Total Produk</span>
                            <span class="text-gray-900">{formatNumber(tenant.total_produk || 0)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">Total Transaksi</span>
                            <span class="text-gray-900 font-medium">{formatNumber(tenant.total_transaksi || 0)}</span>
                        </div>
                    </div>
                    
                    <!-- Alasan -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">
                            Alasan {hasTransactions ? 'Arsip' : 'Hapus'} <span class="text-gray-400">(opsional)</span>
                        </label>
                        <textarea
                            bind:value={reason}
                            rows="2"
                            class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm 
                                   focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                            placeholder="Masukkan alasan..."
                        ></textarea>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                    <button
                        on:click={onClose}
                        disabled={isSubmitting}
                        class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 
                               rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <form 
                        method="POST" 
                        action="?/delete" 
                        use:enhance={() => {
                            isSubmitting = true;
                            return async ({ result, update }) => {
                                isSubmitting = false;
                                if (result.type === 'success' && result.data?.success) {
                                    onClose();
                                }
                                await update();
                            };
                        }}
                    >
                        <input type="hidden" name="id" value={tenant.id} />
                        <input type="hidden" name="reason" value={reason} />
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            class="px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors 
                                   flex items-center gap-2 disabled:opacity-50
                                   {hasTransactions ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'}"
                        >
                            <svelte:component this={actionIcon} size={16} />
                            {isSubmitting ? 'Memproses...' : (hasTransactions ? 'Ya, Arsipkan' : 'Ya, Hapus Permanen')}
                        </button>
                    </form>
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