<!--
    SettingSection.svelte - Wrapper Section untuk Settings
    ============================================
    Reusable section dengan title dan description
-->
<script>
    import { Settings } from 'lucide-svelte';

    export let title = 'Settings';
    export let description = '';
    export let icon = Settings;
</script>

<div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <svelte:component this={icon} class="w-5 h-5 text-emerald-600" />
            </div>
            <div>
                <h2 class="text-base font-semibold text-slate-800">{title}</h2>
                {#if description}
                    <p class="text-sm text-slate-500 mt-0.5">{description}</p>
                {/if}
            </div>
        </div>
    </div>

    <!-- Content -->
    <div class="p-5">
        <slot />
    </div>
</div>