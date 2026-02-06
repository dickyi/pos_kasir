<!--
    +page.svelte - Halaman Pengaturan (UPDATED v2)
    ============================================
    - Tab ditampilkan berdasarkan role
    - Permission check untuk edit
    - Kasir hanya bisa ganti password
    - ADDED: Tab Menu untuk pengaturan tampilan menu
    - ADDED: Tab Shift untuk pengaturan shift & kas
    - ADDED: Mode Kasir (Single/Per User/Multi Station)
    - ADDED: Station management untuk Multi Station mode
-->
<script>
    import { fly, fade } from 'svelte/transition';
    import { 
        Store, User, CreditCard, Receipt, Bell, LayoutGrid, Clock,
        Check, X, AlertCircle, ChevronRight, Info, Lock
    } from 'lucide-svelte';

    // Import komponen tab
    import { 
        TabProfil, 
        TabAkun, 
        TabKasir, 
        TabShift,
        TabStruk, 
        TabNotifikasi,
        TabMenu
    } from '$lib/components/tenant/pengaturan';

    export let data;
    export let form;

    $: user = data?.user;
    $: tenantUserData = data?.tenantUserData;
    $: settings = data?.settings || {};
    $: stations = data?.stations || [];  // NEW: stations data
    $: availableTabs = data?.availableTabs || [];
    $: editPermissions = data?.editPermissions || {};
    $: tenantRole = data?.tenantRole || 'owner';

    // Active tab - default ke tab pertama yang tersedia
    let activeTab = 'profil';

    // Set default tab berdasarkan available tabs
    $: if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
        activeTab = availableTabs[0];
    }

    // Form states
    let isSubmitting = false;

    // Reference ke TabAkun untuk reset password
    let tabAkunRef;

    // Handle form response - switch to correct tab
    $: if (form?.tab) {
        activeTab = form.tab;
    }

    // All tabs configuration
    const allTabs = [
        { id: 'profil', label: 'Profil Toko', icon: Store },
        { id: 'akun', label: 'Akun', icon: User },
        { id: 'kasir', label: 'Kasir', icon: CreditCard },
        { id: 'shift', label: 'Shift & Kas', icon: Clock },
        { id: 'struk', label: 'Struk', icon: Receipt },
        { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
        { id: 'menu', label: 'Tampilan Menu', icon: LayoutGrid }
    ];

    // Filter tabs berdasarkan availableTabs
    $: tabs = allTabs.filter(tab => availableTabs.includes(tab.id));

    function handleSubmit() {
        isSubmitting = true;
        return async ({ result, update }) => {
            isSubmitting = false;
            if (result.type === 'success') {
                // Reset password fields setelah berhasil ganti password
                if (result.data?.tab === 'akun' && tabAkunRef?.resetPasswordFields) {
                    tabAkunRef.resetPasswordFields();
                }
            }
            await update();
        };
    }

    function dismissAlert() {
        form = null;
    }

    // Get role badge
    function getRoleBadge(role) {
        const badges = {
            owner: { label: 'Owner', class: 'bg-emerald-100 text-emerald-700' },
            admin: { label: 'Admin', class: 'bg-blue-100 text-blue-700' },
            kasir: { label: 'Kasir', class: 'bg-purple-100 text-purple-700' }
        };
        return badges[role] || { label: role, class: 'bg-slate-100 text-slate-700' };
    }

    $: roleBadge = getRoleBadge(tenantRole);
</script>

<svelte:head>
    <title>Pengaturan - {user?.nama_bisnis || 'POSKasir'}</title>
</svelte:head>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-xl font-semibold text-slate-800">Pengaturan</h1>
            <p class="text-slate-500 text-sm mt-1">Kelola pengaturan toko dan akun Anda</p>
        </div>
        
        <!-- Role Badge -->
        <span class="px-3 py-1 rounded-full text-xs font-medium {roleBadge.class}">
            {roleBadge.label}
        </span>
    </div>

    <!-- Alert Messages -->
    {#if form?.success}
        <div 
            transition:fly={{ y: -10, duration: 200 }}
            class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"
        >
            <div class="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Check class="w-4 h-4 text-emerald-600" />
            </div>
            <p class="text-emerald-700 text-sm flex-1">{form.message}</p>
            <button type="button" on:click={dismissAlert} class="p-1 text-emerald-400 hover:text-emerald-600">
                <X class="w-4 h-4" />
            </button>
        </div>
    {/if}

    {#if form?.message && !form?.success}
        <div 
            transition:fly={{ y: -10, duration: 200 }}
            class="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
        >
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle class="w-4 h-4 text-red-600" />
            </div>
            <p class="text-red-700 text-sm flex-1">{form.message}</p>
            <button type="button" on:click={dismissAlert} class="p-1 text-red-400 hover:text-red-600">
                <X class="w-4 h-4" />
            </button>
        </div>
    {/if}

    <!-- Main Content -->
    <div class="flex flex-col lg:flex-row gap-6">
        
        <!-- Sidebar Tabs -->
        <div class="lg:w-64 flex-shrink-0">
            <nav class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <!-- Mobile: Horizontal scroll -->
                <div class="lg:hidden flex overflow-x-auto">
                    {#each tabs as tab}
                        <button
                            type="button"
                            on:click={() => activeTab = tab.id}
                            class="flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                                {activeTab === tab.id 
                                    ? 'text-emerald-600 border-emerald-600 bg-emerald-50' 
                                    : 'text-slate-600 border-transparent hover:bg-slate-50'}"
                        >
                            <svelte:component this={tab.icon} class="w-4 h-4" />
                            <span>{tab.label}</span>
                            {#if !editPermissions[tab.id]}
                                <Lock class="w-3 h-3 text-slate-400" />
                            {/if}
                        </button>
                    {/each}
                </div>

                <!-- Desktop: Vertical list -->
                <div class="hidden lg:block">
                    {#each tabs as tab}
                        <button
                            type="button"
                            on:click={() => activeTab = tab.id}
                            class="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors
                                {activeTab === tab.id 
                                    ? 'text-emerald-600 bg-emerald-50 border-l-2 border-emerald-600' 
                                    : 'text-slate-600 hover:bg-slate-50 border-l-2 border-transparent'}"
                        >
                            <svelte:component this={tab.icon} class="w-5 h-5" />
                            <span class="flex-1 text-left">{tab.label}</span>
                            {#if !editPermissions[tab.id]}
                                <Lock class="w-4 h-4 text-slate-400" />
                            {:else}
                                <ChevronRight class="w-4 h-4 text-slate-400" />
                            {/if}
                        </button>
                    {/each}
                </div>
            </nav>

            <!-- Info Card - Role-based message -->
            <div class="hidden lg:block mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div class="flex items-start gap-3">
                    <Info class="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                        {#if tenantRole === 'kasir'}
                            <p class="text-sm text-slate-600">
                                Sebagai Kasir, Anda hanya dapat mengubah password akun sendiri.
                            </p>
                        {:else if tenantRole === 'admin'}
                            <p class="text-sm text-slate-600">
                                Beberapa pengaturan hanya dapat diubah oleh Owner.
                            </p>
                        {:else}
                            <p class="text-sm text-slate-600">
                                Perubahan akan tersimpan setelah klik tombol simpan.
                            </p>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <!-- Content Area -->
        <div class="flex-1 min-w-0">
            {#if activeTab === 'profil'}
                <TabProfil 
                    {user} 
                    {isSubmitting} 
                    onSubmit={handleSubmit}
                    canEdit={editPermissions.profil}
                />
            {:else if activeTab === 'akun'}
                <TabAkun 
                    bind:this={tabAkunRef}
                    user={tenantUserData || user}
                    {isSubmitting} 
                    onSubmit={handleSubmit}
                    canEdit={editPermissions.akun}
                    {tenantRole}
                />
            {:else if activeTab === 'kasir'}
                <TabKasir 
                    {settings} 
                    {isSubmitting} 
                    onSubmit={handleSubmit}
                    canEdit={editPermissions.kasir}
                />
            {:else if activeTab === 'shift'}
                <!-- UPDATED: Pass stations to TabShift -->
                <TabShift 
                    {settings}
                    {stations}
                    {isSubmitting} 
                    onSubmit={handleSubmit}
                    canEdit={editPermissions.shift}
                />
            {:else if activeTab === 'struk'}
                <TabStruk 
                    {settings} 
                    {isSubmitting} 
                    onSubmit={handleSubmit}
                    canEdit={editPermissions.struk}
                />
            {:else if activeTab === 'notifikasi'}
                <TabNotifikasi 
                    {settings} 
                    {isSubmitting} 
                    onSubmit={handleSubmit}
                    canEdit={editPermissions.notifikasi}
                />
            {:else if activeTab === 'menu'}
                <TabMenu 
                    {settings} 
                    {isSubmitting} 
                    onSubmit={handleSubmit}
                    canEdit={editPermissions.menu}
                />
            {/if}
        </div>
    </div>
</div>