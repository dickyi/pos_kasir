<script>
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';

    export let data;
    export let form;

    $: user = data?.user;
    $: transaksiList = data?.transaksi || [];
    $: summary = data?.summary;
    $: todaySummary = data?.todaySummary;
    $: filters = data?.filters || {};

    // State
    let searchQuery = filters.search || '';
    let startDate = filters.startDate || '';
    let endDate = filters.endDate || '';
    let statusFilter = filters.status || '';
    
    let showDetailModal = false;
    let selectedTransaksi = null;
    let transaksiDetail = [];
    let isLoadingDetail = false;

    // Handle detail response
    $: if (form?.success && form?.transaksi) {
        selectedTransaksi = form.transaksi;
        transaksiDetail = form.detail || [];
        showDetailModal = true;
    }

    // Handle cancel response
    $: if (form?.success && form?.message?.includes('dibatalkan')) {
        alert(form.message);
        // Refresh page
        goto(window.location.pathname, { invalidateAll: true });
    }

    function formatRupiah(angka) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka || 0);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    function formatDateTime(dateStr, timeStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const formatted = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        return `${formatted} ${timeStr?.slice(0,5) || ''}`;
    }

    function formatTime(timeStr) {
        if (!timeStr) return '-';
        return timeStr.slice(0, 5);
    }

    function getStatusBadge(status) {
        switch(status) {
            case 'success':
                return 'bg-green-100 text-green-700';
            case 'cancelled':
                return 'bg-red-100 text-red-700';
            case 'pending':
                return 'bg-yellow-100 text-yellow-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    }

    function getStatusText(status) {
        switch(status) {
            case 'success': return 'Sukses';
            case 'cancelled': return 'Batal';
            case 'pending': return 'Pending';
            default: return status;
        }
    }

    function getMetodeBadge(metode) {
        switch(metode) {
            case 'cash': return '💵';
            case 'qris': return '📱';
            case 'transfer': return '🏦';
            default: return '💳';
        }
    }

    function applyFilters() {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);
        if (statusFilter) params.set('status', statusFilter);
        
        goto(`?${params.toString()}`);
    }

    function resetFilters() {
        searchQuery = '';
        startDate = '';
        endDate = '';
        statusFilter = '';
        goto(window.location.pathname);
    }

    function closeModal() {
        showDetailModal = false;
        selectedTransaksi = null;
        transaksiDetail = [];
    }

    function printReceipt() {
        window.print();
    }
</script>

<svelte:head>
    <title>Riwayat Transaksi - {user?.nama_bisnis || 'POS'}</title>
    <style>
        @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
    </style>
</svelte:head>

<!-- Header -->
<div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-800">📋 Riwayat Transaksi</h1>
    <p class="text-gray-500">Lihat dan kelola semua transaksi penjualan</p>
</div>

<!-- Summary Cards -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-xl">📊</div>
            <div>
                <p class="text-sm text-gray-500">Hari Ini</p>
                <p class="text-lg font-bold text-gray-800">{todaySummary?.total_transaksi || 0} Transaksi</p>
            </div>
        </div>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">💰</div>
            <div>
                <p class="text-sm text-gray-500">Penjualan Hari Ini</p>
                <p class="text-lg font-bold text-emerald-600">{formatRupiah(todaySummary?.total_penjualan)}</p>
            </div>
        </div>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">✅</div>
            <div>
                <p class="text-sm text-gray-500">Total Sukses</p>
                <p class="text-lg font-bold text-gray-800">{summary?.transaksi_sukses || 0}</p>
            </div>
        </div>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">💵</div>
            <div>
                <p class="text-sm text-gray-500">Total Penjualan</p>
                <p class="text-lg font-bold text-emerald-600">{formatRupiah(summary?.penjualan_sukses)}</p>
            </div>
        </div>
    </div>
</div>

<!-- Filters -->
<div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
    <div class="flex flex-col lg:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">Cari Invoice</label>
            <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="No. Invoice atau nama customer..."
                    class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>
        </div>

        <!-- Date Range -->
        <div class="flex gap-2">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
                <input
                    type="date"
                    bind:value={startDate}
                    class="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                <input
                    type="date"
                    bind:value={endDate}
                    class="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>
        </div>

        <!-- Status -->
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
                bind:value={statusFilter}
                class="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
                <option value="">Semua Status</option>
                <option value="success">Sukses</option>
                <option value="cancelled">Batal</option>
                <option value="pending">Pending</option>
            </select>
        </div>

        <!-- Buttons -->
        <div class="flex items-end gap-2">
            <button
                on:click={applyFilters}
                class="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
            >
                Filter
            </button>
            <button
                on:click={resetFilters}
                class="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
                Reset
            </button>
        </div>
    </div>
</div>

<!-- Transaction List -->
<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    
    <!-- Table Header -->
    <div class="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <p class="font-medium text-gray-700">
            Menampilkan {transaksiList.length} transaksi
        </p>
    </div>

    <!-- Table -->
    {#if transaksiList.length === 0}
        <div class="p-12 text-center text-gray-400">
            <span class="text-5xl block mb-3">📋</span>
            <p class="font-medium">Tidak ada transaksi</p>
            <p class="text-sm">Transaksi akan muncul setelah Anda melakukan penjualan</p>
        </div>
    {:else}
        <!-- Mobile View -->
        <div class="lg:hidden divide-y divide-gray-100">
            {#each transaksiList as trx}
                <div class="p-4">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <p class="font-medium text-gray-800">{trx.no_invoice}</p>
                            <p class="text-sm text-gray-500">{formatDateTime(trx.tanggal, trx.waktu)}</p>
                        </div>
                        <span class="px-2 py-1 text-xs font-medium rounded-full {getStatusBadge(trx.status)}">
                            {getStatusText(trx.status)}
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <div class="text-sm text-gray-500">
                            <span>{getMetodeBadge(trx.metode_bayar)}</span>
                            <span class="ml-1">{trx.total_qty || 0} item</span>
                        </div>
                        <p class="font-bold text-emerald-600">{formatRupiah(trx.total)}</p>
                    </div>
                    <div class="mt-3 flex gap-2">
                        <form method="POST" action="?/getDetail" use:enhance class="flex-1">
                            <input type="hidden" name="transaksi_id" value={trx.id} />
                            <button type="submit" class="w-full py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                                Detail
                            </button>
                        </form>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Desktop View -->
        <div class="hidden lg:block overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50 text-sm text-gray-600">
                    <tr>
                        <th class="text-left px-4 py-3 font-medium">Invoice</th>
                        <th class="text-left px-4 py-3 font-medium">Tanggal & Waktu</th>
                        <th class="text-left px-4 py-3 font-medium">Customer</th>
                        <th class="text-center px-4 py-3 font-medium">Item</th>
                        <th class="text-center px-4 py-3 font-medium">Metode</th>
                        <th class="text-right px-4 py-3 font-medium">Total</th>
                        <th class="text-center px-4 py-3 font-medium">Status</th>
                        <th class="text-center px-4 py-3 font-medium">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    {#each transaksiList as trx}
                        <tr class="hover:bg-gray-50 transition-colors">
                            <td class="px-4 py-3">
                                <p class="font-medium text-gray-800">{trx.no_invoice}</p>
                            </td>
                            <td class="px-4 py-3">
                                <p class="text-gray-800">{formatDate(trx.tanggal)}</p>
                                <p class="text-sm text-gray-500">{formatTime(trx.waktu)}</p>
                            </td>
                            <td class="px-4 py-3">
                                <p class="text-gray-800">{trx.nama_customer || '-'}</p>
                                <p class="text-sm text-gray-500">{trx.kasir_nama || '-'}</p>
                            </td>
                            <td class="px-4 py-3 text-center">
                                <span class="bg-gray-100 px-2 py-1 rounded text-sm">{trx.total_qty || 0}</span>
                            </td>
                            <td class="px-4 py-3 text-center">
                                <span class="text-lg" title={trx.metode_bayar}>
                                    {getMetodeBadge(trx.metode_bayar)}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-right">
                                <p class="font-bold text-emerald-600">{formatRupiah(trx.total)}</p>
                            </td>
                            <td class="px-4 py-3 text-center">
                                <span class="px-3 py-1 text-xs font-medium rounded-full {getStatusBadge(trx.status)}">
                                    {getStatusText(trx.status)}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <div class="flex items-center justify-center gap-1">
                                    <form method="POST" action="?/getDetail" use:enhance>
                                        <input type="hidden" name="transaksi_id" value={trx.id} />
                                        <button type="submit" 
                                            class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Lihat Detail">
                                            👁️
                                        </button>
                                    </form>
                                    {#if trx.status === 'success'}
                                        <form method="POST" action="?/batalkan" use:enhance
                                            on:submit={(e) => {
                                                if (!confirm('Yakin ingin membatalkan transaksi ini? Stok akan dikembalikan.')) {
                                                    e.preventDefault();
                                                }
                                            }}>
                                            <input type="hidden" name="transaksi_id" value={trx.id} />
                                            <button type="submit"
                                                class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Batalkan">
                                                ❌
                                            </button>
                                        </form>
                                    {/if}
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<!-- Detail Modal -->
{#if showDetailModal && selectedTransaksi}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" on:click={closeModal}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden print-area" on:click|stopPropagation>
            
            <!-- Modal Header -->
            <div class="p-4 bg-emerald-600 text-white flex justify-between items-center">
                <div>
                    <h3 class="text-lg font-bold">Detail Transaksi</h3>
                    <p class="text-emerald-100 text-sm">{selectedTransaksi.no_invoice}</p>
                </div>
                <button type="button" on:click={closeModal} class="text-2xl hover:text-emerald-200">&times;</button>
            </div>

            <!-- Modal Body -->
            <div class="p-4 overflow-y-auto max-h-[60vh]">
                
                <!-- Store Info -->
                <div class="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
                    <p class="font-bold text-lg text-gray-800">{selectedTransaksi.nama_bisnis || user?.nama_bisnis}</p>
                    <p class="text-sm text-gray-500">{selectedTransaksi.alamat_toko || ''}</p>
                    <div class="mt-2 text-sm text-gray-600">
                        <p>{formatDate(selectedTransaksi.tanggal)} • {formatTime(selectedTransaksi.waktu)}</p>
                        <p>Kasir: {selectedTransaksi.kasir_nama || '-'}</p>
                    </div>
                </div>

                <!-- Status -->
                <div class="flex justify-center mb-4">
                    <span class="px-4 py-2 text-sm font-medium rounded-full {getStatusBadge(selectedTransaksi.status)}">
                        {getStatusText(selectedTransaksi.status)}
                    </span>
                </div>

                <!-- Items -->
                <div class="border border-gray-200 rounded-lg overflow-hidden mb-4">
                    <div class="bg-gray-50 px-4 py-2 font-medium text-sm text-gray-700">
                        Item Pembelian
                    </div>
                    <div class="divide-y divide-gray-100">
                        {#each transaksiDetail as item}
                            <div class="px-4 py-3 flex justify-between">
                                <div>
                                    <p class="font-medium text-gray-800">{item.nama_produk}</p>
                                    <p class="text-sm text-gray-500">
                                        {item.qty} x {formatRupiah(item.harga)}
                                    </p>
                                </div>
                                <p class="font-medium text-gray-800">{formatRupiah(item.subtotal)}</p>
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- Totals -->
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Subtotal</span>
                        <span>{formatRupiah(selectedTransaksi.subtotal)}</span>
                    </div>
                    {#if selectedTransaksi.diskon > 0}
                        <div class="flex justify-between text-sm text-red-600">
                            <span>Diskon</span>
                            <span>-{formatRupiah(selectedTransaksi.diskon)}</span>
                        </div>
                    {/if}
                    {#if selectedTransaksi.pajak > 0}
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Pajak</span>
                            <span>{formatRupiah(selectedTransaksi.pajak)}</span>
                        </div>
                    {/if}
                    <div class="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                        <span>Total</span>
                        <span class="text-emerald-600">{formatRupiah(selectedTransaksi.total)}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Bayar ({selectedTransaksi.metode_bayar})</span>
                        <span>{formatRupiah(selectedTransaksi.bayar)}</span>
                    </div>
                    <div class="flex justify-between font-medium text-blue-600">
                        <span>Kembalian</span>
                        <span>{formatRupiah(selectedTransaksi.kembalian)}</span>
                    </div>
                </div>

                <!-- Customer -->
                {#if selectedTransaksi.nama_customer}
                    <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p class="text-sm text-blue-700">
                            <span class="font-medium">Customer:</span> {selectedTransaksi.nama_customer}
                        </p>
                    </div>
                {/if}

                <!-- Footer Note -->
                <div class="text-center mt-4 pt-4 border-t border-dashed border-gray-300">
                    <p class="text-sm text-gray-500">Terima kasih atas kunjungan Anda!</p>
                    <p class="text-xs text-gray-400 mt-1">Powered by POSKasir</p>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="p-4 border-t bg-gray-50 flex gap-3">
                <button
                    type="button"
                    on:click={printReceipt}
                    class="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-100 flex items-center justify-center gap-2"
                >
                    <span>🖨️</span>
                    <span>Cetak Struk</span>
                </button>
                <button
                    type="button"
                    on:click={closeModal}
                    class="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
                >
                    Tutup
                </button>
            </div>
        </div>
    </div>
{/if}