<!-- ============================================
TEMPLATE EDITOR COMPONENT
File: src/lib/components/admin/email/components/TemplateEditor.svelte

Edit individual email template settings:
- Custom subject, greeting, footer
- Rate limits (per hour/day)
- Admin copy settings
- Template info display
============================================ -->

<script>
    import { enhance } from '$app/forms';
    import { Save, Clock, Mail, Info, AlertTriangle } from 'lucide-svelte';
    import { formatDate } from '../utils/helpers.js';
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    // Props
    export let template;
    export let isLoading = false;
    
    // Local state for form values
    let formData = {
        custom_subject: template.custom_subject || '',
        custom_greeting: template.custom_greeting || '',
        custom_footer: template.custom_footer || '',
        max_per_hour: template.max_per_hour || 100,
        max_per_day: template.max_per_day || 1000,
        send_copy_to_admin: template.send_copy_to_admin || false,
        admin_email: template.admin_email || ''
    };
    
    // Handle form result
    function handleResult({ result }) {
        dispatch('result', result);
    }
</script>

<div class="p-4 border-t border-gray-200 bg-white">
    <form method="POST" action="?/updateTemplate" use:enhance={handleResult}>
        <input type="hidden" name="template_key" value={template.template_key} />
        
        <div class="grid gap-4 sm:grid-cols-2">
            <!-- Custom Subject -->
            <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Custom Subject
                </label>
                <input 
                    type="text"
                    name="custom_subject"
                    bind:value={formData.custom_subject}
                    placeholder="Kosongkan untuk menggunakan default"
                    class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                           focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                           transition-colors"
                />
                <p class="mt-1 text-xs text-gray-500">
                    Override subject default. Gunakan variabel seperti nama, bisnis, dll.
                </p>
            </div>
            
            <!-- Custom Greeting -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Custom Greeting
                </label>
                <input 
                    type="text"
                    name="custom_greeting"
                    bind:value={formData.custom_greeting}
                    placeholder="Contoh: Halo Bapak/Ibu,"
                    class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                           focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                           transition-colors"
                />
            </div>
            
            <!-- Custom Footer -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Custom Footer
                </label>
                <input 
                    type="text"
                    name="custom_footer"
                    bind:value={formData.custom_footer}
                    placeholder="Contoh: Salam hangat,"
                    class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                           focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                           transition-colors"
                />
            </div>
            
            <!-- Max Per Hour -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Clock size={14} class="text-gray-400" />
                    Max Email per Jam
                </label>
                <input 
                    type="number"
                    name="max_per_hour"
                    bind:value={formData.max_per_hour}
                    min="1"
                    max="10000"
                    class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                           focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                           transition-colors"
                />
            </div>
            
            <!-- Max Per Day -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Clock size={14} class="text-gray-400" />
                    Max Email per Hari
                </label>
                <input 
                    type="number"
                    name="max_per_day"
                    bind:value={formData.max_per_day}
                    min="1"
                    max="100000"
                    class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                           focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                           transition-colors"
                />
            </div>
            
            <!-- Admin Copy Settings -->
            <div class="sm:col-span-2">
                <div class="flex flex-col sm:flex-row sm:items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox"
                            name="send_copy_to_admin"
                            bind:checked={formData.send_copy_to_admin}
                            class="w-4 h-4 rounded border-gray-300 text-violet-600 
                                   focus:ring-violet-500 cursor-pointer"
                        />
                        <span class="text-sm text-gray-700">Kirim salinan ke admin</span>
                    </label>
                    
                    <div class="flex-1">
                        <div class="relative">
                            <Mail size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="email"
                                name="admin_email"
                                bind:value={formData.admin_email}
                                placeholder="Email admin untuk salinan..."
                                disabled={!formData.send_copy_to_admin}
                                class="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm
                                       focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                                       transition-colors
                                       disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Template Info -->
        <div class="mt-4 pt-4 border-t border-gray-100">
            <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
                <span class="flex items-center gap-1">
                    <Info size={12} class="text-gray-400" />
                    Key: <code class="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{template.template_key}</code>
                </span>
                
                <span>
                    Terakhir dikirim: 
                    <strong class="text-gray-700">
                        {template.last_sent_at ? formatDate(template.last_sent_at) : 'Belum pernah'}
                    </strong>
                </span>
                
                {#if template.cooldown_seconds > 0}
                    <span class="flex items-center gap-1">
                        <Clock size={12} class="text-amber-500" />
                        Cooldown: {template.cooldown_seconds}s
                    </span>
                {/if}
                
                {#if template.priority === 'high'}
                    <span class="flex items-center gap-1 text-red-600">
                        <AlertTriangle size={12} />
                        Prioritas tinggi
                    </span>
                {/if}
            </div>
        </div>
        
        <!-- Save Button -->
        <div class="mt-4 flex justify-end">
            <button
                type="submit"
                disabled={isLoading}
                class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg 
                       text-sm font-medium hover:bg-emerald-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {#if isLoading}
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {:else}
                    <Save size={16} />
                {/if}
                Simpan Perubahan
            </button>
        </div>
    </form>
</div>