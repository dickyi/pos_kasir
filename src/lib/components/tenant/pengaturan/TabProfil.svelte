<!--
    TabProfil.svelte - Tab Profil Toko (FIXED)
    ============================================
    Form untuk mengelola informasi dasar toko
    - Support canEdit prop untuk view-only mode
-->
<script>
    import { enhance } from '$app/forms';
    import { fade } from 'svelte/transition';
    import { Store, Camera, Lock } from 'lucide-svelte';
    import SettingSection from './shared/SettingSection.svelte';
    import FormActions from './shared/FormActions.svelte';

    export let user = null;
    export let isSubmitting = false;
    export let onSubmit = () => {};
    export let canEdit = true;

    // Form data
    let profilData = {
        nama_bisnis: '',
        alamat: '',
        telepon: '',
        deskripsi: ''
    };

    // Sync dengan user data
    $: if (user) {
        profilData = {
            nama_bisnis: user.nama_bisnis || '',
            alamat: user.alamat || '',
            telepon: user.telepon || '',
            deskripsi: user.deskripsi || ''
        };
    }
</script>

<div transition:fade={{ duration: 150 }}>
    <SettingSection title="Profil Toko" description="Informasi dasar tentang toko Anda">
        <!-- View Only Banner -->
        {#if !canEdit}
            <div class="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <Lock class="w-4 h-4 text-amber-600" />
                <span class="text-sm text-amber-700">Hanya Owner yang dapat mengubah profil toko</span>
            </div>
        {/if}

        <form 
            method="POST" 
            action="?/updateProfil"
            use:enhance={onSubmit}
            class="space-y-5"
        >
            <!-- Logo Preview -->
            <div class="flex items-center gap-4">
                <div class="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                    {#if user?.logo}
                        <img src={user.logo} alt="Logo" class="w-full h-full object-cover rounded-xl" />
                    {:else}
                        <Store class="w-8 h-8 text-slate-400" />
                    {/if}
                </div>
                <div>
                    <p class="text-sm font-medium text-slate-700">Logo Toko</p>
                    <p class="text-xs text-slate-500 mt-0.5">JPG, PNG maks. 2MB</p>
                    {#if canEdit}
                        <button 
                            type="button" 
                            class="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                        >
                            <Camera class="w-4 h-4" />
                            <span>Upload Logo</span>
                        </button>
                    {/if}
                </div>
            </div>

            <!-- Nama Bisnis -->
            <div class="space-y-1.5">
                <label for="nama_bisnis" class="block text-sm font-medium text-slate-700">
                    Nama Bisnis {#if canEdit}<span class="text-red-500">*</span>{/if}
                </label>
                <input
                    type="text"
                    id="nama_bisnis"
                    name="nama_bisnis"
                    bind:value={profilData.nama_bisnis}
                    required={canEdit}
                    disabled={!canEdit}
                    placeholder="Contoh: Warung Makan Bu Ani"
                    class="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm
                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 
                           focus:ring-2 focus:ring-emerald-500/20 transition-all
                           disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
            </div>

            <!-- Alamat -->
            <div class="space-y-1.5">
                <label for="alamat" class="block text-sm font-medium text-slate-700">Alamat</label>
                <textarea
                    id="alamat"
                    name="alamat"
                    bind:value={profilData.alamat}
                    rows="3"
                    disabled={!canEdit}
                    placeholder="Alamat lengkap toko Anda"
                    class="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm
                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                           focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none
                           disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                ></textarea>
            </div>

            <!-- Telepon -->
            <div class="space-y-1.5">
                <label for="telepon" class="block text-sm font-medium text-slate-700">Nomor Telepon</label>
                <input
                    type="tel"
                    id="telepon"
                    name="telepon"
                    bind:value={profilData.telepon}
                    disabled={!canEdit}
                    placeholder="Contoh: 08123456789"
                    class="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm
                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                           focus:ring-2 focus:ring-emerald-500/20 transition-all
                           disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
            </div>

            <!-- Deskripsi -->
            <div class="space-y-1.5">
                <label for="deskripsi" class="block text-sm font-medium text-slate-700">Deskripsi</label>
                <textarea
                    id="deskripsi"
                    name="deskripsi"
                    bind:value={profilData.deskripsi}
                    rows="3"
                    disabled={!canEdit}
                    placeholder="Deskripsi singkat tentang toko Anda"
                    class="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm
                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                           focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none
                           disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                ></textarea>
            </div>

            <FormActions {isSubmitting} {canEdit} />
        </form>
    </SettingSection>
</div>