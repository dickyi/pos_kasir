<script>
    export let data;
    export let form;

    let pelanggan = data.pelanggan;
    let searchQuery = '';
    
    // Modal state
    let showModal = false;
    let showDeleteModal = false;
    let isEdit = false;
    let selectedPelanggan = null;

    // Form data
    let formData = {
        id: '',
        kode_pelanggan: '',
        nama_bisnis: '',
        nama_pemilik: '',
        email: '',
        no_telepon: '',
        alamat: '',
        status: 'aktif'
    };

    // Filter pelanggan
    $: filteredPelanggan = pelanggan.filter(p =>
        p.nama_bisnis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kode_pelanggan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nama_pemilik.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Generate kode pelanggan baru
    function generateKode() {
        const lastNum = pelanggan.length > 0 
            ? Math.max(...pelanggan.map(p => parseInt(p.kode_pelanggan.replace('PLG', '')) || 0))
            : 0;
        return `PLG${String(lastNum + 1).padStart(3, '0')}`;
    }

    // Open modal untuk tambah
    function openAddModal() {
        isEdit = false;
        formData = {
            id: '',
            kode_pelanggan: generateKode(),
            nama_bisnis: '',
            nama_pemilik: '',
            email: '',
            no_telepon: '',
            alamat: '',
            status: 'aktif'
        };
        showModal = true;
    }

    // Open modal untuk edit
    function openEditModal(p) {
        isEdit = true;
        formData = { ...p };
        showModal = true;
    }

    // Open modal konfirmasi hapus
    function openDeleteModal(p) {
        selectedPelanggan = p;
        showDeleteModal = true;
    }

    // Close modal
    function closeModal() {
        showModal = false;
        showDeleteModal = false;
        selectedPelanggan = null;
    }

    // Refresh data setelah action
    $: if (form?.success) {
        closeModal();
    }
</script>

<!-- Header -->
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div>
        <h1 class="text-xl font-bold text-gray-800">Daftar Pelanggan</h1>
        <p class="text-sm text-gray-500">Kelola data pelanggan UMKM</p>
    </div>
    <button
        on:click={openAddModal}
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
    >
        + Tambah Pelanggan
    </button>
</div>

<!-- Alert -->
{#if form?.message}
    <div class="mb-4 p-4 rounded-lg {form?.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}">
        {form.message}
    </div>
{/if}

<!-- Search -->
<div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
    <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
            type="text"
            bind:value={searchQuery}
            placeholder="Cari pelanggan..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    </div>
</div>

<!-- Table Desktop -->
<div class="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
    <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kode</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nama Bisnis</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Pemilik</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">No. Telepon</th>
                <th class="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
            {#each filteredPelanggan as p}
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm font-mono text-gray-600">{p.kode_pelanggan}</td>
                    <td class="px-4 py-3">
                        <p class="text-sm font-medium text-gray-800">{p.nama_bisnis}</p>
                        <p class="text-xs text-gray-500">{p.email || '-'}</p>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">{p.nama_pemilik}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{p.no_telepon || '-'}</td>
                    <td class="px-4 py-3 text-center">
                        <span class="px-2 py-1 text-xs rounded-full {p.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            {p.status}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <button on:click={() => openEditModal(p)} class="text-blue-600 hover:text-blue-800 mr-2 text-sm">Edit</button>
                        <button on:click={() => openDeleteModal(p)} class="text-red-600 hover:text-red-800 text-sm">Hapus</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<!-- Card Mobile -->
<div class="md:hidden space-y-3">
    {#each filteredPelanggan as p}
        <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <p class="font-medium text-gray-800">{p.nama_bisnis}</p>
                    <p class="text-xs text-gray-500 font-mono">{p.kode_pelanggan}</p>
                </div>
                <span class="px-2 py-1 text-xs rounded-full {p.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                    {p.status}
                </span>
            </div>
            <p class="text-sm text-gray-600 mb-1">👤 {p.nama_pemilik}</p>
            <p class="text-sm text-gray-600 mb-3">📞 {p.no_telepon || '-'}</p>
            <div class="flex gap-2 pt-3 border-t border-gray-100">
                <button on:click={() => openEditModal(p)} class="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg">Edit</button>
                <button on:click={() => openDeleteModal(p)} class="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg">Hapus</button>
            </div>
        </div>
    {/each}
</div>

<!-- Empty State -->
{#if filteredPelanggan.length === 0}
    <div class="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p class="text-gray-500">Tidak ada pelanggan ditemukan</p>
    </div>
{/if}

<!-- Modal Tambah/Edit -->
{#if showModal}
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-800">
                    {isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
                </h3>
            </div>
            
            <form method="POST" action={isEdit ? '?/update' : '?/create'} class="p-4 space-y-4">
                {#if isEdit}
                    <input type="hidden" name="id" value={formData.id} />
                {/if}
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Kode Pelanggan</label>
                    <input
                        type="text"
                        name="kode_pelanggan"
                        bind:value={formData.kode_pelanggan}
                        readonly
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nama Bisnis *</label>
                    <input
                        type="text"
                        name="nama_bisnis"
                        bind:value={formData.nama_bisnis}
                        required
                        placeholder="Contoh: Toko Makmur Jaya"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik *</label>
                    <input
                        type="text"
                        name="nama_pemilik"
                        bind:value={formData.nama_pemilik}
                        required
                        placeholder="Contoh: Budi Santoso"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            bind:value={formData.email}
                            placeholder="email@contoh.com"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                        <input
                            type="text"
                            name="no_telepon"
                            bind:value={formData.no_telepon}
                            placeholder="08xxxxxxxxxx"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                    <textarea
                        name="alamat"
                        bind:value={formData.alamat}
                        rows="2"
                        placeholder="Alamat lengkap..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                </div>

                {#if isEdit}
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            name="status"
                            bind:value={formData.status}
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif</option>
                        </select>
                    </div>
                {/if}

                <div class="flex gap-3 pt-4">
                    <button
                        type="button"
                        on:click={closeModal}
                        class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        {isEdit ? 'Update' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- Modal Konfirmasi Hapus -->
{#if showDeleteModal && selectedPelanggan}
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl w-full max-w-sm p-6">
            <div class="text-center">
                <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="text-2xl">⚠️</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Hapus Pelanggan?</h3>
                <p class="text-sm text-gray-500 mb-6">
                    Apakah Anda yakin ingin menghapus <strong>{selectedPelanggan.nama_bisnis}</strong>? 
                    Tindakan ini tidak dapat dibatalkan.
                </p>
            </div>
            
            <form method="POST" action="?/delete" class="flex gap-3">
                <input type="hidden" name="id" value={selectedPelanggan.id} />
                <button
                    type="button"
                    on:click={closeModal}
                    class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Hapus
                </button>
            </form>
        </div>
    </div>
{/if}