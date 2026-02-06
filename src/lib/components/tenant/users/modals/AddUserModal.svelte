<!--
    AddUserModal.svelte - Modal Tambah User Baru
    =============================================
    Form untuk menambahkan admin atau kasir baru
-->
<script>
    import { enhance } from '$app/forms';
    import { Eye, EyeOff, AlertTriangle } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';

    export let show = false;
    export let pinConfig = { length: 6 };
    export let isSubmitting = false;

    const dispatch = createEventDispatcher();

    // Form state
    let form = {
        nama: '',
        email: '',
        password: '',
        role: 'kasir',
        no_telepon: '',
        pin: ''
    };

    let showPassword = false;
    let showPin = false;

    // Reset form
    export function reset() {
        form = {
            nama: '',
            email: '',
            password: '',
            role: 'kasir',
            no_telepon: '',
            pin: ''
        };
        showPassword = false;
        showPin = false;
    }

    function close() {
        dispatch('close');
    }

    function handlePinInput(event) {
        const value = event.target.value.replace(/\D/g, '').slice(0, pinConfig.length);
        event.target.value = value;
        form.pin = value;
    }

    function handleSubmit() {
        dispatch('submitting');
        return async ({ result }) => {
            dispatch('submitted', result);
        };
    }
</script>

{#if show}
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
                <h2 class="text-lg font-semibold text-gray-900">Tambah User Baru</h2>
                <p class="text-sm text-gray-500 mt-0.5">Tambahkan admin atau kasir</p>
            </div>
            
            <!-- Form -->
            <form 
                method="POST" 
                action="?/create" 
                use:enhance={handleSubmit}
                class="p-5 space-y-4"
            >
                <!-- Nama -->
                <div>
                    <label for="add-nama" class="block text-sm font-medium text-gray-700 mb-1">
                        Nama Lengkap
                    </label>
                    <input 
                        type="text" 
                        id="add-nama" 
                        name="nama" 
                        bind:value={form.nama} 
                        required
                        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none" 
                        placeholder="Masukkan nama" 
                    />
                </div>
                
                <!-- Email -->
                <div>
                    <label for="add-email" class="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input 
                        type="email" 
                        id="add-email" 
                        name="email" 
                        bind:value={form.email} 
                        required
                        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none" 
                        placeholder="email@example.com" 
                    />
                </div>
                
                <!-- Password -->
                <div>
                    <label for="add-password" class="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <div class="relative">
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            id="add-password" 
                            name="password" 
                            bind:value={form.password} 
                            required 
                            minlength="6"
                            class="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none" 
                            placeholder="Minimal 6 karakter" 
                        />
                        <button 
                            type="button" 
                            on:click={() => showPassword = !showPassword} 
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {#if showPassword}
                                <EyeOff size={16} />
                            {:else}
                                <Eye size={16} />
                            {/if}
                        </button>
                    </div>
                </div>
                
                <!-- Role -->
                <div>
                    <label for="add-role" class="block text-sm font-medium text-gray-700 mb-1">
                        Role
                    </label>
                    <select 
                        id="add-role" 
                        name="role" 
                        bind:value={form.role} 
                        required
                        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none bg-white"
                    >
                        <option value="kasir">Kasir</option>
                        <option value="admin">Admin</option>
                    </select>
                    {#if form.role === 'kasir'}
                        <p class="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            PIN wajib untuk kasir
                        </p>
                    {:else if form.role === 'admin'}
                        <p class="text-xs text-gray-500 mt-1">PIN opsional untuk admin</p>
                    {/if}
                </div>
                
                <!-- No Telepon -->
                <div>
                    <label for="add-telepon" class="block text-sm font-medium text-gray-700 mb-1">
                        No. Telepon <span class="text-gray-400 font-normal">(opsional)</span>
                    </label>
                    <input 
                        type="tel" 
                        id="add-telepon" 
                        name="no_telepon" 
                        bind:value={form.no_telepon}
                        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none" 
                        placeholder="08xxxxxxxxxx" 
                    />
                </div>
                
                <!-- PIN -->
                <div>
                    <label for="add-pin" class="block text-sm font-medium text-gray-700 mb-1">
                        PIN 
                        {#if form.role === 'kasir'}
                            <span class="text-red-500">*</span>
                        {:else}
                            <span class="text-gray-400 font-normal">(opsional)</span>
                        {/if}
                    </label>
                    <div class="relative">
                        <input 
                            type={showPin ? 'text' : 'password'} 
                            id="add-pin" 
                            name="pin" 
                            value={form.pin} 
                            on:input={handlePinInput}
                            maxlength={pinConfig.length} 
                            inputmode="numeric" 
                            autocomplete="off"
                            required={form.role === 'kasir'}
                            class="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none font-mono tracking-widest text-center" 
                            placeholder={'•'.repeat(pinConfig.length)} 
                        />
                        <button 
                            type="button" 
                            on:click={() => showPin = !showPin} 
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {#if showPin}
                                <EyeOff size={16} />
                            {:else}
                                <Eye size={16} />
                            {/if}
                        </button>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">{pinConfig.length} digit angka</p>
                </div>
                
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
                        {isSubmitting ? 'Menyimpan...' : 'Tambah'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}
