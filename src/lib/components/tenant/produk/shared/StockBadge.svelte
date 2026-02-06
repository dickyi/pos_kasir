<!--
    StockBadge.svelte - Badge Status Stok
    ============================================
    Komponen reusable untuk menampilkan status stok
    Bisa dipakai di Produk, Kasir, Laporan Stok
-->
<script>
    export let stok = 0;
    export let threshold = 10;
    export let showLabel = true;
    export let size = 'sm'; // 'sm' | 'md'

    $: status = getStokStatus(stok, threshold);

    function getStokStatus(stok, threshold) {
        if (stok === 0) return { 
            label: 'Habis', 
            class: 'text-red-600 bg-red-50 border-red-200' 
        };
        if (stok <= threshold) return { 
            label: 'Menipis', 
            class: 'text-amber-600 bg-amber-50 border-amber-200' 
        };
        return { 
            label: 'Tersedia', 
            class: 'text-emerald-600 bg-emerald-50 border-emerald-200' 
        };
    }

    $: sizeClass = size === 'md' 
        ? 'text-sm px-2.5 py-1' 
        : 'text-xs px-1.5 py-0.5';
</script>

<span class="font-medium rounded border {status.class} {sizeClass}">
    {#if showLabel}
        {status.label}
    {:else}
        {stok}
    {/if}
</span>