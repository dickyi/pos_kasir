<!--
    +page.svelte - Halaman Kasir (Flexible Shift Mode)
    ====================================================
    UPDATED: Support for 3 Modes:
    1. SINGLE MODE - 1 shift untuk seluruh toko
    2. PER USER MODE - Setiap kasir punya shift sendiri
    3. MULTI STATION MODE - 1 shift per mesin kasir
    ====================================================
    Features:
    - Join Shift, Take Over, Force Close (Single & Multi only)
    - Station Selector untuk Multi Mode
    - ShiftStatusBar dengan info mode
    - TutupShiftModal dengan Leave Shift support
-->
<script>
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { onMount, onDestroy, getContext } from 'svelte';
    import { writable } from 'svelte/store';
    import { Clock, AlertCircle, X, Pause, Lock, Maximize2, Minimize2, Store, User, Users, Monitor } from 'lucide-svelte';
    import { fly, fade } from 'svelte/transition';

    // Import komponen kasir
    import {
        ProductGrid,
        CartPanel,
        CartBottomSheet,
        MobileBottomBar,
        PaymentModal,
        SuccessModal,
        DiscountModal,
        HoldModal,
        // ==========================================
        // SHIFT COMPONENTS
        // ==========================================
        BukaShiftModal,
        TutupShiftModal,
        ShiftStatusBar,
        // ==========================================
        // STATION COMPONENTS (for Multi Mode)
        // ==========================================
        StationSelector,
        JoinShiftModal,
        TakeOverModal,
        ForceCloseModal
    } from '$lib/components/tenant/kasir';

    // Import utilities
    import { formatRupiah } from '$lib/utils/format.js';

    // Props dari server
    export let data;
    export let form;

    // ==========================================
    // FULLSCREEN MODE (from layout context)
    // ==========================================
    const fullscreenContext = getContext('fullscreenMode');
    const isFullscreen = fullscreenContext?.isFullscreen;
    
    function enterFullscreen() {
        saveCartToSession();
        fullscreenContext?.enterFullscreen();
    }
    
    function exitFullscreen() {
        saveCartToSession();
        fullscreenContext?.exitFullscreen();
    }

    $: user = data?.user;
    $: tenantUser = data?.tenantUser;
    $: produkList = data?.produk || [];
    $: kategoriList = data?.kategori || [];
    
    // ==========================================
    // MERK DATA
    // ==========================================
    $: merkList = data?.merk || [];
    $: showMerk = data?.showMerk || false;
    
    // ==========================================
    // STRUK SETTINGS
    // ==========================================
    $: strukSettings = data?.strukSettings || {
        struk_logo: null,
        struk_header: '',
        struk_footer: 'Terima kasih atas kunjungan Anda!',
        tampilkan_logo: true,
        tampilkan_alamat: true,
        tampilkan_telepon: true,
        tampilkan_merk_struk: false,
        ukuran_kertas: '58mm',
        auto_print: false
    };

    // ==========================================
    // SHOW MERK (untuk keranjang & struk)
    // ==========================================
    $: showMerkStruk = strukSettings?.tampilkan_merk_struk === true || strukSettings?.tampilkan_merk_struk === 1;

    $: tokoInfo = data?.tokoInfo || {
        nama_bisnis: user?.nama_bisnis || '',
        alamat: '',
        no_telepon: ''
    };

    // ==========================================
    // PERMISSION CHECK
    // ==========================================
    $: permissions = data?.permissions || { 
        canDiscount: true, 
        canVoid: true,
        canJoinShift: false,
        canTakeOver: false,
        canForceClose: false
    };
    $: canDiscount = permissions.canDiscount;
    $: canVoid = permissions.canVoid;
    $: isKasir = tenantUser?.role === 'kasir';

    // ==========================================
    // SHIFT DATA
    // ==========================================
    $: activeShift = data?.activeShift || null;
    $: lastShiftInfo = data?.lastShiftInfo || null;
    $: shiftSettings = data?.shiftSettings || {
        wajib_buka_shift: true,
        multi_shift: false,
        auto_lanjut_kas: false,
        modal_kas_default: 0,
        limit_kas_keluar_kasir: 0
    };
    $: shiftKeHariIni = data?.shiftKeHariIni || 1;
    
    // ==========================================
    // SHIFT USERS (untuk TutupShiftModal)
    // ==========================================
    $: shiftUsers = data?.shiftUsers || activeShift?.users || [];
    
    // Computed shift status
    $: hasActiveShift = activeShift && activeShift.id;
    $: wajibBukaShift = shiftSettings?.wajib_buka_shift ?? true;
    
    // ==========================================
    // MODE DATA (NEW)
    // ==========================================
    $: kasirMode = data?.kasirMode || 'single';
    $: isMultiMode = data?.isMultiMode || kasirMode === 'multi';
    $: isPerUserMode = data?.isPerUserMode || kasirMode === 'per_user';
    $: isSingleMode = kasirMode === 'single';
    
    // ==========================================
    // STATION DATA (for Multi Mode)
    // ==========================================
    $: stations = data?.stations || [];
    $: allActiveShifts = data?.allActiveShifts || [];
    $: tenantSettings = data?.tenantSettings || null;
    
    // ==========================================
    // SELECTED STATION (untuk Multi Mode)
    // ==========================================
    $: selectedStation = stations.find(s => s.id === activeShift?.station_id) || null;

    // ==========================================
    // TRANSACTION PERMISSION
    // Di semua mode: bisa transaksi jika ada active shift milik sendiri
    // atau jika sudah join shift (untuk Single/Multi mode)
    // ==========================================
    $: isMyShift = hasActiveShift && activeShift.tenant_user_id === tenantUser?.id;
    $: hasJoinedShift = hasActiveShift && shiftUsers.some(u => u.user_id === tenantUser?.id);
    $: canDoTransaction = !wajibBukaShift || hasActiveShift;

    // ==========================================
    // MODE LABELS
    // ==========================================
    const modeLabels = {
        'single': { label: 'Single', icon: Monitor, color: 'blue' },
        'per_user': { label: 'Per Kasir', icon: User, color: 'green' },
        'multi': { label: 'Multi Station', icon: Users, color: 'purple' }
    };
    $: currentModeInfo = modeLabels[kasirMode] || modeLabels.single;

    // ==========================================
    // STATE MANAGEMENT - WITH SESSION PERSISTENCE
    // ==========================================
    
    // Cart state
    let cart = [];
    let diskonType = 'nominal';
    let diskonValue = 0;

    // Payment state
    let customerPaid = 0;
    let metodeBayar = 'cash';
    let namaCustomer = '';

    // Modal states
    let showMobileCart = false;
    let showPaymentModal = false;
    let showSuccessModal = false;
    let showDiscountModal = false;
    let showHoldModal = false;
    
    // ==========================================
    // SHIFT MODAL STATES
    // ==========================================
    let showBukaShiftModal = false;
    let showTutupShiftModal = false;
    let isProcessingShift = false;

    // ==========================================
    // STATION MODAL STATES (for Multi Mode)
    // ==========================================
    let showJoinShiftModal = false;
    let showTakeOverModal = false;
    let showForceCloseModal = false;
    let selectedShiftForAction = null;
    let selectedStationId = null;

    // Processing
    let isProcessing = false;
    let lastTransaction = null;

    // ==========================================
    // ERROR MESSAGE STATE
    // ==========================================
    let errorMessage = '';

    // Hold transactions
    let holdTransactions = [];

    // Time
    let currentTime = '';
    let timeInterval;

    // Notification
    let notification = { show: false, type: '', message: '' };

    // Reference
    let productGridRef;

    // ==========================================
    // CART SESSION PERSISTENCE
    // ==========================================
    
    const CART_SESSION_KEY = 'pos_active_cart';
    const CART_STATE_KEY = 'pos_cart_state';
    
    function saveCartToSession() {
        if (typeof sessionStorage === 'undefined') return;
        
        try {
            const cartState = {
                cart,
                diskonType,
                diskonValue,
                namaCustomer,
                metodeBayar,
                timestamp: Date.now()
            };
            sessionStorage.setItem(CART_SESSION_KEY, JSON.stringify(cart));
            sessionStorage.setItem(CART_STATE_KEY, JSON.stringify(cartState));
        } catch (e) {
            console.error('Failed to save cart to session:', e);
        }
    }
    
    function loadCartFromSession() {
        if (typeof sessionStorage === 'undefined') return;
        
        try {
            const savedState = sessionStorage.getItem(CART_STATE_KEY);
            if (savedState) {
                const state = JSON.parse(savedState);
                if (state.timestamp && (Date.now() - state.timestamp) < 30 * 60 * 1000) {
                    cart = state.cart || [];
                    diskonType = state.diskonType || 'nominal';
                    diskonValue = state.diskonValue || 0;
                    namaCustomer = state.namaCustomer || '';
                    metodeBayar = state.metodeBayar || 'cash';
                    return true;
                }
            }
            
            const savedCart = sessionStorage.getItem(CART_SESSION_KEY);
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                if (Array.isArray(parsedCart) && parsedCart.length > 0) {
                    cart = parsedCart;
                    return true;
                }
            }
        } catch (e) {
            console.error('Failed to load cart from session:', e);
        }
        return false;
    }
    
    function clearCartSession() {
        if (typeof sessionStorage === 'undefined') return;
        
        try {
            sessionStorage.removeItem(CART_SESSION_KEY);
            sessionStorage.removeItem(CART_STATE_KEY);
        } catch (e) {
            console.error('Failed to clear cart session:', e);
        }
    }

    // Auto-save cart when it changes
    $: if (cart.length > 0 || diskonValue > 0) {
        saveCartToSession();
    }

    // ==========================================
    // COMPUTED VALUES
    // ==========================================
    
    $: totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    $: subtotal = cart.reduce((sum, item) => sum + (item.harga_jual * item.qty), 0);
    $: diskonAmount = diskonType === 'persen' 
        ? Math.round(subtotal * (diskonValue / 100))
        : diskonValue;
    $: grandTotal = Math.max(0, subtotal - diskonAmount);
    $: kembalian = Math.max(0, customerPaid - grandTotal);

    // ==========================================
    // LIFECYCLE
    // ==========================================
    
    onMount(() => {
        updateTime();
        timeInterval = setInterval(updateTime, 1000);
        loadHoldTransactions();
        loadCartFromSession();
        
        window.addEventListener('keydown', handleKeyboard);
        document.addEventListener('visibilitychange', handleVisibilityChange);
    });

    onDestroy(() => {
        if (timeInterval) clearInterval(timeInterval);
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', handleKeyboard);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
        saveCartToSession();
    });
    
    function handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            saveCartToSession();
        }
    }

    function updateTime() {
        currentTime = new Date().toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }

    function handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        if (e.key === 'F2') {
            e.preventDefault();
            productGridRef?.focusSearch();
        }
        if (e.key === 'F3' && cart.length > 0) {
            e.preventDefault();
            openPaymentModal();
        }
        if (e.key === 'F4' && cart.length > 0) {
            e.preventDefault();
            holdTransaction();
        }
        if (e.key === 'F11') {
            e.preventDefault();
            if ($isFullscreen) {
                exitFullscreen();
            } else {
                enterFullscreen();
            }
        }
        if (e.key === 'Escape') {
            if (showPaymentModal || showSuccessModal || showHoldModal || showDiscountModal || showMobileCart || showBukaShiftModal || showTutupShiftModal || showJoinShiftModal || showTakeOverModal || showForceCloseModal) {
                showPaymentModal = false;
                showSuccessModal = false;
                showHoldModal = false;
                showDiscountModal = false;
                showMobileCart = false;
                showBukaShiftModal = false;
                showTutupShiftModal = false;
                showJoinShiftModal = false;
                showTakeOverModal = false;
                showForceCloseModal = false;
            } else if ($isFullscreen) {
                exitFullscreen();
            }
        }
    }

    // ==========================================
    // NOTIFICATION
    // ==========================================
    
    function showNotification(type, message) {
        notification = { show: true, type, message };
        setTimeout(() => {
            notification = { show: false, type: '', message: '' };
        }, 3000);
    }

    // ==========================================
    // SHIFT FUNCTIONS
    // ==========================================
    
    function openBukaShiftModal() {
        selectedStationId = null;
        showBukaShiftModal = true;
    }
    
    function openTutupShiftModal() {
        if (!hasActiveShift) {
            showNotification('error', 'Tidak ada shift aktif!');
            return;
        }
        showTutupShiftModal = true;
    }
    
    async function handleBukaShift(event) {
        const { sumberModal, modalAwal, catatan, stationId } = event.detail;
        
        isProcessingShift = true;
        
        const formData = new FormData();
        formData.append('sumber_modal', sumberModal);
        formData.append('modal_awal', modalAwal.toString());
        formData.append('catatan', catatan || '');
        formData.append('station_id', (stationId || selectedStationId || '').toString());
        
        try {
            const response = await fetch('?/bukaShift', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            const responseData = result?.data ? JSON.parse(result.data) : result;
            
            if (responseData?.[0]?.success || responseData?.success) {
                showBukaShiftModal = false;
                selectedStationId = null;
                showNotification('success', 'Shift berhasil dibuka!');
                await invalidateAll();
            } else if (responseData?.[0]?.message || responseData?.message) {
                showNotification('error', responseData[0]?.message || responseData.message);
            } else {
                showBukaShiftModal = false;
                selectedStationId = null;
                showNotification('success', 'Shift berhasil dibuka!');
                await invalidateAll();
            }
        } catch (error) {
            console.error('Error opening shift:', error);
            showNotification('error', 'Gagal membuka shift. Silakan coba lagi.');
        } finally {
            isProcessingShift = false;
        }
    }
    
    async function handleTutupShift(event) {
        const { kasAkhirAktual, catatan } = event.detail;
        
        if (!activeShift?.id) {
            showNotification('error', 'Tidak ada shift aktif!');
            return;
        }
        
        isProcessingShift = true;
        
        const formData = new FormData();
        formData.append('shift_id', activeShift.id.toString());
        formData.append('kas_akhir_aktual', kasAkhirAktual.toString());
        formData.append('catatan', catatan || '');
        
        try {
            const response = await fetch('?/tutupShift', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            const responseData = result?.data ? JSON.parse(result.data) : result;
            
            if (responseData?.[0]?.success || responseData?.success) {
                showTutupShiftModal = false;
                showNotification('success', 'Shift berhasil ditutup!');
                await invalidateAll();
            } else if (responseData?.[0]?.message || responseData?.message) {
                showNotification('error', responseData[0]?.message || responseData.message);
            } else {
                showTutupShiftModal = false;
                showNotification('success', 'Shift berhasil ditutup!');
                await invalidateAll();
            }
        } catch (error) {
            console.error('Error closing shift:', error);
            showNotification('error', 'Gagal menutup shift. Silakan coba lagi.');
        } finally {
            isProcessingShift = false;
        }
    }
    
    // ==========================================
    // handleLeaveShift - untuk user yang join keluar dari shift
    // ==========================================
    async function handleLeaveShift() {
        if (!activeShift?.id) {
            showNotification('error', 'Tidak ada shift aktif!');
            return;
        }
        
        isProcessingShift = true;
        
        const formData = new FormData();
        formData.append('shift_id', activeShift.id.toString());
        
        try {
            const response = await fetch('?/leaveShift', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            const responseData = result?.data ? JSON.parse(result.data) : result;
            
            if (responseData?.[0]?.success || responseData?.success) {
                showTutupShiftModal = false;
                showNotification('success', 'Berhasil keluar dari shift!');
                await invalidateAll();
            } else if (responseData?.[0]?.message || responseData?.message) {
                showNotification('error', responseData[0]?.message || responseData.message);
            } else {
                showTutupShiftModal = false;
                showNotification('success', 'Berhasil keluar dari shift!');
                await invalidateAll();
            }
        } catch (error) {
            console.error('Error leaving shift:', error);
            showNotification('error', 'Gagal keluar dari shift. Silakan coba lagi.');
        } finally {
            isProcessingShift = false;
        }
    }

    // ==========================================
    // STATION FUNCTIONS (for Multi Mode)
    // ==========================================
    
    function handleOpenShiftOnStation(event) {
        const { stationId } = event.detail;
        selectedStationId = stationId;
        showBukaShiftModal = true;
    }
    
    function handleSelectStation(event) {
        const { station, shift } = event.detail;
        
        if (shift) {
            console.log('Selected station with active shift:', station.nama);
        } else {
            selectedStationId = station.id;
            showBukaShiftModal = true;
        }
    }
    
    // ==========================================
    // handleJoinShift - Support Single & Multi Mode only
    // ==========================================
    function handleJoinShift(event) {
        // Per User Mode: Join tidak diizinkan
        if (isPerUserMode) {
            showNotification('error', 'Join shift tidak tersedia di mode Per Kasir');
            return;
        }
        
        const { shiftId } = event.detail;
        const shift = shiftId 
            ? allActiveShifts.find(s => s.id === shiftId) || activeShift
            : activeShift;
        
        if (shift) {
            selectedShiftForAction = shift;
            showJoinShiftModal = true;
        }
    }
    
    // ==========================================
    // handleTakeOver - Support Single & Multi Mode only
    // ==========================================
    function handleTakeOver(event) {
        // Per User Mode: Take over tidak diizinkan
        if (isPerUserMode) {
            showNotification('error', 'Take over tidak tersedia di mode Per Kasir');
            return;
        }
        
        const { shiftId } = event.detail;
        const shift = shiftId 
            ? allActiveShifts.find(s => s.id === shiftId) || activeShift
            : activeShift;
        
        if (shift) {
            selectedShiftForAction = shift;
            showTakeOverModal = true;
        }
    }
    
    // ==========================================
    // handleForceClose - All modes (Owner only)
    // ==========================================
    function handleForceClose(event) {
        const { shiftId } = event.detail;
        const shift = shiftId 
            ? allActiveShifts.find(s => s.id === shiftId) || activeShift
            : activeShift;
        
        if (shift) {
            selectedShiftForAction = shift;
            showForceCloseModal = true;
        }
    }
    
    async function confirmJoinShift(event) {
        const { shiftId } = event.detail;
        isProcessingShift = true;
        
        const formData = new FormData();
        formData.append('shift_id', shiftId.toString());
        
        try {
            const response = await fetch('?/joinShift', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            const responseData = result?.data ? JSON.parse(result.data) : result;
            
            if (responseData?.[0]?.success || responseData?.success) {
                showJoinShiftModal = false;
                selectedShiftForAction = null;
                showNotification('success', 'Berhasil bergabung ke shift!');
                await invalidateAll();
            } else {
                showNotification('error', responseData?.[0]?.message || responseData?.message || 'Gagal bergabung ke shift');
            }
        } catch (error) {
            console.error('Error joining shift:', error);
            showNotification('error', 'Terjadi kesalahan saat bergabung ke shift');
        } finally {
            isProcessingShift = false;
        }
    }
    
    async function confirmTakeOver(event) {
        const { shiftId, catatan } = event.detail;
        isProcessingShift = true;
        
        const formData = new FormData();
        formData.append('shift_id', shiftId.toString());
        formData.append('catatan', catatan || '');
        
        try {
            const response = await fetch('?/takeOverShift', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            const responseData = result?.data ? JSON.parse(result.data) : result;
            
            if (responseData?.[0]?.success || responseData?.success) {
                showTakeOverModal = false;
                selectedShiftForAction = null;
                showNotification('success', 'Shift berhasil diambil alih!');
                await invalidateAll();
            } else {
                showNotification('error', responseData?.[0]?.message || responseData?.message || 'Gagal mengambil alih shift');
            }
        } catch (error) {
            console.error('Error taking over shift:', error);
            showNotification('error', 'Terjadi kesalahan saat mengambil alih shift');
        } finally {
            isProcessingShift = false;
        }
    }
    
    async function confirmForceClose(event) {
        const { shiftId, catatan } = event.detail;
        isProcessingShift = true;
        
        const formData = new FormData();
        formData.append('shift_id', shiftId.toString());
        formData.append('catatan', catatan || '');
        
        try {
            const response = await fetch('?/forceCloseShift', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            const responseData = result?.data ? JSON.parse(result.data) : result;
            
            if (responseData?.[0]?.success || responseData?.success) {
                showForceCloseModal = false;
                selectedShiftForAction = null;
                showNotification('success', 'Shift berhasil ditutup paksa!');
                await invalidateAll();
            } else {
                showNotification('error', responseData?.[0]?.message || responseData?.message || 'Gagal menutup paksa shift');
            }
        } catch (error) {
            console.error('Error force closing shift:', error);
            showNotification('error', 'Terjadi kesalahan saat menutup paksa shift');
        } finally {
            isProcessingShift = false;
        }
    }

    // ==========================================
    // CART FUNCTIONS - DENGAN SUPPORT VARIAN
    // ==========================================
    
    function getCartItemKey(item) {
        if (item.varian_id) {
            return `${item.id}-${item.varian_id}`;
        }
        return `${item.id}`;
    }

    function findCartItem(productId, varianId = null) {
        return cart.find(item => {
            if (varianId) {
                return item.id === productId && item.varian_id === varianId;
            }
            return item.id === productId && !item.varian_id;
        });
    }

    function addToCart(product) {
        // ==========================================
        // CEK SHIFT SEBELUM TAMBAH KE CART
        // ==========================================
        if (!canDoTransaction) {
            showNotification('error', 'Buka shift terlebih dahulu untuk memulai transaksi!');
            if (!isMultiMode) {
                showBukaShiftModal = true;
            }
            return;
        }
        
        if (!product || !product.id) {
            console.error('Invalid product data');
            return;
        }

        const stok = product.stok || 0;
        if (stok <= 0) {
            showNotification('error', 'Stok produk habis!');
            return;
        }
        
        const existingItem = findCartItem(product.id, product.varian_id);
        
        if (existingItem) {
            if (existingItem.qty >= stok) {
                showNotification('error', `Stok tidak mencukupi! Tersisa ${stok} item.`);
                return;
            }
            existingItem.qty += product.qty || 1;
            cart = [...cart];
        } else {
            const newItem = {
                ...product,
                qty: product.qty || 1,
                note: '',
                addedAt: Date.now(),
                _cartKey: getCartItemKey(product)
            };
            cart = [...cart, newItem];
        }

        const itemName = product.nama_varian 
            ? `${product.nama_produk} - ${product.nama_varian}`
            : product.nama_produk;
        showNotification('success', `${itemName} ditambahkan`);
    }

    function updateQty(productId, varianId, newQty) {
        const item = findCartItem(productId, varianId);
        if (!item) return;
        
        if (newQty <= 0) {
            removeFromCart(productId, varianId);
            return;
        }
        
        let maxStock = item.stok;
        
        if (varianId) {
            const product = produkList.find(p => p.id === productId);
            const variant = product?.variants?.find(v => v.id === varianId);
            maxStock = variant?.stok || item.stok;
        } else {
            const product = produkList.find(p => p.id === productId);
            maxStock = product?.stok || item.stok;
        }
        
        if (newQty > maxStock) {
            showNotification('error', `Stok tidak mencukupi! Tersisa ${maxStock} item.`);
            return;
        }
        
        item.qty = newQty;
        cart = [...cart];
    }

    function removeFromCart(productId, varianId = null) {
        const item = findCartItem(productId, varianId);
        
        cart = cart.filter(i => {
            if (varianId) {
                return !(i.id === productId && i.varian_id === varianId);
            }
            return !(i.id === productId && !i.varian_id);
        });
        
        if (item) {
            const itemName = item.nama_varian 
                ? `${item.nama_produk} - ${item.nama_varian}`
                : item.nama_produk;
            showNotification('info', `${itemName} dihapus dari keranjang`);
        }
        
        if (cart.length === 0) {
            showMobileCart = false;
            clearCartSession();
        }
    }

    function handleUpdateQty(event) {
        const { id, varianId, qty } = event.detail;
        updateQty(id, varianId, qty);
    }

    function handleRemove(event) {
        const { id, varianId } = event.detail;
        removeFromCart(id, varianId);
    }

    function clearCart() {
        if (cart.length === 0) return;
        
        if (confirm('Hapus semua item dari keranjang?')) {
            resetTransaction();
            showMobileCart = false;
            showNotification('info', 'Keranjang dikosongkan');
        }
    }

    function resetTransaction() {
        cart = [];
        customerPaid = 0;
        diskonValue = 0;
        diskonType = 'nominal';
        namaCustomer = '';
        metodeBayar = 'cash';
        clearCartSession();
    }

    // ==========================================
    // HOLD FUNCTIONS
    // ==========================================
    
    function loadHoldTransactions() {
        if (typeof localStorage === 'undefined') return;
        
        try {
            const saved = localStorage.getItem('holdTransactions');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    holdTransactions = parsed;
                }
            }
        } catch (e) {
            console.error('Failed to load hold transactions:', e);
            localStorage.removeItem('holdTransactions');
        }
    }

    function saveHoldTransactions() {
        if (typeof localStorage === 'undefined') return;
        
        try {
            localStorage.setItem('holdTransactions', JSON.stringify(holdTransactions));
        } catch (e) {
            console.error('Failed to save hold transactions:', e);
            if (e.name === 'QuotaExceededError') {
                showNotification('error', 'Penyimpanan penuh! Hapus beberapa transaksi yang ditahan.');
            }
        }
    }
    
    function holdTransaction() {
        if (cart.length === 0) {
            showNotification('error', 'Keranjang masih kosong!');
            return;
        }
        
        const holdData = {
            id: Date.now(),
            time: new Date().toISOString(),
            customer: namaCustomer || 'Tanpa Nama',
            items: [...cart],
            subtotal,
            diskonType,
            diskonValue,
            diskonAmount,
            total: grandTotal
        };
        
        holdTransactions = [...holdTransactions, holdData];
        saveHoldTransactions();
        resetTransaction();
        showMobileCart = false;
        showNotification('success', 'Transaksi ditahan');
    }

    function resumeTransaction(holdId) {
        const hold = holdTransactions.find(h => h.id === holdId);
        if (!hold) return;
        
        if (cart.length > 0) {
            if (!confirm('Keranjang saat ini akan diganti. Lanjutkan?')) return;
        }
        
        cart = [...hold.items];
        namaCustomer = hold.customer !== 'Tanpa Nama' ? hold.customer : '';
        
        if (canDiscount) {
            diskonType = hold.diskonType;
            diskonValue = hold.diskonValue;
        } else {
            diskonType = 'nominal';
            diskonValue = 0;
        }
        
        holdTransactions = holdTransactions.filter(h => h.id !== holdId);
        saveHoldTransactions();
        showHoldModal = false;
        showNotification('success', 'Transaksi dilanjutkan');
    }

    function deleteHold(holdId) {
        if (!confirm('Hapus transaksi yang ditahan?')) return;
        
        holdTransactions = holdTransactions.filter(h => h.id !== holdId);
        saveHoldTransactions();
        showNotification('info', 'Transaksi dihapus');
    }

    // ==========================================
    // PAYMENT FUNCTIONS
    // ==========================================
    
    function openPaymentModal() {
        // ==========================================
        // CEK SHIFT SEBELUM PEMBAYARAN
        // ==========================================
        if (!canDoTransaction) {
            showNotification('error', 'Buka shift terlebih dahulu untuk memulai transaksi!');
            if (!isMultiMode) {
                showBukaShiftModal = true;
            }
            return;
        }
        
        if (cart.length === 0) {
            showNotification('error', 'Keranjang masih kosong!');
            return;
        }
        
        if (grandTotal <= 0) {
            showNotification('error', 'Total transaksi tidak valid!');
            return;
        }
        
        errorMessage = '';
        customerPaid = grandTotal;
        showMobileCart = false;
        showPaymentModal = true;
    }

    function handlePaymentSubmit(event) {
        if (isProcessing) return;
        
        const { metodeBayar: method, customerPaid: paid, namaCustomer: customer } = event.detail;
        metodeBayar = method;
        customerPaid = paid;
        namaCustomer = customer;
        
        isProcessing = true;
        errorMessage = '';
        
        const form = document.getElementById('payment-form');
        if (form) {
            form.requestSubmit();
        } else {
            console.error('Payment form not found');
            isProcessing = false;
            showNotification('error', 'Terjadi kesalahan sistem');
        }
    }

    // ==========================================
    // Form Submit Handler
    // ==========================================
    function handleFormSubmit() {
        return async ({ result, update }) => {
            isProcessing = false;
            
            if (result.type === 'success' && result.data?.success) {
                lastTransaction = result.data.data;
                
                showPaymentModal = false;
                showMobileCart = false;
                
                resetTransaction();
                
                showSuccessModal = true;
                
                invalidateAll();
                
            } else if (result.type === 'failure') {
                const message = result.data?.message || 'Transaksi gagal. Silakan coba lagi.';
                errorMessage = message;
                showNotification('error', message);
                
                if (result.data?.requireShift) {
                    showPaymentModal = false;
                    if (!isMultiMode) {
                        showBukaShiftModal = true;
                    }
                }
                
                await update();
                
            } else {
                await update();
            }
        };
    }

    function newTransaction() {
        showSuccessModal = false;
        lastTransaction = null;
        resetTransaction();
    }

    // ==========================================
    // DISCOUNT FUNCTIONS
    // ==========================================
    
    function openDiscountModal() {
        if (!canDiscount) {
            showNotification('error', 'Anda tidak memiliki izin untuk memberikan diskon. Hubungi Owner/Admin.');
            return;
        }
        showDiscountModal = true;
    }
    
    function handleDiscountApply(event) {
        if (!canDiscount) {
            showNotification('error', 'Anda tidak memiliki izin untuk memberikan diskon.');
            return;
        }
        
        const { type, value } = event.detail;
        diskonType = type;
        diskonValue = value;
        showNotification('success', 'Diskon diterapkan');
    }

    function clearDiscount() {
        diskonValue = 0;
        diskonType = 'nominal';
        showNotification('info', 'Diskon dihapus');
    }

    // ==========================================
    // CLEAR ERROR MESSAGE
    // ==========================================
    function clearError() {
        errorMessage = '';
    }
</script>

<svelte:head>
    <title>Kasir - {user?.nama_bisnis || 'POS'}</title>
</svelte:head>

<!-- Notification Toast -->
{#if notification.show}
    <div 
        transition:fly={{ y: -20 }}
        class="fixed top-4 right-4 z-[100] p-4 rounded-xl shadow-lg max-w-sm
               {notification.type === 'error' ? 'bg-red-500' : 
                notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}
               text-white"
    >
        {notification.message}
    </div>
{/if}

<!-- ==========================================
     FULLSCREEN HEADER (Only shown in fullscreen mode)
     ========================================== -->
{#if $isFullscreen}
    <div 
        transition:fly={{ y: -20, duration: 200 }}
        class="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 
               border-b border-slate-700 shadow-lg"
    >
        <div class="px-4 lg:px-6 h-14 flex items-center justify-between">
            <!-- Left: Store Info -->
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Store class="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h1 class="font-bold text-white text-sm">{user?.nama_bisnis || 'Kasir'}</h1>
                    <div class="flex items-center gap-2 text-xs text-slate-400">
                        <Clock class="w-3 h-3" />
                        <span>{currentTime}</span>
                        <span class="text-slate-600">•</span>
                        <span>{tenantUser?.nama || 'Kasir'}</span>
                    </div>
                </div>
            </div>

            <!-- Right: Exit Button -->
            <button
                type="button"
                on:click={exitFullscreen}
                class="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 
                       text-white rounded-xl transition-colors"
            >
                <Minimize2 class="w-4 h-4" />
                <span class="hidden sm:inline text-sm font-medium">Keluar Mode Fokus</span>
                <span class="sm:hidden text-sm font-medium">Keluar</span>
            </button>
        </div>
    </div>
{/if}

<!-- Main Container -->
<div class="flex flex-col {$isFullscreen ? 'min-h-screen pt-20 pb-20 lg:pb-0' : 'min-h-[calc(100dvh-140px)] lg:min-h-0 pb-20 lg:pb-0'}">
    
    <!-- Header (Normal Mode Only) -->
    {#if !$isFullscreen}
        <div class="flex items-center justify-between gap-3 mb-3">
            <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                    <h1 class="text-lg lg:text-xl font-semibold text-slate-800">Kasir</h1>
                    {#if tenantUser}
                        <span class="text-xs px-2 py-0.5 rounded-full font-medium
                            {tenantUser.role === 'owner' ? 'bg-amber-100 text-amber-700' : 
                             tenantUser.role === 'admin' ? 'bg-blue-100 text-blue-700' : 
                             'bg-green-100 text-green-700'}">
                            {tenantUser.role === 'owner' ? 'Owner' : 
                             tenantUser.role === 'admin' ? 'Admin' : 'Kasir'}
                        </span>
                    {/if}
                    <!-- Mode Badge -->
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium
                        {currentModeInfo.color === 'blue' ? 'bg-blue-100 text-blue-700' : 
                         currentModeInfo.color === 'green' ? 'bg-green-100 text-green-700' : 
                         'bg-purple-100 text-purple-700'}">
                        <svelte:component this={currentModeInfo.icon} class="w-3 h-3 inline mr-1" />
                        {currentModeInfo.label}
                    </span>
                </div>
                <div class="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock class="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{currentTime}</span>
                    {#if tenantUser?.nama}
                        <span class="hidden sm:inline text-slate-300">•</span>
                        <span class="hidden sm:inline font-medium">{tenantUser.nama}</span>
                    {/if}
                </div>
            </div>
            
            <div class="flex items-center gap-2">
                <!-- Fullscreen/Focus Mode Button -->
                <button
                    type="button"
                    on:click={enterFullscreen}
                    class="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 
                           text-slate-700 rounded-xl transition-colors border border-slate-200"
                    title="Mode Fokus (F11)"
                >
                    <Maximize2 class="w-4 h-4" />
                    <span class="text-sm font-medium">Mode Fokus</span>
                </button>

                <!-- Mobile: Icon only -->
                <button
                    type="button"
                    on:click={enterFullscreen}
                    class="sm:hidden p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 
                           rounded-xl transition-colors border border-slate-200"
                    title="Mode Fokus"
                >
                    <Maximize2 class="w-5 h-5" />
                </button>

                {#if isKasir}
                    <div class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
                        <Lock class="w-3.5 h-3.5" />
                        <span>Diskon: Hubungi Admin</span>
                    </div>
                {/if}
                
                {#if holdTransactions.length > 0}
                    <button
                        type="button"
                        on:click={() => showHoldModal = true}
                        class="relative p-2.5 bg-amber-50 text-amber-700 border border-amber-200 
                               rounded-xl active:scale-95 transition-transform flex-shrink-0"
                    >
                        <Pause class="w-5 h-5" />
                        <span class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white 
                                     text-xs rounded-full flex items-center justify-center font-bold">
                            {holdTransactions.length}
                        </span>
                    </button>
                {/if}
            </div>
        </div>
    {/if}

    <!-- ==========================================
         CONDITIONAL SHIFT UI BASED ON MODE
         ========================================== -->
    {#if isMultiMode}
        <!-- ==========================================
             MULTI STATION MODE: Station Selector Grid
             ========================================== -->
        <StationSelector 
            {stations}
            activeShifts={allActiveShifts}
            {isMultiMode}
            currentUserId={tenantUser?.id}
            userRole={tenantUser?.role || 'kasir'}
            {permissions}
            isLoading={isProcessingShift}
            on:selectStation={handleSelectStation}
            on:openShift={handleOpenShiftOnStation}
            on:joinShift={handleJoinShift}
            on:takeOver={handleTakeOver}
            on:forceClose={handleForceClose}
        />
    {:else}
        <!-- ==========================================
             SINGLE MODE & PER USER MODE: ShiftStatusBar
             ========================================== -->
        <ShiftStatusBar 
            {activeShift}
            {wajibBukaShift}
            userName={tenantUser?.nama || user?.nama || 'Kasir'}
            isLoading={isProcessingShift}
            currentUserId={tenantUser?.id}
            userRole={tenantUser?.role || 'kasir'}
            {permissions}
            {kasirMode}
            {isPerUserMode}
            on:openShift={openBukaShiftModal}
            on:closeShift={openTutupShiftModal}
            on:joinShift={handleJoinShift}
            on:takeOver={handleTakeOver}
            on:forceClose={handleForceClose}
        />
    {/if}

    <!-- Error Message -->
    {#if errorMessage}
        <div 
            transition:fly={{ y: -10, duration: 200 }}
            class="p-3 mb-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2"
        >
            <AlertCircle class="w-4 h-4 text-red-500 flex-shrink-0" />
            <p class="text-red-700 text-sm flex-1">{errorMessage}</p>
            <button type="button" on:click={clearError} class="p-1 text-red-400 hover:text-red-600">
                <X class="w-4 h-4" />
            </button>
        </div>
    {/if}

    <!-- Fullscreen Mode: Hold Button Floating -->
    {#if $isFullscreen && holdTransactions.length > 0}
        <button
            type="button"
            on:click={() => showHoldModal = true}
            class="fixed top-20 right-4 z-40 p-3 bg-amber-500 text-white rounded-xl shadow-lg
                   hover:bg-amber-600 transition-colors flex items-center gap-2"
        >
            <Pause class="w-5 h-5" />
            <span class="font-semibold">{holdTransactions.length} Ditahan</span>
        </button>
    {/if}

    <!-- Main Layout -->
    <div class="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 {$isFullscreen ? 'px-4 lg:px-6' : ''}">
        
        <!-- Product Grid -->
        <ProductGrid 
            bind:this={productGridRef}
            products={produkList}
            kategori={kategoriList}
            merk={merkList}
            {showMerk}
            on:addToCart={(e) => addToCart(e.detail)}
        />

        <!-- Desktop Cart Panel -->
        <CartPanel 
            {cart}
            {totalItems}
            {subtotal}
            {diskonAmount}
            {grandTotal}
            {canDiscount}
            showMerk={showMerkStruk}
            on:updateQty={handleUpdateQty}
            on:remove={handleRemove}
            on:hold={holdTransaction}
            on:clear={clearCart}
            on:openDiscount={openDiscountModal}
            on:clearDiscount={clearDiscount}
            on:checkout={openPaymentModal}
        />
    </div>
</div>

<!-- Mobile Bottom Bar -->
<MobileBottomBar 
    {totalItems}
    {grandTotal}
    on:openCart={() => showMobileCart = true}
    on:checkout={openPaymentModal}
/>

<!-- Mobile Cart Bottom Sheet -->
<CartBottomSheet 
    bind:open={showMobileCart}
    {cart}
    {totalItems}
    {diskonAmount}
    {grandTotal}
    {canDiscount}
    showMerk={showMerkStruk}
    on:updateQty={handleUpdateQty}
    on:remove={handleRemove}
    on:hold={holdTransaction}
    on:clear={clearCart}
    on:openDiscount={openDiscountModal}
    on:checkout={openPaymentModal}
/>

<!-- Payment Modal -->
<PaymentModal 
    bind:open={showPaymentModal}
    {grandTotal}
    bind:customerPaid
    bind:metodeBayar
    bind:namaCustomer
    {isProcessing}
    on:submit={handlePaymentSubmit}
/>

<!-- Hidden Payment Form -->
<form 
    id="payment-form"
    method="POST" 
    action="?/simpanTransaksi" 
    use:enhance={handleFormSubmit}
    class="hidden"
>
    <input type="hidden" name="cart" value={JSON.stringify(cart)} />
    <input type="hidden" name="subtotal" value={subtotal} />
    <input type="hidden" name="diskon" value={diskonAmount} />
    <input type="hidden" name="pajak" value="0" />
    <input type="hidden" name="total" value={grandTotal} />
    <input type="hidden" name="kembalian" value={kembalian} />
    <input type="hidden" name="metode_bayar" value={metodeBayar} />
    <input type="hidden" name="bayar" value={customerPaid} />
    <input type="hidden" name="nama_customer" value={namaCustomer} />
    <input type="hidden" name="catatan" value="" />
</form>

<!-- Success Modal -->
<SuccessModal 
    bind:open={showSuccessModal}
    transaction={lastTransaction}
    storeName={user?.nama_bisnis}
    {strukSettings}
    {tokoInfo}
    on:newTransaction={newTransaction}
/>

<!-- Discount Modal -->
{#if canDiscount}
    <DiscountModal 
        bind:open={showDiscountModal}
        {diskonType}
        {diskonValue}
        {subtotal}
        on:apply={handleDiscountApply}
    />
{/if}

<!-- Hold Modal -->
<HoldModal 
    bind:open={showHoldModal}
    {holdTransactions}
    on:resume={(e) => resumeTransaction(e.detail.id)}
    on:delete={(e) => deleteHold(e.detail.id)}
/>

<!-- ==========================================
     SHIFT MODALS
     ========================================== -->

<!-- Buka Shift Modal -->
<BukaShiftModal 
    bind:open={showBukaShiftModal}
    {lastShiftInfo}
    defaultModal={shiftSettings?.modal_kas_default || 0}
    userName={tenantUser?.nama || user?.nama || 'Kasir'}
    {shiftKeHariIni}
    isLoading={isProcessingShift}
    {kasirMode}
    {isPerUserMode}
    {isMultiMode}
    selectedStationName={stations.find(s => s.id === selectedStationId)?.nama || null}
    on:submit={handleBukaShift}
    on:close={() => { showBukaShiftModal = false; selectedStationId = null; }}
/>

<!-- Tutup Shift Modal -->
<TutupShiftModal 
    bind:open={showTutupShiftModal}
    shiftData={activeShift}
    isLoading={isProcessingShift}
    currentUserId={tenantUser?.id}
    userRole={tenantUser?.role || 'kasir'}
    stationName={selectedStation?.nama || activeShift?.station_nama || null}
    shiftUsers={shiftUsers}
    {kasirMode}
    {isPerUserMode}
    on:submit={handleTutupShift}
    on:leaveShift={handleLeaveShift}
    on:close={() => showTutupShiftModal = false}
/>

<!-- ==========================================
     STATION MODALS (for Single & Multi Mode only)
     ========================================== -->

{#if !isPerUserMode}
    <!-- Join Shift Modal -->
    <JoinShiftModal 
        bind:open={showJoinShiftModal}
        shiftData={selectedShiftForAction}
        isLoading={isProcessingShift}
        on:confirm={confirmJoinShift}
        on:close={() => { showJoinShiftModal = false; selectedShiftForAction = null; }}
    />

    <!-- Take Over Modal -->
    <TakeOverModal 
        bind:open={showTakeOverModal}
        shiftData={selectedShiftForAction}
        currentUserName={tenantUser?.nama || user?.nama || ''}
        isLoading={isProcessingShift}
        on:confirm={confirmTakeOver}
        on:close={() => { showTakeOverModal = false; selectedShiftForAction = null; }}
    />
{/if}

<!-- Force Close Modal (available for all modes, Owner only) -->
<ForceCloseModal 
    bind:open={showForceCloseModal}
    shiftData={selectedShiftForAction}
    isLoading={isProcessingShift}
    on:confirm={confirmForceClose}
    on:close={() => { showForceCloseModal = false; selectedShiftForAction = null; }}
/>