<script>
    export let activePeriod = 'hari_ini';
    export let platform = {};
    
    function formatRupiah(num) {
        if (!num) return 'Rp 0';
        if (num >= 1000000000) return 'Rp ' + (num / 1000000000).toFixed(1) + ' M';
        if (num >= 1000000) return 'Rp ' + (num / 1000000).toFixed(1) + ' Jt';
        if (num >= 1000) return 'Rp ' + (num / 1000).toFixed(1) + ' Rb';
        return 'Rp ' + num.toLocaleString('id-ID');
    }
    
    function formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + ' Jt';
        if (num >= 1000) return (num / 1000).toFixed(1) + ' Rb';
        return num.toLocaleString('id-ID');
    }
    
    $: currentStats = platform[activePeriod] || {};
    $: avgTransaction = activePeriod === 'hari_ini' 
        ? platform.hari_ini?.avg_transaction || 0
        : (currentStats?.gmv || 0) / (currentStats?.transaksi || 1);
</script>

<div class="bg-white rounded-xl border overflow-hidden">
    <div class="border-b">
        <div class="flex">
            <button 
                class="flex-1 px-4 py-3 text-sm font-medium transition-all {activePeriod === 'hari_ini' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}"
                on:click={() => activePeriod = 'hari_ini'}
            >
                Hari Ini
            </button>
            <button 
                class="flex-1 px-4 py-3 text-sm font-medium transition-all {activePeriod === 'minggu_ini' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}"
                on:click={() => activePeriod = 'minggu_ini'}
            >
                Minggu Ini
            </button>
            <button 
                class="flex-1 px-4 py-3 text-sm font-medium transition-all {activePeriod === 'bulan_ini' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}"
                on:click={() => activePeriod = 'bulan_ini'}
            >
                Bulan Ini
            </button>
        </div>
    </div>
    <div class="p-5">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div class="text-center">
                <p class="text-sm text-gray-500 mb-1">Total Transaksi</p>
                <p class="text-2xl font-bold text-gray-900">
                    {formatNumber(currentStats?.transaksi || 0)}
                </p>
            </div>
            <div class="text-center">
                <p class="text-sm text-gray-500 mb-1">GMV</p>
                <p class="text-2xl font-bold text-green-600">
                    {formatRupiah(currentStats?.gmv || 0)}
                </p>
            </div>
            <div class="text-center">
                <p class="text-sm text-gray-500 mb-1">Tenant Aktif</p>
                <p class="text-2xl font-bold text-blue-600">
                    {currentStats?.tenant_aktif || 0}
                </p>
            </div>
            <div class="text-center">
                <p class="text-sm text-gray-500 mb-1">Rata-rata/Transaksi</p>
                <p class="text-2xl font-bold text-purple-600">
                    {formatRupiah(avgTransaction)}
                </p>
            </div>
        </div>
    </div>
</div>