<script>
    import { 
        Zap, Package, BarChart3, Users, Tags, Smartphone,
        ArrowRight, Check, Star, Quote, Play, ChevronRight,
        TrendingUp, ShoppingCart, Clock
    } from 'lucide-svelte';

    // Data fitur utama
    const features = [
        {
            icon: Zap,
            title: 'Transaksi Cepat',
            description: 'Proses penjualan dalam hitungan detik dengan interface yang simpel.'
        },
        {
            icon: Package,
            title: 'Manajemen Stok',
            description: 'Pantau stok real-time dengan notifikasi otomatis saat menipis.'
        },
        {
            icon: BarChart3,
            title: 'Laporan Lengkap',
            description: 'Laporan harian hingga bulanan dengan export ke Excel.'
        },
        {
            icon: Users,
            title: 'Multi Kasir',
            description: 'Dukung banyak kasir dengan tracking performa masing-masing.'
        },
        {
            icon: Tags,
            title: 'Kategori Produk',
            description: 'Kelompokkan produk untuk pencarian yang lebih cepat.'
        },
        {
            icon: Smartphone,
            title: 'Mobile Friendly',
            description: 'Akses dari mana saja melalui tablet atau smartphone.'
        }
    ];

    // Data pricing
    const pricingPlans = [
        {
            name: 'Starter',
            price: 'Gratis',
            period: 'selamanya',
            description: 'Untuk UMKM yang baru mulai',
            features: ['1 Outlet', '100 Produk', 'Laporan Dasar', '1 User', 'Email Support'],
            cta: 'Mulai Gratis',
            popular: false
        },
        {
            name: 'Business',
            price: 'Rp 99K',
            period: '/bulan',
            description: 'Untuk bisnis berkembang',
            features: ['3 Outlet', 'Unlimited Produk', 'Laporan Lengkap', '5 User', 'WhatsApp Support', 'Export Excel', 'Backup Data'],
            cta: 'Pilih Business',
            popular: true
        },
        {
            name: 'Enterprise',
            price: 'Rp 249K',
            period: '/bulan',
            description: 'Untuk bisnis besar',
            features: ['Unlimited Outlet', 'Unlimited Produk', 'Laporan Advanced', 'Unlimited User', 'Priority 24/7', 'API Access', 'Custom Branding'],
            cta: 'Hubungi Sales',
            popular: false
        }
    ];

    // Data testimonial
    const testimonials = [
        {
            name: 'Budi Santoso',
            business: 'Toko Sembako Makmur',
            text: 'Sejak pakai POSKasir, omzet naik 30%! Pencatatan stok jadi rapi dan tidak ada barang terlewat.',
            rating: 5
        },
        {
            name: 'Siti Aminah',
            business: 'Warung Makan Sederhana',
            text: 'Mudah banget dipakai. Karyawan baru langsung bisa operasikan dalam 10 menit.',
            rating: 5
        },
        {
            name: 'Ahmad Hidayat',
            business: 'Apotek Sehat Selalu',
            text: 'Fitur laporan sangat membantu analisis. Sekarang tahu produk mana yang paling laku.',
            rating: 5
        }
    ];

    // Data statistik
    const stats = [
        { value: '10K+', label: 'UMKM Aktif' },
        { value: '1M+', label: 'Transaksi/Bulan' },
        { value: '50M+', label: 'Nilai Transaksi' },
        { value: '99.9%', label: 'Uptime' }
    ];
</script>

<svelte:head>
    <title>POSKasir - Aplikasi Kasir Modern untuk UMKM Indonesia</title>
    <meta name="description" content="Aplikasi Point of Sale modern untuk UMKM Indonesia. Catat transaksi, kelola stok, dan pantau laporan bisnis dalam satu platform." />
</svelte:head>

<!-- ============================================ -->
<!-- HERO SECTION -->
<!-- ============================================ -->
<section class="relative overflow-hidden bg-white">
    <!-- Background -->
    <div class="absolute inset-0">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-emerald-50 rounded-full blur-3xl"></div>
        <div class="absolute top-1/2 -left-20 w-60 h-60 bg-cyan-50 rounded-full blur-3xl"></div>
    </div>
    
    <div class="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            <!-- Left Content -->
            <div class="text-center lg:text-left">
                <!-- Badge -->
                <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-sm font-medium text-emerald-700 mb-6">
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Gratis untuk UMKM
                </div>
                
                <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 leading-tight mb-6">
                    Kelola Bisnis
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600">
                        Lebih Mudah
                    </span>
                </h1>
                
                <p class="text-slate-600 text-lg mb-8 max-w-lg mx-auto lg:mx-0">
                    Aplikasi kasir modern untuk UMKM Indonesia. Catat transaksi, kelola stok, dan pantau laporan dalam satu platform.
                </p>
                
                <!-- CTA Buttons -->
                <div class="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                    <a 
                        href="/register" 
                        class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 group"
                    >
                        <span>Daftar Gratis</span>
                        <ArrowRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                    <a 
                        href="#fitur" 
                        class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold border border-slate-200"
                    >
                        <Play class="w-4 h-4" />
                        <span>Lihat Demo</span>
                    </a>
                </div>

                <!-- Trust -->
                <div class="mt-10 pt-8 border-t border-slate-100">
                    <p class="text-sm text-slate-500 mb-3">Dipercaya ribuan UMKM di Indonesia</p>
                    <div class="flex items-center justify-center lg:justify-start gap-1">
                        {#each Array(5) as _}
                            <Star class="w-5 h-5 text-amber-400 fill-amber-400" />
                        {/each}
                        <span class="text-slate-600 text-sm ml-2">4.9/5 dari 500+ review</span>
                    </div>
                </div>
            </div>

            <!-- Right Content - Dashboard Preview -->
            <div class="relative">
                <div class="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 p-4 border border-slate-100">
                    <!-- Browser Bar -->
                    <div class="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <div class="flex gap-1.5">
                            <div class="w-3 h-3 rounded-full bg-red-400"></div>
                            <div class="w-3 h-3 rounded-full bg-amber-400"></div>
                            <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
                        </div>
                        <div class="flex-1 bg-slate-100 rounded-lg h-7 ml-2"></div>
                    </div>
                    
                    <!-- Stats Row -->
                    <div class="grid grid-cols-3 gap-3 mb-4">
                        <div class="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 text-center border border-emerald-100">
                            <p class="text-xs text-slate-500 mb-1">Hari Ini</p>
                            <p class="text-lg font-bold text-emerald-600">Rp 2.4Jt</p>
                        </div>
                        <div class="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 text-center border border-blue-100">
                            <p class="text-xs text-slate-500 mb-1">Transaksi</p>
                            <p class="text-lg font-bold text-blue-600">48</p>
                        </div>
                        <div class="bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl p-3 text-center border border-violet-100">
                            <p class="text-xs text-slate-500 mb-1">Produk</p>
                            <p class="text-lg font-bold text-violet-600">156</p>
                        </div>
                    </div>

                    <!-- Chart -->
                    <div class="bg-slate-50 rounded-xl p-4 mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-sm font-medium text-slate-700">Penjualan Minggu Ini</span>
                            <span class="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                <TrendingUp class="w-3 h-3" />
                                +12%
                            </span>
                        </div>
                        <div class="flex items-end justify-between h-20 gap-2">
                            {#each [40, 65, 45, 80, 60, 90, 100] as height}
                                <div class="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md transition-all hover:from-emerald-600 hover:to-emerald-500" style="height: {height}%"></div>
                            {/each}
                        </div>
                        <div class="flex justify-between mt-2 text-xs text-slate-400">
                            <span>Sen</span>
                            <span>Sel</span>
                            <span>Rab</span>
                            <span>Kam</span>
                            <span>Jum</span>
                            <span>Sab</span>
                            <span>Min</span>
                        </div>
                    </div>

                    <!-- Recent Transactions -->
                    <div class="space-y-2">
                        {#each [{ id: 'INV-001', items: 3, amount: '85.000' }, { id: 'INV-002', items: 5, amount: '156.000' }] as tx}
                            <div class="bg-white rounded-xl p-3 flex items-center justify-between border border-slate-100">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <ShoppingCart class="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p class="text-sm font-medium text-slate-700">{tx.id}</p>
                                        <p class="text-xs text-slate-400">{tx.items} item</p>
                                    </div>
                                </div>
                                <p class="text-sm font-semibold text-emerald-600">+Rp {tx.amount}</p>
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- Floating Badge -->
                <div class="absolute -top-3 -right-3 bg-emerald-500 text-white px-3 py-1.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-1.5">
                    <TrendingUp class="w-4 h-4" />
                    <span>+Rp 2.4Jt</span>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ============================================ -->
<!-- STATS SECTION -->
<!-- ============================================ -->
<section class="bg-slate-900 py-10">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {#each stats as stat}
                <div class="text-center">
                    <p class="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</p>
                    <p class="text-slate-400 text-sm">{stat.label}</p>
                </div>
            {/each}
        </div>
    </div>
</section>

<!-- ============================================ -->
<!-- FEATURES SECTION -->
<!-- ============================================ -->
<section id="fitur" class="py-16 lg:py-24 bg-slate-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Section Header -->
        <div class="text-center max-w-2xl mx-auto mb-12">
            <span class="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                Fitur Lengkap
            </span>
            <h2 class="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
                Semua yang Anda Butuhkan
            </h2>
            <p class="text-slate-600">
                Fitur-fitur yang dirancang khusus untuk kebutuhan UMKM Indonesia
            </p>
        </div>

        <!-- Features Grid -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {#each features as feature}
                <div class="group p-6 bg-white rounded-2xl border border-slate-100 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
                    <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:scale-110 transition-all">
                        <svelte:component this={feature.icon} class="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 class="text-lg font-semibold text-slate-800 mb-2">{feature.title}</h3>
                    <p class="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
            {/each}
        </div>
    </div>
</section>

<!-- ============================================ -->
<!-- PRICING SECTION -->
<!-- ============================================ -->
<section id="harga" class="py-16 lg:py-24 bg-white">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Section Header -->
        <div class="text-center max-w-2xl mx-auto mb-12">
            <span class="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                Harga Terjangkau
            </span>
            <h2 class="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
                Pilih Paket yang Sesuai
            </h2>
            <p class="text-slate-600">
                Mulai gratis, upgrade kapan saja sesuai kebutuhan
            </p>
        </div>

        <!-- Pricing Cards -->
        <div class="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {#each pricingPlans as plan}
                <div class="relative bg-white rounded-2xl p-6 {plan.popular ? 'ring-2 ring-emerald-500 shadow-xl shadow-emerald-500/10' : 'border border-slate-200'} transition-all hover:shadow-lg">
                    
                    {#if plan.popular}
                        <div class="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span class="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                Populer
                            </span>
                        </div>
                    {/if}

                    <div class="text-center mb-6">
                        <h3 class="text-lg font-semibold text-slate-800 mb-1">{plan.name}</h3>
                        <p class="text-slate-500 text-sm mb-4">{plan.description}</p>
                        <div class="flex items-baseline justify-center gap-1">
                            <span class="text-3xl font-bold text-slate-800">{plan.price}</span>
                            <span class="text-slate-500 text-sm">{plan.period}</span>
                        </div>
                    </div>

                    <ul class="space-y-3 mb-6">
                        {#each plan.features as feature}
                            <li class="flex items-center gap-2 text-slate-600 text-sm">
                                <Check class="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                <span>{feature}</span>
                            </li>
                        {/each}
                    </ul>

                    <a 
                        href="/register"
                        class="block w-full py-2.5 rounded-xl font-semibold text-center text-sm transition-all {plan.popular ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/25' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
                    >
                        {plan.cta}
                    </a>
                </div>
            {/each}
        </div>
    </div>
</section>

<!-- ============================================ -->
<!-- TESTIMONIALS SECTION -->
<!-- ============================================ -->
<section id="testimoni" class="py-16 lg:py-24 bg-slate-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Section Header -->
        <div class="text-center max-w-2xl mx-auto mb-12">
            <span class="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                Testimoni
            </span>
            <h2 class="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
                Apa Kata Mereka?
            </h2>
            <p class="text-slate-600">
                Ribuan UMKM sudah merasakan manfaat POSKasir
            </p>
        </div>

        <!-- Testimonials Grid -->
        <div class="grid md:grid-cols-3 gap-6">
            {#each testimonials as testimonial}
                <div class="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-all">
                    <Quote class="w-8 h-8 text-emerald-200 mb-4" />
                    <p class="text-slate-600 text-sm leading-relaxed mb-6">"{testimonial.text}"</p>
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                            {testimonial.name.charAt(0)}
                        </div>
                        <div>
                            <p class="font-semibold text-slate-800 text-sm">{testimonial.name}</p>
                            <p class="text-slate-500 text-xs">{testimonial.business}</p>
                        </div>
                    </div>
                    <div class="flex gap-0.5 mt-4">
                        {#each Array(testimonial.rating) as _}
                            <Star class="w-4 h-4 text-amber-400 fill-amber-400" />
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</section>

<!-- ============================================ -->
<!-- CTA SECTION -->
<!-- ============================================ -->
<section class="py-16 lg:py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
    <!-- Background -->
    <div class="absolute inset-0">
        <div class="absolute top-0 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
    </div>

    <div class="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            Siap Memulai?
        </h2>
        <p class="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Bergabung dengan ribuan UMKM yang sudah sukses. Daftar sekarang dan nikmati semua fitur gratis!
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <a 
                href="/register"
                class="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-semibold shadow-lg shadow-emerald-500/25 group"
            >
                <span>Daftar Gratis Sekarang</span>
                <ArrowRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a 
                href="#"
                class="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-semibold border border-white/20"
            >
                <Clock class="w-4 h-4" />
                <span>Jadwalkan Demo</span>
            </a>
        </div>
    </div>
</section>