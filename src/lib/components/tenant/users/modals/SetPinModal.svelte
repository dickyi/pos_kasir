<!--
    SetPinModal.svelte - Modal Set/Ubah PIN
    ========================================
    Form untuk set atau ubah PIN user
    Features:
    - Real-time PIN validation (local + server)
    - Duplicate PIN check
    - Clear error messages
    - Generate PIN otomatis
-->
<script>
    import { enhance } from '$app/forms';
    import { 
        KeyRound, Eye, EyeOff, Copy, Check, AlertCircle, 
        CheckCircle, RefreshCw, Zap, XCircle
    } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import ShareWhatsApp from '../ShareWhatsApp.svelte';
    import { quickPinValidation } from '../index.js';

    export let show = false;
    export let user = null;
    export let pinConfig = { length: 6 };
    export let isSubmitting = false;
    export let kodeToko = '';
    export let namaToko = '';
    export let baseUrl = '';

    const dispatch = createEventDispatcher();

    // Form state
    let pinForm = {
        pin: '',
        confirm_pin: ''
    };

    let showPin = false;
    let pinCopied = false;
    let pinValidation = { isValid: null, message: '', isChecking: false };
    let generateError = '';
    let submitError = '';
    
    // Success state
    let showSuccessState = false;
    let savedPin = '';
    
    // Debounce timer
    let validationTimer;

    // Reset when modal opens
    $: if (show && user) {
        pinForm = { pin: '', confirm_pin: '' };
        pinValidation = { isValid: null, message: '', isChecking: false };
        showPin = false;
        pinCopied = false;
        showSuccessState = false;
        savedPin = '';
        generateError = '';
        submitError = '';
    }

    // Computed
    $: isPinFormValid = pinForm.pin.length === pinConfig.length && 
                        pinForm.pin === pinForm.confirm_pin &&
                        pinValidation.isValid === true;

    function close() {
        dispatch('close');
    }

    function handlePinInput(event) {
        const value = event.target.value.replace(/\D/g, '').slice(0, pinConfig.length);
        event.target.value = value;
        pinForm.pin = value;
        submitError = ''; // Clear submit error when user types
        validatePinRealtime(value);
    }

    function handleConfirmPinInput(event) {
        const value = event.target.value.replace(/\D/g, '').slice(0, pinConfig.length);
        event.target.value = value;
        pinForm.confirm_pin = value;
        submitError = '';
    }

    function validatePinRealtime(pin) {
        // Clear previous timer
        if (validationTimer) {
            clearTimeout(validationTimer);
        }
        
        // If PIN too short, clear validation
        if (!pin || pin.length < pinConfig.length) {
            pinValidation = { isValid: null, message: '', isChecking: false };
            return;
        }

        // Step 1: Quick local validation (weak PIN check)
        const localCheck = quickPinValidation(pin, pinConfig.length);
        
        if (!localCheck.valid) {
            pinValidation = { 
                isValid: false, 
                message: localCheck.message, 
                isChecking: false 
            };
            return;
        }
        
        // Step 2: Show checking state
        pinValidation = { isValid: null, message: '', isChecking: true };
        
        // Step 3: Debounced server validation (duplicate check)
        validationTimer = setTimeout(() => {
            checkPinOnServer(pin);
        }, 400);
    }
    
    async function checkPinOnServer(pin) {
        try {
            const formData = new FormData();
            formData.append('pin', pin);
            formData.append('exclude_user_id', user?.id || '');
            
            const response = await fetch('?/validatePinRealtime', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            console.log('Server PIN validation:', result);
            
            // Parse response - handle SvelteKit format
            let isValid = true;
            let message = 'PIN aman!';
            
            if (result.type === 'success' && result.data) {
                try {
                    const parsed = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
                    
                    if (Array.isArray(parsed)) {
                        // SvelteKit format: [mapping, ...values]
                        const mapping = parsed[0];
                        if (mapping && typeof mapping === 'object') {
                            isValid = mapping.valid !== undefined ? parsed[mapping.valid] : true;
                            message = mapping.message !== undefined ? parsed[mapping.message] : 'PIN aman!';
                        }
                    } else if (parsed && typeof parsed === 'object') {
                        isValid = parsed.valid !== undefined ? parsed.valid : true;
                        message = parsed.message || 'PIN aman!';
                    }
                } catch (e) {
                    console.log('Parse error:', e);
                }
            } else if (result.valid !== undefined) {
                // Direct format
                isValid = result.valid;
                message = result.message || (isValid ? 'PIN aman!' : 'PIN tidak valid');
            }
            
            pinValidation = { 
                isValid: isValid, 
                message: message, 
                isChecking: false 
            };
            
        } catch (err) {
            console.error('Server validation error:', err);
            // Fallback to local validation only
            const localCheck = quickPinValidation(pin, pinConfig.length);
            pinValidation = { 
                isValid: localCheck.valid, 
                message: localCheck.valid ? 'PIN aman!' : localCheck.message, 
                isChecking: false 
            };
        }
    }

    // Generate PIN
    async function generateNewPin() {
        isSubmitting = true;
        generateError = '';
        submitError = '';
        
        try {
            const formData = new FormData();
            const response = await fetch('?/generatePin', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            console.log('Generate PIN response:', result);
            
            let pin = null;
            
            if (result.type === 'success' && result.data) {
                try {
                    const dataArray = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
                    
                    if (Array.isArray(dataArray)) {
                        const mapping = dataArray[0];
                        if (mapping && typeof mapping === 'object' && mapping.pin !== undefined) {
                            pin = dataArray[mapping.pin];
                        }
                        
                        if (!pin) {
                            for (let i = 1; i < dataArray.length; i++) {
                                const item = dataArray[i];
                                if (typeof item === 'string' && /^\d{6}$/.test(item)) {
                                    pin = item;
                                    break;
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.log('Parse data error:', e);
                }
            }
            
            if (!pin && result.pin) pin = result.pin;
            if (!pin && result.data?.pin) pin = result.data.pin;
            
            if (pin) {
                pinForm.pin = String(pin);
                pinForm.confirm_pin = String(pin);
                pinValidation = { isValid: true, message: 'PIN aman!', isChecking: false };
                showPin = true;
                console.log('✅ PIN generated:', pin);
            } else {
                generateError = 'Gagal generate PIN. Silakan coba lagi.';
            }
            
        } catch (err) {
            console.error('Generate PIN error:', err);
            generateError = 'Terjadi kesalahan.';
        } finally {
            isSubmitting = false;
        }
    }

    async function copyPin() {
        try {
            await navigator.clipboard.writeText(pinForm.pin);
            pinCopied = true;
            setTimeout(() => pinCopied = false, 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    }

    function handleSubmit() {
        dispatch('submitting');
        submitError = '';
        
        return async ({ result, update }) => {
            console.log('Submit result:', result);
            
            if (result.type === 'success') {
                savedPin = pinForm.pin;
                showSuccessState = true;
                dispatch('submitted', result);
            } else if (result.type === 'failure') {
                // Show error message from server
                const errorData = result.data;
                submitError = errorData?.error || 'Gagal menyimpan PIN. Silakan coba lagi.';
                
                // If PIN duplicate error, also update validation state
                if (submitError.toLowerCase().includes('digunakan') || 
                    submitError.toLowerCase().includes('duplikat') ||
                    submitError.toLowerCase().includes('sudah ada')) {
                    pinValidation = { 
                        isValid: false, 
                        message: 'PIN sudah digunakan oleh user lain', 
                        isChecking: false 
                    };
                }
                
                dispatch('submitted', result);
            } else {
                dispatch('submitted', result);
            }
        };
    }

    function finishAndClose() {
        close();
    }
</script>

{#if show && user}
    <div 
        class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" 
        on:click|self={close}
        on:keydown={(e) => e.key === 'Escape' && close()}
        role="dialog"
        aria-modal="true"
    >
        <div class="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <!-- Header -->
            <div class="p-5 border-b border-gray-100">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <KeyRound size={20} class="text-emerald-600" />
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">
                            {showSuccessState ? '✅ PIN Berhasil!' : (user.has_pin ? 'Ubah PIN' : 'Set PIN')}
                        </h3>
                        <p class="text-sm text-gray-500">{user.nama}</p>
                    </div>
                </div>
            </div>
            
            {#if showSuccessState}
                <!-- Success State -->
                <div class="p-5 space-y-4">
                    <div class="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center">
                        <CheckCircle size={32} class="text-emerald-500 mx-auto mb-2" />
                        <p class="text-sm font-medium text-emerald-800">PIN berhasil disimpan!</p>
                        <p class="text-xs text-emerald-600 mt-1">Bagikan info login ke kasir</p>
                    </div>
                    
                    <ShareWhatsApp 
                        user={{ ...user, pin: savedPin }}
                        {kodeToko}
                        {namaToko}
                        {baseUrl}
                    />
                    
                    <div class="bg-amber-50 border border-amber-100 rounded-lg p-3">
                        <p class="text-xs text-amber-700 flex items-center gap-2">
                            <AlertCircle size={14} />
                            PIN tidak akan ditampilkan lagi setelah menutup modal ini
                        </p>
                    </div>
                    
                    <button 
                        on:click={finishAndClose}
                        class="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Selesai
                    </button>
                </div>
            {:else}
                <!-- Form State -->
                <form 
                    method="POST" 
                    action="?/setPin" 
                    use:enhance={handleSubmit}
                    class="p-5 space-y-4"
                >
                    <input type="hidden" name="user_id" value={user.id} />
                    
                    <!-- Submit Error Alert -->
                    {#if submitError}
                        <div class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                            <XCircle size={18} class="text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p class="text-sm font-medium text-red-800">Gagal Menyimpan PIN</p>
                                <p class="text-xs text-red-600 mt-0.5">{submitError}</p>
                            </div>
                        </div>
                    {/if}
                    
                    <!-- PIN Input -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">PIN Baru</label>
                        <div class="relative">
                            <input 
                                type={showPin ? 'text' : 'password'} 
                                name="pin" 
                                bind:value={pinForm.pin}
                                on:input={handlePinInput}
                                maxlength={pinConfig.length}
                                inputmode="numeric"
                                autocomplete="off"
                                required
                                placeholder="Masukkan 6 digit PIN"
                                class="w-full h-11 px-3 pr-20 border rounded-lg text-base outline-none transition-all
                                       {pinValidation.isValid === true ? 'border-emerald-400 bg-emerald-50/50 focus:ring-2 focus:ring-emerald-200' : ''}
                                       {pinValidation.isValid === false ? 'border-red-400 bg-red-50/50 focus:ring-2 focus:ring-red-200' : ''}
                                       {pinValidation.isValid === null && !pinValidation.isChecking ? 'border-gray-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200' : ''}
                                       {pinValidation.isChecking ? 'border-blue-300 bg-blue-50/30' : ''}"
                            />
                            <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                <button 
                                    type="button" 
                                    on:click={() => showPin = !showPin} 
                                    class="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                                >
                                    {#if showPin}
                                        <EyeOff size={18} />
                                    {:else}
                                        <Eye size={18} />
                                    {/if}
                                </button>
                                {#if pinForm.pin}
                                    <button 
                                        type="button" 
                                        on:click={copyPin} 
                                        class="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                                    >
                                        {#if pinCopied}
                                            <Check size={18} class="text-emerald-500" />
                                        {:else}
                                            <Copy size={18} />
                                        {/if}
                                    </button>
                                {/if}
                            </div>
                        </div>
                        
                        <!-- Validation Message -->
                        {#if pinValidation.isChecking}
                            <p class="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
                                <RefreshCw size={12} class="animate-spin" />
                                Memeriksa ketersediaan PIN...
                            </p>
                        {:else if pinValidation.isValid === true}
                            <p class="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                                <CheckCircle size={12} />
                                {pinValidation.message}
                            </p>
                        {:else if pinValidation.isValid === false}
                            <p class="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                                <XCircle size={12} />
                                {pinValidation.message}
                            </p>
                        {/if}
                    </div>
                    
                    <!-- Confirm PIN -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi PIN Baru</label>
                        <input 
                            type={showPin ? 'text' : 'password'} 
                            name="confirm_pin" 
                            bind:value={pinForm.confirm_pin}
                            on:input={handleConfirmPinInput}
                            maxlength={pinConfig.length}
                            inputmode="numeric"
                            autocomplete="off"
                            required
                            placeholder="Masukkan ulang PIN"
                            class="w-full h-11 px-3 border rounded-lg text-base outline-none transition-all
                                   {pinForm.pin && pinForm.confirm_pin && pinForm.pin === pinForm.confirm_pin ? 'border-emerald-400 bg-emerald-50/50 focus:ring-2 focus:ring-emerald-200' : ''}
                                   {pinForm.pin && pinForm.confirm_pin && pinForm.pin !== pinForm.confirm_pin ? 'border-red-400 bg-red-50/50 focus:ring-2 focus:ring-red-200' : ''}
                                   {!pinForm.confirm_pin || !pinForm.pin ? 'border-gray-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200' : ''}"
                        />
                        {#if pinForm.pin && pinForm.confirm_pin && pinForm.pin !== pinForm.confirm_pin}
                            <p class="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                                <XCircle size={12} />
                                PIN tidak cocok
                            </p>
                        {:else if pinForm.pin && pinForm.confirm_pin && pinForm.pin === pinForm.confirm_pin}
                            <p class="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                                <CheckCircle size={12} />
                                PIN cocok
                            </p>
                        {/if}
                    </div>
                    
                    <!-- Generate Button -->
                    <button 
                        type="button" 
                        on:click={generateNewPin}
                        disabled={isSubmitting}
                        class="w-full px-3 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {#if isSubmitting}
                            <RefreshCw size={16} class="animate-spin" />
                            Generating...
                        {:else}
                            <Zap size={16} />
                            Generate PIN Otomatis
                        {/if}
                    </button>
                    
                    <!-- Generate Error -->
                    {#if generateError}
                        <p class="text-xs text-red-600 text-center flex items-center justify-center gap-1">
                            <AlertCircle size={12} />
                            {generateError}
                        </p>
                    {/if}
                    
                    <!-- Info -->
                    <div class="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-0.5">
                        <p>• PIN harus {pinConfig.length} digit angka</p>
                        <p>• Tidak boleh semua angka sama (111111)</p>
                        <p>• Tidak boleh berurutan (123456, 654321)</p>
                        <p>• PIN harus unik per toko</p>
                    </div>
                    
                    <!-- Actions -->
                    <div class="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            on:click={close} 
                            class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || !isPinFormValid || pinValidation.isChecking}
                            class="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors
                                   {isPinFormValid && !pinValidation.isChecking ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-300 cursor-not-allowed'}"
                        >
                            {#if isSubmitting}
                                <span class="flex items-center justify-center gap-2">
                                    <RefreshCw size={14} class="animate-spin" />
                                    Menyimpan...
                                </span>
                            {:else if pinValidation.isChecking}
                                Memvalidasi...
                            {:else}
                                Simpan PIN
                            {/if}
                        </button>
                    </div>
                </form>
            {/if}
        </div>
    </div>
{/if}

<style>
    :global(.animate-spin) {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style>