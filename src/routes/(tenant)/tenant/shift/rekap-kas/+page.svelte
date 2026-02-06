<!--
    ============================================
    REKAP KAS - PAGE SVELTE (FIXED)
    ============================================
    Halaman untuk melihat rekap kas dan selisih
    FIXED: Export button menggunakan function untuk generate URL
    ============================================
-->
<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { 
        formatRupiah, 
        formatRupiahShort, 
        formatNumber, 
        formatPercent,
        formatDateShort,
        formatDateTime,
        formatTime
    } from '$lib/utils/format';
    import { 
        Wallet, 
        TrendingUp, 
        TrendingDown,
        ArrowUpCircle,
        ArrowDownCircle,
        CheckCircle,
        AlertTriangle,
        XCircle,
        Calendar,
        Filter,
        Download,
        RefreshCw,
        Clock,
        User,
        Building,
        PieChart,
        BarChart3
    } from 'lucide-svelte';
    
    export let data;
    
    // Reactive data dengan safe defaults
    $: ringkasanKas = data?.ringkasanKas || {
        total_modal: 0,
        total_penjualan_tunai: 0,
        total_kas_sistem: 0,
        total_kas_aktual: 0,
        total_selisih: 0,
        total_kas_masuk: 0,
        total_kas_keluar: 0,
        total_shift: 0,
        shift_lebih: 0,
        shift_kurang: 0,
        shift_seimbang: 0
    };
    $: kasTransaksi = data?.kasTransaksi || [];
    $: rekapKategori = data?.rekapKategori || [];
    $: shiftSelisih = data?.shiftSelisih || [];
    $: trendSelisih = data?.trendSelisih || [];
    $: kasirSelisih = data?.kasirSelisih || [];
    $: filter = data?.filter || { periode: 'bulan_ini', dateFrom: '', dateTo: '' };
    
    // Filter state - menggunakan $: untuk reaktivitas
    $: selectedPeriode = filter?.periode || 'bulan_ini';
    $: customStart = filter?.dateFrom || '';
    $: customEnd = filter?.dateTo || '';
    let isLoading = false;
    let activeTab = 'selisih'; // selisih | kas_transaksi | kasir
    
    // Period options
    const periodeOptions = [
        { value: 'hari_ini', label: 'Hari Ini' },
        { value: 'minggu_ini', label: 'Minggu Ini' },
        { value: 'bulan_ini', label: 'Bulan Ini' },
        { value: 'bulan_lalu', label: 'Bulan Lalu' },
        { value: 'custom', label: 'Custom' }
    ];
    
    // Apply filter
    async function applyFilter() {
        isLoading = true;
        let params = new URLSearchParams();
        params.set('periode', selectedPeriode);
        if (selectedPeriode === 'custom') {
            params.set('start', customStart);
            params.set('end', customEnd);
        }
        await goto(`?${params.toString()}`, { replaceState: true });
        isLoading = false;
    }
    
    // ✅ FIXED: Function untuk handle export
    function handleExport() {
        // Build URL secara manual tanpa karakter tersembunyi
        let url = '/tenant/shift/export?type=rekap-kas&periode=' + encodeURIComponent(selectedPeriode);
        
        // Hanya tambahkan start/end jika periode = custom
        if (selectedPeriode === 'custom' && customStart && customEnd) {
            url += '&start=' + encodeURIComponent(customStart);
            url += '&end=' + encodeURIComponent(customEnd);
        }
        
        console.log('Export URL:', url); // Debug
        window.location.href = url;
    }
    
    // Get selisih status
    function getSelisihStatus(selisih) {
        if (selisih === 0) return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Seimbang' };
        if (selisih > 0) return { icon: ArrowUpCircle, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Lebih' };
        return { icon: ArrowDownCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Kurang' };
    }
    
    // Calculate max for chart
    $: maxAbsSelisih = Math.max(...trendSelisih.map(t => Math.abs(t.total_selisih || 0)), 1);
</script>

<svelte:head>
    <title>Rekap Kas | Monitoring Shift</title>
</svelte:head>

<div class="p-4 md:p-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Rekap Kas</h1>
            <p class="text-slate-500 mt-1">Laporan kas masuk, keluar, dan selisih</p>
        </div>
        
        <!-- ✅ FIXED: Export Button menggunakan on:click -->
        <button 
            on:click={handleExport}
            class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
            <Download class="w-4 h-4" />
            Export Excel
        </button>
    </div>
    
    <!-- Filter Section -->
    <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="flex flex-wrap items-end gap-4">
            <div>
                <label for="periode-select" class="block text-sm font-medium text-slate-700 mb-1">Periode</label>
                <select 
                    id="periode-select"
                    bind:value={selectedPeriode}
                    on:change={() => selectedPeriode !== 'custom' && applyFilter()}
                    class="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                    {#each periodeOptions as opt}
                        <option value={opt.value}>{opt.label}</option>
                    {/each}
                </select>
            </div>
            
            {#if selectedPeriode === 'custom'}
                <div>
                    <label for="date-start" class="block text-sm font-medium text-slate-700 mb-1">Dari</label>
                    <input 
                        id="date-start"
                        type="date" 
                        bind:value={customStart}
                        class="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div>
                    <label for="date-end" class="block text-sm font-medium text-slate-700 mb-1">Sampai</label>
                    <input 
                        id="date-end"
                        type="date" 
                        bind:value={customEnd}
                        class="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <button 
                    on:click={applyFilter}
                    disabled={isLoading}
                    class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {#if isLoading}
                        <RefreshCw class="w-4 h-4 animate-spin" />
                    {:else}
                        <Filter class="w-4 h-4" />
                    {/if}
                    Terapkan
                </button>
            {/if}
            
            <div class="text-sm text-slate-500">
                <Calendar class="w-4 h-4 inline mr-1" />
                {formatDateShort(filter.dateFrom)} - {formatDateShort(filter.dateTo)}
            </div>
        </div>
    </div>
    
    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <!-- Total Modal -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <p class="text-sm text-slate-500">Total Modal</p>
            <p class="text-xl font-bold text-slate-800 mt-1">
                {formatRupiahShort(ringkasanKas.total_modal || 0)}
            </p>
        </div>
        
        <!-- Penjualan Tunai -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <p class="text-sm text-slate-500">Penjualan Tunai</p>
            <p class="text-xl font-bold text-emerald-600 mt-1">
                {formatRupiahShort(ringkasanKas.total_penjualan_tunai || 0)}
            </p>
        </div>
        
        <!-- Kas Masuk -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <p class="text-sm text-slate-500 flex items-center gap-1">
                <ArrowUpCircle class="w-4 h-4 text-blue-500" />
                Kas Masuk
            </p>
            <p class="text-xl font-bold text-blue-600 mt-1">
                {formatRupiahShort(ringkasanKas.total_kas_masuk || 0)}
            </p>
        </div>
        
        <!-- Kas Keluar -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <p class="text-sm text-slate-500 flex items-center gap-1">
                <ArrowDownCircle class="w-4 h-4 text-orange-500" />
                Kas Keluar
            </p>
            <p class="text-xl font-bold text-orange-600 mt-1">
                {formatRupiahShort(ringkasanKas.total_kas_keluar || 0)}
            </p>
        </div>
        
        <!-- Total Selisih -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            {#if ringkasanKas}
                {@const status = getSelisihStatus(ringkasanKas.total_selisih || 0)}
                <p class="text-sm text-slate-500">Total Selisih</p>
                <p class="text-xl font-bold {status.color} mt-1">
                    {ringkasanKas.total_selisih > 0 ? '+' : ''}{formatRupiah(ringkasanKas.total_selisih || 0)}
                </p>
            {:else}
                <p class="text-sm text-slate-500">Total Selisih</p>
                <p class="text-xl font-bold text-slate-800 mt-1">Rp 0</p>
            {/if}
        </div>
    </div>
    
    <!-- Shift Status Summary -->
    <div class="grid md:grid-cols-4 gap-4">
        <div class="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
            <div class="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                <Clock class="w-6 h-6 text-slate-600" />
            </div>
            <div>
                <p class="text-2xl font-bold text-slate-800">{ringkasanKas.total_shift || 0}</p>
                <p class="text-sm text-slate-500">Total Shift</p>
            </div>
        </div>
        
        <div class="bg-emerald-50 rounded-xl p-4 flex items-center gap-3">
            <div class="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center">
                <CheckCircle class="w-6 h-6 text-emerald-600" />
            </div>
            <div>
                <p class="text-2xl font-bold text-emerald-800">{ringkasanKas.shift_seimbang || 0}</p>
                <p class="text-sm text-emerald-600">Shift Seimbang</p>
            </div>
        </div>
        
        <div class="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <ArrowUpCircle class="w-6 h-6 text-blue-600" />
            </div>
            <div>
                <p class="text-2xl font-bold text-blue-800">{ringkasanKas.shift_lebih || 0}</p>
                <p class="text-sm text-blue-600">Shift Lebih</p>
            </div>
        </div>
        
        <div class="bg-red-50 rounded-xl p-4 flex items-center gap-3">
            <div class="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                <ArrowDownCircle class="w-6 h-6 text-red-600" />
            </div>
            <div>
                <p class="text-2xl font-bold text-red-800">{ringkasanKas.shift_kurang || 0}</p>
                <p class="text-sm text-red-600">Shift Kurang</p>
            </div>
        </div>
    </div>
    
    <div class="grid md:grid-cols-3 gap-6">
        <!-- Trend Selisih Chart -->
        <div class="md:col-span-2 bg-white rounded-xl border border-slate-200">
            <div class="p-4 border-b border-slate-200">
                <h2 class="font-semibold text-slate-800 flex items-center gap-2">
                    <BarChart3 class="w-5 h-5 text-slate-500" />
                    Trend Selisih Kas
                </h2>
            </div>
            
            {#if trendSelisih.length === 0}
                <div class="p-8 text-center text-slate-500">
                    <PieChart class="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Belum ada data untuk periode ini</p>
                </div>
            {:else}
                <div class="p-4">
                    <div class="flex items-end gap-1 h-40">
                        {#each trendSelisih as day}
                            {@const height = maxAbsSelisih > 0 ? (Math.abs(day.total_selisih) / maxAbsSelisih) * 100 : 0}
                            {@const isPositive = day.total_selisih >= 0}
                            <div class="flex-1 flex flex-col items-center gap-1">
                                <div 
                                    class="w-full rounded-t transition-colors cursor-pointer group relative {isPositive ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'}"
                                    style="height: {Math.max(height, 4)}%"
                                    role="img"
                                    aria-label="{formatDateShort(day.tanggal)}: {formatRupiah(day.total_selisih)}"
                                >
                                    <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        {day.total_selisih >= 0 ? '+' : ''}{formatRupiah(day.total_selisih)}
                                    </div>
                                </div>
                                <span class="text-[10px] text-slate-400">
                                    {new Date(day.tanggal).getDate()}
                                </span>
                            </div>
                        {/each}
                    </div>
                    <div class="flex justify-center gap-4 mt-4 text-xs">
                        <span class="flex items-center gap-1">
                            <span class="w-3 h-3 bg-blue-500 rounded"></span>
                            Lebih
                        </span>
                        <span class="flex items-center gap-1">
                            <span class="w-3 h-3 bg-red-500 rounded"></span>
                            Kurang
                        </span>
                    </div>
                </div>
            {/if}
        </div>
        
        <!-- Kategori Pengeluaran -->
        <div class="bg-white rounded-xl border border-slate-200">
            <div class="p-4 border-b border-slate-200">
                <h2 class="font-semibold text-slate-800 flex items-center gap-2">
                    <PieChart class="w-5 h-5 text-slate-500" />
                    Pengeluaran per Kategori
                </h2>
            </div>
            
            {#if rekapKategori.length === 0}
                <div class="p-8 text-center text-slate-500">
                    <p class="text-sm">Belum ada pengeluaran</p>
                </div>
            {:else}
                <div class="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {#each rekapKategori.filter(k => k.tipe === 'keluar') as kategori}
                        <div class="p-3 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="text-sm text-slate-700">{kategori.kategori}</span>
                            </div>
                            <span class="font-medium text-orange-600">{formatRupiahShort(kategori.total)}</span>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
    
    <!-- Tab Navigation -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="border-b border-slate-200">
            <nav class="flex -mb-px">
                <button 
                    on:click={() => activeTab = 'selisih'}
                    class="px-6 py-3 text-sm font-medium border-b-2 transition-colors {activeTab === 'selisih' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}"
                >
                    Daftar Shift
                </button>
                <button 
                    on:click={() => activeTab = 'kas_transaksi'}
                    class="px-6 py-3 text-sm font-medium border-b-2 transition-colors {activeTab === 'kas_transaksi' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}"
                >
                    Transaksi Kas
                </button>
                <button 
                    on:click={() => activeTab = 'kasir'}
                    class="px-6 py-3 text-sm font-medium border-b-2 transition-colors {activeTab === 'kasir' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}"
                >
                    Selisih per Kasir
                </button>
            </nav>
        </div>
        
        <!-- Tab Content: Daftar Shift -->
        {#if activeTab === 'selisih'}
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tanggal</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kasir</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Modal</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Kas Sistem</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Kas Aktual</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Selisih</th>
                            <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each shiftSelisih as shift}
                            {@const status = getSelisihStatus(shift.selisih)}
                            <tr class="hover:bg-slate-50">
                                <td class="px-4 py-3 text-sm">
                                    <p class="font-medium text-slate-800">{formatDateShort(shift.waktu_buka)}</p>
                                    <p class="text-xs text-slate-500">{formatTime(shift.waktu_buka)} - {formatTime(shift.waktu_tutup)}</p>
                                </td>
                                <td class="px-4 py-3">
                                    <p class="font-medium text-slate-800">{shift.kasir_nama}</p>
                                    {#if shift.station_nama}
                                        <p class="text-xs text-slate-500">{shift.station_nama}</p>
                                    {/if}
                                </td>
                                <td class="px-4 py-3 text-right text-sm text-slate-600">
                                    {formatRupiah(shift.modal_awal)}
                                </td>
                                <td class="px-4 py-3 text-right text-sm text-slate-600">
                                    {formatRupiah(shift.kas_akhir_sistem)}
                                </td>
                                <td class="px-4 py-3 text-right text-sm text-slate-600">
                                    {formatRupiah(shift.kas_akhir_aktual)}
                                </td>
                                <td class="px-4 py-3 text-right text-sm font-medium {status.color}">
                                    {shift.selisih > 0 ? '+' : ''}{formatRupiah(shift.selisih)}
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium {status.bg} {status.color}">
                                        <svelte:component this={status.icon} class="w-3 h-3" />
                                        {status.label}
                                    </span>
                                </td>
                            </tr>
                        {:else}
                            <tr>
                                <td colspan="7" class="px-4 py-8 text-center text-slate-500">
                                    Belum ada data shift untuk periode ini
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
        
        <!-- Tab Content: Transaksi Kas -->
        {#if activeTab === 'kas_transaksi'}
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Waktu</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kasir</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kategori</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Keterangan</th>
                            <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Tipe</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each kasTransaksi as trx}
                            <tr class="hover:bg-slate-50">
                                <td class="px-4 py-3 text-sm text-slate-600">
                                    {formatDateTime(trx.created_at)}
                                </td>
                                <td class="px-4 py-3 text-sm text-slate-800">
                                    {trx.kasir_nama || '-'}
                                </td>
                                <td class="px-4 py-3 text-sm text-slate-600">
                                    {trx.kategori_nama || '-'}
                                </td>
                                <td class="px-4 py-3 text-sm text-slate-600">
                                    {trx.keterangan || '-'}
                                </td>
                                <td class="px-4 py-3 text-center">
                                    {#if trx.tipe === 'masuk'}
                                        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                                            <ArrowUpCircle class="w-3 h-3" />
                                            Masuk
                                        </span>
                                    {:else}
                                        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                                            <ArrowDownCircle class="w-3 h-3" />
                                            Keluar
                                        </span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3 text-right text-sm font-medium {trx.tipe === 'masuk' ? 'text-blue-600' : 'text-orange-600'}">
                                    {trx.tipe === 'masuk' ? '+' : '-'}{formatRupiah(trx.jumlah)}
                                </td>
                            </tr>
                        {:else}
                            <tr>
                                <td colspan="6" class="px-4 py-8 text-center text-slate-500">
                                    Belum ada transaksi kas untuk periode ini
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
        
        <!-- Tab Content: Selisih per Kasir -->
        {#if activeTab === 'kasir'}
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kasir</th>
                            <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Total Shift</th>
                            <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Seimbang</th>
                            <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Lebih</th>
                            <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Kurang</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total Selisih</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Rata-rata Selisih</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each kasirSelisih as kasir}
                            {@const status = getSelisihStatus(kasir.total_selisih)}
                            <tr class="hover:bg-slate-50">
                                <td class="px-4 py-3 font-medium text-slate-800">
                                    {kasir.kasir_nama}
                                </td>
                                <td class="px-4 py-3 text-center text-sm text-slate-600">
                                    {kasir.total_shift}
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <span class="text-emerald-600 font-medium">{kasir.shift_seimbang}</span>
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <span class="text-blue-600 font-medium">{kasir.shift_lebih}</span>
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <span class="text-red-600 font-medium">{kasir.shift_kurang}</span>
                                </td>
                                <td class="px-4 py-3 text-right font-medium {status.color}">
                                    {kasir.total_selisih > 0 ? '+' : ''}{formatRupiah(kasir.total_selisih)}
                                </td>
                                <td class="px-4 py-3 text-right text-sm text-slate-600">
                                    {kasir.avg_selisih > 0 ? '+' : ''}{formatRupiah(Math.round(kasir.avg_selisih))}
                                </td>
                            </tr>
                        {:else}
                            <tr>
                                <td colspan="7" class="px-4 py-8 text-center text-slate-500">
                                    Belum ada data kasir untuk periode ini
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>