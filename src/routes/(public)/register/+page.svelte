<script>
    import { enhance } from '$app/forms';
    import { 
        Store, Building2, User, MapPin, Mail, Phone, Lock, Eye, EyeOff, 
        ArrowRight, ArrowLeft, Loader2, CheckCircle2, Circle, Sparkles,
        ChevronDown, Check, X, Shield
    } from 'lucide-svelte';
    
    // Form state
    export let form;
    
    // Form data
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

    // [FIX-3] Honeypot field value (harus tetap kosong)
    let honeypotValue = '';

    // Jenis usaha options
    const jenisUsahaOptions = [
        { value: 'toko_kelontong', label: 'Toko Kelontong/Sembako', icon: '🏪' },
        { value: 'warung_makan', label: 'Warung Makan/Restoran', icon: '🍽️' },
        { value: 'minimarket', label: 'Minimarket', icon: '🛒' },
        { value: 'apotek', label: 'Apotek/Toko Obat', icon: '💊' },
        { value: 'fashion', label: 'Toko Pakaian/Fashion', icon: '👕' },
        { value: 'elektronik', label: 'Toko Elektronik', icon: '📱' },
        { value: 'bangunan', label: 'Toko Bangunan', icon: '🔨' },
        { value: 'salon', label: 'Salon/Barbershop', icon: '💇' },
        { value: 'bengkel', label: 'Bengkel', icon: '🔧' },
        { value: 'cafe', label: 'Cafe/Kedai Kopi', icon: '☕' },
        { value: 'lainnya', label: 'Lainnya', icon: '📦' }
    ];

    // Kota options
    const kotaOptions = [
        'Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Semarang',
        'Makassar', 'Palembang', 'Tangerang', 'Depok', 'Bekasi',
        'Bogor', 'Yogyakarta', 'Solo', 'Malang', 'Denpasar', 'Lainnya'
    ];

    // Validasi step 1
    function validateStep1() {
        if (!formData.nama_bisnis || formData.nama_bisnis.length < 3) return false;
        if (!formData.nama_pemilik) return false;
        return true;
    }

    $: isStep1Valid = formData.nama_bisnis.length >= 3 && formData.nama_pemilik.length > 0;

    function nextStep() {
        if (currentStep === 1 && validateStep1()) {
            currentStep = 2;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep = currentStep - 1;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function handleSubmit() {
        isSubmitting = true;
        return async ({ result, update }) => {
            isSubmitting = false;
            await update();
            
            if (result.type === 'success' && result.data?.success) {
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

    // [FIX-6] Updated password strength check (minimum 8, harus ada uppercase+lowercase+number)
    function getPasswordStrength(password) {
        if (!password) return { level: 0, text: '', color: 'bg-slate-200' };
        
        let strength = 0;
        const checks = {
            minLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecial: /[^A-Za-z0-9]/.test(password),
            longEnough: password.length >= 12
        };

        if (checks.minLength) strength++;
        if (checks.hasUppercase) strength++;
        if (checks.hasLowercase) strength++;
        if (checks.hasNumber) strength++;
        if (checks.hasSpecial) strength++;
        if (checks.longEnough) strength++;

        // Minimum requirement: 8 chars + uppercase + lowercase + number
        const meetsMinimum = checks.minLength && checks.hasUppercase && checks.hasLowercase && checks.hasNumber;

        if (!checks.minLength) return { level: 1, text: 'Terlalu pendek (min. 8)', color: 'bg-red-500', textColor: 'text-red-600', meetsMinimum: false, checks };
        if (strength <= 3) return { level: strength, text: 'Lemah', color: 'bg-red-500', textColor: 'text-red-600', meetsMinimum, checks };
        if (strength <= 4) return { level: strength, text: 'Sedang', color: 'bg-amber-500', textColor: 'text-amber-600', meetsMinimum, checks };
        return { level: strength, text: 'Kuat', color: 'bg-emerald-500', textColor: 'text-emerald-600', meetsMinimum, checks };
    }

    $: passwordStrength = getPasswordStrength(formData.password);
    $: passwordMatch = formData.password && formData.confirm_password && formData.password === formData.confirm_password;
    $: passwordMismatch = formData.confirm_password && formData.password !== formData.confirm_password;
    // [FIX-6] Submit button juga cek apakah password memenuhi minimum requirement
    $: canSubmit = formData.agree_terms && passwordMatch && formData.email && formData.no_telepon && passwordStrength.meetsMinimum;
</script>

<svelte:head>
    <title>Daftar - POSKasir</title>
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
        <!-- Left Side - Branding -->
        <div class="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
            <div class="absolute inset-0">
                <div class="absolute top-20 left-20 w-32 h-32 border border-white/10 rounded-2xl rotate-12"></div>
                <div class="absolute bottom-32 right-20 w-24 h-24 border border-white/10 rounded-full"></div>
                <div class="absolute top-1/2 left-1/3 w-16 h-16 bg-emerald-500/20 rounded-lg blur-xl"></div>
                <div class="absolute bottom-1/3 right-1/3 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl"></div>
            </div>

            <div class="relative z-10">
                <a href="/" class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Store class="w-6 h-6 text-white" />
                    </div>
                    <span class="text-2xl font-bold text-white tracking-tight">POSKasir</span>
                </a>
            </div>

            <div class="relative z-10 max-w-lg">
                <h1 class="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                    Bergabung dengan 
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                        ribuan pebisnis
                    </span>
                </h1>
                <p class="text-slate-400 text-lg leading-relaxed">
                    Daftar gratis dan mulai kelola bisnis Anda dengan sistem kasir modern yang mudah digunakan.
                </p>

                <div class="mt-10 grid grid-cols-3 gap-6">
                    {#each [
                        { value: '10K+', label: 'Pengguna Aktif' },
                        { value: '50K+', label: 'Transaksi/Hari' },
                        { value: '99.9%', label: 'Uptime' }
                    ] as stat}
                        <div class="text-center">
                            <div class="text-2xl font-bold text-white">{stat.value}</div>
                            <div class="text-sm text-slate-500">{stat.label}</div>
                        </div>
                    {/each}
                </div>

                <div class="mt-10 p-6 bg-white/5 backdrop-blur rounded-2xl border border-white/10">
                    <p class="text-slate-300 italic mb-4">
                        "POSKasir membantu saya mengelola 3 cabang toko dengan mudah. Laporan real-time sangat membantu pengambilan keputusan bisnis."
                    </p>
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
                            B
                        </div>
                        <div>
                            <div class="text-white font-medium">Budi Santoso</div>
                            <div class="text-slate-500 text-sm">Pemilik Toko Makmur Jaya</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- [FIX] Tahun dinamis -->
            <div class="relative z-10 text-slate-500 text-sm">
                &copy; {new Date().getFullYear()} POSKasir. All rights reserved.
            </div>
        </div>

        <!-- Right Side - Register Form -->
        <div class="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12 overflow-y-auto">
            <div class="w-full max-w-md">
                <!-- Mobile Logo -->
                <div class="lg:hidden flex items-center justify-center gap-3 mb-8">
                    <div class="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Store class="w-5 h-5 text-white" />
                    </div>
                    <span class="text-xl font-bold text-slate-800 tracking-tight">POSKasir</span>
                </div>

                <!-- SUCCESS STATE -->
                {#if form?.success}
                    <div class="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 text-center">
                        <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 class="w-10 h-10 text-emerald-600" />
                        </div>
                        <h1 class="text-2xl font-bold text-slate-800 mb-3">Pendaftaran Berhasil!</h1>
                        <p class="text-slate-500 mb-6">
                            Terima kasih telah mendaftar di POSKasir. 
                            Tim kami akan menghubungi Anda dalam <strong class="text-slate-700">1x24 jam</strong> untuk proses verifikasi.
                        </p>
                        
                        <div class="bg-slate-50 rounded-xl p-5 mb-6">
                            <p class="text-sm text-slate-500 mb-2">Kode Pendaftaran Anda</p>
                            <p class="text-3xl font-mono font-bold text-emerald-600 tracking-wider">{form.kode}</p>
                        </div>

                        <div class="space-y-3 text-left bg-emerald-50 rounded-xl p-5 mb-6 border border-emerald-100">
                            <div class="flex items-center gap-2 text-emerald-800 font-medium">
                                <Sparkles class="w-4 h-4" />
                                <span>Langkah Selanjutnya</span>
                            </div>
                            <ol class="space-y-2 text-sm text-emerald-700">
                                {#each [
                                    'Cek email Anda untuk konfirmasi pendaftaran',
                                    'Tim kami akan menghubungi via WhatsApp',
                                    'Setelah verifikasi, Anda bisa login dan mulai menggunakan'
                                ] as step, i}
                                    <li class="flex items-start gap-2">
                                        <span class="w-5 h-5 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                                            {i + 1}
                                        </span>
                                        <span>{step}</span>
                                    </li>
                                {/each}
                            </ol>
                        </div>

                        <div class="flex flex-col sm:flex-row gap-3">
                            <a 
                                href="/"
                                class="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-center"
                            >
                                Ke Beranda
                            </a>
                            <a 
                                href="/login"
                                class="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-center flex items-center justify-center gap-2"
                            >
                                <span>Login Sekarang</span>
                                <ArrowRight class="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                {:else}
                    <!-- REGISTRATION FORM -->
                    <div class="mb-6">
                        <h2 class="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Daftar Gratis</h2>
                        <p class="text-slate-500">Mulai kelola bisnis Anda dengan lebih mudah</p>
                    </div>

                    <!-- Progress Steps -->
                    <div class="mb-8">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all {currentStep >= 1 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-200 text-slate-500'}">
                                    {#if currentStep > 1}
                                        <Check class="w-5 h-5" />
                                    {:else}
                                        1
                                    {/if}
                                </div>
                                <div class="hidden sm:block">
                                    <div class="text-sm font-medium {currentStep >= 1 ? 'text-slate-800' : 'text-slate-400'}">Data Bisnis</div>
                                    <div class="text-xs text-slate-400">Informasi usaha</div>
                                </div>
                            </div>

                            <div class="flex-1 mx-4 h-1 rounded-full bg-slate-200 overflow-hidden">
                                <div class="h-full bg-emerald-500 transition-all duration-500 {currentStep >= 2 ? 'w-full' : 'w-0'}"></div>
                            </div>

                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all {currentStep >= 2 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-200 text-slate-500'}">
                                    2
                                </div>
                                <div class="hidden sm:block">
                                    <div class="text-sm font-medium {currentStep >= 2 ? 'text-slate-800' : 'text-slate-400'}">Akun</div>
                                    <div class="text-xs text-slate-400">Email & password</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Error Message -->
                    {#if form?.message && !form?.success}
                        <div class="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                            <div class="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <X class="w-3 h-3 text-red-600" />
                            </div>
                            <p class="text-red-600 text-sm">{form.message}</p>
                        </div>
                    {/if}

                    <!-- Form -->
                    <form 
                        method="POST" 
                        action="?/register"
                        use:enhance={handleSubmit}
                        class="space-y-5"
                    >
                        <!-- ============================================ -->
                        <!-- [FIX-3] HONEYPOT FIELD - Tersembunyi dari user, jebakan bot -->
                        <!-- Bot akan mengisi field ini, user asli tidak akan melihatnya -->
                        <!-- ============================================ -->
                        <div class="absolute -left-[9999px] opacity-0 h-0 overflow-hidden" aria-hidden="true" tabindex="-1">
                            <label for="website">Website (jangan diisi)</label>
                            <input 
                                type="text" 
                                id="website" 
                                name="website" 
                                bind:value={honeypotValue}
                                autocomplete="off"
                                tabindex="-1"
                            />
                        </div>

                        <!-- STEP 1: Data Bisnis -->
                        {#if currentStep === 1}
                            <div class="space-y-5">
                                <div class="space-y-2">
                                    <label for="nama_bisnis" class="block text-sm font-medium text-slate-700">
                                        Nama Bisnis / Toko <span class="text-red-500">*</span>
                                    </label>
                                    <div class="relative group">
                                        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                            <Store class="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            id="nama_bisnis"
                                            name="nama_bisnis"
                                            bind:value={formData.nama_bisnis}
                                            required
                                            placeholder="Contoh: Toko Makmur Jaya"
                                            class="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                        />
                                    </div>
                                </div>

                                <div class="space-y-2">
                                    <label for="jenis_usaha" class="block text-sm font-medium text-slate-700">Jenis Usaha</label>
                                    <div class="relative group">
                                        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                            <Building2 class="w-5 h-5" />
                                        </div>
                                        <select
                                            id="jenis_usaha"
                                            name="jenis_usaha"
                                            bind:value={formData.jenis_usaha}
                                            class="w-full h-12 pl-12 pr-10 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Pilih jenis usaha</option>
                                            {#each jenisUsahaOptions as jenis}
                                                <option value={jenis.value}>{jenis.icon} {jenis.label}</option>
                                            {/each}
                                        </select>
                                        <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            <ChevronDown class="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                <div class="space-y-2">
                                    <label for="nama_pemilik" class="block text-sm font-medium text-slate-700">
                                        Nama Pemilik <span class="text-red-500">*</span>
                                    </label>
                                    <div class="relative group">
                                        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                            <User class="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            id="nama_pemilik"
                                            name="nama_pemilik"
                                            bind:value={formData.nama_pemilik}
                                            required
                                            placeholder="Nama lengkap Anda"
                                            class="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                        />
                                    </div>
                                </div>

                                <div class="space-y-2">
                                    <label for="alamat" class="block text-sm font-medium text-slate-700">Alamat Bisnis</label>
                                    <div class="relative group">
                                        <div class="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                            <MapPin class="w-5 h-5" />
                                        </div>
                                        <textarea
                                            id="alamat"
                                            name="alamat"
                                            bind:value={formData.alamat}
                                            rows="2"
                                            placeholder="Alamat lengkap toko/bisnis Anda"
                                            class="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
                                        ></textarea>
                                    </div>
                                </div>

                                <div class="space-y-2">
                                    <label for="kota" class="block text-sm font-medium text-slate-700">Kota</label>
                                    <div class="relative">
                                        <select
                                            id="kota"
                                            name="kota"
                                            bind:value={formData.kota}
                                            class="w-full h-12 px-4 pr-10 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Pilih kota</option>
                                            {#each kotaOptions as kota}
                                                <option value={kota}>{kota}</option>
                                            {/each}
                                        </select>
                                        <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            <ChevronDown class="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    on:click={nextStep}
                                    disabled={!isStep1Valid}
                                    class="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2 group"
                                >
                                    <span>Lanjut</span>
                                    <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        {/if}

                        <!-- STEP 2: Akun & Kontak -->
                        {#if currentStep === 2}
                            <div class="space-y-5">
                                <input type="hidden" name="nama_bisnis" value={formData.nama_bisnis} />
                                <input type="hidden" name="jenis_usaha" value={formData.jenis_usaha} />
                                <input type="hidden" name="nama_pemilik" value={formData.nama_pemilik} />
                                <input type="hidden" name="alamat" value={formData.alamat} />
                                <input type="hidden" name="kota" value={formData.kota} />

                                <div class="space-y-2">
                                    <label for="email" class="block text-sm font-medium text-slate-700">
                                        Email <span class="text-red-500">*</span>
                                    </label>
                                    <div class="relative group">
                                        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                            <Mail class="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            bind:value={formData.email}
                                            required
                                            placeholder="email@contoh.com"
                                            class="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                        />
                                    </div>
                                    <p class="text-xs text-slate-500">Digunakan untuk login dan notifikasi</p>
                                </div>

                                <div class="space-y-2">
                                    <label for="no_telepon" class="block text-sm font-medium text-slate-700">
                                        No. WhatsApp <span class="text-red-500">*</span>
                                    </label>
                                    <div class="relative group">
                                        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                            <Phone class="w-5 h-5" />
                                        </div>
                                        <input
                                            type="tel"
                                            id="no_telepon"
                                            name="no_telepon"
                                            bind:value={formData.no_telepon}
                                            required
                                            placeholder="08xxxxxxxxxx"
                                            class="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                        />
                                    </div>
                                    <p class="text-xs text-slate-500">Untuk verifikasi dan support</p>
                                </div>

                                <div class="space-y-2">
                                    <label for="password" class="block text-sm font-medium text-slate-700">
                                        Password <span class="text-red-500">*</span>
                                    </label>
                                    <div class="relative group">
                                        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                            <Lock class="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            name="password"
                                            bind:value={formData.password}
                                            required
                                            minlength="8"
                                            placeholder="Minimal 8 karakter"
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
                                    
                                    <!-- [FIX-6] Password Strength + Requirements Checklist -->
                                    {#if formData.password}
                                        <div class="space-y-2">
                                            <div class="flex gap-1">
                                                {#each Array(6) as _, i}
                                                    <div class="h-1.5 flex-1 rounded-full transition-all {i < passwordStrength.level ? passwordStrength.color : 'bg-slate-200'}"></div>
                                                {/each}
                                            </div>
                                            <p class="text-xs {passwordStrength.textColor}">
                                                Kekuatan password: {passwordStrength.text}
                                            </p>
                                            <!-- Password requirements checklist -->
                                            {#if passwordStrength.checks}
                                                <div class="grid grid-cols-2 gap-1 text-xs">
                                                    <span class="{passwordStrength.checks.minLength ? 'text-emerald-600' : 'text-slate-400'} flex items-center gap-1">
                                                        {#if passwordStrength.checks.minLength}<Check class="w-3 h-3" />{:else}<X class="w-3 h-3" />{/if}
                                                        Min. 8 karakter
                                                    </span>
                                                    <span class="{passwordStrength.checks.hasUppercase ? 'text-emerald-600' : 'text-slate-400'} flex items-center gap-1">
                                                        {#if passwordStrength.checks.hasUppercase}<Check class="w-3 h-3" />{:else}<X class="w-3 h-3" />{/if}
                                                        Huruf besar (A-Z)
                                                    </span>
                                                    <span class="{passwordStrength.checks.hasLowercase ? 'text-emerald-600' : 'text-slate-400'} flex items-center gap-1">
                                                        {#if passwordStrength.checks.hasLowercase}<Check class="w-3 h-3" />{:else}<X class="w-3 h-3" />{/if}
                                                        Huruf kecil (a-z)
                                                    </span>
                                                    <span class="{passwordStrength.checks.hasNumber ? 'text-emerald-600' : 'text-slate-400'} flex items-center gap-1">
                                                        {#if passwordStrength.checks.hasNumber}<Check class="w-3 h-3" />{:else}<X class="w-3 h-3" />{/if}
                                                        Angka (0-9)
                                                    </span>
                                                </div>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>

                                <div class="space-y-2">
                                    <label for="confirm_password" class="block text-sm font-medium text-slate-700">
                                        Konfirmasi Password <span class="text-red-500">*</span>
                                    </label>
                                    <div class="relative group">
                                        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                            <Lock class="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="confirm_password"
                                            name="confirm_password"
                                            bind:value={formData.confirm_password}
                                            required
                                            placeholder="Ulangi password"
                                            class="w-full h-12 pl-12 pr-12 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all {passwordMatch ? 'border-emerald-500 focus:ring-emerald-500/10' : passwordMismatch ? 'border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10'}"
                                        />
                                        <button
                                            type="button"
                                            on:click={() => showConfirmPassword = !showConfirmPassword}
                                            class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {#if showConfirmPassword}<EyeOff class="w-5 h-5" />{:else}<Eye class="w-5 h-5" />{/if}
                                        </button>
                                    </div>
                                    {#if formData.confirm_password}
                                        <p class="text-xs flex items-center gap-1 {passwordMatch ? 'text-emerald-600' : 'text-red-600'}">
                                            {#if passwordMatch}
                                                <Check class="w-3 h-3" /><span>Password cocok</span>
                                            {:else}
                                                <X class="w-3 h-3" /><span>Password tidak cocok</span>
                                            {/if}
                                        </p>
                                    {/if}
                                </div>

                                <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <label class="flex items-start gap-3 cursor-pointer group">
                                        <div class="relative mt-0.5">
                                            <input type="checkbox" name="agree_terms" id="agree_terms" bind:checked={formData.agree_terms} required class="peer sr-only" />
                                            <div class="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-all"></div>
                                            <svg class="absolute top-1 left-1 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none">
                                                <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </div>
                                        <span class="text-sm text-slate-600">
                                            Saya menyetujui 
                                            <a href="/terms" class="text-emerald-600 hover:underline font-medium">Syarat & Ketentuan</a> 
                                            dan 
                                            <a href="/privacy" class="text-emerald-600 hover:underline font-medium">Kebijakan Privasi</a> 
                                            POSKasir
                                        </span>
                                    </label>
                                </div>

                                <div class="flex gap-3">
                                    <button
                                        type="button"
                                        on:click={prevStep}
                                        class="flex-1 h-12 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium flex items-center justify-center gap-2 group"
                                    >
                                        <ArrowLeft class="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                        <span>Kembali</span>
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !canSubmit}
                                        class="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        {#if isSubmitting}
                                            <Loader2 class="w-5 h-5 animate-spin" /><span>Mendaftar...</span>
                                        {:else}
                                            <span>Daftar</span>
                                        {/if}
                                    </button>
                                </div>
                            </div>
                        {/if}
                    </form>

                    <div class="my-6 flex items-center gap-4">
                        <div class="flex-1 h-px bg-slate-200"></div>
                        <span class="text-sm text-slate-400">atau</span>
                        <div class="flex-1 h-px bg-slate-200"></div>
                    </div>

                    <p class="text-center text-slate-600">
                        Sudah punya akun?
                        <a href="/login" class="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">Masuk di sini</a>
                    </p>

                    <div class="mt-6 flex items-center justify-center gap-2 text-slate-400">
                        <Shield class="w-4 h-4" />
                        <span class="text-xs">Data Anda aman & terenkripsi</span>
                    </div>

                    <p class="mt-4 text-center text-sm text-slate-500">
                        Butuh bantuan? <a href="https://wa.me/6281234567890" class="text-emerald-600 hover:underline">Hubungi Support</a>
                    </p>
                {/if}
            </div>
        </div>
    </div>
</div>