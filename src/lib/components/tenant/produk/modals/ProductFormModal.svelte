<!--
    ProductFormModal.svelte - Modal Form Produk (FIXED v3 - Upload Safety)
    ============================================
    ✅ FIX v2: Kirim old_image_url saat upload gambar baru
    ✅ FIX v2: Hapus gambar dari Cloudinary saat remove
    ✅ FIX v2: Max file size 10MB (bukan 100MB)
    ✅ FIX v3: Disable tombol Simpan saat upload berjalan
    ✅ FIX v3: Upload status indicator (loading/sukses/error)
    ✅ FIX v3: Prevent submit saat gambar sedang di-upload
-->
<script>
    import { enhance } from '$app/forms';
    import { createEventDispatcher } from 'svelte';
    import { fly, fade, slide } from 'svelte/transition';
    import { invalidateAll } from '$app/navigation';
    import { 
        X, Package, Loader2, Upload, Image as ImageIcon, 
        Camera, AlertCircle, ChevronRight, ChevronDown, Barcode,
        Star, Trash2, CheckCircle
    } from 'lucide-svelte';
    import VariantSection from '../VariantSection.svelte';

    const dispatch = createEventDispatcher();

    export let open = false;
    export let mode = 'add';
    export let produk = null;
    export let kategoriList = [];
    export let merkList = [];
    export let showMerk = false;

    let isSubmitting = false;
    let isUploading = false;       // ✅ v3: Track upload state
    let uploadError = '';
    let uploadSuccess = false;     // ✅ v3: Track upload success
    let previewUrl = '';
    let fileInput;

    let showHargaModal = false;
    let showStok = false;

    let formData = {
        id: '',
        nama_produk: '',
        kategori_id: '',
        merk_id: '',
        harga_beli: 0,
        harga_jual: 0,
        barcode: '',
        stok: 0,
        satuan: 'pcs',
        status: 'aktif',
        gambar: '',
        is_favorite: false,
        has_variant: false
    };

    let displayHargaJual = '';
    let displayHargaBeli = '';
    let variants = [];

    const satuanOptions = [
        { value: 'pcs', label: 'Pcs' },
        { value: 'porsi', label: 'Porsi' },
        { value: 'gelas', label: 'Gelas' },
        { value: 'botol', label: 'Botol' },
        { value: 'bungkus', label: 'Bungkus' },
        { value: 'kg', label: 'Kg' },
        { value: 'gram', label: 'Gram' },
        { value: 'liter', label: 'Liter' },
        { value: 'ml', label: 'ml' },
        { value: 'box', label: 'Box' },
        { value: 'lusin', label: 'Lusin' }
    ];

    function formatToRupiah(num) {
        if (!num || num === 0) return '';
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
        let value = e.target.value.replace(/\D/g, '');
        formData.harga_jual = parseInt(value) || 0;
        displayHargaJual = formatToRupiah(formData.harga_jual);
    }

    function handleHargaBeliInput(e) {
        let value = e.target.value.replace(/\D/g, '');
        formData.harga_beli = parseInt(value) || 0;
        displayHargaBeli = formatToRupiah(formData.harga_beli);
    }

    function resetForm() {
        uploadError = '';
        uploadSuccess = false;  // ✅ v3: Reset upload success
        isUploading = false;    // ✅ v3: Reset upload state
        
        if (mode === 'edit' && produk) {
            formData = {
                id: produk.id,
                nama_produk: produk.nama_produk || '',
                kategori_id: produk.kategori_id || '',
                merk_id: produk.merk_id || '',
                harga_beli: parseToNumber(produk.harga_beli),
                harga_jual: parseToNumber(produk.harga_jual),
                barcode: produk.barcode || '',
                stok: produk.stok || 0,
                satuan: produk.satuan || 'pcs',
                status: produk.status || 'aktif',
                gambar: produk.gambar || '',
                is_favorite: produk.is_favorite || false,
                has_variant: produk.has_variant || false
            };
            displayHargaJual = formatToRupiah(formData.harga_jual);
            displayHargaBeli = formatToRupiah(formData.harga_beli);
            previewUrl = produk.gambar || '';
            showHargaModal = !!(formData.harga_beli || produk.barcode);
            showStok = produk.stok > 0;
            variants = produk.variants || [];
        } else {
            formData = {
                id: '', nama_produk: '', kategori_id: '', merk_id: '',
                harga_beli: 0, harga_jual: 0, barcode: '', stok: 0,
                satuan: 'pcs', status: 'aktif', gambar: '',
                is_favorite: false, has_variant: false
            };
            displayHargaJual = '';
            displayHargaBeli = '';
            previewUrl = '';
            showHargaModal = false;
            showStok = false;
            variants = [];
        }
    }

    $: if (open) resetForm();

    $: initials = formData.nama_produk
        ? formData.nama_produk.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2)
        : 'NP';

    $: tempKodeProduk = formData.id || `PRD-${Date.now().toString().slice(-6)}`;

    // ✅ v3: Computed - apakah form bisa di-submit
    $: canSubmit = formData.nama_produk && formData.harga_jual > 0 && !isUploading && !isSubmitting;

    function close() {
        open = false;
        dispatch('close');
    }

    // ============================================
    // ✅ FIXED v3: Upload gambar dengan status tracking
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
        uploadSuccess = false;
        isUploading = true;  // ✅ v3: Mulai upload → disable tombol Simpan

        try {
            // Preview langsung
            const reader = new FileReader();
            reader.onload = (e) => { previewUrl = e.target.result; };
            reader.readAsDataURL(file);

            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('type', 'product');
            
            if (mode === 'edit' && formData.id) {
                uploadData.append('produk_id', formData.id);
            }

            // Kirim URL gambar lama agar dihapus dari Cloudinary
            if (formData.gambar && formData.gambar.includes('cloudinary.com')) {
                uploadData.append('old_image_url', formData.gambar);
            }

            const response = await fetch('/tenant/produk/upload', {
                method: 'POST',
                body: uploadData
            });

            const result = await response.json();

            if (result.success) {
                formData.gambar = result.data.url;
                previewUrl = result.data.url;
                console.log('✅ Product image uploaded:', result.data.url);
                
                // ✅ v3: Tampilkan sukses sebentar
                uploadSuccess = true;
                setTimeout(() => { uploadSuccess = false; }, 2000);
            } else {
                uploadError = result.error || 'Gagal upload gambar';
                previewUrl = formData.gambar || '';
            }
        } catch (error) {
            console.error('Upload error:', error);
            uploadError = 'Gagal upload gambar';
            previewUrl = formData.gambar || '';
        } finally {
            isUploading = false;  // ✅ v3: Selesai upload → enable tombol Simpan
        }
    }

    // Hapus gambar dari Cloudinary saat remove
    async function removeImage() {
        if (formData.gambar && formData.gambar.includes('cloudinary.com')) {
            try {
                await fetch('/tenant/produk/upload', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        produk_id: (mode === 'edit' && formData.id) ? formData.id : null,
                        image_url: formData.gambar 
                    })
                });
                console.log('🗑️ Product image deleted from Cloudinary');
            } catch (e) {
                console.error('Delete image error:', e);
            }
        }
        
        formData.gambar = '';
        previewUrl = '';
        uploadSuccess = false;
        if (fileInput) fileInput.value = '';
    }

    function handleVariantChange(event) {
        variants = event.detail;
        formData.has_variant = variants.length > 0;
    }

    function toggleFavorite() {
        formData.is_favorite = !formData.is_favorite;
    }

    function handleSubmit() {
        // ✅ v3: Cegah submit saat upload sedang berjalan
        if (isUploading) {
            alert('Tunggu upload gambar selesai terlebih dahulu!');
            return;
        }
        
        isSubmitting = true;
        return async ({ result, update }) => {
            isSubmitting = false;
            if (result.type === 'success') {
                close();
                await invalidateAll();
            } else if (result.type === 'redirect') {
                close();
                await invalidateAll();
                return;
            } else if (result.type === 'failure') {
                await update();
            } else {
                await update();
            }
        };
    }
</script>

{#if open}
    <!-- Backdrop -->
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
        on:click={close}
        on:keydown={(e) => e.key === 'Escape' && close()}
        role="button"
        tabindex="-1"
        aria-label="Close modal"
    ></div>

    <!-- Modal -->
    <div 
        transition:fly={{ y: 20, duration: 200 }}
        class="fixed inset-x-0 top-0 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 
               sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg
               bg-white sm:rounded-2xl shadow-2xl z-[51] flex flex-col sm:max-h-[90vh]"
    >
        <!-- Header -->
        <div class="flex items-center gap-3 p-4 border-b border-slate-200 flex-shrink-0">
            <button type="button" on:click={close}
                class="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <X class="w-5 h-5" />
            </button>
            <h2 class="text-lg font-semibold text-slate-800">
                {mode === 'add' ? 'Tambah Produk' : 'Edit Produk'}
            </h2>
        </div>

        <!-- Form -->
        <form 
            method="POST" 
            action={mode === 'add' ? '?/create' : '?/update'}
            use:enhance={handleSubmit}
            class="flex-1 overflow-y-auto"
        >
            {#if mode === 'edit'}
                <input type="hidden" name="id" value={formData.id} />
            {/if}
            <input type="hidden" name="gambar" value={formData.gambar} />
            <input type="hidden" name="harga_jual" value={formData.harga_jual} />
            <input type="hidden" name="harga_beli" value={formData.harga_beli} />
            <input type="hidden" name="is_favorite" value={formData.is_favorite ? '1' : '0'} />
            <input type="hidden" name="has_variant" value={formData.has_variant ? '1' : '0'} />
            <input type="hidden" name="variants" value={JSON.stringify(variants)} />

            <!-- Upload Gambar -->
            <div class="flex flex-col items-center py-6">
                <div class="relative">
                    {#if previewUrl}
                        <img src={previewUrl} alt="Preview"
                            class="w-24 h-24 rounded-2xl object-cover border-2 border-slate-200
                                   {isUploading ? 'opacity-50' : ''}" />
                        
                        <!-- ✅ v3: Loading overlay saat upload -->
                        {#if isUploading}
                            <div class="absolute inset-0 flex items-center justify-center bg-white/60 rounded-2xl">
                                <Loader2 class="w-8 h-8 animate-spin text-emerald-600" />
                            </div>
                        {/if}
                        
                        {#if !isUploading}
                            <button type="button" on:click={removeImage}
                                class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white 
                                       rounded-full flex items-center justify-center
                                       hover:bg-red-600 transition-colors shadow-lg">
                                <X class="w-3.5 h-3.5" />
                            </button>
                        {/if}
                    {:else}
                        <div class="w-24 h-24 rounded-2xl bg-emerald-100 flex items-center 
                                    justify-center text-2xl font-bold text-emerald-600">
                            {#if isUploading}
                                <Loader2 class="w-8 h-8 animate-spin" />
                            {:else}
                                {initials}
                            {/if}
                        </div>
                    {/if}
                    
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                        on:change={handleFileSelect} bind:this={fileInput}
                        class="hidden" id="gambar-input-produk"
                        disabled={isUploading} />
                    
                    {#if !isUploading}
                        <label for="gambar-input-produk"
                            class="absolute -bottom-1 -right-1 w-8 h-8 bg-white border-2 border-slate-200
                                   rounded-full flex items-center justify-center cursor-pointer
                                   hover:bg-slate-50 transition-colors shadow-sm">
                            <Camera class="w-4 h-4 text-slate-500" />
                        </label>
                    {/if}
                </div>

                <!-- ✅ v3: Upload status messages -->
                {#if isUploading}
                    <div class="mt-3 flex items-center gap-2 text-amber-600" transition:fade={{ duration: 150 }}>
                        <Loader2 class="w-4 h-4 animate-spin" />
                        <span class="text-xs font-medium">Sedang mengupload gambar... Tunggu sebentar.</span>
                    </div>
                {/if}
                
                {#if uploadSuccess}
                    <div class="mt-3 flex items-center gap-2 text-emerald-600" transition:fade={{ duration: 150 }}>
                        <CheckCircle class="w-4 h-4" />
                        <span class="text-xs font-medium">Gambar berhasil diupload!</span>
                    </div>
                {/if}
            </div>

            {#if uploadError}
                <div class="mx-4 mb-4 flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-600">
                    <AlertCircle class="w-4 h-4" />
                    <span class="text-sm">{uploadError}</span>
                </div>
            {/if}

            <!-- Basic Info -->
            <div class="px-4 space-y-4">
                <div class="space-y-1.5">
                    <label for="nama_produk" class="block text-sm font-medium text-slate-700">
                        Nama Produk <span class="text-red-500">*</span>
                    </label>
                    <input type="text" id="nama_produk" name="nama_produk"
                        bind:value={formData.nama_produk} required autocomplete="off"
                        placeholder="Contoh: Ayam Geprek Original"
                        class="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm
                               placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                               focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" />
                </div>

                <div class="space-y-1.5">
                    <label for="harga_jual_display" class="block text-sm font-medium text-slate-700">
                        Harga Jual <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium pointer-events-none">Rp</span>
                        <input type="text" id="harga_jual_display" value={displayHargaJual}
                            on:input={handleHargaJualInput} autocomplete="off" inputmode="numeric" placeholder="0"
                            class="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                   placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                                   focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" />
                    </div>
                </div>

                <div class="space-y-1.5">
                    <label for="kategori_id" class="block text-sm font-medium text-slate-700">Kategori</label>
                    <div class="relative">
                        <select id="kategori_id" name="kategori_id" bind:value={formData.kategori_id}
                            class="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                   focus:outline-none focus:border-emerald-500 focus:ring-2 
                                   focus:ring-emerald-500/20 focus:bg-white transition-all appearance-none cursor-pointer">
                            <option value="">Pilih Kategori</option>
                            {#each kategoriList as kat}
                                <option value={kat.id}>{kat.nama_kategori}</option>
                            {/each}
                        </select>
                        <ChevronRight class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {#if showMerk && merkList && merkList.length > 0}
                    <div class="space-y-1.5">
                        <label for="merk_id" class="block text-sm font-medium text-slate-700">Merk / Brand</label>
                        <div class="relative">
                            <select id="merk_id" name="merk_id" bind:value={formData.merk_id}
                                class="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                       focus:outline-none focus:border-emerald-500 focus:ring-2 
                                       focus:ring-emerald-500/20 focus:bg-white transition-all appearance-none cursor-pointer">
                                <option value="">Pilih Merk</option>
                                {#each merkList as merk}
                                    <option value={merk.id}>{merk.nama_merk}</option>
                                {/each}
                            </select>
                            <ChevronRight class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                {/if}
            </div>

            <div class="h-2 bg-slate-100 my-4"></div>

            <!-- Produk Favorit -->
            <div class="px-4 py-3">
                <div class="flex items-center justify-between">
                    <span class="font-semibold text-slate-800">Produk Favorit</span>
                    <button type="button" on:click={toggleFavorite}
                        class="w-12 h-7 rounded-full transition-colors relative
                               {formData.is_favorite ? 'bg-emerald-500' : 'bg-slate-200'}"
                        role="switch" aria-checked={formData.is_favorite}>
                        <div class="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all
                                   {formData.is_favorite ? 'left-6' : 'left-1'}"></div>
                    </button>
                </div>
                <p class="text-xs text-slate-500 mt-1">Tampilkan produk di kategori terdepan.</p>
            </div>

            <div class="h-2 bg-slate-100"></div>

            <!-- Harga Modal & Barcode -->
            <div class="px-4 py-3">
                <div class="flex items-center justify-between">
                    <span class="font-semibold text-slate-800">Atur Harga Modal dan Barcode</span>
                    <button type="button" on:click={() => showHargaModal = !showHargaModal}
                        class="w-12 h-7 rounded-full transition-colors relative
                               {showHargaModal ? 'bg-emerald-500' : 'bg-slate-200'}"
                        role="switch" aria-checked={showHargaModal}>
                        <div class="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all
                                   {showHargaModal ? 'left-6' : 'left-1'}"></div>
                    </button>
                </div>

                {#if showHargaModal}
                    <div class="mt-4 space-y-4" transition:slide={{ duration: 150 }}>
                        <div class="space-y-1.5">
                            <label for="harga_beli_display" class="block text-sm font-medium text-slate-700">Harga Modal</label>
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium pointer-events-none">Rp</span>
                                <input type="text" id="harga_beli_display" value={displayHargaBeli}
                                    on:input={handleHargaBeliInput} autocomplete="off" inputmode="numeric" placeholder="0"
                                    class="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                                           focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" />
                            </div>
                        </div>

                        <div class="space-y-1.5">
                            <label for="barcode" class="block text-sm font-medium text-slate-700">Kode Produk / Barcode</label>
                            <div class="relative">
                                <input type="text" id="barcode" name="barcode" bind:value={formData.barcode}
                                    autocomplete="off" placeholder="Scan atau ketik barcode"
                                    class="w-full h-12 px-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                                           focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" />
                                <Barcode class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {#if formData.harga_jual > 0 && formData.harga_beli > 0}
                            {@const margin = formData.harga_jual - formData.harga_beli}
                            {@const marginPercent = ((margin / formData.harga_beli) * 100).toFixed(1)}
                            <div class="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                <span class="text-sm text-emerald-700">Margin Keuntungan:</span>
                                <span class="text-sm font-bold {margin >= 0 ? 'text-emerald-600' : 'text-red-600'}">
                                    Rp {formatToRupiah(margin)} ({marginPercent}%)
                                </span>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>

            <div class="h-2 bg-slate-100"></div>

            <!-- Kelola Stok -->
            {#if !formData.has_variant}
                <div class="px-4 py-3">
                    <button type="button" on:click={() => showStok = !showStok}
                        class="w-full flex items-center justify-between">
                        <span class="font-semibold text-slate-800">Kelola Stok</span>
                        <div class="flex items-center gap-2 text-slate-400">
                            <span class="text-sm">{showStok ? 'Stok Aktif' : 'Stok Tidak Aktif'}</span>
                            <ChevronRight class="w-5 h-5" />
                        </div>
                    </button>

                    {#if showStok}
                        <div class="mt-4 grid grid-cols-2 gap-3" transition:slide={{ duration: 150 }}>
                            <div class="space-y-1.5">
                                <label for="stok" class="block text-sm font-medium text-slate-700">Stok Awal</label>
                                <input type="number" id="stok" name="stok" bind:value={formData.stok}
                                    min="0" autocomplete="off" inputmode="numeric" placeholder="0"
                                    class="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                           placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                                           focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" />
                            </div>
                            <div class="space-y-1.5">
                                <label for="satuan" class="block text-sm font-medium text-slate-700">Satuan</label>
                                <select id="satuan" name="satuan" bind:value={formData.satuan}
                                    class="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                           focus:outline-none focus:border-emerald-500
                                           focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all">
                                    {#each satuanOptions as opt}
                                        <option value={opt.value}>{opt.label}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>
                    {/if}
                </div>
                <div class="h-2 bg-slate-100"></div>
            {/if}

            <!-- Varian -->
            <div class="px-4 py-4">
                <h3 class="font-semibold text-slate-800 mb-4">Varian Produk</h3>
                <VariantSection 
                    bind:variants
                    produkKode={tempKodeProduk}
                    on:change={handleVariantChange}
                />
            </div>

            {#if mode === 'edit'}
                <div class="px-4 py-4 border-t border-slate-100">
                    <button type="button"
                        class="w-full flex items-center justify-center gap-2 py-3 text-red-600
                               hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 class="w-4 h-4" />
                        <span class="font-medium">Hapus Produk</span>
                    </button>
                </div>
            {/if}

            <div class="h-24"></div>

            <!-- ✅ v3: Footer dengan upload-aware button -->
            <div class="fixed bottom-0 left-0 right-0 sm:absolute sm:bottom-0 sm:left-0 sm:right-0
                        p-4 bg-white border-t border-slate-200 sm:rounded-b-2xl z-10">
                
                {#if isUploading}
                    <!-- ✅ v3: Tombol kuning saat upload berjalan -->
                    <button type="button" disabled
                        class="w-full h-12 bg-amber-500 text-white rounded-xl font-semibold
                               cursor-not-allowed flex items-center justify-center gap-2 opacity-90">
                        <Loader2 class="w-5 h-5 animate-spin" />
                        <span>Tunggu Upload Selesai...</span>
                    </button>
                {:else}
                    <!-- Tombol normal -->
                    <button type="submit"
                        disabled={!canSubmit}
                        class="w-full h-12 bg-emerald-600 text-white rounded-xl font-semibold
                               hover:bg-emerald-700 transition-colors disabled:opacity-50 
                               disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {#if isSubmitting}
                            <Loader2 class="w-5 h-5 animate-spin" />
                        {/if}
                        <span>{mode === 'add' ? 'Simpan Produk' : 'Simpan Perubahan'}</span>
                    </button>
                {/if}
            </div>
        </form>
    </div>
{/if}