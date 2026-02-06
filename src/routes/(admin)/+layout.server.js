// ============================================
// ADMIN LAYOUT SERVER - Proteksi Route Admin
// File: src/routes/(admin)/+layout.server.js
// ============================================

import { redirect } from '@sveltejs/kit';
import { getUserFromSession, isAdmin } from '$lib/auth.js';

export async function load({ cookies, url }) {
    // Ambil user dari session
    const user = getUserFromSession(cookies);

    // Jika belum login, redirect ke login
    if (!user) {
        throw redirect(302, '/login?redirect=' + encodeURIComponent(url.pathname));
    }

    // Cek apakah user adalah admin platform (super_admin, admin, atau support)
    // Menggunakan helper function dari auth.js
    if (!isAdmin(user)) {
        // Jika bukan admin, redirect ke tenant dashboard
        throw redirect(302, '/tenant/dashboard');
    }

    // Return user data untuk digunakan di layout dan halaman
    return {
        user: {
            id: user.id,
            nama: user.nama,
            email: user.email,
            role: user.role,  // super_admin, admin, atau support
            logged_in_at: user.logged_in_at
        }
    };
}