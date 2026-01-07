<script>
    import '../../app.css';
    
    // Data dari server (user session)
    export let data;
    
    // User yang sedang login
    $: user = data?.user;
    
    // State untuk toggle sidebar di mobile
    let sidebarOpen = false;
    
    // Menu items
    let menuItems = [
        { icon: '📊', label: 'Dashboard', href: '/dashboard' },
        { icon: '👥', label: 'Pelanggan', href: '/pelanggan' },
        { icon: '📁', label: 'Kategori', href: '/kategori' },
        { icon: '📦', label: 'Produk', href: '/produk' },
        { icon: '🛒', label: 'Transaksi', href: '/transaksi' },
        { icon: '📋', label: 'Laporan', href: '/laporan' },
    ];

    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
    }

    function closeSidebar() {
        sidebarOpen = false;
    }

    // Get initial dari nama untuk avatar
    function getInitials(nama) {
        if (!nama) return 'U';
        return nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
</script>

<div class="flex min-h-screen bg-gray-50">
    
    <!-- Overlay untuk mobile -->
    {#if sidebarOpen}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div 
            class="fixed inset-0 bg-black/50 z-40 lg:hidden"
            on:click={closeSidebar}
            on:keydown={(e) => e.key === 'Escape' && closeSidebar()}
            role="button"
            tabindex="0"
        ></div>
    {/if}

    <!-- Sidebar -->
    <aside 
        class="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
               {sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0"
    >
        <!-- Logo -->
        <div class="p-5 border-b border-gray-200">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <span class="text-white text-lg font-bold">P</span>
                </div>
                <div>
                    <h1 class="text-lg font-bold text-gray-800">POSKasir</h1>
                    <p class="text-xs text-gray-500">Panel Super Admin</p>
                </div>
            </div>
        </div>
        
        <!-- Menu -->
        <nav class="p-4">
            <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 px-4">Menu Utama</p>
            {#each menuItems as item}
                <a 
                    href={item.href}
                    on:click={closeSidebar}
                    class="flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                    <span class="text-lg">{item.icon}</span>
                    <span class="font-medium">{item.label}</span>
                </a>
            {/each}
        </nav>
        
        <!-- User Info di bawah -->
        <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(user?.nama)}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-800 text-sm truncate">{user?.nama || 'User'}</p>
                    <p class="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                </div>
            </div>
            <form method="POST" action="/logout">
                <button 
                    type="submit"
                    class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                    <span>🚪</span>
                    <span>Logout</span>
                </button>
            </form>
        </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-h-screen lg:ml-0">
        <!-- Header -->
        <header class="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex justify-between items-center sticky top-0 z-30">
            <!-- Tombol Hamburger (Mobile) -->
            <button 
                on:click={toggleSidebar}
                class="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>
            
            <div class="flex-1 lg:flex-none">
                <!-- Bisa ditambah breadcrumb atau search -->
            </div>
            
            <!-- Profile -->
            <div class="flex items-center gap-4">
                <!-- Notifications -->
                <button class="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <span class="text-xl">🔔</span>
                    <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                <!-- User Info -->
                <div class="hidden sm:flex items-center gap-3">
                    <div class="text-right">
                        <p class="text-sm font-medium text-gray-800">{user?.nama || 'User'}</p>
                        <p class="text-xs text-gray-500">{user?.role === 'admin' ? 'Super Admin' : 'Tenant'}</p>
                    </div>
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {getInitials(user?.nama)}
                    </div>
                </div>
            </div>
        </header>
        
        <!-- Page Content -->
        <main class="flex-1 p-4 lg:p-6">
            <slot />
        </main>

        <!-- Footer -->
        <footer class="bg-white border-t border-gray-200 px-4 py-3 text-center text-sm text-gray-500">
            © 2026 POSKasir - Neuversity Engineering
        </footer>
    </div>
</div>