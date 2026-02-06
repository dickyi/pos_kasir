// ============================================
// AUTH CONSTANTS
// File: src/lib/auth/constants.js
// Konfigurasi dan konstanta sistem autentikasi
// ============================================

/**
 * Durasi session default dalam hari
 */
export const DEFAULT_SESSION_DAYS = 7;

/**
 * Durasi session dengan "Remember Me" dalam hari
 */
export const REMEMBER_SESSION_DAYS = 30;

/**
 * Maksimal percobaan login gagal sebelum akun dikunci
 */
export const MAX_FAILED_ATTEMPTS = 5;

/**
 * Durasi penguncian akun dalam menit
 */
export const LOCK_DURATION_MINUTES = 15;

/**
 * Nama cookie untuk session
 */
export const SESSION_COOKIE_NAME = 'session';

/**
 * Role admin platform
 */
export const ADMIN_ROLES = ['super_admin', 'admin', 'support'];

/**
 * Role tenant
 */
export const TENANT_ROLES = ['owner', 'admin', 'kasir'];

/**
 * Role yang bisa akses laporan
 */
export const REPORT_ACCESS_ROLES = ['owner', 'admin'];

/**
 * Role yang bisa kelola user
 */
export const USER_MANAGEMENT_ROLES = ['owner', 'admin'];

/**
 * Status user yang valid
 */
export const USER_STATUS = {
    AKTIF: 'aktif',
    NONAKTIF: 'nonaktif',
    PENDING: 'pending',
    SUSPENDED: 'suspended'
};

/**
 * Status tenant yang valid
 */
export const TENANT_STATUS = {
    AKTIF: 'aktif',
    NONAKTIF: 'nonaktif',
    PENDING: 'pending',
    ARSIP: 'arsip'
};

/**
 * Tipe login
 */
export const LOGIN_TYPES = {
    USERS: 'users',           // Dari tabel users (admin/legacy)
    TENANT_USERS: 'tenant_users', // Dari tabel tenant_users
    PIN: 'pin'                // Login via PIN
};

/**
 * Tipe session
 */
export const SESSION_TYPES = {
    EMAIL: 'email',
    PIN: 'pin'
};

/**
 * Error messages untuk autentikasi
 */
export const AUTH_ERROR_MESSAGES = {
    // Login errors
    EMAIL_REQUIRED: 'Email wajib diisi!',
    PASSWORD_REQUIRED: 'Password wajib diisi!',
    INVALID_EMAIL: 'Format email tidak valid!',
    EMAIL_NOT_FOUND: 'Email tidak terdaftar!',
    WRONG_PASSWORD: 'Password salah!',
    
    // Account status errors
    ACCOUNT_PENDING: 'Akun Anda masih menunggu verifikasi. Silakan hubungi admin.',
    ACCOUNT_INACTIVE: 'Akun Anda telah dinonaktifkan. Silakan hubungi admin.',
    ACCOUNT_SUSPENDED: 'Akun Anda disuspend. Hubungi pemilik toko.',
    ACCOUNT_LOCKED: 'Akun terkunci. Coba lagi nanti.',
    
    // Tenant errors
    TENANT_INACTIVE: 'Toko tidak aktif. Hubungi administrator.',
    
    // Session errors
    SESSION_EXPIRED: 'Sesi Anda telah berakhir. Silakan login kembali.',
    SESSION_INVALID: 'Sesi tidak valid.',
    
    // Permission errors
    UNAUTHORIZED: 'Anda tidak memiliki akses.',
    FORBIDDEN: 'Akses ditolak.',
    
    // Generic
    SERVER_ERROR: 'Terjadi kesalahan server. Silakan coba lagi.'
};

/**
 * Redirect paths berdasarkan role
 */
export const REDIRECT_PATHS = {
    ADMIN: '/admin/dashboard',
    TENANT_OWNER: '/tenant/dashboard',
    TENANT_ADMIN: '/tenant/dashboard',
    TENANT_KASIR: '/tenant/kasir',
    LOGIN: '/login',
    DEFAULT: '/'
};