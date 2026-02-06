// ============================================
// PIN VALIDATION
// File: src/lib/pin/validation.js
// Validasi PIN (format, keamanan, duplikat)
// ============================================

import { query } from '../db.js';
import {
    PIN_LENGTH,
    PIN_REGEX,
    SAME_DIGITS_REGEX,
    WEAK_PINS_HARDCODED,
    PIN_ERROR_MESSAGES
} from './constants.js';

/**
 * Validasi format PIN (client-side compatible)
 * Bisa digunakan di frontend tanpa akses database
 * 
 * @param {string} pin - PIN yang akan divalidasi
 * @returns {{ valid: boolean, message: string }}
 */
export function validatePinFormat(pin) {
    // Cek apakah PIN ada
    if (!pin || typeof pin !== 'string') {
        return { valid: false, message: PIN_ERROR_MESSAGES.REQUIRED };
    }

    // Cek panjang PIN
    if (pin.length !== PIN_LENGTH) {
        return { valid: false, message: PIN_ERROR_MESSAGES.INVALID_LENGTH };
    }

    // Cek apakah hanya angka
    if (!PIN_REGEX.test(pin)) {
        return { valid: false, message: PIN_ERROR_MESSAGES.INVALID_FORMAT };
    }

    return { valid: true, message: 'Format PIN valid' };
}

/**
 * Cek apakah PIN lemah (tanpa query database)
 * Quick check untuk validasi awal
 * 
 * @param {string} pin - PIN yang akan dicek
 * @returns {{ isWeak: boolean, reason: string | null }}
 */
export function isWeakPin(pin) {
    if (!pin || pin.length !== PIN_LENGTH) {
        return { isWeak: true, reason: 'Format tidak valid' };
    }

    // Cek semua angka sama (111111, 222222, etc.)
    if (SAME_DIGITS_REGEX.test(pin)) {
        return { isWeak: true, reason: 'Semua angka sama' };
    }

    // Cek urutan naik
    const ascending = '0123456789';
    if (ascending.includes(pin)) {
        return { isWeak: true, reason: 'Urutan naik' };
    }

    // Cek urutan turun
    const descending = '9876543210';
    if (descending.includes(pin)) {
        return { isWeak: true, reason: 'Urutan turun' };
    }

    // Cek dari hardcoded list (backup)
    if (WEAK_PINS_HARDCODED.includes(pin)) {
        return { isWeak: true, reason: 'PIN umum' };
    }

    return { isWeak: false, reason: null };
}

/**
 * Cek apakah PIN ada di tabel weak_pins database
 * 
 * @param {string} pin - PIN yang akan dicek
 * @returns {Promise<{ isWeak: boolean, reason: string | null }>}
 */
export async function isWeakPinFromDatabase(pin) {
    try {
        const results = await query(
            `SELECT reason FROM weak_pins WHERE pin = ?`,
            [pin]
        );

        if (results.length > 0) {
            return { isWeak: true, reason: results[0].reason };
        }

        return { isWeak: false, reason: null };
    } catch (error) {
        // Jika tabel tidak ada atau error, fallback ke hardcoded check
        console.warn('weak_pins table check failed, using hardcoded list:', error.message);
        return isWeakPin(pin);
    }
}

/**
 * Cek apakah PIN sudah digunakan user lain di tenant yang sama
 * 
 * @param {string} pin - PIN yang akan dicek
 * @param {number} pelangganId - ID tenant
 * @param {number|null} excludeUserId - ID user yang dikecualikan (untuk update)
 * @returns {Promise<{ isDuplicate: boolean, usedBy: string | null }>}
 */
export async function isPinDuplicate(pin, pelangganId, excludeUserId = null) {
    try {
        let sql = `
            SELECT id, nama FROM tenant_users 
            WHERE pelanggan_id = ? 
            AND pin = ? 
            AND deleted_at IS NULL
        `;
        const params = [pelangganId, pin];

        if (excludeUserId) {
            sql += ' AND id != ?';
            params.push(excludeUserId);
        }

        const results = await query(sql, params);

        if (results.length > 0) {
            return { isDuplicate: true, usedBy: results[0].nama };
        }

        return { isDuplicate: false, usedBy: null };
    } catch (error) {
        console.error('PIN duplicate check error:', error);
        throw error;
    }
}

/**
 * Validasi PIN secara lengkap (format + keamanan + duplikat)
 * Ini adalah fungsi utama untuk validasi sebelum menyimpan PIN
 * 
 * @param {string} pin - PIN yang akan divalidasi
 * @param {number} pelangganId - ID tenant
 * @param {number|null} excludeUserId - ID user yang dikecualikan (untuk update)
 * @returns {Promise<{ valid: boolean, message: string }>}
 */
export async function validatePin(pin, pelangganId, excludeUserId = null) {
    try {
        // 1. Validasi format
        const formatCheck = validatePinFormat(pin);
        if (!formatCheck.valid) {
            return formatCheck;
        }

        // 2. Cek PIN lemah (quick check)
        const weakCheck = isWeakPin(pin);
        if (weakCheck.isWeak) {
            return { 
                valid: false, 
                message: `PIN tidak aman: ${weakCheck.reason}. Gunakan PIN yang lebih kuat.` 
            };
        }

        // 3. Cek PIN lemah dari database
        const weakDbCheck = await isWeakPinFromDatabase(pin);
        if (weakDbCheck.isWeak) {
            return { 
                valid: false, 
                message: `PIN tidak aman: ${weakDbCheck.reason}. Gunakan PIN yang lebih kuat.` 
            };
        }

        // 4. Cek duplikat di tenant yang sama
        const duplicateCheck = await isPinDuplicate(pin, pelangganId, excludeUserId);
        if (duplicateCheck.isDuplicate) {
            return { 
                valid: false, 
                message: `PIN sudah digunakan oleh ${duplicateCheck.usedBy}. Pilih PIN lain.` 
            };
        }

        return { valid: true, message: 'PIN valid!' };

    } catch (error) {
        console.error('PIN validation error:', error);
        return { valid: false, message: PIN_ERROR_MESSAGES.VALIDATION_FAILED };
    }
}

/**
 * Validasi konfirmasi PIN (PIN dan konfirmasi harus sama)
 * 
 * @param {string} pin - PIN asli
 * @param {string} confirmPin - PIN konfirmasi
 * @returns {{ valid: boolean, message: string }}
 */
export function validatePinConfirmation(pin, confirmPin) {
    if (pin !== confirmPin) {
        return { valid: false, message: PIN_ERROR_MESSAGES.NOT_MATCH };
    }
    return { valid: true, message: 'PIN cocok' };
}

/**
 * Generate random PIN yang aman
 * PIN yang dihasilkan dijamin tidak lemah
 * 
 * @returns {string} - 6 digit random PIN yang aman
 */
export function generateSecurePin() {
    let pin;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        // Generate random 6 digit
        pin = Math.floor(100000 + Math.random() * 900000).toString();
        attempts++;

        // Cek apakah PIN lemah
        const weakCheck = isWeakPin(pin);
        if (!weakCheck.isWeak) {
            return pin;
        }
    } while (attempts < maxAttempts);

    // Fallback jika gagal generate (sangat jarang terjadi)
    // Buat PIN dengan pattern yang aman: ABCDEF where each digit is different
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = digits.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6).join('');
}

/**
 * Mask PIN untuk logging (tampilkan 2 digit pertama saja)
 * 
 * @param {string} pin - PIN asli
 * @returns {string} - PIN yang di-mask (contoh: "12****")
 */
export function maskPin(pin) {
    if (!pin || pin.length < 2) {
        return '******';
    }
    return pin.substring(0, 2) + '****';
}