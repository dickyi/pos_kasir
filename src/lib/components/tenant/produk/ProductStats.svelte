<!--
    ProductStats.svelte - Statistik Produk
    ============================================
    Menampilkan ringkasan: Total, Aktif, Menipis, Habis
-->
<script>
    import { Package, Check, AlertCircle, X } from 'lucide-svelte';

    export let produkList = [];

    // Computed stats
    $: totalProduk = produkList.length;
    $: produkAktif = produkList.filter(p => p.status === 'aktif').length;
    $: stokMenipis = produkList.filter(p => p.stok <= 10 && p.stok > 0).length;
    $: stokHabis = produkList.filter(p => p.stok === 0).length;

    // Stats configuration
    const stats = [
        { 
            key: 'total',
            label: 'Total Produk', 
            icon: Package, 
            iconBg: 'bg-slate-100', 
            iconColor: 'text-slate-600' 
        },
        { 
            key: 'aktif',
            label: 'Produk Aktif', 
            icon: Check, 
            iconBg: 'bg-emerald-50', 
            iconColor: 'text-emerald-600' 
        },
        { 
            key: 'menipis',
            label: 'Stok Menipis', 
            icon: AlertCircle, 
            iconBg: 'bg-amber-50', 
            iconColor: 'text-amber-600' 
        },
        { 
            key: 'habis',
            label: 'Stok Habis', 
            icon: X, 
            iconBg: 'bg-red-50', 
            iconColor: 'text-red-600' 
        }
    ];

    function getValue(key) {
        switch(key) {
            case 'total': return totalProduk;
            case 'aktif': return produkAktif;
            case 'menipis': return stokMenipis;
            case 'habis': return stokHabis;
            default: return 0;
        }
    }
</script>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {#each stats as stat}
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 {stat.iconBg} rounded-lg flex items-center justify-center flex-shrink-0">
                    <svelte:component this={stat.icon} class="w-5 h-5 {stat.iconColor}" />
                </div>
                <div class="min-w-0">
                    <p class="text-2xl font-semibold text-slate-800">{getValue(stat.key)}</p>
                    <p class="text-sm text-slate-500 truncate">{stat.label}</p>
                </div>
            </div>
        </div>
    {/each}
</div>