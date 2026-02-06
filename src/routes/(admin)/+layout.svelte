<script>
    import '../../app.css';
    import { page } from '$app/stores';
    import { slide } from 'svelte/transition';
    import {
        LayoutDashboard,
        Building2,
        Users,
        BarChart2,
        Menu,
        LogOut,
        Bell,
        Shield,
        Activity,
        HelpCircle,
        Database,
        Headphones,
        Megaphone,
        ChevronDown,
        Search,
        PieChart,
        Settings,
        Globe,
        Sliders,
        Mail,
        CreditCard,
        FileText,
        MessageSquare
    } from 'lucide-svelte';

    export let data;

    $: user = data?.user;

    let sidebarOpen = false;
    let settingsExpanded = false;

    // ============================================
    // MENU SUPER ADMIN
    // ============================================
    
    const mainMenuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
        { icon: Building2, label: 'Kelola Tenant', href: '/admin/tenant', badge: data?.pendingCount },
        { icon: PieChart, label: 'Status & Usage', href: '/admin/usage' },
        { icon: Users, label: 'Tim Admin', href: '/admin/tim-admin' },
    ];

    const reportMenuItems = [
        { icon: BarChart2, label: 'Laporan', href: '/admin/reports' },
        { icon: Activity, label: 'Audit Log', href: '/admin/audit' },
    ];

    const supportMenuItems = [
        { icon: Headphones, label: 'Support', href: '/admin/support', badge: data?.openTickets },
        { icon: Megaphone, label: 'Pengumuman', href: '/admin/announcements' },
    ];

    const settingsMenuItems = [
        { icon: Sliders, label: 'Umum', href: '/admin/settings' },
        { icon: Globe, label: 'Landing Page', href: '/admin/settings/landing' },
        { icon: MessageSquare, label: 'Testimonial', href: '/admin/settings/testimonial' },
        { icon: Mail, label: 'Email & Notifikasi', href: '/admin/settings/email' },
        { icon: CreditCard, label: 'Pembayaran', href: '/admin/settings/payment' },
        { icon: Database, label: 'Backup', href: '/admin/backup' },
        { icon: FileText, label: 'Legal', href: '/admin/settings/legal' },
        { icon: HelpCircle, label: 'Bantuan', href: '/admin/help' },
    ];

    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
    }

    function closeSidebar() {
        sidebarOpen = false;
    }

    function getInitials(nama) {
        if (!nama) return 'SA';
        return nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    function isActive(href, currentPath) {
        // Dashboard special case
        if (href === '/admin/dashboard') {
            return currentPath === '/admin/dashboard' || currentPath === '/admin';
        }
        
        // Settings Umum - HANYA exact match (tidak termasuk submenu)
        if (href === '/admin/settings') {
            return currentPath === '/admin/settings';
        }
        
        // Other routes - exact match or starts with (for true sub-routes)
        return currentPath === href || currentPath.startsWith(href + '/');
    }

    function isSettingsActive(currentPath) {
        return settingsMenuItems.some(item => isActive(item.href, currentPath));
    }

    function getRoleLabel(role) {
        const labels = {
            'super_admin': 'Super Admin',
            'admin': 'Admin',
            'support': 'Support'
        };
        return labels[role] || role;
    }

    function getPageTitle(path) {
        const titles = {
            '/admin/dashboard': 'Dashboard',
            '/admin/tenant': 'Kelola Tenant',
            '/admin/usage': 'Status & Usage',
            '/admin/tim-admin': 'Tim Admin',
            '/admin/reports': 'Laporan',
            '/admin/audit': 'Audit Log',
            '/admin/support': 'Support',
            '/admin/announcements': 'Pengumuman',
            '/admin/settings/landing': 'Pengaturan Landing Page',
            '/admin/settings/testimonial': 'Kelola Testimonial',
            '/admin/settings/email': 'Pengaturan Email',
            '/admin/settings/payment': 'Pengaturan Pembayaran',
            '/admin/settings/legal': 'Pengaturan Legal',
            '/admin/settings': 'Pengaturan Umum',
            '/admin/backup': 'Backup',
            '/admin/help': 'Bantuan'
        };
        
        for (const [key, value] of Object.entries(titles)) {
            if (path.startsWith(key)) return value;
        }
        return 'Admin';
    }

    $: if (isSettingsActive($page.url.pathname)) {
        settingsExpanded = true;
    }

    $: pageTitle = getPageTitle($page.url.pathname);
</script>

<!-- ============================================
MAIN CONTAINER - Fixed height to prevent scroll issues
============================================ -->
<div class="flex h-screen overflow-hidden bg-gray-50">

    <!-- Overlay mobile -->
    {#if sidebarOpen}
        <button
            class="fixed inset-0 bg-black/40 z-40 lg:hidden"
            on:click={closeSidebar}
            aria-label="Close sidebar"
        ></button>
    {/if}

    <!-- ============================================
    SIDEBAR - Completely fixed, independent of main scroll
    ============================================ -->
    <aside class="fixed lg:relative inset-y-0 left-0 z-50 w-64 
                  bg-white border-r border-gray-200 
                  transform transition-transform duration-200
                  {sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                  lg:translate-x-0 
                  flex flex-col h-screen">
        
        <!-- Logo - Fixed at Top -->
        <div class="flex-shrink-0 h-16 flex items-center gap-3 px-5 border-b border-gray-100">
            <div class="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center">
                <Shield size={18} class="text-white" />
            </div>
            <div>
                <p class="text-sm font-semibold text-gray-900">POS Platform</p>
                <p class="text-[11px] text-gray-400">Admin Panel</p>
            </div>
        </div>

        <!-- ============================================
        Navigation - Scrollable Area (Only this scrolls)
        ============================================ -->
        <nav class="flex-1 overflow-y-auto py-4 px-3 scrollbar-custom">
            
            <!-- Menu Utama -->
            <div class="mb-5">
                <p class="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2 px-3">Menu</p>
                <div class="space-y-0.5">
                    {#each mainMenuItems as item}
                        <a
                            href={item.href}
                            on:click={closeSidebar}
                            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200
                                   {isActive(item.href, $page.url.pathname)
                                     ? 'bg-gray-900 text-white'
                                     : 'text-gray-600 hover:bg-gray-100'}"
                        >
                            {#if isActive(item.href, $page.url.pathname)}
                                <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r-full"></div>
                            {/if}
                            
                            <svelte:component this={item.icon} size={18} strokeWidth={1.5} />
                            <span class="flex-1">{item.label}</span>
                            {#if item.badge > 0}
                                <span class="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white">
                                    {item.badge}
                                </span>
                            {/if}
                        </a>
                    {/each}
                </div>
            </div>

            <!-- Laporan -->
            <div class="mb-5">
                <p class="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2 px-3">Laporan</p>
                <div class="space-y-0.5">
                    {#each reportMenuItems as item}
                        <a
                            href={item.href}
                            on:click={closeSidebar}
                            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200
                                   {isActive(item.href, $page.url.pathname)
                                     ? 'bg-gray-900 text-white'
                                     : 'text-gray-600 hover:bg-gray-100'}"
                        >
                            {#if isActive(item.href, $page.url.pathname)}
                                <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r-full"></div>
                            {/if}
                            
                            <svelte:component this={item.icon} size={18} strokeWidth={1.5} />
                            <span class="flex-1">{item.label}</span>
                        </a>
                    {/each}
                </div>
            </div>

            <!-- Support -->
            <div class="mb-5">
                <p class="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2 px-3">Support</p>
                <div class="space-y-0.5">
                    {#each supportMenuItems as item}
                        <a
                            href={item.href}
                            on:click={closeSidebar}
                            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200
                                   {isActive(item.href, $page.url.pathname)
                                     ? 'bg-gray-900 text-white'
                                     : 'text-gray-600 hover:bg-gray-100'}"
                        >
                            {#if isActive(item.href, $page.url.pathname)}
                                <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r-full"></div>
                            {/if}
                            
                            <svelte:component this={item.icon} size={18} strokeWidth={1.5} />
                            <span class="flex-1">{item.label}</span>
                            {#if item.badge > 0}
                                <span class="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white">
                                    {item.badge}
                                </span>
                            {/if}
                        </a>
                    {/each}
                </div>
            </div>

            <!-- Pengaturan dengan Submenu -->
            <div class="mb-3">
                <button
                    on:click={() => settingsExpanded = !settingsExpanded}
                    class="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-medium uppercase tracking-wider rounded-lg transition-colors
                           {isSettingsActive($page.url.pathname) ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}"
                >
                    <Settings size={14} />
                    <span class="flex-1 text-left">Pengaturan</span>
                    <ChevronDown size={14} class="transition-transform duration-200 {settingsExpanded ? 'rotate-180' : ''}" />
                </button>
                
                {#if settingsExpanded}
                    <div class="mt-1 ml-2 pl-3 border-l-2 border-gray-200" transition:slide={{ duration: 200 }}>
                        <div class="space-y-0.5">
                            {#each settingsMenuItems as item}
                                <a
                                    href={item.href}
                                    on:click={closeSidebar}
                                    class="group relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200
                                           {isActive(item.href, $page.url.pathname)
                                             ? 'bg-emerald-50 text-emerald-700'
                                             : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}"
                                >
                                    {#if isActive(item.href, $page.url.pathname)}
                                        <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-emerald-500 rounded-r-full"></div>
                                    {/if}
                                    
                                    <svelte:component this={item.icon} size={16} strokeWidth={1.5} />
                                    <span class="flex-1">{item.label}</span>
                                </a>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </nav>

        <!-- ============================================
        User Section - Sticky at Bottom (Inside Sidebar)
        ============================================ -->
        <div class="flex-shrink-0 border-t border-gray-100 bg-white">
            <div class="p-3">
                <!-- User Card -->
                <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 mb-2">
                    <div class="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {getInitials(user?.nama)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">{user?.nama || 'Admin'}</p>
                        <p class="text-[11px] text-gray-400">{getRoleLabel(user?.role)}</p>
                    </div>
                </div>
                
                <!-- Logout Button -->
                <form method="POST" action="/logout">
                    <button 
                        type="submit" 
                        class="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium
                               text-gray-600 hover:text-gray-900 hover:bg-gray-100 
                               rounded-lg transition-colors duration-200"
                    >
                        <LogOut size={16} />
                        <span>Keluar</span>
                    </button>
                </form>
            </div>
        </div>
    </aside>

    <!-- ============================================
    Main Content Area - This scrolls independently
    ============================================ -->
    <div class="flex-1 flex flex-col min-h-0 lg:ml-0">
        
        <!-- Header - Sticky at top of content area -->
        <header class="flex-shrink-0 h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center gap-4 sticky top-0 z-30">
            <button on:click={toggleSidebar} class="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Menu">
                <Menu size={20} class="text-gray-600" />
            </button>

            <h1 class="text-lg font-semibold text-gray-900">{pageTitle}</h1>
            
            <div class="flex-1"></div>

            <!-- Search -->
            <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg w-64">
                <Search size={16} class="text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Cari..." 
                    class="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400" 
                />
            </div>

            <!-- Notification -->
            <button class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative" aria-label="Notifikasi">
                <Bell size={20} />
                <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <!-- User (Desktop) -->
            <div class="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200">
                <div class="text-right">
                    <p class="text-sm font-medium text-gray-900">{user?.nama || 'Admin'}</p>
                    <p class="text-[11px] text-gray-400">{user?.email || ''}</p>
                </div>
                <div class="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {getInitials(user?.nama)}
                </div>
            </div>
        </header>

        <!-- Content - Scrollable Area -->
        <main class="flex-1 overflow-y-auto">
            <slot />
        </main>

        <!-- Footer -->
        <footer class="flex-shrink-0 h-12 bg-white border-t border-gray-200 flex items-center justify-center">
            <p class="text-xs text-gray-400">© 2026 POS Platform</p>
        </footer>
    </div>
</div>

<!-- ============================================
CUSTOM STYLES - AUTO-HIDE SCROLLBAR (MODERN & CLEAN)
============================================ -->
<style>
    /* Auto-hide scrollbar - Muncul hanya saat hover/scroll */
    .scrollbar-custom {
        scroll-behavior: smooth;
        scrollbar-width: thin; /* Firefox */
        scrollbar-color: transparent transparent; /* Firefox - hidden by default */
    }
    
    /* Show scrollbar on hover - Firefox */
    .scrollbar-custom:hover {
        scrollbar-color: #d1d5db transparent;
    }
    
    /* Webkit (Chrome, Safari, Edge) */
    .scrollbar-custom::-webkit-scrollbar {
        width: 6px;
    }
    
    .scrollbar-custom::-webkit-scrollbar-track {
        background: transparent;
    }
    
    .scrollbar-custom::-webkit-scrollbar-thumb {
        background: transparent; /* Hidden by default */
        border-radius: 3px;
        transition: background 0.3s ease;
    }
    
    /* Show scrollbar on hover or scroll */
    .scrollbar-custom:hover::-webkit-scrollbar-thumb,
    .scrollbar-custom:active::-webkit-scrollbar-thumb {
        background: #d1d5db;
    }
    
    .scrollbar-custom::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
    }
</style>