<script>
    import { Search, Eye, EyeOff, X, Calendar } from 'lucide-svelte';

    /**
     * AdminInput - Komponen input yang konsisten untuk halaman admin
     *
     * @usage
     * <AdminInput label="Nama" placeholder="Masukkan nama..." />
     * <AdminInput type="search" placeholder="Cari..." />
     * <AdminInput type="password" />
     */

    export let type = 'text'; // text, email, password, search, number, date, textarea
    export let label = '';
    export let placeholder = '';
    export let value = undefined;
    export let name = '';
    export let id = '';
    export let required = false;
    export let disabled = false;
    export let readonly = false;
    export let error = '';
    export let helper = '';
    export let icon = null;
    export let iconPosition = 'left';
    export let size = 'md'; // sm, md, lg
    export let rows = 3;
    export let showPasswordToggle = false;

    let showPassword = false;
    let inputElement;

    // Generate ID if not provided
    $: inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Toggle password visibility
    function togglePassword() {
        showPassword = !showPassword;
    }

    // Clear input
    function clearInput() {
        value = '';
        if (inputElement) {
            inputElement.focus();
        }
    }

    // Size styles
    const sizeStyles = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-5 py-3 text-base'
    };

    $: currentType = type === 'password' && showPassword ? 'text' : type;
    $: hasIcon = icon || type === 'search';
    $: displayIcon = icon || (type === 'search' ? Search : null);
</script>

<div class="w-full">
    {#if label}
        <label for={inputId} class="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
            {#if required}
                <span class="text-red-500">*</span>
            {/if}
        </label>
    {/if}

    <div class="relative">
        {#if hasIcon && iconPosition === 'left'}
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <svelte:component this={displayIcon} size={18} />
            </div>
        {/if}

        {#if type === 'textarea'}
            <textarea
                bind:this={inputElement}
                {id}
                {name}
                {value}
                {placeholder}
                {required}
                {disabled}
                {readonly}
                {rows}
                class="w-full {sizeStyles[size]} {hasIcon && iconPosition === 'left' ? 'pl-10' : ''} border
                       {error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-500'}
                       rounded-xl focus:outline-none focus:ring-2 transition-all resize-none"
                class:error={error}
                on:input
            ></textarea>
        {:else}
            <input
                bind:this={inputElement}
                {id}
                {name}
                {value}
                {placeholder}
                {required}
                {disabled}
                {readonly}
                type={currentType}
                class="w-full {sizeStyles[size]} {hasIcon && iconPosition === 'left' ? 'pl-10' : ''}
                       {showPasswordToggle || (value && type === 'search') ? 'pr-10' : ''} border
                       {error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-500'}
                       rounded-xl focus:outline-none focus:ring-2 transition-all"
                class:bg-gray-50={readonly}
                class:cursor-not-allowed={readonly}
                on:input
            />
        {/if}

        {#if type === 'password' && showPasswordToggle}
            <button
                type="button"
                on:click={togglePassword}
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabindex="-1"
            >
                {#if showPassword}
                    <EyeOff size={18} />
                {:else}
                    <Eye size={18} />
                {/if}
            </button>
        {:else if type === 'search' && value}
            <button
                type="button"
                on:click={clearInput}
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabindex="-1"
            >
                <X size={18} />
            </button>
        {/if}
    </div>

    {#if error}
        <p class="mt-1.5 text-sm text-red-600">{error}</p>
    {:else if helper}
        <p class="mt-1.5 text-sm text-slate-500">{helper}</p>
    {/if}
</div>
