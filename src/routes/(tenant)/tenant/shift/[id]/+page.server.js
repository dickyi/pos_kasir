/**
 * +page.server.js - Detail Shift (SYNCED)
 * =====================================================
 * Halaman detail untuk 1 shift tertentu
 * 
 * SYNCED: Semua nama variabel sudah cocok dengan +page.svelte
 * 
 * Data yang dikembalikan:
 * - shift (detail shift)
 * - shiftUsers (pengguna shift - untuk multi mode)
 * - transactions (daftar transaksi)
 * - kasMovements (pergerakan kas)
 * =====================================================
 */

import { query } from '$lib/db';
import { error } from '@sveltejs/kit';

console.log('🟢 SHIFT DETAIL PAGE.SERVER.JS LOADED');

export async function load({ parent, params }) {
    console.log('🟢 SHIFT DETAIL LOAD FUNCTION CALLED');
    console.log('🟢 Shift ID:', params.id);
    
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
        const shiftId = parseInt(params.id);
        
        if (!shiftId || isNaN(shiftId)) {
            throw error(400, 'Invalid shift ID');
        }
        
        // =============================================
        // 1. LOAD SHIFT DETAIL
        // =============================================
        const shiftResult = await query(`
            SELECT 
                s.*,
                tu.nama as kasir_nama,
                tu.email as kasir_email,
                tu.role as kasir_role,
                cb.nama as closed_by_nama,
                cb.role as closed_by_role,
                TIMESTAMPDIFF(MINUTE, s.waktu_buka, COALESCE(s.waktu_tutup, NOW())) as durasi_menit
            FROM shifts s
            LEFT JOIN tenant_users tu ON s.tenant_user_id = tu.id
            LEFT JOIN tenant_users cb ON s.closed_by = cb.id
            WHERE s.id = ? AND s.pelanggan_id = ?
            LIMIT 1
        `, [shiftId, pelangganId]);
        
        if (!shiftResult || shiftResult.length === 0) {
            throw error(404, 'Shift tidak ditemukan');
        }
        
        const shift = shiftResult[0];
        
        // Hitung kas akhir sistem jika belum ada
        if (!shift.kas_akhir_sistem) {
            shift.kasAkhirSistemCalculated = 
                parseFloat(shift.modal_awal || 0) +
                parseFloat(shift.penjualan_tunai || 0) +
                parseFloat(shift.total_kas_masuk || 0) -
                parseFloat(shift.total_kas_keluar || 0);
        }
        
        // Hitung rata-rata transaksi
        if (shift.total_transaksi > 0) {
            shift.avgTransaksi = parseFloat(shift.total_penjualan_bersih || 0) / shift.total_transaksi;
        } else {
            shift.avgTransaksi = 0;
        }
        
        console.log('🟢 Shift loaded:', shift.no_shift);
        
        // =============================================
        // 2. LOAD SHIFT USERS (untuk multi-user mode)
        // Nama: shiftUsers (sesuai +page.svelte)
        // =============================================
        let shiftUsers = [];
        try {
            shiftUsers = await query(`
                SELECT 
                    su.*,
                    tu.nama,
                    tu.email,
                    tu.role
                FROM shift_users su
                LEFT JOIN tenant_users tu ON su.tenant_user_id = tu.id
                WHERE su.shift_id = ?
                ORDER BY su.joined_at ASC
            `, [shiftId]);
            console.log('🟢 Shift users loaded:', shiftUsers.length);
        } catch (err) {
            console.log('🟡 Tabel shift_users tidak ada atau error:', err.message);
        }
        
        // =============================================
        // 3. LOAD TRANSAKSI DI SHIFT INI
        // Nama: transactions (sesuai +page.svelte)
        // =============================================
        let transactions = [];
        try {
            // Coba dengan struktur tabel transaksi yang umum
            transactions = await query(`
                SELECT 
                    t.id,
                    COALESCE(t.no_invoice, t.kode_transaksi, t.no_transaksi) as no_transaksi,
                    COALESCE(t.created_at, t.tanggal) as waktu_transaksi,
                    COALESCE(t.grand_total, t.total) as total_bayar,
                    COALESCE(t.metode_bayar, t.metode_pembayaran) as metode_pembayaran,
                    t.status,
                    (SELECT COUNT(*) FROM transaksi_item ti WHERE ti.transaksi_id = t.id) as total_item,
                    tu.nama as kasir_nama
                FROM transaksi t
                LEFT JOIN tenant_users tu ON COALESCE(t.tenant_user_id, t.kasir_id) = tu.id
                WHERE t.shift_id = ? AND t.pelanggan_id = ?
                ORDER BY t.created_at DESC
            `, [shiftId, pelangganId]);
            console.log('🟢 Transactions loaded:', transactions.length);
        } catch (err) {
            console.log('🟡 Error loading transactions:', err.message);
            // Coba query alternatif
            try {
                transactions = await query(`
                    SELECT 
                        t.*,
                        tu.nama as kasir_nama
                    FROM transaksi t
                    LEFT JOIN tenant_users tu ON t.tenant_user_id = tu.id
                    WHERE t.shift_id = ? AND t.pelanggan_id = ?
                    ORDER BY t.id DESC
                `, [shiftId, pelangganId]);
                console.log('🟢 Transactions loaded (alt query):', transactions.length);
            } catch (err2) {
                console.log('🟡 Tabel transaksi tidak ada atau struktur berbeda');
            }
        }
        
        // =============================================
        // 4. LOAD KAS MOVEMENTS
        // Nama: kasMovements (sesuai +page.svelte)
        // =============================================
        let kasMovements = [];
        try {
            // Coba beberapa nama tabel yang mungkin
            kasMovements = await query(`
                SELECT 
                    k.*,
                    tu.nama as user_nama
                FROM kas_masuk_keluar k
                LEFT JOIN tenant_users tu ON k.user_id = tu.id
                WHERE k.shift_id = ? AND k.pelanggan_id = ?
                ORDER BY k.created_at DESC
            `, [shiftId, pelangganId]);
            console.log('🟢 Kas movements loaded:', kasMovements.length);
        } catch (err) {
            console.log('🟡 Tabel kas_masuk_keluar tidak ada, mencoba kas_movement...');
            try {
                kasMovements = await query(`
                    SELECT 
                        k.*,
                        tu.nama as user_nama
                    FROM kas_movement k
                    LEFT JOIN tenant_users tu ON k.user_id = tu.id
                    WHERE k.shift_id = ? AND k.pelanggan_id = ?
                    ORDER BY k.created_at DESC
                `, [shiftId, pelangganId]);
                console.log('🟢 Kas movements loaded (alt table):', kasMovements.length);
            } catch (err2) {
                console.log('🟡 Tabel kas_movement juga tidak ada');
            }
        }
        
        // =============================================
        // RETURN DATA (sesuai dengan +page.svelte)
        // =============================================
        return {
            shift,
            shiftUsers: shiftUsers || [],
            transactions: transactions || [],
            kasMovements: kasMovements || [],
            currentUser: {
                id: tenantUser?.id,
                nama: tenantUser?.nama,
                role: tenantUser?.role
            }
        };
        
    } catch (err) {
        console.error('❌ Error loading shift detail:', err);
        
        if (err.status === 404 || err.status === 400 || err.status === 401 || err.status === 403) {
            throw err;
        }
        
        throw error(500, {
            message: 'Gagal memuat detail shift',
            details: err.message
        });
    }
}