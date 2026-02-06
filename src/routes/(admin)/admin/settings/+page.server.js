// ============================================
// ADMIN: PENGATURAN UMUM - SERVER
// File: src/routes/(admin)/admin/settings/+page.server.js
// ============================================
// UPDATED: Compatible dengan email module baru
// ============================================

import { query } from '$lib/db.js';
import { fail } from '@sveltejs/kit';
import { sendTestEmail } from '$lib/email/index.js';

// Cache untuk SMTP settings (internal, tidak di-export)
let _smtpCache = null;
let _smtpCacheTime = 0;
const _CACHE_TTL = 60000; // 1 menit

// Internal function untuk clear cache (tidak di-export)
function _clearSmtpCache() {
    _smtpCache = null;
    _smtpCacheTime = 0;
}

export async function load() {
    try {
        // Ambil semua settings untuk Pengaturan Umum
        const settings = await query(`
            SELECT * FROM platform_settings 
            WHERE category IN ('general', 'contact', 'social', 'seo', 'system', 'smtp', 'security', 'notification', 'tenant', 'receipt')
            ORDER BY category, sort_order ASC
        `);
        
        // Group by category
        const groupedSettings = settings.reduce((acc, setting) => {
            if (!acc[setting.category]) {
                acc[setting.category] = [];
            }
            acc[setting.category].push(setting);
            return acc;
        }, {});
        
        return {
            settings,
            groupedSettings
        };
    } catch (error) {
        console.error('Error loading settings:', error);
        return {
            settings: [],
            groupedSettings: {},
            error: error.message
        };
    }
}

export const actions = {
    // ============================================
    // UPDATE SINGLE SETTING
    // ============================================
    updateSetting: async ({ request }) => {
        const formData = await request.formData();
        const key = formData.get('key');
        const value = formData.get('value');
        
        try {
            await query(`
                UPDATE platform_settings 
                SET setting_value = ?, updated_at = NOW() 
                WHERE setting_key = ?
            `, [value, key]);
            
            // Clear cache jika SMTP setting diupdate
            if (key.startsWith('smtp_')) {
                _clearSmtpCache();
            }
            
            return { success: true, message: 'Setting berhasil diupdate!' };
        } catch (error) {
            console.error('Error updating setting:', error);
            return fail(500, { success: false, message: 'Gagal update setting' });
        }
    },
    
    // ============================================
    // UPDATE MULTIPLE SETTINGS (BATCH)
    // ============================================
    updateBatch: async ({ request }) => {
        const formData = await request.formData();
        const category = formData.get('category');
        
        try {
            // Get all setting keys for this category first
            const categorySettings = await query(`
                SELECT setting_key, setting_type FROM platform_settings WHERE category = ?
            `, [category]);
            
            const updates = [];
            
            // Process each setting in the category
            for (const setting of categorySettings) {
                const formKey = `setting_${setting.setting_key}`;
                
                let value;
                
                if (setting.setting_type === 'boolean') {
                    // Boolean handling - checkbox returns value only when checked
                    value = formData.has(formKey) ? 'true' : 'false';
                } else {
                    // For other types, get value from form
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
            
            // Clear SMTP cache jika category smtp
            if (category === 'smtp') {
                _clearSmtpCache();
            }
            
            return { success: true, message: `${updates.length} setting berhasil diupdate!` };
        } catch (error) {
            console.error('Error batch updating settings:', error);
            return fail(500, { success: false, message: 'Gagal update settings' });
        }
    },
    
    // ============================================
    // TOGGLE MAINTENANCE MODE
    // ============================================
    toggleMaintenance: async ({ request }) => {
        const formData = await request.formData();
        const enabled = formData.get('enabled') === 'true';
        
        try {
            await query(`
                UPDATE platform_settings 
                SET setting_value = ?, updated_at = NOW() 
                WHERE setting_key = 'maintenance_mode'
            `, [enabled ? 'true' : 'false']);
            
            return { 
                success: true, 
                message: enabled ? 'Mode maintenance diaktifkan!' : 'Mode maintenance dinonaktifkan!' 
            };
        } catch (error) {
            console.error('Error toggling maintenance:', error);
            return fail(500, { success: false, message: 'Gagal mengubah mode maintenance' });
        }
    },
    
    // ============================================
    // TEST SMTP CONNECTION
    // ============================================
    testSmtp: async ({ request }) => {
        const formData = await request.formData();
        const testEmail = formData.get('test_email');
        
        if (!testEmail) {
            return fail(400, { 
                success: false, 
                message: 'Email tujuan harus diisi!' 
            });
        }
        
        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(testEmail)) {
            return fail(400, { 
                success: false, 
                message: 'Format email tidak valid!' 
            });
        }
        
        try {
            // Clear cache dulu untuk ambil settings terbaru
            _clearSmtpCache();
            
            // Kirim email test menggunakan email module baru
            const result = await sendTestEmail(testEmail);
            
            if (result.success) {
                return { 
                    success: true, 
                    message: `✅ Test email berhasil dikirim ke ${testEmail}!` 
                };
            } else {
                return fail(400, { 
                    success: false, 
                    message: result.message || 'Gagal mengirim test email'
                });
            }
        } catch (error) {
            console.error('Error testing SMTP:', error);
            return fail(500, { 
                success: false, 
                message: `Gagal mengirim test email: ${error.message}` 
            });
        }
    },
    
    // ============================================
    // RESET TO DEFAULT
    // ============================================
    resetCategory: async ({ request }) => {
        const formData = await request.formData();
        const category = formData.get('category');
        
        // Default values for each category
        const defaults = {
            system: {
                'system_timezone': 'Asia/Jakarta',
                'system_currency': 'IDR',
                'system_currency_symbol': 'Rp',
                'system_date_format': 'd/m/Y',
                'system_time_format': 'H:i',
                'system_language': 'id',
                'maintenance_mode': 'false',
                'maintenance_message': 'Sistem sedang dalam perbaikan. Silakan coba beberapa saat lagi.'
            },
            security: {
                'security_max_login_attempts': '5',
                'security_lockout_duration': '30',
                'security_session_timeout': '120',
                'security_password_min_length': '6',
                'security_require_email_verification': 'false',
                'security_enable_2fa': 'false',
                'security_allowed_file_types': 'jpg,jpeg,png,gif,pdf,xlsx,xls,doc,docx',
                'security_max_file_size': '5'
            },
            tenant: {
                'tenant_trial_days': '30',
                'tenant_max_products': '0',
                'tenant_max_transactions': '0',
                'tenant_max_users': '0',
                'tenant_max_outlets': '0',
                'tenant_auto_approve': 'true',
                'tenant_require_phone': 'true',
                'tenant_require_address': 'false'
            },
            notification: {
                'notif_email_enabled': 'true',
                'notif_email_new_tenant': 'true',
                'notif_email_new_transaction': 'false',
                'notif_email_low_stock': 'true',
                'notif_whatsapp_enabled': 'false',
                'notif_whatsapp_api_key': '',
                'notif_admin_email': ''
            },
            receipt: {
                'receipt_header': 'Terima kasih atas kunjungan Anda',
                'receipt_footer': 'Barang yang sudah dibeli tidak dapat dikembalikan',
                'receipt_show_logo': 'true',
                'receipt_show_address': 'true',
                'receipt_show_phone': 'true',
                'receipt_paper_size': '58mm'
            },
            smtp: {
                'smtp_enabled': 'false',
                'smtp_host': '',
                'smtp_port': '587',
                'smtp_username': '',
                'smtp_password': '',
                'smtp_encryption': 'tls',
                'smtp_from_name': 'POSKasir',
                'smtp_from_email': ''
            }
        };
        
        try {
            if (!defaults[category]) {
                return fail(400, { success: false, message: 'Kategori tidak valid untuk reset' });
            }
            
            for (const [key, value] of Object.entries(defaults[category])) {
                await query(`
                    UPDATE platform_settings 
                    SET setting_value = ?, updated_at = NOW() 
                    WHERE setting_key = ?
                `, [value, key]);
            }
            
            // Clear cache jika SMTP
            if (category === 'smtp') {
                _clearSmtpCache();
            }
            
            return { success: true, message: `Setting ${category} berhasil direset ke default!` };
        } catch (error) {
            console.error('Error resetting settings:', error);
            return fail(500, { success: false, message: 'Gagal reset settings' });
        }
    }
};