// ============================================
// PIN HISTORY & LOGGING
// File: src/lib/pin/history.js
// Logging aktivitas PIN (attempts & changes)
// ============================================

import { query } from '../db.js';
import { maskPin } from './validation.js';

/**
 * Log percobaan login PIN ke database
 * 
 * @param {Object} params - Parameter logging
 * @param {number} params.pelangganId - ID tenant
 * @param {string} params.pin - PIN yang dimasukkan (akan di-mask)
 * @param {number|null} params.userId - ID user jika ditemukan
 * @param {boolean} params.isSuccess - Apakah login berhasil
 * @param {string|null} params.failureReason - Alasan gagal
 * @param {string|null} params.ipAddress - IP address
 * @param {string|null} params.userAgent - User agent browser
 * @returns {Promise<boolean>} - Berhasil atau tidak
 */
export async function logPinAttempt(params) {
    const {
        pelangganId,
        pin,
        userId = null,
        isSuccess = false,
        failureReason = null,
        ipAddress = null,
        userAgent = null
    } = params;

    try {
        const maskedPin = maskPin(pin);
        
        await query(
            `INSERT INTO pin_login_attempts 
             (pelanggan_id, pin_entered, user_id, is_success, failure_reason, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [pelangganId, maskedPin, userId, isSuccess ? 1 : 0, failureReason, ipAddress, userAgent]
        );
        
        return true;
    } catch (error) {
        // Logging gagal tidak boleh menggagalkan proses utama
        console.warn('Failed to log PIN attempt:', error.message);
        return false;
    }
}

/**
 * Log perubahan PIN (set, change, reset) ke database
 * 
 * @param {Object} params - Parameter logging
 * @param {number} params.userId - ID user yang PIN-nya diubah
 * @param {number} params.pelangganId - ID tenant
 * @param {string} params.action - Jenis aksi (set, change, reset)
 * @param {number|null} params.changedBy - ID user yang melakukan perubahan
 * @param {string|null} params.changedByRole - Role user yang melakukan perubahan
 * @param {string|null} params.ipAddress - IP address
 * @returns {Promise<boolean>} - Berhasil atau tidak
 */
export async function logPinChange(params) {
    const {
        userId,
        pelangganId,
        action,
        changedBy = null,
        changedByRole = null,
        ipAddress = null
    } = params;

    try {
        await query(
            `INSERT INTO pin_history 
             (user_id, pelanggan_id, action, changed_by, changed_by_role, ip_address)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, pelangganId, action, changedBy, changedByRole, ipAddress]
        );
        
        return true;
    } catch (error) {
        console.warn('Failed to log PIN change:', error.message);
        return false;
    }
}

/**
 * Dapatkan riwayat login PIN untuk tenant
 * 
 * @param {number} pelangganId - ID tenant
 * @param {Object} options - Opsi query
 * @param {number} options.limit - Jumlah maksimal record
 * @param {boolean} options.failedOnly - Hanya tampilkan yang gagal
 * @param {string} options.startDate - Filter dari tanggal
 * @param {string} options.endDate - Filter sampai tanggal
 * @returns {Promise<Array>}
 */
export async function getPinLoginHistory(pelangganId, options = {}) {
    const {
        limit = 50,
        failedOnly = false,
        startDate = null,
        endDate = null
    } = options;

    try {
        let sql = `
            SELECT 
                pla.id,
                pla.pin_entered,
                pla.is_success,
                pla.failure_reason,
                pla.ip_address,
                pla.created_at,
                tu.nama as user_name,
                tu.role as user_role
            FROM pin_login_attempts pla
            LEFT JOIN tenant_users tu ON pla.user_id = tu.id
            WHERE pla.pelanggan_id = ?
        `;
        const params = [pelangganId];

        if (failedOnly) {
            sql += ' AND pla.is_success = 0';
        }

        if (startDate) {
            sql += ' AND pla.created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            sql += ' AND pla.created_at <= ?';
            params.push(endDate);
        }

        sql += ' ORDER BY pla.created_at DESC LIMIT ?';
        params.push(limit);

        return await query(sql, params);
    } catch (error) {
        console.error('Get PIN login history error:', error);
        return [];
    }
}

/**
 * Dapatkan riwayat perubahan PIN untuk tenant
 * 
 * @param {number} pelangganId - ID tenant
 * @param {Object} options - Opsi query
 * @param {number} options.limit - Jumlah maksimal record
 * @param {number} options.userId - Filter untuk user tertentu
 * @returns {Promise<Array>}
 */
export async function getPinChangeHistory(pelangganId, options = {}) {
    const { limit = 20, userId = null } = options;

    try {
        let sql = `
            SELECT 
                ph.id,
                ph.action,
                ph.created_at,
                ph.ip_address,
                tu.nama as user_name,
                tu.role as user_role,
                cb.nama as changed_by_name,
                ph.changed_by_role
            FROM pin_history ph
            JOIN tenant_users tu ON ph.user_id = tu.id
            LEFT JOIN tenant_users cb ON ph.changed_by = cb.id
            WHERE ph.pelanggan_id = ?
        `;
        const params = [pelangganId];

        if (userId) {
            sql += ' AND ph.user_id = ?';
            params.push(userId);
        }

        sql += ' ORDER BY ph.created_at DESC LIMIT ?';
        params.push(limit);

        return await query(sql, params);
    } catch (error) {
        console.error('Get PIN change history error:', error);
        return [];
    }
}

/**
 * Dapatkan statistik login attempts per periode
 * Berguna untuk analisis keamanan
 * 
 * @param {number} pelangganId - ID tenant
 * @param {string} period - Periode: 'day', 'week', 'month'
 * @returns {Promise<Object>}
 */
export async function getPinLoginStats(pelangganId, period = 'day') {
    try {
        let dateFilter;
        switch (period) {
            case 'week':
                dateFilter = 'DATE_SUB(NOW(), INTERVAL 7 DAY)';
                break;
            case 'month':
                dateFilter = 'DATE_SUB(NOW(), INTERVAL 30 DAY)';
                break;
            default: // day
                dateFilter = 'DATE_SUB(NOW(), INTERVAL 24 HOUR)';
        }

        const stats = await query(
            `SELECT 
                COUNT(*) as total_attempts,
                SUM(CASE WHEN is_success = 1 THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN is_success = 0 THEN 1 ELSE 0 END) as failed,
                COUNT(DISTINCT ip_address) as unique_ips,
                COUNT(DISTINCT user_id) as unique_users
            FROM pin_login_attempts
            WHERE pelanggan_id = ?
            AND created_at >= ${dateFilter}`,
            [pelangganId]
        );

        const result = stats[0] || {
            total_attempts: 0,
            successful: 0,
            failed: 0,
            unique_ips: 0,
            unique_users: 0
        };

        // Hitung success rate
        result.success_rate = result.total_attempts > 0
            ? Math.round((result.successful / result.total_attempts) * 100)
            : 0;

        return result;
    } catch (error) {
        console.error('Get PIN login stats error:', error);
        return {
            total_attempts: 0,
            successful: 0,
            failed: 0,
            unique_ips: 0,
            unique_users: 0,
            success_rate: 0
        };
    }
}

/**
 * Dapatkan IP addresses yang sering gagal login
 * Berguna untuk deteksi brute force
 * 
 * @param {number} pelangganId - ID tenant
 * @param {number} minFailures - Minimal jumlah kegagalan
 * @param {number} hours - Dalam berapa jam terakhir
 * @returns {Promise<Array>}
 */
export async function getSuspiciousIPs(pelangganId, minFailures = 5, hours = 24) {
    try {
        return await query(
            `SELECT 
                ip_address,
                COUNT(*) as failed_attempts,
                MIN(created_at) as first_attempt,
                MAX(created_at) as last_attempt
            FROM pin_login_attempts
            WHERE pelanggan_id = ?
            AND is_success = 0
            AND ip_address IS NOT NULL
            AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
            GROUP BY ip_address
            HAVING failed_attempts >= ?
            ORDER BY failed_attempts DESC
            LIMIT 20`,
            [pelangganId, hours, minFailures]
        );
    } catch (error) {
        console.error('Get suspicious IPs error:', error);
        return [];
    }
}

/**
 * Bersihkan log lama
 * Biasanya dijalankan via scheduled job
 * 
 * @param {number} daysToKeepAttempts - Berapa hari menyimpan log attempts
 * @param {number} daysToKeepHistory - Berapa hari menyimpan log history
 * @returns {Promise<Object>}
 */
export async function cleanupOldLogs(daysToKeepAttempts = 90, daysToKeepHistory = 365) {
    try {
        // Cleanup login attempts
        const attemptsResult = await query(
            `DELETE FROM pin_login_attempts 
             WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [daysToKeepAttempts]
        );

        // Cleanup PIN history
        const historyResult = await query(
            `DELETE FROM pin_history 
             WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [daysToKeepHistory]
        );

        return {
            success: true,
            deletedAttempts: attemptsResult.affectedRows || 0,
            deletedHistory: historyResult.affectedRows || 0
        };
    } catch (error) {
        console.error('Cleanup old logs error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Export login attempts ke format CSV
 * Berguna untuk audit
 * 
 * @param {number} pelangganId - ID tenant
 * @param {string} startDate - Tanggal mulai
 * @param {string} endDate - Tanggal akhir
 * @returns {Promise<string>} - CSV string
 */
export async function exportLoginAttemptsToCSV(pelangganId, startDate, endDate) {
    try {
        const attempts = await query(
            `SELECT 
                pla.created_at as 'Waktu',
                tu.nama as 'User',
                tu.role as 'Role',
                pla.is_success as 'Berhasil',
                pla.failure_reason as 'Alasan Gagal',
                pla.ip_address as 'IP Address'
            FROM pin_login_attempts pla
            LEFT JOIN tenant_users tu ON pla.user_id = tu.id
            WHERE pla.pelanggan_id = ?
            AND pla.created_at BETWEEN ? AND ?
            ORDER BY pla.created_at DESC`,
            [pelangganId, startDate, endDate]
        );

        if (attempts.length === 0) {
            return 'Tidak ada data';
        }

        // Generate CSV
        const headers = Object.keys(attempts[0]);
        const rows = attempts.map(row => 
            headers.map(h => {
                let val = row[h];
                if (val === null) return '';
                if (h === 'Berhasil') return val ? 'Ya' : 'Tidak';
                if (typeof val === 'object') return val.toISOString();
                return String(val).replace(/"/g, '""');
            }).join(',')
        );

        return [headers.join(','), ...rows].join('\n');
    } catch (error) {
        console.error('Export login attempts error:', error);
        throw error;
    }
}