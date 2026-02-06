// ============================================
// STATUS & USAGE - SERVER (v2)
// File: src/routes/(admin)/admin/usage/+page.server.js
// Fokus: System Health, Quota, Activity Logs, Health Score, Alerts
// ============================================

import { query } from '$lib/db.js';

export async function load({ url }) {
    const quotaSort = url.searchParams.get('quotaSort') || 'usage_percent';
    const quotaOrder = url.searchParams.get('quotaOrder') || 'desc';
    const logAction = url.searchParams.get('logAction') || '';
    const logPage = parseInt(url.searchParams.get('logPage')) || 1;
    const logLimit = 20;
    const logOffset = (logPage - 1) * logLimit;
    
    try {
        // ============================================
        // 1. SYSTEM HEALTH CHECK
        // ============================================
        let dbStatus = 'healthy';
        let dbLatency = 0;
        let dbMessage = '';
        
        const startTime = Date.now();
        try {
            await query('SELECT 1');
            dbLatency = Date.now() - startTime;
            if (dbLatency > 1000) {
                dbStatus = 'warning';
                dbMessage = 'Database response lambat';
            } else if (dbLatency > 2000) {
                dbStatus = 'critical';
                dbMessage = 'Database response sangat lambat';
            }
        } catch (error) {
            dbStatus = 'critical';
            dbMessage = 'Database tidak dapat diakses';
        }
        
        // Hitung storage usage (estimasi dari jumlah data)
        const [tableStats] = await query(`
            SELECT 
                SUM(data_length + index_length) / 1024 / 1024 as total_size_mb
            FROM information_schema.tables 
            WHERE table_schema = DATABASE()
        `).catch(() => [{ total_size_mb: 0 }]);
        
        const systemHealth = {
            database: {
                status: dbStatus,
                latency: dbLatency,
                message: dbMessage
            },
            server: {
                status: 'healthy',
                uptime: formatUptime(process.uptime ? process.uptime() : 0),
                memory: Math.round((process.memoryUsage?.().heapUsed || 0) / 1024 / 1024),
                cpu: 0 // Tidak bisa diakses langsung di Node.js
            },
            storage: {
                used: Math.round(Number(tableStats?.total_size_mb) || 0),
                total: 500, // 500 MB default limit
                unit: 'MB'
            },
            lastCheck: new Date().toISOString()
        };
        
        // ============================================
        // 2. TENANT QUOTA & USAGE
        // ============================================
        const quotaLimits = {
            maxProduk: 100,
            maxUser: 5,
            maxStorage: 500 // MB per tenant
        };
        
        const tenantQuotas = await query(`
            SELECT 
                p.id,
                p.kode_pelanggan,
                p.nama_bisnis,
                p.status,
                (SELECT COUNT(*) FROM produk pr WHERE pr.pelanggan_id = p.id) as total_produk,
                (SELECT COUNT(*) FROM tenant_users tu WHERE tu.pelanggan_id = p.id) as total_user,
                0 as storage_used,
                ${quotaLimits.maxProduk} as quota_produk,
                ${quotaLimits.maxUser} as quota_user,
                ${quotaLimits.maxStorage} as quota_storage
            FROM pelanggan p
            WHERE p.status != 'arsip'
            ORDER BY total_produk DESC
            LIMIT 50
        `);
        
        // ============================================
        // 3. ALERTS & WARNINGS
        // ============================================
        const alerts = [];
        
        // Alert: Tenant dengan quota hampir penuh
        const overQuotaTenants = await query(`
            SELECT 
                p.id, p.nama_bisnis,
                (SELECT COUNT(*) FROM produk pr WHERE pr.pelanggan_id = p.id) as total_produk
            FROM pelanggan p
            WHERE p.status = 'aktif'
            HAVING total_produk >= ${quotaLimits.maxProduk * 0.8}
        `);
        
        overQuotaTenants.forEach(t => {
            const percent = Math.round((t.total_produk / quotaLimits.maxProduk) * 100);
            alerts.push({
                id: `quota-produk-${t.id}`,
                type: 'quota',
                severity: percent >= 100 ? 'critical' : 'warning',
                title: 'Quota Produk',
                message: `${t.nama_bisnis} sudah menggunakan ${percent}% quota produk`,
                tenant_name: t.nama_bisnis,
                created_at: new Date().toISOString(),
                action_url: `/admin/tenant?search=${encodeURIComponent(t.nama_bisnis)}`,
                action_label: 'Kelola Tenant'
            });
        });
        
        // Alert: Tenant tidak aktif > 30 hari
        const inactiveTenants = await query(`
            SELECT 
                p.id, p.nama_bisnis,
                DATEDIFF(NOW(), (SELECT MAX(t.tanggal) FROM transaksi t WHERE t.pelanggan_id = p.id)) as days_inactive
            FROM pelanggan p
            WHERE p.status = 'aktif'
            HAVING days_inactive > 30 OR days_inactive IS NULL
            LIMIT 5
        `);
        
        inactiveTenants.forEach(t => {
            alerts.push({
                id: `inactive-${t.id}`,
                type: 'activity',
                severity: 'warning',
                title: 'Tenant Tidak Aktif',
                message: `${t.nama_bisnis} tidak ada transaksi selama ${t.days_inactive || 'N/A'} hari`,
                tenant_name: t.nama_bisnis,
                created_at: new Date().toISOString(),
                action_url: `/admin/tenant?search=${encodeURIComponent(t.nama_bisnis)}`,
                action_label: 'Lihat Tenant'
            });
        });
        
        // Alert: Tenant pending approval
        const [pendingCount] = await query(`
            SELECT COUNT(*) as count FROM pelanggan WHERE status = 'pending'
        `);
        
        if (pendingCount?.count > 0) {
            alerts.push({
                id: 'pending-tenants',
                type: 'approval',
                severity: 'info',
                title: 'Tenant Menunggu Approval',
                message: `${pendingCount.count} tenant menunggu persetujuan`,
                created_at: new Date().toISOString(),
                action_url: '/admin/tenant?status=pending',
                action_label: 'Review Tenant'
            });
        }
        
        // ============================================
        // 4. TENANT HEALTH DATA (for Health Score)
        // ============================================
        const tenantHealthData = await query(`
            SELECT 
                p.id,
                p.nama_bisnis,
                p.nama_pemilik,
                p.status,
                (SELECT COUNT(*) FROM produk pr WHERE pr.pelanggan_id = p.id) as total_produk,
                (SELECT COUNT(*) FROM transaksi t WHERE t.pelanggan_id = p.id AND t.status = 'success') as total_transaksi,
                (SELECT COUNT(*) FROM tenant_users tu WHERE tu.pelanggan_id = p.id) as total_user,
                DATEDIFF(NOW(), (SELECT MAX(t.tanggal) FROM transaksi t WHERE t.pelanggan_id = p.id)) as days_inactive
            FROM pelanggan p
            WHERE p.status != 'arsip'
        `);
        
        // ============================================
        // 5. RESOURCE USAGE TREND (7 hari terakhir)
        // ============================================
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }
        
        // Tenant growth per day
        const tenantGrowth = await query(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM pelanggan
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status != 'arsip'
            GROUP BY DATE(created_at)
        `);
        
        // Produk growth per day
        const produkGrowth = await query(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM produk
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
        `);
        
        // Transaksi per day
        const transaksiPerDay = await query(`
            SELECT DATE(tanggal) as date, COUNT(*) as count
            FROM transaksi
            WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status = 'success'
            GROUP BY DATE(tanggal)
        `);
        
        const resourceUsage = {
            labels: last7Days.map(d => {
                const date = new Date(d);
                return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            }),
            datasets: {
                tenants: last7Days.map(d => {
                    const found = tenantGrowth.find(t => t.date && t.date.toISOString().split('T')[0] === d);
                    return found ? Number(found.count) : 0;
                }),
                produk: last7Days.map(d => {
                    const found = produkGrowth.find(t => t.date && t.date.toISOString().split('T')[0] === d);
                    return found ? Number(found.count) : 0;
                }),
                transaksi: last7Days.map(d => {
                    const found = transaksiPerDay.find(t => t.date && t.date.toISOString().split('T')[0] === d);
                    return found ? Number(found.count) : 0;
                }),
                storage: last7Days.map(() => Math.round(Number(tableStats?.total_size_mb) || 0))
            }
        };
        
        // ============================================
        // 6. ACTIVITY LOGS
        // ============================================
        let logWhereClause = '1=1';
        const logParams = [];
        
        if (logAction) {
            logWhereClause += ' AND tal.action = ?';
            logParams.push(logAction);
        }
        
        const [logCountResult] = await query(`
            SELECT COUNT(*) as total FROM tenant_activity_logs tal WHERE ${logWhereClause}
        `, logParams);
        
        // Query sesuai struktur tabel tenant_activity_logs
        const activityLogs = await query(`
            SELECT 
                tal.id,
                tal.action,
                tal.module,
                tal.sub_module,
                tal.description,
                tal.reference_type,
                tal.reference_id,
                tal.ip_address,
                tal.level,
                tal.is_suspicious,
                tal.created_at,
                p.nama_bisnis as tenant_name,
                tu.nama as user_name
            FROM tenant_activity_logs tal
            LEFT JOIN pelanggan p ON tal.pelanggan_id = p.id
            LEFT JOIN tenant_users tu ON tal.tenant_user_id = tu.id
            WHERE ${logWhereClause}
            ORDER BY tal.created_at DESC
            LIMIT ? OFFSET ?
        `, [...logParams, logLimit, logOffset]);
        
        const logTotal = logCountResult?.total || 0;
        
        return {
            systemHealth,
            tenantQuotas,
            quotaLimits,
            alerts,
            tenantHealthData,
            resourceUsage,
            activityLogs: activityLogs || [],
            logsPagination: {
                page: logPage,
                limit: logLimit,
                total: logTotal,
                totalPages: Math.ceil(logTotal / logLimit)
            }
        };
        
    } catch (error) {
        console.error('Error loading status & usage data:', error);
        return {
            systemHealth: {
                database: { status: 'critical', latency: 0, message: error.message },
                server: { status: 'unknown', uptime: '-', memory: 0, cpu: 0 },
                storage: { used: 0, total: 500, unit: 'MB' },
                lastCheck: new Date().toISOString()
            },
            tenantQuotas: [],
            quotaLimits: { maxProduk: 100, maxUser: 5, maxStorage: 500 },
            alerts: [{
                id: 'system-error',
                type: 'system',
                severity: 'critical',
                title: 'System Error',
                message: error.message,
                created_at: new Date().toISOString()
            }],
            tenantHealthData: [],
            resourceUsage: { labels: [], datasets: { tenants: [], produk: [], transaksi: [], storage: [] } },
            activityLogs: [],
            logsPagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
            error: error.message
        };
    }
}

// Helper function
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}