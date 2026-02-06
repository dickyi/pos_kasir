// ============================================
// EMAIL HELPER - Backward Compatibility Wrapper
// File: src/lib/email.js
// 
// Re-export dari email module untuk backward compatibility
// 
// CARA IMPORT:
// import { sendEmail, sendTestEmail } from '$lib/email.js'
// atau
// import { sendEmail } from '$lib/email'
// ============================================

// Re-export semua dari email module
export * from './email/index.js';

// Default export untuk compatibility
export { default as emailService } from './email/emailService.js';
export { default as emailTemplates } from './email/emailTemplates.js';