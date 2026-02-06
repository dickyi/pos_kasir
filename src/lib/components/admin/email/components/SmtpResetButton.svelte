<!-- ============================================
SMTP RESET BUTTON COMPONENT
File: src/lib/components/admin/email/components/SmtpResetButton.svelte

Reset SMTP configuration to defaults with confirmation
============================================ -->

<script>
    import { enhance } from '$app/forms';
    import { RotateCcw } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    // Props
    export let isLoading = false;
    export let confirmMessage = 'Reset semua konfigurasi SMTP ke default?';
    
    // State
    let showConfirm = false;
    
    // Handle click
    function handleClick() {
        showConfirm = true;
    }
    
    // Confirm reset
    function confirmReset() {
        showConfirm = false;
        // Form will be submitted naturally
    }
    
    // Cancel reset
    function cancelReset() {
        showConfirm = false;
    }
    
    // Handle form result
    function handleResult({ result }) {
        dispatch('result', result);
    }
</script>

<div class="mt-4 flex justify-start">
    {#if showConfirm}
        <!-- Confirmation Dialog -->
        <div class="flex items-center gap-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <span class="text-sm text-amber-800">{confirmMessage}</span>
            <div class="flex gap-2">
                <form method="POST" action="?/resetSmtp" use:enhance={handleResult}>
                    <button 
                        type="submit"
                        disabled={isLoading}
                        class="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 
                               rounded transition-colors disabled:opacity-50"
                    >
                        Ya, Reset
                    </button>
                </form>
                <button 
                    type="button"
                    on:click={cancelReset}
                    class="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white hover:bg-gray-100 
                           border border-gray-300 rounded transition-colors"
                >
                    Batal
                </button>
            </div>
        </div>
    {:else}
        <!-- Reset Button -->
        <button 
            type="button"
            on:click={handleClick}
            disabled={isLoading}
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 
                   hover:text-gray-800 hover:bg-gray-100 rounded-lg border border-gray-200 
                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <RotateCcw size={16} />
            Reset ke Default
        </button>
    {/if}
</div>