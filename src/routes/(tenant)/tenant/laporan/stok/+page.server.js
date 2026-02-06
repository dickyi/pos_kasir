/**
 * ============================================
 * LAPORAN STOK SERVER LOAD - FIXED
 * ============================================
 * Load data untuk laporan stok/inventory
 * - Owner dan Admin bisa akses
 * - Kasir tidak bisa akses
 * ============================================
 */
import { query } from '$lib/db.js';
import { fail, redirect } from '@sveltejs/kit';
import { startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns';

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
		default:
			return { start: startOfDay(now), end: endOfDay(now) };
	}
}

/**
 * Check if user can access stock reports
 */
function canAccessStockReports(user) {
	if (!user) return false;
	
	// Admin platform bisa akses
	if (['super_admin', 'admin', 'support'].includes(user.role)) return true;
	
	// Owner dan Admin tenant bisa akses
	if (user.role === 'tenant') {
		return ['owner', 'admin'].includes(user.tenant_role);
	}
	
	return false;
}

/**
 * Load stock report data
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
		if (!canAccessStockReports(user)) {
			throw fail(403, { 
				message: 'Akses ditolak. Hanya Owner dan Admin yang dapat mengakses laporan stok.' 
			});
		}

		const pelangganId = user.pelanggan_id;

		// Debug log
		console.log('================================');
		console.log('=== LAPORAN STOK ACCESS ===');
		console.log('User:', user.nama);
		console.log('tenant_role:', user.tenant_role);
		console.log('canAccess:', true);
		console.log('================================');

		// Get query parameters
		const period = url.searchParams.get('period') || 'today';
		const customStart = url.searchParams.get('start');
		const customEnd = url.searchParams.get('end');

		// Get date range
		const { start, end } = getDateRange(period, customStart, customEnd);

		// ==========================================
		// STOCK VALUATION
		// ==========================================
		const valuationResult = await query(
			`SELECT
				COALESCE(SUM(stok * harga_beli), 0) as total_nilai_modal,
				COALESCE(SUM(stok * harga_jual), 0) as total_nilai_jual,
				COUNT(*) as total_produk,
				COALESCE(SUM(CASE WHEN stok <= 10 AND stok > 0 THEN 1 ELSE 0 END), 0) as produk_low_stock,
				COALESCE(SUM(CASE WHEN stok = 0 THEN 1 ELSE 0 END), 0) as produk_out_of_stock
			FROM produk
			WHERE pelanggan_id = ? AND status = 'aktif'`,
			[pelangganId]
		);

		const valuation = valuationResult[0] || {
			total_nilai_modal: 0,
			total_nilai_jual: 0,
			total_produk: 0,
			produk_low_stock: 0,
			produk_out_of_stock: 0
		};

		// Calculate potential profit
		valuation.potential_profit = Number(valuation.total_nilai_jual) - Number(valuation.total_nilai_modal);

		// ==========================================
		// FAST MOVING PRODUCTS
		// ==========================================
		const fastMovingResult = await query(
			`SELECT
				p.nama_produk,
				k.nama_kategori,
				SUM(td.qty) as total_terjual,
				p.stok as stok_saat_ini,
				p.harga_beli,
				p.harga_jual
			FROM transaksi_detail td
			JOIN transaksi t ON td.transaksi_id = t.id
			JOIN produk p ON td.produk_id = p.id
			LEFT JOIN kategori k ON p.kategori_id = k.id
			WHERE t.pelanggan_id = ?
				AND t.status = 'success'
				AND t.tanggal >= ? AND t.tanggal <= ?
			GROUP BY p.id, p.nama_produk, k.nama_kategori, p.stok, p.harga_beli, p.harga_jual
			ORDER BY total_terjual DESC
			LIMIT 10`,
			[pelangganId, start, end]
		);

		// ==========================================
		// SLOW MOVING / DEAD STOCK
		// ==========================================
		const slowMovingResult = await query(
			`SELECT
				p.id,
				p.nama_produk,
				k.nama_kategori,
				p.stok,
				p.harga_beli,
				(p.stok * p.harga_beli) as nilai_modal_tersumbat,
				p.satuan,
				COALESCE(SUM(td.qty), 0) as total_terjual
			FROM produk p
			LEFT JOIN kategori k ON p.kategori_id = k.id
			LEFT JOIN transaksi_detail td ON p.id = td.produk_id
			LEFT JOIN transaksi t ON td.transaksi_id = t.id
				AND t.tanggal >= ? AND t.tanggal <= ? AND t.status = 'success'
			WHERE p.pelanggan_id = ? AND p.status = 'aktif'
			GROUP BY p.id, p.nama_produk, k.nama_kategori, p.stok, p.harga_beli, p.satuan
			HAVING total_terjual = 0 OR total_terjual < 5
			ORDER BY nilai_modal_tersumbat DESC
			LIMIT 10`,
			[start, end, pelangganId]
		);

		// ==========================================
		// LOW STOCK PRODUCTS
		// ==========================================
		const lowStockResult = await query(
			`SELECT
				p.nama_produk,
				k.nama_kategori,
				p.stok,
				p.satuan,
				p.harga_beli,
				p.harga_jual,
				(p.stok * p.harga_beli) as nilai_modal
			FROM produk p
			LEFT JOIN kategori k ON p.kategori_id = k.id
			WHERE p.pelanggan_id = ?
				AND p.status = 'aktif'
				AND p.stok <= 10
			ORDER BY p.stok ASC
			LIMIT 20`,
			[pelangganId]
		);

		// ==========================================
		// CURRENT STOCK STATUS
		// ==========================================
		const currentStockResult = await query(
			`SELECT
				p.nama_produk,
				k.nama_kategori,
				p.stok,
				p.satuan,
				p.harga_beli,
				p.harga_jual,
				(p.stok * p.harga_beli) as nilai_modal,
				CASE
					WHEN p.stok = 0 THEN 'Out of Stock'
					WHEN p.stok <= 10 THEN 'Low Stock'
					WHEN p.stok <= 50 THEN 'Medium'
					ELSE 'High'
				END as status_stok
			FROM produk p
			LEFT JOIN kategori k ON p.kategori_id = k.id
			WHERE p.pelanggan_id = ? AND p.status = 'aktif'
			ORDER BY
				CASE
					WHEN p.stok = 0 THEN 1
					WHEN p.stok <= 10 THEN 2
					WHEN p.stok <= 50 THEN 3
					ELSE 4
				END,
				p.stok ASC
			LIMIT 50`,
			[pelangganId]
		);

		// ==========================================
		// STOCK BY CATEGORY
		// ==========================================
		const categoryResult = await query(
			`SELECT
				COALESCE(k.nama_kategori, 'Tanpa Kategori') as nama_kategori,
				COUNT(*) as jumlah_produk,
				COALESCE(SUM(p.stok), 0) as total_stok,
				COALESCE(SUM(p.stok * p.harga_beli), 0) as total_nilai_modal,
				COALESCE(SUM(p.stok * p.harga_jual), 0) as total_nilai_jual
			FROM produk p
			LEFT JOIN kategori k ON p.kategori_id = k.id
			WHERE p.pelanggan_id = ? AND p.status = 'aktif'
			GROUP BY k.id, k.nama_kategori
			ORDER BY total_nilai_modal DESC`,
			[pelangganId]
		);

		// ==========================================
		// STOCK MOVEMENT SUMMARY (periode ini)
		// ==========================================
		const stockMovement = await query(
			`SELECT
				p.nama_produk,
				SUM(td.qty) as qty_keluar
			FROM transaksi_detail td
			JOIN transaksi t ON td.transaksi_id = t.id
			JOIN produk p ON td.produk_id = p.id
			WHERE t.pelanggan_id = ?
				AND t.status = 'success'
				AND t.tanggal >= ? AND t.tanggal <= ?
			GROUP BY p.id, p.nama_produk
			ORDER BY qty_keluar DESC
			LIMIT 10`,
			[pelangganId, start, end]
		);

		return {
			user,
			period,
			valuation: {
				total_nilai_modal: Number(valuation.total_nilai_modal),
				total_nilai_jual: Number(valuation.total_nilai_jual),
				total_produk: Number(valuation.total_produk),
				produk_low_stock: Number(valuation.produk_low_stock),
				produk_out_of_stock: Number(valuation.produk_out_of_stock),
				potential_profit: Number(valuation.potential_profit)
			},
			fastMoving: fastMovingResult.map(p => ({
				...p,
				total_terjual: Number(p.total_terjual),
				stok_saat_ini: Number(p.stok_saat_ini),
				harga_beli: Number(p.harga_beli),
				harga_jual: Number(p.harga_jual)
			})),
			slowMoving: slowMovingResult.map(p => ({
				...p,
				stok: Number(p.stok),
				nilai_modal_tersumbat: Number(p.nilai_modal_tersumbat),
				total_terjual: Number(p.total_terjual)
			})),
			lowStock: lowStockResult.map(p => ({
				...p,
				stok: Number(p.stok),
				nilai_modal: Number(p.nilai_modal)
			})),
			currentStock: currentStockResult.map(p => ({
				...p,
				stok: Number(p.stok),
				nilai_modal: Number(p.nilai_modal)
			})),
			categoryBreakdown: categoryResult.map(c => ({
				nama_kategori: c.nama_kategori,
				jumlah_produk: Number(c.jumlah_produk),
				total_stok: Number(c.total_stok),
				total_nilai_modal: Number(c.total_nilai_modal),
				total_nilai_jual: Number(c.total_nilai_jual)
			})),
			stockMovement: stockMovement.map(s => ({
				nama_produk: s.nama_produk,
				qty_keluar: Number(s.qty_keluar)
			}))
		};

	} catch (error) {
		console.error('Error loading stok report:', error);

		// If it's a redirect/fail error, rethrow it
		if (error.status === 302 || error.location || error.status === 403) {
			throw error;
		}

		// Otherwise return with error data
		return {
			user: parentData?.user || null,
			error: error.message,
			valuation: null,
			fastMoving: [],
			slowMoving: [],
			lowStock: [],
			currentStock: [],
			categoryBreakdown: [],
			stockMovement: []
		};
	}
}