<script>
    import { page } from '$app/stores';
    import { 
        Store, LayoutDashboard, Package, ShoppingCart, Receipt, 
        BarChart3, Settings, HelpCircle, LogOut, Menu, X, Bell,
        ChevronRight, User
    } from 'lucide-svelte';
    
    export let data;
    
    $: user = data?.user;
    
    let sidebarOpen = false;
    
    // Menu items untuk tenant
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/tenant/dashboard' },
        { icon: Package, label: 'Produk', href: '/tenant/produk' },
        { icon: ShoppingCart, label: 'Kasir', href: '/tenant/kasir' },
        { icon: Receipt, label: 'Transaksi', href: '/tenant/transaksi' },
        { icon: BarChart3, label: 'Laporan', href: '/tenant/laporan' },
        { icon: Settings, label: 'Pengaturan', href: '/tenant/pengaturan' },
    ];

    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
    }

    function closeSidebar() {
        sidebarOpen = false;
    }

    function getInitials(nama) {
        if (!nama) return 'U';
        return nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    // Check if current path matches menu item
    function isActive(href) {
        return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
    }
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="flex min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans']">
    
    <!-- Overlay untuk mobile -->
    {#if sidebarOpen}
        <button 
            class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
            on:click={closeSidebar}
            aria-label="Close sidebar"
        ></button>
    {/if}

    <!-- Sidebar -->
    <aside 
        class="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-out flex flex-col
               {sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0"
    >
        <!-- Logo & Nama Toko -->
        <div class="p-4 border-b border-slate-100">
            <div class="flex items-center gap-3 p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl">
                <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Store class="w-5 h-5 text-white" />
                </div>
                <div class="flex-1 min-w-0">
                    <h1 class="font-semibold text-white text-sm truncate">{user?.nama_bisnis || 'Toko Saya'}</h1>
                    <p class="text-xs text-emerald-100 truncate">{user?.kode_pelanggan || 'Tenant'}</p>
                </div>
            </div>
        </div>
        
        <!-- Menu -->
        <nav class="flex-1 p-3 overflow-y-auto">
            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">Menu Utama</p>
            <div class="space-y-1">
                {#each menuItems as item}
                    <a 
                        href={item.href}
                        on:click={closeSidebar}
                        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                               {isActive(item.href) 
                                   ? 'bg-emerald-50 text-emerald-700' 
                                   : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}"
                    >
                        <svelte:component 
                            this={item.icon} 
                            class="w-5 h-5 {isActive(item.href) ? 'text-emerald-600' : 'text-slate-400'}" 
                        />
                        <span>{item.label}</span>
                        {#if isActive(item.href)}
                            <ChevronRight class="w-4 h-4 ml-auto text-emerald-400" />
                        {/if}
                    </a>
                {/each}
            </div>
        </nav>

        <!-- Help Card -->
        <div class="p-3">
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div class="flex items-center gap-2 mb-2">
                    <HelpCircle class="w-4 h-4 text-emerald-600" />
                    <span class="text-sm font-semibold text-slate-700">Butuh Bantuan?</span>
                </div>
                <p class="text-xs text-slate-500 mb-3">Tim support siap membantu Anda</p>
                <a 
                    href="https://wa.me/6281234567890" 
                    target="_blank"
                    class="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                    <span>Hubungi WhatsApp</span>
                    <ChevronRight class="w-3 h-3" />
                </a>
            </div>
        </div>
        
        <!-- User Info -->
        <div class="p-3 border-t border-slate-100">
            <div class="flex items-center gap-3 p-2 mb-2">
                <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-500/20">
                    {getInitials(user?.nama)}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-slate-800 text-sm truncate">{user?.nama || 'User'}</p>
                    <p class="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                </div>
            </div>
            <form method="POST" action="/logout">
                <button 
                    type="submit"
                    class="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                    <LogOut class="w-4 h-4" />
                    <span>Keluar</span>
                </button>
            </form>
        </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-h-screen">
        <!-- Header -->
        <header class="bg-white border-b border-slate-200 px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-30">
            <!-- Left: Hamburger + Breadcrumb -->
            <div class="flex items-center gap-3">
                <button 
                    on:click={toggleSidebar}
                    class="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
                    aria-label="Toggle menu"
                >
                    {#if sidebarOpen}
                        <X class="w-5 h-5 text-slate-600" />
                    {:else}
                        <Menu class="w-5 h-5 text-slate-600" />
                    {/if}
                </button>
                
                <div class="hidden sm:flex items-center gap-2 text-sm">
                    <Store class="w-4 h-4 text-emerald-600" />
                    <span class="font-medium text-slate-800">{user?.nama_bisnis || 'Toko Saya'}</span>
                </div>
            </div>
            
            <!-- Right: Actions -->
            <div class="flex items-center gap-2">
                <!-- Quick Kasir Button -->
                <a 
                    href="/tenant/kasir"
                    class="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm shadow-emerald-500/20"
                >
                    <ShoppingCart class="w-4 h-4" />
                    <span>Kasir</span>
                </a>
                
                <!-- Notifications -->
                <button class="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                    <Bell class="w-5 h-5" />
                    <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                <!-- User Avatar (Mobile) -->
                <div class="lg:hidden w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(user?.nama)}
                </div>
            </div>
        </header>
        
        <!-- Page Content -->
        <main class="flex-1 p-4 lg:p-6">
            <slot />
        </main>

        <!-- Footer -->
        <footer class="bg-white border-t border-slate-100 px-4 py-3 text-center">
            <p class="text-xs text-slate-500">
                © 2024 POSKasir · Powered by Neuversity
            </p>
        </footer>
    </div>
</div>