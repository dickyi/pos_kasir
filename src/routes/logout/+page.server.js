// ============================================
// LOGOUT ACTION
// File: src/routes/logout/+page.server.js
// ============================================

import { redirect } from '@sveltejs/kit';
import { clearSession } from '$lib/auth.js';

// Redirect GET request ke home
export async function load() {
    throw redirect(302, '/');
}

export const actions = {
    default: async ({ cookies }) => {
        // Hapus session
        clearSession(cookies);
        
        // Redirect ke login
        throw redirect(302, '/login');
    }
};