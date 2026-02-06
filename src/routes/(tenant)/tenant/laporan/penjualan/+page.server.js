/**
 * ============================================
 * LAPORAN PENJUALAN SERVER LOAD - FIXED
 * ============================================
 * Load data untuk laporan penjualan lengkap
 * - Permission check dengan tenant_role
 * - Query menggunakan tenant_users
 * ============================================
 */
import { query } from '$lib/db.js';
import { fail, redirect } from '@sveltejs/kit';
import { startOfDay, endOfDay, subDays, subWeeks, subMonths, subYears } from 'date-fns';

/**
 * Get date range based on period
 */
function getDateRange(period, customStart = null, customEnd = null) {
	const now = new Date();

	if (period === 'custom' && customStart && customEnd) {
		return {
			start: new Date(customStart),
			end: new Date(customEnd)
		};
	}

	switch (period) {
		case 'today':
			return { start: startOfDay(now), end: endOfDay(now) };
		case 'week':
			return { start: startOfDay(subWeeks(now, 1)), end: endOfDay(now) };
		case 'month':
			return { start: startOfDay(subMonths(now, 1)), end: endOfDay(now) };
		case 'year':
			return { start: startOfDay(subYears(now, 1)), end: endOfDay(now) };
		default:
			return { start: startOfDay(now), end: endOfDay(now) };
	}
}

/**
 * Check if user can access reports
 */
function canAccessReports(user) {
	if (!user) return false;
	
	// Admin platform bisa akses
	if (['super_admin', 'admin', 'support'].includes(user.role)) return true;
	
	// Tenant owner dan admin bisa akses
	if (user.role === 'tenant') {
		return ['owner', 'admin'].includes(user.tenant_role);
	}
	
	return false;
}

/**
 * Load sales report data
 */
export async function load({ parent, url }) {
	let parentData = null;
	
	try {
		// Get user data from parent layout
		parentData = await parent();
		const user = parentData?.user;

		// Validate user
		if (!user) {
			throw redirect(302, '/login');
		}

		// Permission check
		if (!canAccessReports(user)) {
			throw fail(403, { message: 'Akses ditolak. Hanya Owner dan Admin yang dapat mengakses laporan penjualan.' });
		}

		const pelangganId = user.pelanggan_id;

		// Debug log
		console.log('================================');
		console.log('=== LAPORAN PENJUALAN ACCESS ===');
		console.log('User:', user.nama);
		console.log('tenant_role:', user.tenant_role);
		console.log('canAccess:', true);
		console.log('================================');

		// Get query parameters
		const period = url.searchParams.get('period') || 'today';
		const customStart = url.searchParams.get('start');
		const customEnd = url.searchParams.get('end');
		const compare = url.searchParams.get('compare') === 'true';

		// Get date range
		const { start, end } = getDateRange(period, customStart, customEnd);

		// ==========================================
		// SUMMARY STATISTICS
		// ==========================================
		const summaryResult = await query(
			`SELECT
				COUNT(*) as total_transaksi,
				COALESCE(SUM(total), 0) as total_penjualan,
				COALESCE(AVG(total), 0) as rata_rata_transaksi,
				COALESCE(SUM(subtotal), 0) as total_subtotal,
				COALESCE(SUM(diskon), 0) as total_diskon,
				COALESCE(SUM(pajak), 0) as total_pajak,
				COUNT(DISTINCT DATE(tanggal)) as hari_aktif
			FROM transaksi
			WHERE pelanggan_id = ?
				AND status = 'success'
				AND tanggal >= ? AND tanggal <= ?`,
			[pelangganId, start, end]
		);

		const summary = summaryResult[0] || {
			total_transaksi: 0,
			total_penjualan: 0,
			rata_rata_transaksi: 0,
			total_subtotal: 0,
			total_diskon: 0,
			total_pajak: 0,
			hari_aktif: 0
		};

		// ==========================================
		// DAILY SALES (for chart)
		// ==========================================
		let chartData = [];

		if (period === 'today') {
			// Hourly sales for today
			const hourlyResult = await query(
				`SELECT
					HOUR(waktu) as label,
					COUNT(*) as jumlah_transaksi,
					COALESCE(SUM(total), 0) as total
				FROM transaksi
				WHERE pelanggan_id = ?
					AND status = 'success'
					AND DATE(tanggal) = CURDATE()
				GROUP BY HOUR(waktu)
				ORDER BY HOUR(waktu)`,
				[pelangganId]
			);

			// Fill in missing hours with 0
			for (let i = 0; i < 24; i++) {
				const hourData = hourlyResult.find((h) => parseInt(h.label) === i);
				chartData.push({
					label: `${i.toString().padStart(2, '0')}:00`,
					jumlah_transaksi: hourData?.jumlah_transaksi || 0,
					total: hourData?.total || 0
				});
			}
		} else {
			// Daily sales for date range
			const dailyResult = await query(
				`SELECT
					DATE(tanggal) as label,
					COUNT(*) as jumlah_transaksi,
					COALESCE(SUM(total), 0) as total,
					COALESCE(SUM(subtotal), 0) as subtotal,
					COALESCE(SUM(diskon), 0) as total_diskon,
					COALESCE(SUM(pajak), 0) as total_pajak
				FROM transaksi
				WHERE pelanggan_id = ?
					AND status = 'success'
					AND tanggal >= ? AND tanggal <= ?
				GROUP BY DATE(tanggal)
				ORDER BY DATE(tanggal)`,
				[pelangganId, start, end]
			);

			chartData = dailyResult.map((d) => ({
				label: new Date(d.label).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
				jumlah_transaksi: d.jumlah_transaksi,
				total: d.total
			}));
		}

		// ==========================================
		// TOP 10 PRODUCTS
		// ==========================================
		const topProductsResult = await query(
			`SELECT
				td.nama_produk,
				SUM(td.qty) as total_qty,
				COALESCE(SUM(td.subtotal), 0) as total_penjualan,
				COUNT(DISTINCT td.transaksi_id) as jumlah_transaksi
			FROM transaksi_detail td
			JOIN transaksi t ON td.transaksi_id = t.id
			WHERE t.pelanggan_id = ?
				AND t.status = 'success'
				AND t.tanggal >= ? AND t.tanggal <= ?
			GROUP BY td.produk_id, td.nama_produk
			ORDER BY total_qty DESC
			LIMIT 10`,
			[pelangganId, start, end]
		);

		// ==========================================
		// CATEGORY BREAKDOWN
		// ==========================================
		const categoryResult = await query(
			`SELECT
				k.nama_kategori,
				COUNT(DISTINCT td.transaksi_id) as jumlah_transaksi,
				SUM(td.qty) as total_qty,
				COALESCE(SUM(td.subtotal), 0) as total
			FROM transaksi_detail td
			JOIN transaksi t ON td.transaksi_id = t.id
			JOIN produk p ON td.produk_id = p.id
			LEFT JOIN kategori k ON p.kategori_id = k.id
			WHERE t.pelanggan_id = ?
				AND t.status = 'success'
				AND t.tanggal >= ? AND t.tanggal <= ?
			GROUP BY k.id, k.nama_kategori
			ORDER BY total DESC`,
			[pelangganId, start, end]
		);

		// ==========================================
		// PAYMENT METHOD BREAKDOWN
		// ==========================================
		const paymentResult = await query(
			`SELECT
				metode_bayar,
				COUNT(*) as jumlah_transaksi,
				COALESCE(SUM(total), 0) as total
			FROM transaksi
			WHERE pelanggan_id = ?
				AND status = 'success'
				AND tanggal >= ? AND tanggal <= ?
			GROUP BY metode_bayar
			ORDER BY total DESC`,
			[pelangganId, start, end]
		);

		// ==========================================
		// TRANSACTIONS (detailed, limited)
		// FIXED: Menggunakan tenant_users bukan users
		// ==========================================
		const transactionsResult = await query(
			`SELECT
				t.id,
				t.no_invoice,
				t.tanggal,
				t.waktu,
				t.total,
				t.metode_bayar,
				t.nama_customer,
				COALESCE(tu.nama, 'Legacy User') as nama_kasir,
				tu.role as kasir_role,
				(SELECT COUNT(*) FROM transaksi_detail WHERE transaksi_id = t.id) as jumlah_item
			FROM transaksi t
			LEFT JOIN tenant_users tu ON t.tenant_user_id = tu.id
			WHERE t.pelanggan_id = ?
				AND t.status = 'success'
				AND t.tanggal >= ? AND t.tanggal <= ?
			ORDER BY t.tanggal DESC, t.waktu DESC
			LIMIT 100`,
			[pelangganId, start, end]
		);

		// ==========================================
		// COMPARISON DATA (if requested)
		// ==========================================
		let comparisonSummary = null;
		if (compare) {
			const diff = end.getTime() - start.getTime();
			const prevStart = new Date(start.getTime() - diff);
			const prevEnd = start;

			const prevResult = await query(
				`SELECT
					COUNT(*) as total_transaksi,
					COALESCE(SUM(total), 0) as total_penjualan,
					COALESCE(AVG(total), 0) as rata_rata_transaksi
				FROM transaksi
				WHERE pelanggan_id = ?
					AND status = 'success'
					AND tanggal >= ? AND tanggal <= ?`,
				[pelangganId, prevStart, prevEnd]
			);

			comparisonSummary = prevResult[0] || {
				total_transaksi: 0,
				total_penjualan: 0,
				rata_rata_transaksi: 0
			};
		}

		// ==========================================
		// SALES BY CASHIER (untuk insight tambahan)
		// ==========================================
		const salesByCashier = await query(
			`SELECT
				COALESCE(tu.nama, 'Legacy User') as nama_kasir,
				tu.role as kasir_role,
				COUNT(*) as total_transaksi,
				COALESCE(SUM(t.total), 0) as total_penjualan
			FROM transaksi t
			LEFT JOIN tenant_users tu ON t.tenant_user_id = tu.id
			WHERE t.pelanggan_id = ?
				AND t.status = 'success'
				AND t.tanggal >= ? AND t.tanggal <= ?
			GROUP BY COALESCE(tu.id, 0), COALESCE(tu.nama, 'Legacy User'), tu.role
			ORDER BY total_penjualan DESC`,
			[pelangganId, start, end]
		);

		return {
			user,
			period,
			summary,
			chartData,
			topProducts: topProductsResult,
			categoryBreakdown: categoryResult,
			paymentBreakdown: paymentResult,
			transactions: transactionsResult,
			salesByCashier,
			comparisonSummary
		};

	} catch (error) {
		console.error('Error loading penjualan report:', error);

		// If it's a redirect/fail error, rethrow it
		if (error.status === 302 || error.location || error.status === 403) {
			throw error;
		}

		// Otherwise return with error data
		return {
			user: parentData?.user || null,
			error: error.message,
			summary: null,
			chartData: [],
			topProducts: [],
			categoryBreakdown: [],
			paymentBreakdown: [],
			transactions: [],
			salesByCashier: []
		};
	}
}