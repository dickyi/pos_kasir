<!-- 
============================================
SHARE MODAL COMPONENT
File: src/lib/components/tenant/users/modals/ShareModal.svelte

Modal untuk share info login kasir yang sudah ada
Berbeda dengan ShareWhatsApp yang bisa standalone,
ini adalah modal penuh dengan backdrop

Props:
- show: boolean
- user: Object { id, nama, email, no_telepon, pin }
- kodeToko: string
- namaToko: string

Events:
- on:close
- on:shared (detail: { method, success })
============================================
-->

<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import ShareWhatsApp from '../ShareWhatsApp.svelte';
    
    // ================================
    // PROPS
    // ================================
    
    export let show = false;
    export let user = null;
    export let kodeToko = '';
    export let namaToko = '';
    
    // ================================
    // STATE
    // ================================
    
    const dispatch = createEventDispatcher();
    
    // ================================
    // COMPUTED (with null safety)
    // ================================
    
    $: safeUser = user || {};
    $: pin = safeUser.pin || safeUser.pin_kasir || '';
    $: hasPin = pin && pin.length === 6;
    $: userName = safeUser.nama || 'Kasir';
    $: userInitial = userName.charAt(0).toUpperCase();
    
    // ================================
    // HANDLERS
    // ================================
    
    function handleClose() {
        dispatch('close');
    }
    
    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    }
    
    function handleKeydown(e) {
        if (e.key === 'Escape' && show) {
            handleClose();
        }
    }
    
    function handleShared(e) {
        dispatch('shared', e.detail);
    }
</script>

<!-- ================================ -->
<!-- TEMPLATE -->
<!-- ================================ -->

<svelte:window on:keydown={handleKeydown} />

{#if show && user}
    <!-- Backdrop -->
    <div 
        class="modal-backdrop"
        on:click={handleBackdropClick}
        on:keydown={handleKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        transition:fade={{ duration: 200 }}
    >
        <!-- Modal -->
        <div 
            class="modal"
            transition:fly={{ y: 50, duration: 300 }}
        >
            <!-- Header -->
            <div class="modal-header">
                <div class="header-content">
                    <div class="header-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                    </div>
                    <div>
                        <h2 id="share-modal-title">Share Info Login</h2>
                        <p class="subtitle">{userName}</p>
                    </div>
                </div>
                <button 
                    class="close-btn"
                    on:click={handleClose}
                    aria-label="Tutup"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <!-- Body -->
            <div class="modal-body">
                {#if hasPin}
                    <!-- User Info Preview -->
                    <div class="user-preview">
                        <div class="avatar">
                            {userInitial}
                        </div>
                        <div class="user-info">
                            <h4>{userName}</h4>
                            <div class="user-details">
                                {#if safeUser.email}
                                    <span class="detail-item">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                        </svg>
                                        {safeUser.email}
                                    </span>
                                {/if}
                                {#if safeUser.no_telepon}
                                    <span class="detail-item">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                        </svg>
                                        {safeUser.no_telepon}
                                    </span>
                                {/if}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Share Component -->
                    <ShareWhatsApp 
                        user={safeUser}
                        {kodeToko}
                        {namaToko}
                        show={true}
                        compact={false}
                        on:shared={handleShared}
                    />
                {:else}
                    <!-- No PIN Warning -->
                    <div class="no-pin-warning">
                        <div class="warning-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                        <h3>PIN Belum Dibuat</h3>
                        <p>Kasir ini belum memiliki PIN. Silakan buat PIN terlebih dahulu sebelum dapat membagikan info login.</p>
                        <button class="set-pin-btn" on:click={handleClose}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            Buat PIN Dulu
                        </button>
                    </div>
                {/if}
            </div>
            
            <!-- Footer -->
            <div class="modal-footer">
                <button class="cancel-btn" on:click={handleClose}>
                    Tutup
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- ================================ -->
<!-- STYLES -->
<!-- ================================ -->

<style>
    /* Backdrop */
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        z-index: 1000;
        overflow-y: auto;
    }
    
    /* Modal */
    .modal {
        background: white;
        border-radius: 16px;
        width: 100%;
        max-width: 440px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    
    /* Header */
    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
        background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    }
    
    .header-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .header-icon {
        width: 44px;
        height: 44px;
        background: #10b981;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
    }
    
    .modal-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
    }
    
    .subtitle {
        margin: 2px 0 0;
        font-size: 13px;
        color: #6b7280;
    }
    
    .close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        border-radius: 8px;
        cursor: pointer;
        color: #6b7280;
        transition: all 0.2s;
    }
    
    .close-btn:hover {
        background: #f3f4f6;
        color: #1f2937;
    }
    
    /* Body */
    .modal-body {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
    }
    
    /* User Preview */
    .user-preview {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #f9fafb;
        border-radius: 12px;
        margin-bottom: 20px;
        border: 1px solid #e5e7eb;
    }
    
    .avatar {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 700;
        color: white;
    }
    
    .user-info h4 {
        margin: 0 0 4px;
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
    }
    
    .user-details {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }
    
    .detail-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #6b7280;
    }
    
    .detail-item svg {
        color: #9ca3af;
    }
    
    /* No PIN Warning */
    .no-pin-warning {
        text-align: center;
        padding: 32px 20px;
    }
    
    .warning-icon {
        width: 80px;
        height: 80px;
        background: #fef3c7;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        color: #d97706;
    }
    
    .no-pin-warning h3 {
        margin: 0 0 8px;
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
    }
    
    .no-pin-warning p {
        margin: 0 0 24px;
        font-size: 14px;
        color: #6b7280;
        line-height: 1.6;
    }
    
    .set-pin-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: #f59e0b;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
    }
    
    .set-pin-btn:hover {
        background: #d97706;
    }
    
    /* Footer */
    .modal-footer {
        padding: 16px 24px;
        border-top: 1px solid #e5e7eb;
        background: #f9fafb;
        display: flex;
        justify-content: flex-end;
    }
    
    .cancel-btn {
        padding: 10px 20px;
        background: #e5e7eb;
        color: #374151;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .cancel-btn:hover {
        background: #d1d5db;
    }
    
    /* Responsive */
    @media (max-width: 480px) {
        .modal-backdrop {
            padding: 12px;
            align-items: flex-end;
        }
        
        .modal {
            max-height: 95vh;
            border-radius: 16px 16px 0 0;
        }
        
        .modal-header {
            padding: 16px 20px;
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .user-preview {
            padding: 12px;
        }
        
        .avatar {
            width: 40px;
            height: 40px;
            font-size: 18px;
        }
    }
</style>