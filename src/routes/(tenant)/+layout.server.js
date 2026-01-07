// ============================================
// TENANT LAYOUT SERVER - Proteksi Route Tenant
// File: src/routes/(tenant)/+layout.server.js
// ============================================

import { redirect } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/auth.js';

export async function load({ cookies, url }) {
    // Ambil user dari session
    const user = getUserFromSession(cookies);

    // Jika belum login, redirect ke login
    if (!user) {
        throw redirect(302, '/login?redirect=' + encodeURIComponent(url.pathname));
    }

    // Jika admin, redirect ke admin dashboard
    if (user.role === 'admin') {
        throw redirect(302, '/dashboard');
    }

    // Jika bukan tenant, tidak boleh akses
    if (user.role !== 'tenant') {
        throw redirect(302, '/login');
    }

    // Return user data untuk digunakan di layout dan halaman
    return {
        user: user
    };
}