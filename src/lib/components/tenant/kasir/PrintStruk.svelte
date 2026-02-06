<!--
    PrintStruk.svelte - Komponen Cetak Struk
    ============================================
    UPDATED: 
    - Support tampilan varian di struk cetak
    - Support tampilan merk di struk cetak (conditional)
    - Format label teks: "Merk: xxx" dan "Varian: xxx"
-->
<script>
    import { onMount } from 'svelte';
    import { formatRupiah } from '$lib/utils/format.js';

    // Props
    export let settings = {};
    export let toko = {};
    export let transaksi = {};
    export let autoPrint = false;
    export let showMerk = false;

    // Print element reference
    let printContainer;

    // Format tanggal
    function formatTanggal(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }) + ' ' + d.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Paper width in mm
    $: paperWidth = settings.ukuran_kertas === '58mm' ? '48mm' : settings.ukuran_kertas === '80mm' ? '72mm' : '210mm';
    $: fontSize = settings.ukuran_kertas === '58mm' ? '8pt' : settings.ukuran_kertas === '80mm' ? '9pt' : '10pt';

    // Separator line
    $: separatorChar = settings.ukuran_kertas === '58mm' ? 32 : settings.ukuran_kertas === '80mm' ? 48 : 56;
    $: separator = '-'.repeat(separatorChar);

    // Print function
    export function print() {
        if (!printContainer) return;

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        
        if (!printWindow) {
            alert('Popup diblokir! Izinkan popup untuk mencetak struk.');
            return;
        }

        const styles = `
            <style>
                @page {
                    size: ${paperWidth} auto;
                    margin: 0;
                }
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Courier New', monospace;
                    font-size: ${fontSize};
                    line-height: 1.3;
                    padding: 2mm;
                    width: ${paperWidth};
                }
                .center { text-align: center; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
                .separator { 
                    text-align: center; 
                    color: #888;
                    margin: 2mm 0;
                }
                .row {
                    display: flex;
                    justify-content: space-between;
                }
                .item-name { font-weight: 500; }
                .item-merk {
                    font-size: ${settings.ukuran_kertas === '58mm' ? '7pt' : '8pt'};
                    color: #666;
                    padding-left: 2mm;
                }
                .item-variant {
                    font-size: ${settings.ukuran_kertas === '58mm' ? '7pt' : '8pt'};
                    color: #666;
                    padding-left: 2mm;
                }
                .item-detail { 
                    display: flex; 
                    justify-content: space-between;
                    color: #555;
                }
                .total-row {
                    font-weight: bold;
                    font-size: ${settings.ukuran_kertas === '58mm' ? '10pt' : '11pt'};
                    border-top: 1px dashed #888;
                    padding-top: 2mm;
                    margin-top: 1mm;
                }
                .logo {
                    display: block;
                    max-height: 15mm;
                    margin: 0 auto 2mm;
                }
                .footer {
                    margin-top: 3mm;
                    white-space: pre-line;
                }
                .timestamp {
                    margin-top: 2mm;
                    font-size: 7pt;
                    color: #999;
                }
            </style>
        `;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Struk ${transaksi.no_invoice}</title>
                ${styles}
            </head>
            <body>
                ${printContainer.innerHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                <\/script>
            </body>
            </html>
        `);

        printWindow.document.close();
    }

    // Auto print on mount if enabled
    onMount(() => {
        if (autoPrint) {
            setTimeout(print, 500);
        }
    });
</script>

<!-- Hidden print container -->
<div bind:this={printContainer} class="hidden print:block">
    <!-- Logo -->
    {#if settings.tampilkan_logo && settings.struk_logo}
        <div class="center">
            <img src={settings.struk_logo} alt="Logo" class="logo" />
        </div>
    {/if}

    <!-- Nama Toko -->
    <div class="center bold" style="font-size: {settings.ukuran_kertas === '58mm' ? '10pt' : '12pt'}">
        {toko.nama || 'Nama Toko'}
    </div>

    <!-- Alamat -->
    {#if settings.tampilkan_alamat && toko.alamat}
        <div class="center" style="font-size: 7pt; color: #555;">
            {toko.alamat}
        </div>
    {/if}

    <!-- Telepon -->
    {#if settings.tampilkan_telepon && toko.telepon}
        <div class="center" style="font-size: 7pt; color: #555;">
            Telp: {toko.telepon}
        </div>
    {/if}

    <!-- Custom Header -->
    {#if settings.struk_header}
        <div class="center" style="font-size: 7pt; font-style: italic; margin-top: 1mm;">
            {settings.struk_header}
        </div>
    {/if}

    <div class="separator">{separator}</div>

    <!-- Info Transaksi -->
    <div class="row"><span>No</span><span>{transaksi.no_invoice || '-'}</span></div>
    <div class="row"><span>Tanggal</span><span>{formatTanggal(transaksi.tanggal)}</span></div>
    <div class="row"><span>Kasir</span><span>{transaksi.kasir || '-'}</span></div>
    {#if transaksi.nama_customer}
        <div class="row"><span>Customer</span><span>{transaksi.nama_customer}</span></div>
    {/if}

    <div class="separator">{separator}</div>

    <!-- Items - Format Label Teks -->
    {#each transaksi.items || [] as item}
        <div style="margin-bottom: 1.5mm;">
            <!-- Nama Produk -->
            <div class="item-name">{item.nama || item.nama_produk}</div>
            
            <!-- Merk dengan label teks (conditional) -->
            {#if showMerk && item.nama_merk}
                <div class="item-merk">Merk: {item.nama_merk}</div>
            {/if}
            
            <!-- Varian dengan label teks -->
            {#if item.nama_varian}
                <div class="item-variant">Varian: {item.nama_varian}</div>
            {/if}
            
            <!-- Qty x Harga = Subtotal -->
            <div class="item-detail">
                <span>{item.qty} x {formatRupiah(item.harga || item.harga_jual)}</span>
                <span>{formatRupiah(item.qty * (item.harga || item.harga_jual))}</span>
            </div>
        </div>
    {/each}

    <div class="separator">{separator}</div>

    <!-- Totals -->
    <div class="row"><span>Subtotal</span><span>{formatRupiah(transaksi.subtotal || 0)}</span></div>
    
    {#if transaksi.diskon > 0}
        <div class="row" style="color: #d00;"><span>Diskon</span><span>-{formatRupiah(transaksi.diskon)}</span></div>
    {/if}
    
    {#if transaksi.pajak > 0}
        <div class="row"><span>Pajak</span><span>{formatRupiah(transaksi.pajak)}</span></div>
    {/if}
    
    <div class="row total-row">
        <span>TOTAL</span>
        <span>{formatRupiah(transaksi.total || 0)}</span>
    </div>

    <div class="separator">{separator}</div>

    <!-- Payment -->
    <div class="row"><span>Bayar ({transaksi.metode_bayar || 'Tunai'})</span><span>{formatRupiah(transaksi.bayar || 0)}</span></div>
    <div class="row bold"><span>Kembalian</span><span>{formatRupiah(transaksi.kembalian || 0)}</span></div>

    <div class="separator">{separator}</div>

    <!-- Custom Footer -->
    {#if settings.struk_footer}
        <div class="center footer">
            {settings.struk_footer}
        </div>
    {/if}

    <!-- Timestamp -->
    <div class="center timestamp">
        Dicetak: {formatTanggal(new Date())}
    </div>
</div>

<!-- Visual preview (for debugging, normally hidden) -->
<slot />