<!-- ============================================
TEMPLATE LIST COMPONENT
File: src/lib/components/admin/email/components/TemplateList.svelte

Displays list of email templates with:
- Template info (name, icon, category)
- Active/Inactive toggle
- Stats (sent/failed)
- Expandable editor
============================================ -->

<script>
    import { enhance } from '$app/forms';
    import { 
        ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
        CheckCircle, XCircle, Info
    } from 'lucide-svelte';
    import { templateStats } from '../stores/emailStore.js';
    import { getCategoryColor, formatNumber } from '../utils/helpers.js';
    import TemplateEditor from './TemplateEditor.svelte';
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    // Props
    export let templates = [];
    export let isLoading = false;
    
    // State
    let expandedTemplate = null;
    
    // Merge with real-time stats
    $: mergedTemplates = templates.map(t => {
        const realtimeStats = $templateStats.find(ts => ts.template_key === t.template_key);
        if (realtimeStats) {
            return {
                ...t,
                total_sent: realtimeStats.total_sent,
                total_failed: realtimeStats.total_failed,
                last_sent_at: realtimeStats.last_sent_at
            };
        }
        return t;
    });
    
    // Toggle expand
    function toggleExpand(key) {
        expandedTemplate = expandedTemplate === key ? null : key;
    }
    
    // Handle toggle result
    function handleToggleResult({ result }) {
        dispatch('toggle', result);
    }
</script>

<div class="p-6">
    {#if mergedTemplates.length > 0}
        <div class="space-y-4">
            {#each mergedTemplates as template}
                {@const catColor = getCategoryColor(template.category)}
                {@const isExpanded = expandedTemplate === template.template_key}
                
                <div class="border border-gray-200 rounded-xl overflow-hidden transition-all duration-200
                            {template.is_active ? '' : 'opacity-60'}
                            {isExpanded ? 'ring-2 ring-violet-200' : ''}">
                    
                    <!-- Template Header -->
                    <div class="p-4 bg-gray-50 flex items-center justify-between">
                        <div class="flex items-center gap-3 min-w-0 flex-1">
                            <!-- Icon -->
                            <div class="w-10 h-10 rounded-lg bg-white border border-gray-200 
                                        flex items-center justify-center text-xl flex-shrink-0">
                                {template.icon || '📧'}
                            </div>
                            
                            <!-- Info -->
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <h3 class="font-semibold text-gray-900 truncate">
                                        {template.template_name}
                                    </h3>
                                    <span class="px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0
                                                {catColor.bg} {catColor.text}">
                                        {template.category}
                                    </span>
                                    {#if template.priority === 'high'}
                                        <span class="px-2 py-0.5 text-xs font-medium rounded-full 
                                                    bg-red-100 text-red-700 flex-shrink-0">
                                            Prioritas Tinggi
                                        </span>
                                    {/if}
                                </div>
                                <p class="text-sm text-gray-500 truncate mt-0.5">
                                    {template.description || 'Tidak ada deskripsi'}
                                </p>
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-3 flex-shrink-0 ml-4">
                            <!-- Stats -->
                            <div class="hidden sm:flex items-center gap-4 text-xs text-gray-500">
                                <span class="flex items-center gap-1" title="Email terkirim">
                                    <CheckCircle size={12} class="text-emerald-500" />
                                    {formatNumber(template.total_sent || 0)}
                                </span>
                                <span class="flex items-center gap-1" title="Email gagal">
                                    <XCircle size={12} class="text-red-500" />
                                    {formatNumber(template.total_failed || 0)}
                                </span>
                            </div>
                            
                            <!-- Toggle Active -->
                            <form method="POST" action="?/toggleTemplate" use:enhance={handleToggleResult}>
                                <input type="hidden" name="template_key" value={template.template_key} />
                                <input type="hidden" name="is_active" value={template.is_active ? 'false' : 'true'} />
                                <button 
                                    type="submit" 
                                    class="p-1 transition-transform hover:scale-110"
                                    title={template.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                    disabled={isLoading}
                                >
                                    {#if template.is_active}
                                        <ToggleRight size={28} class="text-emerald-500" />
                                    {:else}
                                        <ToggleLeft size={28} class="text-gray-400" />
                                    {/if}
                                </button>
                            </form>
                            
                            <!-- Expand Button -->
                            <button 
                                on:click={() => toggleExpand(template.template_key)}
                                class="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                title={isExpanded ? 'Tutup' : 'Edit template'}
                            >
                                {#if isExpanded}
                                    <ChevronUp size={20} class="text-gray-600" />
                                {:else}
                                    <ChevronDown size={20} class="text-gray-600" />
                                {/if}
                            </button>
                        </div>
                    </div>
                    
                    <!-- Template Editor (Expandable) -->
                    {#if isExpanded}
                        <TemplateEditor 
                            {template} 
                            on:save 
                            on:result={(e) => dispatch('update', e.detail)}
                        />
                    {/if}
                </div>
            {/each}
        </div>
        
    {:else}
        <!-- Empty State -->
        <div class="text-center py-12">
            <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Info size={24} class="text-gray-400" />
            </div>
            <h4 class="text-gray-700 font-medium mb-1">Tidak Ada Template</h4>
            <p class="text-sm text-gray-500">
                Belum ada template email yang dikonfigurasi.
            </p>
        </div>
    {/if}
</div>