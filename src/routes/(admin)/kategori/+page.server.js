import { query } from '$lib/db.js';

// ============================================
// LOAD FUNCTION - Mengambil semua data kategori
// ============================================
export async function load() {
    try {
        // Query untuk mengambil semua kategori, diurutkan dari yang terbaru
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
            ORDER BY id DESC
        `);
        
        return { 
            kategori: kategori 
        };
    } catch (error) {
        console.error('Database error:', error);
        return { 
            kategori: [] 
        };
    }
}

// ============================================
// ACTIONS - Handle form submissions
// ============================================
export const actions = {
    
    // ------------------------------------------
    // CREATE - Menambah kategori baru
    // ------------------------------------------
    create: async ({ request }) => {
        // Ambil data dari form
        const formData = await request.formData();
        
        const kode_kategori = formData.get('kode_kategori');
        const nama_kategori = formData.get('nama_kategori');
        const deskripsi = formData.get('deskripsi') || '';

        // Validasi input
        if (!kode_kategori || !nama_kategori) {
            return { 
                success: false, 
                message: 'Kode dan nama kategori wajib diisi!' 
            };
        }

        try {
            // Cek apakah kode sudah ada
            const existing = await query(
                'SELECT id FROM kategori WHERE kode_kategori = ?', 
                [kode_kategori]
            );
            
            if (existing.length > 0) {
                return { 
                    success: false, 
                    message: 'Kode kategori sudah digunakan!' 
                };
            }

            // Insert data baru
            await query(
                `INSERT INTO kategori (kode_kategori, nama_kategori, deskripsi, status) 
                 VALUES (?, ?, ?, 'aktif')`,
                [kode_kategori, nama_kategori, deskripsi]
            );
            
            return { 
                success: true, 
                message: 'Kategori berhasil ditambahkan!' 
            };
        } catch (error) {
            console.error('Error creating kategori:', error);
            return { 
                success: false, 
                message: 'Gagal menambahkan kategori. Silakan coba lagi.' 
            };
        }
    },

    // ------------------------------------------
    // UPDATE - Mengupdate kategori yang ada
    // ------------------------------------------
    update: async ({ request }) => {
        // Ambil data dari form
        const formData = await request.formData();
        
        const id = formData.get('id');
        const kode_kategori = formData.get('kode_kategori');
        const nama_kategori = formData.get('nama_kategori');
        const deskripsi = formData.get('deskripsi') || '';
        const status = formData.get('status');

        // Validasi input
        if (!id || !kode_kategori || !nama_kategori) {
            return { 
                success: false, 
                message: 'Data tidak lengkap!' 
            };
        }

        try {
            // Cek apakah kode sudah dipakai kategori lain
            const existing = await query(
                'SELECT id FROM kategori WHERE kode_kategori = ? AND id != ?', 
                [kode_kategori, id]
            );
            
            if (existing.length > 0) {
                return { 
                    success: false, 
                    message: 'Kode kategori sudah digunakan oleh kategori lain!' 
                };
            }

            // Update data
            await query(
                `UPDATE kategori 
                 SET kode_kategori = ?, 
                     nama_kategori = ?, 
                     deskripsi = ?, 
                     status = ?
                 WHERE id = ?`,
                [kode_kategori, nama_kategori, deskripsi, status, id]
            );
            
            return { 
                success: true, 
                message: 'Kategori berhasil diupdate!' 
            };
        } catch (error) {
            console.error('Error updating kategori:', error);
            return { 
                success: false, 
                message: 'Gagal mengupdate kategori. Silakan coba lagi.' 
            };
        }
    },

    // ------------------------------------------
    // DELETE - Menghapus kategori
    // ------------------------------------------
    delete: async ({ request }) => {
        // Ambil ID dari form
        const formData = await request.formData();
        const id = formData.get('id');

        // Validasi input
        if (!id) {
            return { 
                success: false, 
                message: 'ID kategori tidak valid!' 
            };
        }

        try {
            // Cek apakah kategori masih digunakan oleh produk
            const produkCount = await query(
                'SELECT COUNT(*) as count FROM produk WHERE kategori_id = ?', 
                [id]
            );
            
            if (produkCount[0].count > 0) {
                return { 
                    success: false, 
                    message: `Kategori tidak dapat dihapus karena masih digunakan oleh ${produkCount[0].count} produk!` 
                };
            }

            // Hapus kategori
            await query('DELETE FROM kategori WHERE id = ?', [id]);
            
            return { 
                success: true, 
                message: 'Kategori berhasil dihapus!' 
            };
        } catch (error) {
            console.error('Error deleting kategori:', error);
            return { 
                success: false, 
                message: 'Gagal menghapus kategori. Silakan coba lagi.' 
            };
        }
    }
};