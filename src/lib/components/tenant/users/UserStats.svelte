<!--
    UserStats.svelte - Statistik Cards untuk Kelola User
    =====================================================
    Menampilkan statistik user dalam bentuk cards
-->
<script>
    import { Users, Crown, UserCog, User, KeyRound, Archive } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';

    export let stats = {
        total: 0,
        owner: 0,
        admin: 0,
        kasir: 0,
        aktif: 0,
        nonaktif: 0,
        archived: 0
    };
    
    export let pinStats = {
        users_with_pin: 0,
        users_need_pin: 0,
        users_locked: 0,
        users_weak_pin: 0
    };

    const dispatch = createEventDispatcher();

    function openPinStats() {
        dispatch('openPinStats');
    }
</script>

<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
    <!-- Total User -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="flex items-center gap-3">
            <div class="p-2 bg-gray-100 rounded-lg">
                <Users size={18} class="text-gray-600" />
            </div>
            <div>
                <p class="text-2xl font-semibold text-gray-900">{stats.total}</p>
                <p class="text-xs text-gray-500">Total User</p>
            </div>
        </div>
    </div>
    
    <!-- Owner -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="flex items-center gap-3">
            <div class="p-2 bg-gray-100 rounded-lg">
                <Crown size={18} class="text-gray-600" />
            </div>
            <div>
                <p class="text-2xl font-semibold text-gray-900">{stats.owner}</p>
                <p class="text-xs text-gray-500">Owner</p>
            </div>
        </div>
    </div>
    
    <!-- Admin -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="flex items-center gap-3">
            <div class="p-2 bg-gray-100 rounded-lg">
                <UserCog size={18} class="text-gray-600" />
            </div>
            <div>
                <p class="text-2xl font-semibold text-gray-900">{stats.admin}</p>
                <p class="text-xs text-gray-500">Admin</p>
            </div>
        </div>
    </div>
    
    <!-- Kasir -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="flex items-center gap-3">
            <div class="p-2 bg-gray-100 rounded-lg">
                <User size={18} class="text-gray-600" />
            </div>
            <div>
                <p class="text-2xl font-semibold text-gray-900">{stats.kasir}</p>
                <p class="text-xs text-gray-500">Kasir</p>
            </div>
        </div>
    </div>
    
    <!-- PIN Stats (Clickable) -->
    <button 
        on:click={openPinStats}
        class="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors text-left"
    >
        <div class="flex items-center gap-3">
            <div class="p-2 bg-emerald-50 rounded-lg">
                <KeyRound size={18} class="text-emerald-600" />
            </div>
            <div>
                <p class="text-2xl font-semibold text-gray-900">{pinStats.users_with_pin}</p>
                <p class="text-xs text-gray-500">Punya PIN</p>
            </div>
        </div>
    </button>
    
    <!-- Archived -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="flex items-center gap-3">
            <div class="p-2 bg-gray-100 rounded-lg">
                <Archive size={18} class="text-gray-600" />
            </div>
            <div>
                <p class="text-2xl font-semibold text-gray-900">{stats.archived}</p>
                <p class="text-xs text-gray-500">Diarsipkan</p>
            </div>
        </div>
    </div>
</div>
