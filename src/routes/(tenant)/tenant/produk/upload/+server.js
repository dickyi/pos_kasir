/**
 * ============================================
 * API UPLOAD GAMBAR PRODUK
 * File: src/routes/(tenant)/tenant/produk/upload/+server.js
 * ============================================
 * 
 * Endpoint: POST /tenant/produk/upload
 */

import { json } from '@sveltejs/kit';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { query } from '$lib/db.js';
import { getUserFromSession } from '$lib/auth.js';

// Konfigurasi
const UPLOAD_DIR = 'static/uploads/produk';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * POST - Upload gambar produk
 */
export async function POST({ request, cookies }) {
    console.log('=== UPLOAD API CALLED ===');
    
    try {
        const user = getUserFromSession(cookies);
        
        if (!user || !user.pelanggan_id) {
            console.log('Upload failed: Unauthorized');
            return json({ success: false, error: 'Unauthorized - Silakan login ulang' }, { status: 401 });
        }

        console.log('User:', user.pelanggan_id);

        let formData;
        try {
            formData = await request.formData();
        } catch (e) {
            console.error('FormData parse error:', e);
            return json({ success: false, error: 'Gagal membaca data form' }, { status: 400 });
        }

        const file = formData.get('file');
        const produkId = formData.get('produk_id');

        console.log('File received:', file?.name, 'Size:', file?.size, 'Type:', file?.type);

        // Validasi file
        if (!file || !(file instanceof File) || file.size === 0) {
            return json({ success: false, error: 'File tidak ditemukan atau kosong' }, { status: 400 });
        }

        // Validasi tipe file
        if (!ALLOWED_TYPES.includes(file.type)) {
            return json({ 
                success: false, 
                error: `Tipe file "${file.type}" tidak didukung. Gunakan JPG, PNG, WebP, atau GIF` 
            }, { status: 400 });
        }

        // Validasi ukuran
        if (file.size > MAX_FILE_SIZE) {
            return json({ 
                success: false, 
                error: `Ukuran file (${(file.size / 1024 / 1024).toFixed(2)}MB) melebihi batas 100MB` 
            }, { status: 400 });
        }

        // Buat direktori jika belum ada
        const uploadPath = path.join(process.cwd(), UPLOAD_DIR);
        console.log('Upload path:', uploadPath);
        
        try {
            if (!existsSync(uploadPath)) {
                console.log('Creating upload directory...');
                await mkdir(uploadPath, { recursive: true });
            }
        } catch (e) {
            console.error('Failed to create directory:', e);
            return json({ 
                success: false, 
                error: 'Gagal membuat folder upload. Pastikan folder static/uploads/produk ada.' 
            }, { status: 500 });
        }

        // Generate nama file unik
        const ext = path.extname(file.name).toLowerCase() || '.jpg';
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileName = `${user.pelanggan_id}_${timestamp}_${randomStr}${ext}`;
        const filePath = path.join(uploadPath, fileName);

        console.log('Saving to:', filePath);

        // Convert file to buffer dan simpan
        try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            await writeFile(filePath, buffer);
            console.log('File saved successfully');
        } catch (e) {
            console.error('Failed to write file:', e);
            return json({ 
                success: false, 
                error: 'Gagal menyimpan file: ' + e.message 
            }, { status: 500 });
        }

        // URL untuk akses gambar
        const imageUrl = `/uploads/produk/${fileName}`;

        // Jika ada produk_id, update database
        if (produkId) {
            try {
                const existing = await query(
                    'SELECT id, gambar FROM produk WHERE id = ? AND pelanggan_id = ?',
                    [produkId, user.pelanggan_id]
                );

                if (existing && existing.length > 0) {
                    await query(
                        'UPDATE produk SET gambar = ?, updated_at = NOW() WHERE id = ?',
                        [imageUrl, produkId]
                    );
                    console.log('Database updated for produk:', produkId);
                }
            } catch (e) {
                console.error('Database update error:', e);
            }
        }

        return json({
            success: true,
            message: 'Gambar berhasil diupload',
            data: {
                url: imageUrl,
                fileName: fileName,
                size: file.size,
                type: file.type
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        return json({ 
            success: false, 
            error: 'Terjadi kesalahan: ' + (error.message || 'Unknown error')
        }, { status: 500 });
    }
}

/**
 * DELETE - Hapus gambar produk
 */
export async function DELETE({ request, cookies }) {
    try {
        const user = getUserFromSession(cookies);
        
        if (!user || !user.pelanggan_id) {
            return json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { produk_id } = await request.json();

        if (!produk_id) {
            return json({ success: false, error: 'Produk ID diperlukan' }, { status: 400 });
        }

        await query(
            'UPDATE produk SET gambar = NULL, updated_at = NOW() WHERE id = ? AND pelanggan_id = ?',
            [produk_id, user.pelanggan_id]
        );

        return json({
            success: true,
            message: 'Gambar berhasil dihapus'
        });

    } catch (error) {
        console.error('Delete image error:', error);
        return json({ 
            success: false, 
            error: 'Gagal menghapus gambar' 
        }, { status: 500 });
    }
}