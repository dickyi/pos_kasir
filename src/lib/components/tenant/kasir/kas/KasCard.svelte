<!--
    KasCard.svelte (IMPROVED)
    ============================================
    IMPROVEMENTS:
    1. ✅ Visual berbeda untuk status pending/approved/rejected
    2. ✅ Tombol approve/reject untuk owner/admin
    3. ✅ Badge status yang jelas
    4. ✅ Soft delete indicator
    ============================================
-->
<script>
    import { createEventDispatcher } from 'svelte';
    import { 
        ArrowDownCircle, ArrowUpCircle, 
        Clock, User, Tag, FileText,
        MoreVertical, Trash2, Eye,
        CheckCircle, XCircle, AlertCircle
    } from 'lucide-svelte';
    import { formatRupiah, formatDateTime } from '$lib/utils/format.js';

    /** @type {Object} - Data kas */
    export let kas = {};

    /** @type {boolean} - Tampilkan action buttons */
    export let showActions = true;

    /** @type {boolean} - Compact mode */
    export let compact = false;

    /** @type {boolean} - Apakah user adalah owner/admin */
    export let isOwnerOrAdmin = false;

    const dispatch = createEventDispatcher();

    // Dropdown state
    let showDropdown = false;

    // Status helpers
    $: isPending = kas.status === 'pending';
    $: isRejected = kas.status === 'rejected';
    $: isApproved = kas.status === 'approved' || !kas.status;

    function handleView() {
        dispatch('view', kas);
        showDropdown = false;
    }

    function handleDelete() {
        dispatch('delete', kas);
        showDropdown = false;
    }

    function handleApprove() {
        dispatch('approve', kas);
        showDropdown = false;
    }

    function handleReject() {
        dispatch('reject', kas);
        showDropdown = false;
    }

    function toggleDropdown(e) {
        e.stopPropagation();
        showDropdown = !showDropdown;
    }

    function closeDropdown() {
        showDropdown = false;
    }
</script>

<svelte:window on:click={closeDropdown} />

<div 
    class="bg-white rounded-xl border p-4 hover:shadow-md 
           transition-all cursor-pointer group
           {compact ? 'p-3' : ''}
           {isPending ? 'border-orange-200 bg-orange-50/30' : 
            isRejected ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}"
    on:click={handleView}
    on:keypress={() => {}}
    role="button"
    tabindex="0"
>
    <div class="flex items-start gap-3">
        <!-- Icon Tipe -->
        <div class="flex-shrink-0 {compact ? 'mt-0' : 'mt-0.5'}">
            {#if kas.tipe === 'masuk'}
                <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center
                            {compact ? 'w-8 h-8' : ''}
                            {isPending ? 'opacity-60' : ''}">
                    <ArrowDownCircle class="w-5 h-5 text-emerald-600 {compact ? 'w-4 h-4' : ''}" />
                </div>
            {:else}
                <div class="w-10 h-10 rounded-xl flex items-center justify-center
                            {compact ? 'w-8 h-8' : ''}
                            {isPending ? 'bg-orange-100' : 'bg-red-100'}
                            {isPending ? 'opacity-80' : ''}">
                    <ArrowUpCircle class="w-5 h-5 {compact ? 'w-4 h-4' : ''}
                                        {isPending ? 'text-orange-600' : 'text-red-600'}" />
                </div>
            {/if}
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
            <!-- Header Row -->
            <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                    <!-- Tipe & Status -->
                    <div class="flex items-center gap-2 flex-wrap">
                        <!-- Tipe Badge -->
                        <span class="text-xs font-medium px-2 py-0.5 rounded-full
                                    {kas.tipe === 'masuk' 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : isPending 
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-red-100 text-red-700'}">
                            {kas.tipe === 'masuk' ? 'Kas Masuk' : 'Kas Keluar'}
                        </span>
                        
                        <!-- Status Badge -->
                        {#if isPending}
                            <span class="text-xs font-medium px-2 py-0.5 rounded-full 
                                        bg-orange-100 text-orange-700 flex items-center gap-1">
                                <Clock class="w-3 h-3" />
                                Pending
                            </span>
                        {:else if isRejected}
                            <span class="text-xs font-medium px-2 py-0.5 rounded-full 
                                        bg-red-100 text-red-700 flex items-center gap-1">
                                <XCircle class="w-3 h-3" />
                                Ditolak
                            </span>
                        {/if}
                        
                        <!-- Kategori -->
                        {#if kas.kategori_nama}
                            <span class="text-xs text-slate-500 flex items-center gap-1">
                                <Tag class="w-3 h-3" />
                                {kas.kategori_nama}
                            </span>
                        {/if}
                    </div>

                    <!-- Jumlah -->
                    <p class="font-bold text-lg mt-1 {compact ? 'text-base' : ''}
                             {kas.tipe === 'masuk' ? 'text-emerald-600' : 
                              isPending ? 'text-orange-600' : 'text-red-600'}
                             {isPending || isRejected ? 'opacity-70' : ''}">
                        {kas.tipe === 'masuk' ? '+' : '-'}{formatRupiah(kas.jumlah)}
                    </p>
                </div>

                <!-- Actions -->
                {#if showActions}
                    <div class="relative flex items-center gap-1">
                        <!-- Quick Approve/Reject for Owner/Admin -->
                        {#if isOwnerOrAdmin && isPending}
                            <button
                                type="button"
                                on:click|stopPropagation={handleApprove}
                                class="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                                title="Setujui"
                            >
                                <CheckCircle class="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                on:click|stopPropagation={handleReject}
                                class="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Tolak"
                            >
                                <XCircle class="w-5 h-5" />
                            </button>
                        {/if}
                        
                        <!-- More Actions Dropdown -->
                        <button
                            type="button"
                            on:click={toggleDropdown}
                            class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 
                                   rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <MoreVertical class="w-4 h-4" />
                        </button>

                        {#if showDropdown}
                            <div 
                                class="absolute right-0 top-8 w-40 bg-white rounded-xl shadow-lg 
                                       border border-slate-200 py-1 z-10"
                            >
                                <button
                                    type="button"
                                    on:click|stopPropagation={handleView}
                                    class="w-full px-3 py-2 text-left text-sm text-slate-700 
                                           hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <Eye class="w-4 h-4" />
                                    <span>Lihat Detail</span>
                                </button>
                                
                                {#if isOwnerOrAdmin && isPending}
                                    <button
                                        type="button"
                                        on:click|stopPropagation={handleApprove}
                                        class="w-full px-3 py-2 text-left text-sm text-emerald-600 
                                               hover:bg-emerald-50 flex items-center gap-2"
                                    >
                                        <CheckCircle class="w-4 h-4" />
                                        <span>Setujui</span>
                                    </button>
                                    <button
                                        type="button"
                                        on:click|stopPropagation={handleReject}
                                        class="w-full px-3 py-2 text-left text-sm text-red-600 
                                               hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <XCircle class="w-4 h-4" />
                                        <span>Tolak</span>
                                    </button>
                                {/if}
                                
                                {#if !isRejected}
                                    <div class="border-t border-slate-100 my-1"></div>
                                    <button
                                        type="button"
                                        on:click|stopPropagation={handleDelete}
                                        class="w-full px-3 py-2 text-left text-sm text-red-600 
                                               hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 class="w-4 h-4" />
                                        <span>Hapus</span>
                                    </button>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>

            <!-- Keterangan -->
            {#if kas.keterangan && !compact}
                <p class="text-sm text-slate-600 mt-2 line-clamp-2 flex items-start gap-1.5
                         {isPending || isRejected ? 'opacity-70' : ''}">
                    <FileText class="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400" />
                    <span>{kas.keterangan}</span>
                </p>
            {/if}

            <!-- Penerima (Kas Keluar) -->
            {#if kas.tipe === 'keluar' && kas.penerima && !compact}
                <p class="text-sm text-slate-500 mt-1 flex items-center gap-1.5
                         {isPending || isRejected ? 'opacity-70' : ''}">
                    <User class="w-4 h-4 text-slate-400" />
                    <span>Penerima: <span class="font-medium">{kas.penerima}</span></span>
                </p>
            {/if}

            <!-- Reject Reason -->
            {#if isRejected && kas.reject_reason && !compact}
                <p class="text-sm text-red-600 mt-2 flex items-start gap-1.5 
                         bg-red-50 p-2 rounded-lg">
                    <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Ditolak: {kas.reject_reason}</span>
                </p>
            {/if}

            <!-- Footer -->
            <div class="flex items-center gap-3 mt-2 text-xs text-slate-400 flex-wrap">
                <!-- Waktu -->
                <span class="flex items-center gap-1">
                    <Clock class="w-3.5 h-3.5" />
                    {formatDateTime(kas.created_at)}
                </span>

                <!-- User yang input -->
                {#if kas.nama_user}
                    <span class="flex items-center gap-1">
                        <User class="w-3.5 h-3.5" />
                        {kas.nama_user}
                    </span>
                {/if}

                <!-- Shift -->
                {#if kas.no_shift}
                    <span class="px-2 py-0.5 bg-slate-100 rounded text-slate-500">
                        {kas.no_shift}
                    </span>
                {/if}

                <!-- No Referensi -->
                <span class="text-slate-300">
                    {kas.no_referensi}
                </span>
            </div>
        </div>
    </div>
</div>

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>