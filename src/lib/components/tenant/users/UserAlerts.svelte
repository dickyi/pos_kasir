<!--
    UserAlerts.svelte - Alert Messages untuk Kelola User
    =====================================================
    Menampilkan berbagai alert seperti warning, error, success
-->
<script>
    import { 
        AlertTriangle, AlertCircle, CheckCircle, X,
        ShieldX, Lock, ShieldAlert 
    } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';

    export let usersWithoutPin = [];
    export let pinStats = {
        users_need_pin: 0,
        users_locked: 0,
        users_weak_pin: 0
    };
    export let form = null;

    const dispatch = createEventDispatcher();

    function dismissForm() {
        dispatch('dismissForm');
    }
</script>

<!-- ALERT: Users tanpa PIN -->
{#if usersWithoutPin && usersWithoutPin.length > 0}
    <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle size={20} class="text-amber-500 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
            <p class="text-sm font-medium text-amber-800">
                {usersWithoutPin.length} user belum memiliki PIN
            </p>
            <p class="text-xs text-amber-600 mt-1">
                {usersWithoutPin.map(u => u.nama).join(', ')} perlu set PIN untuk dapat login dengan PIN.
            </p>
        </div>
    </div>
{/if}

<!-- PIN Stats Mini Badges -->
{#if pinStats.users_need_pin > 0 || pinStats.users_locked > 0 || pinStats.users_weak_pin > 0}
    <div class="flex flex-wrap gap-2">
        {#if pinStats.users_need_pin > 0}
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                <ShieldX size={14} />
                {pinStats.users_need_pin} perlu set PIN
            </span>
        {/if}
        {#if pinStats.users_locked > 0}
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                <Lock size={14} />
                {pinStats.users_locked} akun terkunci
            </span>
        {/if}
        {#if pinStats.users_weak_pin > 0}
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full text-xs font-medium">
                <ShieldAlert size={14} />
                {pinStats.users_weak_pin} PIN lemah
            </span>
        {/if}
    </div>
{/if}

<!-- Error Alert -->
{#if form?.error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle size={18} class="text-red-500 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
            <p class="text-sm text-red-700">{form.error}</p>
            {#if form?.cannotDelete}
                <p class="text-xs text-red-600 mt-1">Gunakan tombol "Arsipkan" untuk menyembunyikan user ini.</p>
            {/if}
        </div>
        <button on:click={dismissForm} class="text-red-400 hover:text-red-600">
            <X size={16} />
        </button>
    </div>
{/if}

<!-- Success Alert -->
{#if form?.success}
    <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle size={18} class="text-emerald-500 flex-shrink-0 mt-0.5" />
        <p class="text-sm text-emerald-700 flex-1">{form.message}</p>
        <button on:click={dismissForm} class="text-emerald-400 hover:text-emerald-600">
            <X size={16} />
        </button>
    </div>
{/if}
