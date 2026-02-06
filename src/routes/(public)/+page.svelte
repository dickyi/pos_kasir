<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { 
        Zap, Package, BarChart3, Users, Tags, Smartphone,
        ArrowRight, Check, Star, Quote, Play, Gift, Sparkles, Heart,
        TrendingUp, ShoppingCart, Clock, ChevronDown, ChevronUp,
        CreditCard, Shield, Server, DollarSign, MessageCircle,
        Phone, Mail, MapPin, Facebook, Instagram, Twitter, Plus, X,
        User, Building2, Briefcase, Send, CheckCircle, ChevronLeft, ChevronRight
    } from 'lucide-svelte';

    export let data;
    
    // Get all data from server
    $: settings = data?.settings || {};
    $: hero = data?.hero || {};
    $: stats = data?.stats || [];
    $: features = data?.features || [];
    $: pricing = data?.pricing || [];
    $: testimonials = data?.testimonials || [];
    $: cta = data?.cta || {};
    $: faq = data?.faq || [];
    $: sections = data?.sections || {};

    // Icon mapping
    const iconMap = {
        'Zap': Zap, 'Package': Package, 'BarChart3': BarChart3, 'Users': Users,
        'Tags': Tags, 'Smartphone': Smartphone, 'CreditCard': CreditCard,
        'Shield': Shield, 'Server': Server, 'DollarSign': DollarSign,
        'ShoppingCart': ShoppingCart, 'Gift': Gift, 'MessageCircle': MessageCircle,
        'Star': Star, 'Heart': Heart, 'Check': Check
    };

    function getIcon(iconName) {
        return iconMap[iconName] || Zap;
    }

    // FAQ accordion state
    let openFaqIndex = null;
    function toggleFaq(index) {
        openFaqIndex = openFaqIndex === index ? null : index;
    }

    // Format price
    function formatPrice(price) {
        if (price === 0) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    }

    // ============================================
    // [FIX] XSS SANITIZATION
    // ============================================
    let DOMPurify = null;
    
    onMount(async () => {
        if (browser) {
            // Load DOMPurify untuk sanitasi HTML
            const module = await import('dompurify');
            DOMPurify = module.default;
            
            // Update responsive itemsPerView
            updateItemsPerView();
            window.addEventListener('resize', updateItemsPerView);
            
            return () => {
                window.removeEventListener('resize', updateItemsPerView);
            };
        }
    });
    
    // [FIX] Sanitize HTML untuk mencegah XSS
    function sanitizeHtml(html) {
        if (!html) return '';
        if (DOMPurify) {
            return DOMPurify.sanitize(html, {
                ALLOWED_TAGS: ['strong', 'em', 'b', 'i', 'u', 'br', 'span'],
                ALLOWED_ATTR: ['class']
            });
        }
        // Fallback: strip semua HTML tags jika DOMPurify belum load
        return html.replace(/<[^>]*>/g, '');
    }

    // ============================================
    // [FIX] TESTIMONIAL SLIDER - RESPONSIVE
    // ============================================
    $: visibleTestimonials = testimonials.filter(t => t.is_active !== false);
    
    let currentSlide = 0;
    let itemsPerView = 3; // Default desktop
    
    // [FIX] Responsive itemsPerView
    function updateItemsPerView() {
        if (browser) {
            const width = window.innerWidth;
            if (width < 640) {
                itemsPerView = 1; // Mobile: 1 card
            } else if (width < 1024) {
                itemsPerView = 2; // Tablet: 2 cards
            } else {
                itemsPerView = 3; // Desktop: 3 cards
            }
            // Reset slide jika melebihi batas
            if (currentSlide >= Math.ceil(visibleTestimonials.length / itemsPerView)) {
                currentSlide = 0;
            }
        }
    }
    
    $: totalSlides = Math.ceil(visibleTestimonials.length / itemsPerView);
    $: canGoPrev = currentSlide > 0;
    $: canGoNext = currentSlide < totalSlides - 1;
    
    // Get current visible testimonials based on slide
    $: currentTestimonials = visibleTestimonials.slice(
        currentSlide * itemsPerView, 
        (currentSlide + 1) * itemsPerView
    );
    
    function nextSlide() {
        if (canGoNext) {
            currentSlide++;
        } else {
            currentSlide = 0;
        }
    }
    
    function prevSlide() {
        if (canGoPrev) {
            currentSlide--;
        } else {
            currentSlide = totalSlides - 1;
        }
    }
    
    function goToSlide(index) {
        currentSlide = index;
    }
    
    // Touch/Swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    function handleTouchStart(e) {
        touchStartX = e.changedTouches[0].screenX;
    }
    
    function handleTouchEnd(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide(); // Swipe left = next
            } else {
                prevSlide(); // Swipe right = prev
            }
        }
    }

    // ============================================
    // TESTIMONIAL FORM STATE
    // ============================================
    let showTestimonialForm = false;
    let isSubmitting = false;
    let showSuccess = false;
    let rating = 5;
    let hoverRating = 0;
    
    let testimonialForm = {
        name: '',
        role: '',
        business_name: '',
        business_type: '',
        email: '',
        phone: '',
        location: '',
        testimonial: ''
    };
    
    const businessTypes = [
        'Kuliner / F&B',
        'Retail / Toko',
        'Fashion',
        'Jasa',
        'Lainnya'
    ];
    
    function resetTestimonialForm() {
        testimonialForm = {
            name: '',
            role: '',
            business_name: '',
            business_type: '',
            email: '',
            phone: '',
            location: '',
            testimonial: ''
        };
        rating = 5;
        hoverRating = 0;
    }
    
    function closeTestimonialModal() {
        if (!isSubmitting) {
            showTestimonialForm = false;
            showSuccess = false;
            resetTestimonialForm();
        }
    }
    
    // [FIX] Improved error handling untuk testimonial form
    let formError = '';
    
    async function submitTestimonial(event) {
        event.preventDefault();
        isSubmitting = true;
        formError = '';
        
        try {
            const formData = new FormData();
            formData.append('name', testimonialForm.name);
            formData.append('role', testimonialForm.role);
            formData.append('business_name', testimonialForm.business_name);
            formData.append('business_type', testimonialForm.business_type);
            formData.append('email', testimonialForm.email);
            formData.append('phone', testimonialForm.phone);
            formData.append('location', testimonialForm.location);
            formData.append('testimonial', testimonialForm.testimonial);
            formData.append('rating', rating.toString());
            
            const response = await fetch('/api/testimonial', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showSuccess = true;
            } else {
                formError = result.message || 'Gagal mengirim testimoni. Silakan coba lagi.';
            }
        } catch (error) {
            console.error('Error:', error);
            formError = 'Terjadi kesalahan jaringan. Periksa koneksi internet Anda.';
        } finally {
            isSubmitting = false;
        }
    }
</script>

<svelte:head>
    <title>{settings.seo_title || settings.app_name || 'POSKasir'}</title>
    <meta name="description" content={settings.seo_description || 'Aplikasi kasir gratis untuk UMKM'} />
    <meta name="keywords" content={settings.seo_keywords || 'pos, kasir, umkm, gratis'} />
</svelte:head>

<!-- ============================================ -->
<!-- HERO SECTION -->
<!-- ============================================ -->
{#if sections.hero?.visible !== false}
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
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 rounded-full text-sm font-semibold text-emerald-700 mb-6">
                    <svelte:component this={getIcon(hero.badge_icon)} class="w-4 h-4" />
                    <span>{hero.badge_text || 'Gratis Selamanya'}</span>
                    <Sparkles class="w-4 h-4 text-amber-500" />
                </div>
                
                <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 leading-tight mb-6">
                    {hero.title_line1 || 'Kelola Bisnis'}
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600">
                        {hero.title_line2 || 'Lebih Mudah'}
                    </span>
                </h1>
                
                <!-- [FIX] XSS Prevention - Sanitize HTML -->
                <p class="text-slate-600 text-lg mb-8 max-w-lg mx-auto lg:mx-0">
                    {@html sanitizeHtml(hero.description) || 'Aplikasi kasir modern GRATIS untuk UMKM Indonesia.'}
                </p>
                
                <!-- CTA Buttons -->
                <div class="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                    <a 
                        href={hero.cta_primary_link || '/register'} 
                        class="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all font-semibold shadow-lg shadow-emerald-500/25 group"
                    >
                        <Gift class="w-5 h-5" />
                        <span>{hero.cta_primary_text || 'Daftar Gratis'}</span>
                        <ArrowRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                    <a 
                        href={hero.cta_secondary_link || '#fitur'} 
                        class="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold border border-slate-200"
                    >
                        <Play class="w-4 h-4" />
                        <span>{hero.cta_secondary_text || 'Lihat Demo'}</span>
                    </a>
                </div>

                <!-- Free Badge -->
                {#if hero.show_free_badge}
                <div class="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <Heart class="w-4 h-4 text-red-500" />
                    <span class="text-sm text-amber-800 font-medium">{hero.free_badge_text || 'Gratis selamanya!'}</span>
                </div>
                {/if}

                <!-- Trust -->
                <div class="mt-8 pt-6 border-t border-slate-100">
                    <p class="text-sm text-slate-500 mb-3">{hero.trust_text || 'Dipercaya ribuan UMKM'}</p>
                    <div class="flex items-center justify-center lg:justify-start gap-1">
                        {#each Array(5) as _}
                            <Star class="w-5 h-5 text-amber-400 fill-amber-400" />
                        {/each}
                        <span class="text-slate-600 text-sm ml-2">{hero.rating || '4.9'}/5 dari {hero.review_count || '500+'} review</span>
                    </div>
                </div>
            </div>

            <!-- Right Content - Dashboard Preview -->
            <div class="relative">
                <div class="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 p-4 border border-slate-100">
                    <div class="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <div class="flex gap-1.5">
                            <div class="w-3 h-3 rounded-full bg-red-400"></div>
                            <div class="w-3 h-3 rounded-full bg-amber-400"></div>
                            <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
                        </div>
                        <div class="flex-1 bg-slate-100 rounded-lg h-7 ml-2"></div>
                    </div>
                    
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

                    <div class="bg-slate-50 rounded-xl p-4 mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-sm font-medium text-slate-700">Penjualan Minggu Ini</span>
                            <span class="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                <TrendingUp class="w-3 h-3" /> +12%
                            </span>
                        </div>
                        <div class="flex items-end justify-between h-20 gap-2">
                            {#each [40, 65, 45, 80, 60, 90, 100] as height}
                                <div class="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md" style="height: {height}%"></div>
                            {/each}
                        </div>
                    </div>

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

                <div class="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2">
                    <Gift class="w-4 h-4" />
                    <span>GRATIS!</span>
                </div>
                
                <div class="absolute -bottom-3 -left-3 bg-white border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg shadow-lg text-xs font-semibold">
                    ✓ Tanpa Kartu Kredit
                </div>
            </div>
        </div>
    </div>
</section>
{/if}

<!-- ============================================ -->
<!-- STATS SECTION -->
<!-- ============================================ -->
{#if sections.stats?.visible !== false && stats.length > 0}
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
{/if}

<!-- ============================================ -->
<!-- FEATURES SECTION -->
<!-- ============================================ -->
{#if sections.features?.visible !== false && features.length > 0}
<section id="fitur" class="py-16 lg:py-24 bg-slate-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-12">
            <span class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                <Sparkles class="w-4 h-4" />
                Fitur Lengkap
            </span>
            <h2 class="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
                Semua yang Anda Butuhkan
            </h2>
            <p class="text-slate-600">
                Fitur-fitur lengkap untuk mengelola bisnis UMKM Anda - GRATIS!
            </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {#each features as feature}
                <div class="group p-6 bg-white rounded-2xl border border-slate-100 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
                    <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:scale-110 transition-all">
                        <svelte:component this={getIcon(feature.icon)} class="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 class="text-lg font-semibold text-slate-800 mb-2">{feature.title}</h3>
                    <p class="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                    {#if feature.badge}
                    <div class="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <Check class="w-3 h-3" />
                        <span>{feature.badge}</span>
                    </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
</section>
{/if}

<!-- ============================================ -->
<!-- PRICING SECTION -->
<!-- ============================================ -->
{#if sections.pricing?.visible !== false && pricing.length > 0}
<section id="harga" class="py-16 lg:py-24 bg-white">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-12">
            <span class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
                <Gift class="w-4 h-4" />
                100% Gratis
            </span>
            <h2 class="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
                Semua Fitur Gratis!
            </h2>
            <p class="text-slate-600">
                Tidak ada biaya tersembunyi. Gunakan semua fitur tanpa batas.
            </p>
        </div>

        <div class="max-w-lg mx-auto">
            {#each pricing as plan}
                <div class="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/30">
                    <div class="absolute inset-0 overflow-hidden rounded-3xl">
                        <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
                        <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full"></div>
                    </div>
                    
                    <div class="relative">
                        <div class="text-center mb-8">
                            {#if plan.badge}
                            <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-white/90 text-sm font-medium mb-4">
                                <Sparkles class="w-4 h-4" />
                                <span>{plan.badge}</span>
                            </div>
                            {/if}
                            <h3 class="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                            <div class="flex items-baseline justify-center gap-1">
                                <span class="text-4xl sm:text-5xl font-bold text-white">{formatPrice(plan.price)}</span>
                                <span class="text-white/80 text-lg">/{plan.period}</span>
                            </div>
                            {#if plan.description}
                            <p class="text-white/80 text-sm mt-2">{plan.description}</p>
                            {/if}
                        </div>

                        <!-- [FIX] Responsive pricing features grid -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                            {#each plan.features || [] as feature}
                                <div class="flex items-center gap-2 text-white">
                                    <div class="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Check class="w-3 h-3" />
                                    </div>
                                    <span class="text-sm">{feature.feature_text}</span>
                                </div>
                            {/each}
                        </div>

                        <a 
                            href={plan.cta_link || '/register'}
                            class="block w-full py-4 rounded-xl font-bold text-center text-lg transition-all bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg"
                        >
                            {plan.cta_text || 'Daftar Gratis'}
                        </a>

                        <p class="text-center text-white/70 text-sm mt-4">
                            ✓ Tidak perlu kartu kredit • ✓ Setup 2 menit
                        </p>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</section>
{/if}

<!-- ============================================ -->
<!-- TESTIMONIALS SECTION - RESPONSIVE SLIDER -->
<!-- ============================================ -->
{#if sections.testimonials?.visible !== false}
<section id="testimoni" class="py-16 lg:py-24 bg-slate-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
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

        {#if visibleTestimonials.length > 0}
            <!-- [FIX] Slider Container dengan swipe support -->
            <div 
                class="relative"
                on:touchstart={handleTouchStart}
                on:touchend={handleTouchEnd}
            >
                <!-- [FIX] Navigation Button Left - Hidden di mobile, gunakan swipe -->
                <button 
                    on:click={prevSlide}
                    class="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 lg:-translate-x-4 z-10
                           w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-full shadow-lg border border-slate-200
                           items-center justify-center
                           hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-xl
                           transition-all duration-200 group"
                    aria-label="Previous testimonials"
                >
                    <ChevronLeft class="w-5 h-5 lg:w-6 lg:h-6 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                </button>

                <!-- Testimonial Cards -->
                <div class="overflow-hidden px-1 sm:px-2">
                    <div 
                        class="grid gap-4 sm:gap-6 transition-all duration-500 ease-in-out"
                        class:grid-cols-1={itemsPerView === 1}
                        class:grid-cols-2={itemsPerView === 2}
                        class:grid-cols-3={itemsPerView === 3}
                    >
                        {#each currentTestimonials as testimonial (testimonial.id || testimonial.name)}
                            <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 hover:shadow-lg hover:border-emerald-100 transition-all duration-300">
                                <!-- Quote Icon -->
                                <Quote class="w-8 h-8 text-emerald-200 mb-4" />
                                
                                <!-- Testimonial Text -->
                                <p class="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-4">
                                    "{testimonial.testimonial}"
                                </p>
                                
                                <!-- Author Info -->
                                <div class="flex items-center gap-3">
                                    <div class="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                                        {testimonial.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p class="font-semibold text-slate-800 text-sm truncate">{testimonial.name}</p>
                                        <p class="text-slate-500 text-xs truncate">{testimonial.business_name}</p>
                                        {#if testimonial.location}
                                            <p class="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                                                <MapPin class="w-3 h-3 flex-shrink-0" />
                                                <span class="truncate">{testimonial.location}</span>
                                            </p>
                                        {/if}
                                    </div>
                                </div>
                                
                                <!-- Rating Stars -->
                                <div class="flex gap-0.5 mt-4 pt-4 border-t border-slate-100">
                                    {#each Array(5) as _, i}
                                        <Star class="w-4 h-4 {i < (testimonial.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}" />
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- [FIX] Navigation Button Right - Hidden di mobile -->
                <button 
                    on:click={nextSlide}
                    class="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 lg:translate-x-4 z-10
                           w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-full shadow-lg border border-slate-200
                           items-center justify-center
                           hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-xl
                           transition-all duration-200 group"
                    aria-label="Next testimonials"
                >
                    <ChevronRight class="w-5 h-5 lg:w-6 lg:h-6 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                </button>
            </div>

            <!-- Pagination Dots & Counter -->
            {#if totalSlides > 1}
                <div class="flex flex-col items-center gap-3 mt-8">
                    <!-- Dots -->
                    <div class="flex items-center gap-2">
                        {#each Array(totalSlides) as _, index}
                            <button
                                on:click={() => goToSlide(index)}
                                class="w-2.5 h-2.5 rounded-full transition-all duration-300
                                       {currentSlide === index 
                                           ? 'bg-emerald-500 w-8' 
                                           : 'bg-slate-300 hover:bg-slate-400'}"
                                aria-label="Go to slide {index + 1}"
                            ></button>
                        {/each}
                    </div>
                    
                    <!-- Counter Text -->
                    <p class="text-sm text-slate-500">
                        Menampilkan {currentSlide * itemsPerView + 1}-{Math.min((currentSlide + 1) * itemsPerView, visibleTestimonials.length)} dari {visibleTestimonials.length} testimoni
                    </p>
                    
                    <!-- [FIX] Swipe hint untuk mobile -->
                    <p class="text-xs text-slate-400 sm:hidden">
                        ← Geser untuk melihat lainnya →
                    </p>
                </div>
            {/if}

        {:else}
            <!-- Empty State -->
            <div class="text-center py-12">
                <MessageCircle class="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p class="text-slate-500">Belum ada testimoni</p>
            </div>
        {/if}

        <!-- Submit Testimonial Button -->
        <div class="text-center mt-10">
            <button 
                on:click={() => showTestimonialForm = true}
                class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 
                       text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 
                       transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
                <Plus class="w-5 h-5" />
                Bagikan Pengalaman Anda
            </button>
            <p class="text-sm text-slate-500 mt-3">Sudah menggunakan POSKasir? Ceritakan pengalaman Anda!</p>
        </div>
    </div>
</section>
{/if}

<!-- ============================================ -->
<!-- TESTIMONIAL FORM MODAL - RESPONSIVE -->
<!-- ============================================ -->
{#if showTestimonialForm}
<div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm" on:click={closeTestimonialModal}></div>
    
    <!-- Modal -->
    <div class="relative min-h-screen flex items-center justify-center p-4">
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            
            {#if showSuccess}
                <!-- Success State -->
                <div class="p-8 text-center">
                    <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle class="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 class="text-xl font-bold text-slate-800 mb-2">Terima Kasih!</h3>
                    <p class="text-slate-600 mb-6">
                        Testimoni Anda telah dikirim dan sedang menunggu persetujuan admin.
                    </p>
                    <button
                        on:click={closeTestimonialModal}
                        class="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700"
                    >
                        Tutup
                    </button>
                </div>
            {:else}
                <!-- Header -->
                <div class="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-2xl">
                    <button 
                        on:click={closeTestimonialModal}
                        class="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X class="w-5 h-5 text-white" />
                    </button>
                    <h3 class="text-xl font-bold text-white">Bagikan Pengalaman Anda</h3>
                    <p class="text-emerald-100 text-sm mt-1">Ceritakan bagaimana POSKasir membantu bisnis Anda</p>
                </div>
                
                <!-- Form -->
                <form on:submit={submitTestimonial} class="p-6 space-y-4">
                    <!-- [FIX] Error Message -->
                    {#if formError}
                        <div class="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                            <X class="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{formError}</span>
                        </div>
                    {/if}
                    
                    <!-- Rating -->
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Rating *</label>
                        <div class="flex items-center gap-1">
                            {#each [1, 2, 3, 4, 5] as star}
                                <button
                                    type="button"
                                    on:click={() => rating = star}
                                    on:mouseenter={() => hoverRating = star}
                                    on:mouseleave={() => hoverRating = 0}
                                    class="p-1 transition-transform hover:scale-110"
                                >
                                    <Star 
                                        class="w-7 h-7 {(hoverRating || rating) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}"
                                    />
                                </button>
                            {/each}
                            <span class="ml-2 text-sm text-slate-500">
                                {rating === 5 ? 'Sangat Baik!' : rating === 4 ? 'Baik' : rating === 3 ? 'Cukup' : rating === 2 ? 'Kurang' : 'Buruk'}
                            </span>
                        </div>
                    </div>
                    
                    <!-- [FIX] Name & Role - Responsive grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap *</label>
                            <div class="relative">
                                <User class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    bind:value={testimonialForm.name}
                                    required
                                    class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Nama Anda"
                                />
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1.5">Jabatan</label>
                            <div class="relative">
                                <Briefcase class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    bind:value={testimonialForm.role}
                                    class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Pemilik / Manager"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <!-- [FIX] Business Name & Type - Responsive grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1.5">Nama Usaha *</label>
                            <div class="relative">
                                <Building2 class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    bind:value={testimonialForm.business_name}
                                    required
                                    class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Nama toko/usaha"
                                />
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1.5">Jenis Usaha</label>
                            <select
                                bind:value={testimonialForm.business_type}
                                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">Pilih jenis</option>
                                {#each businessTypes as type}
                                    <option value={type}>{type}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                    
                    <!-- [FIX] Email & Phone - Responsive grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                            <div class="relative">
                                <Mail class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    bind:value={testimonialForm.email}
                                    required
                                    class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="email@domain.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1.5">No. WhatsApp</label>
                            <div class="relative">
                                <Phone class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="tel"
                                    bind:value={testimonialForm.phone}
                                    class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="08xxxxxxxxxx"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <!-- Location -->
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1.5">Lokasi</label>
                        <div class="relative">
                            <MapPin class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                bind:value={testimonialForm.location}
                                class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Kota/Kabupaten"
                            />
                        </div>
                    </div>
                    
                    <!-- Testimonial -->
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1.5">Testimoni *</label>
                        <textarea
                            bind:value={testimonialForm.testimonial}
                            required
                            rows="4"
                            minlength="20"
                            maxlength="500"
                            class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            placeholder="Ceritakan pengalaman Anda menggunakan POSKasir..."
                        ></textarea>
                        <p class="text-xs text-slate-400 mt-1 text-right">{testimonialForm.testimonial.length}/500</p>
                    </div>
                    
                    <!-- Note -->
                    <div class="p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
                        💡 Testimoni Anda akan ditampilkan setelah disetujui oleh admin.
                    </div>
                    
                    <!-- Submit -->
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        class="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold 
                               rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all
                               disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {#if isSubmitting}
                            <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Mengirim...
                        {:else}
                            <Send class="w-5 h-5" />
                            Kirim Testimoni
                        {/if}
                    </button>
                </form>
            {/if}
        </div>
    </div>
</div>
{/if}

<!-- ============================================ -->
<!-- FAQ SECTION -->
<!-- ============================================ -->
{#if sections.faq?.visible !== false && faq.length > 0}
<section id="faq" class="py-16 lg:py-24 bg-white">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
            <span class="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                FAQ
            </span>
            <h2 class="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
                Pertanyaan Umum
            </h2>
        </div>

        <div class="space-y-3">
            {#each faq as item, index}
                <div class="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                        on:click={() => toggleFaq(index)}
                        class="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-slate-50 transition-colors"
                    >
                        <span class="font-medium text-slate-800 pr-4">{item.question}</span>
                        {#if openFaqIndex === index}
                            <ChevronUp class="w-5 h-5 text-slate-400 flex-shrink-0" />
                        {:else}
                            <ChevronDown class="w-5 h-5 text-slate-400 flex-shrink-0" />
                        {/if}
                    </button>
                    {#if openFaqIndex === index}
                        <div class="px-4 pb-4 text-slate-600 text-sm">
                            {item.answer}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
</section>
{/if}

<!-- ============================================ -->
<!-- CTA SECTION -->
<!-- ============================================ -->
{#if sections.cta?.visible !== false}
<section class="py-16 lg:py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
    <div class="absolute inset-0">
        <div class="absolute top-0 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
    </div>

    <div class="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {#if cta.badge_text}
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-semibold mb-6">
            <Gift class="w-4 h-4" />
            <span>{cta.badge_text}</span>
        </div>
        {/if}
        
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            {cta.title || 'Siap Memulai?'}
        </h2>
        <p class="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            {cta.description || 'Bergabung dengan ribuan UMKM yang sudah sukses!'}
        </p>
        
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <a 
                href={cta.primary_btn_link || '/register'}
                class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-bold shadow-lg shadow-emerald-500/25 group text-lg"
            >
                <Gift class="w-5 h-5" />
                <span>{cta.primary_btn_text || 'Daftar Gratis'}</span>
                <ArrowRight class="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </a>
            {#if cta.secondary_btn_text}
            <a 
                href={cta.secondary_btn_link || '#'}
                class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-semibold border border-white/20"
            >
                <MessageCircle class="w-5 h-5" />
                <span>{cta.secondary_btn_text}</span>
            </a>
            {/if}
        </div>
        
        {#if cta.show_trust_badges}
        <div class="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-slate-500 text-sm">
            <span class="flex items-center gap-1.5">
                <Check class="w-4 h-4 text-emerald-500" />
                {cta.trust_badge_1 || 'Gratis selamanya'}
            </span>
            <span class="flex items-center gap-1.5">
                <Check class="w-4 h-4 text-emerald-500" />
                {cta.trust_badge_2 || 'Tanpa kartu kredit'}
            </span>
            <span class="flex items-center gap-1.5">
                <Check class="w-4 h-4 text-emerald-500" />
                {cta.trust_badge_3 || 'Setup 2 menit'}
            </span>
        </div>
        {/if}
    </div>
</section>
{/if}

<style>
    /* Line clamp for testimonial text */
    .line-clamp-4 {
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>