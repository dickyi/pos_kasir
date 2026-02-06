// ============================================
// STATS CACHE SERVICE
// File: src/lib/data/statsCache.js
// 
// Konversi dari MySQL Stored Procedures:
// - sp_update_stats_cache()
// - RefreshLandingStats()
// 
// Digunakan untuk refresh cache statistik 
// landing page dan platform stats
// ============================================

import { query } from '$lib/db.js';

// ============================================
// HELPER: Format angka ke string ringkas
// ============================================

/**
 * Format angka besar ke format ringkas (1K, 1.5M, 2B, dll)
 * @param {number} value - Angka mentah
 * @param {string} prefix - Prefix (misal 'Rp ')
 * @returns {string} Formatted string
 */
function formatCompact(value, prefix = '') {
    let formatted;

    if (value >= 1_000_000_000) {
        formatted = `${(value / 1_000_000_000).toFixed(1)}B`;
    } else if (value >= 1_000_000) {
        formatted = `${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
        formatted = `${(value / 1_000).toFixed(1)}K`;
    } else {
        formatted = String(Math.round(value));
    }

    // Hapus .0 (misal 9.0K → 9K)
    formatted = formatted
        .replace('.0K', 'K')
        .replace('.0M', 'M')
        .replace('.0B', 'B');

    return prefix ? `${prefix}${formatted}` : formatted;
}

// ============================================
// MAIN: Update Stats Cache
// Konversi dari sp_update_stats_cache()
// ============================================

/**
 * Refresh semua stats cache dari data terbaru di database.
 * Mengupdate tabel stats_cache dan landing_stats.
 * 
 * @returns {Promise<Object>} { success, message, stats }
 */
export async function updateStatsCache() {
    try {
        // ---- Hitung semua statistik ----
        const [
            [tenantAktif],
            [tenantAll],
            [transaksi],
            [transaksiValue],
            [produk],
            [users],
            [kasir]
        ] = await Promise.all([
            query(`SELECT COUNT(*) AS val FROM pelanggan WHERE status = 'aktif'`),
            query(`SELECT COUNT(*) AS val FROM pelanggan`),
            query(`SELECT COUNT(*) AS val FROM transaksi WHERE status = 'success'`),
            query(`SELECT COALESCE(SUM(total), 0) AS val FROM transaksi WHERE status = 'success'`),
            query(`SELECT COUNT(*) AS val FROM produk WHERE status = 'aktif'`),
            query(`SELECT COUNT(*) AS val FROM tenant_users WHERE status = 'aktif'`),
            query(`SELECT COUNT(*) AS val FROM tenant_users WHERE status = 'aktif' AND role = 'kasir'`)
        ]);

        // ---- Siapkan data untuk upsert ----
        const cacheData = [
            { key: 'total_tenants',           raw: tenantAktif.val,    formatted: formatCompact(tenantAktif.val) },
            { key: 'total_tenants_all',       raw: tenantAll.val,      formatted: formatCompact(tenantAll.val) },
            { key: 'total_transactions',      raw: transaksi.val,      formatted: formatCompact(transaksi.val) },
            { key: 'total_transaction_value', raw: transaksiValue.val, formatted: formatCompact(transaksiValue.val) },
            { key: 'total_products',          raw: produk.val,         formatted: formatCompact(produk.val) },
            { key: 'total_users',             raw: users.val,          formatted: formatCompact(users.val) },
            { key: 'total_kasir',             raw: kasir.val,          formatted: formatCompact(kasir.val) },
        ];

        // ---- Upsert ke stats_cache ----
        for (const item of cacheData) {
            await query(`
                INSERT INTO stats_cache (cache_key, cache_value, raw_value, expires_at)
                VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
                ON DUPLICATE KEY UPDATE 
                    cache_value = VALUES(cache_value),
                    raw_value = VALUES(raw_value),
                    expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR),
                    last_updated = NOW()
            `, [item.key, item.formatted, item.raw]);
        }

        // ---- Sync ke landing_stats (source_type = 'auto') ----
        await query(`
            UPDATE landing_stats ls
            INNER JOIN stats_cache sc ON ls.query_key = sc.cache_key
            SET ls.cached_value = sc.cache_value,
                ls.last_cached_at = sc.last_updated
            WHERE ls.source_type = 'auto'
        `);

        return {
            success: true,
            message: 'Cache statistik berhasil direfresh!',
            stats: cacheData
        };

    } catch (error) {
        console.error('[StatsCache] Error updating stats cache:', error);
        return {
            success: false,
            message: 'Gagal refresh cache: ' + error.message
        };
    }
}

// ============================================
// ALTERNATIVE: Refresh Landing Stats
// Konversi dari RefreshLandingStats()
// Menulis ke platform_settings (versi lama)
// ============================================

/**
 * Refresh landing stats dan simpan ke platform_settings.
 * Ini adalah versi lama, gunakan updateStatsCache() untuk versi baru.
 * 
 * @returns {Promise<Object>} { success, message }
 */
export async function refreshLandingStats() {
    try {
        const [
            [tenants],
            [transactions],
            [txValue],
            [products],
            [users],
            [kasirCount]
        ] = await Promise.all([
            query(`SELECT COUNT(*) AS val FROM pelanggan WHERE status = 'aktif'`),
            query(`SELECT COUNT(*) AS val FROM transaksi WHERE status = 'success'`),
            query(`SELECT COALESCE(SUM(total), 0) AS val FROM transaksi WHERE status = 'success'`),
            query(`SELECT COUNT(*) AS val FROM produk WHERE status = 'aktif'`),
            query(`SELECT COUNT(*) AS val FROM tenant_users WHERE status = 'aktif'`),
            query(`SELECT COUNT(*) AS val FROM tenant_users WHERE status = 'aktif' AND role = 'kasir'`)
        ]);

        const statsToUpdate = [
            { key: 'stats_cache_total_tenants',           value: formatCompact(tenants.val) + '+',                label: 'Cache: Total Tenants' },
            { key: 'stats_cache_total_transactions',      value: formatCompact(transactions.val) + '+',           label: 'Cache: Total Transactions' },
            { key: 'stats_cache_total_transaction_value', value: 'Rp ' + formatCompact(txValue.val) + '+',        label: 'Cache: Total Transaction Value' },
            { key: 'stats_cache_total_products',          value: formatCompact(products.val) + '+',               label: 'Cache: Total Products' },
            { key: 'stats_cache_total_users',             value: formatCompact(users.val) + '+',                  label: 'Cache: Total Users' },
            { key: 'stats_cache_total_kasir',             value: formatCompact(kasirCount.val) + '+',             label: 'Cache: Total Kasir' },
            { key: 'stats_cache_updated_at',              value: new Date().toISOString(),                        label: 'Cache: Last Updated' },
        ];

        for (const stat of statsToUpdate) {
            await query(`
                INSERT INTO platform_settings (setting_key, setting_value, setting_type, category, label)
                VALUES (?, ?, 'text', 'stats_cache', ?)
                ON DUPLICATE KEY UPDATE 
                    setting_value = VALUES(setting_value),
                    updated_at = NOW()
            `, [stat.key, stat.value, stat.label]);
        }

        return {
            success: true,
            message: 'Stats cache refreshed successfully!'
        };

    } catch (error) {
        console.error('[StatsCache] Error refreshing landing stats:', error);
        return {
            success: false,
            message: 'Gagal refresh landing stats: ' + error.message
        };
    }
}

export default {
    updateStatsCache,
    refreshLandingStats,
    formatCompact
};