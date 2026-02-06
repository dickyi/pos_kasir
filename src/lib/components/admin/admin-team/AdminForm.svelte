<script>
    import { enhance } from '$app/forms';
    import { X, User, Mail, Phone, Shield, Eye, EyeOff, Key } from 'lucide-svelte';
    
    export let mode = 'add'; // 'add' or 'edit'
    export let admin = null;
    export let show = false;
    export let onClose = () => {};
    
    let showPassword = false;
    let isSubmitting = false;
    
    // Form data
    let formData = {
        nama: '',
        username: '',
        email: '',
        no_telepon: '',
        password: '',
        role: 'admin',
        status: 'aktif'
    };
    
    // Reset form saat mode atau admin berubah
    $: if (show) {
        if (mode === 'edit' && admin) {
            formData = {
                nama: admin.nama || '',
                username: admin.username || '',
                email: admin.email || '',
                no_telepon: admin.no_telepon || '',
                password: '', // Password tidak ditampilkan saat edit
                role: admin.role || 'admin',
                status: admin.status || 'aktif'
            };
        } else {
            formData = {
                nama: '',
                username: '',
                email: '',
                no_telepon: '',
                password: '',
                role: 'admin',
                status: 'aktif'
            };
        }
        showPassword = false;
        isSubmitting = false;
    }
    
    function generateUsername() {
        if (formData.nama) {
            const base = formData.nama.toLowerCase().replace(/\s+/g, '.');
            const random = Math.floor(Math.random() * 100);
            formData.username = `${base}${random}`;
        }
    }
    
    function generatePassword() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        formData.password = password;
        showPassword = true;
    }
    
    const roles = [
        { value: 'super_admin', label: 'Super Admin', desc: 'Akses penuh ke semua fitur' },
        { value: 'admin', label: 'Admin', desc: 'Kelola tenant dan monitoring' },
        { value: 'support', label: 'Support', desc: 'Bantuan dan support tenant' }
    ];
</script>

{#if show}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 transition-opacity" on:click={onClose}></div>
        
        <!-- Modal -->
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg animate-modal-in">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <User size={20} class="text-gray-400" />
                        {mode === 'add' ? 'Tambah Admin Baru' : 'Edit Admin'}
                    </h3>
                    <button on:click={onClose} class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} class="text-gray-500" />
                    </button>
                </div>
                
                <!-- Form -->
                <form 
                    method="POST" 
                    action={mode === 'add' ? '?/create' : '?/update'}
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
                    class="p-6 space-y-4"
                >
                    {#if mode === 'edit' && admin}
                        <input type="hidden" name="id" value={admin.id} />
                    {/if}
                    
                    <!-- Nama Lengkap -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">
                            Nama Lengkap <span class="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="nama"
                            bind:value={formData.nama}
                            on:blur={mode === 'add' ? generateUsername : null}
                            required
                            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm 
                                   focus:outline-none focus:ring-2 focus:ring-gray-900"
                            placeholder="Masukkan nama lengkap"
                        />
                    </div>
                    
                    <!-- Username -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">
                            Username <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                            <input
                                type="text"
                                name="username"
                                bind:value={formData.username}
                                required
                                class="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm 
                                       focus:outline-none focus:ring-2 focus:ring-gray-900"
                                placeholder="username"
                            />
                        </div>
                    </div>
                    
                    <!-- Email & Telepon -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                Email <span class="text-red-500">*</span>
                            </label>
                            <div class="relative">
                                <Mail size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    bind:value={formData.email}
                                    required
                                    class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm 
                                           focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    placeholder="email@domain.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                No. Telepon
                            </label>
                            <div class="relative">
                                <Phone size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="tel"
                                    name="no_telepon"
                                    bind:value={formData.no_telepon}
                                    class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm 
                                           focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    placeholder="08xxxxxxxxxx"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <!-- Password (only for add or optional for edit) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">
                            Password {mode === 'add' ? '' : '(Kosongkan jika tidak diubah)'}
                            {#if mode === 'add'}<span class="text-red-500">*</span>{/if}
                        </label>
                        <div class="relative">
                            <Key size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                bind:value={formData.password}
                                required={mode === 'add'}
                                minlength={mode === 'add' ? 8 : undefined}
                                class="w-full pl-10 pr-20 py-2.5 border border-gray-200 rounded-lg text-sm 
                                       focus:outline-none focus:ring-2 focus:ring-gray-900"
                                placeholder={mode === 'add' ? 'Minimal 8 karakter' : '••••••••'}
                            />
                            <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button
                                    type="button"
                                    on:click={() => showPassword = !showPassword}
                                    class="p-1.5 hover:bg-gray-100 rounded text-gray-400"
                                >
                                    {#if showPassword}
                                        <EyeOff size={16} />
                                    {:else}
                                        <Eye size={16} />
                                    {/if}
                                </button>
                                <button
                                    type="button"
                                    on:click={generatePassword}
                                    class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                                >
                                    Generate
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Role -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">
                            Role <span class="text-red-500">*</span>
                        </label>
                        <div class="space-y-2">
                            {#each roles as role}
                                <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors
                                             {formData.role === role.value ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}">
                                    <input
                                        type="radio"
                                        name="role"
                                        value={role.value}
                                        bind:group={formData.role}
                                        class="w-4 h-4 text-gray-900 focus:ring-gray-900"
                                    />
                                    <div>
                                        <p class="font-medium text-gray-900 text-sm">{role.label}</p>
                                        <p class="text-xs text-gray-500">{role.desc}</p>
                                    </div>
                                </label>
                            {/each}
                        </div>
                    </div>
                    
                    <!-- Status (only for edit) -->
                    {#if mode === 'edit'}
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                            <select
                                name="status"
                                bind:value={formData.status}
                                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm 
                                       focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                            >
                                <option value="aktif">Aktif</option>
                                <option value="nonaktif">Nonaktif</option>
                            </select>
                        </div>
                    {/if}
                </form>
                
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
                    <button
                        type="submit"
                        form="admin-form"
                        disabled={isSubmitting}
                        class="px-4 py-2.5 text-sm font-medium text-white bg-gray-900 
                               rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50
                               flex items-center gap-2"
                    >
                        {#if isSubmitting}
                            <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        {/if}
                        {mode === 'add' ? 'Tambah Admin' : 'Simpan Perubahan'}
                    </button>
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