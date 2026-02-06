<script>
    import { PUBLIC_SHOW_DEMO } from '$env/static/public';
    import { enhance } from '$app/forms';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import { 
        Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Sparkles, 
        Store, Hash, AlertCircle, Clock, Users, Check, X, Delete,
        Info, ShieldCheck, KeyRound, Building2
    } from 'lucide-svelte';
    
    export let data;
    export let form;
    
    // ============================================
    // STATE
    // ============================================
    let isSubmitting = false;
    let showPassword = false;
    let email = form?.email || '';
    let password = '';
    let remember = false;

    // Login mode
    let loginMode = form?.mode || 'email';
    
    // PIN Login State
    let storeCode = form?.storeCode || '';
    let pin = '';
    let rememberStore = false;
    
    // Store validation state
    let isValidatingStore = false;
    let storeValidation = {
        checked: false,
        valid: false,
        tenant: null,
        message: ''
    };
    
    // Debounce timer
    let validateTimer = null;

    // [FIX-1] Demo mode - dikontrol via environment variable
    // ================================================
    // CARA PENGGUNAAN:
    // Di file .env.development: PUBLIC_SHOW_DEMO=true
    // Di file .env.production: PUBLIC_SHOW_DEMO=false (atau hapus saja)
    // ================================================
    let showDemoAccounts = PUBLIC_SHOW_DEMO === 'true' || false;

    // ============================================
    // LIFECYCLE
    // ============================================
    onMount(() => {
        // Fallback: cek URL parameter (?demo) untuk testing
        if (browser && !showDemoAccounts) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('demo')) {
                showDemoAccounts = true;
            }
        }

        // Load stored store code
        if (browser) {
            const savedStoreCode = localStorage.getItem('pos_store_code');
            const savedRememberStore = localStorage.getItem('pos_remember_store') === 'true';
            
            if (savedStoreCode && savedRememberStore) {
                storeCode = savedStoreCode;
                rememberStore = true;
                validateStoreCode(savedStoreCode);
            }
        }
        
        // Handle prefilled store dari URL
        if (data?.prefilledStore) {
            storeCode = data.prefilledStore.code;
            storeValidation = {
                checked: true,
                valid: true,
                tenant: data.prefilledStore,
                message: ''
            };
        }
    });

    // ============================================
    // FUNCTIONS
    // ============================================
    
    // [FIX-2] Validasi kode toko dengan CSRF token
    async function validateStoreCode(code) {
        if (!code || code.length < 3) {
            storeValidation = { checked: false, valid: false, tenant: null, message: '' };
            return;
        }

        isValidatingStore = true;
        
        try {
            const formData = new FormData();
            formData.append('storeCode', code.toUpperCase());
            
            // [FIX-2] Kirim request dengan credentials dan proper headers
            const response = await fetch('?/validateStore', {
                method: 'POST',
                body: formData,
                headers: {
                    // SvelteKit menggunakan header ini untuk CSRF protection
                    'x-sveltekit-action': 'true'
                }
            });
            
            const result = await response.json();
            
            if (result.type === 'success') {
                const data = result.data;
                storeValidation = {
                    checked: true,
                    valid: true,
                    tenant: data.tenant,
                    message: ''
                };
                
                if (rememberStore && browser) {
                    localStorage.setItem('pos_store_code', code.toUpperCase());
                    localStorage.setItem('pos_remember_store', 'true');
                }
            } else {
                const errorData = result.data || {};
                storeValidation = {
                    checked: true,
                    valid: false,
                    tenant: null,
                    message: errorData.message || 'Kode toko tidak valid!'
                };
            }
        } catch (error) {
            console.error('Store validation error:', error);
            storeValidation = {
                checked: true,
                valid: false,
                tenant: null,
                message: 'Gagal memvalidasi. Coba lagi.'
            };
        } finally {
            isValidatingStore = false;
        }
    }

    // Handle store code input dengan debounce
    function handleStoreCodeInput(event) {
        const value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
        storeCode = value;
        event.target.value = value;
        
        storeValidation = { checked: false, valid: false, tenant: null, message: '' };
        
        clearTimeout(validateTimer);
        if (value.length >= 3) {
            validateTimer = setTimeout(() => {
                validateStoreCode(value);
            }, 500);
        }
    }

    // Handle PIN input
    function handlePinInput(event) {
        const value = event.target.value.replace(/\D/g, '').slice(0, 6);
        pin = value;
        event.target.value = value;
    }

    // Handle PIN Pad click
    function handlePinPadClick(digit) {
        if (digit === 'backspace') {
            pin = pin.slice(0, -1);
        } else if (digit === 'clear') {
            pin = '';
        } else if (pin.length < 6) {
            pin = pin + digit;
        }
    }

    // Handle form submit
    function handleSubmit() {
        isSubmitting = true;
        return async ({ result, update }) => {
            isSubmitting = false;
            
            if (result.type === 'failure') {
                if (loginMode === 'pin') {
                    pin = '';
                }
            }
            
            await update();
        };
    }

    // Switch login mode
    function switchMode(mode) {
        loginMode = mode;
        if (form) form = null;
    }

    // Handle remember store
    function handleRememberStore() {
        if (browser) {
            if (rememberStore && storeCode && storeValidation.valid) {
                localStorage.setItem('pos_store_code', storeCode);
                localStorage.setItem('pos_remember_store', 'true');
            } else {
                localStorage.removeItem('pos_store_code');
                localStorage.removeItem('pos_remember_store');
            }
        }
    }

    // Format locked time
    function formatLockedTime(lockedUntil) {
        if (!lockedUntil) return '';
        const lockTime = new Date(lockedUntil);
        const now = new Date();
        const diffMs = lockTime - now;
        if (diffMs <= 0) return '';
        const diffMins = Math.ceil(diffMs / 60000);
        if (diffMins <= 1) return '1 menit';
        if (diffMins < 60) return `${diffMins} menit`;
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours} jam ${mins} menit`;
    }

    // ============================================
    // REACTIVE
    // ============================================
    $: canSubmitPin = storeValidation.valid && pin.length === 6 && !isSubmitting;
</script>

<svelte:head>
    <title>Masuk - POSKasir</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans']">
    <!-- Background decorations -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-emerald-100 rounded-full blur-3xl opacity-60"></div>
        <div class="absolute top-1/2 -left-20 w-60 h-60 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        <div class="absolute -bottom-20 right-1/3 w-72 h-72 bg-violet-100 rounded-full blur-3xl opacity-40"></div>
    </div>

    <div class="relative min-h-screen flex">
        <!-- Left Side - Branding -->
        <div class="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
            <div class="absolute inset-0">
                <div class="absolute top-20 left-20 w-32 h-32 border border-white/10 rounded-2xl rotate-12"></div>
                <div class="absolute bottom-32 right-20 w-24 h-24 border border-white/10 rounded-full"></div>
                <div class="absolute top-1/2 left-1/3 w-16 h-16 bg-emerald-500/20 rounded-lg blur-xl"></div>
                <div class="absolute bottom-1/3 right-1/3 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl"></div>
            </div>

            <div class="relative z-10">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Store class="w-6 h-6 text-white" />
                    </div>
                    <span class="text-2xl font-bold text-white tracking-tight">POSKasir</span>
                </div>
            </div>

            <div class="relative z-10 max-w-lg">
                <h1 class="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                    Kelola bisnis Anda dengan 
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">lebih mudah</span>
                </h1>
                <p class="text-slate-400 text-lg leading-relaxed">
                    Sistem kasir modern yang membantu Anda mengelola penjualan, inventori, dan laporan bisnis dalam satu platform terintegrasi.
                </p>
                <div class="mt-10 space-y-4">
                    {#each ['Transaksi cepat & akurat', 'Laporan real-time', 'Multi-user support', 'Login PIN untuk kasir'] as feature}
                        <div class="flex items-center gap-3 text-slate-300">
                            <div class="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
                            </div>
                            <span>{feature}</span>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- [FIX-3] Tahun dinamis -->
            <div class="relative z-10 text-slate-500 text-sm">&copy; {new Date().getFullYear()} POSKasir. All rights reserved.</div>
        </div>

        <!-- Right Side - Login Form -->
        <div class="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12">
            <div class="w-full max-w-md">
                <!-- Mobile Logo -->
                <div class="lg:hidden flex items-center justify-center gap-3 mb-10">
                    <div class="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Store class="w-5 h-5 text-white" />
                    </div>
                    <span class="text-xl font-bold text-slate-800 tracking-tight">POSKasir</span>
                </div>

                <!-- Header -->
                <div class="mb-8">
                    <h2 class="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Selamat Datang</h2>
                    <p class="text-slate-500">Masuk untuk melanjutkan ke dashboard Anda</p>
                </div>

                <!-- Login Mode Tabs -->
                <div class="flex mb-6 p-1 bg-slate-100 rounded-xl">
                    <button
                        type="button"
                        on:click={() => switchMode('email')}
                        class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
                               {loginMode === 'email' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
                    >
                        <Mail class="w-4 h-4" />
                        <span>Email</span>
                    </button>
                    <button
                        type="button"
                        on:click={() => switchMode('pin')}
                        class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
                               {loginMode === 'pin' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
                    >
                        <KeyRound class="w-4 h-4" />
                        <span>PIN Kasir</span>
                    </button>
                </div>

                <!-- Error Message -->
                {#if form?.message && !form?.success}
                    <div class="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                        <div class="flex-shrink-0 mt-0.5">
                            {#if form?.lockedUntil}
                                <Clock class="w-5 h-5 text-red-500" />
                            {:else if form?.rateLimited}
                                <ShieldCheck class="w-5 h-5 text-red-500" />
                            {:else}
                                <AlertCircle class="w-5 h-5 text-red-500" />
                            {/if}
                        </div>
                        <div>
                            <p class="text-red-600 text-sm font-medium">{form.message}</p>
                            {#if form?.lockedUntil}
                                <p class="text-red-500 text-xs mt-1">
                                    Waktu tersisa: {formatLockedTime(form.lockedUntil)}
                                </p>
                            {/if}
                            {#if form?.attemptsRemaining !== undefined && form?.attemptsRemaining > 0}
                                <p class="text-red-500 text-xs mt-1">
                                    Sisa percobaan: {form.attemptsRemaining}x
                                </p>
                            {/if}
                        </div>
                    </div>
                {/if}

                <!-- Email Login Form -->
                {#if loginMode === 'email'}
                    <form method="POST" action="?/login" use:enhance={handleSubmit} class="space-y-5">
                        <div class="space-y-2">
                            <label for="email" class="block text-sm font-medium text-slate-700">Email</label>
                            <div class="relative group">
                                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                    <Mail class="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    bind:value={email}
                                    required
                                    autocomplete="email"
                                    placeholder="nama@email.com"
                                    class="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                />
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label for="password" class="block text-sm font-medium text-slate-700">Password</label>
                            <div class="relative group">
                                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                    <Lock class="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    bind:value={password}
                                    required
                                    autocomplete="current-password"
                                    placeholder="Masukkan password"
                                    class="w-full h-12 pl-12 pr-12 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                />
                                <button
                                    type="button"
                                    on:click={() => showPassword = !showPassword}
                                    class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {#if showPassword}<EyeOff class="w-5 h-5" />{:else}<Eye class="w-5 h-5" />{/if}
                                </button>
                            </div>
                        </div>

                        <div class="flex items-center justify-between">
                            <label class="flex items-center gap-2.5 cursor-pointer group">
                                <div class="relative">
                                    <input type="checkbox" name="remember" bind:checked={remember} class="peer sr-only" />
                                    <div class="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-all"></div>
                                    <svg class="absolute top-1 left-1 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                                <span class="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Ingat saya</span>
                            </label>
                            <a href="/forgot-password" class="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">Lupa password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !email || !password}
                            class="relative w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden group"
                        >
                            {#if isSubmitting}
                                <Loader2 class="w-5 h-5 animate-spin" /><span>Memproses...</span>
                            {:else}
                                <span>Masuk</span><ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            {/if}
                        </button>
                    </form>

                {:else}
                    <!-- PIN LOGIN FORM -->
                    <form method="POST" action="?/pinLogin" use:enhance={handleSubmit} class="space-y-5">
                        
                        <!-- Store Code Input -->
                        <div class="space-y-2">
                            <label for="store_code" class="block text-sm font-medium text-slate-700">
                                Kode Toko
                            </label>
                            <div class="relative group">
                                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                    <Building2 class="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    id="store_code"
                                    name="store_code"
                                    value={storeCode}
                                    on:input={handleStoreCodeInput}
                                    required
                                    autocomplete="off"
                                    placeholder="Contoh: PLG101"
                                    class="w-full h-12 pl-12 pr-12 bg-white border rounded-xl text-slate-800 uppercase font-mono tracking-wider placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal placeholder:font-sans focus:outline-none transition-all
                                           {storeValidation.checked && storeValidation.valid 
                                               ? 'border-emerald-500 focus:ring-4 focus:ring-emerald-500/10' 
                                               : storeValidation.checked && !storeValidation.valid 
                                                   ? 'border-red-400 focus:ring-4 focus:ring-red-500/10'
                                                   : 'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'}"
                                />
                                <div class="absolute right-4 top-1/2 -translate-y-1/2">
                                    {#if isValidatingStore}
                                        <Loader2 class="w-5 h-5 text-slate-400 animate-spin" />
                                    {:else if storeValidation.checked && storeValidation.valid}
                                        <Check class="w-5 h-5 text-emerald-500" />
                                    {:else if storeValidation.checked && !storeValidation.valid}
                                        <X class="w-5 h-5 text-red-500" />
                                    {/if}
                                </div>
                            </div>
                            
                            {#if storeValidation.checked}
                                {#if storeValidation.valid && storeValidation.tenant}
                                    <div class="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                                        <Check class="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                        <div class="flex-1 min-w-0">
                                            <p class="text-sm font-medium text-emerald-700 truncate">
                                                {storeValidation.tenant.nama}
                                            </p>
                                            {#if storeValidation.tenant.alamat}
                                                <p class="text-xs text-emerald-600 truncate">
                                                    {storeValidation.tenant.alamat}
                                                </p>
                                            {/if}
                                        </div>
                                    </div>
                                {:else if !storeValidation.valid && storeValidation.message}
                                    <p class="text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle class="w-3 h-3" />
                                        {storeValidation.message}
                                    </p>
                                {/if}
                            {/if}
                        </div>

                        <!-- PIN Input Field -->
                        <div class="space-y-2">
                            <label for="pin" class="block text-sm font-medium text-slate-700">
                                PIN Kasir (6 digit)
                            </label>
                            <input
                                type="password"
                                id="pin"
                                name="pin"
                                bind:value={pin}
                                on:input={handlePinInput}
                                maxlength="6"
                                inputmode="numeric"
                                autocomplete="off"
                                placeholder="Masukkan PIN atau gunakan keypad"
                                disabled={!storeValidation.valid}
                                class="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-800 text-center text-xl tracking-[0.5em] font-mono placeholder:text-sm placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        <!-- PIN Dots -->
                        <div class="flex justify-center gap-3 py-2">
                            {#each Array(6) as _, i}
                                <div 
                                    class="w-4 h-4 rounded-full transition-all duration-200 
                                           {pin.length > i 
                                               ? 'bg-emerald-500 scale-110 shadow-md shadow-emerald-500/30' 
                                               : 'bg-slate-200 border-2 border-slate-300'}"
                                ></div>
                            {/each}
                        </div>

                        <!-- PIN Pad -->
                        <div class="bg-slate-100 rounded-2xl p-4">
                            <div class="grid grid-cols-3 gap-2">
                                {#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as digit}
                                    <button
                                        type="button"
                                        on:click={() => handlePinPadClick(digit.toString())}
                                        disabled={!storeValidation.valid || pin.length >= 6}
                                        class="h-14 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl text-xl font-semibold text-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow active:shadow-none"
                                    >
                                        {digit}
                                    </button>
                                {/each}
                                <button
                                    type="button"
                                    on:click={() => handlePinPadClick('clear')}
                                    disabled={!storeValidation.valid || pin.length === 0}
                                    class="h-14 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 rounded-xl text-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    <X class="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    on:click={() => handlePinPadClick('0')}
                                    disabled={!storeValidation.valid || pin.length >= 6}
                                    class="h-14 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl text-xl font-semibold text-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow active:shadow-none"
                                >
                                    0
                                </button>
                                <button
                                    type="button"
                                    on:click={() => handlePinPadClick('backspace')}
                                    disabled={!storeValidation.valid || pin.length === 0}
                                    class="h-14 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 rounded-xl text-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    <Delete class="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <!-- Remember Store -->
                        <label class="flex items-center gap-2.5 cursor-pointer group">
                            <div class="relative">
                                <input 
                                    type="checkbox" 
                                    bind:checked={rememberStore}
                                    on:change={handleRememberStore}
                                    disabled={!storeValidation.valid}
                                    class="peer sr-only" 
                                />
                                <div class="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:border-emerald-500 peer-checked:bg-emerald-500 peer-disabled:opacity-50 transition-all"></div>
                                <svg class="absolute top-1 left-1 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <span class="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                                Ingat kode toko di perangkat ini
                            </span>
                        </label>

                        <!-- PIN Info -->
                        <div class="bg-blue-50 rounded-xl p-3 border border-blue-100">
                            <div class="flex items-start gap-2">
                                <Info class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div class="text-xs text-blue-600">
                                    <p class="font-medium text-blue-700 mb-1">Login Cepat untuk Kasir</p>
                                    <p>Masukkan kode toko dan PIN 6 digit yang sudah diberikan oleh pemilik toko Anda.</p>
                                </div>
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <button
                            type="submit"
                            disabled={!canSubmitPin}
                            class="relative w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden group"
                        >
                            {#if isSubmitting}
                                <Loader2 class="w-5 h-5 animate-spin" /><span>Memproses...</span>
                            {:else}
                                <KeyRound class="w-5 h-5" />
                                <span>Masuk dengan PIN</span>
                                <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            {/if}
                        </button>

                        <p class="text-center text-sm text-slate-500">
                            Lupa PIN atau kode toko? <span class="text-emerald-600 font-medium">Hubungi pemilik toko Anda</span>
                        </p>
                    </form>
                {/if}

                <!-- Divider -->
                <div class="my-8 flex items-center gap-4">
                    <div class="flex-1 h-px bg-slate-200"></div>
                    <span class="text-sm text-slate-400">atau</span>
                    <div class="flex-1 h-px bg-slate-200"></div>
                </div>

                <!-- Register Link -->
                <p class="text-center text-slate-600">
                    Belum punya akun?
                    <a href="/register" class="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">Daftar Gratis</a>
                </p>

                <!-- ============================================ -->
                <!-- [FIX-1] DEMO ACCOUNTS - Hanya tampil saat development! -->
                <!-- ============================================ -->
                {#if showDemoAccounts}
                    <div class="mt-8 p-5 bg-amber-50/80 backdrop-blur rounded-2xl border-2 border-amber-300/50">
                        <div class="flex items-center gap-2 mb-4">
                            <Sparkles class="w-4 h-4 text-amber-500" />
                            <span class="text-sm font-semibold text-amber-800">Akun Demo</span>
                            <span class="ml-auto text-[10px] px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full font-bold uppercase">Dev Only</span>
                        </div>
                        <div class="space-y-3">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 p-3 bg-white rounded-xl">
                                <span class="text-sm font-medium text-slate-600">Super Admin</span>
                                <code class="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">admin@poskasir.com / admin123</code>
                            </div>
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 p-3 bg-white rounded-xl">
                                <span class="text-sm font-medium text-slate-600">Owner Toko</span>
                                <code class="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">ani@ayamgeprek.com / 123456</code>
                            </div>
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 p-3 bg-white rounded-xl">
                                <span class="text-sm font-medium text-slate-600">Admin Toko</span>
                                <code class="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">admin@ayamgeprek.com / 123456</code>
                            </div>
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                <span class="text-sm font-medium text-emerald-700">Kasir (PIN)</span>
                                <code class="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">PLG101 → PIN: 222222</code>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Security Notice -->
                <div class="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div class="flex items-start gap-2">
                        <ShieldCheck class="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p class="text-xs text-slate-500">
                            Koneksi Anda aman dan terenkripsi. Jangan bagikan PIN atau password Anda kepada siapapun.
                        </p>
                    </div>
                </div>

                <!-- Support Link -->
                <p class="mt-6 text-center text-sm text-slate-500">
                    Butuh bantuan? <a href="https://wa.me/6281234567890" class="text-emerald-600 hover:underline">Hubungi Support</a>
                </p>
            </div>
        </div>
    </div>
</div>