<!--
    +layout.svelte - Tenant Layout (REVISED + KAS SUBMENU + MONITORING KASIR)
    ================================================================
    REVISI:
    - Hapus info duplikat di header (nama toko, jam, user info)
    - Info user cukup di sidebar bagian logo/atas
    - Butuh Bantuan dipindah ke atas tombol Keluar
    - Layout lebih clean dan tidak redundant
    - Support Fullscreen Mode untuk Kasir
    - NEW: Submenu untuk Kasir (POS + Kas Masuk/Keluar)
    - NEW: Menu Monitoring Kasir (Overview + Riwayat Shift + Performa + Rekap Kas)
    - UPDATED: Fase 2 menu sudah aktif
-->
<script>
    import { page } from '$app/stores';
    import { fly, fade, slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { onMount, setContext } from 'svelte';
    import { writable } from 'svelte/store';
    import {
        Store, LayoutDashboard, Package, ShoppingCart, Receipt,
        BarChart3, Settings, HelpCircle, LogOut, Menu, X,
        ChevronRight, ChevronDown, FolderOpen, Clock, TrendingUp,
        MessageCircle, Moon, Sun, Zap, Users, Crown, UserCog, User,
        Tag, Wallet, ArrowDownCircle, ArrowUpCircle, Activity, History,
        Trophy, FileSpreadsheet
    } from 'lucide-svelte';

    // Import komponen notifikasi
    import NotificationDropdown from '$lib/components/tenant/NotificationDropdown.svelte';

    export let data;

    $: user = data?.user;
    $: tenantUser = data?.tenantUser;
    $: settings = data?.settings || {};

    // State
    let sidebarOpen = false;
    let darkMode = false;
    let mounted = false;
    let currentTime = '';
    let scrollY = 0;

    // Submenu state
    let expandedMenus = {};

    // ========================================
    // FULLSCREEN MODE STATE
    // ========================================
    const isFullscreen = writable(false);
    
    // Expose fullscreen store to child components
    setContext('fullscreenMode', {
        isFullscreen,
        enterFullscreen: () => isFullscreen.set(true),
        exitFullscreen: () => isFullscreen.set(false),
        toggleFullscreen: () => isFullscreen.update(v => !v)
    });

    // ========================================
    // MENU VISIBILITY FROM SETTINGS
    // ========================================
    
    const defaultMenuVisibility = {
        menu_dashboard: true,
        menu_produk: true,
        menu_kategori: true,
        menu_merk: false,
        menu_kasir: true,
        menu_transaksi: true,
        menu_laporan: true,
        menu_users: true,
        menu_pengaturan: true
    };

    $: menuVisibility = {
        menu_dashboard: settings?.menu_dashboard ?? defaultMenuVisibility.menu_dashboard,
        menu_produk: settings?.menu_produk ?? defaultMenuVisibility.menu_produk,
        menu_kategori: settings?.menu_kategori ?? defaultMenuVisibility.menu_kategori,
        menu_merk: settings?.menu_merk ?? defaultMenuVisibility.menu_merk,
        menu_kasir: settings?.menu_kasir ?? defaultMenuVisibility.menu_kasir,
        menu_transaksi: settings?.menu_transaksi ?? defaultMenuVisibility.menu_transaksi,
        menu_laporan: settings?.menu_laporan ?? defaultMenuVisibility.menu_laporan,
        menu_users: settings?.menu_users ?? defaultMenuVisibility.menu_users,
        menu_pengaturan: settings?.menu_pengaturan ?? defaultMenuVisibility.menu_pengaturan
    };

    // ========================================
    // PERMISSION-BASED MENU
    // ========================================
    
    const rolePermissions = {
        owner: {
            dashboard: true,
            produk: true,
            kategori: true,
            merk: true,
            kasir: true,
            kas: true,
            transaksi: true,
            laporan: true,
            laporanKas: true,
            users: true,
            monitoring: true,  // Owner bisa akses Monitoring Kasir
            pengaturan: true
        },
        admin: {
            dashboard: true,
            produk: true,
            kategori: true,
            merk: true,
            kasir: true,
            kas: true,
            transaksi: true,
            laporan: true,
            laporanKas: true,
            monitoring: true,  // Admin bisa akses Monitoring Kasir
            users: false,
            pengaturan: true
        },
        kasir: {
            dashboard: false,
            produk: true,
            kategori: true,
            merk: false,
            kasir: true,
            kas: true,
            transaksi: true,
            laporan: false,
            laporanKas: false,
            monitoring: false,  // Kasir TIDAK bisa akses Monitoring Kasir
            users: false,
            pengaturan: false
        }
    };

    function getPermissions(role) {
        return rolePermissions[role] || rolePermissions.kasir;
    }

    $: permissions = getPermissions(tenantUser?.role || 'owner');
    
    // ========================================
    // MENU ITEMS WITH SUBMENUS
    // ========================================
    $: menuItems = [
        { 
            icon: LayoutDashboard, 
            label: 'Dashboard', 
            href: '/tenant/dashboard',
            visible: permissions.dashboard && menuVisibility.menu_dashboard
        },
        { 
            icon: Package, 
            label: 'Produk', 
            href: '/tenant/produk',
            visible: permissions.produk && menuVisibility.menu_produk
        },
        { 
            icon: FolderOpen, 
            label: 'Kategori', 
            href: '/tenant/kategori',
            visible: permissions.kategori && menuVisibility.menu_kategori
        },
        { 
            icon: Tag, 
            label: 'Merk', 
            href: '/tenant/merk',
            visible: permissions.merk && menuVisibility.menu_merk
        },
        { 
            icon: ShoppingCart, 
            label: 'Kasir', 
            href: '/tenant/kasir',
            highlight: true,
            visible: permissions.kasir && menuVisibility.menu_kasir,
            hasSubmenu: true,
            submenuId: 'kasir',
            submenu: [
                {
                    icon: Zap,
                    label: 'POS Kasir',
                    href: '/tenant/kasir',
                    visible: true
                },
                {
                    icon: Wallet,
                    label: 'Kas Masuk/Keluar',
                    href: '/tenant/kasir/kas',
                    visible: permissions.kas
                }
            ].filter(sub => sub.visible)
        },
        // ==========================================
        // 🆕 MENU MONITORING KASIR (FASE 2 AKTIF)
        // ==========================================
        { 
            icon: Activity, 
            label: 'Monitoring Kasir', 
            href: '/tenant/shift',
            visible: permissions.monitoring, // Owner & Admin only
            hasSubmenu: true,
            submenuId: 'monitoring',
            submenu: [
                {
                    icon: Activity,
                    label: 'Overview',
                    href: '/tenant/shift',
                    visible: true
                },
                {
                    icon: History,
                    label: 'Riwayat Shift',
                    href: '/tenant/shift/riwayat',
                    visible: true
                },
                // ✅ FASE 2: Performa Kasir
                {
                    icon: Trophy,
                    label: 'Performa Kasir',
                    href: '/tenant/shift/performa',
                    visible: true
                },
                // ✅ FASE 2: Rekap Kas
                {
                    icon: FileSpreadsheet,
                    label: 'Rekap Kas',
                    href: '/tenant/shift/rekap-kas',
                    visible: true
                }
            ].filter(sub => sub.visible)
        },
        // ==========================================
        { 
            icon: Receipt, 
            label: 'Transaksi', 
            href: '/tenant/transaksi',
            visible: permissions.transaksi && menuVisibility.menu_transaksi
        },
        { 
            icon: BarChart3, 
            label: 'Laporan', 
            href: '/tenant/laporan',
            visible: permissions.laporan && menuVisibility.menu_laporan,
            hasSubmenu: true,
            submenuId: 'laporan',
            submenu: [
                {
                    icon: BarChart3,
                    label: 'Ringkasan',
                    href: '/tenant/laporan',
                    visible: true
                },
                {
                    icon: Receipt,
                    label: 'Laporan Penjualan',
                    href: '/tenant/laporan/penjualan',
                    visible: true
                },
                {
                    icon: Clock,
                    label: 'Laporan Shift',
                    href: '/tenant/laporan/shift',
                    visible: true
                },
                {
                    icon: Wallet,
                    label: 'Laporan Kas',
                    href: '/tenant/laporan/kas',
                    visible: permissions.laporanKas
                }
            ].filter(sub => sub.visible)
        },
        { 
            icon: Users, 
            label: 'Kelola User', 
            href: '/tenant/users',
            visible: permissions.users && menuVisibility.menu_users
        },
        { 
            icon: Settings, 
            label: 'Pengaturan', 
            href: '/tenant/pengaturan',
            visible: permissions.pengaturan && menuVisibility.menu_pengaturan
        },
    ].filter(item => item.visible);

    // Role badge helper
    function getRoleBadge(role) {
        switch (role) {
            case 'owner': return { color: 'bg-amber-100 text-amber-700', icon: Crown, label: 'Owner' };
            case 'admin': return { color: 'bg-blue-100 text-blue-700', icon: UserCog, label: 'Admin' };
            case 'kasir': return { color: 'bg-green-100 text-green-700', icon: User, label: 'Kasir' };
            default: return { color: 'bg-gray-100 text-gray-700', icon: User, label: role || 'User' };
        }
    }

    $: roleBadge = getRoleBadge(tenantUser?.role);

    onMount(() => {
        mounted = true;
        updateTime();
        const interval = setInterval(updateTime, 1000);

        if (typeof localStorage !== 'undefined') {
            darkMode = localStorage.getItem('darkMode') === 'true';
        }

        // Auto expand menu based on current path
        menuItems.forEach(item => {
            if (item.hasSubmenu && item.submenu) {
                const isSubmenuActive = item.submenu.some(sub => 
                    isMenuActive(sub.href, $page.url.pathname)
                );
                if (isSubmenuActive) {
                    expandedMenus[item.submenuId] = true;
                }
            }
        });

        return () => clearInterval(interval);
    });

    function updateTime() {
        currentTime = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
    }

    function closeSidebar() {
        sidebarOpen = false;
    }

    function toggleDarkMode() {
        darkMode = !darkMode;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('darkMode', darkMode.toString());
        }
    }

    function toggleSubmenu(submenuId) {
        expandedMenus[submenuId] = !expandedMenus[submenuId];
        expandedMenus = expandedMenus; // trigger reactivity
    }

    function getInitials(nama) {
        if (!nama) return 'U';
        return nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    function isMenuActive(href, currentPathname) {
        const normalizedCurrent = currentPathname.replace(/\/$/, '');
        const normalizedHref = href.replace(/\/$/, '');
        return normalizedCurrent === normalizedHref || normalizedCurrent.startsWith(normalizedHref + '/');
    }

    function isExactMatch(href, currentPathname) {
        const normalizedCurrent = currentPathname.replace(/\/$/, '');
        const normalizedHref = href.replace(/\/$/, '');
        return normalizedCurrent === normalizedHref;
    }
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</svelte:head>

<svelte:window bind:scrollY />

<!-- ============================================ -->
<!-- FULLSCREEN MODE - No sidebar, no header -->
<!-- ============================================ -->
{#if $isFullscreen}
    <div class="min-h-screen font-['Plus_Jakarta_Sans'] transition-colors duration-300
                {darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-emerald-50/30'}">
        <slot />
    </div>
{:else}
    <!-- ============================================ -->
    <!-- NORMAL MODE - With sidebar and header -->
    <!-- ============================================ -->
    <div class="flex min-h-screen font-['Plus_Jakarta_Sans'] transition-colors duration-300
                {darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-emerald-50/30'}">

        <!-- ============================================ -->
        <!-- OVERLAY (Mobile) -->
        <!-- ============================================ -->
        {#if sidebarOpen}
            <button
                transition:fade={{ duration: 200 }}
                class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
                on:click={closeSidebar}
                aria-label="Close sidebar"
            ></button>
        {/if}

        <!-- ============================================ -->
        <!-- SIDEBAR - WITH SUBMENUS -->
        <!-- ============================================ -->
        <aside
            class="fixed top-0 bottom-0 left-0 z-50 w-64 lg:w-72 
                   flex flex-col transition-all duration-300 ease-out
                   {sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
                   {darkMode
                       ? 'bg-slate-800/95 border-r border-slate-700/50'
                       : 'bg-white/90 backdrop-blur-xl border-r border-slate-200/60'}
                   shadow-lg lg:shadow-none"
        >
            <!-- ========================================
                 LOGO + USER INFO
            ======================================== -->
            <div class="flex-shrink-0 p-4 border-b {darkMode ? 'border-slate-700/50' : 'border-slate-100'}">
                <div class="relative overflow-hidden rounded-xl p-3.5
                            bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600
                            shadow-lg shadow-emerald-500/25">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                    <div class="relative flex items-center gap-3">
                        <div class="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                            <Store class="w-5 h-5 text-white" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <h1 class="font-bold text-white text-sm truncate">
                                {user?.nama_bisnis || 'Toko Saya'}
                            </h1>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white/20 rounded-full">
                                    <span class="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></span>
                                    <span class="text-[9px] font-medium text-white/90">Online</span>
                                </span>
                                <span class="text-[10px] text-emerald-100/80">{user?.kode_pelanggan || ''}</span>
                            </div>
                        </div>
                    </div>

                    <!-- USER INFO -->
                    <div class="relative mt-3 pt-3 border-t border-white/20">
                        <div class="flex items-center gap-2.5">
                            <div class="relative">
                                <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px]
                                            bg-white/25 text-white shadow-sm">
                                    {getInitials(tenantUser?.nama || user?.nama)}
                                </div>
                                <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-300 rounded-full
                                            border-2 border-emerald-600"></div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-semibold text-white text-xs truncate">
                                    {tenantUser?.nama || user?.nama || 'User'}
                                </p>
                                <div class="flex items-center gap-1.5 mt-0.5">
                                    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/20 text-white">
                                        <svelte:component this={roleBadge.icon} size={9} />
                                        {roleBadge.label}
                                    </span>
                                    {#if tenantUser?.is_primary}
                                        <span class="text-[8px] px-1 py-0.5 bg-amber-400/30 text-amber-100 rounded">Primary</span>
                                    {/if}
                                </div>
                            </div>
                            <!-- Time display -->
                            <div class="flex items-center gap-1 text-[10px] text-emerald-100/80">
                                <Clock class="w-3 h-3" />
                                <span>{currentTime}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Menu - Scrollable middle section -->
            <nav class="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                <p class="text-[10px] font-bold uppercase tracking-widest mb-3 px-3
                          {darkMode ? 'text-slate-500' : 'text-slate-400'}">
                    Menu Utama
                </p>
                <div class="space-y-1">
                    {#each menuItems as item}
                        {#if item.hasSubmenu && item.submenu && item.submenu.length > 0}
                            <!-- Menu with Submenu -->
                            <div>
                                <button
                                    on:click={() => toggleSubmenu(item.submenuId)}
                                    class="w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                                           transition-all duration-200
                                           {item.submenu.some(sub => isMenuActive(sub.href, $page.url.pathname))
                                               ? darkMode
                                                   ? 'bg-emerald-500/20 text-emerald-400'
                                                   : 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 shadow-sm'
                                               : darkMode
                                                   ? 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                                   : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}
                                           {item.highlight && !item.submenu.some(sub => isMenuActive(sub.href, $page.url.pathname))
                                               ? 'ring-1 ring-emerald-200 dark:ring-emerald-800'
                                               : ''}"
                                >
                                    {#if item.submenu.some(sub => isMenuActive(sub.href, $page.url.pathname))}
                                        <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full"></div>
                                    {/if}

                                    <svelte:component
                                        this={item.icon}
                                        class="w-5 h-5 transition-transform duration-200 group-hover:scale-110
                                               {item.submenu.some(sub => isMenuActive(sub.href, $page.url.pathname))
                                                   ? 'text-emerald-500'
                                                   : darkMode ? 'text-slate-500 group-hover:text-emerald-400' : 'text-slate-400 group-hover:text-emerald-500'}"
                                    />

                                    <span class="flex-1 text-left">{item.label}</span>

                                    <ChevronDown 
                                        class="w-4 h-4 transition-transform duration-200
                                               {expandedMenus[item.submenuId] ? 'rotate-180' : ''}
                                               {darkMode ? 'text-slate-500' : 'text-slate-400'}" 
                                    />
                                </button>

                                <!-- Submenu Items -->
                                {#if expandedMenus[item.submenuId]}
                                    <div 
                                        transition:slide={{ duration: 200 }}
                                        class="mt-1 ml-4 pl-4 border-l-2 space-y-1
                                               {darkMode ? 'border-slate-700' : 'border-slate-200'}"
                                    >
                                        {#each item.submenu as subItem}
                                            <a
                                                href={subItem.href}
                                                on:click={closeSidebar}
                                                class="group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                                                       transition-all duration-200
                                                       {isExactMatch(subItem.href, $page.url.pathname)
                                                           ? darkMode
                                                               ? 'bg-emerald-500/15 text-emerald-400'
                                                               : 'bg-emerald-50 text-emerald-700'
                                                           : darkMode
                                                               ? 'text-slate-400 hover:bg-slate-700/30 hover:text-white'
                                                               : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}"
                                            >
                                                <svelte:component
                                                    this={subItem.icon}
                                                    class="w-4 h-4
                                                           {isExactMatch(subItem.href, $page.url.pathname)
                                                               ? 'text-emerald-500'
                                                               : darkMode ? 'text-slate-500' : 'text-slate-400'}"
                                                />
                                                <span>{subItem.label}</span>
                                            </a>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {:else}
                            <!-- Regular Menu Item -->
                            <a
                                href={item.href}
                                on:click={closeSidebar}
                                class="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                                       transition-all duration-200
                                       {isMenuActive(item.href, $page.url.pathname)
                                           ? darkMode
                                               ? 'bg-emerald-500/20 text-emerald-400'
                                               : 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 shadow-sm'
                                           : darkMode
                                               ? 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                               : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}
                                       {item.highlight && !isMenuActive(item.href, $page.url.pathname)
                                           ? 'ring-1 ring-emerald-200 dark:ring-emerald-800'
                                           : ''}"
                            >
                                {#if isMenuActive(item.href, $page.url.pathname)}
                                    <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full"></div>
                                {/if}

                                <svelte:component
                                    this={item.icon}
                                    class="w-5 h-5 transition-transform duration-200 group-hover:scale-110
                                           {isMenuActive(item.href, $page.url.pathname)
                                               ? 'text-emerald-500'
                                               : darkMode ? 'text-slate-500 group-hover:text-emerald-400' : 'text-slate-400 group-hover:text-emerald-500'}"
                                />

                                <span class="flex-1">{item.label}</span>

                                {#if item.badge}
                                    <span class="px-2 py-0.5 text-[10px] font-bold rounded-full
                                                {isMenuActive(item.href, $page.url.pathname)
                                                    ? 'bg-emerald-500 text-white'
                                                    : darkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600'}">
                                        {item.badge}
                                    </span>
                                {/if}

                                <ChevronRight class="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0
                                                    transition-all duration-200 {darkMode ? 'text-slate-500' : 'text-slate-400'}" />
                            </a>
                        {/if}
                    {/each}
                </div>
            </nav>

            <!-- ========================================
                 BOTTOM SECTION
            ======================================== -->
            <div class="flex-shrink-0 p-4 border-t {darkMode ? 'border-slate-700/50' : 'border-slate-100'}">
                <!-- Help Card -->
                <div class="p-3 rounded-xl mb-3 {darkMode ? 'bg-slate-700/30 border border-slate-600/30' : 'bg-slate-50 border border-slate-100'}">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="p-1.5 rounded-lg {darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}">
                            <HelpCircle class="w-4 h-4 text-emerald-500" />
                        </div>
                        <span class="text-xs font-bold {darkMode ? 'text-white' : 'text-slate-800'}">
                            Butuh Bantuan?
                        </span>
                    </div>
                    <p class="text-[11px] {darkMode ? 'text-slate-400' : 'text-slate-500'} mb-2.5">
                        Tim support siap membantu Anda 24/7
                    </p>
                    <a
                        href="https://wa.me/6281234567890"
                        target="_blank"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold
                               bg-gradient-to-r from-emerald-500 to-teal-500 text-white
                               hover:from-emerald-600 hover:to-teal-600 transition-all
                               shadow-md shadow-emerald-500/25"
                    >
                        <MessageCircle class="w-3.5 h-3.5" />
                        <span>Chat WhatsApp</span>
                    </a>
                </div>

                <!-- Logout Button -->
                <form method="POST" action="/logout">
                    <button
                        type="submit"
                        class="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-xl
                               transition-all duration-200 group
                               {darkMode
                                   ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20'
                                   : 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-100'}"
                    >
                        <LogOut class="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Keluar</span>
                    </button>
                </form>
            </div>
        </aside>

        <!-- ============================================ -->
        <!-- MAIN CONTENT -->
        <!-- ============================================ -->
        <div class="flex-1 flex flex-col min-h-screen lg:ml-72">
            <!-- ========================================
                 HEADER
            ======================================== -->
            <header
                class="sticky top-0 z-30 transition-all duration-300
                       {scrollY > 10
                           ? darkMode
                               ? 'bg-slate-800/95 backdrop-blur-xl shadow-lg shadow-black/20'
                               : 'bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-900/5'
                           : darkMode
                               ? 'bg-slate-800/50'
                               : 'bg-white/50 backdrop-blur-sm'}
                       border-b {darkMode ? 'border-slate-700/50' : 'border-slate-200/60'}"
            >
                <div class="px-4 lg:px-6 h-14 lg:h-16 flex items-center justify-between">
                    <!-- Left: Mobile menu toggle + Page title area -->
                    <div class="flex items-center gap-3">
                        <button
                            on:click={toggleSidebar}
                            class="lg:hidden p-2 -ml-2 rounded-xl transition-colors
                                   {darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}"
                            aria-label="Toggle menu"
                        >
                            {#if sidebarOpen}
                                <X class="w-5 h-5" />
                            {:else}
                                <Menu class="w-5 h-5" />
                            {/if}
                        </button>

                        <!-- Mobile: Store Name Only -->
                        <span class="lg:hidden font-semibold text-sm {darkMode ? 'text-white' : 'text-slate-800'} truncate max-w-[180px]">
                            {user?.nama_bisnis || 'Toko Saya'}
                        </span>
                    </div>

                    <!-- Right: Actions -->
                    <div class="flex items-center gap-2">
                        <!-- Kasir Button (Desktop) -->
                        <a
                            href="/tenant/kasir"
                            class="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                                   bg-gradient-to-r from-emerald-500 to-teal-500 text-white
                                   hover:from-emerald-600 hover:to-teal-600 transition-all
                                   shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40
                                   hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <Zap class="w-4 h-4" />
                            <span>Kasir</span>
                        </a>

                        <!-- Mobile Kasir Button -->
                        <a
                            href="/tenant/kasir"
                            class="sm:hidden p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow"
                            aria-label="Kasir"
                        >
                            <Zap class="w-5 h-5" />
                        </a>

                        <!-- Dark Mode Toggle -->
                        <button
                            on:click={toggleDarkMode}
                            class="p-2 rounded-xl transition-colors
                                   {darkMode
                                       ? 'bg-slate-700 text-amber-400 hover:bg-slate-600'
                                       : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
                            aria-label="Toggle dark mode"
                        >
                            {#if darkMode}
                                <Sun class="w-5 h-5" />
                            {:else}
                                <Moon class="w-5 h-5" />
                            {/if}
                        </button>

                        <!-- Notifications -->
                        <NotificationDropdown {darkMode} />
                    </div>
                </div>
            </header>

            <!-- Page Content -->
            <main class="flex-1 p-4 lg:p-6">
                {#if mounted}
                    <div in:fly={{ y: 20, duration: 300, delay: 100, easing: quintOut }}>
                        <slot />
                    </div>
                {:else}
                    <slot />
                {/if}
            </main>

            <!-- Footer -->
            <footer class="border-t px-4 py-3 {darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-100'}">
                <div class="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p class="text-[11px] {darkMode ? 'text-slate-500' : 'text-slate-400'}">
                        © 2024 POSKasir · <span class="text-emerald-500">Neuversity</span>
                    </p>
                    <div class="flex items-center gap-4">
                        <a href="/privacy" class="text-[11px] {darkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}">
                            Privasi
                        </a>
                        <a href="/terms" class="text-[11px] {darkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}">
                            Ketentuan
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    </div>
{/if}

<style>
    :global(body) {
        overflow-x: hidden;
    }

    /* Hide scrollbar but keep scroll functionality */
    .scrollbar-thin {
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE and Edge */
    }

    .scrollbar-thin::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
        width: 0;
        height: 0;
    }
</style>