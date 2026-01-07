import { query } from '$lib/db.js';

// LOAD - Ambil semua data pelanggan
export async function load() {
    try {
        const pelanggan = await query('SELECT * FROM pelanggan ORDER BY id DESC');
        return { pelanggan };
    } catch (error) {
        console.error('Database error:', error);
        return { pelanggan: [] };
    }
}

// ACTIONS - Handle form submissions
export const actions = {
    // CREATE - Tambah pelanggan baru
    create: async ({ request }) => {
        const formData = await request.formData();
        
        const kode_pelanggan = formData.get('kode_pelanggan');
        const nama_bisnis = formData.get('nama_bisnis');
        const nama_pemilik = formData.get('nama_pemilik');
        const email = formData.get('email');
        const no_telepon = formData.get('no_telepon');
        const alamat = formData.get('alamat');

        try {
            await query(
                `INSERT INTO pelanggan (kode_pelanggan, nama_bisnis, nama_pemilik, email, no_telepon, alamat) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [kode_pelanggan, nama_bisnis, nama_pemilik, email, no_telepon, alamat]
            );
            return { success: true, message: 'Pelanggan berhasil ditambahkan!' };
        } catch (error) {
            console.error('Error:', error);
            return { success: false, message: 'Gagal menambahkan pelanggan.' };
        }
    },

    // UPDATE - Edit pelanggan
    update: async ({ request }) => {
        const formData = await request.formData();
        
        const id = formData.get('id');
        const kode_pelanggan = formData.get('kode_pelanggan');
        const nama_bisnis = formData.get('nama_bisnis');
        const nama_pemilik = formData.get('nama_pemilik');
        const email = formData.get('email');
        const no_telepon = formData.get('no_telepon');
        const alamat = formData.get('alamat');
        const status = formData.get('status');

        try {
            await query(
                `UPDATE pelanggan SET 
                    kode_pelanggan = ?, nama_bisnis = ?, nama_pemilik = ?, 
                    email = ?, no_telepon = ?, alamat = ?, status = ?
                 WHERE id = ?`,
                [kode_pelanggan, nama_bisnis, nama_pemilik, email, no_telepon, alamat, status, id]
            );
            return { success: true, message: 'Pelanggan berhasil diupdate!' };
        } catch (error) {
            console.error('Error:', error);
            return { success: false, message: 'Gagal mengupdate pelanggan.' };
        }
    },

    // DELETE - Hapus pelanggan
    delete: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');

        try {
            await query('DELETE FROM pelanggan WHERE id = ?', [id]);
            return { success: true, message: 'Pelanggan berhasil dihapus!' };
        } catch (error) {
            console.error('Error:', error);
            return { success: false, message: 'Gagal menghapus pelanggan.' };
        }
    }
};