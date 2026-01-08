/**
 * ============================================
 * PRODUK PAGE SERVER - CRUD Operations
 * File: src/routes/(tenant)/tenant/produk/+page.server.js
 * ============================================
 * 
 * Server-side logic untuk halaman produk tenant:
 * - Load data produk dan kategori
 * - Create, Update, Delete produk
 */

import { db } from '$lib/db.js';
import { fail } from '@sveltejs/kit';

/**
 * LOAD FUNCTION
 * Mengambil data produk dan kategori berdasarkan pelanggan_id
 */
export async function load({ parent }) {
    const { user } = await parent();
    
    if (!user || !user.pelanggan_id) {
        return {
            produk: [],
            kategori: []
        };
    }

    try {
        // Ambil produk dengan join kategori
        const produk = await db.query(`
            SELECT 
                p.*,
                k.nama_kategori
            FROM produk p
            LEFT JOIN kategori k ON p.kategori_id = k.id
            WHERE p.pelanggan_id = ?
            ORDER BY p.created_at DESC
        `, [user.pelanggan_id]);
        
        // Ambil kategori aktif
        const kategori = await db.query(`
            SELECT id, nama_kategori, kode_kategori
            FROM kategori
            WHERE pelanggan_id = ? AND status = 'aktif'
            ORDER BY nama_kategori ASC
        `, [user.pelanggan_id]);
        
        return {
            produk: produk || [],
            kategori: kategori || []
        };
    } catch (error) {
        console.error('Error loading produk:', error);
        return {
            produk: [],
            kategori: []
        };
    }
}

/**
 * FORM ACTIONS
 */
export const actions = {
    /**
     * CREATE - Tambah produk baru
     */
    create: async ({ request, locals }) => {
        const formData = await request.formData();
        
        // Get form values
        const nama_produk = formData.get('nama_produk')?.trim();
        const kategori_id = formData.get('kategori_id') || null;
        const harga_beli = parseInt(formData.get('harga_beli')) || 0;
        const harga_jual = parseInt(formData.get('harga_jual')) || 0;
        const stok = parseInt(formData.get('stok')) || 0;
        const satuan = formData.get('satuan') || 'pcs';
        const status = formData.get('status') || 'aktif';
        
        // Get user from locals (set by hooks atau layout server)
        const user = locals.user;
        if (!user || !user.pelanggan_id) {
            return fail(401, { error: true, message: 'Sesi tidak valid. Silakan login ulang.' });
        }

        // Validation
        if (!nama_produk) {
            return fail(400, { error: true, message: 'Nama produk wajib diisi' });
        }
        if (nama_produk.length < 2) {
            return fail(400, { error: true, message: 'Nama produk minimal 2 karakter' });
        }
        if (harga_beli < 0 || harga_jual < 0) {
            return fail(400, { error: true, message: 'Harga tidak boleh negatif' });
        }
        if (harga_jual < harga_beli) {
            return fail(400, { error: true, message: 'Harga jual sebaiknya tidak lebih kecil dari harga beli' });
        }
        if (stok < 0) {
            return fail(400, { error: true, message: 'Stok tidak boleh negatif' });
        }

        try {
            // Generate kode produk unik
            // Format: PRD-[PELANGGAN_ID]-[TIMESTAMP]
            const timestamp = Date.now().toString().slice(-6);
            const kode_produk = `PRD-${user.pelanggan_id}-${timestamp}`;

            // Check if kode already exists (rare case)
            const existing = await db.query(
                'SELECT id FROM produk WHERE kode_produk = ?',
                [kode_produk]
            );
            
            if (existing && existing.length > 0) {
                // Add random suffix if exists
                const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
                kode_produk = `PRD-${user.pelanggan_id}-${timestamp}-${randomSuffix}`;
            }

            // Insert to database
            await db.query(`
                INSERT INTO produk (
                    pelanggan_id, 
                    kode_produk, 
                    nama_produk, 
                    kategori_id, 
                    harga_beli, 
                    harga_jual, 
                    stok, 
                    satuan, 
                    status,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
                user.pelanggan_id,
                kode_produk,
                nama_produk,
                kategori_id || null,
                harga_beli,
                harga_jual,
                stok,
                satuan,
                status
            ]);

            return { 
                success: true, 
                message: `Produk "${nama_produk}" berhasil ditambahkan` 
            };
        } catch (error) {
            console.error('Error creating produk:', error);
            return fail(500, { 
                error: true, 
                message: 'Gagal menambahkan produk. Silakan coba lagi.' 
            });
        }
    },

    /**
     * UPDATE - Edit produk
     */
    update: async ({ request, locals }) => {
        const formData = await request.formData();
        
        const id = formData.get('id');
        const nama_produk = formData.get('nama_produk')?.trim();
        const kategori_id = formData.get('kategori_id') || null;
        const harga_beli = parseInt(formData.get('harga_beli')) || 0;
        const harga_jual = parseInt(formData.get('harga_jual')) || 0;
        const stok = parseInt(formData.get('stok')) || 0;
        const satuan = formData.get('satuan') || 'pcs';
        const status = formData.get('status') || 'aktif';

        const user = locals.user;
        if (!user || !user.pelanggan_id) {
            return fail(401, { error: true, message: 'Sesi tidak valid. Silakan login ulang.' });
        }

        // Validation
        if (!id) {
            return fail(400, { error: true, message: 'ID produk tidak valid' });
        }
        if (!nama_produk || nama_produk.length < 2) {
            return fail(400, { error: true, message: 'Nama produk wajib diisi (min. 2 karakter)' });
        }
        if (harga_beli < 0 || harga_jual < 0) {
            return fail(400, { error: true, message: 'Harga tidak boleh negatif' });
        }

        try {
            // Verify ownership - produk harus milik tenant ini
            const existing = await db.query(
                'SELECT id, nama_produk FROM produk WHERE id = ? AND pelanggan_id = ?',
                [id, user.pelanggan_id]
            );

            if (!existing || existing.length === 0) {
                return fail(404, { error: true, message: 'Produk tidak ditemukan' });
            }

            // Update produk
            await db.query(`
                UPDATE produk 
                SET 
                    nama_produk = ?,
                    kategori_id = ?,
                    harga_beli = ?,
                    harga_jual = ?,
                    stok = ?,
                    satuan = ?,
                    status = ?,
                    updated_at = NOW()
                WHERE id = ? AND pelanggan_id = ?
            `, [
                nama_produk,
                kategori_id || null,
                harga_beli,
                harga_jual,
                stok,
                satuan,
                status,
                id,
                user.pelanggan_id
            ]);

            return { 
                success: true, 
                message: `Produk "${nama_produk}" berhasil diperbarui` 
            };
        } catch (error) {
            console.error('Error updating produk:', error);
            return fail(500, { 
                error: true, 
                message: 'Gagal memperbarui produk. Silakan coba lagi.' 
            });
        }
    },

    /**
     * DELETE - Hapus produk
     */
    delete: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get('id');

        const user = locals.user;
        if (!user || !user.pelanggan_id) {
            return fail(401, { error: true, message: 'Sesi tidak valid. Silakan login ulang.' });
        }

        if (!id) {
            return fail(400, { error: true, message: 'ID produk tidak valid' });
        }

        try {
            // Verify ownership
            const existing = await db.query(
                'SELECT id, nama_produk FROM produk WHERE id = ? AND pelanggan_id = ?',
                [id, user.pelanggan_id]
            );

            if (!existing || existing.length === 0) {
                return fail(404, { error: true, message: 'Produk tidak ditemukan' });
            }

            const namaProduk = existing[0].nama_produk;

            // Check if produk is used in any transaksi
            const usedInTransaksi = await db.query(
                'SELECT COUNT(*) as count FROM transaksi_detail WHERE produk_id = ?',
                [id]
            );

            if (usedInTransaksi[0]?.count > 0) {
                // Soft delete - just set status to nonaktif
                await db.query(
                    'UPDATE produk SET status = "nonaktif", updated_at = NOW() WHERE id = ?',
                    [id]
                );
                return { 
                    success: true, 
                    message: `Produk "${namaProduk}" dinonaktifkan (sudah ada transaksi terkait)` 
                };
            }

            // Hard delete if no transactions
            await db.query(
                'DELETE FROM produk WHERE id = ? AND pelanggan_id = ?',
                [id, user.pelanggan_id]
            );

            return { 
                success: true, 
                message: `Produk "${namaProduk}" berhasil dihapus` 
            };
        } catch (error) {
            console.error('Error deleting produk:', error);
            return fail(500, { 
                error: true, 
                message: 'Gagal menghapus produk. Silakan coba lagi.' 
            });
        }
    },

    /**
     * UPDATE STOK - Update stok produk (untuk keperluan penyesuaian stok)
     */
    updateStok: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const stok_baru = parseInt(formData.get('stok_baru')) || 0;
        const catatan = formData.get('catatan')?.trim() || '';

        const user = locals.user;
        if (!user || !user.pelanggan_id) {
            return fail(401, { error: true, message: 'Sesi tidak valid' });
        }

        if (!id || stok_baru < 0) {
            return fail(400, { error: true, message: 'Data tidak valid' });
        }

        try {
            // Get current stock
            const produk = await db.query(
                'SELECT id, nama_produk, stok FROM produk WHERE id = ? AND pelanggan_id = ?',
                [id, user.pelanggan_id]
            );

            if (!produk || produk.length === 0) {
                return fail(404, { error: true, message: 'Produk tidak ditemukan' });
            }

            const stok_lama = produk[0].stok;
            const selisih = stok_baru - stok_lama;

            // Update stok
            await db.query(
                'UPDATE produk SET stok = ?, updated_at = NOW() WHERE id = ?',
                [stok_baru, id]
            );

            // Log perubahan stok
            await db.query(`
                INSERT INTO stok_log (
                    produk_id, 
                    pelanggan_id, 
                    tipe, 
                    qty_sebelum, 
                    qty_perubahan, 
                    qty_sesudah, 
                    catatan, 
                    user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id,
                user.pelanggan_id,
                'penyesuaian',
                stok_lama,
                selisih,
                stok_baru,
                catatan || 'Penyesuaian stok manual',
                user.id
            ]);

            return { 
                success: true, 
                message: `Stok "${produk[0].nama_produk}" diperbarui: ${stok_lama} → ${stok_baru}` 
            };
        } catch (error) {
            console.error('Error updating stok:', error);
            return fail(500, { error: true, message: 'Gagal memperbarui stok' });
        }
    }
};