// ============================================
// HALAMAN MERK - SERVER (FIXED)
// File: src/routes/(tenant)/tenant/merk/+page.server.js
// CRUD untuk master data merk/brand produk
// FIX: Query yang menyebabkan tidak semua merk tampil
// ============================================

import { fail } from '@sveltejs/kit';
import { query } from '$lib/db.js';

// ========================================
// LOAD FUNCTION (FIXED)
// ========================================
export async function load({ parent }) {
    const { user, tenantUser } = await parent();
    const pelangganId = user?.pelanggan_id;

    if (!pelangganId) {
        return { merkList: [], stats: {} };
    }

    try {
        // ============================================
        // FIX: Query dengan GROUP BY yang benar
        // Sebelumnya tidak ada GROUP BY sehingga 
        // hanya 1 row yang dikembalikan
        // ============================================
        const merkList = await query(
            `SELECT 
                m.id,
                m.pelanggan_id,
                m.kode_merk,
                m.nama_merk,
                m.deskripsi,
                m.logo,
                m.website,
                m.status,
                m.urutan,
                m.created_at,
                m.updated_at,
                COUNT(DISTINCT p.id) as jumlah_produk,
                COALESCE(SUM(p.stok), 0) as total_stok
            FROM merk m
            LEFT JOIN produk p ON p.merk_id = m.id AND p.status = 'aktif'
            WHERE m.pelanggan_id = ?
            GROUP BY m.id, m.pelanggan_id, m.kode_merk, m.nama_merk, 
                     m.deskripsi, m.logo, m.website, m.status, 
                     m.urutan, m.created_at, m.updated_at
            ORDER BY m.urutan ASC, m.nama_merk ASC`,
            [pelangganId]
        );

        // Stats
        const statsResult = await query(
            `SELECT 
                COUNT(*) as total_merk,
                SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as merk_aktif,
                SUM(CASE WHEN status = 'nonaktif' THEN 1 ELSE 0 END) as merk_nonaktif
            FROM merk
            WHERE pelanggan_id = ?`,
            [pelangganId]
        );

        // Produk tanpa merk
        const produkTanpaMerk = await query(
            `SELECT COUNT(*) as count FROM produk 
             WHERE pelanggan_id = ? AND (merk_id IS NULL OR merk_id = 0) AND status = 'aktif'`,
            [pelangganId]
        );

        return {
            merkList: merkList || [],
            stats: {
                total_merk: statsResult[0]?.total_merk || 0,
                merk_aktif: statsResult[0]?.merk_aktif || 0,
                merk_nonaktif: statsResult[0]?.merk_nonaktif || 0,
                produk_tanpa_merk: produkTanpaMerk[0]?.count || 0
            }
        };
    } catch (error) {
        console.error('Error loading merk:', error);
        return { 
            merkList: [], 
            stats: { total_merk: 0, merk_aktif: 0, merk_nonaktif: 0, produk_tanpa_merk: 0 } 
        };
    }
}

// ========================================
// ACTIONS
// ========================================
export const actions = {
    // ----------------------------------------
    // CREATE - Tambah merk baru
    // ----------------------------------------
    create: async ({ request, cookies }) => {
        const formData = await request.formData();
        
        const nama_merk = formData.get('nama_merk')?.toString().trim();
        const deskripsi = formData.get('deskripsi')?.toString().trim() || null;
        const website = formData.get('website')?.toString().trim() || null;
        const status = formData.get('status')?.toString() || 'aktif';

        // Validasi
        if (!nama_merk) {
            return fail(400, { 
                error: 'Nama merk wajib diisi',
                values: { nama_merk, deskripsi, website, status }
            });
        }

        // Ambil pelanggan_id dari session
        let pelangganId;
        try {
            const { getUserFromSession } = await import('$lib/auth.js');
            const user = getUserFromSession(cookies);
            pelangganId = user?.pelanggan_id;
        } catch (e) {
            return fail(401, { error: 'Sesi tidak valid' });
        }

        if (!pelangganId) {
            return fail(401, { error: 'Tidak dapat mengidentifikasi tenant' });
        }

        try {
            // Cek duplikat nama merk
            const existing = await query(
                `SELECT id FROM merk WHERE pelanggan_id = ? AND nama_merk = ?`,
                [pelangganId, nama_merk]
            );

            if (existing.length > 0) {
                return fail(400, {
                    error: 'Merk dengan nama tersebut sudah ada',
                    values: { nama_merk, deskripsi, website, status }
                });
            }

            // Generate kode merk
            const lastMerk = await query(
                `SELECT kode_merk FROM merk 
                 WHERE pelanggan_id = ? 
                 ORDER BY id DESC LIMIT 1`,
                [pelangganId]
            );

            let newNumber = 1;
            if (lastMerk.length > 0) {
                const lastCode = lastMerk[0].kode_merk;
                const match = lastCode.match(/MRK-(\d+)/);
                if (match) {
                    newNumber = parseInt(match[1]) + 1;
                }
            }
            const kodeMerk = `MRK-${String(newNumber).padStart(3, '0')}`;

            // Get urutan terakhir
            const lastUrutan = await query(
                `SELECT MAX(urutan) as max_urutan FROM merk WHERE pelanggan_id = ?`,
                [pelangganId]
            );
            const urutan = (lastUrutan[0]?.max_urutan || 0) + 1;

            // Insert merk baru
            await query(
                `INSERT INTO merk (pelanggan_id, kode_merk, nama_merk, deskripsi, website, status, urutan, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [pelangganId, kodeMerk, nama_merk, deskripsi, website, status, urutan]
            );

            return { success: true, message: 'Merk berhasil ditambahkan' };
        } catch (error) {
            console.error('Error creating merk:', error);
            return fail(500, { 
                error: 'Gagal menambahkan merk: ' + error.message,
                values: { nama_merk, deskripsi, website, status }
            });
        }
    },

    // ----------------------------------------
    // UPDATE - Edit merk
    // ----------------------------------------
    update: async ({ request, cookies }) => {
        const formData = await request.formData();
        
        const id = formData.get('id');
        const nama_merk = formData.get('nama_merk')?.toString().trim();
        const deskripsi = formData.get('deskripsi')?.toString().trim() || null;
        const website = formData.get('website')?.toString().trim() || null;
        const status = formData.get('status')?.toString() || 'aktif';

        // Validasi
        if (!id) {
            return fail(400, { error: 'ID merk tidak valid' });
        }
        if (!nama_merk) {
            return fail(400, { error: 'Nama merk wajib diisi' });
        }

        let pelangganId;
        try {
            const { getUserFromSession } = await import('$lib/auth.js');
            const user = getUserFromSession(cookies);
            pelangganId = user?.pelanggan_id;
        } catch (e) {
            return fail(401, { error: 'Sesi tidak valid' });
        }

        try {
            // Cek duplikat nama (exclude current)
            const existing = await query(
                `SELECT id FROM merk WHERE pelanggan_id = ? AND nama_merk = ? AND id != ?`,
                [pelangganId, nama_merk, id]
            );

            if (existing.length > 0) {
                return fail(400, { error: 'Merk dengan nama tersebut sudah ada' });
            }

            // Update merk
            await query(
                `UPDATE merk 
                 SET nama_merk = ?, deskripsi = ?, website = ?, status = ?, updated_at = NOW()
                 WHERE id = ? AND pelanggan_id = ?`,
                [nama_merk, deskripsi, website, status, id, pelangganId]
            );

            return { success: true, message: 'Merk berhasil diupdate' };
        } catch (error) {
            console.error('Error updating merk:', error);
            return fail(500, { error: 'Gagal mengupdate merk: ' + error.message });
        }
    },

    // ----------------------------------------
    // DELETE - Hapus merk
    // ----------------------------------------
    delete: async ({ request, cookies }) => {
        const formData = await request.formData();
        const id = formData.get('id');

        if (!id) {
            return fail(400, { error: 'ID merk tidak valid' });
        }

        let pelangganId;
        try {
            const { getUserFromSession } = await import('$lib/auth.js');
            const user = getUserFromSession(cookies);
            pelangganId = user?.pelanggan_id;
        } catch (e) {
            return fail(401, { error: 'Sesi tidak valid' });
        }

        try {
            // Cek apakah merk masih digunakan produk
            const produkCount = await query(
                `SELECT COUNT(*) as count FROM produk WHERE merk_id = ? AND status = 'aktif'`,
                [id]
            );

            if (produkCount[0]?.count > 0) {
                return fail(400, { 
                    error: `Merk tidak dapat dihapus karena masih digunakan oleh ${produkCount[0].count} produk. Ubah status menjadi nonaktif atau pindahkan produk ke merk lain terlebih dahulu.`
                });
            }

            // Hapus merk
            await query(
                `DELETE FROM merk WHERE id = ? AND pelanggan_id = ?`,
                [id, pelangganId]
            );

            return { success: true, message: 'Merk berhasil dihapus' };
        } catch (error) {
            console.error('Error deleting merk:', error);
            return fail(500, { error: 'Gagal menghapus merk: ' + error.message });
        }
    },

    // ----------------------------------------
    // TOGGLE STATUS - Aktif/Nonaktif
    // ----------------------------------------
    toggleStatus: async ({ request, cookies }) => {
        const formData = await request.formData();
        const id = formData.get('id');

        if (!id) {
            return fail(400, { error: 'ID merk tidak valid' });
        }

        let pelangganId;
        try {
            const { getUserFromSession } = await import('$lib/auth.js');
            const user = getUserFromSession(cookies);
            pelangganId = user?.pelanggan_id;
        } catch (e) {
            return fail(401, { error: 'Sesi tidak valid' });
        }

        try {
            // Toggle status
            await query(
                `UPDATE merk 
                 SET status = CASE WHEN status = 'aktif' THEN 'nonaktif' ELSE 'aktif' END,
                     updated_at = NOW()
                 WHERE id = ? AND pelanggan_id = ?`,
                [id, pelangganId]
            );

            return { success: true, message: 'Status merk berhasil diubah' };
        } catch (error) {
            console.error('Error toggling merk status:', error);
            return fail(500, { error: 'Gagal mengubah status merk' });
        }
    },

    // ----------------------------------------
    // REORDER - Ubah urutan merk
    // ----------------------------------------
    reorder: async ({ request, cookies }) => {
        const formData = await request.formData();
        const orders = formData.get('orders');

        if (!orders) {
            return fail(400, { error: 'Data urutan tidak valid' });
        }

        let pelangganId;
        try {
            const { getUserFromSession } = await import('$lib/auth.js');
            const user = getUserFromSession(cookies);
            pelangganId = user?.pelanggan_id;
        } catch (e) {
            return fail(401, { error: 'Sesi tidak valid' });
        }

        try {
            const orderList = JSON.parse(orders);

            for (const item of orderList) {
                await query(
                    `UPDATE merk SET urutan = ?, updated_at = NOW() WHERE id = ? AND pelanggan_id = ?`,
                    [item.urutan, item.id, pelangganId]
                );
            }

            return { success: true, message: 'Urutan merk berhasil diubah' };
        } catch (error) {
            console.error('Error reordering merk:', error);
            return fail(500, { error: 'Gagal mengubah urutan merk' });
        }
    }
};