/**
 * ============================================
 * DASHBOARD TENANT - SERVER
 * File: src/routes/(tenant)/tenant/dashboard/+page.server.js
 * ============================================
 */

import { query } from '$lib/db.js';

/**
 * LOAD FUNCTION - Fetch dashboard data
 */
export async function load({ parent }) {
	const parentData = await parent();
	const user = parentData?.user;

	if (!user) {
		return {
			stats: null,
			chartData: null,
			recentTransactions: [],
			topProducts: [],
			alerts: [],
			error: 'User tidak valid'
		};
	}

	// Cari pelanggan_id
	let pelangganId = user.pelanggan_id;
	if (!pelangganId) {
		try {
			const pelangganResult = await query(
				'SELECT id FROM pelanggan WHERE email = ?',
				[user.email]
			);
			if (pelangganResult.length > 0) {
				pelangganId = pelangganResult[0].id;
			}
		} catch (e) {
			console.log('Error finding pelanggan:', e);
		}
	}

	if (!pelangganId) {
		return {
			stats: null,
			chartData: null,
			recentTransactions: [],
			topProducts: [],
			alerts: [],
			error: 'Tenant tidak terhubung'
		};
	}

	try {
		// ============================================
		// 1. STATISTICS HARI INI
		// ============================================
		const statsResult = await query(`
			SELECT
				COALESCE(SUM(CASE WHEN t.tanggal = CURDATE() AND t.status = 'success' THEN t.total ELSE 0 END), 0) as penjualan_hari_ini,
				COUNT(CASE WHEN t.tanggal = CURDATE() AND t.status = 'success' THEN 1 END) as transaksi_hari_ini,
				COALESCE((SELECT SUM(td.qty)
					FROM transaksi t2
					INNER JOIN transaksi_detail td ON t2.id = td.transaksi_id
					WHERE t2.pelanggan_id = ? AND t2.tanggal = CURDATE() AND t2.status = 'success'
				), 0) as produk_terjual,
				(
					SELECT COUNT(*)
					FROM produk
					WHERE pelanggan_id = ? AND stok <= 5 AND status = 'aktif'
				) as stok_menipis
			FROM transaksi t
			WHERE t.pelanggan_id = ?
		`, [pelangganId, pelangganId, pelangganId]);

		const stats = {
			penjualanHariIni: statsResult[0]?.penjualan_hari_ini || 0,
			transaksiHariIni: statsResult[0]?.transaksi_hari_ini || 0,
			produkTerjual: statsResult[0]?.produk_terjual || 0,
			stokMenipis: statsResult[0]?.stok_menipis || 0
		};

		// ============================================
		// 2. CHART DATA - Penjualan 7 hari terakhir
		// ============================================
		const chartResult = await query(`
			SELECT
				DATE(tanggal) as tanggal,
				COALESCE(SUM(CASE WHEN status = 'success' THEN total ELSE 0 END), 0) as total
			FROM transaksi
			WHERE pelanggan_id = ?
				AND tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
			GROUP BY DATE(tanggal)
			ORDER BY tanggal ASC
		`, [pelangganId]);

		// Generate labels dan data untuk chart
		const chartLabels = [];
		const chartData = [];
		const today = new Date();

		for (let i = 6; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			const dateStr = date.toISOString().split('T')[0];
			const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });

			chartLabels.push(dayName);

			const found = chartResult.find(row => row.tanggal === dateStr);
			chartData.push(found ? parseFloat(found.total) : 0);
		}

		// ============================================
		// 3. TRANSAKSI TERAKHIR (5)
		// ============================================
		const recentTransactions = await query(`
			SELECT
				t.id,
				t.no_invoice,
				t.tanggal,
				t.waktu,
				t.total,
				t.status,
				(SELECT COUNT(*) FROM transaksi_detail td WHERE td.transaksi_id = t.id) as jumlah_item
			FROM transaksi t
			WHERE t.pelanggan_id = ?
			ORDER BY t.tanggal DESC, t.waktu DESC
			LIMIT 5
		`, [pelangganId]);

		// ============================================
		// 4. PRODUK TERLARIS (5)
		// ============================================
		const topProducts = await query(`
			SELECT
				p.nama_produk,
				COALESCE(SUM(td.qty), 0) as total_terjual,
				COALESCE(SUM(td.subtotal), 0) as total_pendapatan
			FROM produk p
			LEFT JOIN transaksi_detail td ON p.id = td.produk_id
			LEFT JOIN transaksi t ON td.transaksi_id = t.id
				AND t.tanggal = CURDATE()
				AND t.status = 'success'
			WHERE p.pelanggan_id = ? AND p.status = 'aktif'
			GROUP BY p.id, p.nama_produk
			HAVING total_terjual > 0
			ORDER BY total_terjual DESC
			LIMIT 5
		`, [pelangganId]);

		// ============================================
		// 5. ALERTS / NOTIFIKASI
		// ============================================
		const alerts = [];

		// Stok menipis alert
		if (stats.stokMenipis > 0) {
			const lowStockProducts = await query(`
				SELECT nama_produk, stok
				FROM produk
				WHERE pelanggan_id = ? AND stok <= 5 AND status = 'aktif'
				ORDER BY stok ASC
				LIMIT 3
			`, [pelangganId]);

			alerts.push({
				type: 'warning',
				title: `${stats.stokMenipis} Produk Stok Menipis`,
				message: lowStockProducts.map(p => `${p.nama_produk} (${p.stok})`).join(', '),
				link: '/tenant/produk'
			});
		}

		// Transaksi pending alert
		const pendingCount = await query(`
			SELECT COUNT(*) as count
			FROM transaksi
			WHERE pelanggan_id = ? AND status = 'pending'
		`, [pelangganId]);

		if (pendingCount[0]?.count > 0) {
			alerts.push({
				type: 'info',
				title: `${pendingCount[0].count} Transaksi Pending`,
				message: 'Ada transaksi yang perlu diproses',
				link: '/tenant/transaksi?status=pending'
			});
		}

		return {
			stats,
			chartData: {
				labels: chartLabels,
				data: chartData
			},
			recentTransactions,
			topProducts,
			alerts
		};

	} catch (error) {
		console.error('Error loading dashboard:', error);
		return {
			stats: null,
			chartData: null,
			recentTransactions: [],
			topProducts: [],
			alerts: [],
			error: 'Gagal memuat data: ' + error.message
		};
	}
}
