<!--
    PaymentModal.svelte
    Modal pembayaran dengan pilihan metode dan input nominal
-->
<script>
    import { CreditCard, Banknote, QrCode, Building2, User, X, Check, Loader2 } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { formatRupiah } from '$lib/utils/format.js';

    /** @type {boolean} Apakah modal terbuka */
    export let open = false;
    
    /** @type {number} Grand total */
    export let grandTotal = 0;
    
    /** @type {number} Uang yang dibayar */
    export let customerPaid = 0;
    
    /** @type {string} Metode bayar */
    export let metodeBayar = 'cash';
    
    /** @type {string} Nama customer */
    export let namaCustomer = '';
    
    /** @type {boolean} Sedang proses */
    export let isProcessing = false;

    const dispatch = createEventDispatcher();

    // Calculated
    $: kembalian = Math.max(0, customerPaid - grandTotal);
    $: kurangBayar = Math.max(0, grandTotal - customerPaid);
    $: canPay = metodeBayar !== 'cash' || customerPaid >= grandTotal;

    const quickAmounts = [
        { label: '10rb', value: 10000 },
        { label: '20rb', value: 20000 },
        { label: '50rb', value: 50000 },
        { label: '100rb', value: 100000 },
    ];

    const paymentMethods = [
        { id: 'cash', icon: Banknote, label: 'Tunai' },
        { id: 'qris', icon: QrCode, label: 'QRIS' },
        { id: 'transfer', icon: Building2, label: 'Transfer' }
    ];

    function close() {
        open = false;
    }

    function setQuickAmount(amount) {
        customerPaid = amount;
    }

    function setExactAmount() {
        customerPaid = grandTotal;
    }

    function addAmount(amount) {
        customerPaid += amount;
    }

    function handleSubmit() {
        if (!canPay) return;
        dispatch('submit', {
            metodeBayar,
            customerPaid: metodeBayar === 'cash' ? customerPaid : grandTotal,
            namaCustomer,
            kembalian: metodeBayar === 'cash' ? kembalian : 0
        });
    }

    function handleKeydown(e) {
        if (e.key === 'Escape') close();
    }
</script>

{#if open}
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center"
        on:click={close}
        on:keydown={handleKeydown}
        role="dialog"
        aria-modal="true"
    >
        <div 
            transition:fly={{ y: 100, duration: 250 }}
            class="bg-white w-full lg:max-w-lg lg:rounded-xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col"
            style="padding-bottom: env(safe-area-inset-bottom);"
            on:click|stopPropagation
            on:keydown|stopPropagation
            role="document"
        >
            <!-- Drag Handle (Mobile) -->
            <div class="lg:hidden flex justify-center pt-3 pb-1">
                <div class="w-10 h-1 bg-slate-300 rounded-full"></div>
            </div>
            
            <!-- Header -->
            <div class="flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 border-b border-slate-200">
                <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <CreditCard class="w-5 h-5 text-emerald-600" />
                    <span>Pembayaran</span>
                </h2>
                <button 
                    type="button" 
                    on:click={close}
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto p-4 lg:p-5 space-y-4">
                <!-- Total Display -->
                <div class="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                    <p class="text-sm text-emerald-600 mb-1">Total Pembayaran</p>
                    <p class="text-3xl font-bold text-emerald-700">{formatRupiah(grandTotal)}</p>
                </div>

                <!-- Payment Method -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Metode Pembayaran</label>
                    <div class="grid grid-cols-3 gap-2">
                        {#each paymentMethods as method}
                            <button 
                                type="button" 
                                on:click={() => metodeBayar = method.id}
                                class="flex flex-col items-center gap-1.5 py-3.5 border rounded-xl text-sm 
                                       font-medium transition-all active:scale-95
                                    {metodeBayar === method.id 
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                        : 'border-slate-200 text-slate-600'}"
                            >
                                <svelte:component this={method.icon} class="w-6 h-6" />
                                <span>{method.label}</span>
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Cash Options -->
                {#if metodeBayar === 'cash'}
                    <div class="space-y-3">
                        <label class="block text-sm font-medium text-slate-700">Uang Diterima</label>
                        
                        <!-- Quick Amounts -->
                        <div class="grid grid-cols-4 gap-2">
                            {#each quickAmounts as amt}
                                <button 
                                    type="button" 
                                    on:click={() => setQuickAmount(amt.value)}
                                    class="py-2.5 border rounded-xl text-sm font-medium transition-all active:scale-95
                                        {customerPaid === amt.value 
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                            : 'border-slate-200 text-slate-600'}"
                                >
                                    {amt.label}
                                </button>
                            {/each}
                        </div>
                        
                        <!-- Exact & Add -->
                        <div class="flex gap-2">
                            <button 
                                type="button" 
                                on:click={setExactAmount}
                                class="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium 
                                       text-slate-600 active:bg-slate-50"
                            >
                                Uang Pas
                            </button>
                            <button 
                                type="button" 
                                on:click={() => addAmount(50000)}
                                class="py-2.5 px-4 border border-slate-200 rounded-xl text-sm font-medium 
                                       text-slate-600 active:bg-slate-50"
                            >
                                +50rb
                            </button>
                        </div>
                        
                        <!-- Input -->
                        <div class="relative">
                            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rp</span>
                            <input 
                                type="number" 
                                bind:value={customerPaid} 
                                inputmode="numeric"
                                class="w-full h-14 pl-12 pr-4 border border-slate-200 rounded-xl text-xl font-bold
                                       focus:outline-none focus:border-emerald-500 number-input" 
                                min="0" 
                            />
                        </div>
                        
                        <!-- Change -->
                        {#if customerPaid >= grandTotal}
                            <div class="bg-blue-50 rounded-xl p-3 flex justify-between items-center border border-blue-100">
                                <span class="text-blue-700 font-medium">Kembalian</span>
                                <span class="text-xl font-bold text-blue-700">{formatRupiah(kembalian)}</span>
                            </div>
                        {:else if customerPaid > 0}
                            <div class="bg-red-50 rounded-xl p-3 flex justify-between items-center border border-red-100">
                                <span class="text-red-600 font-medium">Kurang</span>
                                <span class="text-xl font-bold text-red-600">{formatRupiah(kurangBayar)}</span>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <!-- Non-cash info -->
                    <div class="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                        <p class="text-sm text-slate-600">
                            {metodeBayar === 'qris' ? 'Pembayaran via QRIS' : 'Pembayaran via Transfer Bank'}
                        </p>
                        <p class="text-xs text-slate-400 mt-1">Pastikan pembayaran sudah diterima</p>
                    </div>
                {/if}

                <!-- Customer Name -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Nama Customer (Opsional)</label>
                    <div class="relative">
                        <User class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            bind:value={namaCustomer}
                            placeholder="Masukkan nama"
                            class="w-full h-12 pl-10 pr-4 border border-slate-200 rounded-xl text-sm
                                   focus:outline-none focus:border-emerald-500" 
                        />
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-4 lg:p-5 border-t border-slate-200 bg-slate-50">
                <button 
                    type="button"
                    on:click={handleSubmit}
                    disabled={isProcessing || !canPay}
                    class="w-full h-14 bg-emerald-600 text-white rounded-xl font-semibold text-lg
                           active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors flex items-center justify-center gap-2"
                >
                    {#if isProcessing}
                        <Loader2 class="w-5 h-5 animate-spin" />
                        <span>Memproses...</span>
                    {:else}
                        <Check class="w-5 h-5" />
                        <span>Proses Pembayaran</span>
                    {/if}
                </button>
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