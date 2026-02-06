<!-- ============================================
NOTIFICATION SETTINGS COMPONENT
File: src/lib/components/admin/email/components/NotificationSettings.svelte

Email notification preferences:
- Master toggle
- Individual notification toggles
- Admin email configuration
============================================ -->

<script>
    import { enhance } from '$app/forms';
    import { 
        Save, Bell, Mail, Users, Activity, AlertTriangle,
        AtSign, Settings, Info
    } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    // Props
    export let settings = [];
    export let smtpConfigured = false;
    export let isLoading = false;
    
    // Icon mapping
    const iconMap = {
        'notif_email_enabled': Mail,
        'notif_email_new_tenant': Users,
        'notif_email_new_transaction': Activity,
        'notif_email_low_stock': AlertTriangle,
        'notif_admin_email': AtSign,
        'default': Settings
    };
    
    // Description mapping
    const descriptionMap = {
        'notif_email_enabled': 'Aktifkan atau nonaktifkan semua notifikasi email',
        'notif_email_new_tenant': 'Terima email saat ada tenant baru mendaftar',
        'notif_email_new_transaction': 'Terima email untuk transaksi penting',
        'notif_email_low_stock': 'Terima peringatan saat stok produk menipis',
        'notif_admin_email': 'Email untuk menerima notifikasi admin'
    };
    
    // Get icon for setting
    function getIcon(key) {
        return iconMap[key] || iconMap.default;
    }
    
    // Get description
    function getDescription(setting) {
        return setting.description || descriptionMap[setting.setting_key] || '';
    }
    
    // Check if master toggle is enabled
    $: masterEnabled = settings.find(s => s.setting_key === 'notif_email_enabled')?.setting_value === 'true';
    
    // Handle form result
    function handleResult({ result }) {
        dispatch('result', result);
    }
</script>

<div class="p-6">
    <form method="POST" action="?/updateNotification" use:enhance={handleResult}>
        <div class="space-y-4">
            {#each settings as setting}
                {@const Icon = getIcon(setting.setting_key)}
                {@const isBoolean = setting.setting_type === 'boolean'}
                {@const isMaster = setting.setting_key === 'notif_email_enabled'}
                {@const isDisabled = !isMaster && !masterEnabled}
                
                <div class="flex items-center justify-between p-4 rounded-xl transition-all
                            {isMaster ? 'bg-violet-50 border border-violet-200' : 'bg-gray-50'}
                            {isDisabled ? 'opacity-50' : ''}">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <svelte:component this={Icon} size={18} 
                                class={isMaster ? 'text-violet-600' : 'text-amber-600'} />
                        </div>
                        <div>
                            <p class="font-medium text-gray-900">
                                {setting.display_name || setting.setting_key}
                            </p>
                            <p class="text-sm text-gray-500">
                                {getDescription(setting)}
                            </p>
                        </div>
                    </div>
                    
                    {#if isBoolean}
                        <!-- Toggle Switch -->
                        <label class="relative inline-flex items-center cursor-pointer
                                     {isDisabled ? 'pointer-events-none' : ''}">
                            <input 
                                type="checkbox" 
                                name="setting_{setting.setting_key}"
                                checked={setting.setting_value === 'true'}
                                disabled={isDisabled}
                                class="sr-only peer"
                            />
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                                        {isMaster ? 'peer-focus:ring-violet-300 peer-checked:bg-violet-600' : 'peer-focus:ring-amber-300 peer-checked:bg-amber-500'}
                                        rounded-full peer 
                                        peer-checked:after:translate-x-full peer-checked:after:border-white 
                                        after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                        after:bg-white after:border-gray-300 after:border after:rounded-full 
                                        after:h-5 after:w-5 after:transition-all
                                        peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">
                            </div>
                        </label>
                    {:else}
                        <!-- Text Input (for admin email) -->
                        <div class="w-64">
                            <input 
                                type={setting.setting_type === 'email' ? 'email' : 'text'}
                                name="setting_{setting.setting_key}"
                                value={setting.setting_value || ''}
                                placeholder={setting.placeholder || 'Masukkan nilai...'}
                                disabled={isDisabled}
                                class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                                       focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                                       transition-colors
                                       disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
        
        <!-- SMTP Warning -->
        {#if !smtpConfigured}
            <div class="mt-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle size={20} class="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p class="font-medium text-amber-800">SMTP Belum Dikonfigurasi</p>
                    <p class="text-sm text-amber-700 mt-1">
                        Notifikasi email tidak akan berfungsi sampai konfigurasi SMTP selesai. 
                        Silakan konfigurasi di tab <strong>SMTP</strong> terlebih dahulu.
                    </p>
                </div>
            </div>
        {/if}
        
        <!-- Master Disabled Warning -->
        {#if !masterEnabled && smtpConfigured}
            <div class="mt-6 flex items-start gap-3 p-4 bg-gray-100 border border-gray-200 rounded-xl">
                <Info size={20} class="text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p class="font-medium text-gray-700">Notifikasi Email Dinonaktifkan</p>
                    <p class="text-sm text-gray-600 mt-1">
                        Aktifkan toggle "Email Notifikasi" di atas untuk menggunakan fitur notifikasi email.
                    </p>
                </div>
            </div>
        {/if}
        
        <!-- Submit Button -->
        <div class="mt-6 pt-6 border-t border-gray-100 flex justify-end">
            <button
                type="submit"
                disabled={isLoading}
                class="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl 
                       text-sm font-semibold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {#if isLoading}
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {:else}
                    <Save size={18} />
                {/if}
                Simpan Notifikasi
            </button>
        </div>
    </form>
</div>