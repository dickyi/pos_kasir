<!--
    TransactionDetailModal.svelte - Modal Detail Transaksi dengan Struk Kustom
    ============================================
    + Integrasi PrintStruk untuk cetak struk thermal
    + Permission support untuk void/batalkan
    ============================================
-->
<script>
    import { createEventDispatcher } from 'svelte';
    import { enhance } from '$app/forms';
    import { fly, fade } from 'svelte/transition';
    import { 
        X, Receipt, Calendar, Clock, User, CreditCard, 
        Package, Printer, CheckCircle, XCircle, AlertCircle,
        ShoppingBag, Hash, Loader2, Lock, UserCircle, Eye
    } from 'lucide-svelte';
    import PrintStruk from '../kasir/PrintStruk.svelte';

    const dispatch = createEventDispatcher();

    export let open = false;
    export let transaction = null;
    export let details = [];
    export let storeName = '';
    export let canVoid = false;
    
    // Struk settings (NEW)
    export let strukSettings = {
        struk_logo: null,
        struk_header: '',
        struk_footer: 'Terima kasih atas kunjungan Anda!',
        tampilkan_logo: true,
        tampilkan_alamat: true,
        tampilkan_telepon: true,
        ukuran_kertas: '58mm'
    };
    
    // Toko info (NEW)
    export let tokoInfo = {
        nama_bisnis: '',
        alamat: '',
        no_telepon: ''
    };

    let isPrinting = false;
    let isCancelling = false;
    let printStrukRef;
    let showStrukPreview = false;

    function close() {
        open = false;
        showStrukPreview = false;
        dispatch('close');
    }

    // Format currency
    function formatRupiah(num) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num || 0);
    }

    // Format date
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // Format time
    function formatTime(timeStr) {
        if (!timeStr) return '-';
        return timeStr.substring(0, 5);
    }

    // Get status config
    function getStatusConfig(status) {
        const configs = {
            success: { 
                label: 'Sukses', 
                color: 'bg-emerald-100 text-emerald-700',
                icon: CheckCircle
            },
            pending: { 
                label: 'Pending', 
                color: 'bg-amber-100 text-amber-700',
                icon: AlertCircle
            },
            cancelled: { 
                label: 'Dibatalkan', 
                color: 'bg-red-100 text-red-700',
                icon: XCircle
            },
            refund: { 
                label: 'Refund', 
                color: 'bg-purple-100 text-purple-700',
                icon: XCircle
            }
        };
        return configs[status] || configs.pending;
    }

    // Get payment method label
    function getPaymentLabel(method) {
        const labels = {
            cash: 'Tunai',
            transfer: 'Transfer',
            qris: 'QRIS',
            debit: 'Kartu Debit',
            kredit: 'Kartu Kredit'
        };
        return labels[method] || method;
    }

    // Transform data untuk PrintStruk
    $: strukToko = {
        nama: tokoInfo.nama_bisnis || transaction?.nama_bisnis || storeName || 'Toko',
        alamat: tokoInfo.alamat || transaction?.alamat_toko || '',
        telepon: tokoInfo.no_telepon || transaction?.telepon_toko || ''
    };

    $: strukTransaksi = transaction ? {
        no_invoice: transaction.no_invoice,
        tanggal: transaction.tanggal,
        waktu: transaction.waktu,
        items: (details || []).map(item => ({
            nama: item.nama_produk,
            qty: item.qty,
            harga: item.harga
        })),
        subtotal: transaction.subtotal,
        diskon: transaction.diskon || 0,
        pajak: transaction.pajak || 0,
        total: transaction.total,
        bayar: transaction.bayar,
        kembalian: transaction.kembalian,
        metode_bayar: getPaymentLabel(transaction.metode_bayar),
        kasir: transaction.kasir_nama || '-',
        nama_customer: transaction.nama_customer
    } : {};

    // Handle print dengan PrintStruk
    function handlePrint() {
        isPrinting = true;
        
        if (printStrukRef) {
            printStrukRef.print();
            setTimeout(() => {
                isPrinting = false;
            }, 1000);
        } else {
            // Fallback ke window.print() jika PrintStruk tidak ready
            setTimeout(() => {
                window.print();
                isPrinting = false;
            }, 100);
        }
    }

    // Handle cancel form submission
    function handleCancelSubmit() {
        return async ({ result, update }) => {
            isCancelling = false;
            if (result.type === 'success') {
                close();
            }
            await update();
        };
    }

    $: statusConfig = transaction ? getStatusConfig(transaction.status) : null;
    $: totalItems = details.reduce((sum, d) => sum + (d.qty || 0), 0);
    $: canCancel = canVoid && transaction?.status === 'success';
</script>

{#if open && transaction}
    <!-- Backdrop -->
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 print:hidden"
        on:click={close}
        on:keypress={(e) => e.key === 'Escape' && close()}
        role="button"
        tabindex="-1"
    ></div>

    <!-- Modal -->
    <div 
        transition:fly={{ y: 20, duration: 200 }}
        class="fixed inset-x-4 top-[2%] bottom-[2%] sm:inset-auto sm:left-1/2 sm:top-1/2 
               sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg
               bg-white rounded-2xl shadow-2xl z-50 flex flex-col max-h-[96vh]"
    >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Receipt class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-slate-800">
                        {transaction.no_invoice}
                    </h2>
                    <p class="text-xs text-slate-500">
                        {storeName || transaction.nama_bisnis || 'Detail Transaksi'}
                    </p>
                </div>
            </div>
            
            <div class="flex items-center gap-2">
                {#if statusConfig}
                    <span class="px-2.5 py-1 rounded-full text-xs font-medium {statusConfig.color}">
                        {statusConfig.label}
                    </span>
                {/if}
                
                <button
                    on:click={close}
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 
                           rounded-lg transition-colors"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
            
            <!-- Toggle Struk Preview -->
            <button
                type="button"
                on:click={() => showStrukPreview = !showStrukPreview}
                class="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl
                       flex items-center justify-center gap-2 text-sm text-slate-600
                       transition-colors"
            >
                <Eye class="w-4 h-4" />
                <span>{showStrukPreview ? 'Sembunyikan' : 'Lihat'} Preview Struk</span>
            </button>

            <!-- Struk Preview -->
            {#if showStrukPreview}
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div class="bg-white rounded-lg border border-slate-200 p-3 font-mono text-xs max-h-64 overflow-y-auto">
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

                        {#if strukSettings.tampilkan_alamat && strukToko.alamat}
                            <div class="text-center text-slate-500 text-[10px]">
                                {strukToko.alamat}
                            </div>
                        {/if}

                        {#if strukSettings.tampilkan_telepon && strukToko.telepon}
                            <div class="text-center text-slate-500 text-[10px]">
                                Telp: {strukToko.telepon}
                            </div>
                        {/if}

                        {#if strukSettings.struk_header}
                            <div class="text-center text-slate-500 text-[10px] italic mt-1">
                                {strukSettings.struk_header}
                            </div>
                        {/if}

                        <div class="text-center text-slate-300 my-2">------------------------</div>

                        <div class="space-y-0.5 text-[10px]">
                            <div class="flex justify-between">
                                <span>No</span>
                                <span>{transaction.no_invoice}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Tanggal</span>
                                <span>{new Date(transaction.tanggal).toLocaleDateString('id-ID')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Kasir</span>
                                <span>{transaction.kasir_nama || '-'}</span>
                            </div>
                        </div>

                        <div class="text-center text-slate-300 my-2">------------------------</div>

                        <div class="space-y-1">
                            {#each details as item}
                                <div>
                                    <div class="font-medium text-[10px]">{item.nama_produk}</div>
                                    <div class="flex justify-between text-slate-500 text-[10px]">
                                        <span>{item.qty} x {formatRupiah(item.harga)}</span>
                                        <span>{formatRupiah(item.subtotal)}</span>
                                    </div>
                                </div>
                            {/each}
                        </div>

                        <div class="text-center text-slate-300 my-2">------------------------</div>

                        <div class="space-y-0.5 text-[10px]">
                            <div class="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatRupiah(transaction.subtotal)}</span>
                            </div>
                            {#if transaction.diskon > 0}
                                <div class="flex justify-between text-red-500">
                                    <span>Diskon</span>
                                    <span>-{formatRupiah(transaction.diskon)}</span>
                                </div>
                            {/if}
                            <div class="flex justify-between font-bold text-xs border-t border-dashed pt-1 mt-1">
                                <span>TOTAL</span>
                                <span>{formatRupiah(transaction.total)}</span>
                            </div>
                        </div>

                        <div class="text-center text-slate-300 my-2">------------------------</div>

                        <div class="space-y-0.5 text-[10px]">
                            <div class="flex justify-between">
                                <span>Bayar ({getPaymentLabel(transaction.metode_bayar)})</span>
                                <span>{formatRupiah(transaction.bayar)}</span>
                            </div>
                            <div class="flex justify-between font-bold">
                                <span>Kembalian</span>
                                <span>{formatRupiah(transaction.kembalian)}</span>
                            </div>
                        </div>

                        <div class="text-center text-slate-300 my-2">------------------------</div>

                        {#if strukSettings.struk_footer}
                            <div class="text-center text-slate-500 text-[10px] whitespace-pre-line">
                                {strukSettings.struk_footer}
                            </div>
                        {/if}
                    </div>
                </div>
            {:else}
                <!-- Transaction Info (default view) -->
                <div class="grid grid-cols-2 gap-3">
                    <div class="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        <Calendar class="w-4 h-4 text-slate-400" />
                        <div>
                            <p class="text-xs text-slate-500">Tanggal</p>
                            <p class="text-sm font-medium text-slate-700">{formatDate(transaction.tanggal)}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        <Clock class="w-4 h-4 text-slate-400" />
                        <div>
                            <p class="text-xs text-slate-500">Waktu</p>
                            <p class="text-sm font-medium text-slate-700">{formatTime(transaction.waktu)}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        <CreditCard class="w-4 h-4 text-slate-400" />
                        <div>
                            <p class="text-xs text-slate-500">Pembayaran</p>
                            <p class="text-sm font-medium text-slate-700">{getPaymentLabel(transaction.metode_bayar)}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        <User class="w-4 h-4 text-slate-400" />
                        <div>
                            <p class="text-xs text-slate-500">Customer</p>
                            <p class="text-sm font-medium text-slate-700">{transaction.nama_customer || 'Umum'}</p>
                        </div>
                    </div>
                </div>

                <!-- Kasir Info -->
                {#if transaction.kasir_nama}
                    <div class="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <UserCircle class="w-4 h-4 text-blue-500" />
                        <div>
                            <p class="text-xs text-blue-600">Kasir</p>
                            <p class="text-sm font-medium text-blue-700">{transaction.kasir_nama}</p>
                        </div>
                    </div>
                {/if}

                <!-- Items Header -->
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <ShoppingBag class="w-4 h-4" />
                        Item Pembelian
                    </h3>
                    <span class="text-xs text-slate-500">{totalItems} item</span>
                </div>

                <!-- Items List -->
                <div class="space-y-2">
                    {#each details as item}
                        <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <div class="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-slate-200">
                                {#if item.gambar}
                                    <img 
                                        src={item.gambar} 
                                        alt={item.nama_produk}
                                        class="w-full h-full object-cover"
                                        loading="lazy"
                                        on:error={(e) => e.target.style.display = 'none'}
                                    />
                                {:else}
                                    <div class="w-full h-full flex items-center justify-center text-slate-400">
                                        <Package class="w-6 h-6" />
                                    </div>
                                {/if}
                            </div>

                            <div class="flex-1 min-w-0">
                                <p class="font-medium text-slate-800 truncate text-sm">
                                    {item.nama_produk}
                                </p>
                                <span class="text-xs text-slate-500 font-mono">{item.kode_produk}</span>
                                <p class="text-xs text-slate-500 mt-1">
                                    {item.qty} x {formatRupiah(item.harga)}
                                </p>
                            </div>

                            <div class="text-right flex-shrink-0">
                                <p class="font-semibold text-slate-800">
                                    {formatRupiah(item.subtotal)}
                                </p>
                            </div>
                        </div>
                    {:else}
                        <div class="text-center py-8 text-slate-400">
                            <Package class="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p class="text-sm">Tidak ada item</p>
                        </div>
                    {/each}
                </div>

                <!-- Summary -->
                <div class="border-t border-slate-200 pt-4 space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-500">Subtotal</span>
                        <span class="text-slate-700">{formatRupiah(transaction.subtotal)}</span>
                    </div>
                    
                    {#if transaction.diskon > 0}
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500">Diskon</span>
                            <span class="text-red-600">-{formatRupiah(transaction.diskon)}</span>
                        </div>
                    {/if}
                    
                    {#if transaction.pajak > 0}
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500">Pajak</span>
                            <span class="text-slate-700">{formatRupiah(transaction.pajak)}</span>
                        </div>
                    {/if}
                    
                    <div class="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                        <span class="text-slate-800">Total</span>
                        <span class="text-emerald-600">{formatRupiah(transaction.total)}</span>
                    </div>
                    
                    <div class="flex justify-between text-sm pt-2">
                        <span class="text-slate-500">Bayar ({getPaymentLabel(transaction.metode_bayar)})</span>
                        <span class="text-slate-700">{formatRupiah(transaction.bayar)}</span>
                    </div>
                    
                    {#if transaction.kembalian > 0}
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500">Kembalian</span>
                            <span class="text-blue-600 font-medium">{formatRupiah(transaction.kembalian)}</span>
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- Notes -->
            {#if transaction.catatan}
                <div class="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p class="text-xs text-amber-600 font-medium mb-1">Catatan:</p>
                    <p class="text-sm text-amber-800">{transaction.catatan}</p>
                </div>
            {/if}
        </div>

        <!-- Footer -->
        <div class="flex flex-col gap-3 p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex-shrink-0">
            <!-- Action Buttons Row -->
            <div class="flex gap-3">
                <button
                    on:click={close}
                    class="flex-1 h-11 border border-slate-200 text-slate-600 rounded-xl
                           hover:bg-slate-100 transition-colors font-medium text-sm"
                >
                    Tutup
                </button>
                <button
                    on:click={handlePrint}
                    disabled={isPrinting}
                    class="flex-1 h-11 bg-blue-600 text-white rounded-xl hover:bg-blue-700
                           transition-colors font-medium text-sm flex items-center justify-center gap-2
                           disabled:opacity-50"
                >
                    {#if isPrinting}
                        <Loader2 class="w-4 h-4 animate-spin" />
                    {:else}
                        <Printer class="w-4 h-4" />
                    {/if}
                    <span>Cetak</span>
                </button>
            </div>
            
            <!-- Cancel Button - Only for Owner -->
            {#if canCancel}
                <form 
                    method="POST" 
                    action="?/batalkan" 
                    use:enhance={handleCancelSubmit}
                    on:submit={() => isCancelling = true}
                >
                    <input type="hidden" name="transaksi_id" value={transaction.id} />
                    <button
                        type="submit"
                        disabled={isCancelling}
                        class="w-full h-11 bg-red-50 text-red-600 border border-red-200 rounded-xl 
                               hover:bg-red-100 transition-colors font-medium text-sm 
                               flex items-center justify-center gap-2 disabled:opacity-50"
                        on:click={(e) => {
                            if (!confirm('Yakin ingin membatalkan transaksi ini? Stok akan dikembalikan.')) {
                                e.preventDefault();
                            }
                        }}
                    >
                        {#if isCancelling}
                            <Loader2 class="w-4 h-4 animate-spin" />
                        {:else}
                            <XCircle class="w-4 h-4" />
                        {/if}
                        <span>Batalkan Transaksi</span>
                    </button>
                </form>
            {:else if transaction?.status === 'success' && !canVoid}
                <div class="flex items-center justify-center gap-2 h-11 bg-slate-100 text-slate-400 rounded-xl text-sm">
                    <Lock class="w-4 h-4" />
                    <span>Batalkan: Hubungi Owner</span>
                </div>
            {/if}
        </div>
    </div>
{/if}

<!-- Hidden PrintStruk Component -->
{#if transaction}
    <PrintStruk
        bind:this={printStrukRef}
        settings={strukSettings}
        toko={strukToko}
        transaksi={strukTransaksi}
    />
{/if}