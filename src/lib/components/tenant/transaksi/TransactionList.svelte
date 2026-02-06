<!--
    TransactionList.svelte
    List transaksi dengan tampilan berbeda untuk desktop (tabel) dan mobile (card)
    + Permission support untuk void/batalkan
-->
<script>
    import { Receipt, RefreshCw, ShoppingCart } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import TransactionRow from './TransactionRow.svelte';
    import TransactionCard from './TransactionCard.svelte';

    /** @type {Array} Daftar transaksi */
    export let transactions = [];
    
    /** @type {boolean} Ada filter aktif */
    export let hasActiveFilters = false;
    
    /** @type {boolean} Loading state */
    export let isLoading = false;
    
    /** @type {boolean} Apakah user bisa void/batalkan transaksi (Owner only) */
    export let canVoid = false;

    const dispatch = createEventDispatcher();

    function handleLoadingStart() {
        dispatch('loadingStart');
    }

    function handleLoadingEnd() {
        dispatch('loadingEnd');
    }

    function handleReset() {
        dispatch('reset');
    }
</script>

{#if transactions && transactions.length > 0}
    <div class="bg-white rounded-xl border border-slate-200">
        <!-- Header Info -->
        <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <p class="text-sm text-slate-500">
                Menampilkan <span class="font-medium text-slate-700">{transactions.length}</span> transaksi
            </p>
        </div>

        <!-- Desktop View -->
        <div class="hidden lg:block">
            <!-- Table Header -->
            <div class="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
                <div class="col-span-2">Invoice</div>
                <div class="col-span-2">Tanggal</div>
                <div class="col-span-2">Customer</div>
                <div class="col-span-1 text-center">Item</div>
                <div class="col-span-1 text-center">Metode</div>
                <div class="col-span-2 text-right">Total</div>
                <div class="col-span-1 text-center">Status</div>
                <div class="col-span-1 text-center">Aksi</div>
            </div>

            <!-- Table Body -->
            <div class="divide-y divide-slate-100">
                {#each transactions as trx (trx.id)}
                    <TransactionRow 
                        transaction={trx} 
                        {isLoading}
                        {canVoid}
                        on:loadingStart={handleLoadingStart}
                        on:loadingEnd={handleLoadingEnd}
                    />
                {/each}
            </div>
        </div>

        <!-- Mobile View -->
        <div class="lg:hidden divide-y divide-slate-100">
            {#each transactions as trx (trx.id)}
                <TransactionCard 
                    transaction={trx} 
                    {isLoading}
                    {canVoid}
                    on:loadingStart={handleLoadingStart}
                    on:loadingEnd={handleLoadingEnd}
                />
            {/each}
        </div>
    </div>
{:else}
    <!-- Empty State -->
    <div class="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt class="w-7 h-7 text-slate-400" />
        </div>
        <h3 class="text-base font-medium text-slate-800 mb-1">
            {hasActiveFilters ? 'Transaksi tidak ditemukan' : 'Belum ada transaksi'}
        </h3>
        <p class="text-slate-500 text-sm mb-5">
            {hasActiveFilters ? 'Coba ubah filter pencarian Anda' : 'Transaksi akan muncul setelah Anda melakukan penjualan di kasir'}
        </p>
        {#if hasActiveFilters}
            <button 
                type="button"
                on:click={handleReset}
                class="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 
                       text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm"
            >
                <RefreshCw class="w-4 h-4" />
                <span>Reset Filter</span>
            </button>
        {:else}
            <a 
                href="/tenant/kasir"
                class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white 
                       rounded-lg hover:bg-emerald-700 transition-colors text-sm"
            >
                <ShoppingCart class="w-4 h-4" />
                <span>Buka Kasir</span>
            </a>
        {/if}
    </div>
{/if}