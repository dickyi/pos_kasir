/**
 * ============================================
 * PRODUK PAGE SERVER - With Merk Integration + STOK LOGGING
 * File: src/routes/(tenant)/tenant/produk/+page.server.js
 * ============================================
 * Features:
 * - CRUD Produk dengan Varian
 * - Integrasi Merk (conditional)
 * - Check setting menu untuk tampilan Merk
 * - NEW: Stok logging untuk audit trail
 * ============================================
 */

import { query } from '$lib/db.js';
import { fail } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/auth.js';

// ============================================
// IMPORT STOK LOGGER
// ============================================
import { 
    logStokMasuk, 
    logStokPenyesuaian, 
    getStokSebelum,
    REFERENSI_TIPE 
} from '$lib/utils/stokLogger.js';

// ============================================
// HELPER: Get Tenant User ID
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

/**
 * LOAD FUNCTION
 */
export async function load({ parent, cookies }) {
    const parentData = await parent();
    let user = parentData?.user;
    let tenantUser = parentData?.tenantUser;
    
    if (!user || !user.pelanggan_id) {
        user = getUserFromSession(cookies);
    }
    
    if (!user || !user.pelanggan_id) {
        return { produk: [], kategori: [], merk: [], tenantUser: null, showMerk: false };
    }

    try {
        // Load produk dengan info varian dan merk
        const produk = await query(`
            SELECT 
                p.id, p.pelanggan_id, p.kode_produk, p.nama_produk,
                p.kategori_id, p.merk_id, p.harga_beli, p.harga_jual, p.stok,
                p.satuan, p.gambar, p.status, p.barcode,
                p.has_variant, p.is_favorite,
                p.created_at, p.updated_at,
                k.nama_kategori,
                m.nama_merk,
                (SELECT COUNT(*) FROM produk_varian WHERE produk_id = p.id AND status = 'aktif') as variant_count
            FROM produk p
            LEFT JOIN kategori k ON p.kategori_id = k.id
            LEFT JOIN merk m ON p.merk_id = m.id
            WHERE p.pelanggan_id = ?
            ORDER BY p.created_at DESC
        `, [user.pelanggan_id]);
        
        // Load kategori
        const kategori = await query(`
            SELECT id, nama_kategori, kode_kategori
            FROM kategori
            WHERE pelanggan_id = ? AND status = 'aktif'
            ORDER BY nama_kategori ASC
        `, [user.pelanggan_id]);

        // Load merk
        const merk = await query(`
            SELECT id, nama_merk, kode_merk
            FROM merk
            WHERE pelanggan_id = ? AND status = 'aktif'
            ORDER BY nama_merk ASC
        `, [user.pelanggan_id]);

        // Check apakah menu Merk aktif di pengaturan
        let showMerk = false;
        try {
            const menuSettings = await query(`
                SELECT menu_merk 
                FROM pengaturan 
                WHERE pelanggan_id = ?
            `, [user.pelanggan_id]);
            
            if (menuSettings && menuSettings.length > 0) {
                showMerk = menuSettings[0].menu_merk == 1 || menuSettings[0].menu_merk === true;
            }
            
            console.log('Menu Merk Setting:', showMerk);
        } catch (e) {
            console.log('Menu settings not found, using default showMerk = false');
        }

        // Load varian untuk setiap produk yang has_variant = 1
        const produkWithVariants = await Promise.all(produk.map(async (p) => {
            if (p.has_variant) {
                const variants = await query(`
                    SELECT 
                        id, kode_varian, nama_varian, barcode,
                        harga_modal, harga_jual, stok, stok_minimum,
                        is_default, atribut, gambar, berat, status
                    FROM produk_varian
                    WHERE produk_id = ? AND status = 'aktif'
                    ORDER BY is_default DESC, urutan ASC, nama_varian ASC
                `, [p.id]);
                return { ...p, variants };
            }
            return { ...p, variants: [] };
        }));
        
        return {
            produk: produkWithVariants || [],
            kategori: kategori || [],
            merk: merk || [],
            tenantUser: tenantUser || null,
            showMerk: showMerk
        };
    } catch (error) {
        console.error('Error loading produk:', error.message);
        return { produk: [], kategori: [], merk: [], tenantUser: null, showMerk: false, error: error.message };
    }
}

/**
 * Helper: Parse harga dari berbagai format ke integer
 */
function parseHarga(value) {
    if (value === null || value === undefined || value === '') return 0;
    
    if (typeof value === 'number') {
        return Math.round(value);
    }
    
    let str = value.toString().trim();
    
    // Format DB decimal: "15000.00"
    if (/^\d+\.\d{2}$/.test(str)) {
        return Math.round(parseFloat(str));
    }
    
    // Format rupiah Indonesia: "15.000" atau "1.500.000"
    if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
        return parseInt(str.replace(/\./g, '')) || 0;
    }
    
    // Format dengan koma: "15,000"
    if (/^\d{1,3}(,\d{3})+$/.test(str)) {
        return parseInt(str.replace(/,/g, '')) || 0;
    }
    
    // Pure number string: "15000"
    if (/^\d+$/.test(str)) {
        return parseInt(str) || 0;
    }
    
    // Fallback
    return parseInt(str.replace(/\D/g, '')) || 0;
}

/**
 * Helper: Parse variants dari JSON string
 */
function parseVariants(variantsJson) {
    if (!variantsJson) return [];
    
    try {
        const parsed = JSON.parse(variantsJson);
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch (e) {
        console.error('Error parsing variants JSON:', e.message);
        return [];
    }
}

/**
 * Helper: Calculate total stok dari varian
 */
function calculateTotalStok(variants) {
    if (!variants || variants.length === 0) return 0;
    return variants.reduce((sum, v) => sum + (parseInt(v.stok) || 0), 0);
}

/**
 * Helper: Parse berat (bisa null, number, atau string)
 */
function parseBerat(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
}

/**
 * Helper: Parse atribut (bisa null, object, atau string JSON)
 */
function parseAtribut(value) {
    if (!value) return null;
    
    // Jika sudah object
    if (typeof value === 'object' && !Array.isArray(value)) {
        const keys = Object.keys(value);
        if (keys.length === 0) return null;
        return JSON.stringify(value);
    }
    
    // Jika string
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                const keys = Object.keys(parsed);
                if (keys.length === 0) return null;
                return value;
            }
        } catch (e) {
            // Bukan valid JSON
        }
    }
    
    return null;
}

/**
 * FORM ACTIONS
 */
export const actions = {
    /**
     * CREATE - Tambah produk baru dengan varian dan merk + STOK LOGGING
     */
    create: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);
        
        if (!user || !user.pelanggan_id) {
            return fail(401, { error: true, message: 'Sesi tidak valid. Silakan login ulang.' });
        }

        if (user.tenant_role === 'kasir') {
            return fail(403, { error: true, message: 'Anda tidak memiliki izin untuk menambah produk.' });
        }

        const formData = await request.formData();
        
        const nama_produk = formData.get('nama_produk')?.trim();
        const kategori_id = formData.get('kategori_id') || null;
        const merk_id = formData.get('merk_id') || null;
        const harga_beli = parseInt(formData.get('harga_beli')) || 0;
        const harga_jual = parseInt(formData.get('harga_jual')) || 0;
        const barcode = formData.get('barcode')?.trim() || null;
        const stok = parseInt(formData.get('stok')) || 0;
        const satuan = formData.get('satuan') || 'pcs';
        const status = formData.get('status') || 'aktif';
        const gambar = formData.get('gambar') || null;
        const is_favorite = formData.get('is_favorite') === '1';
        const has_variant = formData.get('has_variant') === '1';
        const variantsJson = formData.get('variants') || '[]';

        if (!nama_produk) {
            return fail(400, { error: true, message: 'Nama produk wajib diisi' });
        }

        // Get tenant user ID for logging
        let tenantUserId = user.tenant_user_id || null;
        if (!tenantUserId && user.email) {
            tenantUserId = await getTenantUserId(user.pelanggan_id, user.email);
        }

        try {
            // Generate kode produk
            const timestamp = Date.now().toString().slice(-6);
            const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
            const kode_produk = `PRD-${timestamp}-${randomSuffix}`;

            // Parse variants
            const variants = parseVariants(variantsJson);
            
            console.log('CREATE - Parsed variants:', variants.length);

            // Hitung total stok dari varian jika has_variant
            let finalStok = stok;
            if (has_variant && variants.length > 0) {
                finalStok = calculateTotalStok(variants);
            }

            // Insert produk dengan merk_id
            const result = await query(`
                INSERT INTO produk (
                    pelanggan_id, kode_produk, nama_produk, kategori_id, merk_id,
                    harga_beli, harga_jual, barcode, stok, satuan, 
                    gambar, status, is_favorite, has_variant,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
                user.pelanggan_id, kode_produk, nama_produk,
                kategori_id || null, merk_id || null,
                harga_beli, harga_jual,
                barcode, finalStok, satuan, gambar, status,
                is_favorite ? 1 : 0, has_variant ? 1 : 0
            ]);

            const produkId = result.insertId;

            // ============================================
            // LOG STOK MASUK - PRODUK BARU
            // ============================================
            if (!has_variant && finalStok > 0) {
                // Produk tanpa varian dengan stok awal
                await logStokMasuk({
                    pelangganId: user.pelanggan_id,
                    produkId: produkId,
                    varianId: null,
                    tenantUserId,
                    qtyMasuk: finalStok,
                    qtySebelum: 0,
                    referensiTipe: REFERENSI_TIPE.PRODUK_BARU,
                    referensiId: produkId,
                    catatan: `Stok awal produk baru: ${nama_produk}`
                });
                console.log(`📦 Stok Log: Produk baru "${nama_produk}" dengan stok awal ${finalStok}`);
            }

            // Insert varian jika ada
            if (has_variant && variants.length > 0) {
                for (let i = 0; i < variants.length; i++) {
                    const variant = variants[i];
                    
                    const kodeVarian = variant.kode_varian || 
                        `${kode_produk}-V${(i + 1).toString().padStart(2, '0')}`;
                    
                    const varianStok = parseInt(variant.stok) || 0;
                    const varianHargaJual = parseHarga(variant.harga_jual);
                    const varianHargaModal = parseHarga(variant.harga_modal);
                    const varianStokMin = parseInt(variant.stok_minimum) || 10;
                    const varianBerat = parseBerat(variant.berat);
                    const varianAtribut = parseAtribut(variant.atribut);
                    const varianGambar = variant.gambar || null;
                    
                    const varianResult = await query(`
                        INSERT INTO produk_varian (
                            produk_id, pelanggan_id, kode_varian, nama_varian,
                            barcode, harga_modal, harga_jual, stok, stok_minimum,
                            is_default, atribut, gambar, berat, urutan, status,
                            created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', NOW(), NOW())
                    `, [
                        produkId,
                        user.pelanggan_id,
                        kodeVarian,
                        variant.nama_varian,
                        variant.barcode || null,
                        varianHargaModal,
                        varianHargaJual,
                        varianStok,
                        varianStokMin,
                        variant.is_default ? 1 : 0,
                        varianAtribut,
                        varianGambar,
                        varianBerat,
                        i + 1
                    ]);

                    const varianId = varianResult.insertId;

                    // ============================================
                    // LOG STOK MASUK - VARIAN BARU
                    // ============================================
                    if (varianStok > 0) {
                        await logStokMasuk({
                            pelangganId: user.pelanggan_id,
                            produkId: produkId,
                            varianId: varianId,
                            tenantUserId,
                            qtyMasuk: varianStok,
                            qtySebelum: 0,
                            referensiTipe: REFERENSI_TIPE.PRODUK_BARU,
                            referensiId: produkId,
                            catatan: `Stok awal varian baru: ${nama_produk} - ${variant.nama_varian}`
                        });
                        console.log(`📦 Stok Log: Varian baru "${variant.nama_varian}" dengan stok awal ${varianStok}`);
                    }
                }
                console.log(`CREATE - ${variants.length} variants inserted with stock logging`);
            }

            return { success: true, message: `Produk "${nama_produk}" berhasil ditambahkan` };
        } catch (error) {
            console.error('Error creating produk:', error.message);
            return fail(500, { error: true, message: 'Gagal menambahkan produk: ' + error.message });
        }
    },

    /**
     * UPDATE - Edit produk dengan varian dan merk + STOK LOGGING
     */
    update: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);
        
        if (!user || !user.pelanggan_id) {
            return fail(401, { error: true, message: 'Sesi tidak valid. Silakan login ulang.' });
        }

        if (user.tenant_role === 'kasir') {
            return fail(403, { error: true, message: 'Anda tidak memiliki izin untuk mengedit produk.' });
        }

        const formData = await request.formData();
        
        const id = formData.get('id');
        const nama_produk = formData.get('nama_produk')?.trim();
        const kategori_id = formData.get('kategori_id') || null;
        const merk_id = formData.get('merk_id') || null;
        const harga_beli = parseInt(formData.get('harga_beli')) || 0;
        const harga_jual = parseInt(formData.get('harga_jual')) || 0;
        const barcode = formData.get('barcode')?.trim() || null;
        const stok = parseInt(formData.get('stok')) || 0;
        const satuan = formData.get('satuan') || 'pcs';
        const status = formData.get('status') || 'aktif';
        const gambar = formData.get('gambar') || null;
        const is_favorite = formData.get('is_favorite') === '1';
        const has_variant = formData.get('has_variant') === '1';
        const variantsJson = formData.get('variants') || '[]';

        if (!id || !nama_produk) {
            return fail(400, { error: true, message: 'Data tidak valid' });
        }

        // Get tenant user ID for logging
        let tenantUserId = user.tenant_user_id || null;
        if (!tenantUserId && user.email) {
            tenantUserId = await getTenantUserId(user.pelanggan_id, user.email);
        }

        try {
            // Verify ownership
            const existing = await query(
                'SELECT id, kode_produk, stok, has_variant FROM produk WHERE id = ? AND pelanggan_id = ?',
                [id, user.pelanggan_id]
            );

            if (!existing || existing.length === 0) {
                return fail(404, { error: true, message: 'Produk tidak ditemukan' });
            }

            const kodeProduk = existing[0].kode_produk;
            const stokSebelumProduk = existing[0].stok || 0;
            const wasHasVariant = existing[0].has_variant === 1;

            // Parse variants
            const variants = parseVariants(variantsJson);

            // Hitung total stok dari varian jika has_variant
            let finalStok = stok;
            if (has_variant && variants.length > 0) {
                finalStok = calculateTotalStok(variants);
            }

            // ============================================
            // LOG STOK PENYESUAIAN - JIKA STOK BERUBAH (PRODUK TANPA VARIAN)
            // ============================================
            if (!has_variant && !wasHasVariant && finalStok !== stokSebelumProduk) {
                await logStokPenyesuaian({
                    pelangganId: user.pelanggan_id,
                    produkId: parseInt(id),
                    varianId: null,
                    tenantUserId,
                    qtySebelum: stokSebelumProduk,
                    qtySesudah: finalStok,
                    referensiTipe: REFERENSI_TIPE.ADJUST_MANUAL,
                    referensiId: parseInt(id),
                    catatan: `Penyesuaian stok manual: ${nama_produk} (${stokSebelumProduk} → ${finalStok})`
                });
                console.log(`📦 Stok Log: Penyesuaian "${nama_produk}" dari ${stokSebelumProduk} ke ${finalStok}`);
            }

            // Update produk dengan merk_id
            await query(`
                UPDATE produk SET 
                    nama_produk = ?, kategori_id = ?, merk_id = ?, harga_beli = ?,
                    harga_jual = ?, barcode = ?, stok = ?, satuan = ?, 
                    gambar = ?, status = ?, is_favorite = ?, has_variant = ?,
                    updated_at = NOW()
                WHERE id = ? AND pelanggan_id = ?
            `, [
                nama_produk, kategori_id || null, merk_id || null, harga_beli,
                harga_jual, barcode, finalStok, satuan, gambar, status,
                is_favorite ? 1 : 0, has_variant ? 1 : 0,
                id, user.pelanggan_id
            ]);

            // Handle varian
            if (has_variant && variants.length > 0) {
                const existingVariants = await query(
                    'SELECT id, kode_varian, stok FROM produk_varian WHERE produk_id = ?',
                    [id]
                );
                const existingDbIds = existingVariants.map(v => v.id);
                const existingStokMap = {};
                existingVariants.forEach(v => {
                    existingStokMap[v.id] = v.stok || 0;
                });
                
                const dbIdsToKeep = [];

                for (let i = 0; i < variants.length; i++) {
                    const variant = variants[i];
                    const varianStok = parseInt(variant.stok) || 0;
                    const varianHargaJual = parseHarga(variant.harga_jual);
                    const varianHargaModal = parseHarga(variant.harga_modal);
                    const varianStokMin = parseInt(variant.stok_minimum) || 10;
                    const varianBerat = parseBerat(variant.berat);
                    const varianAtribut = parseAtribut(variant.atribut);
                    const varianGambar = variant.gambar || null;

                    const dbId = variant.id ? parseInt(variant.id) : null;
                    const isExistingInDb = dbId && existingDbIds.includes(dbId);

                    if (isExistingInDb) {
                        // UPDATE existing variant
                        const stokSebelumVarian = existingStokMap[dbId] || 0;

                        await query(`
                            UPDATE produk_varian SET
                                nama_varian = ?, barcode = ?, harga_modal = ?,
                                harga_jual = ?, stok = ?, stok_minimum = ?,
                                is_default = ?, atribut = ?, gambar = ?, berat = ?,
                                urutan = ?, updated_at = NOW()
                            WHERE id = ? AND produk_id = ?
                        `, [
                            variant.nama_varian,
                            variant.barcode || null,
                            varianHargaModal,
                            varianHargaJual,
                            varianStok,
                            varianStokMin,
                            variant.is_default ? 1 : 0,
                            varianAtribut,
                            varianGambar,
                            varianBerat,
                            i + 1,
                            dbId, id
                        ]);

                        // ============================================
                        // LOG STOK PENYESUAIAN - VARIAN YANG DIUPDATE
                        // ============================================
                        if (varianStok !== stokSebelumVarian) {
                            await logStokPenyesuaian({
                                pelangganId: user.pelanggan_id,
                                produkId: parseInt(id),
                                varianId: dbId,
                                tenantUserId,
                                qtySebelum: stokSebelumVarian,
                                qtySesudah: varianStok,
                                referensiTipe: REFERENSI_TIPE.ADJUST_MANUAL,
                                referensiId: parseInt(id),
                                catatan: `Penyesuaian stok varian: ${nama_produk} - ${variant.nama_varian} (${stokSebelumVarian} → ${varianStok})`
                            });
                            console.log(`📦 Stok Log: Penyesuaian varian "${variant.nama_varian}" dari ${stokSebelumVarian} ke ${varianStok}`);
                        }
                        
                        dbIdsToKeep.push(dbId);
                    } else {
                        // INSERT new variant
                        const kodeVarian = variant.kode_varian || 
                            `${kodeProduk}-V${Date.now().toString().slice(-4)}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
                        
                        const insertResult = await query(`
                            INSERT INTO produk_varian (
                                produk_id, pelanggan_id, kode_varian, nama_varian,
                                barcode, harga_modal, harga_jual, stok, stok_minimum,
                                is_default, atribut, gambar, berat, urutan, status,
                                created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', NOW(), NOW())
                        `, [
                            id,
                            user.pelanggan_id,
                            kodeVarian,
                            variant.nama_varian,
                            variant.barcode || null,
                            varianHargaModal,
                            varianHargaJual,
                            varianStok,
                            varianStokMin,
                            variant.is_default ? 1 : 0,
                            varianAtribut,
                            varianGambar,
                            varianBerat,
                            i + 1
                        ]);

                        const newVarianId = insertResult.insertId;
                        
                        // ============================================
                        // LOG STOK MASUK - VARIAN BARU DITAMBAHKAN
                        // ============================================
                        if (varianStok > 0) {
                            await logStokMasuk({
                                pelangganId: user.pelanggan_id,
                                produkId: parseInt(id),
                                varianId: newVarianId,
                                tenantUserId,
                                qtyMasuk: varianStok,
                                qtySebelum: 0,
                                referensiTipe: REFERENSI_TIPE.PRODUK_BARU,
                                referensiId: parseInt(id),
                                catatan: `Varian baru ditambahkan: ${nama_produk} - ${variant.nama_varian}`
                            });
                            console.log(`📦 Stok Log: Varian baru "${variant.nama_varian}" dengan stok ${varianStok}`);
                        }
                        
                        dbIdsToKeep.push(newVarianId);
                    }
                }

                // Delete variants yang tidak ada di list baru
                const dbIdsToDelete = existingDbIds.filter(dbId => !dbIdsToKeep.includes(dbId));
                if (dbIdsToDelete.length > 0) {
                    // Log stok keluar untuk varian yang dihapus (opsional - bisa dianggap rusak/hilang)
                    for (const deleteId of dbIdsToDelete) {
                        const deletedStok = existingStokMap[deleteId] || 0;
                        if (deletedStok > 0) {
                            // Get variant name before delete
                            const variantInfo = existingVariants.find(v => v.id === deleteId);
                            await logStokPenyesuaian({
                                pelangganId: user.pelanggan_id,
                                produkId: parseInt(id),
                                varianId: deleteId,
                                tenantUserId,
                                qtySebelum: deletedStok,
                                qtySesudah: 0,
                                referensiTipe: REFERENSI_TIPE.RUSAK_HILANG,
                                referensiId: parseInt(id),
                                catatan: `Varian dihapus: ${nama_produk} - ${variantInfo?.kode_varian || 'Unknown'}`
                            });
                            console.log(`📦 Stok Log: Varian dihapus dengan stok ${deletedStok}`);
                        }
                    }

                    await query(
                        `DELETE FROM produk_varian WHERE id IN (${dbIdsToDelete.join(',')}) AND produk_id = ?`,
                        [id]
                    );
                }
            } else {
                // Jika tidak punya varian lagi, hapus semua varian yang ada
                const existingVariants = await query(
                    'SELECT id, stok, kode_varian FROM produk_varian WHERE produk_id = ?',
                    [id]
                );

                // Log stok untuk varian yang dihapus
                for (const v of existingVariants) {
                    if (v.stok > 0) {
                        await logStokPenyesuaian({
                            pelangganId: user.pelanggan_id,
                            produkId: parseInt(id),
                            varianId: v.id,
                            tenantUserId,
                            qtySebelum: v.stok,
                            qtySesudah: 0,
                            referensiTipe: REFERENSI_TIPE.RUSAK_HILANG,
                            referensiId: parseInt(id),
                            catatan: `Varian dihapus (produk diubah ke non-varian): ${nama_produk} - ${v.kode_varian}`
                        });
                    }
                }

                await query('DELETE FROM produk_varian WHERE produk_id = ?', [id]);
            }

            return { success: true, message: `Produk "${nama_produk}" berhasil diperbarui` };
        } catch (error) {
            console.error('Error updating produk:', error.message);
            return fail(500, { error: true, message: 'Gagal memperbarui produk: ' + error.message });
        }
    },

    /**
     * DELETE - Hapus produk beserta varian
     */
    delete: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);
        
        if (!user || !user.pelanggan_id) {
            return fail(401, { error: true, message: 'Sesi tidak valid. Silakan login ulang.' });
        }

        if (user.tenant_role === 'kasir') {
            return fail(403, { error: true, message: 'Anda tidak memiliki izin untuk menghapus produk.' });
        }

        const formData = await request.formData();
        const id = formData.get('id');

        try {
            const existing = await query(
                'SELECT id, nama_produk FROM produk WHERE id = ? AND pelanggan_id = ?',
                [id, user.pelanggan_id]
            );

            if (!existing || existing.length === 0) {
                return fail(404, { error: true, message: 'Produk tidak ditemukan' });
            }

            const namaProduk = existing[0].nama_produk;

            // Check if used in transaksi
            const usedInTransaksi = await query(
                'SELECT COUNT(*) as count FROM transaksi_detail WHERE produk_id = ?',
                [id]
            );

            // Check if varian used in transaksi
            const usedVarianInTransaksi = await query(
                'SELECT COUNT(*) as count FROM transaksi_detail WHERE varian_id IN (SELECT id FROM produk_varian WHERE produk_id = ?)',
                [id]
            );

            const totalUsed = (usedInTransaksi[0]?.count || 0) + (usedVarianInTransaksi[0]?.count || 0);

            if (totalUsed > 0) {
                // Nonaktifkan saja jika sudah ada transaksi
                await query(
                    'UPDATE produk SET status = "nonaktif", updated_at = NOW() WHERE id = ?',
                    [id]
                );
                await query(
                    'UPDATE produk_varian SET status = "nonaktif", updated_at = NOW() WHERE produk_id = ?',
                    [id]
                );
                return { success: true, message: `Produk "${namaProduk}" dinonaktifkan karena sudah ada transaksi` };
            }

            // Hapus varian dulu
            await query('DELETE FROM produk_varian WHERE produk_id = ?', [id]);

            // Hapus produk
            await query(
                'DELETE FROM produk WHERE id = ? AND pelanggan_id = ?',
                [id, user.pelanggan_id]
            );

            return { success: true, message: `Produk "${namaProduk}" berhasil dihapus` };
        } catch (error) {
            console.error('Error deleting produk:', error.message);
            return fail(500, { error: true, message: 'Gagal menghapus produk' });
        }
    },

    /**
     * ADJUST STOK - Penyesuaian stok manual (NEW ACTION)
     */
    adjustStok: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);
        
        if (!user || !user.pelanggan_id) {
            return fail(401, { error: true, message: 'Sesi tidak valid. Silakan login ulang.' });
        }

        if (user.tenant_role === 'kasir') {
            return fail(403, { error: true, message: 'Anda tidak memiliki izin untuk menyesuaikan stok.' });
        }

        const formData = await request.formData();
        
        const produk_id = formData.get('produk_id');
        const varian_id = formData.get('varian_id') || null;
        const stok_baru = parseInt(formData.get('stok_baru'));
        const catatan = formData.get('catatan')?.trim() || 'Penyesuaian stok manual';

        if (!produk_id || isNaN(stok_baru) || stok_baru < 0) {
            return fail(400, { error: true, message: 'Data tidak valid' });
        }

        // Get tenant user ID for logging
        let tenantUserId = user.tenant_user_id || null;
        if (!tenantUserId && user.email) {
            tenantUserId = await getTenantUserId(user.pelanggan_id, user.email);
        }

        try {
            let stokSebelum = 0;
            let namaProduk = '';
            let namaVarian = '';

            if (varian_id) {
                // Adjust stok varian
                const varianResult = await query(`
                    SELECT pv.stok, pv.nama_varian, p.nama_produk 
                    FROM produk_varian pv
                    JOIN produk p ON pv.produk_id = p.id
                    WHERE pv.id = ? AND p.pelanggan_id = ?
                `, [varian_id, user.pelanggan_id]);

                if (!varianResult || varianResult.length === 0) {
                    return fail(404, { error: true, message: 'Varian tidak ditemukan' });
                }

                stokSebelum = varianResult[0].stok || 0;
                namaProduk = varianResult[0].nama_produk;
                namaVarian = varianResult[0].nama_varian;

                // Update stok varian
                await query(
                    'UPDATE produk_varian SET stok = ?, updated_at = NOW() WHERE id = ?',
                    [stok_baru, varian_id]
                );

                // Update total stok produk induk
                await query(`
                    UPDATE produk SET stok = (
                        SELECT COALESCE(SUM(stok), 0) 
                        FROM produk_varian 
                        WHERE produk_id = ? AND status = 'aktif'
                    ), updated_at = NOW() WHERE id = ?
                `, [produk_id, produk_id]);

            } else {
                // Adjust stok produk
                const produkResult = await query(
                    'SELECT stok, nama_produk FROM produk WHERE id = ? AND pelanggan_id = ?',
                    [produk_id, user.pelanggan_id]
                );

                if (!produkResult || produkResult.length === 0) {
                    return fail(404, { error: true, message: 'Produk tidak ditemukan' });
                }

                stokSebelum = produkResult[0].stok || 0;
                namaProduk = produkResult[0].nama_produk;

                // Update stok produk
                await query(
                    'UPDATE produk SET stok = ?, updated_at = NOW() WHERE id = ? AND pelanggan_id = ?',
                    [stok_baru, produk_id, user.pelanggan_id]
                );
            }

            // ============================================
            // LOG STOK PENYESUAIAN
            // ============================================
            if (stok_baru !== stokSebelum) {
                await logStokPenyesuaian({
                    pelangganId: user.pelanggan_id,
                    produkId: parseInt(produk_id),
                    varianId: varian_id ? parseInt(varian_id) : null,
                    tenantUserId,
                    qtySebelum: stokSebelum,
                    qtySesudah: stok_baru,
                    referensiTipe: REFERENSI_TIPE.ADJUST_MANUAL,
                    referensiId: parseInt(produk_id),
                    catatan: catatan
                });

                const itemName = varian_id ? `${namaProduk} - ${namaVarian}` : namaProduk;
                console.log(`📦 Stok Log: Penyesuaian "${itemName}" dari ${stokSebelum} ke ${stok_baru}`);

                return { 
                    success: true, 
                    message: `Stok "${itemName}" berhasil diubah dari ${stokSebelum} menjadi ${stok_baru}` 
                };
            }

            return { 
                success: true, 
                message: 'Stok tidak berubah' 
            };

        } catch (error) {
            console.error('Error adjusting stok:', error.message);
            return fail(500, { error: true, message: 'Gagal menyesuaikan stok: ' + error.message });
        }
    }
};