// ============================================
// PIN LIBRARY - Main Export
// File: src/lib/pin/index.js
// Export semua fungsi PIN system
// ============================================

// ============================================
// CONSTANTS
// ============================================
export {
    PIN_LENGTH,
    MAX_FAILED_ATTEMPTS,
    LOCK_DURATION_MINUTES,
    PIN_SESSION_HOURS,
    ROLES_REQUIRE_PIN,
    ROLES_OPTIONAL_PIN,
    ROLES_NO_PIN,
    WEAK_PINS_HARDCODED,
    PIN_REGEX,
    SAME_DIGITS_REGEX,
    PIN_ERROR_MESSAGES,
    PIN_ACTIONS,
    PIN_FAILURE_REASONS
} from './constants.js';

// ============================================
// VALIDATION
// ============================================
export {
    validatePinFormat,
    isWeakPin,
    isWeakPinFromDatabase,
    isPinDuplicate,
    validatePin,
    validatePinConfirmation,
    generateSecurePin,
    maskPin
} from './validation.js';

// ============================================
// LOGIN
// ============================================
export {
    verifyPinLogin,
    getActiveTenantsForLogin,
    getPinLoginStatus
} from './login.js';

// ============================================
// MANAGEMENT
// ============================================
export {
    setUserPin,
    resetUserPin,
    unlockUserAccount,
    userHasPin,
    getUsersWithoutPin,
    getPinStatistics,
    bulkSetPins
} from './management.js';

// ============================================
// HISTORY & LOGGING
// ============================================
export {
    logPinAttempt,
    logPinChange,
    getPinLoginHistory,
    getPinChangeHistory,
    getPinLoginStats,
    getSuspiciousIPs,
    cleanupOldLogs,
    exportLoginAttemptsToCSV
} from './history.js';

// ============================================
// PERMISSION HELPERS
// ============================================

/**
 * Cek apakah user bisa set/reset PIN user lain
 * 
 * @param {Object} currentUser - User yang sedang login
 * @param {Object} targetUser - User yang akan diubah PIN-nya
 * @returns {Object} - { allowed: boolean, message?: string }
 */
export function canManagePin(currentUser, targetUser) {
    if (!currentUser || !targetUser) {
        return { allowed: false, message: 'Data tidak valid' };
    }

    // Admin platform bisa semua
    if (['super_admin', 'admin', 'support'].includes(currentUser.role)) {
        return { allowed: true };
    }

    // Harus di tenant yang sama
    const currentPelangganId = currentUser.pelanggan_id;
    const targetPelangganId = targetUser.pelanggan_id;
    
    if (currentPelangganId !== targetPelangganId) {
        return { allowed: false, message: 'Tidak memiliki akses ke user ini' };
    }

    const currentRole = currentUser.tenant_role || currentUser.role;
    const targetRole = targetUser.tenant_role || targetUser.role;

    // Owner bisa kelola semua user di tenant-nya
    if (currentRole === 'owner') {
        return { allowed: true };
    }

    // Admin hanya bisa kelola kasir
    if (currentRole === 'admin') {
        if (targetRole === 'kasir') {
            return { allowed: true };
        }
        return { allowed: false, message: 'Admin hanya bisa mengelola PIN kasir' };
    }

    // Kasir bisa set PIN sendiri (jika belum punya)
    if (currentRole === 'kasir' && currentUser.id === targetUser.id) {
        return { allowed: true };
    }

    return { allowed: false, message: 'Tidak memiliki akses' };
}

/**
 * Cek apakah role memerlukan PIN
 * 
 * @param {string} role - Role user
 * @returns {Object} - { required: boolean, optional: boolean }
 */
export function isPinRequiredForRole(role) {
    const { ROLES_REQUIRE_PIN, ROLES_OPTIONAL_PIN, ROLES_NO_PIN } = require('./constants.js');
    
    return {
        required: ROLES_REQUIRE_PIN.includes(role),
        optional: ROLES_OPTIONAL_PIN.includes(role),
        notNeeded: ROLES_NO_PIN.includes(role)
    };
}

/**
 * Format waktu lock remaining
 * 
 * @param {string|Date} lockedUntil - Waktu unlock
 * @returns {string|null}
 */
export function formatLockTime(lockedUntil) {
    if (!lockedUntil) return null;
    
    const now = new Date();
    const lockTime = new Date(lockedUntil);
    
    if (lockTime <= now) return null;
    
    const diffMs = lockTime - now;
    const diffMins = Math.ceil(diffMs / 60000);
    
    if (diffMins <= 1) return '1 menit';
    if (diffMins < 60) return `${diffMins} menit`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (mins === 0) return `${hours} jam`;
    return `${hours} jam ${mins} menit`;
}