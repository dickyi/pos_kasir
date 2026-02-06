// ============================================
// API: SEND SHARE LOGIN EMAIL
// File: src/routes/api/send-login-email/+server.js
// 
// Endpoint untuk mengirim email info login kasir
// POST /api/send-login-email
// 
// Request Body:
// {
//   namaKasir: string,
//   emailKasir: string,
//   namaToko: string,
//   kodeToko: string,
//   pin: string,
//   loginUrl: string,
//   namaOwner?: string
// }
// ============================================

import { json } from '@sveltejs/kit';
import { sendShareLoginEmail, checkEmailShareAvailability } from '$lib/email';

// ============================================
// POST - Kirim Email Share Login
// ============================================

export async function POST({ request, locals, cookies }) {
    try {
        // ================================
        // 1. Authentication Check
        // ================================
        
        // Debug: Log locals untuk troubleshooting
        console.log('[API send-login-email] Checking auth...');
        console.log('[API send-login-email] locals.session:', locals.session ? 'exists' : 'null');
        console.log('[API send-login-email] locals.user:', locals.user ? 'exists' : 'null');
        
        // Coba ambil session dari berbagai sumber
        const session = locals.session || locals.auth?.session;
        const user = session?.user || locals.user || locals.currentUser;
        
        if (!user) {
            console.log('[API send-login-email] ❌ No user found in session');
            return json({
                success: false,
                error: 'Unauthorized',
                message: 'Silakan login terlebih dahulu',
                debug: {
                    hasSession: !!locals.session,
                    hasUser: !!locals.user,
                    hasAuth: !!locals.auth
                }
            }, { status: 401 });
        }
        
        console.log('[API send-login-email] ✅ User found:', user.email || user.nama);
        
        // Optional: Check role (hanya owner/admin yang bisa share)
        const userRole = user.role || user.user_role || 'unknown';
        const allowedRoles = ['owner', 'admin', 'superadmin', 'manager', 'tenant'];
        
        if (!allowedRoles.includes(userRole)) {
            console.log('[API send-login-email] ❌ Role not allowed:', userRole);
            return json({
                success: false,
                error: 'Forbidden',
                message: 'Anda tidak memiliki akses untuk fitur ini',
                debug: { userRole }
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
        
        // ================================
        // 3. Validate Required Fields
        // ================================
        
        const { 
            namaKasir, 
            emailKasir, 
            namaToko, 
            kodeToko, 
            pin, 
            loginUrl,
            namaOwner 
        } = body;
        
        // Required fields validation
        const requiredFields = [
            { field: 'namaKasir', label: 'Nama kasir' },
            { field: 'emailKasir', label: 'Email kasir' },
            { field: 'namaToko', label: 'Nama toko' },
            { field: 'kodeToko', label: 'Kode toko' },
            { field: 'pin', label: 'PIN' },
            { field: 'loginUrl', label: 'Link login' }
        ];
        
        const missingFields = requiredFields
            .filter(f => !body[f.field])
            .map(f => f.label);
        
        if (missingFields.length > 0) {
            return json({
                success: false,
                error: 'Validation Error',
                message: `Field berikut wajib diisi: ${missingFields.join(', ')}`
            }, { status: 400 });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailKasir)) {
            return json({
                success: false,
                error: 'Validation Error',
                message: 'Format email tidak valid'
            }, { status: 400 });
        }
        
        // Validate PIN format (6 digits)
        if (!/^\d{6}$/.test(pin)) {
            return json({
                success: false,
                error: 'Validation Error',
                message: 'PIN harus 6 digit angka'
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
                message: emailAvailability.message,
                issues: emailAvailability.issues
            }, { status: 503 });
        }
        
        // ================================
        // 5. Send Email
        // ================================
        
        console.log(`[API] Sending share login email to: ${emailKasir}`);
        
        const result = await sendShareLoginEmail({
            namaKasir,
            emailKasir,
            namaToko,
            kodeToko,
            pin,
            loginUrl,
            namaOwner: namaOwner || user.nama || ''
        });
        
        // ================================
        // 6. Return Response
        // ================================
        
        if (result.success) {
            console.log(`[API] ✅ Email sent successfully to: ${emailKasir}`);
            
            return json({
                success: true,
                message: `Email berhasil dikirim ke ${emailKasir}`,
                data: {
                    recipient: emailKasir,
                    messageId: result.messageId
                }
            });
        } else {
            console.log(`[API] ❌ Email failed: ${result.message}`);
            
            return json({
                success: false,
                error: 'Send Failed',
                message: result.message || 'Gagal mengirim email',
                hint: result.hint
            }, { status: 500 });
        }
        
    } catch (error) {
        console.error('[API] Error in send-login-email:', error);
        
        return json({
            success: false,
            error: 'Server Error',
            message: 'Terjadi kesalahan server. Silakan coba lagi.',
            debug: error.message
        }, { status: 500 });
    }
}


// ============================================
// GET - Check Email Availability
// ============================================

export async function GET({ locals }) {
    try {
        // Authentication check
        const session = locals.session || locals.auth?.session;
        const user = session?.user || locals.user || locals.currentUser;
        
        if (!user) {
            return json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }
        
        // Check availability
        const availability = await checkEmailShareAvailability();
        
        return json({
            success: true,
            data: availability
        });
        
    } catch (error) {
        console.error('[API] Error checking email availability:', error);
        
        return json({
            success: false,
            error: 'Server Error',
            message: error.message
        }, { status: 500 });
    }
}