// ============================================
// LOGIN - Email/Password Authentication
// File: src/lib/auth/login.js
// Verifikasi login menggunakan email & password
// ============================================
// PERBAIKAN:
// [FIX-1] ✅ Gunakan bcrypt.compare() untuk verifikasi password
// [FIX-2] ✅ Support backward compatibility (plain text → bcrypt)
// [FIX-3] ✅ Auto-upgrade plain text password ke bcrypt saat login
// ============================================

import { query } from '../db.js';
import { verifyPassword, hashPassword } from '../password.js'; // [FIX-1]
import {
    MAX_FAILED_ATTEMPTS,
    LOCK_DURATION_MINUTES,
    ADMIN_ROLES,
    USER_STATUS,
    TENANT_STATUS,
    LOGIN_TYPES,
    AUTH_ERROR_MESSAGES
} from './constants.js';

/**
 * [FIX-2] Cek apakah string adalah bcrypt hash
 * Bcrypt hash selalu dimulai dengan $2a$ atau $2b$ dan panjangnya 60 karakter
 */
function isBcryptHash(str) {
    return str && (str.startsWith('$2b$') || str.startsWith('$2a$')) && str.length === 60;
}

/**
 * [FIX-1] Verifikasi password - support bcrypt hash DAN plain text (backward compatible)
 * [FIX-3] Jika password masih plain text, otomatis upgrade ke bcrypt
 * 
 * @param {string} inputPassword - Password dari form login
 * @param {string} storedPassword - Password dari database
 * @param {string} table - Nama tabel ('users' atau 'tenant_users')
 * @param {number} userId - ID user untuk auto-upgrade
 * @returns {Promise<boolean>}
 */
async function verifyUserPassword(inputPassword, storedPassword, table, userId) {
    if (!inputPassword || !storedPassword) return false;

    if (isBcryptHash(storedPassword)) {
        // Password sudah di-hash → gunakan bcrypt.compare
        return await verifyPassword(inputPassword, storedPassword);
    } else {
        // Password masih plain text → bandingkan langsung
        const isMatch = storedPassword === inputPassword;

        // [FIX-3] Auto-upgrade: jika cocok, hash dan simpan ke database
        if (isMatch) {
            try {
                const hashedPassword = await hashPassword(inputPassword);
                await query(
                    `UPDATE ${table} SET password = ? WHERE id = ?`,
                    [hashedPassword, userId]
                );
                console.log(`🔐 Auto-upgraded password to bcrypt for ${table} ID:${userId}`);
            } catch (upgradeError) {
                // Jangan gagalkan login jika upgrade gagal
                console.error('Password auto-upgrade error:', upgradeError);
            }
        }

        return isMatch;
    }
}

/**
 * Verifikasi login user dengan email dan password
 * Support login dari tabel users (admin) dan tenant_users (tenant)
 * 
 * @param {string} email - Email user
 * @param {string} password - Password user
 * @returns {Promise<Object>} - { success, message?, user? }
 */
export async function verifyLogin(email, password) {
    try {
        const normalizedEmail = email.toLowerCase().trim();

        // STEP 1: Cek di tabel users (Admin Platform & Legacy)
        const adminResult = await verifyAdminLogin(normalizedEmail, password);
        if (adminResult.found) {
            return adminResult;
        }

        // STEP 2: Cek di tabel tenant_users (Multi-User Tenant)
        const tenantResult = await verifyTenantUserLogin(normalizedEmail, password);
        if (tenantResult.found) {
            return tenantResult;
        }

        // User tidak ditemukan
        return { 
            success: false, 
            message: AUTH_ERROR_MESSAGES.EMAIL_NOT_FOUND 
        };

    } catch (error) {
        console.error('Login error:', error);
        return { 
            success: false, 
            message: AUTH_ERROR_MESSAGES.SERVER_ERROR 
        };
    }
}

/**
 * Verifikasi login dari tabel users (admin platform)
 */
async function verifyAdminLogin(email, password) {
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
            p.kode_pelanggan,
            p.status as tenant_status
        FROM users u
        LEFT JOIN pelanggan p ON u.pelanggan_id = p.id
        WHERE u.email = ?`,
        [email]
    );

    if (users.length === 0) {
        return { found: false };
    }

    const user = users[0];

    // Cek status user
    if (user.status === USER_STATUS.PENDING) {
        return { 
            found: true, 
            success: false, 
            message: AUTH_ERROR_MESSAGES.ACCOUNT_PENDING 
        };
    }

    if (user.status === USER_STATUS.NONAKTIF) {
        return { 
            found: true, 
            success: false, 
            message: AUTH_ERROR_MESSAGES.ACCOUNT_INACTIVE 
        };
    }

    // ============================================
    // [FIX-1] Verifikasi password dengan bcrypt
    // Sebelumnya: if (user.password !== password)
    // ============================================
    const passwordValid = await verifyUserPassword(
        password, 
        user.password, 
        'users',
        user.id
    );

    if (!passwordValid) {
        return { 
            found: true, 
            success: false, 
            message: AUTH_ERROR_MESSAGES.WRONG_PASSWORD 
        };
    }

    // Jika user adalah tenant, cek status tenant
    if (user.pelanggan_id && user.tenant_status !== TENANT_STATUS.AKTIF) {
        return { 
            found: true, 
            success: false, 
            message: AUTH_ERROR_MESSAGES.TENANT_INACTIVE 
        };
    }

    // Update last_login
    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const isAdminRole = ADMIN_ROLES.includes(user.role);

    return {
        found: true,
        success: true,
        user: {
            id: user.id,
            email: user.email,
            nama: user.nama,
            role: isAdminRole ? user.role : 'tenant',
            pelanggan_id: user.pelanggan_id,
            nama_bisnis: user.nama_bisnis || null,
            kode_pelanggan: user.kode_pelanggan || null,
            login_type: LOGIN_TYPES.USERS
        }
    };
}

/**
 * Verifikasi login dari tabel tenant_users
 */
async function verifyTenantUserLogin(email, password) {
    const users = await query(
        `SELECT 
            tu.id,
            tu.pelanggan_id,
            tu.kode_user,
            tu.email,
            tu.password,
            tu.pin,
            tu.nama,
            tu.no_telepon,
            tu.avatar,
            tu.role,
            tu.is_primary,
            tu.status,
            tu.locked_until,
            tu.failed_login_count,
            tu.tema,
            tu.bahasa,
            p.nama_bisnis,
            p.kode_pelanggan,
            p.status as tenant_status
        FROM tenant_users tu
        JOIN pelanggan p ON tu.pelanggan_id = p.id
        WHERE tu.email = ?
        AND tu.deleted_at IS NULL`,
        [email]
    );

    if (users.length === 0) {
        return { found: false };
    }

    const user = users[0];

    // Cek apakah akun terkunci
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const remainingMinutes = Math.ceil(
            (new Date(user.locked_until) - new Date()) / 60000
        );
        return { 
            found: true, 
            success: false, 
            message: `Akun terkunci. Coba lagi dalam ${remainingMinutes} menit.`,
            lockedUntil: user.locked_until
        };
    }

    // ============================================
    // [FIX-1] Verifikasi password dengan bcrypt
    // Sebelumnya: if (user.password !== password)
    // ============================================
    const passwordValid = await verifyUserPassword(
        password, 
        user.password, 
        'tenant_users',
        user.id
    );

    if (!passwordValid) {
        await handleFailedLogin(user);
        
        const newFailedCount = (user.failed_login_count || 0) + 1;
        const attemptsRemaining = MAX_FAILED_ATTEMPTS - newFailedCount;
        
        if (attemptsRemaining <= 0) {
            return { 
                found: true, 
                success: false, 
                message: `Terlalu banyak percobaan gagal. Akun dikunci selama ${LOCK_DURATION_MINUTES} menit.` 
            };
        }
        
        return { 
            found: true, 
            success: false, 
            message: `Password salah! (${attemptsRemaining} percobaan tersisa)` 
        };
    }

    // Cek status user
    if (user.status !== USER_STATUS.AKTIF) {
        const statusMessages = {
            [USER_STATUS.NONAKTIF]: 'Akun Anda tidak aktif. Hubungi pemilik toko.',
            [USER_STATUS.PENDING]: 'Akun Anda menunggu aktivasi. Hubungi pemilik toko.',
            [USER_STATUS.SUSPENDED]: AUTH_ERROR_MESSAGES.ACCOUNT_SUSPENDED
        };
        return { 
            found: true, 
            success: false, 
            message: statusMessages[user.status] || 'Akun tidak dapat digunakan.' 
        };
    }

    // Cek status tenant
    if (user.tenant_status !== TENANT_STATUS.AKTIF) {
        return { 
            found: true, 
            success: false, 
            message: AUTH_ERROR_MESSAGES.TENANT_INACTIVE 
        };
    }

    // Login berhasil - reset failed count
    await query(
        `UPDATE tenant_users 
         SET failed_login_count = 0, 
             locked_until = NULL, 
             last_login = NOW(), 
             login_count = login_count + 1
         WHERE id = ?`,
        [user.id]
    );

    return {
        found: true,
        success: true,
        user: {
            id: user.id,
            email: user.email,
            nama: user.nama,
            role: 'tenant',
            pelanggan_id: user.pelanggan_id,
            nama_bisnis: user.nama_bisnis,
            kode_pelanggan: user.kode_pelanggan,
            tenant_user_id: user.id,
            tenant_role: user.role,
            kode_user: user.kode_user,
            is_primary: user.is_primary,
            avatar: user.avatar,
            tema: user.tema,
            bahasa: user.bahasa,
            login_type: LOGIN_TYPES.TENANT_USERS
        }
    };
}

/**
 * Handle login gagal
 */
async function handleFailedLogin(user) {
    const newFailedCount = (user.failed_login_count || 0) + 1;
    
    if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
        await query(
            `UPDATE tenant_users 
             SET failed_login_count = ?, 
                 locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE)
             WHERE id = ?`,
            [newFailedCount, LOCK_DURATION_MINUTES, user.id]
        );
    } else {
        await query(
            'UPDATE tenant_users SET failed_login_count = ? WHERE id = ?',
            [newFailedCount, user.id]
        );
    }
}

/**
 * Unlock akun yang terkunci
 */
export async function unlockAccount(userId, options = {}) {
    const { unlockedBy = null } = options;

    try {
        const users = await query(
            `SELECT id, nama, locked_until FROM tenant_users WHERE id = ? AND deleted_at IS NULL`,
            [userId]
        );

        if (users.length === 0) {
            return { success: false, message: 'User tidak ditemukan' };
        }

        const user = users[0];

        if (!user.locked_until || new Date(user.locked_until) <= new Date()) {
            return { success: false, message: 'Akun tidak dalam kondisi terkunci' };
        }

        await query(
            `UPDATE tenant_users 
             SET locked_until = NULL, 
                 failed_login_count = 0,
                 updated_by = ?
             WHERE id = ?`,
            [unlockedBy, userId]
        );

        return { 
            success: true, 
            message: `Akun ${user.nama} berhasil dibuka` 
        };
    } catch (error) {
        console.error('Unlock account error:', error);
        return { success: false, message: AUTH_ERROR_MESSAGES.SERVER_ERROR };
    }
}

/**
 * Validasi format email
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Cek apakah email sudah terdaftar
 */
export async function isEmailExists(email) {
    const normalizedEmail = email.toLowerCase().trim();

    const adminUsers = await query(
        'SELECT id FROM users WHERE email = ?',
        [normalizedEmail]
    );

    if (adminUsers.length > 0) {
        return { exists: true, table: 'users' };
    }

    const tenantUsers = await query(
        'SELECT id FROM tenant_users WHERE email = ? AND deleted_at IS NULL',
        [normalizedEmail]
    );

    if (tenantUsers.length > 0) {
        return { exists: true, table: 'tenant_users' };
    }

    return { exists: false };
}