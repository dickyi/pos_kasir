<script>
    import { enhance } from '$app/forms';
    
    // Form state
    export let form;
    
    // Form data dengan default values
    let formData = {
        nama_bisnis: form?.data?.nama_bisnis || '',
        jenis_usaha: form?.data?.jenis_usaha || '',
        nama_pemilik: form?.data?.nama_pemilik || '',
        email: form?.data?.email || '',
        no_telepon: form?.data?.no_telepon || '',
        alamat: form?.data?.alamat || '',
        kota: form?.data?.kota || '',
        password: '',
        confirm_password: '',
        agree_terms: false
    };
    
    // State
    let isSubmitting = false;
    let showPassword = false;
    let showConfirmPassword = false;
    let currentStep = 1;
    const totalSteps = 2;

    // Jenis usaha options
    const jenisUsahaOptions = [
        'Toko Kelontong/Sembako',
        'Warung Makan/Restoran',
        'Minimarket',
        'Apotek/Toko Obat',
        'Toko Pakaian/Fashion',
        'Toko Elektronik',
        'Toko Bangunan',
        'Salon/Barbershop',
        'Bengkel',
        'Toko Buku/ATK',
        'Cafe/Kedai Kopi',
        'Lainnya'
    ];

    // Kota options (contoh)
    const kotaOptions = [
        'Jakarta',
        'Bandung',
        'Surabaya',
        'Medan',
        'Semarang',
        'Makassar',
        'Palembang',
        'Tangerang',
        'Depok',
        'Bekasi',
        'Bogor',
        'Yogyakarta',
        'Solo',
        'Malang',
        'Denpasar',
        'Lainnya'
    ];

    // Validasi step 1
    function validateStep1() {
        if (!formData.nama_bisnis || formData.nama_bisnis.length < 3) {
            alert('Nama bisnis minimal 3 karakter!');
            return false;
        }
        if (!formData.nama_pemilik) {
            alert('Nama pemilik wajib diisi!');
            return false;
        }
        return true;
    }

    // Next step
    function nextStep() {
        if (currentStep === 1 && validateStep1()) {
            currentStep = 2;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Previous step
    function prevStep() {
        if (currentStep > 1) {
            currentStep = currentStep - 1;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Handle form submission
    function handleSubmit() {
        isSubmitting = true;
        return async ({ result, update }) => {
            isSubmitting = false;
            await update();
            
            if (result.type === 'success' && result.data?.success) {
                // Reset form on success
                formData = {
                    nama_bisnis: '',
                    jenis_usaha: '',
                    nama_pemilik: '',
                    email: '',
                    no_telepon: '',
                    alamat: '',
                    kota: '',
                    password: '',
                    confirm_password: '',
                    agree_terms: false
                };
            }
        };
    }

    // Check password strength
    function getPasswordStrength(password) {
        if (!password) return { level: 0, text: '', color: '' };
        
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        if (strength <= 2) return { level: strength, text: 'Lemah', color: 'bg-red-500' };
        if (strength <= 3) return { level: strength, text: 'Sedang', color: 'bg-yellow-500' };
        return { level: strength, text: 'Kuat', color: 'bg-green-500' };
    }

    $: passwordStrength = getPasswordStrength(formData.password);
    $: passwordMatch = formData.password && formData.confirm_password && formData.password === formData.confirm_password;
</script>

<svelte:head>
    <title>Daftar - POSKasir</title>
</svelte:head>

<div class="min-h-[calc(100vh-200px)] bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 lg:py-16">
    <div class="max-w-xl mx-auto px-4 sm:px-6">
        
        <!-- ============================================ -->
        <!-- SUCCESS STATE -->
        <!-- ============================================ -->
        {#if form?.success}
            <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span class="text-4xl">✅</span>
                </div>
                <h1 class="text-2xl font-bold text-gray-900 mb-3">Pendaftaran Berhasil!</h1>
                <p class="text-gray-600 mb-6">
                    Terima kasih telah mendaftar di POSKasir. 
                    Tim kami akan menghubungi Anda dalam <strong>1x24 jam</strong> untuk proses verifikasi.
                </p>
                
                <div class="bg-gray-50 rounded-xl p-4 mb-6">
                    <p class="text-sm text-gray-500 mb-1">Kode Pendaftaran Anda:</p>
                    <p class="text-2xl font-mono font-bold text-blue-600">{form.kode}</p>
                </div>

                <div class="space-y-3 text-left bg-blue-50 rounded-xl p-4 mb-6">
                    <p class="font-medium text-blue-800">📋 Langkah Selanjutnya:</p>
                    <ol class="list-decimal list-inside text-sm text-blue-700 space-y-1">
                        <li>Cek email Anda untuk konfirmasi pendaftaran</li>
                        <li>Tim kami akan menghubungi via WhatsApp</li>
                        <li>Setelah verifikasi, Anda bisa login dan mulai menggunakan</li>
                    </ol>
                </div>

                <div class="flex flex-col sm:flex-row gap-3">
                    <a 
                        href="/"
                        class="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-center"
                    >
                        Kembali ke Beranda
                    </a>
                    <a 
                        href="/login"
                        class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-center"
                    >
                        Ke Halaman Login
                    </a>
                </div>
            </div>
        {:else}
            <!-- ============================================ -->
            <!-- REGISTRATION FORM -->
            <!-- ============================================ -->
            <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
                
                <!-- Header -->
                <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center text-white">
                    <h1 class="text-2xl font-bold mb-2">Daftar Gratis</h1>
                    <p class="text-blue-100">Mulai kelola bisnis Anda dengan lebih mudah</p>
                </div>

                <!-- Progress Steps -->
                <div class="px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <div class="flex items-center justify-center gap-4">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium {currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}">
                                1
                            </div>
                            <span class="text-sm font-medium {currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}">Data Bisnis</span>
                        </div>
                        <div class="w-12 h-0.5 {currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}"></div>
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium {currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}">
                                2
                            </div>
                            <span class="text-sm font-medium {currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}">Akun & Kontak</span>
                        </div>
                    </div>
                </div>

                <!-- Error Message -->
                {#if form?.message && !form?.success}
                    <div class="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <span class="text-red-500 text-lg">⚠️</span>
                        <p class="text-red-700 text-sm">{form.message}</p>
                    </div>
                {/if}

                <!-- Form -->
                <form 
                    method="POST" 
                    action="?/register"
                    use:enhance={handleSubmit}
                    class="p-6 space-y-5"
                >
                    <!-- ============================================ -->
                    <!-- STEP 1: Data Bisnis -->
                    <!-- ============================================ -->
                    {#if currentStep === 1}
                        <div class="space-y-5">
                            <!-- Nama Bisnis -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    Nama Bisnis / Toko <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nama_bisnis"
                                    bind:value={formData.nama_bisnis}
                                    required
                                    placeholder="Contoh: Toko Makmur Jaya"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <!-- Jenis Usaha -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    Jenis Usaha
                                </label>
                                <select
                                    name="jenis_usaha"
                                    bind:value={formData.jenis_usaha}
                                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="">Pilih jenis usaha</option>
                                    {#each jenisUsahaOptions as jenis}
                                        <option value={jenis}>{jenis}</option>
                                    {/each}
                                </select>
                            </div>

                            <!-- Nama Pemilik -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    Nama Pemilik <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nama_pemilik"
                                    bind:value={formData.nama_pemilik}
                                    required
                                    placeholder="Nama lengkap Anda"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <!-- Alamat -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    Alamat Bisnis
                                </label>
                                <textarea
                                    name="alamat"
                                    bind:value={formData.alamat}
                                    rows="2"
                                    placeholder="Alamat lengkap toko/bisnis Anda"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                ></textarea>
                            </div>

                            <!-- Kota -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    Kota
                                </label>
                                <select
                                    name="kota"
                                    bind:value={formData.kota}
                                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="">Pilih kota</option>
                                    {#each kotaOptions as kota}
                                        <option value={kota}>{kota}</option>
                                    {/each}
                                </select>
                            </div>

                            <!-- Next Button -->
                            <button
                                type="button"
                                on:click={nextStep}
                                class="w-full py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold flex items-center justify-center gap-2"
                            >
                                <span>Lanjut</span>
                                <span>→</span>
                            </button>
                        </div>
                    {/if}

                    <!-- ============================================ -->
                    <!-- STEP 2: Akun & Kontak -->
                    <!-- ============================================ -->
                    {#if currentStep === 2}
                        <div class="space-y-5">
                            <!-- Hidden fields from step 1 -->
                            <input type="hidden" name="nama_bisnis" value={formData.nama_bisnis} />
                            <input type="hidden" name="jenis_usaha" value={formData.jenis_usaha} />
                            <input type="hidden" name="nama_pemilik" value={formData.nama_pemilik} />
                            <input type="hidden" name="alamat" value={formData.alamat} />
                            <input type="hidden" name="kota" value={formData.kota} />

                            <!-- Email -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email <span class="text-red-500">*</span>
                                </label>
                                <div class="relative">
                                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📧</span>
                                    <input
                                        type="email"
                                        name="email"
                                        bind:value={formData.email}
                                        required
                                        placeholder="email@contoh.com"
                                        class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <p class="text-xs text-gray-500 mt-1">Digunakan untuk login dan notifikasi</p>
                            </div>

                            <!-- No Telepon -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    No. WhatsApp <span class="text-red-500">*</span>
                                </label>
                                <div class="relative">
                                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📱</span>
                                    <input
                                        type="tel"
                                        name="no_telepon"
                                        bind:value={formData.no_telepon}
                                        required
                                        placeholder="08xxxxxxxxxx"
                                        class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <p class="text-xs text-gray-500 mt-1">Untuk verifikasi dan support</p>
                            </div>

                            <!-- Password -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    Password <span class="text-red-500">*</span>
                                </label>
                                <div class="relative">
                                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        bind:value={formData.password}
                                        required
                                        minlength="6"
                                        placeholder="Minimal 6 karakter"
                                        class="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <button
                                        type="button"
                                        on:click={() => showPassword = !showPassword}
                                        class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                
                                <!-- Password Strength -->
                                {#if formData.password}
                                    <div class="mt-2">
                                        <div class="flex gap-1 mb-1">
                                            {#each Array(5) as _, i}
                                                <div class="h-1 flex-1 rounded-full {i < passwordStrength.level ? passwordStrength.color : 'bg-gray-200'}"></div>
                                            {/each}
                                        </div>
                                        <p class="text-xs {passwordStrength.color.replace('bg-', 'text-').replace('-500', '-600')}">
                                            Kekuatan password: {passwordStrength.text}
                                        </p>
                                    </div>
                                {/if}
                            </div>

                            <!-- Confirm Password -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    Konfirmasi Password <span class="text-red-500">*</span>
                                </label>
                                <div class="relative">
                                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirm_password"
                                        bind:value={formData.confirm_password}
                                        required
                                        placeholder="Ulangi password"
                                        class="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all {formData.confirm_password ? (passwordMatch ? 'border-green-500' : 'border-red-500') : ''}"
                                    />
                                    <button
                                        type="button"
                                        on:click={() => showConfirmPassword = !showConfirmPassword}
                                        class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                {#if formData.confirm_password}
                                    <p class="text-xs mt-1 {passwordMatch ? 'text-green-600' : 'text-red-600'}">
                                        {passwordMatch ? '✓ Password cocok' : '✗ Password tidak cocok'}
                                    </p>
                                {/if}
                            </div>

                            <!-- Terms & Conditions -->
                            <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                <input
                                    type="checkbox"
                                    name="agree_terms"
                                    id="agree_terms"
                                    bind:checked={formData.agree_terms}
                                    required
                                    class="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label for="agree_terms" class="text-sm text-gray-600">
                                    Saya menyetujui 
                                    <a href="#" class="text-blue-600 hover:underline">Syarat & Ketentuan</a> 
                                    dan 
                                    <a href="#" class="text-blue-600 hover:underline">Kebijakan Privasi</a> 
                                    POSKasir
                                </label>
                            </div>

                            <!-- Buttons -->
                            <div class="flex gap-3">
                                <button
                                    type="button"
                                    on:click={prevStep}
                                    class="flex-1 py-3.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium flex items-center justify-center gap-2"
                                >
                                    <span>←</span>
                                    <span>Kembali</span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !formData.agree_terms || !passwordMatch}
                                    class="flex-1 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {#if isSubmitting}
                                        <span class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        <span>Mendaftar...</span>
                                    {:else}
                                        <span>Daftar Sekarang</span>
                                    {/if}
                                </button>
                            </div>
                        </div>
                    {/if}
                </form>

                <!-- Footer -->
                <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
                    <p class="text-sm text-gray-600">
                        Sudah punya akun? 
                        <a href="/login" class="text-blue-600 hover:underline font-medium">Masuk di sini</a>
                    </p>
                </div>
            </div>

            <!-- Help Text -->
            <div class="mt-6 text-center">
                <p class="text-sm text-gray-500">
                    Butuh bantuan? Hubungi 
                    <a href="https://wa.me/6281234567890" class="text-blue-600 hover:underline">WhatsApp Support</a>
                </p>
            </div>
        {/if}
    </div>
</div>