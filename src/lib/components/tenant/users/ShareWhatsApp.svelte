<!-- 
============================================
SHARE WHATSAPP COMPONENT (Clean Version)
File: src/lib/components/tenant/users/ShareWhatsApp.svelte

Komponen untuk share info login kasir
- Clean & Professional Design
- Lucide Icons (no emoji)
- Minimalist UI

Props:
- user: Object { nama, email, no_telepon, pin }
- kodeToko: string
- namaToko: string
- show: boolean
- compact: boolean
============================================
-->

<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { page } from '$app/stores';
    import { fade, fly } from 'svelte/transition';
    import { 
        Store, Link, KeyRound, Copy, Check, 
        MessageCircle, Globe, Mail, Send,
        Loader2, CheckCircle, AlertCircle
    } from 'lucide-svelte';
    
    // ================================
    // PROPS
    // ================================
    
    export let user = {};
    export let kodeToko = '';
    export let namaToko = '';
    export let show = true;
    export let compact = false;
    
    // ================================
    // STATE
    // ================================
    
    const dispatch = createEventDispatcher();
    
    let copied = {
        kode: false,
        link: false,
        pin: false,
        all: false
    };
    
    let emailStatus = {
        loading: false,
        success: false,
        error: null,
        available: true
    };
    
    let showEmailInput = false;
    let customEmail = '';
    
    // ================================
    // COMPUTED
    // ================================
    
    $: loginUrl = `${$page.url.origin}/login?store=${kodeToko}`;
    $: hasPhone = user.no_telepon && user.no_telepon.length > 8;
    $: hasEmail = user.email && user.email.includes('@');
    $: pin = user.pin || user.pin_kasir || '';
    
    $: waNumber = formatPhoneForWA(user.no_telepon);
    $: waMessage = generateWAMessage();
    
    $: waAppUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
    $: waWebUrl = `https://web.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(waMessage)}`;
    $: waAppUrlNoNumber = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;
    $: waWebUrlNoNumber = `https://web.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`;
    
    // ================================
    // FUNCTIONS
    // ================================
    
    function formatPhoneForWA(phone) {
        if (!phone) return '';
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        }
        if (!cleaned.startsWith('62')) {
            cleaned = '62' + cleaned;
        }
        return cleaned;
    }
    
    function generateWAMessage() {
        return `Halo ${user.nama || 'Kasir'},

Berikut info login kasir kamu:

Toko: ${namaToko}
Link: ${loginUrl}
PIN: ${pin}

Klik link di atas, masukkan PIN, selesai!

Terima kasih.`;
    }
    
    function getAllInfo() {
        return `Info Login Kasir - ${namaToko}

Nama: ${user.nama || '-'}
Kode Toko: ${kodeToko}
Link Login: ${loginUrl}
PIN: ${pin}

Cara Login:
1. Buka link atau ketik kode toko
2. Masukkan PIN
3. Mulai bekerja`;
    }
    
    // ================================
    // COPY FUNCTIONS
    // ================================
    
    async function copyToClipboard(text, type) {
        try {
            await navigator.clipboard.writeText(text);
            copied[type] = true;
            setTimeout(() => {
                copied[type] = false;
            }, 2000);
            
            dispatch('shared', { method: 'copy', type, success: true });
        } catch (err) {
            console.error('Failed to copy:', err);
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            copied[type] = true;
            setTimeout(() => {
                copied[type] = false;
            }, 2000);
        }
    }
    
    function copyKode() { copyToClipboard(kodeToko, 'kode'); }
    function copyLink() { copyToClipboard(loginUrl, 'link'); }
    function copyPin() { copyToClipboard(pin, 'pin'); }
    function copyAll() { copyToClipboard(getAllInfo(), 'all'); }
    
    // ================================
    // SHARE FUNCTIONS
    // ================================
    
    function shareViaWAApp() {
        const url = hasPhone ? waAppUrl : waAppUrlNoNumber;
        window.open(url, '_blank');
        dispatch('shared', { method: 'whatsapp-app', success: true });
    }
    
    function shareViaWAWeb() {
        const url = hasPhone ? waWebUrl : waWebUrlNoNumber;
        window.open(url, '_blank');
        dispatch('shared', { method: 'whatsapp-web', success: true });
    }
    
    async function shareViaEmailAuto() {
        const targetEmail = customEmail || user.email;
        
        if (!targetEmail || !targetEmail.includes('@')) {
            emailStatus.error = 'Email tidak valid';
            return;
        }
        
        emailStatus.loading = true;
        emailStatus.error = null;
        emailStatus.success = false;
        
        try {
            const response = await fetch('/api/send-login-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    namaKasir: user.nama || 'Kasir',
                    emailKasir: targetEmail,
                    namaToko: namaToko,
                    kodeToko: kodeToko,
                    pin: pin,
                    loginUrl: loginUrl
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                emailStatus.success = true;
                emailStatus.error = null;
                dispatch('shared', { method: 'email-auto', success: true, email: targetEmail });
                
                setTimeout(() => {
                    emailStatus.success = false;
                    showEmailInput = false;
                    customEmail = '';
                }, 3000);
            } else {
                emailStatus.error = result.message || 'Gagal mengirim email';
                dispatch('shared', { method: 'email-auto', success: false, error: result.message });
            }
        } catch (err) {
            console.error('Email send error:', err);
            emailStatus.error = 'Terjadi kesalahan. Silakan coba lagi.';
            dispatch('shared', { method: 'email-auto', success: false, error: err.message });
        } finally {
            emailStatus.loading = false;
        }
    }
    
    async function checkEmailAvailability() {
        try {
            const response = await fetch('/api/send-login-email', {
                method: 'GET',
                credentials: 'include'
            });
            const result = await response.json();
            emailStatus.available = result.success && result.data?.available;
        } catch (err) {
            emailStatus.available = false;
        }
    }
    
    onMount(() => {
        checkEmailAvailability();
    });
    
    function handleClose() {
        dispatch('close');
    }
</script>

<!-- ================================ -->
<!-- TEMPLATE - CLEAN VERSION -->
<!-- ================================ -->

{#if show}
    <div 
        class="share-container"
        class:compact
        transition:fade={{ duration: 200 }}
    >
        <!-- Info Cards - Clean Design -->
        <div class="info-section">
            <!-- Kode Toko -->
            <div class="info-item">
                <div class="info-label">
                    <Store size={16} class="text-gray-400" />
                    <span>Kode Toko</span>
                </div>
                <div class="info-value-group">
                    <code class="info-value">{kodeToko}</code>
                    <button 
                        class="copy-btn"
                        class:copied={copied.kode}
                        on:click={copyKode}
                        title="Copy"
                    >
                        {#if copied.kode}
                            <Check size={14} />
                        {:else}
                            <Copy size={14} />
                        {/if}
                    </button>
                </div>
            </div>
            
            <!-- Link Login -->
            <div class="info-item">
                <div class="info-label">
                    <Link size={16} class="text-gray-400" />
                    <span>Link Login</span>
                </div>
                <div class="info-value-group">
                    <code class="info-value link" title={loginUrl}>
                        {loginUrl.length > 30 ? loginUrl.substring(0, 30) + '...' : loginUrl}
                    </code>
                    <button 
                        class="copy-btn"
                        class:copied={copied.link}
                        on:click={copyLink}
                        title="Copy"
                    >
                        {#if copied.link}
                            <Check size={14} />
                        {:else}
                            <Copy size={14} />
                        {/if}
                    </button>
                </div>
            </div>
            
            <!-- PIN -->
            <div class="info-item pin-highlight">
                <div class="info-label">
                    <KeyRound size={16} class="text-gray-400" />
                    <span>PIN</span>
                </div>
                <div class="info-value-group">
                    <code class="info-value pin">{pin}</code>
                    <button 
                        class="copy-btn"
                        class:copied={copied.pin}
                        on:click={copyPin}
                        title="Copy"
                    >
                        {#if copied.pin}
                            <Check size={14} />
                        {:else}
                            <Copy size={14} />
                        {/if}
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Copy All Button -->
        <button 
            class="copy-all-btn"
            class:copied={copied.all}
            on:click={copyAll}
        >
            {#if copied.all}
                <Check size={16} />
                <span>Tersalin</span>
            {:else}
                <Copy size={16} />
                <span>Copy Semua Info</span>
            {/if}
        </button>
        
        <!-- Divider -->
        <div class="divider">
            <span>Kirim via</span>
        </div>
        
        <!-- Share Buttons - Clean Design -->
        <div class="share-buttons">
            <!-- WhatsApp Row -->
            <div class="button-row">
                <button 
                    class="share-btn whatsapp"
                    on:click={shareViaWAApp}
                    title="WhatsApp"
                >
                    <MessageCircle size={18} />
                    <span>WhatsApp</span>
                </button>
                
                <button 
                    class="share-btn whatsapp-web"
                    on:click={shareViaWAWeb}
                    title="WhatsApp Web"
                >
                    <Globe size={18} />
                    <span>WA Web</span>
                </button>
            </div>
            
            <!-- Email Button -->
            {#if emailStatus.available}
                <button 
                    class="share-btn email"
                    class:loading={emailStatus.loading}
                    class:success={emailStatus.success}
                    on:click={() => {
                        if (hasEmail) {
                            shareViaEmailAuto();
                        } else {
                            showEmailInput = !showEmailInput;
                        }
                    }}
                    disabled={emailStatus.loading}
                    title="Kirim Email"
                >
                    {#if emailStatus.loading}
                        <Loader2 size={18} class="animate-spin" />
                        <span>Mengirim...</span>
                    {:else if emailStatus.success}
                        <CheckCircle size={18} />
                        <span>Terkirim</span>
                    {:else}
                        <Mail size={18} />
                        <span>Email</span>
                        {#if !hasEmail}
                            <span class="badge">+</span>
                        {/if}
                    {/if}
                </button>
            {/if}
        </div>
        
        <!-- Email Input -->
        {#if showEmailInput && !hasEmail}
            <div class="email-input-section" transition:fly={{ y: -10, duration: 200 }}>
                <label for="custom-email">Email kasir:</label>
                <div class="email-input-group">
                    <input 
                        type="email" 
                        id="custom-email"
                        bind:value={customEmail}
                        placeholder="email@example.com"
                        class:error={emailStatus.error}
                    />
                    <button 
                        class="send-btn"
                        on:click={shareViaEmailAuto}
                        disabled={emailStatus.loading || !customEmail}
                    >
                        {#if emailStatus.loading}
                            <Loader2 size={16} class="animate-spin" />
                        {:else}
                            <Send size={16} />
                        {/if}
                    </button>
                </div>
                {#if emailStatus.error}
                    <p class="error-text">{emailStatus.error}</p>
                {/if}
            </div>
        {/if}
        
        <!-- Status Messages -->
        {#if emailStatus.error && hasEmail}
            <div class="status-message error" transition:fly={{ y: -10, duration: 200 }}>
                <AlertCircle size={14} />
                <span>{emailStatus.error}</span>
            </div>
        {/if}
        
        {#if emailStatus.success}
            <div class="status-message success" transition:fly={{ y: -10, duration: 200 }}>
                <CheckCircle size={14} />
                <span>Email terkirim ke {customEmail || user.email}</span>
            </div>
        {/if}
    </div>
{/if}

<!-- ================================ -->
<!-- STYLES - CLEAN VERSION -->
<!-- ================================ -->

<style>
    .share-container {
        background: white;
        border-radius: 12px;
        padding: 20px;
        width: 100%;
        max-width: 400px;
    }
    
    .share-container.compact {
        padding: 16px;
    }
    
    /* Info Section */
    .info-section {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 16px;
    }
    
    .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 14px;
        background: #f9fafb;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        transition: all 0.2s;
    }
    
    .info-item:hover {
        border-color: #d1d5db;
    }
    
    .info-item.pin-highlight {
        background: #f0fdf4;
        border-color: #bbf7d0;
    }
    
    .info-label {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        font-weight: 500;
        color: #6b7280;
    }
    
    .info-value-group {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .info-value {
        font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
        font-size: 13px;
        font-weight: 600;
        color: #374151;
        background: white;
        padding: 4px 10px;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
    }
    
    .info-value.pin {
        font-size: 15px;
        letter-spacing: 2px;
        color: #059669;
        border-color: #a7f3d0;
        background: white;
    }
    
    .info-value.link {
        font-size: 11px;
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    /* Copy Button */
    .copy-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        background: #f3f4f6;
        border-radius: 6px;
        cursor: pointer;
        color: #6b7280;
        transition: all 0.2s;
    }
    
    .copy-btn:hover {
        background: #e5e7eb;
        color: #374151;
    }
    
    .copy-btn.copied {
        background: #d1fae5;
        color: #059669;
    }
    
    /* Copy All Button */
    .copy-all-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px;
        border: 1px solid #e5e7eb;
        background: white;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        color: #6b7280;
        transition: all 0.2s;
    }
    
    .copy-all-btn:hover {
        border-color: #d1d5db;
        background: #f9fafb;
        color: #374151;
    }
    
    .copy-all-btn.copied {
        border-color: #a7f3d0;
        background: #f0fdf4;
        color: #059669;
    }
    
    /* Divider */
    .divider {
        display: flex;
        align-items: center;
        margin: 20px 0 16px;
    }
    
    .divider::before,
    .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #e5e7eb;
    }
    
    .divider span {
        padding: 0 12px;
        font-size: 11px;
        font-weight: 500;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    /* Share Buttons */
    .share-buttons {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .button-row {
        display: flex;
        gap: 10px;
    }
    
    .share-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 16px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s;
        position: relative;
    }
    
    .share-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .share-btn .badge {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 16px;
        height: 16px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    /* WhatsApp Button */
    .share-btn.whatsapp {
        background: #22c55e;
        color: white;
    }
    
    .share-btn.whatsapp:hover {
        background: #16a34a;
    }
    
    /* WhatsApp Web Button */
    .share-btn.whatsapp-web {
        background: #0d9488;
        color: white;
    }
    
    .share-btn.whatsapp-web:hover {
        background: #0f766e;
    }
    
    /* Email Button */
    .share-btn.email {
        background: #6b7280;
        color: white;
    }
    
    .share-btn.email:hover {
        background: #4b5563;
    }
    
    .share-btn.email.success {
        background: #22c55e;
    }
    
    /* Email Input Section */
    .email-input-section {
        margin-top: 12px;
        padding: 14px;
        background: #f9fafb;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
    }
    
    .email-input-section label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;
        margin-bottom: 8px;
    }
    
    .email-input-group {
        display: flex;
        gap: 8px;
    }
    
    .email-input-group input {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 13px;
        outline: none;
        transition: border-color 0.2s;
    }
    
    .email-input-group input:focus {
        border-color: #6b7280;
    }
    
    .email-input-group input.error {
        border-color: #ef4444;
    }
    
    .send-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        background: #6b7280;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s;
    }
    
    .send-btn:hover:not(:disabled) {
        background: #4b5563;
    }
    
    .send-btn:disabled {
        background: #d1d5db;
        cursor: not-allowed;
    }
    
    .error-text {
        margin: 8px 0 0;
        font-size: 12px;
        color: #ef4444;
    }
    
    /* Status Message */
    .status-message {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 6px;
        font-size: 12px;
        margin-top: 12px;
    }
    
    .status-message.success {
        background: #f0fdf4;
        color: #059669;
        border: 1px solid #a7f3d0;
    }
    
    .status-message.error {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
    }
    
    /* Animate spin */
    :global(.animate-spin) {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    /* Responsive */
    @media (max-width: 400px) {
        .share-container {
            padding: 16px;
        }
        
        .info-value.link {
            max-width: 100px;
            font-size: 10px;
        }
        
        .share-btn {
            padding: 10px 12px;
            font-size: 12px;
        }
    }
</style>