/**
 * ============================================
 * LAPORAN KAS - PAGE SERVER
 * ============================================
 * Server-side logic untuk halaman laporan kas
 * 
 * FIXED: 
 * - Hapus is_active dari query kategori_kas
 * ============================================
 */

import { query } from '$lib/db.js';

/**
 * Get kas dengan filter
 */
async function getKasFiltered(pelangganId, filters = {}) {
    const {
        startDate,
        endDate,
        tipe,
        kategoriId,
        tenantUserId,
        shiftId,
        search,
        page = 1,
        limit = 50
    } = filters;
    
    let sql = `
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
    `;
    
    const params = [pelangganId];
    
    // Filter tanggal
    if (startDate) {
        sql += ` AND k.tanggal >= ?`;
        params.push(startDate);
    }
    
    if (endDate) {
        sql += ` AND k.tanggal <= ?`;
        params.push(endDate);
    }
    
    // Filter tipe
    if (tipe && ['masuk', 'keluar'].includes(tipe)) {
        sql += ` AND k.tipe = ?`;
        params.push(tipe);
    }
    
    // Filter kategori
    if (kategoriId) {
        sql += ` AND k.kategori_kas_id = ?`;
        params.push(kategoriId);
    }
    
    // Filter user
    if (tenantUserId) {
        sql += ` AND k.tenant_user_id = ?`;
        params.push(tenantUserId);
    }
    
    // Filter shift
    if (shiftId) {
        sql += ` AND k.shift_id = ?`;
        params.push(shiftId);
    }
    
    // Search
    if (search) {
        sql += ` AND (k.keterangan LIKE ? OR k.penerima LIKE ? OR k.no_referensi LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Count total
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;
    
    // Add pagination
    sql += ` ORDER BY k.tanggal DESC, k.waktu DESC`;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);
    
    const data = await query(sql, params);
    
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

/**
 * Get summary untuk periode tertentu
 */
async function getSummary(pelangganId, filters = {}) {
    const { startDate, endDate, tenantUserId } = filters;
    
    let sql = `
        SELECT 
            COALESCE(SUM(CASE WHEN tipe = 'masuk' THEN jumlah ELSE 0 END), 0) as total_masuk,
            COALESCE(SUM(CASE WHEN tipe = 'keluar' THEN jumlah ELSE 0 END), 0) as total_keluar,
            COUNT(CASE WHEN tipe = 'masuk' THEN 1 END) as count_masuk,
            COUNT(CASE WHEN tipe = 'keluar' THEN 1 END) as count_keluar
        FROM kas_transaksi
        WHERE pelanggan_id = ?
          AND status = 'approved'
    `;
    
    const params = [pelangganId];
    
    if (startDate) {
        sql += ` AND tanggal >= ?`;
        params.push(startDate);
    }
    
    if (endDate) {
        sql += ` AND tanggal <= ?`;
        params.push(endDate);
    }
    
    if (tenantUserId) {
        sql += ` AND tenant_user_id = ?`;
        params.push(tenantUserId);
    }
    
    const result = await query(sql, params);
    return result[0] || { total_masuk: 0, total_keluar: 0, count_masuk: 0, count_keluar: 0 };
}

/**
 * Get summary per kategori
 */
async function getSummaryByKategori(pelangganId, filters = {}) {
    const { startDate, endDate, tipe } = filters;
    
    let sql = `
        SELECT 
            k.kategori_kas_id,
            COALESCE(kat.nama, 'Tanpa Kategori') as kategori_nama,
            k.tipe,
            COUNT(*) as jumlah_transaksi,
            SUM(k.jumlah) as total
        FROM kas_transaksi k
        LEFT JOIN kategori_kas kat ON k.kategori_kas_id = kat.id
        WHERE k.pelanggan_id = ?
          AND k.status = 'approved'
    `;
    
    const params = [pelangganId];
    
    if (startDate) {
        sql += ` AND k.tanggal >= ?`;
        params.push(startDate);
    }
    
    if (endDate) {
        sql += ` AND k.tanggal <= ?`;
        params.push(endDate);
    }
    
    if (tipe && ['masuk', 'keluar'].includes(tipe)) {
        sql += ` AND k.tipe = ?`;
        params.push(tipe);
    }
    
    sql += ` GROUP BY k.kategori_kas_id, k.tipe ORDER BY total DESC`;
    
    return await query(sql, params);
}

/**
 * Get summary per hari (untuk chart)
 */
async function getSummaryPerDay(pelangganId, filters = {}) {
    const { startDate, endDate } = filters;
    
    let sql = `
        SELECT 
            tanggal,
            SUM(CASE WHEN tipe = 'masuk' THEN jumlah ELSE 0 END) as total_masuk,
            SUM(CASE WHEN tipe = 'keluar' THEN jumlah ELSE 0 END) as total_keluar
        FROM kas_transaksi
        WHERE pelanggan_id = ?
          AND status = 'approved'
    `;
    
    const params = [pelangganId];
    
    if (startDate) {
        sql += ` AND tanggal >= ?`;
        params.push(startDate);
    }
    
    if (endDate) {
        sql += ` AND tanggal <= ?`;
        params.push(endDate);
    }
    
    sql += ` GROUP BY tanggal ORDER BY tanggal ASC`;
    
    return await query(sql, params);
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
 * Get users (untuk filter)
 */
async function getUsers(pelangganId) {
    try {
        return await query(`
            SELECT id, nama, role
            FROM tenant_users
            WHERE pelanggan_id = ? AND deleted_at IS NULL AND status = 'aktif'
            ORDER BY nama ASC
        `, [pelangganId]);
    } catch (err) {
        console.error('Error getting users:', err);
        return [];
    }
}

/**
 * Get default date range (7 hari terakhir)
 */
function getDefaultDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // 7 hari termasuk hari ini
    
    return {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10)
    };
}

// ============================================
// LOAD FUNCTION
// ============================================
export async function load({ parent, url }) {
    const parentData = await parent();
    const { user, tenantUser } = parentData;
    
    if (!user || !user.pelanggan_id) {
        return { error: 'Unauthorized' };
    }
    
    const pelangganId = user.pelanggan_id;
    const currentTenantUserId = tenantUser?.id || user.tenant_user_id;
    const isKasir = tenantUser?.role === 'kasir';
    
    // Parse query params
    const defaultDates = getDefaultDateRange();
    const filters = {
        startDate: url.searchParams.get('start') || defaultDates.startDate,
        endDate: url.searchParams.get('end') || defaultDates.endDate,
        tipe: url.searchParams.get('tipe') || null,
        kategoriId: url.searchParams.get('kategori') || null,
        tenantUserId: isKasir ? currentTenantUserId : (url.searchParams.get('user') || null),
        shiftId: url.searchParams.get('shift') || null,
        search: url.searchParams.get('q') || null,
        page: parseInt(url.searchParams.get('page') || '1'),
        limit: parseInt(url.searchParams.get('limit') || '50')
    };
    
    try {
        const [kasResult, summary, summaryByKategori, summaryPerDay, kategoriList, userList] = await Promise.all([
            getKasFiltered(pelangganId, filters),
            getSummary(pelangganId, filters),
            getSummaryByKategori(pelangganId, filters),
            getSummaryPerDay(pelangganId, filters),
            getKategoriKas(pelangganId),
            isKasir ? [] : getUsers(pelangganId)
        ]);
        
        return {
            kasList: kasResult.data,
            pagination: kasResult.pagination,
            summary,
            summaryByKategori,
            summaryPerDay,
            kategoriList,
            userList,
            filters,
            isKasir,
            currentTenantUserId
        };
    } catch (err) {
        console.error('Error loading laporan kas:', err);
        return {
            error: 'Gagal memuat data: ' + err.message,
            kasList: [],
            pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
            summary: { total_masuk: 0, total_keluar: 0, count_masuk: 0, count_keluar: 0 },
            summaryByKategori: [],
            summaryPerDay: [],
            kategoriList: [],
            userList: [],
            filters,
            isKasir: false,
            currentTenantUserId: null
        };
    }
}