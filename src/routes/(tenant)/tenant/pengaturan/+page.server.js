/**
 * ============================================
 * PENGATURAN - SERVER LOGIC (UPDATED v2)
 * ============================================
 * - ADDED: Tab Menu dan action updateMenu
 * - ADDED: Tab Shift dan action updateShift
 * - ADDED: tampilkan_merk_struk di updateStruk
 * - ADDED: Mode Kasir (Single/Per User/Multi Station)
 * - ADDED: Station Management (CRUD)
 * - ADDED: tenant_settings integration
 * ============================================
 */
import { query } from '$lib/db.js';
import { fail } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/auth.js';

/**
 * Helper: Get user from locals or session
 */
function getUser(locals, cookies) {
    if (locals?.user) {
        return locals.user;
    }
    return getUserFromSession(cookies);
}

/**
 * Check permission untuk setiap action
 */
function checkPermission(user, action) {
    if (!user) return { allowed: false, message: 'Unauthorized' };
    
    const tenantRole = user.tenant_role;
    
    const permissions = {
        updateProfil: ['owner'],
        updateAkun: ['owner', 'admin', 'kasir'],
        updatePassword: ['owner', 'admin', 'kasir'],
        updateKasir: ['owner'],
        updateStruk: ['owner'],
        updateNotifikasi: ['owner'],
        updateMenu: ['owner'],
        updateShift: ['owner']  // Shift settings hanya owner
    };
    
    const allowedRoles = permissions[action] || [];
    
    if (!tenantRole) return { allowed: true };
    
    if (allowedRoles.includes(tenantRole)) {
        return { allowed: true };
    }
    
    return { 
        allowed: false, 
        message: 'Anda tidak memiliki akses untuk mengubah pengaturan ini.' 
    };
}

/**
 * Get available tabs berdasarkan role
 */
function getAvailableTabs(tenantRole) {
    if (!tenantRole || tenantRole === 'owner') {
        return ['profil', 'akun', 'kasir', 'shift', 'struk', 'notifikasi', 'menu'];
    }
    
    if (tenantRole === 'admin') {
        return ['profil', 'akun', 'struk', 'notifikasi'];
    }
    
    if (tenantRole === 'kasir') {
        return ['akun'];
    }
    
    return ['akun'];
}

/**
 * Get edit permissions per tab
 */
function getEditPermissions(tenantRole) {
    if (!tenantRole || tenantRole === 'owner') {
        return {
            profil: true,
            akun: true,
            kasir: true,
            shift: true,
            struk: true,
            notifikasi: true,
            menu: true
        };
    }
    
    if (tenantRole === 'admin') {
        return {
            profil: false,
            akun: true,
            kasir: false,
            shift: false,
            struk: false,
            notifikasi: false,
            menu: false
        };
    }
    
    if (tenantRole === 'kasir') {
        return {
            profil: false,
            akun: true,
            kasir: false,
            shift: false,
            struk: false,
            notifikasi: false,
            menu: false
        };
    }
    
    return {
        profil: false,
        akun: true,
        kasir: false,
        shift: false,
        struk: false,
        notifikasi: false,
        menu: false
    };
}

export async function load({ parent }) {
    const parentData = await parent();
    const user = parentData?.user;
    
    if (!user) {
        return { 
            user: null, 
            settings: null,
            stations: [],
            tenantSettings: null,
            availableTabs: [],
            editPermissions: {}
        };
    }

    const pelangganId = user.pelanggan_id;
    const tenantRole = user.tenant_role;

    try {
        // Get settings dari tabel pengaturan
        const settingsResult = await query(
            `SELECT * FROM pengaturan WHERE pelanggan_id = ?`,
            [pelangganId]
        );

        // Get tenant_settings (untuk mode kasir)
        const tenantSettingsResult = await query(
            `SELECT * FROM tenant_settings WHERE pelanggan_id = ?`,
            [pelangganId]
        );

        // Get stations (untuk Multi Station mode)
        const stationsResult = await query(
            `SELECT id, kode, nama, deskripsi, is_active, urutan
             FROM stations 
             WHERE pelanggan_id = ? 
             ORDER BY urutan ASC, id ASC`,
            [pelangganId]
        );

        // Get pelanggan detail
        const pelangganResult = await query(
            `SELECT * FROM pelanggan WHERE id = ?`,
            [pelangganId]
        );

        // Get tenant user data
        let tenantUserData = null;
        if (user.tenant_user_id) {
            const tuResult = await query(
                `SELECT id, nama, email, no_telepon, avatar, role
                 FROM tenant_users WHERE id = ?`,
                [user.tenant_user_id]
            );
            tenantUserData = tuResult[0] || null;
        }

        // Merge settings dengan default
        const dbSettings = settingsResult[0] || {};
        const dbTenantSettings = tenantSettingsResult[0] || {};
        
        // Gabungkan pengaturan dan tenant_settings
        const settings = {
            ...getDefaultSettings(),
            ...dbSettings,
            // Mode Kasir dari tenant_settings
            kasir_mode: dbTenantSettings.kasir_mode || 'single',
            max_stations: dbTenantSettings.max_stations || 5,
            allow_join_shift: dbTenantSettings.allow_join_shift ?? true,
            allow_take_over: dbTenantSettings.allow_take_over ?? true,
            allow_force_close: dbTenantSettings.allow_force_close ?? true
        };
        
        const pelanggan = pelangganResult[0] || null;

        return {
            user: {
                ...user,
                nama_bisnis: pelanggan?.nama_bisnis || user.nama_bisnis,
                alamat: pelanggan?.alamat || '',
                telepon: pelanggan?.telepon || pelanggan?.no_telepon || pelanggan?.phone || '',
                deskripsi: pelanggan?.deskripsi || '',
                logo: pelanggan?.logo || null,
                kode_pelanggan: pelanggan?.kode_pelanggan || user.kode_pelanggan
            },
            tenantUserData,
            settings,
            stations: stationsResult || [],
            tenantSettings: dbTenantSettings,
            availableTabs: getAvailableTabs(tenantRole),
            editPermissions: getEditPermissions(tenantRole),
            tenantRole: tenantRole || 'owner'
        };

    } catch (error) {
        console.error('Error loading pengaturan:', error);
        return {
            user,
            settings: getDefaultSettings(),
            stations: [],
            tenantSettings: null,
            availableTabs: getAvailableTabs(tenantRole),
            editPermissions: getEditPermissions(tenantRole),
            tenantRole: tenantRole || 'owner',
            error: error.message
        };
    }
}

function getDefaultSettings() {
    return {
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
        // KASIR SETTINGS
        // ========================================
        pajak_persen: 0,
        pembulatan: 'none',
        auto_print: false,
        
        // ========================================
        // NOTIFIKASI SETTINGS
        // ========================================
        stok_warning_threshold: 10,
        notifikasi_email_stok: false,
        notifikasi_email_transaksi: false,
        
        // ========================================
        // DISPLAY SETTINGS
        // ========================================
        tema: 'light',
        bahasa: 'id',
        
        // ========================================
        // MENU VISIBILITY SETTINGS
        // ========================================
        menu_dashboard: true,
        menu_produk: true,
        menu_kategori: true,
        menu_merk: false,
        menu_kasir: true,
        menu_transaksi: true,
        menu_laporan: true,
        menu_users: true,
        menu_pengaturan: true,
        
        // ========================================
        // SHIFT & KAS SETTINGS
        // ========================================
        wajib_buka_shift: true,
        multi_shift: false,
        auto_lanjut_kas: false,
        modal_kas_default: 0,
        limit_kas_keluar_kasir: 0,
        
        // ========================================
        // MODE KASIR SETTINGS (dari tenant_settings)
        // ========================================
        kasir_mode: 'single',
        max_stations: 5,
        allow_join_shift: true,
        allow_take_over: true,
        allow_force_close: true
    };
}

export const actions = {
    /**
     * Update Profil Toko - OWNER ONLY
     */
    updateProfil: async ({ request, locals, cookies }) => {
        const user = getUser(locals, cookies);
        
        if (!user) return fail(401, { message: 'Unauthorized - Silakan login ulang', tab: 'profil' });

        const permission = checkPermission(user, 'updateProfil');
        if (!permission.allowed) {
            return fail(403, { message: permission.message, tab: 'profil' });
        }

        const formData = await request.formData();
        const nama_bisnis = formData.get('nama_bisnis')?.toString().trim();
        const alamat = formData.get('alamat')?.toString().trim();
        const no_telepon = formData.get('telepon')?.toString().trim();
        const deskripsi = formData.get('deskripsi')?.toString().trim();

        if (!nama_bisnis) {
            return fail(400, { 
                message: 'Nama bisnis wajib diisi',
                tab: 'profil'
            });
        }

        try {
            await query(
                `UPDATE pelanggan SET 
                    nama_bisnis = ?,
                    alamat = ?,
                    no_telepon = ?,
                    deskripsi = ?,
                    updated_at = NOW()
                WHERE id = ?`,
                [nama_bisnis, alamat, no_telepon, deskripsi, user.pelanggan_id]
            );

            return { 
                success: true, 
                message: 'Profil toko berhasil diperbarui',
                tab: 'profil'
            };
        } catch (error) {
            console.error('Update profil error:', error);
            return fail(500, { 
                message: 'Gagal memperbarui profil',
                tab: 'profil'
            });
        }
    },

    /**
     * Update Akun
     */
    updateAkun: async ({ request, locals, cookies }) => {
        const user = getUser(locals, cookies);
        
        if (!user) return fail(401, { message: 'Unauthorized - Silakan login ulang', tab: 'akun' });

        const permission = checkPermission(user, 'updateAkun');
        if (!permission.allowed) {
            return fail(403, { message: permission.message, tab: 'akun' });
        }

        const formData = await request.formData();
        const nama = formData.get('nama')?.toString().trim();
        const email = formData.get('email')?.toString().trim();

        if (!nama || !email) {
            return fail(400, { 
                message: 'Nama dan email wajib diisi',
                tab: 'akun'
            });
        }

        try {
            if (user.tenant_user_id) {
                const existing = await query(
                    `SELECT id FROM tenant_users 
                     WHERE email = ? AND id != ? AND pelanggan_id = ? AND deleted_at IS NULL`,
                    [email, user.tenant_user_id, user.pelanggan_id]
                );

                if (existing.length > 0) {
                    return fail(400, { 
                        message: 'Email sudah digunakan user lain',
                        tab: 'akun'
                    });
                }

                await query(
                    `UPDATE tenant_users SET 
                        nama = ?,
                        email = ?,
                        updated_at = NOW()
                    WHERE id = ?`,
                    [nama, email, user.tenant_user_id]
                );
            } else {
                const existing = await query(
                    `SELECT id FROM pelanggan WHERE email = ? AND id != ?`,
                    [email, user.pelanggan_id]
                );

                if (existing.length > 0) {
                    return fail(400, { 
                        message: 'Email sudah digunakan akun lain',
                        tab: 'akun'
                    });
                }

                await query(
                    `UPDATE pelanggan SET 
                        email = ?,
                        updated_at = NOW()
                    WHERE id = ?`,
                    [email, user.pelanggan_id]
                );
            }

            return { 
                success: true, 
                message: 'Data akun berhasil diperbarui',
                tab: 'akun'
            };
        } catch (error) {
            console.error('Update akun error:', error);
            return fail(500, { 
                message: 'Gagal memperbarui data akun',
                tab: 'akun'
            });
        }
    },

    /**
     * Ganti Password
     */
    updatePassword: async ({ request, locals, cookies }) => {
        const user = getUser(locals, cookies);
        
        if (!user) return fail(401, { message: 'Unauthorized - Silakan login ulang', tab: 'akun' });

        const permission = checkPermission(user, 'updatePassword');
        if (!permission.allowed) {
            return fail(403, { message: permission.message, tab: 'akun' });
        }

        const formData = await request.formData();
        const password_lama = formData.get('password_lama')?.toString();
        const password_baru = formData.get('password_baru')?.toString();
        const konfirmasi_password = formData.get('konfirmasi_password')?.toString();

        if (!password_lama || !password_baru || !konfirmasi_password) {
            return fail(400, { 
                message: 'Semua field password wajib diisi',
                tab: 'akun'
            });
        }

        if (password_baru.length < 6) {
            return fail(400, { 
                message: 'Password baru minimal 6 karakter',
                tab: 'akun'
            });
        }

        if (password_baru !== konfirmasi_password) {
            return fail(400, { 
                message: 'Konfirmasi password tidak cocok',
                tab: 'akun'
            });
        }

        try {
            if (user.tenant_user_id) {
                const userData = await query(
                    `SELECT password FROM tenant_users WHERE id = ?`,
                    [user.tenant_user_id]
                );

                if (!userData[0]) {
                    return fail(404, { message: 'User tidak ditemukan', tab: 'akun' });
                }

                if (userData[0].password !== password_lama) {
                    return fail(400, { 
                        message: 'Password lama tidak cocok',
                        tab: 'akun'
                    });
                }

                await query(
                    `UPDATE tenant_users SET 
                        password = ?,
                        updated_at = NOW()
                    WHERE id = ?`,
                    [password_baru, user.tenant_user_id]
                );
            } else {
                const userData = await query(
                    `SELECT password FROM pelanggan WHERE id = ?`,
                    [user.pelanggan_id]
                );

                if (!userData[0]) {
                    return fail(404, { message: 'User tidak ditemukan', tab: 'akun' });
                }

                if (userData[0].password !== password_lama) {
                    return fail(400, { 
                        message: 'Password lama tidak cocok',
                        tab: 'akun'
                    });
                }

                await query(
                    `UPDATE pelanggan SET 
                        password = ?,
                        updated_at = NOW()
                    WHERE id = ?`,
                    [password_baru, user.pelanggan_id]
                );
            }

            return { 
                success: true, 
                message: 'Password berhasil diperbarui',
                tab: 'akun'
            };
        } catch (error) {
            console.error('Update password error:', error);
            return fail(500, { 
                message: 'Gagal memperbarui password',
                tab: 'akun'
            });
        }
    },

    /**
     * Update Pengaturan Kasir - OWNER ONLY
     */
    updateKasir: async ({ request, locals, cookies }) => {
        const user = getUser(locals, cookies);
        
        if (!user) return fail(401, { message: 'Unauthorized - Silakan login ulang', tab: 'kasir' });

        const permission = checkPermission(user, 'updateKasir');
        if (!permission.allowed) {
            return fail(403, { message: permission.message, tab: 'kasir' });
        }

        const formData = await request.formData();
        const pajak_persen = parseFloat(formData.get('pajak_persen')) || 0;
        const pembulatan = formData.get('pembulatan')?.toString() || 'none';
        const auto_print = formData.get('auto_print') === 'on';

        try {
            await upsertSettings(user.pelanggan_id, {
                pajak_persen,
                pembulatan,
                auto_print: auto_print ? 1 : 0
            });

            return { 
                success: true, 
                message: 'Pengaturan kasir berhasil disimpan',
                tab: 'kasir'
            };
        } catch (error) {
            console.error('Update kasir settings error:', error);
            return fail(500, { 
                message: 'Gagal menyimpan pengaturan',
                tab: 'kasir'
            });
        }
    },

    /**
     * Update Pengaturan Shift & Kas - OWNER ONLY (UPDATED v2)
     * Sekarang juga menyimpan Mode Kasir dan Station
     */
    updateShift: async ({ request, locals, cookies }) => {
        const user = getUser(locals, cookies);
        
        if (!user) return fail(401, { message: 'Unauthorized - Silakan login ulang', tab: 'shift' });

        const permission = checkPermission(user, 'updateShift');
        if (!permission.allowed) {
            return fail(403, { message: permission.message, tab: 'shift' });
        }

        const formData = await request.formData();
        
        // ========================================
        // 1. Parse Shift Settings (tabel pengaturan)
        // ========================================
        const wajib_buka_shift = formData.get('wajib_buka_shift') === 'on';
        const modal_kas_default = parseFloat(formData.get('modal_kas_default')) || 0;
        const multi_shift = formData.get('multi_shift') === 'on';
        const auto_lanjut_kas = formData.get('auto_lanjut_kas') === 'on';
        const limit_kas_keluar_kasir = parseFloat(formData.get('limit_kas_keluar_kasir')) || 0;

        // ========================================
        // 2. Parse Mode Kasir Settings (tabel tenant_settings)
        // ========================================
        const kasir_mode = formData.get('kasir_mode')?.toString() || 'single';
        const max_stations = parseInt(formData.get('max_stations')) || 5;
        const allow_join_shift = formData.get('allow_join_shift') === 'on';
        const allow_take_over = formData.get('allow_take_over') === 'on';
        const allow_force_close = formData.get('allow_force_close') === 'on';

        // ========================================
        // 3. Parse Station Data (untuk Multi Station mode)
        // ========================================
        const stationsDataRaw = formData.get('stations_data')?.toString();
        let stationsData = [];
        if (stationsDataRaw) {
            try {
                stationsData = JSON.parse(stationsDataRaw);
            } catch (e) {
                console.error('Failed to parse stations_data:', e);
            }
        }

        try {
            // ========================================
            // A. Update tabel pengaturan (shift settings)
            // ========================================
            await upsertSettings(user.pelanggan_id, {
                wajib_buka_shift: wajib_buka_shift ? 1 : 0,
                modal_kas_default,
                multi_shift: multi_shift ? 1 : 0,
                auto_lanjut_kas: auto_lanjut_kas ? 1 : 0,
                limit_kas_keluar_kasir
            });

            // ========================================
            // B. Update tabel tenant_settings (mode kasir)
            // ========================================
            await upsertTenantSettings(user.pelanggan_id, {
                kasir_mode,
                max_stations,
                allow_join_shift: allow_join_shift ? 1 : 0,
                allow_take_over: allow_take_over ? 1 : 0,
                allow_force_close: allow_force_close ? 1 : 0
            });

            // ========================================
            // C. Update stations jika mode multi
            // ========================================
            if (kasir_mode === 'multi' && stationsData.length > 0) {
                await processStationsChanges(user.pelanggan_id, stationsData);
            }

            console.log(`✅ Shift & Mode settings updated for pelanggan ${user.pelanggan_id}`);
            console.log(`   Mode: ${kasir_mode}, Stations: ${stationsData.length}`);

            return { 
                success: true, 
                message: 'Pengaturan shift & mode kasir berhasil disimpan',
                tab: 'shift'
            };
        } catch (error) {
            console.error('Update shift settings error:', error);
            return fail(500, { 
                message: 'Gagal menyimpan pengaturan shift: ' + error.message,
                tab: 'shift'
            });
        }
    },

    /**
     * Update Pengaturan Struk - OWNER ONLY
     */
    updateStruk: async ({ request, locals, cookies }) => {
        const user = getUser(locals, cookies);
        
        if (!user) return fail(401, { message: 'Unauthorized - Silakan login ulang', tab: 'struk' });

        const permission = checkPermission(user, 'updateStruk');
        if (!permission.allowed) {
            return fail(403, { message: permission.message, tab: 'struk' });
        }

        const formData = await request.formData();
        const struk_header = formData.get('struk_header')?.toString().trim() || '';
        const struk_footer = formData.get('struk_footer')?.toString().trim() || '';
        const tampilkan_logo = formData.get('tampilkan_logo') === 'on';
        const tampilkan_alamat = formData.get('tampilkan_alamat') === 'on';
        const tampilkan_telepon = formData.get('tampilkan_telepon') === 'on';
        const tampilkan_merk_struk = formData.get('tampilkan_merk_struk') === 'on';
        const ukuran_kertas = formData.get('ukuran_kertas')?.toString() || '58mm';

        try {
            await upsertSettings(user.pelanggan_id, {
                struk_header,
                struk_footer,
                tampilkan_logo: tampilkan_logo ? 1 : 0,
                tampilkan_alamat: tampilkan_alamat ? 1 : 0,
                tampilkan_telepon: tampilkan_telepon ? 1 : 0,
                tampilkan_merk_struk: tampilkan_merk_struk ? 1 : 0,
                ukuran_kertas
            });

            return { 
                success: true, 
                message: 'Pengaturan struk berhasil disimpan',
                tab: 'struk'
            };
        } catch (error) {
            console.error('Update struk settings error:', error);
            return fail(500, { 
                message: 'Gagal menyimpan pengaturan struk: ' + error.message,
                tab: 'struk'
            });
        }
    },

    /**
     * Update Pengaturan Notifikasi - OWNER ONLY
     */
    updateNotifikasi: async ({ request, locals, cookies }) => {
        const user = getUser(locals, cookies);
        
        if (!user) return fail(401, { message: 'Unauthorized - Silakan login ulang', tab: 'notifikasi' });

        const permission = checkPermission(user, 'updateNotifikasi');
        if (!permission.allowed) {
            return fail(403, { message: permission.message, tab: 'notifikasi' });
        }

        const formData = await request.formData();
        const stok_warning_threshold = parseInt(formData.get('stok_warning_threshold')) || 10;
        const notifikasi_email_stok = formData.get('notifikasi_email_stok') === 'on';
        const notifikasi_email_transaksi = formData.get('notifikasi_email_transaksi') === 'on';

        try {
            await upsertSettings(user.pelanggan_id, {
                stok_warning_threshold,
                notifikasi_email_stok: notifikasi_email_stok ? 1 : 0,
                notifikasi_email_transaksi: notifikasi_email_transaksi ? 1 : 0
            });

            return { 
                success: true, 
                message: 'Pengaturan notifikasi berhasil disimpan',
                tab: 'notifikasi'
            };
        } catch (error) {
            console.error('Update notifikasi settings error:', error);
            return fail(500, { 
                message: 'Gagal menyimpan pengaturan',
                tab: 'notifikasi'
            });
        }
    },

    /**
     * Update Tampilan Menu - OWNER ONLY
     */
    updateMenu: async ({ request, locals, cookies }) => {
        const user = getUser(locals, cookies);
        
        if (!user) return fail(401, { message: 'Unauthorized - Silakan login ulang', tab: 'menu' });

        const permission = checkPermission(user, 'updateMenu');
        if (!permission.allowed) {
            return fail(403, { message: permission.message, tab: 'menu' });
        }

        const formData = await request.formData();
        
        // Parse menu settings
        const menuSettings = {
            menu_dashboard: formData.get('menu_dashboard') === '1',
            menu_produk: true,
            menu_kategori: formData.get('menu_kategori') === '1',
            menu_merk: formData.get('menu_merk') === '1',
            menu_kasir: true,
            menu_transaksi: formData.get('menu_transaksi') === '1',
            menu_laporan: formData.get('menu_laporan') === '1',
            menu_users: formData.get('menu_users') === '1',
            menu_pengaturan: true
        };

        try {
            await upsertSettings(user.pelanggan_id, {
                menu_dashboard: menuSettings.menu_dashboard ? 1 : 0,
                menu_produk: 1,
                menu_kategori: menuSettings.menu_kategori ? 1 : 0,
                menu_merk: menuSettings.menu_merk ? 1 : 0,
                menu_kasir: 1,
                menu_transaksi: menuSettings.menu_transaksi ? 1 : 0,
                menu_laporan: menuSettings.menu_laporan ? 1 : 0,
                menu_users: menuSettings.menu_users ? 1 : 0,
                menu_pengaturan: 1
            });

            return { 
                success: true, 
                message: 'Pengaturan tampilan menu berhasil disimpan',
                tab: 'menu'
            };
        } catch (error) {
            console.error('Update menu settings error:', error);
            return fail(500, { 
                message: 'Gagal menyimpan pengaturan menu: ' + error.message,
                tab: 'menu'
            });
        }
    }
};

/**
 * Upsert settings helper (tabel pengaturan)
 */
async function upsertSettings(pelangganId, data) {
    const existing = await query(
        `SELECT id FROM pengaturan WHERE pelanggan_id = ?`,
        [pelangganId]
    );

    if (existing.length > 0) {
        const updates = Object.keys(data).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(data), pelangganId];
        
        await query(
            `UPDATE pengaturan SET ${updates}, updated_at = NOW()
             WHERE pelanggan_id = ?`,
            values
        );
    } else {
        const columns = ['pelanggan_id', ...Object.keys(data)].join(', ');
        const placeholders = ['?', ...Object.keys(data).map(() => '?')].join(', ');
        const values = [pelangganId, ...Object.values(data)];
        
        await query(
            `INSERT INTO pengaturan (${columns}, created_at) VALUES (${placeholders}, NOW())`,
            values
        );
    }
}

/**
 * Upsert tenant_settings helper (NEW)
 */
async function upsertTenantSettings(pelangganId, data) {
    const existing = await query(
        `SELECT id FROM tenant_settings WHERE pelanggan_id = ?`,
        [pelangganId]
    );

    if (existing.length > 0) {
        const updates = Object.keys(data).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(data), pelangganId];
        
        await query(
            `UPDATE tenant_settings SET ${updates}, updated_at = NOW()
             WHERE pelanggan_id = ?`,
            values
        );
    } else {
        const columns = ['pelanggan_id', ...Object.keys(data)].join(', ');
        const placeholders = ['?', ...Object.keys(data).map(() => '?')].join(', ');
        const values = [pelangganId, ...Object.values(data)];
        
        await query(
            `INSERT INTO tenant_settings (${columns}, created_at) VALUES (${placeholders}, NOW())`,
            values
        );
    }
}

/**
 * Process station changes (NEW)
 * Handle: Add new stations, Edit existing, Delete stations
 */
async function processStationsChanges(pelangganId, stationsData) {
    for (const station of stationsData) {
        // Skip stations that are just deleted but were never saved
        if (station.isNew && station.isDeleted) {
            continue;
        }

        // DELETE station
        if (station.isDeleted && !station.isNew) {
            await query(
                `DELETE FROM stations WHERE id = ? AND pelanggan_id = ?`,
                [station.id, pelangganId]
            );
            console.log(`   Deleted station: ${station.kode}`);
            continue;
        }

        // ADD new station
        if (station.isNew && !station.isDeleted) {
            // Check if kode already exists
            const existingKode = await query(
                `SELECT id FROM stations WHERE pelanggan_id = ? AND kode = ?`,
                [pelangganId, station.kode]
            );
            
            if (existingKode.length > 0) {
                console.log(`   Station kode ${station.kode} already exists, skipping`);
                continue;
            }

            // Get max urutan
            const maxUrutan = await query(
                `SELECT COALESCE(MAX(urutan), 0) + 1 as next_urutan FROM stations WHERE pelanggan_id = ?`,
                [pelangganId]
            );
            
            await query(
                `INSERT INTO stations (pelanggan_id, kode, nama, deskripsi, is_active, urutan, created_at)
                 VALUES (?, ?, ?, ?, 1, ?, NOW())`,
                [pelangganId, station.kode, station.nama, station.deskripsi || null, maxUrutan[0].next_urutan]
            );
            console.log(`   Added station: ${station.kode} - ${station.nama}`);
            continue;
        }

        // UPDATE existing station
        if (station.isEdited && !station.isDeleted) {
            await query(
                `UPDATE stations SET 
                    kode = ?, 
                    nama = ?, 
                    deskripsi = ?,
                    updated_at = NOW()
                 WHERE id = ? AND pelanggan_id = ?`,
                [station.kode, station.nama, station.deskripsi || null, station.id, pelangganId]
            );
            console.log(`   Updated station: ${station.kode}`);
        }
    }
}