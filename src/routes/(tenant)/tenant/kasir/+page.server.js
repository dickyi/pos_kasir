// ============================================
// KASIR TENANT - SERVER (FIXED)
// File: src/routes/(tenant)/tenant/kasir/+page.server.js
// ============================================

import { query } from '$lib/db.js';
import { fail } from '@sveltejs/kit';

// ============================================
// LOAD FUNCTION - Ambil produk & kategori tenant
// ============================================
export async function load({ parent }) {
    // Ambil data user dari parent layout
    const parentData = await parent();
    const user = parentData?.user;
    
    // Debug log
    console.log('Kasir Load - User:', user);

    if (!user) {
        console.log('User not found');
        return {
            produk: [],
            kategori: [],
            error: 'User tidak valid'
        };
    }

    // Cari pelanggan_id dari user
    let pelangganId = user.pelanggan_id;

    // Jika pelanggan_id null, coba cari dari email
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

    console.log('Pelanggan ID:', pelangganId);

    if (!pelangganId) {
        return {
            produk: [],
            kategori: [],
            error: 'Tenant tidak terhubung dengan pelanggan'
        };
    }

    try {
        // ----------------------------------------
        // Load kategori milik tenant ini
        // ----------------------------------------
        const kategori = await query(`
            SELECT 
                id,
                kode_kategori,
                nama_kategori
            FROM kategori 
            WHERE pelanggan_id = ? 
            AND status = 'aktif'
            ORDER BY nama_kategori ASC
        `, [pelangganId]);

        console.log('Kategori found:', kategori.length);

        // ----------------------------------------
        // Load produk milik tenant ini
        // ----------------------------------------
        const produk = await query(`
            SELECT 
                p.id,
                p.kode_produk,
                p.nama_produk,
                p.kategori_id,
                p.harga_jual,
                p.stok,
                p.satuan,
                p.gambar,
                k.nama_kategori
            FROM produk p
            LEFT JOIN kategori k ON p.kategori_id = k.id
            WHERE p.pelanggan_id = ? 
            AND p.status = 'aktif'
            ORDER BY p.nama_produk ASC
        `, [pelangganId]);

        console.log('Produk found:', produk.length);

        return {
            produk: produk,
            kategori: kategori,
            pelangganId: pelangganId
        };

    } catch (error) {
        console.error('Error loading kasir data:', error);
        return {
            produk: [],
            kategori: [],
            error: 'Gagal memuat data: ' + error.message
        };
    }
}

// ============================================
// ACTIONS - Handle form submissions
// ============================================
export const actions = {

    // ----------------------------------------
    // SIMPAN TRANSAKSI
    // ----------------------------------------
    simpanTransaksi: async ({ request, parent }) => {
        const parentData = await parent();
        const user = parentData?.user;

        if (!user) {
            return fail(401, {
                success: false,
                message: 'Unauthorized - silakan login ulang'
            });
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
            return fail(400, {
                success: false,
                message: 'Tenant tidak terhubung dengan data pelanggan'
            });
        }

        try {
            const formData = await request.formData();
            
            // Ambil data dari form
            const cartData = formData.get('cart');
            const subtotal = parseFloat(formData.get('subtotal')) || 0;
            const diskon = parseFloat(formData.get('diskon')) || 0;
            const pajak = parseFloat(formData.get('pajak')) || 0;
            const total = parseFloat(formData.get('total')) || 0;
            const bayar = parseFloat(formData.get('bayar')) || 0;
            const kembalian = parseFloat(formData.get('kembalian')) || 0;
            const metodeBayar = formData.get('metode_bayar') || 'cash';
            const namaCustomer = formData.get('nama_customer') || null;
            const catatan = formData.get('catatan') || null;

            // Parse cart JSON
            let cart = [];
            try {
                cart = JSON.parse(cartData);
            } catch (e) {
                return fail(400, {
                    success: false,
                    message: 'Data keranjang tidak valid'
                });
            }

            // Validasi
            if (cart.length === 0) {
                return fail(400, {
                    success: false,
                    message: 'Keranjang kosong!'
                });
            }

            if (bayar < total) {
                return fail(400, {
                    success: false,
                    message: 'Pembayaran kurang!'
                });
            }

            // ----------------------------------------
            // Generate Invoice Number
            // ----------------------------------------
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const timeStr = today.toTimeString().slice(0, 8);

            // Cari nomor invoice terakhir hari ini
            const lastInvoice = await query(`
                SELECT no_invoice 
                FROM transaksi 
                WHERE pelanggan_id = ?
                AND tanggal = CURDATE()
                ORDER BY id DESC 
                LIMIT 1
            `, [pelangganId]);

            let invoiceNum = 1;
            if (lastInvoice.length > 0) {
                const lastNum = parseInt(lastInvoice[0].no_invoice.split('-').pop()) || 0;
                invoiceNum = lastNum + 1;
            }

            const noInvoice = `INV-${dateStr}-${String(invoiceNum).padStart(3, '0')}`;

            // ----------------------------------------
            // Cek stok sebelum simpan
            // ----------------------------------------
            for (const item of cart) {
                const stokResult = await query(
                    'SELECT stok FROM produk WHERE id = ? AND pelanggan_id = ?',
                    [item.id, pelangganId]
                );

                if (stokResult.length === 0) {
                    return fail(400, {
                        success: false,
                        message: `Produk ${item.nama_produk} tidak ditemukan`
                    });
                }

                if (stokResult[0].stok < item.qty) {
                    return fail(400, {
                        success: false,
                        message: `Stok ${item.nama_produk} tidak cukup! (Tersisa: ${stokResult[0].stok})`
                    });
                }
            }

            // ----------------------------------------
            // INSERT TRANSAKSI HEADER
            // ----------------------------------------
            const transaksiResult = await query(`
                INSERT INTO transaksi (
                    pelanggan_id,
                    no_invoice,
                    tanggal,
                    waktu,
                    subtotal,
                    diskon,
                    pajak,
                    total,
                    bayar,
                    kembalian,
                    metode_bayar,
                    user_id,
                    nama_customer,
                    catatan,
                    status
                ) VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success')
            `, [
                pelangganId,
                noInvoice,
                timeStr,
                subtotal,
                diskon,
                pajak,
                total,
                bayar,
                kembalian,
                metodeBayar,
                user.id,
                namaCustomer,
                catatan
            ]);

            const transaksiId = transaksiResult.insertId;

            // ----------------------------------------
            // INSERT TRANSAKSI DETAIL & UPDATE STOK
            // ----------------------------------------
            for (const item of cart) {
                // Insert detail
                await query(`
                    INSERT INTO transaksi_detail (
                        transaksi_id,
                        produk_id,
                        kode_produk,
                        nama_produk,
                        qty,
                        harga,
                        diskon_item,
                        subtotal
                    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
                `, [
                    transaksiId,
                    item.id,
                    item.kode_produk,
                    item.nama_produk,
                    item.qty,
                    item.harga_jual,
                    item.harga_jual * item.qty
                ]);

                // Update stok (kurangi)
                await query(`
                    UPDATE produk 
                    SET stok = stok - ? 
                    WHERE id = ? AND pelanggan_id = ?
                `, [item.qty, item.id, pelangganId]);
            }

            // ----------------------------------------
            // Return success dengan data untuk struk
            // ----------------------------------------
            return {
                success: true,
                message: 'Transaksi berhasil!',
                data: {
                    id: transaksiId,
                    no_invoice: noInvoice,
                    tanggal: today.toISOString().slice(0, 10),
                    waktu: timeStr,
                    items: cart,
                    subtotal: subtotal,
                    diskon: diskon,
                    pajak: pajak,
                    total: total,
                    bayar: bayar,
                    kembalian: kembalian,
                    metode_bayar: metodeBayar,
                    kasir: user.nama,
                    toko: user.nama_bisnis
                }
            };

        } catch (error) {
            console.error('Error saving transaction:', error);
            return fail(500, {
                success: false,
                message: 'Gagal menyimpan transaksi: ' + error.message
            });
        }
    }
};