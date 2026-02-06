<!--
    TabNotifikasi.svelte - Tab Pengaturan Notifikasi (FIXED)
    ============================================
    Kelola peringatan stok dan notifikasi email
    - Owner can edit, Admin view only
-->
<script>
    import { enhance } from '$app/forms';
    import { fade } from 'svelte/transition';
    import { Package, AlertCircle, Lock } from 'lucide-svelte';
    import SettingSection from './shared/SettingSection.svelte';
    import ToggleSwitch from './shared/ToggleSwitch.svelte';
    import FormActions from './shared/FormActions.svelte';

    export let settings = {};
    export let isSubmitting = false;
    export let onSubmit = () => {};
    export let canEdit = true;

    // Form data
    let notifikasiData = {
        stok_warning_threshold: 10,
        notifikasi_email_stok: false,
        notifikasi_email_transaksi: false
    };

    // Sync dengan settings
    $: if (settings) {
        notifikasiData = {
            stok_warning_threshold: settings.stok_warning_threshold || 10,
            notifikasi_email_stok: settings.notifikasi_email_stok || false,
            notifikasi_email_transaksi: settings.notifikasi_email_transaksi || false
        };
    }

    // Email notification items
    const emailNotifications = [
        {
            key: 'notifikasi_email_stok',
            name: 'notifikasi_email_stok',
            title: 'Peringatan Stok Menipis',
            description: 'Kirim email saat stok produk menipis'
        },
        {
            key: 'notifikasi_email_transaksi',
            name: 'notifikasi_email_transaksi',
            title: 'Ringkasan Transaksi Harian',
            description: 'Kirim ringkasan penjualan setiap hari'
        }
    ];
</script>

<div transition:fade={{ duration: 150 }}>
    <SettingSection title="Pengaturan Notifikasi" description="Kelola peringatan dan notifikasi">
        <!-- View Only Banner -->
        {#if !canEdit}
            <div class="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <Lock class="w-4 h-4 text-amber-600" />
                <span class="text-sm text-amber-700">Hanya Owner yang dapat mengubah pengaturan notifikasi</span>
            </div>
        {/if}

        <form 
            method="POST" 
            action="?/updateNotifikasi"
            use:enhance={onSubmit}
            class="space-y-6"
        >
            <!-- Stok Warning Threshold -->
            <div class="space-y-1.5">
                <label for="stok_warning_threshold" class="block text-sm font-medium text-slate-700">
                    Batas Peringatan Stok
                </label>
                <div class="relative max-w-xs">
                    <Package class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="number"
                        id="stok_warning_threshold"
                        name="stok_warning_threshold"
                        bind:value={notifikasiData.stok_warning_threshold}
                        min="1"
                        max="100"
                        disabled={!canEdit}
                        class="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:border-emerald-500 focus:ring-2 
                               focus:ring-emerald-500/20 transition-all
                               disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                </div>
                <p class="text-xs text-slate-500">
                    Produk dengan stok di bawah angka ini akan ditandai "Menipis"
                </p>
            </div>

            <!-- Email Notifications -->
            <div class="space-y-4 pt-4 border-t border-slate-100">
                <p class="text-sm font-medium text-slate-700">Notifikasi Email</p>
                
                {#each emailNotifications as notif}
                    <div class="flex items-center justify-between py-2">
                        <div>
                            <p class="text-sm text-slate-700">{notif.title}</p>
                            <p class="text-xs text-slate-500 mt-0.5">{notif.description}</p>
                        </div>
                        <ToggleSwitch 
                            name={notif.name} 
                            bind:checked={notifikasiData[notif.key]}
                            disabled={!canEdit}
                        />
                    </div>
                {/each}
            </div>

            <!-- Info Box -->
            <div class="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
                <AlertCircle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p class="text-sm text-amber-800 font-medium">Fitur dalam pengembangan</p>
                    <p class="text-xs text-amber-700 mt-0.5">
                        Notifikasi email akan segera tersedia di versi mendatang.
                    </p>
                </div>
            </div>

            <FormActions {isSubmitting} {canEdit} />
        </form>
    </SettingSection>
</div>