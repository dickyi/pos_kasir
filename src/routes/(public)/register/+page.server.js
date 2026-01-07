import { query } from '$lib/db.js';
import { fail, redirect } from '@sveltejs/kit';

// ============================================
// LOAD FUNCTION
// ============================================
export async function load() {
    // Bisa digunakan untuk load data tambahan jika diperlukan
    return {};
}

// ============================================
// ACTIONS
// ============================================
export const actions = {
    
    // ------------------------------------------
    // REGISTER - Mendaftarkan tenant UMKM baru
    // ------------------------------------------
    register: async ({ request }) => {
        const formData = await request.formData();
        
        // Ambil data dari form
        const nama_bisnis = formData.get('nama_bisnis')?.toString().trim();
        const jenis_usaha = formData.get('jenis_usaha')?.toString().trim();
        const nama_pemilik = formData.get('nama_pemilik')?.toString().trim();
        const email = formData.get('email')?.toString().trim().toLowerCase();
        const no_telepon = formData.get('no_telepon')?.toString().trim();
        const alamat = formData.get('alamat')?.toString().trim();
        const kota = formData.get('kota')?.toString().trim();
        const password = formData.get('password')?.toString();
        const confirm_password = formData.get('confirm_password')?.toString();
        const agree_terms = formData.get('agree_terms');

        // ============================================
        // VALIDASI INPUT
        // ============================================
        
        // Validasi field wajib
        if (!nama_bisnis || !nama_pemilik || !email || !no_telepon || !password) {
            return fail(400, {
                success: false,
                message: 'Semua field bertanda * wajib diisi!',
                data: { nama_bisnis, jenis_usaha, nama_pemilik, email, no_telepon, alamat, kota }
            });
        }

        // Validasi nama bisnis (minimal 3 karakter)
        if (nama_bisnis.length < 3) {
            return fail(400, {
                success: false,
                message: 'Nama bisnis minimal 3 karakter!',
                data: { nama_bisnis, jenis_usaha, nama_pemilik, email, no_telepon, alamat, kota }
            });
        }

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return fail(400, {
                success: false,
                message: 'Format email tidak valid!',
                data: { nama_bisnis, jenis_usaha, nama_pemilik, email, no_telepon, alamat, kota }
            });
        }

        // Validasi nomor telepon (minimal 10 digit)
        const phoneRegex = /^[0-9]{10,15}$/;
        if (!phoneRegex.test(no_telepon.replace(/[-\s]/g, ''))) {
            return fail(400, {
                success: false,
                message: 'Nomor telepon tidak valid! Gunakan format 08xxxxxxxxxx',
                data: { nama_bisnis, jenis_usaha, nama_pemilik, email, no_telepon, alamat, kota }
            });
        }

        // Validasi password (minimal 6 karakter)
        if (password.length < 6) {
            return fail(400, {
                success: false,
                message: 'Password minimal 6 karakter!',
                data: { nama_bisnis, jenis_usaha, nama_pemilik, email, no_telepon, alamat, kota }
            });
        }

        // Validasi konfirmasi password
        if (password !== confirm_password) {
            return fail(400, {
                success: false,
                message: 'Konfirmasi password tidak cocok!',
                data: { nama_bisnis, jenis_usaha, nama_pemilik, email, no_telepon, alamat, kota }
            });
        }

        // Validasi persetujuan syarat & ketentuan
        if (!agree_terms) {
            return fail(400, {
                success: false,
                message: 'Anda harus menyetujui Syarat & Ketentuan!',
                data: { nama_bisnis, jenis_usaha, nama_pemilik, email, no_telepon, alamat, kota }
            });
        }

        try {
            // ============================================
            // CEK EMAIL SUDAH TERDAFTAR
            // ============================================
            const existingEmail = await query(
                'SELECT id FROM pelanggan WHERE email = ?',
                [email]
            );

            if (existingEmail.length > 0) {
                return fail(400, {
                    success: false,
                    message: 'Email sudah terdaftar! Silakan gunakan email lain atau login.',
                    data: { nama_bisnis, jenis_usaha, nama_pemilik, email, no_telepon, alamat, kota }
                });
            }

            // ============================================
            // GENERATE KODE PELANGGAN
            // ============================================
            const lastPelanggan = await query(
                'SELECT kode_pelanggan FROM pelanggan ORDER BY id DESC LIMIT 1'
            );

            let newKode = 'PLG001';
            if (lastPelanggan.length > 0) {
                const lastNum = parseInt(lastPelanggan[0].kode_pelanggan.replace('PLG', '')) || 0;
                newKode = `PLG${String(lastNum + 1).padStart(3, '0')}`;
            }

            // ============================================
            // SIMPAN KE DATABASE
            // ============================================
            // Note: Di production, password harus di-hash menggunakan bcrypt!
            // Untuk sekarang kita simpan plain text dulu (TIDAK AMAN untuk production)
            
            await query(
                `INSERT INTO pelanggan (
                    kode_pelanggan,
                    nama_bisnis,
                    nama_pemilik,
                    email,
                    no_telepon,
                    alamat,
                    status,
                    tanggal_daftar
                ) VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_DATE)`,
                [
                    newKode,
                    nama_bisnis,
                    nama_pemilik,
                    email,
                    no_telepon,
                    alamat ? `${alamat}${kota ? ', ' + kota : ''}` : kota || ''
                ]
            );

            // ============================================
            // REDIRECT KE HALAMAN SUKSES
            // ============================================
            return {
                success: true,
                message: 'Pendaftaran berhasil! Tim kami akan menghubungi Anda dalam 1x24 jam untuk verifikasi.',
                kode: newKode
            };

        } catch (error) {
            console.error('Registration error:', error);
            return fail(500, {
                success: false,
                message: 'Terjadi kesalahan pada server. Silakan coba lagi.',
                data: { nama_bisnis, jenis_usaha, nama_pemilik, email, no_telepon, alamat, kota }
            });
        }
    }
};