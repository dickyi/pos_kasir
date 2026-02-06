<script>
    import { enhance } from '$app/forms';
    import { 
        Settings, Save, Building2, Phone, Mail, Globe, 
        Shield, Server, Bell, Users, Receipt, RefreshCw,
        Eye, EyeOff, Check, AlertTriangle, Send, RotateCcw,
        Facebook, Instagram, Twitter, Youtube, Music2,
        Search, Clock, DollarSign, Lock, FileText, Smartphone,
        AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronUp,
        MapPin, AtSign, Hash, Link, Image, Type, Sparkles,
        Info, Loader2
    } from 'lucide-svelte';
    
    export let data;
    export let form;
    
    $: settings = data?.settings || [];
    $: groupedSettings = data?.groupedSettings || {};
    
    // State
    let activeTab = 'general';
    let notification = null;
    let testEmail = '';
    let isTesting = false;
    let showPasswords = {};
    let isSaving = false;
    
    // Tab configuration
    const tabs = [
        { id: 'general', label: 'Aplikasi', icon: Building2, color: 'emerald', desc: 'Informasi aplikasi' },
        { id: 'contact', label: 'Kontak', icon: Phone, color: 'blue', desc: 'Info kontak' },
        { id: 'social', label: 'Social Media', icon: Globe, color: 'pink', desc: 'Link sosial media' },
        { id: 'seo', label: 'SEO', icon: Search, color: 'orange', desc: 'Optimasi SEO' },
        { id: 'system', label: 'Sistem', icon: Server, color: 'slate', desc: 'Konfigurasi sistem' },
        { id: 'smtp', label: 'Email SMTP', icon: Mail, color: 'violet', desc: 'Server email' },
        { id: 'security', label: 'Keamanan', icon: Shield, color: 'red', desc: 'Proteksi keamanan' },
        { id: 'notification', label: 'Notifikasi', icon: Bell, color: 'amber', desc: 'Pengaturan notif' },
        { id: 'tenant', label: 'Tenant', icon: Users, color: 'cyan', desc: 'Default tenant' },
        { id: 'receipt', label: 'Struk', icon: Receipt, color: 'teal', desc: 'Format struk' }
    ];
    
    $: currentTab = tabs.find(t => t.id === activeTab) || tabs[0];
    
    // Icon mapping
    const settingIcons = {
        'app_name': Type, 'app_tagline': Type, 'app_logo': Image, 'app_favicon': Image,
        'app_description': FileText, 'app_version': Hash, 'app_copyright': FileText,
        'contact_email': Mail, 'contact_phone': Phone, 'contact_whatsapp': Smartphone,
        'contact_address': MapPin, 'social_facebook': Facebook, 'social_instagram': Instagram,
        'social_twitter': Twitter, 'social_youtube': Youtube, 'social_tiktok': Music2,
        'seo_title': Type, 'seo_description': FileText, 'seo_keywords': Hash,
        'system_timezone': Clock, 'system_currency': DollarSign, 'system_currency_symbol': DollarSign,
        'maintenance_mode': AlertTriangle, 'security_max_login_attempts': Lock,
        'security_session_timeout': Clock, 'security_password_min_length': Lock,
        'smtp_host': Server, 'smtp_port': Hash, 'smtp_username': Mail, 'smtp_password': Lock,
        'default': Settings
    };
    
    function getSettingIcon(key) {
        return settingIcons[key] || settingIcons['default'];
    }
    
    function showNotification(message, type = 'success') {
        notification = { message, type };
        setTimeout(() => notification = null, 4000);
    }
    
    $: if (form?.success) {
        showNotification(form.message, 'success');
        isSaving = false;
    }
    $: if (form?.success === false) {
        showNotification(form.message, 'error');
        isSaving = false;
    }
    
    function getSettingValue(key) {
        const setting = settings.find(s => s.setting_key === key);
        return setting?.setting_value || '';
    }
    
    function isPassword(key) {
        return key.includes('password') || key.includes('secret') || key.includes('api_key');
    }
    
    function togglePassword(key) {
        showPasswords[key] = !showPasswords[key];
        showPasswords = showPasswords;
    }
    
    $: isMaintenanceMode = getSettingValue('maintenance_mode') === 'true';
    
    async function handleSmtpTest() {
        if (!testEmail) {
            showNotification('Masukkan email tujuan terlebih dahulu', 'error');
            return;
        }
        
        isTesting = true;
        
        try {
            const formData = new FormData();
            formData.append('test_email', testEmail);
            
            const response = await fetch('?/testSmtp', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            let data;
            
            if (result.type === 'success') {
                data = result.data ? JSON.parse(result.data) : result;
            } else if (result.type === 'failure') {
                data = result.data ? JSON.parse(result.data) : result;
            } else {
                data = result;
            }
            
            if (data.success || data?.[0]?.success) {
                showNotification(data.message || data?.[0]?.message || 'Test berhasil!', 'success');
            } else {
                showNotification(data.message || data?.[0]?.message || 'Test gagal', 'error');
            }
        } catch (error) {
            console.error('SMTP test error:', error);
            showNotification('Gagal mengirim test email', 'error');
        } finally {
            isTesting = false;
        }
    }
    
    const resettableCategories = ['system', 'security', 'tenant', 'notification', 'receipt'];
</script>

<svelte:head>
    <title>Pengaturan Umum - Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
    <div class="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        <!-- ============================================
        HEADER - Enhanced
        ============================================ -->
        <header class="mb-6">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <!-- Title Section -->
                <div>
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 
                                    flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <Settings size={24} class="text-white" />
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold text-gray-900">Pengaturan Umum</h1>
                            <p class="text-sm text-gray-500 mt-0.5">Kelola konfigurasi aplikasi dan sistem</p>
                        </div>
                    </div>
                </div>
                
                <!-- Maintenance Mode Toggle - Enhanced -->
                <form method="POST" action="?/toggleMaintenance" use:enhance>
                    <input type="hidden" name="enabled" value={isMaintenanceMode ? 'false' : 'true'} />
                    <button 
                        type="submit"
                        class="flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-200
                               {isMaintenanceMode 
                                 ? 'bg-amber-50 border-amber-300 hover:bg-amber-100' 
                                 : 'bg-white border-gray-200 hover:border-gray-300'}"
                    >
                        <div class="flex items-center gap-2">
                            <AlertTriangle 
                                size={20} 
                                class="{isMaintenanceMode ? 'text-amber-600' : 'text-gray-400'} transition-colors" 
                            />
                            <span class="text-sm font-semibold {isMaintenanceMode ? 'text-amber-900' : 'text-gray-600'}">
                                Maintenance Mode
                            </span>
                        </div>
                        <div class="relative">
                            <div class="w-12 h-6 rounded-full transition-colors duration-300
                                        {isMaintenanceMode ? 'bg-amber-500' : 'bg-gray-300'}">
                                <div class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md 
                                            transition-transform duration-300
                                            {isMaintenanceMode ? 'translate-x-6' : 'translate-x-0'}">
                                </div>
                            </div>
                        </div>
                    </button>
                </form>
            </div>
        </header>
        
        <!-- ============================================
        NOTIFICATION TOAST - Enhanced
        ============================================ -->
        {#if notification}
            <div class="mb-6 animate-slide-in">
                <div class="flex items-center gap-3 px-5 py-4 rounded-2xl shadow-lg border-2
                            {notification.type === 'success' 
                              ? 'bg-emerald-50 border-emerald-200' 
                              : 'bg-red-50 border-red-200'}">
                    <div class="flex-shrink-0">
                        {#if notification.type === 'success'}
                            <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckCircle size={20} class="text-emerald-600" />
                            </div>
                        {:else}
                            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle size={20} class="text-red-600" />
                            </div>
                        {/if}
                    </div>
                    <span class="text-sm font-medium {notification.type === 'success' ? 'text-emerald-800' : 'text-red-800'}">
                        {notification.message}
                    </span>
                </div>
            </div>
        {/if}
        
        <!-- ============================================
        MAIN LAYOUT - Optimized Grid (240px sidebar)
        ============================================ -->
        <div class="grid lg:grid-cols-[240px_1fr] gap-6">
            
            <!-- ============================================
            SIDEBAR - Compact & Sticky (Professional)
            ============================================ -->
            <aside class="space-y-2">
                <nav class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden 
                            sticky top-20 self-start 
                            max-h-[calc(100vh-6rem)] overflow-y-auto
                            scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    <div class="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={12} />
                            Kategori
                        </h3>
                    </div>
                    <div class="p-2 space-y-0.5">
                        {#each tabs as tab}
                            <button
                                type="button"
                                on:click={() => activeTab = tab.id}
                                class="w-full group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium 
                                       transition-all duration-200
                                       {activeTab === tab.id 
                                         ? 'bg-gray-900 text-white shadow-lg' 
                                         : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
                            >
                                <!-- Active Indicator -->
                                {#if activeTab === tab.id}
                                    <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full"></div>
                                {/if}
                                
                                <!-- Icon -->
                                <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                                            {activeTab === tab.id 
                                              ? 'bg-white/10' 
                                              : 'bg-gray-100 group-hover:bg-gray-200'}">
                                    <svelte:component 
                                        this={tab.icon} 
                                        size={16} 
                                        class="{activeTab === tab.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}"
                                    />
                                </div>
                                
                                <!-- Label & Description -->
                                <div class="flex-1 text-left min-w-0">
                                    <div class="font-semibold truncate">{tab.label}</div>
                                    <div class="text-[10px] leading-tight truncate {activeTab === tab.id ? 'text-gray-300' : 'text-gray-400'}">
                                        {tab.desc}
                                    </div>
                                </div>
                                
                                <!-- Status Indicators -->
                                {#if tab.id === 'smtp' && getSettingValue('smtp_enabled') === 'true'}
                                    <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                                {/if}
                                {#if tab.id === 'system' && isMaintenanceMode}
                                    <span class="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse flex-shrink-0"></span>
                                {/if}
                            </button>
                        {/each}
                    </div>
                </nav>
            </aside>
            
            <!-- ============================================
            MAIN CONTENT - Enhanced
            ============================================ -->
            <main class="space-y-6">
                <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    
                    <!-- Tab Header - Enhanced -->
                    <div class="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 via-white to-gray-50">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 
                                        flex items-center justify-center shadow-inner">
                                <svelte:component this={currentTab.icon} size={24} class="text-gray-600" />
                            </div>
                            <div class="flex-1">
                                <h2 class="text-2xl font-bold text-gray-900">{currentTab.label}</h2>
                                <p class="text-sm text-gray-500 mt-1">{currentTab.desc}</p>
                            </div>
                            {#if activeTab === currentTab.id}
                                <div class="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                    AKTIF
                                </div>
                            {/if}
                        </div>
                    </div>
                    
                    <!-- Settings Form - Enhanced -->
                    <form method="POST" action="?/updateBatch" use:enhance class="p-6">
                        <input type="hidden" name="category" value={activeTab} />
                        
                        {#if groupedSettings[activeTab]?.length > 0}
                            <div class="space-y-5">
                                {#each groupedSettings[activeTab] as setting, i (setting.id)}
                                    <div class="group relative">
                                        <!-- Setting Item - Enhanced -->
                                        <label class="block">
                                            <div class="flex items-start gap-4">
                                                <!-- Icon Container -->
                                                <div class="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 
                                                            flex items-center justify-center shadow-sm
                                                            group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                                                    <svelte:component 
                                                        this={getSettingIcon(setting.setting_key)} 
                                                        size={20} 
                                                        class="text-gray-600"
                                                    />
                                                </div>
                                                
                                                <!-- Content -->
                                                <div class="flex-1 min-w-0">
                                                    <!-- Label & Badges -->
                                                    <div class="flex items-center gap-2 mb-2">
                                                        <span class="text-sm font-semibold text-gray-900">
                                                            {setting.label || setting.setting_key}
                                                        </span>
                                                        {#if setting.setting_type === 'boolean'}
                                                            <span class="px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-100 text-blue-700 rounded-full">
                                                                Toggle
                                                            </span>
                                                        {/if}
                                                        {#if setting.setting_type === 'number'}
                                                            <span class="px-2 py-0.5 text-[10px] font-bold uppercase bg-purple-100 text-purple-700 rounded-full">
                                                                Number
                                                            </span>
                                                        {/if}
                                                        {#if setting.is_required}
                                                            <span class="px-2 py-0.5 text-[10px] font-bold uppercase bg-red-100 text-red-700 rounded-full">
                                                                Required
                                                            </span>
                                                        {/if}
                                                    </div>
                                                    
                                                    <!-- Description -->
                                                    {#if setting.description}
                                                        <p class="text-xs text-gray-500 mb-3 leading-relaxed">{setting.description}</p>
                                                    {/if}
                                                    
                                                    <!-- Input Fields - Enhanced -->
                                                    {#if setting.setting_type === 'boolean'}
                                                        <div class="flex items-center gap-3 py-1">
                                                            <label class="relative inline-flex items-center cursor-pointer group/toggle">
                                                                <input 
                                                                    type="checkbox" 
                                                                    name="setting_{setting.setting_key}"
                                                                    checked={setting.setting_value === 'true'}
                                                                    value="true"
                                                                    class="sr-only peer"
                                                                />
                                                                <div class="w-14 h-7 bg-gray-200 rounded-full peer 
                                                                            peer-focus:ring-4 peer-focus:ring-emerald-100
                                                                            peer-checked:bg-emerald-600
                                                                            transition-all duration-300">
                                                                    <div class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md 
                                                                                transition-all duration-300 peer-checked:translate-x-7">
                                                                    </div>
                                                                </div>
                                                            </label>
                                                            <span class="text-sm font-medium {setting.setting_value === 'true' ? 'text-emerald-700' : 'text-gray-500'}">
                                                                {setting.setting_value === 'true' ? 'Aktif' : 'Nonaktif'}
                                                            </span>
                                                        </div>
                                                    {:else if setting.setting_type === 'json' || setting.setting_type === 'html'}
                                                        <textarea
                                                            name="setting_{setting.setting_key}"
                                                            rows="5"
                                                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm
                                                                   {setting.setting_type === 'json' ? 'font-mono' : ''}
                                                                   focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50
                                                                   bg-gray-50 hover:bg-white transition-colors duration-200
                                                                   resize-none placeholder:text-gray-400"
                                                            placeholder={setting.placeholder || ''}
                                                        >{setting.setting_value || ''}</textarea>
                                                    {:else if isPassword(setting.setting_key)}
                                                        <div class="relative">
                                                            <input
                                                                type={showPasswords[setting.setting_key] ? 'text' : 'password'}
                                                                name="setting_{setting.setting_key}"
                                                                value={setting.setting_value || ''}
                                                                class="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl text-sm
                                                                       focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50
                                                                       bg-gray-50 hover:bg-white transition-colors duration-200
                                                                       placeholder:text-gray-400"
                                                                placeholder="••••••••"
                                                            />
                                                            <button 
                                                                type="button"
                                                                on:click={() => togglePassword(setting.setting_key)}
                                                                class="absolute right-4 top-1/2 -translate-y-1/2 
                                                                       text-gray-400 hover:text-gray-600 transition-colors"
                                                            >
                                                                {#if showPasswords[setting.setting_key]}
                                                                    <EyeOff size={18} />
                                                                {:else}
                                                                    <Eye size={18} />
                                                                {/if}
                                                            </button>
                                                        </div>
                                                    {:else if setting.setting_type === 'number'}
                                                        <input
                                                            type="number"
                                                            name="setting_{setting.setting_key}"
                                                            value={setting.setting_value || ''}
                                                            min="0"
                                                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm
                                                                   focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50
                                                                   bg-gray-50 hover:bg-white transition-colors duration-200
                                                                   placeholder:text-gray-400"
                                                            placeholder={setting.placeholder || '0'}
                                                        />
                                                    {:else if setting.setting_type === 'image'}
                                                        <div class="space-y-3">
                                                            <input
                                                                type="text"
                                                                name="setting_{setting.setting_key}"
                                                                value={setting.setting_value || ''}
                                                                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm
                                                                       focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50
                                                                       bg-gray-50 hover:bg-white transition-colors duration-200
                                                                       placeholder:text-gray-400"
                                                                placeholder="/images/logo.png atau URL"
                                                            />
                                                            {#if setting.setting_value}
                                                                <div class="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                                                    <Image size={14} class="text-blue-600" />
                                                                    <span class="text-xs text-blue-700 font-medium truncate">
                                                                        {setting.setting_value}
                                                                    </span>
                                                                </div>
                                                            {/if}
                                                        </div>
                                                    {:else}
                                                        <input
                                                            type="text"
                                                            name="setting_{setting.setting_key}"
                                                            value={setting.setting_value || ''}
                                                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm
                                                                   focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50
                                                                   bg-gray-50 hover:bg-white transition-colors duration-200
                                                                   placeholder:text-gray-400"
                                                            placeholder={setting.placeholder || setting.label || ''}
                                                        />
                                                    {/if}
                                                </div>
                                            </div>
                                        </label>
                                        
                                        <!-- Divider (except last item) -->
                                        {#if i < groupedSettings[activeTab].length - 1}
                                            <div class="mt-6 border-t border-gray-100"></div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                            
                            <!-- SMTP Test Section - Enhanced -->
                            {#if activeTab === 'smtp'}
                                <div class="mt-8 p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl">
                                    <h4 class="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                                        <Send size={18} />
                                        Test Koneksi SMTP
                                    </h4>
                                    <div class="flex flex-col sm:flex-row gap-3">
                                        <input
                                            type="email"
                                            bind:value={testEmail}
                                            placeholder="Email untuk test..."
                                            class="flex-1 px-4 py-3 border-2 border-blue-200 rounded-xl text-sm 
                                                   focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                                                   bg-white placeholder:text-gray-400"
                                        />
                                        <button
                                            type="button"
                                            on:click={handleSmtpTest}
                                            disabled={!testEmail || isTesting}
                                            class="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold 
                                                   hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed 
                                                   flex items-center justify-center gap-2 transition-all duration-200
                                                   shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40
                                                   min-w-[140px]"
                                        >
                                            {#if isTesting}
                                                <Loader2 size={18} class="animate-spin" />
                                                <span>Testing...</span>
                                            {:else}
                                                <Send size={18} />
                                                <span>Kirim Test</span>
                                            {/if}
                                        </button>
                                    </div>
                                    <p class="text-xs text-blue-700 mt-3 flex items-center gap-1.5">
                                        <Info size={12} />
                                        Pastikan SMTP sudah diaktifkan dan dikonfigurasi sebelum test.
                                    </p>
                                </div>
                            {/if}
                            
                            <!-- Action Buttons - Enhanced -->
                            <div class="mt-8 flex items-center justify-between pt-8 border-t-2 border-gray-100">
                                {#if resettableCategories.includes(activeTab)}
                                    <form 
                                        method="POST" 
                                        action="?/resetCategory" 
                                        use:enhance
                                        on:submit|preventDefault={(e) => {
                                            if (confirm(`Reset semua setting ${currentTab.label} ke default?`)) {
                                                e.target.submit();
                                            }
                                        }}
                                    >
                                        <input type="hidden" name="category" value={activeTab} />
                                        <button 
                                            type="submit"
                                            class="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold
                                                   text-gray-600 hover:text-gray-900 
                                                   bg-gray-100 hover:bg-gray-200 
                                                   rounded-xl transition-all duration-200
                                                   border-2 border-transparent hover:border-gray-300"
                                        >
                                            <RotateCcw size={18} />
                                            Reset ke Default
                                        </button>
                                    </form>
                                {:else}
                                    <div></div>
                                {/if}
                                
                                <button
                                    type="submit"
                                    on:click={() => isSaving = true}
                                    disabled={isSaving}
                                    class="inline-flex items-center gap-2 px-8 py-3 
                                           bg-emerald-600 hover:bg-emerald-700 text-white 
                                           rounded-xl text-sm font-bold 
                                           shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40
                                           transition-all duration-200
                                           disabled:opacity-50 disabled:cursor-not-allowed
                                           min-w-[160px] justify-center"
                                >
                                    {#if isSaving}
                                        <Loader2 size={20} class="animate-spin" />
                                        <span>Menyimpan...</span>
                                    {:else}
                                        <Save size={20} />
                                        <span>Simpan Perubahan</span>
                                    {/if}
                                </button>
                            </div>
                        {:else}
                            <!-- Empty State - Enhanced -->
                            <div class="py-20 text-center">
                                <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Settings size={40} class="text-gray-300" />
                                </div>
                                <h3 class="text-lg font-semibold text-gray-900 mb-2">Belum Ada Setting</h3>
                                <p class="text-sm text-gray-500 mb-6">Kategori ini belum memiliki pengaturan</p>
                                <button class="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">
                                    Tambah Setting
                                </button>
                            </div>
                        {/if}
                    </form>
                </div>
                
                <!-- Info Cards - Enhanced -->
                {#if activeTab === 'smtp'}
                    <div class="grid md:grid-cols-2 gap-4">
                        <div class="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-2xl">
                            <h4 class="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                                📧 Gmail SMTP
                            </h4>
                            <div class="text-xs text-amber-800 space-y-2 leading-relaxed">
                                <p><strong>Host:</strong> smtp.gmail.com</p>
                                <p><strong>Port:</strong> 587 (TLS) atau 465 (SSL)</p>
                                <p><strong>Note:</strong> Gunakan App Password, bukan password biasa</p>
                            </div>
                        </div>
                        <div class="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl">
                            <h4 class="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                                📨 Zoho Mail SMTP
                            </h4>
                            <div class="text-xs text-blue-800 space-y-2 leading-relaxed">
                                <p><strong>Host:</strong> smtp.zoho.com</p>
                                <p><strong>Port:</strong> 587 (TLS) atau 465 (SSL)</p>
                                <p><strong>Username:</strong> Email lengkap Anda</p>
                            </div>
                        </div>
                    </div>
                {/if}
                
                {#if activeTab === 'security'}
                    <div class="p-6 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-2xl">
                        <h4 class="text-sm font-bold text-red-900 mb-3 flex items-center gap-2">
                            <AlertTriangle size={18} />
                            Perhatian Keamanan
                        </h4>
                        <p class="text-xs text-red-800 leading-relaxed">
                            Pengaturan keamanan yang terlalu ketat dapat mengganggu pengalaman pengguna. 
                            Sesuaikan dengan kebutuhan bisnis Anda. Session timeout yang terlalu pendek 
                            dapat membuat kasir harus login berulang kali.
                        </p>
                    </div>
                {/if}
                
                {#if activeTab === 'tenant'}
                    <div class="p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-200 rounded-2xl">
                        <h4 class="text-sm font-bold text-cyan-900 mb-3 flex items-center gap-2">
                            <Users size={18} />
                            Tentang Limit Tenant
                        </h4>
                        <p class="text-xs text-cyan-800 leading-relaxed">
                            Nilai <strong>0</strong> berarti <strong>unlimited</strong> (tidak terbatas). 
                            Pengaturan ini berlaku untuk tenant baru. Tenant yang sudah ada tidak akan terpengaruh.
                        </p>
                    </div>
                {/if}
            </main>
        </div>
    </div>
</div>

<style>
    @keyframes slide-in {
        from { 
            transform: translateY(-16px); 
            opacity: 0; 
        }
        to { 
            transform: translateY(0); 
            opacity: 1; 
        }
    }
    
    .animate-slide-in {
        animation: slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Smooth focus transitions */
    input:focus,
    textarea:focus {
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    
    /* Custom scrollbar for sidebar */
    .scrollbar-thin::-webkit-scrollbar {
        width: 4px;
    }
    
    .scrollbar-thin::-webkit-scrollbar-track {
        background: transparent;
    }
    
    .scrollbar-thin::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 2px;
    }
    
    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
    }
    
    /* Firefox scrollbar */
    .scrollbar-thin {
        scrollbar-width: thin;
        scrollbar-color: #d1d5db transparent;
    }
    
    /* Custom scrollbar for main content */
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    
    ::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
    }
</style>