/**
 * ============================================
 * STOK LOGGER - Helper Function
 * File: src/lib/utils/stokLogger.js
 * ============================================
 * 
 * Fungsi untuk mencatat semua perubahan stok ke tabel stok_log
 * Digunakan di:
 * - Transaksi penjualan (kasir) → tipe: 'keluar'
 * - Produk baru dibuat → tipe: 'masuk'
 * - Penyesuaian/adjust stok → tipe: 'penyesuaian'
 * - Retur/pembatalan → tipe: 'retur'
 * 
 * ============================================
 */

import { query } from '$lib/db.js';

/**
 * Tipe perubahan stok yang valid
 */
export const STOK_TIPE = {
    MASUK: 'masuk',
    KELUAR: 'keluar',
    PENYESUAIAN: 'penyesuaian',
    RETUR: 'retur'
};

/**
 * Referensi tipe untuk tracking asal perubahan stok
 */
export const REFERENSI_TIPE = {
    TRANSAKSI: 'transaksi',
    PRODUK_BARU: 'produk_baru',
    ADJUST_MANUAL: 'adjust_manual',
    STOK_OPNAME: 'stok_opname',
    RETUR_PENJUALAN: 'retur_penjualan',
    RETUR_PEMBELIAN: 'retur_pembelian',
    TRANSFER_STOK: 'transfer_stok',
    RUSAK_HILANG: 'rusak_hilang'
};

/**
 * ============================================
 * MAIN FUNCTION: logStok
 * ============================================
 * Mencatat perubahan stok ke tabel stok_log
 * 
 * @param {Object} params - Parameter logging
 * @param {number} params.pelangganId - ID tenant/pelanggan
 * @param {number} params.produkId - ID produk
 * @param {number|null} params.varianId - ID varian (null jika bukan varian)
 * @param {number|null} params.tenantUserId - ID user yang melakukan perubahan
 * @param {string} params.tipe - Tipe perubahan: 'masuk' | 'keluar' | 'penyesuaian' | 'retur'
 * @param {number} params.qtySebelum - Jumlah stok sebelum perubahan
 * @param {number} params.qtyPerubahan - Jumlah perubahan (positif untuk masuk, negatif untuk keluar)
 * @param {number} params.qtySesudah - Jumlah stok setelah perubahan
 * @param {string|null} params.referensiTipe - Tipe referensi: 'transaksi', 'produk_baru', 'adjust_manual', dll
 * @param {number|null} params.referensiId - ID referensi (misal: transaksi_id)
 * @param {string|null} params.catatan - Catatan tambahan
 * 
 * @returns {Promise<{success: boolean, logId?: number, error?: string}>}
 */
export async function logStok({
    pelangganId,
    produkId,
    varianId = null,
    tenantUserId = null,
    tipe,
    qtySebelum,
    qtyPerubahan,
    qtySesudah,
    referensiTipe = null,
    referensiId = null,
    catatan = null
}) {
    // Validasi parameter wajib
    if (!pelangganId || !produkId || !tipe) {
        console.error('❌ logStok: Parameter wajib tidak lengkap', { pelangganId, produkId, tipe });
        return { success: false, error: 'Parameter wajib tidak lengkap' };
    }

    // Validasi tipe
    const validTipe = ['masuk', 'keluar', 'penyesuaian', 'retur'];
    if (!validTipe.includes(tipe)) {
        console.error('❌ logStok: Tipe tidak valid', { tipe });
        return { success: false, error: `Tipe tidak valid. Gunakan: ${validTipe.join(', ')}` };
    }

    try {
        const result = await query(`
            INSERT INTO stok_log (
                produk_id,
                varian_id,
                pelanggan_id,
                tipe,
                qty_sebelum,
                qty_perubahan,
                qty_sesudah,
                referensi_tipe,
                referensi_id,
                catatan,
                user_id,
                tenant_user_id,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            produkId,
            varianId,
            pelangganId,
            tipe,
            qtySebelum,
            qtyPerubahan,
            qtySesudah,
            referensiTipe,
            referensiId,
            catatan,
            null,  // user_id (legacy, bisa diisi jika perlu)
            tenantUserId
        ]);

        console.log(`📦 Stok Log: ${tipe.toUpperCase()} | Produk: ${produkId} | Varian: ${varianId || '-'} | ${qtySebelum} → ${qtySesudah} (${qtyPerubahan >= 0 ? '+' : ''}${qtyPerubahan})`);

        return { 
            success: true, 
            logId: result.insertId 
        };

    } catch (error) {
        console.error('❌ Error logging stok:', error.message);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

/**
 * ============================================
 * HELPER: logStokKeluar
 * ============================================
 * Shortcut untuk mencatat stok keluar (penjualan)
 * 
 * @param {Object} params
 * @param {number} params.pelangganId
 * @param {number} params.produkId
 * @param {number|null} params.varianId
 * @param {number|null} params.tenantUserId
 * @param {number} params.qtyKeluar - Jumlah yang keluar (positif)
 * @param {number} params.qtySebelum - Stok sebelum keluar
 * @param {number} params.transaksiId - ID transaksi penjualan
 * @param {string|null} params.catatan
 */
export async function logStokKeluar({
    pelangganId,
    produkId,
    varianId = null,
    tenantUserId = null,
    qtyKeluar,
    qtySebelum,
    transaksiId,
    catatan = null
}) {
    const qtySesudah = qtySebelum - qtyKeluar;
    
    return logStok({
        pelangganId,
        produkId,
        varianId,
        tenantUserId,
        tipe: STOK_TIPE.KELUAR,
        qtySebelum,
        qtyPerubahan: -qtyKeluar,  // Negatif karena keluar
        qtySesudah,
        referensiTipe: REFERENSI_TIPE.TRANSAKSI,
        referensiId: transaksiId,
        catatan: catatan || `Penjualan - Invoice terkait`
    });
}

/**
 * ============================================
 * HELPER: logStokMasuk
 * ============================================
 * Shortcut untuk mencatat stok masuk (pembelian/produk baru)
 * 
 * @param {Object} params
 * @param {number} params.pelangganId
 * @param {number} params.produkId
 * @param {number|null} params.varianId
 * @param {number|null} params.tenantUserId
 * @param {number} params.qtyMasuk - Jumlah yang masuk (positif)
 * @param {number} params.qtySebelum - Stok sebelum masuk (0 jika produk baru)
 * @param {string} params.referensiTipe - 'produk_baru', 'pembelian', dll
 * @param {number|null} params.referensiId
 * @param {string|null} params.catatan
 */
export async function logStokMasuk({
    pelangganId,
    produkId,
    varianId = null,
    tenantUserId = null,
    qtyMasuk,
    qtySebelum = 0,
    referensiTipe = REFERENSI_TIPE.PRODUK_BARU,
    referensiId = null,
    catatan = null
}) {
    const qtySesudah = qtySebelum + qtyMasuk;
    
    return logStok({
        pelangganId,
        produkId,
        varianId,
        tenantUserId,
        tipe: STOK_TIPE.MASUK,
        qtySebelum,
        qtyPerubahan: qtyMasuk,  // Positif karena masuk
        qtySesudah,
        referensiTipe,
        referensiId,
        catatan: catatan || `Stok masuk - ${referensiTipe}`
    });
}

/**
 * ============================================
 * HELPER: logStokPenyesuaian
 * ============================================
 * Shortcut untuk mencatat penyesuaian stok (adjust manual/opname)
 * 
 * @param {Object} params
 * @param {number} params.pelangganId
 * @param {number} params.produkId
 * @param {number|null} params.varianId
 * @param {number|null} params.tenantUserId
 * @param {number} params.qtySebelum - Stok sebelum adjust
 * @param {number} params.qtySesudah - Stok setelah adjust (nilai baru)
 * @param {string} params.referensiTipe - 'adjust_manual', 'stok_opname', 'rusak_hilang'
 * @param {number|null} params.referensiId
 * @param {string|null} params.catatan - WAJIB untuk audit trail
 */
export async function logStokPenyesuaian({
    pelangganId,
    produkId,
    varianId = null,
    tenantUserId = null,
    qtySebelum,
    qtySesudah,
    referensiTipe = REFERENSI_TIPE.ADJUST_MANUAL,
    referensiId = null,
    catatan = null
}) {
    const qtyPerubahan = qtySesudah - qtySebelum;
    
    return logStok({
        pelangganId,
        produkId,
        varianId,
        tenantUserId,
        tipe: STOK_TIPE.PENYESUAIAN,
        qtySebelum,
        qtyPerubahan,
        qtySesudah,
        referensiTipe,
        referensiId,
        catatan: catatan || `Penyesuaian stok: ${qtySebelum} → ${qtySesudah}`
    });
}

/**
 * ============================================
 * HELPER: logStokRetur
 * ============================================
 * Shortcut untuk mencatat retur (stok kembali)
 * 
 * @param {Object} params
 * @param {number} params.pelangganId
 * @param {number} params.produkId
 * @param {number|null} params.varianId
 * @param {number|null} params.tenantUserId
 * @param {number} params.qtyRetur - Jumlah yang diretur (positif)
 * @param {number} params.qtySebelum - Stok sebelum retur
 * @param {number} params.transaksiId - ID transaksi asal
 * @param {string|null} params.catatan
 */
export async function logStokRetur({
    pelangganId,
    produkId,
    varianId = null,
    tenantUserId = null,
    qtyRetur,
    qtySebelum,
    transaksiId,
    catatan = null
}) {
    const qtySesudah = qtySebelum + qtyRetur;
    
    return logStok({
        pelangganId,
        produkId,
        varianId,
        tenantUserId,
        tipe: STOK_TIPE.RETUR,
        qtySebelum,
        qtyPerubahan: qtyRetur,  // Positif karena stok kembali
        qtySesudah,
        referensiTipe: REFERENSI_TIPE.RETUR_PENJUALAN,
        referensiId: transaksiId,
        catatan: catatan || `Retur penjualan`
    });
}

/**
 * ============================================
 * HELPER: logStokBatch
 * ============================================
 * Mencatat multiple stok log sekaligus (untuk transaksi dengan banyak item)
 * 
 * @param {Array<Object>} items - Array of log items
 * @returns {Promise<{success: boolean, totalLogged: number, errors: Array}>}
 */
export async function logStokBatch(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return { success: false, totalLogged: 0, errors: ['No items to log'] };
    }

    const results = [];
    const errors = [];

    for (const item of items) {
        const result = await logStok(item);
        if (result.success) {
            results.push(result.logId);
        } else {
            errors.push({ item, error: result.error });
        }
    }

    return {
        success: errors.length === 0,
        totalLogged: results.length,
        logIds: results,
        errors
    };
}

/**
 * ============================================
 * HELPER: getStokSebelum
 * ============================================
 * Mendapatkan stok saat ini sebelum perubahan
 * 
 * @param {number} produkId
 * @param {number|null} varianId
 * @returns {Promise<number>}
 */
export async function getStokSebelum(produkId, varianId = null) {
    try {
        if (varianId) {
            const result = await query(
                'SELECT stok FROM produk_varian WHERE id = ?',
                [varianId]
            );
            return result[0]?.stok || 0;
        } else {
            const result = await query(
                'SELECT stok FROM produk WHERE id = ?',
                [produkId]
            );
            return result[0]?.stok || 0;
        }
    } catch (error) {
        console.error('Error getting stok sebelum:', error);
        return 0;
    }
}

/**
 * ============================================
 * HELPER: getStokHistory
 * ============================================
 * Mendapatkan history perubahan stok untuk produk/varian
 * 
 * @param {number} produkId
 * @param {number|null} varianId
 * @param {number} limit - Jumlah record (default: 50)
 * @returns {Promise<Array>}
 */
export async function getStokHistory(produkId, varianId = null, limit = 50) {
    try {
        let sql = `
            SELECT 
                sl.*,
                tu.nama as user_nama,
                tu.role as user_role
            FROM stok_log sl
            LEFT JOIN tenant_users tu ON sl.tenant_user_id = tu.id
            WHERE sl.produk_id = ?
        `;
        const params = [produkId];

        if (varianId) {
            sql += ' AND sl.varian_id = ?';
            params.push(varianId);
        }

        sql += ' ORDER BY sl.created_at DESC LIMIT ?';
        params.push(limit);

        const result = await query(sql, params);
        return result || [];
    } catch (error) {
        console.error('Error getting stok history:', error);
        return [];
    }
}

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
    logStok,
    logStokKeluar,
    logStokMasuk,
    logStokPenyesuaian,
    logStokRetur,
    logStokBatch,
    getStokSebelum,
    getStokHistory,
    STOK_TIPE,
    REFERENSI_TIPE
};