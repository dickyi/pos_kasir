/**
 * ============================================
 * LAPORAN KEUANGAN SERVER LOAD - FIXED
 * ============================================
 * Load data untuk laporan keuangan (profit/loss)
 * - OWNER ONLY - Admin tidak bisa akses
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
 * Check if user can access financial reports
 * OWNER ONLY - laporan keuangan sensitif
 */
function canAccessFinancialReports(user) {
	if (!user) return false;
	
	// Admin platform bisa akses
	if (['super_admin', 'admin', 'support'].includes(user.role)) return true;
	
	// Hanya OWNER tenant yang bisa akses laporan keuangan
	if (user.role === 'tenant') {
		return user.tenant_role === 'owner';
	}
	
	return false;
}

/**
 * Load financial report data
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

		// Permission check - OWNER ONLY
		if (!canAccessFinancialReports(user)) {
			throw fail(403, { 
				message: 'Akses ditolak. Hanya Owner yang dapat mengakses laporan keuangan.' 
			});
		}

		const pelangganId = user.pelanggan_id;

		// Debug log
		console.log('================================');
		console.log('=== LAPORAN KEUANGAN ACCESS ===');
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
		// REVENUE VS COST (Profit/Loss)
		// ==========================================
		const profitLossResult = await query(
			`SELECT
				COALESCE(SUM(td.subtotal), 0) as total_penjualan,
				COALESCE(SUM(p.harga_beli * td.qty), 0) as total_modal,
				COALESCE(SUM(td.subtotal) - SUM(p.harga_beli * td.qty), 0) as profit,
				ROUND(COALESCE(
					(SUM(td.subtotal) - SUM(p.harga_beli * td.qty)) / NULLIF(SUM(td.subtotal), 0) * 100,
				0), 2) as profit_margin
			FROM transaksi_detail td
			JOIN transaksi t ON td.transaksi_id = t.id
			JOIN produk p ON td.produk_id = p.id
			WHERE t.pelanggan_id = ?
				AND t.status = 'success'
				AND t.tanggal >= ? AND t.tanggal <= ?`,
			[pelangganId, start, end]
		);

		const profitLoss = profitLossResult[0] || {
			total_penjualan: 0,
			total_modal: 0,
			profit: 0,
			profit_margin: 0
		};

		// ==========================================
		// DISCOUNT ANALYSIS
		// ==========================================
		const discountResult = await query(
			`SELECT
				COALESCE(SUM(diskon), 0) as total_diskon_transaksi,
				COALESCE(SUM(diskon_member), 0) as total_diskon_member,
				(SELECT COALESCE(SUM(td.diskon_nominal * td.qty), 0)
				 FROM transaksi_detail td
				 JOIN transaksi t ON td.transaksi_id = t.id
				 WHERE t.pelanggan_id = ?
				   AND t.status = 'success'
				   AND t.tanggal >= ? AND t.tanggal <= ?
				) as total_diskon_item
			FROM transaksi
			WHERE pelanggan_id = ?
				AND status = 'success'
				AND tanggal >= ? AND tanggal <= ?`,
			[pelangganId, start, end, pelangganId, start, end]
		);

		const discountAnalysis = discountResult[0] || {
			total_diskon_transaksi: 0,
			total_diskon_member: 0,
			total_diskon_item: 0
		};

		discountAnalysis.total_diskon_semua =
			Number(discountAnalysis.total_diskon_transaksi || 0) +
			Number(discountAnalysis.total_diskon_member || 0) +
			Number(discountAnalysis.total_diskon_item || 0);

		// ==========================================
		// TAX SUMMARY
		// ==========================================
		const taxResult = await query(
			`SELECT
				COALESCE(SUM(pajak), 0) as total_pajak
			FROM transaksi
			WHERE pelanggan_id = ?
				AND status = 'success'
				AND tanggal >= ? AND tanggal <= ?`,
			[pelangganId, start, end]
		);

		const taxSummary = Number(taxResult[0]?.total_pajak || 0);

		// ==========================================
		// NET PROFIT (after discounts and tax)
		// ==========================================
		const netProfit = Number(profitLoss.profit) - discountAnalysis.total_diskon_semua;

		// ==========================================
		// DAILY PROFIT/LOSS TREND
		// ==========================================
		let chartData = [];

		if (period === 'today') {
			// Hourly profit for today
			const hourlyResult = await query(
				`SELECT
					HOUR(t.waktu) as label,
					COALESCE(SUM(td.subtotal - p.harga_beli * td.qty), 0) as profit
				FROM transaksi_detail td
				JOIN transaksi t ON td.transaksi_id = t.id
				JOIN produk p ON td.produk_id = p.id
				WHERE t.pelanggan_id = ?
					AND t.status = 'success'
					AND DATE(t.tanggal) = CURDATE()
				GROUP BY HOUR(t.waktu)
				ORDER BY HOUR(t.waktu)`,
				[pelangganId]
			);

			// Fill in missing hours with 0
			for (let i = 0; i < 24; i++) {
				const hourData = hourlyResult.find((h) => parseInt(h.label) === i);
				chartData.push({
					label: `${i.toString().padStart(2, '0')}:00`,
					profit: Number(hourData?.profit || 0)
				});
			}
		} else {
			// Daily profit for date range
			const dailyResult = await query(
				`SELECT
					DATE(t.tanggal) as label,
					COALESCE(SUM(td.subtotal - p.harga_beli * td.qty), 0) as profit,
					COALESCE(SUM(td.subtotal), 0) as revenue
				FROM transaksi_detail td
				JOIN transaksi t ON td.transaksi_id = t.id
				JOIN produk p ON td.produk_id = p.id
				WHERE t.pelanggan_id = ?
					AND t.status = 'success'
					AND t.tanggal >= ? AND t.tanggal <= ?
				GROUP BY DATE(t.tanggal)
				ORDER BY DATE(t.tanggal)`,
				[pelangganId, start, end]
			);

			chartData = dailyResult.map((d) => ({
				label: new Date(d.label).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
				profit: Number(d.profit),
				revenue: Number(d.revenue)
			}));
		}

		// ==========================================
		// PROFIT BY CATEGORY
		// ==========================================
		const profitByCategory = await query(
			`SELECT
				COALESCE(k.nama_kategori, 'Tanpa Kategori') as nama_kategori,
				COALESCE(SUM(td.subtotal), 0) as revenue,
				COALESCE(SUM(p.harga_beli * td.qty), 0) as modal,
				COALESCE(SUM(td.subtotal - p.harga_beli * td.qty), 0) as profit
			FROM transaksi_detail td
			JOIN transaksi t ON td.transaksi_id = t.id
			JOIN produk p ON td.produk_id = p.id
			LEFT JOIN kategori k ON p.kategori_id = k.id
			WHERE t.pelanggan_id = ?
				AND t.status = 'success'
				AND t.tanggal >= ? AND t.tanggal <= ?
			GROUP BY k.id, k.nama_kategori
			ORDER BY profit DESC`,
			[pelangganId, start, end]
		);

		// ==========================================
		// PROFIT BY CASHIER (untuk insight)
		// ==========================================
		const profitByCashier = await query(
			`SELECT
				COALESCE(tu.nama, 'Legacy User') as nama_kasir,
				tu.role as kasir_role,
				COALESCE(SUM(td.subtotal), 0) as revenue,
				COALESCE(SUM(p.harga_beli * td.qty), 0) as modal,
				COALESCE(SUM(td.subtotal - p.harga_beli * td.qty), 0) as profit
			FROM transaksi_detail td
			JOIN transaksi t ON td.transaksi_id = t.id
			JOIN produk p ON td.produk_id = p.id
			LEFT JOIN tenant_users tu ON t.tenant_user_id = tu.id
			WHERE t.pelanggan_id = ?
				AND t.status = 'success'
				AND t.tanggal >= ? AND t.tanggal <= ?
			GROUP BY COALESCE(tu.id, 0), COALESCE(tu.nama, 'Legacy User'), tu.role
			ORDER BY profit DESC`,
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
					COALESCE(SUM(td.subtotal), 0) as total_penjualan,
					COALESCE(SUM(p.harga_beli * td.qty), 0) as total_modal,
					COALESCE(SUM(td.subtotal) - SUM(p.harga_beli * td.qty), 0) as profit
				FROM transaksi_detail td
				JOIN transaksi t ON td.transaksi_id = t.id
				JOIN produk p ON td.produk_id = p.id
				WHERE t.pelanggan_id = ?
					AND t.status = 'success'
					AND t.tanggal >= ? AND t.tanggal <= ?`,
				[pelangganId, prevStart, prevEnd]
			);

			comparisonSummary = prevResult[0] || {
				total_penjualan: 0,
				total_modal: 0,
				profit: 0
			};
		}

		return {
			user,
			period,
			profitLoss: {
				total_penjualan: Number(profitLoss.total_penjualan),
				total_modal: Number(profitLoss.total_modal),
				profit: Number(profitLoss.profit),
				profit_margin: Number(profitLoss.profit_margin)
			},
			discountAnalysis,
			taxSummary,
			netProfit,
			chartData,
			profitByCategory: profitByCategory.map(c => ({
				nama_kategori: c.nama_kategori,
				revenue: Number(c.revenue),
				modal: Number(c.modal),
				profit: Number(c.profit)
			})),
			profitByCashier: profitByCashier.map(c => ({
				nama_kasir: c.nama_kasir,
				kasir_role: c.kasir_role,
				revenue: Number(c.revenue),
				modal: Number(c.modal),
				profit: Number(c.profit)
			})),
			comparisonSummary
		};

	} catch (error) {
		console.error('Error loading keuangan report:', error);

		// If it's a redirect/fail error, rethrow it
		if (error.status === 302 || error.location || error.status === 403) {
			throw error;
		}

		// Otherwise return with error data
		return {
			user: parentData?.user || null,
			error: error.message,
			profitLoss: null,
			discountAnalysis: null,
			taxSummary: 0,
			netProfit: 0,
			chartData: [],
			profitByCategory: [],
			profitByCashier: []
		};
	}
}