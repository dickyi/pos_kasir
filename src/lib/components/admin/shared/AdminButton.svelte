<script>
    import { Loader2, Plus, Download, RefreshCw, Edit, Trash2, Eye, Search, X, ChevronLeft, ChevronRight, Check, XCircle } from 'lucide-svelte';

    /**
     * AdminButton - Komponen button yang konsisten untuk halaman admin
     *
     * @usage
     * <AdminButton variant="primary">Simpan</AdminButton>
     * <AdminButton variant="secondary" icon={Edit}>Edit</AdminButton>
     * <AdminButton variant="danger" icon={Trash2}>Hapus</AdminButton>
     */

    export let variant = 'primary'; // primary, secondary, danger, ghost, icon
    export let size = 'md'; // sm, md, lg
    export let type = 'button';
    export let disabled = false;
    export let loading = false;
    export let icon = null;
    export let iconPosition = 'left'; // left, right, only
    export let href = '';
    export let target = '';
    export let classCustom = '';
    export let ripple = false;

    // Button base styles
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

    // Variant styles
    const variantStyles = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm',
        secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
        ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-500',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm',
        warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 shadow-sm',
        icon: 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:ring-slate-500'
    };

    // Size styles
    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm rounded-lg',
        md: 'px-4 py-2 text-sm rounded-xl',
        lg: 'px-5 py-2.5 text-base rounded-xl'
    };

    // Icon only size
    const iconOnlySize = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-2.5'
    };

    // Loading spinner size
    const spinnerSize = {
        sm: 14,
        md: 16,
        lg: 18
    };

    $: buttonClass = `${baseStyles} ${variantStyles[variant]} ${icon && iconPosition === 'only' ? iconOnlySize[size] : sizeStyles[size]} ${classCustom}`;

    // Wrapper for link or button
    const Wrapper = href ? 'a' : 'button';
</script>

<Wrapper
    {href}
    {target}
    {type}
    {disabled}
    class={buttonClass}
    on:click
>
    {#if loading}
        <Loader2 size={spinnerSize[size]} class="animate-spin" />
    {:else}
        {#if icon && iconPosition !== 'right'}
            <svelte:component this={icon} size={spinnerSize[size]} />
        {/if}

        {#if iconPosition !== 'only' && $$slots.default}
            <slot />
        {/if}

        {#if icon && iconPosition === 'right'}
            <svelte:component this={icon} size={spinnerSize[size]} />
        {/if}
    {/if}
</Wrapper>
