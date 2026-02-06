// ============================================
// EMAIL TEMPLATES - Professional Modern Design
// File: src/lib/email/emailTemplates.js
// 
// Desain email profesional untuk semua segmen:
// - UMKM Kecil (warung, toko kelontong)
// - UMKM Menengah (cafe, restoran, fashion)
// - Retail Besar (minimarket, supermarket)
// 
// Features:
// - Responsive design (mobile & desktop)
// - Email client compatible (Gmail, Outlook, Yahoo, dll)
// - Professional Modern aesthetic
// - Proper spacing & typography
// - Minimal emoji (hanya di tempat penting)
// 
// TEMPLATES:
// 1. getRegistrationSuccessEmail - Konfirmasi pendaftaran tenant
// 2. getNewTenantNotificationEmail - Notifikasi admin tenant baru
// 3. getApprovalEmail - Akun disetujui
// 4. getRejectionEmail - Akun ditolak/dinonaktifkan
// 5. getTestEmail - Test email SMTP
// 6. getShareLoginKasirEmail - Share info login kasir (NEW)
// 7. getPinNotificationEmail - Notifikasi PIN baru/reset (NEW)
// ============================================

// ============================================
// COLOR PALETTE - Professional Modern
// ============================================
const colors = {
    // Primary colors
    primary: '#4f46e5',      // Indigo - trustworthy, modern
    primaryDark: '#3730a3',
    primaryLight: '#e0e7ff',
    
    // Success colors
    success: '#059669',      // Emerald - positive, active
    successDark: '#047857',
    successLight: '#d1fae5',
    successBg: '#ecfdf5',
    
    // Warning colors
    warning: '#d97706',      // Amber - attention
    warningDark: '#b45309',
    warningLight: '#fef3c7',
    warningBg: '#fffbeb',
    
    // Danger colors
    danger: '#dc2626',       // Red - error, rejected
    dangerDark: '#b91c1c',
    dangerLight: '#fee2e2',
    dangerBg: '#fef2f2',
    
    // Info colors
    info: '#2563eb',         // Blue - informational
    infoDark: '#1d4ed8',
    infoLight: '#dbeafe',
    infoBg: '#eff6ff',
    
    // Neutral colors
    white: '#ffffff',
    gray50: '#f8fafc',
    gray100: '#f1f5f9',
    gray200: '#e2e8f0',
    gray300: '#cbd5e1',
    gray400: '#94a3b8',
    gray500: '#64748b',
    gray600: '#475569',
    gray700: '#334155',
    gray800: '#1e293b',
    gray900: '#0f172a',
};

// ============================================
// BASE STYLES - Email Client Compatible
// ============================================
const baseStyles = `
    /* Reset & Base */
    body, table, td, p, a, li { 
        -webkit-text-size-adjust: 100%; 
        -ms-text-size-adjust: 100%; 
    }
    body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
        line-height: 1.6; 
        color: ${colors.gray800}; 
        margin: 0; 
        padding: 0; 
        background-color: ${colors.gray100}; 
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    
    /* Wrapper */
    .email-wrapper { 
        width: 100%; 
        background-color: ${colors.gray100}; 
        padding: 40px 20px; 
    }
    
    /* Container */
    .email-container { 
        max-width: 600px; 
        margin: 0 auto; 
        background: ${colors.white}; 
        border-radius: 16px; 
        overflow: hidden; 
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); 
    }
    
    /* Header Styles */
    .email-header { 
        padding: 48px 40px; 
        text-align: center; 
    }
    .header-success { 
        background: linear-gradient(135deg, ${colors.success} 0%, ${colors.successDark} 100%); 
    }
    .header-warning { 
        background: linear-gradient(135deg, ${colors.warning} 0%, ${colors.warningDark} 100%); 
    }
    .header-danger { 
        background: linear-gradient(135deg, ${colors.danger} 0%, ${colors.dangerDark} 100%); 
    }
    .header-info { 
        background: linear-gradient(135deg, ${colors.info} 0%, ${colors.infoDark} 100%); 
    }
    .header-primary { 
        background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); 
    }
    
    /* Logo */
    .logo-container { margin-bottom: 24px; }
    .logo-text { 
        font-size: 28px; 
        font-weight: 700; 
        color: ${colors.white}; 
        letter-spacing: -0.5px; 
        margin: 0;
    }
    .logo-text span { font-weight: 400; opacity: 0.9; }
    
    /* Header Content */
    .header-title { 
        margin: 0 0 8px 0; 
        font-size: 26px; 
        font-weight: 700; 
        color: ${colors.white}; 
        letter-spacing: -0.3px;
    }
    .header-subtitle { 
        margin: 0; 
        font-size: 15px; 
        color: rgba(255,255,255,0.9); 
        font-weight: 400;
    }
    
    /* Content Area */
    .email-content { padding: 40px; }
    
    /* Greeting */
    .greeting { 
        font-size: 16px; 
        color: ${colors.gray600}; 
        margin: 0 0 20px 0; 
    }
    .greeting strong { color: ${colors.gray800}; font-weight: 600; }
    
    /* Message */
    .message { 
        font-size: 15px; 
        color: ${colors.gray600}; 
        margin: 0 0 28px 0; 
        line-height: 1.7; 
    }
    .message strong { color: ${colors.gray800}; font-weight: 600; }
    
    /* Status Badge */
    .status-badge { 
        display: inline-block; 
        padding: 8px 20px; 
        border-radius: 24px; 
        font-size: 12px; 
        font-weight: 700; 
        text-transform: uppercase; 
        letter-spacing: 1px; 
    }
    .badge-success { background: ${colors.successLight}; color: ${colors.successDark}; }
    .badge-warning { background: ${colors.warningLight}; color: ${colors.warningDark}; }
    .badge-danger { background: ${colors.dangerLight}; color: ${colors.dangerDark}; }
    .badge-info { background: ${colors.infoLight}; color: ${colors.infoDark}; }
    .badge-pending { background: ${colors.gray200}; color: ${colors.gray700}; }
    
    /* Info Card - Light */
    .info-card { 
        background: ${colors.gray50}; 
        border: 1px solid ${colors.gray200}; 
        border-radius: 12px; 
        padding: 24px; 
        margin: 28px 0; 
    }
    .info-card-header {
        text-align: center;
        padding-bottom: 20px;
        margin-bottom: 20px;
        border-bottom: 1px solid ${colors.gray200};
    }
    
    /* Info Card - Dark */
    .info-card-dark { 
        background: ${colors.gray800}; 
        border-radius: 12px; 
        padding: 28px; 
        margin: 28px 0; 
    }
    .info-card-dark-header {
        text-align: center;
        padding-bottom: 20px;
        margin-bottom: 20px;
        border-bottom: 1px solid ${colors.gray700};
        color: ${colors.gray400};
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.5px;
    }
    
    /* Info Table */
    .info-table { width: 100%; }
    .info-table tr { border-bottom: 1px solid ${colors.gray200}; }
    .info-table tr:last-child { border-bottom: none; }
    .info-table td { padding: 14px 0; vertical-align: top; }
    .info-label { 
        color: ${colors.gray500}; 
        font-size: 13px; 
        font-weight: 500;
        width: 140px;
    }
    .info-separator {
        color: ${colors.gray400};
        font-size: 13px;
        width: 20px;
        text-align: center;
    }
    .info-value { 
        color: ${colors.gray800}; 
        font-weight: 600; 
        font-size: 14px; 
    }
    
    /* Info Table Dark */
    .info-table-dark tr { border-bottom: 1px solid ${colors.gray700}; }
    .info-table-dark tr:last-child { border-bottom: none; }
    .info-label-dark { color: ${colors.gray400}; font-size: 13px; font-weight: 500; width: 140px; }
    .info-separator-dark { color: ${colors.gray600}; font-size: 13px; width: 20px; text-align: center; }
    .info-value-dark { color: ${colors.gray100}; font-weight: 600; font-size: 14px; }
    
    /* Kode Box */
    .kode-container {
        background: linear-gradient(135deg, ${colors.successBg} 0%, ${colors.successLight} 100%);
        border: 2px solid ${colors.success};
        border-radius: 12px;
        padding: 24px;
        margin: 28px 0;
        text-align: center;
    }
    .kode-label {
        color: ${colors.successDark};
        font-size: 13px;
        font-weight: 500;
        margin: 0 0 12px 0;
        letter-spacing: 0.5px;
    }
    .kode-box { 
        background: ${colors.gray800}; 
        color: ${colors.white}; 
        padding: 16px 32px; 
        border-radius: 8px; 
        display: inline-block; 
    }
    .kode-text { 
        font-size: 28px; 
        font-weight: 700; 
        letter-spacing: 4px; 
        font-family: 'SF Mono', 'Consolas', 'Monaco', monospace; 
        margin: 0;
    }
    .kode-hint {
        color: ${colors.successDark};
        font-size: 12px;
        margin: 12px 0 0 0;
    }
    
    /* CTA Button */
    .cta-container { text-align: center; margin: 32px 0; }
    .cta-button { 
        display: inline-block; 
        padding: 16px 36px; 
        border-radius: 8px; 
        text-decoration: none; 
        font-weight: 600; 
        font-size: 15px; 
        text-align: center;
        transition: all 0.2s ease;
    }
    .btn-success { 
        background: linear-gradient(135deg, ${colors.success} 0%, ${colors.successDark} 100%); 
        color: ${colors.white}; 
    }
    .btn-primary { 
        background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); 
        color: ${colors.white}; 
    }
    .btn-secondary { 
        background: ${colors.gray100}; 
        color: ${colors.gray700}; 
        border: 1px solid ${colors.gray300}; 
    }
    .btn-info {
        background: linear-gradient(135deg, ${colors.info} 0%, ${colors.infoDark} 100%); 
        color: ${colors.white}; 
    }
    
    /* Feature Section */
    .feature-section { margin: 32px 0; }
    .feature-title { 
        font-size: 16px; 
        font-weight: 600; 
        color: ${colors.gray800}; 
        margin: 0 0 20px 0;
        padding-bottom: 12px;
        border-bottom: 2px solid ${colors.gray200};
    }
    .feature-list { margin: 0; padding: 0; list-style: none; }
    .feature-item { 
        display: flex; 
        align-items: flex-start; 
        padding: 16px 0; 
        border-bottom: 1px solid ${colors.gray100}; 
    }
    .feature-item:last-child { border-bottom: none; }
    .feature-icon { 
        width: 44px; 
        height: 44px; 
        background: ${colors.gray100}; 
        border-radius: 10px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: 20px; 
        margin-right: 16px;
        flex-shrink: 0;
    }
    .feature-icon-success { background: ${colors.successLight}; }
    .feature-icon-primary { background: ${colors.primaryLight}; }
    .feature-icon-info { background: ${colors.infoLight}; }
    .feature-content { flex: 1; }
    .feature-name { 
        font-weight: 600; 
        color: ${colors.gray800}; 
        font-size: 14px; 
        margin: 0 0 4px 0; 
    }
    .feature-desc { 
        color: ${colors.gray500}; 
        font-size: 13px; 
        margin: 0;
        line-height: 1.5;
    }
    
    /* Steps Section */
    .steps-section { margin: 32px 0; }
    .steps-title {
        font-size: 16px; 
        font-weight: 600; 
        color: ${colors.gray800}; 
        margin: 0 0 20px 0;
        padding-bottom: 12px;
        border-bottom: 2px solid ${colors.gray200};
    }
    .step-item { 
        display: flex; 
        align-items: flex-start; 
        padding: 20px 0; 
        border-bottom: 1px solid ${colors.gray100};
    }
    .step-item:last-child { border-bottom: none; }
    .step-number { 
        width: 36px; 
        height: 36px; 
        background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); 
        color: ${colors.white}; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-weight: 700; 
        font-size: 14px; 
        margin-right: 16px;
        flex-shrink: 0;
    }
    .step-content { flex: 1; padding-top: 2px; }
    .step-name { 
        font-weight: 600; 
        color: ${colors.gray800}; 
        font-size: 15px; 
        margin: 0 0 4px 0; 
    }
    .step-desc { 
        color: ${colors.gray500}; 
        font-size: 13px; 
        margin: 0;
        line-height: 1.5;
    }
    
    /* Alert Box */
    .alert-box { 
        border-radius: 10px; 
        padding: 18px 20px; 
        margin: 24px 0; 
        display: flex; 
        align-items: flex-start; 
    }
    .alert-info { 
        background: ${colors.infoBg}; 
        border-left: 4px solid ${colors.info}; 
    }
    .alert-warning { 
        background: ${colors.warningBg}; 
        border-left: 4px solid ${colors.warning}; 
    }
    .alert-success { 
        background: ${colors.successBg}; 
        border-left: 4px solid ${colors.success}; 
    }
    .alert-danger {
        background: ${colors.dangerBg};
        border-left: 4px solid ${colors.danger};
    }
    .alert-icon { 
        font-size: 20px; 
        margin-right: 14px;
        flex-shrink: 0;
        line-height: 1;
    }
    .alert-content { flex: 1; }
    .alert-title { 
        font-weight: 600; 
        color: ${colors.gray800}; 
        font-size: 14px; 
        margin: 0 0 4px 0; 
    }
    .alert-text { 
        color: ${colors.gray600}; 
        font-size: 13px; 
        margin: 0;
        line-height: 1.5;
    }
    
    /* Highlight Box */
    .highlight-box {
        background: ${colors.warningLight};
        border: 1px solid ${colors.warning};
        border-radius: 8px;
        padding: 16px 20px;
        margin: 24px 0;
    }
    .highlight-text {
        margin: 0;
        color: ${colors.warningDark};
        font-size: 14px;
        line-height: 1.6;
    }
    .highlight-text strong { font-weight: 600; }
    
    /* Divider */
    .divider { 
        height: 1px; 
        background: ${colors.gray200}; 
        margin: 32px 0; 
    }
    
    /* Footer */
    .email-footer { 
        background: ${colors.gray800}; 
        padding: 36px 40px; 
    }
    .footer-brand {
        text-align: center;
        padding-bottom: 24px;
        margin-bottom: 24px;
        border-bottom: 1px solid ${colors.gray700};
    }
    .footer-logo { 
        font-size: 22px; 
        font-weight: 700; 
        color: ${colors.white}; 
        margin: 0 0 6px 0;
    }
    .footer-tagline { 
        color: ${colors.gray400}; 
        font-size: 13px; 
        margin: 0;
    }
    .footer-contact {
        text-align: center;
    }
    .footer-contact-title {
        color: ${colors.gray500};
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin: 0 0 16px 0;
    }
    .footer-contact-item { 
        color: ${colors.gray400}; 
        font-size: 13px; 
        margin: 8px 0;
        line-height: 1.5;
    }
    .footer-contact-item a { 
        color: ${colors.infoLight}; 
        text-decoration: none; 
    }
    .footer-contact-label {
        display: inline-block;
        width: 80px;
        text-align: right;
        margin-right: 8px;
        color: ${colors.gray500};
    }
    .footer-disclaimer { 
        color: ${colors.gray500}; 
        font-size: 11px; 
        margin: 24px 0 0 0; 
        padding-top: 24px;
        border-top: 1px solid ${colors.gray700};
        line-height: 1.6;
        text-align: center;
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
        .email-wrapper { padding: 20px 12px; }
        .email-header { padding: 36px 24px; }
        .email-content { padding: 28px 24px; }
        .email-footer { padding: 28px 24px; }
        .header-title { font-size: 22px; }
        .info-label, .info-label-dark { width: 100px; font-size: 12px; }
        .info-value, .info-value-dark { font-size: 13px; }
        .cta-button { padding: 14px 28px; font-size: 14px; }
        .kode-text { font-size: 24px; letter-spacing: 3px; }
        .step-item, .feature-item { padding: 14px 0; }
        .footer-contact-label { width: auto; text-align: left; display: block; margin-bottom: 4px; }
    }
`;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate logo HTML (text-based for compatibility)
 */
function getLogo(settings, variant = 'light') {
    const logoUrl = settings.app_logo || settings.system_logo_url;
    const appName = settings.app_name || settings.system_name || 'POSKasir';
    
    // Jika ada URL logo yang valid (bukan path lokal)
    if (logoUrl && logoUrl.startsWith('http')) {
        return `
            <div class="logo-container">
                <img src="${logoUrl}" alt="${appName}" style="max-height: 48px; width: auto;">
            </div>
        `;
    }
    
    // Default: Text logo
    const color = variant === 'light' ? colors.white : colors.gray800;
    return `
        <div class="logo-container">
            <p class="logo-text" style="color: ${color};">POS<span>Kasir</span></p>
        </div>
    `;
}

/**
 * Generate footer HTML
 */
function getFooter(settings) {
    const appName = settings.app_name || settings.system_name || 'POSKasir';
    const tagline = settings.app_tagline || settings.system_tagline || 'Aplikasi Kasir untuk UMKM Indonesia';
    const email = settings.contact_email || '';
    const phone = settings.contact_phone || '';
    const whatsapp = settings.contact_whatsapp || '';
    const address = settings.contact_address || '';
    
    return `
        <div class="email-footer">
            <div class="footer-brand">
                <p class="footer-logo">${appName}</p>
                <p class="footer-tagline">${tagline}</p>
            </div>
            
            <div class="footer-contact">
                <p class="footer-contact-title">Hubungi Kami</p>
                ${email ? `
                <p class="footer-contact-item">
                    <span class="footer-contact-label">Email</span>
                    <a href="mailto:${email}">${email}</a>
                </p>
                ` : ''}
                ${phone ? `
                <p class="footer-contact-item">
                    <span class="footer-contact-label">Telepon</span>
                    ${phone}
                </p>
                ` : ''}
                ${whatsapp ? `
                <p class="footer-contact-item">
                    <span class="footer-contact-label">WhatsApp</span>
                    <a href="https://wa.me/${whatsapp}">+${whatsapp}</a>
                </p>
                ` : ''}
                ${address ? `
                <p class="footer-contact-item">
                    <span class="footer-contact-label">Alamat</span>
                    ${address}
                </p>
                ` : ''}
            </div>
            
            <p class="footer-disclaimer">
                Email ini dikirim secara otomatis oleh sistem ${appName}.<br>
                Mohon tidak membalas email ini. Jika ada pertanyaan, silakan hubungi support kami.
            </p>
        </div>
    `;
}

/**
 * Base HTML wrapper dengan table-based layout untuk compatibility
 */
function wrapHtml(content, settings = {}) {
    const appName = settings.app_name || settings.system_name || 'POSKasir';
    
    return `
<!DOCTYPE html>
<html lang="id" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
    <title>${appName}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        ${baseStyles}
    </style>
</head>
<body>
    <div class="email-wrapper">
        <!--[if mso]>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" align="center">
        <tr>
        <td>
        <![endif]-->
        <div class="email-container">
            ${content}
        </div>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
    </div>
</body>
</html>
    `.trim();
}

/**
 * Generate info row untuk table
 */
function getInfoRow(label, value, isDark = false) {
    if (!value) return '';
    
    if (isDark) {
        return `
            <tr>
                <td class="info-label-dark">${label}</td>
                <td class="info-separator-dark">:</td>
                <td class="info-value-dark">${value}</td>
            </tr>
        `;
    }
    
    return `
        <tr>
            <td class="info-label">${label}</td>
            <td class="info-separator">:</td>
            <td class="info-value">${value}</td>
        </tr>
    `;
}

/**
 * Get WhatsApp link
 */
function getWhatsAppLink(settings, message = '') {
    const whatsapp = settings.contact_whatsapp || '6281234567890';
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${whatsapp}${message ? '?text=' + encodedMessage : ''}`;
}

/**
 * Format date ke bahasa Indonesia
 */
function formatDate(date = new Date()) {
    return date.toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// TEMPLATE 1: REGISTRASI BERHASIL (ke Tenant)
// ============================================
export function getRegistrationSuccessEmail(data, settings = {}) {
    const appName = settings.app_name || settings.system_name || 'POSKasir';
    const whatsappLink = getWhatsAppLink(settings, `Halo, saya baru mendaftar dengan kode ${data.kode_pelanggan}. Mohon informasi proses verifikasi.`);
    
    const subject = `Pendaftaran Berhasil - Selamat Datang di ${appName}`;
    
    const html = wrapHtml(`
        <!-- Header -->
        <div class="email-header header-primary">
            ${getLogo(settings, 'light')}
            <h1 class="header-title">Pendaftaran Berhasil</h1>
            <p class="header-subtitle">Terima kasih telah mendaftar di ${appName}</p>
        </div>
        
        <!-- Content -->
        <div class="email-content">
            <p class="greeting">Halo <strong>${data.nama_pemilik}</strong>,</p>
            
            <p class="message">
                Selamat! Pendaftaran bisnis <strong>${data.nama_bisnis}</strong> telah berhasil kami terima. 
                Tim kami akan segera memverifikasi data Anda dalam waktu 1-2 hari kerja.
            </p>
            
            <!-- Kode Pendaftaran -->
            <div class="kode-container">
                <p class="kode-label">KODE PENDAFTARAN ANDA</p>
                <div class="kode-box">
                    <p class="kode-text">${data.kode_pelanggan}</p>
                </div>
                <p class="kode-hint">Simpan kode ini untuk referensi</p>
            </div>
            
            <!-- Status Info -->
            <div class="highlight-box">
                <p class="highlight-text">
                    ⏳ <strong>Status:</strong> Pendaftaran Anda sedang dalam proses verifikasi. 
                    Tim kami akan menghubungi Anda dalam <strong>1x24 jam</strong> kerja.
                </p>
            </div>
            
            <!-- Detail Pendaftaran -->
            <div class="info-card">
                <div class="info-card-header">
                    <span class="status-badge badge-pending">MENUNGGU VERIFIKASI</span>
                </div>
                <table class="info-table">
                    ${getInfoRow('Nama Bisnis', data.nama_bisnis)}
                    ${getInfoRow('Nama Pemilik', data.nama_pemilik)}
                    ${getInfoRow('Email', data.email)}
                    ${getInfoRow('No. Telepon', data.no_telepon)}
                    ${getInfoRow('Jenis Usaha', data.jenis_usaha)}
                    ${getInfoRow('Alamat', data.alamat)}
                </table>
            </div>
            
            <!-- Steps -->
            <div class="steps-section">
                <p class="steps-title">Langkah Selanjutnya</p>
                
                <div class="step-item">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <p class="step-name">Tunggu Verifikasi</p>
                        <p class="step-desc">Tim kami akan memverifikasi data pendaftaran Anda dalam 1-2 hari kerja</p>
                    </div>
                </div>
                
                <div class="step-item">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <p class="step-name">Konfirmasi (Opsional)</p>
                        <p class="step-desc">Anda dapat menghubungi kami via WhatsApp untuk mempercepat proses verifikasi</p>
                    </div>
                </div>
                
                <div class="step-item">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <p class="step-name">Akun Diaktifkan</p>
                        <p class="step-desc">Anda akan menerima email konfirmasi saat akun sudah aktif dan siap digunakan</p>
                    </div>
                </div>
                
                <div class="step-item">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <p class="step-name">Mulai Berjualan</p>
                        <p class="step-desc">Login ke aplikasi dan mulai kelola bisnis Anda dengan mudah</p>
                    </div>
                </div>
            </div>
            
            <!-- Alert -->
            <div class="alert-box alert-info">
                <span class="alert-icon">💡</span>
                <div class="alert-content">
                    <p class="alert-title">Butuh Bantuan?</p>
                    <p class="alert-text">
                        Hubungi tim support kami via WhatsApp untuk pertanyaan atau mempercepat proses verifikasi.
                    </p>
                </div>
            </div>
            
            <!-- CTA -->
            <div class="cta-container">
                <a href="${whatsappLink}" class="cta-button btn-success">
                    Hubungi via WhatsApp
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        ${getFooter(settings)}
    `, settings);
    
    const text = `
PENDAFTARAN BERHASIL - ${appName}

Halo ${data.nama_pemilik},

Selamat! Pendaftaran bisnis ${data.nama_bisnis} telah berhasil kami terima.

KODE PENDAFTARAN: ${data.kode_pelanggan}
(Simpan kode ini untuk referensi)

Status: MENUNGGU VERIFIKASI
Tim kami akan memverifikasi data Anda dalam 1-2 hari kerja.

Detail Pendaftaran:
- Nama Bisnis  : ${data.nama_bisnis}
- Nama Pemilik : ${data.nama_pemilik}
- Email        : ${data.email}
- Telepon      : ${data.no_telepon || '-'}
- Jenis Usaha  : ${data.jenis_usaha || '-'}

Langkah Selanjutnya:
1. Tunggu verifikasi (1-2 hari kerja)
2. Konfirmasi via WhatsApp (opsional)
3. Akun diaktifkan
4. Mulai berjualan

Butuh bantuan? Hubungi: ${getWhatsAppLink(settings)}

---
${appName}
${settings.app_tagline || settings.system_tagline || ''}
    `.trim();
    
    return { subject, html, text };
}

// ============================================
// TEMPLATE 2: NOTIFIKASI TENANT BARU (ke Admin)
// ============================================
export function getNewTenantNotificationEmail(data, settings = {}) {
    const appName = settings.app_name || settings.system_name || 'POSKasir';
    const adminUrl = data.adminUrl || '#';
    
    const subject = `[Admin] Tenant Baru Mendaftar: ${data.nama_bisnis}`;
    
    const html = wrapHtml(`
        <!-- Header -->
        <div class="email-header header-info">
            ${getLogo(settings, 'light')}
            <h1 class="header-title">Tenant Baru Mendaftar</h1>
            <p class="header-subtitle">Ada pendaftaran baru yang perlu diverifikasi</p>
        </div>
        
        <!-- Content -->
        <div class="email-content">
            <p class="greeting">Halo <strong>Admin</strong>,</p>
            
            <p class="message">
                Ada tenant baru yang mendaftar di platform ${appName}. 
                Silakan verifikasi data berikut dan lakukan approval jika sudah sesuai.
            </p>
            
            <!-- Detail Tenant -->
            <div class="info-card">
                <div class="info-card-header">
                    <span class="status-badge badge-warning">MENUNGGU APPROVAL</span>
                </div>
                <table class="info-table">
                    ${getInfoRow('Kode Tenant', data.kode_pelanggan)}
                    ${getInfoRow('Nama Bisnis', data.nama_bisnis)}
                    ${getInfoRow('Nama Pemilik', data.nama_pemilik)}
                    ${getInfoRow('Email', data.email)}
                    ${getInfoRow('No. Telepon', data.no_telepon)}
                    ${getInfoRow('Jenis Usaha', data.jenis_usaha)}
                    ${getInfoRow('Alamat', data.alamat)}
                    ${getInfoRow('Waktu Daftar', formatDate())}
                </table>
            </div>
            
            <!-- Alert -->
            <div class="alert-box alert-warning">
                <span class="alert-icon">⚠️</span>
                <div class="alert-content">
                    <p class="alert-title">Perlu Tindakan</p>
                    <p class="alert-text">
                        Silakan login ke panel admin untuk memverifikasi dan melakukan approval tenant ini.
                    </p>
                </div>
            </div>
            
            <!-- CTA -->
            <div class="cta-container">
                <a href="${adminUrl}" class="cta-button btn-primary">
                    Buka Panel Admin
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        ${getFooter(settings)}
    `, settings);
    
    const text = `
[ADMIN] TENANT BARU MENDAFTAR - ${appName}

Halo Admin,

Ada tenant baru yang mendaftar di platform ${appName}.

Detail Tenant:
- Kode         : ${data.kode_pelanggan}
- Nama Bisnis  : ${data.nama_bisnis}
- Nama Pemilik : ${data.nama_pemilik}
- Email        : ${data.email || '-'}
- Telepon      : ${data.no_telepon || '-'}
- Jenis Usaha  : ${data.jenis_usaha || '-'}
- Alamat       : ${data.alamat || '-'}
- Waktu Daftar : ${formatDate()}

Status: MENUNGGU APPROVAL

Silakan login ke panel admin untuk memverifikasi:
${adminUrl}

---
${appName}
    `.trim();
    
    return { subject, html, text };
}

// ============================================
// TEMPLATE 3: AKUN DISETUJUI (ke Tenant)
// ============================================
export function getApprovalEmail(data, settings = {}, isReactivation = false) {
    const appName = settings.app_name || settings.system_name || 'POSKasir';
    const loginUrl = data.loginUrl || '#';
    const whatsappLink = getWhatsAppLink(settings);
    
    const subject = isReactivation 
        ? `Akun Anda Telah Diaktifkan Kembali - ${appName}`
        : `Selamat! Akun Anda Telah Disetujui - ${appName}`;
    
    const headerTitle = isReactivation 
        ? 'Akun Aktif Kembali'
        : 'Akun Anda Disetujui';
    
    const headerSubtitle = isReactivation
        ? 'Akun Anda telah diaktifkan kembali oleh admin'
        : 'Selamat bergabung di ' + appName;
    
    const messageText = isReactivation
        ? `Akun ${appName} Anda untuk bisnis <strong>${data.nama_bisnis}</strong> telah diaktifkan kembali oleh admin. Anda sekarang dapat login dan melanjutkan menggunakan aplikasi.`
        : `Selamat! Pendaftaran bisnis <strong>${data.nama_bisnis}</strong> di ${appName} telah diverifikasi dan disetujui. Anda sekarang dapat login dan mulai menggunakan aplikasi.`;
    
    const html = wrapHtml(`
        <!-- Header -->
        <div class="email-header header-success">
            ${getLogo(settings, 'light')}
            <h1 class="header-title">${headerTitle}</h1>
            <p class="header-subtitle">${headerSubtitle}</p>
        </div>
        
        <!-- Content -->
        <div class="email-content">
            <p class="greeting">Halo <strong>${data.nama_pemilik}</strong>,</p>
            
            <p class="message">${messageText}</p>
            
            <!-- Status Info -->
            <div class="info-card">
                <div class="info-card-header">
                    <span class="status-badge badge-success">AKTIF</span>
                </div>
                <table class="info-table">
                    ${getInfoRow('Nama Bisnis', data.nama_bisnis)}
                    ${getInfoRow('Email Login', data.email)}
                </table>
            </div>
            
            <!-- Login Info (Dark Card) -->
            <div class="info-card-dark">
                <div class="info-card-dark-header">
                    INFORMASI LOGIN
                </div>
                <table class="info-table info-table-dark">
                    ${getInfoRow('Email', data.email, true)}
                    ${getInfoRow('Password', 'Password yang Anda buat saat mendaftar', true)}
                </table>
                <div class="cta-container" style="margin-top: 24px; margin-bottom: 0;">
                    <a href="${loginUrl}" class="cta-button btn-success">
                        Login Sekarang
                    </a>
                </div>
            </div>
            
            <!-- Features -->
            <div class="feature-section">
                <p class="feature-title">Yang Bisa Anda Lakukan</p>
                
                <div class="feature-item">
                    <div class="feature-icon feature-icon-success">📦</div>
                    <div class="feature-content">
                        <p class="feature-name">Tambah Produk</p>
                        <p class="feature-desc">Input produk, atur harga jual, harga modal, dan kelola stok dengan mudah</p>
                    </div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-icon feature-icon-primary">🧾</div>
                    <div class="feature-content">
                        <p class="feature-name">Mulai Transaksi</p>
                        <p class="feature-desc">Catat penjualan dengan cepat, cetak struk, dan terima berbagai metode pembayaran</p>
                    </div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-icon feature-icon-info">📊</div>
                    <div class="feature-content">
                        <p class="feature-name">Lihat Laporan</p>
                        <p class="feature-desc">Pantau penjualan harian, mingguan, bulanan, dan analisis keuntungan bisnis</p>
                    </div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-icon feature-icon-success">👥</div>
                    <div class="feature-content">
                        <p class="feature-name">Tambah Kasir</p>
                        <p class="feature-desc">Undang karyawan untuk membantu operasional toko dengan akses terbatas</p>
                    </div>
                </div>
            </div>
            
            <!-- Tips -->
            <div class="alert-box alert-success">
                <span class="alert-icon">💡</span>
                <div class="alert-content">
                    <p class="alert-title">Tips Memulai</p>
                    <p class="alert-text">
                        Mulai dengan menambahkan produk Anda, lalu coba buat transaksi pertama untuk memahami cara kerja aplikasi. 
                        Jangan lupa lengkapi profil toko Anda!
                    </p>
                </div>
            </div>
            
            <div class="divider"></div>
            
            <!-- Support -->
            <div style="text-align: center;">
                <p style="color: ${colors.gray500}; font-size: 14px; margin: 0 0 16px 0;">Butuh bantuan?</p>
                <a href="${whatsappLink}" class="cta-button btn-secondary">
                    Hubungi Support
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        ${getFooter(settings)}
    `, settings);
    
    const text = `
${headerTitle.toUpperCase()} - ${appName}

Halo ${data.nama_pemilik},

${isReactivation 
    ? `Akun ${appName} Anda untuk ${data.nama_bisnis} telah diaktifkan kembali.`
    : `Selamat! Pendaftaran ${data.nama_bisnis} telah disetujui.`
}

Status: AKTIF

Detail Akun:
- Nama Bisnis : ${data.nama_bisnis}
- Email Login : ${data.email}
- Password    : Password yang Anda buat saat mendaftar

Login di: ${loginUrl}

Yang Bisa Anda Lakukan:
- Tambah Produk (input produk, atur harga & stok)
- Mulai Transaksi (catat penjualan, cetak struk)
- Lihat Laporan (pantau penjualan & keuntungan)
- Tambah Kasir (undang karyawan)

Tips: Mulai dengan menambahkan produk, lalu coba buat transaksi pertama!

Butuh bantuan? Hubungi: ${whatsappLink}

---
${appName}
${settings.app_tagline || settings.system_tagline || ''}
    `.trim();
    
    return { subject, html, text };
}

// ============================================
// TEMPLATE 4: AKUN DITOLAK/DINONAKTIFKAN (ke Tenant)
// ============================================
export function getRejectionEmail(data, settings = {}, reason = '', isSuspension = false) {
    const appName = settings.app_name || settings.system_name || 'POSKasir';
    const whatsappLink = getWhatsAppLink(settings, `Halo, saya ingin bertanya mengenai status akun ${data.nama_bisnis}.`);
    
    const subject = isSuspension 
        ? `Pemberitahuan: Akun Anda Telah Dinonaktifkan - ${appName}`
        : `Pemberitahuan: Pendaftaran Tidak Dapat Diproses - ${appName}`;
    
    const headerTitle = isSuspension 
        ? 'Akun Dinonaktifkan'
        : 'Pendaftaran Tidak Diproses';
    
    const headerClass = isSuspension ? 'header-warning' : 'header-danger';
    const badgeClass = isSuspension ? 'badge-warning' : 'badge-danger';
    const statusText = isSuspension ? 'NONAKTIF' : 'TIDAK DISETUJUI';
    
    const messageText = isSuspension
        ? `Kami informasikan bahwa akun ${appName} untuk bisnis <strong>${data.nama_bisnis}</strong> telah dinonaktifkan sementara oleh admin.`
        : `Mohon maaf, kami tidak dapat memproses pendaftaran Anda untuk bisnis <strong>${data.nama_bisnis}</strong> saat ini.`;
    
    const nextStepText = isSuspension
        ? 'Akun Anda dapat diaktifkan kembali setelah masalah diselesaikan. Silakan hubungi tim support kami untuk informasi lebih lanjut.'
        : 'Anda dapat mendaftar kembali dengan data yang valid setelah melakukan klarifikasi dengan tim support kami.';
    
    const html = wrapHtml(`
        <!-- Header -->
        <div class="email-header ${headerClass}">
            ${getLogo(settings, 'light')}
            <h1 class="header-title">${headerTitle}</h1>
        </div>
        
        <!-- Content -->
        <div class="email-content">
            <p class="greeting">Halo <strong>${data.nama_pemilik}</strong>,</p>
            
            <p class="message">${messageText}</p>
            
            <!-- Status Info -->
            <div class="info-card">
                <div class="info-card-header">
                    <span class="status-badge ${badgeClass}">${statusText}</span>
                </div>
                <table class="info-table">
                    ${getInfoRow('Nama Bisnis', data.nama_bisnis)}
                    ${getInfoRow('Email', data.email)}
                </table>
            </div>
            
            ${reason ? `
            <!-- Alasan -->
            <div class="alert-box alert-warning">
                <span class="alert-icon">📝</span>
                <div class="alert-content">
                    <p class="alert-title">Alasan</p>
                    <p class="alert-text">${reason}</p>
                </div>
            </div>
            ` : ''}
            
            <!-- Next Step -->
            <div class="alert-box alert-info">
                <span class="alert-icon">💡</span>
                <div class="alert-content">
                    <p class="alert-title">Langkah Selanjutnya</p>
                    <p class="alert-text">${nextStepText}</p>
                </div>
            </div>
            
            <!-- CTA -->
            <div class="cta-container">
                <a href="${whatsappLink}" class="cta-button btn-primary">
                    Hubungi Support
                </a>
            </div>
            
            <div class="divider"></div>
            
            <p style="color: ${colors.gray500}; font-size: 13px; text-align: center; margin: 0;">
                Jika Anda merasa ini adalah kesalahan, silakan hubungi tim support kami untuk klarifikasi.
            </p>
        </div>
        
        <!-- Footer -->
        ${getFooter(settings)}
    `, settings);
    
    const text = `
${headerTitle.toUpperCase()} - ${appName}

Halo ${data.nama_pemilik},

${isSuspension 
    ? `Akun ${appName} untuk ${data.nama_bisnis} telah dinonaktifkan sementara.`
    : `Mohon maaf, pendaftaran untuk ${data.nama_bisnis} tidak dapat kami proses.`
}

Status: ${statusText}
${reason ? `Alasan: ${reason}` : ''}

Langkah Selanjutnya:
${nextStepText}

Hubungi Support: ${whatsappLink}

---
${appName}
${settings.app_tagline || settings.system_tagline || ''}
    `.trim();
    
    return { subject, html, text };
}

// ============================================
// TEMPLATE 5: TEST EMAIL
// ============================================
export function getTestEmail(settings = {}) {
    const appName = settings.app_name || settings.system_name || 'POSKasir';
    
    const subject = `Test Email Berhasil - ${appName}`;
    
    const html = wrapHtml(`
        <!-- Header -->
        <div class="email-header header-success">
            ${getLogo(settings, 'light')}
            <h1 class="header-title">Test Email Berhasil</h1>
            <p class="header-subtitle">Konfigurasi SMTP Anda sudah benar</p>
        </div>
        
        <!-- Content -->
        <div class="email-content">
            <p class="greeting">Halo <strong>Admin</strong>,</p>
            
            <p class="message">
                Jika Anda menerima email ini, berarti konfigurasi SMTP pada ${appName} sudah berfungsi dengan baik. 
                Sistem email siap digunakan untuk mengirim notifikasi kepada tenant.
            </p>
            
            <!-- Success Alert -->
            <div class="alert-box alert-success">
                <span class="alert-icon">✅</span>
                <div class="alert-content">
                    <p class="alert-title">Konfigurasi Berhasil</p>
                    <p class="alert-text">
                        Anda sekarang dapat menggunakan semua fitur notifikasi email di aplikasi.
                    </p>
                </div>
            </div>
            
            <!-- Features -->
            <div class="feature-section">
                <p class="feature-title">Fitur Email yang Aktif</p>
                
                <div class="feature-item">
                    <div class="feature-icon feature-icon-success">📝</div>
                    <div class="feature-content">
                        <p class="feature-name">Email Registrasi</p>
                        <p class="feature-desc">Konfirmasi otomatis saat tenant baru mendaftar</p>
                    </div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-icon feature-icon-primary">✅</div>
                    <div class="feature-content">
                        <p class="feature-name">Email Approval</p>
                        <p class="feature-desc">Notifikasi saat akun tenant disetujui atau ditolak</p>
                    </div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-icon feature-icon-info">🔔</div>
                    <div class="feature-content">
                        <p class="feature-name">Notifikasi Admin</p>
                        <p class="feature-desc">Pemberitahuan tenant baru dan aktivitas penting lainnya</p>
                    </div>
                </div>
            </div>
            
            <!-- Timestamp -->
            <div style="text-align: center; margin-top: 32px; padding: 20px; background: ${colors.gray50}; border-radius: 10px;">
                <p style="color: ${colors.gray500}; font-size: 13px; margin: 0;">
                    Email dikirim pada<br>
                    <strong style="color: ${colors.gray700};">${formatDate()}</strong>
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        ${getFooter(settings)}
    `, settings);
    
    const text = `
TEST EMAIL BERHASIL - ${appName}

Halo Admin,

Jika Anda menerima email ini, berarti konfigurasi SMTP sudah benar!

Fitur email yang aktif:
- Email Registrasi (konfirmasi pendaftaran tenant)
- Email Approval (notifikasi approval/rejection)
- Notifikasi Admin (pemberitahuan aktivitas penting)

Dikirim pada: ${formatDate()}

---
${appName}
    `.trim();
    
    return { subject, html, text };
}


// ============================================
// TEMPLATE 6: SHARE LOGIN KASIR (ke Kasir) - NEW
// ============================================

/**
 * Generate email untuk share info login kasir
 * 
 * @param {Object} data - Data yang diperlukan
 * @param {string} data.namaKasir - Nama kasir
 * @param {string} data.emailKasir - Email kasir (penerima)
 * @param {string} data.namaToko - Nama toko/bisnis
 * @param {string} data.kodeToko - Kode toko untuk login
 * @param {string} data.pin - PIN kasir (6 digit)
 * @param {string} data.loginUrl - URL halaman login lengkap
 * @param {string} data.namaOwner - Nama owner yang mengirim (opsional)
 * @param {Object} settings - Platform settings
 * @returns {Object} { subject, html, text }
 */
export function getShareLoginKasirEmail(data, settings = {}) {
    const appName = settings.app_name || settings.system_name || 'POSKasir';
    const whatsappLink = getWhatsAppLink(settings, `Halo, saya butuh bantuan untuk login ke ${data.namaToko}`);
    
    const subject = `Info Login Kasir - ${data.namaToko}`;
    
    const html = wrapHtml(`
        <!-- Header -->
        <div class="email-header header-success">
            ${getLogo(settings, 'light')}
            <h1 class="header-title">Info Login Kasir</h1>
            <p class="header-subtitle">Anda telah ditambahkan sebagai kasir</p>
        </div>
        
        <!-- Content -->
        <div class="email-content">
            <p class="greeting">Halo <strong>${data.namaKasir}</strong>,</p>
            
            <p class="message">
                ${data.namaOwner ? `<strong>${data.namaOwner}</strong> telah menambahkan Anda` : 'Anda telah ditambahkan'} 
                sebagai kasir di <strong>${data.namaToko}</strong>. 
                Berikut adalah informasi login yang Anda butuhkan untuk mengakses aplikasi kasir.
            </p>
            
            <!-- Login Info Card (Dark) -->
            <div class="info-card-dark">
                <div class="info-card-dark-header">
                    🔐 INFORMASI LOGIN ANDA
                </div>
                <table class="info-table info-table-dark">
                    <tr>
                        <td class="info-label-dark">🏪 Toko</td>
                        <td class="info-separator-dark">:</td>
                        <td class="info-value-dark">${data.namaToko}</td>
                    </tr>
                    <tr>
                        <td class="info-label-dark">🔑 Kode Toko</td>
                        <td class="info-separator-dark">:</td>
                        <td class="info-value-dark" style="font-family: 'SF Mono', 'Consolas', monospace; letter-spacing: 1px;">${data.kodeToko}</td>
                    </tr>
                </table>
            </div>
            
            <!-- PIN Box (Highlight) -->
            <div class="kode-container">
                <p class="kode-label">🔢 PIN LOGIN ANDA</p>
                <div class="kode-box">
                    <p class="kode-text">${data.pin}</p>
                </div>
                <p class="kode-hint">Jangan bagikan PIN ini kepada siapapun</p>
            </div>
            
            <!-- Link Login -->
            <div class="info-card" style="text-align: center;">
                <p style="color: ${colors.gray600}; font-size: 14px; margin: 0 0 16px 0;">
                    🔗 <strong>Link Login:</strong>
                </p>
                <p style="background: ${colors.gray100}; padding: 12px 16px; border-radius: 8px; font-family: 'SF Mono', 'Consolas', monospace; font-size: 13px; color: ${colors.primary}; word-break: break-all; margin: 0;">
                    ${data.loginUrl}
                </p>
            </div>
            
            <!-- CTA Button -->
            <div class="cta-container">
                <a href="${data.loginUrl}" class="cta-button btn-success">
                    🚀 Login Sekarang
                </a>
            </div>
            
            <!-- Steps -->
            <div class="steps-section">
                <p class="steps-title">📋 Cara Login</p>
                
                <div class="step-item">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <p class="step-name">Klik Link atau Buka Aplikasi</p>
                        <p class="step-desc">Klik tombol "Login Sekarang" di atas, atau buka aplikasi dan masukkan kode toko: <strong>${data.kodeToko}</strong></p>
                    </div>
                </div>
                
                <div class="step-item">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <p class="step-name">Masukkan PIN</p>
                        <p class="step-desc">Ketik PIN 6 digit Anda: <strong>${data.pin}</strong></p>
                    </div>
                </div>
                
                <div class="step-item">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <p class="step-name">Mulai Bekerja</p>
                        <p class="step-desc">Setelah login berhasil, Anda dapat langsung melakukan transaksi penjualan</p>
                    </div>
                </div>
            </div>
            
            <!-- Security Alert -->
            <div class="alert-box alert-warning">
                <span class="alert-icon">🔒</span>
                <div class="alert-content">
                    <p class="alert-title">Keamanan Akun</p>
                    <p class="alert-text">
                        PIN ini bersifat rahasia. Jangan bagikan PIN Anda kepada siapapun. 
                        Jika Anda merasa PIN telah diketahui orang lain, segera hubungi owner untuk reset PIN.
                    </p>
                </div>
            </div>
            
            <!-- Help -->
            <div class="alert-box alert-info">
                <span class="alert-icon">💡</span>
                <div class="alert-content">
                    <p class="alert-title">Butuh Bantuan?</p>
                    <p class="alert-text">
                        Jika Anda mengalami kesulitan login atau ada pertanyaan, silakan hubungi owner toko Anda
                        ${data.namaOwner ? `(${data.namaOwner})` : ''} atau tim support kami.
                    </p>
                </div>
            </div>
            
            <!-- Support CTA -->
            <div style="text-align: center; margin-top: 24px;">
                <a href="${whatsappLink}" class="cta-button btn-secondary">
                    Hubungi Support
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        ${getFooter(settings)}
    `, settings);
    
    const text = `
INFO LOGIN KASIR - ${data.namaToko}

Halo ${data.namaKasir},

${data.namaOwner ? `${data.namaOwner} telah menambahkan Anda` : 'Anda telah ditambahkan'} sebagai kasir di ${data.namaToko}.

═══════════════════════════════════════
INFORMASI LOGIN ANDA
═══════════════════════════════════════

🏪 Toko      : ${data.namaToko}
🔑 Kode Toko : ${data.kodeToko}
🔢 PIN       : ${data.pin}
🔗 Link      : ${data.loginUrl}

═══════════════════════════════════════

CARA LOGIN:
1. Klik link di atas atau buka aplikasi
2. Masukkan kode toko: ${data.kodeToko}
3. Masukkan PIN: ${data.pin}
4. Mulai bekerja!

⚠️ PENTING: Jangan bagikan PIN Anda kepada siapapun!

Butuh bantuan? Hubungi: ${whatsappLink}

---
${appName}
${settings.app_tagline || settings.system_tagline || ''}
    `.trim();
    
    return { subject, html, text };
}


// ============================================
// TEMPLATE 7: NOTIFIKASI PIN BARU/RESET (ke Kasir) - NEW
// ============================================

/**
 * Generate email untuk notifikasi PIN baru atau reset PIN
 * 
 * @param {Object} data - Data yang diperlukan
 * @param {string} data.namaKasir - Nama kasir
 * @param {string} data.emailKasir - Email kasir (penerima)
 * @param {string} data.namaToko - Nama toko/bisnis
 * @param {string} data.kodeToko - Kode toko untuk login
 * @param {string} data.pin - PIN baru kasir (6 digit)
 * @param {string} data.loginUrl - URL halaman login lengkap
 * @param {boolean} data.isReset - true jika ini reset PIN, false jika PIN baru
 * @param {string} data.namaOwner - Nama owner yang melakukan reset (opsional)
 * @param {Object} settings - Platform settings
 * @returns {Object} { subject, html, text }
 */
export function getPinNotificationEmail(data, settings = {}) {
    const appName = settings.app_name || settings.system_name || 'POSKasir';
    const whatsappLink = getWhatsAppLink(settings);
    
    const isReset = data.isReset === true;
    
    const subject = isReset 
        ? `PIN Kasir Anda Telah Direset - ${data.namaToko}`
        : `PIN Kasir Baru - ${data.namaToko}`;
    
    const headerTitle = isReset ? 'PIN Telah Direset' : 'PIN Kasir Baru';
    const headerSubtitle = isReset 
        ? 'PIN lama Anda tidak berlaku lagi'
        : 'Gunakan PIN baru ini untuk login';
    
    const messageText = isReset
        ? `PIN kasir Anda untuk <strong>${data.namaToko}</strong> telah direset${data.namaOwner ? ` oleh <strong>${data.namaOwner}</strong>` : ''}. PIN lama Anda tidak dapat digunakan lagi. Silakan gunakan PIN baru di bawah ini.`
        : `PIN kasir baru telah dibuat untuk akun Anda di <strong>${data.namaToko}</strong>. Gunakan PIN ini untuk login ke aplikasi kasir.`;
    
    const html = wrapHtml(`
        <!-- Header -->
        <div class="email-header ${isReset ? 'header-warning' : 'header-success'}">
            ${getLogo(settings, 'light')}
            <h1 class="header-title">${headerTitle}</h1>
            <p class="header-subtitle">${headerSubtitle}</p>
        </div>
        
        <!-- Content -->
        <div class="email-content">
            <p class="greeting">Halo <strong>${data.namaKasir}</strong>,</p>
            
            <p class="message">${messageText}</p>
            
            <!-- PIN Box -->
            <div class="kode-container">
                <p class="kode-label">🔢 PIN ${isReset ? 'BARU ' : ''}ANDA</p>
                <div class="kode-box">
                    <p class="kode-text">${data.pin}</p>
                </div>
                <p class="kode-hint">Hafalkan dan jangan bagikan kepada siapapun</p>
            </div>
            
            <!-- Quick Info -->
            <div class="info-card">
                <table class="info-table">
                    <tr>
                        <td class="info-label">🏪 Toko</td>
                        <td class="info-separator">:</td>
                        <td class="info-value">${data.namaToko}</td>
                    </tr>
                    <tr>
                        <td class="info-label">🔑 Kode Toko</td>
                        <td class="info-separator">:</td>
                        <td class="info-value">${data.kodeToko}</td>
                    </tr>
                    <tr>
                        <td class="info-label">🔗 Link Login</td>
                        <td class="info-separator">:</td>
                        <td class="info-value"><a href="${data.loginUrl}" style="color: ${colors.primary}; text-decoration: none;">${data.loginUrl}</a></td>
                    </tr>
                </table>
            </div>
            
            <!-- CTA -->
            <div class="cta-container">
                <a href="${data.loginUrl}" class="cta-button btn-success">
                    Login dengan PIN Baru
                </a>
            </div>
            
            ${isReset ? `
            <!-- Reset Alert -->
            <div class="alert-box alert-warning">
                <span class="alert-icon">⚠️</span>
                <div class="alert-content">
                    <p class="alert-title">PIN Lama Tidak Berlaku</p>
                    <p class="alert-text">
                        PIN lama Anda sudah tidak dapat digunakan. 
                        Jika Anda tidak meminta reset PIN, segera hubungi owner toko Anda.
                    </p>
                </div>
            </div>
            ` : ''}
            
            <!-- Security -->
            <div class="alert-box alert-info">
                <span class="alert-icon">🔒</span>
                <div class="alert-content">
                    <p class="alert-title">Tips Keamanan</p>
                    <p class="alert-text">
                        Hafalkan PIN Anda dan jangan simpan di tempat yang mudah dilihat orang lain. 
                        Jangan pernah bagikan PIN kepada siapapun termasuk rekan kerja.
                    </p>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        ${getFooter(settings)}
    `, settings);
    
    const text = `
${headerTitle.toUpperCase()} - ${data.namaToko}

Halo ${data.namaKasir},

${isReset 
    ? `PIN kasir Anda untuk ${data.namaToko} telah direset${data.namaOwner ? ` oleh ${data.namaOwner}` : ''}.`
    : `PIN kasir baru telah dibuat untuk akun Anda di ${data.namaToko}.`
}

═══════════════════════════════════════
PIN ${isReset ? 'BARU ' : ''}ANDA: ${data.pin}
═══════════════════════════════════════

Info Login:
- Toko      : ${data.namaToko}
- Kode Toko : ${data.kodeToko}
- Link      : ${data.loginUrl}

${isReset ? '⚠️ PIN lama Anda sudah tidak dapat digunakan!' : ''}

🔒 Jangan bagikan PIN kepada siapapun!

---
${appName}
    `.trim();
    
    return { subject, html, text };
}


// ============================================
// EXPORT DEFAULT
// ============================================
export default {
    // Existing templates
    getRegistrationSuccessEmail,
    getNewTenantNotificationEmail,
    getApprovalEmail,
    getRejectionEmail,
    getTestEmail,
    // New templates for Share Login
    getShareLoginKasirEmail,
    getPinNotificationEmail
};