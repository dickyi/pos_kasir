<!-- ============================================
SMTP TEST SECTION COMPONENT (FIXED)
File: src/lib/components/admin/email/components/SmtpTestSection.svelte

Test SMTP configuration by sending test email.

FIXED:
- Only dispatch 'result' event (not separate 'error')
- Better response parsing
- Consistent error handling
============================================ -->

<script>
    import { Send, RefreshCw, CheckCircle, XCircle, Mail, AlertTriangle } from 'lucide-svelte';
    import { isValidEmail } from '../utils/helpers.js';
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    // Props
    export let disabled = false;
    export let defaultEmail = '';
    
    // State
    let testEmail = defaultEmail;
    let isTesting = false;
    let testResult = null;
    
    // Validate email
    $: isValid = isValidEmail(testEmail);
    $: canTest = isValid && !isTesting && !disabled;
    
    /**
     * Handle SMTP test
     * ✅ FIXED: Only dispatch 'result' event, never 'error'
     */
    async function handleTest() {
        if (!canTest) return;
        
        isTesting = true;
        testResult = null;
        
        try {
            const formData = new FormData();
            formData.append('test_email', testEmail);
            
            const response = await fetch('?/testSmtp', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            console.log('[SmtpTest] Raw response:', result);
            
            // ✅ FIXED: Parse SvelteKit response properly
            let finalResult = {
                success: false,
                message: 'Unknown response format'
            };
            
            // Handle SvelteKit form response
            if (result.type === 'success') {
                // Success response
                const data = result.data ? (Array.isArray(result.data) ? result.data[0] : result.data) : {};
                finalResult = {
                    success: true,
                    message: data.message || result.message || 'Test email berhasil dikirim!'
                };
            } else if (result.type === 'failure') {
                // Failure response (from fail())
                const data = result.data || {};
                finalResult = {
                    success: false,
                    message: data.message || result.message || 'Test email gagal dikirim'
                };
            } else if (result.type === 'error') {
                // Error response
                finalResult = {
                    success: false,
                    message: result.error?.message || 'Terjadi kesalahan pada server'
                };
            } else {
                // Direct object (non-standard response)
                finalResult = {
                    success: result.success === true,
                    message: result.message || (result.success ? 'Test berhasil!' : 'Test gagal')
                };
            }
            
            console.log('[SmtpTest] Final result:', finalResult);
            
            testResult = finalResult;
            
            // ✅ FIXED: Only dispatch 'result', never 'error'
            dispatch('result', finalResult);
            
        } catch (error) {
            console.error('[SmtpTest] Exception:', error);
            
            const errorResult = {
                success: false,
                message: `Gagal mengirim test email: ${error.message}`
            };
            
            testResult = errorResult;
            
            // ✅ FIXED: Still dispatch 'result', not 'error'
            dispatch('result', errorResult);
            
        } finally {
            isTesting = false;
        }
    }
    
    /**
     * Clear result when email changes
     */
    function handleEmailChange() {
        testResult = null;
    }
</script>

<div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Send size={20} class="text-violet-600" />
        Test Kirim Email
    </h3>
    
    <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <!-- Input Row -->
        <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} class="text-gray-400" />
                </div>
                <input 
                    type="email" 
                    bind:value={testEmail}
                    on:input={handleEmailChange}
                    placeholder="Masukkan email tujuan test..."
                    disabled={isTesting || disabled}
                    class="w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm
                           transition-all duration-200
                           {!testEmail ? 'border-gray-300 focus:border-violet-500 focus:ring-violet-500' : 
                            isValid ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500' : 
                            'border-red-300 focus:border-red-500 focus:ring-red-500'}
                           focus:ring-2 focus:ring-opacity-50
                           disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                />
                
                <!-- Validation indicator -->
                {#if testEmail}
                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {#if isValid}
                            <CheckCircle size={16} class="text-emerald-500" />
                        {:else}
                            <XCircle size={16} class="text-red-500" />
                        {/if}
                    </div>
                {/if}
            </div>
            
            <button 
                on:click={handleTest}
                disabled={!canTest}
                class="inline-flex items-center justify-center gap-2 px-6 py-2.5 
                       bg-emerald-600 text-white rounded-lg text-sm font-semibold 
                       hover:bg-emerald-700 active:bg-emerald-800
                       transition-colors duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       min-w-[140px] shadow-sm hover:shadow-md"
            >
                {#if isTesting}
                    <RefreshCw size={16} class="animate-spin" />
                    <span>Mengirim...</span>
                {:else}
                    <Send size={16} />
                    <span>Kirim Test</span>
                {/if}
            </button>
        </div>
        
        <!-- Helper text -->
        <p class="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
            <AlertTriangle size={12} />
            Kirim email percobaan untuk memastikan konfigurasi SMTP sudah benar.
        </p>
        
        <!-- Result message (inline feedback) -->
        {#if testResult}
            <div class="mt-3 flex items-start gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200
                        {testResult.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 
                         'bg-red-50 border border-red-200 text-red-800'}">
                <div class="flex-shrink-0 mt-0.5">
                    {#if testResult.success}
                        <CheckCircle size={18} class="text-emerald-600" />
                    {:else}
                        <XCircle size={18} class="text-red-600" />
                    {/if}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium leading-relaxed">{testResult.message}</p>
                </div>
            </div>
        {/if}
        
        <!-- Disabled state message -->
        {#if disabled}
            <div class="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle size={16} class="text-amber-600 flex-shrink-0" />
                <p class="text-xs text-amber-800">
                    SMTP belum dikonfigurasi. Silakan lengkapi konfigurasi terlebih dahulu.
                </p>
            </div>
        {/if}
    </div>
</div>