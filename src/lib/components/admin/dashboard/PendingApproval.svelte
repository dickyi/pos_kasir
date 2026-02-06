<script>
    import { enhance } from '$app/forms';
    import { AlertTriangle, Store, UserCheck, UserX, Mail, Calendar } from 'lucide-svelte';
    
    export let tenants = [];
    
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
</script>

{#if tenants.length > 0}
    <div class="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-5">
        <div class="flex items-start gap-3 mb-4">
            <div class="p-2 rounded-lg bg-yellow-100">
                <AlertTriangle class="text-yellow-600" size={20} />
            </div>
            <div>
                <h2 class="font-semibold text-yellow-800">Tenant Menunggu Persetujuan</h2>
                <p class="text-sm text-yellow-700">{tenants.length} tenant baru membutuhkan review Anda</p>
            </div>
        </div>
        <div class="space-y-3">
            {#each tenants as t}
                <div class="bg-white rounded-xl p-4 border border-yellow-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-white font-bold text-lg">
                            {t.nama_bisnis?.charAt(0) || 'T'}
                        </div>
                        <div>
                            <p class="font-semibold text-gray-900">{t.nama_bisnis}</p>
                            <p class="text-sm text-gray-500">{t.nama_pemilik}</p>
                            <div class="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                <span class="flex items-center gap-1">
                                    <Mail size={12} /> {t.email}
                                </span>
                                <span class="flex items-center gap-1">
                                    <Calendar size={12} /> {formatDate(t.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <form method="POST" action="?/approveTenant" use:enhance>
                            <input type="hidden" name="tenant_id" value={t.id} />
                            <button type="submit" class="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                                <UserCheck size={16} />
                                Setujui
                            </button>
                        </form>
                        <form method="POST" action="?/rejectTenant" use:enhance>
                            <input type="hidden" name="tenant_id" value={t.id} />
                            <button type="submit" class="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
                                <UserX size={16} />
                                Tolak
                            </button>
                        </form>
                    </div>
                </div>
            {/each}
        </div>
    </div>
{/if}