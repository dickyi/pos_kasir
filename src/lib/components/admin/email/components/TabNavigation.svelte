<!-- ============================================
TAB NAVIGATION COMPONENT
File: src/lib/components/admin/email/components/TabNavigation.svelte

Tab navigation for email settings:
- SMTP
- Template
- Notification
============================================ -->

<script>
    import { Server, FileText, Bell } from 'lucide-svelte';
    import { EMAIL_TABS } from '../utils/helpers.js';
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    // Props
    export let activeTab = 'smtp';
    export let tabs = EMAIL_TABS;
    
    // Icon mapping
    const iconMap = {
        'server': Server,
        'file-text': FileText,
        'bell': Bell
    };
    
    // Get icon component
    function getIcon(iconName) {
        return iconMap[iconName] || Server;
    }
    
    // Handle tab click
    function selectTab(tabId) {
        activeTab = tabId;
        dispatch('change', tabId);
    }
</script>

<div class="flex gap-2 mb-6 border-b border-gray-200 pb-2 overflow-x-auto">
    {#each tabs as tab}
        {@const Icon = getIcon(tab.icon)}
        {@const isActive = activeTab === tab.id}
        
        <button
            on:click={() => selectTab(tab.id)}
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium 
                   transition-all whitespace-nowrap
                   {isActive 
                       ? `bg-${tab.color}-100 text-${tab.color}-700 shadow-sm` 
                       : 'text-gray-600 hover:bg-gray-100'}"
            class:bg-violet-100={isActive && tab.color === 'violet'}
            class:text-violet-700={isActive && tab.color === 'violet'}
            class:bg-emerald-100={isActive && tab.color === 'emerald'}
            class:text-emerald-700={isActive && tab.color === 'emerald'}
            class:bg-amber-100={isActive && tab.color === 'amber'}
            class:text-amber-700={isActive && tab.color === 'amber'}
        >
            <svelte:component this={Icon} size={18} />
            {tab.label}
        </button>
    {/each}
</div>