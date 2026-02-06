/**
 * ============================================
 * LAPORAN KASIR SERVER LOAD - FIXED
 * ============================================
 * Load data untuk laporan performa kasir
 * - Semua role bisa akses
 * - Kasir hanya lihat data sendiri
 * - Query menggunakan tenant_users
 * ============================================
 */
import { query } from '$lib/db.js';
import { redirect } from '@sveltejs/kit';

/**
 * Get date range based on period
 */
function getDateRange(period, customStart = null, customEnd = null) {
    const now = new Date();
    
    const startOfDay = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    };
    
    const endOfDay = (date) => {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    };

    if (period === 'custom' && customStart && customEnd) {
        return {
            start: startOfDay(new Date(customStart)),
            end: endOfDay(new Date(customEnd))
        };
    }

    switch (period) {
        case 'today':
            return { start: startOfDay(now), end: endOfDay(now) };
        case 'yesterday': {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
        }
        case 'week': {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return { start: startOfDay(weekAgo), end: endOfDay(now) };
        }
        case 'month': {
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return { start: startOfDay(monthAgo), end: endOfDay(now) };
        }
        case 'year': {
            const yearAgo = new Date(now);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return { start: startOfDay(yearAgo), end: endOfDay(now) };
        }
        default:
            return { start: startOfDay(now), end: endOfDay(now) };
    }
}

/**
 * Format date for SQL
 */
function formatDateSQL(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Load cashier performance report data
 */
export async function load({ parent, url }) {
    let user = null;
    
    try {
        // Get user data from parent layout
        const parentData = await parent();
        user = parentData?.user;

        // Validate user
        if (!user) {
            throw redirect(302, '/login');
        }

        const pelangganId = user.pelanggan_id;
        const tenantRole = user.tenant_role;
        const tenantUserId = user.tenant_user_id;

        // ========================================
        // PERMISSION CHECK
        // ========================================
        // Semua role bisa akses laporan kasir
        // Tapi kasir hanya bisa lihat data sendiri
        const isKasir = tenantRole === 'kasir';
        const canViewAll = ['owner', 'admin'].includes(tenantRole) || !tenantRole;

        // Debug log
        console.log('================================');
        console.log('=== LAPORAN KASIR PERMISSION ===');
        console.log('User:', user.nama);
        console.log('tenant_role:', tenantRole);
        console.log('tenant_user_id:', tenantUserId);
        console.log('isKasir:', isKasir);
        console.log('canViewAll:', canViewAll);
        console.log('================================');

        // Get query parameters
        const period = url.searchParams.get('period') || 'today';
        const customStart = url.searchParams.get('start');
        const customEnd = url.searchParams.get('end');

        // Get date range
        const { start, end } = getDateRange(period, customStart, customEnd);
        const startSQL = formatDateSQL(start);
        const endSQL = formatDateSQL(end);

        // ==========================================
        // CASHIER PERFORMANCE SUMMARY
        // Query menggunakan tenant_users, bukan users
        // ==========================================
        let performanceQuery = `
            SELECT
                COALESCE(tu.id, 0) as user_id,
                COALESCE(tu.nama, 'Legacy User') as nama_kasir,
                COALESCE(tu.email, '-') as email,
                COALESCE(tu.role, 'unknown') as role,
                COUNT(*) as total_transaksi,
                COALESCE(SUM(t.total), 0) as total_penjualan,
                COALESCE(AVG(t.total), 0) as rata_rata_transaksi,
                MIN(t.tanggal) as tanggal_awal,
                MAX(t.tanggal) as tanggal_akhir,
                COUNT(DISTINCT DATE(t.tanggal)) as hari_aktif
            FROM transaksi t
            LEFT JOIN tenant_users tu ON t.tenant_user_id = tu.id
            WHERE t.pelanggan_id = ?
                AND t.status = 'success'
                AND t.tanggal >= ? AND t.tanggal <= ?
        `;

        let queryParams = [pelangganId, startSQL, endSQL];

        // Jika kasir, filter hanya data sendiri
        if (isKasir && tenantUserId) {
            performanceQuery += ` AND t.tenant_user_id = ?`;
            queryParams.push(tenantUserId);
        }

        performanceQuery += `
            GROUP BY COALESCE(tu.id, 0), COALESCE(tu.nama, 'Legacy User'), COALESCE(tu.email, '-'), COALESCE(tu.role, 'unknown')
            ORDER BY total_penjualan DESC
        `;

        const performanceResult = await query(performanceQuery, queryParams);

        // ==========================================
        // HOURLY PERFORMANCE (for today/yesterday)
        // ==========================================
        let hourlyStats = [];
        
        if (period === 'today' || period === 'yesterday') {
            const dateFilter = period === 'today' ? 'CURDATE()' : 'DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
            
            let hourlyQuery = `
                SELECT
                    COALESCE(tu.nama, 'Legacy User') as nama_kasir,
                    HOUR(t.waktu) as jam,
                    COUNT(*) as jumlah_transaksi,
                    COALESCE(SUM(t.total), 0) as total
                FROM transaksi t
                LEFT JOIN tenant_users tu ON t.tenant_user_id = tu.id
                WHERE t.pelanggan_id = ?
                    AND t.status = 'success'
                    AND DATE(t.tanggal) = ${dateFilter}
            `;

            let hourlyParams = [pelangganId];

            if (isKasir && tenantUserId) {
                hourlyQuery += ` AND t.tenant_user_id = ?`;
                hourlyParams.push(tenantUserId);
            }

            hourlyQuery += `
                GROUP BY COALESCE(tu.id, 0), COALESCE(tu.nama, 'Legacy User'), HOUR(t.waktu)
                ORDER BY jam, nama_kasir
            `;

            const hourlyResult = await query(hourlyQuery, hourlyParams);

            // Reorganize data by hour (only active hours 6-22)
            for (let i = 6; i <= 22; i++) {
                const hourCashiers = hourlyResult.filter((h) => parseInt(h.jam) === i);
                
                if (hourCashiers.length > 0) {
                    hourlyStats.push({
                        jam: i,
                        label: `${i.toString().padStart(2, '0')}:00`,
                        total: hourCashiers.reduce((sum, c) => sum + Number(c.total), 0),
                        transaksi: hourCashiers.reduce((sum, c) => sum + Number(c.jumlah_transaksi), 0),
                        kasir: hourCashiers.map(c => ({
                            nama: c.nama_kasir,
                            jumlah_transaksi: Number(c.jumlah_transaksi),
                            total: Number(c.total)
                        }))
                    });
                }
            }
        } else {
            // Daily performance for longer periods
            let dailyQuery = `
                SELECT
                    DATE(t.tanggal) as tanggal,
                    COUNT(*) as jumlah_transaksi,
                    COALESCE(SUM(t.total), 0) as total
                FROM transaksi t
                WHERE t.pelanggan_id = ?
                    AND t.status = 'success'
                    AND t.tanggal >= ? AND t.tanggal <= ?
            `;

            let dailyParams = [pelangganId, startSQL, endSQL];

            if (isKasir && tenantUserId) {
                dailyQuery += ` AND t.tenant_user_id = ?`;
                dailyParams.push(tenantUserId);
            }

            dailyQuery += ` GROUP BY DATE(t.tanggal) ORDER BY tanggal`;

            const dailyResult = await query(dailyQuery, dailyParams);

            hourlyStats = dailyResult.map((d) => ({
                label: new Date(d.tanggal).toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'short' 
                }),
                total: Number(d.total),
                transaksi: Number(d.jumlah_transaksi)
            }));
        }

        // ==========================================
        // SHIFT PERFORMANCE (Pagi, Siang, Sore, Malam)
        // ==========================================
        let shiftQuery = `
            SELECT
                CASE 
                    WHEN HOUR(t.waktu) >= 6 AND HOUR(t.waktu) < 12 THEN 'Pagi (06-12)'
                    WHEN HOUR(t.waktu) >= 12 AND HOUR(t.waktu) < 15 THEN 'Siang (12-15)'
                    WHEN HOUR(t.waktu) >= 15 AND HOUR(t.waktu) < 18 THEN 'Sore (15-18)'
                    ELSE 'Malam (18-22)'
                END as shift,
                CASE 
                    WHEN HOUR(t.waktu) >= 6 AND HOUR(t.waktu) < 12 THEN 1
                    WHEN HOUR(t.waktu) >= 12 AND HOUR(t.waktu) < 15 THEN 2
                    WHEN HOUR(t.waktu) >= 15 AND HOUR(t.waktu) < 18 THEN 3
                    ELSE 4
                END as shift_order,
                COUNT(*) as jumlah_transaksi,
                COALESCE(SUM(t.total), 0) as total
            FROM transaksi t
            WHERE t.pelanggan_id = ?
                AND t.status = 'success'
                AND t.tanggal >= ? AND t.tanggal <= ?
        `;

        let shiftParams = [pelangganId, startSQL, endSQL];

        if (isKasir && tenantUserId) {
            shiftQuery += ` AND t.tenant_user_id = ?`;
            shiftParams.push(tenantUserId);
        }

        shiftQuery += ` GROUP BY shift, shift_order ORDER BY shift_order`;

        const shiftResult = await query(shiftQuery, shiftParams);

        // ==========================================
        // VOID / CANCELLED TRANSACTIONS
        // Hanya owner/admin yang bisa lihat
        // ==========================================
        let voidResult = [];
        
        if (canViewAll) {
            const voidQuery = await query(
                `SELECT
                    COALESCE(tu.nama, 'Legacy User') as nama_kasir,
                    COUNT(*) as jumlah_void,
                    COALESCE(SUM(t.total), 0) as nilai_void
                FROM transaksi t
                LEFT JOIN tenant_users tu ON t.tenant_user_id = tu.id
                WHERE t.pelanggan_id = ?
                    AND t.status = 'cancelled'
                    AND t.tanggal >= ? AND t.tanggal <= ?
                GROUP BY COALESCE(tu.id, 0), COALESCE(tu.nama, 'Legacy User')
                ORDER BY jumlah_void DESC`,
                [pelangganId, startSQL, endSQL]
            );
            voidResult = voidQuery;
        }

        // ==========================================
        // TOP PRODUCTS PER CASHIER
        // ==========================================
        let topProductsQuery = `
            SELECT
                COALESCE(tu.nama, 'Legacy User') as nama_kasir,
                td.nama_produk,
                SUM(td.qty) as total_qty,
                COUNT(DISTINCT td.transaksi_id) as jumlah_transaksi
            FROM transaksi_detail td
            JOIN transaksi t ON td.transaksi_id = t.id
            LEFT JOIN tenant_users tu ON t.tenant_user_id = tu.id
            WHERE t.pelanggan_id = ?
                AND t.status = 'success'
                AND t.tanggal >= ? AND t.tanggal <= ?
        `;

        let topProductsParams = [pelangganId, startSQL, endSQL];

        if (isKasir && tenantUserId) {
            topProductsQuery += ` AND t.tenant_user_id = ?`;
            topProductsParams.push(tenantUserId);
        }

        topProductsQuery += `
            GROUP BY COALESCE(tu.id, 0), COALESCE(tu.nama, 'Legacy User'), td.produk_id, td.nama_produk
            ORDER BY nama_kasir, total_qty DESC
        `;

        const topProductsResult = await query(topProductsQuery, topProductsParams);

        // Group top products by cashier (max 5 per cashier)
        const topProductsByCashier = {};
        topProductsResult.forEach((item) => {
            if (!topProductsByCashier[item.nama_kasir]) {
                topProductsByCashier[item.nama_kasir] = [];
            }
            if (topProductsByCashier[item.nama_kasir].length < 5) {
                topProductsByCashier[item.nama_kasir].push({
                    nama_produk: item.nama_produk,
                    total_qty: Number(item.total_qty),
                    jumlah_transaksi: Number(item.jumlah_transaksi)
                });
            }
        });

        // ==========================================
        // PAYMENT METHOD PER CASHIER
        // ==========================================
        let paymentMethodQuery = `
            SELECT
                COALESCE(tu.nama, 'Legacy User') as nama_kasir,
                t.metode_bayar,
                COUNT(*) as jumlah,
                COALESCE(SUM(t.total), 0) as total
            FROM transaksi t
            LEFT JOIN tenant_users tu ON t.tenant_user_id = tu.id
            WHERE t.pelanggan_id = ?
                AND t.status = 'success'
                AND t.tanggal >= ? AND t.tanggal <= ?
        `;

        let paymentMethodParams = [pelangganId, startSQL, endSQL];

        if (isKasir && tenantUserId) {
            paymentMethodQuery += ` AND t.tenant_user_id = ?`;
            paymentMethodParams.push(tenantUserId);
        }

        paymentMethodQuery += `
            GROUP BY COALESCE(tu.id, 0), COALESCE(tu.nama, 'Legacy User'), t.metode_bayar
            ORDER BY nama_kasir, total DESC
        `;

        const paymentMethodResult = await query(paymentMethodQuery, paymentMethodParams);

        // Group payment methods by cashier
        const paymentMethodsByCashier = {};
        paymentMethodResult.forEach((item) => {
            if (!paymentMethodsByCashier[item.nama_kasir]) {
                paymentMethodsByCashier[item.nama_kasir] = [];
            }
            paymentMethodsByCashier[item.nama_kasir].push({
                metode: item.metode_bayar,
                jumlah: Number(item.jumlah),
                total: Number(item.total)
            });
        });

        // ==========================================
        // CASHIER LEADERBOARD with RANKING
        // ==========================================
        const leaderboard = performanceResult.map((p, index) => ({
            rank: index + 1,
            user_id: p.user_id,
            nama_kasir: p.nama_kasir,
            email: p.email,
            role: p.role,
            total_transaksi: Number(p.total_transaksi),
            total_penjualan: Number(p.total_penjualan),
            rata_rata_transaksi: Number(p.rata_rata_transaksi),
            hari_aktif: Number(p.hari_aktif),
            score: Math.round(Number(p.total_penjualan) / 10000)
        }));

        // ==========================================
        // COMPARISON WITH PREVIOUS PERIOD
        // ==========================================
        let comparison = null;
        
        const periodDuration = end.getTime() - start.getTime();
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - periodDuration);
        
        const prevStartSQL = formatDateSQL(prevStart);
        const prevEndSQL = formatDateSQL(prevEnd);

        let comparisonQuery = `
            SELECT
                COUNT(*) as total_transaksi,
                COALESCE(SUM(total), 0) as total_penjualan
            FROM transaksi
            WHERE pelanggan_id = ?
                AND status = 'success'
                AND tanggal >= ? AND tanggal <= ?
        `;

        let comparisonParams = [pelangganId, prevStartSQL, prevEndSQL];

        if (isKasir && tenantUserId) {
            comparisonQuery += ` AND tenant_user_id = ?`;
            comparisonParams.push(tenantUserId);
        }

        const [prevPeriodResult] = await query(comparisonQuery, comparisonParams);

        const currentTotal = performanceResult.reduce((sum, p) => sum + Number(p.total_penjualan), 0);
        const currentTrx = performanceResult.reduce((sum, p) => sum + Number(p.total_transaksi), 0);
        const prevTotal = Number(prevPeriodResult?.total_penjualan || 0);
        const prevTrx = Number(prevPeriodResult?.total_transaksi || 0);

        comparison = {
            penjualan: {
                current: currentTotal,
                previous: prevTotal,
                change: prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal * 100) : 0
            },
            transaksi: {
                current: currentTrx,
                previous: prevTrx,
                change: prevTrx > 0 ? ((currentTrx - prevTrx) / prevTrx * 100) : 0
            }
        };

        return {
            user,
            period,
            dateRange: { start, end },
            // Permission info untuk UI
            permissions: {
                isKasir,
                canViewAll,
                tenantRole,
                tenantUserId
            },
            performance: performanceResult.map(p => ({
                ...p,
                total_transaksi: Number(p.total_transaksi),
                total_penjualan: Number(p.total_penjualan),
                rata_rata_transaksi: Number(p.rata_rata_transaksi),
                hari_aktif: Number(p.hari_aktif)
            })),
            hourlyStats,
            shiftStats: shiftResult.map(s => ({
                shift: s.shift,
                jumlah_transaksi: Number(s.jumlah_transaksi),
                total: Number(s.total)
            })),
            voidTransactions: voidResult.map(v => ({
                nama_kasir: v.nama_kasir,
                jumlah_void: Number(v.jumlah_void),
                nilai_void: Number(v.nilai_void)
            })),
            topProductsByCashier,
            paymentMethodsByCashier,
            leaderboard,
            comparison
        };

    } catch (error) {
        console.error('Error loading kasir report:', error);

        if (error.status === 302 || error.location) {
            throw error;
        }

        return {
            user,
            error: error.message || 'Terjadi kesalahan saat memuat data',
            period: 'today',
            permissions: { isKasir: false, canViewAll: true },
            performance: [],
            hourlyStats: [],
            shiftStats: [],
            voidTransactions: [],
            topProductsByCashier: {},
            paymentMethodsByCashier: {},
            leaderboard: [],
            comparison: null
        };
    }
}