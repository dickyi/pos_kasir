<script>
    /**
     * AdminBadge - Komponen badge/status yang konsisten untuk halaman admin
     *
     * @usage
     * <AdminBadge status="aktif" />Aktif</AdminBadge>
     * <AdminBadge variant="info" label="New" />
     * <AdminBadge color="bg-purple-50 text-purple-700 ring-purple-600/20">Custom</AdminBadge>
     */

    export let status = ''; // aktif, pending, nonaktif, success, warning, danger, info
    export let variant = '';
    export let label = '';
    export let size = 'md'; // sm, md, lg
    export let dot = false;

    // Status presets
    const statusPresets = {
        aktif: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
        nonaktif: 'bg-red-50 text-red-700 ring-red-600/20',
        inactive: 'bg-red-50 text-red-700 ring-red-600/20',
        success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
        danger: 'bg-red-50 text-red-700 ring-red-600/20',
        error: 'bg-red-50 text-red-700 ring-red-600/20',
        info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
        deleted: 'bg-gray-100 text-gray-500 ring-gray-500/20'
    };

    // Size styles
    const sizeStyles = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm'
    };

    $: badgeClass = statusPresets[status] || statusPresets[variant] || 'bg-slate-50 text-slate-700 ring-slate-600/20';
    $: displayLabel = label || status || variant || '';
</script>

<span
    class="inline-flex items-center justify-center gap-1.5 font-medium rounded-lg ring-1 ring-inset {sizeStyles[size]} {badgeClass}"
>
    {#if dot}
        <span class="w-1.5 h-1.5 rounded-full bg-current" />
    {/if}
    {@render displayLabel()}
    {#if $$slots.default}
        <slot />
    {/if}
</span>
