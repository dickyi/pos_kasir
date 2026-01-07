import { query } from '$lib/db.js';

// ============================================
// LOAD FUNCTION - Mengambil data produk & kategori
// ============================================
export async function load() {
    try {
        // Query produk dengan JOIN ke kategori untuk mendapatkan nama kategori
        const produk = await query(`
            SELECT 
                p.id,
                p.kode_produk,
                p.nama_produk,
                p.kategori_id,
                p.harga_beli,
                p.harga_jual,
                p.stok,
                p.satuan,
                p.gambar,
                p.status,
                p.created_at,
                p.updated_at,
                k.nama_kategori
            FROM produk p
            LEFT JOIN kategori k ON p.kategori_id = k.id
            ORDER BY p.id DESC
        `);
        
        // Query semua kategori yang aktif untuk dropdown
        const kategori = await query(`
            SELECT id, kode_kategori, nama_kategori 
            FROM kategori 
            WHERE status = 'aktif'
            ORDER BY nama_kategori ASC
        `);
        
        return { 
            produk: produk,
            kategori: kategori
        };
    } catch (error) {
        console.error('Database error:', error);
        return { 
            produk: [],
            kategori: []
        };
    }
}

// ============================================
// ACTIONS - Handle form submissions
// ============================================
export const actions = {
    
    // ------------------------------------------
    // CREATE - Menambah produk baru
    // ------------------------------------------
    create: async ({ request }) => {
        // Ambil data dari form
        const formData = await request.formData();
        
        const kode_produk = formData.get('kode_produk');
        const nama_produk = formData.get('nama_produk');
        const kategori_id = formData.get('kategori_id') || null;
        const harga_beli = parseInt(formData.get('harga_beli')) || 0;
        const harga_jual = parseInt(formData.get('harga_jual')) || 0;
        const stok = parseInt(formData.get('stok')) || 0;
        const satuan = formData.get('satuan') || 'pcs';

        // Validasi input
        if (!kode_produk || !nama_produk) {
            return { 
                success: false, 
                message: 'Kode dan nama produk wajib diisi!' 
            };
        }

        // Validasi harga
        if (harga_jual < harga_beli) {
            return { 
                success: false, 
                message: 'Harga jual tidak boleh lebih kecil dari harga beli!' 
            };
        }

        try {
            // Cek apakah kode sudah ada
            const existing = await query(
                'SELECT id FROM produk WHERE kode_produk = ?', 
                [kode_produk]
            );
            
            if (existing.length > 0) {
                return { 
                    success: false, 
                    message: 'Kode produk sudah digunakan!' 
                };
            }

            // Insert data baru
            await query(
                `INSERT INTO produk (
                    kode_produk, nama_produk, kategori_id, 
                    harga_beli, harga_jual, stok, satuan, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'aktif')`,
                [kode_produk, nama_produk, kategori_id, harga_beli, harga_jual, stok, satuan]
            );
            
            return { 
                success: true, 
                message: 'Produk berhasil ditambahkan!' 
            };
        } catch (error) {
            console.error('Error creating produk:', error);
            return { 
                success: false, 
                message: 'Gagal menambahkan produk. Silakan coba lagi.' 
            };
        }
    },

    // ------------------------------------------
    // UPDATE - Mengupdate produk yang ada
    // ------------------------------------------
    update: async ({ request }) => {
        // Ambil data dari form
        const formData = await request.formData();
        
        const id = formData.get('id');
        const kode_produk = formData.get('kode_produk');
        const nama_produk = formData.get('nama_produk');
        const kategori_id = formData.get('kategori_id') || null;
        const harga_beli = parseInt(formData.get('harga_beli')) || 0;
        const harga_jual = parseInt(formData.get('harga_jual')) || 0;
        const stok = parseInt(formData.get('stok')) || 0;
        const satuan = formData.get('satuan') || 'pcs';
        const status = formData.get('status');

        // Validasi input
        if (!id || !kode_produk || !nama_produk) {
            return { 
                success: false, 
                message: 'Data tidak lengkap!' 
            };
        }

        // Validasi harga
        if (harga_jual < harga_beli) {
            return { 
                success: false, 
                message: 'Harga jual tidak boleh lebih kecil dari harga beli!' 
            };
        }

        try {
            // Cek apakah kode sudah dipakai produk lain
            const existing = await query(
                'SELECT id FROM produk WHERE kode_produk = ? AND id != ?', 
                [kode_produk, id]
            );
            
            if (existing.length > 0) {
                return { 
                    success: false, 
                    message: 'Kode produk sudah digunakan oleh produk lain!' 
                };
            }

            // Update data
            await query(
                `UPDATE produk 
                 SET kode_produk = ?, 
                     nama_produk = ?, 
                     kategori_id = ?,
                     harga_beli = ?,
                     harga_jual = ?,
                     stok = ?,
                     satuan = ?,
                     status = ?
                 WHERE id = ?`,
                [kode_produk, nama_produk, kategori_id, harga_beli, harga_jual, stok, satuan, status, id]
            );
            
            return { 
                success: true, 
                message: 'Produk berhasil diupdate!' 
            };
        } catch (error) {
            console.error('Error updating produk:', error);
            return { 
                success: false, 
                message: 'Gagal mengupdate produk. Silakan coba lagi.' 
            };
        }
    },

    // ------------------------------------------
    // DELETE - Menghapus produk
    // ------------------------------------------
    delete: async ({ request }) => {
        // Ambil ID dari form
        const formData = await request.formData();
        const id = formData.get('id');

        // Validasi input
        if (!id) {
            return { 
                success: false, 
                message: 'ID produk tidak valid!' 
            };
        }

        try {
            // Hapus produk
            await query('DELETE FROM produk WHERE id = ?', [id]);
            
            return { 
                success: true, 
                message: 'Produk berhasil dihapus!' 
            };
        } catch (error) {
            console.error('Error deleting produk:', error);
            return { 
                success: false, 
                message: 'Gagal menghapus produk. Silakan coba lagi.' 
            };
        }
    },

    // ------------------------------------------
    // UPDATE STOK - Update stok produk saja
    // ------------------------------------------
    updateStok: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const stok = parseInt(formData.get('stok')) || 0;

        if (!id) {
            return { 
                success: false, 
                message: 'ID produk tidak valid!' 
            };
        }

        try {
            await query('UPDATE produk SET stok = ? WHERE id = ?', [stok, id]);
            
            return { 
                success: true, 
                message: 'Stok berhasil diupdate!' 
            };
        } catch (error) {
            console.error('Error updating stok:', error);
            return { 
                success: false, 
                message: 'Gagal mengupdate stok.' 
            };
        }
    }
};