<script>
    // Data fitur utama
    const features = [
        {
            icon: '🛒',
            title: 'Transaksi Cepat',
            description: 'Proses penjualan dalam hitungan detik. Interface yang simpel dan mudah digunakan.'
        },
        {
            icon: '📦',
            title: 'Manajemen Stok',
            description: 'Pantau stok barang secara real-time. Notifikasi otomatis saat stok menipis.'
        },
        {
            icon: '📊',
            title: 'Laporan Lengkap',
            description: 'Laporan penjualan harian, mingguan, bulanan. Export ke Excel dengan mudah.'
        },
        {
            icon: '👥',
            title: 'Multi Kasir',
            description: 'Dukung banyak kasir dalam satu toko. Lacak performa masing-masing kasir.'
        },
        {
            icon: '🏷️',
            title: 'Manajemen Kategori',
            description: 'Kelompokkan produk dengan kategori. Pencarian produk jadi lebih cepat.'
        },
        {
            icon: '📱',
            title: 'Mobile Friendly',
            description: 'Akses dari mana saja, kapan saja. Bisa digunakan di tablet dan smartphone.'
        }
    ];

    // Data pricing
    const pricingPlans = [
        {
            name: 'Starter',
            price: 'Gratis',
            period: 'selamanya',
            description: 'Cocok untuk UMKM yang baru mulai',
            features: [
                '1 Outlet',
                'Maksimal 100 Produk',
                'Laporan Dasar',
                '1 User',
                'Support via Email'
            ],
            cta: 'Mulai Gratis',
            popular: false
        },
        {
            name: 'Business',
            price: 'Rp 99.000',
            period: '/bulan',
            description: 'Untuk bisnis yang sedang berkembang',
            features: [
                '3 Outlet',
                'Produk Unlimited',
                'Laporan Lengkap',
                '5 User',
                'Support via WhatsApp',
                'Export Excel',
                'Backup Data'
            ],
            cta: 'Pilih Business',
            popular: true
        },
        {
            name: 'Enterprise',
            price: 'Rp 249.000',
            period: '/bulan',
            description: 'Untuk bisnis dengan banyak cabang',
            features: [
                'Unlimited Outlet',
                'Produk Unlimited',
                'Laporan Advanced',
                'Unlimited User',
                'Priority Support 24/7',
                'API Access',
                'Custom Branding',
                'Training Tim'
            ],
            cta: 'Hubungi Sales',
            popular: false
        }
    ];

    // Data testimonial
    const testimonials = [
        {
            name: 'Budi Santoso',
            business: 'Toko Sembako Makmur',
            avatar: '👨',
            text: 'Sejak pakai POSKasir, omzet toko saya naik 30%! Pencatatan stok jadi rapi dan tidak ada lagi barang yang terlewat.'
        },
        {
            name: 'Siti Aminah',
            business: 'Warung Makan Sederhana',
            avatar: '👩',
            text: 'Aplikasinya mudah banget dipakai. Karyawan saya yang baru pun langsung bisa mengoperasikan dalam 10 menit.'
        },
        {
            name: 'Ahmad Hidayat',
            business: 'Apotek Sehat Selalu',
            avatar: '👨‍⚕️',
            text: 'Fitur laporan sangat membantu untuk analisis bisnis. Sekarang saya tahu produk mana yang paling laku.'
        }
    ];

    // Data statistik
    const stats = [
        { value: '5.000+', label: 'UMKM Terdaftar' },
        { value: '1 Juta+', label: 'Transaksi/Bulan' },
        { value: '50 Miliar+', label: 'Nilai Transaksi' },
        { value: '99.9%', label: 'Uptime Server' }
    ];
</script>

<!-- ============================================ -->
<!-- HERO SECTION -->
<!-- ============================================ -->
<section class="relative overflow-hidden">
    <!-- Background Pattern -->
    <div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50"></div>
    <div class="absolute inset-0 opacity-40" style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%239C92AC&quot; fill-opacity=&quot;0.08&quot;%3E%3Cpath d=&quot;M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
    
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
            
            <!-- Left Content -->
            <div class="text-center lg:text-left">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Gratis untuk UMKM!
                </div>
                
                <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                    Kelola Bisnis
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                        Lebih Mudah
                    </span>
                </h1>
                
                <p class="text-lg text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                    Aplikasi Point of Sale modern untuk UMKM Indonesia. Catat transaksi, kelola stok, dan pantau laporan bisnis dalam satu platform.
                </p>
                
                <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <a 
                        href="/register" 
                        class="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold text-center shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5"
                    >
                        Daftar Gratis Sekarang
                    </a>
                    <a 
                        href="#fitur" 
                        class="px-8 py-4 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-center border border-gray-200 inline-flex items-center justify-center gap-2"
                    >
                        <span>Lihat Fitur</span>
                        <span>→</span>
                    </a>
                </div>

                <!-- Trust Badges -->
                <div class="mt-10 pt-10 border-t border-gray-200">
                    <p class="text-sm text-gray-500 mb-4">Dipercaya oleh ribuan UMKM di Indonesia</p>
                    <div class="flex flex-wrap gap-6 justify-center lg:justify-start items-center opacity-60">
                        <span class="text-2xl">🏪</span>
                        <span class="text-2xl">🛒</span>
                        <span class="text-2xl">🍜</span>
                        <span class="text-2xl">💊</span>
                        <span class="text-2xl">👕</span>
                        <span class="text-2xl">📚</span>
                    </div>
                </div>
            </div>

            <!-- Right Content - Hero Image/Illustration -->
            <div class="relative">
                <div class="relative bg-white rounded-2xl shadow-2xl p-4 lg:p-6">
                    <!-- Mock Dashboard -->
                    <div class="bg-gray-50 rounded-xl p-4">
                        <div class="flex items-center gap-2 mb-4">
                            <div class="w-3 h-3 rounded-full bg-red-400"></div>
                            <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div class="w-3 h-3 rounded-full bg-green-400"></div>
                            <div class="flex-1 bg-gray-200 rounded h-4 ml-2"></div>
                        </div>
                        
                        <!-- Stats Row -->
                        <div class="grid grid-cols-3 gap-3 mb-4">
                            <div class="bg-white rounded-lg p-3 text-center">
                                <p class="text-xs text-gray-500">Hari Ini</p>
                                <p class="text-lg font-bold text-green-600">Rp 2.4 Jt</p>
                            </div>
                            <div class="bg-white rounded-lg p-3 text-center">
                                <p class="text-xs text-gray-500">Transaksi</p>
                                <p class="text-lg font-bold text-blue-600">48</p>
                            </div>
                            <div class="bg-white rounded-lg p-3 text-center">
                                <p class="text-xs text-gray-500">Produk</p>
                                <p class="text-lg font-bold text-purple-600">156</p>
                            </div>
                        </div>

                        <!-- Chart Placeholder -->
                        <div class="bg-white rounded-lg p-4 mb-4">
                            <div class="flex items-end justify-between h-24 gap-2">
                                <div class="w-full bg-blue-200 rounded-t" style="height: 40%"></div>
                                <div class="w-full bg-blue-300 rounded-t" style="height: 60%"></div>
                                <div class="w-full bg-blue-400 rounded-t" style="height: 45%"></div>
                                <div class="w-full bg-blue-500 rounded-t" style="height: 80%"></div>
                                <div class="w-full bg-blue-600 rounded-t" style="height: 70%"></div>
                                <div class="w-full bg-blue-500 rounded-t" style="height: 90%"></div>
                                <div class="w-full bg-blue-600 rounded-t" style="height: 100%"></div>
                            </div>
                        </div>

                        <!-- Transaction List -->
                        <div class="space-y-2">
                            <div class="bg-white rounded-lg p-3 flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm">✓</div>
                                    <div>
                                        <p class="text-sm font-medium">INV-001</p>
                                        <p class="text-xs text-gray-500">3 item</p>
                                    </div>
                                </div>
                                <p class="text-sm font-semibold text-green-600">+Rp 85.000</p>
                            </div>
                            <div class="bg-white rounded-lg p-3 flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm">✓</div>
                                    <div>
                                        <p class="text-sm font-medium">INV-002</p>
                                        <p class="text-xs text-gray-500">5 item</p>
                                    </div>
                                </div>
                                <p class="text-sm font-semibold text-green-600">+Rp 156.000</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Floating Elements -->
                <div class="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-bounce">
                    +Rp 2.4 Jt Hari Ini! 📈
                </div>
                <div class="absolute -bottom-4 -left-4 bg-white px-4 py-3 rounded-lg shadow-lg text-sm hidden sm:block">
                    <div class="flex items-center gap-2">
                        <span class="text-yellow-500">⭐⭐⭐⭐⭐</span>
                        <span class="text-gray-600">4.9/5</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ============================================ -->
<!-- STATS SECTION -->
<!-- ============================================ -->
<section class="bg-blue-600 py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {#each stats as stat}
                <div class="text-center">
                    <p class="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</p>
                    <p class="text-blue-100 text-sm">{stat.label}</p>
                </div>
            {/each}
        </div>
    </div>
</section>

<!-- ============================================ -->
<!-- FEATURES SECTION -->
<!-- ============================================ -->
<section id="fitur" class="py-20 lg:py-28 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Section Header -->
        <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                Fitur Lengkap
            </span>
            <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Semua yang Anda Butuhkan untuk Mengelola Bisnis
            </h2>
            <p class="text-gray-600 text-lg">
                Fitur-fitur powerful yang dirancang khusus untuk kebutuhan UMKM Indonesia
            </p>
        </div>

        <!-- Features Grid -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {#each features as feature}
                <div class="group p-6 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100">
                    <div class="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                        {feature.icon}
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p class="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
            {/each}
        </div>
    </div>
</section>

<!-- ============================================ -->
<!-- PRICING SECTION -->
<!-- ============================================ -->
<section id="harga" class="py-20 lg:py-28 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Section Header -->
        <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
                Harga Terjangkau
            </span>
            <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Pilih Paket yang Sesuai
            </h2>
            <p class="text-gray-600 text-lg">
                Mulai gratis, upgrade kapan saja sesuai kebutuhan bisnis Anda
            </p>
        </div>

        <!-- Pricing Cards -->
        <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {#each pricingPlans as plan}
                <div class="relative bg-white rounded-2xl p-8 {plan.popular ? 'ring-2 ring-blue-600 shadow-xl scale-105' : 'border border-gray-200'} transition-all hover:shadow-lg">
                    
                    <!-- Popular Badge -->
                    {#if plan.popular}
                        <div class="absolute -top-4 left-1/2 -translate-x-1/2">
                            <span class="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                                Paling Populer
                            </span>
                        </div>
                    {/if}

                    <div class="text-center mb-6">
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                        <p class="text-gray-500 text-sm mb-4">{plan.description}</p>
                        <div class="flex items-baseline justify-center gap-1">
                            <span class="text-4xl font-bold text-gray-900">{plan.price}</span>
                            <span class="text-gray-500">{plan.period}</span>
                        </div>
                    </div>

                    <ul class="space-y-3 mb-8">
                        {#each plan.features as feature}
                            <li class="flex items-center gap-3 text-gray-600">
                                <span class="text-green-500">✓</span>
                                <span>{feature}</span>
                            </li>
                        {/each}
                    </ul>

                    <a 
                        href="/register"
                        class="block w-full py-3 rounded-xl font-semibold text-center transition-all {plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
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
<section id="tentang" class="py-20 lg:py-28 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Section Header -->
        <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
                Testimoni
            </span>
            <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Apa Kata Mereka?
            </h2>
            <p class="text-gray-600 text-lg">
                Ribuan UMKM sudah merasakan manfaat menggunakan POSKasir
            </p>
        </div>

        <!-- Testimonials Grid -->
        <div class="grid md:grid-cols-3 gap-8">
            {#each testimonials as testimonial}
                <div class="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                            {testimonial.avatar}
                        </div>
                        <div>
                            <p class="font-semibold text-gray-900">{testimonial.name}</p>
                            <p class="text-sm text-gray-500">{testimonial.business}</p>
                        </div>
                    </div>
                    <p class="text-gray-600 leading-relaxed">"{testimonial.text}"</p>
                    <div class="flex gap-1 mt-4 text-yellow-400">
                        ⭐⭐⭐⭐⭐
                    </div>
                </div>
            {/each}
        </div>
    </div>
</section>

<!-- ============================================ -->
<!-- CTA SECTION -->
<!-- ============================================ -->
<section class="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div class="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
    </div>

    <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-6">
            Siap Memulai Perjalanan Bisnis Digital Anda?
        </h2>
        <p class="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Bergabung dengan ribuan UMKM yang sudah sukses menggunakan POSKasir. 
            Daftar sekarang dan nikmati semua fitur gratis!
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
                href="/register"
                class="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-100 transition-all font-semibold shadow-lg"
            >
                Daftar Gratis Sekarang
            </a>
            <a 
                href="#"
                class="px-8 py-4 bg-transparent text-white rounded-xl hover:bg-white/10 transition-all font-semibold border-2 border-white/30"
            >
                Jadwalkan Demo
            </a>
        </div>
    </div>
</section>