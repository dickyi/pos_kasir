// ============================================
// LOGIN PAGE SERVER
// File: src/routes/(public)/login/+page.server.js
// ============================================

import { fail, redirect } from '@sveltejs/kit';
import { verifyLogin, setSession, getUserFromSession } from '$lib/auth.js';

// ============================================
// LOAD - Cek jika sudah login, redirect
// ============================================
export async function load({ cookies }) {
    const user = getUserFromSession(cookies);
    
    // Jika sudah login, redirect sesuai role
    if (user) {
        if (user.role === 'admin') {
            throw redirect(302, '/dashboard');
        } else {
            throw redirect(302, '/tenant/dashboard');
        }
    }

    return {};
}

// ============================================
// ACTIONS
// ============================================
export const actions = {
    
    // ------------------------------------------
    // LOGIN ACTION
    // ------------------------------------------
    login: async ({ request, cookies }) => {
        const formData = await request.formData();
        
        const email = formData.get('email')?.toString().trim().toLowerCase();
        const password = formData.get('password')?.toString();
        const remember = formData.get('remember') === 'on';

        // Validasi input
        if (!email || !password) {
            return fail(400, {
                success: false,
                message: 'Email dan password wajib diisi!',
                email: email
            });
        }

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return fail(400, {
                success: false,
                message: 'Format email tidak valid!',
                email: email
            });
        }

        // Verifikasi login
        const result = await verifyLogin(email, password);

        if (!result.success) {
            return fail(400, {
                success: false,
                message: result.message,
                email: email
            });
        }

        // Set session cookie
        setSession(cookies, result.user);

        // Redirect berdasarkan role
        if (result.user.role === 'admin') {
            throw redirect(302, '/dashboard');
        } else {
            throw redirect(302, '/tenant/dashboard');
        }
    }
};