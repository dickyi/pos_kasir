<script>
    import { enhance } from '$app/forms';
    import { Store, Eye, Ban, Play, ChevronRight } from 'lucide-svelte';
    
    export let tenants = [];
    export let title = 'Tenant Terbaru';
    export let subtitle = '10 pendaftaran terakhir';
    export let showLink = true;
    export let linkHref = '/admin/tenant';
    
    function getStatusColor(status) {
        const colors = {
            'aktif': 'bg-green-100 text-green-700 border-green-200',
            'pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'nonaktif': 'bg-red-100 text-red-700 border-red-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    }
    
    function getStatusDot(status) {
        const colors = {
            'aktif': 'bg-green-500',
            'pending': 'bg-yellow-500',
            'nonaktif': 'bg-red-500'
        };
        return colors[status] || 'bg-gray-500';
    }
</script>

<div class="bg-white rounded-xl border">
    <div class="p-5 border-b flex items-center justify-between">
        <div>
            <h3 class="font-semibold text-gray-900">{title}</h3>
            <p class="text-sm text-gray-500">{subtitle}</p>
        </div>
        {#if showLink}
            <a href={linkHref} class="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Lihat Semua <ChevronRight size={16} />
            </a>
        {/if}
    </div>
    <div class="overflow-x-auto">
        <table class="w-full">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                    <th class="px-4 py-3 text-left">Tenant</th>
                    <th class="px-4 py-3 text-left hidden md:table-cell">Kontak</th>
                    <th class="px-4 py-3 text-center">Produk</th>
                    <th class="px-4 py-3 text-center">Status</th>
                    <th class="px-4 py-3 text-center">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y">
                {#each tenants as t}
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                    {t.nama_bisnis?.charAt(0) || 'T'}
                                </div>
                                <div class="min-w-0">
                                    <p class="font-medium text-gray-900 truncate">{t.nama_bisnis}</p>
                                    <p class="text-xs text-gray-500">{t.nama_pemilik}</p>
                                </div>
                            </div>
                        </td>
                        <td class="px-4 py-3 hidden md:table-cell">
                            <p class="text-sm text-gray-600 truncate">{t.email}</p>
                            <p class="text-xs text-gray-400">{t.no_telepon || '-'}</p>
                        </td>
                        <td class="px-4 py-3 text-center">
                            <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-sm font-medium">
                                {t.total_produk || 0}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-center">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {getStatusColor(t.status)}">
                                <span class="w-1.5 h-1.5 rounded-full {getStatusDot(t.status)}"></span>
                                {t.status}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-center">
                            <div class="flex items-center justify-center gap-1">
                                <a href="/admin/tenant/{t.id}" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors" title="Lihat Detail">
                                    <Eye size={16} />
                                </a>
                                {#if t.status === 'aktif'}
                                    <form method="POST" action="?/suspendTenant" use:enhance class="inline">
                                        <input type="hidden" name="tenant_id" value={t.id} />
                                        <button type="submit" class="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors" title="Nonaktifkan">
                                            <Ban size={16} />
                                        </button>
                                    </form>
                                {:else if t.status === 'nonaktif'}
                                    <form method="POST" action="?/activateTenant" use:enhance class="inline">
                                        <input type="hidden" name="tenant_id" value={t.id} />
                                        <button type="submit" class="p-1.5 rounded-lg hover:bg-green-50 text-gray-500 hover:text-green-600 transition-colors" title="Aktifkan">
                                            <Play size={16} />
                                        </button>
                                    </form>
                                {/if}
                            </div>
                        </td>
                    </tr>
                {:else}
                    <tr>
                        <td colspan="5" class="px-4 py-12 text-center text-gray-400">
                            <Store size={40} class="mx-auto mb-2 opacity-50" />
                            <p>Belum ada tenant terdaftar</p>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>