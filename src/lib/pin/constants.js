// ============================================
// PIN CONSTANTS
// File: src/lib/pin/constants.js
// Konfigurasi dan konstanta sistem PIN
// ============================================

/**
 * Panjang PIN yang digunakan
 */
export const PIN_LENGTH = 6;

/**
 * Maksimal percobaan login gagal sebelum akun dikunci
 */
export const MAX_FAILED_ATTEMPTS = 5;

/**
 * Durasi penguncian akun dalam menit
 */
export const LOCK_DURATION_MINUTES = 15;

/**
 * Durasi session PIN dalam jam (1 shift kerja)
 */
export const PIN_SESSION_HOURS = 8;

/**
 * Role yang wajib memiliki PIN
 */
export const ROLES_REQUIRE_PIN = ['kasir'];

/**
 * Role yang opsional memiliki PIN
 */
export const ROLES_OPTIONAL_PIN = ['admin'];

/**
 * Role yang tidak perlu PIN (login via email/password)
 */
export const ROLES_NO_PIN = ['owner'];

/**
 * Daftar PIN lemah yang di-hardcode (backup jika tabel weak_pins kosong)
 * PIN ini tidak boleh digunakan
 */
export const WEAK_PINS_HARDCODED = [
    // Semua angka sama
    '000000', '111111', '222222', '333333', '444444',
    '555555', '666666', '777777', '888888', '999999',
    // Urutan naik
    '012345', '123456', '234567', '345678', '456789', '567890',
    // Urutan turun
    '987654', '876543', '765432', '654321', '543210'
];

/**
 * Regex pattern untuk validasi format PIN
 */
export const PIN_REGEX = /^\d{6}$/;

/**
 * Regex untuk mendeteksi PIN dengan semua angka sama
 */
export const SAME_DIGITS_REGEX = /^(\d)\1{5}$/;

/**
 * Error messages untuk PIN
 */
export const PIN_ERROR_MESSAGES = {
    REQUIRED: 'PIN wajib diisi!',
    INVALID_LENGTH: `PIN harus ${PIN_LENGTH} digit!`,
    INVALID_FORMAT: 'PIN hanya boleh berisi angka!',
    WEAK_SAME_DIGITS: 'PIN tidak boleh semua angka sama!',
    WEAK_SEQUENTIAL: 'PIN tidak boleh berurutan!',
    WEAK_FROM_DATABASE: 'PIN tidak aman. Gunakan PIN yang lebih kuat.',
    DUPLICATE: 'PIN sudah digunakan oleh user lain di toko ini.',
    WRONG_PIN: 'PIN tidak valid!',
    ACCOUNT_LOCKED: 'Akun terkunci. Coba lagi nanti.',
    USER_INACTIVE: 'Akun tidak aktif. Hubungi pemilik toko.',
    TENANT_INACTIVE: 'Toko tidak aktif. Hubungi administrator.',
    NOT_MATCH: 'Konfirmasi PIN tidak cocok!',
    VALIDATION_FAILED: 'Gagal memvalidasi PIN. Coba lagi.',
    SET_SUCCESS: 'PIN berhasil dibuat!',
    CHANGE_SUCCESS: 'PIN berhasil diubah!',
    RESET_SUCCESS: 'PIN berhasil direset.'
};

/**
 * Action types untuk PIN history logging
 */
export const PIN_ACTIONS = {
    SET: 'set',
    CHANGE: 'change',
    RESET: 'reset'
};

/**
 * Failure reasons untuk PIN login attempts logging
 */
export const PIN_FAILURE_REASONS = {
    INVALID_FORMAT: 'invalid_format',
    TENANT_NOT_FOUND: 'tenant_not_found',
    TENANT_INACTIVE: 'tenant_inactive',
    WRONG_PIN: 'wrong_pin',
    ACCOUNT_LOCKED: 'account_locked',
    USER_INACTIVE: 'user_inactive',
    USER_PENDING: 'user_pending',
    USER_SUSPENDED: 'user_suspended'
};