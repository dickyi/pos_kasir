<!--
    KasApprovalModal.svelte
    ============================================
    Modal untuk approve/reject kas pending
    - Digunakan oleh Owner/Admin
    - Menampilkan detail kas
    - Input alasan jika reject
    ============================================
-->
<script>
    import { createEventDispatcher } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { 
        X, CheckCircle, XCircle, Loader2, User,
        FileText, Clock, AlertCircle
    } from 'lucide-svelte';
    import { formatRupiah, formatDateTime } from '$lib/utils/format.js';

    /** @type {boolean} */
    export let open = false;

    /** @type {Object|null} - Data kas yang akan diproses */
    export let kas = null;

    /** @type {'approve'|'reject'} - Aksi yang akan dilakukan */
    export let action = 'approve';

    /** @type {string} - Alasan penolakan */
    export let rejectReason = '';

    /** @type {boolean} - Sedang proses */
    export let isLoading = false;

    const dispatch = createEventDispatcher();

    $: isApprove = action === 'approve';
    $: title = isApprove ? 'Setujui Kas' : 'Tolak Kas';
    $: actionText = isApprove ? 'Setujui' : 'Tolak';
    $: actionColor = isApprove ? 'emerald' : 'red';

    function close() {
        if (isLoading) return;
        dispatch('close');
        open = false;
    }

    function confirm() {
        if (!isApprove && !rejectReason.trim()) {
            // Require reason for rejection
            return;
        }
        dispatch('confirm');
    }

    function handleKeydown(e) {
        if (e.key === 'Escape' && !isLoading) close();
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open && kas}
    <!-- Backdrop -->
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        on:click={close}
        on:keypress={() => {}}
        role="button"
        tabindex="-1"
    >
        <!-- Modal -->
        <div 
            transition:fly={{ y: 50, duration: 200 }}
            class="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl"
            on:click|stopPropagation
            on:keypress|stopPropagation
            role="dialog"
            aria-modal="true"
        >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-100
                        {isApprove ? 'bg-emerald-50' : 'bg-red-50'}">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center
                                {isApprove ? 'bg-emerald-100' : 'bg-red-100'}">
                        {#if isApprove}
                            <CheckCircle class="w-6 h-6 text-emerald-600" />
                        {:else}
                            <XCircle class="w-6 h-6 text-red-600" />
                        {/if}
                    </div>
                    <div>
                        <h2 class="text-lg font-semibold 
                                  {isApprove ? 'text-emerald-800' : 'text-red-800'}">
                            {title}
                        </h2>
                        <p class="text-sm {isApprove ? 'text-emerald-600' : 'text-red-600'}">
                            {kas.no_referensi}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-4">
                <!-- Kas Info Card -->
                <div class="bg-slate-50 rounded-xl p-4 space-y-3">
                    <!-- Requestor -->
                    <div class="flex items-center gap-3 pb-3 border-b border-slate-200">
                        <div class="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                            <User class="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                            <p class="text-sm font-medium text-slate-800">{kas.nama_user || 'Unknown'}</p>
                            <p class="text-xs text-slate-500 flex items-center gap-1">
                                <Clock class="w-3 h-3" />
                                {formatDateTime(kas.created_at)}
                            </p>
                        </div>
                    </div>

                    <!-- Amount -->
                    <div class="text-center py-2">
                        <p class="text-xs text-slate-500 uppercase">Jumlah Kas Keluar</p>
                        <p class="text-2xl font-bold text-red-600 mt-1">
                            -{formatRupiah(kas.jumlah)}
                        </p>
                    </div>

                    <!-- Details -->
                    <div class="space-y-2 pt-3 border-t border-slate-200">
                        <div class="flex items-start gap-2">
                            <FileText class="w-4 h-4 text-slate-400 mt-0.5" />
                            <div>
                                <p class="text-xs text-slate-500">Keterangan</p>
                                <p class="text-sm text-slate-700">{kas.keterangan || '-'}</p>
                            </div>
                        </div>
                        
                        {#if kas.penerima}
                            <div class="flex items-start gap-2">
                                <User class="w-4 h-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p class="text-xs text-slate-500">Penerima</p>
                                    <p class="text-sm text-slate-700">{kas.penerima}</p>
                                </div>
                            </div>
                        {/if}

                        {#if kas.kategori_nama}
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-slate-500">Kategori</span>
                                <span class="text-xs px-2 py-0.5 bg-slate-200 rounded-full text-slate-600">
                                    {kas.kategori_nama}
                                </span>
                            </div>
                        {/if}

                        {#if kas.no_shift}
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-slate-500">Shift</span>
                                <span class="text-xs font-medium text-slate-700">{kas.no_shift}</span>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Reject Reason Input (only for reject) -->
                {#if !isApprove}
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                            Alasan Penolakan <span class="text-red-500">*</span>
                        </label>
                        <textarea
                            bind:value={rejectReason}
                            disabled={isLoading}
                            rows="2"
                            placeholder="Jelaskan alasan penolakan..."
                            class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none
                                   focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100
                                   disabled:bg-slate-50 disabled:text-slate-400"
                        ></textarea>
                        {#if !isApprove && !rejectReason.trim()}
                            <p class="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <AlertCircle class="w-3 h-3" />
                                Alasan wajib diisi untuk penolakan
                            </p>
                        {/if}
                    </div>
                {:else}
                    <!-- Approve confirmation -->
                    <div class="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <CheckCircle class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <p class="text-xs text-emerald-700">
                            Dengan menyetujui, kas ini akan diproses dan dihitung dalam laporan keuangan.
                        </p>
                    </div>
                {/if}
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                    type="button"
                    on:click={close}
                    disabled={isLoading}
                    class="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl 
                           font-medium hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                    Batal
                </button>
                <button
                    type="button"
                    on:click={confirm}
                    disabled={isLoading || (!isApprove && !rejectReason.trim())}
                    class="flex-1 py-3 rounded-xl font-medium transition-colors
                           flex items-center justify-center gap-2 disabled:opacity-50
                           {isApprove 
                               ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                               : 'bg-red-600 text-white hover:bg-red-700'}"
                >
                    {#if isLoading}
                        <Loader2 class="w-5 h-5 animate-spin" />
                        <span>Memproses...</span>
                    {:else}
                        {#if isApprove}
                            <CheckCircle class="w-5 h-5" />
                        {:else}
                            <XCircle class="w-5 h-5" />
                        {/if}
                        <span>{actionText}</span>
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}