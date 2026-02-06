/**
 * +page.server.js - Riwayat Shift (SYNCED)
 * =====================================================
 * Halaman untuk melihat history semua shift
 * 
 * SYNCED: Semua nama variabel sudah cocok dengan +page.svelte
 * 
 * Features:
 * - List semua shift (pagination)
 * - Filter by tanggal, kasir, status
 * =====================================================
 */

import { query } from '$lib/db';
import { error } from '@sveltejs/kit';

console.log('🟢 RIWAYAT SHIFT PAGE.SERVER.JS LOADED');

export async function load({ parent, url }) {
    console.log('🟢 RIWAYAT SHIFT LOAD FUNCTION CALLED');
    
    try {
        const { user, tenantUser } = await parent();
        
        if (!user || !user.pelanggan_id) {
            throw error(401, 'Unauthorized');
        }

        // Cek role - hanya owner dan admin
        const allowedRoles = ['owner', 'admin'];
        if (!allowedRoles.includes(tenantUser?.role?.toLowerCase())) {
            throw error(403, 'Anda tidak memiliki akses ke halaman ini');
        }
        
        const pelangganId = user.pelanggan_id;
        
        // =============================================
        // QUERY PARAMETERS
        // =============================================
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const offset = (page - 1) * limit;
        
        const filterTanggal = url.searchParams.get('tanggal') || '';
        const filterKasir = url.searchParams.get('kasir') || '';
        const filterStatus = url.searchParams.get('status') || '';
        
        console.log('🟢 Filter params:', { page, limit, filterTanggal, filterKasir, filterStatus });
        
        // =============================================
        // BUILD WHERE CLAUSE
        // =============================================
        let whereConditions = ['s.pelanggan_id = ?'];
        let queryParams = [pelangganId];
        
        if (filterTanggal) {
            whereConditions.push('DATE(s.tanggal) = ?');
            queryParams.push(filterTanggal);
        }
        
        if (filterKasir) {
            whereConditions.push('s.tenant_user_id = ?');
            queryParams.push(parseInt(filterKasir));
        }
        
        if (filterStatus) {
            whereConditions.push('s.status = ?');
            queryParams.push(filterStatus);
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        // =============================================
        // COUNT TOTAL
        // =============================================
        const countResult = await query(`
            SELECT COUNT(*) as total
            FROM shifts s
            WHERE ${whereClause}
        `, queryParams);
        
        const totalRecords = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / limit);
        
        console.log('🟢 Total records:', totalRecords);
        
        // =============================================
        // GET SHIFTS WITH PAGINATION
        // =============================================
        const shifts = await query(`
            SELECT 
                s.*,
                tu.nama as kasir_nama,
                tu.email as kasir_email,
                tu.role as kasir_role,
                cb.nama as closed_by_nama,
                TIMESTAMPDIFF(MINUTE, s.waktu_buka, COALESCE(s.waktu_tutup, NOW())) as durasi_menit
            FROM shifts s
            LEFT JOIN tenant_users tu ON s.tenant_user_id = tu.id
            LEFT JOIN tenant_users cb ON s.closed_by = cb.id
            WHERE ${whereClause}
            ORDER BY s.id DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, limit, offset]);
        
        console.log('🟢 Shifts loaded:', shifts.length);
        
        // =============================================
        // GET KASIR LIST (untuk filter dropdown)
        // =============================================
        const kasirList = await query(`
            SELECT DISTINCT
                tu.id,
                tu.nama,
                tu.email,
                tu.role
            FROM tenant_users tu
            INNER JOIN shifts s ON s.tenant_user_id = tu.id
            WHERE s.pelanggan_id = ?
            ORDER BY tu.nama ASC
        `, [pelangganId]);
        
        console.log('🟢 Kasir list loaded:', kasirList.length);
        
        // =============================================
        // RETURN DATA (sesuai +page.svelte)
        // =============================================
        return {
            shifts: shifts || [],
            kasirList: kasirList || [],
            pagination: {
                page,
                limit,
                totalRecords,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            filters: {
                tanggal: filterTanggal,
                kasir: filterKasir,
                status: filterStatus
            },
            currentUser: {
                id: tenantUser?.id,
                nama: tenantUser?.nama,
                role: tenantUser?.role
            }
        };
        
    } catch (err) {
        console.error('❌ Error loading riwayat shift:', err);
        
        if (err.status) {
            throw err;
        }
        
        throw error(500, {
            message: 'Gagal memuat riwayat shift',
            details: err.message
        });
    }
}