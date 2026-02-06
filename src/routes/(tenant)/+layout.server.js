// ============================================
// TENANT LAYOUT SERVER (UPDATED)
// File: src/routes/(tenant)/+layout.server.js
// ADDED: Load settings untuk menu visibility + Shift settings + Kas settings
// ============================================

import { redirect } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/auth.js';
import { query } from '$lib/db.js';

export async function load({ cookies, url }) {
    // Ambil user dari session
    const user = getUserFromSession(cookies);

    // Jika belum login, redirect ke login
    if (!user) {
        throw redirect(302, '/login?redirect=' + encodeURIComponent(url.pathname));
    }

    // Jika admin, redirect ke admin dashboard
    if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'support') {
        throw redirect(302, '/admin/dashboard');
    }

    // Jika bukan tenant, tidak boleh akses
    if (user.role !== 'tenant') {
        throw redirect(302, '/login');
    }

    // ========================================
    // LOAD TENANT USER DATA
    // ========================================
    let tenantUser = null;
    let finalTenantRole = user.tenant_role || null;
    let finalTenantUserId = user.tenant_user_id || null;
    let finalLoginType = user.login_type || null;
    
    if (user.tenant_user_id) {
        tenantUser = {
            id: user.tenant_user_id,
            kode_user: user.kode_user,
            email: user.email,
            nama: user.nama,
            role: user.tenant_role,
            is_primary: user.is_primary,
            avatar: user.avatar,
            tema: user.tema,
            bahasa: user.bahasa
        };
    } else {
        try {
            const tenantUsers = await query(
                `SELECT 
                    tu.id,
                    tu.kode_user,
                    tu.email,
                    tu.nama,
                    tu.role,
                    tu.is_primary,
                    tu.avatar,
                    tu.tema,
                    tu.bahasa
                FROM tenant_users tu
                WHERE tu.pelanggan_id = ?
                AND tu.email = ?
                AND tu.deleted_at IS NULL
                AND tu.status = 'aktif'
                LIMIT 1`,
                [user.pelanggan_id, user.email]
            );

            if (tenantUsers.length > 0) {
                tenantUser = tenantUsers[0];
                finalTenantRole = tenantUsers[0].role;
                finalTenantUserId = tenantUsers[0].id;
                finalLoginType = 'users';
            } else {
                tenantUser = {
                    id: null,
                    kode_user: null,
                    email: user.email,
                    nama: user.nama,
                    role: 'owner',
                    is_primary: 1,
                    avatar: null,
                    tema: 'light',
                    bahasa: 'id'
                };
                finalTenantRole = 'owner';
                finalLoginType = 'users';
            }
        } catch (error) {
            console.error('Error loading tenant user:', error);
            tenantUser = {
                id: null,
                kode_user: null,
                email: user.email,
                nama: user.nama,
                role: 'owner',
                is_primary: 1,
                avatar: null,
                tema: 'light',
                bahasa: 'id'
            };
            finalTenantRole = 'owner';
            finalLoginType = 'users';
        }
    }

    // ========================================
    // LOAD SETTINGS (untuk menu visibility + shift + kas)
    // ========================================
    let settings = null;
    try {
        const settingsResult = await query(
            `SELECT * FROM pengaturan WHERE pelanggan_id = ?`,
            [user.pelanggan_id]
        );
        
        if (settingsResult && settingsResult.length > 0) {
            // Merge dengan default untuk pastikan semua key ada
            settings = {
                ...getDefaultSettings(),
                ...settingsResult[0]
            };
        } else {
            settings = getDefaultSettings();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        settings = getDefaultSettings();
    }

    // Return user data untuk digunakan di layout dan halaman
    return {
        user: {
            id: user.id,
            email: user.email,
            nama: user.nama,
            role: user.role,
            pelanggan_id: user.pelanggan_id,
            nama_bisnis: user.nama_bisnis,
            kode_pelanggan: user.kode_pelanggan,
            status: user.status,
            tenant_role: finalTenantRole,
            tenant_user_id: finalTenantUserId,
            login_type: finalLoginType
        },
        tenantUser: tenantUser,
        settings: settings
    };
}

/**
 * Default settings (termasuk menu visibility + shift + kas settings)
 */
function getDefaultSettings() {
    return {
        // ========================================
        // MENU VISIBILITY
        // ========================================
        menu_dashboard: true,
        menu_produk: true,
        menu_kategori: true,
        menu_merk: false,      // Default OFF untuk UMKM F&B
        menu_kasir: true,
        menu_transaksi: true,
        menu_laporan: true,
        menu_users: true,
        menu_pengaturan: true,
        
        // ========================================
        // GENERAL SETTINGS
        // ========================================
        pajak_persen: 0,
        pembulatan: 'none',
        auto_print: false,
        stok_warning_threshold: 10,
        
        // ========================================
        // STRUK SETTINGS
        // ========================================
        struk_logo: null,
        struk_header: '',
        struk_footer: 'Terima kasih atas kunjungan Anda!',
        tampilkan_logo: true,
        tampilkan_alamat: true,
        tampilkan_telepon: true,
        tampilkan_merk_struk: false,
        ukuran_kertas: '58mm',
        
        // ========================================
        // SHIFT & KAS SETTINGS (UPDATED)
        // ========================================
        wajib_buka_shift: true,              // Wajib buka shift sebelum transaksi
        multi_shift: false,                   // Izinkan multi shift per hari
        auto_lanjut_kas: false,               // Auto lanjutkan kas dari shift sebelumnya
        modal_kas_default: 0,                 // Modal default untuk opsi "Auto"
        limit_kas_keluar_kasir: 0,            // Limit kas keluar untuk role kasir (0 = tidak boleh, -1 = unlimited, >0 = limit)
        kas_keluar_perlu_approval: false      // Kas keluar perlu approval owner/admin
    };
}