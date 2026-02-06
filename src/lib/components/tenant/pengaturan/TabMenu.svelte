<!--
    TabMenu.svelte - Tab Pengaturan Tampilan Menu
    ============================================
    Toggle untuk show/hide menu di sidebar
    Hanya Owner yang bisa mengubah
-->
<script>
    import { enhance } from '$app/forms';
    import { fade } from 'svelte/transition';
    import { 
        LayoutDashboard, Package, FolderOpen, Tag, ShoppingCart,
        Receipt, BarChart3, Users, Settings, Lock, Info,
        GripVertical
    } from 'lucide-svelte';
    import SettingSection from './shared/SettingSection.svelte';
    import FormActions from './shared/FormActions.svelte';

    export let settings = {};
    export let isSubmitting = false;
    export let onSubmit = () => {};
    export let canEdit = true;

    // Default menu settings
    const defaultMenuSettings = {
        menu_dashboard: true,
        menu_produk: true,
        menu_kategori: true,
        menu_merk: false,        // Default OFF untuk UMKM F&B
        menu_kasir: true,
        menu_transaksi: true,
        menu_laporan: true,
        menu_users: true,
        menu_pengaturan: true
    };

    // Menu configuration
    const menuItems = [
        { 
            key: 'menu_dashboard', 
            label: 'Dashboard', 
            icon: LayoutDashboard,
            description: 'Ringkasan statistik bisnis',
            alwaysOn: false
        },
        { 
            key: 'menu_produk', 
            label: 'Produk', 
            icon: Package,
            description: 'Kelola daftar produk',
            alwaysOn: true  // Tidak bisa dimatikan
        },
        { 
            key: 'menu_kategori', 
            label: 'Kategori', 
            icon: FolderOpen,
            description: 'Kelola kategori produk',
            alwaysOn: false
        },
        { 
            key: 'menu_merk', 
            label: 'Merk / Brand', 
            icon: Tag,
            description: 'Kelola merk produk (untuk retail/elektronik)',
            alwaysOn: false,
            hint: 'Cocok untuk toko retail, elektronik, kosmetik'
        },
        { 
            key: 'menu_kasir', 
            label: 'Kasir', 
            icon: ShoppingCart,
            description: 'Point of Sale',
            alwaysOn: true  // Tidak bisa dimatikan
        },
        { 
            key: 'menu_transaksi', 
            label: 'Transaksi', 
            icon: Receipt,
            description: 'Riwayat transaksi',
            alwaysOn: false
        },
        { 
            key: 'menu_laporan', 
            label: 'Laporan', 
            icon: BarChart3,
            description: 'Laporan penjualan & keuangan',
            alwaysOn: false
        },
        { 
            key: 'menu_users', 
            label: 'Kelola User', 
            icon: Users,
            description: 'Kelola staff & kasir',
            alwaysOn: false
        },
        { 
            key: 'menu_pengaturan', 
            label: 'Pengaturan', 
            icon: Settings,
            description: 'Pengaturan aplikasi',
            alwaysOn: true  // Tidak bisa dimatikan
        }
    ];

    // Form data - merge dengan default
    let menuData = { ...defaultMenuSettings };

    // Sync dengan settings dari database
    $: if (settings) {
        menuData = {
            menu_dashboard: settings.menu_dashboard ?? defaultMenuSettings.menu_dashboard,
            menu_produk: settings.menu_produk ?? defaultMenuSettings.menu_produk,
            menu_kategori: settings.menu_kategori ?? defaultMenuSettings.menu_kategori,
            menu_merk: settings.menu_merk ?? defaultMenuSettings.menu_merk,
            menu_kasir: settings.menu_kasir ?? defaultMenuSettings.menu_kasir,
            menu_transaksi: settings.menu_transaksi ?? defaultMenuSettings.menu_transaksi,
            menu_laporan: settings.menu_laporan ?? defaultMenuSettings.menu_laporan,
            menu_users: settings.menu_users ?? defaultMenuSettings.menu_users,
            menu_pengaturan: settings.menu_pengaturan ?? defaultMenuSettings.menu_pengaturan
        };
    }

    // Toggle handler
    function toggleMenu(key) {
        if (!canEdit) return;
        const item = menuItems.find(m => m.key === key);
        if (item?.alwaysOn) return; // Tidak bisa dimatikan
        
        menuData[key] = !menuData[key];
    }

    // Count active menus
    $: activeCount = Object.values(menuData).filter(v => v).length;
</script>

<div transition:fade={{ duration: 150 }}>
    <SettingSection 
        title="Tampilan Menu" 
        description="Atur menu yang ditampilkan di sidebar sesuai kebutuhan bisnis Anda"
    >
        <!-- View Only Banner -->
        {#if !canEdit}
            <div class="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <Lock class="w-4 h-4 text-amber-600" />
                <span class="text-sm text-amber-700">Hanya Owner yang dapat mengubah tampilan menu</span>
            </div>
        {/if}

        <form 
            method="POST" 
            action="?/updateMenu"
            use:enhance={onSubmit}
            class="space-y-4"
        >
            <!-- Hidden inputs untuk form submission -->
            {#each menuItems as item}
                <input type="hidden" name={item.key} value={menuData[item.key] ? '1' : '0'} />
            {/each}

            <!-- Info Box -->
            <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
                <Info class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div class="text-sm text-blue-700">
                    <p class="font-medium">Tips Pengaturan Menu</p>
                    <p class="mt-1 text-blue-600">
                        Nonaktifkan menu yang tidak digunakan untuk menyederhanakan tampilan. 
                        Menu <strong>Produk</strong>, <strong>Kasir</strong>, dan <strong>Pengaturan</strong> tidak dapat dinonaktifkan.
                    </p>
                </div>
            </div>

            <!-- Menu List -->
            <div class="space-y-2">
                {#each menuItems as item}
                    {@const isActive = menuData[item.key]}
                    {@const isLocked = item.alwaysOn}
                    
                    <div 
                        class="flex items-center gap-4 p-4 rounded-xl border transition-all
                               {isActive 
                                   ? 'bg-white border-slate-200' 
                                   : 'bg-slate-50 border-slate-100'}
                               {!isLocked && canEdit ? 'hover:border-emerald-200 cursor-pointer' : ''}"
                        on:click={() => toggleMenu(item.key)}
                        on:keypress={(e) => e.key === 'Enter' && toggleMenu(item.key)}
                        role="button"
                        tabindex={!isLocked && canEdit ? 0 : -1}
                    >
                        <!-- Icon -->
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                                    {isActive 
                                        ? 'bg-emerald-100 text-emerald-600' 
                                        : 'bg-slate-200 text-slate-400'}">
                            <svelte:component this={item.icon} class="w-5 h-5" />
                        </div>

                        <!-- Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <span class="font-medium text-sm {isActive ? 'text-slate-800' : 'text-slate-500'}">
                                    {item.label}
                                </span>
                                {#if isLocked}
                                    <span class="px-1.5 py-0.5 bg-slate-200 text-slate-500 text-[10px] font-medium rounded">
                                        Wajib
                                    </span>
                                {/if}
                            </div>
                            <p class="text-xs text-slate-500 mt-0.5">{item.description}</p>
                            {#if item.hint && !isActive}
                                <p class="text-xs text-amber-600 mt-1">💡 {item.hint}</p>
                            {/if}
                        </div>

                        <!-- Toggle Switch -->
                        <div class="flex-shrink-0">
                            {#if isLocked}
                                <div class="w-12 h-7 bg-emerald-500 rounded-full relative opacity-50 cursor-not-allowed">
                                    <div class="absolute top-1 left-6 w-5 h-5 bg-white rounded-full shadow"></div>
                                </div>
                            {:else}
                                <button
                                    type="button"
                                    disabled={!canEdit}
                                    on:click|stopPropagation={() => toggleMenu(item.key)}
                                    class="w-12 h-7 rounded-full transition-colors relative
                                           {isActive ? 'bg-emerald-500' : 'bg-slate-300'}
                                           {!canEdit ? 'opacity-50 cursor-not-allowed' : ''}"
                                >
                                    <div 
                                        class="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all
                                               {isActive ? 'left-6' : 'left-1'}"
                                    ></div>
                                </button>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>

            <!-- Summary -->
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span class="text-sm text-slate-600">Menu aktif:</span>
                <span class="text-sm font-semibold text-emerald-600">{activeCount} dari {menuItems.length}</span>
            </div>

            <FormActions {isSubmitting} {canEdit} />
        </form>
    </SettingSection>
</div>