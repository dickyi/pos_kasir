// ============================================
// ADMIN: PENGATURAN EMAIL - SERVER (FIXED)
// File: src/routes/(admin)/admin/settings/email/+page.server.js
// 
// FIXED: testSmtp action returns consistent response format
// ============================================

import { query } from '$lib/db.js';
import { fail } from '@sveltejs/kit';
import { sendTestEmail, checkSmtpConfiguration } from '$lib/email/index.js';

// ============================================
// LOAD FUNCTION
// ============================================

export async function load() {
    try {
        // 1. Ambil SMTP settings dari platform_settings
        const smtpSettings = await query(`
            SELECT * FROM platform_settings 
            WHERE category = 'smtp'
            ORDER BY sort_order ASC
        `);
        
        // 2. Ambil Notification settings dari platform_settings
        const notifSettings = await query(`
            SELECT * FROM platform_settings 
            WHERE category = 'notification'
            ORDER BY sort_order ASC
        `);
        
        // 3. Ambil Email Template settings
        const templates = await query(`
            SELECT 
                id,
                template_key,
                template_name,
                description,
                icon,
                is_active,
                category,
                priority,
                custom_subject,
                custom_greeting,
                custom_footer,
                send_copy_to_admin,
                admin_email,
                max_per_hour,
                max_per_day,
                cooldown_seconds,
                total_sent,
                total_failed,
                last_sent_at,
                sort_order
            FROM email_template_settings
            ORDER BY sort_order ASC
        `);
        
        // 4. Ambil statistik email
        let emailStats = {
            total_sent: 0,
            total_failed: 0,
            today_sent: 0,
            queue_pending: 0
        };
        
        try {
            const stats = await query(`SELECT * FROM v_email_stats_summary`);
            if (stats && stats[0]) {
                emailStats = {
                    total_sent: stats[0].total_sent || 0,
                    total_failed: stats[0].total_failed || 0,
                    today_sent: stats[0].today_sent || 0,
                    queue_pending: stats[0].queue_pending || 0
                };
            }
        } catch (e) {
            console.log('Email stats view not available:', e.message);
        }
        
        // 5. Check SMTP configuration status
        const smtpStatus = await checkSmtpConfiguration();
        
        // 6. Ambil recent email logs
        let recentLogs = [];
        try {
            recentLogs = await query(`
                SELECT 
                    id,
                    template_key,
                    recipient_email,
                    recipient_name,
                    subject,
                    status,
                    error_message,
                    sent_at,
                    created_at
                FROM email_logs
                ORDER BY created_at DESC
                LIMIT 10
            `);
        } catch (e) {
            console.log('Email logs not available:', e.message);
        }
        
        return {
            smtpSettings,
            notifSettings,
            templates,
            emailStats,
            smtpStatus,
            recentLogs
        };
        
    } catch (error) {
        console.error('Error loading email settings:', error);
        return {
            smtpSettings: [],
            notifSettings: [],
            templates: [],
            emailStats: {},
            smtpStatus: { configured: false, enabled: false },
            recentLogs: [],
            error: error.message
        };
    }
}

// ============================================
// ACTIONS
// ============================================

export const actions = {
    
    // ============================================
    // UPDATE SMTP SETTINGS
    // ============================================
    updateSmtp: async ({ request }) => {
        const formData = await request.formData();
        
        try {
            // Get all SMTP settings
            const smtpSettings = await query(`
                SELECT setting_key, setting_type FROM platform_settings WHERE category = 'smtp'
            `);
            
            const updates = [];
            
            for (const setting of smtpSettings) {
                const formKey = `setting_${setting.setting_key}`;
                let value;
                
                if (setting.setting_type === 'boolean') {
                    value = formData.has(formKey) ? 'true' : 'false';
                } else {
                    value = formData.get(formKey) ?? '';
                }
                
                updates.push({ key: setting.setting_key, value });
            }
            
            // Update each setting
            for (const update of updates) {
                await query(`
                    UPDATE platform_settings 
                    SET setting_value = ?, updated_at = NOW() 
                    WHERE setting_key = ?
                `, [update.value, update.key]);
            }
            
            return { 
                success: true, 
                message: `Konfigurasi SMTP berhasil disimpan!`,
                tab: 'smtp'
            };
            
        } catch (error) {
            console.error('Error updating SMTP settings:', error);
            return fail(500, { 
                success: false, 
                message: 'Gagal menyimpan konfigurasi SMTP',
                tab: 'smtp'
            });
        }
    },
    
    // ============================================
    // UPDATE NOTIFICATION SETTINGS
    // ============================================
    updateNotification: async ({ request }) => {
        const formData = await request.formData();
        
        try {
            // Get all notification settings
            const notifSettings = await query(`
                SELECT setting_key, setting_type FROM platform_settings WHERE category = 'notification'
            `);
            
            const updates = [];
            
            for (const setting of notifSettings) {
                const formKey = `setting_${setting.setting_key}`;
                let value;
                
                if (setting.setting_type === 'boolean') {
                    value = formData.has(formKey) ? 'true' : 'false';
                } else {
                    value = formData.get(formKey) ?? '';
                }
                
                updates.push({ key: setting.setting_key, value });
            }
            
            // Update each setting
            for (const update of updates) {
                await query(`
                    UPDATE platform_settings 
                    SET setting_value = ?, updated_at = NOW() 
                    WHERE setting_key = ?
                `, [update.value, update.key]);
            }
            
            return { 
                success: true, 
                message: `Pengaturan notifikasi berhasil disimpan!`,
                tab: 'notification'
            };
            
        } catch (error) {
            console.error('Error updating notification settings:', error);
            return fail(500, { 
                success: false, 
                message: 'Gagal menyimpan pengaturan notifikasi',
                tab: 'notification'
            });
        }
    },
    
    // ============================================
    // TOGGLE TEMPLATE ACTIVE STATUS
    // ============================================
    toggleTemplate: async ({ request }) => {
        const formData = await request.formData();
        const templateKey = formData.get('template_key');
        const isActive = formData.get('is_active') === 'true';
        
        try {
            await query(`
                UPDATE email_template_settings 
                SET is_active = ?, updated_at = NOW() 
                WHERE template_key = ?
            `, [isActive ? 1 : 0, templateKey]);
            
            const template = await query(`
                SELECT template_name FROM email_template_settings WHERE template_key = ?
            `, [templateKey]);
            
            const templateName = template[0]?.template_name || templateKey;
            
            return { 
                success: true, 
                message: `Template "${templateName}" ${isActive ? 'diaktifkan' : 'dinonaktifkan'}!`,
                tab: 'template'
            };
            
        } catch (error) {
            console.error('Error toggling template:', error);
            return fail(500, { 
                success: false, 
                message: 'Gagal mengubah status template',
                tab: 'template'
            });
        }
    },
    
    // ============================================
    // UPDATE TEMPLATE SETTINGS
    // ============================================
    updateTemplate: async ({ request }) => {
        const formData = await request.formData();
        const templateKey = formData.get('template_key');
        const customSubject = formData.get('custom_subject') || null;
        const customGreeting = formData.get('custom_greeting') || null;
        const customFooter = formData.get('custom_footer') || null;
        const sendCopyToAdmin = formData.has('send_copy_to_admin') ? 1 : 0;
        const adminEmail = formData.get('admin_email') || null;
        const maxPerHour = parseInt(formData.get('max_per_hour')) || 100;
        const maxPerDay = parseInt(formData.get('max_per_day')) || 1000;
        
        try {
            await query(`
                UPDATE email_template_settings 
                SET 
                    custom_subject = ?,
                    custom_greeting = ?,
                    custom_footer = ?,
                    send_copy_to_admin = ?,
                    admin_email = ?,
                    max_per_hour = ?,
                    max_per_day = ?,
                    updated_at = NOW()
                WHERE template_key = ?
            `, [
                customSubject,
                customGreeting,
                customFooter,
                sendCopyToAdmin,
                adminEmail,
                maxPerHour,
                maxPerDay,
                templateKey
            ]);
            
            return { 
                success: true, 
                message: `Template berhasil diupdate!`,
                tab: 'template'
            };
            
        } catch (error) {
            console.error('Error updating template:', error);
            return fail(500, { 
                success: false, 
                message: 'Gagal update template',
                tab: 'template'
            });
        }
    },
    
    // ============================================
    // TEST SMTP CONNECTION (FIXED)
    // ✅ Now returns consistent response format without fail()
    // ============================================
    testSmtp: async ({ request }) => {
        const formData = await request.formData();
        const testEmail = formData.get('test_email');
        
        // Validation
        if (!testEmail) {
            return { 
                success: false, 
                message: 'Email tujuan harus diisi!',
                tab: 'smtp'
            };
        }
        
        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(testEmail)) {
            return { 
                success: false, 
                message: 'Format email tidak valid!',
                tab: 'smtp'
            };
        }
        
        try {
            console.log('[Server] Sending test email to:', testEmail);
            
            const result = await sendTestEmail(testEmail);
            
            console.log('[Server] Test email result:', result);
            
            // Log to email_logs
            try {
                await query(`
                    INSERT INTO email_logs (
                        template_key, recipient_email, subject, from_email, from_name,
                        status, message_id, error_message, sent_at, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    'test_email',
                    testEmail,
                    'Test Email SMTP',
                    result.fromEmail || '',
                    result.fromName || 'POSKasir',
                    result.success ? 'sent' : 'failed',
                    result.messageId || null,
                    result.success ? null : result.message,
                    result.success ? new Date() : null
                ]);
                
                // Update template stats
                if (result.success) {
                    await query(`
                        UPDATE email_template_settings 
                        SET total_sent = total_sent + 1, last_sent_at = NOW() 
                        WHERE template_key = 'test_email'
                    `);
                } else {
                    await query(`
                        UPDATE email_template_settings 
                        SET total_failed = total_failed + 1, last_error = ? 
                        WHERE template_key = 'test_email'
                    `, [result.message]);
                }
            } catch (logError) {
                console.log('[Server] Failed to log email:', logError.message);
            }
            
            // ✅ FIXED: Always return consistent format, never use fail()
            if (result.success) {
                return { 
                    success: true, 
                    message: `✅ Test email berhasil dikirim ke ${testEmail}!`,
                    messageId: result.messageId,
                    tab: 'smtp'
                };
            } else {
                return { 
                    success: false, 
                    message: result.message || 'Gagal mengirim test email',
                    hint: result.hint || 'Periksa konfigurasi SMTP Anda',
                    tab: 'smtp'
                };
            }
            
        } catch (error) {
            console.error('[Server] Error testing SMTP:', error);
            
            // ✅ FIXED: Return error as regular response, not fail()
            return { 
                success: false, 
                message: `Gagal mengirim test email: ${error.message}`,
                tab: 'smtp'
            };
        }
    },
    
    // ============================================
    // RESET SMTP TO DEFAULT
    // ============================================
    resetSmtp: async () => {
        const defaults = {
            'smtp_enabled': 'false',
            'smtp_host': '',
            'smtp_port': '587',
            'smtp_username': '',
            'smtp_password': '',
            'smtp_encryption': 'tls',
            'smtp_from_name': 'POSKasir',
            'smtp_from_email': ''
        };
        
        try {
            for (const [key, value] of Object.entries(defaults)) {
                await query(`
                    UPDATE platform_settings 
                    SET setting_value = ?, updated_at = NOW() 
                    WHERE setting_key = ?
                `, [value, key]);
            }
            
            return { 
                success: true, 
                message: 'Konfigurasi SMTP berhasil direset!',
                tab: 'smtp'
            };
            
        } catch (error) {
            console.error('Error resetting SMTP:', error);
            return fail(500, { 
                success: false, 
                message: 'Gagal reset konfigurasi SMTP',
                tab: 'smtp'
            });
        }
    },
    
    // ============================================
    // CLEAR EMAIL LOGS
    // ============================================
    clearLogs: async ({ request }) => {
        const formData = await request.formData();
        const days = parseInt(formData.get('days')) || 30;
        
        try {
            const result = await query(`
                DELETE FROM email_logs 
                WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
            `, [days]);
            
            return { 
                success: true, 
                message: `${result.affectedRows} log email berhasil dihapus!`,
                tab: 'smtp'
            };
            
        } catch (error) {
            console.error('Error clearing logs:', error);
            return fail(500, { 
                success: false, 
                message: 'Gagal menghapus log email',
                tab: 'smtp'
            });
        }
    }
};