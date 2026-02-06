<!--
    TabKasir.svelte - Tab Pengaturan Kasir (FIXED)
    ============================================
    Konfigurasi untuk transaksi: pajak, pembulatan, auto print
    - OWNER ONLY
-->
<script>
    import { enhance } from '$app/forms';
    import { fade } from 'svelte/transition';
    import { Percent, Calculator, Lock } from 'lucide-svelte';
    import SettingSection from './shared/SettingSection.svelte';
    import ToggleSwitch from './shared/ToggleSwitch.svelte';
    import FormActions from './shared/FormActions.svelte';

    export let settings = {};
    export let isSubmitting = false;
    export let onSubmit = () => {};
    export let canEdit = true;

    // Form data
    let kasirData = {
        pajak_persen: 0,
        pembulatan: 'none',
        auto_print: false
    };

    // Sync dengan settings
    $: if (settings) {
        kasirData = {
            pajak_persen: settings.pajak_persen || 0,
            pembulatan: settings.pembulatan || 'none',
            auto_print: settings.auto_print || false
        };
    }

    // Pembulatan options
    const pembulatanOptions = [
        { value: 'none', label: 'Tidak ada pembulatan' },
        { value: '100', label: 'Pembulatan Rp 100' },
        { value: '500', label: 'Pembulatan Rp 500' },
        { value: '1000', label: 'Pembulatan Rp 1.000' }
    ];
</script>

<div transition:fade={{ duration: 150 }}>
    <SettingSection title="Pengaturan Kasir" description="Konfigurasi untuk transaksi di kasir">
        <!-- View Only Banner -->
        {#if !canEdit}
            <div class="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <Lock class="w-4 h-4 text-amber-600" />
                <span class="text-sm text-amber-700">Hanya Owner yang dapat mengubah pengaturan kasir</span>
            </div>
        {/if}

        <form 
            method="POST" 
            action="?/updateKasir"
            use:enhance={onSubmit}
            class="space-y-6"
        >
            <!-- Pajak -->
            <div class="space-y-1.5">
                <label for="pajak_persen" class="block text-sm font-medium text-slate-700">
                    Pajak Default (%)
                </label>
                <div class="relative max-w-xs">
                    <Percent class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="number"
                        id="pajak_persen"
                        name="pajak_persen"
                        bind:value={kasirData.pajak_persen}
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="0"
                        disabled={!canEdit}
                        class="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:border-emerald-500 focus:ring-2 
                               focus:ring-emerald-500/20 transition-all
                               disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                </div>
                <p class="text-xs text-slate-500">Pajak akan otomatis diterapkan ke setiap transaksi</p>
            </div>

            <!-- Pembulatan -->
            <div class="space-y-1.5">
                <label for="pembulatan" class="block text-sm font-medium text-slate-700">
                    Pembulatan Harga
                </label>
                <div class="relative max-w-sm">
                    <Calculator class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                        id="pembulatan"
                        name="pembulatan"
                        bind:value={kasirData.pembulatan}
                        disabled={!canEdit}
                        class="w-full h-11 pl-10 pr-10 bg-white border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:border-emerald-500 focus:ring-2 
                               focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer
                               disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                        {#each pembulatanOptions as opt}
                            <option value={opt.value}>{opt.label}</option>
                        {/each}
                    </select>
                    <!-- Dropdown Arrow -->
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                <p class="text-xs text-slate-500">Total akan dibulatkan ke kelipatan yang dipilih</p>
            </div>

            <!-- Auto Print -->
            <div class="flex items-center justify-between py-4 border-t border-slate-100">
                <div>
                    <p class="text-sm font-medium text-slate-700">Auto Print Struk</p>
                    <p class="text-xs text-slate-500 mt-0.5">Otomatis cetak struk setelah transaksi</p>
                </div>
                <ToggleSwitch 
                    name="auto_print" 
                    bind:checked={kasirData.auto_print}
                    disabled={!canEdit}
                />
            </div>

            <FormActions {isSubmitting} {canEdit} />
        </form>
    </SettingSection>
</div>