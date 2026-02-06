<script>
    import { enhance } from '$app/forms';
    import { X, AlertTriangle, User, Trash2, Shield } from 'lucide-svelte';
    
    export let admin = null;
    export let show = false;
    export let onClose = () => {};
    
    let isSubmitting = false;
    let confirmText = '';
    
    $: canDelete = confirmText.toLowerCase() === (admin?.username || '').toLowerCase();
</script>

{#if show && admin}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 transition-opacity" on:click={onClose}></div>
        
        <!-- Modal -->
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md animate-modal-in">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-red-100 bg-red-50 rounded-t-2xl">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle size={24} class="text-red-600" />
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-red-900">Hapus Admin</h3>
                            <p class="text-sm text-red-600">Tindakan ini tidak dapat dibatalkan</p>
                        </div>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="p-6">
                    <!-- Admin Info -->
                    <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-4">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold">
                            {(admin.nama || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="font-semibold text-gray-900">{admin.nama || '-'}</p>
                            <p class="text-sm text-gray-500">@{admin.username}</p>
                        </div>
                    </div>
                    
                    <!-- Warning -->
                    <div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <p class="font-medium mb-1">⚠️ Perhatian:</p>
                        <ul class="list-disc list-inside space-y-1 text-amber-700">
                            <li>Semua data admin akan dihapus permanen</li>
                            <li>Riwayat aktivitas akan dihapus</li>
                            <li>Admin tidak dapat dikembalikan</li>
                        </ul>
                    </div>
                    
                    <!-- Confirmation -->
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
                        <input type="hidden" name="id" value={admin.id} />
                        
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Ketik <strong class="text-red-600">{admin.username}</strong> untuk konfirmasi:
                        </label>
                        <input
                            type="text"
                            bind:value={confirmText}
                            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm 
                                   focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Ketik username admin"
                        />
                        
                        <!-- Buttons -->
                        <div class="flex items-center gap-3 mt-6">
                            <button
                                type="button"
                                on:click={onClose}
                                disabled={isSubmitting}
                                class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 
                                       rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={!canDelete || isSubmitting}
                                class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 
                                       rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50
                                       disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {#if isSubmitting}
                                    <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                {:else}
                                    <Trash2 size={16} />
                                {/if}
                                Hapus Permanen
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    @keyframes modal-in {
        from { opacity: 0; transform: scale(0.95) translateY(-10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-modal-in { animation: modal-in 0.2s ease-out; }
</style>