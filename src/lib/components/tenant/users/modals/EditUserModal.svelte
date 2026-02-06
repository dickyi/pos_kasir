<!--
    EditUserModal.svelte - Modal Edit User
    =======================================
    Form untuk mengedit informasi user
-->
<script>
    import { enhance } from '$app/forms';
    import { ShieldCheck, AlertTriangle } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';

    export let show = false;
    export let user = null;
    export let isSubmitting = false;

    const dispatch = createEventDispatcher();

    // Form state
    let form = {
        user_id: '',
        nama: '',
        email: '',
        role: '',
        no_telepon: '',
        status: '',
        new_password: ''
    };

    // Sync form when user changes
    $: if (user) {
        form = {
            user_id: user.id,
            nama: user.nama,
            email: user.email,
            role: user.role,
            no_telepon: user.no_telepon || '',
            status: user.status,
            new_password: ''
        };
    }

    function close() {
        dispatch('close');
    }

    function handleSubmit() {
        dispatch('submitting');
        return async ({ result }) => {
            dispatch('submitted', result);
        };
    }
</script>

{#if show && user}
    <div 
        class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" 
        on:click|self={close}
        on:keydown={(e) => e.key === 'Escape' && close()}
        role="dialog"
        aria-modal="true"
    >
        <div class="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <!-- Header -->
            <div class="p-5 border-b border-gray-100">
                <h2 class="text-lg font-semibold text-gray-900">Edit User</h2>
                <p class="text-sm text-gray-500 mt-0.5">{user.nama}</p>
            </div>
            
            <!-- Form -->
            <form 
                method="POST" 
                action="?/update" 
                use:enhance={handleSubmit}
                class="p-5 space-y-4"
            >
                <input type="hidden" name="user_id" value={form.user_id} />
                
                <!-- Nama -->
                <div>
                    <label for="edit-nama" class="block text-sm font-medium text-gray-700 mb-1">
                        Nama Lengkap
                    </label>
                    <input 
                        type="text" 
                        id="edit-nama" 
                        name="nama" 
                        bind:value={form.nama} 
                        required
                        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none" 
                    />
                </div>
                
                <!-- Email -->
                <div>
                    <label for="edit-email" class="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input 
                        type="email" 
                        id="edit-email" 
                        name="email" 
                        bind:value={form.email} 
                        required
                        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none" 
                    />
                </div>
                
                <!-- Role & Status -->
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label for="edit-role" class="block text-sm font-medium text-gray-700 mb-1">
                            Role
                        </label>
                        <select 
                            id="edit-role" 
                            name="role" 
                            bind:value={form.role} 
                            required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none bg-white"
                        >
                            <option value="kasir">Kasir</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label for="edit-status" class="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select 
                            id="edit-status" 
                            name="status" 
                            bind:value={form.status} 
                            required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none bg-white"
                        >
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif</option>
                        </select>
                    </div>
                </div>
                
                <!-- No Telepon -->
                <div>
                    <label for="edit-telepon" class="block text-sm font-medium text-gray-700 mb-1">
                        No. Telepon
                    </label>
                    <input 
                        type="tel" 
                        id="edit-telepon" 
                        name="no_telepon" 
                        bind:value={form.no_telepon}
                        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none" 
                    />
                </div>
                
                <!-- Password Baru -->
                <div>
                    <label for="edit-password" class="block text-sm font-medium text-gray-700 mb-1">
                        Password Baru 
                        <span class="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span>
                    </label>
                    <input 
                        type="password" 
                        id="edit-password" 
                        name="new_password" 
                        bind:value={form.new_password} 
                        minlength="6"
                        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none" 
                        placeholder="Minimal 6 karakter" 
                    />
                </div>
                
                <!-- PIN Info -->
                {#if user.has_pin}
                    <div class="bg-gray-50 rounded-lg p-3">
                        <p class="text-xs text-gray-600 flex items-center gap-2">
                            <ShieldCheck size={14} class="text-emerald-500" />
                            User memiliki PIN. Gunakan menu terpisah untuk kelola PIN.
                        </p>
                    </div>
                {:else if user.pin_status === 'required'}
                    <div class="bg-amber-50 rounded-lg p-3">
                        <p class="text-xs text-amber-700 flex items-center gap-2">
                            <AlertTriangle size={14} />
                            User belum memiliki PIN. Set PIN setelah menyimpan.
                        </p>
                    </div>
                {/if}
                
                <!-- Actions -->
                <div class="flex gap-3 pt-3">
                    <button 
                        type="button" 
                        on:click={close} 
                        class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Batal
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        class="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 rounded-lg transition-colors"
                    >
                        {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}
