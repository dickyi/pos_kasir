<!--
    TabAkun.svelte - Tab Akun & Keamanan (FIXED)
    ============================================
    Form untuk mengelola data akun dan password
    - Kasir hanya bisa ganti password
    - Admin & Owner bisa edit semua
-->
<script>
    import { enhance } from '$app/forms';
    import { fade } from 'svelte/transition';
    import { Shield, Eye, EyeOff, Check, X, Lock, User } from 'lucide-svelte';
    import SettingSection from './shared/SettingSection.svelte';
    import FormActions from './shared/FormActions.svelte';

    export let user = null;
    export let isSubmitting = false;
    export let onSubmit = () => {};
    export let canEdit = true;
    export let tenantRole = 'owner';

    // Kasir hanya bisa ganti password, tidak bisa edit nama/email
    $: canEditProfile = canEdit && tenantRole !== 'kasir';

    // Show/hide password toggles
    let showPasswordOld = false;
    let showPasswordNew = false;
    let showPasswordConfirm = false;

    // Form data - Akun
    let akunData = {
        nama: '',
        email: ''
    };

    // Form data - Password
    let passwordData = {
        password_lama: '',
        password_baru: '',
        konfirmasi_password: ''
    };

    // Sync dengan user data
    $: if (user) {
        akunData = {
            nama: user.nama || '',
            email: user.email || ''
        };
    }

    // Password match check
    $: passwordMatch = passwordData.password_baru === passwordData.konfirmasi_password;
    $: canSubmitPassword = passwordData.password_lama && 
                           passwordData.password_baru && 
                           passwordMatch;

    // Reset password setelah submit berhasil
    export function resetPasswordFields() {
        passwordData = {
            password_lama: '',
            password_baru: '',
            konfirmasi_password: ''
        };
    }
</script>

<div class="space-y-6" transition:fade={{ duration: 150 }}>
    
    <!-- Data Akun - Hidden untuk Kasir, atau View Only -->
    {#if tenantRole !== 'kasir'}
        <SettingSection title="Data Akun" description="Informasi akun login Anda" icon={User}>
            <!-- View Only Banner -->
            {#if !canEditProfile}
                <div class="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                    <Lock class="w-4 h-4 text-amber-600" />
                    <span class="text-sm text-amber-700">Anda hanya dapat mengubah password</span>
                </div>
            {/if}

            <form 
                method="POST" 
                action="?/updateAkun"
                use:enhance={onSubmit}
                class="space-y-5"
            >
                <div class="grid sm:grid-cols-2 gap-4">
                    <!-- Nama -->
                    <div class="space-y-1.5">
                        <label for="nama" class="block text-sm font-medium text-slate-700">
                            Nama Lengkap {#if canEditProfile}<span class="text-red-500">*</span>{/if}
                        </label>
                        <input
                            type="text"
                            id="nama"
                            name="nama"
                            bind:value={akunData.nama}
                            required={canEditProfile}
                            disabled={!canEditProfile}
                            class="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm
                                   focus:outline-none focus:border-emerald-500 focus:ring-2 
                                   focus:ring-emerald-500/20 transition-all
                                   disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                        />
                    </div>

                    <!-- Email -->
                    <div class="space-y-1.5">
                        <label for="email" class="block text-sm font-medium text-slate-700">
                            Email {#if canEditProfile}<span class="text-red-500">*</span>{/if}
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            bind:value={akunData.email}
                            required={canEditProfile}
                            disabled={!canEditProfile}
                            class="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm
                                   focus:outline-none focus:border-emerald-500 focus:ring-2 
                                   focus:ring-emerald-500/20 transition-all
                                   disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                <!-- Role Badge -->
                <div class="space-y-1.5">
                    <label class="block text-sm font-medium text-slate-700">Role</label>
                    <div class="h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center">
                        <span class="text-sm text-slate-600 capitalize">{tenantRole || 'Owner'}</span>
                    </div>
                </div>

                <FormActions {isSubmitting} canEdit={canEditProfile} />
            </form>
        </SettingSection>
    {/if}

    <!-- Ganti Password - Semua role bisa akses -->
    <SettingSection 
        title="Keamanan" 
        description="Ganti password akun Anda"
        icon={Shield}
    >
        <form 
            method="POST" 
            action="?/updatePassword"
            use:enhance={onSubmit}
            class="space-y-5"
        >
            <!-- Password Lama -->
            <div class="space-y-1.5">
                <label for="password_lama" class="block text-sm font-medium text-slate-700">
                    Password Lama <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                    <input
                        type={showPasswordOld ? 'text' : 'password'}
                        id="password_lama"
                        name="password_lama"
                        bind:value={passwordData.password_lama}
                        placeholder="Masukkan password lama"
                        class="w-full h-11 px-4 pr-12 bg-white border border-slate-200 rounded-lg text-sm
                               placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                               focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <button
                        type="button"
                        on:click={() => showPasswordOld = !showPasswordOld}
                        class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    >
                        {#if showPasswordOld}
                            <EyeOff class="w-5 h-5" />
                        {:else}
                            <Eye class="w-5 h-5" />
                        {/if}
                    </button>
                </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
                <!-- Password Baru -->
                <div class="space-y-1.5">
                    <label for="password_baru" class="block text-sm font-medium text-slate-700">
                        Password Baru <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <input
                            type={showPasswordNew ? 'text' : 'password'}
                            id="password_baru"
                            name="password_baru"
                            bind:value={passwordData.password_baru}
                            placeholder="Min. 6 karakter"
                            class="w-full h-11 px-4 pr-12 bg-white border border-slate-200 rounded-lg text-sm
                                   placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                                   focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                        <button
                            type="button"
                            on:click={() => showPasswordNew = !showPasswordNew}
                            class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                        >
                            {#if showPasswordNew}
                                <EyeOff class="w-5 h-5" />
                            {:else}
                                <Eye class="w-5 h-5" />
                            {/if}
                        </button>
                    </div>
                </div>

                <!-- Konfirmasi Password -->
                <div class="space-y-1.5">
                    <label for="konfirmasi_password" class="block text-sm font-medium text-slate-700">
                        Konfirmasi Password <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <input
                            type={showPasswordConfirm ? 'text' : 'password'}
                            id="konfirmasi_password"
                            name="konfirmasi_password"
                            bind:value={passwordData.konfirmasi_password}
                            placeholder="Ulangi password baru"
                            class="w-full h-11 px-4 pr-12 bg-white border border-slate-200 rounded-lg text-sm
                                   placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                                   focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                        <button
                            type="button"
                            on:click={() => showPasswordConfirm = !showPasswordConfirm}
                            class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                        >
                            {#if showPasswordConfirm}
                                <EyeOff class="w-5 h-5" />
                            {:else}
                                <Eye class="w-5 h-5" />
                            {/if}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Password Match Indicator -->
            {#if passwordData.password_baru && passwordData.konfirmasi_password}
                <div class="flex items-center gap-2 text-sm">
                    {#if passwordMatch}
                        <Check class="w-4 h-4 text-emerald-500" />
                        <span class="text-emerald-600">Password cocok</span>
                    {:else}
                        <X class="w-4 h-4 text-red-500" />
                        <span class="text-red-600">Password tidak cocok</span>
                    {/if}
                </div>
            {/if}

            <FormActions 
                {isSubmitting} 
                disabled={!canSubmitPassword}
                label="Ganti Password"
                variant="secondary"
                icon={Shield}
                canEdit={true}
            />
        </form>
    </SettingSection>
</div>