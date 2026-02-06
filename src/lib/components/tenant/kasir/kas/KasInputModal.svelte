<!--
    KasInputModal.svelte
    ============================================
    Modal untuk input kas masuk/keluar
    - Pilih tipe (masuk/keluar)
    - Pilih kategori
    - Input jumlah
    - Keterangan wajib
    - Penerima (untuk kas keluar)
    ============================================
-->
<script>
    import { createEventDispatcher } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { 
        X, ArrowDownCircle, ArrowUpCircle, 
        Wallet, FileText, User, Loader2,
        AlertCircle, CheckCircle
    } from 'lucide-svelte';
    import { formatRupiah } from '$lib/utils/format.js';

    /** @type {boolean} */
    export let open = false;

    /** @type {'masuk'|'keluar'|null} - Pre-select tipe */
    export let initialTipe = null;

    /** @type {Array} - Daftar kategori kas */
    export let kategoriList = [];

    /** @type {Object|null} - Data shift aktif */
    export let activeShift = null;

    /** @type {number} - Limit kas keluar untuk kasir (0 = tidak boleh) */
    export let limitKasKeluar = 0;

    /** @type {boolean} - Apakah user adalah kasir */
    export let isKasir = false;

    /** @type {boolean} - Sedang proses */
    export let isLoading = false;

    const dispatch = createEventDispatcher();

    // Form state
    let tipe = initialTipe || 'keluar';
    let kategoriId = '';
    let jumlah = 0;
    let keterangan = '';
    let penerima = '';

    // Error state
    let errors = {};

    // Reset form saat modal dibuka
    $: if (open) {
        resetForm();
    }

    // Filter kategori berdasarkan tipe
    $: filteredKategori = kategoriList.filter(k => 
        k.tipe === tipe || k.tipe === 'semua'
    );

    // Validasi limit kas keluar untuk kasir
    $: isOverLimit = isKasir && tipe === 'keluar' && limitKasKeluar > 0 && jumlah > limitKasKeluar;
    $: kasirCannotKasKeluar = isKasir && tipe === 'keluar' && limitKasKeluar === 0;

    function resetForm() {
        tipe = initialTipe || 'keluar';
        kategoriId = '';
        jumlah = 0;
        keterangan = '';
        penerima = '';
        errors = {};
    }

    function validate() {
        errors = {};

        if (!tipe) {
            errors.tipe = 'Pilih tipe kas';
        }

        if (!jumlah || jumlah <= 0) {
            errors.jumlah = 'Jumlah harus lebih dari 0';
        }

        if (!keterangan.trim()) {
            errors.keterangan = 'Keterangan wajib diisi';
        }

        if (tipe === 'keluar' && !penerima.trim()) {
            errors.penerima = 'Penerima wajib diisi untuk kas keluar';
        }

        // Validasi khusus kasir
        if (isKasir && tipe === 'keluar') {
            if (limitKasKeluar === 0) {
                errors.tipe = 'Anda tidak memiliki izin untuk kas keluar';
            } else if (jumlah > limitKasKeluar) {
                errors.jumlah = `Maksimal kas keluar Anda adalah ${formatRupiah(limitKasKeluar)}`;
            }
        }

        return Object.keys(errors).length === 0;
    }

    function handleSubmit() {
        if (!validate()) return;

        dispatch('submit', {
            tipe,
            kategori_kas_id: kategoriId || null,
            jumlah,
            keterangan: keterangan.trim(),
            penerima: tipe === 'keluar' ? penerima.trim() : null,
            shift_id: activeShift?.id || null
        });
    }

    function close() {
        if (isLoading) return;
        dispatch('close');
        open = false;
    }

    function handleKeydown(e) {
        if (e.key === 'Escape' && !isLoading) close();
    }

    // Quick amounts
    const quickAmounts = [
        { label: '10rb', value: 10000 },
        { label: '20rb', value: 20000 },
        { label: '50rb', value: 50000 },
        { label: '100rb', value: 100000 },
        { label: '200rb', value: 200000 },
        { label: '500rb', value: 500000 },
    ];
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
    <!-- Backdrop -->
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
        on:click={close}
        on:keypress={() => {}}
        role="button"
        tabindex="-1"
    >
        <!-- Modal -->
        <div 
            transition:fly={{ y: 100, duration: 250 }}
            class="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] 
                   overflow-hidden flex flex-col"
            on:click|stopPropagation
            on:keypress|stopPropagation
            role="dialog"
            aria-modal="true"
        >
            <!-- Drag Handle (Mobile) -->
            <div class="sm:hidden flex justify-center pt-3 pb-1">
                <div class="w-10 h-1 bg-slate-300 rounded-full"></div>
            </div>

            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Wallet class="w-5 h-5 text-emerald-600" />
                    <span>Input Kas {tipe === 'masuk' ? 'Masuk' : 'Keluar'}</span>
                </h2>
                <button 
                    type="button"
                    on:click={close}
                    disabled={isLoading}
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 
                           rounded-lg disabled:opacity-50"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
                
                <!-- Shift Info -->
                {#if activeShift}
                    <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
                        <CheckCircle class="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <div class="text-sm">
                            <p class="font-medium text-emerald-800">Shift Aktif: {activeShift.no_shift}</p>
                            <p class="text-emerald-600 text-xs">Kas akan tercatat dalam shift ini</p>
                        </div>
                    </div>
                {:else}
                    <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                        <AlertCircle class="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div class="text-sm">
                            <p class="font-medium text-amber-800">Tidak ada shift aktif</p>
                            <p class="text-amber-600 text-xs">Kas akan tercatat tanpa shift</p>
                        </div>
                    </div>
                {/if}

                <!-- Tipe Kas -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                        Tipe Transaksi <span class="text-red-500">*</span>
                    </label>
                    <div class="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            on:click={() => tipe = 'masuk'}
                            disabled={isLoading}
                            class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl 
                                   border-2 transition-all
                                   {tipe === 'masuk' 
                                       ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                       : 'border-slate-200 text-slate-600 hover:border-slate-300'}"
                        >
                            <ArrowDownCircle class="w-5 h-5" />
                            <span class="font-medium">Kas Masuk</span>
                        </button>
                        <button
                            type="button"
                            on:click={() => tipe = 'keluar'}
                            disabled={isLoading || kasirCannotKasKeluar}
                            class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl 
                                   border-2 transition-all
                                   {tipe === 'keluar' 
                                       ? 'border-red-500 bg-red-50 text-red-700' 
                                       : 'border-slate-200 text-slate-600 hover:border-slate-300'}
                                   {kasirCannotKasKeluar ? 'opacity-50 cursor-not-allowed' : ''}"
                        >
                            <ArrowUpCircle class="w-5 h-5" />
                            <span class="font-medium">Kas Keluar</span>
                        </button>
                    </div>
                    {#if errors.tipe}
                        <p class="text-red-500 text-xs mt-1">{errors.tipe}</p>
                    {/if}
                    {#if kasirCannotKasKeluar}
                        <p class="text-amber-600 text-xs mt-1">
                            Anda tidak memiliki izin untuk kas keluar. Hubungi Owner/Admin.
                        </p>
                    {/if}
                </div>

                <!-- Kategori -->
                {#if filteredKategori.length > 0}
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                            Kategori
                        </label>
                        <select
                            bind:value={kategoriId}
                            disabled={isLoading}
                            class="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm
                                   focus:outline-none focus:border-emerald-500 bg-white"
                        >
                            <option value="">-- Pilih Kategori (Opsional) --</option>
                            {#each filteredKategori as kat}
                                <option value={kat.id}>{kat.nama}</option>
                            {/each}
                        </select>
                    </div>
                {/if}

                <!-- Jumlah -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                        Jumlah <span class="text-red-500">*</span>
                    </label>
                    
                    <!-- Quick Amounts -->
                    <div class="grid grid-cols-3 gap-2 mb-3">
                        {#each quickAmounts as amt}
                            <button
                                type="button"
                                on:click={() => jumlah = amt.value}
                                disabled={isLoading}
                                class="py-2 border rounded-lg text-sm font-medium transition-all
                                       {jumlah === amt.value 
                                           ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                           : 'border-slate-200 text-slate-600 hover:border-slate-300'}"
                            >
                                {amt.label}
                            </button>
                        {/each}
                    </div>
                    
                    <!-- Input Jumlah -->
                    <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                            Rp
                        </span>
                        <input 
                            type="number" 
                            bind:value={jumlah}
                            disabled={isLoading}
                            inputmode="numeric"
                            placeholder="0"
                            class="w-full h-14 pl-12 pr-4 border rounded-xl text-xl font-bold
                                   focus:outline-none focus:border-emerald-500 number-input
                                   {errors.jumlah ? 'border-red-300' : 'border-slate-200'}"
                        />
                    </div>
                    {#if errors.jumlah}
                        <p class="text-red-500 text-xs mt-1">{errors.jumlah}</p>
                    {/if}
                    {#if isOverLimit}
                        <p class="text-amber-600 text-xs mt-1">
                            ⚠️ Melebihi limit Anda ({formatRupiah(limitKasKeluar)})
                        </p>
                    {/if}
                </div>

                <!-- Keterangan -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                        Keterangan <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <FileText class="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <textarea
                            bind:value={keterangan}
                            disabled={isLoading}
                            rows="2"
                            placeholder="Contoh: Beli gas LPG 3kg"
                            class="w-full pl-10 pr-4 py-3 border rounded-xl text-sm resize-none
                                   focus:outline-none focus:border-emerald-500
                                   {errors.keterangan ? 'border-red-300' : 'border-slate-200'}"
                        ></textarea>
                    </div>
                    {#if errors.keterangan}
                        <p class="text-red-500 text-xs mt-1">{errors.keterangan}</p>
                    {/if}
                </div>

                <!-- Penerima (hanya untuk kas keluar) -->
                {#if tipe === 'keluar'}
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                            Penerima <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <User class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                bind:value={penerima}
                                disabled={isLoading}
                                placeholder="Nama penerima uang"
                                class="w-full h-12 pl-10 pr-4 border rounded-xl text-sm
                                       focus:outline-none focus:border-emerald-500
                                       {errors.penerima ? 'border-red-300' : 'border-slate-200'}"
                            />
                        </div>
                        {#if errors.penerima}
                            <p class="text-red-500 text-xs mt-1">{errors.penerima}</p>
                        {/if}
                    </div>
                {/if}
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
                <!-- Preview -->
                {#if jumlah > 0}
                    <div class="flex justify-between items-center p-3 rounded-xl
                               {tipe === 'masuk' ? 'bg-emerald-100' : 'bg-red-100'}">
                        <span class="text-sm font-medium 
                                    {tipe === 'masuk' ? 'text-emerald-700' : 'text-red-700'}">
                            {tipe === 'masuk' ? 'Kas Masuk' : 'Kas Keluar'}
                        </span>
                        <span class="text-lg font-bold
                                    {tipe === 'masuk' ? 'text-emerald-700' : 'text-red-700'}">
                            {tipe === 'masuk' ? '+' : '-'}{formatRupiah(jumlah)}
                        </span>
                    </div>
                {/if}

                <!-- Buttons -->
                <div class="flex gap-3">
                    <button
                        type="button"
                        on:click={close}
                        disabled={isLoading}
                        class="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl 
                               font-medium hover:bg-slate-100 disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        on:click={handleSubmit}
                        disabled={isLoading || kasirCannotKasKeluar && tipe === 'keluar'}
                        class="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2
                               disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                               {tipe === 'masuk' 
                                   ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                   : 'bg-red-600 hover:bg-red-700 text-white'}"
                    >
                        {#if isLoading}
                            <Loader2 class="w-5 h-5 animate-spin" />
                            <span>Menyimpan...</span>
                        {:else}
                            <CheckCircle class="w-5 h-5" />
                            <span>Simpan</span>
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .number-input::-webkit-inner-spin-button,
    .number-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    .number-input {
        -moz-appearance: textfield;
    }
</style>