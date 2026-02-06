<script>
    import { Users, UserCheck, UserX, Shield, Clock } from 'lucide-svelte';
    
    export let stats = {
        total: 0,
        aktif: 0,
        nonaktif: 0,
        superAdmin: 0,
        onlineNow: 0
    };
    
    export let activeFilter = '';
    export let onFilterChange = (filter) => {};
    
    $: cards = [
        {
            key: '',
            label: 'Total Admin',
            value: stats.total,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            iconBg: 'bg-blue-100'
        },
        {
            key: 'aktif',
            label: 'Aktif',
            value: stats.aktif,
            icon: UserCheck,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            iconBg: 'bg-emerald-100'
        },
        {
            key: 'nonaktif',
            label: 'Nonaktif',
            value: stats.nonaktif,
            icon: UserX,
            color: 'text-gray-600',
            bg: 'bg-gray-50',
            iconBg: 'bg-gray-100'
        },
        {
            key: 'super_admin',
            label: 'Super Admin',
            value: stats.superAdmin,
            icon: Shield,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            iconBg: 'bg-purple-100'
        },
        {
            key: 'online',
            label: 'Online Sekarang',
            value: stats.onlineNow,
            icon: Clock,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            iconBg: 'bg-emerald-100',
            pulse: true
        }
    ];
</script>

<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
    {#each cards as card}
        <button
            on:click={() => onFilterChange(card.key)}
            class="relative p-4 rounded-xl border-2 transition-all text-left
                   {activeFilter === card.key 
                       ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900/10' 
                       : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'}"
        >
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</span>
                <div class="{card.iconBg} p-1.5 rounded-lg">
                    <svelte:component this={card.icon} size={14} class={card.color} />
                </div>
            </div>
            <p class="text-2xl font-bold text-gray-900">{card.value}</p>
            
            {#if card.pulse && card.value > 0}
                <span class="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {/if}
            
            {#if activeFilter === card.key}
                <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-900 rounded-t-full"></div>
            {/if}
        </button>
    {/each}
</div>