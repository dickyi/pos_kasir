<!--
    TabStruk.svelte - Tab Pengaturan Struk (UPDATED)
    ============================================
    Kustomisasi tampilan struk/nota dengan:
    - Upload logo
    - Preview struk realtime
    - Custom header/footer
    - Toggle tampilkan merk di struk (NEW!)
-->
<script>
    import { enhance } from '$app/forms';
    import { fade } from 'svelte/transition';
    import { 
        Store, FileText, Phone, Printer, Lock, 
        Upload, Trash2, Image, Eye, Loader2, Tag 
    } from 'lucide-svelte';
    import SettingSection from './shared/SettingSection.svelte';
    import ToggleSwitch from './shared/ToggleSwitch.svelte';
    import FormActions from './shared/FormActions.svelte';
    import StrukPreview from './StrukPreview.svelte';

    export let settings = {};
    export let user = null;
    export let isSubmitting = false;
    export let onSubmit = () => {};
    export let canEdit = true;

    // Form data - UPDATED: tambah tampilkan_merk_struk
    let strukData = {
        struk_logo: null,
        struk_header: '',
        struk_footer: 'Terima kasih atas kunjungan Anda!',
        tampilkan_logo: true,
        tampilkan_alamat: true,
        tampilkan_telepon: true,
        tampilkan_merk_struk: false,  // NEW
        ukuran_kertas: '58mm'
    };

    // Upload states
    let isUploading = false;
    let uploadError = '';
    let fileInput;
    let showPreview = false;

    // Sync dengan settings - UPDATED
    $: if (settings) {
        strukData = {
            struk_logo: settings.struk_logo || null,
            struk_header: settings.struk_header || '',
            struk_footer: settings.struk_footer || 'Terima kasih atas kunjungan Anda!',
            tampilkan_logo: settings.tampilkan_logo ?? true,
            tampilkan_alamat: settings.tampilkan_alamat ?? true,
            tampilkan_telepon: settings.tampilkan_telepon ?? true,
            tampilkan_merk_struk: settings.tampilkan_merk_struk ?? false,  // NEW
            ukuran_kertas: settings.ukuran_kertas || '58mm'
        };
    }

    // Check apakah menu merk aktif (untuk conditional display)
    $: showMerkOption = settings?.menu_merk === true || settings?.menu_merk === 1;

    // Ukuran kertas options
    const ukuranKertasOptions = [
        { value: '58mm', label: '58mm (Thermal kecil)' },
        { value: '80mm', label: '80mm (Thermal standar)' },
        { value: 'A4', label: 'A4 (Kertas biasa)' }
    ];

    // Toggle items config - UPDATED: tambah merk
    $: toggleItems = [
        { key: 'tampilkan_logo', name: 'tampilkan_logo', label: 'Logo Toko', icon: Image, show: true },
        { key: 'tampilkan_alamat', name: 'tampilkan_alamat', label: 'Alamat Toko', icon: FileText, show: true },
        { key: 'tampilkan_telepon', name: 'tampilkan_telepon', label: 'Nomor Telepon', icon: Phone, show: true },
        { key: 'tampilkan_merk_struk', name: 'tampilkan_merk_struk', label: 'Merk Produk', icon: Tag, show: showMerkOption }  // NEW - conditional
    ].filter(item => item.show);

    // Handle file selection
    function handleFileSelect(event) {
        const file = event.target.files?.[0];
        if (file) {
            uploadLogo(file);
        }
    }

    // Upload logo
    async function uploadLogo(file) {
        if (!canEdit) return;
        
        uploadError = '';
        isUploading = true;

        try {
            const formData = new FormData();
            formData.append('logo', file);

            const response = await fetch('/api/upload-logo', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                strukData.struk_logo = result.logoUrl;
            } else {
                uploadError = result.message;
            }
        } catch (error) {
            uploadError = 'Gagal mengupload logo';
            console.error('Upload error:', error);
        } finally {
            isUploading = false;
            if (fileInput) fileInput.value = '';
        }
    }

    // Delete logo
    async function deleteLogo() {
        if (!canEdit || !strukData.struk_logo) return;
        
        if (!confirm('Hapus logo struk?')) return;

        isUploading = true;

        try {
            const response = await fetch('/api/upload-logo', {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                strukData.struk_logo = null;
            } else {
                uploadError = result.message;
            }
        } catch (error) {
            uploadError = 'Gagal menghapus logo';
        } finally {
            isUploading = false;
        }
    }

    // Trigger file input
    function triggerUpload() {
        if (canEdit && fileInput) {
            fileInput.click();
        }
    }
</script>

<div class="space-y-6" transition:fade={{ duration: 150 }}>
    
    <!-- Main Settings -->
    <SettingSection title="Pengaturan Struk" description="Kustomisasi tampilan struk/nota">
        <!-- View Only Banner -->
        {#if !canEdit}
            <div class="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <Lock class="w-4 h-4 text-amber-600" />
                <span class="text-sm text-amber-700">Hanya Owner yang dapat mengubah pengaturan struk</span>
            </div>
        {/if}

        <form 
            method="POST" 
            action="?/updateStruk"
            use:enhance={onSubmit}
            class="space-y-6"
        >
            <!-- Logo Upload Section -->
            <div class="space-y-3">
                <label class="block text-sm font-medium text-slate-700">Logo Struk</label>
                
                <div class="flex items-start gap-4">
                    <!-- Logo Preview -->
                    <div class="w-24 h-24 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 
                                flex items-center justify-center overflow-hidden flex-shrink-0">
                        {#if strukData.struk_logo}
                            <img 
                                src={strukData.struk_logo} 
                                alt="Logo Struk" 
                                class="w-full h-full object-contain p-2"
                            />
                        {:else}
                            <Store class="w-10 h-10 text-slate-400" />
                        {/if}
                    </div>

                    <!-- Upload Controls -->
                    <div class="flex-1 space-y-2">
                        <p class="text-xs text-slate-500">
                            Format: JPG, PNG, WebP, GIF, SVG (Maks. 100MB)<br>
                            Rekomendasi: 200x200 pixel, background transparan
                        </p>
                        
                        {#if canEdit}
                            <div class="flex items-center gap-2">
                                <!-- Hidden File Input -->
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                                    bind:this={fileInput}
                                    on:change={handleFileSelect}
                                    class="hidden"
                                />

                                <!-- Upload Button -->
                                <button
                                    type="button"
                                    on:click={triggerUpload}
                                    disabled={isUploading}
                                    class="flex items-center gap-2 px-3 py-2 text-sm font-medium
                                           bg-emerald-50 text-emerald-600 rounded-lg
                                           hover:bg-emerald-100 transition-colors
                                           disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {#if isUploading}
                                        <Loader2 class="w-4 h-4 animate-spin" />
                                        <span>Uploading...</span>
                                    {:else}
                                        <Upload class="w-4 h-4" />
                                        <span>{strukData.struk_logo ? 'Ganti' : 'Upload'} Logo</span>
                                    {/if}
                                </button>

                                <!-- Delete Button -->
                                {#if strukData.struk_logo}
                                    <button
                                        type="button"
                                        on:click={deleteLogo}
                                        disabled={isUploading}
                                        class="flex items-center gap-2 px-3 py-2 text-sm font-medium
                                               bg-red-50 text-red-600 rounded-lg
                                               hover:bg-red-100 transition-colors
                                               disabled:opacity-50"
                                    >
                                        <Trash2 class="w-4 h-4" />
                                        <span>Hapus</span>
                                    </button>
                                {/if}
                            </div>
                        {/if}

                        <!-- Upload Error -->
                        {#if uploadError}
                            <p class="text-xs text-red-600">{uploadError}</p>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Header Struk -->
            <div class="space-y-1.5">
                <label for="struk_header" class="block text-sm font-medium text-slate-700">
                    Header Struk
                </label>
                <textarea
                    id="struk_header"
                    name="struk_header"
                    bind:value={strukData.struk_header}
                    rows="2"
                    disabled={!canEdit}
                    placeholder="Teks tambahan di bagian atas struk (tagline, promo, dll)"
                    class="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm
                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                           focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none
                           disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                ></textarea>
                <p class="text-xs text-slate-500">Contoh: "Spesialis Ayam Geprek Terlezat!"</p>
            </div>

            <!-- Footer Struk -->
            <div class="space-y-1.5">
                <label for="struk_footer" class="block text-sm font-medium text-slate-700">
                    Footer Struk
                </label>
                <textarea
                    id="struk_footer"
                    name="struk_footer"
                    bind:value={strukData.struk_footer}
                    rows="2"
                    disabled={!canEdit}
                    placeholder="Teks di bagian bawah struk"
                    class="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm
                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                           focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none
                           disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                ></textarea>
                <p class="text-xs text-slate-500">Contoh: "Follow IG: @ayamgeprekbu_ani | WA: 08123456789"</p>
            </div>

            <!-- Ukuran Kertas -->
            <div class="space-y-1.5">
                <label for="ukuran_kertas" class="block text-sm font-medium text-slate-700">
                    Ukuran Kertas
                </label>
                <div class="relative max-w-sm">
                    <Printer class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                        id="ukuran_kertas"
                        name="ukuran_kertas"
                        bind:value={strukData.ukuran_kertas}
                        disabled={!canEdit}
                        class="w-full h-11 pl-10 pr-10 bg-white border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:border-emerald-500 focus:ring-2 
                               focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer
                               disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                        {#each ukuranKertasOptions as opt}
                            <option value={opt.value}>{opt.label}</option>
                        {/each}
                    </select>
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Toggle Options -->
            <div class="space-y-4 pt-4 border-t border-slate-100">
                <p class="text-sm font-medium text-slate-700">Tampilkan di Struk</p>
                
                {#each toggleItems as item}
                    <div class="flex items-center justify-between py-2">
                        <div class="flex items-center gap-3">
                            <svelte:component this={item.icon} class="w-5 h-5 text-slate-400" />
                            <div>
                                <span class="text-sm text-slate-600">{item.label}</span>
                                <!-- Info tambahan untuk merk -->
                                {#if item.key === 'tampilkan_merk_struk'}
                                    <p class="text-xs text-slate-400">Tampilkan nama merk di setiap item</p>
                                {/if}
                            </div>
                        </div>
                        <ToggleSwitch 
                            name={item.name} 
                            bind:checked={strukData[item.key]}
                            disabled={!canEdit}
                        />
                    </div>
                {/each}

                <!-- Info jika menu merk tidak aktif -->
                {#if !showMerkOption}
                    <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <p class="text-xs text-slate-500">
                            💡 Aktifkan menu <strong>Merk</strong> di tab "Tampilan Menu" untuk menampilkan opsi merk di struk.
                        </p>
                    </div>
                {/if}
            </div>

            <FormActions {isSubmitting} {canEdit} />
        </form>
    </SettingSection>

    <!-- Preview Section -->
    <SettingSection title="Preview Struk" description="Lihat tampilan struk Anda" icon={Eye}>
        <div class="flex justify-center">
            <button
                type="button"
                on:click={() => showPreview = !showPreview}
                class="flex items-center gap-2 px-4 py-2 text-sm font-medium
                       bg-slate-100 text-slate-700 rounded-lg
                       hover:bg-slate-200 transition-colors"
            >
                <Eye class="w-4 h-4" />
                <span>{showPreview ? 'Sembunyikan' : 'Tampilkan'} Preview</span>
            </button>
        </div>

        {#if showPreview}
            <div class="mt-4" transition:fade={{ duration: 200 }}>
                <StrukPreview 
                    settings={strukData}
                    toko={{
                        nama: user?.nama_bisnis || 'Nama Toko',
                        alamat: user?.alamat || 'Alamat Toko',
                        telepon: user?.telepon || '08123456789'
                    }}
                    transaksi={{
                        no_invoice: 'INV-20250114-001',
                        tanggal: new Date(),
                        items: [
                            { nama: 'Ayam Geprek Original', nama_merk: showMerkOption && strukData.tampilkan_merk_struk ? 'Homemade' : null, qty: 2, harga: 15000 },
                            { nama: 'Samsung Galaxy A54', nama_merk: showMerkOption && strukData.tampilkan_merk_struk ? 'Samsung' : null, nama_varian: '8GB/256GB', qty: 1, harga: 4500000 },
                            { nama: 'Es Teh Manis', qty: 2, harga: 5000 }
                        ],
                        subtotal: 4535000,
                        pajak: 0,
                        diskon: 0,
                        total: 4535000,
                        bayar: 4600000,
                        kembalian: 65000,
                        metode_bayar: 'Tunai',
                        kasir: 'Siti Kasir'
                    }}
                />
            </div>
        {/if}
    </SettingSection>
</div>