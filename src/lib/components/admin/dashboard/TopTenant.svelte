<script>
    import { Award } from 'lucide-svelte';
    
    export let tenants = [];
    export let title = '🏆 Top Tenant';
    export let subtitle = 'Berdasarkan aktivitas transaksi';
    
    function getRankStyle(index) {
        if (index === 0) return { bg: 'bg-gradient-to-r from-yellow-50 to-orange-50', badge: 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white' };
        if (index === 1) return { bg: 'bg-gray-50', badge: 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' };
        if (index === 2) return { bg: 'bg-orange-50/50', badge: 'bg-gradient-to-br from-orange-300 to-orange-400 text-white' };
        return { bg: '', badge: 'bg-gray-200 text-gray-600' };
    }
</script>

<div class="bg-white rounded-xl border">
    <div class="p-5 border-b">
        <h3 class="font-semibold text-gray-900">{title}</h3>
        <p class="text-sm text-gray-500">{subtitle}</p>
    </div>
    <div class="p-4 space-y-3">
        {#each tenants as t, i}
            {@const style = getRankStyle(i)}
            <div class="flex items-center gap-3 p-3 rounded-xl {style.bg}">
                <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm {style.badge}">
                    {i + 1}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 truncate">{t.nama_bisnis}</p>
                    <p class="text-xs text-gray-500">{t.total_transaksi} transaksi</p>
                </div>
            </div>
        {:else}
            <div class="text-center py-8 text-gray-400">
                <Award size={32} class="mx-auto mb-2 opacity-50" />
                <p class="text-sm">Belum ada data</p>
            </div>
        {/each}
    </div>
</div>