// ============================================
// KASIR TENANT - SERVER (Flexible Shift Mode)
// File: src/routes/(tenant)/tenant/kasir/+page.server.js
// ============================================
// UPDATED - FULL 3 MODE SUPPORT + STOK LOGGING:
// 1. SINGLE MODE - 1 shift untuk seluruh toko
// 2. PER USER MODE - Setiap kasir punya shift sendiri
// 3. MULTI STATION MODE - 1 shift per mesin kasir
// ============================================
// Features:
// - Join Shift (Admin/Owner ikut shift - Single & Multi only)
// - Take Over Shift (Admin/Owner ambil alih - Single & Multi only)
// - Force Close Shift (Owner only)
// - Leave Shift (User yang join keluar dari shift)
// - FIXED: Double transaction bug
// - FIXED: total_penjualan_bersih tidak ter-update
// - NEW: Stok logging untuk audit trail
// ============================================

import { query } from '$lib/db.js';
import { fail } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/auth.js';

// ============================================
// IMPORT STOK LOGGER
// ============================================
import { logStokKeluar, getStokSebelum } from '$lib/utils/stokLogger.js';

// ============================================
// HELPER: Get Pelanggan ID
// ============================================
async function getPelangganId(user) {
    if (!user) return null;
    
    let pelangganId = user.pelanggan_id;
    
    if (!pelangganId) {
        try {
            const result = await query(
                'SELECT id FROM pelanggan WHERE email = ?',
                [user.email]
            );
            if (result.length > 0) {
                pelangganId = result[0].id;
            }
        } catch (e) {
            console.error('Error finding pelanggan:', e);
        }
    }
    
    return pelangganId;
}

// ============================================
// HELPER: Get Tenant User ID from email
// ============================================
async function getTenantUserId(pelangganId, email) {
    try {
        const result = await query(`
            SELECT id FROM tenant_users 
            WHERE pelanggan_id = ? AND email = ? AND deleted_at IS NULL
            LIMIT 1
        `, [pelangganId, email]);
        
        return result[0]?.id || null;
    } catch (err) {
        console.error('Error getting tenant user id:', err);
        return null;
    }
}

// ============================================
// HELPER: Generate Invoice Number
// ============================================
async function generateInvoiceNumber(pelangganId) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const lastInvoice = await query(`
        SELECT no_invoice FROM transaksi
        WHERE pelanggan_id = ? AND tanggal = CURDATE()
        ORDER BY id DESC LIMIT 1
    `, [pelangganId]);
    
    let invoiceNum = 1;
    if (lastInvoice.length > 0) {
        const lastNum = parseInt(lastInvoice[0].no_invoice.split('-').pop()) || 0;
        invoiceNum = lastNum + 1;
    }
    
    return `INV-${dateStr}-${String(invoiceNum).padStart(3, '0')}`;
}

// ============================================
// HELPER: Generate Shift Number
// ============================================
async function generateShiftNumber(pelangganId) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const lastShift = await query(`
        SELECT no_shift FROM shifts
        WHERE pelanggan_id = ? AND tanggal = CURDATE()
        ORDER BY shift_ke DESC LIMIT 1
    `, [pelangganId]);
    
    let shiftNum = 1;
    if (lastShift.length > 0) {
        const lastNum = parseInt(lastShift[0].no_shift.split('-').pop()) || 0;
        shiftNum = lastNum + 1;
    }
    
    return `SFT-${dateStr}-${String(shiftNum).padStart(3, '0')}`;
}

// ============================================
// HELPER: Get Shift Ke Hari Ini
// ============================================
async function getShiftKeHariIni(pelangganId) {
    const result = await query(`
        SELECT COUNT(*) as count FROM shifts
        WHERE pelanggan_id = ? AND tanggal = CURDATE()
    `, [pelangganId]);
    
    return (result[0]?.count || 0) + 1;
}

// ============================================
// HELPER: Check Permission
// ============================================
function canApplyDiscount(user) {
    if (!user) return false;
    if (user.tenant_role === 'kasir') return false;
    return true;
}

function canVoidTransaction(user) {
    if (!user) return false;
    if (user.tenant_role === 'owner') return true;
    return false;
}

// ============================================
// HELPER: Check Role Hierarchy
// ============================================
function getRoleLevel(role) {
    const levels = { 'owner': 3, 'admin': 2, 'kasir': 1 };
    return levels[role] || 0;
}

function canTakeOver(userRole, targetRole) {
    return getRoleLevel(userRole) >= getRoleLevel(targetRole);
}

function canJoinShift(userRole) {
    return userRole === 'owner' || userRole === 'admin';
}

function canForceClose(userRole) {
    return userRole === 'owner';
}

// ============================================
// HELPER: Format Rupiah
// ============================================
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
}

// ============================================
// HELPER: Create Transaction Notification
// ============================================
async function createTransactionNotification(pelangganId, noInvoice, total, metodeBayar, namaCustomer) {
    const metodeLabel = {
        'cash': 'Tunai',
        'qris': 'QRIS',
        'transfer': 'Transfer',
        'debit': 'Debit',
        'kredit': 'Kredit'
    };
    
    const metode = metodeLabel[metodeBayar] || metodeBayar;
    
    const iconMap = {
        'cash': 'Banknote',
        'qris': 'QrCode',
        'transfer': 'Building2',
        'debit': 'CreditCard',
        'kredit': 'CreditCard'
    };
    
    const icon = iconMap[metodeBayar] || 'Banknote';
    const message = `Pembayaran ${metode} Rp ${formatRupiah(total)} telah diterima`;
    
    try {
        await query(`
            INSERT INTO notifications (pelanggan_id, type, title, message, icon, link, data)
            VALUES (?, 'transaction', 'Transaksi Berhasil', ?, ?, ?, ?)
        `, [
            pelangganId,
            message,
            icon,
            `/tenant/transaksi?invoice=${noInvoice}`,
            JSON.stringify({
                invoice: noInvoice,
                amount: total,
                method: metodeBayar,
                customer: namaCustomer || 'Guest'
            })
        ]);
    } catch (err) {
        console.error('Error creating transaction notification:', err);
    }
}

// ============================================
// HELPER: Create Stock Notification
// ============================================
async function createStockNotification(pelangganId, type, varianId, produkId, namaVarian, namaProduk, stokBaru) {
    const STOCK_THRESHOLD = 10;
    
    let title, icon;
    if (stokBaru === 0) {
        title = varianId ? 'Stok Varian Habis!' : 'Stok Habis!';
        icon = 'XCircle';
    } else if (stokBaru <= STOCK_THRESHOLD) {
        title = varianId ? 'Stok Varian Menipis' : 'Stok Menipis';
        icon = 'AlertTriangle';
    } else {
        return;
    }
    
    const itemName = varianId 
        ? `Varian "${namaVarian}" dari "${namaProduk}"`
        : `Produk "${namaProduk}"`;
    
    const message = stokBaru === 0
        ? `${itemName} sudah habis!`
        : `${itemName} tinggal ${stokBaru} item`;
    
    try {
        const existing = await query(`
            SELECT id FROM notifications 
            WHERE pelanggan_id = ? 
            AND type = 'stock'
            AND title = ?
            AND message = ?
            AND created_at > NOW() - INTERVAL 1 MINUTE
            LIMIT 1
        `, [pelangganId, title, message]);
        
        if (existing && existing.length > 0) {
            return;
        }
        
        await query(`
            INSERT INTO notifications (pelanggan_id, type, title, message, icon, link, data)
            VALUES (?, 'stock', ?, ?, ?, '/tenant/produk', ?)
        `, [
            pelangganId,
            title,
            message,
            icon,
            JSON.stringify({
                varian_id: varianId || null,
                produk_id: produkId,
                stok: stokBaru,
                nama_varian: namaVarian || null,
                nama_produk: namaProduk
            })
        ]);
    } catch (err) {
        console.error('Error creating stock notification:', err);
    }
}

// ============================================
// HELPER: Get Tenant Settings
// ============================================
async function getTenantSettings(pelangganId) {
    try {
        const result = await query(`
            SELECT * FROM tenant_settings WHERE pelanggan_id = ?
        `, [pelangganId]);
        
        if (result.length > 0) {
            return result[0];
        }
        
        // Return defaults jika belum ada settings
        return {
            kasir_mode: 'single',
            max_stations: 1,
            allow_join_shift: true,
            allow_take_over: true,
            allow_force_close: true,
            require_modal_awal: true
        };
    } catch (err) {
        console.error('Error getting tenant settings:', err);
        return {
            kasir_mode: 'single',
            max_stations: 1,
            allow_join_shift: true,
            allow_take_over: true,
            allow_force_close: true,
            require_modal_awal: true
        };
    }
}

// ============================================
// HELPER: Get Stations
// ============================================
async function getStations(pelangganId) {
    try {
        const stations = await query(`
            SELECT 
                s.*,
                (SELECT COUNT(*) FROM shifts sh 
                 WHERE sh.station_id = s.id AND sh.status = 'open') as has_active_shift
            FROM stations s
            WHERE s.pelanggan_id = ? AND s.is_active = 1
            ORDER BY s.urutan ASC, s.nama ASC
        `, [pelangganId]);
        
        return stations || [];
    } catch (err) {
        console.error('Error getting stations:', err);
        return [];
    }
}

// ============================================
// HELPER: Get Active Shift (Updated for 3 Modes)
// ============================================
async function getActiveShift(pelangganId, options = {}) {
    const { stationId = null, tenantUserId = null, kasirMode = 'single' } = options;
    
    let sql = `
        SELECT 
            s.*,
            tu.nama as kasir_nama,
            tu.role as kasir_role,
            st.nama as station_nama,
            st.kode as station_kode
        FROM shifts s
        LEFT JOIN tenant_users tu ON s.tenant_user_id = tu.id
        LEFT JOIN stations st ON s.station_id = st.id
        WHERE s.pelanggan_id = ? 
        AND s.status = 'open'
    `;
    
    const params = [pelangganId];
    
    // ============================================
    // MODE-SPECIFIC FILTERING
    // ============================================
    if (kasirMode === 'per_user' && tenantUserId) {
        // Per User Mode: Filter by tenant_user_id
        sql += ` AND s.tenant_user_id = ?`;
        params.push(tenantUserId);
    } else if (kasirMode === 'multi' && stationId) {
        // Multi Station Mode: Filter by station_id
        sql += ` AND s.station_id = ?`;
        params.push(stationId);
    }
    // Single Mode: No additional filter (get any open shift)
    
    sql += ` ORDER BY s.waktu_buka DESC LIMIT 1`;
    
    const result = await query(sql, params);
    return result[0] || null;
}

// ============================================
// HELPER: Get All Active Shifts (for Multi Mode & Overview)
// ============================================
async function getAllActiveShifts(pelangganId) {
    const result = await query(`
        SELECT 
            s.*,
            tu.nama as kasir_nama,
            tu.role as kasir_role,
            st.nama as station_nama,
            st.kode as station_kode
        FROM shifts s
        LEFT JOIN tenant_users tu ON s.tenant_user_id = tu.id
        LEFT JOIN stations st ON s.station_id = st.id
        WHERE s.pelanggan_id = ? 
        AND s.status = 'open'
        ORDER BY s.station_id ASC, s.waktu_buka DESC
    `, [pelangganId]);
    
    return result || [];
}

// ============================================
// HELPER: Get User's Active Shift (for Per User Mode)
// ============================================
async function getUserActiveShift(pelangganId, tenantUserId) {
    const result = await query(`
        SELECT 
            s.*,
            tu.nama as kasir_nama,
            tu.role as kasir_role,
            st.nama as station_nama,
            st.kode as station_kode
        FROM shifts s
        LEFT JOIN tenant_users tu ON s.tenant_user_id = tu.id
        LEFT JOIN stations st ON s.station_id = st.id
        WHERE s.pelanggan_id = ? 
        AND s.tenant_user_id = ?
        AND s.status = 'open'
        ORDER BY s.waktu_buka DESC 
        LIMIT 1
    `, [pelangganId, tenantUserId]);
    
    return result[0] || null;
}

// ============================================
// HELPER: Get Shift Users (who joined)
// ============================================
async function getShiftUsers(shiftId) {
    const result = await query(`
        SELECT 
            su.*,
            su.tenant_user_id as user_id,
            tu.nama,
            tu.role
        FROM shift_users su
        LEFT JOIN tenant_users tu ON su.tenant_user_id = tu.id
        WHERE su.shift_id = ? AND su.left_at IS NULL
        ORDER BY su.joined_at ASC
    `, [shiftId]);
    
    return result || [];
}

// ============================================
// HELPER: Get Last Closed Shift
// ============================================
async function getLastClosedShift(pelangganId, options = {}) {
    const { stationId = null, tenantUserId = null, kasirMode = 'single' } = options;
    
    let sql = `
        SELECT 
            id,
            no_shift,
            tanggal,
            waktu_tutup,
            kas_akhir_aktual as kas_akhir,
            tenant_user_id,
            station_id
        FROM shifts
        WHERE pelanggan_id = ? 
        AND status = 'closed'
    `;
    
    const params = [pelangganId];
    
    // Mode-specific filtering
    if (kasirMode === 'per_user' && tenantUserId) {
        sql += ` AND tenant_user_id = ?`;
        params.push(tenantUserId);
    } else if (kasirMode === 'multi' && stationId) {
        sql += ` AND station_id = ?`;
        params.push(stationId);
    }
    
    sql += ` ORDER BY waktu_tutup DESC LIMIT 1`;
    
    const result = await query(sql, params);
    return result[0] || null;
}

// ============================================
// HELPER: Update Shift Totals After Transaction
// ✅ FIXED v2: Perbaikan perhitungan total_penjualan_bersih
// ============================================
async function updateShiftTotals(shiftId, metodeBayar, total, diskon = 0) {
    const columnMap = {
        'cash': 'penjualan_tunai',
        'qris': 'penjualan_qris',
        'transfer': 'penjualan_transfer',
        'debit': 'penjualan_debit',
        'kredit': 'penjualan_kredit'
    };
    
    const column = columnMap[metodeBayar] || 'penjualan_tunai';
    
    // Step 1: Update penjualan per metode, total_penjualan, transaksi, dan diskon
    await query(`
        UPDATE shifts 
        SET ${column} = ${column} + ?,
            total_penjualan = total_penjualan + ?,
            total_transaksi = total_transaksi + 1,
            total_diskon = total_diskon + ?,
            updated_at = NOW()
        WHERE id = ?
    `, [total, total, diskon, shiftId]);
    
    // Step 2: Update total_penjualan_bersih secara terpisah (dari nilai yang sudah di-update)
    await query(`
        UPDATE shifts 
        SET total_penjualan_bersih = total_penjualan - total_diskon
        WHERE id = ?
    `, [shiftId]);
    
    console.log(`📊 Shift ${shiftId} updated: +1 transaksi, +${formatRupiah(total)} (${metodeBayar}), diskon: ${formatRupiah(diskon)}`);
}

// ============================================
// HELPER: Create Default Station (if none exists)
// ============================================
async function ensureDefaultStation(pelangganId) {
    const existing = await query(`
        SELECT id FROM stations WHERE pelanggan_id = ? LIMIT 1
    `, [pelangganId]);
    
    if (existing.length === 0) {
        const result = await query(`
            INSERT INTO stations (pelanggan_id, kode, nama, deskripsi, is_active, urutan)
            VALUES (?, 'STN-001', 'Kasir Utama', 'Station kasir default', 1, 1)
        `, [pelangganId]);
        
        return result.insertId;
    }
    
    return existing[0].id;
}

// ============================================
// LOAD FUNCTION
// ============================================
export async function load({ parent }) {
    const parentData = await parent();
    const user = parentData?.user;
    const tenantUser = parentData?.tenantUser;
    const settings = parentData?.settings;

    // Default error response
    const errorResponse = {
        produk: [],
        kategori: [],
        merk: [],
        showMerk: false,
        tenantUser: null,
        strukSettings: null,
        tokoInfo: null,
        activeShift: null,
        allActiveShifts: [],
        lastShiftInfo: null,
        shiftSettings: null,
        shiftKeHariIni: 1,
        shiftUsers: [],
        stations: [],
        tenantSettings: null,
        selectedStationId: null,
        kasirMode: 'single',
        isMultiMode: false,
        isPerUserMode: false
    };

    if (!user) {
        return { ...errorResponse, error: 'User tidak valid' };
    }

    const pelangganId = await getPelangganId(user);

    if (!pelangganId) {
        return { ...errorResponse, error: 'Tenant tidak terhubung' };
    }

    try {
        // ============================================
        // LOAD TENANT SETTINGS (untuk mode kasir)
        // ============================================
        const tenantSettings = await getTenantSettings(pelangganId);
        const kasirMode = tenantSettings.kasir_mode || 'single';
        const isMultiMode = kasirMode === 'multi';
        const isPerUserMode = kasirMode === 'per_user';

        // ============================================
        // ENSURE DEFAULT STATION EXISTS
        // ============================================
        await ensureDefaultStation(pelangganId);

        // ============================================
        // LOAD STATIONS (for Multi Mode)
        // ============================================
        const stations = await getStations(pelangganId);

        // ============================================
        // GET TENANT USER ID
        // ============================================
        let tenantUserId = user.tenant_user_id || null;
        if (!tenantUserId && user.email) {
            tenantUserId = await getTenantUserId(pelangganId, user.email);
        }

        // ============================================
        // CHECK MERK SETTING FROM PARENT/LAYOUT
        // ============================================
        const showMerk = settings?.menu_merk === true || settings?.menu_merk === 1;

        // ============================================
        // LOAD KATEGORI AKTIF
        // ============================================
        const kategori = await query(`
            SELECT id, kode_kategori, nama_kategori
            FROM kategori
            WHERE pelanggan_id = ? AND status = 'aktif'
            ORDER BY nama_kategori ASC
        `, [pelangganId]);

        // ============================================
        // LOAD MERK AKTIF
        // ============================================
        let merk = [];
        if (showMerk) {
            merk = await query(`
                SELECT id, kode_merk, nama_merk
                FROM merk
                WHERE pelanggan_id = ? AND status = 'aktif'
                ORDER BY nama_merk ASC
            `, [pelangganId]);
        }

        // ============================================
        // LOAD PRODUK DENGAN INFO VARIAN + MERK
        // ============================================
        const produk = await query(`
            SELECT
                p.id,
                p.kode_produk,
                p.nama_produk,
                p.kategori_id,
                p.merk_id,
                p.harga_beli,
                p.harga_jual,
                p.stok,
                p.satuan,
                p.gambar,
                p.status,
                p.has_variant,
                k.nama_kategori,
                m.nama_merk,
                m.kode_merk,
                (SELECT COUNT(*) FROM produk_varian pv WHERE pv.produk_id = p.id AND pv.status = 'aktif') as variant_count
            FROM produk p
            LEFT JOIN kategori k ON p.kategori_id = k.id
            LEFT JOIN merk m ON p.merk_id = m.id
            WHERE p.pelanggan_id = ? AND p.status = 'aktif'
            ORDER BY p.nama_produk ASC
        `, [pelangganId]);

        // ============================================
        // LOAD VARIAN UNTUK PRODUK YANG PUNYA VARIAN
        // ============================================
        const produkWithVariants = await Promise.all(produk.map(async (p) => {
            if (p.has_variant && p.variant_count > 0) {
                const variants = await query(`
                    SELECT 
                        id,
                        kode_varian,
                        nama_varian,
                        harga_jual,
                        harga_modal,
                        stok,
                        barcode,
                        is_default,
                        status
                    FROM produk_varian
                    WHERE produk_id = ? AND status = 'aktif'
                    ORDER BY is_default DESC, urutan ASC, nama_varian ASC
                `, [p.id]);
                
                return { ...p, variants: variants || [] };
            }
            return { ...p, variants: [] };
        }));

        // ============================================
        // LOAD STRUK SETTINGS
        // ============================================
        const strukResult = await query(`
            SELECT 
                struk_logo, struk_header, struk_footer,
                tampilkan_logo, tampilkan_alamat, tampilkan_telepon, tampilkan_merk_struk,
                ukuran_kertas, auto_print, pajak_persen
            FROM pengaturan 
            WHERE pelanggan_id = ?
        `, [pelangganId]);

        const strukSettings = strukResult[0] || {
            struk_logo: null,
            struk_header: '',
            struk_footer: 'Terima kasih atas kunjungan Anda!',
            tampilkan_logo: true,
            tampilkan_alamat: true,
            tampilkan_telepon: true,
            tampilkan_merk_struk: false,
            ukuran_kertas: '58mm',
            auto_print: false,
            pajak_persen: 0
        };

        // ============================================
        // LOAD TOKO INFO
        // ============================================
        const tokoResult = await query(`
            SELECT nama_bisnis, alamat, no_telepon
            FROM pelanggan WHERE id = ?
        `, [pelangganId]);

        const tokoInfo = tokoResult[0] || {
            nama_bisnis: user.nama_bisnis || 'Toko',
            alamat: '',
            no_telepon: ''
        };

        // ============================================
        // LOAD SHIFT SETTINGS (from pengaturan)
        // ============================================
        const shiftSettingsResult = await query(`
            SELECT 
                wajib_buka_shift, multi_shift, auto_lanjut_kas,
                modal_kas_default, limit_kas_keluar_kasir
            FROM pengaturan 
            WHERE pelanggan_id = ?
        `, [pelangganId]);

        const shiftSettings = shiftSettingsResult[0] || {
            wajib_buka_shift: true,
            multi_shift: false,
            auto_lanjut_kas: false,
            modal_kas_default: 0,
            limit_kas_keluar_kasir: 0
        };

        // ============================================
        // LOAD ACTIVE SHIFTS (MODE-SPECIFIC)
        // ============================================
        let activeShift = null;
        let allActiveShifts = [];

        if (isPerUserMode) {
            // ============================================
            // PER USER MODE: Get shift milik user ini saja
            // ============================================
            if (tenantUserId) {
                activeShift = await getUserActiveShift(pelangganId, tenantUserId);
            }
            // Untuk overview, tetap load semua active shifts
            allActiveShifts = await getAllActiveShifts(pelangganId);
            
        } else if (isMultiMode) {
            // ============================================
            // MULTI STATION MODE: Load all active shifts
            // ============================================
            allActiveShifts = await getAllActiveShifts(pelangganId);
            activeShift = allActiveShifts[0] || null;
            
        } else {
            // ============================================
            // SINGLE MODE: Load single active shift
            // ============================================
            activeShift = await getActiveShift(pelangganId, { kasirMode: 'single' });
            if (activeShift) {
                allActiveShifts = [activeShift];
            }
        }

        // ============================================
        // LOAD SHIFT USERS (jika ada active shift)
        // ============================================
        let shiftUsers = [];
        if (activeShift) {
            shiftUsers = await getShiftUsers(activeShift.id);
            activeShift.users = shiftUsers;
        }

        // ============================================
        // LOAD LAST CLOSED SHIFT (MODE-SPECIFIC)
        // ============================================
        const lastShiftInfo = await getLastClosedShift(pelangganId, {
            kasirMode,
            tenantUserId: isPerUserMode ? tenantUserId : null
        });

        // ============================================
        // GET SHIFT KE HARI INI
        // ============================================
        const shiftKeHariIni = await getShiftKeHariIni(pelangganId);

        // ============================================
        // DETERMINE PERMISSIONS BASED ON MODE
        // ============================================
        const basePermissions = {
            canDiscount: canApplyDiscount(user),
            canVoid: canVoidTransaction(user),
            canForceClose: canForceClose(user.tenant_role)
        };

        // Per User Mode: No join/take over (each user has their own shift)
        const permissions = isPerUserMode ? {
            ...basePermissions,
            canJoinShift: false,
            canTakeOver: false
        } : {
            ...basePermissions,
            canJoinShift: canJoinShift(user.tenant_role) && tenantSettings.allow_join_shift,
            canTakeOver: (user.tenant_role === 'owner' || user.tenant_role === 'admin') && tenantSettings.allow_take_over
        };

        return {
            produk: produkWithVariants || [],
            kategori: kategori || [],
            merk: merk || [],
            showMerk,
            pelangganId,
            tenantUser: tenantUser || null,
            permissions,
            strukSettings,
            tokoInfo,
            // ============================================
            // SHIFT DATA
            // ============================================
            activeShift,
            allActiveShifts,
            lastShiftInfo,
            shiftSettings,
            shiftKeHariIni,
            shiftUsers,
            // ============================================
            // STATION & MODE DATA
            // ============================================
            stations,
            tenantSettings,
            kasirMode,
            isMultiMode,
            isPerUserMode
        };

    } catch (error) {
        console.error('Error loading kasir data:', error);
        return {
            ...errorResponse,
            error: 'Gagal memuat data: ' + error.message
        };
    }
}

// ============================================
// ACTIONS
// ============================================
export const actions = {

    // ----------------------------------------
    // BUKA SHIFT (Updated with 3 Mode Support)
    // ----------------------------------------
    bukaShift: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);

        if (!user) {
            return fail(401, { success: false, message: 'Sesi telah berakhir. Silakan login kembali.' });
        }

        const pelangganId = await getPelangganId(user);

        if (!pelangganId) {
            return fail(400, { success: false, message: 'Tenant tidak valid' });
        }

        try {
            const formData = await request.formData();
            
            const sumberModal = formData.get('sumber_modal') || 'manual';
            const modalAwal = parseFloat(formData.get('modal_awal')) || 0;
            const catatan = formData.get('catatan')?.trim() || null;
            const stationId = parseInt(formData.get('station_id')) || null;

            // ========== GET TENANT SETTINGS ==========
            const tenantSettings = await getTenantSettings(pelangganId);
            const kasirMode = tenantSettings.kasir_mode || 'single';

            // ========== GET TENANT USER ID ==========
            let tenantUserId = user.tenant_user_id || null;
            if (!tenantUserId && user.email) {
                tenantUserId = await getTenantUserId(pelangganId, user.email);
            }
            
            if (!tenantUserId) {
                return fail(400, { 
                    success: false, 
                    message: 'User ID tidak ditemukan. Pastikan user terdaftar di tenant_users.' 
                });
            }

            // ========== MODE-SPECIFIC VALIDATION ==========
            let finalStationId = stationId;
            
            if (kasirMode === 'per_user') {
                // ============================================
                // PER USER MODE
                // - Tidak perlu station
                // - Cek apakah user ini sudah punya shift aktif
                // ============================================
                const existingUserShift = await getUserActiveShift(pelangganId, tenantUserId);
                
                if (existingUserShift) {
                    return fail(400, { 
                        success: false, 
                        message: 'Anda sudah memiliki shift aktif! Tutup shift sebelumnya terlebih dahulu.' 
                    });
                }
                
                // Untuk per_user mode, ambil default station (optional)
                const defaultStation = await query(`
                    SELECT id FROM stations WHERE pelanggan_id = ? AND is_active = 1 ORDER BY urutan LIMIT 1
                `, [pelangganId]);
                finalStationId = defaultStation[0]?.id || null;
                
            } else if (kasirMode === 'multi') {
                // ============================================
                // MULTI STATION MODE
                // - Wajib pilih station
                // - Cek apakah station sudah punya shift aktif
                // ============================================
                if (!stationId) {
                    return fail(400, { 
                        success: false, 
                        message: 'Pilih station terlebih dahulu!' 
                    });
                }
                
                // Cek station exists dan aktif
                const station = await query(`
                    SELECT id FROM stations WHERE id = ? AND pelanggan_id = ? AND is_active = 1
                `, [stationId, pelangganId]);
                
                if (!station || station.length === 0) {
                    return fail(400, { 
                        success: false, 
                        message: 'Station tidak ditemukan atau tidak aktif!' 
                    });
                }
                
                // Cek apakah station sudah punya shift aktif
                const existingShiftOnStation = await getActiveShift(pelangganId, { 
                    stationId, 
                    kasirMode: 'multi' 
                });
                
                if (existingShiftOnStation) {
                    return fail(400, { 
                        success: false, 
                        message: `Station ini sudah memiliki shift aktif oleh ${existingShiftOnStation.kasir_nama}!` 
                    });
                }
                
            } else {
                // ============================================
                // SINGLE MODE
                // - Cek apakah sudah ada shift aktif (tanpa station)
                // ============================================
                const existingShift = await getActiveShift(pelangganId, { kasirMode: 'single' });
                
                if (existingShift) {
                    return fail(400, { 
                        success: false, 
                        message: 'Sudah ada shift yang aktif! Tutup shift sebelumnya terlebih dahulu.',
                        existingShift: {
                            id: existingShift.id,
                            kasir_nama: existingShift.kasir_nama
                        }
                    });
                }
                
                // Untuk single mode, ambil default station
                const defaultStation = await query(`
                    SELECT id FROM stations WHERE pelanggan_id = ? AND is_active = 1 ORDER BY urutan LIMIT 1
                `, [pelangganId]);
                finalStationId = defaultStation[0]?.id || null;
            }

            // ========== VALIDASI: Modal awal ==========
            if (modalAwal < 0) {
                return fail(400, { success: false, message: 'Modal awal tidak boleh negatif!' });
            }

            // ========== GENERATE SHIFT NUMBER ==========
            const noShift = await generateShiftNumber(pelangganId);
            const shiftKe = await getShiftKeHariIni(pelangganId);

            // ========== INSERT SHIFT BARU ==========
            const result = await query(`
                INSERT INTO shifts (
                    pelanggan_id,
                    station_id,
                    tenant_user_id,
                    original_user_id,
                    no_shift,
                    tanggal,
                    shift_ke,
                    waktu_buka,
                    modal_awal,
                    sumber_modal,
                    total_transaksi,
                    total_penjualan,
                    total_diskon,
                    total_penjualan_bersih,
                    penjualan_tunai,
                    penjualan_qris,
                    penjualan_transfer,
                    penjualan_debit,
                    penjualan_kredit,
                    total_kas_masuk,
                    total_kas_keluar,
                    catatan_buka,
                    status,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, CURDATE(), ?, NOW(), ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ?, 'open', NOW())
            `, [
                pelangganId,
                finalStationId,
                tenantUserId,
                tenantUserId,
                noShift,
                shiftKe,
                modalAwal,
                sumberModal,
                catatan
            ]);

            const shiftId = result.insertId;

            // ========== INSERT SHIFT_USERS (owner of shift) ==========
            await query(`
                INSERT INTO shift_users (shift_id, tenant_user_id, role, joined_at)
                VALUES (?, ?, 'owner', NOW())
            `, [shiftId, tenantUserId]);

            console.log(`✅ Shift dibuka: ${noShift} (Mode: ${kasirMode}, Modal: Rp ${formatRupiah(modalAwal)}) by user ${tenantUserId}`);

            // ========== LOAD SHIFT YANG BARU DIBUAT ==========
            const newShift = await query(`
                SELECT s.*, st.nama as station_nama, st.kode as station_kode
                FROM shifts s
                LEFT JOIN stations st ON s.station_id = st.id
                WHERE s.id = ?
            `, [shiftId]);

            return {
                success: true,
                message: 'Shift berhasil dibuka!',
                data: newShift[0]
            };

        } catch (error) {
            console.error('Error opening shift:', error);
            return fail(500, { 
                success: false, 
                message: 'Terjadi kesalahan saat membuka shift: ' + error.message 
            });
        }
    },

    // ----------------------------------------
    // JOIN SHIFT (Single & Multi Mode only)
    // ----------------------------------------
    joinShift: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);

        if (!user) {
            return fail(401, { success: false, message: 'Sesi telah berakhir.' });
        }

        const pelangganId = await getPelangganId(user);

        // Check tenant settings
        const tenantSettings = await getTenantSettings(pelangganId);
        
        // Per User Mode: Join not allowed
        if (tenantSettings.kasir_mode === 'per_user') {
            return fail(400, { 
                success: false, 
                message: 'Join shift tidak tersedia di mode Per Kasir.' 
            });
        }

        // Check permission
        if (!canJoinShift(user.tenant_role)) {
            return fail(403, { success: false, message: 'Anda tidak memiliki izin untuk join shift.' });
        }

        // Check if join is allowed in settings
        if (!tenantSettings.allow_join_shift) {
            return fail(403, { 
                success: false, 
                message: 'Fitur join shift dinonaktifkan oleh admin.' 
            });
        }

        try {
            const formData = await request.formData();
            const shiftId = parseInt(formData.get('shift_id')) || 0;

            // Validasi shift exists dan open
            const shift = await query(`
                SELECT * FROM shifts WHERE id = ? AND pelanggan_id = ? AND status = 'open'
            `, [shiftId, pelangganId]);

            if (!shift || shift.length === 0) {
                return fail(400, { success: false, message: 'Shift tidak ditemukan atau sudah ditutup!' });
            }

            // Get tenant user id
            let tenantUserId = user.tenant_user_id || await getTenantUserId(pelangganId, user.email);

            if (!tenantUserId) {
                return fail(400, { success: false, message: 'User ID tidak ditemukan.' });
            }

            // Cek apakah sudah join
            const alreadyJoined = await query(`
                SELECT id FROM shift_users 
                WHERE shift_id = ? AND tenant_user_id = ? AND left_at IS NULL
            `, [shiftId, tenantUserId]);

            if (alreadyJoined.length > 0) {
                return fail(400, { success: false, message: 'Anda sudah bergabung di shift ini!' });
            }

            // Insert ke shift_users
            await query(`
                INSERT INTO shift_users (shift_id, tenant_user_id, role, joined_at)
                VALUES (?, ?, 'joined', NOW())
            `, [shiftId, tenantUserId]);

            console.log(`✅ User ${tenantUserId} joined shift ${shiftId}`);

            return {
                success: true,
                message: 'Berhasil bergabung ke shift!'
            };

        } catch (error) {
            console.error('Error joining shift:', error);
            return fail(500, { success: false, message: 'Gagal bergabung ke shift: ' + error.message });
        }
    },

    // ----------------------------------------
    // LEAVE SHIFT
    // ----------------------------------------
    leaveShift: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);

        if (!user) {
            return fail(401, { success: false, message: 'Sesi telah berakhir.' });
        }

        const pelangganId = await getPelangganId(user);

        if (!pelangganId) {
            return fail(400, { success: false, message: 'Tenant tidak valid' });
        }

        try {
            const formData = await request.formData();
            const shiftId = parseInt(formData.get('shift_id')) || 0;

            if (!shiftId) {
                return fail(400, { success: false, message: 'Shift ID diperlukan' });
            }

            // Get tenant user id
            let tenantUserId = user.tenant_user_id || await getTenantUserId(pelangganId, user.email);
            const userName = user.nama || user.email || 'User';

            if (!tenantUserId) {
                return fail(400, { success: false, message: 'User ID tidak ditemukan.' });
            }

            // Cek apakah shift ada dan aktif
            const shift = await query(`
                SELECT id, tenant_user_id, status, no_shift
                FROM shifts 
                WHERE id = ? AND pelanggan_id = ? AND status = 'open'
            `, [shiftId, pelangganId]);

            if (!shift || shift.length === 0) {
                return fail(404, { success: false, message: 'Shift tidak ditemukan atau sudah ditutup' });
            }

            const currentShift = shift[0];

            // Cek apakah user adalah pemilik shift
            if (currentShift.tenant_user_id === tenantUserId) {
                return fail(400, { 
                    success: false, 
                    message: 'Anda adalah pemilik shift. Gunakan "Tutup Shift" untuk menutup shift ini.' 
                });
            }

            // Cek apakah user memang join di shift ini
            const shiftUser = await query(`
                SELECT id, role FROM shift_users 
                WHERE shift_id = ? AND tenant_user_id = ? AND left_at IS NULL
            `, [shiftId, tenantUserId]);

            if (!shiftUser || shiftUser.length === 0) {
                return fail(400, { success: false, message: 'Anda tidak tergabung dalam shift ini' });
            }

            // Update shift_users - set left_at
            await query(`
                UPDATE shift_users 
                SET left_at = NOW() 
                WHERE shift_id = ? AND tenant_user_id = ? AND left_at IS NULL
            `, [shiftId, tenantUserId]);

            console.log(`✅ User ${userName} (ID: ${tenantUserId}) left shift ${currentShift.no_shift}`);

            return { 
                success: true, 
                message: 'Berhasil keluar dari shift' 
            };

        } catch (error) {
            console.error('Leave shift error:', error);
            return fail(500, { success: false, message: 'Gagal keluar dari shift: ' + error.message });
        }
    },

    // ----------------------------------------
    // TAKE OVER SHIFT (Single & Multi Mode only)
    // ----------------------------------------
    takeOverShift: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);

        if (!user) {
            return fail(401, { success: false, message: 'Sesi telah berakhir.' });
        }

        const pelangganId = await getPelangganId(user);

        // Check tenant settings
        const tenantSettings = await getTenantSettings(pelangganId);
        
        // Per User Mode: Take over not allowed
        if (tenantSettings.kasir_mode === 'per_user') {
            return fail(400, { 
                success: false, 
                message: 'Take over shift tidak tersedia di mode Per Kasir.' 
            });
        }

        // Check if take over is allowed in settings
        if (!tenantSettings.allow_take_over) {
            return fail(403, { 
                success: false, 
                message: 'Fitur take over shift dinonaktifkan oleh admin.' 
            });
        }

        try {
            const formData = await request.formData();
            const shiftId = parseInt(formData.get('shift_id')) || 0;
            const catatan = formData.get('catatan')?.trim() || null;

            // Validasi shift exists dan open
            const shift = await query(`
                SELECT s.*, tu.role as kasir_role 
                FROM shifts s
                LEFT JOIN tenant_users tu ON s.tenant_user_id = tu.id
                WHERE s.id = ? AND s.pelanggan_id = ? AND s.status = 'open'
            `, [shiftId, pelangganId]);

            if (!shift || shift.length === 0) {
                return fail(400, { success: false, message: 'Shift tidak ditemukan atau sudah ditutup!' });
            }

            const currentShift = shift[0];

            // Check permission: hanya bisa take over jika role lebih tinggi atau sama
            if (!canTakeOver(user.tenant_role, currentShift.kasir_role)) {
                return fail(403, { 
                    success: false, 
                    message: 'Anda tidak memiliki izin untuk mengambil alih shift ini.' 
                });
            }

            // Get tenant user id
            let tenantUserId = user.tenant_user_id || await getTenantUserId(pelangganId, user.email);

            if (!tenantUserId) {
                return fail(400, { success: false, message: 'User ID tidak ditemukan.' });
            }

            // Jangan take over shift sendiri
            if (currentShift.tenant_user_id === tenantUserId) {
                return fail(400, { success: false, message: 'Anda tidak bisa mengambil alih shift Anda sendiri!' });
            }

            // Update shift owner
            await query(`
                UPDATE shifts SET 
                    tenant_user_id = ?,
                    taken_over_at = NOW(),
                    taken_over_by = ?,
                    updated_at = NOW()
                WHERE id = ?
            `, [tenantUserId, tenantUserId, shiftId]);

            // Update shift_users - set old owner as left
            await query(`
                UPDATE shift_users SET left_at = NOW() 
                WHERE shift_id = ? AND tenant_user_id = ? AND role = 'owner'
            `, [shiftId, currentShift.tenant_user_id]);

            // Insert new owner
            await query(`
                INSERT INTO shift_users (shift_id, tenant_user_id, role, joined_at)
                VALUES (?, ?, 'taken_over', NOW())
            `, [shiftId, tenantUserId]);

            console.log(`✅ Shift ${shiftId} taken over by user ${tenantUserId} from user ${currentShift.tenant_user_id}`);

            return {
                success: true,
                message: 'Shift berhasil diambil alih!'
            };

        } catch (error) {
            console.error('Error taking over shift:', error);
            return fail(500, { success: false, message: 'Gagal mengambil alih shift: ' + error.message });
        }
    },

    // ----------------------------------------
    // FORCE CLOSE SHIFT (Owner only)
    // ----------------------------------------
    forceCloseShift: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);

        if (!user) {
            return fail(401, { success: false, message: 'Sesi telah berakhir.' });
        }

        // Only owner can force close
        if (!canForceClose(user.tenant_role)) {
            return fail(403, { success: false, message: 'Hanya Owner yang dapat menutup paksa shift!' });
        }

        const pelangganId = await getPelangganId(user);

        // Check tenant settings
        const tenantSettings = await getTenantSettings(pelangganId);
        
        if (!tenantSettings.allow_force_close) {
            return fail(403, { 
                success: false, 
                message: 'Fitur force close shift dinonaktifkan.' 
            });
        }

        try {
            const formData = await request.formData();
            const shiftId = parseInt(formData.get('shift_id')) || 0;
            const catatan = formData.get('catatan')?.trim() || 'Ditutup paksa oleh Owner';

            // Validasi shift exists dan open
            const shift = await query(`
                SELECT * FROM shifts WHERE id = ? AND pelanggan_id = ? AND status = 'open'
            `, [shiftId, pelangganId]);

            if (!shift || shift.length === 0) {
                return fail(400, { success: false, message: 'Shift tidak ditemukan atau sudah ditutup!' });
            }

            // Get tenant user id
            let tenantUserId = user.tenant_user_id || await getTenantUserId(pelangganId, user.email);

            // Force close - set kas_akhir_sistem sama dengan perhitungan
            await query(`
                UPDATE shifts SET
                    waktu_tutup = NOW(),
                    kas_akhir_sistem = modal_awal + penjualan_tunai + total_kas_masuk - total_kas_keluar,
                    kas_akhir_aktual = modal_awal + penjualan_tunai + total_kas_masuk - total_kas_keluar,
                    selisih_kas = 0,
                    status_selisih = 'seimbang',
                    catatan_tutup = ?,
                    status = 'closed',
                    closed_by = ?,
                    updated_at = NOW()
                WHERE id = ?
            `, [`[FORCE CLOSED] ${catatan}`, tenantUserId, shiftId]);

            // Update all shift_users as left
            await query(`
                UPDATE shift_users SET left_at = NOW() 
                WHERE shift_id = ? AND left_at IS NULL
            `, [shiftId]);

            console.log(`⚠️ Shift ${shiftId} FORCE CLOSED by owner ${tenantUserId}`);

            return {
                success: true,
                message: 'Shift berhasil ditutup paksa!'
            };

        } catch (error) {
            console.error('Error force closing shift:', error);
            return fail(500, { success: false, message: 'Gagal menutup paksa shift: ' + error.message });
        }
    },

    // ----------------------------------------
    // TUTUP SHIFT
    // ----------------------------------------
    tutupShift: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);

        if (!user) {
            return fail(401, { success: false, message: 'Sesi telah berakhir. Silakan login kembali.' });
        }

        const pelangganId = await getPelangganId(user);

        if (!pelangganId) {
            return fail(400, { success: false, message: 'Tenant tidak valid' });
        }

        try {
            const formData = await request.formData();
            
            const shiftId = parseInt(formData.get('shift_id')) || 0;
            const kasAkhirAktual = parseFloat(formData.get('kas_akhir_aktual')) || 0;
            const catatan = formData.get('catatan')?.trim() || null;

            // Validasi shift exists dan aktif
            const shift = await query(`
                SELECT * FROM shifts WHERE id = ? AND pelanggan_id = ? AND status = 'open'
            `, [shiftId, pelangganId]);

            if (!shift || shift.length === 0) {
                return fail(400, { success: false, message: 'Shift tidak ditemukan atau sudah ditutup!' });
            }

            // Get tenant user id for closed_by
            let tenantUserId = user.tenant_user_id || await getTenantUserId(pelangganId, user.email);

            // Update shift dengan perhitungan langsung di SQL
            await query(`
                UPDATE shifts SET
                    waktu_tutup = NOW(),
                    kas_akhir_sistem = modal_awal + penjualan_tunai + total_kas_masuk - total_kas_keluar,
                    kas_akhir_aktual = ?,
                    selisih_kas = ? - (modal_awal + penjualan_tunai + total_kas_masuk - total_kas_keluar),
                    status_selisih = CASE
                        WHEN ? - (modal_awal + penjualan_tunai + total_kas_masuk - total_kas_keluar) > 0 THEN 'lebih'
                        WHEN ? - (modal_awal + penjualan_tunai + total_kas_masuk - total_kas_keluar) < 0 THEN 'kurang'
                        ELSE 'seimbang'
                    END,
                    catatan_tutup = ?,
                    status = 'closed',
                    closed_by = ?,
                    updated_at = NOW()
                WHERE id = ?
            `, [
                kasAkhirAktual,
                kasAkhirAktual,
                kasAkhirAktual,
                kasAkhirAktual,
                catatan,
                tenantUserId,
                shiftId
            ]);

            // Update all shift_users as left
            await query(`
                UPDATE shift_users SET left_at = NOW() 
                WHERE shift_id = ? AND left_at IS NULL
            `, [shiftId]);

            console.log(`✅ Shift ditutup: ${shift[0].no_shift}`);

            const closedShift = await query(`SELECT * FROM shifts WHERE id = ?`, [shiftId]);

            return {
                success: true,
                message: 'Shift berhasil ditutup!',
                data: closedShift[0]
            };

        } catch (error) {
            console.error('Error closing shift:', error);
            return fail(500, { success: false, message: 'Terjadi kesalahan saat menutup shift: ' + error.message });
        }
    },

    // ----------------------------------------
    // SIMPAN TRANSAKSI (Updated with STOK LOGGING)
    // ----------------------------------------
    simpanTransaksi: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);

        if (!user) {
            return fail(401, { success: false, message: 'Sesi telah berakhir. Silakan login kembali.' });
        }

        const pelangganId = await getPelangganId(user);

        if (!pelangganId) {
            return fail(400, { success: false, message: 'Tenant tidak valid' });
        }

        try {
            // CEK SHIFT SETTINGS
            const settingsResult = await query(`
                SELECT wajib_buka_shift FROM pengaturan WHERE pelanggan_id = ?
            `, [pelangganId]);
            
            const wajibBukaShift = settingsResult[0]?.wajib_buka_shift ?? true;

            // GET TENANT SETTINGS (untuk mode)
            const tenantSettings = await getTenantSettings(pelangganId);
            const kasirMode = tenantSettings.kasir_mode || 'single';

            // GET TENANT USER ID
            let tenantUserId = user.tenant_user_id || await getTenantUserId(pelangganId, user.email);

            // CEK ACTIVE SHIFT (MODE-SPECIFIC)
            let activeShift = null;
            
            if (wajibBukaShift) {
                if (kasirMode === 'per_user') {
                    // Per User Mode: Get shift milik user ini
                    activeShift = await getUserActiveShift(pelangganId, tenantUserId);
                } else {
                    // Single/Multi Mode: Get any active shift
                    activeShift = await getActiveShift(pelangganId, { kasirMode });
                }
                
                if (!activeShift) {
                    return fail(400, { 
                        success: false, 
                        message: 'Anda harus membuka shift terlebih dahulu sebelum melakukan transaksi!',
                        requireShift: true
                    });
                }
            } else {
                // Tidak wajib shift, tapi coba ambil jika ada
                if (kasirMode === 'per_user') {
                    activeShift = await getUserActiveShift(pelangganId, tenantUserId);
                } else {
                    activeShift = await getActiveShift(pelangganId, { kasirMode });
                }
            }

            const formData = await request.formData();

            // PARSE FORM DATA
            const cartData = formData.get('cart');
            let cart = [];
            
            try {
                cart = JSON.parse(cartData);
            } catch (e) {
                return fail(400, { success: false, message: 'Data keranjang tidak valid' });
            }

            if (!cart || cart.length === 0) {
                return fail(400, { success: false, message: 'Keranjang belanja kosong!' });
            }

            const subtotal = parseFloat(formData.get('subtotal')) || 0;
            let diskon = parseFloat(formData.get('diskon')) || 0;
            const pajak = parseFloat(formData.get('pajak')) || 0;
            const total = parseFloat(formData.get('total')) || 0;
            const bayar = parseFloat(formData.get('bayar')) || 0;
            const kembalian = parseFloat(formData.get('kembalian')) || 0;
            const metodeBayar = formData.get('metode_bayar') || 'cash';
            const namaCustomer = formData.get('nama_customer')?.trim() || null;
            const catatan = formData.get('catatan')?.trim() || null;

            // PERMISSION CHECK: DISKON
            if (!canApplyDiscount(user) && diskon > 0) {
                diskon = 0;
            }

            const finalTotal = subtotal - diskon + pajak;

            // VALIDASI
            if (bayar < finalTotal) {
                return fail(400, { 
                    success: false, 
                    message: `Pembayaran kurang! Total: Rp ${finalTotal.toLocaleString('id-ID')}, Bayar: Rp ${bayar.toLocaleString('id-ID')}` 
                });
            }

            // CEK STOK
            for (const item of cart) {
                if (item.varian_id) {
                    const stokResult = await query(
                        `SELECT pv.id, pv.nama_varian, pv.stok, p.nama_produk 
                         FROM produk_varian pv 
                         JOIN produk p ON pv.produk_id = p.id
                         WHERE pv.id = ? AND p.pelanggan_id = ?`,
                        [item.varian_id, pelangganId]
                    );

                    if (!stokResult || stokResult.length === 0) {
                        return fail(400, { success: false, message: `Varian "${item.nama_varian}" tidak ditemukan` });
                    }

                    if (stokResult[0].stok < item.qty) {
                        return fail(400, { 
                            success: false, 
                            message: `Stok "${stokResult[0].nama_produk} - ${item.nama_varian}" tidak mencukupi!` 
                        });
                    }
                } else {
                    const stokResult = await query(
                        'SELECT id, nama_produk, stok FROM produk WHERE id = ? AND pelanggan_id = ?',
                        [item.id, pelangganId]
                    );

                    if (!stokResult || stokResult.length === 0) {
                        return fail(400, { success: false, message: `Produk "${item.nama_produk}" tidak ditemukan` });
                    }

                    if (stokResult[0].stok < item.qty) {
                        return fail(400, { 
                            success: false, 
                            message: `Stok "${item.nama_produk}" tidak mencukupi!` 
                        });
                    }
                }
            }

            // GENERATE INVOICE
            const noInvoice = await generateInvoiceNumber(pelangganId);
            const today = new Date();
            const timeStr = today.toTimeString().slice(0, 8);

            // GET USER ID
            let kasirUserId = null;
            const kasirNama = user.nama || user.email;
            
            if (user.login_type === 'tenant_users' || user.tenant_user_id) {
                const userRecord = await query(
                    'SELECT id FROM users WHERE pelanggan_id = ? LIMIT 1',
                    [pelangganId]
                );
                if (userRecord.length > 0) {
                    kasirUserId = userRecord[0].id;
                }
            } else {
                kasirUserId = user.id;
            }

            // INSERT TRANSAKSI
            const transaksiResult = await query(`
                INSERT INTO transaksi (
                    pelanggan_id, shift_id, no_invoice, tanggal, waktu,
                    subtotal, diskon, pajak, total, bayar, kembalian,
                    metode_bayar, user_id, tenant_user_id, kasir_nama,
                    nama_customer, catatan, status
                ) VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success')
            `, [
                pelangganId,
                activeShift?.id || null,
                noInvoice,
                timeStr,
                subtotal,
                diskon,
                pajak,
                finalTotal,
                bayar,
                Math.max(0, bayar - finalTotal),
                metodeBayar,
                kasirUserId,
                tenantUserId,
                kasirNama,
                namaCustomer,
                catatan
            ]);

            const transaksiId = transaksiResult.insertId;

            // ✅ FIXED: UPDATE SHIFT TOTALS (termasuk total_penjualan_bersih)
            if (activeShift) {
                await updateShiftTotals(activeShift.id, metodeBayar, finalTotal, diskon);
            }

            // ============================================
            // INSERT DETAIL & UPDATE STOK + LOGGING
            // ============================================
            const stockUpdates = [];
            let totalQty = 0;
            
            for (const item of cart) {
                const itemSubtotal = item.harga_jual * item.qty;
                totalQty += item.qty;

                await query(`
                    INSERT INTO transaksi_detail (
                        transaksi_id, produk_id, varian_id, kode_produk, kode_varian,
                        nama_produk, nama_varian, qty, harga, subtotal
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    transaksiId,
                    item.id,
                    item.varian_id || null,
                    item.kode_produk || '',
                    item.kode_varian || null,
                    item.nama_produk,
                    item.nama_varian || null,
                    item.qty,
                    item.harga_jual,
                    itemSubtotal
                ]);

                // ============================================
                // UPDATE STOK + LOG KE stok_log
                // ============================================
                if (item.varian_id) {
                    // ========== VARIAN ==========
                    // 1. Ambil stok sebelum
                    const stokSebelum = await getStokSebelum(item.id, item.varian_id);
                    
                    // 2. Update stok varian
                    await query(
                        'UPDATE produk_varian SET stok = stok - ? WHERE id = ?',
                        [item.qty, item.varian_id]
                    );
                    
                    // 3. Ambil stok sesudah
                    const newStockResult = await query(
                        'SELECT stok FROM produk_varian WHERE id = ?',
                        [item.varian_id]
                    );
                    const stokSesudah = newStockResult[0]?.stok || 0;
                    
                    // 4. LOG STOK KELUAR
                    await logStokKeluar({
                        pelangganId,
                        produkId: item.id,
                        varianId: item.varian_id,
                        tenantUserId,
                        qtyKeluar: item.qty,
                        qtySebelum: stokSebelum,
                        transaksiId,
                        catatan: `Penjualan ${noInvoice} - ${item.nama_produk} (${item.nama_varian})`
                    });
                    
                    // 5. Track untuk notifikasi
                    stockUpdates.push({
                        type: 'varian',
                        varianId: item.varian_id,
                        produkId: item.id,
                        namaVarian: item.nama_varian,
                        namaProduk: item.nama_produk,
                        stokBaru: stokSesudah
                    });
                    
                    // 6. Update total stok produk induk
                    await query(`
                        UPDATE produk SET stok = (
                            SELECT COALESCE(SUM(stok), 0) 
                            FROM produk_varian 
                            WHERE produk_id = ? AND status = 'aktif'
                        ) WHERE id = ? AND has_variant = 1
                    `, [item.id, item.id]);
                    
                } else {
                    // ========== PRODUK TANPA VARIAN ==========
                    // 1. Ambil stok sebelum
                    const stokSebelum = await getStokSebelum(item.id, null);
                    
                    // 2. Update stok produk
                    await query(
                        'UPDATE produk SET stok = stok - ? WHERE id = ? AND pelanggan_id = ?',
                        [item.qty, item.id, pelangganId]
                    );
                    
                    // 3. Ambil stok sesudah
                    const newStockResult = await query(
                        'SELECT stok FROM produk WHERE id = ?',
                        [item.id]
                    );
                    const stokSesudah = newStockResult[0]?.stok || 0;
                    
                    // 4. LOG STOK KELUAR
                    await logStokKeluar({
                        pelangganId,
                        produkId: item.id,
                        varianId: null,
                        tenantUserId,
                        qtyKeluar: item.qty,
                        qtySebelum: stokSebelum,
                        transaksiId,
                        catatan: `Penjualan ${noInvoice} - ${item.nama_produk}`
                    });
                    
                    // 5. Track untuk notifikasi
                    stockUpdates.push({
                        type: 'produk',
                        varianId: null,
                        produkId: item.id,
                        namaVarian: null,
                        namaProduk: item.nama_produk,
                        stokBaru: stokSesudah
                    });
                }
            }

            // CREATE NOTIFICATIONS
            try {
                await createTransactionNotification(pelangganId, noInvoice, finalTotal, metodeBayar, namaCustomer);
            } catch (notifError) {
                console.error('Error creating transaction notification:', notifError);
            }

            for (const update of stockUpdates) {
                try {
                    await createStockNotification(
                        pelangganId, update.type, update.varianId, update.produkId,
                        update.namaVarian, update.namaProduk, update.stokBaru
                    );
                } catch (notifError) {
                    console.error('Error creating stock notification:', notifError);
                }
            }

            console.log(`✅ Transaksi ${noInvoice} berhasil disimpan dengan ${cart.length} item, stok log tercatat`);

            // RETURN SUCCESS
            return {
                success: true,
                message: 'Transaksi berhasil disimpan!',
                data: {
                    id: transaksiId,
                    no_invoice: noInvoice,
                    shift_id: activeShift?.id || null,
                    tanggal: today.toISOString().slice(0, 10),
                    waktu: timeStr,
                    items: cart.map(item => ({
                        id: item.id,
                        nama_produk: item.nama_produk,
                        nama_varian: item.nama_varian || null,
                        nama_merk: item.nama_merk || null,
                        qty: item.qty,
                        harga_jual: item.harga_jual,
                        subtotal: item.harga_jual * item.qty
                    })),
                    subtotal,
                    diskon,
                    pajak,
                    total: finalTotal,
                    bayar,
                    kembalian: Math.max(0, bayar - finalTotal),
                    metode_bayar: metodeBayar,
                    nama_customer: namaCustomer,
                    total_qty: totalQty,
                    kasir: kasirNama,
                    toko: user.nama_bisnis || 'Toko'
                }
            };

        } catch (error) {
            console.error('Error saving transaction:', error);
            return fail(500, { 
                success: false, 
                message: 'Terjadi kesalahan saat menyimpan transaksi. Silakan coba lagi.' 
            });
        }
    },

    // ----------------------------------------
    // GET PRODUCT BY BARCODE
    // ----------------------------------------
    getProductByBarcode: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);

        if (!user) {
            return fail(401, { success: false, message: 'Unauthorized' });
        }

        const pelangganId = await getPelangganId(user);

        try {
            const formData = await request.formData();
            const barcode = formData.get('barcode')?.trim();

            if (!barcode) {
                return fail(400, { success: false, message: 'Barcode tidak valid' });
            }

            // Cek di varian dulu
            const variantResult = await query(`
                SELECT
                    pv.id as varian_id, pv.kode_varian, pv.nama_varian,
                    pv.harga_jual, pv.stok, pv.barcode,
                    p.id as produk_id, p.kode_produk, p.nama_produk,
                    p.gambar, p.satuan, p.merk_id, m.nama_merk
                FROM produk_varian pv
                JOIN produk p ON pv.produk_id = p.id
                LEFT JOIN merk m ON p.merk_id = m.id
                WHERE p.pelanggan_id = ? 
                    AND (pv.barcode = ? OR pv.kode_varian = ?)
                    AND pv.status = 'aktif' AND p.status = 'aktif'
                LIMIT 1
            `, [pelangganId, barcode, barcode]);

            if (variantResult && variantResult.length > 0) {
                const v = variantResult[0];
                return {
                    success: true,
                    product: {
                        id: v.produk_id,
                        varian_id: v.varian_id,
                        kode_produk: v.kode_produk,
                        kode_varian: v.kode_varian,
                        nama_produk: v.nama_produk,
                        nama_varian: v.nama_varian,
                        harga_jual: v.harga_jual,
                        stok: v.stok,
                        satuan: v.satuan,
                        gambar: v.gambar,
                        merk_id: v.merk_id,
                        nama_merk: v.nama_merk,
                        has_variant: true
                    }
                };
            }

            // Cek di produk
            const product = await query(`
                SELECT
                    p.id, p.kode_produk, p.nama_produk, p.harga_jual, p.stok, 
                    p.satuan, p.gambar, p.has_variant, p.merk_id, m.nama_merk
                FROM produk p
                LEFT JOIN merk m ON p.merk_id = m.id
                WHERE p.pelanggan_id = ? 
                    AND (p.kode_produk = ? OR p.barcode = ? OR p.id = ?)
                    AND p.status = 'aktif'
                LIMIT 1
            `, [pelangganId, barcode, barcode, barcode]);

            if (!product || product.length === 0) {
                return fail(404, { success: false, message: 'Produk tidak ditemukan' });
            }

            const p = product[0];

            if (p.has_variant) {
                const variants = await query(`
                    SELECT id, kode_varian, nama_varian, harga_jual, stok, is_default
                    FROM produk_varian
                    WHERE produk_id = ? AND status = 'aktif'
                    ORDER BY is_default DESC, urutan ASC
                `, [p.id]);

                return {
                    success: true,
                    product: { ...p, variants: variants || [] },
                    needVariantSelection: true
                };
            }

            return { success: true, product: p };

        } catch (error) {
            console.error('Error getting product:', error);
            return fail(500, { success: false, message: 'Gagal mencari produk' });
        }
    }
};