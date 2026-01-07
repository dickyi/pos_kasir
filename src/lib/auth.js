// ============================================
// AUTH HELPER - Autentikasi & Session Management
// File: src/lib/auth.js
// ============================================

import { query } from './db.js';

/**
 * Verifikasi login user
 * @param {string} email - Email user
 * @param {string} password - Password user
 * @returns {Object|null} - Data user jika valid, null jika tidak
 */
export async function verifyLogin(email, password) {
    try {
        // Query user berdasarkan email
        const users = await query(
            `SELECT 
                u.id,
                u.email,
                u.password,
                u.nama,
                u.role,
                u.pelanggan_id,
                u.status,
                p.nama_bisnis,
                p.kode_pelanggan
            FROM users u
            LEFT JOIN pelanggan p ON u.pelanggan_id = p.id
            WHERE u.email = ?`,
            [email.toLowerCase()]
        );

        // Jika user tidak ditemukan
        if (users.length === 0) {
            return { success: false, message: 'Email tidak terdaftar!' };
        }

        const user = users[0];

        // Cek status user
        if (user.status === 'pending') {
            return { success: false, message: 'Akun Anda masih menunggu verifikasi. Silakan hubungi admin.' };
        }

        if (user.status === 'nonaktif') {
            return { success: false, message: 'Akun Anda telah dinonaktifkan. Silakan hubungi admin.' };
        }

        // Verifikasi password (plain text untuk development)
        // Di production, gunakan bcrypt.compare()
        if (user.password !== password) {
            return { success: false, message: 'Password salah!' };
        }

        // Update last_login
        await query(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        // Return user data (tanpa password)
        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                nama: user.nama,
                role: user.role,
                pelanggan_id: user.pelanggan_id,
                nama_bisnis: user.nama_bisnis || null,
                kode_pelanggan: user.kode_pelanggan || null
            }
        };

    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Terjadi kesalahan server. Silakan coba lagi.' };
    }
}

/**
 * Mendapatkan user dari session
 * @param {Object} cookies - SvelteKit cookies object
 * @returns {Object|null} - Data user atau null
 */
export function getUserFromSession(cookies) {
    const sessionData = cookies.get('session');
    
    if (!sessionData) {
        return null;
    }

    try {
        // Decode session (base64)
        const decoded = Buffer.from(sessionData, 'base64').toString('utf-8');
        const user = JSON.parse(decoded);
        return user;
    } catch (error) {
        console.error('Session decode error:', error);
        return null;
    }
}

/**
 * Set session cookie
 * @param {Object} cookies - SvelteKit cookies object
 * @param {Object} user - Data user untuk disimpan
 */
export function setSession(cookies, user) {
    // Encode user data ke base64
    const sessionData = Buffer.from(JSON.stringify(user)).toString('base64');
    
    // Set cookie dengan opsi keamanan
    cookies.set('session', sessionData, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: false, // Set true di production dengan HTTPS
        maxAge: 60 * 60 * 24 * 7 // 7 hari
    });
}

/**
 * Hapus session (logout)
 * @param {Object} cookies - SvelteKit cookies object
 */
export function clearSession(cookies) {
    cookies.delete('session', { path: '/' });
}

/**
 * Cek apakah user adalah admin
 * @param {Object} user - Data user
 * @returns {boolean}
 */
export function isAdmin(user) {
    return user && user.role === 'admin';
}

/**
 * Cek apakah user adalah tenant
 * @param {Object} user - Data user
 * @returns {boolean}
 */
export function isTenant(user) {
    return user && user.role === 'tenant';
}