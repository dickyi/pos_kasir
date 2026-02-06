<!--
    TabShift.svelte - Tab Pengaturan Shift & Kas (UPDATED)
    ============================================
    Konfigurasi untuk manajemen shift dan kas:
    - MODE KASIR: Single / Per User / Multi Station
    - Wajib buka shift sebelum transaksi
    - Modal kas default
    - Multi shift per hari
    - Auto lanjut kas dari shift sebelumnya
    - Limit kas keluar untuk kasir
    - Manajemen Station (untuk Multi Station mode)
    
    - OWNER ONLY
-->
<script>
    import { enhance } from '$app/forms';
    import { fade, slide } from 'svelte/transition';
    import { 
        Clock, Wallet, RefreshCw, ArrowDownCircle, 
        Lock, Info, Banknote, Shield, Monitor,
        Users, Building2, Plus, Trash2, Edit3,
        Check, X, AlertTriangle, Settings2
    } from 'lucide-svelte';
    import SettingSection from './shared/SettingSection.svelte';
    import ToggleSwitch from './shared/ToggleSwitch.svelte';
    import FormActions from './shared/FormActions.svelte';

    export let settings = {};
    export let stations = [];
    export let isSubmitting = false;
    export let onSubmit = () => {};
    export let canEdit = true;

    // Form data - Shift Settings
    let shiftData = {
        wajib_buka_shift: true,
        modal_kas_default: 0,
        multi_shift: false,
        auto_lanjut_kas: false,
        limit_kas_keluar_kasir: 0
    };

    // Form data - Kasir Mode Settings
    let modeData = {
        kasir_mode: 'single',
        max_stations: 5,
        allow_join_shift: true,
        allow_take_over: true,
        allow_force_close: true
    };

    // Station management
    let localStations = [];
    let showAddStation = false;
    let editingStationId = null;
    let newStation = { kode: '', nama: '', deskripsi: '' };

    // Sync dengan settings
    $: if (settings) {
        shiftData = {
            wajib_buka_shift: settings.wajib_buka_shift ?? true,
            modal_kas_default: settings.modal_kas_default || 0,
            multi_shift: settings.multi_shift ?? false,
            auto_lanjut_kas: settings.auto_lanjut_kas ?? false,
            limit_kas_keluar_kasir: settings.limit_kas_keluar_kasir || 0
        };
        
        modeData = {
            kasir_mode: settings.kasir_mode || 'single',
            max_stations: settings.max_stations || 5,
            allow_join_shift: settings.allow_join_shift ?? true,
            allow_take_over: settings.allow_take_over ?? true,
            allow_force_close: settings.allow_force_close ?? true
        };
    }

    // Sync stations
    $: if (stations) {
        localStations = [...stations];
    }

    // Mode descriptions
    const modeOptions = [
        {
            value: 'single',
            label: 'Single',
            description: '1 shift untuk seluruh toko. Cocok untuk toko kecil dengan 1 kasir.',
            icon: Monitor,
            color: 'blue'
        },
        {
            value: 'per_user',
            label: 'Per Kasir',
            description: 'Setiap kasir punya shift sendiri. Cocok untuk UMKM dengan beberapa kasir.',
            icon: Users,
            color: 'emerald'
        },
        {
            value: 'multi',
            label: 'Multi Station',
            description: 'Shift berdasarkan station/mesin kasir. Cocok untuk retail dengan banyak mesin.',
            icon: Building2,
            color: 'purple'
        }
    ];

    // Format rupiah untuk display
    function formatRupiah(value) {
        if (!value) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    }

    // Quick amount buttons untuk modal default
    const quickModalAmounts = [100000, 200000, 300000, 500000];
    
    // Quick amount buttons untuk limit kas keluar
    const quickLimitAmounts = [100000, 200000, 500000, 1000000];

    // Station management functions
    function handleAddStation() {
        if (!newStation.kode || !newStation.nama) return;
        
        // Generate temporary ID for new station
        const tempStation = {
            id: `new_${Date.now()}`,
            kode: newStation.kode.toUpperCase(),
            nama: newStation.nama,
            deskripsi: newStation.deskripsi,
            is_active: true,
            isNew: true
        };
        
        localStations = [...localStations, tempStation];
        newStation = { kode: '', nama: '', deskripsi: '' };
        showAddStation = false;
    }

    function handleEditStation(station) {
        editingStationId = station.id;
        newStation = {
            kode: station.kode,
            nama: station.nama,
            deskripsi: station.deskripsi || ''
        };
    }

    function handleSaveEdit(stationId) {
        localStations = localStations.map(s => {
            if (s.id === stationId) {
                return {
                    ...s,
                    kode: newStation.kode.toUpperCase(),
                    nama: newStation.nama,
                    deskripsi: newStation.deskripsi,
                    isEdited: true
                };
            }
            return s;
        });
        editingStationId = null;
        newStation = { kode: '', nama: '', deskripsi: '' };
    }

    function handleCancelEdit() {
        editingStationId = null;
        newStation = { kode: '', nama: '', deskripsi: '' };
    }

    function handleDeleteStation(stationId) {
        if (confirm('Yakin ingin menghapus station ini?')) {
            localStations = localStations.map(s => {
                if (s.id === stationId) {
                    return { ...s, isDeleted: true };
                }
                return s;
            });
        }
    }

    function handleRestoreStation(stationId) {
        localStations = localStations.map(s => {
            if (s.id === stationId) {
                return { ...s, isDeleted: false };
            }
            return s;
        });
    }

    // Get color classes based on mode
    function getModeColorClasses(color, isSelected) {
        const colors = {
            blue: {
                bg: isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:border-blue-300',
                icon: isSelected ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600',
                text: isSelected ? 'text-blue-700' : 'text-slate-700'
            },
            emerald: {
                bg: isSelected ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-300',
                icon: isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600',
                text: isSelected ? 'text-emerald-700' : 'text-slate-700'
            },
            purple: {
                bg: isSelected ? 'bg-purple-50 border-purple-500' : 'bg-white border-slate-200 hover:border-purple-300',
                icon: isSelected ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600',
                text: isSelected ? 'text-purple-700' : 'text-slate-700'
            }
        };
        return colors[color] || colors.blue;
    }

    // Reactive: active stations count
    $: activeStations = localStations.filter(s => !s.isDeleted);
</script>

<div transition:fade={{ duration: 150 }}>
    <SettingSection 
        title="Pengaturan Shift & Kas" 
        description="Konfigurasi manajemen shift, kas kasir, dan mode operasi"
    >
        <!-- View Only Banner -->
        {#if !canEdit}
            <div class="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <Lock class="w-4 h-4 text-amber-600" />
                <span class="text-sm text-amber-700">Hanya Owner yang dapat mengubah pengaturan shift</span>
            </div>
        {/if}

        <form 
            method="POST" 
            action="?/updateShift"
            use:enhance={onSubmit}
            class="space-y-6"
        >
            <!-- ==========================================
                 SECTION: Mode Kasir (NEW!)
            ========================================== -->
            <div class="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Settings2 class="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-slate-800">Mode Kasir</h3>
                        <p class="text-xs text-slate-500">Pilih cara pengelolaan shift sesuai kebutuhan bisnis Anda</p>
                    </div>
                </div>

                <!-- Mode Selection Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {#each modeOptions as mode}
                        {@const isSelected = modeData.kasir_mode === mode.value}
                        {@const colorClasses = getModeColorClasses(mode.color, isSelected)}
                        <label 
                            class="relative cursor-pointer {!canEdit ? 'opacity-60 cursor-not-allowed' : ''}"
                        >
                            <input 
                                type="radio" 
                                name="kasir_mode" 
                                value={mode.value}
                                bind:group={modeData.kasir_mode}
                                disabled={!canEdit}
                                class="sr-only"
                            />
                            <div class="p-4 rounded-xl border-2 transition-all {colorClasses.bg}">
                                <div class="flex items-start gap-3">
                                    <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors {colorClasses.icon}">
                                        <svelte:component this={mode.icon} class="w-5 h-5" />
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2">
                                            <p class="text-sm font-semibold {colorClasses.text}">{mode.label}</p>
                                            {#if isSelected}
                                                <span class="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                                    <Check class="w-3 h-3 text-white" />
                                                </span>
                                            {/if}
                                        </div>
                                        <p class="text-xs text-slate-500 mt-1 leading-relaxed">{mode.description}</p>
                                    </div>
                                </div>
                            </div>
                        </label>
                    {/each}
                </div>

                <!-- Mode-specific info -->
                {#if modeData.kasir_mode === 'single'}
                    <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200" transition:slide={{ duration: 200 }}>
                        <p class="text-xs text-blue-700">
                            <strong>Mode Single:</strong> Hanya 1 shift aktif di seluruh toko. 
                            Kasir lain harus menunggu atau bergabung ke shift yang ada.
                        </p>
                    </div>
                {:else if modeData.kasir_mode === 'per_user'}
                    <div class="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200" transition:slide={{ duration: 200 }}>
                        <p class="text-xs text-emerald-700">
                            <strong>Mode Per Kasir:</strong> Setiap kasir bisa membuka shift sendiri tanpa mengganggu kasir lain.
                            Tidak perlu setup station, langsung bisa digunakan.
                        </p>
                    </div>
                {:else if modeData.kasir_mode === 'multi'}
                    <div class="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200" transition:slide={{ duration: 200 }}>
                        <p class="text-xs text-purple-700">
                            <strong>Mode Multi Station:</strong> Kasir harus memilih station sebelum buka shift.
                            Cocok untuk toko dengan beberapa mesin kasir fisik.
                        </p>
                    </div>
                {/if}
            </div>

            <!-- ==========================================
                 SECTION: Multi Station Settings (Conditional)
            ========================================== -->
            {#if modeData.kasir_mode === 'multi'}
                <div class="space-y-4 p-4 bg-purple-50/50 rounded-xl border border-purple-200" transition:slide={{ duration: 200 }}>
                    <h4 class="text-sm font-semibold text-purple-800 flex items-center gap-2">
                        <Building2 class="w-4 h-4" />
                        Pengaturan Multi Station
                    </h4>

                    <!-- Max Stations -->
                    <div class="space-y-2">
                        <label for="max_stations" class="block text-sm font-medium text-slate-700">
                            Maksimal Station
                        </label>
                        <input
                            type="number"
                            id="max_stations"
                            name="max_stations"
                            bind:value={modeData.max_stations}
                            min="1"
                            max="20"
                            disabled={!canEdit}
                            class="w-32 h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm
                                   focus:outline-none focus:border-purple-500 focus:ring-2 
                                   focus:ring-purple-500/20 transition-all
                                   disabled:bg-slate-50 disabled:cursor-not-allowed"
                        />
                        <p class="text-xs text-slate-500">Jumlah station maksimal yang bisa dibuat</p>
                    </div>

                    <!-- Station List -->
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <label class="block text-sm font-medium text-slate-700">
                                Daftar Station ({activeStations.length})
                            </label>
                            {#if canEdit && activeStations.length < modeData.max_stations}
                                <button
                                    type="button"
                                    on:click={() => showAddStation = !showAddStation}
                                    class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium 
                                           text-purple-600 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors"
                                >
                                    <Plus class="w-3.5 h-3.5" />
                                    Tambah Station
                                </button>
                            {/if}
                        </div>

                        <!-- Add Station Form -->
                        {#if showAddStation}
                            <div class="p-3 bg-white rounded-lg border border-purple-200 space-y-3" transition:slide={{ duration: 200 }}>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">Kode</label>
                                        <input
                                            type="text"
                                            bind:value={newStation.kode}
                                            placeholder="STN-001"
                                            maxlength="20"
                                            class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg
                                                   focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">Nama</label>
                                        <input
                                            type="text"
                                            bind:value={newStation.nama}
                                            placeholder="Kasir 1"
                                            maxlength="50"
                                            class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg
                                                   focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-slate-600 mb-1">Deskripsi (opsional)</label>
                                    <input
                                        type="text"
                                        bind:value={newStation.deskripsi}
                                        placeholder="Deskripsi station"
                                        class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg
                                               focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div class="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        on:click={() => { showAddStation = false; newStation = { kode: '', nama: '', deskripsi: '' }; }}
                                        class="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        on:click={handleAddStation}
                                        disabled={!newStation.kode || !newStation.nama}
                                        class="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 
                                               rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </div>
                        {/if}

                        <!-- Station Items -->
                        <div class="space-y-2">
                            {#each localStations as station (station.id)}
                                <div 
                                    class="flex items-center gap-3 p-3 bg-white rounded-lg border transition-all
                                           {station.isDeleted ? 'border-red-200 bg-red-50 opacity-60' : 'border-slate-200'}
                                           {station.isNew ? 'border-green-300 bg-green-50' : ''}
                                           {station.isEdited ? 'border-amber-300 bg-amber-50' : ''}"
                                    transition:slide={{ duration: 150 }}
                                >
                                    {#if editingStationId === station.id}
                                        <!-- Edit Mode -->
                                        <div class="flex-1 grid grid-cols-3 gap-2">
                                            <input
                                                type="text"
                                                bind:value={newStation.kode}
                                                class="h-8 px-2 text-xs border border-slate-200 rounded"
                                            />
                                            <input
                                                type="text"
                                                bind:value={newStation.nama}
                                                class="h-8 px-2 text-xs border border-slate-200 rounded"
                                            />
                                            <input
                                                type="text"
                                                bind:value={newStation.deskripsi}
                                                placeholder="Deskripsi"
                                                class="h-8 px-2 text-xs border border-slate-200 rounded"
                                            />
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <button
                                                type="button"
                                                on:click={() => handleSaveEdit(station.id)}
                                                class="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded"
                                            >
                                                <Check class="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                on:click={handleCancelEdit}
                                                class="p-1.5 text-slate-400 hover:bg-slate-100 rounded"
                                            >
                                                <X class="w-4 h-4" />
                                            </button>
                                        </div>
                                    {:else}
                                        <!-- View Mode -->
                                        <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Monitor class="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center gap-2">
                                                <span class="text-xs font-mono text-slate-500">{station.kode}</span>
                                                <span class="text-sm font-medium text-slate-700 {station.isDeleted ? 'line-through' : ''}">
                                                    {station.nama}
                                                </span>
                                                {#if station.isNew}
                                                    <span class="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded">BARU</span>
                                                {/if}
                                                {#if station.isEdited}
                                                    <span class="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">DIUBAH</span>
                                                {/if}
                                                {#if station.isDeleted}
                                                    <span class="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 rounded">DIHAPUS</span>
                                                {/if}
                                            </div>
                                            {#if station.deskripsi}
                                                <p class="text-xs text-slate-500 truncate">{station.deskripsi}</p>
                                            {/if}
                                        </div>
                                        {#if canEdit}
                                            <div class="flex items-center gap-1">
                                                {#if station.isDeleted}
                                                    <button
                                                        type="button"
                                                        on:click={() => handleRestoreStation(station.id)}
                                                        class="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded"
                                                        title="Batalkan hapus"
                                                    >
                                                        <RefreshCw class="w-4 h-4" />
                                                    </button>
                                                {:else}
                                                    <button
                                                        type="button"
                                                        on:click={() => handleEditStation(station)}
                                                        class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                                                        title="Edit"
                                                    >
                                                        <Edit3 class="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        on:click={() => handleDeleteStation(station.id)}
                                                        class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 class="w-4 h-4" />
                                                    </button>
                                                {/if}
                                            </div>
                                        {/if}
                                    {/if}
                                </div>
                            {:else}
                                <div class="p-4 text-center text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                    Belum ada station. Klik "Tambah Station" untuk membuat.
                                </div>
                            {/each}
                        </div>

                        <!-- Hidden input untuk kirim data stations -->
                        <input type="hidden" name="stations_data" value={JSON.stringify(localStations)} />
                    </div>
                </div>
            {/if}

            <!-- ==========================================
                 SECTION: Fitur Shift Lanjutan (untuk Single & Multi)
            ========================================== -->
            {#if modeData.kasir_mode === 'single' || modeData.kasir_mode === 'multi'}
                <div class="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200" transition:slide={{ duration: 200 }}>
                    <h4 class="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <Users class="w-4 h-4" />
                        Fitur Kolaborasi Shift
                    </h4>

                    <!-- Allow Join Shift -->
                    <div class="flex items-center justify-between py-2">
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Users class="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p class="text-sm font-medium text-slate-700">Izinkan Join Shift</p>
                                <p class="text-xs text-slate-500">Admin/Owner bisa bergabung ke shift kasir lain</p>
                            </div>
                        </div>
                        <ToggleSwitch 
                            name="allow_join_shift" 
                            bind:checked={modeData.allow_join_shift}
                            disabled={!canEdit}
                        />
                    </div>

                    <!-- Allow Take Over -->
                    <div class="flex items-center justify-between py-2 border-t border-slate-200">
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <RefreshCw class="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                                <p class="text-sm font-medium text-slate-700">Izinkan Take Over</p>
                                <p class="text-xs text-slate-500">Admin/Owner bisa mengambil alih kepemilikan shift</p>
                            </div>
                        </div>
                        <ToggleSwitch 
                            name="allow_take_over" 
                            bind:checked={modeData.allow_take_over}
                            disabled={!canEdit}
                        />
                    </div>

                    <!-- Allow Force Close -->
                    <div class="flex items-center justify-between py-2 border-t border-slate-200">
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <AlertTriangle class="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                                <p class="text-sm font-medium text-slate-700">Izinkan Force Close</p>
                                <p class="text-xs text-slate-500">Owner bisa menutup paksa shift yang terbengkalai</p>
                            </div>
                        </div>
                        <ToggleSwitch 
                            name="allow_force_close" 
                            bind:checked={modeData.allow_force_close}
                            disabled={!canEdit}
                        />
                    </div>
                </div>
            {/if}

            <!-- ==========================================
                 SECTION: Wajib Buka Shift
            ========================================== -->
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div class="flex items-start justify-between gap-4">
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Clock class="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-slate-800">Wajib Buka Shift</p>
                            <p class="text-xs text-slate-500 mt-1">
                                Kasir harus membuka shift terlebih dahulu sebelum dapat melakukan transaksi penjualan
                            </p>
                        </div>
                    </div>
                    <ToggleSwitch 
                        name="wajib_buka_shift" 
                        bind:checked={shiftData.wajib_buka_shift}
                        disabled={!canEdit}
                    />
                </div>
                
                {#if shiftData.wajib_buka_shift}
                    <div class="mt-3 pt-3 border-t border-slate-200">
                        <p class="text-xs text-emerald-600 flex items-center gap-1.5">
                            <Shield class="w-3.5 h-3.5" />
                            Transaksi akan diblokir jika shift belum dibuka
                        </p>
                    </div>
                {/if}
            </div>

            <!-- ==========================================
                 SECTION: Modal Kas Default
            ========================================== -->
            <div class="space-y-3">
                <label for="modal_kas_default" class="block text-sm font-medium text-slate-700">
                    Modal Kas Default
                </label>
                <div class="relative max-w-sm">
                    <Wallet class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="number"
                        id="modal_kas_default"
                        name="modal_kas_default"
                        bind:value={shiftData.modal_kas_default}
                        min="0"
                        step="1000"
                        placeholder="0"
                        disabled={!canEdit}
                        class="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:border-emerald-500 focus:ring-2 
                               focus:ring-emerald-500/20 transition-all
                               disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                </div>
                
                <!-- Quick Amount Buttons -->
                {#if canEdit}
                    <div class="flex flex-wrap gap-2">
                        {#each quickModalAmounts as amount}
                            <button
                                type="button"
                                on:click={() => shiftData.modal_kas_default = amount}
                                class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
                                       {shiftData.modal_kas_default === amount 
                                           ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                           : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}"
                            >
                                {formatRupiah(amount)}
                            </button>
                        {/each}
                    </div>
                {/if}
                
                <p class="text-xs text-slate-500">
                    Nilai default saat memilih opsi "Modal Default" ketika membuka shift. Set 0 untuk menonaktifkan.
                </p>
            </div>

            <!-- ==========================================
                 SECTION: Multi Shift
            ========================================== -->
            <div class="flex items-center justify-between py-4 border-t border-slate-100">
                <div class="flex items-start gap-3">
                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <RefreshCw class="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <p class="text-sm font-medium text-slate-700">Multi Shift per Hari</p>
                        <p class="text-xs text-slate-500 mt-0.5">
                            Izinkan membuka lebih dari satu shift dalam satu hari (shift pagi, siang, malam)
                        </p>
                    </div>
                </div>
                <ToggleSwitch 
                    name="multi_shift" 
                    bind:checked={shiftData.multi_shift}
                    disabled={!canEdit}
                />
            </div>

            <!-- ==========================================
                 SECTION: Auto Lanjut Kas
            ========================================== -->
            <div class="flex items-center justify-between py-4 border-t border-slate-100">
                <div class="flex items-start gap-3">
                    <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Banknote class="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                        <p class="text-sm font-medium text-slate-700">Auto Lanjut Kas</p>
                        <p class="text-xs text-slate-500 mt-0.5">
                            Otomatis gunakan kas akhir shift sebelumnya sebagai modal shift baru
                        </p>
                    </div>
                </div>
                <ToggleSwitch 
                    name="auto_lanjut_kas" 
                    bind:checked={shiftData.auto_lanjut_kas}
                    disabled={!canEdit}
                />
            </div>

            <!-- ==========================================
                 SECTION: Limit Kas Keluar Kasir
            ========================================== -->
            <div class="space-y-3 pt-4 border-t border-slate-100">
                <label for="limit_kas_keluar_kasir" class="block text-sm font-medium text-slate-700">
                    Limit Kas Keluar untuk Kasir
                </label>
                <div class="relative max-w-sm">
                    <ArrowDownCircle class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="number"
                        id="limit_kas_keluar_kasir"
                        name="limit_kas_keluar_kasir"
                        bind:value={shiftData.limit_kas_keluar_kasir}
                        min="0"
                        step="10000"
                        placeholder="0"
                        disabled={!canEdit}
                        class="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:border-emerald-500 focus:ring-2 
                               focus:ring-emerald-500/20 transition-all
                               disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                </div>
                
                <!-- Quick Amount Buttons -->
                {#if canEdit}
                    <div class="flex flex-wrap gap-2">
                        <button
                            type="button"
                            on:click={() => shiftData.limit_kas_keluar_kasir = 0}
                            class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
                                   {shiftData.limit_kas_keluar_kasir === 0 
                                       ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                       : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}"
                        >
                            Tidak Terbatas
                        </button>
                        {#each quickLimitAmounts as amount}
                            <button
                                type="button"
                                on:click={() => shiftData.limit_kas_keluar_kasir = amount}
                                class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
                                       {shiftData.limit_kas_keluar_kasir === amount 
                                           ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                           : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}"
                            >
                                {formatRupiah(amount)}
                            </button>
                        {/each}
                    </div>
                {/if}
                
                <p class="text-xs text-slate-500">
                    Batas maksimal kas keluar yang dapat dilakukan kasir per transaksi. Set 0 untuk tidak ada batasan.
                </p>
            </div>

            <!-- ==========================================
                 INFO BOX
            ========================================== -->
            <div class="p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-3">
                <Info class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p class="text-sm text-blue-800 font-medium">Tentang Mode Kasir</p>
                    <p class="text-xs text-blue-700 mt-1 leading-relaxed">
                        <strong>Single:</strong> Cocok untuk toko kecil dengan 1 kasir aktif.<br />
                        <strong>Per Kasir:</strong> Setiap kasir punya shift sendiri, ideal untuk UMKM.<br />
                        <strong>Multi Station:</strong> Untuk retail dengan beberapa mesin kasir fisik.
                    </p>
                </div>
            </div>

            <FormActions {isSubmitting} {canEdit} />
        </form>
    </SettingSection>
</div>