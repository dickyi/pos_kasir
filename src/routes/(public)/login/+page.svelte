<script>
    import { enhance } from '$app/forms';
    
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
    <title>Login - POSKasir</title>
</svelte:head>

<div class="min-h-[calc(100vh-180px)] flex items-center justify-center py-12 px-4">
    <div class="w-full max-w-md">
        
        <!-- ============================================ -->
        <!-- LOGIN CARD -->
        <!-- ============================================ -->
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-center">
                <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span class="text-3xl">🔐</span>
                </div>
                <h1 class="text-2xl font-bold text-white mb-2">Selamat Datang!</h1>
                <p class="text-blue-100">Masuk ke akun POSKasir Anda</p>
            </div>

            <!-- Error Message -->
            {#if form?.message && !form?.success}
                <div class="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <span class="text-red-500 text-lg flex-shrink-0">⚠️</span>
                    <p class="text-red-700 text-sm">{form.message}</p>
                </div>
            {/if}

            <!-- Form -->
            <form 
                method="POST" 
                action="?/login"
                use:enhance={handleSubmit}
                class="p-6 sm:p-8 space-y-5"
            >
                <!-- Email -->
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">
                        Email
                    </label>
                    <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            📧
                        </span>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            bind:value={email}
                            required
                            autocomplete="email"
                            placeholder="Masukkan email Anda"
                            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800"
                        />
                    </div>
                </div>

                <!-- Password -->
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">
                        Password
                    </label>
                    <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            🔒
                        </span>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            bind:value={password}
                            required
                            autocomplete="current-password"
                            placeholder="Masukkan password"
                            class="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800"
                        />
                        <button
                            type="button"
                            on:click={() => showPassword = !showPassword}
                            class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                    </div>
                </div>

                <!-- Remember & Forgot -->
                <div class="flex items-center justify-between">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="remember"
                            bind:checked={remember}
                            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span class="text-sm text-gray-600">Ingat saya</span>
                    </label>
                    <a href="/forgot-password" class="text-sm text-blue-600 hover:underline">
                        Lupa password?
                    </a>
                </div>

                <!-- Submit Button -->
                <button
                    type="submit"
                    disabled={isSubmitting || !email || !password}
                    class="w-full py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {#if isSubmitting}
                        <span class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Memproses...</span>
                    {:else}
                        <span>Masuk</span>
                        <span>→</span>
                    {/if}
                </button>
            </form>

            <!-- Divider -->
            <div class="px-6 sm:px-8">
                <div class="relative">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-200"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-4 bg-white text-gray-500">atau</span>
                    </div>
                </div>
            </div>

            <!-- Register Link -->
            <div class="p-6 sm:p-8 pt-4 text-center">
                <p class="text-gray-600">
                    Belum punya akun?
                    <a href="/register" class="text-blue-600 hover:underline font-semibold">
                        Daftar Gratis
                    </a>
                </p>
            </div>
        </div>

        <!-- Demo Accounts Info -->
        <div class="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p class="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                <span>💡</span>
                <span>Akun Demo:</span>
            </p>
            <div class="space-y-2 text-sm text-blue-700">
                <div class="flex justify-between items-center bg-white/50 rounded-lg px-3 py-2">
                    <span class="font-medium">Super Admin:</span>
                    <code class="bg-blue-100 px-2 py-0.5 rounded text-xs">admin@poskasir.com / admin123</code>
                </div>
                <div class="flex justify-between items-center bg-white/50 rounded-lg px-3 py-2">
                    <span class="font-medium">Tenant:</span>
                    <code class="bg-blue-100 px-2 py-0.5 rounded text-xs">(email pelanggan) / 123456</code>
                </div>
            </div>
        </div>

        <!-- Help -->
        <p class="text-center text-sm text-gray-500 mt-4">
            Butuh bantuan? 
            <a href="https://wa.me/6281234567890" class="text-blue-600 hover:underline">
                Hubungi Support
            </a>
        </p>
    </div>
</div>