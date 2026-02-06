/**
 * ============================================
 * LAPORAN PENJUALAN EXPORT API
 * ============================================
 * API endpoint untuk export laporan penjualan
 * ============================================
 */

import { getUserFromSession, canAccessReports } from '$lib/auth.js';
import { query } from '$lib/db.js';
import { fail } from '@sveltejs/kit';
import { startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns';
import { generatePDF, generateExcel, generateFilename, downloadFile } from '$lib/utils/export.js';
import { formatRupiah, formatDate } from '$lib/utils/format.js';

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
 * GET handler for export (returns file directly)
 */
export async function GET({ url, cookies }) {
	try {
		// Get user from session
		const user = getUserFromSession(cookies);

		// Validate user
		if (!user) {
			throw fail(401, { message: 'Unauthorized' });
		}

		// Only admin and tenant can access reports
		if (!canAccessReports(user)) {
			throw fail(403, { message: 'Akses ditolak' });
		}

		const pelangganId = user.pelanggan_id;

		// Get query parameters
		const format = url.searchParams.get('format') || 'pdf'; // 'pdf' or 'excel'
		const period = url.searchParams.get('period') || 'today';
		const customStart = url.searchParams.get('start');
		const customEnd = url.searchParams.get('end');

		// Get date range
		const { start, end } = getDateRange(period, customStart, customEnd);

		// Fetch summary data
		const summaryResult = await query(
			`SELECT
				COUNT(*) as total_transaksi,
				COALESCE(SUM(total), 0) as total_penjualan,
				COALESCE(AVG(total), 0) as rata_rata_transaksi
			FROM transaksi
			WHERE pelanggan_id = ?
				AND status = 'success'
				AND tanggal >= ? AND tanggal <= ?`,
			[pelangganId, start, end]
		);

		const summary = summaryResult[0];

		// Fetch transaction data
		const transactions = await query(
			`SELECT
				t.no_invoice,
				DATE(t.tanggal) as tanggal,
				t.waktu,
				t.nama_customer,
				t.total,
				t.metode_bayar,
				u.nama as kasir
			FROM transaksi t
			LEFT JOIN users u ON t.user_id = u.id
			WHERE t.pelanggan_id = ?
				AND t.status = 'success'
				AND t.tanggal >= ? AND t.tanggal <= ?
			ORDER BY t.tanggal DESC, t.waktu DESC`,
			[pelangganId, start, end]
		);

		// Prepare export data
		const exportOptions = {
			title: 'Laporan Penjualan',
			subtitle: user.nama_bisnis || 'Laporan Penjualan',
			date: { start, end },
			summary: [
				{ label: 'Total Transaksi', value: summary.total_transaksi, format: 'number' },
				{ label: 'Total Penjualan', value: summary.total_penjualan, format: 'currency' },
				{
					label: 'Rata-rata Transaksi',
					value: summary.rata_rata_transaksi,
					format: 'currency'
				}
			],
			tableData: transactions.map((t) => ({
				'No. Invoice': t.no_invoice,
				Tanggal: formatDate(t.tanggal),
				Waktu: t.waktu.substring(0, 5),
				Pelanggan: t.nama_customer || '-',
				Kasir: t.kasir || '-',
				Total: t.total,
				Metode: t.metode_bayar
			}))
		};

		// Generate file based on format
		let blob;
		let extension;
		let mimeType;

		if (format === 'excel') {
			blob = await generateExcel(null, exportOptions);
			extension = 'xlsx';
			mimeType =
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
		} else {
			blob = await generatePDF(null, exportOptions);
			extension = 'pdf';
			mimeType = 'application/pdf';
		}

		// Generate filename
		const filename = generateFilename('laporan_penjualan', extension);

		// Return file response
		return new Response(blob, {
			headers: {
				'Content-Type': mimeType,
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});

	} catch (error) {
		console.error('Export error:', error);

		// If it's a redirect/fail error, rethrow it
		if (error.status) {
			throw error;
		}

		// Otherwise return error response
		return new Response(
			JSON.stringify({
				success: false,
				error: error.message
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
}

/**
 * POST handler for export (can be used with form submission)
 */
export async function POST({ request, cookies }) {
	try {
		const body = await request.json();
		const { format = 'pdf', period = 'today', startDate, endDate } = body;

		// Redirect to GET with the same parameters
		const url = new URL(request.url);
		url.searchParams.set('format', format);
		url.searchParams.set('period', period);
		if (startDate) url.searchParams.set('start', startDate);
		if (endDate) url.searchParams.set('end', endDate);

		// Process the export using GET logic
		return GET({ url, cookies });

	} catch (error) {
		console.error('Export POST error:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: error.message
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
}
