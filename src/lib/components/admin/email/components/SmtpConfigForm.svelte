<!-- ============================================
SMTP CONFIG FORM COMPONENT
File: src/lib/components/admin/email/components/SmtpConfigForm.svelte

SMTP configuration form with:
- Dynamic form fields
- Password visibility toggle
- Status indicator
- Validation
============================================ -->

<script>
    import { enhance } from '$app/forms';
    import { 
        Server, Save, Eye, EyeOff, CheckCircle, AlertTriangle,
        Zap, Hash, AtSign, Lock, Shield, Users, Mail, Settings
    } from 'lucide-svelte';
    import { isPasswordField } from '../utils/helpers.js';
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    // Props
    export let settings = [];
    export let status = { configured: false, enabled: false, issues: [] };
    export let isLoading = false;
    
    // State
    let showPasswords = {};
    
    // Icon mapping
    const iconMap = {
        'smtp_enabled': Zap,
        'smtp_host': Server,
        'smtp_port': Hash,
        'smtp_username': AtSign,
        'smtp_password': Lock,
        'smtp_encryption': Shield,
        'smtp_from_name': Users,
        'smtp_from_email': Mail,
        'default': Settings
    };
    
    // Get icon for setting
    function getIcon(key) {
        return iconMap[key] || iconMap.default;
    }
    
    // Toggle password visibility
    function togglePassword(key) {
        showPasswords[key] = !showPasswords[key];
        showPasswords = showPasswords;
    }
    
    // Get setting value
    function getSettingValue(key) {
        const setting = settings.find(s => s.setting_key === key);
        return setting?.setting_value || '';
    }
    
    // Check if SMTP is enabled
    $: isSmtpEnabled = getSettingValue('smtp_enabled') === 'true';
    
    // Handle form result
    function handleResult({ result }) {
        dispatch('result', result);
    }
</script>

<div class="p-6">
    <!-- Status Header -->
    <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div class="flex items-center gap-3">
            <div class="p-2 {status.configured ? 'bg-emerald-100' : 'bg-amber-100'} rounded-lg">
                {#if status.configured}
                    <CheckCircle size={20} class="text-emerald-600" />
                {:else}
                    <AlertTriangle size={20} class="text-amber-600" />
                {/if}
            </div>
            <div>
                <p class="font-semibold text-gray-900">
                    {status.configured ? 'SMTP Terkonfigurasi' : 'SMTP Belum Dikonfigurasi'}
                </p>
                <p class="text-sm text-gray-500">
                    {status.enabled ? 'Aktif dan siap digunakan' : 'Tidak aktif'}
                </p>
            </div>
        </div>
        
        {#if status.issues?.length > 0}
            <div class="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                <AlertTriangle size={12} />
                {status.issues.length} masalah
            </div>
        {/if}
    </div>
    
    <!-- SMTP Form -->
    <form method="POST" action="?/updateSmtp" use:enhance={handleResult}>
        <div class="grid gap-4 sm:grid-cols-2">
            {#each settings as setting}
                {@const Icon = getIcon(setting.setting_key)}
                {@const isPassword = isPasswordField(setting.setting_key)}
                {@const isBoolean = setting.setting_type === 'boolean'}
                {@const isSelect = setting.setting_type === 'select'}
                {@const isFullWidth = setting.setting_key === 'smtp_enabled'}
                
                <div class="space-y-1.5 {isFullWidth ? 'sm:col-span-2' : ''}">
                    <!-- Label -->
                    <label class="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <svelte:component this={Icon} size={14} class="text-gray-400" />
                        {setting.display_name || setting.setting_key}
                        {#if setting.is_required}
                            <span class="text-red-500">*</span>
                        {/if}
                    </label>
                    
                    <!-- Input based on type -->
                    {#if isBoolean}
                        <!-- Toggle Switch -->
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="setting_{setting.setting_key}"
                                checked={setting.setting_value === 'true'}
                                class="sr-only peer"
                            />
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                                        peer-focus:ring-violet-300 rounded-full peer 
                                        peer-checked:after:translate-x-full peer-checked:after:border-white 
                                        after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                        after:bg-white after:border-gray-300 after:border after:rounded-full 
                                        after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600">
                            </div>
                            <span class="ml-3 text-sm text-gray-600">
                                {setting.setting_value === 'true' ? 'Aktif' : 'Nonaktif'}
                            </span>
                        </label>
                        
                    {:else if isSelect}
                        <!-- Select Dropdown -->
                        <select 
                            name="setting_{setting.setting_key}"
                            class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white
                                   focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                                   transition-colors"
                        >
                            {#each (setting.options || 'tls,ssl,none').split(',') as option}
                                <option value={option} selected={setting.setting_value === option}>
                                    {option.toUpperCase()}
                                </option>
                            {/each}
                        </select>
                        
                    {:else}
                        <!-- Text/Password Input -->
                        <div class="relative">
                            <input 
                                type={isPassword && !showPasswords[setting.setting_key] ? 'password' : 'text'}
                                name="setting_{setting.setting_key}"
                                value={setting.setting_value || ''}
                                placeholder={setting.placeholder || ''}
                                class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                                       focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                                       transition-colors
                                       {isPassword ? 'pr-10' : ''}"
                            />
                            
                            {#if isPassword}
                                <button 
                                    type="button"
                                    on:click={() => togglePassword(setting.setting_key)}
                                    class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 
                                           hover:text-gray-600 transition-colors"
                                    tabindex="-1"
                                >
                                    {#if showPasswords[setting.setting_key]}
                                        <EyeOff size={16} />
                                    {:else}
                                        <Eye size={16} />
                                    {/if}
                                </button>
                            {/if}
                        </div>
                    {/if}
                    
                    <!-- Description -->
                    {#if setting.description}
                        <p class="text-xs text-gray-500">{setting.description}</p>
                    {/if}
                </div>
            {/each}
        </div>
        
        <!-- Submit Button -->
        <div class="mt-6 flex justify-end pt-6 border-t border-gray-100">
            <button
                type="submit"
                disabled={isLoading}
                class="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl 
                       text-sm font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/20
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {#if isLoading}
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {:else}
                    <Save size={18} />
                {/if}
                Simpan SMTP
            </button>
        </div>
    </form>
</div>