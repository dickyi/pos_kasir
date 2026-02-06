// ============================================
// MAIN AUTH EXPORT
// File: src/lib/auth.js
// Re-export semua dari auth/ dan pin/ libraries
// ============================================

// ============================================
// AUTH LIBRARY EXPORTS
// ============================================
export {
    // Constants
    DEFAULT_SESSION_DAYS,
    REMEMBER_SESSION_DAYS,
    MAX_FAILED_ATTEMPTS,
    LOCK_DURATION_MINUTES,
    SESSION_COOKIE_NAME,
    ADMIN_ROLES,
    TENANT_ROLES,
    USER_STATUS,
    TENANT_STATUS,
    LOGIN_TYPES,
    SESSION_TYPES,
    AUTH_ERROR_MESSAGES,
    REDIRECT_PATHS,
    
    // Session
    getUserFromSession,
    setSession,
    setPinSession,
    clearSession,
    refreshSession,
    isSessionExpiringSoon,
    getSessionRemainingMinutes,
    getSessionInfo,
    updateSessionUser,
    
    // Login
    verifyLogin,
    unlockAccount,
    isValidEmail,
    isEmailExists,
    
    // Roles & Permissions
    isAdmin,
    isSuperAdmin,
    isTenant,
    isTenantOwner,
    isTenantAdmin,
    isKasir,
    isTenantOwnerOrAdmin,
    canAccessReports,
    canManageUsers,
    canManageProducts,
    canDoTransactions,
    canManageSettings,
    canAccessDashboard,
    canManageShifts,
    canVoidTransactions,
    canGiveDiscount,
    getUserPermissions,
    getRedirectPath,
    getHomePath,
    canAccessPath,
    canManageTargetUser,
    getRoleLabel,
    getRoleBadgeColor
} from './auth/index.js';

// ============================================
// PIN LIBRARY EXPORTS
// ============================================
export {
    // Constants
    PIN_LENGTH,
    PIN_SESSION_HOURS,
    PIN_ERROR_MESSAGES,
    PIN_ACTIONS,
    
    // Validation
    validatePinFormat,
    isWeakPin,
    validatePin,
    validatePinConfirmation,
    generateSecurePin,
    maskPin,
    
    // Login
    verifyPinLogin,
    getActiveTenantsForLogin,
    getPinLoginStatus,
    
    // Management
    setUserPin,
    resetUserPin,
    unlockUserAccount,
    userHasPin,
    getUsersWithoutPin,
    getPinStatistics,
    bulkSetPins,
    
    // History
    logPinAttempt,
    logPinChange,
    getPinLoginHistory,
    getPinChangeHistory,
    getPinLoginStats,
    getSuspiciousIPs,
    cleanupOldLogs,
    exportLoginAttemptsToCSV,
    
    // Permissions
    canManagePin,
    formatLockTime
} from './pin/index.js';