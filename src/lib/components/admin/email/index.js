// ============================================
// EMAIL COMPONENTS - Index Export
// File: src/lib/components/admin/email/index.js
// 
// Central export for all email-related components
// Usage: import { ComponentName } from '$lib/components/admin/email';
// ============================================

// ============================================
// STORES
// ============================================
export { 
    emailStore,
    connectionStatus,
    emailStats,
    recentLogs,
    templateStats,
    updateIndicators,
    isConnected,
    isConnecting,
    hasConnectionError
} from './stores/emailStore.js';

// ============================================
// UTILITIES
// ============================================
export {
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
} from './utils/helpers.js';

// ============================================
// COMPONENTS
// ============================================

// Connection & Status
export { default as ConnectionStatus } from './components/ConnectionStatus.svelte';
export { default as NotificationToast } from './components/NotificationToast.svelte';

// Stats & Logs
export { default as EmailStatsCards } from './components/EmailStatsCards.svelte';
export { default as EmailRecentLogs } from './components/EmailRecentLogs.svelte';

// SMTP Configuration
export { default as SmtpConfigForm } from './components/SmtpConfigForm.svelte';
export { default as SmtpTestSection } from './components/SmtpTestSection.svelte';
export { default as SmtpInfoCards } from './components/SmtpInfoCards.svelte';
export { default as SmtpResetButton } from './components/SmtpResetButton.svelte';

// Templates
export { default as TemplateList } from './components/TemplateList.svelte';
export { default as TemplateEditor } from './components/TemplateEditor.svelte';

// Notifications
export { default as NotificationSettings } from './components/NotificationSettings.svelte';

// Navigation
export { default as TabNavigation } from './components/TabNavigation.svelte';