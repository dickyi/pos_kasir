<script>
    import '../../app.css';
    import { Store, Menu, X, Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-svelte';
    import { slide, fade } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    
    export let data;
    
    // Get settings dari server
    $: settings = data?.settings || {};
    
    let mobileMenuOpen = false;
    
    // [FIX] Tahun dinamis
    const currentYear = new Date().getFullYear();
    
    const navLinks = [
        { label: 'Beranda', href: '/' },
        { label: 'Fitur', href: '/#fitur' },
        { label: 'Gratis', href: '/#harga' },
        { label: 'Testimoni', href: '/#testimoni' },
    ];

    function toggleMobileMenu() {
        mobileMenuOpen = !mobileMenuOpen;
    }

    function closeMobileMenu() {
        mobileMenuOpen = false;
    }
    
    // [FIX] Helper untuk cek apakah social link valid
    function isValidUrl(url) {
        return url && url !== '#' && url.trim() !== '';
    }
</script>

<svelte:head>
    <!-- [FIX] Preload font untuk performa lebih baik -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen flex flex-col bg-slate-50 font-['Plus_Jakarta_Sans']">
    
    <!-- ============================================ -->
    <!-- NAVBAR -->
    <!-- ============================================ -->
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                
                <!-- Logo -->
                <a href="/" class="flex items-center gap-2.5">
                    <div class="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
                        <Store class="w-5 h-5 text-white" />
                    </div>
                    <div class="flex flex-col">
                        <span class="font-bold text-slate-800 text-lg tracking-tight leading-tight">{settings.app_name || 'POSKasir'}</span>
                        <span class="text-[10px] text-emerald-600 font-medium -mt-0.5">100% GRATIS</span>
                    </div>
                </a>

                <!-- Desktop Menu -->
                <div class="hidden md:flex items-center gap-1">
                    {#each navLinks as link}
                        <a 
                            href={link.href} 
                            class="px-4 py-2 text-slate-600 hover:text-emerald-600 font-medium transition-colors text-sm rounded-lg hover:bg-slate-50"
                        >
                            {link.label}
                        </a>
                    {/each}
                </div>

                <!-- Desktop CTA Buttons -->
                <div class="hidden md:flex items-center gap-2">
                    <a 
                        href="/login" 
                        class="px-4 py-2 text-slate-600 hover:text-emerald-600 font-medium transition-colors text-sm"
                    >
                        Masuk
                    </a>
                    <a 
                        href="/register" 
                        class="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-semibold shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30"
                    >
                        Daftar Gratis
                    </a>
                </div>

                <!-- Mobile Menu Button -->
                <button 
                    on:click={toggleMobileMenu}
                    class="md:hidden p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                    aria-expanded={mobileMenuOpen}
                >
                    {#if mobileMenuOpen}
                        <X class="w-5 h-5" />
                    {:else}
                        <Menu class="w-5 h-5" />
                    {/if}
                </button>
            </div>
        </div>

        <!-- [FIX] Mobile Menu Dropdown dengan animasi transisi -->
        {#if mobileMenuOpen}
            <div 
                class="md:hidden border-t border-slate-100 bg-white"
                transition:slide={{ duration: 300, easing: quintOut }}
            >
                <div class="px-4 py-3 space-y-1">
                    {#each navLinks as link, index}
                        <a 
                            href={link.href}
                            on:click={closeMobileMenu}
                            class="block px-4 py-2.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                            in:fade={{ delay: index * 50, duration: 200 }}
                        >
                            {link.label}
                        </a>
                    {/each}
                    <div class="pt-3 mt-3 border-t border-slate-100 space-y-2">
                        <a 
                            href="/login"
                            on:click={closeMobileMenu}
                            class="block px-4 py-2.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 rounded-lg font-medium text-center transition-colors"
                            in:fade={{ delay: navLinks.length * 50, duration: 200 }}
                        >
                            Masuk
                        </a>
                        <a 
                            href="/register"
                            on:click={closeMobileMenu}
                            class="block px-4 py-3 bg-emerald-600 text-white rounded-lg text-center font-semibold hover:bg-emerald-700 transition-colors"
                            in:fade={{ delay: (navLinks.length + 1) * 50, duration: 200 }}
                        >
                            Daftar Gratis
                        </a>
                    </div>
                </div>
            </div>
        {/if}
    </nav>

    <!-- ============================================ -->
    <!-- MAIN CONTENT -->
    <!-- ============================================ -->
    <main class="flex-1">
        <slot />
    </main>

    <!-- ============================================ -->
    <!-- FOOTER -->
    <!-- ============================================ -->
    <footer class="bg-slate-900">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                
                <!-- Brand -->
                <div class="sm:col-span-2 lg:col-span-1">
                    <div class="flex items-center gap-2.5 mb-4">
                        <div class="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                            <Store class="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span class="font-bold text-white text-lg">{settings.app_name || 'POSKasir'}</span>
                            <span class="block text-[10px] text-emerald-400">GRATIS SELAMANYA</span>
                        </div>
                    </div>
                    <p class="text-slate-400 text-sm leading-relaxed mb-4">
                        {settings.app_tagline || 'Solusi kasir modern GRATIS untuk UMKM Indonesia. Kelola bisnis lebih mudah dan efisien.'}
                    </p>
                    
                    <!-- [FIX] Social links - hanya tampilkan jika URL valid -->
                    <div class="flex gap-3">
                        {#if isValidUrl(settings.social_facebook)}
                            <a 
                                href={settings.social_facebook} 
                                target="_blank"
                                rel="noopener noreferrer"
                                class="w-9 h-9 bg-slate-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all"
                                aria-label="Facebook"
                            >
                                <Facebook class="w-4 h-4" />
                            </a>
                        {/if}
                        {#if isValidUrl(settings.social_instagram)}
                            <a 
                                href={settings.social_instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="w-9 h-9 bg-slate-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all"
                                aria-label="Instagram"
                            >
                                <Instagram class="w-4 h-4" />
                            </a>
                        {/if}
                        {#if isValidUrl(settings.social_twitter)}
                            <a 
                                href={settings.social_twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="w-9 h-9 bg-slate-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all"
                                aria-label="Twitter"
                            >
                                <Twitter class="w-4 h-4" />
                            </a>
                        {/if}
                        
                        <!-- Fallback jika tidak ada social links -->
                        {#if !isValidUrl(settings.social_facebook) && !isValidUrl(settings.social_instagram) && !isValidUrl(settings.social_twitter)}
                            <span class="text-slate-500 text-sm">Segera hadir</span>
                        {/if}
                    </div>
                </div>

                <!-- Links -->
                <div>
                    <h4 class="text-white font-semibold mb-4 text-sm">Produk</h4>
                    <ul class="space-y-2.5">
                        <li><a href="/#fitur" class="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Fitur</a></li>
                        <li><a href="/#harga" class="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Gratis</a></li>
                        <li><a href="/register" class="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Daftar</a></li>
                        <li><a href="/login" class="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Masuk</a></li>
                    </ul>
                </div>

                <!-- Support -->
                <div>
                    <h4 class="text-white font-semibold mb-4 text-sm">Bantuan</h4>
                    <ul class="space-y-2.5">
                        <li><a href="/#faq" class="text-slate-400 hover:text-emerald-400 transition-colors text-sm">FAQ</a></li>
                        <li><a href="/#testimoni" class="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Testimoni</a></li>
                        {#if settings.contact_whatsapp}
                            <li>
                                <a href="https://wa.me/{settings.contact_whatsapp}" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                                    Hubungi via WA
                                </a>
                            </li>
                        {/if}
                    </ul>
                </div>

                <!-- Contact -->
                <div>
                    <h4 class="text-white font-semibold mb-4 text-sm">Kontak</h4>
                    <ul class="space-y-3">
                        <li class="flex items-center gap-2.5 text-slate-400 text-sm">
                            <Mail class="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span class="break-all">{settings.contact_email || 'support@poskasir.com'}</span>
                        </li>
                        <li class="flex items-center gap-2.5 text-slate-400 text-sm">
                            <Phone class="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span>{settings.contact_phone || '0812-3456-7890'}</span>
                        </li>
                        <li class="flex items-start gap-2.5 text-slate-400 text-sm">
                            <MapPin class="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>{settings.contact_address || 'Jakarta, Indonesia'}</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Bottom Footer -->
            <div class="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p class="text-slate-500 text-sm">
                    <!-- [FIX] Tahun dinamis -->
                    © {currentYear} {settings.app_name || 'POSKasir'}. 100% Gratis untuk UMKM Indonesia.
                </p>
                <div class="flex gap-6 text-sm">
                    <a href="/privacy" class="text-slate-500 hover:text-emerald-400 transition-colors">Privasi</a>
                    <a href="/terms" class="text-slate-500 hover:text-emerald-400 transition-colors">Syarat</a>
                </div>
            </div>
        </div>
    </footer>
</div>