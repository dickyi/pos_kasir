<script>
    import { enhance } from '$app/forms';
    import { X, Key, Eye, EyeOff, Copy, CheckCircle } from 'lucide-svelte';
    
    export let admin = null;
    export let show = false;
    export let onClose = () => {};
    
    let isSubmitting = false;
    let newPassword = '';
    let showPassword = false;
    let copied = false;
    
    function generatePassword() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        newPassword = password;
        showPassword = true;
    }
    
    async function copyToClipboard() {
        try {
            await navigator.clipboard.writeText(newPassword);
            copied = true;
            setTimeout(() => copied = false, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }
    
    $: if (show) {
        generatePassword();
        copied = false;
    }
</script>

{#if show && admin}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 transition-opacity" on:click={onClose}></div>
        
        <!-- Modal -->
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md animate-modal-in">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Key size={20} class="text-amber-600" />
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900">Reset Password</h3>
                            <p class="text-sm text-gray-500">@{admin.username}</p>
                        </div>
                    </div>
                    <button on:click={onClose} class="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} class="text-gray-500" />
                    </button>
                </div>
                
                <!-- Content -->
                <form
                    method="POST"
                    action="?/resetPassword"
                    use:enhance={() => {
                        isSubmitting = true;
                        return async ({ result, update }) => {
                            isSubmitting = false;
                            if (result.type === 'success' && result.data?.success) {
                                onClose();
                            }
                            await update();
                        };
                    }}
                    class="p-6"
                >
                    <input type="hidden" name="id" value={admin.id} />
                    
                    <!-- Admin Info -->
                    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-sm">
                            {(admin.nama || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="font-medium text-gray-900">{admin.nama}</p>
                            <p class="text-xs text-gray-500">{admin.email}</p>
                        </div>
                    </div>
                    
                    <!-- New Password -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Password Baru
                        </label>
                        <div class="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="new_password"
                                bind:value={newPassword}
                                required
                                minlength="8"
                                class="w-full px-4 py-3 pr-24 border border-gray-200 rounded-lg text-sm font-mono
                                       focus:outline-none focus:ring-2 focus:ring-gray-900"
                            />
                            <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button
                                    type="button"
                                    on:click={() => showPassword = !showPassword}
                                    class="p-1.5 hover:bg-gray-100 rounded text-gray-400"
                                >
                                    {#if showPassword}
                                        <EyeOff size={16} />
                                    {:else}
                                        <Eye size={16} />
                                    {/if}
                                </button>
                                <button
                                    type="button"
                                    on:click={copyToClipboard}
                                    class="p-1.5 hover:bg-gray-100 rounded {copied ? 'text-emerald-500' : 'text-gray-400'}"
                                    title="Copy to clipboard"
                                >
                                    {#if copied}
                                        <CheckCircle size={16} />
                                    {:else}
                                        <Copy size={16} />
                                    {/if}
                                </button>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 mt-2">
                            <button
                                type="button"
                                on:click={generatePassword}
                                class="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                🎲 Generate Password Baru
                            </button>
                        </div>
                    </div>
                    
                    <!-- Info -->
                    <div class="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 mb-4">
                        <p class="font-medium mb-1">ℹ️ Informasi:</p>
                        <ul class="list-disc list-inside space-y-1 text-blue-700 text-xs">
                            <li>Password baru akan langsung aktif</li>
                            <li>Admin akan di-logout dari semua device</li>
                            <li>Salin dan berikan password ke admin terkait</li>
                        </ul>
                    </div>
                    
                    <!-- Buttons -->
                    <div class="flex items-center gap-3">
                        <button
                            type="button"
                            on:click={onClose}
                            disabled={isSubmitting}
                            class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 
                                   rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !newPassword}
                            class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 
                                   rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50
                                   flex items-center justify-center gap-2"
                        >
                            {#if isSubmitting}
                                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            {:else}
                                <Key size={16} />
                            {/if}
                            Reset Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
{/if}

<style>
    @keyframes modal-in {
        from { opacity: 0; transform: scale(0.95) translateY(-10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-modal-in { animation: modal-in 0.2s ease-out; }
</style>