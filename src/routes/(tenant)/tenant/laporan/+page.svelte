<!--
    +page.svelte - Halaman Index Laporan (UPDATED)
    ============================================
    Dashboard utama untuk akses semua laporan
    - Menampilkan laporan berdasarkan role
    - Kasir hanya lihat link ke laporan kasir
    - UPDATED: Menambahkan Laporan Shift
-->
<script>
    import { fly } from 'svelte/transition';
    import {
        BarChart3, DollarSign, Package, Users, TrendingUp, Receipt, 
        Boxes, ArrowRight, ChevronRight, Lock, AlertTriangle, Clock
    } from 'lucide-svelte';

    // Import utils
    import { formatRupiah, formatRupiahShort, formatNumber } from '$lib/utils/format.js';

    export let data;

    $: user = data?.user;
    $: quickStats = data?.quickStats || {};
    $: availableReports = data?.availableReports || [];
    $: tenantRole = data?.tenantRole;
    $: error = data?.error;

    // Report types configuration - UPDATED dengan Laporan Shift
    const allReportTypes = [
        {
            id: 'penjualan',
            title: 'Laporan Penjualan',
            description: 'Analisis penjualan & tren',
            icon: DollarSign,
            href: '/tenant/laporan/penjualan',
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            features: ['Tren Penjualan', 'Top Produk', 'Kategori'],
            requiredRole: ['owner', 'admin']
        },
        {
            id: 'keuangan',
            title: 'Laporan Keuangan',
            description: 'Profit/loss & margin',
            icon: TrendingUp,
            href: '/tenant/laporan/keuangan',
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            features: ['Revenue', 'Profit Margin', 'Diskon'],
            requiredRole: ['owner'] // OWNER ONLY
        },
        {
            id: 'stok',
            title: 'Laporan Stok',
            description: 'Inventory & valuasi',
            icon: Boxes,
            href: '/tenant/laporan/stok',
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            features: ['Valuasi', 'Fast/Slow Moving', 'Low Stock'],
            requiredRole: ['owner', 'admin']
        },
        {
            id: 'shift',
            title: 'Laporan Shift',
            description: 'History shift & rekap kas',
            icon: Clock,
            href: '/tenant/laporan/shift',
            iconBg: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            features: ['History Shift', 'Selisih Kas', 'Per Kasir'],
            requiredRole: ['owner', 'admin']
        },
        {
            id: 'kasir',
            title: 'Laporan Kasir',
            description: 'Performa & produktivitas',
            icon: Users,
            href: '/tenant/laporan/kasir',
            iconBg: 'bg-purple-50',
            iconColor: 'text-purple-600',
            features: ['Performa', 'Leaderboard', 'Void'],
            requiredRole: ['owner', 'admin', 'kasir']
        }
    ];

    // Filter reports based on available reports
    $: reportTypes = allReportTypes.filter(r => availableReports.includes(r.id));

    // Check if a report is accessible
    function isReportAccessible(reportId) {
        return availableReports.includes(reportId);
    }

    // Quick stats configuration
    const statsConfig = [
        {
            key: 'penjualanHariIni',
            label: 'Penjualan Hari Ini',
            icon: DollarSign,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            format: 'currency'
        },
        {
            key: 'transaksiHariIni',
            label: 'Transaksi',
            icon: Receipt,
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-600',
            format: 'number'
        },
        {
            key: 'rataRataTransaksi',
            label: 'Rata-rata',
            icon: BarChart3,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            format: 'currency'
        },
        {
            key: 'produkTerjual',
            label: 'Produk Terjual',
            icon: Package,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            format: 'number'
        }
    ];

    // Filter stats for kasir (they see limited stats)
    $: visibleStats = tenantRole === 'kasir' 
        ? statsConfig.filter(s => ['transaksiHariIni', 'produkTerjual'].includes(s.key))
        : statsConfig;

    function formatValue(value, format) {
        if (format === 'currency') return formatRupiahShort(value || 0);
        return formatNumber(value || 0);
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
    <title>Laporan - {user?.nama_bisnis || 'Toko Saya'}</title>
</svelte:head>

<div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="px-1 flex items-center justify-between">
        <div>
            <h1 class="text-lg sm:text-2xl font-semibold text-slate-800">Laporan</h1>
            <p class="text-slate-500 text-sm mt-0.5">Analisis lengkap bisnis Anda</p>
        </div>
        
        <!-- Role Badge -->
        <span class="px-3 py-1 rounded-full text-xs font-medium {roleBadge.class}">
            {roleBadge.label}
        </span>
    </div>

    <!-- Error State -->
    {#if error}
        <div class="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0" />
            <p class="text-red-700 text-sm">{error}</p>
        </div>
    {/if}

    <!-- Quick Stats -->
    {#if quickStats && Object.keys(quickStats).length > 0}
        <div class="grid grid-cols-2 gap-3 sm:gap-4">
            {#each visibleStats as stat}
                <div class="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
                    <div class="w-8 h-8 sm:w-10 sm:h-10 {stat.iconBg} rounded-lg flex items-center justify-center">
                        <svelte:component this={stat.icon} class="w-4 h-4 sm:w-5 sm:h-5 {stat.iconColor}" />
                    </div>
                    <div class="mt-3">
                        <p class="text-lg sm:text-2xl font-semibold text-slate-800">
                            {formatValue(quickStats[stat.key], stat.format)}
                        </p>
                        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">{stat.label}</p>
                    </div>
                </div>
            {/each}
            
            <!-- Profit Card - Only for Owner -->
            {#if tenantRole === 'owner' && quickStats.profitHariIni !== null}
                <div class="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
                    <div class="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <TrendingUp class="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                    </div>
                    <div class="mt-3">
                        <p class="text-lg sm:text-2xl font-semibold {quickStats.profitHariIni >= 0 ? 'text-emerald-600' : 'text-red-600'}">
                            {formatRupiahShort(quickStats.profitHariIni)}
                        </p>
                        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">Profit Hari Ini</p>
                    </div>
                </div>
            {/if}
            
            <!-- Shift Stats - For Owner & Admin -->
            {#if ['owner', 'admin'].includes(tenantRole) && quickStats.shiftStats}
                <div class="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
                    <div class="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <Clock class="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                    </div>
                    <div class="mt-3">
                        <p class="text-lg sm:text-2xl font-semibold text-slate-800">
                            {quickStats.shiftStats.totalShift}
                        </p>
                        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Shift Hari Ini
                            {#if quickStats.shiftStats.shiftAktif > 0}
                                <span class="text-emerald-600">({quickStats.shiftStats.shiftAktif} aktif)</span>
                            {/if}
                        </p>
                    </div>
                </div>
            {/if}
            
            <!-- Low Stock Alert - For Owner & Admin -->
            {#if ['owner', 'admin'].includes(tenantRole) && quickStats.lowStockCount > 0}
                <div class="bg-amber-50 rounded-xl border border-amber-200 p-4 sm:p-5">
                    <div class="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle class="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                    </div>
                    <div class="mt-3">
                        <p class="text-lg sm:text-2xl font-semibold text-amber-700">
                            {quickStats.lowStockCount}
                        </p>
                        <p class="text-xs sm:text-sm text-amber-600 mt-0.5">Produk Stok Menipis</p>
                    </div>
                </div>
            {/if}
        </div>
    {/if}

    <!-- Report Types -->
    <div class="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
        {#each reportTypes as report, index}
            <a
                href={report.href}
                class="block bg-white rounded-xl border border-slate-200 p-4 sm:p-6 
                       hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.98]"
                in:fly={{ y: 20, delay: index * 50, duration: 200 }}
            >
                <div class="flex items-center gap-3 sm:gap-4">
                    <!-- Icon -->
                    <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 {report.iconBg}">
                        <svelte:component this={report.icon} class="w-6 h-6 sm:w-7 sm:h-7 {report.iconColor}" />
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                        <h3 class="text-base sm:text-lg font-semibold text-slate-800">
                            {report.title}
                        </h3>
                        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">{report.description}</p>

                        <!-- Features - Hidden on mobile -->
                        <div class="hidden sm:flex flex-wrap gap-1.5 mt-3">
                            {#each report.features as feature}
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                    {feature}
                                </span>
                            {/each}
                        </div>
                    </div>

                    <!-- Arrow -->
                    <ChevronRight class="w-5 h-5 text-slate-400 flex-shrink-0" />
                </div>

                <!-- Features - Mobile -->
                <div class="flex flex-wrap gap-1.5 mt-3 sm:hidden">
                    {#each report.features as feature}
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {feature}
                        </span>
                    {/each}
                </div>
            </a>
        {/each}
    </div>

    <!-- Locked Reports Info (for non-owner) -->
    {#if tenantRole === 'admin'}
        <div class="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-start gap-3">
            <Lock class="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
                <p class="text-sm font-medium text-slate-700">Laporan Terbatas</p>
                <p class="text-xs text-slate-500 mt-1">
                    Laporan Keuangan hanya dapat diakses oleh Owner. Hubungi pemilik toko jika Anda memerlukan akses.
                </p>
            </div>
        </div>
    {/if}

    <!-- Info for Kasir -->
    {#if tenantRole === 'kasir'}
        <div class="bg-purple-50 rounded-xl border border-purple-200 p-4 flex items-start gap-3">
            <Users class="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
                <p class="text-sm font-medium text-purple-700">Akses Laporan Kasir</p>
                <p class="text-xs text-purple-600 mt-1">
                    Sebagai kasir, Anda dapat melihat laporan performa Anda sendiri. 
                    Untuk laporan lengkap, hubungi Owner atau Admin.
                </p>
            </div>
        </div>
    {/if}

    <!-- Help Card -->
    <div class="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 sm:p-6 text-white">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
                <h3 class="text-base sm:text-lg font-semibold">Butuh Bantuan?</h3>
                <p class="text-emerald-100 text-xs sm:text-sm mt-0.5">
                    Pelajari cara menganalisis data bisnis Anda
                </p>
            </div>
            <a
                href="/tenant/bantuan?category=laporan"
                class="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 
                       bg-white text-emerald-600 rounded-lg font-medium text-sm
                       hover:bg-emerald-50 transition-colors active:scale-[0.98]"
            >
                <span>Lihat Panduan</span>
                <ArrowRight class="w-4 h-4" />
            </a>
        </div>
    </div>
</div>