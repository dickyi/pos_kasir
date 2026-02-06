<!--
    SummaryCards.svelte
    Kartu statistik ringkasan transaksi
-->
<script>
    import { Receipt, TrendingUp, Check, CreditCard } from 'lucide-svelte';

    /** @type {Object|null} Ringkasan hari ini */
    export let todaySummary = null;
    
    /** @type {Object|null} Ringkasan keseluruhan */
    export let summary = null;

    /**
     * Format rupiah singkat
     */
    function formatRupiahShort(angka) {
        if (!angka) return 'Rp 0';
        if (angka >= 1000000) {
            return 'Rp ' + (angka / 1000000).toFixed(1) + 'jt';
        } else if (angka >= 1000) {
            return 'Rp ' + Math.round(angka / 1000) + 'rb';
        }
        return 'Rp ' + angka;
    }
</script>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Transaksi Hari Ini -->
    <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Receipt class="w-5 h-5 text-emerald-600" />
            </div>
            <div class="min-w-0">
                <p class="text-2xl font-semibold text-slate-800">{todaySummary?.total_transaksi || 0}</p>
                <p class="text-sm text-slate-500 truncate">Hari Ini</p>
            </div>
        </div>
    </div>
    
    <!-- Penjualan Hari Ini -->
    <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp class="w-5 h-5 text-slate-600" />
            </div>
            <div class="min-w-0">
                <p class="text-xl font-semibold text-emerald-600">{formatRupiahShort(todaySummary?.total_penjualan)}</p>
                <p class="text-sm text-slate-500 truncate">Penjualan Hari Ini</p>
            </div>
        </div>
    </div>
    
    <!-- Total Sukses -->
    <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check class="w-5 h-5 text-slate-600" />
            </div>
            <div class="min-w-0">
                <p class="text-2xl font-semibold text-slate-800">{summary?.transaksi_sukses || 0}</p>
                <p class="text-sm text-slate-500 truncate">Transaksi Sukses</p>
            </div>
        </div>
    </div>
    
    <!-- Total Penjualan -->
    <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard class="w-5 h-5 text-slate-600" />
            </div>
            <div class="min-w-0">
                <p class="text-xl font-semibold text-emerald-600">{formatRupiahShort(summary?.penjualan_sukses)}</p>
                <p class="text-sm text-slate-500 truncate">Total Penjualan</p>
            </div>
        </div>
    </div>
</div>