// ============================================
// EMAIL SERVICE - Professional Email Handler
// File: src/lib/email/emailService.js
// 
// Service untuk:
// - Ambil platform settings dari database
// - Kirim email dengan template profesional
// - Handle SMTP configuration dengan IPv4 fix
// - Error handling & retry mechanism
// - Share Login Kasir
// - PIN Notification
// - ✅ NEW: Logging semua email ke database
// 
// IMPORTANT FIXES:
// - family: 4 → Force IPv4 (fix ENETUNREACH error)
// - connectionTimeout → Prevent hanging connections
// - Retry mechanism → Auto retry on failure
// - Detailed error hints → User-friendly error messages
// 
// UPDATED: 
// - Semua email sekarang tercatat di email_logs
// - Stats template otomatis terupdate
// ============================================

import { query } from '$lib/db.js';
import nodemailer from 'nodemailer';
import {
    getRegistrationSuccessEmail,
    getNewTenantNotificationEmail,
    getApprovalEmail,
    getRejectionEmail,
    getTestEmail,
    getShareLoginKasirEmail,
    getPinNotificationEmail
} from './emailTemplates.js';

// ============================================
// CONSTANTS
// ============================================

const SMTP_TIMEOUT = {
    connection: 15000,  // 15 detik untuk establish connection
    greeting: 15000,    // 15 detik untuk SMTP greeting
    socket: 60000,      // 60 detik untuk socket operations (kirim email)
};

const RETRY_CONFIG = {
    maxAttempts: 3,
    delayMs: 2000,  // 2 detik delay antar retry
};

// ============================================
// DATABASE LOGGING - NEW
// ============================================

/**
 * Log email ke database (email_logs) dan update stats template
 * 
 * @param {Object} data - Data email yang akan di-log
 * @param {string} data.templateKey - Key template (registration_success, approval, dll)
 * @param {number|null} data.pelangganId - ID pelanggan/tenant (jika ada)
 * @param {string} data.recipientEmail - Email penerima
 * @param {string} data.recipientName - Nama penerima
 * @param {string} data.recipientType - Tipe penerima (tenant_owner, tenant_kasir, admin, dll)
 * @param {string} data.subject - Subject email
 * @param {string} data.fromEmail - Email pengirim
 * @param {string} data.fromName - Nama pengirim
 * @param {boolean} data.success - Apakah berhasil terkirim
 * @param {string|null} data.messageId - Message ID dari SMTP (jika berhasil)
 * @param {string|null} data.errorMessage - Pesan error (jika gagal)
 * @param {Object|null} data.extraData - Data tambahan (JSON)
 * @returns {Promise<number|null>} ID log yang dibuat atau null jika gagal
 */
async function logEmailToDatabase(data) {
    try {
        const {
            templateKey,
            pelangganId = null,
            recipientEmail,
            recipientName = null,
            recipientType = 'other',
            subject,
            fromEmail = '',
            fromName = 'POSKasir',
            success,
            messageId = null,
            errorMessage = null,
            extraData = null
        } = data;

        const now = new Date();
        
        // Insert ke email_logs
        const result = await query(`
            INSERT INTO email_logs (
                template_key,
                pelanggan_id,
                recipient_email,
                recipient_name,
                recipient_type,
                subject,
                from_email,
                from_name,
                status,
                message_id,
                error_message,
                extra_data,
                queued_at,
                sent_at,
                failed_at,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            templateKey,
            pelangganId,
            recipientEmail,
            recipientName,
            recipientType,
            subject,
            fromEmail,
            fromName,
            success ? 'sent' : 'failed',
            messageId,
            errorMessage,
            extraData ? JSON.stringify(extraData) : null,
            now,
            success ? now : null,
            success ? null : now
        ]);

        const logId = result.insertId;

        // Update template stats
        if (success) {
            await query(`
                UPDATE email_template_settings 
                SET total_sent = total_sent + 1, 
                    last_sent_at = NOW() 
                WHERE template_key = ?
            `, [templateKey]);
        } else {
            await query(`
                UPDATE email_template_settings 
                SET total_failed = total_failed + 1, 
                    last_error = ? 
                WHERE template_key = ?
            `, [errorMessage, templateKey]);
        }

        logEmail('info', `Email logged to database: ID ${logId}, template: ${templateKey}, status: ${success ? 'sent' : 'failed'}`);
        
        return logId;

    } catch (error) {
        // Jangan throw error, hanya log - email tetap terkirim meski logging gagal
        logEmail('warn', `Failed to log email to database: ${error.message}`);
        return null;
    }
}

// ============================================
// GET PLATFORM SETTINGS
// ============================================

/**
 * Ambil semua platform settings yang relevan untuk email
 * @returns {Promise<Object>} Settings object
 */
export async function getEmailSettings() {
    try {
        const settings = await query(`
            SELECT setting_key, setting_value 
            FROM platform_settings 
            WHERE setting_key IN (
                'app_name',
                'app_tagline',
                'app_logo',
                'contact_email',
                'contact_phone',
                'contact_whatsapp',
                'contact_address',
                'smtp_enabled',
                'smtp_host',
                'smtp_port',
                'smtp_secure',
                'smtp_encryption',
                'smtp_username',
                'smtp_password',
                'smtp_from_name',
                'smtp_from_email',
                'notif_email_enabled',
                'notif_email_new_tenant',
                'notif_admin_email'
            )
        `);
        
        // Convert array to object dengan mapping untuk compatibility
        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.setting_key] = s.setting_value;
            
            // Mapping untuk backward compatibility dengan template
            if (s.setting_key === 'app_name') settingsObj['system_name'] = s.setting_value;
            if (s.setting_key === 'app_tagline') settingsObj['system_tagline'] = s.setting_value;
            if (s.setting_key === 'app_logo') settingsObj['system_logo_url'] = s.setting_value;
            if (s.setting_key === 'smtp_username') settingsObj['smtp_user'] = s.setting_value;
        });
        
        return settingsObj;
    } catch (error) {
        console.error('[Email] Error getting email settings:', error);
        return {};
    }
}

/**
 * Ambil hanya SMTP settings
 * @returns {Promise<Object>} SMTP settings object
 */
export async function getSmtpSettings() {
    try {
        const settings = await query(`
            SELECT setting_key, setting_value 
            FROM platform_settings 
            WHERE setting_key LIKE 'smtp_%'
        `);
        
        const smtpObj = {};
        settings.forEach(s => {
            smtpObj[s.setting_key] = s.setting_value;
            // Mapping smtp_username ke smtp_user
            if (s.setting_key === 'smtp_username') {
                smtpObj['smtp_user'] = s.setting_value;
            }
        });
        
        return smtpObj;
    } catch (error) {
        console.error('[Email] Error getting SMTP settings:', error);
        return {};
    }
}

// ============================================
// CREATE TRANSPORTER
// ============================================

/**
 * Buat nodemailer transporter dari settings
 * 
 * CRITICAL FIXES untuk mencegah error:
 * 1. family: 4 → Force IPv4 (fix ENETUNREACH pada IPv6)
 * 2. connectionTimeout → Prevent indefinite hanging
 * 3. greetingTimeout → Timeout untuk SMTP handshake
 * 4. socketTimeout → Timeout untuk operasi socket
 * 5. TLS minVersion → Keamanan TLS minimum
 * 
 * @param {Object|null} smtpSettings - SMTP settings (optional, akan fetch jika null)
 * @returns {Promise<Object>} Nodemailer transporter
 */
export async function createTransporter(smtpSettings = null) {
    const settings = smtpSettings || await getSmtpSettings();
    
    // Support both smtp_user dan smtp_username
    const smtpUser = settings.smtp_user || settings.smtp_username;
    
    // Validation
    if (!settings.smtp_host) {
        throw new Error('SMTP host tidak dikonfigurasi. Silakan isi di Pengaturan > SMTP.');
    }
    if (!smtpUser) {
        throw new Error('SMTP username tidak dikonfigurasi. Silakan isi di Pengaturan > SMTP.');
    }
    if (!settings.smtp_password) {
        throw new Error('SMTP password tidak dikonfigurasi. Silakan isi di Pengaturan > SMTP.');
    }
    
    // Determine port and security
    const port = parseInt(settings.smtp_port) || 587;
    const isSecure = settings.smtp_secure === 'true' || 
                     settings.smtp_encryption === 'ssl' || 
                     port === 465;
    
    // Create transporter with all fixes
    const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: port,
        secure: isSecure,
        
        // ⭐ CRITICAL FIX: Force IPv4
        family: 4,
        
        // Authentication
        auth: {
            user: smtpUser,
            pass: settings.smtp_password
        },
        
        // ⭐ CRITICAL FIX: Timeout settings
        connectionTimeout: SMTP_TIMEOUT.connection,
        greetingTimeout: SMTP_TIMEOUT.greeting,
        socketTimeout: SMTP_TIMEOUT.socket,
        
        // TLS settings
        tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
        }
    });
    
    return transporter;
}

/**
 * Verify SMTP connection
 * @returns {Promise<Object>} Verification result
 */
export async function verifySmtpConnection() {
    try {
        console.log('[Email] Verifying SMTP connection...');
        
        const transporter = await createTransporter();
        await transporter.verify();
        
        console.log('[Email] ✅ SMTP connection verified successfully');
        return { 
            success: true, 
            message: 'Koneksi SMTP berhasil!' 
        };
        
    } catch (error) {
        console.error('[Email] ❌ SMTP verification failed:', error.message);
        return { 
            success: false, 
            message: error.message,
            code: error.code,
            hint: getSmtpErrorHint(error)
        };
    }
}

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Helper: Berikan hint untuk error SMTP umum
 * @param {Error} error - Error object
 * @returns {string} Human-readable hint
 */
function getSmtpErrorHint(error) {
    const errorCode = error.code || '';
    const errorMessage = (error.message || '').toLowerCase();
    
    // Network errors
    if (errorCode === 'ESOCKET' || errorMessage.includes('enetunreach')) {
        return 'Jaringan tidak dapat dijangkau. Pastikan koneksi internet stabil. Jika masih gagal, coba ganti port ke 465 dengan SSL.';
    }
    if (errorCode === 'ETIMEDOUT' || errorMessage.includes('timeout')) {
        return 'Koneksi timeout. Periksa host dan port SMTP sudah benar, atau coba lagi dalam beberapa saat.';
    }
    if (errorCode === 'ECONNREFUSED') {
        return 'Koneksi ditolak. Periksa host dan port SMTP sudah benar. Pastikan tidak ada firewall yang memblokir.';
    }
    if (errorCode === 'ENOTFOUND' || errorMessage.includes('getaddrinfo')) {
        return 'Host SMTP tidak ditemukan. Periksa nama host sudah benar (contoh: smtp.gmail.com).';
    }
    if (errorCode === 'ECONNRESET') {
        return 'Koneksi terputus. Coba lagi atau periksa konfigurasi keamanan SMTP.';
    }
    
    // Authentication errors
    if (errorCode === 'EAUTH' || errorMessage.includes('authentication') || errorMessage.includes('auth')) {
        return 'Autentikasi gagal. Periksa username dan password. Untuk Gmail, gunakan App Password (bukan password akun).';
    }
    if (errorMessage.includes('invalid login') || errorMessage.includes('invalid credentials')) {
        return 'Login gagal. Pastikan email dan password benar. Untuk Gmail, aktifkan 2FA dan gunakan App Password.';
    }
    
    // SSL/TLS errors
    if (errorMessage.includes('self signed certificate') || errorMessage.includes('certificate')) {
        return 'Masalah sertifikat SSL. Sudah ditangani secara otomatis, coba lagi.';
    }
    if (errorMessage.includes('wrong version number') || errorMessage.includes('ssl')) {
        return 'Masalah SSL/TLS. Coba ubah port: gunakan 465 dengan SSL atau 587 dengan TLS.';
    }
    
    // Gmail specific
    if (errorMessage.includes('less secure') || errorMessage.includes('security')) {
        return 'Gmail memblokir akses. Aktifkan 2FA di akun Google dan gunakan App Password.';
    }
    
    // Default hint
    return 'Periksa konfigurasi SMTP Anda di Pengaturan. Pastikan host, port, username, dan password sudah benar.';
}

/**
 * Log email operation dengan format yang konsisten
 * @param {string} level - Log level (info, success, error, warn)
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 */
function logEmail(level, message, data = {}) {
    const prefix = '[Email]';
    const icons = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warn: '⚠️'
    };
    const icon = icons[level] || '';
    
    const logData = Object.keys(data).length > 0 ? data : '';
    
    switch(level) {
        case 'error':
            console.error(`${prefix} ${icon} ${message}`, logData);
            break;
        case 'warn':
            console.warn(`${prefix} ${icon} ${message}`, logData);
            break;
        default:
            console.log(`${prefix} ${icon} ${message}`, logData);
    }
}

// ============================================
// SEND EMAIL CORE
// ============================================

/**
 * Kirim email (core function) - TIDAK ada logging di sini
 * Logging dilakukan di high-level functions
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<Object>} Send result
 */
export async function sendEmail({ to, subject, text, html }) {
    try {
        const settings = await getSmtpSettings();
        
        // Check if SMTP is enabled
        if (settings.smtp_enabled !== 'true') {
            logEmail('info', 'SMTP tidak aktif, email dilewati');
            return { 
                success: false, 
                message: 'SMTP tidak aktif. Aktifkan di Pengaturan > SMTP.',
                skipped: true
            };
        }
        
        // Create transporter
        const transporter = await createTransporter(settings);
        
        // Build mail options
        const fromName = settings.smtp_from_name || 'POSKasir';
        const fromEmail = settings.smtp_from_email || settings.smtp_user || settings.smtp_username;
        
        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            text,
            html
        };
        
        logEmail('info', `Mengirim email ke: ${to}`);
        logEmail('info', `Subject: ${subject}`);
        
        // Send email
        const info = await transporter.sendMail(mailOptions);
        
        logEmail('success', `Email terkirim! MessageId: ${info.messageId}`);
        
        return { 
            success: true, 
            messageId: info.messageId,
            message: 'Email berhasil dikirim',
            fromEmail,
            fromName
        };
        
    } catch (error) {
        const hint = getSmtpErrorHint(error);
        
        logEmail('error', `Gagal mengirim email: ${error.message}`);
        logEmail('error', `Error code: ${error.code || 'N/A'}`);
        logEmail('info', `Hint: ${hint}`);
        
        return { 
            success: false, 
            message: error.message,
            code: error.code,
            hint: hint
        };
    }
}

/**
 * Kirim email dengan retry mechanism
 * @param {Object} emailOptions - Email options (to, subject, text, html)
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} Send result
 */
export async function sendEmailWithRetry(emailOptions, maxRetries = RETRY_CONFIG.maxAttempts) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        logEmail('info', `Percobaan ${attempt}/${maxRetries} mengirim email ke: ${emailOptions.to}`);
        
        const result = await sendEmail(emailOptions);
        
        if (result.success) {
            if (attempt > 1) {
                logEmail('success', `Berhasil pada percobaan ke-${attempt}`);
            }
            return result;
        }
        
        // Jika error karena SMTP disabled, jangan retry
        if (result.skipped) {
            return result;
        }
        
        lastError = result;
        
        // Jika bukan attempt terakhir, tunggu sebelum retry
        if (attempt < maxRetries) {
            logEmail('warn', `Gagal, mencoba lagi dalam ${RETRY_CONFIG.delayMs/1000} detik...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.delayMs));
        }
    }
    
    logEmail('error', `Semua ${maxRetries} percobaan gagal`);
    return lastError;
}

// ============================================
// HIGH-LEVEL EMAIL FUNCTIONS WITH LOGGING
// ============================================

/**
 * Kirim email registrasi ke tenant baru + notifikasi ke admin
 * ✅ UPDATED: Dengan logging ke database
 * 
 * @param {Object} tenantData - Data tenant yang mendaftar
 * @param {string} origin - Origin URL untuk link
 * @returns {Promise<Object>} Results for tenant and admin emails
 */
export async function sendRegistrationEmail(tenantData, origin = '') {
    const results = {
        tenantEmail: { sent: false, error: null, logId: null },
        adminEmail: { sent: false, error: null, logId: null }
    };
    
    try {
        const settings = await getEmailSettings();
        
        // Check SMTP enabled
        if (settings.smtp_enabled !== 'true') {
            logEmail('info', 'SMTP tidak aktif, email registrasi dilewati');
            return { sent: false, reason: 'SMTP tidak aktif' };
        }
        
        // 1. Email ke Tenant (konfirmasi pendaftaran)
        if (tenantData.email) {
            try {
                logEmail('info', `Mengirim email registrasi ke tenant: ${tenantData.email}`);
                
                const tenantEmailContent = getRegistrationSuccessEmail(tenantData, settings);
                const tenantResult = await sendEmailWithRetry({
                    to: tenantData.email,
                    ...tenantEmailContent
                });
                
                results.tenantEmail.sent = tenantResult.success;
                
                // ✅ Log ke database
                const logId = await logEmailToDatabase({
                    templateKey: 'registration_success',
                    pelangganId: tenantData.id || null,
                    recipientEmail: tenantData.email,
                    recipientName: tenantData.nama_pemilik,
                    recipientType: 'tenant_owner',
                    subject: tenantEmailContent.subject,
                    fromEmail: tenantResult.fromEmail || '',
                    fromName: tenantResult.fromName || 'POSKasir',
                    success: tenantResult.success,
                    messageId: tenantResult.messageId || null,
                    errorMessage: tenantResult.success ? null : tenantResult.message,
                    extraData: {
                        kode_pelanggan: tenantData.kode_pelanggan,
                        nama_bisnis: tenantData.nama_bisnis
                    }
                });
                results.tenantEmail.logId = logId;
                
                if (!tenantResult.success) {
                    results.tenantEmail.error = tenantResult.message;
                    results.tenantEmail.hint = tenantResult.hint;
                }
            } catch (err) {
                logEmail('error', `Error sending tenant registration email: ${err.message}`);
                results.tenantEmail.error = err.message;
            }
        }
        
        // 2. Email ke Admin (jika enabled)
        if (settings.notif_email_new_tenant === 'true' && settings.notif_admin_email) {
            try {
                logEmail('info', `Mengirim notifikasi ke admin: ${settings.notif_admin_email}`);
                
                const adminEmailData = {
                    ...tenantData,
                    adminUrl: `${origin}/admin/tenant`
                };
                const adminEmailContent = getNewTenantNotificationEmail(adminEmailData, settings);
                const adminResult = await sendEmailWithRetry({
                    to: settings.notif_admin_email,
                    ...adminEmailContent
                });
                
                results.adminEmail.sent = adminResult.success;
                
                // ✅ Log ke database
                const logId = await logEmailToDatabase({
                    templateKey: 'new_tenant_notification',
                    pelangganId: tenantData.id || null,
                    recipientEmail: settings.notif_admin_email,
                    recipientName: 'Admin',
                    recipientType: 'admin',
                    subject: adminEmailContent.subject,
                    fromEmail: adminResult.fromEmail || '',
                    fromName: adminResult.fromName || 'POSKasir',
                    success: adminResult.success,
                    messageId: adminResult.messageId || null,
                    errorMessage: adminResult.success ? null : adminResult.message,
                    extraData: {
                        kode_pelanggan: tenantData.kode_pelanggan,
                        nama_bisnis: tenantData.nama_bisnis,
                        tenant_email: tenantData.email
                    }
                });
                results.adminEmail.logId = logId;
                
                if (!adminResult.success) {
                    results.adminEmail.error = adminResult.message;
                    results.adminEmail.hint = adminResult.hint;
                }
            } catch (err) {
                logEmail('error', `Error sending admin notification email: ${err.message}`);
                results.adminEmail.error = err.message;
            }
        } else {
            logEmail('info', 'Notifikasi admin dilewati (disabled atau email admin tidak diisi)');
        }
        
        return results;
        
    } catch (error) {
        logEmail('error', `Error in sendRegistrationEmail: ${error.message}`);
        return { sent: false, error: error.message };
    }
}

/**
 * Kirim email approval ke tenant
 * ✅ UPDATED: Dengan logging ke database
 * 
 * @param {Object} tenantData - Data tenant
 * @param {string} origin - Origin URL untuk link login
 * @param {boolean} isReactivation - Apakah ini reactivation (bukan approval baru)
 * @returns {Promise<Object>} Send result
 */
export async function sendApprovalEmail(tenantData, origin = '', isReactivation = false) {
    try {
        const settings = await getEmailSettings();
        
        // Check SMTP enabled
        if (settings.smtp_enabled !== 'true') {
            logEmail('info', 'SMTP tidak aktif, email approval dilewati');
            return { sent: false, reason: 'SMTP tidak aktif' };
        }
        
        if (!tenantData.email) {
            logEmail('warn', 'Tenant tidak memiliki email, approval email dilewati');
            return { sent: false, reason: 'Tenant tidak memiliki email' };
        }
        
        logEmail('info', `Mengirim email ${isReactivation ? 'reactivation' : 'approval'} ke: ${tenantData.email}`);
        
        const emailData = {
            ...tenantData,
            loginUrl: `${origin}/login`
        };
        
        const emailContent = getApprovalEmail(emailData, settings, isReactivation);
        
        const result = await sendEmailWithRetry({
            to: tenantData.email,
            ...emailContent
        });
        
        // ✅ Log ke database
        await logEmailToDatabase({
            templateKey: 'approval',
            pelangganId: tenantData.id || null,
            recipientEmail: tenantData.email,
            recipientName: tenantData.nama_pemilik,
            recipientType: 'tenant_owner',
            subject: emailContent.subject,
            fromEmail: result.fromEmail || '',
            fromName: result.fromName || 'POSKasir',
            success: result.success,
            messageId: result.messageId || null,
            errorMessage: result.success ? null : result.message,
            extraData: {
                nama_bisnis: tenantData.nama_bisnis,
                isReactivation: isReactivation
            }
        });
        
        return result;
        
    } catch (error) {
        logEmail('error', `Error in sendApprovalEmail: ${error.message}`);
        return { sent: false, error: error.message };
    }
}

/**
 * Kirim email rejection/suspension ke tenant
 * ✅ UPDATED: Dengan logging ke database
 * 
 * @param {Object} tenantData - Data tenant
 * @param {string} reason - Alasan rejection/suspension
 * @param {boolean} isSuspension - Apakah ini suspension (bukan rejection)
 * @returns {Promise<Object>} Send result
 */
export async function sendRejectionEmail(tenantData, reason = '', isSuspension = false) {
    try {
        const settings = await getEmailSettings();
        
        // Check SMTP enabled
        if (settings.smtp_enabled !== 'true') {
            logEmail('info', 'SMTP tidak aktif, email rejection dilewati');
            return { sent: false, reason: 'SMTP tidak aktif' };
        }
        
        if (!tenantData.email) {
            logEmail('warn', 'Tenant tidak memiliki email, rejection email dilewati');
            return { sent: false, reason: 'Tenant tidak memiliki email' };
        }
        
        logEmail('info', `Mengirim email ${isSuspension ? 'suspension' : 'rejection'} ke: ${tenantData.email}`);
        
        const emailContent = getRejectionEmail(tenantData, settings, reason, isSuspension);
        
        const result = await sendEmailWithRetry({
            to: tenantData.email,
            ...emailContent
        });
        
        // ✅ Log ke database
        await logEmailToDatabase({
            templateKey: 'rejection',
            pelangganId: tenantData.id || null,
            recipientEmail: tenantData.email,
            recipientName: tenantData.nama_pemilik,
            recipientType: 'tenant_owner',
            subject: emailContent.subject,
            fromEmail: result.fromEmail || '',
            fromName: result.fromName || 'POSKasir',
            success: result.success,
            messageId: result.messageId || null,
            errorMessage: result.success ? null : result.message,
            extraData: {
                nama_bisnis: tenantData.nama_bisnis,
                reason: reason,
                isSuspension: isSuspension
            }
        });
        
        return result;
        
    } catch (error) {
        logEmail('error', `Error in sendRejectionEmail: ${error.message}`);
        return { sent: false, error: error.message };
    }
}

/**
 * Kirim test email untuk verifikasi konfigurasi SMTP
 * ✅ UPDATED: Dengan logging ke database
 * 
 * @param {string} toEmail - Email tujuan test
 * @returns {Promise<Object>} Send result
 */
export async function sendTestEmail(toEmail) {
    try {
        logEmail('info', `Mengirim test email ke: ${toEmail}`);
        
        const settings = await getEmailSettings();
        const emailContent = getTestEmail(settings);
        
        // Test email tidak pakai retry untuk mempercepat feedback
        const result = await sendEmail({
            to: toEmail,
            ...emailContent
        });
        
        // ✅ Log ke database
        await logEmailToDatabase({
            templateKey: 'test_email',
            pelangganId: null,
            recipientEmail: toEmail,
            recipientName: 'Test',
            recipientType: 'admin',
            subject: emailContent.subject,
            fromEmail: result.fromEmail || '',
            fromName: result.fromName || 'POSKasir',
            success: result.success,
            messageId: result.messageId || null,
            errorMessage: result.success ? null : result.message,
            extraData: null
        });
        
        return result;
        
    } catch (error) {
        logEmail('error', `Error in sendTestEmail: ${error.message}`);
        return { 
            success: false, 
            message: error.message,
            hint: getSmtpErrorHint(error)
        };
    }
}

// ============================================
// SHARE LOGIN EMAIL FUNCTIONS WITH LOGGING
// ============================================

/**
 * Kirim email info login ke kasir
 * ✅ UPDATED: Dengan logging ke database
 * 
 * @param {Object} data - Data yang diperlukan
 * @returns {Promise<Object>} Send result
 */
export async function sendShareLoginEmail(data) {
    try {
        const settings = await getEmailSettings();
        
        // Check SMTP enabled
        if (settings.smtp_enabled !== 'true') {
            logEmail('info', 'SMTP tidak aktif, email share login dilewati');
            return { 
                success: false, 
                reason: 'SMTP tidak aktif',
                message: 'Email tidak terkirim karena SMTP belum diaktifkan. Silakan aktifkan SMTP di pengaturan atau gunakan metode share lain (WhatsApp/Copy).'
            };
        }
        
        // Validate required fields
        if (!data.emailKasir) {
            logEmail('warn', 'Email kasir tidak tersedia');
            return { 
                success: false, 
                reason: 'Email kasir tidak tersedia',
                message: 'Kasir ini belum memiliki alamat email. Silakan tambahkan email kasir terlebih dahulu atau gunakan metode share lain.'
            };
        }
        
        if (!data.pin) {
            logEmail('warn', 'PIN kasir tidak tersedia');
            return { 
                success: false, 
                reason: 'PIN tidak tersedia',
                message: 'Kasir ini belum memiliki PIN. Silakan set PIN terlebih dahulu.'
            };
        }
        
        logEmail('info', `Mengirim email share login ke kasir: ${data.emailKasir}`);
        logEmail('info', `Toko: ${data.namaToko}, Kasir: ${data.namaKasir}`);
        
        // Generate email content
        const emailContent = getShareLoginKasirEmail(data, settings);
        
        // Send with retry
        const result = await sendEmailWithRetry({
            to: data.emailKasir,
            ...emailContent
        });
        
        // ✅ Log ke database
        await logEmailToDatabase({
            templateKey: 'share_login_kasir',
            pelangganId: data.pelangganId || null,
            recipientEmail: data.emailKasir,
            recipientName: data.namaKasir,
            recipientType: 'tenant_kasir',
            subject: emailContent.subject,
            fromEmail: result.fromEmail || '',
            fromName: result.fromName || 'POSKasir',
            success: result.success,
            messageId: result.messageId || null,
            errorMessage: result.success ? null : result.message,
            extraData: {
                namaToko: data.namaToko,
                kodeToko: data.kodeToko,
                namaOwner: data.namaOwner || null
            }
        });
        
        if (result.success) {
            logEmail('success', `Email share login berhasil dikirim ke: ${data.emailKasir}`);
        }
        
        return result;
        
    } catch (error) {
        logEmail('error', `Error in sendShareLoginEmail: ${error.message}`);
        return { 
            success: false, 
            message: error.message,
            hint: getSmtpErrorHint(error)
        };
    }
}


/**
 * Kirim email notifikasi PIN baru atau reset PIN ke kasir
 * ✅ UPDATED: Dengan logging ke database
 * 
 * @param {Object} data - Data yang diperlukan
 * @returns {Promise<Object>} Send result
 */
export async function sendPinNotificationEmail(data) {
    try {
        const settings = await getEmailSettings();
        
        // Check SMTP enabled
        if (settings.smtp_enabled !== 'true') {
            logEmail('info', 'SMTP tidak aktif, email PIN notification dilewati');
            return { 
                success: false, 
                reason: 'SMTP tidak aktif',
                skipped: true
            };
        }
        
        // Validate email
        if (!data.emailKasir) {
            logEmail('warn', 'Email kasir tidak tersedia untuk notifikasi PIN');
            return { 
                success: false, 
                reason: 'Email kasir tidak tersedia',
                skipped: true
            };
        }
        
        const actionType = data.isReset ? 'reset' : 'new';
        logEmail('info', `Mengirim email PIN ${actionType} ke kasir: ${data.emailKasir}`);
        
        // Generate email content
        const emailContent = getPinNotificationEmail(data, settings);
        
        // Send with retry
        const result = await sendEmailWithRetry({
            to: data.emailKasir,
            ...emailContent
        });
        
        // ✅ Log ke database
        await logEmailToDatabase({
            templateKey: 'pin_notification',
            pelangganId: data.pelangganId || null,
            recipientEmail: data.emailKasir,
            recipientName: data.namaKasir,
            recipientType: 'tenant_kasir',
            subject: emailContent.subject,
            fromEmail: result.fromEmail || '',
            fromName: result.fromName || 'POSKasir',
            success: result.success,
            messageId: result.messageId || null,
            errorMessage: result.success ? null : result.message,
            extraData: {
                namaToko: data.namaToko,
                kodeToko: data.kodeToko,
                isReset: data.isReset,
                namaOwner: data.namaOwner || null
            }
        });
        
        if (result.success) {
            logEmail('success', `Email PIN ${actionType} berhasil dikirim ke: ${data.emailKasir}`);
        }
        
        return result;
        
    } catch (error) {
        logEmail('error', `Error in sendPinNotificationEmail: ${error.message}`);
        return { 
            success: false, 
            message: error.message,
            hint: getSmtpErrorHint(error)
        };
    }
}


/**
 * Kirim email share login ke banyak kasir sekaligus
 * ✅ Logging sudah terintegrasi via sendShareLoginEmail
 * 
 * @param {Array<Object>} kasirList - Array of kasir data
 * @param {Object} tokoData - Data toko (namaToko, kodeToko, loginUrl)
 * @param {string} namaOwner - Nama owner yang mengirim
 * @returns {Promise<Object>} Results summary
 */
export async function sendBulkShareLoginEmail(kasirList, tokoData, namaOwner = '') {
    const results = {
        total: kasirList.length,
        success: 0,
        failed: 0,
        skipped: 0,
        details: []
    };
    
    try {
        const settings = await getEmailSettings();
        
        // Check SMTP enabled
        if (settings.smtp_enabled !== 'true') {
            logEmail('info', 'SMTP tidak aktif, bulk email dilewati');
            return {
                ...results,
                skipped: kasirList.length,
                message: 'SMTP tidak aktif'
            };
        }
        
        logEmail('info', `Memulai bulk send ke ${kasirList.length} kasir`);
        
        for (const kasir of kasirList) {
            // Skip jika tidak punya email atau PIN
            if (!kasir.email) {
                results.skipped++;
                results.details.push({
                    nama: kasir.nama,
                    status: 'skipped',
                    reason: 'Tidak ada email'
                });
                continue;
            }
            
            if (!kasir.pin) {
                results.skipped++;
                results.details.push({
                    nama: kasir.nama,
                    status: 'skipped',
                    reason: 'Tidak ada PIN'
                });
                continue;
            }
            
            // Prepare data
            const emailData = {
                namaKasir: kasir.nama,
                emailKasir: kasir.email,
                namaToko: tokoData.namaToko,
                kodeToko: tokoData.kodeToko,
                pin: kasir.pin,
                loginUrl: tokoData.loginUrl,
                namaOwner: namaOwner,
                pelangganId: tokoData.pelangganId || null
            };
            
            // Send email (logging sudah include di dalam sendShareLoginEmail)
            const result = await sendShareLoginEmail(emailData);
            
            if (result.success) {
                results.success++;
                results.details.push({
                    nama: kasir.nama,
                    email: kasir.email,
                    status: 'success'
                });
            } else {
                results.failed++;
                results.details.push({
                    nama: kasir.nama,
                    email: kasir.email,
                    status: 'failed',
                    reason: result.message || result.reason
                });
            }
            
            // Small delay to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        logEmail('info', `Bulk send selesai: ${results.success} berhasil, ${results.failed} gagal, ${results.skipped} dilewati`);
        
        return results;
        
    } catch (error) {
        logEmail('error', `Error in sendBulkShareLoginEmail: ${error.message}`);
        return {
            ...results,
            error: error.message
        };
    }
}


/**
 * Check apakah fitur email share tersedia
 * @returns {Promise<Object>} Availability status
 */
export async function checkEmailShareAvailability() {
    try {
        const config = await checkSmtpConfiguration();
        
        return {
            available: config.configured && config.enabled,
            configured: config.configured,
            enabled: config.enabled,
            issues: config.issues,
            message: !config.configured 
                ? 'SMTP belum dikonfigurasi' 
                : !config.enabled 
                    ? 'SMTP tidak aktif'
                    : 'Email siap digunakan'
        };
        
    } catch (error) {
        return {
            available: false,
            configured: false,
            enabled: false,
            issues: [error.message],
            message: 'Gagal memeriksa konfigurasi email'
        };
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check apakah SMTP sudah dikonfigurasi dengan benar
 * @returns {Promise<Object>} Configuration status
 */
export async function checkSmtpConfiguration() {
    try {
        const settings = await getSmtpSettings();
        
        const issues = [];
        
        if (!settings.smtp_host) {
            issues.push('SMTP host belum diisi');
        }
        if (!settings.smtp_username && !settings.smtp_user) {
            issues.push('SMTP username belum diisi');
        }
        if (!settings.smtp_password) {
            issues.push('SMTP password belum diisi');
        }
        if (settings.smtp_enabled !== 'true') {
            issues.push('SMTP belum diaktifkan');
        }
        
        return {
            configured: issues.length === 0,
            enabled: settings.smtp_enabled === 'true',
            issues: issues,
            settings: {
                host: settings.smtp_host || '',
                port: settings.smtp_port || '587',
                user: settings.smtp_username || settings.smtp_user || '',
                fromName: settings.smtp_from_name || '',
                fromEmail: settings.smtp_from_email || ''
            }
        };
        
    } catch (error) {
        return {
            configured: false,
            enabled: false,
            issues: ['Gagal membaca konfigurasi: ' + error.message],
            settings: {}
        };
    }
}


// ============================================
// EXPORT DEFAULT
// ============================================

export default {
    // Settings
    getEmailSettings,
    getSmtpSettings,
    
    // Transporter
    createTransporter,
    verifySmtpConnection,
    
    // Send functions
    sendEmail,
    sendEmailWithRetry,
    
    // High-level functions (with logging)
    sendRegistrationEmail,
    sendApprovalEmail,
    sendRejectionEmail,
    sendTestEmail,
    
    // Share Login functions (with logging)
    sendShareLoginEmail,
    sendPinNotificationEmail,
    sendBulkShareLoginEmail,
    checkEmailShareAvailability,
    
    // Utilities
    checkSmtpConfiguration
};