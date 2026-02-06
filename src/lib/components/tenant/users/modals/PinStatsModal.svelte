<!--
    PinStatsModal.svelte - Modal Statistik PIN
    ===========================================
    Menampilkan statistik PIN lengkap
-->
<script>
    import { 
        KeyRound, ShieldCheck, ShieldX, ShieldAlert, Lock 
    } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';

    export let show = false;
    export let pinStats = {
        users_with_pin: 0,
        users_need_pin: 0,
        users_locked: 0,
        users_weak_pin: 0
    };

    const dispatch = createEventDispatcher();

    function close() {
        dispatch('close');
    }
</script>

{#if show}
    <div 
        class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" 
        on:click|self={close}
        on:keydown={(e) => e.key === 'Escape' && close()}
        role="dialog"
        aria-modal="true"
    >
        <div class="bg-white rounded-xl w-full max-w-md shadow-xl">
            <!-- Header -->
            <div class="p-5 border-b border-gray-100">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <KeyRound size={20} class="text-emerald-600" />
                    Statistik PIN
                </h3>
            </div>
            
            <!-- Content -->
            <div class="p-5 space-y-4">
                <!-- Stats Grid -->
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-emerald-50 rounded-lg p-4 text-center">
                        <p class="text-3xl font-bold text-emerald-600">{pinStats.users_with_pin}</p>
                        <p class="text-xs text-emerald-700 mt-1">Punya PIN</p>
                    </div>
                    <div class="bg-red-50 rounded-lg p-4 text-center">
                        <p class="text-3xl font-bold text-red-600">{pinStats.users_need_pin}</p>
                        <p class="text-xs text-red-700 mt-1">Perlu Set PIN</p>
                    </div>
                    <div class="bg-amber-50 rounded-lg p-4 text-center">
                        <p class="text-3xl font-bold text-amber-600">{pinStats.users_weak_pin}</p>
                        <p class="text-xs text-amber-700 mt-1">PIN Lemah</p>
                    </div>
                    <div class="bg-gray-100 rounded-lg p-4 text-center">
                        <p class="text-3xl font-bold text-gray-600">{pinStats.users_locked}</p>
                        <p class="text-xs text-gray-700 mt-1">Akun Terkunci</p>
                    </div>
                </div>
                
                <!-- Legend -->
                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">Keterangan</h4>
                    <ul class="text-xs text-gray-600 space-y-1.5">
                        <li class="flex items-center gap-2">
                            <ShieldCheck size={14} class="text-emerald-500" />
                            <span><strong>Punya PIN:</strong> User yang sudah set PIN</span>
                        </li>
                        <li class="flex items-center gap-2">
                            <ShieldX size={14} class="text-red-500" />
                            <span><strong>Perlu Set PIN:</strong> Kasir yang belum punya PIN</span>
                        </li>
                        <li class="flex items-center gap-2">
                            <ShieldAlert size={14} class="text-amber-500" />
                            <span><strong>PIN Lemah:</strong> PIN yang mudah ditebak</span>
                        </li>
                        <li class="flex items-center gap-2">
                            <Lock size={14} class="text-gray-500" />
                            <span><strong>Terkunci:</strong> Akun dikunci karena gagal login</span>
                        </li>
                    </ul>
                </div>
                
                <!-- Close Button -->
                <button 
                    on:click={close} 
                    class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    Tutup
                </button>
            </div>
        </div>
    </div>
{/if}
