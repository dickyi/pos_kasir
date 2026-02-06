/**
 * ============================================
 * KAS MASUK/KELUAR - PAGE SERVER (IMPROVED)
 * ============================================
 * 
 * IMPROVEMENTS:
 * 1. ✅ Fix race condition pada generate no_referensi (pakai UUID + sequence)
 * 2. ✅ Soft delete dengan audit trail
 * 3. ✅ Filter berdasarkan status (pending/approved)
 * 4. ✅ Audit log untuk setiap aksi
 * 5. ✅ Validasi lebih ketat
 * ============================================
 */

import { query } from '$lib/db.js';
import { fail } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate nomor referensi yang aman dari race condition
 * Format: KM-20260205-A1B2C3 atau KK-20260205-A1B2C3
 */
function generateNoReferensi(tipe) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = tipe === 'masuk' ? 'KM' : 'KK';
    const uniqueId = uuidv4().split('-')[0].toUpperCase(); // 8 karakter
    return `${prefix}-${dateStr}-${uniqueId}`;
}

/**
 * Catat audit log
 */
async function createAuditLog(pelangganId, tenantUserId, action, tableName, recordId, oldData = null, newData = null) {
    try {
        await query(`
            INSERT INTO audit_logs (
                pelanggan_id, tenant_user_id, action, table_name, 
                record_id, old_data, new_data, created_at, ip_address
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `, [
            pelangganId,
            tenantUserId,
            action,
            tableName,
            recordId,
            oldData ? JSON.stringify(oldData) : null,
            newData ? JSON.stringify(newData) : null,
            null // IP address bisa ditambahkan dari request jika perlu
        ]);
    } catch (err) {
        // Log error tapi jangan gagalkan operasi utama
        console.error('Failed to create audit log:', err);
    }
}

/**
 * Get active shift for user
 */
async function getActiveShift(pelangganId, tenantUserId) {
    try {
        const result = await query(`
            SELECT 
                s.*,
                u.nama as nama_user
            FROM shifts s
            LEFT JOIN tenant_users u ON s.tenant_user_id = u.id
            WHERE s.pelanggan_id = ? 
              AND s.tenant_user_id = ?
              AND s.status = 'buka'
            ORDER BY s.waktu_buka DESC
            LIMIT 1
        `, [pelangganId, tenantUserId]);
        
        return result[0] || null;
    } catch (err) {
        console.error('Error getting active shift:', err);
        return null;
    }
}

/**
 * Get kas transactions for today
 * IMPROVED: Tambah filter status dan soft delete check
 */
async function getKasToday(pelangganId, tenantUserId, isKasir, statusFilter = 'semua') {
    try {
        let sql = `
            SELECT 
                k.*,
                kat.nama as kategori_nama,
                u.nama as nama_user,
                s.no_shift,
                deleted_by_user.nama as deleted_by_nama
            FROM kas_transaksi k
            LEFT JOIN kategori_kas kat ON k.kategori_kas_id = kat.id
            LEFT JOIN tenant_users u ON k.tenant_user_id = u.id
            LEFT JOIN shifts s ON k.shift_id = s.id
            LEFT JOIN tenant_users deleted_by_user ON k.deleted_by = deleted_by_user.id
            WHERE k.pelanggan_id = ?
              AND k.tanggal = CURDATE()
              AND k.deleted_at IS NULL
        `;
        
        const params = [pelangganId];
        
        // Filter by status
        if (statusFilter && statusFilter !== 'semua') {
            sql += ` AND k.status = ?`;
            params.push(statusFilter);
        }
        
        // Kasir hanya lihat kas sendiri
        if (isKasir && tenantUserId) {
            sql += ` AND k.tenant_user_id = ?`;
            params.push(tenantUserId);
        }
        
        sql += ` ORDER BY k.created_at DESC`;
        
        return await query(sql, params);
    } catch (err) {
        console.error('Error getting kas today:', err);
        return [];
    }
}

/**
 * Get summary kas hari ini
 * IMPROVED: Konsisten dengan filter status approved
 */
async function getSummaryToday(pelangganId, tenantUserId, isKasir) {
    try {
        let sql = `
            SELECT 
                COALESCE(SUM(CASE WHEN tipe = 'masuk' AND status = 'approved' THEN jumlah ELSE 0 END), 0) as total_masuk,
                COALESCE(SUM(CASE WHEN tipe = 'keluar' AND status = 'approved' THEN jumlah ELSE 0 END), 0) as total_keluar,
                COUNT(CASE WHEN tipe = 'masuk' AND status = 'approved' THEN 1 END) as count_masuk,
                COUNT(CASE WHEN tipe = 'keluar' AND status = 'approved' THEN 1 END) as count_keluar,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as count_pending
            FROM kas_transaksi
            WHERE pelanggan_id = ?
              AND tanggal = CURDATE()
              AND deleted_at IS NULL
        `;
        
        const params = [pelangganId];
        
        if (isKasir && tenantUserId) {
            sql += ` AND tenant_user_id = ?`;
            params.push(tenantUserId);
        }
        
        const result = await query(sql, params);
        return result[0] || { 
            total_masuk: 0, 
            total_keluar: 0, 
            count_masuk: 0, 
            count_keluar: 0,
            count_pending: 0
        };
    } catch (err) {
        console.error('Error getting summary:', err);
        return { total_masuk: 0, total_keluar: 0, count_masuk: 0, count_keluar: 0, count_pending: 0 };
    }
}

/**
 * Get kategori kas
 */
async function getKategoriKas(pelangganId) {
    try {
        return await query(`
            SELECT id, nama, tipe, icon
            FROM kategori_kas
            WHERE pelanggan_id = ? AND status = 'aktif'
            ORDER BY urutan ASC, nama ASC
        `, [pelangganId]);
    } catch (err) {
        console.error('Error getting kategori kas:', err);
        return [];
    }
}

/**
 * Get pengaturan tenant
 */
async function getPengaturan(pelangganId) {
    try {
        const result = await query(`
            SELECT limit_kas_keluar_kasir, kas_keluar_perlu_approval
            FROM pengaturan
            WHERE pelanggan_id = ?
        `, [pelangganId]);
        
        return result[0] || { limit_kas_keluar_kasir: null, kas_keluar_perlu_approval: 0 };
    } catch (err) {
        console.error('Error getting pengaturan:', err);
        return { limit_kas_keluar_kasir: null, kas_keluar_perlu_approval: 0 };
    }
}

/**
 * Get pending kas for approval (owner/admin only)
 */
async function getPendingKas(pelangganId) {
    try {
        return await query(`
            SELECT 
                k.*,
                kat.nama as kategori_nama,
                u.nama as nama_user,
                s.no_shift
            FROM kas_transaksi k
            LEFT JOIN kategori_kas kat ON k.kategori_kas_id = kat.id
            LEFT JOIN tenant_users u ON k.tenant_user_id = u.id
            LEFT JOIN shifts s ON k.shift_id = s.id
            WHERE k.pelanggan_id = ?
              AND k.status = 'pending'
              AND k.deleted_at IS NULL
            ORDER BY k.created_at ASC
        `, [pelangganId]);
    } catch (err) {
        console.error('Error getting pending kas:', err);
        return [];
    }
}

/**
 * Update shift totals (kas_masuk / kas_keluar)
 */
async function updateShiftTotals(shiftId) {
    if (!shiftId) return;
    
    try {
        await query(`
            UPDATE shifts s
            SET 
                kas_masuk = (
                    SELECT COALESCE(SUM(jumlah), 0)
                    FROM kas_transaksi
                    WHERE shift_id = s.id AND tipe = 'masuk' AND status = 'approved' AND deleted_at IS NULL
                ),
                kas_keluar = (
                    SELECT COALESCE(SUM(jumlah), 0)
                    FROM kas_transaksi
                    WHERE shift_id = s.id AND tipe = 'keluar' AND status = 'approved' AND deleted_at IS NULL
                )
            WHERE s.id = ?
        `, [shiftId]);
    } catch (err) {
        console.error('Error updating shift totals:', err);
    }
}

/**
 * Create notification
 */
async function createNotification(pelangganId, title, message, type = 'kas') {
    try {
        await query(`
            INSERT INTO notifications (pelanggan_id, title, message, type, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `, [pelangganId, title, message, type]);
    } catch (err) {
        console.error('Failed to create notification:', err);
    }
}

// ============================================
// LOAD FUNCTION
// ============================================
export async function load({ parent, url }) {
    const parentData = await parent();
    const { user, tenantUser, settings } = parentData;
    
    if (!user || !user.pelanggan_id) {
        return { error: 'Unauthorized' };
    }
    
    const pelangganId = user.pelanggan_id;
    const tenantUserId = tenantUser?.id || user.tenant_user_id || user.id || null;
    const isKasir = tenantUser?.role === 'kasir';
    const isOwnerOrAdmin = ['owner', 'admin'].includes(tenantUser?.role?.toLowerCase());
    
    // Get status filter from URL
    const statusFilter = url.searchParams.get('status') || 'semua';
    
    try {
        const [activeShift, kasList, summary, kategoriList, pengaturan, pendingKas] = await Promise.all([
            getActiveShift(pelangganId, tenantUserId),
            getKasToday(pelangganId, tenantUserId, isKasir, statusFilter),
            getSummaryToday(pelangganId, tenantUserId, isKasir),
            getKategoriKas(pelangganId),
            getPengaturan(pelangganId),
            isOwnerOrAdmin ? getPendingKas(pelangganId) : Promise.resolve([])
        ]);
        
        // Determine limit kas keluar
        let limitKasKeluar = pengaturan.limit_kas_keluar_kasir;
        if (limitKasKeluar === null || limitKasKeluar === -1) {
            limitKasKeluar = -1; // unlimited
        }
        
        return {
            activeShift,
            kasList,
            summary,
            kategoriList,
            pengaturan,
            limitKasKeluar,
            isKasir,
            isOwnerOrAdmin,
            tenantUserId,
            pendingKas,
            statusFilter
        };
    } catch (err) {
        console.error('Error loading kas page:', err);
        return {
            error: 'Gagal memuat data: ' + err.message,
            activeShift: null,
            kasList: [],
            summary: { total_masuk: 0, total_keluar: 0, count_masuk: 0, count_keluar: 0, count_pending: 0 },
            kategoriList: [],
            pengaturan: { limit_kas_keluar_kasir: null, kas_keluar_perlu_approval: 0 },
            limitKasKeluar: -1,
            isKasir: false,
            isOwnerOrAdmin: false,
            tenantUserId: null,
            pendingKas: [],
            statusFilter: 'semua'
        };
    }
}

// ============================================
// ACTIONS
// ============================================
export const actions = {
    /**
     * Simpan kas masuk/keluar
     * IMPROVED: No referensi menggunakan UUID untuk menghindari race condition
     */
    simpanKas: async ({ request, locals }) => {
        const user = locals.user;
        const tenantUser = locals.tenantUser;
        
        if (!user || !user.pelanggan_id) {
            return fail(401, { error: 'Unauthorized - user tidak ditemukan' });
        }
        
        const pelangganId = user.pelanggan_id;
        
        // Ambil tenantUserId
        let tenantUserId = null;
        
        if (tenantUser?.id) {
            tenantUserId = tenantUser.id;
        } else if (user.tenant_user_id) {
            tenantUserId = user.tenant_user_id;
        } else {
            try {
                const tenantUserResult = await query(`
                    SELECT id FROM tenant_users 
                    WHERE pelanggan_id = ? AND email = ? AND deleted_at IS NULL
                    LIMIT 1
                `, [pelangganId, user.email]);
                
                if (tenantUserResult && tenantUserResult.length > 0) {
                    tenantUserId = tenantUserResult[0].id;
                }
            } catch (err) {
                console.error('Error querying tenant_user:', err);
            }
        }
        
        if (!tenantUserId) {
            return fail(400, { error: 'User ID tidak ditemukan di tenant_users. Silakan hubungi admin.' });
        }
        
        const isKasir = tenantUser?.role === 'kasir';
        
        const formData = await request.formData();
        const tipe = formData.get('tipe');
        const jumlah = parseFloat(formData.get('jumlah') || 0);
        
        const kategoriKasIdRaw = formData.get('kategori_kas_id');
        const kategoriKasId = (kategoriKasIdRaw && kategoriKasIdRaw !== '' && kategoriKasIdRaw !== 'null') 
            ? parseInt(kategoriKasIdRaw) 
            : null;
        
        const keterangan = formData.get('keterangan')?.trim() || '';
        const penerima = formData.get('penerima')?.trim() || null;
        
        const shiftIdRaw = formData.get('shift_id');
        const shiftId = (shiftIdRaw && shiftIdRaw !== '' && shiftIdRaw !== 'null') 
            ? parseInt(shiftIdRaw) 
            : null;
        
        // Validasi
        if (!tipe || !['masuk', 'keluar'].includes(tipe)) {
            return fail(400, { error: 'Tipe kas tidak valid' });
        }
        
        if (!jumlah || jumlah <= 0) {
            return fail(400, { error: 'Jumlah harus lebih dari 0' });
        }
        
        if (jumlah > 999999999) {
            return fail(400, { error: 'Jumlah terlalu besar' });
        }
        
        if (!keterangan) {
            return fail(400, { error: 'Keterangan wajib diisi' });
        }
        
        if (keterangan.length > 500) {
            return fail(400, { error: 'Keterangan maksimal 500 karakter' });
        }
        
        if (tipe === 'keluar' && !penerima) {
            return fail(400, { error: 'Penerima wajib diisi untuk kas keluar' });
        }
        
        // Validasi limit untuk kasir
        if (isKasir && tipe === 'keluar') {
            const pengaturan = await getPengaturan(pelangganId);
            const limit = pengaturan.limit_kas_keluar_kasir;
            
            if (limit === 0) {
                return fail(403, { error: 'Anda tidak memiliki izin untuk kas keluar' });
            }
            
            if (limit !== null && limit > 0 && jumlah > limit) {
                return fail(400, { error: `Maksimal kas keluar untuk kasir adalah Rp ${limit.toLocaleString('id-ID')}` });
            }
        }
        
        try {
            // ✅ IMPROVED: Generate nomor referensi dengan UUID (no race condition)
            const noReferensi = generateNoReferensi(tipe);
            
            const today = new Date();
            const tanggal = today.toISOString().slice(0, 10);
            const waktu = today.toTimeString().slice(0, 8);
            
            // Determine status
            let status = 'approved';
            const pengaturan = await getPengaturan(pelangganId);
            if (tipe === 'keluar' && pengaturan.kas_keluar_perlu_approval && isKasir) {
                status = 'pending';
            }
            
            const insertParams = [
                pelangganId,
                noReferensi,
                tipe,
                tanggal,
                waktu,
                jumlah,
                kategoriKasId,
                keterangan,
                penerima,
                shiftId,
                tenantUserId,
                status
            ];
            
            const safeParams = insertParams.map(p => p === undefined ? null : p);
            
            const insertResult = await query(`
                INSERT INTO kas_transaksi (
                    pelanggan_id, no_referensi, tipe, tanggal, waktu,
                    jumlah, kategori_kas_id, keterangan, penerima,
                    shift_id, tenant_user_id, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, safeParams);
            
            const kasId = insertResult.insertId;
            
            // ✅ IMPROVED: Audit log
            await createAuditLog(
                pelangganId, 
                tenantUserId, 
                'CREATE', 
                'kas_transaksi', 
                kasId,
                null,
                { no_referensi: noReferensi, tipe, jumlah, keterangan, status }
            );
            
            // Update shift totals
            if (shiftId && status === 'approved') {
                await updateShiftTotals(shiftId);
            }
            
            // Create notification
            const notifTitle = tipe === 'masuk' ? 'Kas Masuk' : 'Kas Keluar';
            const notifMsg = `${noReferensi}: Rp ${jumlah.toLocaleString('id-ID')} - ${keterangan}`;
            await createNotification(pelangganId, notifTitle, notifMsg, 'kas');
            
            // Notification untuk pending approval
            if (status === 'pending') {
                await createNotification(
                    pelangganId, 
                    'Kas Menunggu Approval', 
                    `${noReferensi} perlu disetujui oleh Owner/Admin`,
                    'kas_approval'
                );
            }
            
            return { 
                success: true, 
                message: status === 'pending' 
                    ? 'Kas keluar menunggu approval' 
                    : `${tipe === 'masuk' ? 'Kas masuk' : 'Kas keluar'} berhasil disimpan`,
                noReferensi,
                status
            };
            
        } catch (err) {
            console.error('Error saving kas:', err);
            return fail(500, { error: 'Gagal menyimpan kas: ' + err.message });
        }
    },
    
    /**
     * Hapus kas (SOFT DELETE)
     * IMPROVED: Soft delete dengan audit trail
     */
    hapusKas: async ({ request, locals }) => {
        const user = locals.user;
        const tenantUser = locals.tenantUser;
        
        if (!user || !user.pelanggan_id) {
            return fail(401, { error: 'Unauthorized' });
        }
        
        const pelangganId = user.pelanggan_id;
        const tenantUserId = tenantUser?.id || user.tenant_user_id || user.id || null;
        const isKasir = tenantUser?.role === 'kasir';
        
        const formData = await request.formData();
        const kasId = formData.get('kas_id');
        const deleteReason = formData.get('delete_reason')?.trim() || 'Tidak ada alasan';
        
        if (!kasId) {
            return fail(400, { error: 'ID kas tidak valid' });
        }
        
        try {
            const kasData = await query(`
                SELECT * FROM kas_transaksi 
                WHERE id = ? AND pelanggan_id = ? AND deleted_at IS NULL
            `, [kasId, pelangganId]);
            
            if (!kasData.length) {
                return fail(404, { error: 'Data kas tidak ditemukan atau sudah dihapus' });
            }
            
            const kas = kasData[0];
            
            // Kasir hanya bisa hapus kas sendiri
            if (isKasir && kas.tenant_user_id !== tenantUserId) {
                return fail(403, { error: 'Anda tidak memiliki izin untuk menghapus kas ini' });
            }
            
            // Kasir tidak bisa hapus kas yang sudah approved lebih dari 1 jam
            if (isKasir && kas.status === 'approved') {
                const createdAt = new Date(kas.created_at);
                const now = new Date();
                const diffHours = (now - createdAt) / (1000 * 60 * 60);
                
                if (diffHours > 1) {
                    return fail(403, { error: 'Kas yang sudah approved lebih dari 1 jam tidak dapat dihapus. Hubungi Owner/Admin.' });
                }
            }
            
            const shiftId = kas.shift_id;
            
            // ✅ IMPROVED: Soft delete
            await query(`
                UPDATE kas_transaksi 
                SET 
                    deleted_at = NOW(),
                    deleted_by = ?,
                    delete_reason = ?
                WHERE id = ?
            `, [tenantUserId, deleteReason, kasId]);
            
            // ✅ IMPROVED: Audit log
            await createAuditLog(
                pelangganId,
                tenantUserId,
                'DELETE',
                'kas_transaksi',
                kasId,
                { no_referensi: kas.no_referensi, tipe: kas.tipe, jumlah: kas.jumlah },
                { delete_reason: deleteReason }
            );
            
            // Update shift totals
            if (shiftId) {
                await updateShiftTotals(shiftId);
            }
            
            return { success: true, message: 'Kas berhasil dihapus' };
            
        } catch (err) {
            console.error('Error deleting kas:', err);
            return fail(500, { error: 'Gagal menghapus kas: ' + err.message });
        }
    },
    
    /**
     * Approve kas pending (Owner/Admin only)
     */
    approveKas: async ({ request, locals }) => {
        const user = locals.user;
        const tenantUser = locals.tenantUser;
        
        if (!user || !user.pelanggan_id) {
            return fail(401, { error: 'Unauthorized' });
        }
        
        // Check permission
        const isOwnerOrAdmin = ['owner', 'admin'].includes(tenantUser?.role?.toLowerCase());
        if (!isOwnerOrAdmin) {
            return fail(403, { error: 'Hanya Owner/Admin yang dapat menyetujui kas' });
        }
        
        const pelangganId = user.pelanggan_id;
        const tenantUserId = tenantUser?.id;
        
        const formData = await request.formData();
        const kasId = formData.get('kas_id');
        
        if (!kasId) {
            return fail(400, { error: 'ID kas tidak valid' });
        }
        
        try {
            const kasData = await query(`
                SELECT * FROM kas_transaksi 
                WHERE id = ? AND pelanggan_id = ? AND status = 'pending' AND deleted_at IS NULL
            `, [kasId, pelangganId]);
            
            if (!kasData.length) {
                return fail(404, { error: 'Data kas tidak ditemukan atau sudah diproses' });
            }
            
            const kas = kasData[0];
            
            await query(`
                UPDATE kas_transaksi 
                SET 
                    status = 'approved',
                    approved_by = ?,
                    approved_at = NOW()
                WHERE id = ?
            `, [tenantUserId, kasId]);
            
            // Audit log
            await createAuditLog(
                pelangganId,
                tenantUserId,
                'APPROVE',
                'kas_transaksi',
                kasId,
                { status: 'pending' },
                { status: 'approved' }
            );
            
            // Update shift totals
            if (kas.shift_id) {
                await updateShiftTotals(kas.shift_id);
            }
            
            // Notification
            await createNotification(
                pelangganId,
                'Kas Disetujui',
                `${kas.no_referensi} telah disetujui`,
                'kas'
            );
            
            return { success: true, message: 'Kas berhasil disetujui' };
            
        } catch (err) {
            console.error('Error approving kas:', err);
            return fail(500, { error: 'Gagal menyetujui kas: ' + err.message });
        }
    },
    
    /**
     * Reject kas pending (Owner/Admin only)
     */
    rejectKas: async ({ request, locals }) => {
        const user = locals.user;
        const tenantUser = locals.tenantUser;
        
        if (!user || !user.pelanggan_id) {
            return fail(401, { error: 'Unauthorized' });
        }
        
        const isOwnerOrAdmin = ['owner', 'admin'].includes(tenantUser?.role?.toLowerCase());
        if (!isOwnerOrAdmin) {
            return fail(403, { error: 'Hanya Owner/Admin yang dapat menolak kas' });
        }
        
        const pelangganId = user.pelanggan_id;
        const tenantUserId = tenantUser?.id;
        
        const formData = await request.formData();
        const kasId = formData.get('kas_id');
        const rejectReason = formData.get('reject_reason')?.trim() || 'Tidak ada alasan';
        
        if (!kasId) {
            return fail(400, { error: 'ID kas tidak valid' });
        }
        
        try {
            const kasData = await query(`
                SELECT * FROM kas_transaksi 
                WHERE id = ? AND pelanggan_id = ? AND status = 'pending' AND deleted_at IS NULL
            `, [kasId, pelangganId]);
            
            if (!kasData.length) {
                return fail(404, { error: 'Data kas tidak ditemukan atau sudah diproses' });
            }
            
            const kas = kasData[0];
            
            await query(`
                UPDATE kas_transaksi 
                SET 
                    status = 'rejected',
                    rejected_by = ?,
                    rejected_at = NOW(),
                    reject_reason = ?
                WHERE id = ?
            `, [tenantUserId, rejectReason, kasId]);
            
            // Audit log
            await createAuditLog(
                pelangganId,
                tenantUserId,
                'REJECT',
                'kas_transaksi',
                kasId,
                { status: 'pending' },
                { status: 'rejected', reject_reason: rejectReason }
            );
            
            // Notification
            await createNotification(
                pelangganId,
                'Kas Ditolak',
                `${kas.no_referensi} ditolak: ${rejectReason}`,
                'kas'
            );
            
            return { success: true, message: 'Kas berhasil ditolak' };
            
        } catch (err) {
            console.error('Error rejecting kas:', err);
            return fail(500, { error: 'Gagal menolak kas: ' + err.message });
        }
    }
};