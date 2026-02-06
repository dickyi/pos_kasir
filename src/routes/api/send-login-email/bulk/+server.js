// ============================================
// API: BULK SEND SHARE LOGIN EMAIL
// File: src/routes/api/send-login-email/bulk/+server.js
// 
// Endpoint untuk mengirim email ke banyak kasir sekaligus
// POST /api/send-login-email/bulk
// 
// Request Body:
// {
//   kasirList: Array<{
//     nama: string,
//     email: string,
//     pin: string
//   }>,
//   namaToko: string,
//   kodeToko: string,
//   loginUrl: string
// }
// ============================================

import { json } from '@sveltejs/kit';
import { sendBulkShareLoginEmail, checkEmailShareAvailability } from '$lib/email';

// ============================================
// POST - Bulk Send Email Share Login
// ============================================

export async function POST({ request, locals }) {
    try {
        // ================================
        // 1. Authentication Check
        // ================================
        
        const session = locals.session;
        if (!session || !session.user) {
            return json({
                success: false,
                error: 'Unauthorized',
                message: 'Silakan login terlebih dahulu'
            }, { status: 401 });
        }
        
        // Check role
        const allowedRoles = ['owner', 'admin', 'superadmin'];
        if (!allowedRoles.includes(session.user.role)) {
            return json({
                success: false,
                error: 'Forbidden',
                message: 'Anda tidak memiliki akses untuk fitur ini'
            }, { status: 403 });
        }
        
        // ================================
        // 2. Parse Request Body
        // ================================
        
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return json({
                success: false,
                error: 'Invalid JSON',
                message: 'Request body tidak valid'
            }, { status: 400 });
        }
        
        const { kasirList, namaToko, kodeToko, loginUrl } = body;
        
        // ================================
        // 3. Validate Request
        // ================================
        
        if (!Array.isArray(kasirList) || kasirList.length === 0) {
            return json({
                success: false,
                error: 'Validation Error',
                message: 'Daftar kasir tidak boleh kosong'
            }, { status: 400 });
        }
        
        if (!namaToko || !kodeToko || !loginUrl) {
            return json({
                success: false,
                error: 'Validation Error',
                message: 'Data toko tidak lengkap'
            }, { status: 400 });
        }
        
        // Limit bulk send to prevent abuse
        const MAX_BULK_RECIPIENTS = 50;
        if (kasirList.length > MAX_BULK_RECIPIENTS) {
            return json({
                success: false,
                error: 'Limit Exceeded',
                message: `Maksimal ${MAX_BULK_RECIPIENTS} kasir per pengiriman`
            }, { status: 400 });
        }
        
        // ================================
        // 4. Check Email Availability
        // ================================
        
        const emailAvailability = await checkEmailShareAvailability();
        if (!emailAvailability.available) {
            return json({
                success: false,
                error: 'Email Not Available',
                message: emailAvailability.message
            }, { status: 503 });
        }
        
        // ================================
        // 5. Send Bulk Emails
        // ================================
        
        console.log(`[API] Starting bulk send to ${kasirList.length} recipients`);
        
        const tokoData = {
            namaToko,
            kodeToko,
            loginUrl
        };
        
        const namaOwner = session.user.nama || '';
        
        const result = await sendBulkShareLoginEmail(kasirList, tokoData, namaOwner);
        
        // ================================
        // 6. Return Response
        // ================================
        
        console.log(`[API] Bulk send completed: ${result.success}/${result.total} successful`);
        
        return json({
            success: true,
            message: `${result.success} dari ${result.total} email berhasil dikirim`,
            data: {
                total: result.total,
                success: result.success,
                failed: result.failed,
                skipped: result.skipped,
                details: result.details
            }
        });
        
    } catch (error) {
        console.error('[API] Error in bulk send-login-email:', error);
        
        return json({
            success: false,
            error: 'Server Error',
            message: 'Terjadi kesalahan server. Silakan coba lagi.'
        }, { status: 500 });
    }
}