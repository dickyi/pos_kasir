// ============================================
// MIGRASI PASSWORD - Plain Text ke Bcrypt Hash
// File: scripts/migrate-passwords.js
// ============================================
// JALANKAN SEKALI SAJA setelah deploy kode baru!
//
// CARA MENJALANKAN:
// 1. Buka terminal di root folder proyek Anda
// 2. Jalankan: node scripts/migrate-passwords.js
//
// SEBELUM MENJALANKAN:
// - Pastikan sudah install bcrypt: npm install bcrypt
// - Pastikan MySQL/database sedang berjalan
// - BACKUP DATABASE DULU sebelum menjalankan!
//   Contoh: mysqldump -u root -p poskasir > backup_sebelum_migrasi.sql
// ============================================

import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

// ============================================
// KONFIGURASI DATABASE
// Sesuaikan dengan konfigurasi database Anda!
// ============================================
const DB_CONFIG = {
    host: 'localhost',       // ✅ Benar
    user: 'root',            // ✅ Benar (default XAMPP)
    password: '',            // ✅ Benar (default XAMPP kosong)
    database: 'pos_kasir',   // ✅ Benar (sesuai phpMyAdmin Anda)
    port: 3306               // ✅ Benar (default MySQL XAMPP)
};

// Atau jika Anda menggunakan .env, uncomment baris berikut:
// import dotenv from 'dotenv';
// dotenv.config();
// const DB_CONFIG = {
//     host: process.env.DB_HOST || 'localhost',
//     user: process.env.DB_USER || 'root',
//     password: process.env.DB_PASSWORD || '',
//     database: process.env.DB_NAME || 'poskasir',
//     port: parseInt(process.env.DB_PORT || '3306')
// };

const SALT_ROUNDS = 12;

// ============================================
// FUNGSI UTAMA
// ============================================
async function migratePasswords() {
    let connection;
    
    try {
        console.log('');
        console.log('╔══════════════════════════════════════════╗');
        console.log('║   🔐 MIGRASI PASSWORD - POSKasir        ║');
        console.log('║   Plain Text → Bcrypt Hash               ║');
        console.log('╚══════════════════════════════════════════╝');
        console.log('');

        // 1. Koneksi ke database
        console.log('📡 Menghubungkan ke database...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Berhasil terhubung ke database:', DB_CONFIG.database);
        console.log('');

        // 2. Ambil semua user yang punya password
        const [users] = await connection.execute(
            'SELECT id, email, password FROM tenant_users WHERE password IS NOT NULL AND password != ""'
        );

        console.log(`📋 Ditemukan ${users.length} user dengan password.`);
        console.log('');

        if (users.length === 0) {
            console.log('ℹ️  Tidak ada password yang perlu dimigrasi.');
            return;
        }

        // 3. Proses migrasi
        let migrated = 0;
        let skipped = 0;
        let errors = 0;

        for (const user of users) {
            try {
                // Cek apakah password sudah di-hash (bcrypt hash dimulai dengan $2b$ atau $2a$)
                if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
                    skipped++;
                    console.log(`   ⏭️  [ID:${user.id}] ${user.email} - Sudah di-hash, dilewati`);
                    continue;
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

                // Update di database
                await connection.execute(
                    'UPDATE tenant_users SET password = ?, updated_at = NOW() WHERE id = ?',
                    [hashedPassword, user.id]
                );

                migrated++;
                console.log(`   ✅ [ID:${user.id}] ${user.email} - Password berhasil di-hash`);

            } catch (err) {
                errors++;
                console.error(`   ❌ [ID:${user.id}] ${user.email} - GAGAL:`, err.message);
            }
        }

        // 4. Tampilkan hasil
        console.log('');
        console.log('══════════════════════════════════════════');
        console.log('📊 HASIL MIGRASI:');
        console.log(`   ✅ Berhasil di-hash : ${migrated} user`);
        console.log(`   ⏭️  Sudah di-hash   : ${skipped} user`);
        console.log(`   ❌ Gagal            : ${errors} user`);
        console.log(`   📋 Total            : ${users.length} user`);
        console.log('══════════════════════════════════════════');
        console.log('');

        if (errors > 0) {
            console.log('⚠️  Ada error! Cek pesan error di atas dan coba lagi untuk user yang gagal.');
        } else {
            console.log('🎉 Migrasi password selesai dengan sukses!');
            console.log('');
            console.log('📌 LANGKAH SELANJUTNYA:');
            console.log('   1. Pastikan fungsi verifyLogin() di src/lib/auth.js');
            console.log('      sudah menggunakan bcrypt.compare() untuk verifikasi password');
            console.log('   2. Test login dengan akun yang sudah dimigrasi');
            console.log('   3. Hapus file backup jika sudah yakin semua berjalan lancar');
        }

    } catch (error) {
        console.error('');
        console.error('❌ ERROR:', error.message);
        console.error('');
        
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Database tidak bisa dihubungi. Pastikan:');
            console.error('   - MySQL/MariaDB sedang berjalan');
            console.error('   - Host, port, username, password sudah benar');
            console.error('   - Cek konfigurasi DB_CONFIG di file ini');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Akses ditolak. Pastikan username dan password database benar.');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('💡 Database tidak ditemukan. Pastikan nama database benar.');
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('');
            console.log('📡 Koneksi database ditutup.');
        }
    }
}

// ============================================
// JALANKAN
// ============================================
migratePasswords();