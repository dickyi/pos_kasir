<script>
    // Data dari layout (user session)
    export let data;
    
    $: user = data?.user;

    // Data statistik (nanti bisa dari database)
    let stats = [
        { 
            label: 'Penjualan Hari Ini', 
            value: 'Rp 850.000', 
            change: '+12%',
            changeType: 'positive',
            icon: '💰',
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-600'
        },
        { 
            label: 'Transaksi', 
            value: '23', 
            change: '+5',
            changeType: 'positive',
            icon: '🧾',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600'
        },
        { 
            label: 'Produk Terjual', 
            value: '67', 
            change: '+18',
            changeType: 'positive',
            icon: '📦',
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600'
        },
        { 
            label: 'Stok Menipis', 
            value: '5', 
            change: 'produk',
            changeType: 'warning',
            icon: '⚠️',
            bgColor: 'bg-amber-50',
            iconColor: 'text-amber-600'
        }
    ];

    // Transaksi terakhir (sample data)
    let recentTransactions = [
        { id: 'TRX001', time: '14:30', items: 3, total: 75000, status: 'success' },
        { id: 'TRX002', time: '13:15', items: 5, total: 125000, status: 'success' },
        { id: 'TRX003', time: '12:00', items: 2, total: 45000, status: 'success' },
        { id: 'TRX004', time: '11:30', items: 7, total: 180000, status: 'success' },
        { id: 'TRX005', time: '10:45', items: 1, total: 25000, status: 'success' },
    ];

    // Produk terlaris (sample data)
    let topProducts = [
        { name: 'Indomie Goreng', sold: 45, revenue: 157500 },
        { name: 'Aqua 600ml', sold: 38, revenue: 152000 },
        { name: 'Teh Botol Sosro', sold: 32, revenue: 160000 },
        { name: 'Roti Tawar', sold: 25, revenue: 375000 },
        { name: 'Kopi Kapal Api', sold: 22, revenue: 110000 },
    ];

    // Format rupiah
    function formatRupiah(angka) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    }

    // Get current date
    function getCurrentDate() {
        return new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Get greeting based on time
    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Selamat Pagi';
        if (hour < 15) return 'Selamat Siang';
        if (hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    }
</script>

<svelte:head>
    <title>Dashboard - {user?.nama_bisnis || 'Toko Saya'}</title>
</svelte:head>

<!-- ============================================ -->
<!-- WELCOME HEADER -->
<!-- ============================================ -->
<div class="mb-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold text-gray-800">
                {getGreeting()}, {user?.nama?.split(' ')[0] || 'User'}! 👋
            </h1>
            <p class="text-gray-500 mt-1">{getCurrentDate()}</p>
        </div>
        <a 
            href="/tenant/kasir"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-lg shadow-emerald-600/30"
        >
            <span class="text-xl">🛒</span>
            <span>Buka Kasir</span>
        </a>
    </div>
</div>

<!-- ============================================ -->
<!-- STATS CARDS -->
<!-- ============================================ -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {#each stats as stat}
        <div class="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-3">
                <div class="{stat.bgColor} {stat.iconColor} w-10 h-10 rounded-lg flex items-center justify-center text-xl">
                    {stat.icon}
                </div>
                <span class="text-xs font-medium px-2 py-1 rounded-full
                    {stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : ''}
                    {stat.changeType === 'warning' ? 'bg-amber-100 text-amber-700' : ''}
                    {stat.changeType === 'negative' ? 'bg-red-100 text-red-700' : ''}
                ">
                    {stat.change}
                </span>
            </div>
            <p class="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p class="text-sm text-gray-500 mt-1">{stat.label}</p>
        </div>
    {/each}
</div>

<!-- ============================================ -->
<!-- MAIN CONTENT GRID -->
<!-- ============================================ -->
<div class="grid lg:grid-cols-3 gap-6">
    
    <!-- Left Column: Recent Transactions -->
    <div class="lg:col-span-2 space-y-6">
        
        <!-- Transaksi Terakhir -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 class="font-semibold text-gray-800">Transaksi Terakhir</h2>
                <a href="/tenant/transaksi" class="text-sm text-emerald-600 hover:underline">Lihat Semua →</a>
            </div>
            
            <div class="divide-y divide-gray-100">
                {#each recentTransactions as trx}
                    <div class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <span class="text-green-600">✓</span>
                            </div>
                            <div>
                                <p class="font-medium text-gray-800">{trx.id}</p>
                                <p class="text-xs text-gray-500">{trx.items} item • {trx.time}</p>
                            </div>
                        </div>
                        <p class="font-semibold text-gray-800">{formatRupiah(trx.total)}</p>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
            <h2 class="font-semibold text-gray-800 mb-4">Aksi Cepat</h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <a href="/tenant/kasir" class="flex flex-col items-center gap-2 p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
                    <span class="text-2xl">🛒</span>
                    <span class="text-sm font-medium text-emerald-700">Kasir</span>
                </a>
                <a href="/tenant/produk" class="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                    <span class="text-2xl">📦</span>
                    <span class="text-sm font-medium text-blue-700">Produk</span>
                </a>
                <a href="/tenant/laporan" class="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                    <span class="text-2xl">📊</span>
                    <span class="text-sm font-medium text-purple-700">Laporan</span>
                </a>
                <a href="/tenant/pengaturan" class="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <span class="text-2xl">⚙️</span>
                    <span class="text-sm font-medium text-gray-700">Pengaturan</span>
                </a>
            </div>
        </div>
    </div>

    <!-- Right Column: Top Products & Info -->
    <div class="space-y-6">
        
        <!-- Produk Terlaris -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="p-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-800">🏆 Produk Terlaris</h2>
                <p class="text-xs text-gray-500 mt-1">Hari ini</p>
            </div>
            
            <div class="p-4 space-y-3">
                {#each topProducts as product, index}
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                            {index === 0 ? 'bg-yellow-100 text-yellow-700' : ''}
                            {index === 1 ? 'bg-gray-100 text-gray-600' : ''}
                            {index === 2 ? 'bg-orange-100 text-orange-700' : ''}
                            {index > 2 ? 'bg-gray-50 text-gray-500' : ''}
                        ">
                            {index + 1}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-gray-800 text-sm truncate">{product.name}</p>
                            <p class="text-xs text-gray-500">{product.sold} terjual</p>
                        </div>
                        <p class="text-sm font-medium text-gray-800">{formatRupiah(product.revenue)}</p>
                    </div>
                {/each}
            </div>

            <div class="p-4 border-t border-gray-100">
                <a href="/tenant/laporan" class="text-sm text-emerald-600 hover:underline">Lihat laporan lengkap →</a>
            </div>
        </div>

        <!-- Info Toko -->
        <div class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                    🏪
                </div>
                <div>
                    <h3 class="font-bold">{user?.nama_bisnis || 'Toko Saya'}</h3>
                    <p class="text-emerald-100 text-sm">{user?.kode_pelanggan || ''}</p>
                </div>
            </div>
            
            <div class="space-y-2 text-sm">
                <div class="flex items-center gap-2">
                    <span>👤</span>
                    <span>{user?.nama || 'Pemilik'}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span>📧</span>
                    <span>{user?.email || '-'}</span>
                </div>
            </div>

            <div class="mt-4 pt-4 border-t border-white/20">
                <a href="/tenant/pengaturan" class="text-sm font-medium hover:underline inline-flex items-center gap-1">
                    Edit Profil Toko
                    <span>→</span>
                </a>
            </div>
        </div>

        <!-- Tips -->
        <div class="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p class="text-sm font-medium text-blue-800 mb-2">💡 Tips Hari Ini</p>
            <p class="text-sm text-blue-700">
                Pastikan stok produk terlaris selalu tersedia untuk memaksimalkan penjualan Anda!
            </p>
        </div>
    </div>
</div>