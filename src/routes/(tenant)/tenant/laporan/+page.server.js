/**
 * ============================================
 * LAPORAN INDEX SERVER LOAD - UPDATED
 * ============================================
 * Load data untuk halaman index laporan
 * - Permission check berdasarkan tenant_role
 * - Kasir redirect ke laporan kasir
 * - UPDATED: Menambahkan laporan shift
 * ============================================
 */
import { query } from '$lib/db.js';
import { fail, redirect } from '@sveltejs/kit';

/**
 * Check report access and get available reports
 */
function getAvailableReports(user) {
	if (!user) return { canAccess: false, reports: [] };
	
	const tenantRole = user.tenant_role;
	
	// Admin platform - semua akses
	if (['super_admin', 'admin', 'support'].includes(user.role)) {
		return {
			canAccess: true,
			reports: ['penjualan', 'keuangan', 'stok', 'kasir', 'shift']
		};
	}
	
	// Tenant
	if (user.role === 'tenant') {
		if (tenantRole === 'owner') {
			// Owner - semua akses
			return {
				canAccess: true,
				reports: ['penjualan', 'keuangan', 'stok', 'kasir', 'shift']
			};
		} else if (tenantRole === 'admin') {
			// Admin - kecuali keuangan
			return {
				canAccess: true,
				reports: ['penjualan', 'stok', 'kasir', 'shift']
			};
		} else if (tenantRole === 'kasir') {
			// Kasir - hanya kasir (data sendiri)
			return {
				canAccess: true,
				reports: ['kasir']
			};
		}
	}
	
	return { canAccess: false, reports: [] };
}

/**
 * Load quick stats untuk halaman laporan
 */
export async function load({ parent }) {
	let parentData = null;
	
	try {
		// Get user data from parent layout
		parentData = await parent();
		const user = parentData?.user;

		// Validate user
		if (!user) {
			throw redirect(302, '/login');
		}

		// Get available reports
		const { canAccess, reports } = getAvailableReports(user);
		
		if (!canAccess) {
			throw fail(403, { message: 'Akses ditolak.' });
		}

		// Jika kasir, langsung redirect ke laporan kasir
		if (user.tenant_role === 'kasir') {
			throw redirect(302, '/tenant/laporan/kasir');
		}

		const pelangganId = user.pelanggan_id;
		const tenantUserId = user.tenant_user_id;

		// Debug log
		console.log('================================');
		console.log('=== LAPORAN INDEX ACCESS ===');
		console.log('User:', user.nama);
		console.log('tenant_role:', user.tenant_role);
		console.log('Available reports:', reports);
		console.log('================================');

		// Get today's date range
		const today = new Date();
		const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

		// Quick Stats - Penjualan Hari Ini
		const penjualanResult = await query(
			`SELECT
				COALESCE(SUM(total), 0) as penjualan_hari_ini,
				COUNT(*) as total_transaksi,
				COALESCE(AVG(total), 0) as rata_rata_transaksi
			FROM transaksi
			WHERE pelanggan_id = ?
				AND status = 'success'
				AND tanggal >= ? AND tanggal < ?`,
			[pelangganId, startOfDay, endOfDay]
		);

		// Produk Terjual Hari Ini
		const produkResult = await query(
			`SELECT COALESCE(SUM(td.qty), 0) as produk_terjual
			FROM transaksi_detail td
			JOIN transaksi t ON td.transaksi_id = t.id
			WHERE t.pelanggan_id = ?
				AND t.status = 'success'
				AND t.tanggal >= ? AND t.tanggal < ?`,
			[pelangganId, startOfDay, endOfDay]
		);

		// Profit Hari Ini (hanya untuk owner)
		let profitHariIni = null;
		if (user.tenant_role === 'owner' || ['super_admin', 'admin'].includes(user.role)) {
			const profitResult = await query(
				`SELECT
					COALESCE(SUM(td.subtotal - p.harga_beli * td.qty), 0) as profit
				FROM transaksi_detail td
				JOIN transaksi t ON td.transaksi_id = t.id
				JOIN produk p ON td.produk_id = p.id
				WHERE t.pelanggan_id = ?
					AND t.status = 'success'
					AND t.tanggal >= ? AND t.tanggal < ?`,
				[pelangganId, startOfDay, endOfDay]
			);
			profitHariIni = Number(profitResult[0]?.profit || 0);
		}

		// Low Stock Count
		const lowStockResult = await query(
			`SELECT COUNT(*) as count FROM produk 
			 WHERE pelanggan_id = ? AND status = 'aktif' AND stok <= 10`,
			[pelangganId]
		);

		// Shift Stats - untuk owner & admin
		let shiftStats = null;
		if (['owner', 'admin'].includes(user.tenant_role) || ['super_admin', 'admin'].includes(user.role)) {
			const shiftResult = await query(
				`SELECT 
					COUNT(*) as total_shift,
					SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as shift_aktif,
					COALESCE(SUM(selisih_kas), 0) as total_selisih
				FROM shifts
				WHERE pelanggan_id = ?
				AND tanggal = CURDATE()`,
				[pelangganId]
			);
			shiftStats = {
				totalShift: Number(shiftResult[0]?.total_shift || 0),
				shiftAktif: Number(shiftResult[0]?.shift_aktif || 0),
				totalSelisih: Number(shiftResult[0]?.total_selisih || 0)
			};
		}

		const quickStats = {
			penjualanHariIni: Number(penjualanResult[0]?.penjualan_hari_ini || 0),
			transaksiHariIni: Number(penjualanResult[0]?.total_transaksi || 0),
			rataRataTransaksi: Number(penjualanResult[0]?.rata_rata_transaksi || 0),
			produkTerjual: Number(produkResult[0]?.produk_terjual || 0),
			profitHariIni,
			lowStockCount: Number(lowStockResult[0]?.count || 0),
			shiftStats
		};

		return {
			user,
			quickStats,
			availableReports: reports,
			tenantRole: user.tenant_role
		};

	} catch (error) {
		console.error('Error loading laporan index:', error);

		// If it's a redirect/fail error, rethrow it
		if (error.status === 302 || error.location || error.status === 403) {
			throw error;
		}

		// Otherwise return with error data
		return {
			user: parentData?.user || null,
			quickStats: {},
			availableReports: [],
			error: error.message
		};
	}
}