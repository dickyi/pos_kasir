<script>
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';

    export let data;
    export let form;

    $: user = data?.user;
    $: produkList = data?.produk || [];
    $: kategoriList = data?.kategori || [];

    // State
    let searchQuery = '';
    let selectedKategori = '';
    let cart = [];
    let customerPaid = 0;
    let metodeBayar = 'cash';
    let namaCustomer = '';
    let showPaymentModal = false;
    let showSuccessModal = false;
    let isProcessing = false;
    let lastTransaction = null;

    // Filter produk
    $: filteredProduk = produkList.filter(p => {
        const matchSearch = 
            p.nama_produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.kode_produk.toLowerCase().includes(searchQuery.toLowerCase());
        const matchKategori = !selectedKategori || p.kategori_id == selectedKategori;
        return matchSearch && matchKategori;
    });

    // Kalkulasi
    $: totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    $: subtotal = cart.reduce((sum, item) => sum + (item.harga_jual * item.qty), 0);
    $: grandTotal = subtotal;
    $: kembalian = customerPaid - grandTotal;

    // Handle response
    $: if (form?.success && form?.data) {
        lastTransaction = form.data;
        showPaymentModal = false;
        showSuccessModal = true;
        cart = [];
        customerPaid = 0;
        invalidateAll();
    }

    function formatRupiah(angka) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka || 0);
    }

    function addToCart(product) {
        if (product.stok <= 0) {
            alert('Stok habis!');
            return;
        }
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            if (existingItem.qty >= product.stok) {
                alert(`Stok tidak cukup! (Tersisa: ${product.stok})`);
                return;
            }
            existingItem.qty += 1;
            cart = [...cart];
        } else {
            cart = [...cart, { ...product, qty: 1 }];
        }
    }

    function updateQty(productId, newQty) {
        const item = cart.find(i => i.id === productId);
        const product = produkList.find(p => p.id === productId);
        if (!item || !product) return;
        if (newQty <= 0) {
            removeFromCart(productId);
        } else if (newQty > product.stok) {
            alert(`Stok tidak cukup! (Tersisa: ${product.stok})`);
        } else {
            item.qty = newQty;
            cart = [...cart];
        }
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
    }

    function clearCart() {
        if (cart.length === 0) return;
        if (confirm('Hapus semua item?')) {
            cart = [];
            customerPaid = 0;
        }
    }

    function openPaymentModal() {
        if (cart.length === 0) {
            alert('Keranjang kosong!');
            return;
        }
        customerPaid = grandTotal;
        showPaymentModal = true;
    }

    function handleSubmit() {
        isProcessing = true;
        return async ({ result, update }) => {
            isProcessing = false;
            await update();
        };
    }

    function newTransaction() {
        showSuccessModal = false;
        lastTransaction = null;
        cart = [];
        customerPaid = 0;
        namaCustomer = '';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    const quickAmounts = [10000, 20000, 50000, 100000];
</script>

<svelte:head>
    <title>Kasir - {user?.nama_bisnis || 'POS'}</title>
</svelte:head>

<!-- Error Message -->
{#if form?.message && !form?.success}
    <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
        <span class="text-red-500">⚠️</span>
        <p class="text-red-700 flex-1">{form.message}</p>
        <button on:click={() => form = null} class="text-red-400 hover:text-red-600">✕</button>
    </div>
{/if}

<!-- Main Layout -->
<div class="flex flex-col lg:flex-row gap-4">
    
    <!-- LEFT: Products -->
    <div class="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
        
        <!-- Search & Filter -->
        <div class="p-4 border-b border-gray-200">
            <div class="relative mb-3">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Cari produk..."
                    class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>
            <div class="flex gap-2 overflow-x-auto">
                <button
                    on:click={() => selectedKategori = ''}
                    class="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                        {!selectedKategori ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
                >Semua</button>
                {#each kategoriList as kat}
                    <button
                        on:click={() => selectedKategori = kat.id}
                        class="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                            {selectedKategori == kat.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
                    >{kat.nama_kategori}</button>
                {/each}
            </div>
        </div>

        <!-- Products Grid -->
        <div class="p-4 max-h-[60vh] overflow-y-auto">
            {#if filteredProduk.length === 0}
                <div class="text-center py-12 text-gray-400">
                    <span class="text-4xl block mb-2">📦</span>
                    <p>Tidak ada produk</p>
                </div>
            {:else}
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {#each filteredProduk as product}
                        <button
                            on:click={() => addToCart(product)}
                            disabled={product.stok <= 0}
                            class="bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 
                                   rounded-xl p-3 text-left transition-all disabled:opacity-50"
                        >
                            <div class="w-full aspect-square bg-white rounded-lg flex items-center justify-center mb-2 text-2xl border">
                                📦
                            </div>
                            <p class="font-medium text-gray-800 text-sm truncate">{product.nama_produk}</p>
                            <p class="text-emerald-600 font-bold">{formatRupiah(product.harga_jual)}</p>
                            <span class="text-xs {product.stok > 10 ? 'text-green-600' : product.stok > 0 ? 'text-amber-600' : 'text-red-600'}">
                                Stok: {product.stok}
                            </span>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>
    </div>

    <!-- RIGHT: Cart -->
    <div class="w-full lg:w-96 bg-white rounded-xl border border-gray-200 flex flex-col">
        
        <!-- Cart Header -->
        <div class="p-4 bg-emerald-600 text-white rounded-t-xl flex justify-between items-center">
            <div class="flex items-center gap-2">
                <span>🛒</span>
                <span class="font-bold">Keranjang</span>
                <span class="bg-white/20 px-2 py-0.5 rounded-full text-xs">{totalItems}</span>
            </div>
            {#if cart.length > 0}
                <button on:click={clearCart} class="text-sm text-emerald-100 hover:text-white">Hapus Semua</button>
            {/if}
        </div>

        <!-- Cart Items -->
        <div class="flex-1 p-4 overflow-y-auto max-h-[40vh]">
            {#if cart.length === 0}
                <div class="text-center py-8 text-gray-400">
                    <span class="text-4xl block mb-2">🛒</span>
                    <p>Keranjang kosong</p>
                </div>
            {:else}
                <div class="space-y-3">
                    {#each cart as item}
                        <div class="bg-gray-50 rounded-lg p-3">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <p class="font-medium text-sm text-gray-800">{item.nama_produk}</p>
                                    <p class="text-emerald-600 text-sm">{formatRupiah(item.harga_jual)}</p>
                                </div>
                                <button on:click={() => removeFromCart(item.id)} class="text-red-400 hover:text-red-600">✕</button>
                            </div>
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <button on:click={() => updateQty(item.id, item.qty - 1)} 
                                            class="w-7 h-7 bg-white border rounded flex items-center justify-center">-</button>
                                    <span class="w-8 text-center font-medium">{item.qty}</span>
                                    <button on:click={() => updateQty(item.id, item.qty + 1)} 
                                            class="w-7 h-7 bg-white border rounded flex items-center justify-center">+</button>
                                </div>
                                <span class="font-bold">{formatRupiah(item.harga_jual * item.qty)}</span>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- ========================================== -->
        <!-- CART FOOTER - TOMBOL BAYAR (FIXED) -->
        <!-- ========================================== -->
        <div class="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div class="flex justify-between mb-2 text-sm">
                <span class="text-gray-600">Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
            </div>
            <div class="flex justify-between mb-4 text-lg font-bold">
                <span>Total</span>
                <span class="text-emerald-600">{formatRupiah(grandTotal)}</span>
            </div>
            
            <!-- TOMBOL BAYAR -->
            <button
                type="button"
                on:click={openPaymentModal}
                disabled={cart.length === 0}
                class="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg
                       hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 shadow-lg"
            >
                <span class="text-xl">💳</span>
                <span>Bayar {formatRupiah(grandTotal)}</span>
            </button>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- PAYMENT MODAL (FIXED) -->
<!-- ========================================== -->
{#if showPaymentModal}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" on:click={() => showPaymentModal = false}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl" on:click|stopPropagation>
            
            <!-- Modal Header -->
            <div class="p-4 bg-emerald-600 text-white flex justify-between items-center rounded-t-2xl">
                <h3 class="text-lg font-bold flex items-center gap-2">
                    <span>💳</span>
                    <span>Pembayaran</span>
                </h3>
                <button type="button" on:click={() => showPaymentModal = false} class="text-2xl hover:text-emerald-200 leading-none">&times;</button>
            </div>

            <!-- Modal Body -->
            <form method="POST" action="?/simpanTransaksi" use:enhance={handleSubmit}>
                <input type="hidden" name="cart" value={JSON.stringify(cart)} />
                <input type="hidden" name="subtotal" value={subtotal} />
                <input type="hidden" name="diskon" value="0" />
                <input type="hidden" name="pajak" value="0" />
                <input type="hidden" name="total" value={grandTotal} />
                <input type="hidden" name="kembalian" value={kembalian > 0 ? kembalian : 0} />
                <input type="hidden" name="metode_bayar" value={metodeBayar} />

                <div class="p-4 space-y-4">
                    <!-- Total -->
                    <div class="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-200">
                        <p class="text-sm text-emerald-600">Total Pembayaran</p>
                        <p class="text-3xl font-bold text-emerald-700">{formatRupiah(grandTotal)}</p>
                    </div>

                    <!-- Metode Bayar -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
                        <div class="grid grid-cols-3 gap-2">
                            <button type="button" on:click={() => metodeBayar = 'cash'}
                                class="py-2.5 border rounded-lg text-sm font-medium
                                    {metodeBayar === 'cash' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-300'}">
                                💵 Cash
                            </button>
                            <button type="button" on:click={() => metodeBayar = 'qris'}
                                class="py-2.5 border rounded-lg text-sm font-medium
                                    {metodeBayar === 'qris' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-300'}">
                                📱 QRIS
                            </button>
                            <button type="button" on:click={() => metodeBayar = 'transfer'}
                                class="py-2.5 border rounded-lg text-sm font-medium
                                    {metodeBayar === 'transfer' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-300'}">
                                🏦 Transfer
                            </button>
                        </div>
                    </div>

                    <!-- Cash Options -->
                    {#if metodeBayar === 'cash'}
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Uang Diterima</label>
                            <div class="grid grid-cols-4 gap-2 mb-2">
                                {#each quickAmounts as amt}
                                    <button type="button" on:click={() => customerPaid = amt}
                                        class="py-2 border rounded-lg text-xs font-medium
                                            {customerPaid === amt ? 'border-emerald-600 bg-emerald-50' : 'border-gray-300'}">
                                        {formatRupiah(amt)}
                                    </button>
                                {/each}
                            </div>
                            <button type="button" on:click={() => customerPaid = grandTotal}
                                class="w-full py-2 border border-gray-300 rounded-lg text-sm mb-3 hover:border-emerald-400">
                                Uang Pas
                            </button>
                            <div class="relative">
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                                <input type="number" name="bayar" bind:value={customerPaid}
                                    class="w-full pl-10 pr-4 py-3 border rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                        </div>

                        <!-- Kembalian -->
                        {#if customerPaid >= grandTotal}
                            <div class="bg-blue-50 rounded-xl p-3 flex justify-between items-center border border-blue-200">
                                <span class="text-blue-700">Kembalian</span>
                                <span class="text-xl font-bold text-blue-700">{formatRupiah(kembalian)}</span>
                            </div>
                        {:else if customerPaid > 0}
                            <div class="bg-red-50 rounded-xl p-3 text-center border border-red-200">
                                <p class="text-red-600 text-sm">⚠️ Kurang {formatRupiah(grandTotal - customerPaid)}</p>
                            </div>
                        {/if}
                    {:else}
                        <input type="hidden" name="bayar" value={grandTotal} />
                    {/if}

                    <!-- Nama Customer -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Customer (Opsional)</label>
                        <input type="text" name="nama_customer" bind:value={namaCustomer} placeholder="Masukkan nama"
                            class="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                </div>

                <!-- ========================================== -->
                <!-- TOMBOL PROSES PEMBAYARAN (FIXED) -->
                <!-- ========================================== -->
                <div class="p-4 border-t bg-gray-50 rounded-b-2xl">
                    <button
                        type="submit"
                        disabled={isProcessing || (metodeBayar === 'cash' && customerPaid < grandTotal)}
                        class="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg
                               hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed
                               flex items-center justify-center gap-2 shadow-lg"
                    >
                        {#if isProcessing}
                            <span class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Memproses...</span>
                        {:else}
                            <span>✅</span>
                            <span>Proses Pembayaran</span>
                        {/if}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- ========================================== -->
<!-- SUCCESS MODAL -->
<!-- ========================================== -->
{#if showSuccessModal && lastTransaction}
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            
            <!-- Header -->
            <div class="p-6 text-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span class="text-4xl">✅</span>
                </div>
                <h3 class="text-xl font-bold">Pembayaran Berhasil!</h3>
                <p class="text-emerald-100 text-sm">{lastTransaction.no_invoice}</p>
            </div>

            <!-- Receipt -->
            <div class="p-4">
                <div class="text-center border-b border-dashed pb-3 mb-3">
                    <p class="font-bold">{lastTransaction.toko || user?.nama_bisnis}</p>
                    <p class="text-xs text-gray-500">{formatDate(lastTransaction.tanggal)}</p>
                </div>

                <div class="space-y-2 border-b border-dashed pb-3 mb-3 text-sm">
                    {#each lastTransaction.items as item}
                        <div class="flex justify-between">
                            <div>
                                <p>{item.nama_produk}</p>
                                <p class="text-gray-500 text-xs">{item.qty} x {formatRupiah(item.harga_jual)}</p>
                            </div>
                            <p class="font-medium">{formatRupiah(item.harga_jual * item.qty)}</p>
                        </div>
                    {/each}
                </div>

                <div class="space-y-1 text-sm">
                    <div class="flex justify-between font-bold text-base border-t pt-2">
                        <span>Total</span>
                        <span class="text-emerald-600">{formatRupiah(lastTransaction.total)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Bayar</span>
                        <span>{formatRupiah(lastTransaction.bayar)}</span>
                    </div>
                    <div class="flex justify-between font-bold text-blue-600">
                        <span>Kembalian</span>
                        <span>{formatRupiah(lastTransaction.kembalian)}</span>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="p-4 border-t flex gap-3">
                <button type="button" on:click={() => window.print()}
                    class="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                    <span>🖨️</span>
                    <span>Cetak</span>
                </button>
                <button type="button" on:click={newTransaction}
                    class="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 flex items-center justify-center gap-2">
                    <span>➕</span>
                    <span>Transaksi Baru</span>
                </button>
            </div>
        </div>
    </div>
{/if}