// ============================================
// ROLES & PERMISSIONS
// File: src/lib/auth/roles.js
// Helper untuk cek role dan permission
// ============================================

import {
    ADMIN_ROLES,
    TENANT_ROLES,
    REPORT_ACCESS_ROLES,
    USER_MANAGEMENT_ROLES,
    REDIRECT_PATHS
} from './constants.js';

// ============================================
// ROLE CHECKERS
// ============================================

/**
 * Cek apakah user adalah admin platform
 * 
 * @param {Object} user - Data user dari session
 * @returns {boolean}
 */
export function isAdmin(user) {
    return user && ADMIN_ROLES.includes(user.role);
}

/**
 * Cek apakah user adalah super admin
 * 
 * @param {Object} user - Data user dari session
 * @returns {boolean}
 */
export function isSuperAdmin(user) {
    return user && user.role === 'super_admin';
}

/**
 * Cek apakah user adalah tenant (bukan admin platform)
 * 
 * @param {Object} user - Data user dari session
 * @returns {boolean}
 */
export function isTenant(user) {
    return user && user.role === 'tenant';
}

/**
 * Cek apakah user adalah owner tenant
 * 
 * @param {Object} user - Data user dari session
 * @returns {boolean}
 */
export function isTenantOwner(user) {
    return user && user.role === 'tenant' && user.tenant_role === 'owner';
}

/**
 * Cek apakah user adalah admin tenant
 * 
 * @param {Object} user - Data user dari session
 * @returns {boolean}
 */
export function isTenantAdmin(user) {
    return user && user.role === 'tenant' && user.tenant_role === 'admin';
}

/**
 * Cek apakah user adalah kasir
 * 
 * @param {Object} user - Data user dari session
 * @returns {boolean}
 */
export function isKasir(user) {
    return user && user.role === 'tenant' && user.tenant_role === 'kasir';
}

/**
 * Cek apakah user adalah owner atau admin tenant
 * 
 * @param {Object} user - Data user dari session
 * @returns {boolean}
 */
export function isTenantOwnerOrAdmin(user) {
    return isTenantOwner(user) || isTenantAdmin(user);
}

// ============================================
// PERMISSION CHECKERS
// ============================================

/**
 * Cek apakah user bisa mengakses laporan
 * 
 * @param {Object} user - Data user dari session
 * @returns {boolean}
 */
export function canAccessReports(user) {
    if (!user) return false;
    
    // Admin platform bisa akses semua laporan
    if (isAdmin(user)) return true;
    
    // Tenant owner dan admin bisa akses laporan tenant mereka
    if (user.role === 'tenant') {
        return REPORT_ACCESS_ROLES.includes(user.tenant_role);
    }
    
    return false;
}

/**
 * Cek apakah user bisa kelola user lain
 * 
 * @param {Object} user - Data user dari session
 * @returns {boolean}
 */
export function canManageUsers(user) {
    if (!user) return false;
    
    // Admin platform bisa kelola semua user
    if (isAdmin(user)) return true;
    
    // Tenant owner dan admin bisa kelola user di tenant mereka
    if (user.role === 'tenant') {
        return USER_MANAGEMENT_ROLES.includes(user.tenant_role);
    }
    
    return false;
}

/**
 * Cek apakah user bisa kelola produk
 * 
 * @param {Object} user - Data user dari session
 * @returns {boolean}
 */
export function canManageProducts(user) {
    if (!user) return false;
    if (isAdmin(user)) return true;
    if (user.role === 'tenant') {
        return ['owner', 'admin'].includes(user.tenant_role);
    }
    return false;
}

/**
 * Cek apakah user bisa melakukan transaksi (kasir)
 * 
 * @param {Object} user - Data user dari session
 * @returns {boolean}
 */
export function canDoTransactions(user) {
    if (!user) return false;
    
    // Semua tenant role bisa transaksi
    if (user.role === 'tenant') {
        return TENANT_ROLES.includes(user.tenant_role);
    }
    
    return false;
}

/**
 * Cek apakah user bisa kelola pengaturan
 * 
 * @param {Object} user - Data user dari session
 * @returns {boolean}
 */
export function canManageSettings(user) {
    if (!user) return false;
    if (isAdmin(user)) return true;
    return isTenantOwner(user);
}

/**
 * Cek apakah user bisa melihat dashboard
 * 
 * @param {Object} user - Data user dari session
 * @returns {boolean}
 */
export function canAccessDashboard(user) {
    if (!user) return false;
    if (isAdmin(user)) return true;
    if (user.role === 'tenant') {
        return ['owner', 'admin'].includes(user.tenant_role);
    }
    return false;
}

/**
 * Cek apakah user bisa kelola shift
 * 
 * @param {Object} user - Data user dari session
 * @returns {boolean}
 */
export function canManageShifts(user) {
    if (!user) return false;
    if (isAdmin(user)) return true;
    if (user.role === 'tenant') {
        return ['owner', 'admin'].includes(user.tenant_role);
    }
    return false;
}

/**
 * Cek apakah user bisa void/batalkan transaksi
 * 
 * @param {Object} user - Data user dari session
 * @returns {boolean}
 */
export function canVoidTransactions(user) {
    if (!user) return false;
    if (isAdmin(user)) return true;
    return isTenantOwnerOrAdmin(user);
}

/**
 * Cek apakah user bisa memberikan diskon
 * 
 * @param {Object} user - Data user dari session
 * @param {number} discountPercent - Persentase diskon
 * @returns {boolean}
 */
export function canGiveDiscount(user, discountPercent = 0) {
    if (!user) return false;
    if (isAdmin(user)) return true;
    
    if (user.role === 'tenant') {
        // Owner bisa diskon berapa saja
        if (user.tenant_role === 'owner') return true;
        
        // Admin bisa diskon sampai 50%
        if (user.tenant_role === 'admin') return discountPercent <= 50;
        
        // Kasir bisa diskon sampai 10%
        if (user.tenant_role === 'kasir') return discountPercent <= 10;
    }
    
    return false;
}

// ============================================
// PERMISSION OBJECT
// ============================================

/**
 * Dapatkan semua permission user sebagai object
 * Berguna untuk dikirim ke frontend
 * 
 * @param {Object} user - Data user dari session
 * @returns {Object}
 */
export function getUserPermissions(user) {
    return {
        // Role flags
        isAdmin: isAdmin(user),
        isSuperAdmin: isSuperAdmin(user),
        isTenant: isTenant(user),
        isTenantOwner: isTenantOwner(user),
        isTenantAdmin: isTenantAdmin(user),
        isKasir: isKasir(user),
        
        // Permission flags
        canAccessReports: canAccessReports(user),
        canManageUsers: canManageUsers(user),
        canManageProducts: canManageProducts(user),
        canDoTransactions: canDoTransactions(user),
        canManageSettings: canManageSettings(user),
        canAccessDashboard: canAccessDashboard(user),
        canManageShifts: canManageShifts(user),
        canVoidTransactions: canVoidTransactions(user),
        canGiveDiscount: canGiveDiscount(user)
    };
}

// ============================================
// REDIRECT HELPERS
// ============================================

/**
 * Dapatkan redirect path berdasarkan role user
 * 
 * @param {Object} user - Data user dari session
 * @returns {string} - Path untuk redirect
 */
export function getRedirectPath(user) {
    if (!user) return REDIRECT_PATHS.LOGIN;
    
    // Admin platform
    if (isAdmin(user)) {
        return REDIRECT_PATHS.ADMIN;
    }
    
    // Tenant
    if (user.role === 'tenant') {
        switch (user.tenant_role) {
            case 'kasir':
                return REDIRECT_PATHS.TENANT_KASIR;
            case 'admin':
                return REDIRECT_PATHS.TENANT_ADMIN;
            case 'owner':
            default:
                return REDIRECT_PATHS.TENANT_OWNER;
        }
    }
    
    return REDIRECT_PATHS.LOGIN;
}

/**
 * Dapatkan home path berdasarkan role (alias untuk getRedirectPath)
 * 
 * @param {Object} user - Data user dari session
 * @returns {string}
 */
export function getHomePath(user) {
    return getRedirectPath(user);
}

// ============================================
// ACCESS CONTROL
// ============================================

/**
 * Cek apakah user bisa mengakses path tertentu
 * 
 * @param {Object} user - Data user dari session
 * @param {string} path - Path yang akan diakses
 * @returns {Object} - { allowed: boolean, redirect?: string }
 */
export function canAccessPath(user, path) {
    // Public paths - semua bisa akses
    const publicPaths = ['/', '/login', '/register', '/forgot-password'];
    if (publicPaths.some(p => path.startsWith(p))) {
        return { allowed: true };
    }

    // Tidak login - redirect ke login
    if (!user) {
        return { allowed: false, redirect: REDIRECT_PATHS.LOGIN };
    }

    // Admin paths
    if (path.startsWith('/admin')) {
        if (!isAdmin(user)) {
            return { allowed: false, redirect: getRedirectPath(user) };
        }
        return { allowed: true };
    }

    // Tenant paths
    if (path.startsWith('/tenant')) {
        if (!isTenant(user)) {
            return { allowed: false, redirect: getRedirectPath(user) };
        }
        
        // Kasir hanya bisa akses /tenant/kasir dan /tenant/shift
        if (isKasir(user)) {
            const kasirAllowedPaths = ['/tenant/kasir', '/tenant/shift', '/tenant/profil'];
            if (!kasirAllowedPaths.some(p => path.startsWith(p))) {
                return { allowed: false, redirect: REDIRECT_PATHS.TENANT_KASIR };
            }
        }
        
        return { allowed: true };
    }

    // Default: allow
    return { allowed: true };
}

/**
 * Cek apakah user bisa mengelola user target
 * 
 * @param {Object} currentUser - User yang sedang login
 * @param {Object} targetUser - User yang akan dikelola
 * @returns {Object} - { allowed: boolean, message?: string }
 */
export function canManageTargetUser(currentUser, targetUser) {
    if (!currentUser || !targetUser) {
        return { allowed: false, message: 'Data tidak valid' };
    }

    // Super admin bisa semua
    if (isSuperAdmin(currentUser)) {
        return { allowed: true };
    }

    // Admin platform bisa kelola non-super-admin
    if (isAdmin(currentUser)) {
        if (targetUser.role === 'super_admin') {
            return { allowed: false, message: 'Tidak dapat mengelola Super Admin' };
        }
        return { allowed: true };
    }

    // Tenant - harus di tenant yang sama
    if (currentUser.pelanggan_id !== targetUser.pelanggan_id) {
        return { allowed: false, message: 'User bukan bagian dari toko Anda' };
    }

    // Owner bisa kelola semua di tenant-nya
    if (isTenantOwner(currentUser)) {
        // Tidak bisa hapus diri sendiri atau primary owner lain
        if (targetUser.is_primary && currentUser.id !== targetUser.id) {
            return { allowed: false, message: 'Tidak dapat mengelola pemilik utama' };
        }
        return { allowed: true };
    }

    // Admin tenant hanya bisa kelola kasir
    if (isTenantAdmin(currentUser)) {
        if (targetUser.tenant_role === 'kasir' || targetUser.role === 'kasir') {
            return { allowed: true };
        }
        return { allowed: false, message: 'Admin hanya dapat mengelola kasir' };
    }

    return { allowed: false, message: 'Tidak memiliki akses' };
}

// ============================================
// ROLE LABELS
// ============================================

/**
 * Dapatkan label role dalam bahasa Indonesia
 * 
 * @param {Object} user - Data user
 * @returns {string}
 */
export function getRoleLabel(user) {
    if (!user) return 'Guest';
    
    if (isAdmin(user)) {
        const labels = {
            'super_admin': 'Super Admin',
            'admin': 'Admin',
            'support': 'Support'
        };
        return labels[user.role] || user.role;
    }
    
    if (user.role === 'tenant') {
        const labels = {
            'owner': 'Pemilik',
            'admin': 'Admin Toko',
            'kasir': 'Kasir'
        };
        return labels[user.tenant_role] || user.tenant_role;
    }
    
    return user.role;
}

/**
 * Dapatkan badge color untuk role
 * 
 * @param {Object} user - Data user
 * @returns {Object} - { bg: string, text: string }
 */
export function getRoleBadgeColor(user) {
    if (!user) return { bg: 'bg-gray-100', text: 'text-gray-600' };
    
    if (isAdmin(user)) {
        return { bg: 'bg-red-100', text: 'text-red-700' };
    }
    
    if (user.role === 'tenant') {
        const colors = {
            'owner': { bg: 'bg-purple-100', text: 'text-purple-700' },
            'admin': { bg: 'bg-blue-100', text: 'text-blue-700' },
            'kasir': { bg: 'bg-emerald-100', text: 'text-emerald-700' }
        };
        return colors[user.tenant_role] || { bg: 'bg-slate-100', text: 'text-slate-700' };
    }
    
    return { bg: 'bg-slate-100', text: 'text-slate-700' };
}