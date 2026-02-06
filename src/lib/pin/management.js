// ============================================
// PIN MANAGEMENT
// File: src/lib/pin/management.js
// Set, Reset, dan Unlock PIN
// ============================================

import { query } from '../db.js';
import { validatePin } from './validation.js';
import { logPinChange } from './history.js';
import {
    PIN_ACTIONS,
    PIN_ERROR_MESSAGES,
    ROLES_NO_PIN
} from './constants.js';

/**
 * Set atau update PIN user
 * 
 * @param {number} userId - ID user yang akan diset PIN-nya
 * @param {string} newPin - PIN baru
 * @param {Object} options - Opsi tambahan
 * @param {number} options.changedBy - ID user yang melakukan perubahan
 * @param {string} options.changedByRole - Role user yang melakukan perubahan
 * @param {string} options.ipAddress - IP address
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
export async function setUserPin(userId, newPin, options = {}) {
    const { changedBy = null, changedByRole = null, ipAddress = null } = options;

    try {
        // 1. Ambil data user
        const users = await query(
            `SELECT id, pelanggan_id, nama, pin, role 
             FROM tenant_users 
             WHERE id = ? AND deleted_at IS NULL`,
            [userId]
        );

        if (users.length === 0) {
            return { success: false, message: 'User tidak ditemukan!' };
        }

        const user = users[0];

        // 2. Cek apakah role memerlukan PIN
        if (ROLES_NO_PIN.includes(user.role)) {
            return { 
                success: false, 
                message: `Role ${user.role} tidak memerlukan PIN.` 
            };
        }

        // 3. Tentukan action (set baru atau change)
        const isNewPin = !user.pin;
        const action = isNewPin ? PIN_ACTIONS.SET : PIN_ACTIONS.CHANGE;

        // 4. Validasi PIN
        const validation = await validatePin(newPin, user.pelanggan_id, userId);
        if (!validation.valid) {
            return { success: false, message: validation.message };
        }

        // 5. Update PIN
        await query(
            `UPDATE tenant_users 
             SET pin = ?, 
                 pin_set_at = NOW(), 
                 pin_set_by = ?,
                 updated_by = ?
             WHERE id = ?`,
            [newPin, changedBy, changedBy, userId]
        );

        // 6. Log perubahan PIN
        await logPinChange({
            userId,
            pelangganId: user.pelanggan_id,
            action,
            changedBy,
            changedByRole,
            ipAddress
        });

        return { 
            success: true, 
            message: isNewPin ? PIN_ERROR_MESSAGES.SET_SUCCESS : PIN_ERROR_MESSAGES.CHANGE_SUCCESS,
            action
        };

    } catch (error) {
        console.error('Set PIN error:', error);
        return { success: false, message: 'Gagal menyimpan PIN. Coba lagi.' };
    }
}

/**
 * Reset PIN user (hapus PIN)
 * User harus set PIN baru sebelum bisa login dengan PIN
 * 
 * @param {number} userId - ID user
 * @param {Object} options - Opsi tambahan
 * @param {number} options.changedBy - ID user yang melakukan reset
 * @param {string} options.changedByRole - Role user yang melakukan reset
 * @param {string} options.ipAddress - IP address
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
export async function resetUserPin(userId, options = {}) {
    const { changedBy, changedByRole, ipAddress = null } = options;

    try {
        // 1. Ambil data user
        const users = await query(
            `SELECT id, pelanggan_id, nama, role, pin 
             FROM tenant_users 
             WHERE id = ? AND deleted_at IS NULL`,
            [userId]
        );

        if (users.length === 0) {
            return { success: false, message: 'User tidak ditemukan!' };
        }

        const user = users[0];

        // 2. Cek apakah user punya PIN
        if (!user.pin) {
            return { success: false, message: 'User tidak memiliki PIN.' };
        }

        // 3. Reset PIN
        await query(
            `UPDATE tenant_users 
             SET pin = NULL, 
                 pin_set_at = NULL, 
                 pin_set_by = NULL,
                 updated_by = ?
             WHERE id = ?`,
            [changedBy, userId]
        );

        // 4. Log reset PIN
        await logPinChange({
            userId,
            pelangganId: user.pelanggan_id,
            action: PIN_ACTIONS.RESET,
            changedBy,
            changedByRole,
            ipAddress
        });

        return { 
            success: true, 
            message: `PIN ${user.nama} berhasil direset. User harus membuat PIN baru.`,
            userName: user.nama
        };

    } catch (error) {
        console.error('Reset PIN error:', error);
        return { success: false, message: 'Gagal mereset PIN. Coba lagi.' };
    }
}

/**
 * Unlock akun yang terkunci karena terlalu banyak percobaan gagal
 * 
 * @param {number} userId - ID user
 * @param {Object} options - Opsi tambahan
 * @param {number} options.unlockedBy - ID user yang melakukan unlock
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
export async function unlockUserAccount(userId, options = {}) {
    const { unlockedBy = null } = options;

    try {
        // 1. Ambil data user
        const users = await query(
            `SELECT id, nama, pelanggan_id, locked_until 
             FROM tenant_users 
             WHERE id = ? AND deleted_at IS NULL`,
            [userId]
        );

        if (users.length === 0) {
            return { success: false, message: 'User tidak ditemukan!' };
        }

        const user = users[0];

        // 2. Cek apakah memang terkunci
        if (!user.locked_until || new Date(user.locked_until) <= new Date()) {
            return { success: false, message: 'Akun tidak dalam kondisi terkunci.' };
        }

        // 3. Unlock akun
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
            message: `Akun ${user.nama} berhasil dibuka.`,
            userName: user.nama
        };

    } catch (error) {
        console.error('Unlock user error:', error);
        return { success: false, message: 'Gagal membuka kunci akun. Coba lagi.' };
    }
}

/**
 * Cek apakah user sudah memiliki PIN
 * 
 * @param {number} userId - ID user
 * @returns {Promise<boolean>}
 */
export async function userHasPin(userId) {
    try {
        const users = await query(
            `SELECT pin FROM tenant_users WHERE id = ? AND deleted_at IS NULL`,
            [userId]
        );
        return users.length > 0 && users[0].pin !== null && users[0].pin !== '';
    } catch (error) {
        console.error('Check user has PIN error:', error);
        return false;
    }
}

/**
 * Dapatkan daftar user yang belum set PIN
 * 
 * @param {number} pelangganId - ID tenant
 * @returns {Promise<Array>}
 */
export async function getUsersWithoutPin(pelangganId) {
    try {
        const users = await query(
            `SELECT id, kode_user, nama, email, role, created_at
             FROM tenant_users
             WHERE pelanggan_id = ?
             AND role IN ('kasir', 'admin')
             AND (pin IS NULL OR pin = '')
             AND status = 'aktif'
             AND deleted_at IS NULL
             ORDER BY role, nama`,
            [pelangganId]
        );
        return users;
    } catch (error) {
        console.error('Get users without PIN error:', error);
        return [];
    }
}

/**
 * Dapatkan statistik PIN per tenant
 * 
 * @param {number} pelangganId - ID tenant
 * @returns {Promise<Object>}
 */
export async function getPinStatistics(pelangganId) {
    try {
        const stats = await query(
            `SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN pin IS NOT NULL AND pin != '' THEN 1 ELSE 0 END) as users_with_pin,
                SUM(CASE WHEN role IN ('kasir', 'admin') AND (pin IS NULL OR pin = '') THEN 1 ELSE 0 END) as users_need_pin,
                SUM(CASE WHEN locked_until IS NOT NULL AND locked_until > NOW() THEN 1 ELSE 0 END) as users_locked
            FROM tenant_users
            WHERE pelanggan_id = ?
            AND deleted_at IS NULL
            AND status = 'aktif'`,
            [pelangganId]
        );

        return stats[0] || {
            total_users: 0,
            users_with_pin: 0,
            users_need_pin: 0,
            users_locked: 0
        };
    } catch (error) {
        console.error('Get PIN statistics error:', error);
        return {
            total_users: 0,
            users_with_pin: 0,
            users_need_pin: 0,
            users_locked: 0
        };
    }
}

/**
 * Bulk set PIN untuk multiple users
 * Berguna untuk setup awal atau migrasi
 * 
 * @param {Array<{userId: number, pin: string}>} userPins - Array of user-pin pairs
 * @param {Object} options - Opsi tambahan
 * @returns {Promise<Object>} - { success: number, failed: number, errors: Array }
 */
export async function bulkSetPins(userPins, options = {}) {
    const { changedBy = null, changedByRole = null, ipAddress = null } = options;
    
    const results = {
        success: 0,
        failed: 0,
        errors: []
    };

    for (const { userId, pin } of userPins) {
        const result = await setUserPin(userId, pin, {
            changedBy,
            changedByRole,
            ipAddress
        });

        if (result.success) {
            results.success++;
        } else {
            results.failed++;
            results.errors.push({
                userId,
                message: result.message
            });
        }
    }

    return results;
}