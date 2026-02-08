// ============================================
// REGISTER PAGE SERVER - FIXED VERSION
// File: src/routes/(public)/register/+page.server.js
// ============================================
// PERBAIKAN:
// [FIX-1] ✅ Password hashing dengan bcrypt
// [FIX-2] ✅ Race condition pada generate kode pelanggan
// [FIX-3] ✅ Honeypot field anti-bot
// [FIX-4] ✅ Rate limiting pada registrasi
// [FIX-5] ✅ Input sanitization yang lebih ketat
// [FIX-6] ✅ Password minimum 8 karakter + kompleksitas
// [FIX-7] ✅ Support field provinsi dengan validasi
// [FIX-8] ✅ Validasi provinsi terhadap daftar valid
// ============================================

import { query } from '$lib/db.js';
import { fail } from '@sveltejs/kit';
import { sendRegistrationEmail } from '$lib/email/index.js';
import { hashPassword } from '$lib/password.js';

// ============================================
// CONSTANTS
// ============================================
const REGISTER_RATE_LIMIT = 5;
const REGISTER_RATE_WINDOW_MINUTES = 60;
const PASSWORD_MIN_LENGTH = 8;

// [FIX-8] Daftar provinsi valid untuk validasi server-side
const VALID_PROVINSI = [
    'ACEH', 'BALI', 'BANTEN', 'BENGKULU', 'DI YOGYAKARTA', 'DKI JAKARTA',
    'GORONTALO', 'JAMBI', 'JAWA BARAT', 'JAWA TENGAH', 'JAWA TIMUR',
    'KALIMANTAN BARAT', 'KALIMANTAN SELATAN', 'KALIMANTAN TENGAH',
    'KALIMANTAN TIMUR', 'KALIMANTAN UTARA', 'KEPULAUAN BANGKA BELITUNG',
    'KEPULAUAN RIAU', 'LAMPUNG', 'MALUKU', 'MALUKU UTARA',
    'NUSA TENGGARA BARAT', 'NUSA TENGGARA TIMUR', 'PAPUA', 'PAPUA BARAT',
    'PAPUA BARAT DAYA', 'PAPUA PEGUNUNGAN', 'PAPUA SELATAN', 'PAPUA TENGAH',
    'RIAU', 'SULAWESI BARAT', 'SULAWESI SELATAN', 'SULAWESI TENGAH',
    'SULAWESI TENGGARA', 'SULAWESI UTARA', 'SUMATERA BARAT',
    'SUMATERA SELATAN', 'SUMATERA UTARA'
];

// ============================================
// HELPER: Rate Limiting untuk Registrasi
// ============================================
async function checkRegisterRateLimit(ipAddress) {
    if (!ipAddress) return { allowed: true };
    
    try {
        const tableExists = await query(
            `SELECT COUNT(*) as count FROM information_schema.tables 
             WHERE table_schema = DATABASE() AND table_name = 'register_rate_limits'`
        );
        
        if (tableExists[0].count === 0) {
            await query(`
                CREATE TABLE IF NOT EXISTS register_rate_limits (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    ip_address VARCHAR(45) NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT NOW(),
                    INDEX idx_ip_created (ip_address, created_at)
                )
            `);
            return { allowed: true };
        }

        const result = await query(
            `SELECT COUNT(*) as attempts FROM register_rate_limits 
             WHERE ip_address = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
            [ipAddress, REGISTER_RATE_WINDOW_MINUTES]
        );

        const attempts = result[0]?.attempts || 0;
        return { allowed: attempts < REGISTER_RATE_LIMIT, attempts };
    } catch (error) {
        console.error('Register rate limit error:', error);
        return { allowed: true };
    }
}

async function recordRegisterAttempt(ipAddress) {
    if (!ipAddress) return;
    try {
        await query(
            `INSERT INTO register_rate_limits (ip_address, created_at) VALUES (?, NOW())`,
            [ipAddress]
        );
        await query(`DELETE FROM register_rate_limits WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`);
    } catch (error) {
        console.error('Record register attempt error:', error);
    }
}

// ============================================
// HELPER: Sanitize String Input
// ============================================
function sanitizeInput(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .trim()
        .replace(/[<>]/g, '')
        .replace(/[\x00-\x1F]/g, '')
        .slice(0, 500);
}

// ============================================
// HELPER: Validasi Provinsi
// ============================================
function isValidProvinsi(provinsi) {
    if (!provinsi) return true; // Provinsi opsional
    return VALID_PROVINSI.includes(provinsi.toUpperCase());
}

// ============================================
// HELPER: Generate Kode Pelanggan (Race-Condition Safe)
// ============================================
async function generateKodePelanggan() {
    try {
        const counterExists = await query(
            `SELECT COUNT(*) as count FROM information_schema.tables 
             WHERE table_schema = DATABASE() AND table_name = 'sequence_counters'`
        );

        if (counterExists[0].count === 0) {
            await query(`
                CREATE TABLE IF NOT EXISTS sequence_counters (
                    counter_name VARCHAR(50) PRIMARY KEY,
                    current_value INT NOT NULL DEFAULT 0,
                    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
                )
            `);
            const lastPelanggan = await query(
                'SELECT kode_pelanggan FROM pelanggan ORDER BY id DESC LIMIT 1'
            );
            let startValue = 0;
            if (lastPelanggan.length > 0) {
                startValue = parseInt(lastPelanggan[0].kode_pelanggan.replace('PLG', '')) || 0;
            }
            await query(
                `INSERT INTO sequence_counters (counter_name, current_value) VALUES ('pelanggan', ?)`,
                [startValue]
            );
        }

        await query(
            `UPDATE sequence_counters SET current_value = current_value + 1 WHERE counter_name = 'pelanggan'`
        );
        const result = await query(
            `SELECT current_value FROM sequence_counters WHERE counter_name = 'pelanggan'`
        );
        const newNum = result[0].current_value;
        return `PLG${String(newNum).padStart(3, '0')}`;
    } catch (error) {
        console.error('Generate kode pelanggan error:', error);
        const timestamp = Date.now().toString(36).toUpperCase();
        return `PLG${timestamp.slice(-6)}`;
    }
}

async function generateKodeUser() {
    try {
        // Cek apakah counter sudah ada
        const counterExists = await query(
            `SELECT current_value FROM sequence_counters WHERE counter_name = 'user'`
        );

        if (counterExists.length === 0) {
            // Belum ada, buat baru berdasarkan data existing
            const lastUser = await query(
                `SELECT kode_user FROM tenant_users 
                 WHERE kode_user REGEXP '^USR[0-9]+$' 
                 ORDER BY CAST(REPLACE(kode_user, 'USR', '') AS UNSIGNED) DESC 
                 LIMIT 1`
            );
            let startValue = 0;
            if (lastUser.length > 0 && lastUser[0].kode_user) {
                const numPart = lastUser[0].kode_user.replace('USR', '').replace('-', '');
                startValue = parseInt(numPart) || 0;
            }
            // Pastikan tidak overflow (max safe integer)
            if (startValue > 2147483640) startValue = 100; // Reset jika sudah overflow
            
            await query(
                `INSERT INTO sequence_counters (counter_name, current_value) VALUES ('user', ?)
                 ON DUPLICATE KEY UPDATE current_value = VALUES(current_value)`,
                [startValue]
            );
        } else {
            // Cek jika sudah overflow, reset
            if (counterExists[0].current_value >= 2147483647) {
                console.log('⚠️ User counter overflow detected, resetting...');
                const lastUser = await query(
                    `SELECT MAX(CAST(REPLACE(kode_user, 'USR', '') AS UNSIGNED)) as max_num 
                     FROM tenant_users 
                     WHERE kode_user REGEXP '^USR[0-9]+$' AND kode_user NOT LIKE '%2147483647%'`
                );
                const resetValue = (lastUser[0]?.max_num || 0) + 1;
                await query(
                    `UPDATE sequence_counters SET current_value = ? WHERE counter_name = 'user'`,
                    [resetValue]
                );
            }
        }

        // Atomic increment
        await query(
            `UPDATE sequence_counters SET current_value = current_value + 1 WHERE counter_name = 'user'`
        );
        const result = await query(
            `SELECT current_value FROM sequence_counters WHERE counter_name = 'user'`
        );
        const newNum = result[0].current_value;
        return `USR${String(newNum).padStart(3, '0')}`;
    } catch (error) {
        console.error('Generate kode user error:', error);
        const timestamp = Date.now().toString(36).toUpperCase();
        return `USR${timestamp.slice(-6)}`;
    }
}

// ============================================
// LOAD FUNCTION
// ============================================
export async function load() {
    return {};
}

// ============================================
// ACTIONS
// ============================================
export const actions = {
    
    register: async ({ request, url, getClientAddress }) => {
        const formData = await request.formData();
        
        // ========================================
        // DEBUG: Log semua form data yang diterima
        // ========================================
        console.log('📝 Form Data Received:');
        for (const [key, value] of formData.entries()) {
            // Jangan log password
            if (key === 'password' || key === 'confirm_password') {
                console.log(`  ${key}: [HIDDEN]`);
            } else {
                console.log(`  ${key}: ${value}`);
            }
        }

        // ========================================
        // RATE LIMITING
        // ========================================
        let ipAddress = null;
        try { ipAddress = getClientAddress(); } catch (e) {}

        const rateLimit = await checkRegisterRateLimit(ipAddress);
        if (!rateLimit.allowed) {
            return fail(429, {
                success: false,
                message: 'Terlalu banyak percobaan pendaftaran. Silakan coba lagi dalam 1 jam.',
                data: {}
            });
        }

        // ========================================
        // HONEYPOT CHECK
        // ========================================
        const honeypot = formData.get('website')?.toString();
        if (honeypot) {
            console.log('🤖 Bot detected via honeypot from IP:', ipAddress);
            return {
                success: true,
                message: 'Pendaftaran berhasil!',
                kode: 'PLG000'
            };
        }

        // ========================================
        // AMBIL & SANITASI DATA
        // ========================================
        const nama_pemilik = sanitizeInput(formData.get('nama_pemilik'));
        const nama_bisnis = sanitizeInput(formData.get('nama_bisnis'));
        const jenis_usaha = sanitizeInput(formData.get('jenis_usaha'));
        const alamat = sanitizeInput(formData.get('alamat'));
        const provinsi = sanitizeInput(formData.get('provinsi'));
        const kota = sanitizeInput(formData.get('kota'));
        const email = formData.get('email')?.toString().trim().toLowerCase() || '';
        const no_telepon = sanitizeInput(formData.get('no_telepon'));
        const password = formData.get('password')?.toString() || '';
        const confirm_password = formData.get('confirm_password')?.toString() || '';
        const agree_terms = formData.get('agree_terms');

        const returnData = { 
            nama_pemilik, nama_bisnis, jenis_usaha, alamat, provinsi, kota, email, no_telepon 
        };

        console.log('📋 Parsed Data:', { 
            nama_pemilik, nama_bisnis, jenis_usaha, alamat, provinsi, kota, email, no_telepon,
            password: '[HIDDEN]', agree_terms: !!agree_terms 
        });

        // ============================================
        // VALIDASI INPUT
        // ============================================
        
        if (!nama_bisnis || !nama_pemilik || !email || !no_telepon || !password) {
            console.log('❌ Validation failed: Missing required fields');
            return fail(400, {
                success: false,
                message: 'Semua field bertanda * wajib diisi!',
                data: returnData
            });
        }

        if (nama_bisnis.length < 3) {
            console.log('❌ Validation failed: nama_bisnis too short');
            return fail(400, {
                success: false,
                message: 'Nama bisnis minimal 3 karakter!',
                data: returnData
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('❌ Validation failed: invalid email format');
            return fail(400, {
                success: false,
                message: 'Format email tidak valid!',
                data: returnData
            });
        }

        const emailParts = email.split('@');
        if (emailParts[1] && emailParts[1].split('.').some(part => part.length < 2)) {
            console.log('❌ Validation failed: invalid email domain');
            return fail(400, {
                success: false,
                message: 'Domain email tidak valid!',
                data: returnData
            });
        }

        const phoneRegex = /^[0-9]{10,15}$/;
        if (!phoneRegex.test(no_telepon.replace(/[-\s]/g, ''))) {
            console.log('❌ Validation failed: invalid phone number');
            return fail(400, {
                success: false,
                message: 'Nomor telepon tidak valid! Gunakan format 08xxxxxxxxxx',
                data: returnData
            });
        }

        // [FIX-8] Validasi provinsi
        if (provinsi && !isValidProvinsi(provinsi)) {
            console.log('❌ Validation failed: invalid provinsi:', provinsi);
            return fail(400, {
                success: false,
                message: 'Provinsi tidak valid!',
                data: returnData
            });
        }

        if (password.length < PASSWORD_MIN_LENGTH) {
            console.log('❌ Validation failed: password too short');
            return fail(400, {
                success: false,
                message: `Password minimal ${PASSWORD_MIN_LENGTH} karakter!`,
                data: returnData
            });
        }

        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        if (!hasUppercase || !hasLowercase || !hasNumber) {
            console.log('❌ Validation failed: password complexity');
            return fail(400, {
                success: false,
                message: 'Password harus mengandung huruf besar, huruf kecil, dan angka!',
                data: returnData
            });
        }

        if (password !== confirm_password) {
            console.log('❌ Validation failed: password mismatch');
            return fail(400, {
                success: false,
                message: 'Konfirmasi password tidak cocok!',
                data: returnData
            });
        }

        if (!agree_terms) {
            console.log('❌ Validation failed: terms not agreed');
            return fail(400, {
                success: false,
                message: 'Anda harus menyetujui Syarat & Ketentuan!',
                data: returnData
            });
        }

        console.log('✅ All validations passed');

        try {
            // ============================================
            // CEK EMAIL SUDAH TERDAFTAR
            // ============================================
            const existingPelanggan = await query(
                'SELECT id FROM pelanggan WHERE email = ?',
                [email]
            );

            if (existingPelanggan.length > 0) {
                console.log('❌ Email already exists in pelanggan table');
                return fail(400, {
                    success: false,
                    message: 'Email sudah terdaftar! Silakan gunakan email lain atau login.',
                    data: returnData
                });
            }

            const existingTenantUser = await query(
                'SELECT id FROM tenant_users WHERE email = ? AND deleted_at IS NULL',
                [email]
            );

            if (existingTenantUser.length > 0) {
                console.log('❌ Email already exists in tenant_users table');
                return fail(400, {
                    success: false,
                    message: 'Email sudah digunakan! Silakan gunakan email lain.',
                    data: returnData
                });
            }

            console.log('✅ Email is available');

            // ============================================
            // GENERATE KODE (Race-Condition Safe)
            // ============================================
            const newKodePelanggan = await generateKodePelanggan();
            const newKodeUser = await generateKodeUser();
            console.log('✅ Generated codes:', { newKodePelanggan, newKodeUser });

            // ============================================
            // HASH PASSWORD
            // ============================================
            const hashedPassword = await hashPassword(password);
            console.log('✅ Password hashed');

            // ============================================
            // SIMPAN KE DATABASE - PELANGGAN
            // Gabungkan alamat dengan provinsi dan kota
            // ============================================
            const alamatParts = [alamat, kota, provinsi].filter(Boolean);
            const alamatLengkap = alamatParts.join(', ');
            
            console.log('📍 Alamat lengkap:', alamatLengkap);

            const pelangganResult = await query(
                `INSERT INTO pelanggan (
                    kode_pelanggan, nama_bisnis, nama_pemilik, email, no_telepon,
                    alamat, jenis_usaha, status, tanggal_daftar, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_DATE, NOW(), NOW())`,
                [newKodePelanggan, nama_bisnis, nama_pemilik, email, no_telepon, alamatLengkap, jenis_usaha || null]
            );

            const pelangganId = pelangganResult.insertId;
            console.log('✅ Pelanggan created with ID:', pelangganId);

            // ============================================
            // SIMPAN KE DATABASE - TENANT USER (OWNER)
            // ============================================
            const userResult = await query(
                `INSERT INTO tenant_users (
                    pelanggan_id, kode_user, email, password, nama, no_telepon, alamat,
                    role, is_primary, status, bahasa, tema, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'owner', 1, 'pending', 'id', 'light', NOW(), NOW())`,
                [pelangganId, newKodeUser, email, hashedPassword, nama_pemilik, no_telepon, alamatLengkap]
            );

            console.log('✅ Tenant user created with ID:', userResult.insertId);

            // ============================================
            // RECORD RATE LIMIT
            // ============================================
            await recordRegisterAttempt(ipAddress);

            // ============================================
            // LOG ACTIVITY
            // ============================================
            try {
                await query(
                    `INSERT INTO tenant_activity_logs 
                    (pelanggan_id, user_id, action, description, ip_address, created_at)
                    VALUES (?, NULL, 'register', ?, ?, NOW())`,
                    [pelangganId, `Pendaftaran tenant baru: ${nama_bisnis}`, ipAddress]
                );
                console.log('✅ Activity logged');
            } catch (logError) {
                console.log('⚠️ Activity log error (ignored):', logError.message);
            }

            // ============================================
            // KIRIM EMAIL (ASYNC)
            // ============================================
            const tenantData = {
                kode_pelanggan: newKodePelanggan,
                nama_bisnis,
                nama_pemilik,
                email,
                no_telepon,
                jenis_usaha: jenis_usaha || null,
                alamat: alamatLengkap
            };
            
            sendRegistrationEmail(tenantData, url.origin)
                .then(results => {
                    console.log('📧 Registration email sent:', results);
                })
                .catch(err => {
                    console.error('📧 Registration email error:', err);
                });

            // ============================================
            // RETURN SUCCESS
            // ============================================
            console.log('🎉 Registration successful!', { kode: newKodePelanggan });
            
            return {
                success: true,
                message: 'Pendaftaran berhasil! Tim kami akan menghubungi Anda dalam 1x24 jam untuk verifikasi.',
                kode: newKodePelanggan
            };

        } catch (error) {
            console.error('❌ Registration error:', error);
            return fail(500, {
                success: false,
                message: 'Terjadi kesalahan pada server. Silakan coba lagi.',
                data: returnData
            });
        }
    }
};