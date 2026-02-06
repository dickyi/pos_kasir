// ============================================
// HOOKS SERVER - Global Request Handler
// File: src/hooks.server.js
// ============================================

import { getUserFromSession } from '$lib/auth.js';

/**
 * Handle setiap request yang masuk
 * Set locals.user agar bisa diakses di +page.server.js
 */
export async function handle({ event, resolve }) {
    // Get user dari session cookie
    const user = getUserFromSession(event.cookies);
    
    // Set ke locals agar bisa diakses di semua +page.server.js
    event.locals.user = user;
    
    // Debug log (bisa dihapus di production)
    // console.log('Hooks: user =', user ? user.nama : 'null');
    
    // Lanjutkan request
    const response = await resolve(event);
    
    return response;
}