// ============================================
// PUBLIC LAYOUT SERVER - Load All Landing Page Data
// File: src/routes/(public)/+layout.server.js
// Version: 2.0 - Performance Optimized
// ============================================

import { query } from '$lib/db.js';

// ============================================
// [FIX] SIMPLE IN-MEMORY CACHE
// Cache data selama 5 menit untuk mengurangi load database
// ============================================
const cache = {
    data: null,
    timestamp: 0,
    TTL: 5 * 60 * 1000 // 5 menit dalam milliseconds
};

function isCacheValid() {
    return cache.data && (Date.now() - cache.timestamp) < cache.TTL;
}

function setCache(data) {
    cache.data = data;
    cache.timestamp = Date.now();
}

function getCache() {
    return cache.data;
}

// ============================================
// MAIN LOAD FUNCTION
// ============================================
export async function load() {
    try {
        // [FIX] Gunakan cache jika masih valid
        if (isCacheValid()) {
            return getCache();
        }
        
        // Load semua data secara parallel untuk performa
        const [
            settingsData,
            heroData,
            statsData,
            featuresData,
            pricingData,
            testimonialsData,
            ctaData,
            faqData,
            sectionsData
        ] = await Promise.all([
            loadSettings(),
            loadHero(),
            loadStats(),
            loadFeatures(),
            loadPricing(),
            loadTestimonials(),
            loadCTA(),
            loadFAQ(),
            loadSections()
        ]);

        const result = {
            settings: settingsData,
            hero: heroData,
            stats: statsData,
            features: featuresData,
            pricing: pricingData,
            testimonials: testimonialsData,
            cta: ctaData,
            faq: faqData,
            sections: sectionsData
        };
        
        // [FIX] Simpan ke cache
        setCache(result);
        
        return result;
    } catch (error) {
        console.error('[Layout Server] Error loading landing page data:', error.message);
        
        // Return default data jika error
        return getDefaultData();
    }
}

// ============================================
// LOAD FUNCTIONS
// ============================================

async function loadSettings() {
    try {
        const results = await query(`
            SELECT setting_key, setting_value, setting_type 
            FROM platform_settings
        `);
        
        const settings = {};
        results.forEach(row => {
            let value = row.setting_value;
            if (row.setting_type === 'boolean') {
                value = value === 'true' || value === '1';
            } else if (row.setting_type === 'number') {
                value = Number(value);
            } else if (row.setting_type === 'json') {
                try { value = JSON.parse(value); } catch (e) { /* keep string */ }
            }
            settings[row.setting_key] = value;
        });
        
        return settings;
    } catch (e) {
        console.error('[loadSettings] Error:', e.message);
        return getDefaultSettings();
    }
}

async function loadHero() {
    try {
        const results = await query(`
            SELECT * FROM landing_hero WHERE is_active = 1 LIMIT 1
        `);
        return results[0] || getDefaultHero();
    } catch (e) {
        console.error('[loadHero] Error:', e.message);
        return getDefaultHero();
    }
}

async function loadStats() {
    try {
        // Coba load dari view hybrid (jika ada)
        let results;
        
        try {
            results = await query(`
                SELECT 
                    id,
                    COALESCE(display_value, value) as value,
                    label,
                    icon,
                    sort_order,
                    is_active,
                    source_type,
                    raw_value
                FROM v_landing_stats_display 
                WHERE is_active = 1 
                ORDER BY sort_order ASC
            `);
        } catch (viewError) {
            // [FIX] Log error view dengan detail
            console.warn('[loadStats] View v_landing_stats_display not found, using fallback table. Error:', viewError.message);
            
            // Fallback ke tabel biasa
            results = await query(`
                SELECT 
                    id,
                    CASE 
                        WHEN source_type = 'auto' AND cached_value IS NOT NULL 
                        THEN CONCAT(COALESCE(prefix, ''), cached_value, COALESCE(suffix, ''))
                        WHEN manual_value IS NOT NULL
                        THEN CONCAT(COALESCE(prefix, ''), manual_value, COALESCE(suffix, ''))
                        ELSE value
                    END as value,
                    label,
                    icon,
                    sort_order,
                    is_active,
                    source_type
                FROM landing_stats 
                WHERE is_active = 1 
                ORDER BY sort_order ASC
            `);
        }
        
        return results.length > 0 ? results : getDefaultStats();
    } catch (e) {
        console.error('[loadStats] Error:', e.message);
        return getDefaultStats();
    }
}

async function loadFeatures() {
    try {
        const results = await query(`
            SELECT * FROM landing_features 
            WHERE is_active = 1 
            ORDER BY sort_order ASC
        `);
        return results.length > 0 ? results : getDefaultFeatures();
    } catch (e) {
        console.error('[loadFeatures] Error:', e.message);
        return getDefaultFeatures();
    }
}

// [FIX] Perbaikan N+1 Query - Gabungkan dengan LEFT JOIN
async function loadPricing() {
    try {
        // Single query dengan LEFT JOIN untuk menghindari N+1
        const results = await query(`
            SELECT 
                p.id,
                p.name,
                p.price,
                p.period,
                p.description,
                p.is_featured,
                p.badge,
                p.cta_text,
                p.cta_link,
                p.sort_order,
                pf.id as feature_id,
                pf.feature_text,
                pf.is_included,
                pf.sort_order as feature_sort_order
            FROM landing_pricing p
            LEFT JOIN landing_pricing_features pf ON p.id = pf.pricing_id
            WHERE p.is_active = 1
            ORDER BY p.sort_order ASC, pf.sort_order ASC
        `);
        
        if (results.length === 0) {
            return getDefaultPricing();
        }
        
        // Group features by plan
        const plansMap = new Map();
        
        for (const row of results) {
            if (!plansMap.has(row.id)) {
                plansMap.set(row.id, {
                    id: row.id,
                    name: row.name,
                    price: row.price,
                    period: row.period,
                    description: row.description,
                    is_featured: row.is_featured,
                    badge: row.badge,
                    cta_text: row.cta_text,
                    cta_link: row.cta_link,
                    sort_order: row.sort_order,
                    features: []
                });
            }
            
            // Add feature jika ada
            if (row.feature_id) {
                plansMap.get(row.id).features.push({
                    id: row.feature_id,
                    feature_text: row.feature_text,
                    is_included: row.is_included,
                    sort_order: row.feature_sort_order
                });
            }
        }
        
        return Array.from(plansMap.values());
    } catch (e) {
        console.error('[loadPricing] Error:', e.message);
        return getDefaultPricing();
    }
}

async function loadTestimonials() {
    try {
        const results = await query(`
            SELECT * FROM landing_testimonials 
            WHERE is_active = 1 
            ORDER BY is_featured DESC, sort_order ASC
            LIMIT 12
        `);
        return results.length > 0 ? results : getDefaultTestimonials();
    } catch (e) {
        console.error('[loadTestimonials] Error:', e.message);
        return getDefaultTestimonials();
    }
}

async function loadCTA() {
    try {
        const results = await query(`
            SELECT * FROM landing_cta 
            WHERE is_active = 1 AND section_name = 'main' 
            LIMIT 1
        `);
        return results[0] || getDefaultCTA();
    } catch (e) {
        console.error('[loadCTA] Error:', e.message);
        return getDefaultCTA();
    }
}

async function loadFAQ() {
    try {
        const results = await query(`
            SELECT * FROM landing_faq 
            WHERE is_active = 1 
            ORDER BY sort_order ASC
            LIMIT 10
        `);
        return results.length > 0 ? results : getDefaultFAQ();
    } catch (e) {
        console.error('[loadFAQ] Error:', e.message);
        return getDefaultFAQ();
    }
}

async function loadSections() {
    try {
        const results = await query(`
            SELECT section_key, section_name, is_visible, config 
            FROM landing_sections 
            ORDER BY sort_order ASC
        `);
        
        const sections = {};
        results.forEach(row => {
            let config = {};
            if (row.config) {
                try {
                    config = JSON.parse(row.config);
                } catch (e) {
                    config = {};
                }
            }
            sections[row.section_key] = {
                name: row.section_name,
                visible: row.is_visible === 1,
                config: config
            };
        });
        
        return Object.keys(sections).length > 0 ? sections : getDefaultSections();
    } catch (e) {
        console.error('[loadSections] Error:', e.message);
        return getDefaultSections();
    }
}

// ============================================
// DEFAULT DATA (Fallback jika database kosong/error)
// ============================================

function getDefaultData() {
    return {
        settings: getDefaultSettings(),
        hero: getDefaultHero(),
        stats: getDefaultStats(),
        features: getDefaultFeatures(),
        pricing: getDefaultPricing(),
        testimonials: getDefaultTestimonials(),
        cta: getDefaultCTA(),
        faq: getDefaultFAQ(),
        sections: getDefaultSections()
    };
}

function getDefaultSettings() {
    return {
        app_name: 'POSKasir',
        app_tagline: 'Aplikasi Kasir Gratis untuk UMKM',
        contact_email: 'support@poskasir.com',
        contact_phone: '0812-3456-7890',
        contact_whatsapp: '6281234567890',
        contact_address: 'Jakarta, Indonesia',
        social_facebook: '',
        social_instagram: '',
        social_twitter: '',
        seo_title: 'POSKasir - Aplikasi Kasir Gratis untuk UMKM Indonesia',
        seo_description: 'Aplikasi Point of Sale GRATIS untuk UMKM Indonesia.',
        seo_keywords: 'pos, kasir, umkm, gratis, indonesia'
    };
}

function getDefaultHero() {
    return {
        badge_text: 'Gratis Selamanya',
        badge_icon: 'Gift',
        title_line1: 'Kelola Bisnis',
        title_line2: 'Lebih Mudah',
        description: 'Aplikasi kasir modern <strong>GRATIS</strong> untuk UMKM Indonesia. Catat transaksi, kelola stok, dan pantau laporan dalam satu platform tanpa biaya apapun.',
        cta_primary_text: 'Daftar Gratis Sekarang',
        cta_primary_link: '/register',
        cta_secondary_text: 'Lihat Demo',
        cta_secondary_link: '#fitur',
        trust_text: 'Dipercaya ribuan UMKM di Indonesia',
        rating: '4.9',
        review_count: '500+',
        show_free_badge: true,
        free_badge_text: 'Tidak ada biaya tersembunyi • Gratis selamanya!'
    };
}

function getDefaultStats() {
    return [
        { value: '10K+', label: 'UMKM Aktif', icon: 'Users' },
        { value: '1M+', label: 'Transaksi/Bulan', icon: 'ShoppingCart' },
        { value: '50M+', label: 'Nilai Transaksi', icon: 'DollarSign' },
        { value: '99.9%', label: 'Uptime', icon: 'Server' }
    ];
}

function getDefaultFeatures() {
    return [
        { icon: 'Zap', title: 'Transaksi Cepat', description: 'Proses penjualan dalam hitungan detik dengan interface yang simpel dan mudah digunakan.', badge: 'Gratis' },
        { icon: 'Package', title: 'Manajemen Stok', description: 'Pantau stok real-time dengan notifikasi otomatis saat barang menipis.', badge: 'Gratis' },
        { icon: 'BarChart3', title: 'Laporan Lengkap', description: 'Laporan harian hingga bulanan dengan export ke Excel dan PDF.', badge: 'Gratis' },
        { icon: 'Users', title: 'Multi Kasir', description: 'Dukung banyak kasir dengan tracking performa masing-masing.', badge: 'Gratis' },
        { icon: 'Tags', title: 'Kategori Produk', description: 'Kelompokkan produk untuk pencarian yang lebih cepat dan terorganisir.', badge: 'Gratis' },
        { icon: 'Smartphone', title: 'Mobile Friendly', description: 'Akses dari mana saja melalui tablet atau smartphone.', badge: 'Gratis' },
        { icon: 'CreditCard', title: 'Multi Pembayaran', description: 'Terima berbagai metode pembayaran: tunai, QRIS, transfer bank.', badge: 'Gratis' },
        { icon: 'Shield', title: 'Aman & Terpercaya', description: 'Data tersimpan aman dengan backup otomatis setiap hari.', badge: 'Gratis' }
    ];
}

function getDefaultPricing() {
    return [{
        name: 'Gratis Selamanya',
        price: 0,
        period: 'selamanya',
        description: 'Untuk semua UMKM Indonesia',
        is_featured: true,
        badge: '100% GRATIS',
        cta_text: 'Daftar Gratis Sekarang',
        cta_link: '/register',
        features: [
            { feature_text: 'Unlimited Outlet', is_included: true },
            { feature_text: 'Unlimited Produk', is_included: true },
            { feature_text: 'Unlimited User/Kasir', is_included: true },
            { feature_text: 'Laporan Lengkap', is_included: true },
            { feature_text: 'Export Excel & PDF', is_included: true },
            { feature_text: 'Multi Metode Pembayaran', is_included: true },
            { feature_text: 'Manajemen Stok', is_included: true },
            { feature_text: 'Kategori & Merk', is_included: true },
            { feature_text: 'Backup Data Otomatis', is_included: true },
            { feature_text: 'WhatsApp Support', is_included: true }
        ]
    }];
}

function getDefaultTestimonials() {
    return [
        { 
            name: 'Budi Santoso', 
            business_name: 'Toko Sembako Makmur', 
            business_type: 'Retail',
            testimonial: 'Sejak pakai POSKasir GRATIS, omzet naik 30%! Pencatatan stok jadi rapi dan tidak ada barang yang terlewat. Sangat recommended!', 
            rating: 5, 
            location: 'Jakarta',
            is_featured: true,
            is_active: true
        },
        { 
            name: 'Siti Aminah', 
            business_name: 'Warung Makan Sederhana', 
            business_type: 'F&B',
            testimonial: 'Mudah banget dipakai dan GRATIS! Karyawan baru langsung bisa operasikan dalam 10 menit. Laporan hariannya sangat membantu.', 
            rating: 5, 
            location: 'Bandung',
            is_featured: true,
            is_active: true
        },
        { 
            name: 'Ahmad Hidayat', 
            business_name: 'Apotek Sehat Selalu', 
            business_type: 'Apotek',
            testimonial: 'Fitur laporan sangat membantu analisis bisnis. Sekarang tahu produk mana yang paling laku. Terima kasih sudah gratis!', 
            rating: 5, 
            location: 'Surabaya',
            is_featured: true,
            is_active: true
        }
    ];
}

function getDefaultCTA() {
    return {
        badge_text: '100% GRATIS - Tanpa Biaya Apapun',
        title: 'Siap Memulai?',
        description: 'Bergabung dengan ribuan UMKM yang sudah sukses. Daftar sekarang dan nikmati SEMUA FITUR GRATIS selamanya!',
        primary_btn_text: 'Daftar Gratis Sekarang',
        primary_btn_link: '/register',
        secondary_btn_text: 'Hubungi Kami',
        secondary_btn_link: 'https://wa.me/6281234567890',
        show_trust_badges: true,
        trust_badge_1: 'Gratis selamanya',
        trust_badge_2: 'Tanpa kartu kredit',
        trust_badge_3: 'Setup 2 menit'
    };
}

function getDefaultFAQ() {
    return [
        { question: 'Apakah benar-benar gratis?', answer: 'Ya! POSKasir 100% gratis untuk semua fitur. Tidak ada biaya tersembunyi, tidak perlu kartu kredit, dan gratis selamanya.', category: 'pricing' },
        { question: 'Berapa lama proses pendaftaran?', answer: 'Hanya 2 menit! Isi form pendaftaran, verifikasi email, dan langsung bisa digunakan.', category: 'general' },
        { question: 'Apakah data saya aman?', answer: 'Sangat aman. Data Anda tersimpan di server yang terenkripsi dengan backup otomatis setiap hari.', category: 'security' },
        { question: 'Bisa diakses dari HP?', answer: 'Bisa! POSKasir bisa diakses dari smartphone, tablet, atau komputer dengan browser apapun.', category: 'feature' },
        { question: 'Bagaimana jika butuh bantuan?', answer: 'Tim support kami siap membantu via WhatsApp setiap hari kerja. Response time maksimal 1x24 jam.', category: 'support' },
        { question: 'Apakah bisa offline?', answer: 'Saat ini POSKasir membutuhkan koneksi internet. Namun fitur offline sedang dalam pengembangan.', category: 'feature' }
    ];
}

function getDefaultSections() {
    return {
        hero: { name: 'Hero Section', visible: true, config: { showBadge: true, showTrust: true, showPreview: true } },
        stats: { name: 'Statistik', visible: true, config: { backgroundColor: 'slate-900' } },
        features: { name: 'Fitur', visible: true, config: { columns: 3, showBadge: true } },
        pricing: { name: 'Pricing/Gratis', visible: true, config: { showComparison: false } },
        testimonials: { name: 'Testimoni', visible: true, config: { maxItems: 3, showRating: true } },
        faq: { name: 'FAQ', visible: true, config: { maxItems: 6 } },
        cta: { name: 'Call to Action', visible: true, config: { showTrustBadges: true } }
    };
}