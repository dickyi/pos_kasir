<script>
    import { UserPlus, Users, Package, CheckCircle, XCircle } from 'lucide-svelte';
    
    export let aktivitas = {};
    export let title = '📊 Aktivitas Hari Ini';
</script>

<div class="bg-white rounded-xl border">
    <div class="p-5 border-b">
        <h3 class="font-semibold text-gray-900">{title}</h3>
    </div>
    <div class="p-4 space-y-3">
        <div class="flex items-center justify-between py-2">
            <span class="text-sm text-gray-600 flex items-center gap-2">
                <UserPlus size={16} class="text-green-500" />
                Tenant Baru
            </span>
            <span class="font-semibold text-green-600">+{aktivitas.tenant_baru || 0}</span>
        </div>
        <div class="flex items-center justify-between py-2">
            <span class="text-sm text-gray-600 flex items-center gap-2">
                <Users size={16} class="text-blue-500" />
                User Login
            </span>
            <span class="font-semibold text-blue-600">{aktivitas.user_login || 0}</span>
        </div>
        <div class="flex items-center justify-between py-2">
            <span class="text-sm text-gray-600 flex items-center gap-2">
                <Package size={16} class="text-purple-500" />
                Produk Baru
            </span>
            <span class="font-semibold text-purple-600">+{aktivitas.produk_baru || 0}</span>
        </div>
        <div class="flex items-center justify-between py-2">
            <span class="text-sm text-gray-600 flex items-center gap-2">
                <CheckCircle size={16} class="text-green-500" />
                Transaksi Sukses
            </span>
            <span class="font-semibold text-green-600">{aktivitas.transaksi_sukses || 0}</span>
        </div>
        {#if aktivitas.transaksi_batal > 0}
            <div class="flex items-center justify-between py-2">
                <span class="text-sm text-gray-600 flex items-center gap-2">
                    <XCircle size={16} class="text-red-500" />
                    Transaksi Batal
                </span>
                <span class="font-semibold text-red-600">{aktivitas.transaksi_batal}</span>
            </div>
        {/if}
    </div>
</div>