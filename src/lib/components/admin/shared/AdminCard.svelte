<script>
    /**
     * AdminCard - Komponen card container yang konsisten untuk halaman admin
     *
     * @usage
     * <AdminCard title="Judul Card">
     *   <div>Content here</div>
     * </AdminCard>
     */

    export let title = '';
    export let subtitle = '';
    export let icon = null;
    export let iconBg = 'bg-blue-50';
    export let iconColor = 'text-blue-600';
    export let headerAction = null;
    export let padding = 'p-5';
    export let hover = false;
    export let headerBorder = true;
    export let classContainer = '';
    export let variant = 'default'; // default, gradient, warning

    // Variant styles
    $: variantStyles = {
        default: 'bg-white border border-slate-200/60',
        gradient: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0',
        warning: 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60'
    }[variant] || 'bg-white border border-slate-200/60';

    $: textStyle = variant === 'gradient' ? 'text-white' : 'text-slate-900';
    $: subTextStyle = variant === 'gradient' ? 'text-blue-100' : 'text-slate-500';
</script>

<div class="rounded-xl {variantStyles} {hover ? 'hover:shadow-md hover:border-slate-300/60 transition-all' : ''} {classContainer}">
    {#if title || icon || $$slots.header}
        <div class="px-5 py-4 {headerBorder ? 'border-b border-slate-100' : ''} flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
                {#if icon}
                    <div class="p-2 rounded-xl flex-shrink-0 {iconBg}">
                        <svelte:component this={icon} size={18} class={iconColor} />
                    </div>
                {/if}
                <div class="min-w-0">
                    {#if title}
                        <h3 class="font-semibold {textStyle} truncate">{title}</h3>
                    {/if}
                    {#if subtitle}
                        <p class="text-sm {subTextStyle}">{subtitle}</p>
                    {/if}
                </div>
            </div>

            {#if headerAction}
                <div class="flex-shrink-0">
                    {headerAction}
                </div>
            {/if}

            {#if $$slots.header}
                <div class="flex-shrink-0">
                    <slot name="header" />
                </div>
            {/if}
        </div>
    {/if}

    <div class={padding}>
        <slot />
    </div>

    {#if $$slots.footer}
        <div class="px-5 py-4 border-t border-slate-100">
            <slot name="footer" />
        </div>
    {/if}
</div>
