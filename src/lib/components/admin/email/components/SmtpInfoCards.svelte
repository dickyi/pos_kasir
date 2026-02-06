<!-- ============================================
SMTP INFO CARDS COMPONENT
File: src/lib/components/admin/email/components/SmtpInfoCards.svelte

Displays SMTP configuration info for popular providers:
- Gmail
- Zoho
- Outlook
- Custom
============================================ -->

<script>
    import { Mail, ExternalLink, Copy, Check, Info } from 'lucide-svelte';
    import { SMTP_PRESETS } from '../utils/helpers.js';
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    // Props
    export let providers = ['gmail', 'zoho'];
    export let showCopyButton = true;
    
    // State
    let copiedField = null;
    
    // Provider display config
    const providerConfig = {
        gmail: {
            name: 'Gmail SMTP',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            iconColor: 'text-blue-600',
            textColor: 'text-blue-800',
            codeColor: 'bg-blue-100'
        },
        gmail_ssl: {
            name: 'Gmail (SSL)',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            iconColor: 'text-blue-600',
            textColor: 'text-blue-800',
            codeColor: 'bg-blue-100'
        },
        zoho: {
            name: 'Zoho Mail SMTP',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            iconColor: 'text-orange-600',
            textColor: 'text-orange-800',
            codeColor: 'bg-orange-100'
        },
        outlook: {
            name: 'Outlook / Office 365',
            bgColor: 'bg-cyan-50',
            borderColor: 'border-cyan-200',
            iconColor: 'text-cyan-600',
            textColor: 'text-cyan-800',
            codeColor: 'bg-cyan-100'
        },
        yahoo: {
            name: 'Yahoo Mail',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            iconColor: 'text-purple-600',
            textColor: 'text-purple-800',
            codeColor: 'bg-purple-100'
        }
    };
    
    // Copy to clipboard
    async function copyToClipboard(text, field) {
        try {
            await navigator.clipboard.writeText(text);
            copiedField = field;
            setTimeout(() => {
                copiedField = null;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }
    
    // Apply preset to form
    function applyPreset(provider) {
        const preset = SMTP_PRESETS[provider];
        if (preset) {
            dispatch('apply', { provider, preset });
        }
    }
</script>

<div class="mt-6 grid sm:grid-cols-2 gap-4">
    {#each providers as provider}
        {@const preset = SMTP_PRESETS[provider]}
        {@const config = providerConfig[provider]}
        
        {#if preset && config}
            <div class="{config.bgColor} border {config.borderColor} rounded-xl p-4 transition-all hover:shadow-md">
                <!-- Header -->
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <Mail size={18} class={config.iconColor} />
                        <span class="font-semibold {config.textColor}">{config.name}</span>
                    </div>
                    
                    <button
                        on:click={() => applyPreset(provider)}
                        class="text-xs font-medium {config.textColor} hover:underline flex items-center gap-1"
                    >
                        Terapkan
                        <ExternalLink size={12} />
                    </button>
                </div>
                
                <!-- Info -->
                <div class="text-xs {config.textColor} space-y-1.5">
                    <div class="flex items-center gap-2">
                        <span class="text-gray-600 w-12">Host</span>
                        <code class="{config.codeColor} px-1.5 py-0.5 rounded flex-1">{preset.host}</code>
                        {#if showCopyButton}
                            <button 
                                on:click={() => copyToClipboard(preset.host, `${provider}-host`)}
                                class="p-1 hover:bg-white/50 rounded transition-colors"
                                title="Copy"
                            >
                                {#if copiedField === `${provider}-host`}
                                    <Check size={12} class="text-emerald-600" />
                                {:else}
                                    <Copy size={12} class="opacity-60" />
                                {/if}
                            </button>
                        {/if}
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <span class="text-gray-600 w-12">Port</span>
                        <code class="{config.codeColor} px-1.5 py-0.5 rounded">{preset.port}</code>
                        <span class="text-gray-500">({preset.encryption.toUpperCase()})</span>
                    </div>
                    
                    {#if preset.note}
                        <div class="flex items-start gap-2 mt-2 pt-2 border-t border-white/50">
                            <Info size={12} class="flex-shrink-0 mt-0.5 opacity-70" />
                            <span class="opacity-80">{preset.note}</span>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    {/each}
</div>

<!-- App Password Info -->
<div class="mt-4 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
    <Info size={18} class="text-amber-600 flex-shrink-0 mt-0.5" />
    <div>
        <p class="font-medium text-amber-800 text-sm">Tentang App Password</p>
        <p class="text-xs text-amber-700 mt-1">
            Untuk Gmail dan Yahoo, Anda perlu menggunakan <strong>App Password</strong> 
            bukan password akun biasa. Aktifkan 2FA terlebih dahulu, lalu buat App Password di pengaturan keamanan akun.
        </p>
        <a 
            href="https://support.google.com/accounts/answer/185833" 
            target="_blank" 
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-medium mt-2"
        >
            Pelajari cara membuat App Password
            <ExternalLink size={12} />
        </a>
    </div>
</div>