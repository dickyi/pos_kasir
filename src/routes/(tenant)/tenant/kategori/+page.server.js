/**
 * ============================================
 * KATEGORI TENANT - SERVER (With Permission Check)
 * File: src/routes/(tenant)/tenant/kategori/+page.server.js
 * ============================================
 */

import { query } from '$lib/db.js';
import { fail } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/auth.js';

/**
 * LOAD FUNCTION - Mengambil data kategori per tenant
 */
export async function load({ parent, cookies }) {
    const parentData = await parent();
    let user = parentData?.user;
    let tenantUser = parentData?.tenantUser;
    
    if (!user || !user.pelanggan_id) {
        user = getUserFromSession(cookies);
    }

    if (!user || !user.pelanggan_id) {
        return {
            kategori: [],
            tenantUser: null,
            error: 'User tidak valid'
        };
    }

    try {
        const kategori = await query(`
            SELECT
                id,
                kode_kategori,
                nama_kategori,
                deskripsi,
                status,
                created_at,
                updated_at
            FROM kategori
            WHERE pelanggan_id = ?
            ORDER BY id DESC
        `, [user.pelanggan_id]);

        return {
            kategori: kategori || [],
            tenantUser: tenantUser || null
        };
    } catch (error) {
        console.error('Error loading kategori:', error);
        return {
            kategori: [],
            tenantUser: null,
            error: 'Gagal memuat data: ' + error.message
        };
    }
}

/**
 * ACTIONS - Handle form submissions
 */
export const actions = {

    // ------------------------------------------
    // CREATE - Menambah kategori baru (Owner & Admin only)
    // ------------------------------------------
    create: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);

        if (!user || !user.pelanggan_id) {
            return fail(401, {
                success: false,
                message: 'Sesi tidak valid. Silakan login ulang.'
            });
        }

        // Permission check: Kasir tidak boleh tambah kategori
        if (user.tenant_role === 'kasir') {
            return fail(403, {
                success: false,
                message: 'Anda tidak memiliki izin untuk menambah kategori.'
            });
        }

        const formData = await request.formData();

        const kode_kategori = formData.get('kode_kategori')?.trim();
        const nama_kategori = formData.get('nama_kategori')?.trim();
        const deskripsi = formData.get('deskripsi')?.trim() || '';

        if (!kode_kategori || !nama_kategori) {
            return fail(400, {
                success: false,
                message: 'Kode dan nama kategori wajib diisi!'
            });
        }

        try {
            const existing = await query(
                'SELECT id FROM kategori WHERE kode_kategori = ? AND pelanggan_id = ?',
                [kode_kategori, user.pelanggan_id]
            );

            if (existing && existing.length > 0) {
                return fail(400, {
                    success: false,
                    message: 'Kode kategori sudah digunakan!'
                });
            }

            await query(
                `INSERT INTO kategori (pelanggan_id, kode_kategori, nama_kategori, deskripsi, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, 'aktif', NOW(), NOW())`,
                [user.pelanggan_id, kode_kategori, nama_kategori, deskripsi]
            );

            return {
                success: true,
                message: 'Kategori berhasil ditambahkan!'
            };
        } catch (error) {
            console.error('Error creating kategori:', error.message);
            return fail(500, {
                success: false,
                message: 'Gagal menambahkan kategori. Silakan coba lagi.'
            });
        }
    },

    // ------------------------------------------
    // UPDATE - Mengupdate kategori (Owner & Admin only)
    // ------------------------------------------
    update: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);

        if (!user || !user.pelanggan_id) {
            return fail(401, {
                success: false,
                message: 'Sesi tidak valid. Silakan login ulang.'
            });
        }

        // Permission check: Kasir tidak boleh edit kategori
        if (user.tenant_role === 'kasir') {
            return fail(403, {
                success: false,
                message: 'Anda tidak memiliki izin untuk mengedit kategori.'
            });
        }

        const formData = await request.formData();

        const id = formData.get('id');
        const kode_kategori = formData.get('kode_kategori')?.trim();
        const nama_kategori = formData.get('nama_kategori')?.trim();
        const deskripsi = formData.get('deskripsi')?.trim() || '';
        const status = formData.get('status') || 'aktif';

        if (!id || !kode_kategori || !nama_kategori) {
            return fail(400, {
                success: false,
                message: 'Data tidak lengkap!'
            });
        }

        try {
            const kategori = await query(
                'SELECT id FROM kategori WHERE id = ? AND pelanggan_id = ?',
                [id, user.pelanggan_id]
            );

            if (!kategori || kategori.length === 0) {
                return fail(404, {
                    success: false,
                    message: 'Kategori tidak ditemukan!'
                });
            }

            const existing = await query(
                'SELECT id FROM kategori WHERE kode_kategori = ? AND id != ? AND pelanggan_id = ?',
                [kode_kategori, id, user.pelanggan_id]
            );

            if (existing && existing.length > 0) {
                return fail(400, {
                    success: false,
                    message: 'Kode kategori sudah digunakan oleh kategori lain!'
                });
            }

            await query(
                `UPDATE kategori
                 SET kode_kategori = ?,
                     nama_kategori = ?,
                     deskripsi = ?,
                     status = ?,
                     updated_at = NOW()
                 WHERE id = ? AND pelanggan_id = ?`,
                [kode_kategori, nama_kategori, deskripsi, status, id, user.pelanggan_id]
            );

            return {
                success: true,
                message: 'Kategori berhasil diupdate!'
            };
        } catch (error) {
            console.error('Error updating kategori:', error.message);
            return fail(500, {
                success: false,
                message: 'Gagal mengupdate kategori. Silakan coba lagi.'
            });
        }
    },

    // ------------------------------------------
    // DELETE - Menghapus kategori (Owner & Admin only)
    // ------------------------------------------
    delete: async ({ request, cookies }) => {
        const user = getUserFromSession(cookies);

        if (!user || !user.pelanggan_id) {
            return fail(401, {
                success: false,
                message: 'Sesi tidak valid. Silakan login ulang.'
            });
        }

        // Permission check: Kasir tidak boleh hapus kategori
        if (user.tenant_role === 'kasir') {
            return fail(403, {
                success: false,
                message: 'Anda tidak memiliki izin untuk menghapus kategori.'
            });
        }

        const formData = await request.formData();
        const id = formData.get('id');

        if (!id) {
            return fail(400, {
                success: false,
                message: 'ID kategori tidak valid!'
            });
        }

        try {
            const kategori = await query(
                'SELECT id, nama_kategori FROM kategori WHERE id = ? AND pelanggan_id = ?',
                [id, user.pelanggan_id]
            );

            if (!kategori || kategori.length === 0) {
                return fail(404, {
                    success: false,
                    message: 'Kategori tidak ditemukan!'
                });
            }

            const namaKategori = kategori[0].nama_kategori;

            const produkCount = await query(
                'SELECT COUNT(*) as count FROM produk WHERE kategori_id = ? AND pelanggan_id = ?',
                [id, user.pelanggan_id]
            );

            if (produkCount[0]?.count > 0) {
                return fail(400, {
                    success: false,
                    message: `Kategori tidak dapat dihapus karena masih digunakan oleh ${produkCount[0].count} produk!`
                });
            }

            await query(
                'DELETE FROM kategori WHERE id = ? AND pelanggan_id = ?',
                [id, user.pelanggan_id]
            );

            return {
                success: true,
                message: `Kategori "${namaKategori}" berhasil dihapus!`
            };
        } catch (error) {
            console.error('Error deleting kategori:', error.message);
            return fail(500, {
                success: false,
                message: 'Gagal menghapus kategori. Silakan coba lagi.'
            });
        }
    }
};