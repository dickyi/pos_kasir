/**
 * +server.js - Export API (SYNCED)
 * =====================================================
 * API endpoint untuk export laporan ke Excel
 * 
 * SYNCED: Menggunakan struktur yang sama dengan proyek
 * - Menggunakan pelanggan_id (bukan tenant_id)
 * =====================================================
 */

import { query } from '$lib/db';
import { json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/auth.js';

export async function GET({ cookies, url }) {
    // Check authentication
    const user = getUserFromSession(cookies);
    
    if (!user || !user.pelanggan_id) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get tenant user role
    let tenantRole = user.tenant_role;
    if (!tenantRole) {
        try {
            const tenantUsers = await query(
                `SELECT role FROM tenant_users 
                 WHERE pelanggan_id = ? AND email = ? AND status = 'aktif' LIMIT 1`,
                [user.pelanggan_id, user.email]
            );
            tenantRole = tenantUsers[0]?.role || 'owner';
        } catch (e) {
            tenantRole = 'owner';
        }
    }
    
    // Only owner and admin can access
    if (!['owner', 'admin'].includes(tenantRole?.toLowerCase())) {
        return json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const pelangganId = user.pelanggan_id;
    
    // Get parameters
    const type = url.searchParams.get('type') || 'performa';
    const periode = url.searchParams.get('periode') || 'bulan_ini';
    const startDate = url.searchParams.get('start');
    const endDate = url.searchParams.get('end');
    
    // Calculate date range
    const today = new Date();
    let dateFrom, dateTo;
    
    switch (periode) {
        case 'hari_ini':
            dateFrom = today.toISOString().split('T')[0];
            dateTo = dateFrom;
            break;
        case 'minggu_ini':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            dateFrom = weekStart.toISOString().split('T')[0];
            dateTo = today.toISOString().split('T')[0];
            break;
        case 'bulan_ini':
            dateFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
            dateTo = today.toISOString().split('T')[0];
            break;
        case 'bulan_lalu':
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            dateFrom = lastMonth.toISOString().split('T')[0];
            dateTo = lastMonthEnd.toISOString().split('T')[0];
            break;
        case 'custom':
            dateFrom = startDate || today.toISOString().split('T')[0];
            dateTo = endDate || today.toISOString().split('T')[0];
            break;
        default:
            dateFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
            dateTo = today.toISOString().split('T')[0];
    }
    
    try {
        // Dynamic import ExcelJS
        const ExcelJS = (await import('exceljs')).default;
        
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'POS Kasir';
        workbook.created = new Date();
        
        if (type === 'performa') {
            await generatePerformaExcel(workbook, pelangganId, dateFrom, dateTo);
        } else if (type === 'rekap-kas') {
            await generateRekapKasExcel(workbook, pelangganId, dateFrom, dateTo);
        } else if (type === 'riwayat') {
            await generateRiwayatExcel(workbook, pelangganId, dateFrom, dateTo);
        }
        
        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        
        // Return Excel file
        const filename = `Laporan_${type}_${dateFrom}_${dateTo}.xlsx`;
        
        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': buffer.length.toString()
            }
        });
        
    } catch (err) {
        console.error('❌ Error generating export:', err);
        return json({ error: 'Failed to generate export', details: err.message }, { status: 500 });
    }
}

// ========================================
// GENERATE PERFORMA KASIR EXCEL
// ========================================
async function generatePerformaExcel(workbook, pelangganId, dateFrom, dateTo) {
    const kasirData = await query(`
        SELECT 
            tu.nama as nama_kasir,
            tu.email,
            tu.role,
            COUNT(DISTINCT s.id) as total_shift,
            COALESCE(SUM(s.total_transaksi), 0) as total_transaksi,
            COALESCE(SUM(s.total_penjualan_bersih), 0) as total_penjualan,
            COALESCE(AVG(CASE WHEN s.total_transaksi > 0 THEN s.total_penjualan_bersih / s.total_transaksi ELSE 0 END), 0) as avg_per_transaksi,
            COALESCE(SUM(CASE WHEN s.status = 'closed' THEN s.selisih_kas ELSE 0 END), 0) as total_selisih
        FROM tenant_users tu
        LEFT JOIN shifts s ON s.tenant_user_id = tu.id 
            AND s.tanggal BETWEEN ? AND ?
            AND s.pelanggan_id = ?
        WHERE tu.pelanggan_id = ?
            AND tu.role IN ('kasir', 'admin', 'owner')
            AND tu.status = 'aktif'
        GROUP BY tu.id, tu.nama, tu.email, tu.role
        HAVING total_shift > 0
        ORDER BY total_penjualan DESC
    `, [dateFrom, dateTo, pelangganId, pelangganId]);
    
    const sheet = workbook.addWorksheet('Performa Kasir');
    
    // Title
    sheet.mergeCells('A1:H1');
    sheet.getCell('A1').value = 'LAPORAN PERFORMA KASIR';
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    
    // Period
    sheet.mergeCells('A2:H2');
    sheet.getCell('A2').value = `Periode: ${dateFrom} s/d ${dateTo}`;
    sheet.getCell('A2').alignment = { horizontal: 'center' };
    
    // Empty row
    sheet.addRow([]);
    
    // Headers
    const headers = ['No', 'Nama Kasir', 'Role', 'Total Shift', 'Total Transaksi', 'Total Penjualan', 'Avg/Transaksi', 'Total Selisih'];
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });
    
    // Data rows
    kasirData.forEach((row, index) => {
        const dataRow = sheet.addRow([
            index + 1,
            row.nama_kasir,
            row.role,
            row.total_shift,
            row.total_transaksi,
            row.total_penjualan,
            Math.round(row.avg_per_transaksi),
            row.total_selisih
        ]);
        
        dataRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });
    
    // Format columns
    sheet.getColumn(6).numFmt = '#,##0';
    sheet.getColumn(7).numFmt = '#,##0';
    sheet.getColumn(8).numFmt = '#,##0';
    
    // Auto width
    sheet.columns.forEach((column, i) => {
        column.width = i === 1 ? 25 : 15;
    });
}

// ========================================
// GENERATE REKAP KAS EXCEL
// ========================================
async function generateRekapKasExcel(workbook, pelangganId, dateFrom, dateTo) {
    const shiftData = await query(`
        SELECT 
            s.id,
            s.tanggal,
            TIME(s.waktu_buka) as jam_buka,
            TIME(s.waktu_tutup) as jam_tutup,
            s.modal_awal,
            s.kas_akhir_sistem,
            s.kas_akhir_aktual,
            s.selisih_kas as selisih,
            s.status,
            tu.nama as kasir_nama
        FROM shifts s
        LEFT JOIN tenant_users tu ON s.tenant_user_id = tu.id
        WHERE s.pelanggan_id = ?
            AND s.tanggal BETWEEN ? AND ?
        ORDER BY s.tanggal DESC, s.waktu_buka DESC
    `, [pelangganId, dateFrom, dateTo]);
    
    const sheet = workbook.addWorksheet('Rekap Kas');
    
    // Title
    sheet.mergeCells('A1:I1');
    sheet.getCell('A1').value = 'LAPORAN REKAP KAS';
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    
    // Period
    sheet.mergeCells('A2:I2');
    sheet.getCell('A2').value = `Periode: ${dateFrom} s/d ${dateTo}`;
    sheet.getCell('A2').alignment = { horizontal: 'center' };
    
    // Empty row
    sheet.addRow([]);
    
    // Headers
    const headers = ['No', 'Tanggal', 'Jam Buka', 'Jam Tutup', 'Kasir', 'Modal', 'Kas Sistem', 'Kas Aktual', 'Selisih'];
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });
    
    // Data rows
    let totalModal = 0;
    let totalSistem = 0;
    let totalAktual = 0;
    let totalSelisih = 0;
    
    shiftData.forEach((row, index) => {
        const dataRow = sheet.addRow([
            index + 1,
            row.tanggal,
            row.jam_buka || '-',
            row.jam_tutup || '-',
            row.kasir_nama,
            row.modal_awal || 0,
            row.kas_akhir_sistem || 0,
            row.kas_akhir_aktual || 0,
            row.selisih || 0
        ]);
        
        // Color selisih
        const selisihCell = dataRow.getCell(9);
        if (row.selisih < 0) {
            selisihCell.font = { color: { argb: 'FFDC2626' } };
        } else if (row.selisih > 0) {
            selisihCell.font = { color: { argb: 'FF2563EB' } };
        }
        
        dataRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        
        totalModal += row.modal_awal || 0;
        totalSistem += row.kas_akhir_sistem || 0;
        totalAktual += row.kas_akhir_aktual || 0;
        totalSelisih += row.selisih || 0;
    });
    
    // Total row
    const totalRow = sheet.addRow(['', '', '', '', 'TOTAL', totalModal, totalSistem, totalAktual, totalSelisih]);
    totalRow.eachCell((cell, colNumber) => {
        if (colNumber >= 5) {
            cell.font = { bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        }
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });
    
    // Format columns
    sheet.getColumn(6).numFmt = '#,##0';
    sheet.getColumn(7).numFmt = '#,##0';
    sheet.getColumn(8).numFmt = '#,##0';
    sheet.getColumn(9).numFmt = '#,##0';
    
    // Auto width
    sheet.columns.forEach((column) => {
        column.width = 15;
    });
}

// ========================================
// GENERATE RIWAYAT SHIFT EXCEL
// ========================================
async function generateRiwayatExcel(workbook, pelangganId, dateFrom, dateTo) {
    const shiftData = await query(`
        SELECT 
            s.id,
            s.tanggal,
            TIME(s.waktu_buka) as jam_buka,
            TIME(s.waktu_tutup) as jam_tutup,
            s.status,
            s.modal_awal,
            s.kas_akhir_aktual,
            s.total_transaksi,
            s.total_penjualan_bersih as total_penjualan,
            tu.nama as kasir_nama,
            tu.role as kasir_role
        FROM shifts s
        LEFT JOIN tenant_users tu ON s.tenant_user_id = tu.id
        WHERE s.pelanggan_id = ?
            AND s.tanggal BETWEEN ? AND ?
        ORDER BY s.tanggal DESC, s.waktu_buka DESC
    `, [pelangganId, dateFrom, dateTo]);
    
    const sheet = workbook.addWorksheet('Riwayat Shift');
    
    // Title
    sheet.mergeCells('A1:J1');
    sheet.getCell('A1').value = 'LAPORAN RIWAYAT SHIFT';
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    
    // Period
    sheet.mergeCells('A2:J2');
    sheet.getCell('A2').value = `Periode: ${dateFrom} s/d ${dateTo}`;
    sheet.getCell('A2').alignment = { horizontal: 'center' };
    
    // Empty row
    sheet.addRow([]);
    
    // Headers
    const headers = ['No', 'Tanggal', 'Jam Buka', 'Jam Tutup', 'Kasir', 'Status', 'Transaksi', 'Total Penjualan', 'Modal', 'Kas Akhir'];
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });
    
    // Data rows
    shiftData.forEach((row, index) => {
        const dataRow = sheet.addRow([
            index + 1,
            row.tanggal,
            row.jam_buka || '-',
            row.jam_tutup || '-',
            row.kasir_nama,
            row.status === 'open' ? 'Aktif' : 'Ditutup',
            row.total_transaksi || 0,
            row.total_penjualan || 0,
            row.modal_awal || 0,
            row.kas_akhir_aktual || '-'
        ]);
        
        dataRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });
    
    // Format columns
    sheet.getColumn(8).numFmt = '#,##0';
    sheet.getColumn(9).numFmt = '#,##0';
    sheet.getColumn(10).numFmt = '#,##0';
    
    // Auto width
    sheet.columns.forEach((column) => {
        column.width = 15;
    });
}