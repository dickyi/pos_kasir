/**
 * ============================================
 * API UPLOAD GAMBAR PRODUK - CLOUDINARY
 * File: src/routes/(tenant)/tenant/produk/upload/+server.js
 * ============================================
 * 
 * ✅ UPDATED: Menggunakan Cloudinary (bukan local filesystem)
 * 
 * Kenapa Cloudinary?
 * - Vercel = read-only filesystem, tidak bisa simpan file
 * - Cloudinary gratis 25GB + auto optimize gambar
 * - CDN global = gambar load cepat
 * - Auto resize, compress, format WebP
 * 
 * Setup:
 * 1. Daftar di https://cloudinary.com (gratis)
 * 2. Ambil Cloud Name, API Key, API Secret dari Dashboard
 * 3. Tambahkan ke .env / Vercel Environment Variables:
 *    CLOUDINARY_CLOUD_NAME=your_cloud_name
 *    CLOUDINARY_API_KEY=your_api_key
 *    CLOUDINARY_API_SECRET=your_api_secret
 * 
 * Endpoint: POST /tenant/produk/upload
 * Endpoint: DELETE /tenant/produk/upload
 */

import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';
import { getUserFromSession } from '$lib/auth.js';
import { 
    CLOUDINARY_CLOUD_NAME, 
    CLOUDINARY_API_KEY, 
    CLOUDINARY_API_SECRET 
} from '$env/static/private';

// ============================================
// CONFIGURATION
// ============================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (Cloudinary free limit)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const UPLOAD_FOLDER = 'poskasir/produk'; // Folder di Cloudinary

// ============================================
// HELPER: Upload ke Cloudinary via REST API
// (Tanpa SDK - lebih ringan untuk serverless)
// ============================================

/**
 * Generate SHA-1 signature untuk Cloudinary
 */
async function generateSignature(params, apiSecret) {
    // Sort params alphabetically dan buat string
    const sortedKeys = Object.keys(params).sort();
    const signatureString = sortedKeys
        .map(key => `${key}=${params[key]}`)
        .join('&') + apiSecret;
    
    // SHA-1 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Upload file ke Cloudinary
 * @param {File} file - File yang akan diupload
 * @param {string} folder - Folder tujuan di Cloudinary
 * @param {string} publicId - Custom public ID (opsional)
 * @returns {Promise<Object>} Cloudinary response
 */
async function uploadToCloudinary(file, folder, publicId = null) {
    const timestamp = Math.round(Date.now() / 1000);
    
    // Parameters yang perlu di-sign
    const signParams = {
        folder: folder,
        timestamp: timestamp,
        transformation: 'c_limit,w_1200,h_1200,q_auto,f_auto' // Auto optimize
    };
    
    if (publicId) {
        signParams.public_id = publicId;
    }
    
    // Generate signature
    const signature = await generateSignature(signParams, CLOUDINARY_API_SECRET);
    
    // Convert file ke base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    const dataUri = `data:${file.type};base64,${base64}`;
    
    // Build form data untuk Cloudinary API
    const formData = new FormData();
    formData.append('file', dataUri);
    formData.append('folder', folder);
    formData.append('timestamp', timestamp.toString());
    formData.append('transformation', 'c_limit,w_1200,h_1200,q_auto,f_auto');
    formData.append('signature', signature);
    formData.append('api_key', CLOUDINARY_API_KEY);
    
    if (publicId) {
        formData.append('public_id', publicId);
    }
    
    // Upload ke Cloudinary
    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
            method: 'POST',
            body: formData
        }
    );
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Cloudinary upload failed: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Delete file dari Cloudinary
 * @param {string} publicId - Public ID file yang akan dihapus
 * @returns {Promise<Object>} Cloudinary response
 */
async function deleteFromCloudinary(publicId) {
    const timestamp = Math.round(Date.now() / 1000);
    
    const signParams = {
        public_id: publicId,
        timestamp: timestamp
    };
    
    const signature = await generateSignature(signParams, CLOUDINARY_API_SECRET);
    
    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('api_key', CLOUDINARY_API_KEY);
    
    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
        {
            method: 'POST',
            body: formData
        }
    );
    
    return await response.json();
}

/**
 * Extract public_id dari Cloudinary URL
 * contoh: https://res.cloudinary.com/xxx/image/upload/v123/poskasir/produk/file.jpg
 * → poskasir/produk/file
 */
function extractPublicId(cloudinaryUrl) {
    if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
        return null;
    }
    
    try {
        const parts = cloudinaryUrl.split('/upload/');
        if (parts.length < 2) return null;
        
        let path = parts[1];
        // Remove version prefix (v12345/)
        path = path.replace(/^v\d+\//, '');
        // Remove file extension
        path = path.replace(/\.[^/.]+$/, '');
        
        return path;
    } catch (e) {
        return null;
    }
}

// ============================================
// POST - Upload gambar produk
// ============================================

export async function POST({ request, cookies }) {
    console.log('=== CLOUDINARY UPLOAD API CALLED ===');
    
    try {
        // Auth check
        const user = getUserFromSession(cookies);
        
        if (!user || !user.pelanggan_id) {
            return json({ success: false, error: 'Unauthorized - Silakan login ulang' }, { status: 401 });
        }

        // Check Cloudinary config
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
            console.error('Cloudinary not configured!');
            return json({ 
                success: false, 
                error: 'Cloud storage belum dikonfigurasi. Hubungi administrator.' 
            }, { status: 500 });
        }

        // Parse form data
        let formData;
        try {
            formData = await request.formData();
        } catch (e) {
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
                error: `Ukuran file (${(file.size / 1024 / 1024).toFixed(2)}MB) melebihi batas 10MB` 
            }, { status: 400 });
        }

        // Generate public ID unik
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const publicId = `${user.pelanggan_id}_${timestamp}_${randomStr}`;

        console.log('Uploading to Cloudinary...');

        // Upload ke Cloudinary
        const cloudinaryResult = await uploadToCloudinary(file, UPLOAD_FOLDER, publicId);
        
        console.log('Cloudinary upload success:', cloudinaryResult.secure_url);

        // URL gambar dari Cloudinary (sudah otomatis optimize)
        const imageUrl = cloudinaryResult.secure_url;

        // Jika ada produk_id, update database
        if (produkId) {
            try {
                const existing = await query(
                    'SELECT id, gambar FROM produk WHERE id = ? AND pelanggan_id = ?',
                    [produkId, user.pelanggan_id]
                );

                if (existing && existing.length > 0) {
                    // Hapus gambar lama dari Cloudinary (jika ada)
                    if (existing[0].gambar) {
                        const oldPublicId = extractPublicId(existing[0].gambar);
                        if (oldPublicId) {
                            try {
                                await deleteFromCloudinary(oldPublicId);
                                console.log('Old image deleted from Cloudinary');
                            } catch (e) {
                                console.log('Failed to delete old image (ignored):', e.message);
                            }
                        }
                    }
                    
                    // Update URL gambar baru di database
                    await query(
                        'UPDATE produk SET gambar = ?, updated_at = NOW() WHERE id = ?',
                        [imageUrl, produkId]
                    );
                    console.log('Database updated for produk:', produkId);
                }
            } catch (e) {
                console.error('Database update error:', e);
                // Gambar sudah terupload, hanya DB update gagal
            }
        }

        return json({
            success: true,
            message: 'Gambar berhasil diupload',
            data: {
                url: imageUrl,
                publicId: cloudinaryResult.public_id,
                fileName: file.name,
                size: file.size,
                type: file.type,
                width: cloudinaryResult.width,
                height: cloudinaryResult.height,
                format: cloudinaryResult.format
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        return json({ 
            success: false, 
            error: 'Gagal upload gambar: ' + (error.message || 'Unknown error')
        }, { status: 500 });
    }
}

// ============================================
// DELETE - Hapus gambar produk
// ============================================

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

        // Ambil URL gambar lama
        const existing = await query(
            'SELECT gambar FROM produk WHERE id = ? AND pelanggan_id = ?',
            [produk_id, user.pelanggan_id]
        );

        if (existing && existing.length > 0 && existing[0].gambar) {
            // Hapus dari Cloudinary
            const publicId = extractPublicId(existing[0].gambar);
            if (publicId) {
                try {
                    await deleteFromCloudinary(publicId);
                    console.log('Image deleted from Cloudinary:', publicId);
                } catch (e) {
                    console.log('Failed to delete from Cloudinary (ignored):', e.message);
                }
            }
        }

        // Update database
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