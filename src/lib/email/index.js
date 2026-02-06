// ============================================
// EMAIL MODULE - Index / Entry Point (UPDATED)
// File: src/lib/email/index.js
// 
// Export semua fungsi dari email module
// Import dari sini: import { sendEmail } from '$lib/email'
// 
// UPDATED: Menambahkan fungsi untuk Share Login
// ============================================

// ============================================
// EXPORT DARI emailService.js
// ============================================

export {
    // Settings functions
    getEmailSettings,
    getSmtpSettings,
    
    // Transporter functions
    createTransporter,
    verifySmtpConnection,
    
    // Core send functions
    sendEmail,
    sendEmailWithRetry,
    
    // High-level email functions (existing)
    sendRegistrationEmail,
    sendApprovalEmail,
    sendRejectionEmail,
    sendTestEmail,
    
    // Share Login functions (NEW)
    sendShareLoginEmail,
    sendPinNotificationEmail,
    sendBulkShareLoginEmail,
    checkEmailShareAvailability,
    
    // Utility functions
    checkSmtpConfiguration,
    
    // Default export
    default as emailService
} from './emailService.js';

// ============================================
// EXPORT DARI emailTemplates.js
// ============================================

export {
    // Existing templates
    getRegistrationSuccessEmail,
    getNewTenantNotificationEmail,
    getApprovalEmail,
    getRejectionEmail,
    getTestEmail,
    
    // Share Login templates (NEW)
    getShareLoginKasirEmail,
    getPinNotificationEmail,
    
    // Default export
    default as emailTemplates
} from './emailTemplates.js';

// ============================================
// CONVENIENCE EXPORTS
// ============================================

// Untuk kemudahan import dalam satu object
export const ShareLoginService = {
    sendShareLoginEmail: async (...args) => {
        const { sendShareLoginEmail } = await import('./emailService.js');
        return sendShareLoginEmail(...args);
    },
    sendPinNotificationEmail: async (...args) => {
        const { sendPinNotificationEmail } = await import('./emailService.js');
        return sendPinNotificationEmail(...args);
    },
    sendBulkShareLoginEmail: async (...args) => {
        const { sendBulkShareLoginEmail } = await import('./emailService.js');
        return sendBulkShareLoginEmail(...args);
    },
    checkAvailability: async () => {
        const { checkEmailShareAvailability } = await import('./emailService.js');
        return checkEmailShareAvailability();
    }
};