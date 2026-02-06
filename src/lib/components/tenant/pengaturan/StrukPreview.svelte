<!--
    StrukPreview.svelte - Preview Struk Realtime
    ============================================
    Menampilkan preview struk dengan setting yang dikustomisasi
    UPDATED:
    - Support tampilan merk (conditional)
    - Support tampilan varian
    - Format label teks: "Merk: xxx" dan "Varian: xxx"
    Digunakan di:
    - Halaman Pengaturan (preview)
    - Halaman Kasir (sebelum/sesudah print)
-->
<script>
    import { formatRupiah } from '$lib/utils/format.js';

    // Props
    export let settings = {};
    export let toko = {};
    export let transaksi = {};
    export let ukuran = '58mm'; // 58mm | 80mm | A4

    // Responsive width based on paper size
    $: paperWidth = ukuran === '58mm' ? 'max-w-[220px]' : ukuran === '80mm' ? 'max-w-[300px]' : 'max-w-md';
    $: fontSize = ukuran === '58mm' ? 'text-[10px]' : ukuran === '80mm' ? 'text-xs' : 'text-sm';
    
    // Actual ukuran from settings or prop
    $: actualUkuran = settings.ukuran_kertas || ukuran;
    $: actualPaperWidth = actualUkuran === '58mm' ? 'max-w-[220px]' : actualUkuran === '80mm' ? 'max-w-[300px]' : 'max-w-md';
    $: actualFontSize = actualUkuran === '58mm' ? 'text-[10px]' : actualUkuran === '80mm' ? 'text-xs' : 'text-sm';

    // Check apakah tampilkan merk di struk
    $: showMerk = settings.tampilkan_merk_struk === true || settings.tampilkan_merk_struk === 1;

    // Format tanggal
    function formatTanggal(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Garis pembatas
    $: separator = actualUkuran === '58mm' ? '------------------------' : actualUkuran === '80mm' ? '--------------------------------' : '----------------------------------------';
</script>

<div class="flex justify-center">
    <div class="{actualPaperWidth} w-full bg-white border border-slate-300 shadow-lg {actualFontSize} font-mono p-3">
        
        <!-- Logo -->
        {#if settings.tampilkan_logo && settings.struk_logo}
            <div class="flex justify-center mb-2">
                <img 
                    src={settings.struk_logo} 
                    alt="Logo" 
                    class="h-12 object-contain"
                />
            </div>
        {/if}

        <!-- Nama Toko -->
        <div class="text-center font-bold {actualUkuran === '58mm' ? 'text-sm' : 'text-base'}">
            {toko.nama || 'Nama Toko'}
        </div>

        <!-- Alamat -->
        {#if settings.tampilkan_alamat && toko.alamat}
            <div class="text-center text-slate-600 mt-0.5">
                {toko.alamat}
            </div>
        {/if}

        <!-- Telepon -->
        {#if settings.tampilkan_telepon && toko.telepon}
            <div class="text-center text-slate-600">
                Telp: {toko.telepon}
            </div>
        {/if}

        <!-- Custom Header -->
        {#if settings.struk_header}
            <div class="text-center text-slate-600 mt-1 italic">
                {settings.struk_header}
            </div>
        {/if}

        <!-- Separator -->
        <div class="text-center text-slate-400 my-2">{separator}</div>

        <!-- Info Transaksi -->
        <div class="space-y-0.5">
            <div class="flex justify-between">
                <span>No</span>
                <span>{transaksi.no_invoice || 'INV-XXX'}</span>
            </div>
            <div class="flex justify-between">
                <span>Tanggal</span>
                <span>{formatTanggal(transaksi.tanggal)}</span>
            </div>
            <div class="flex justify-between">
                <span>Kasir</span>
                <span>{transaksi.kasir || '-'}</span>
            </div>
        </div>

        <!-- Separator -->
        <div class="text-center text-slate-400 my-2">{separator}</div>

        <!-- Items - Format Label Teks -->
        <div class="space-y-1.5">
            {#each transaksi.items || [] as item}
                <div>
                    <!-- Nama Produk -->
                    <div class="font-medium">{item.nama}</div>
                    
                    <!-- Merk dengan label teks (conditional) -->
                    {#if showMerk && item.nama_merk}
                        <div class="text-slate-600 pl-2" style="font-size: 0.85em;">
                            Merk: {item.nama_merk}
                        </div>
                    {/if}
                    
                    <!-- Varian dengan label teks -->
                    {#if item.nama_varian}
                        <div class="text-slate-500 pl-2" style="font-size: 0.85em;">
                            Varian: {item.nama_varian}
                        </div>
                    {/if}
                    
                    <!-- Qty x Harga = Subtotal -->
                    <div class="flex justify-between text-slate-600">
                        <span>{item.qty} x {formatRupiah(item.harga)}</span>
                        <span>{formatRupiah(item.qty * item.harga)}</span>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Separator -->
        <div class="text-center text-slate-400 my-2">{separator}</div>

        <!-- Totals -->
        <div class="space-y-0.5">
            <div class="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(transaksi.subtotal || 0)}</span>
            </div>
            
            {#if transaksi.diskon > 0}
                <div class="flex justify-between text-red-600">
                    <span>Diskon</span>
                    <span>-{formatRupiah(transaksi.diskon)}</span>
                </div>
            {/if}
            
            {#if transaksi.pajak > 0}
                <div class="flex justify-between">
                    <span>Pajak</span>
                    <span>{formatRupiah(transaksi.pajak)}</span>
                </div>
            {/if}
            
            <div class="flex justify-between font-bold {actualUkuran === '58mm' ? 'text-sm' : 'text-base'} pt-1 border-t border-dashed border-slate-300">
                <span>TOTAL</span>
                <span>{formatRupiah(transaksi.total || 0)}</span>
            </div>
        </div>

        <!-- Separator -->
        <div class="text-center text-slate-400 my-2">{separator}</div>

        <!-- Payment -->
        <div class="space-y-0.5">
            <div class="flex justify-between">
                <span>Bayar ({transaksi.metode_bayar || 'Tunai'})</span>
                <span>{formatRupiah(transaksi.bayar || 0)}</span>
            </div>
            <div class="flex justify-between font-bold">
                <span>Kembalian</span>
                <span>{formatRupiah(transaksi.kembalian || 0)}</span>
            </div>
        </div>

        <!-- Separator -->
        <div class="text-center text-slate-400 my-2">{separator}</div>

        <!-- Custom Footer -->
        {#if settings.struk_footer}
            <div class="text-center text-slate-600 whitespace-pre-line">
                {settings.struk_footer}
            </div>
        {/if}

        <!-- Timestamp -->
        <div class="text-center text-slate-400 mt-2 text-[9px]">
            Dicetak: {formatTanggal(new Date())}
        </div>
    </div>
</div>