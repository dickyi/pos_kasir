<script>
  import '../../app.css';
  import { 
    LayoutDashboard, 
    Users, 
    FolderOpen, 
    Package, 
    ShoppingCart, 
    FileText,
    Menu,
    X,
    LogOut,
    ChevronRight
  } from 'lucide-svelte';
  
  // Data dari server
  export let data;
  
  // User yang sedang login
  $: user = data?.user;
  
  // State untuk toggle sidebar di mobile
  let sidebarOpen = false;
  
  // Menu items dengan icon component
  let menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Pelanggan', href: '/pelanggan' },
    { icon: FolderOpen, label: 'Kategori', href: '/kategori' },
    { icon: Package, label: 'Produk', href: '/produk' },
    { icon: ShoppingCart, label: 'Transaksi', href: '/transaksi' },
    { icon: FileText, label: 'Laporan', href: '/laporan' },
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

  // Check if current page is active
  function isActive(href) {
    if (typeof window === 'undefined') return false;
    return window.location.pathname === href;
  }
</script>

<div class="flex min-h-screen bg-gray-50">
  
  <!-- Overlay untuk mobile -->
  {#if sidebarOpen}
    <div 
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      on:click={closeSidebar}
      on:keydown={(e) => e.key === 'Escape' && closeSidebar()}
      role="button"
      tabindex="0"
      aria-label="Close sidebar"
    ></div>
  {/if}

  <!-- Sidebar -->
  <aside 
    class="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
           {sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0"
  >
    <!-- Logo -->
    <div class="p-6 border-b border-gray-200">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
          <span class="text-white text-base font-semibold">D</span>
        </div>
        <div>
          <h1 class="text-base font-semibold text-gray-900 leading-tight">DARFM POS</h1>
          <p class="text-xs text-gray-500">Admin Panel</p>
        </div>
      </div>
    </div>
    
    <!-- Menu Navigation -->
    <nav class="p-3 flex-1 overflow-y-auto">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-3">Menu</p>
      <div class="space-y-1">
        {#each menuItems as item}
          <a 
            href={item.href}
            on:click={closeSidebar}
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                   {isActive(item.href) 
                     ? 'bg-blue-50 text-blue-600' 
                     : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}"
          >
            <svelte:component this={item.icon} class="w-4 h-4 flex-shrink-0" />
            <span class="flex-1">{item.label}</span>
            {#if isActive(item.href)}
              <ChevronRight class="w-4 h-4 text-blue-600" />
            {/if}
          </a>
        {/each}
      </div>
    </nav>
    
    <!-- User Info & Logout -->
    <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm">
          {getInitials(user?.nama)}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 text-sm truncate">{user?.nama || 'User'}</p>
          <p class="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
        </div>
      </div>
      <form method="POST" action="/logout">
        <button 
          type="submit"
          class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <LogOut class="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </form>
    </div>
  </aside>

  <!-- Main Content Area -->
  <div class="flex-1 flex flex-col min-h-screen">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 px-4 lg:px-6 py-3.5 flex justify-between items-center sticky top-0 z-30 shadow-sm">
      <!-- Mobile Menu Toggle -->
      <button 
        on:click={toggleSidebar}
        class="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Toggle menu"
      >
        {#if sidebarOpen}
          <X class="w-5 h-5 text-gray-600" />
        {:else}
          <Menu class="w-5 h-5 text-gray-600" />
        {/if}
      </button>
      
      <!-- Spacer -->
      <div class="flex-1 lg:flex-none"></div>
      
      <!-- User Profile Header -->
      <div class="flex items-center gap-3">
        <div class="hidden sm:block text-right">
          <p class="text-sm font-medium text-gray-900">{user?.nama || 'User'}</p>
          <p class="text-xs text-gray-500">Administrator</p>
        </div>
        <div class="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm">
          {getInitials(user?.nama)}
        </div>
      </div>
    </header>
    
    <!-- Page Content -->
    <main class="flex-1 p-4 lg:p-6">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 px-6 py-3.5 text-center">
      <p class="text-xs text-gray-500">
        © 2026 DARFM POS - All rights reserved
      </p>
    </footer>
  </div>
</div>

<style>
  /* Smooth scrolling untuk sidebar */
  aside {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
  }
  
  aside::-webkit-scrollbar {
    width: 6px;
  }
  
  aside::-webkit-scrollbar-track {
    background: transparent;
  }
  
  aside::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.3);
    border-radius: 3px;
  }
  
  aside::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.5);
  }
</style>