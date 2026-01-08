<script>
    import { enhance } from '$app/forms';
    import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Sparkles, Store } from 'lucide-svelte';
    
    // Form state
    export let form;
    
    // State
    let isSubmitting = false;
    let showPassword = false;
    let email = form?.email || '';
    let password = '';
    let remember = false;

    // Handle form submission
    function handleSubmit() {
        isSubmitting = true;
        return async ({ result, update }) => {
            isSubmitting = false;
            await update();
        };
    }
</script>

<svelte:head>
    <title>Masuk - POSKasir</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans']">
    <!-- Background Pattern -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-emerald-100 rounded-full blur-3xl opacity-60"></div>
        <div class="absolute top-1/2 -left-20 w-60 h-60 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        <div class="absolute -bottom-20 right-1/3 w-72 h-72 bg-violet-100 rounded-full blur-3xl opacity-40"></div>
    </div>

    <div class="relative min-h-screen flex">
        <!-- Left Side - Branding (Hidden on mobile) -->
        <div class="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
            <!-- Decorative Elements -->
            <div class="absolute inset-0">
                <div class="absolute top-20 left-20 w-32 h-32 border border-white/10 rounded-2xl rotate-12"></div>
                <div class="absolute bottom-32 right-20 w-24 h-24 border border-white/10 rounded-full"></div>
                <div class="absolute top-1/2 left-1/3 w-16 h-16 bg-emerald-500/20 rounded-lg blur-xl"></div>
                <div class="absolute bottom-1/3 right-1/3 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl"></div>
            </div>

            <!-- Logo -->
            <div class="relative z-10">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Store class="w-6 h-6 text-white" />
                    </div>
                    <span class="text-2xl font-bold text-white tracking-tight">POSKasir</span>
                </div>
            </div>

            <!-- Center Content -->
            <div class="relative z-10 max-w-lg">
                <h1 class="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                    Kelola bisnis Anda dengan 
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                        lebih mudah
                    </span>
                </h1>
                <p class="text-slate-400 text-lg leading-relaxed">
                    Sistem kasir modern yang membantu Anda mengelola penjualan, inventori, dan laporan bisnis dalam satu platform terintegrasi.
                </p>

                <!-- Features -->
                <div class="mt-10 space-y-4">
                    {#each [
                        'Transaksi cepat & akurat',
                        'Laporan real-time',
                        'Multi-cabang support'
                    ] as feature}
                        <div class="flex items-center gap-3 text-slate-300">
                            <div class="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
                            </div>
                            <span>{feature}</span>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Footer -->
            <div class="relative z-10 text-slate-500 text-sm">
                © 2024 POSKasir. All rights reserved.
            </div>
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
                    <h2 class="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                        Selamat Datang
                    </h2>
                    <p class="text-slate-500">
                        Masuk untuk melanjutkan ke dashboard Anda
                    </p>
                </div>

                <!-- Error Message -->
                {#if form?.message && !form?.success}
                    <div class="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-shake">
                        <div class="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div class="w-2 h-2 rounded-full bg-red-500"></div>
                        </div>
                        <p class="text-red-600 text-sm">{form.message}</p>
                    </div>
                {/if}

                <!-- Form -->
                <form 
                    method="POST" 
                    action="?/login"
                    use:enhance={handleSubmit}
                    class="space-y-5"
                >
                    <!-- Email -->
                    <div class="space-y-2">
                        <label for="email" class="block text-sm font-medium text-slate-700">
                            Email
                        </label>
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

                    <!-- Password -->
                    <div class="space-y-2">
                        <label for="password" class="block text-sm font-medium text-slate-700">
                            Password
                        </label>
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
                                {#if showPassword}
                                    <EyeOff class="w-5 h-5" />
                                {:else}
                                    <Eye class="w-5 h-5" />
                                {/if}
                            </button>
                        </div>
                    </div>

                    <!-- Remember & Forgot -->
                    <div class="flex items-center justify-between">
                        <label class="flex items-center gap-2.5 cursor-pointer group">
                            <div class="relative">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    bind:checked={remember}
                                    class="peer sr-only"
                                />
                                <div class="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-all"></div>
                                <svg class="absolute top-1 left-1 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <span class="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Ingat saya</span>
                        </label>
                        <a href="/forgot-password" class="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                            Lupa password?
                        </a>
                    </div>

                    <!-- Submit Button -->
                    <button
                        type="submit"
                        disabled={isSubmitting || !email || !password}
                        class="relative w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden group"
                    >
                        {#if isSubmitting}
                            <Loader2 class="w-5 h-5 animate-spin" />
                            <span>Memproses...</span>
                        {:else}
                            <span>Masuk</span>
                            <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        {/if}
                    </button>
                </form>

                <!-- Divider -->
                <div class="my-8 flex items-center gap-4">
                    <div class="flex-1 h-px bg-slate-200"></div>
                    <span class="text-sm text-slate-400">atau</span>
                    <div class="flex-1 h-px bg-slate-200"></div>
                </div>

                <!-- Register Link -->
                <p class="text-center text-slate-600">
                    Belum punya akun?
                    <a href="/register" class="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                        Daftar Gratis
                    </a>
                </p>

                <!-- Demo Accounts -->
                <div class="mt-8 p-5 bg-slate-100/80 backdrop-blur rounded-2xl border border-slate-200/50">
                    <div class="flex items-center gap-2 mb-4">
                        <Sparkles class="w-4 h-4 text-amber-500" />
                        <span class="text-sm font-semibold text-slate-700">Akun Demo</span>
                    </div>
                    <div class="space-y-3">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 p-3 bg-white rounded-xl">
                            <span class="text-sm font-medium text-slate-600">Super Admin</span>
                            <code class="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">admin@poskasir.com / admin123</code>
                        </div>
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 p-3 bg-white rounded-xl">
                            <span class="text-sm font-medium text-slate-600">Tenant</span>
                            <code class="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">tenant@email.com / 123456</code>
                        </div>
                    </div>
                </div>

                <!-- Help Link -->
                <p class="mt-6 text-center text-sm text-slate-500">
                    Butuh bantuan? 
                    <a href="https://wa.me/6281234567890" class="text-emerald-600 hover:underline">
                        Hubungi Support
                    </a>
                </p>
            </div>
        </div>
    </div>
</div>

<style>
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .animate-shake {
        animation: shake 0.3s ease-in-out;
    }
</style>