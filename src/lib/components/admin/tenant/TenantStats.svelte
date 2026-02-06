<script>
    import { Building2, CheckCircle, Clock, XCircle } from 'lucide-svelte';
    
    export let stats = { total: 0, aktif: 0, pending: 0, nonaktif: 0 };
    export let activeFilter = '';
    export let onFilterChange = (status) => {};
    
    function formatNumber(num) {
        return (Number(num) || 0).toLocaleString('id-ID');
    }
    
    const cards = [
        { key: '', label: 'Total Tenant', icon: Building2, colorClass: 'text-gray-400', ringClass: 'ring-gray-900', valueKey: 'total', valueColor: 'text-gray-900' },
        { key: 'aktif', label: 'Aktif', icon: CheckCircle, colorClass: 'text-emerald-500', ringClass: 'ring-emerald-500', hoverBorder: 'hover:border-emerald-300', valueKey: 'aktif', valueColor: 'text-emerald-600' },
        { key: 'pending', label: 'Pending', icon: Clock, colorClass: 'text-amber-500', ringClass: 'ring-amber-500', hoverBorder: 'hover:border-amber-300', valueKey: 'pending', valueColor: 'text-amber-600' },
        { key: 'nonaktif', label: 'Nonaktif', icon: XCircle, colorClass: 'text-gray-400', ringClass: 'ring-gray-500', hoverBorder: 'hover:border-gray-400', valueKey: 'nonaktif', valueColor: 'text-gray-600' }
    ];
</script>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {#each cards as card}
        <button 
            on:click={() => onFilterChange(card.key)}
            class="bg-white rounded-xl border border-gray-200 p-4 text-left transition-all
                   {card.hoverBorder || 'hover:border-gray-300'}
                   {activeFilter === card.key ? `ring-2 ${card.ringClass}` : ''}"
        >
            <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">{card.label}</span>
                <svelte:component this={card.icon} size={18} class={card.colorClass} />
            </div>
            <p class="text-2xl font-bold {card.valueColor} mt-2">
                {formatNumber(stats[card.valueKey])}
            </p>
        </button>
    {/each}
</div>