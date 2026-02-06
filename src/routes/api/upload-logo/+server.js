/**
 * ============================================
 * API: Upload Logo Struk (FIXED)
 * ============================================
 * File: src/routes/api/upload-logo/+server.js
 * 
 * Endpoint untuk upload logo toko yang akan
 * ditampilkan di struk
 * ============================================
 */
import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';
import { getUserFromSession } from '$lib/auth.js';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Konfigurasi upload
const UPLOAD_DIR = 'static/uploads/logos';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

/**
 * POST: Upload logo baru
 */
export async function POST({ request, cookies }) {
    try {
        // Get user from session menggunakan helper function
        const user = getUserFromSession(cookies);
        
        if (!user) {
            return json({ success: false, message: 'Unauthorized - Silakan login ulang' }, { status: 401 });
        }

        if (!user.pelanggan_id) {
            return json({ success: false, message: 'Invalid session - pelanggan_id tidak ditemukan' }, { status: 401 });
        }

        const pelangganId = user.pelanggan_id;

        // Debug log
        console.log('Upload logo request from pelanggan_id:', pelangganId);

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('logo');

        if (!file || !(file instanceof File)) {
            return json({ success: false, message: 'File tidak ditemukan' }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return json({ 
                success: false, 
                message: 'Format file tidak didukung. Gunakan JPG, PNG, WebP, GIF, atau SVG' 
            }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return json({ 
                success: false, 
                message: 'Ukuran file terlalu besar. Maksimal 100MB' 
            }, { status: 400 });
        }

        // Create upload directory if not exists
        const uploadPath = path.join(process.cwd(), UPLOAD_DIR);
        if (!existsSync(uploadPath)) {
            await mkdir(uploadPath, { recursive: true });
        }

        // Generate unique filename
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        const filename = `logo_${pelangganId}_${Date.now()}.${ext}`;
        const filePath = path.join(uploadPath, filename);

        // Delete old logo if exists
        const oldSettings = await query(
            'SELECT struk_logo FROM pengaturan WHERE pelanggan_id = ?',
            [pelangganId]
        );

        if (oldSettings[0]?.struk_logo) {
            const oldPath = path.join(process.cwd(), 'static', oldSettings[0].struk_logo);
            if (existsSync(oldPath)) {
                try {
                    await unlink(oldPath);
                    console.log('Old logo deleted:', oldSettings[0].struk_logo);
                } catch (e) {
                    console.warn('Could not delete old logo:', e.message);
                }
            }
        }

        // Save new file
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        // URL path untuk akses dari browser
        const logoUrl = `/uploads/logos/${filename}`;

        // Update database
        const existing = await query(
            'SELECT id FROM pengaturan WHERE pelanggan_id = ?',
            [pelangganId]
        );

        if (existing.length > 0) {
            await query(
                'UPDATE pengaturan SET struk_logo = ?, updated_at = NOW() WHERE pelanggan_id = ?',
                [logoUrl, pelangganId]
            );
        } else {
            await query(
                'INSERT INTO pengaturan (pelanggan_id, struk_logo, created_at) VALUES (?, ?, NOW())',
                [pelangganId, logoUrl]
            );
        }

        console.log('Logo uploaded successfully:', logoUrl);

        return json({ 
            success: true, 
            message: 'Logo berhasil diupload',
            logoUrl 
        });

    } catch (error) {
        console.error('Upload logo error:', error);
        return json({ 
            success: false, 
            message: 'Gagal mengupload logo: ' + error.message 
        }, { status: 500 });
    }
}

/**
 * DELETE: Hapus logo
 */
export async function DELETE({ cookies }) {
    try {
        // Get user from session menggunakan helper function
        const user = getUserFromSession(cookies);
        
        if (!user || !user.pelanggan_id) {
            return json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const pelangganId = user.pelanggan_id;

        // Get current logo
        const settings = await query(
            'SELECT struk_logo FROM pengaturan WHERE pelanggan_id = ?',
            [pelangganId]
        );

        if (settings[0]?.struk_logo) {
            // Delete file
            const filePath = path.join(process.cwd(), 'static', settings[0].struk_logo);
            if (existsSync(filePath)) {
                await unlink(filePath);
            }

            // Update database
            await query(
                'UPDATE pengaturan SET struk_logo = NULL, updated_at = NOW() WHERE pelanggan_id = ?',
                [pelangganId]
            );
        }

        return json({ 
            success: true, 
            message: 'Logo berhasil dihapus' 
        });

    } catch (error) {
        console.error('Delete logo error:', error);
        return json({ 
            success: false, 
            message: 'Gagal menghapus logo' 
        }, { status: 500 });
    }
}