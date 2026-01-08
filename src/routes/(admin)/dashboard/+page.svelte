<script>
  import { 
    Package, 
    ShoppingCart, 
    DollarSign, 
    Users,
    Plus,
    FolderOpen,
    FileText,
    TrendingUp,
    CheckCircle2,
    Clock
  } from 'lucide-svelte';
  
  // Stats data
  let stats = [
    { 
      label: 'Total Produk', 
      value: '150', 
      icon: Package, 
      color: 'bg-blue-50 text-blue-600',
      trend: '+12%'
    },
    { 
      label: 'Transaksi Hari Ini', 
      value: '24', 
      icon: ShoppingCart, 
      color: 'bg-green-50 text-green-600',
      trend: '+8%'
    },
    { 
      label: 'Pendapatan', 
      value: 'Rp 2.4 Jt', 
      icon: DollarSign, 
      color: 'bg-amber-50 text-amber-600',
      trend: '+15%'
    },
    { 
      label: 'Pelanggan', 
      value: '89', 
      icon: Users, 
      color: 'bg-purple-50 text-purple-600',
      trend: '+5%'
    },
  ];

  // Quick actions
  let quickActions = [
    { 
      label: 'Transaksi Baru', 
      href: '/transaksi', 
      icon: ShoppingCart,
      variant: 'primary' 
    },
    { 
      label: 'Tambah Produk', 
      href: '/produk', 
      icon: Package,
      variant: 'secondary' 
    },
    { 
      label: 'Kelola Kategori', 
      href: '/kategori', 
      icon: FolderOpen,
      variant: 'secondary' 
    },
    { 
      label: 'Lihat Laporan', 
      href: '/laporan', 
      icon: FileText,
      variant: 'secondary' 
    },
  ];

  // Recent transactions
  let recentTransactions = [
    {
      invoice: 'INV-001',
      items: 2,
      time: '10:30',
      amount: 'Rp 85.000',
      status: 'completed'
    },
    {
      invoice: 'INV-002',
      items: 5,
      time: '11:15',
      amount: 'Rp 245.000',
      status: 'completed'
    },
    {
      invoice: 'INV-003',
      items: 1,
      time: '12:00',
      amount: 'Rp 50.000',
      status: 'completed'
    },
    {
      invoice: 'INV-004',
      items: 3,
      time: '12:45',
      amount: 'Rp 125.000',
      status: 'pending'
    },
  ];
</script>

<div class="p-4 lg:p-6 max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
    <p class="text-sm text-gray-500">Ringkasan bisnis Anda hari ini</p>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {#each stats as stat}
      <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-3">
          <div class="{stat.color} p-2.5 rounded-lg">
            <svelte:component this={stat.icon} class="w-5 h-5" />
          </div>
          <div class="flex items-center gap-1 text-green-600 text-xs font-medium">
            <TrendingUp class="w-3 h-3" />
            <span>{stat.trend}</span>
          </div>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">{stat.label}</p>
          <p class="text-2xl font-semibold text-gray-900">{stat.value}</p>
        </div>
      </div>
    {/each}
  </div>

  <!-- Quick Actions -->
  <div class="bg-white rounded-xl border border-gray-200 p-5 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-semibold text-gray-900">Aksi Cepat</h2>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {#each quickActions as action}
        <a 
          href={action.href}
          class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all
                 {action.variant === 'primary' 
                   ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow' 
                   : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'}"
        >
          <svelte:component this={action.icon} class="w-4 h-4" />
          <span class="hidden sm:inline">{action.label}</span>
        </a>
      {/each}
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    
    <!-- Recent Transactions -->
    <div class="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-gray-900">Transaksi Terakhir</h2>
        <a href="/transaksi" class="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Lihat Semua →
        </a>
      </div>
      
      <div class="space-y-3">
        {#each recentTransactions as transaction}
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 {transaction.status === 'completed' ? 'bg-green-100' : 'bg-amber-100'} rounded-full flex items-center justify-center">
                {#if transaction.status === 'completed'}
                  <CheckCircle2 class="w-5 h-5 text-green-600" />
                {:else}
                  <Clock class="w-5 h-5 text-amber-600" />
                {/if}
              </div>
              <div>
                <p class="font-medium text-gray-900 text-sm">{transaction.invoice}</p>
                <p class="text-xs text-gray-500">{transaction.items} item • {transaction.time}</p>
              </div>
            </div>
            <p class="font-semibold text-gray-900 text-sm">{transaction.amount}</p>
          </div>
        {/each}
      </div>
    </div>

    <!-- Activity Summary -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h2 class="text-base font-semibold text-gray-900 mb-4">Ringkasan Aktivitas</h2>
      
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package class="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Stok Menipis</p>
            <p class="text-xs text-gray-500 mt-0.5">5 produk perlu restock</p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShoppingCart class="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Penjualan Hari Ini</p>
            <p class="text-xs text-gray-500 mt-0.5">24 transaksi berhasil</p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users class="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Pelanggan Baru</p>
            <p class="text-xs text-gray-500 mt-0.5">3 pendaftaran hari ini</p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp class="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Pertumbuhan</p>
            <p class="text-xs text-gray-500 mt-0.5">+15% dari minggu lalu</p>
          </div>
        </div>
      </div>

      <a href="/laporan" class="block mt-4 w-full text-center px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
        Lihat Laporan Detail
      </a>
    </div>

  </div>
</div>