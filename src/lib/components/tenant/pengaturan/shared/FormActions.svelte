<!--
    FormActions.svelte - Form Action Buttons
    ============================================
    Tombol submit form yang reusable
-->
<script>
    import { Loader2, Save, Shield } from 'lucide-svelte';

    export let isSubmitting = false;
    export let disabled = false;
    export let label = 'Simpan Perubahan';
    export let variant = 'primary'; // primary | secondary
    export let icon = Save;
    export let canEdit = true;
</script>

<div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
    {#if !canEdit}
        <!-- View Only Badge -->
        <div class="flex items-center gap-2 text-sm text-slate-500">
            <Shield class="w-4 h-4" />
            <span>Hanya dapat dilihat</span>
        </div>
    {:else}
        <button
            type="submit"
            disabled={isSubmitting || disabled}
            class="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm
                   transition-all disabled:opacity-50 disabled:cursor-not-allowed
                   {variant === 'primary' 
                       ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]' 
                       : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[0.98]'}"
        >
            {#if isSubmitting}
                <Loader2 class="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
            {:else}
                <svelte:component this={icon} class="w-4 h-4" />
                <span>{label}</span>
            {/if}
        </button>
    {/if}
</div>