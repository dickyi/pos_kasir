<!--
    SuccessModal.svelte - Modal Sukses dengan Struk Kustom
    ======================================================
    UPDATED: 
    - Support tampilan varian di struk
    - Support tampilan merk di struk (conditional)
    - Format label teks: "Merk: xxx" dan "Varian: xxx"
-->
<script>
    import { Check, Printer, Plus, Eye, EyeOff, Layers, Tag } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { scale, fade } from 'svelte/transition';
    import { formatRupiah, formatDateShort } from '$lib/utils/format.js';
    import PrintStruk from './PrintStruk.svelte';

    /** @type {boolean} Apakah modal terbuka */
    export let open = false;
    
    /** @type {Object|null} Data transaksi terakhir */
    export let transaction = null;
    
    /** @type {string} Nama bisnis/toko */
    export let storeName = '';

    /** @type {Object} Pengaturan struk dari database */
    export let strukSettings = {
        struk_logo: null,
        struk_header: '',
        struk_footer: 'Terima kasih atas kunjungan Anda!',
        tampilkan_logo: true,
        tampilkan_alamat: true,
        tampilkan_telepon: true,
        tampilkan_merk_struk: false,
        ukuran_kertas: '58mm',
        auto_print: false
    };

    /** @type {Object} Info toko */
    export let tokoInfo = {
        nama_bisnis: '',
        alamat: '',
        no_telepon: ''
    };

    const dispatch = createEventDispatcher();

    // Reference ke PrintStruk component
    let printStrukRef;

    // Toggle preview mode
    let showFullStruk = false;

    // Check apakah tampilkan merk di struk
    $: showMerkStruk = strukSettings.tampilkan_merk_struk === true || strukSettings.tampilkan_merk_struk === 1;

    // Transform transaction data untuk PrintStruk
    $: strukTransaksi = transaction ? {
        no_invoice: transaction.no_invoice,
        tanggal: transaction.tanggal,
        waktu: transaction.waktu,
        items: (transaction.items || []).map(item => ({
            nama: item.nama_produk,
            nama_varian: item.nama_varian || null,
            nama_merk: item.nama_merk || null,
            qty: item.qty,
            harga: item.harga_jual
        })),
        subtotal: transaction.subtotal,
        diskon: transaction.diskon || 0,
        pajak: transaction.pajak || 0,
        total: transaction.total,
        bayar: transaction.bayar,
        kembalian: transaction.kembalian,
        metode_bayar: transaction.metode_bayar === 'cash' ? 'Tunai' : 
                      transaction.metode_bayar === 'qris' ? 'QRIS' : 
                      transaction.metode_bayar === 'transfer' ? 'Transfer' : 
                      transaction.metode_bayar,
        kasir: transaction.kasir,
        nama_customer: transaction.nama_customer
    } : {};

    // Transform toko info untuk PrintStruk
    $: strukToko = {
        nama: tokoInfo.nama_bisnis || transaction?.toko || storeName || 'Toko',
        alamat: tokoInfo.alamat || '',
        telepon: tokoInfo.no_telepon || ''
    };

    function handlePrint() {
        if (printStrukRef) {
            printStrukRef.print();
        } else {
            window.print();
        }
    }

    function handleNewTransaction() {
        dispatch('newTransaction');
    }

    // Auto print jika enabled
    $: if (open && transaction && strukSettings.auto_print && printStrukRef) {
        setTimeout(() => {
            printStrukRef?.print();
        }, 500);
    }
</script>

{#if open && transaction}
    <div 
        transition:fade={{ duration: 150 }} 
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
        <div 
            transition:scale={{ duration: 200, start: 0.95 }} 
            class="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
        >
            <!-- Success Header -->
            <div class="p-6 text-center bg-emerald-600 text-white">
                <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check class="w-8 h-8" />
                </div>
                <h3 class="text-xl font-bold">Pembayaran Berhasil!</h3>
                <p class="text-emerald-100 text-sm mt-1">{transaction.no_invoice}</p>
            </div>

            <!-- Receipt Preview -->
            <div class="p-4 max-h-[50vh] overflow-y-auto bg-slate-50">
                <!-- Toggle Full Struk View -->
                <button
                    type="button"
                    on:click={() => showFullStruk = !showFullStruk}
                    class="w-full mb-3 py-2 px-3 bg-white border border-slate-200 rounded-lg
                           flex items-center justify-center gap-2 text-sm text-slate-600
                           hover:bg-slate-50 transition-colors"
                >
                    {#if showFullStruk}
                        <EyeOff class="w-4 h-4" />
                        <span>Sembunyikan Preview Struk</span>
                    {:else}
                        <Eye class="w-4 h-4" />
                        <span>Lihat Preview Struk</span>
                    {/if}
                </button>

                {#if showFullStruk}
                    <!-- Full Struk Preview - Format Label Teks -->
                    <div class="bg-white rounded-lg border border-slate-200 p-3 font-mono text-xs">
                        <!-- Logo -->
                        {#if strukSettings.tampilkan_logo && strukSettings.struk_logo}
                            <div class="flex justify-center mb-2">
                                <img 
                                    src={strukSettings.struk_logo} 
                                    alt="Logo" 
                                    class="h-10 object-contain"
                                />
                            </div>
                        {/if}

                        <!-- Nama Toko -->
                        <div class="text-center font-bold text-sm">
                            {strukToko.nama}
                        </div>

                        <!-- Alamat -->
                        {#if strukSettings.tampilkan_alamat && strukToko.alamat}
                            <div class="text-center text-slate-500 text-[10px]">
                                {strukToko.alamat}
                            </div>
                        {/if}

                        <!-- Telepon -->
                        {#if strukSettings.tampilkan_telepon && strukToko.telepon}
                            <div class="text-center text-slate-500 text-[10px]">
                                Telp: {strukToko.telepon}
                            </div>
                        {/if}

                        <!-- Header Custom -->
                        {#if strukSettings.struk_header}
                            <div class="text-center text-slate-500 text-[10px] italic mt-1">
                                {strukSettings.struk_header}
                            </div>
                        {/if}

                        <div class="text-center text-slate-300 my-2">------------------------</div>

                        <!-- Info Transaksi -->
                        <div class="space-y-0.5 text-[10px]">
                            <div class="flex justify-between">
                                <span>No</span>
                                <span>{strukTransaksi.no_invoice}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Tanggal</span>
                                <span>{formatDateShort(strukTransaksi.tanggal)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Kasir</span>
                                <span>{strukTransaksi.kasir}</span>
                            </div>
                        </div>

                        <div class="text-center text-slate-300 my-2">------------------------</div>

                        <!-- Items - Format Label Teks -->
                        <div class="space-y-1.5">
                            {#each strukTransaksi.items || [] as item}
                                <div>
                                    <div class="font-medium text-[10px]">{item.nama}</div>
                                    
                                    <!-- Merk dengan label teks -->
                                    {#if showMerkStruk && item.nama_merk}
                                        <div class="text-[9px] text-purple-600 ml-2">
                                            Merk: {item.nama_merk}
                                        </div>
                                    {/if}
                                    
                                    <!-- Varian dengan label teks -->
                                    {#if item.nama_varian}
                                        <div class="text-[9px] text-slate-500 ml-2">
                                            Varian: {item.nama_varian}
                                        </div>
                                    {/if}
                                    
                                    <div class="flex justify-between text-slate-500 text-[10px]">
                                        <span>{item.qty} x {formatRupiah(item.harga)}</span>
                                        <span>{formatRupiah(item.qty * item.harga)}</span>
                                    </div>
                                </div>
                            {/each}
                        </div>

                        <div class="text-center text-slate-300 my-2">------------------------</div>

                        <!-- Totals -->
                        <div class="space-y-0.5 text-[10px]">
                            <div class="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatRupiah(strukTransaksi.subtotal)}</span>
                            </div>
                            {#if strukTransaksi.diskon > 0}
                                <div class="flex justify-between text-red-500">
                                    <span>Diskon</span>
                                    <span>-{formatRupiah(strukTransaksi.diskon)}</span>
                                </div>
                            {/if}
                            <div class="flex justify-between font-bold text-xs border-t border-dashed pt-1 mt-1">
                                <span>TOTAL</span>
                                <span>{formatRupiah(strukTransaksi.total)}</span>
                            </div>
                        </div>

                        <div class="text-center text-slate-300 my-2">------------------------</div>

                        <!-- Payment -->
                        <div class="space-y-0.5 text-[10px]">
                            <div class="flex justify-between">
                                <span>Bayar ({strukTransaksi.metode_bayar})</span>
                                <span>{formatRupiah(strukTransaksi.bayar)}</span>
                            </div>
                            <div class="flex justify-between font-bold">
                                <span>Kembalian</span>
                                <span>{formatRupiah(strukTransaksi.kembalian)}</span>
                            </div>
                        </div>

                        <div class="text-center text-slate-300 my-2">------------------------</div>

                        <!-- Custom Footer -->
                        {#if strukSettings.struk_footer}
                            <div class="text-center text-slate-500 text-[10px] whitespace-pre-line">
                                {strukSettings.struk_footer}
                            </div>
                        {/if}
                    </div>
                {:else}
                    <!-- Simple Receipt Summary - Format Label Teks -->
                    <div class="bg-white rounded-lg border border-slate-200 p-4">
                        <!-- Store Info -->
                        <div class="text-center border-b border-dashed border-slate-200 pb-3 mb-3">
                            {#if strukSettings.tampilkan_logo && strukSettings.struk_logo}
                                <img 
                                    src={strukSettings.struk_logo} 
                                    alt="Logo" 
                                    class="h-8 object-contain mx-auto mb-2"
                                />
                            {/if}
                            <p class="font-bold text-slate-800">{strukToko.nama}</p>
                            <p class="text-xs text-slate-500">{formatDateShort(transaction.tanggal)}</p>
                        </div>

                        <!-- Items Summary with Merk & Varian Label -->
                        <div class="space-y-2 mb-3 max-h-32 overflow-y-auto">
                            {#each transaction.items || [] as item}
                                <div class="flex justify-between text-sm">
                                    <div class="flex-1 min-w-0">
                                        <span class="text-slate-700">{item.nama_produk}</span>
                                        
                                        <!-- Merk dengan label -->
                                        {#if showMerkStruk && item.nama_merk}
                                            <span class="block text-xs text-purple-600 ml-2">
                                                Merk: {item.nama_merk}
                                            </span>
                                        {/if}
                                        
                                        <!-- Varian dengan label -->
                                        {#if item.nama_varian}
                                            <span class="block text-xs text-slate-500 ml-2">
                                                Varian: {item.nama_varian}
                                            </span>
                                        {/if}
                                    </div>
                                    <span class="text-slate-600 flex-shrink-0 ml-2">
                                        {item.qty}x
                                    </span>
                                </div>
                            {/each}
                        </div>

                        <!-- Items Count -->
                        <div class="text-center text-xs text-slate-500 mb-3 pt-2 border-t border-slate-100">
                            {transaction.items?.length || 0} item • {transaction.total_qty || transaction.items?.reduce((sum, i) => sum + i.qty, 0)} qty
                        </div>

                        <!-- Totals -->
                        <div class="space-y-1 text-sm">
                            {#if transaction.diskon > 0}
                                <div class="flex justify-between">
                                    <span class="text-slate-500">Subtotal</span>
                                    <span>{formatRupiah(transaction.subtotal)}</span>
                                </div>
                                <div class="flex justify-between text-red-500">
                                    <span>Diskon</span>
                                    <span>-{formatRupiah(transaction.diskon)}</span>
                                </div>
                            {/if}
                            <div class="flex justify-between font-bold text-base pt-2 border-t border-slate-100">
                                <span>Total</span>
                                <span class="text-emerald-600">{formatRupiah(transaction.total)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">Bayar ({strukTransaksi.metode_bayar})</span>
                                <span>{formatRupiah(transaction.bayar)}</span>
                            </div>
                            {#if transaction.kembalian > 0}
                                <div class="flex justify-between font-medium text-blue-600">
                                    <span>Kembalian</span>
                                    <span>{formatRupiah(transaction.kembalian)}</span>
                                </div>
                            {/if}
                        </div>

                        <!-- Custom Footer Preview -->
                        {#if strukSettings.struk_footer}
                            <div class="text-center mt-4 pt-3 border-t border-dashed border-slate-200">
                                <p class="text-sm text-slate-600">{strukSettings.struk_footer}</p>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>

            <!-- Actions -->
            <div class="p-4 border-t border-slate-100 flex gap-3">
                <button 
                    type="button" 
                    on:click={handlePrint}
                    class="flex-1 h-12 border border-slate-200 text-slate-600 rounded-xl font-medium
                           flex items-center justify-center gap-2 active:bg-slate-50 hover:bg-slate-50
                           transition-colors"
                >
                    <Printer class="w-5 h-5" />
                    <span>Cetak Struk</span>
                </button>
                <button 
                    type="button" 
                    on:click={handleNewTransaction}
                    class="flex-1 h-12 bg-emerald-600 text-white rounded-xl font-medium 
                           flex items-center justify-center gap-2 active:bg-emerald-700 hover:bg-emerald-700
                           transition-colors"
                >
                    <Plus class="w-5 h-5" />
                    <span>Transaksi Baru</span>
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Hidden PrintStruk Component untuk cetak -->
{#if transaction}
    <PrintStruk
        bind:this={printStrukRef}
        settings={strukSettings}
        toko={strukToko}
        transaksi={strukTransaksi}
        showMerk={showMerkStruk}
    />
{/if}