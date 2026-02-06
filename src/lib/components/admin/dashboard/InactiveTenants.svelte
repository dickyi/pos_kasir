<script>
    import { AlertCircle, Store, Mail } from 'lucide-svelte';
    
    export let tenants = [];
    export let title = 'Perlu Follow Up';
    export let subtitle = 'Tenant tidak aktif > 7 hari';
</script>

{#if tenants.length > 0}
    <div class="bg-white rounded-xl border border-orange-200">
        <div class="p-5 border-b border-orange-100 bg-orange-50/50 rounded-t-xl">
            <div class="flex items-center gap-2">
                <AlertCircle class="text-orange-500" size={18} />
                <h3 class="font-semibold text-orange-800">{title}</h3>
            </div>
            <p class="text-sm text-orange-600">{subtitle}</p>
        </div>
        <div class="p-4 space-y-3">
            {#each tenants as t}
                <div class="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div class="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500">
                        <Store size={18} />
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-900 truncate">{t.nama_bisnis}</p>
                        <p class="text-xs text-red-500">
                            {t.days_inactive} hari tidak aktif
                        </p>
                    </div>
                    <a href="mailto:{t.email}" class="p-2 rounded-lg hover:bg-white text-gray-400 hover:text-blue-600 transition-colors" title="Kirim Email">
                        <Mail size={16} />
                    </a>
                </div>
            {/each}
        </div>
    </div>
{/if}