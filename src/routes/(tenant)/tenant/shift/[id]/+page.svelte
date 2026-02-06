<!--
    +page.svelte - Detail Shift
    =====================================================
    Halaman detail untuk melihat informasi lengkap 1 shift
-->
<script>
    import { 
        ArrowLeft, Clock, User, Monitor, Receipt, TrendingUp,
        Banknote, QrCode, Building2, CreditCard, Wallet,
        ArrowUpCircle, ArrowDownCircle, Calculator, CheckCircle,
        AlertTriangle, Users, Crown, Shield, UserCheck, Calendar,
        Hash, Timer, Target, DollarSign, PiggyBank, FileText,
        ChevronDown, ChevronUp
    } from 'lucide-svelte';
    import { formatRupiah } from '$lib/utils/format.js';
    import { slide } from 'svelte/transition';

    export let data;

    $: shift = data.shift || {};
    $: shiftUsers = data.shiftUsers || [];
    $: transactions = data.transactions || [];
    $: kasMovements = data.kasMovements || [];

    // Expandable sections
    let showTransactions = false;
    let showKasMovements = false;

    // Helper functions
    function formatDuration(minutes) {
        if (!minutes) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours} jam ${mins} menit`;
        }
        return `${mins} menit`;
    }

    function formatTime(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    function formatDateTime(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    function getRoleBadge(role) {
        switch(role?.toLowerCase()) {
            case 'owner': return { color: 'bg-amber-100 text-amber-700', icon: Crown };
            case 'admin': return { color: 'bg-purple-100 text-purple-700', icon: Shield };
            default: return { color: 'bg-slate-100 text-slate-600', icon: User };
        }
    }

    function getPaymentIcon(method) {
        switch(method?.toLowerCase()) {
            case 'tunai': case 'cash': return Banknote;
            case 'qris': return QrCode;
            case 'transfer': return Building2;
            case 'debit': case 'kredit': return CreditCard;
            default: return Wallet;
        }
    }

    function getPaymentColor(method) {
        switch(method?.toLowerCase()) {
            case 'tunai': case 'cash': return 'text-green-600 bg-green-100';
            case 'qris': return 'text-purple-600 bg-purple-100';
            case 'transfer': return 'text-blue-600 bg-blue-100';
            case 'debit': return 'text-orange-600 bg-orange-100';
            case 'kredit': return 'text-red-600 bg-red-100';
            default: return 'text-slate-600 bg-slate-100';
        }
    }

    // Computed
    $: isOpen = shift.status === 'open';
    $: hasSelisih = shift.selisih_kas && Math.abs(parseFloat(shift.selisih_kas)) > 0.01;
    $: isSelisihPositif = parseFloat(shift.selisih_kas) > 0.01;
    $: kasirBadge = getRoleBadge(shift.kasir_role);
</script>

<svelte:head>
    <title>Detail Shift {shift.no_shift} - Monitoring Kasir</title>
</svelte:head>

<div class="space-y-6">
    <!-- ==========================================
         BACK BUTTON & HEADER
    ========================================== -->
    <div class="flex items-center gap-4">
        <a
            href="/tenant/shift/riwayat"
            class="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
            <ArrowLeft class="w-5 h-5 text-slate-600" />
        </a>
        <div class="flex-1">
            <h1 class="text-xl font-bold text-slate-800">{shift.no_shift}</h1>
            <p class="text-sm text-slate-500">{formatDate(shift.tanggal)}</p>
        </div>
        <!-- Status Badge -->
        {#if isOpen}
            <span class="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-semibold">
                <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Shift Aktif
            </span>
        {:else}
            <span class="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold">
                <CheckCircle class="w-4 h-4" />
                Shift Selesai
            </span>
        {/if}
    </div>

    <!-- ==========================================
         INFO CARDS ROW 1
    ========================================== -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Kasir Info -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500
                            flex items-center justify-center text-white font-bold">
                    {getInitials(shift.kasir_nama)}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-semibold text-slate-800 truncate">{shift.kasir_nama}</p>
                    <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded {kasirBadge.color}">
                        <svelte:component this={kasirBadge.icon} class="w-3 h-3" />
                        {shift.kasir_role}
                    </span>
                </div>
            </div>
            {#if shift.station_nama}
                <div class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-sm text-purple-600">
                    <Monitor class="w-4 h-4" />
                    <span>{shift.station_nama}</span>
                </div>
            {/if}
        </div>

        <!-- Waktu -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <div class="flex items-center gap-2 mb-2">
                <Clock class="w-4 h-4 text-slate-400" />
                <span class="text-xs text-slate-500">Waktu Shift</span>
            </div>
            <p class="text-lg font-bold text-slate-800">
                {formatTime(shift.waktu_buka)} - {shift.waktu_tutup ? formatTime(shift.waktu_tutup) : 'Aktif'}
            </p>
            <p class="text-sm text-slate-500 mt-1">
                Durasi: {formatDuration(shift.durasi_menit)}
            </p>
        </div>

        <!-- Transaksi -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <div class="flex items-center gap-2 mb-2">
                <Receipt class="w-4 h-4 text-blue-500" />
                <span class="text-xs text-slate-500">Total Transaksi</span>
            </div>
            <p class="text-2xl font-bold text-slate-800">{shift.total_transaksi || 0}</p>
            <p class="text-sm text-slate-500 mt-1">
                Rata-rata: {formatRupiah(shift.avgTransaksi || 0)}
            </p>
        </div>

        <!-- Penjualan -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
            <div class="flex items-center gap-2 mb-2">
                <TrendingUp class="w-4 h-4 text-emerald-500" />
                <span class="text-xs text-slate-500">Total Penjualan</span>
            </div>
            <p class="text-2xl font-bold text-emerald-600">{formatRupiah(shift.total_penjualan_bersih || 0)}</p>
            {#if shift.total_diskon > 0}
                <p class="text-sm text-slate-500 mt-1">
                    Diskon: {formatRupiah(shift.total_diskon)}
                </p>
            {/if}
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- ==========================================
             PENJUALAN PER METODE BAYAR
        ========================================== -->
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100">
                <h3 class="font-semibold text-slate-800 flex items-center gap-2">
                    <Wallet class="w-5 h-5 text-slate-400" />
                    Penjualan per Metode
                </h3>
            </div>
            <div class="p-5 space-y-3">
                <!-- Tunai -->
                <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <Banknote class="w-5 h-5 text-green-600" />
                        </div>
                        <span class="font-medium text-slate-700">Tunai (Cash)</span>
                    </div>
                    <span class="font-bold text-slate-800">{formatRupiah(shift.penjualan_tunai || 0)}</span>
                </div>
                <!-- QRIS -->
                <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <QrCode class="w-5 h-5 text-purple-600" />
                        </div>
                        <span class="font-medium text-slate-700">QRIS</span>
                    </div>
                    <span class="font-bold text-slate-800">{formatRupiah(shift.penjualan_qris || 0)}</span>
                </div>
                <!-- Transfer -->
                <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Building2 class="w-5 h-5 text-blue-600" />
                        </div>
                        <span class="font-medium text-slate-700">Transfer Bank</span>
                    </div>
                    <span class="font-bold text-slate-800">{formatRupiah(shift.penjualan_transfer || 0)}</span>
                </div>
                <!-- Debit -->
                <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <CreditCard class="w-5 h-5 text-orange-600" />
                        </div>
                        <span class="font-medium text-slate-700">Kartu Debit</span>
                    </div>
                    <span class="font-bold text-slate-800">{formatRupiah(shift.penjualan_debit || 0)}</span>
                </div>
                <!-- Kredit -->
                <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <CreditCard class="w-5 h-5 text-red-600" />
                        </div>
                        <span class="font-medium text-slate-700">Kartu Kredit</span>
                    </div>
                    <span class="font-bold text-slate-800">{formatRupiah(shift.penjualan_kredit || 0)}</span>
                </div>
                
                <!-- Total -->
                <div class="pt-3 mt-3 border-t border-dashed border-slate-200">
                    <div class="flex items-center justify-between">
                        <span class="font-semibold text-slate-800">Total Penjualan</span>
                        <span class="text-lg font-bold text-emerald-600">{formatRupiah(shift.total_penjualan || 0)}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ==========================================
             RINGKASAN KAS
        ========================================== -->
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100">
                <h3 class="font-semibold text-slate-800 flex items-center gap-2">
                    <PiggyBank class="w-5 h-5 text-slate-400" />
                    Ringkasan Kas
                </h3>
            </div>
            <div class="p-5 space-y-3">
                <!-- Modal Awal -->
                <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                            <Wallet class="w-5 h-5 text-slate-500" />
                        </div>
                        <span class="font-medium text-slate-700">Modal Awal</span>
                    </div>
                    <span class="font-bold text-slate-800">{formatRupiah(shift.modal_awal || 0)}</span>
                </div>
                <!-- Penjualan Cash -->
                <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <TrendingUp class="w-5 h-5 text-emerald-600" />
                        </div>
                        <span class="font-medium text-slate-700">Penjualan Cash</span>
                    </div>
                    <span class="font-bold text-emerald-600">+{formatRupiah(shift.penjualan_tunai || 0)}</span>
                </div>
                <!-- Kas Masuk -->
                <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <ArrowUpCircle class="w-5 h-5 text-blue-600" />
                        </div>
                        <span class="font-medium text-slate-700">Kas Masuk</span>
                    </div>
                    <span class="font-bold text-blue-600">+{formatRupiah(shift.total_kas_masuk || 0)}</span>
                </div>
                <!-- Kas Keluar -->
                <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <ArrowDownCircle class="w-5 h-5 text-red-600" />
                        </div>
                        <span class="font-medium text-slate-700">Kas Keluar</span>
                    </div>
                    <span class="font-bold text-red-600">-{formatRupiah(shift.total_kas_keluar || 0)}</span>
                </div>
                
                <!-- Kas Akhir Sistem -->
                <div class="pt-3 mt-3 border-t border-dashed border-slate-200">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <Calculator class="w-4 h-4 text-slate-500" />
                            <span class="font-medium text-slate-600">Kas Akhir (Sistem)</span>
                        </div>
                        <span class="font-bold text-slate-800">{formatRupiah(shift.kas_akhir_sistem || shift.kasAkhirSistemCalculated || 0)}</span>
                    </div>
                    
                    {#if !isOpen}
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-medium text-slate-600">Kas Akhir (Aktual)</span>
                            <span class="font-bold text-slate-800">{formatRupiah(shift.kas_akhir_aktual || 0)}</span>
                        </div>
                        
                        <!-- Selisih -->
                        <div class="p-3 rounded-xl mt-3
                                    {hasSelisih 
                                        ? isSelisihPositif 
                                            ? 'bg-blue-50 border border-blue-200' 
                                            : 'bg-red-50 border border-red-200'
                                        : 'bg-emerald-50 border border-emerald-200'}">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    {#if hasSelisih}
                                        <AlertTriangle class="w-5 h-5 {isSelisihPositif ? 'text-blue-500' : 'text-red-500'}" />
                                        <span class="font-medium {isSelisihPositif ? 'text-blue-700' : 'text-red-700'}">
                                            Selisih Kas ({isSelisihPositif ? 'Lebih' : 'Kurang'})
                                        </span>
                                    {:else}
                                        <CheckCircle class="w-5 h-5 text-emerald-500" />
                                        <span class="font-medium text-emerald-700">Kas Seimbang</span>
                                    {/if}
                                </div>
                                <span class="font-bold text-lg
                                             {hasSelisih 
                                                 ? isSelisihPositif ? 'text-blue-700' : 'text-red-700'
                                                 : 'text-emerald-700'}">
                                    {hasSelisih ? (isSelisihPositif ? '+' : '') + formatRupiah(shift.selisih_kas) : 'Rp 0'}
                                </span>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <!-- ==========================================
         SHIFT USERS (jika ada)
    ========================================== -->
    {#if shiftUsers.length > 0}
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100">
                <h3 class="font-semibold text-slate-800 flex items-center gap-2">
                    <Users class="w-5 h-5 text-indigo-500" />
                    Pengguna Shift ({shiftUsers.length})
                </h3>
            </div>
            <div class="p-5">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {#each shiftUsers as shiftUser}
                        {@const isOwner = shiftUser.tenant_user_id === shift.tenant_user_id}
                        {@const badge = getRoleBadge(shiftUser.role)}
                        <div class="p-3 rounded-xl border {isOwner ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white
                                            {isOwner ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-slate-400 to-slate-500'}">
                                    {getInitials(shiftUser.nama)}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="font-medium text-slate-800 truncate">{shiftUser.nama}</p>
                                    <div class="flex items-center gap-2 mt-0.5">
                                        <span class="text-xs px-1.5 py-0.5 rounded {badge.color}">
                                            {shiftUser.role}
                                        </span>
                                        {#if isOwner}
                                            <span class="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded flex items-center gap-0.5">
                                                <Crown class="w-3 h-3" />
                                                Pemilik
                                            </span>
                                        {:else}
                                            <span class="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded flex items-center gap-0.5">
                                                <UserCheck class="w-3 h-3" />
                                                Joined
                                            </span>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                            {#if shiftUser.joined_at && !isOwner}
                                <p class="text-xs text-slate-400 mt-2">
                                    Join: {formatDateTime(shiftUser.joined_at)}
                                </p>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}

    <!-- ==========================================
         DAFTAR TRANSAKSI (Expandable)
    ========================================== -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
            on:click={() => showTransactions = !showTransactions}
            class="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
            <h3 class="font-semibold text-slate-800 flex items-center gap-2">
                <Receipt class="w-5 h-5 text-slate-400" />
                Daftar Transaksi ({transactions.length})
            </h3>
            {#if showTransactions}
                <ChevronUp class="w-5 h-5 text-slate-400" />
            {:else}
                <ChevronDown class="w-5 h-5 text-slate-400" />
            {/if}
        </button>
        
        {#if showTransactions}
            <div transition:slide={{ duration: 200 }}>
                {#if transactions.length === 0}
                    <div class="text-center py-8 border-t border-slate-100">
                        <p class="text-slate-500">Belum ada transaksi</p>
                    </div>
                {:else}
                    <div class="border-t border-slate-100 overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="bg-slate-50 text-left">
                                    <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">No Transaksi</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Waktu</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Item</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Total</th>
                                    <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Metode</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                {#each transactions as trx}
                                    {@const PaymentIcon = getPaymentIcon(trx.metode_pembayaran)}
                                    <tr class="hover:bg-slate-50">
                                        <td class="px-4 py-3">
                                            <p class="text-sm font-medium text-slate-800">{trx.no_transaksi}</p>
                                        </td>
                                        <td class="px-4 py-3">
                                            <p class="text-sm text-slate-600">{formatDateTime(trx.waktu_transaksi)}</p>
                                        </td>
                                        <td class="px-4 py-3 text-center">
                                            <span class="text-sm text-slate-600">{trx.total_item}</span>
                                        </td>
                                        <td class="px-4 py-3 text-right">
                                            <p class="text-sm font-semibold text-emerald-600">{formatRupiah(trx.total_bayar)}</p>
                                        </td>
                                        <td class="px-4 py-3 text-center">
                                            <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium {getPaymentColor(trx.metode_pembayaran)}">
                                                <svelte:component this={PaymentIcon} class="w-3 h-3" />
                                                {trx.metode_pembayaran}
                                            </span>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    <!-- ==========================================
         CATATAN
    ========================================== -->
    {#if shift.catatan_buka || shift.catatan_tutup}
        <div class="bg-white rounded-xl border border-slate-200 p-5">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <FileText class="w-5 h-5 text-slate-400" />
                Catatan
            </h3>
            <div class="space-y-3">
                {#if shift.catatan_buka}
                    <div class="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p class="text-xs font-medium text-blue-600 mb-1">Catatan Buka Shift:</p>
                        <p class="text-sm text-blue-800">{shift.catatan_buka}</p>
                    </div>
                {/if}
                {#if shift.catatan_tutup}
                    <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p class="text-xs font-medium text-slate-500 mb-1">Catatan Tutup Shift:</p>
                        <p class="text-sm text-slate-700">{shift.catatan_tutup}</p>
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    <!-- ==========================================
         CLOSED BY INFO
    ========================================== -->
    {#if shift.closed_by && shift.closed_by !== shift.tenant_user_id}
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div class="flex items-center gap-3">
                <AlertTriangle class="w-5 h-5 text-amber-500" />
                <div>
                    <p class="text-sm font-medium text-amber-800">
                        Shift ditutup oleh orang lain
                    </p>
                    <p class="text-xs text-amber-700 mt-0.5">
                        Ditutup oleh: {shift.closed_by_nama} ({shift.closed_by_role})
                    </p>
                </div>
            </div>
        </div>
    {/if}
</div>
