<script>
    import { Activity } from 'lucide-svelte';
    
    export let engagementRate = 0;
    export let tenantAktifHariIni = 0;
    export let totalTenantAktif = 0;
    export let totalTransaksi = 0;
    export let totalGmv = 0;
    export let totalTenant = 0;
    
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
</script>

<div class="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <div class="flex items-center gap-2 mb-2">
                <Activity size={20} class="text-blue-400" />
                <span class="text-sm text-slate-300">Platform Health</span>
            </div>
            <h2 class="text-3xl font-bold">{engagementRate}% Engagement Rate</h2>
            <p class="text-slate-400 mt-1">
                {tenantAktifHariIni} dari {totalTenantAktif} tenant aktif bertransaksi hari ini
            </p>
        </div>
        <div class="flex gap-6">
            <div class="text-center">
                <p class="text-3xl font-bold text-green-400">{formatNumber(totalTransaksi)}</p>
                <p class="text-sm text-slate-400">Total Transaksi</p>
            </div>
            <div class="text-center">
                <p class="text-3xl font-bold text-blue-400">{formatRupiah(totalGmv)}</p>
                <p class="text-sm text-slate-400">Total GMV</p>
            </div>
            <div class="text-center">
                <p class="text-3xl font-bold text-purple-400">{totalTenant}</p>
                <p class="text-sm text-slate-400">Total Tenant</p>
            </div>
        </div>
    </div>
</div>