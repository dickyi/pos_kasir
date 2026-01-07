<script>
  let stats = [
    { label: 'Total Produk', value: '150', icon: '📦', color: 'bg-blue-50 text-blue-600' },
    { label: 'Transaksi Hari Ini', value: '24', icon: '🛒', color: 'bg-green-50 text-green-600' },
    { label: 'Pendapatan', value: 'Rp 2.4 Jt', icon: '💰', color: 'bg-amber-50 text-amber-600' },
    { label: 'Pelanggan', value: '89', icon: '👥', color: 'bg-purple-50 text-purple-600' },
  ];
</script>

<div class="p-4 lg:p-6">
  <h1 class="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

  <!-- Stats Cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {#each stats as stat}
      <div class="bg-white rounded-xl border border-gray-200 p-4 lg:p-5">
        <div class="flex items-center gap-3">
          <div class="{stat.color} p-2.5 rounded-lg text-xl">
            {stat.icon}
          </div>
          <div>
            <p class="text-xs text-gray-500">{stat.label}</p>
            <p class="text-lg lg:text-xl font-bold text-gray-800">{stat.value}</p>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Quick Actions -->
  <div class="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 mb-6">
    <h3 class="font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <a href="/admin/transaksi" class="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
        <span>🛒</span>
        <span>Transaksi Baru</span>
      </a>
      <a href="/admin/produk" class="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
        <span>📦</span>
        <span>Tambah Produk</span>
      </a>
      <a href="/admin/kategori" class="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
        <span>📁</span>
        <span>Kelola Kategori</span>
      </a>
      <a href="/admin/laporan" class="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
        <span>📋</span>
        <span>Lihat Laporan</span>
      </a>
    </div>
  </div>

  <!-- Recent Transactions -->
  <div class="bg-white rounded-xl border border-gray-200 p-4 lg:p-5">
    <h3 class="font-semibold text-gray-800 mb-4">Transaksi Terakhir</h3>
    
    <div class="space-y-3">
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            ✓
          </div>
          <div>
            <p class="font-medium text-gray-800 text-sm">INV-001</p>
            <p class="text-xs text-gray-500">2 item • 10:30</p>
          </div>
        </div>
        <p class="font-semibold text-gray-800">Rp 85.000</p>
      </div>

      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            ✓
          </div>
          <div>
            <p class="font-medium text-gray-800 text-sm">INV-002</p>
            <p class="text-xs text-gray-500">5 item • 11:15</p>
          </div>
        </div>
        <p class="font-semibold text-gray-800">Rp 245.000</p>
      </div>

      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            ✓
          </div>
          <div>
            <p class="font-medium text-gray-800 text-sm">INV-003</p>
            <p class="text-xs text-gray-500">1 item • 12:00</p>
          </div>
        </div>
        <p class="font-semibold text-gray-800">Rp 50.000</p>
      </div>
    </div>

    <a href="/admin/transaksi" class="block text-center text-blue-600 text-sm font-medium mt-4 hover:underline">
      Lihat Semua Transaksi →
    </a>
  </div>
</div>