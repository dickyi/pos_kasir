<!--
    VariantFormModal.svelte - Modal Form Varian Produk (FIXED v2)
    ============================================
    ✅ FIX v2: Upload gambar varian ke Cloudinary
    - Kirim old_image_url saat ganti gambar (hapus yang lama)
    - Kirim type='variant' untuk folder terpisah
    - Hapus gambar dari Cloudinary saat remove
-->
<script>
    import { createEventDispatcher } from 'svelte';
    import { fly, fade, slide } from 'svelte/transition';
    import { 
        X, ChevronRight, Barcode, AlertCircle, Plus, Trash2,
        Camera, Loader2, Image as ImageIcon, Weight, Tag
    } from 'lucide-svelte';

    const dispatch = createEventDispatcher();

    export let open = false;
    export let mode = 'add';
    export let variant = null;
    export let produkKode = '';

    // Form data
    let formId = null;
    let formTempId = null;
    let formKodeVarian = '';
    let formNamaVarian = '';
    let formHargaJual = 0;
    let formHargaModal = 0;
    let formBarcode = '';
    let formStok = 0;
    let formStokMinimum = 10;
    let formIsDefault = false;
    let formGambar = '';
    let formBerat = null;
    let formAtribut = [];

    // Display values
    let displayHargaJual = '';
    let displayHargaModal = '';

    // Toggle sections
    let showHargaModal = false;
    let showStok = true;
    let showAtribut = false;
    let showGambarBerat = false;

    // Upload state
    let isUploading = false;
    let uploadError = '';
    let previewUrl = '';
    let fileInput;

    function formatToRupiah(num) {
        if (num === null || num === undefined || num === 0) return '';
        const intNum = Math.round(Number(num));
        return new Intl.NumberFormat('id-ID').format(intNum);
    }

    function parseToNumber(value) {
        if (value === null || value === undefined || value === '') return 0;
        if (typeof value === 'number') return Math.round(value);
        let str = value.toString().trim();
        if (/^\d+\.\d{2}$/.test(str)) return Math.round(parseFloat(str));
        if (/^\d{1,3}(\.\d{3})+$/.test(str)) return parseInt(str.replace(/\./g, '')) || 0;
        if (/^\d{1,3}(,\d{3})+$/.test(str)) return parseInt(str.replace(/,/g, '')) || 0;
        if (/^\d+$/.test(str)) return parseInt(str) || 0;
        return parseInt(str.replace(/\D/g, '')) || 0;
    }

    function handleHargaJualInput(e) {
        const rawValue = e.target.value.replace(/[^\d]/g, '');
        formHargaJual = parseInt(rawValue) || 0;
        displayHargaJual = formatToRupiah(formHargaJual);
    }

    function handleHargaModalInput(e) {
        const rawValue = e.target.value.replace(/[^\d]/g, '');
        formHargaModal = parseInt(rawValue) || 0;
        displayHargaModal = formatToRupiah(formHargaModal);
    }

    function generateTempId() {
        return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    function generateKodeVarian() {
        const suffix = formNamaVarian
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 3) || 'VAR';
        const random = Math.random().toString(36).substring(2, 4).toUpperCase();
        return `${produkKode}-${suffix}${random}`;
    }

    function parseAtribut(atribut) {
        if (!atribut) return [];
        try {
            let obj = atribut;
            if (typeof atribut === 'string') obj = JSON.parse(atribut);
            if (typeof obj === 'object' && !Array.isArray(obj)) {
                return Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }));
            }
            if (Array.isArray(obj)) return obj;
            return [];
        } catch (e) {
            return [];
        }
    }

    function atributToObject(atributArray) {
        if (!atributArray || atributArray.length === 0) return null;
        const obj = {};
        atributArray.forEach(item => {
            if (item.key && item.key.trim()) {
                obj[item.key.trim()] = item.value || '';
            }
        });
        return Object.keys(obj).length > 0 ? obj : null;
    }

    function addAtribut() {
        formAtribut = [...formAtribut, { key: '', value: '' }];
    }

    function removeAtribut(index) {
        formAtribut = formAtribut.filter((_, i) => i !== index);
    }

    // ============================================
    // ✅ FIXED: Upload gambar varian ke Cloudinary
    // ============================================
    async function handleFileSelect(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            uploadError = 'Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF';
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            uploadError = 'Ukuran file maksimal 10MB';
            return;
        }

        uploadError = '';
        isUploading = true;

        try {
            // Preview langsung
            const reader = new FileReader();
            reader.onload = (e) => {
                previewUrl = e.target.result;
            };
            reader.readAsDataURL(file);

            // ✅ Upload ke Cloudinary via backend
            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('type', 'variant'); // ✅ Folder terpisah untuk varian

            // ✅ Kirim URL gambar lama agar dihapus dari Cloudinary
            if (formGambar && formGambar.includes('cloudinary.com')) {
                uploadData.append('old_image_url', formGambar);
            }

            const response = await fetch('/tenant/produk/upload', {
                method: 'POST',
                body: uploadData
            });

            const result = await response.json();

            if (result.success) {
                formGambar = result.data.url;
                previewUrl = result.data.url;
                console.log('✅ Variant image uploaded:', result.data.url);
            } else {
                uploadError = result.error || 'Gagal upload gambar';
                previewUrl = formGambar || '';
            }
        } catch (error) {
            console.error('Upload error:', error);
            uploadError = 'Gagal upload gambar';
            previewUrl = formGambar || '';
        } finally {
            isUploading = false;
        }
    }

    // ✅ FIXED: Hapus gambar varian dari Cloudinary
    async function removeImage() {
        // Hapus dari Cloudinary jika URL Cloudinary
        if (formGambar && formGambar.includes('cloudinary.com')) {
            try {
                await fetch('/tenant/produk/upload', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image_url: formGambar })
                });
                console.log('🗑️ Variant image deleted from Cloudinary');
            } catch (e) {
                console.log('⚠️ Failed to delete variant image:', e.message);
            }
        }
        
        formGambar = '';
        previewUrl = '';
        if (fileInput) fileInput.value = '';
    }

    function initForm() {
        uploadError = '';
        
        if (mode === 'edit' && variant) {
            formId = variant.id || null;
            formTempId = variant.temp_id || null;
            formKodeVarian = variant.kode_varian || '';
            formNamaVarian = variant.nama_varian || '';
            formHargaJual = parseToNumber(variant.harga_jual);
            formHargaModal = parseToNumber(variant.harga_modal);
            formBarcode = variant.barcode || '';
            formStok = parseInt(variant.stok) || 0;
            formStokMinimum = parseInt(variant.stok_minimum) || 10;
            formIsDefault = variant.is_default || false;
            formGambar = variant.gambar || '';
            formBerat = variant.berat ? parseFloat(variant.berat) : null;
            formAtribut = parseAtribut(variant.atribut);
            
            displayHargaJual = formatToRupiah(formHargaJual);
            displayHargaModal = formatToRupiah(formHargaModal);
            previewUrl = formGambar || '';
            
            showHargaModal = !!(formHargaModal || formBarcode);
            showStok = true;
            showAtribut = formAtribut.length > 0;
            showGambarBerat = !!(formGambar || formBerat);
        } else {
            formId = null;
            formTempId = generateTempId();
            formKodeVarian = '';
            formNamaVarian = '';
            formHargaJual = 0;
            formHargaModal = 0;
            formBarcode = '';
            formStok = 0;
            formStokMinimum = 10;
            formIsDefault = false;
            formGambar = '';
            formBerat = null;
            formAtribut = [];
            
            displayHargaJual = '';
            displayHargaModal = '';
            previewUrl = '';
            showHargaModal = false;
            showStok = true;
            showAtribut = false;
            showGambarBerat = false;
        }
    }

    $: if (open) {
        initForm();
    }

    function close() {
        open = false;
        dispatch('close');
    }

    function handleSave() {
        if (!formNamaVarian.trim()) {
            alert('Nama varian wajib diisi');
            return;
        }
        if (formHargaJual <= 0) {
            alert('Harga jual harus lebih dari 0');
            return;
        }

        const kodeVarian = formKodeVarian || generateKodeVarian();
        const atributObj = atributToObject(formAtribut);

        const variantData = {
            id: formId,
            temp_id: formTempId,
            kode_varian: kodeVarian,
            nama_varian: formNamaVarian.trim(),
            harga_jual: formHargaJual,
            harga_modal: formHargaModal,
            barcode: formBarcode.trim() || null,
            stok: formStok,
            stok_minimum: formStokMinimum,
            is_default: formIsDefault,
            gambar: formGambar || null,
            berat: formBerat || null,
            atribut: atributObj,
            _isNew: !formId
        };

        dispatch('save', variantData);
        close();
    }

    $: margin = formHargaJual - formHargaModal;
    $: marginPercent = formHargaModal > 0 ? ((margin / formHargaModal) * 100).toFixed(1) : 0;
</script>

{#if open}
    <!-- Backdrop -->
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
        on:click={close}
        on:keydown={(e) => e.key === 'Escape' && close()}
        role="button"
        tabindex="-1"
        aria-label="Close modal"
    ></div>

    <!-- Modal -->
    <div 
        transition:fly={{ y: 20, duration: 200 }}
        class="fixed inset-x-4 top-[2%] bottom-[2%] sm:inset-auto sm:left-1/2 sm:top-1/2 
               sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md
               bg-white rounded-2xl shadow-2xl z-[61] flex flex-col max-h-[96vh]"
    >
        <!-- Header -->
        <div class="flex items-center gap-3 p-4 border-b border-slate-200 flex-shrink-0">
            <button type="button" on:click={close} class="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <X class="w-5 h-5" />
            </button>
            <h2 class="text-lg font-semibold text-slate-800">
                {mode === 'add' ? 'Tambah Variasi' : 'Edit Variasi'}
            </h2>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
            <!-- Basic Info -->
            <div class="p-4 space-y-4">
                <div class="space-y-1.5">
                    <label for="nama_varian" class="block text-sm font-medium text-slate-700">
                        Nama Variasi <span class="text-red-500">*</span>
                    </label>
                    <input
                        type="text" id="nama_varian" bind:value={formNamaVarian}
                        placeholder="Contoh: Level 1, Size M, Warna Hitam" autocomplete="off"
                        class="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm
                               placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                               focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                    />
                </div>

                <div class="space-y-1.5">
                    <label for="harga_jual_varian" class="block text-sm font-medium text-slate-700">
                        Harga Jual <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium pointer-events-none">Rp</span>
                        <input
                            type="text" id="harga_jual_varian" value={displayHargaJual}
                            on:input={handleHargaJualInput} on:focus={(e) => e.target.select()}
                            placeholder="0" autocomplete="off" inputmode="numeric"
                            class="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                   placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                                   focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                        />
                    </div>
                </div>
            </div>

            <div class="h-2 bg-slate-100"></div>

            <!-- Kelola Stok -->
            <div class="p-4">
                <div class="flex items-center justify-between py-2">
                    <span class="font-semibold text-slate-800">Kelola Stok</span>
                    <button type="button" on:click={() => showStok = !showStok}
                        class="w-12 h-7 rounded-full transition-colors relative {showStok ? 'bg-emerald-500' : 'bg-slate-200'}"
                        role="switch" aria-checked={showStok}>
                        <div class="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all {showStok ? 'left-6' : 'left-1'}"></div>
                    </button>
                </div>

                {#if showStok}
                    <div class="mt-4 space-y-4" transition:slide={{ duration: 150 }}>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-1.5">
                                <label for="stok_varian" class="block text-sm font-medium text-slate-700">Stok Awal</label>
                                <input type="number" id="stok_varian" bind:value={formStok} min="0" placeholder="0"
                                    autocomplete="off" inputmode="numeric"
                                    class="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                                           focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" />
                            </div>
                            <div class="space-y-1.5">
                                <label for="stok_minimum" class="block text-sm font-medium text-slate-700">Stok Minimum</label>
                                <input type="number" id="stok_minimum" bind:value={formStokMinimum} min="0" placeholder="10"
                                    autocomplete="off" inputmode="numeric"
                                    class="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                                           focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" />
                            </div>
                        </div>
                    </div>
                {/if}
            </div>

            <div class="h-2 bg-slate-100"></div>

            <!-- Harga Modal & Barcode -->
            <div class="p-4">
                <div class="flex items-center justify-between py-2">
                    <span class="font-semibold text-slate-800">Harga Modal & Barcode</span>
                    <button type="button" on:click={() => showHargaModal = !showHargaModal}
                        class="w-12 h-7 rounded-full transition-colors relative {showHargaModal ? 'bg-emerald-500' : 'bg-slate-200'}"
                        role="switch" aria-checked={showHargaModal}>
                        <div class="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all {showHargaModal ? 'left-6' : 'left-1'}"></div>
                    </button>
                </div>

                {#if showHargaModal}
                    <div class="mt-4 space-y-4" transition:slide={{ duration: 150 }}>
                        <div class="space-y-1.5">
                            <label for="harga_modal_varian" class="block text-sm font-medium text-slate-700">Harga Modal</label>
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium pointer-events-none">Rp</span>
                                <input type="text" id="harga_modal_varian" value={displayHargaModal}
                                    on:input={handleHargaModalInput} on:focus={(e) => e.target.select()}
                                    placeholder="0" autocomplete="off" inputmode="numeric"
                                    class="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                                           focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" />
                            </div>
                        </div>

                        <div class="space-y-1.5">
                            <label for="barcode_varian" class="block text-sm font-medium text-slate-700">Barcode</label>
                            <div class="relative">
                                <input type="text" id="barcode_varian" bind:value={formBarcode}
                                    placeholder="Scan atau ketik barcode" autocomplete="off"
                                    class="w-full h-12 px-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                                           focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" />
                                <Barcode class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {#if formHargaJual > 0 && formHargaModal > 0}
                            <div class="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                <span class="text-sm text-emerald-700">Margin:</span>
                                <span class="text-sm font-bold {margin >= 0 ? 'text-emerald-600' : 'text-red-600'}">
                                    Rp {formatToRupiah(margin)} ({marginPercent}%)
                                </span>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>

            <div class="h-2 bg-slate-100"></div>

            <!-- Atribut -->
            <div class="p-4">
                <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-2">
                        <span class="font-semibold text-slate-800">Atribut / Spesifikasi</span>
                        <span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">Opsional</span>
                    </div>
                    <button type="button" on:click={() => showAtribut = !showAtribut}
                        class="w-12 h-7 rounded-full transition-colors relative {showAtribut ? 'bg-emerald-500' : 'bg-slate-200'}"
                        role="switch" aria-checked={showAtribut}>
                        <div class="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all {showAtribut ? 'left-6' : 'left-1'}"></div>
                    </button>
                </div>
                <p class="text-xs text-slate-500 mt-1">Tambahkan spesifikasi seperti Warna, Size, RAM, dll.</p>

                {#if showAtribut}
                    <div class="mt-4 space-y-3" transition:slide={{ duration: 150 }}>
                        {#each formAtribut as attr, index}
                            <div class="flex items-center gap-2">
                                <input type="text" bind:value={attr.key} placeholder="Nama (cth: Warna)" autocomplete="off"
                                    class="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm
                                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500" />
                                <input type="text" bind:value={attr.value} placeholder="Nilai (cth: Hitam)" autocomplete="off"
                                    class="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm
                                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500" />
                                <button type="button" on:click={() => removeAtribut(index)}
                                    class="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 class="w-4 h-4" />
                                </button>
                            </div>
                        {/each}

                        <button type="button" on:click={addAtribut}
                            class="w-full h-10 border-2 border-dashed border-slate-300 rounded-lg
                                   text-slate-500 text-sm font-medium hover:border-emerald-400 
                                   hover:text-emerald-600 transition-colors flex items-center justify-center gap-2">
                            <Plus class="w-4 h-4" />
                            <span>Tambah Atribut</span>
                        </button>
                    </div>
                {/if}
            </div>

            <div class="h-2 bg-slate-100"></div>

            <!-- Gambar & Berat -->
            <div class="p-4">
                <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-2">
                        <span class="font-semibold text-slate-800">Gambar & Berat</span>
                        <span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">Opsional</span>
                    </div>
                    <button type="button" on:click={() => showGambarBerat = !showGambarBerat}
                        class="w-12 h-7 rounded-full transition-colors relative {showGambarBerat ? 'bg-emerald-500' : 'bg-slate-200'}"
                        role="switch" aria-checked={showGambarBerat}>
                        <div class="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all {showGambarBerat ? 'left-6' : 'left-1'}"></div>
                    </button>
                </div>
                <p class="text-xs text-slate-500 mt-1">Gambar khusus varian & berat untuk informasi produk.</p>

                {#if showGambarBerat}
                    <div class="mt-4 space-y-4" transition:slide={{ duration: 150 }}>
                        <!-- Upload Gambar Varian -->
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-slate-700">Gambar Varian</label>
                            <div class="flex items-center gap-4">
                                <div class="relative">
                                    {#if previewUrl}
                                        <img src={previewUrl} alt="Preview"
                                            class="w-20 h-20 rounded-xl object-cover border-2 border-slate-200" />
                                        <button type="button" on:click={removeImage}
                                            class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white 
                                                   rounded-full flex items-center justify-center
                                                   hover:bg-red-600 transition-colors shadow-lg">
                                            <X class="w-3.5 h-3.5" />
                                        </button>
                                    {:else}
                                        <div class="w-20 h-20 rounded-xl bg-slate-100 flex items-center 
                                                    justify-center text-slate-400 border-2 border-dashed border-slate-300">
                                            {#if isUploading}
                                                <Loader2 class="w-6 h-6 animate-spin" />
                                            {:else}
                                                <ImageIcon class="w-6 h-6" />
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                                
                                <div class="flex-1">
                                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                                        on:change={handleFileSelect} bind:this={fileInput}
                                        class="hidden" id="gambar-varian-input" />
                                    <label for="gambar-varian-input"
                                        class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 
                                               text-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 
                                               transition-colors text-sm font-medium">
                                        <Camera class="w-4 h-4" />
                                        <span>Pilih Gambar</span>
                                    </label>
                                    <p class="text-xs text-slate-500 mt-1">JPG, PNG, WebP, GIF. Maks 10MB</p>
                                </div>
                            </div>

                            {#if uploadError}
                                <div class="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-red-600">
                                    <AlertCircle class="w-4 h-4" />
                                    <span class="text-xs">{uploadError}</span>
                                </div>
                            {/if}
                        </div>

                        <!-- Berat -->
                        <div class="space-y-1.5">
                            <label for="berat_varian" class="block text-sm font-medium text-slate-700">Berat (gram)</label>
                            <div class="relative">
                                <input type="number" id="berat_varian" bind:value={formBerat}
                                    min="0" step="0.1" placeholder="Contoh: 500" autocomplete="off"
                                    class="w-full h-12 px-4 pr-16 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                                           focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" />
                                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">gram</span>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>

            <div class="h-2 bg-slate-100"></div>

            <!-- Default Varian -->
            <div class="p-4">
                <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" bind:checked={formIsDefault}
                        class="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0" />
                    <div>
                        <span class="text-sm font-medium text-slate-700">Jadikan varian default</span>
                        <p class="text-xs text-slate-500">Varian ini akan ditampilkan pertama di kasir</p>
                    </div>
                </label>
            </div>

            <div class="h-20"></div>
        </div>

        <!-- Footer -->
        <div class="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 rounded-b-2xl">
            <button type="button" on:click={handleSave}
                disabled={!formNamaVarian || formHargaJual <= 0}
                class="w-full h-12 bg-emerald-600 text-white rounded-xl font-semibold
                       hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Simpan Varian
            </button>
        </div>
    </div>
{/if}