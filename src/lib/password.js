// ============================================
// PASSWORD UTILITY - Secure Hashing with bcrypt
// File: src/lib/password.js
// ============================================
// INSTALASI: npm install bcrypt
// ============================================

import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Rekomendasi: 10-12 untuk production

/**
 * Hash password menggunakan bcrypt
 * @param {string} plainPassword - Password mentah dari user
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(plainPassword) {
    if (!plainPassword || typeof plainPassword !== 'string') {
        throw new Error('Password tidak valid');
    }
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Verifikasi password terhadap hash
 * @param {string} plainPassword - Password mentah dari user
 * @param {string} hashedPassword - Hash dari database
 * @returns {Promise<boolean>} - true jika cocok
 */
export async function verifyPassword(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) return false;
    return await bcrypt.compare(plainPassword, hashedPassword);
}