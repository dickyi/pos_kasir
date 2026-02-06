<script>
    import { enhance } from '$app/forms';
    import { X, RefreshCw } from 'lucide-svelte';
    
    export let mode = 'add'; // 'add' atau 'edit'
    export let tenant = null;
    export let show = false;
    export let onClose = () => {};
    
    // Form data
    let formData = {
        id: '',
        kode_pelanggan: '',
        nama_bisnis: '',
        nama_pemilik: '',
        email: '',
        no_telepon: '',
        alamat: '',
        jenis_usaha: '',
        status: 'aktif'
    };
    
    // Reset form saat modal dibuka
    $: if (show) {
        if (mode === 'edit' && tenant) {
            formData = {
                id: tenant.id || '',
                kode_pelanggan: tenant.kode_pelanggan || '',
                nama_bisnis: tenant.nama_bisnis || '',
                nama_pemilik: tenant.nama_pemilik || '',
                email: tenant.email || '',
                no_telepon: tenant.no_telepon || '',
                alamat: tenant.alamat || '',
                jenis_usaha: tenant.jenis_usaha || '',
                status: tenant.status || 'aktif'
            };
        } else {
            formData = {
                id: '',
                kode_pelanggan: '',
                nama_bisnis: '',
                nama_pemilik: '',
                email: '',
                no_telepon: '',
                alamat: '',
                jenis_usaha: '',
                status: 'aktif'
            };
            generateKode();
        }
    }
    
    // Generate kode tenant
    function generateKode() {
        const prefix = 'TN';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        formData.kode_pelanggan = `${prefix}${timestamp}${random}`;
    }
    
    // Jenis usaha options
    const jenisUsahaOptions = [
        { value: '', label: 'Pilih jenis usaha' },
        { value: 'Retail', label: 'Retail / Toko' },
        { value: 'FnB', label: 'Food & Beverage' },
        { value: 'Fashion', label: 'Fashion / Pakaian' },
        { value: 'Elektronik', label: 'Elektronik' },
        { value: 'Apotek', label: 'Apotek / Kesehatan' },
        { value: 'Jasa', label: 'Jasa' },
        { value: 'Lainnya', label: 'Lainnya' }
    ];
    
    // Status options
    const statusOptions = [
        { value: 'aktif', label: 'Aktif' },
        { value: 'pending', label: 'Pending' },
        { value: 'nonaktif', label: 'Nonaktif' }
    ];
</script>

{#if show}
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
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg animate-modal-in">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900">
                        {mode === 'add' ? 'Tambah Tenant Baru' : 'Edit Tenant'}
                    </h3>
                    <button 
                        on:click={onClose} 
                        class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} class="text-gray-500" />
                    </button>
                </div>
                
                <!-- Form -->
                <form 
                    method="POST" 
                    action={mode === 'add' ? '?/create' : '?/update'} 
                    use:enhance={() => {
                        return async ({ result, update }) => {
                            if (result.type === 'success' && result.data?.success) {
                                onClose();
                            }
                            await update();
                        };
                    }}
                >
                    {#if mode === 'edit'}
                        <input type="hidden" name="id" value={formData.id} />
                    {/if}
                    
                    <div class="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        <!-- Kode Pelanggan -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                Kode Tenant
                            </label>
                            <div class="flex gap-2">
                                <input
                                    type="text"
                                    name="kode_pelanggan"
                                    bind:value={formData.kode_pelanggan}
                                    required
                                    readonly={mode === 'edit'}
                                    class="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm 
                                           focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono
                                           {mode === 'edit' ? 'bg-gray-50' : ''}"
                                    placeholder="TN..."
                                />
                                {#if mode === 'add'}
                                    <button 
                                        type="button" 
                                        on:click={generateKode}
                                        class="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 
                                               transition-colors flex items-center gap-1.5"
                                        title="Generate kode baru"
                                    >
                                        <RefreshCw size={16} />
                                        <span class="hidden sm:inline text-sm">Generate</span>
                                    </button>
                                {/if}
                            </div>
                        </div>
                        
                        <!-- Nama Bisnis -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                Nama Bisnis <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="nama_bisnis"
                                bind:value={formData.nama_bisnis}
                                required
                                class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm 
                                       focus:outline-none focus:ring-2 focus:ring-gray-900"
                                placeholder="Nama toko/usaha"
                            />
                        </div>
                        
                        <!-- Nama Pemilik -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                Nama Pemilik <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="nama_pemilik"
                                bind:value={formData.nama_pemilik}
                                required
                                class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm 
                                       focus:outline-none focus:ring-2 focus:ring-gray-900"
                                placeholder="Nama lengkap pemilik"
                            />
                        </div>
                        
                        <!-- Email & Telepon -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    bind:value={formData.email}
                                    class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm 
                                           focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    placeholder="email@contoh.com"
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    No. Telepon
                                </label>
                                <input
                                    type="tel"
                                    name="no_telepon"
                                    bind:value={formData.no_telepon}
                                    class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm 
                                           focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    placeholder="08xxxxxxxxxx"
                                />
                            </div>
                        </div>
                        
                        <!-- Jenis Usaha -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                Jenis Usaha
                            </label>
                            <select
                                name="jenis_usaha"
                                bind:value={formData.jenis_usaha}
                                class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm 
                                       focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                            >
                                {#each jenisUsahaOptions as option}
                                    <option value={option.value}>{option.label}</option>
                                {/each}
                            </select>
                        </div>
                        
                        <!-- Alamat -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                Alamat
                            </label>
                            <textarea
                                name="alamat"
                                bind:value={formData.alamat}
                                rows="2"
                                class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm 
                                       focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                                placeholder="Alamat lengkap"
                            ></textarea>
                        </div>
                        
                        <!-- Status -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                Status
                            </label>
                            <select
                                name="status"
                                bind:value={formData.status}
                                class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm 
                                       focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                            >
                                {#each statusOptions as option}
                                    <option value={option.value}>{option.label}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            on:click={onClose}
                            class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 
                                   rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            class="px-4 py-2.5 text-sm font-medium text-white bg-gray-900 
                                   rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            {mode === 'add' ? 'Simpan Tenant' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
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