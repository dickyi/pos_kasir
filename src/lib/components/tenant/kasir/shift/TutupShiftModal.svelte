<!--
    TutupShiftModal.svelte
    =====================================================
    Modal untuk menutup shift dengan rekap lengkap:
    - Ringkasan penjualan per metode bayar
    - Total kas masuk/keluar
    - Selisih kas (sistem vs aktual)
    - Input kas aktual dari kasir
    
    UPDATED FOR 3 MODES:
    - Single Mode: 1 shift global, bisa ada joined users
    - Per User Mode: 1 shift per kasir, TIDAK ada join/takeover
    - Multi Station Mode: 1 shift per station, bisa ada joined users
    
    Props:
    - open: boolean
    - shiftData: object - Data shift aktif dengan ringkasan
    - isLoading: boolean
    - currentUserId: number - ID user saat ini
    - userRole: string - Role user (kasir/admin/owner)
    - stationName: string - Nama station (untuk Multi Mode)
    - shiftUsers: array - Daftar user yang join shift
    - kasirMode: string - Mode kasir ('single' | 'per_user' | 'multi')
    - isPerUserMode: boolean - Apakah mode per_user
    
    Events:
    - submit: { kasAkhirAktual, catatan }
    - leaveShift: {} - Untuk user yang ingin keluar dari shift
    - close
    
    =====================================================
-->
<script>
    import { 
        Square, X, Banknote, QrCode, Building2, CreditCard,
        TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle,
        Calculator, AlertTriangle, CheckCircle, Loader2,
        Clock, User, Receipt, Wallet, Info, ChevronDown, ChevronUp,
        DollarSign, PiggyBank, BadgeCheck, XCircle, Users, 
        Monitor, LogOut, Shield, Crown, UserCheck, Store, Laptop
    } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { fly, fade, slide, scale } from 'svelte/transition';
    import { formatRupiah } from '$lib/utils/format.js';

    // ==========================================
    // PROPS
    // ==========================================
    
    /** @type {boolean} Apakah modal terbuka */
    export let open = false;
    
    /** @type {Object|null} Data shift aktif dengan ringkasan */
    export let shiftData = null;
    
    /** @type {boolean} Sedang dalam proses */
    export let isLoading = false;
    
    /** @type {number|null} ID user saat ini */
    export let currentUserId = null;
    
    /** @type {string} Role user saat ini */
    export let userRole = 'kasir';
    
    /** @type {string|null} Nama station (untuk Multi Mode) */
    export let stationName = null;
    
    /** @type {Array} Daftar user yang join shift */
    export let shiftUsers = [];
    
    /** @type {string} Mode kasir: 'single' | 'per_user' | 'multi' */
    export let kasirMode = 'single';
    
    /** @type {boolean} Apakah mode per_user */
    export let isPerUserMode = false;

    // ==========================================
    // DISPATCHER
    // ==========================================
    const dispatch = createEventDispatcher();

    // ==========================================
    // LOCAL STATE
    // ==========================================
    
    /** @type {number} Kas akhir aktual dari kasir */
    let kasAkhirAktual = 0;
    
    /** @type {string} Catatan penutupan shift */
    let catatan = '';
    
    /** @type {boolean} Expand detail penjualan */
    let showDetailPenjualan = false;
    
    /** @type {boolean} Expand detail kas */
    let showDetailKas = false;
    
    /** @type {boolean} Expand detail users */
    let showDetailUsers = false;
    
    /** @type {boolean} Konfirmasi tutup shift */
    let showConfirmation = false;
    
    /** @type {boolean} Konfirmasi leave shift */
    let showLeaveConfirmation = false;

    // ==========================================
    // REACTIVE - Mode Checks
    // ==========================================
    
    $: isSingleMode = kasirMode === 'single';
    $: isMultiMode = kasirMode === 'multi';
    
    // Mode badge info
    $: modeBadge = {
        single: { icon: Store, label: 'Single Mode', color: 'blue' },
        per_user: { icon: User, label: 'Per Kasir', color: 'green' },
        multi: { icon: Laptop, label: 'Multi Station', color: 'purple' }
    }[kasirMode] || { icon: Store, label: 'Single', color: 'blue' };

    // ==========================================
    // REACTIVE - Permission & Role Checks
    // ==========================================
    
    // Cek apakah user adalah pemilik shift
    $: isShiftOwner = currentUserId && (
        shiftData?.tenant_user_id === currentUserId || 
        shiftData?.user_id === currentUserId
    );
    
    // Cek apakah user adalah admin/owner
    $: isAdminOrOwner = ['admin', 'owner'].includes(userRole?.toLowerCase());
    
    // Cek apakah user bisa tutup shift (pemilik ATAU admin/owner)
    $: canCloseShift = isShiftOwner || isAdminOrOwner;
    
    // Cek apakah user adalah joined user (bukan pemilik)
    // NOTE: Di mode per_user, tidak ada joined user
    $: isJoinedUser = !isPerUserMode && !isShiftOwner && shiftUsers?.some(u => 
        u.user_id === currentUserId || u.tenant_user_id === currentUserId
    );
    
    // Nama pemilik shift
    $: ownerName = shiftData?.kasir_nama || shiftData?.user_nama || shiftData?.nama_user || shiftData?.nama || 'Kasir';
    
    // Jumlah user yang join (tidak termasuk owner)
    // NOTE: Di mode per_user, selalu 0
    $: joinedUsersCount = isPerUserMode ? 0 : (shiftUsers?.filter(u => 
        (u.user_id || u.tenant_user_id) !== (shiftData?.tenant_user_id || shiftData?.user_id)
    )?.length || 0);

    // ==========================================
    // REACTIVE - Dengan Fallback Safety
    // ==========================================
    
    function getSafeNumber(obj, key, defaultVal = 0) {
        if (!obj) return defaultVal;
        const val = obj[key];
        if (typeof val === 'number' && !isNaN(val)) return val;
        if (typeof val === 'string') {
            const parsed = parseFloat(val);
            return !isNaN(parsed) ? parsed : defaultVal;
        }
        return defaultVal;
    }
    
    $: modalAwal = getSafeNumber(shiftData, 'modal_awal', 0);
    $: penjualanCash = getSafeNumber(shiftData, 'penjualan_tunai', 0);
    $: penjualanQris = getSafeNumber(shiftData, 'penjualan_qris', 0);
    $: penjualanTransfer = getSafeNumber(shiftData, 'penjualan_transfer', 0);
    $: penjualanDebit = getSafeNumber(shiftData, 'penjualan_debit', 0);
    $: penjualanKredit = getSafeNumber(shiftData, 'penjualan_kredit', 0);
    $: totalPenjualan = getSafeNumber(shiftData, 'total_penjualan', 
                        penjualanCash + penjualanQris + penjualanTransfer + penjualanDebit + penjualanKredit);
    $: kasMasuk = getSafeNumber(shiftData, 'total_kas_masuk', 0);
    $: kasKeluar = getSafeNumber(shiftData, 'total_kas_keluar', 0);
    $: kasAkhirSistem = modalAwal + penjualanCash + kasMasuk - kasKeluar;
    $: selisihKas = kasAkhirAktual - kasAkhirSistem;
    $: hasSelisih = Math.abs(selisihKas) > 0.01;
    $: isSelisihPositif = selisihKas > 0.01;
    $: isSelisihNegatif = selisihKas < -0.01;
    $: jumlahTransaksi = getSafeNumber(shiftData, 'total_transaksi', 0);
    $: canSubmit = kasAkhirAktual >= 0 && canCloseShift;

    // ==========================================
    // RESET STATE
    // ==========================================
    $: if (open && shiftData) {
        kasAkhirAktual = kasAkhirSistem;
        catatan = '';
        showDetailPenjualan = false;
        showDetailKas = false;
        showDetailUsers = false;
        showConfirmation = false;
        showLeaveConfirmation = false;
    }

    // ==========================================
    // FUNCTIONS
    // ==========================================
    
    function close() {
        if (isLoading) return;
        dispatch('close');
        open = false;
    }
    
    function handleSubmit() {
        if (!canSubmit || isLoading) return;
        
        if (!showConfirmation && hasSelisih) {
            showConfirmation = true;
            return;
        }
        
        dispatch('submit', {
            kasAkhirAktual,
            catatan: catatan.trim()
        });
    }
    
    function handleLeaveShift() {
        if (isLoading) return;
        
        if (!showLeaveConfirmation) {
            showLeaveConfirmation = true;
            return;
        }
        
        dispatch('leaveShift');
    }
    
    function cancelConfirmation() {
        showConfirmation = false;
    }
    
    function cancelLeaveConfirmation() {
        showLeaveConfirmation = false;
    }
    
    function handleKeydown(e) {
        if (e.key === 'Escape' && !isLoading) {
            if (showConfirmation) {
                showConfirmation = false;
            } else if (showLeaveConfirmation) {
                showLeaveConfirmation = false;
            } else {
                close();
            }
        }
    }
    
    function setKasAktualSamaSepertiSistem() {
        kasAkhirAktual = kasAkhirSistem;
    }
    
    function formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    function formatDuration(startTime) {
        if (!startTime) return '-';
        const start = new Date(startTime);
        const now = new Date();
        const diffMs = now - start;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours} jam ${minutes} menit`;
    }
    
    function getRoleBadgeClass(role) {
        switch(role?.toLowerCase()) {
            case 'owner': return 'bg-amber-100 text-amber-700';
            case 'admin': return 'bg-purple-100 text-purple-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    }
</script>

{#if open}
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center"
        on:click={close}
        on:keydown={handleKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
    >
        <div 
            transition:fly={{ y: 100, duration: 250 }}
            class="bg-white w-full lg:max-w-xl lg:rounded-2xl rounded-t-2xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl"
            style="padding-bottom: env(safe-area-inset-bottom);"
            on:click|stopPropagation
            on:keydown|stopPropagation
            role="document"
        >
            <!-- Drag Handle (Mobile) -->
            <div class="lg:hidden flex justify-center pt-3 pb-1">
                <div class="w-10 h-1 bg-slate-300 rounded-full"></div>
            </div>
            
            <!-- HEADER -->
            <div class="flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 border-b border-slate-200 
                        {isPerUserMode 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50' 
                            : 'bg-gradient-to-r from-red-50 to-orange-50'}">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg
                                {isPerUserMode 
                                    ? 'bg-green-500 shadow-green-500/30' 
                                    : 'bg-red-500 shadow-red-500/30'}">
                        <Square class="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 id="modal-title" class="text-lg font-bold text-slate-800">
                            {#if isJoinedUser && !canCloseShift}
                                Keluar dari Shift
                            {:else if isPerUserMode}
                                Tutup Shift Saya
                            {:else}
                                Tutup Shift
                            {/if}
                        </h2>
                        <div class="flex items-center gap-2 flex-wrap">
                            <p class="text-xs text-slate-500">
                                {shiftData?.no_shift || 'No Shift'}
                            </p>
                            
                            <!-- Mode Badge -->
                            <span class="text-xs text-slate-300">•</span>
                            <div class="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full
                                        {modeBadge.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                                        {modeBadge.color === 'green' ? 'bg-green-100 text-green-600' : ''}
                                        {modeBadge.color === 'purple' ? 'bg-purple-100 text-purple-600' : ''}">
                                <svelte:component this={modeBadge.icon} class="w-3 h-3" />
                                <span>{modeBadge.label}</span>
                            </div>
                            
                            {#if stationName && isMultiMode}
                                <span class="text-xs text-slate-300">•</span>
                                <div class="flex items-center gap-1 text-xs text-purple-600">
                                    <Monitor class="w-3 h-3" />
                                    <span>{stationName}</span>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
                <button 
                    type="button" 
                    on:click={close}
                    disabled={isLoading}
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-xl transition-colors disabled:opacity-50"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- BODY -->
            <div class="flex-1 overflow-y-auto p-4 lg:p-5 space-y-4">
                
                <!-- Info Shift -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div class="grid grid-cols-3 gap-3">
                        <div class="text-center">
                            <div class="w-8 h-8 mx-auto mb-1 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Clock class="w-4 h-4 text-blue-600" />
                            </div>
                            <p class="text-[10px] uppercase tracking-wide text-slate-400">Durasi</p>
                            <p class="text-xs font-semibold text-slate-700 mt-0.5">
                                {formatDuration(shiftData?.waktu_buka)}
                            </p>
                        </div>
                        <div class="text-center">
                            <div class="w-8 h-8 mx-auto mb-1 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Receipt class="w-4 h-4 text-purple-600" />
                            </div>
                            <p class="text-[10px] uppercase tracking-wide text-slate-400">Transaksi</p>
                            <p class="text-xs font-semibold text-slate-700 mt-0.5">
                                {jumlahTransaksi} trx
                            </p>
                        </div>
                        <div class="text-center">
                            <div class="w-8 h-8 mx-auto mb-1 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <TrendingUp class="w-4 h-4 text-emerald-600" />
                            </div>
                            <p class="text-[10px] uppercase tracking-wide text-slate-400">Penjualan</p>
                            <p class="text-xs font-semibold text-emerald-600 mt-0.5">
                                {formatRupiah(totalPenjualan)}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- MODE PER USER: Info Shift Milik Sendiri -->
                {#if isPerUserMode && isShiftOwner}
                    <div class="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500
                                        flex items-center justify-center text-white font-bold">
                                <User class="w-5 h-5" />
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-green-800">
                                    Shift Milik Anda
                                </p>
                                <p class="text-xs text-green-600">
                                    Mode Per Kasir - Shift pribadi Anda
                                </p>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- INFO PEMILIK SHIFT & USERS (TIDAK untuk Per User Mode) -->
                {#if !isPerUserMode && shiftUsers && shiftUsers.length > 0}
                    <div class="border border-slate-200 rounded-xl overflow-hidden">
                        <button
                            type="button"
                            on:click={() => showDetailUsers = !showDetailUsers}
                            class="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                            <div class="flex items-center gap-2">
                                <Users class="w-4 h-4 text-indigo-600" />
                                <span class="font-semibold text-slate-700">Pengguna Shift</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-sm text-slate-500">{shiftUsers.length} user</span>
                                {#if showDetailUsers}
                                    <ChevronUp class="w-4 h-4 text-slate-400" />
                                {:else}
                                    <ChevronDown class="w-4 h-4 text-slate-400" />
                                {/if}
                            </div>
                        </button>
                        
                        {#if showDetailUsers}
                            <div transition:slide={{ duration: 200 }} class="p-4 space-y-2 bg-white">
                                {#each shiftUsers as shiftUser}
                                    {@const isOwner = (shiftUser.user_id || shiftUser.tenant_user_id) === (shiftData?.tenant_user_id || shiftData?.user_id)}
                                    {@const isCurrentUser = (shiftUser.user_id || shiftUser.tenant_user_id) === currentUserId}
                                    
                                    <div class="flex items-center justify-between py-2 px-3 rounded-lg
                                                {isCurrentUser ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'}">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 rounded-full bg-gradient-to-br 
                                                        {isOwner ? 'from-amber-400 to-orange-500' : 'from-slate-400 to-slate-500'}
                                                        flex items-center justify-center text-white text-xs font-bold">
                                                {shiftUser.nama?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <div class="flex items-center gap-2">
                                                    <span class="text-sm font-medium text-slate-700">
                                                        {shiftUser.nama || 'Unknown'}
                                                    </span>
                                                    {#if isCurrentUser}
                                                        <span class="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                                                            Anda
                                                        </span>
                                                    {/if}
                                                </div>
                                                <div class="flex items-center gap-2 mt-0.5">
                                                    <span class="text-[10px] px-1.5 py-0.5 rounded-full {getRoleBadgeClass(shiftUser.role)}">
                                                        {shiftUser.role || 'kasir'}
                                                    </span>
                                                    {#if isOwner}
                                                        <span class="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full flex items-center gap-0.5">
                                                            <Crown class="w-2.5 h-2.5" />
                                                            Pemilik
                                                        </span>
                                                    {:else}
                                                        <span class="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-0.5">
                                                            <UserCheck class="w-2.5 h-2.5" />
                                                            Joined
                                                        </span>
                                                    {/if}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {#if shiftUser.joined_at && !isOwner}
                                            <span class="text-[10px] text-slate-400">
                                                Join: {formatDateTime(shiftUser.joined_at)}
                                            </span>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {:else if !isPerUserMode && !isShiftOwner}
                    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500
                                        flex items-center justify-center text-white font-bold">
                                {ownerName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                                <p class="text-sm text-amber-800">
                                    Shift ini dibuka oleh
                                </p>
                                <p class="font-semibold text-amber-900">{ownerName}</p>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- WARNING: Jika joined user mencoba tutup shift -->
                {#if !isPerUserMode && isJoinedUser && !isAdminOrOwner}
                    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div class="flex items-start gap-3">
                            <Info class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p class="text-sm font-semibold text-blue-800">
                                    Anda bergabung di shift ini
                                </p>
                                <p class="text-xs text-blue-700 mt-1">
                                    Hanya pemilik shift ({ownerName}) atau Admin/Owner yang dapat menutup shift.
                                    Anda dapat keluar dari shift tanpa menutupnya.
                                </p>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- RINGKASAN PENJUALAN -->
                {#if canCloseShift}
                    <div class="border border-slate-200 rounded-xl overflow-hidden">
                        <button
                            type="button"
                            on:click={() => showDetailPenjualan = !showDetailPenjualan}
                            class="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                            <div class="flex items-center gap-2">
                                <DollarSign class="w-4 h-4 text-emerald-600" />
                                <span class="font-semibold text-slate-700">Penjualan per Metode</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-bold text-emerald-600">{formatRupiah(totalPenjualan)}</span>
                                {#if showDetailPenjualan}
                                    <ChevronUp class="w-4 h-4 text-slate-400" />
                                {:else}
                                    <ChevronDown class="w-4 h-4 text-slate-400" />
                                {/if}
                            </div>
                        </button>
                        
                        {#if showDetailPenjualan}
                            <div transition:slide={{ duration: 200 }} class="p-4 space-y-2 bg-white">
                                <div class="flex items-center justify-between py-2">
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                            <Banknote class="w-4 h-4 text-green-600" />
                                        </div>
                                        <span class="text-sm text-slate-600">Tunai (Cash)</span>
                                    </div>
                                    <span class="font-semibold text-slate-800">{formatRupiah(penjualanCash)}</span>
                                </div>
                                <div class="flex items-center justify-between py-2">
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <QrCode class="w-4 h-4 text-purple-600" />
                                        </div>
                                        <span class="text-sm text-slate-600">QRIS</span>
                                    </div>
                                    <span class="font-semibold text-slate-800">{formatRupiah(penjualanQris)}</span>
                                </div>
                                <div class="flex items-center justify-between py-2">
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Building2 class="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span class="text-sm text-slate-600">Transfer Bank</span>
                                    </div>
                                    <span class="font-semibold text-slate-800">{formatRupiah(penjualanTransfer)}</span>
                                </div>
                                <div class="flex items-center justify-between py-2">
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                            <CreditCard class="w-4 h-4 text-orange-600" />
                                        </div>
                                        <span class="text-sm text-slate-600">Kartu Debit</span>
                                    </div>
                                    <span class="font-semibold text-slate-800">{formatRupiah(penjualanDebit)}</span>
                                </div>
                                <div class="flex items-center justify-between py-2">
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                            <CreditCard class="w-4 h-4 text-red-600" />
                                        </div>
                                        <span class="text-sm text-slate-600">Kartu Kredit</span>
                                    </div>
                                    <span class="font-semibold text-slate-800">{formatRupiah(penjualanKredit)}</span>
                                </div>
                            </div>
                        {/if}
                    </div>

                    <!-- RINGKASAN KAS -->
                    <div class="border border-slate-200 rounded-xl overflow-hidden">
                        <button
                            type="button"
                            on:click={() => showDetailKas = !showDetailKas}
                            class="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                            <div class="flex items-center gap-2">
                                <PiggyBank class="w-4 h-4 text-blue-600" />
                                <span class="font-semibold text-slate-700">Ringkasan Kas</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-bold text-blue-600">{formatRupiah(kasAkhirSistem)}</span>
                                {#if showDetailKas}
                                    <ChevronUp class="w-4 h-4 text-slate-400" />
                                {:else}
                                    <ChevronDown class="w-4 h-4 text-slate-400" />
                                {/if}
                            </div>
                        </button>
                        
                        {#if showDetailKas}
                            <div transition:slide={{ duration: 200 }} class="p-4 space-y-3 bg-white">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <Wallet class="w-4 h-4 text-slate-400" />
                                        <span class="text-sm text-slate-600">Modal Awal</span>
                                    </div>
                                    <span class="font-medium text-slate-700">{formatRupiah(modalAwal)}</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <TrendingUp class="w-4 h-4 text-emerald-500" />
                                        <span class="text-sm text-slate-600">Penjualan Cash</span>
                                    </div>
                                    <span class="font-medium text-emerald-600">+{formatRupiah(penjualanCash)}</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <ArrowUpCircle class="w-4 h-4 text-blue-500" />
                                        <span class="text-sm text-slate-600">Kas Masuk</span>
                                    </div>
                                    <span class="font-medium text-blue-600">+{formatRupiah(kasMasuk)}</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <ArrowDownCircle class="w-4 h-4 text-red-500" />
                                        <span class="text-sm text-slate-600">Kas Keluar</span>
                                    </div>
                                    <span class="font-medium text-red-600">-{formatRupiah(kasKeluar)}</span>
                                </div>
                                <div class="border-t border-dashed border-slate-200 pt-3">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <Calculator class="w-4 h-4 text-slate-600" />
                                            <span class="text-sm font-semibold text-slate-700">Kas Akhir (Sistem)</span>
                                        </div>
                                        <span class="font-bold text-slate-800">{formatRupiah(kasAkhirSistem)}</span>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>

                    <!-- INPUT KAS AKTUAL -->
                    <div class="rounded-xl p-4 border
                                {isPerUserMode 
                                    ? 'bg-green-50 border-green-100' 
                                    : 'bg-blue-50 border-blue-100'}">
                        <div class="flex items-center justify-between mb-3">
                            <label class="text-sm font-semibold
                                          {isPerUserMode ? 'text-green-800' : 'text-blue-800'}">
                                Jumlah Kas Aktual di Laci
                            </label>
                            <button
                                type="button"
                                on:click={setKasAktualSamaSepertiSistem}
                                disabled={isLoading}
                                class="text-xs font-medium
                                       {isPerUserMode 
                                           ? 'text-green-600 hover:text-green-700' 
                                           : 'text-blue-600 hover:text-blue-700'}"
                            >
                                Samakan dengan sistem
                            </button>
                        </div>
                        
                        <div class="relative">
                            <span class="absolute left-4 top-1/2 -translate-y-1/2 font-medium
                                         {isPerUserMode ? 'text-green-400' : 'text-blue-400'}">Rp</span>
                            <input 
                                type="number" 
                                bind:value={kasAkhirAktual} 
                                placeholder="0"
                                inputmode="numeric"
                                disabled={isLoading}
                                class="w-full h-14 pl-12 pr-4 bg-white border-2 rounded-xl text-xl font-bold
                                       focus:outline-none focus:ring-2
                                       disabled:bg-slate-100 disabled:cursor-not-allowed
                                       number-input transition-all
                                       {isPerUserMode 
                                           ? 'border-green-200 focus:border-green-500 focus:ring-green-500/20' 
                                           : 'border-blue-200 focus:border-blue-500 focus:ring-blue-500/20'}" 
                                min="0" 
                            />
                        </div>
                        
                        <p class="text-xs mt-2 flex items-center gap-1
                                  {isPerUserMode ? 'text-green-600' : 'text-blue-600'}">
                            <Info class="w-3.5 h-3.5" />
                            Hitung uang tunai di laci kasir
                        </p>
                    </div>

                    <!-- SELISIH KAS -->
                    {#if kasAkhirAktual > 0 || kasAkhirSistem > 0}
                        <div 
                            transition:scale={{ start: 0.95, duration: 200 }}
                            class="rounded-xl p-4 border-2
                                   {hasSelisih 
                                       ? isSelisihPositif 
                                           ? 'bg-blue-50 border-blue-200' 
                                           : 'bg-red-50 border-red-200'
                                       : 'bg-emerald-50 border-emerald-200'}"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    {#if hasSelisih}
                                        {#if isSelisihPositif}
                                            <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                                <TrendingUp class="w-5 h-5 text-blue-600" />
                                            </div>
                                        {:else}
                                            <div class="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                                <TrendingDown class="w-5 h-5 text-red-600" />
                                            </div>
                                        {/if}
                                    {:else}
                                        <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                            <BadgeCheck class="w-5 h-5 text-emerald-600" />
                                        </div>
                                    {/if}
                                    
                                    <div>
                                        <p class="text-sm font-semibold
                                                  {hasSelisih 
                                                      ? isSelisihPositif ? 'text-blue-800' : 'text-red-800'
                                                      : 'text-emerald-800'}">
                                            {hasSelisih ? 'Selisih Kas' : 'Kas Seimbang'}
                                        </p>
                                        <p class="text-xs
                                                  {hasSelisih 
                                                      ? isSelisihPositif ? 'text-blue-600' : 'text-red-600'
                                                      : 'text-emerald-600'}">
                                            {#if hasSelisih}
                                                {isSelisihPositif ? 'Kelebihan kas' : 'Kekurangan kas'}
                                            {:else}
                                                Aktual sama dengan sistem
                                            {/if}
                                        </p>
                                    </div>
                                </div>
                                
                                <span class="text-xl font-bold
                                             {hasSelisih 
                                                 ? isSelisihPositif ? 'text-blue-700' : 'text-red-700'
                                                 : 'text-emerald-700'}">
                                    {hasSelisih ? (isSelisihPositif ? '+' : '') + formatRupiah(selisihKas) : 'Rp 0'}
                                </span>
                            </div>
                            
                            {#if hasSelisih && isSelisihNegatif}
                                <div class="mt-3 pt-3 border-t border-red-200 flex items-start gap-2">
                                    <AlertTriangle class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p class="text-xs text-red-700">
                                        Terdapat kekurangan kas. Pastikan sudah dihitung dengan benar 
                                        atau catat alasan di catatan.
                                    </p>
                                </div>
                            {/if}
                        </div>
                    {/if}

                    <!-- CATATAN -->
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">
                            Catatan Penutupan <span class="font-normal text-slate-400">(Opsional)</span>
                        </label>
                        <textarea
                            bind:value={catatan}
                            placeholder="Tambahkan catatan jika perlu..."
                            rows="2"
                            disabled={isLoading}
                            class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm
                                   focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
                                   disabled:bg-slate-100 disabled:cursor-not-allowed
                                   resize-none transition-all"
                        ></textarea>
                    </div>
                    
                    <!-- Warning jika ada user lain yang join -->
                    {#if !isPerUserMode && joinedUsersCount > 0}
                        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div class="flex items-start gap-2">
                                <AlertTriangle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p class="text-sm font-semibold text-amber-800">
                                        {joinedUsersCount} user lain bergabung di shift ini
                                    </p>
                                    <p class="text-xs text-amber-700 mt-1">
                                        Menutup shift akan mengeluarkan semua user yang bergabung.
                                    </p>
                                </div>
                            </div>
                        </div>
                    {/if}
                {/if}
            </div>

            <!-- FOOTER -->
            <div class="p-4 lg:p-5 border-t border-slate-200 bg-slate-50">
                {#if showLeaveConfirmation}
                    <div 
                        transition:fly={{ y: 20, duration: 200 }}
                        class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl"
                    >
                        <div class="flex items-start gap-2">
                            <LogOut class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p class="text-sm font-semibold text-blue-800">Keluar dari Shift?</p>
                                <p class="text-xs text-blue-700 mt-1">
                                    Anda akan keluar dari shift ini. Shift tetap aktif dan dapat dilanjutkan oleh {ownerName}.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <button 
                            type="button"
                            on:click={cancelLeaveConfirmation}
                            disabled={isLoading}
                            class="flex-1 h-12 border border-slate-200 text-slate-600 rounded-xl font-semibold
                                   hover:bg-slate-100 disabled:opacity-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            type="button"
                            on:click={handleLeaveShift}
                            disabled={isLoading}
                            class="flex-1 h-12 bg-blue-600 text-white rounded-xl font-semibold
                                   hover:bg-blue-700 disabled:opacity-50 transition-colors
                                   flex items-center justify-center gap-2"
                        >
                            {#if isLoading}
                                <Loader2 class="w-5 h-5 animate-spin" />
                                <span>Keluar...</span>
                            {:else}
                                <LogOut class="w-5 h-5" />
                                <span>Ya, Keluar</span>
                            {/if}
                        </button>
                    </div>
                {:else if showConfirmation}
                    <div 
                        transition:fly={{ y: 20, duration: 200 }}
                        class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl"
                    >
                        <div class="flex items-start gap-2">
                            <AlertTriangle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p class="text-sm font-semibold text-amber-800">
                                    Terdapat selisih kas {formatRupiah(Math.abs(selisihKas))}
                                </p>
                                <p class="text-xs text-amber-700 mt-1">
                                    Apakah Anda yakin ingin menutup shift dengan selisih ini?
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <button 
                            type="button"
                            on:click={cancelConfirmation}
                            disabled={isLoading}
                            class="flex-1 h-12 border border-slate-200 text-slate-600 rounded-xl font-semibold
                                   hover:bg-slate-100 disabled:opacity-50 transition-colors"
                        >
                            Periksa Lagi
                        </button>
                        <button 
                            type="button"
                            on:click={handleSubmit}
                            disabled={isLoading}
                            class="flex-1 h-12 bg-red-600 text-white rounded-xl font-semibold
                                   hover:bg-red-700 disabled:opacity-50 transition-colors
                                   flex items-center justify-center gap-2"
                        >
                            {#if isLoading}
                                <Loader2 class="w-5 h-5 animate-spin" />
                                <span>Menutup...</span>
                            {:else}
                                <Square class="w-5 h-5" />
                                <span>Ya, Tutup Shift</span>
                            {/if}
                        </button>
                    </div>
                {:else if !isPerUserMode && isJoinedUser && !isAdminOrOwner}
                    <div class="flex gap-3">
                        <button 
                            type="button"
                            on:click={close}
                            disabled={isLoading}
                            class="flex-1 h-12 border border-slate-200 text-slate-600 rounded-xl font-semibold
                                   hover:bg-slate-100 disabled:opacity-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            type="button"
                            on:click={handleLeaveShift}
                            disabled={isLoading}
                            class="flex-1 h-12 bg-blue-600 text-white rounded-xl font-semibold
                                   hover:bg-blue-700 disabled:opacity-50 transition-colors
                                   flex items-center justify-center gap-2
                                   shadow-lg shadow-blue-600/30"
                        >
                            {#if isLoading}
                                <Loader2 class="w-5 h-5 animate-spin" />
                                <span>Keluar...</span>
                            {:else}
                                <LogOut class="w-5 h-5" />
                                <span>Keluar dari Shift</span>
                            {/if}
                        </button>
                    </div>
                {:else}
                    <div class="flex gap-3">
                        <button 
                            type="button"
                            on:click={close}
                            disabled={isLoading}
                            class="flex-1 h-12 border border-slate-200 text-slate-600 rounded-xl font-semibold
                                   hover:bg-slate-100 disabled:opacity-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            type="button"
                            on:click={handleSubmit}
                            disabled={isLoading || !canSubmit}
                            class="flex-1 h-12 text-white rounded-xl font-semibold
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   transition-colors flex items-center justify-center gap-2
                                   {isPerUserMode 
                                       ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30' 
                                       : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30'}"
                        >
                            {#if isLoading}
                                <Loader2 class="w-5 h-5 animate-spin" />
                                <span>Menutup...</span>
                            {:else}
                                <Square class="w-5 h-5" />
                                <span>{isPerUserMode ? 'Tutup Shift Saya' : 'Tutup Shift'}</span>
                            {/if}
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .number-input::-webkit-inner-spin-button,
    .number-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    .number-input {
        -moz-appearance: textfield;
    }
</style>