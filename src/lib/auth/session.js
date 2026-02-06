// ============================================
// SESSION MANAGEMENT
// File: src/lib/auth/session.js
// Kelola session user (create, read, destroy)
// ============================================

import {
    DEFAULT_SESSION_DAYS,
    REMEMBER_SESSION_DAYS,
    SESSION_COOKIE_NAME,
    SESSION_TYPES
} from './constants.js';

import { PIN_SESSION_HOURS } from '../pin/constants.js';

/**
 * Mendapatkan user dari session cookie
 * 
 * @param {Object} cookies - SvelteKit cookies object
 * @returns {Object|null} - Data user atau null jika tidak ada/expired
 */
export function getUserFromSession(cookies) {
    const sessionData = cookies.get(SESSION_COOKIE_NAME);
    
    if (!sessionData) {
        return null;
    }

    try {
        // Decode session (base64)
        const decoded = Buffer.from(sessionData, 'base64').toString('utf-8');
        const user = JSON.parse(decoded);
        
        // Cek apakah session sudah expired
        if (user.expires_at && new Date(user.expires_at) < new Date()) {
            return null;
        }
        
        return user;
    } catch (error) {
        console.error('Session decode error:', error);
        return null;
    }
}

/**
 * Set session cookie untuk login email/password
 * 
 * @param {Object} cookies - SvelteKit cookies object
 * @param {Object} user - Data user untuk disimpan
 * @param {boolean} remember - Ingat login lebih lama (30 hari vs 7 hari)
 */
export function setSession(cookies, user, remember = false) {
    const maxAge = remember 
        ? 60 * 60 * 24 * REMEMBER_SESSION_DAYS
        : 60 * 60 * 24 * DEFAULT_SESSION_DAYS;
    
    const expiresAt = new Date(Date.now() + maxAge * 1000);
    
    const sessionUser = {
        ...user,
        logged_in_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        session_type: SESSION_TYPES.EMAIL
    };

    const sessionData = Buffer.from(JSON.stringify(sessionUser)).toString('base64');

    cookies.set(SESSION_COOKIE_NAME, sessionData, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: maxAge
    });
}

/**
 * Set session cookie untuk login PIN (durasi lebih pendek)
 * 
 * @param {Object} cookies - SvelteKit cookies object
 * @param {Object} user - Data user untuk disimpan
 */
export function setPinSession(cookies, user) {
    const maxAge = 60 * 60 * PIN_SESSION_HOURS; // Default 8 jam
    const expiresAt = new Date(Date.now() + maxAge * 1000);
    
    const sessionUser = {
        ...user,
        logged_in_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        session_type: SESSION_TYPES.PIN
    };

    const sessionData = Buffer.from(JSON.stringify(sessionUser)).toString('base64');
    
    cookies.set(SESSION_COOKIE_NAME, sessionData, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: maxAge
    });
}

/**
 * Hapus session (logout)
 * 
 * @param {Object} cookies - SvelteKit cookies object
 */
export function clearSession(cookies) {
    cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

/**
 * Refresh session (perpanjang waktu expired)
 * Berguna untuk activity-based session extension
 * 
 * @param {Object} cookies - SvelteKit cookies object
 * @param {Object} user - Data user dari session saat ini
 * @returns {boolean} - Berhasil atau tidak
 */
export function refreshSession(cookies, user) {
    if (!user) return false;

    try {
        const sessionType = user.session_type || SESSION_TYPES.EMAIL;
        
        if (sessionType === SESSION_TYPES.PIN) {
            setPinSession(cookies, user);
        } else {
            // Pertahankan setting remember jika ada
            const wasRemembered = user.expires_at && 
                (new Date(user.expires_at) - new Date(user.logged_in_at)) > (DEFAULT_SESSION_DAYS * 24 * 60 * 60 * 1000);
            setSession(cookies, user, wasRemembered);
        }
        
        return true;
    } catch (error) {
        console.error('Refresh session error:', error);
        return false;
    }
}

/**
 * Cek apakah session akan expired dalam waktu dekat
 * Berguna untuk menampilkan warning atau auto-refresh
 * 
 * @param {Object} user - Data user dari session
 * @param {number} minutesBefore - Berapa menit sebelum expired
 * @returns {boolean}
 */
export function isSessionExpiringSoon(user, minutesBefore = 30) {
    if (!user || !user.expires_at) return false;
    
    const expiresAt = new Date(user.expires_at);
    const warningTime = new Date(expiresAt.getTime() - (minutesBefore * 60 * 1000));
    
    return new Date() >= warningTime;
}

/**
 * Dapatkan sisa waktu session dalam menit
 * 
 * @param {Object} user - Data user dari session
 * @returns {number|null} - Sisa waktu dalam menit atau null
 */
export function getSessionRemainingMinutes(user) {
    if (!user || !user.expires_at) return null;
    
    const expiresAt = new Date(user.expires_at);
    const now = new Date();
    
    if (expiresAt <= now) return 0;
    
    return Math.ceil((expiresAt - now) / 60000);
}

/**
 * Dapatkan info session
 * 
 * @param {Object} user - Data user dari session
 * @returns {Object} - Info session
 */
export function getSessionInfo(user) {
    if (!user) {
        return {
            isValid: false,
            type: null,
            loggedInAt: null,
            expiresAt: null,
            remainingMinutes: null,
            isExpiringSoon: false
        };
    }

    return {
        isValid: true,
        type: user.session_type || SESSION_TYPES.EMAIL,
        loggedInAt: user.logged_in_at,
        expiresAt: user.expires_at,
        remainingMinutes: getSessionRemainingMinutes(user),
        isExpiringSoon: isSessionExpiringSoon(user)
    };
}

/**
 * Update data user di session tanpa mengubah waktu expired
 * Berguna untuk update profile tanpa logout
 * 
 * @param {Object} cookies - SvelteKit cookies object
 * @param {Object} currentUser - Data user saat ini
 * @param {Object} updates - Data yang akan di-update
 */
export function updateSessionUser(cookies, currentUser, updates) {
    if (!currentUser) return;

    const updatedUser = {
        ...currentUser,
        ...updates,
        // Pertahankan metadata session
        logged_in_at: currentUser.logged_in_at,
        expires_at: currentUser.expires_at,
        session_type: currentUser.session_type
    };

    // Hitung sisa waktu
    const expiresAt = new Date(currentUser.expires_at);
    const now = new Date();
    const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

    const sessionData = Buffer.from(JSON.stringify(updatedUser)).toString('base64');

    cookies.set(SESSION_COOKIE_NAME, sessionData, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: remainingSeconds
    });
}