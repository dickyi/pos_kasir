/**
 * ============================================
 * API UPLOAD GAMBAR PRODUK - CLOUDINARY (FIXED v2)
 * File: src/routes/(tenant)/tenant/produk/upload/+server.js
 * ============================================
 * 
 * ✅ FIX v2: Hapus gambar lama saat upload baru
 *    - Frontend kirim 'old_image_url' untuk dihapus dari Cloudinary
 *    - Tidak ada lagi penumpukan gambar
 *    - Support upload varian dengan folder terpisah
 *    - Support hapus gambar by URL (untuk varian)
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
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const UPLOAD_FOLDER = 'poskasir/produk';

// ============================================
// CLOUDINARY HELPERS
// ============================================

async function generateSignature(params, apiSecret) {
    const sortedKeys = Object.keys(params).sort();
    const signatureString = sortedKeys
        .map(key => `${key}=${params[key]}`)
        .join('&') + apiSecret;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function uploadToCloudinary(file, folder, publicId = null) {
    const timestamp = Math.round(Date.now() / 1000);
    
    const signParams = {
        folder: folder,
        timestamp: timestamp
    };
    
    if (publicId) {
        signParams.public_id = publicId;
    }
    
    const signature = await generateSignature(signParams, CLOUDINARY_API_SECRET);
    
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    const dataUri = `data:${file.type};base64,${base64}`;
    
    const formData = new FormData();
    formData.append('file', dataUri);
    formData.append('folder', folder);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('api_key', CLOUDINARY_API_KEY);
    
    if (publicId) {
        formData.append('public_id', publicId);
    }
    
    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
    );
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Cloudinary upload failed: ${response.status}`);
    }
    
    return await response.json();
}

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
        { method: 'POST', body: formData }
    );
    
    return await response.json();
}

function extractPublicId(cloudinaryUrl) {
    if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
        return null;
    }
    
    try {
        const parts = cloudinaryUrl.split('/upload/');
        if (parts.length < 2) return null;
        
        let path = parts[1];
        path = path.replace(/^v\d+\//, '');
        path = path.replace(/\.[^/.]+$/, '');
        
        return path;
    } catch (e) {
        return null;
    }
}

// ============================================
// POST - Upload gambar produk/varian
// ============================================
export async function POST({ request, cookies }) {
    console.log('=== CLOUDINARY UPLOAD API v2 ===');
    
    try {
        const user = getUserFromSession(cookies);
        
        if (!user || !user.pelanggan_id) {
            return json({ success: false, error: 'Unauthorized - Silakan login ulang' }, { status: 401 });
        }

        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
            return json({ 
                success: false, 
                error: 'Cloud storage belum dikonfigurasi. Hubungi administrator.' 
            }, { status: 500 });
        }

        let formData;
        try {
            formData = await request.formData();
        } catch (e) {
            return json({ success: false, error: 'Gagal membaca data form' }, { status: 400 });
        }

        const file = formData.get('file');
        const produkId = formData.get('produk_id');
        const oldImageUrl = formData.get('old_image_url'); // ✅ URL gambar lama untuk dihapus
        const uploadType = formData.get('type') || 'product'; // 'product' atau 'variant'

        console.log('File:', file?.name, 'Size:', file?.size, 'Type:', uploadType);
        console.log('Old image URL:', oldImageUrl || 'none');

        // Validasi file
        if (!file || !(file instanceof File) || file.size === 0) {
            return json({ success: false, error: 'File tidak ditemukan atau kosong' }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return json({ 
                success: false, 
                error: `Tipe file "${file.type}" tidak didukung. Gunakan JPG, PNG, WebP, atau GIF` 
            }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return json({ 
                success: false, 
                error: `Ukuran file (${(file.size / 1024 / 1024).toFixed(2)}MB) melebihi batas 10MB` 
            }, { status: 400 });
        }

        // ✅ FIX: Hapus gambar LAMA dari Cloudinary sebelum upload baru
        if (oldImageUrl) {
            const oldPublicId = extractPublicId(oldImageUrl);
            if (oldPublicId) {
                try {
                    const deleteResult = await deleteFromCloudinary(oldPublicId);
                    console.log('🗑️ Old image deleted:', oldPublicId, deleteResult.result);
                } catch (e) {
                    console.log('⚠️ Failed to delete old image (ignored):', e.message);
                }
            }
        }

        // Generate public ID unik dengan folder terpisah untuk varian
        const folder = uploadType === 'variant' 
            ? 'poskasir/produk/varian' 
            : UPLOAD_FOLDER;
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const publicId = `${user.pelanggan_id}_${timestamp}_${randomStr}`;

        // Upload ke Cloudinary
        const cloudinaryResult = await uploadToCloudinary(file, folder, publicId);
        console.log('✅ Upload success:', cloudinaryResult.secure_url);

        const imageUrl = cloudinaryResult.secure_url;

        // Jika ada produk_id DAN tipe = product, update database
        if (produkId && uploadType !== 'variant') {
            try {
                const existing = await query(
                    'SELECT id, gambar FROM produk WHERE id = ? AND pelanggan_id = ?',
                    [produkId, user.pelanggan_id]
                );

                if (existing && existing.length > 0) {
                    // Backup: hapus gambar lama dari DB jika frontend tidak kirim old_image_url
                    if (existing[0].gambar && !oldImageUrl) {
                        const dbOldPublicId = extractPublicId(existing[0].gambar);
                        if (dbOldPublicId) {
                            try {
                                await deleteFromCloudinary(dbOldPublicId);
                                console.log('🗑️ DB old image deleted:', dbOldPublicId);
                            } catch (e) {
                                console.log('⚠️ Failed to delete DB old image:', e.message);
                            }
                        }
                    }
                    
                    await query(
                        'UPDATE produk SET gambar = ?, updated_at = NOW() WHERE id = ?',
                        [imageUrl, produkId]
                    );
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
// DELETE - Hapus gambar produk/varian
// ============================================
export async function DELETE({ request, cookies }) {
    try {
        const user = getUserFromSession(cookies);
        
        if (!user || !user.pelanggan_id) {
            return json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { produk_id, image_url } = body;

        // ✅ Support hapus by URL langsung (untuk varian)
        if (image_url) {
            const publicId = extractPublicId(image_url);
            if (publicId) {
                try {
                    await deleteFromCloudinary(publicId);
                    console.log('🗑️ Image deleted by URL:', publicId);
                } catch (e) {
                    console.log('⚠️ Failed to delete by URL:', e.message);
                }
            }
        }

        // Jika ada produk_id, hapus gambar produk dari DB
        if (produk_id) {
            const existing = await query(
                'SELECT gambar FROM produk WHERE id = ? AND pelanggan_id = ?',
                [produk_id, user.pelanggan_id]
            );

            if (existing && existing.length > 0 && existing[0].gambar) {
                if (!image_url) { // Jangan hapus 2x jika sudah dihapus by URL
                    const publicId = extractPublicId(existing[0].gambar);
                    if (publicId) {
                        try {
                            await deleteFromCloudinary(publicId);
                            console.log('🗑️ Product image deleted:', publicId);
                        } catch (e) {
                            console.log('⚠️ Failed to delete:', e.message);
                        }
                    }
                }
            }

            await query(
                'UPDATE produk SET gambar = NULL, updated_at = NOW() WHERE id = ? AND pelanggan_id = ?',
                [produk_id, user.pelanggan_id]
            );
        }

        return json({ success: true, message: 'Gambar berhasil dihapus' });

    } catch (error) {
        console.error('Delete image error:', error);
        return json({ success: false, error: 'Gagal menghapus gambar' }, { status: 500 });
    }
}