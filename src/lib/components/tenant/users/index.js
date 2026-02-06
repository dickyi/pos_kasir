// ============================================
// INDEX - Export Semua Komponen Users
// File: src/lib/components/tenant/users/index.js
// 
// FIXED: Removed duplicate imports to prevent circular reference
// ============================================

// ============================================
// UTILITY FUNCTIONS - Labels & Colors
// ============================================

/**
 * Get role label in Indonesian
 * @param {string} role - Role code (owner, manager, kasir, etc)
 * @returns {string} - Role label
 */
export function getRoleLabel(role) {
    const labels = {
        'owner': 'Owner',
        'admin': 'Admin',
        'manager': 'Manager',
        'supervisor': 'Supervisor',
        'kasir': 'Kasir',
        'staff': 'Staff',
        'gudang': 'Gudang',
        'finance': 'Finance',
        'viewer': 'Viewer'
    };
    return labels[role] || role || '-';
}

/**
 * Get status label in Indonesian
 * @param {string} status - Status code
 * @returns {string} - Status label
 */
export function getStatusLabel(status) {
    const labels = {
        'aktif': 'Aktif',
        'active': 'Aktif',
        'nonaktif': 'Nonaktif',
        'inactive': 'Nonaktif',
        'pending': 'Pending',
        'suspended': 'Suspended',
        'archived': 'Diarsipkan',
        'deleted': 'Dihapus'
    };
    return labels[status] || status || '-';
}

/**
 * Get status color classes for badges
 * @param {string} status - Status code
 * @returns {string} - Tailwind CSS classes
 */
export function getStatusColor(status) {
    const colors = {
        'aktif': 'bg-emerald-50 text-emerald-600',
        'active': 'bg-emerald-50 text-emerald-600',
        'nonaktif': 'bg-gray-100 text-gray-500',
        'inactive': 'bg-gray-100 text-gray-500',
        'pending': 'bg-amber-50 text-amber-600',
        'suspended': 'bg-red-50 text-red-600',
        'archived': 'bg-gray-100 text-gray-400',
        'deleted': 'bg-red-100 text-red-500'
    };
    return colors[status] || 'bg-gray-100 text-gray-500';
}

// ============================================
// UTILITY FUNCTIONS - Date & Time
// ============================================

/**
 * Format date to relative time in Indonesian
 * @param {string|Date|null} date - Date to format
 * @returns {string} - Relative time string
 */
export function formatRelativeTime(date) {
    if (!date) return 'Belum pernah';
    
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (isNaN(diffInSeconds)) return 'Belum pernah';
    
    if (diffInSeconds < 0) {
        return formatDate(past);
    }
    
    if (diffInSeconds < 60) {
        return 'Baru saja';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} menit lalu`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} jam lalu`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays} hari lalu`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
        return `${diffInWeeks} minggu lalu`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} bulan lalu`;
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} tahun lalu`;
}

/**
 * Format date to readable string
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
    const options = { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('id-ID', options);
}

/**
 * Format date to short format (dd MMM yyyy)
 * @param {string|Date|null} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatShortDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return d.toLocaleDateString('id-ID', options);
}

// ============================================
// UTILITY FUNCTIONS - PIN Validation
// ============================================

/**
 * Quick PIN validation (client-side)
 * @param {string} pin - PIN to validate
 * @param {number} length - Expected PIN length (default: 6)
 * @returns {{ valid: boolean, message: string }}
 */
export function quickPinValidation(pin, length = 6) {
    if (!pin) {
        return { valid: false, message: 'PIN tidak boleh kosong' };
    }

    if (!/^\d+$/.test(pin)) {
        return { valid: false, message: 'PIN hanya boleh angka' };
    }

    if (pin.length !== length) {
        return { valid: false, message: `PIN harus ${length} digit` };
    }

    if (/^(\d)\1+$/.test(pin)) {
        return { valid: false, message: 'PIN tidak boleh semua angka sama' };
    }

    let isAscending = true;
    for (let i = 1; i < pin.length; i++) {
        if (parseInt(pin[i]) !== parseInt(pin[i-1]) + 1) {
            isAscending = false;
            break;
        }
    }
    if (isAscending) {
        return { valid: false, message: 'PIN tidak boleh berurutan naik' };
    }

    let isDescending = true;
    for (let i = 1; i < pin.length; i++) {
        if (parseInt(pin[i]) !== parseInt(pin[i-1]) - 1) {
            isDescending = false;
            break;
        }
    }
    if (isDescending) {
        return { valid: false, message: 'PIN tidak boleh berurutan turun' };
    }

    const weakPins = [
        '123123', '121212', '101010', '112233', '111222',
        '123321', '111000', '000111', '112211', '221122',
        '159753', '357159', '147258', '258147', '369258',
        '123000', '000123', '111123', '321000', '000321',
        '102030', '010203', '998877', '778899', '665544'
    ];
    if (weakPins.includes(pin)) {
        return { valid: false, message: 'PIN terlalu mudah ditebak' };
    }

    if (pin.length === 6) {
        const pair = pin.substring(0, 2);
        if (pin === pair + pair + pair) {
            return { valid: false, message: 'PIN tidak boleh pola berulang' };
        }
        const triplet = pin.substring(0, 3);
        if (pin === triplet + triplet) {
            return { valid: false, message: 'PIN tidak boleh pola berulang' };
        }
    }

    return { valid: true, message: 'PIN aman!' };
}

/**
 * Format PIN action for display
 * @param {string} action - Action code from database
 * @returns {string} - Human readable action label
 */
export function formatPinAction(action) {
    const actions = {
        'set': 'Set PIN',
        'set_pin': 'Set PIN',
        'change': 'Ubah PIN',
        'change_pin': 'Ubah PIN',
        'reset': 'Reset PIN',
        'reset_pin': 'Reset PIN',
        'lock': 'Terkunci',
        'locked': 'Terkunci',
        'unlock': 'Dibuka',
        'unlocked': 'Dibuka',
        'failed_attempt': 'Gagal Login',
        'failed': 'Gagal Login',
        'verify': 'Verifikasi',
        'verified': 'Terverifikasi',
        'generate': 'Generate PIN',
        'generated': 'PIN Digenerate',
        'share': 'Dibagikan',
        'shared': 'Dibagikan',
        'email_sent': 'Email Terkirim',
        'wa_sent': 'WA Terkirim'
    };
    return actions[action] || action || '-';
}

/**
 * Get PIN action color for badges
 * @param {string} action - Action code
 * @returns {string} - Tailwind CSS classes
 */
export function getPinActionColor(action) {
    const colors = {
        'set': 'bg-emerald-50 text-emerald-600',
        'set_pin': 'bg-emerald-50 text-emerald-600',
        'change': 'bg-blue-50 text-blue-600',
        'change_pin': 'bg-blue-50 text-blue-600',
        'reset': 'bg-amber-50 text-amber-600',
        'reset_pin': 'bg-amber-50 text-amber-600',
        'lock': 'bg-red-50 text-red-600',
        'locked': 'bg-red-50 text-red-600',
        'unlock': 'bg-green-50 text-green-600',
        'unlocked': 'bg-green-50 text-green-600',
        'failed_attempt': 'bg-red-100 text-red-700',
        'failed': 'bg-red-100 text-red-700',
        'share': 'bg-purple-50 text-purple-600',
        'shared': 'bg-purple-50 text-purple-600'
    };
    return colors[action] || 'bg-gray-100 text-gray-600';
}

// ============================================
// COMPONENT EXPORTS (Named exports only)
// ============================================

// Main Components
export { default as UserTable } from './UserTable.svelte';
export { default as UserCard } from './UserCard.svelte';
export { default as UserFilters } from './UserFilters.svelte';
export { default as UserStats } from './UserStats.svelte';
export { default as UserAlerts } from './UserAlerts.svelte';

// Share Components
export { default as ShareWhatsApp } from './ShareWhatsApp.svelte';

// Modals
export { default as AddUserModal } from './modals/AddUserModal.svelte';
export { default as EditUserModal } from './modals/EditUserModal.svelte';
export { default as SetPinModal } from './modals/SetPinModal.svelte';
export { default as ResetPinModal } from './modals/ResetPinModal.svelte';
export { default as UnlockModal } from './modals/UnlockModal.svelte';
export { default as ArchiveModal } from './modals/ArchiveModal.svelte';
export { default as DeleteModal } from './modals/DeleteModal.svelte';
export { default as RestoreModal } from './modals/RestoreModal.svelte';
export { default as ResetPasswordModal } from './modals/ResetPasswordModal.svelte';
export { default as PinStatsModal } from './modals/PinStatsModal.svelte';
export { default as MobileActionsSheet } from './modals/MobileActionsSheet.svelte';
export { default as ShareModal } from './modals/ShareModal.svelte';