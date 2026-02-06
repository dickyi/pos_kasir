// ============================================
// PIN LOGIN
// File: src/lib/pin/login.js
// Verifikasi login menggunakan PIN
// ============================================

import { query } from '../db.js';
import { validatePinFormat } from './validation.js';
import { logPinAttempt } from './history.js';
import {
    PIN_LENGTH,
    MAX_FAILED_ATTEMPTS,
    LOCK_DURATION_MINUTES,
    PIN_ERROR_MESSAGES,
    PIN_FAILURE_REASONS
} from './constants.js';

/**
 * Verifikasi PIN login untuk tenant users (kasir quick login)
 * Enhanced dengan logging, validasi lengkap, dan auto-lock
 * 
 * @param {number} pelangganId - ID tenant/pelanggan
 * @param {string} pin - PIN 6 digit
 * @param {Object} options - Opsi tambahan
 * @param {string} options.ipAddress - IP address user
 * @param {string} options.userAgent - User agent browser
 * @returns {Promise<Object>} - { success, message?, user?, lockedUntil?, attemptsRemaining? }
 */
export async function verifyPinLogin(pelangganId, pin, options = {}) {
    const { ipAddress = null, userAgent = null } = options;

    try {
        // ========================================
        // STEP 1: Validasi format PIN
        // ========================================
        const formatCheck = validatePinFormat(pin);
        if (!formatCheck.valid) {
            await logPinAttempt({
                pelangganId,
                pin,
                userId: null,
                isSuccess: false,
                failureReason: PIN_FAILURE_REASONS.INVALID_FORMAT,
                ipAddress,
                userAgent
            });
            return { 
                success: false, 
                message: formatCheck.message 
            };
        }

        // ========================================
        // STEP 2: Cek status tenant
        // ========================================
        const tenants = await query(
            `SELECT id, nama_bisnis, status FROM pelanggan WHERE id = ?`,
            [pelangganId]
        );

        if (tenants.length === 0) {
            await logPinAttempt({
                pelangganId,
                pin,
                userId: null,
                isSuccess: false,
                failureReason: PIN_FAILURE_REASONS.TENANT_NOT_FOUND,
                ipAddress,
                userAgent
            });
            return { success: false, message: 'Toko tidak ditemukan!' };
        }

        const tenant = tenants[0];
        if (tenant.status !== 'aktif') {
            await logPinAttempt({
                pelangganId,
                pin,
                userId: null,
                isSuccess: false,
                failureReason: PIN_FAILURE_REASONS.TENANT_INACTIVE,
                ipAddress,
                userAgent
            });
            return { success: false, message: PIN_ERROR_MESSAGES.TENANT_INACTIVE };
        }

        // ========================================
        // STEP 3: Cari user dengan PIN tersebut
        // ========================================
        const tenantUsers = await query(
            `SELECT 
                tu.id,
                tu.pelanggan_id,
                tu.kode_user,
                tu.email,
                tu.nama,
                tu.avatar,
                tu.role,
                tu.is_primary,
                tu.status,
                tu.locked_until,
                tu.failed_login_count,
                tu.tema,
                tu.bahasa,
                p.nama_bisnis,
                p.kode_pelanggan
            FROM tenant_users tu
            JOIN pelanggan p ON tu.pelanggan_id = p.id
            WHERE tu.pelanggan_id = ?
            AND tu.pin = ?
            AND tu.deleted_at IS NULL`,
            [pelangganId, pin]
        );

        // ========================================
        // STEP 4: PIN tidak ditemukan
        // ========================================
        if (tenantUsers.length === 0) {
            await logPinAttempt({
                pelangganId,
                pin,
                userId: null,
                isSuccess: false,
                failureReason: PIN_FAILURE_REASONS.WRONG_PIN,
                ipAddress,
                userAgent
            });
            
            return { 
                success: false, 
                message: PIN_ERROR_MESSAGES.WRONG_PIN 
            };
        }

        const tenantUser = tenantUsers[0];

        // ========================================
        // STEP 5: Cek apakah akun terkunci
        // ========================================
        if (tenantUser.locked_until && new Date(tenantUser.locked_until) > new Date()) {
            const remainingMinutes = Math.ceil(
                (new Date(tenantUser.locked_until) - new Date()) / 60000
            );
            
            await logPinAttempt({
                pelangganId,
                pin,
                userId: tenantUser.id,
                isSuccess: false,
                failureReason: PIN_FAILURE_REASONS.ACCOUNT_LOCKED,
                ipAddress,
                userAgent
            });
            
            return { 
                success: false, 
                message: `Akun terkunci. Coba lagi dalam ${remainingMinutes} menit.`,
                lockedUntil: tenantUser.locked_until
            };
        }

        // ========================================
        // STEP 6: Cek status user
        // ========================================
        if (tenantUser.status !== 'aktif') {
            const statusReasons = {
                'nonaktif': PIN_FAILURE_REASONS.USER_INACTIVE,
                'pending': PIN_FAILURE_REASONS.USER_PENDING,
                'suspended': PIN_FAILURE_REASONS.USER_SUSPENDED
            };
            
            const statusMessages = {
                'nonaktif': 'Akun tidak aktif. Hubungi pemilik toko.',
                'pending': 'Akun menunggu aktivasi. Hubungi pemilik toko.',
                'suspended': 'Akun disuspend. Hubungi pemilik toko.'
            };
            
            await logPinAttempt({
                pelangganId,
                pin,
                userId: tenantUser.id,
                isSuccess: false,
                failureReason: statusReasons[tenantUser.status] || PIN_FAILURE_REASONS.USER_INACTIVE,
                ipAddress,
                userAgent
            });
            
            return { 
                success: false, 
                message: statusMessages[tenantUser.status] || PIN_ERROR_MESSAGES.USER_INACTIVE 
            };
        }

        // ========================================
        // STEP 7: Login berhasil!
        // ========================================
        // Reset failed count dan update last_login
        await query(
            `UPDATE tenant_users 
             SET failed_login_count = 0, 
                 locked_until = NULL, 
                 last_login = NOW(), 
                 last_activity = NOW(),
                 login_count = login_count + 1
             WHERE id = ?`,
            [tenantUser.id]
        );

        // Log successful login
        await logPinAttempt({
            pelangganId,
            pin,
            userId: tenantUser.id,
            isSuccess: true,
            failureReason: null,
            ipAddress,
            userAgent
        });

        return {
            success: true,
            message: 'Login berhasil!',
            user: {
                id: tenantUser.id,
                email: tenantUser.email,
                nama: tenantUser.nama,
                role: 'tenant',
                pelanggan_id: tenantUser.pelanggan_id,
                nama_bisnis: tenantUser.nama_bisnis,
                kode_pelanggan: tenantUser.kode_pelanggan,
                tenant_user_id: tenantUser.id,
                tenant_role: tenantUser.role,
                kode_user: tenantUser.kode_user,
                is_primary: tenantUser.is_primary,
                avatar: tenantUser.avatar,
                tema: tenantUser.tema,
                bahasa: tenantUser.bahasa,
                login_type: 'pin'
            }
        };

    } catch (error) {
        console.error('PIN login error:', error);
        return { success: false, message: 'Terjadi kesalahan server. Silakan coba lagi.' };
    }
}

/**
 * Dapatkan daftar tenant aktif untuk dropdown login PIN
 * Hanya menampilkan tenant yang memiliki user dengan PIN
 * 
 * @returns {Promise<Array>} - List tenant dengan info dasar
 */
export async function getActiveTenantsForLogin() {
    try {
        const tenants = await query(
            `SELECT 
                p.id,
                p.kode_pelanggan,
                p.nama_bisnis,
                p.logo,
                COUNT(DISTINCT tu.id) as total_users,
                COUNT(DISTINCT CASE WHEN tu.pin IS NOT NULL AND tu.pin != '' THEN tu.id END) as users_with_pin
             FROM pelanggan p
             LEFT JOIN tenant_users tu ON p.id = tu.pelanggan_id 
                AND tu.deleted_at IS NULL 
                AND tu.status = 'aktif'
                AND tu.role IN ('kasir', 'admin')
             WHERE p.status = 'aktif'
             GROUP BY p.id
             HAVING users_with_pin > 0
             ORDER BY p.nama_bisnis ASC`
        );
        
        return tenants.map(t => ({
            id: t.id,
            kode: t.kode_pelanggan,
            nama: t.nama_bisnis,
            logo: t.logo,
            hasUsersWithPin: t.users_with_pin > 0
        }));
    } catch (error) {
        console.error('Get active tenants error:', error);
        return [];
    }
}

/**
 * Cek status login PIN untuk user tertentu
 * Berguna untuk menampilkan info di UI
 * 
 * @param {number} userId - ID user
 * @returns {Promise<Object>} - Status info
 */
export async function getPinLoginStatus(userId) {
    try {
        const users = await query(
            `SELECT 
                id,
                pin IS NOT NULL AND pin != '' as has_pin,
                locked_until,
                failed_login_count,
                last_login
            FROM tenant_users 
            WHERE id = ? AND deleted_at IS NULL`,
            [userId]
        );

        if (users.length === 0) {
            return { exists: false };
        }

        const user = users[0];
        const isLocked = user.locked_until && new Date(user.locked_until) > new Date();

        return {
            exists: true,
            hasPin: user.has_pin,
            isLocked,
            lockedUntil: isLocked ? user.locked_until : null,
            failedAttempts: user.failed_login_count || 0,
            attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - (user.failed_login_count || 0)),
            lastLogin: user.last_login
        };
    } catch (error) {
        console.error('Get PIN login status error:', error);
        return { exists: false, error: error.message };
    }
}