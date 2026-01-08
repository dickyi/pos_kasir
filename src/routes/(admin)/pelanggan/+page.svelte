<script>
  import {
    Search,
    Plus,
    Pencil,
    Trash2,
    X,
    AlertTriangle,
    Users,
    Phone,
    Mail
  } from "lucide-svelte";

  export let data;
  export let form;

  let pelanggan = data.pelanggan ?? [];
  let searchQuery = "";

  // Modal state
  let showModal = false;
  let showDeleteModal = false;
  let isEdit = false;
  let selectedPelanggan = null;

  // Form data
  let formData = {
    id: "",
    kode_pelanggan: "",
    nama_bisnis: "",
    nama_pemilik: "",
    email: "",
    no_telepon: "",
    alamat: "",
    status: "aktif"
  };

  // Filter pelanggan
  $: filteredPelanggan = pelanggan.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.nama_bisnis ?? "").toLowerCase().includes(q) ||
      (p.kode_pelanggan ?? "").toLowerCase().includes(q) ||
      (p.nama_pemilik ?? "").toLowerCase().includes(q)
    );
  });

  function generateKode() {
    const lastNum =
      pelanggan.length > 0
        ? Math.max(
            ...pelanggan.map((p) => parseInt((p.kode_pelanggan ?? "").replace("PLG", "")) || 0)
          )
        : 0;
    return `PLG${String(lastNum + 1).padStart(3, "0")}`;
  }

  function openAddModal() {
    isEdit = false;
    formData = {
      id: "",
      kode_pelanggan: generateKode(),
      nama_bisnis: "",
      nama_pemilik: "",
      email: "",
      no_telepon: "",
      alamat: "",
      status: "aktif"
    };
    showModal = true;
  }

  function openEditModal(p) {
    isEdit = true;
    formData = { ...p };
    showModal = true;
  }

  function openDeleteModal(p) {
    selectedPelanggan = p;
    showDeleteModal = true;
  }

  function closeModal() {
    showModal = false;
    showDeleteModal = false;
    selectedPelanggan = null;
  }

  $: if (form?.success) closeModal();
</script>

<!-- Layout wrapper -->
<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div class="space-y-1">
      <h1 class="text-xl font-semibold text-slate-900">Daftar Pelanggan</h1>
      <p class="text-sm text-slate-500">Kelola data pelanggan UMKM</p>
    </div>

    <button
      type="button"
      on:click={openAddModal}
      class="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
    >
      <Plus size={16} />
      Tambah Pelanggan
    </button>
  </div>

  <!-- Alert -->
  {#if form?.message}
    <div
      class="rounded-lg border px-4 py-3 text-sm flex items-start gap-3
        {form?.success
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-rose-200 bg-rose-50 text-rose-800'}"
    >
      {#if form?.success}
        <div class="mt-0.5 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
          <Users size={14} />
        </div>
      {:else}
        <div class="mt-0.5 h-5 w-5 rounded-full bg-rose-100 flex items-center justify-center">
          <AlertTriangle size={14} />
        </div>
      {/if}
      <div class="leading-relaxed">{form.message}</div>
    </div>
  {/if}

  <!-- Search -->
  <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="relative">
      <div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <Search size={16} />
      </div>
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Cari pelanggan (kode, bisnis, pemilik)..."
        class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
      />
    </div>
  </div>

  <!-- Table Desktop -->
  <div class="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
    <table class="w-full">
      <thead class="bg-slate-50 border-b border-slate-200">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-600">Kode</th>
          <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-600">Nama Bisnis</th>
          <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-600">Pemilik</th>
          <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-600">Kontak</th>
          <th class="px-4 py-3 text-center text-xs font-semibold tracking-wide text-slate-600">Status</th>
          <th class="px-4 py-3 text-right text-xs font-semibold tracking-wide text-slate-600">Aksi</th>
        </tr>
      </thead>

      <tbody class="divide-y divide-slate-100">
        {#each filteredPelanggan as p}
          <tr class="hover:bg-slate-50/60">
            <td class="px-4 py-3 text-sm font-mono text-slate-700">{p.kode_pelanggan}</td>

            <td class="px-4 py-3">
              <div class="space-y-0.5">
                <div class="text-sm font-medium text-slate-900">{p.nama_bisnis}</div>
                <div class="text-xs text-slate-500">{p.email || "-"}</div>
              </div>
            </td>

            <td class="px-4 py-3 text-sm text-slate-700">{p.nama_pemilik}</td>

            <td class="px-4 py-3">
              <div class="space-y-1 text-sm text-slate-700">
                <div class="flex items-center gap-2">
                  <Phone size={14} class="text-slate-400" />
                  <span>{p.no_telepon || "-"}</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-slate-500">
                  <Mail size={14} class="text-slate-400" />
                  <span class="truncate max-w-[280px]">{p.email || "-"}</span>
                </div>
              </div>
            </td>

            <td class="px-4 py-3 text-center">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium
                  {p.status === 'aktif'
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'}"
              >
                {p.status}
              </span>
            </td>

            <td class="px-4 py-3">
              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  on:click={() => openEditModal(p)}
                  class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                >
                  <Pencil size={16} />
                  <span class="hidden lg:inline">Edit</span>
                </button>

                <button
                  type="button"
                  on:click={() => openDeleteModal(p)}
                  class="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500/15"
                >
                  <Trash2 size={16} />
                  <span class="hidden lg:inline">Hapus</span>
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Card Mobile -->
  <div class="grid gap-3 md:hidden">
    {#each filteredPelanggan as p}
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="text-sm font-semibold text-slate-900">{p.nama_bisnis}</div>
            <div class="mt-1 text-xs font-mono text-slate-500">{p.kode_pelanggan}</div>
          </div>

          <span
            class="shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium
              {p.status === 'aktif'
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'}"
          >
            {p.status}
          </span>
        </div>

        <div class="mt-3 space-y-2 text-sm text-slate-700">
          <div class="flex items-center gap-2">
            <Users size={14} class="text-slate-400" />
            <span class="truncate">{p.nama_pemilik}</span>
          </div>
          <div class="flex items-center gap-2">
            <Phone size={14} class="text-slate-400" />
            <span>{p.no_telepon || "-"}</span>
          </div>
        </div>

        <div class="mt-4 flex gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            on:click={() => openEditModal(p)}
            class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={16} />
            Edit
          </button>
          <button
            type="button"
            on:click={() => openDeleteModal(p)}
            class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
          >
            <Trash2 size={16} />
            Hapus
          </button>
        </div>
      </div>
    {/each}
  </div>

  <!-- Empty State -->
  {#if filteredPelanggan.length === 0}
    <div class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-500">
        <Users size={20} />
      </div>
      <div class="text-sm font-semibold text-slate-900">Tidak ada pelanggan</div>
      <div class="mt-1 text-sm text-slate-500">
        Coba ubah kata kunci pencarian atau tambahkan pelanggan baru.
      </div>

      <div class="mt-5">
        <button
          type="button"
          on:click={openAddModal}
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Plus size={16} />
          Tambah Pelanggan
        </button>
      </div>
    </div>
  {/if}
</div>

<!-- Modal Tambah/Edit -->
{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
      <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h3 class="text-base font-semibold text-slate-900">
            {isEdit ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
          </h3>
          <p class="mt-0.5 text-xs text-slate-500">
            Lengkapi informasi pelanggan dengan benar.
          </p>
        </div>

        <button
          type="button"
          on:click={closeModal}
          class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>
      </div>

      <form method="POST" action={isEdit ? "?/update" : "?/create"} class="space-y-4 px-5 py-5">
        {#if isEdit}
          <input type="hidden" name="id" value={formData.id} />
        {/if}

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Kode Pelanggan</label>
            <input
              type="text"
              name="kode_pelanggan"
              bind:value={formData.kode_pelanggan}
              readonly
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
            />
          </div>

          {#if isEdit}
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select
                name="status"
                bind:value={formData.status}
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          {:else}
            <div class="hidden sm:block"></div>
          {/if}
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Nama Bisnis *</label>
          <input
            type="text"
            name="nama_bisnis"
            bind:value={formData.nama_bisnis}
            required
            placeholder="Contoh: Toko Makmur Jaya"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Nama Pemilik *</label>
          <input
            type="text"
            name="nama_pemilik"
            bind:value={formData.nama_pemilik}
            required
            placeholder="Contoh: Budi Santoso"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              name="email"
              bind:value={formData.email}
              placeholder="email@contoh.com"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">No. Telepon</label>
            <input
              type="text"
              name="no_telepon"
              bind:value={formData.no_telepon}
              placeholder="08xxxxxxxxxx"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            />
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Alamat</label>
          <textarea
            name="alamat"
            bind:value={formData.alamat}
            rows="3"
            placeholder="Alamat lengkap..."
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
          ></textarea>
        </div>

        <div class="flex gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            on:click={closeModal}
            class="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            class="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {isEdit ? "Update" : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal Konfirmasi Hapus -->
{#if showDeleteModal && selectedPelanggan}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
      <div class="px-6 py-6">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-700">
          <AlertTriangle size={20} />
        </div>

        <h3 class="text-center text-base font-semibold text-slate-900">Hapus pelanggan?</h3>
        <p class="mt-2 text-center text-sm text-slate-600">
          Anda yakin ingin menghapus <span class="font-semibold">{selectedPelanggan.nama_bisnis}</span>?
          Tindakan ini tidak dapat dibatalkan.
        </p>

        <form method="POST" action="?/delete" class="mt-6 flex gap-3">
          <input type="hidden" name="id" value={selectedPelanggan.id} />

          <button
            type="button"
            on:click={closeModal}
            class="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            class="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            Hapus
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}
