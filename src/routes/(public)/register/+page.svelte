<script>
    import { enhance } from '$app/forms';
    import { 
        Store, Building2, User, MapPin, Mail, Phone, Lock, Eye, EyeOff, 
        ArrowRight, ArrowLeft, Loader2, CheckCircle2,
        ChevronDown, Check, X, Shield, Fingerprint, Zap, Globe, MapPinned
    } from 'lucide-svelte';
    import { fly, scale, fade } from 'svelte/transition';
    import { quintOut, elasticOut } from 'svelte/easing';
    
    // [FIX] Import data wilayah lokal dengan path yang benar
    import { provinsiList, getKotaByProvinsiId, getProvinsiNameById } from './wilayah-indonesia.js';
    
    // Import komponen Terms & Privacy untuk modal
    import TermsContent from '$lib/components/public/TermsContent.svelte';
    import PrivacyContent from '$lib/components/public/PrivacyContent.svelte';
    
    // Form state
    export let form;
    
    // Form data
    let formData = {
        nama_pemilik: form?.data?.nama_pemilik || '',
        nama_bisnis: form?.data?.nama_bisnis || '',
        jenis_usaha: form?.data?.jenis_usaha || '',
        alamat: form?.data?.alamat || '',
        provinsiId: '', // [FIX] Simpan ID untuk dropdown
        kota: form?.data?.kota || '',
        email: form?.data?.email || '',
        no_telepon: form?.data?.no_telepon || '',
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

    // Modal state
    let showTermsModal = false;
    let showPrivacyModal = false;

    // Honeypot field value (harus tetap kosong)
    let honeypotValue = '';

    // Focus states untuk animasi
    let focusedField = null;

    // Wilayah Indonesia - data lokal, tidak perlu loading
    let kotaList = [];

    // Jenis usaha options - tanpa icon, lebih clean
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
        'Cafe/Kedai Kopi',
        'Lainnya'
    ];

    // State untuk input manual "Lainnya"
    let jenisUsahaLainnya = '';
    let kotaLainnya = '';
    
    // Reactive: cek apakah pilih "Lainnya"
    $: isJenisUsahaLainnya = formData.jenis_usaha === 'Lainnya';
    $: isKotaLainnya = formData.kota === 'Lainnya';
    
    // Nilai final yang akan dikirim ke server
    $: finalJenisUsaha = isJenisUsahaLainnya ? jenisUsahaLainnya : formData.jenis_usaha;
    $: finalKota = isKotaLainnya ? kotaLainnya : formData.kota;
    
    // [FIX] Nama provinsi untuk dikirim ke server (bukan ID)
    $: provinsiName = getProvinsiNameById(formData.provinsiId);

    // Load kota when provinsi changes (dari data lokal - instant)
    $: if (formData.provinsiId) {
        kotaList = getKotaByProvinsiId(formData.provinsiId);
        formData.kota = '';
        kotaLainnya = '';
    } else {
        kotaList = [];
    }

    // Reset kotaLainnya when not selecting "Lainnya"
    $: if (!isKotaLainnya) kotaLainnya = '';
    $: if (!isJenisUsahaLainnya) jenisUsahaLainnya = '';

    // Validasi step 1 - Siapa & Apa (Urutan baru: Nama Pemilik dulu)
    $: isStep1Valid = formData.nama_pemilik.length > 0 && formData.nama_bisnis.length >= 3;

    // Modal functions
    function openTermsModal(e) {
        e.preventDefault();
        showTermsModal = true;
        document.body.style.overflow = 'hidden';
    }
    
    function openPrivacyModal(e) {
        e.preventDefault();
        showPrivacyModal = true;
        document.body.style.overflow = 'hidden';
    }
    
    function closeModals() {
        showTermsModal = false;
        showPrivacyModal = false;
        document.body.style.overflow = '';
    }
    
    // Close modal on escape key
    function handleKeydown(e) {
        if (e.key === 'Escape') {
            closeModals();
        }
    }

    function nextStep() {
        if (currentStep === 1 && isStep1Valid) {
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
                    nama_pemilik: '',
                    nama_bisnis: '',
                    jenis_usaha: '',
                    alamat: '',
                    provinsiId: '',
                    kota: '',
                    email: '',
                    no_telepon: '',
                    password: '',
                    confirm_password: '',
                    agree_terms: false
                };
            }
        };
    }

    // Password strength check
    function getPasswordStrength(password) {
        if (!password) return { level: 0, text: '', color: 'bg-slate-200', meetsMinimum: false, checks: null };
        
        const checks = {
            minLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecial: /[^A-Za-z0-9]/.test(password),
            longEnough: password.length >= 12
        };

        let strength = 0;
        if (checks.minLength) strength++;
        if (checks.hasUppercase) strength++;
        if (checks.hasLowercase) strength++;
        if (checks.hasNumber) strength++;
        if (checks.hasSpecial) strength++;
        if (checks.longEnough) strength++;

        const meetsMinimum = checks.minLength && checks.hasUppercase && checks.hasLowercase && checks.hasNumber;

        if (!checks.minLength) return { level: 1, text: 'Terlalu pendek', color: 'bg-red-500', textColor: 'text-red-500', meetsMinimum: false, checks };
        if (strength <= 3) return { level: strength, text: 'Lemah', color: 'bg-red-500', textColor: 'text-red-500', meetsMinimum, checks };
        if (strength <= 4) return { level: strength, text: 'Sedang', color: 'bg-amber-500', textColor: 'text-amber-500', meetsMinimum, checks };
        return { level: strength, text: 'Kuat', color: 'bg-emerald-500', textColor: 'text-emerald-500', meetsMinimum, checks };
    }

    $: passwordStrength = getPasswordStrength(formData.password);
    $: passwordMatch = formData.password && formData.confirm_password && formData.password === formData.confirm_password;
    $: passwordMismatch = formData.confirm_password && formData.password !== formData.confirm_password;
    $: canSubmit = formData.agree_terms && passwordMatch && formData.email && formData.no_telepon && passwordStrength.meetsMinimum;

    // Email validation
    $: isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    $: isPhoneValid = /^[0-9]{10,15}$/.test(formData.no_telepon.replace(/[-\s]/g, ''));
</script>

<svelte:window on:keydown={handleKeydown} />

<svelte:head>
    <title>Daftar - POSKasir</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</svelte:head>

<!-- Terms Modal -->
{#if showTermsModal}
    <div 
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        transition:fade={{ duration: 200 }}
    >
        <!-- Backdrop -->
        <button 
            type="button"
            class="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
            on:click={closeModals}
            aria-label="Tutup modal"
        ></button>
        
        <!-- Modal Content -->
        <div 
            class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            transition:scale={{ start: 0.95, duration: 200 }}
        >
            <!-- Modal Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 class="text-lg font-semibold text-slate-800">Syarat & Ketentuan</h2>
                <button 
                    type="button"
                    on:click={closeModals}
                    class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-700"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>
            
            <!-- Modal Body - Scrollable -->
            <div class="flex-1 overflow-y-auto p-6">
                <TermsContent appName="POSKasir" lastUpdated="1 Februari 2026" />
            </div>
            
            <!-- Modal Footer -->
            <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                <a 
                    href="/syarat-ketentuan" 
                    target="_blank"
                    class="text-sm text-slate-500 hover:text-emerald-600 transition-colors"
                >
                    Buka di tab baru ↗
                </a>
                <button 
                    type="button"
                    on:click={closeModals}
                    class="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
                >
                    Saya Mengerti
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Privacy Modal -->
{#if showPrivacyModal}
    <div 
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        transition:fade={{ duration: 200 }}
    >
        <!-- Backdrop -->
        <button 
            type="button"
            class="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
            on:click={closeModals}
            aria-label="Tutup modal"
        ></button>
        
        <!-- Modal Content -->
        <div 
            class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            transition:scale={{ start: 0.95, duration: 200 }}
        >
            <!-- Modal Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 class="text-lg font-semibold text-slate-800">Kebijakan Privasi</h2>
                <button 
                    type="button"
                    on:click={closeModals}
                    class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-700"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>
            
            <!-- Modal Body - Scrollable -->
            <div class="flex-1 overflow-y-auto p-6">
                <PrivacyContent appName="POSKasir" lastUpdated="1 Februari 2026" />
            </div>
            
            <!-- Modal Footer -->
            <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                <a 
                    href="/kebijakan-privasi" 
                    target="_blank"
                    class="text-sm text-slate-500 hover:text-emerald-600 transition-colors"
                >
                    Buka di tab baru ↗
                </a>
                <button 
                    type="button"
                    on:click={closeModals}
                    class="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
                >
                    Saya Mengerti
                </button>
            </div>
        </div>
    </div>
{/if}

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 font-['Outfit']">
    <!-- Subtle Background Pattern -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-100/40 via-teal-50/20 to-transparent rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-slate-100/60 via-blue-50/20 to-transparent rounded-full blur-3xl"></div>
        <!-- Grid Pattern -->
        <div class="absolute inset-0 opacity-[0.015]" style="background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;);"></div>
    </div>

    <div class="relative min-h-screen flex flex-col lg:flex-row">
        <!-- Left Side - Branding (Desktop) -->
        <div class="hidden lg:flex lg:w-[48%] xl:w-[52%] bg-slate-900 p-8 xl:p-12 flex-col justify-between relative overflow-hidden">
            <!-- Animated Background Elements -->
            <div class="absolute inset-0 overflow-hidden">
                <div class="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div class="absolute bottom-20 -left-20 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
                <!-- Geometric Elements -->
                <div class="absolute top-32 right-20 w-20 h-20 border border-white/5 rounded-2xl rotate-12 animate-float"></div>
                <div class="absolute bottom-40 left-32 w-16 h-16 border border-emerald-500/20 rounded-xl -rotate-12 animate-float" style="animation-delay: 0.5s;"></div>
                <div class="absolute top-1/2 right-1/4 w-3 h-3 bg-emerald-400/40 rounded-full animate-ping"></div>
            </div>

            <!-- Logo -->
            <div class="relative z-10">
                <a href="/" class="inline-flex items-center gap-3 group">
                    <div class="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow duration-300">
                        <Store class="w-6 h-6 text-white" />
                    </div>
                    <span class="text-2xl font-bold text-white tracking-tight">POSKasir</span>
                </a>
            </div>

            <!-- Main Content -->
            <div class="relative z-10 max-w-lg">
                <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
                    <Zap class="w-4 h-4 text-emerald-400" />
                    <span class="text-sm text-emerald-300 font-medium">Gratis 14 Hari Trial</span>
                </div>
                
                <h1 class="text-4xl xl:text-5xl font-bold text-white leading-[1.15] mb-6">
                    Kelola Bisnis Lebih 
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                        Cerdas
                    </span>
                </h1>
                <p class="text-slate-400 text-lg leading-relaxed">
                    Sistem kasir modern dengan fitur lengkap untuk UMKM Indonesia. Daftar sekarang dan rasakan kemudahannya.
                </p>

                <!-- Stats -->
                <div class="mt-10 flex gap-8">
                    {#each [
                        { value: '10K+', label: 'Pengguna' },
                        { value: '1M+', label: 'Transaksi' },
                        { value: '4.9★', label: 'Rating' }
                    ] as stat, i}
                        <div class="text-left" in:fly={{ y: 20, delay: 200 + i * 100, duration: 500 }}>
                            <div class="text-2xl xl:text-3xl font-bold text-white">{stat.value}</div>
                            <div class="text-sm text-slate-500 mt-1">{stat.label}</div>
                        </div>
                    {/each}
                </div>

                <!-- Testimonial Card -->
                <div class="mt-10 p-5 bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/[0.06] hover:border-white/10 transition-colors duration-300">
                    <div class="flex gap-1 mb-3">
                        {#each Array(5) as _}
                            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        {/each}
                    </div>
                    <p class="text-slate-300 text-sm leading-relaxed mb-4">
                        "POSKasir sangat membantu bisnis saya. Laporan penjualan real-time dan manajemen stok yang mudah membuat operasional toko jauh lebih efisien."
                    </p>
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                            BS
                        </div>
                        <div>
                            <div class="text-white font-medium text-sm">Budi Santoso</div>
                            <div class="text-slate-500 text-xs">Toko Makmur Jaya, Jakarta</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="relative z-10 flex items-center justify-between text-slate-500 text-sm">
                <span>&copy; {new Date().getFullYear()} POSKasir</span>
                <div class="flex items-center gap-4">
                    <a href="/kebijakan-privasi" class="hover:text-slate-300 transition-colors">Privasi</a>
                    <a href="/syarat-ketentuan" class="hover:text-slate-300 transition-colors">Syarat</a>
                </div>
            </div>
        </div>

        <!-- Right Side - Register Form -->
        <div class="flex-1 flex flex-col min-h-screen lg:min-h-0">
            <!-- Mobile Header -->
            <div class="lg:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 py-3">
                <div class="flex items-center justify-between">
                    <a href="/" class="flex items-center gap-2.5">
                        <div class="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Store class="w-4.5 h-4.5 text-white" />
                        </div>
                        <span class="text-lg font-bold text-slate-800">POSKasir</span>
                    </a>
                    <a href="/login" class="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                        Login
                    </a>
                </div>
            </div>

            <!-- Form Container -->
            <div class="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12">
                <div class="w-full max-w-[420px]">
                    
                    <!-- SUCCESS STATE -->
                    {#if form?.success}
                        <div 
                            class="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8"
                            in:scale={{ start: 0.95, duration: 400, easing: elasticOut }}
                        >
                            <div class="text-center">
                                <div class="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/25">
                                    <CheckCircle2 class="w-8 h-8 text-white" />
                                </div>
                                <h1 class="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Pendaftaran Berhasil!</h1>
                                <p class="text-slate-500 text-sm sm:text-base">
                                    Tim kami akan menghubungi Anda dalam <strong class="text-slate-700">1x24 jam</strong>
                                </p>
                            </div>
                            
                            <div class="my-6 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                                <p class="text-xs text-emerald-600 text-center mb-1 font-medium">Kode Pendaftaran</p>
                                <p class="text-2xl sm:text-3xl font-mono font-bold text-emerald-600 tracking-wider text-center">{form.kode}</p>
                            </div>

                            <div class="space-y-2.5 mb-6">
                                {#each [
                                    'Cek email untuk konfirmasi',
                                    'Tim kami akan menghubungi via WhatsApp',
                                    'Setelah verifikasi, Anda bisa login'
                                ] as step, i}
                                    <div 
                                        class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                                        in:fly={{ x: -20, delay: 100 + i * 100, duration: 400 }}
                                    >
                                        <div class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {i + 1}
                                        </div>
                                        <span class="text-sm text-slate-600">{step}</span>
                                    </div>
                                {/each}
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <a 
                                    href="/"
                                    class="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium text-center text-sm"
                                >
                                    Beranda
                                </a>
                                <a 
                                    href="/login"
                                    class="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all font-medium text-center text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25"
                                >
                                    <span>Login</span>
                                    <ArrowRight class="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    {:else}
                        <!-- REGISTRATION FORM -->
                        <div class="mb-6">
                            <h2 class="text-2xl sm:text-3xl font-bold text-slate-800 mb-1.5">Buat Akun Baru</h2>
                            <p class="text-slate-500 text-sm sm:text-base">Mulai kelola bisnis dengan lebih mudah</p>
                        </div>

                        <!-- Progress Steps - Simplified -->
                        <div class="mb-6">
                            <div class="flex items-center gap-3">
                                <button 
                                    type="button"
                                    on:click={() => currentStep = 1}
                                    class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all {currentStep === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}"
                                >
                                    {#if currentStep > 1}
                                        <Check class="w-4 h-4" />
                                    {:else}
                                        <span class="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">1</span>
                                    {/if}
                                    <span class="hidden sm:inline">Profil & Lokasi</span>
                                    <span class="sm:hidden">Profil</span>
                                </button>
                                
                                <div class="flex-1 h-0.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div class="h-full bg-emerald-500 transition-all duration-500 ease-out {currentStep >= 2 ? 'w-full' : 'w-0'}"></div>
                                </div>
                                
                                <button 
                                    type="button"
                                    disabled={!isStep1Valid}
                                    on:click={() => isStep1Valid && (currentStep = 2)}
                                    class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all {currentStep === 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'} {!isStep1Valid ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'}"
                                >
                                    <span class="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">2</span>
                                    <span class="hidden sm:inline">Akun & Keamanan</span>
                                    <span class="sm:hidden">Akun</span>
                                </button>
                            </div>
                        </div>

                        <!-- Error Message -->
                        {#if form?.message && !form?.success}
                            <div 
                                class="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5"
                                in:fly={{ y: -10, duration: 300 }}
                            >
                                <div class="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
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
                            class="space-y-4"
                        >
                            <!-- Honeypot -->
                            <div class="absolute -left-[9999px] opacity-0 h-0 overflow-hidden" aria-hidden="true" tabindex="-1">
                                <input type="text" name="website" bind:value={honeypotValue} autocomplete="off" tabindex="-1" />
                            </div>

                            <!-- STEP 1: Profil & Lokasi (Siapa → Apa → Di mana) -->
                            {#if currentStep === 1}
                                <div class="space-y-4" in:fly={{ x: -20, duration: 300 }}>
                                    
                                    <!-- === SIAPA === -->
                                    <!-- Nama Pemilik (PERTAMA - Identitas Personal) -->
                                    <div class="space-y-1.5">
                                        <label for="nama_pemilik" class="block text-sm font-medium text-slate-700">
                                            Nama Pemilik <span class="text-red-500">*</span>
                                        </label>
                                        <div class="relative">
                                            <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors {focusedField === 'nama_pemilik' ? 'text-emerald-500' : ''}">
                                                <User class="w-[18px] h-[18px]" />
                                            </div>
                                            <input
                                                type="text"
                                                id="nama_pemilik"
                                                name="nama_pemilik"
                                                bind:value={formData.nama_pemilik}
                                                on:focus={() => focusedField = 'nama_pemilik'}
                                                on:blur={() => focusedField = null}
                                                required
                                                placeholder="Nama lengkap Anda"
                                                class="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                                            />
                                        </div>
                                    </div>

                                    <!-- === APA === -->
                                    <!-- Nama Bisnis -->
                                    <div class="space-y-1.5">
                                        <label for="nama_bisnis" class="block text-sm font-medium text-slate-700">
                                            Nama Bisnis <span class="text-red-500">*</span>
                                        </label>
                                        <div class="relative">
                                            <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors {focusedField === 'nama_bisnis' ? 'text-emerald-500' : ''}">
                                                <Store class="w-[18px] h-[18px]" />
                                            </div>
                                            <input
                                                type="text"
                                                id="nama_bisnis"
                                                name="nama_bisnis"
                                                bind:value={formData.nama_bisnis}
                                                on:focus={() => focusedField = 'nama_bisnis'}
                                                on:blur={() => focusedField = null}
                                                required
                                                placeholder="Nama toko atau bisnis Anda"
                                                class="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                                            />
                                        </div>
                                        {#if formData.nama_bisnis && formData.nama_bisnis.length < 3}
                                            <p class="text-xs text-amber-600 flex items-center gap-1">
                                                <span>Minimal 3 karakter</span>
                                            </p>
                                        {/if}
                                    </div>

                                    <!-- Jenis Usaha -->
                                    <div class="space-y-1.5">
                                        <label for="jenis_usaha" class="block text-sm font-medium text-slate-700">
                                            Jenis Usaha
                                        </label>
                                        <div class="relative">
                                            <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                                <Building2 class="w-[18px] h-[18px]" />
                                            </div>
                                            <select
                                                id="jenis_usaha"
                                                bind:value={formData.jenis_usaha}
                                                class="w-full h-11 pl-11 pr-10 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer text-sm"
                                            >
                                                <option value="">Pilih jenis usaha</option>
                                                {#each jenisUsahaOptions as jenis}
                                                    <option value={jenis}>{jenis}</option>
                                                {/each}
                                            </select>
                                            <ChevronDown class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                        
                                        <!-- Input manual jika pilih Lainnya -->
                                        {#if isJenisUsahaLainnya}
                                            <div class="relative mt-2" in:fly={{ y: -10, duration: 200 }}>
                                                <input
                                                    type="text"
                                                    bind:value={jenisUsahaLainnya}
                                                    placeholder="Tulis jenis usaha Anda..."
                                                    class="w-full h-10 px-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                                                />
                                            </div>
                                        {/if}
                                    </div>

                                    <!-- === DI MANA === -->
                                    <!-- Alamat -->
                                    <div class="space-y-1.5">
                                        <label for="alamat" class="block text-sm font-medium text-slate-700">
                                            Alamat <span class="text-slate-400 font-normal">(opsional)</span>
                                        </label>
                                        <div class="relative">
                                            <div class="absolute left-3.5 top-3 text-slate-400">
                                                <MapPin class="w-[18px] h-[18px]" />
                                            </div>
                                            <textarea
                                                id="alamat"
                                                name="alamat"
                                                bind:value={formData.alamat}
                                                rows="2"
                                                placeholder="Alamat lengkap bisnis Anda"
                                                class="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none text-sm"
                                            ></textarea>
                                        </div>
                                    </div>

                                    <!-- Provinsi (Data Lokal - Instant) -->
                                    <div class="space-y-1.5">
                                        <label for="provinsi" class="block text-sm font-medium text-slate-700">
                                            Provinsi <span class="text-slate-400 font-normal">(opsional)</span>
                                        </label>
                                        <div class="relative">
                                            <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                                <Globe class="w-[18px] h-[18px]" />
                                            </div>
                                            <select
                                                id="provinsi"
                                                bind:value={formData.provinsiId}
                                                class="w-full h-11 pl-11 pr-10 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer text-sm"
                                            >
                                                <option value="">Pilih provinsi</option>
                                                {#each provinsiList as prov}
                                                    <option value={prov.id}>{prov.name}</option>
                                                {/each}
                                            </select>
                                            <ChevronDown class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <!-- Kota/Kabupaten (Cascading dari Provinsi - Instant) -->
                                    <div class="space-y-1.5">
                                        <label for="kota" class="block text-sm font-medium text-slate-700">
                                            Kota/Kabupaten <span class="text-slate-400 font-normal">(opsional)</span>
                                        </label>
                                        <div class="relative">
                                            <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                                <MapPinned class="w-[18px] h-[18px]" />
                                            </div>
                                            <select
                                                id="kota"
                                                bind:value={formData.kota}
                                                disabled={!formData.provinsiId}
                                                class="w-full h-11 pl-11 pr-10 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">
                                                    {!formData.provinsiId ? 'Pilih provinsi terlebih dahulu' : 'Pilih kota/kabupaten'}
                                                </option>
                                                {#each kotaList as kota}
                                                    <option value={kota.name}>{kota.name}</option>
                                                {/each}
                                                {#if kotaList.length > 0}
                                                    <option value="Lainnya">Lainnya</option>
                                                {/if}
                                            </select>
                                            <ChevronDown class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                        
                                        <!-- Input manual jika pilih Lainnya -->
                                        {#if isKotaLainnya}
                                            <div class="relative mt-2" in:fly={{ y: -10, duration: 200 }}>
                                                <input
                                                    type="text"
                                                    bind:value={kotaLainnya}
                                                    placeholder="Tulis nama kota Anda..."
                                                    class="w-full h-10 px-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                                                />
                                            </div>
                                        {/if}
                                    </div>

                                    <!-- Next Button -->
                                    <button
                                        type="button"
                                        on:click={nextStep}
                                        disabled={!isStep1Valid}
                                        class="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2 group text-sm"
                                    >
                                        <span>Lanjutkan</span>
                                        <ArrowRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>
                            {/if}

                            <!-- STEP 2: Akun & Keamanan -->
                            {#if currentStep === 2}
                                <div class="space-y-4" in:fly={{ x: 20, duration: 300 }}>
                                    <!-- [FIX] Hidden fields from step 1 - provinsi mengirim NAMA bukan ID -->
                                    <input type="hidden" name="nama_pemilik" value={formData.nama_pemilik} />
                                    <input type="hidden" name="nama_bisnis" value={formData.nama_bisnis} />
                                    <input type="hidden" name="jenis_usaha" value={finalJenisUsaha} />
                                    <input type="hidden" name="alamat" value={formData.alamat} />
                                    <input type="hidden" name="provinsi" value={provinsiName} />
                                    <input type="hidden" name="kota" value={finalKota} />

                                    <!-- Email -->
                                    <div class="space-y-1.5">
                                        <label for="email" class="block text-sm font-medium text-slate-700">
                                            Email <span class="text-red-500">*</span>
                                        </label>
                                        <div class="relative">
                                            <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors {focusedField === 'email' ? 'text-emerald-500' : ''}">
                                                <Mail class="w-[18px] h-[18px]" />
                                            </div>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                bind:value={formData.email}
                                                on:focus={() => focusedField = 'email'}
                                                on:blur={() => focusedField = null}
                                                required
                                                placeholder="email@contoh.com"
                                                class="w-full h-11 pl-11 pr-10 bg-white border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all text-sm {formData.email ? (isEmailValid ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20' : 'border-red-300 focus:border-red-500 focus:ring-red-500/20') : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'}"
                                            />
                                            {#if formData.email}
                                                <div class="absolute right-3.5 top-1/2 -translate-y-1/2">
                                                    {#if isEmailValid}
                                                        <Check class="w-4 h-4 text-emerald-500" />
                                                    {:else}
                                                        <X class="w-4 h-4 text-red-500" />
                                                    {/if}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>

                                    <!-- Phone -->
                                    <div class="space-y-1.5">
                                        <label for="no_telepon" class="block text-sm font-medium text-slate-700">
                                            No. WhatsApp <span class="text-red-500">*</span>
                                        </label>
                                        <div class="relative">
                                            <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors {focusedField === 'no_telepon' ? 'text-emerald-500' : ''}">
                                                <Phone class="w-[18px] h-[18px]" />
                                            </div>
                                            <input
                                                type="tel"
                                                id="no_telepon"
                                                name="no_telepon"
                                                bind:value={formData.no_telepon}
                                                on:focus={() => focusedField = 'no_telepon'}
                                                on:blur={() => focusedField = null}
                                                required
                                                placeholder="08xxxxxxxxxx"
                                                class="w-full h-11 pl-11 pr-10 bg-white border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all text-sm {formData.no_telepon ? (isPhoneValid ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20' : 'border-red-300 focus:border-red-500 focus:ring-red-500/20') : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'}"
                                            />
                                            {#if formData.no_telepon}
                                                <div class="absolute right-3.5 top-1/2 -translate-y-1/2">
                                                    {#if isPhoneValid}
                                                        <Check class="w-4 h-4 text-emerald-500" />
                                                    {:else}
                                                        <X class="w-4 h-4 text-red-500" />
                                                    {/if}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>

                                    <!-- Password -->
                                    <div class="space-y-1.5">
                                        <label for="password" class="block text-sm font-medium text-slate-700">
                                            Password <span class="text-red-500">*</span>
                                        </label>
                                        <div class="relative">
                                            <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors {focusedField === 'password' ? 'text-emerald-500' : ''}">
                                                <Lock class="w-[18px] h-[18px]" />
                                            </div>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="password"
                                                name="password"
                                                bind:value={formData.password}
                                                on:focus={() => focusedField = 'password'}
                                                on:blur={() => focusedField = null}
                                                required
                                                minlength="8"
                                                placeholder="Min. 8 karakter"
                                                class="w-full h-11 pl-11 pr-11 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                                            />
                                            <button
                                                type="button"
                                                on:click={() => showPassword = !showPassword}
                                                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {#if showPassword}<EyeOff class="w-4 h-4" />{:else}<Eye class="w-4 h-4" />{/if}
                                            </button>
                                        </div>
                                        
                                        <!-- Password Strength Indicator -->
                                        {#if formData.password}
                                            <div class="space-y-2 pt-1" in:fly={{ y: -5, duration: 200 }}>
                                                <!-- Strength Bar -->
                                                <div class="flex gap-1">
                                                    {#each Array(4) as _, i}
                                                        <div class="h-1 flex-1 rounded-full transition-all duration-300 {i < Math.ceil(passwordStrength.level / 1.5) ? passwordStrength.color : 'bg-slate-200'}"></div>
                                                    {/each}
                                                </div>
                                                
                                                <!-- Requirements Grid -->
                                                {#if passwordStrength.checks}
                                                    <div class="grid grid-cols-2 gap-x-3 gap-y-1">
                                                        {#each [
                                                            { key: 'minLength', label: 'Min. 8 karakter' },
                                                            { key: 'hasUppercase', label: 'Huruf besar' },
                                                            { key: 'hasLowercase', label: 'Huruf kecil' },
                                                            { key: 'hasNumber', label: 'Angka' }
                                                        ] as req}
                                                            <span class="text-xs flex items-center gap-1.5 {passwordStrength.checks[req.key] ? 'text-emerald-600' : 'text-slate-400'}">
                                                                {#if passwordStrength.checks[req.key]}
                                                                    <Check class="w-3 h-3" />
                                                                {:else}
                                                                    <div class="w-3 h-3 rounded-full border border-current"></div>
                                                                {/if}
                                                                {req.label}
                                                            </span>
                                                        {/each}
                                                    </div>
                                                {/if}
                                            </div>
                                        {/if}
                                    </div>

                                    <!-- Confirm Password -->
                                    <div class="space-y-1.5">
                                        <label for="confirm_password" class="block text-sm font-medium text-slate-700">
                                            Konfirmasi Password <span class="text-red-500">*</span>
                                        </label>
                                        <div class="relative">
                                            <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors {focusedField === 'confirm_password' ? 'text-emerald-500' : ''}">
                                                <Fingerprint class="w-[18px] h-[18px]" />
                                            </div>
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                id="confirm_password"
                                                name="confirm_password"
                                                bind:value={formData.confirm_password}
                                                on:focus={() => focusedField = 'confirm_password'}
                                                on:blur={() => focusedField = null}
                                                required
                                                placeholder="Ulangi password"
                                                class="w-full h-11 pl-11 pr-11 bg-white border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all text-sm {formData.confirm_password ? (passwordMatch ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20' : 'border-red-300 focus:border-red-500 focus:ring-red-500/20') : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'}"
                                            />
                                            <button
                                                type="button"
                                                on:click={() => showConfirmPassword = !showConfirmPassword}
                                                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {#if showConfirmPassword}<EyeOff class="w-4 h-4" />{:else}<Eye class="w-4 h-4" />{/if}
                                            </button>
                                        </div>
                                        {#if formData.confirm_password}
                                            <p class="text-xs flex items-center gap-1 {passwordMatch ? 'text-emerald-600' : 'text-red-500'}">
                                                {#if passwordMatch}
                                                    <Check class="w-3 h-3" /><span>Password cocok</span>
                                                {:else}
                                                    <X class="w-3 h-3" /><span>Password tidak cocok</span>
                                                {/if}
                                            </p>
                                        {/if}
                                    </div>

                                    <!-- Terms Agreement - UPDATED dengan modal -->
                                    <label class="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors group">
                                        <div class="relative mt-0.5">
                                            <input type="checkbox" name="agree_terms" bind:checked={formData.agree_terms} required class="peer sr-only" />
                                            <div class="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-all flex items-center justify-center">
                                                {#if formData.agree_terms}
                                                    <Check class="w-3 h-3 text-white" />
                                                {/if}
                                            </div>
                                        </div>
                                        <span class="text-sm text-slate-600 leading-relaxed">
                                            Saya menyetujui 
                                            <button 
                                                type="button" 
                                                on:click={openTermsModal}
                                                class="text-emerald-600 hover:underline font-medium"
                                            >
                                                Syarat & Ketentuan
                                            </button> 
                                            dan 
                                            <button 
                                                type="button" 
                                                on:click={openPrivacyModal}
                                                class="text-emerald-600 hover:underline font-medium"
                                            >
                                                Kebijakan Privasi
                                            </button>
                                        </span>
                                    </label>

                                    <!-- Buttons -->
                                    <div class="flex gap-3 pt-1">
                                        <button
                                            type="button"
                                            on:click={prevStep}
                                            class="h-11 px-5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium flex items-center gap-1.5 text-sm"
                                        >
                                            <ArrowLeft class="w-4 h-4" />
                                            <span>Kembali</span>
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !canSubmit}
                                            class="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                                        >
                                            {#if isSubmitting}
                                                <Loader2 class="w-4 h-4 animate-spin" />
                                                <span>Mendaftar...</span>
                                            {:else}
                                                <span>Daftar Sekarang</span>
                                            {/if}
                                        </button>
                                    </div>
                                </div>
                            {/if}
                        </form>

                        <!-- Divider -->
                        <div class="my-5 flex items-center gap-3">
                            <div class="flex-1 h-px bg-slate-200"></div>
                            <span class="text-xs text-slate-400 font-medium">atau</span>
                            <div class="flex-1 h-px bg-slate-200"></div>
                        </div>

                        <!-- Login Link -->
                        <p class="text-center text-slate-600 text-sm">
                            Sudah punya akun?
                            <a href="/login" class="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors ml-1">
                                Masuk di sini
                            </a>
                        </p>

                        <!-- Security Badge -->
                        <div class="mt-5 flex items-center justify-center gap-2 text-slate-400">
                            <Shield class="w-4 h-4" />
                            <span class="text-xs">Data terenkripsi & aman</span>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Mobile Footer -->
            <div class="lg:hidden py-4 px-4 text-center border-t border-slate-100 bg-white/50">
                <p class="text-xs text-slate-400">
                    &copy; {new Date().getFullYear()} POSKasir • 
                    <a href="https://wa.me/6281234567890" class="text-emerald-600 hover:underline">Hubungi Support</a>
                </p>
            </div>
        </div>
    </div>
</div>

<style>
    /* Custom animations */
    @keyframes float {
        0%, 100% { transform: translateY(0) rotate(12deg); }
        50% { transform: translateY(-10px) rotate(12deg); }
    }
    
    .animate-float {
        animation: float 6s ease-in-out infinite;
    }
    
    /* Smooth scrollbar */
    :global(html) {
        scroll-behavior: smooth;
    }
    
    /* Better focus states for accessibility */
    :global(*:focus-visible) {
        outline: 2px solid theme('colors.emerald.500');
        outline-offset: 2px;
    }
    
    /* Hide scrollbar but keep functionality */
    :global(.hide-scrollbar) {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    :global(.hide-scrollbar::-webkit-scrollbar) {
        display: none;
    }
</style>