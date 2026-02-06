// ============================================
// AUTH LIBRARY - Main Export
// File: src/lib/auth/index.js
// Export semua fungsi Auth system
// ============================================

// ============================================
// CONSTANTS
// ============================================
export {
    DEFAULT_SESSION_DAYS,
    REMEMBER_SESSION_DAYS,
    MAX_FAILED_ATTEMPTS,
    LOCK_DURATION_MINUTES,
    SESSION_COOKIE_NAME,
    ADMIN_ROLES,
    TENANT_ROLES,
    REPORT_ACCESS_ROLES,
    USER_MANAGEMENT_ROLES,
    USER_STATUS,
    TENANT_STATUS,
    LOGIN_TYPES,
    SESSION_TYPES,
    AUTH_ERROR_MESSAGES,
    REDIRECT_PATHS
} from './constants.js';

// ============================================
// SESSION MANAGEMENT
// ============================================
export {
    getUserFromSession,
    setSession,
    setPinSession,
    clearSession,
    refreshSession,
    isSessionExpiringSoon,
    getSessionRemainingMinutes,
    getSessionInfo,
    updateSessionUser
} from './session.js';

// ============================================
// LOGIN
// ============================================
export {
    verifyLogin,
    unlockAccount,
    isValidEmail,
    isEmailExists
} from './login.js';

// ============================================
// ROLES & PERMISSIONS
// ============================================
export {
    // Role checkers
    isAdmin,
    isSuperAdmin,
    isTenant,
    isTenantOwner,
    isTenantAdmin,
    isKasir,
    isTenantOwnerOrAdmin,
    
    // Permission checkers
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
    
    // Redirect helpers
    getRedirectPath,
    getHomePath,
    
    // Access control
    canAccessPath,
    canManageTargetUser,
    
    // Labels
    getRoleLabel,
    getRoleBadgeColor
} from './roles.js';