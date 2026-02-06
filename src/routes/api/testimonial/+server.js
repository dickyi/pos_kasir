// ============================================
// API ENDPOINT: SUBMIT TESTIMONIAL
// File: src/routes/api/testimonial/+server.js
// Sesuai struktur tabel landing_testimonials
// ============================================

import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';

export async function POST({ request }) {
    try {
        const formData = await request.formData();
        
        // Ambil data dari form (sesuai struktur tabel)
        const name = formData.get('name')?.trim();
        const role = formData.get('role')?.trim() || null;
        const business_name = formData.get('business_name')?.trim();
        const business_type = formData.get('business_type')?.trim() || null;
        const email = formData.get('email')?.trim();
        const phone = formData.get('phone')?.trim() || null;
        const location = formData.get('location')?.trim() || null;
        const testimonial = formData.get('testimonial')?.trim();
        const rating = parseInt(formData.get('rating')) || 5;
        
        // Validasi
        if (!name || !business_name || !email || !testimonial) {
            return json({ 
                success: false, 
                message: 'Nama, nama usaha, email, dan testimoni wajib diisi' 
            }, { status: 400 });
        }
        
        if (testimonial.length < 20) {
            return json({ 
                success: false, 
                message: 'Testimoni minimal 20 karakter' 
            }, { status: 400 });
        }
        
        if (rating < 1 || rating > 5) {
            return json({ 
                success: false, 
                message: 'Rating harus antara 1-5' 
            }, { status: 400 });
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return json({ 
                success: false, 
                message: 'Format email tidak valid' 
            }, { status: 400 });
        }
        
        // Cek duplikat berdasarkan email (dalam 24 jam terakhir)
        const [existing] = await query(`
            SELECT id FROM landing_testimonials 
            WHERE email = ? AND submitted_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `, [email]);
        
        if (existing) {
            return json({ 
                success: false, 
                message: 'Anda sudah mengirimkan testimoni dalam 24 jam terakhir. Silakan coba lagi nanti.' 
            }, { status: 400 });
        }
        
        // Get max sort_order
        const [maxOrder] = await query(`
            SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM landing_testimonials
        `);
        
        // Insert testimonial dengan status pending
        // Kolom sesuai struktur tabel: name, role, business_name, business_type, email, phone, testimonial, rating, location, status, is_active, sort_order, submitted_at
        const result = await query(`
            INSERT INTO landing_testimonials 
            (name, role, business_name, business_type, email, phone, testimonial, rating, location, status, is_active, is_featured, sort_order, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 0, ?, NOW())
        `, [name, role, business_name, business_type, email, phone, testimonial, rating, location, maxOrder?.next_order || 1]);
        
        return json({ 
            success: true, 
            message: 'Testimoni berhasil dikirim! Menunggu persetujuan admin.',
            id: result.insertId
        });
        
    } catch (error) {
        console.error('Error submitting testimonial:', error);
        return json({ 
            success: false, 
            message: 'Terjadi kesalahan saat mengirim testimoni: ' + error.message 
        }, { status: 500 });
    }
}