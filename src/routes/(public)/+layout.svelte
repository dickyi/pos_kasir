<script>
     import '../../app.css';
    
    // State untuk mobile menu
    let mobileMenuOpen = false;
    
    // Menu navigasi
    const navLinks = [
        { label: 'Beranda', href: '/' },
        { label: 'Fitur', href: '/#fitur' },
        { label: 'Harga', href: '/#harga' },
        { label: 'Tentang', href: '/#tentang' },
    ];

    function toggleMobileMenu() {
        mobileMenuOpen = !mobileMenuOpen;
    }

    function closeMobileMenu() {
        mobileMenuOpen = false;
    }
</script>

<div class="min-h-screen flex flex-col bg-white">
    
    <!-- ============================================ -->
    <!-- NAVBAR -->
    <!-- ============================================ -->
    <nav class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                
                <!-- Logo -->
                <a href="/" class="flex items-center gap-2">
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                        <span class="text-white text-lg font-bold">P</span>
                    </div>
                    <div>
                        <span class="font-bold text-gray-900 text-lg">POSKasir</span>
                        <span class="hidden sm:inline text-xs text-gray-500 ml-1">untuk UMKM</span>
                    </div>
                </a>

                <!-- Desktop Menu -->
                <div class="hidden md:flex items-center gap-8">
                    {#each navLinks as link}
                        <a 
                            href={link.href} 
                            class="text-gray-600 hover:text-blue-600 font-medium transition-colors text-sm"
                        >
                            {link.label}
                        </a>
                    {/each}
                </div>

                <!-- Desktop CTA Buttons -->
                <div class="hidden md:flex items-center gap-3">
                    <a 
                        href="/login" 
                        class="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm"
                    >
                        Masuk
                    </a>
                    <a 
                        href="/register" 
                        class="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        Daftar Gratis
                    </a>
                </div>

                <!-- Mobile Menu Button -->
                <button 
                    on:click={toggleMobileMenu}
                    class="md:hidden p-2 text-gray-600 hover:text-gray-900"
                >
                    {#if mobileMenuOpen}
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    {:else}
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    {/if}
                </button>
            </div>
        </div>

        <!-- Mobile Menu Dropdown -->
        {#if mobileMenuOpen}
            <div class="md:hidden border-t border-gray-100 bg-white">
                <div class="px-4 py-3 space-y-1">
                    {#each navLinks as link}
                        <a 
                            href={link.href}
                            on:click={closeMobileMenu}
                            class="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg font-medium"
                        >
                            {link.label}
                        </a>
                    {/each}
                    <hr class="my-2 border-gray-100">
                    <a 
                        href="/login"
                        on:click={closeMobileMenu}
                        class="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg font-medium"
                    >
                        Masuk
                    </a>
                    <a 
                        href="/register"
                        on:click={closeMobileMenu}
                        class="block px-3 py-2.5 bg-blue-600 text-white rounded-lg text-center font-medium mt-2"
                    >
                        Daftar Gratis
                    </a>
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
    <footer class="bg-gray-900 text-gray-400">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                
                <!-- Brand -->
                <div class="md:col-span-2">
                    <div class="flex items-center gap-2 mb-4">
                        <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <span class="text-white text-lg font-bold">P</span>
                        </div>
                        <span class="font-bold text-white text-lg">POSKasir</span>
                    </div>
                    <p class="text-sm leading-relaxed max-w-md">
                        Solusi Point of Sale modern untuk UMKM Indonesia. 
                        Kelola bisnis Anda dengan mudah, cepat, dan efisien.
                    </p>
                    <div class="flex gap-4 mt-4">
                        <a href="#" class="hover:text-white transition-colors">
                            <span class="text-xl">📘</span>
                        </a>
                        <a href="#" class="hover:text-white transition-colors">
                            <span class="text-xl">📸</span>
                        </a>
                        <a href="#" class="hover:text-white transition-colors">
                            <span class="text-xl">🐦</span>
                        </a>
                    </div>
                </div>

                <!-- Links -->
                <div>
                    <h4 class="text-white font-semibold mb-4">Produk</h4>
                    <ul class="space-y-2 text-sm">
                        <li><a href="/#fitur" class="hover:text-white transition-colors">Fitur</a></li>
                        <li><a href="/#harga" class="hover:text-white transition-colors">Harga</a></li>
                        <li><a href="/register" class="hover:text-white transition-colors">Daftar</a></li>
                        <li><a href="/login" class="hover:text-white transition-colors">Masuk</a></li>
                    </ul>
                </div>

                <!-- Contact -->
                <div>
                    <h4 class="text-white font-semibold mb-4">Kontak</h4>
                    <ul class="space-y-2 text-sm">
                        <li class="flex items-center gap-2">
                            <span>📧</span>
                            <span>support@poskasir.com</span>
                        </li>
                        <li class="flex items-center gap-2">
                            <span>📞</span>
                            <span>0812-3456-7890</span>
                        </li>
                        <li class="flex items-center gap-2">
                            <span>📍</span>
                            <span>Jakarta, Indonesia</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Bottom Footer -->
            <div class="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p class="text-sm">
                    © 2026 POSKasir. Dibuat oleh Neuversity Engineering.
                </p>
                <div class="flex gap-6 text-sm">
                    <a href="#" class="hover:text-white transition-colors">Kebijakan Privasi</a>
                    <a href="#" class="hover:text-white transition-colors">Syarat & Ketentuan</a>
                </div>
            </div>
        </div>
    </footer>
</div>