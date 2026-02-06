// ============================================
// EMAIL UTILITIES - Helper Functions
// File: src/lib/components/admin/email/utils/helpers.js
// 
// Shared utility functions untuk email components:
// - Date formatting
// - Status badges
// - Category colors
// - Setting icons
// - Validation
// ============================================

// ============================================
// DATE & TIME FORMATTING
// ============================================

/**
 * Format date ke locale Indonesia
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format date ke format singkat
 * @param {string|Date} date - Date to format
 * @returns {string} Short formatted date
 */
export function formatDateShort(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format relative time (e.g., "2 menit lalu")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
    if (!date) return '';
    
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now - then) / 1000);
    
    if (diff < 5) return 'Baru saja';
    if (diff < 60) return `${diff} detik lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
    
    return formatDateShort(date);
}

/**
 * Format time only
 * @param {string|Date} date - Date to format
 * @returns {string} Time string (HH:MM)
 */
export function formatTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// STATUS BADGES
// ============================================

/**
 * Email status badge configuration
 */
export const STATUS_BADGES = {
    sent: { 
        bg: 'bg-emerald-100', 
        text: 'text-emerald-700', 
        border: 'border-emerald-200',
        label: 'Terkirim',
        icon: 'check-circle'
    },
    delivered: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700', 
        border: 'border-blue-200',
        label: 'Delivered',
        icon: 'check-check'
    },
    failed: { 
        bg: 'bg-red-100', 
        text: 'text-red-700', 
        border: 'border-red-200',
        label: 'Gagal',
        icon: 'x-circle'
    },
    pending: { 
        bg: 'bg-amber-100', 
        text: 'text-amber-700', 
        border: 'border-amber-200',
        label: 'Pending',
        icon: 'clock'
    },
    bounced: { 
        bg: 'bg-orange-100', 
        text: 'text-orange-700', 
        border: 'border-orange-200',
        label: 'Bounced',
        icon: 'alert-triangle'
    },
    queued: { 
        bg: 'bg-purple-100', 
        text: 'text-purple-700', 
        border: 'border-purple-200',
        label: 'Antrian',
        icon: 'layers'
    }
};

/**
 * Get status badge configuration
 * @param {string} status - Email status
 * @returns {Object} Badge configuration
 */
export function getStatusBadge(status) {
    return STATUS_BADGES[status] || { 
        bg: 'bg-gray-100', 
        text: 'text-gray-700', 
        border: 'border-gray-200',
        label: status || 'Unknown',
        icon: 'help-circle'
    };
}

// ============================================
// CATEGORY COLORS
// ============================================

/**
 * Template category color configuration
 */
export const CATEGORY_COLORS = {
    auth: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700', 
        border: 'border-blue-200',
        icon: 'shield'
    },
    notification: { 
        bg: 'bg-amber-100', 
        text: 'text-amber-700', 
        border: 'border-amber-200',
        icon: 'bell'
    },
    share: { 
        bg: 'bg-emerald-100', 
        text: 'text-emerald-700', 
        border: 'border-emerald-200',
        icon: 'share-2'
    },
    system: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-700', 
        border: 'border-gray-200',
        icon: 'settings'
    },
    transaction: { 
        bg: 'bg-purple-100', 
        text: 'text-purple-700', 
        border: 'border-purple-200',
        icon: 'receipt'
    },
    marketing: { 
        bg: 'bg-pink-100', 
        text: 'text-pink-700', 
        border: 'border-pink-200',
        icon: 'megaphone'
    }
};

/**
 * Get category color configuration
 * @param {string} category - Template category
 * @returns {Object} Color configuration
 */
export function getCategoryColor(category) {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.system;
}

// ============================================
// SETTING ICONS MAPPING
// ============================================

/**
 * Setting key to icon name mapping
 */
export const SETTING_ICONS = {
    // SMTP Settings
    'smtp_enabled': 'zap',
    'smtp_host': 'server',
    'smtp_port': 'hash',
    'smtp_username': 'at-sign',
    'smtp_password': 'lock',
    'smtp_encryption': 'shield',
    'smtp_from_name': 'user',
    'smtp_from_email': 'mail',
    
    // Notification Settings
    'notif_email_enabled': 'mail',
    'notif_email_new_tenant': 'user-plus',
    'notif_email_new_transaction': 'activity',
    'notif_email_low_stock': 'alert-triangle',
    'notif_admin_email': 'at-sign',
    
    // Default
    'default': 'settings'
};

/**
 * Get icon name for setting key
 * @param {string} key - Setting key
 * @returns {string} Icon name
 */
export function getSettingIconName(key) {
    return SETTING_ICONS[key] || SETTING_ICONS.default;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export function isValidEmail(email) {
    if (!email) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Check if setting key is password/secret
 * @param {string} key - Setting key
 * @returns {boolean} Is password field
 */
export function isPasswordField(key) {
    if (!key) return false;
    return key.includes('password') || key.includes('secret') || key.includes('api_key');
}

/**
 * Validate SMTP port
 * @param {number|string} port - Port number
 * @returns {boolean} Is valid port
 */
export function isValidPort(port) {
    const portNum = parseInt(port);
    return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
}

// ============================================
// FORMATTERS
// ============================================

/**
 * Format number with thousand separator
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('id-ID');
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 chars)
 */
export function getInitials(name) {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

// ============================================
// SMTP HELPERS
// ============================================

/**
 * Get encryption type from port
 * @param {number|string} port - SMTP port
 * @returns {string} Recommended encryption
 */
export function getEncryptionFromPort(port) {
    const portNum = parseInt(port);
    if (portNum === 465) return 'ssl';
    if (portNum === 587 || portNum === 25) return 'tls';
    return 'tls';
}

/**
 * Common SMTP configurations
 */
export const SMTP_PRESETS = {
    gmail: {
        host: 'smtp.gmail.com',
        port: 587,
        encryption: 'tls',
        note: 'Gunakan App Password (bukan password akun)'
    },
    gmail_ssl: {
        host: 'smtp.gmail.com',
        port: 465,
        encryption: 'ssl',
        note: 'Gunakan App Password (bukan password akun)'
    },
    zoho: {
        host: 'smtp.zoho.com',
        port: 587,
        encryption: 'tls',
        note: 'Gunakan email dan password Zoho'
    },
    outlook: {
        host: 'smtp.office365.com',
        port: 587,
        encryption: 'tls',
        note: 'Gunakan email dan password Microsoft'
    },
    yahoo: {
        host: 'smtp.mail.yahoo.com',
        port: 587,
        encryption: 'tls',
        note: 'Gunakan App Password'
    }
};

// ============================================
// TAB CONFIGURATION
// ============================================

/**
 * Tab configuration for email settings
 */
export const EMAIL_TABS = [
    { 
        id: 'smtp', 
        label: 'SMTP', 
        icon: 'server', 
        color: 'violet', 
        description: 'Konfigurasi server email'
    },
    { 
        id: 'template', 
        label: 'Template', 
        icon: 'file-text', 
        color: 'emerald', 
        description: 'Kelola template email'
    },
    { 
        id: 'notification', 
        label: 'Notifikasi', 
        icon: 'bell', 
        color: 'amber', 
        description: 'Pengaturan notifikasi'
    }
];

/**
 * Get tab by id
 * @param {string} tabId - Tab ID
 * @returns {Object|undefined} Tab configuration
 */
export function getTabById(tabId) {
    return EMAIL_TABS.find(tab => tab.id === tabId);
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
    // Date formatting
    formatDate,
    formatDateShort,
    formatRelativeTime,
    formatTime,
    
    // Status & Categories
    getStatusBadge,
    getCategoryColor,
    getSettingIconName,
    
    // Validation
    isValidEmail,
    isPasswordField,
    isValidPort,
    
    // Formatters
    formatNumber,
    truncate,
    getInitials,
    
    // SMTP
    getEncryptionFromPort,
    SMTP_PRESETS,
    
    // Tabs
    EMAIL_TABS,
    getTabById,
    
    // Constants
    STATUS_BADGES,
    CATEGORY_COLORS,
    SETTING_ICONS
};