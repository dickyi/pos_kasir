/**
 * ============================================
 * KASIR STORE
 * ============================================
 * State management untuk halaman kasir
 * ============================================
 */
import { writable, derived } from 'svelte/store';

// ==========================================
// CART STORE
// ==========================================

/** @type {import('svelte/store').Writable<Array>} */
export const cart = writable([]);

/** Total items di keranjang */
export const cartCount = derived(cart, ($cart) =>
    $cart.reduce((sum, item) => sum + item.qty, 0)
);

/** Subtotal keranjang */
export const cartSubtotal = derived(cart, ($cart) =>
    $cart.reduce((sum, item) => sum + (item.harga_jual * item.qty), 0)
);

// ==========================================
// DISCOUNT STORE
// ==========================================

/** @type {import('svelte/store').Writable<'nominal'|'persen'>} */
export const diskonType = writable('nominal');

/** @type {import('svelte/store').Writable<number>} */
export const diskonValue = writable(0);

/** Jumlah diskon dalam rupiah */
export const diskonAmount = derived(
    [cartSubtotal, diskonType, diskonValue],
    ([$subtotal, $type, $value]) => {
        if ($type === 'persen') {
            return Math.round($subtotal * ($value / 100));
        }
        return $value;
    }
);

/** Grand total setelah diskon */
export const grandTotal = derived(
    [cartSubtotal, diskonAmount],
    ([$subtotal, $diskon]) => Math.max(0, $subtotal - $diskon)
);

// ==========================================
// MODAL STATES
// ==========================================

export const showMobileCart = writable(false);
export const showPaymentModal = writable(false);
export const showSuccessModal = writable(false);
export const showDiscountModal = writable(false);
export const showHoldModal = writable(false);

// ==========================================
// TRANSACTION DATA
// ==========================================

export const customerPaid = writable(0);
export const metodeBayar = writable('cash');
export const namaCustomer = writable('');
export const lastTransaction = writable(null);

/** Kembalian */
export const kembalian = derived(
    [customerPaid, grandTotal],
    ([$paid, $total]) => Math.max(0, $paid - $total)
);

/** Kurang bayar */
export const kurangBayar = derived(
    [customerPaid, grandTotal],
    ([$paid, $total]) => Math.max(0, $total - $paid)
);

// ==========================================
// HOLD TRANSACTIONS
// ==========================================

/** @type {import('svelte/store').Writable<Array>} */
export const holdTransactions = writable([]);

// ==========================================
// CART FUNCTIONS
// ==========================================

/**
 * Tambah produk ke keranjang
 * @param {Object} product 
 * @param {Array} produkList - untuk cek stok
 * @returns {boolean} success
 */
export function addToCart(product, produkList = []) {
    let success = false;
    
    cart.update(items => {
        if (product.stok <= 0) {
            alert('Stok produk habis!');
            return items;
        }
        
        const existingItem = items.find(item => item.id === product.id);
        
        if (existingItem) {
            if (existingItem.qty >= product.stok) {
                alert(`Stok tidak mencukupi! Tersisa ${product.stok} item.`);
                return items;
            }
            existingItem.qty += 1;
            success = true;
            return [...items];
        } else {
            success = true;
            return [...items, { ...product, qty: 1, note: '' }];
        }
    });
    
    return success;
}

/**
 * Update qty item di keranjang
 * @param {number} productId 
 * @param {number} newQty 
 * @param {Array} produkList - untuk cek stok
 */
export function updateQty(productId, newQty, produkList = []) {
    cart.update(items => {
        const item = items.find(i => i.id === productId);
        const product = produkList.find(p => p.id === productId) || item;
        
        if (!item) return items;
        
        if (newQty <= 0) {
            return items.filter(i => i.id !== productId);
        }
        
        if (product && newQty > product.stok) {
            alert(`Stok tidak mencukupi! Tersisa ${product.stok} item.`);
            return items;
        }
        
        item.qty = newQty;
        return [...items];
    });
}

/**
 * Hapus item dari keranjang
 * @param {number} productId 
 */
export function removeFromCart(productId) {
    cart.update(items => items.filter(item => item.id !== productId));
}

/**
 * Kosongkan keranjang
 */
export function clearCart() {
    cart.set([]);
}

// ==========================================
// TRANSACTION FUNCTIONS
// ==========================================

/**
 * Reset semua state transaksi
 */
export function resetTransaction() {
    cart.set([]);
    customerPaid.set(0);
    diskonValue.set(0);
    diskonType.set('nominal');
    namaCustomer.set('');
    metodeBayar.set('cash');
}

/**
 * Set quick amount untuk pembayaran
 * @param {number} amount 
 */
export function setQuickAmount(amount) {
    customerPaid.set(amount);
}

/**
 * Tambah amount ke pembayaran
 * @param {number} amount 
 */
export function addAmount(amount) {
    customerPaid.update(v => v + amount);
}

/**
 * Set uang pas
 * @param {number} total 
 */
export function setExactAmount(total) {
    customerPaid.set(total);
}

/**
 * Clear discount
 */
export function clearDiscount() {
    diskonValue.set(0);
    diskonType.set('nominal');
}

// ==========================================
// HOLD FUNCTIONS
// ==========================================

/**
 * Tahan transaksi saat ini
 */
export function holdTransaction() {
    let currentCart, currentSubtotal, currentDiskonType, currentDiskonValue, currentDiskonAmount, currentTotal, currentCustomer;
    
    cart.subscribe(v => currentCart = v)();
    cartSubtotal.subscribe(v => currentSubtotal = v)();
    diskonType.subscribe(v => currentDiskonType = v)();
    diskonValue.subscribe(v => currentDiskonValue = v)();
    diskonAmount.subscribe(v => currentDiskonAmount = v)();
    grandTotal.subscribe(v => currentTotal = v)();
    namaCustomer.subscribe(v => currentCustomer = v)();
    
    if (currentCart.length === 0) return false;
    
    const holdData = {
        id: Date.now(),
        time: new Date().toISOString(),
        customer: currentCustomer || 'Tanpa Nama',
        items: [...currentCart],
        subtotal: currentSubtotal,
        diskonType: currentDiskonType,
        diskonValue: currentDiskonValue,
        diskonAmount: currentDiskonAmount,
        total: currentTotal
    };
    
    holdTransactions.update(holds => [...holds, holdData]);
    
    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
        let holds;
        holdTransactions.subscribe(v => holds = v)();
        localStorage.setItem('holdTransactions', JSON.stringify(holds));
    }
    
    resetTransaction();
    return true;
}

/**
 * Lanjutkan transaksi yang ditahan
 * @param {number} holdId 
 */
export function resumeTransaction(holdId) {
    let currentCart;
    cart.subscribe(v => currentCart = v)();
    
    if (currentCart.length > 0) {
        if (!confirm('Keranjang saat ini akan diganti. Lanjutkan?')) return false;
    }
    
    let holds;
    holdTransactions.subscribe(v => holds = v)();
    
    const hold = holds.find(h => h.id === holdId);
    if (!hold) return false;
    
    cart.set([...hold.items]);
    namaCustomer.set(hold.customer !== 'Tanpa Nama' ? hold.customer : '');
    diskonType.set(hold.diskonType);
    diskonValue.set(hold.diskonValue);
    
    // Remove from holds
    holdTransactions.update(h => h.filter(x => x.id !== holdId));
    
    // Update localStorage
    if (typeof localStorage !== 'undefined') {
        let updatedHolds;
        holdTransactions.subscribe(v => updatedHolds = v)();
        localStorage.setItem('holdTransactions', JSON.stringify(updatedHolds));
    }
    
    showHoldModal.set(false);
    return true;
}

/**
 * Hapus transaksi yang ditahan
 * @param {number} holdId 
 */
export function deleteHold(holdId) {
    if (!confirm('Hapus transaksi yang ditahan?')) return false;
    
    holdTransactions.update(holds => holds.filter(h => h.id !== holdId));
    
    // Update localStorage
    if (typeof localStorage !== 'undefined') {
        let holds;
        holdTransactions.subscribe(v => holds = v)();
        localStorage.setItem('holdTransactions', JSON.stringify(holds));
    }
    
    return true;
}

/**
 * Load hold transactions dari localStorage
 */
export function loadHoldTransactions() {
    if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('holdTransactions');
        if (saved) {
            try {
                holdTransactions.set(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load hold transactions', e);
            }
        }
    }
}

// ==========================================
// MODAL HELPERS
// ==========================================

/**
 * Buka payment modal
 */
export function openPaymentModal() {
    let currentCart, currentTotal;
    cart.subscribe(v => currentCart = v)();
    grandTotal.subscribe(v => currentTotal = v)();
    
    if (currentCart.length === 0) {
        alert('Keranjang masih kosong!');
        return false;
    }
    
    customerPaid.set(currentTotal);
    showMobileCart.set(false);
    showPaymentModal.set(true);
    return true;
}

/**
 * Tutup semua modal
 */
export function closeAllModals() {
    showMobileCart.set(false);
    showPaymentModal.set(false);
    showSuccessModal.set(false);
    showDiscountModal.set(false);
    showHoldModal.set(false);
}

/**
 * Transaksi baru setelah sukses
 */
export function newTransaction() {
    showSuccessModal.set(false);
    lastTransaction.set(null);
    resetTransaction();
}