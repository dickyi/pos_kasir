/**
 * +page.server.js - Kelola User (REFACTORED VERSION)
 * ===================================================
 * Halaman untuk mengelola user tenant (owner, admin, kasir)
 * 
 * FITUR:
 * - CRUD User (Create, Read, Update, Delete)
 * - Archive & Restore User
 * - Set/Reset PIN dengan validasi keamanan
 * - Unlock akun yang terkunci
 * - Generate PIN otomatis
 * - PIN Statistics
 * - Share via WhatsApp (kodeToko & namaToko)
 * 
 * RELASI DATA YANG DICEK:
 * - transaksi: tenant_user_id
 * - shifts: tenant_user_id, closed_by
 * - shift_users: tenant_user_id
 * - hold_bills: tenant_user_id
 * - kas_transaksi: tenant_user_id, approved_by
 * - stok_log: tenant_user_id
 * 
 * INTEGRASI PIN LIBRARY:
 * - validation.js: validatePin, isWeakPin, generateSecurePin
 * - management.js: setUserPin, resetUserPin, unlockUserAccount
 * - history.js: logPinChange, getPinStatistics
 * ===================================================
 */

import { query } from '$lib/db.js';
import { redirect, fail, error } from '@sveltejs/kit';

// ==========================================
// IMPORT PIN LIBRARY
// ==========================================
import {
    // Validation
    validatePinFormat,
    isWeakPin,
    validatePin,
    generateSecurePin,
    
    // Management
    setUserPin,
    resetUserPin,
    unlockUserAccount,
    getUsersWithoutPin,
    getPinStatistics,
    
    // Constants
    PIN_LENGTH,
    ROLES_REQUIRE_PIN,
    ROLES_OPTIONAL_PIN,
    ROLES_NO_PIN,
    PIN_ERROR_MESSAGES
} from '$lib/pin/index.js';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get user data dari locals (untuk form actions)
 */
async function getUserFromLocals(locals) {
    if (locals.user) {
        if (!locals.tenantUser && locals.user.pelanggan_id) {
            try {
                const tenantUsers = await query(
                    `SELECT id, kode_user, nama, email, role, status 
                     FROM tenant_users 
                     WHERE pelanggan_id = ? AND email = ? AND deleted_at IS NULL`,
                    [locals.user.pelanggan_id, locals.user.email]
                );
                if (tenantUsers.length > 0) {
                    locals.tenantUser = tenantUsers[0];
                }
            } catch (e) {
                console.log('Error getting tenant user:', e.message);
            }
        }
        return {
            user: locals.user,
            tenantUser: locals.tenantUser
        };
    }
    return { user: null, tenantUser: null };
}

/**
 * Validasi permission - hanya owner yang bisa kelola user
 */
function validateOwnerPermission(user, tenantUser) {
    const userRole = tenantUser?.role?.toLowerCase() || 
                     user?.tenant_role?.toLowerCase() || 
                     user?.role?.toLowerCase();
    return userRole === 'owner';
}

/**
 * Validasi permission untuk kelola PIN
 * Owner bisa kelola semua, Admin bisa kelola kasir
 */
function validatePinPermission(user, tenantUser, targetRole) {
    const currentRole = tenantUser?.role?.toLowerCase() || 
                        user?.tenant_role?.toLowerCase() || 
                        user?.role?.toLowerCase();
    
    // Owner bisa kelola semua
    if (currentRole === 'owner') return true;
    
    // Admin hanya bisa kelola kasir
    if (currentRole === 'admin' && targetRole === 'kasir') return true;
    
    return false;
}

/**
 * Generate kode user unik
 */
async function generateKodeUser(pelangganId) {
    const countResult = await query(
        'SELECT COUNT(*) as total FROM tenant_users WHERE pelanggan_id = ?',
        [pelangganId]
    );
    const nextNumber = (countResult[0]?.total || 0) + 1;
    return `USR-${String(nextNumber).padStart(3, '0')}`;
}

/**
 * Log aktivitas user
 */
async function logActivity(pelangganId, tenantUserId, action, module, description) {
    try {
        await query(`
            INSERT INTO tenant_activity_logs 
            (pelanggan_id, tenant_user_id, action, module, description, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `, [pelangganId, tenantUserId, action, module, description]);
    } catch (e) {
        console.log('Activity log skipped:', e.message);
    }
}

/**
 * Get client IP address dari request
 */
function getClientIP(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return request.headers.get('x-real-ip') || '127.0.0.1';
}

/**
 * ============================================
 * CEK RELASI DATA USER - COMPLETE VERSION
 * ============================================
 */
async function checkUserRelations(tenantUserId, pelangganId) {
    const details = [];
    let hasRelations = false;

    // 1. Cek transaksi (sebagai kasir)
    try {
        const [trxCount] = await query(
            `SELECT COUNT(*) as count FROM transaksi 
             WHERE pelanggan_id = ? AND tenant_user_id = ?`,
            [pelangganId, tenantUserId]
        );
        if (trxCount?.count > 0) {
            hasRelations = true;
            details.push(`${trxCount.count} transaksi`);
        }
    } catch (e) {
        console.log('Check transaksi error:', e.message);
    }

    // 2. Cek shifts (buka shift atau tutup shift)
    try {
        const [shiftCount] = await query(
            `SELECT COUNT(*) as count FROM shifts 
             WHERE pelanggan_id = ? AND (tenant_user_id = ? OR closed_by = ?)`,
            [pelangganId, tenantUserId, tenantUserId]
        );
        if (shiftCount?.count > 0) {
            hasRelations = true;
            details.push(`${shiftCount.count} shift`);
        }
    } catch (e) {
        console.log('Check shifts error:', e.message);
    }

    // 3. Cek shift_users (join shift)
    try {
        const [shiftUserCount] = await query(
            `SELECT COUNT(*) as count FROM shift_users WHERE tenant_user_id = ?`,
            [tenantUserId]
        );
        if (shiftUserCount?.count > 0) {
            hasRelations = true;
            details.push(`${shiftUserCount.count} shift assignment`);
        }
    } catch (e) {
        console.log('Check shift_users error:', e.message);
    }

    // 4. Cek hold_bills
    try {
        const [holdCount] = await query(
            `SELECT COUNT(*) as count FROM hold_bills 
             WHERE pelanggan_id = ? AND tenant_user_id = ?`,
            [pelangganId, tenantUserId]
        );
        if (holdCount?.count > 0) {
            hasRelations = true;
            details.push(`${holdCount.count} hold bill`);
        }
    } catch (e) {
        console.log('Check hold_bills error:', e.message);
    }

    // 5. Cek kas_transaksi (buat atau approve)
    try {
        const [kasCount] = await query(
            `SELECT COUNT(*) as count FROM kas_transaksi 
             WHERE pelanggan_id = ? AND (tenant_user_id = ? OR approved_by = ?)`,
            [pelangganId, tenantUserId, tenantUserId]
        );
        if (kasCount?.count > 0) {
            hasRelations = true;
            details.push(`${kasCount.count} transaksi kas`);
        }
    } catch (e) {
        console.log('Check kas_transaksi error:', e.message);
    }

    // 6. Cek stok_log (penyesuaian stok)
    try {
        const [stokCount] = await query(
            `SELECT COUNT(*) as count FROM stok_log 
             WHERE pelanggan_id = ? AND tenant_user_id = ?`,
            [pelangganId, tenantUserId]
        );
        if (stokCount?.count > 0) {
            hasRelations = true;
            details.push(`${stokCount.count} log stok`);
        }
    } catch (e) {
        console.log('Check stok_log error:', e.message);
    }

    // 7. Cek pin_history
    try {
        const [pinHistoryCount] = await query(
            `SELECT COUNT(*) as count FROM pin_history 
             WHERE user_id = ? OR changed_by = ?`,
            [tenantUserId, tenantUserId]
        );
        if (pinHistoryCount?.count > 0) {
            hasRelations = true;
            details.push(`${pinHistoryCount.count} riwayat PIN`);
        }
    } catch (e) {
        console.log('Check pin_history error:', e.message);
    }

    return { hasRelations, details };
}

/**
 * Cek apakah role memerlukan PIN
 */
function getPinRequirement(role) {
    const roleLower = role?.toLowerCase();
    return {
        required: ROLES_REQUIRE_PIN.includes(roleLower),
        optional: ROLES_OPTIONAL_PIN.includes(roleLower),
        notNeeded: ROLES_NO_PIN.includes(roleLower)
    };
}

/**
 * Format waktu lock remaining
 */
function formatLockTime(lockedUntil) {
    if (!lockedUntil) return null;
    
    const now = new Date();
    const lockTime = new Date(lockedUntil);
    
    if (lockTime <= now) return null;
    
    const diffMs = lockTime - now;
    const diffMins = Math.ceil(diffMs / 60000);
    
    if (diffMins <= 1) return '1 menit';
    if (diffMins < 60) return `${diffMins} menit`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (mins === 0) return `${hours} jam`;
    return `${hours} jam ${mins} menit`;
}

// ==========================================
// LOAD FUNCTION
// ==========================================

/** @type {import('./$types').PageServerLoad} */
export async function load({ parent, url }) {
    console.log('🟢 KELOLA USER PAGE.SERVER.JS LOADED (REFACTORED VERSION)');
    
    const parentData = await parent();
    const user = parentData.user;
    const tenantUser = parentData.tenantUser;
    
    if (!user || !user.pelanggan_id) {
        throw redirect(302, '/login');
    }
    
    const pelangganId = user.pelanggan_id;
    
    if (!validateOwnerPermission(user, tenantUser)) {
        throw error(403, 'Anda tidak memiliki akses untuk mengelola user. Hanya Owner yang dapat mengakses halaman ini.');
    }
    
    const showArchived = url.searchParams.get('showArchived') === 'true';
    
    try {
        // ==========================================
        // GET TOKO INFO (untuk Share WhatsApp)
        // ==========================================
        let kodeToko = '';
        let namaToko = '';
        
        try {
            const [tokoInfo] = await query(
                `SELECT kode_pelanggan, nama_bisnis FROM pelanggan WHERE id = ?`,
                [pelangganId]
            );
            if (tokoInfo) {
                kodeToko = tokoInfo.kode_pelanggan || '';
                namaToko = tokoInfo.nama_bisnis || '';
            }
        } catch (e) {
            console.log('Error getting toko info:', e.message);
        }

        // ==========================================
        // GET USERS
        // ==========================================
        
        // Query untuk user aktif dengan info PIN lengkap
        const activeUsersRaw = await query(`
            SELECT 
                tu.id,
                tu.kode_user,
                tu.email,
                tu.nama,
                tu.no_telepon,
                tu.avatar,
                tu.role,
                tu.pin,
                tu.pin_set_at,
                tu.pin_set_by,
                tu.is_primary,
                tu.status,
                tu.last_login,
                tu.login_count,
                tu.failed_login_count,
                tu.locked_until,
                tu.created_at,
                tu.updated_at,
                tu.deleted_at,
                FALSE as is_archived,
                -- Info siapa yang set PIN
                setter.nama as pin_set_by_name
            FROM tenant_users tu
            LEFT JOIN tenant_users setter ON tu.pin_set_by = setter.id
            WHERE tu.pelanggan_id = ? 
            AND tu.deleted_at IS NULL
            ORDER BY 
                FIELD(tu.role, 'owner', 'admin', 'kasir'),
                tu.is_primary DESC,
                tu.nama ASC
        `, [pelangganId]);

        // Query untuk user yang diarsipkan
        const archivedUsersRaw = await query(`
            SELECT 
                tu.id,
                tu.kode_user,
                tu.email,
                tu.nama,
                tu.no_telepon,
                tu.avatar,
                tu.role,
                tu.pin,
                tu.pin_set_at,
                tu.pin_set_by,
                tu.is_primary,
                tu.status,
                tu.last_login,
                tu.login_count,
                tu.failed_login_count,
                tu.locked_until,
                tu.created_at,
                tu.updated_at,
                tu.deleted_at,
                TRUE as is_archived,
                setter.nama as pin_set_by_name
            FROM tenant_users tu
            LEFT JOIN tenant_users setter ON tu.pin_set_by = setter.id
            WHERE tu.pelanggan_id = ? 
            AND tu.deleted_at IS NOT NULL
            ORDER BY tu.deleted_at DESC
        `, [pelangganId]);

        // Proses user untuk tambahkan info PIN dan can_delete
        async function processUsers(userList) {
            const result = [];
            for (const u of userList) {
                // Cek apakah akun terkunci
                const isLocked = u.locked_until && new Date(u.locked_until) > new Date();
                const lockTimeRemaining = formatLockTime(u.locked_until);
                
                // Cek requirement PIN berdasarkan role
                const pinRequirement = getPinRequirement(u.role);
                
                // Cek status PIN
                let pinStatus = 'not_needed'; // Default untuk owner
                if (pinRequirement.required) {
                    pinStatus = u.pin ? 'set' : 'required';
                } else if (pinRequirement.optional) {
                    pinStatus = u.pin ? 'set' : 'optional';
                }
                
                // Cek apakah PIN lemah (jika ada)
                let isPinWeak = false;
                let pinWeakReason = null;
                if (u.pin) {
                    const weakCheck = isWeakPin(u.pin);
                    isPinWeak = weakCheck.isWeak;
                    pinWeakReason = weakCheck.reason;
                }
                
                // Cek relasi data
                let canDelete = true;
                let deleteReason = null;
                
                if (u.is_primary === 1) {
                    canDelete = false;
                    deleteReason = 'Primary Owner';
                } else {
                    const { hasRelations, details } = await checkUserRelations(u.id, pelangganId);
                    if (hasRelations) {
                        canDelete = false;
                        deleteReason = details.join(', ');
                    }
                }

                result.push({
                    ...u,
                    // PIN Info
                    has_pin: !!u.pin,
                    pin_status: pinStatus,
                    pin_requirement: pinRequirement,
                    is_pin_weak: isPinWeak,
                    pin_weak_reason: pinWeakReason,
                    // Lock Info
                    is_locked: isLocked,
                    lock_time_remaining: lockTimeRemaining,
                    // Delete Info
                    can_delete: canDelete,
                    delete_reason: deleteReason
                });
            }
            return result;
        }

        const activeUsers = await processUsers(activeUsersRaw);
        const archivedUsers = await processUsers(archivedUsersRaw);

        const users = showArchived 
            ? [...activeUsers, ...archivedUsers]
            : activeUsers;

        // ==========================================
        // STATISTICS
        // ==========================================
        
        const stats = {
            total: activeUsers.length,
            owner: activeUsers.filter(u => u.role === 'owner').length,
            admin: activeUsers.filter(u => u.role === 'admin').length,
            kasir: activeUsers.filter(u => u.role === 'kasir').length,
            aktif: activeUsers.filter(u => u.status === 'aktif').length,
            nonaktif: activeUsers.filter(u => u.status !== 'aktif').length,
            archived: archivedUsers.length
        };

        // PIN Statistics
        let pinStats = {
            users_with_pin: 0,
            users_need_pin: 0,
            users_locked: 0,
            users_weak_pin: 0
        };
        
        try {
            const dbPinStats = await getPinStatistics(pelangganId);
            pinStats = {
                users_with_pin: Number(dbPinStats.users_with_pin) || 0,
                users_need_pin: Number(dbPinStats.users_need_pin) || 0,
                users_locked: Number(dbPinStats.users_locked) || 0,
                users_weak_pin: activeUsers.filter(u => u.is_pin_weak).length
            };
        } catch (e) {
            console.log('PIN stats error:', e.message);
            // Hitung manual dari data yang sudah ada
            pinStats = {
                users_with_pin: activeUsers.filter(u => u.has_pin).length,
                users_need_pin: activeUsers.filter(u => u.pin_status === 'required').length,
                users_locked: activeUsers.filter(u => u.is_locked).length,
                users_weak_pin: activeUsers.filter(u => u.is_pin_weak).length
            };
        }

        // User yang belum set PIN (untuk alert)
        const usersWithoutPin = activeUsers.filter(u => 
            u.pin_status === 'required' && u.status === 'aktif'
        );

        // ==========================================
        // ACTIVITY LOGS
        // ==========================================
        
        let recentActivities = [];
        try {
            recentActivities = await query(`
                SELECT 
                    tal.id,
                    tal.action,
                    tal.module,
                    tal.description,
                    tal.created_at,
                    tu.nama as user_nama,
                    tu.role as user_role
                FROM tenant_activity_logs tal
                LEFT JOIN tenant_users tu ON tal.tenant_user_id = tu.id
                WHERE tal.pelanggan_id = ?
                AND tal.module IN ('user', 'auth', 'pin')
                ORDER BY tal.created_at DESC
                LIMIT 10
            `, [pelangganId]);
        } catch (e) {
            console.log('🟡 Activity logs table may not exist');
        }

        // PIN History terbaru
        let recentPinChanges = [];
        try {
            recentPinChanges = await query(`
                SELECT 
                    ph.id,
                    ph.action,
                    ph.created_at,
                    tu.nama as user_name,
                    tu.role as user_role,
                    cb.nama as changed_by_name
                FROM pin_history ph
                JOIN tenant_users tu ON ph.user_id = tu.id
                LEFT JOIN tenant_users cb ON ph.changed_by = cb.id
                WHERE ph.pelanggan_id = ?
                ORDER BY ph.created_at DESC
                LIMIT 5
            `, [pelangganId]);
        } catch (e) {
            console.log('🟡 PIN history error:', e.message);
        }

        // ==========================================
        // RETURN DATA
        // ==========================================
        
        return {
            users,
            activeUsers,
            archivedUsers,
            stats,
            pinStats,
            usersWithoutPin,
            recentActivities,
            recentPinChanges,
            showArchived,
            currentUser: tenantUser || {
                id: user.tenant_user_id,
                nama: user.nama,
                email: user.email,
                role: user.tenant_role || user.role
            },
            // PIN Config untuk frontend
            pinConfig: {
                length: PIN_LENGTH,
                rolesRequirePin: ROLES_REQUIRE_PIN,
                rolesOptionalPin: ROLES_OPTIONAL_PIN,
                rolesNoPin: ROLES_NO_PIN
            },
            // ==========================================
            // NEW: Toko Info untuk Share WhatsApp
            // ==========================================
            kodeToko,
            namaToko
        };

    } catch (err) {
        console.error('❌ Error loading users:', err);
        return {
            users: [],
            activeUsers: [],
            archivedUsers: [],
            stats: { total: 0, owner: 0, admin: 0, kasir: 0, aktif: 0, nonaktif: 0, archived: 0 },
            pinStats: { users_with_pin: 0, users_need_pin: 0, users_locked: 0, users_weak_pin: 0 },
            usersWithoutPin: [],
            recentActivities: [],
            recentPinChanges: [],
            showArchived: false,
            currentUser: tenantUser,
            pinConfig: { length: 6, rolesRequirePin: ['kasir'], rolesOptionalPin: ['admin'], rolesNoPin: ['owner'] },
            kodeToko: '',
            namaToko: '',
            error: 'Gagal memuat data user'
        };
    }
}

// ==========================================
// FORM ACTIONS
// ==========================================

/** @type {import('./$types').Actions} */
export const actions = {
    
    // ==========================================
    // CREATE - Tambah user baru
    // ==========================================
    create: async ({ request, locals }) => {
        const { user, tenantUser } = await getUserFromLocals(locals);
        
        if (!user?.pelanggan_id) {
            return fail(401, { error: 'Sesi telah berakhir. Silakan login kembali.' });
        }

        if (!validateOwnerPermission(user, tenantUser)) {
            return fail(403, { error: 'Anda tidak memiliki akses untuk menambah user' });
        }

        const pelangganId = user.pelanggan_id;
        const formData = await request.formData();
        const ipAddress = getClientIP(request);
        
        const nama = formData.get('nama')?.toString().trim();
        const email = formData.get('email')?.toString().trim().toLowerCase();
        const password = formData.get('password')?.toString();
        const role = formData.get('role')?.toString();
        const no_telepon = formData.get('no_telepon')?.toString().trim() || null;
        const pin = formData.get('pin')?.toString().trim() || null;

        if (!nama || !email || !password || !role) {
            return fail(400, { 
                error: 'Nama, email, password, dan role wajib diisi',
                values: { nama, email, role, no_telepon }
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return fail(400, { 
                error: 'Format email tidak valid',
                values: { nama, email, role, no_telepon }
            });
        }

        if (!['admin', 'kasir'].includes(role)) {
            return fail(400, { 
                error: 'Role tidak valid. Pilih Admin atau Kasir.',
                values: { nama, email, role, no_telepon }
            });
        }

        if (password.length < 6) {
            return fail(400, { 
                error: 'Password minimal 6 karakter',
                values: { nama, email, role, no_telepon }
            });
        }

        // Validasi PIN jika diisi
        if (pin && pin.length > 0) {
            // Validasi format
            const formatCheck = validatePinFormat(pin);
            if (!formatCheck.valid) {
                return fail(400, { 
                    error: formatCheck.message,
                    values: { nama, email, role, no_telepon }
                });
            }
            
            // Validasi PIN lengkap (termasuk weak check & duplikat)
            const pinValidation = await validatePin(pin, pelangganId, null);
            if (!pinValidation.valid) {
                return fail(400, { 
                    error: pinValidation.message,
                    values: { nama, email, role, no_telepon }
                });
            }
        }

        // Cek apakah PIN wajib untuk role ini
        const pinRequirement = getPinRequirement(role);
        if (pinRequirement.required && !pin) {
            return fail(400, { 
                error: `PIN wajib diisi untuk role ${role}`,
                values: { nama, email, role, no_telepon }
            });
        }

        try {
            // Cek email duplikat
            const existingEmail = await query(
                'SELECT id, deleted_at FROM tenant_users WHERE pelanggan_id = ? AND email = ?',
                [pelangganId, email]
            );

            if (existingEmail.length > 0) {
                if (existingEmail[0].deleted_at) {
                    return fail(400, { 
                        error: 'Email ini sudah digunakan oleh user yang diarsipkan. Silakan restore user tersebut atau gunakan email lain.',
                        values: { nama, email, role, no_telepon }
                    });
                }
                return fail(400, { 
                    error: 'Email sudah digunakan oleh user lain',
                    values: { nama, email, role, no_telepon }
                });
            }

            const kodeUser = await generateKodeUser(pelangganId);

            // Insert user baru
            const result = await query(`
                INSERT INTO tenant_users (
                    pelanggan_id, kode_user, email, password, nama, 
                    no_telepon, role, pin, pin_set_at, pin_set_by,
                    status, is_primary, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', 0, NOW())
            `, [
                pelangganId, kodeUser, email, password, nama, no_telepon, role,
                pin || null,
                pin ? new Date() : null,
                pin ? tenantUser?.id : null
            ]);

            // Log aktivitas
            await logActivity(
                pelangganId, 
                tenantUser?.id, 
                'create', 
                'user', 
                `User baru ditambahkan: ${nama} (${role})${pin ? ' dengan PIN' : ''}`
            );

            return { 
                success: true, 
                message: `User "${nama}" berhasil ditambahkan sebagai ${role}` 
            };

        } catch (err) {
            console.error('❌ Error creating user:', err);
            return fail(500, { 
                error: 'Gagal menambahkan user. Silakan coba lagi.',
                values: { nama, email, role, no_telepon }
            });
        }
    },

    // ==========================================
    // UPDATE - Edit user
    // ==========================================
    update: async ({ request, locals }) => {
        const { user, tenantUser } = await getUserFromLocals(locals);
        
        if (!user?.pelanggan_id) {
            return fail(401, { error: 'Sesi telah berakhir. Silakan login kembali.' });
        }

        if (!validateOwnerPermission(user, tenantUser)) {
            return fail(403, { error: 'Anda tidak memiliki akses untuk mengubah user' });
        }

        const pelangganId = user.pelanggan_id;
        const formData = await request.formData();
        
        const userId = formData.get('user_id');
        const nama = formData.get('nama')?.toString().trim();
        const email = formData.get('email')?.toString().trim().toLowerCase();
        const role = formData.get('role')?.toString();
        const no_telepon = formData.get('no_telepon')?.toString().trim() || null;
        const status = formData.get('status')?.toString();
        const newPassword = formData.get('new_password')?.toString();

        if (!userId || !nama || !email || !role || !status) {
            return fail(400, { error: 'Data tidak lengkap' });
        }

        try {
            const existingUser = await query(
                `SELECT id, nama, is_primary, role, status, pin
                 FROM tenant_users 
                 WHERE id = ? AND pelanggan_id = ? AND deleted_at IS NULL`,
                [userId, pelangganId]
            );

            if (existingUser.length === 0) {
                return fail(404, { error: 'User tidak ditemukan' });
            }

            const currentUser = existingUser[0];

            if (currentUser.is_primary === 1 && role !== 'owner') {
                return fail(400, { error: 'Tidak dapat mengubah role pemilik utama (Primary Owner)' });
            }

            if (currentUser.is_primary === 1 && status !== 'aktif') {
                return fail(400, { error: 'Tidak dapat menonaktifkan pemilik utama (Primary Owner)' });
            }

            // Cek email duplikat
            const emailCheck = await query(
                'SELECT id FROM tenant_users WHERE pelanggan_id = ? AND email = ? AND id != ?',
                [pelangganId, email, userId]
            );

            if (emailCheck.length > 0) {
                return fail(400, { error: 'Email sudah digunakan oleh user lain' });
            }

            // Cek jika role berubah ke kasir dan belum punya PIN
            const pinRequirement = getPinRequirement(role);
            if (pinRequirement.required && !currentUser.pin && currentUser.role !== role) {
                // Akan butuh set PIN setelah ini
                console.log(`⚠️ User ${nama} perlu set PIN setelah role change ke ${role}`);
            }

            let updateQuery, updateParams;
            
            if (newPassword && newPassword.length >= 6) {
                updateQuery = `
                    UPDATE tenant_users SET 
                        nama = ?, email = ?, no_telepon = ?, role = ?, 
                        status = ?, password = ?, updated_at = NOW(), updated_by = ?
                    WHERE id = ? AND pelanggan_id = ?`;
                updateParams = [nama, email, no_telepon, role, status, newPassword, tenantUser?.id, userId, pelangganId];
            } else {
                updateQuery = `
                    UPDATE tenant_users SET 
                        nama = ?, email = ?, no_telepon = ?, role = ?, 
                        status = ?, updated_at = NOW(), updated_by = ?
                    WHERE id = ? AND pelanggan_id = ?`;
                updateParams = [nama, email, no_telepon, role, status, tenantUser?.id, userId, pelangganId];
            }

            await query(updateQuery, updateParams);

            await logActivity(
                pelangganId,
                tenantUser?.id,
                'update',
                'user',
                `User ${nama} diperbarui`
            );

            return { 
                success: true, 
                message: `User "${nama}" berhasil diperbarui` 
            };

        } catch (err) {
            console.error('❌ Error updating user:', err);
            return fail(500, { error: 'Gagal memperbarui user. Silakan coba lagi.' });
        }
    },

    // ==========================================
    // SET PIN - Set PIN untuk user
    // ==========================================
    setPin: async ({ request, locals }) => {
        const { user, tenantUser } = await getUserFromLocals(locals);
        
        if (!user?.pelanggan_id) {
            return fail(401, { error: 'Sesi telah berakhir. Silakan login kembali.' });
        }

        const pelangganId = user.pelanggan_id;
        const formData = await request.formData();
        const ipAddress = getClientIP(request);
        
        const userId = formData.get('user_id');
        const pin = formData.get('pin')?.toString().trim();
        const confirmPin = formData.get('confirm_pin')?.toString().trim();

        if (!userId) {
            return fail(400, { error: 'User ID tidak valid' });
        }

        if (!pin) {
            return fail(400, { error: 'PIN wajib diisi' });
        }

        // Validasi konfirmasi PIN
        if (pin !== confirmPin) {
            return fail(400, { error: 'Konfirmasi PIN tidak cocok' });
        }

        try {
            // Ambil data target user
            const targetUsers = await query(
                `SELECT id, nama, role, pin FROM tenant_users 
                 WHERE id = ? AND pelanggan_id = ? AND deleted_at IS NULL`,
                [userId, pelangganId]
            );

            if (targetUsers.length === 0) {
                return fail(404, { error: 'User tidak ditemukan' });
            }

            const targetUser = targetUsers[0];

            // Cek permission
            if (!validatePinPermission(user, tenantUser, targetUser.role)) {
                return fail(403, { error: 'Anda tidak memiliki akses untuk set PIN user ini' });
            }

            // Cek apakah role memerlukan PIN
            if (ROLES_NO_PIN.includes(targetUser.role)) {
                return fail(400, { error: `Role ${targetUser.role} tidak memerlukan PIN` });
            }

            // Set PIN menggunakan PIN library
            const result = await setUserPin(userId, pin, {
                changedBy: tenantUser?.id,
                changedByRole: tenantUser?.role || user.tenant_role,
                ipAddress
            });

            if (!result.success) {
                return fail(400, { error: result.message });
            }

            // Log aktivitas
            await logActivity(
                pelangganId,
                tenantUser?.id,
                'set_pin',
                'pin',
                `PIN ${targetUser.pin ? 'diubah' : 'dibuat'} untuk ${targetUser.nama}`
            );

            return { 
                success: true, 
                message: result.message,
                action: result.action
            };

        } catch (err) {
            console.error('❌ Error setting PIN:', err);
            return fail(500, { error: 'Gagal menyimpan PIN. Silakan coba lagi.' });
        }
    },

    // ==========================================
    // RESET PIN - Hapus PIN user
    // ==========================================
    resetPin: async ({ request, locals }) => {
        const { user, tenantUser } = await getUserFromLocals(locals);
        
        if (!user?.pelanggan_id) {
            return fail(401, { error: 'Sesi telah berakhir. Silakan login kembali.' });
        }

        const pelangganId = user.pelanggan_id;
        const formData = await request.formData();
        const ipAddress = getClientIP(request);
        
        const userId = formData.get('user_id');

        if (!userId) {
            return fail(400, { error: 'User ID tidak valid' });
        }

        try {
            // Ambil data target user
            const targetUsers = await query(
                `SELECT id, nama, role, pin FROM tenant_users 
                 WHERE id = ? AND pelanggan_id = ? AND deleted_at IS NULL`,
                [userId, pelangganId]
            );

            if (targetUsers.length === 0) {
                return fail(404, { error: 'User tidak ditemukan' });
            }

            const targetUser = targetUsers[0];

            // Cek permission
            if (!validatePinPermission(user, tenantUser, targetUser.role)) {
                return fail(403, { error: 'Anda tidak memiliki akses untuk reset PIN user ini' });
            }

            // Reset PIN menggunakan PIN library
            const result = await resetUserPin(userId, {
                changedBy: tenantUser?.id,
                changedByRole: tenantUser?.role || user.tenant_role,
                ipAddress
            });

            if (!result.success) {
                return fail(400, { error: result.message });
            }

            // Log aktivitas
            await logActivity(
                pelangganId,
                tenantUser?.id,
                'reset_pin',
                'pin',
                `PIN direset untuk ${targetUser.nama}`
            );

            return { 
                success: true, 
                message: result.message
            };

        } catch (err) {
            console.error('❌ Error resetting PIN:', err);
            return fail(500, { error: 'Gagal mereset PIN. Silakan coba lagi.' });
        }
    },

    // ==========================================
    // UNLOCK USER - Buka kunci akun
    // ==========================================
    unlockUser: async ({ request, locals }) => {
        const { user, tenantUser } = await getUserFromLocals(locals);
        
        if (!user?.pelanggan_id) {
            return fail(401, { error: 'Sesi telah berakhir. Silakan login kembali.' });
        }

        const pelangganId = user.pelanggan_id;
        const formData = await request.formData();
        
        const userId = formData.get('user_id');

        if (!userId) {
            return fail(400, { error: 'User ID tidak valid' });
        }

        try {
            // Ambil data target user
            const targetUsers = await query(
                `SELECT id, nama, role, locked_until FROM tenant_users 
                 WHERE id = ? AND pelanggan_id = ? AND deleted_at IS NULL`,
                [userId, pelangganId]
            );

            if (targetUsers.length === 0) {
                return fail(404, { error: 'User tidak ditemukan' });
            }

            const targetUser = targetUsers[0];

            // Cek permission
            if (!validatePinPermission(user, tenantUser, targetUser.role)) {
                return fail(403, { error: 'Anda tidak memiliki akses untuk unlock user ini' });
            }

            // Unlock menggunakan PIN library
            const result = await unlockUserAccount(userId, {
                unlockedBy: tenantUser?.id
            });

            if (!result.success) {
                return fail(400, { error: result.message });
            }

            // Log aktivitas
            await logActivity(
                pelangganId,
                tenantUser?.id,
                'unlock_user',
                'pin',
                `Akun ${targetUser.nama} dibuka kuncinya`
            );

            return { 
                success: true, 
                message: result.message
            };

        } catch (err) {
            console.error('❌ Error unlocking user:', err);
            return fail(500, { error: 'Gagal membuka kunci akun. Silakan coba lagi.' });
        }
    },

    // ==========================================
    // GENERATE PIN - Generate PIN otomatis
    // ==========================================
    generatePin: async ({ request, locals }) => {
        const { user, tenantUser } = await getUserFromLocals(locals);
        
        if (!user?.pelanggan_id) {
            return fail(401, { error: 'Sesi telah berakhir. Silakan login kembali.' });
        }

        try {
            // Generate PIN aman
            const newPin = generateSecurePin();
            
            return { 
                success: true, 
                pin: newPin,
                message: 'PIN berhasil digenerate'
            };

        } catch (err) {
            console.error('❌ Error generating PIN:', err);
            return fail(500, { error: 'Gagal generate PIN. Silakan coba lagi.' });
        }
    },

    // ==========================================
    // VALIDATE PIN - Validasi PIN (untuk realtime check)
    // ==========================================
    validatePinRealtime: async ({ request, locals }) => {
        const { user } = await getUserFromLocals(locals);
        
        if (!user?.pelanggan_id) {
            return fail(401, { error: 'Sesi telah berakhir.' });
        }

        const pelangganId = user.pelanggan_id;
        const formData = await request.formData();
        
        const pin = formData.get('pin')?.toString().trim();
        const excludeUserId = formData.get('exclude_user_id')?.toString() || null;

        if (!pin) {
            return { valid: false, message: 'PIN kosong' };
        }

        try {
            const validation = await validatePin(pin, pelangganId, excludeUserId);
            return validation;
        } catch (err) {
            console.error('❌ Error validating PIN:', err);
            return { valid: false, message: 'Gagal memvalidasi PIN' };
        }
    },

    // ==========================================
    // ARCHIVE - Soft delete user
    // ==========================================
    archive: async ({ request, locals }) => {
        const { user, tenantUser } = await getUserFromLocals(locals);
        
        if (!user?.pelanggan_id) {
            return fail(401, { error: 'Sesi telah berakhir. Silakan login kembali.' });
        }

        if (!validateOwnerPermission(user, tenantUser)) {
            return fail(403, { error: 'Anda tidak memiliki akses untuk mengarsipkan user' });
        }

        const pelangganId = user.pelanggan_id;
        const formData = await request.formData();
        const userId = formData.get('user_id');

        if (!userId) {
            return fail(400, { error: 'User ID tidak valid' });
        }

        try {
            const existingUser = await query(
                `SELECT id, nama, is_primary, role 
                 FROM tenant_users 
                 WHERE id = ? AND pelanggan_id = ? AND deleted_at IS NULL`,
                [userId, pelangganId]
            );

            if (existingUser.length === 0) {
                return fail(404, { error: 'User tidak ditemukan' });
            }

            const targetUser = existingUser[0];

            if (targetUser.is_primary === 1) {
                return fail(400, { error: 'Tidak dapat mengarsipkan pemilik utama (Primary Owner)' });
            }

            await query(
                `UPDATE tenant_users SET deleted_at = NOW(), status = "nonaktif", 
                 pin = NULL, pin_set_at = NULL, pin_set_by = NULL,
                 locked_until = NULL, failed_login_count = 0
                 WHERE id = ? AND pelanggan_id = ?`,
                [userId, pelangganId]
            );

            await logActivity(
                pelangganId,
                tenantUser?.id,
                'archive',
                'user',
                `User ${targetUser.nama} (${targetUser.role}) diarsipkan`
            );

            return { 
                success: true, 
                message: `User "${targetUser.nama}" berhasil diarsipkan.` 
            };

        } catch (err) {
            console.error('❌ Error archiving user:', err);
            return fail(500, { error: 'Gagal mengarsipkan user. Silakan coba lagi.' });
        }
    },

    // ==========================================
    // DELETE - Hard delete user
    // ==========================================
    delete: async ({ request, locals }) => {
        const { user, tenantUser } = await getUserFromLocals(locals);
        
        if (!user?.pelanggan_id) {
            return fail(401, { error: 'Sesi telah berakhir. Silakan login kembali.' });
        }

        if (!validateOwnerPermission(user, tenantUser)) {
            return fail(403, { error: 'Anda tidak memiliki akses untuk menghapus user' });
        }

        const pelangganId = user.pelanggan_id;
        const formData = await request.formData();
        const userId = formData.get('user_id');

        if (!userId) {
            return fail(400, { error: 'User ID tidak valid' });
        }

        try {
            const existingUser = await query(
                `SELECT id, nama, is_primary, role, email
                 FROM tenant_users 
                 WHERE id = ? AND pelanggan_id = ?`,
                [userId, pelangganId]
            );

            if (existingUser.length === 0) {
                return fail(404, { error: 'User tidak ditemukan' });
            }

            const targetUser = existingUser[0];

            if (targetUser.is_primary === 1) {
                return fail(400, { error: 'Tidak dapat menghapus pemilik utama (Primary Owner)' });
            }

            // Cek relasi data
            const { hasRelations, details } = await checkUserRelations(userId, pelangganId);

            if (hasRelations) {
                return fail(400, { 
                    error: `User "${targetUser.nama}" tidak dapat dihapus permanen karena memiliki data terkait: ${details.join(', ')}. Silakan arsipkan user ini sebagai gantinya.`,
                    cannotDelete: true,
                    relations: details
                });
            }

            // Hapus data terkait
            await query('DELETE FROM tenant_activity_logs WHERE tenant_user_id = ?', [userId]).catch(() => {});
            await query('DELETE FROM tenant_user_sessions WHERE user_id = ?', [userId]).catch(() => {});
            await query('DELETE FROM pin_history WHERE user_id = ? OR changed_by = ?', [userId, userId]).catch(() => {});
            await query('DELETE FROM pin_login_attempts WHERE user_id = ?', [userId]).catch(() => {});

            // Hapus user permanen
            await query(
                'DELETE FROM tenant_users WHERE id = ? AND pelanggan_id = ?',
                [userId, pelangganId]
            );

            await logActivity(
                pelangganId,
                tenantUser?.id,
                'delete_permanent',
                'user',
                `User ${targetUser.nama} (${targetUser.role}) dihapus permanen`
            );

            return { 
                success: true, 
                message: `User "${targetUser.nama}" berhasil dihapus permanen.` 
            };

        } catch (err) {
            console.error('❌ Error deleting user:', err);
            return fail(500, { error: 'Gagal menghapus user. Silakan coba lagi.' });
        }
    },

    // ==========================================
    // RESTORE - Kembalikan user yang diarsipkan
    // ==========================================
    restore: async ({ request, locals }) => {
        const { user, tenantUser } = await getUserFromLocals(locals);
        
        if (!user?.pelanggan_id) {
            return fail(401, { error: 'Sesi telah berakhir. Silakan login kembali.' });
        }

        if (!validateOwnerPermission(user, tenantUser)) {
            return fail(403, { error: 'Anda tidak memiliki akses untuk mengembalikan user' });
        }

        const pelangganId = user.pelanggan_id;
        const formData = await request.formData();
        const userId = formData.get('user_id');

        if (!userId) {
            return fail(400, { error: 'User ID tidak valid' });
        }

        try {
            const existingUser = await query(
                `SELECT id, nama, role, email 
                 FROM tenant_users 
                 WHERE id = ? AND pelanggan_id = ? AND deleted_at IS NOT NULL`,
                [userId, pelangganId]
            );

            if (existingUser.length === 0) {
                return fail(404, { error: 'User tidak ditemukan atau belum diarsipkan' });
            }

            const targetUser = existingUser[0];

            await query(
                `UPDATE tenant_users SET deleted_at = NULL, status = "aktif", updated_at = NOW() 
                 WHERE id = ? AND pelanggan_id = ?`,
                [userId, pelangganId]
            );

            await logActivity(
                pelangganId,
                tenantUser?.id,
                'restore',
                'user',
                `User ${targetUser.nama} dikembalikan dari arsip`
            );

            // Cek apakah perlu set PIN
            const pinRequirement = getPinRequirement(targetUser.role);
            let additionalMessage = '';
            if (pinRequirement.required) {
                additionalMessage = ' User perlu set PIN baru sebelum dapat login.';
            }

            return { 
                success: true, 
                message: `User "${targetUser.nama}" berhasil dikembalikan.${additionalMessage}` 
            };

        } catch (err) {
            console.error('❌ Error restoring user:', err);
            return fail(500, { error: 'Gagal mengembalikan user. Silakan coba lagi.' });
        }
    },

    // ==========================================
    // RESET PASSWORD
    // ==========================================
    resetPassword: async ({ request, locals }) => {
        const { user, tenantUser } = await getUserFromLocals(locals);
        
        if (!user?.pelanggan_id) {
            return fail(401, { error: 'Sesi telah berakhir. Silakan login kembali.' });
        }

        if (!validateOwnerPermission(user, tenantUser)) {
            return fail(403, { error: 'Anda tidak memiliki akses untuk reset password' });
        }

        const pelangganId = user.pelanggan_id;
        const formData = await request.formData();
        const userId = formData.get('user_id');
        const newPassword = formData.get('new_password')?.toString();

        if (!userId) {
            return fail(400, { error: 'User ID tidak valid' });
        }

        if (!newPassword || newPassword.length < 6) {
            return fail(400, { error: 'Password baru minimal 6 karakter' });
        }

        try {
            const existingUser = await query(
                'SELECT id, nama FROM tenant_users WHERE id = ? AND pelanggan_id = ? AND deleted_at IS NULL',
                [userId, pelangganId]
            );

            if (existingUser.length === 0) {
                return fail(404, { error: 'User tidak ditemukan' });
            }

            const targetUser = existingUser[0];

            await query(
                'UPDATE tenant_users SET password = ?, updated_at = NOW(), updated_by = ? WHERE id = ? AND pelanggan_id = ?',
                [newPassword, tenantUser?.id, userId, pelangganId]
            );

            await logActivity(
                pelangganId,
                tenantUser?.id,
                'reset_password',
                'user',
                `Password user ${targetUser.nama} direset`
            );

            return { 
                success: true, 
                message: `Password untuk "${targetUser.nama}" berhasil direset` 
            };

        } catch (err) {
            console.error('❌ Error resetting password:', err);
            return fail(500, { error: 'Gagal reset password. Silakan coba lagi.' });
        }
    }
};