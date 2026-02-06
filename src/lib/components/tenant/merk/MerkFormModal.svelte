<!--
    MerkFormModal.svelte - Modal Form Tambah/Edit Merk
    ============================================
    Form dengan label di atas field (konsisten dengan ProductFormModal)
-->
<script>
    import { enhance } from '$app/forms';
    import { createEventDispatcher } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { 
        X, Tag, Globe, FileText, Loader2, AlertCircle
    } from 'lucide-svelte';

    const dispatch = createEventDispatcher();

    export let open = false;
    export let merk = null; // null = add mode, object = edit mode

    // Form data
    let formData = {
        id: '',
        nama_merk: '',
        deskripsi: '',
        website: '',
        status: 'aktif'
    };

    let isSubmitting = false;
    let errorMessage = '';

    // Reset form when modal opens
    $: if (open) {
        errorMessage = '';
        if (merk) {
            // Edit mode
            formData = {
                id: merk.id,
                nama_merk: merk.nama_merk || '',
                deskripsi: merk.deskripsi || '',
                website: merk.website || '',
                status: merk.status || 'aktif'
            };
        } else {
            // Add mode
            formData = {
                id: '',
                nama_merk: '',
                deskripsi: '',
                website: '',
                status: 'aktif'
            };
        }
    }

    $: mode = merk ? 'edit' : 'add';
    $: modalTitle = mode === 'add' ? 'Tambah Merk' : 'Edit Merk';

    function close() {
        open = false;
        dispatch('close');
    }

    function handleSubmit() {
        isSubmitting = true;
        return async ({ result, update }) => {
            isSubmitting = false;
            
            if (result.type === 'success') {
                dispatch('success');
                close();
            } else if (result.type === 'failure') {
                errorMessage = result.data?.error || 'Terjadi kesalahan';
            }
            await update();
        };
    }
</script>

{#if open}
    <!-- Backdrop -->
    <div 
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
        on:click={close}
        on:keypress={(e) => e.key === 'Escape' && close()}
        role="button"
        tabindex="-1"
    ></div>

    <!-- Modal -->
    <div 
        transition:fly={{ y: 20, duration: 200 }}
        class="fixed inset-x-4 top-[15%] sm:inset-auto sm:left-1/2 sm:top-1/2 
               sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md
               bg-white rounded-2xl shadow-2xl z-50 flex flex-col max-h-[75vh]"
    >
        <!-- Header -->
        <div class="flex items-center gap-3 p-4 border-b border-slate-200 flex-shrink-0">
            <button
                on:click={close}
                class="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
                <X class="w-5 h-5" />
            </button>
            <div class="flex items-center gap-2">
                <div class="p-1.5 bg-emerald-100 rounded-lg">
                    <Tag class="w-4 h-4 text-emerald-600" />
                </div>
                <h2 class="text-lg font-semibold text-slate-800">{modalTitle}</h2>
            </div>
        </div>

        <!-- Form -->
        <form 
            method="POST" 
            action={mode === 'add' ? '?/create' : '?/update'}
            use:enhance={handleSubmit}
            class="flex-1 overflow-y-auto p-4"
        >
            {#if mode === 'edit'}
                <input type="hidden" name="id" value={formData.id} />
            {/if}

            <!-- Error Message -->
            {#if errorMessage}
                <div class="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600">
                    <AlertCircle class="w-4 h-4 flex-shrink-0" />
                    <span class="text-sm">{errorMessage}</span>
                </div>
            {/if}

            <div class="space-y-4">
                <!-- Nama Merk -->
                <div class="space-y-1.5">
                    <label for="nama_merk" class="block text-sm font-medium text-slate-700">
                        Nama Merk <span class="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="nama_merk"
                        name="nama_merk"
                        bind:value={formData.nama_merk}
                        required
                        placeholder="Contoh: Samsung, Apple, Homemade"
                        class="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm
                               placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                               focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                    />
                </div>

                <!-- Deskripsi -->
                <div class="space-y-1.5">
                    <label for="deskripsi" class="block text-sm font-medium text-slate-700">
                        Deskripsi
                    </label>
                    <textarea
                        id="deskripsi"
                        name="deskripsi"
                        bind:value={formData.deskripsi}
                        rows="3"
                        placeholder="Deskripsi singkat tentang merk ini (opsional)"
                        class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm
                               placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                               focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all resize-none"
                    ></textarea>
                </div>

                <!-- Website -->
                <div class="space-y-1.5">
                    <label for="website" class="block text-sm font-medium text-slate-700">
                        Website
                    </label>
                    <div class="relative">
                        <Globe class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="url"
                            id="website"
                            name="website"
                            bind:value={formData.website}
                            placeholder="https://www.contoh.com"
                            class="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                   placeholder:text-slate-400 focus:outline-none focus:border-emerald-500
                                   focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                        />
                    </div>
                    <p class="text-xs text-slate-500">URL website resmi merk (opsional)</p>
                </div>

                <!-- Status -->
                <div class="space-y-1.5">
                    <label class="block text-sm font-medium text-slate-700">
                        Status
                    </label>
                    <div class="flex gap-3">
                        <label class="flex-1 cursor-pointer">
                            <input
                                type="radio"
                                name="status"
                                value="aktif"
                                bind:group={formData.status}
                                class="peer sr-only"
                            />
                            <div class="flex items-center justify-center gap-2 px-4 py-3 
                                        bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium
                                        peer-checked:bg-emerald-50 peer-checked:border-emerald-500 
                                        peer-checked:text-emerald-700 transition-all">
                                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Aktif
                            </div>
                        </label>
                        <label class="flex-1 cursor-pointer">
                            <input
                                type="radio"
                                name="status"
                                value="nonaktif"
                                bind:group={formData.status}
                                class="peer sr-only"
                            />
                            <div class="flex items-center justify-center gap-2 px-4 py-3 
                                        bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium
                                        peer-checked:bg-slate-100 peer-checked:border-slate-400 
                                        peer-checked:text-slate-700 transition-all">
                                <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                                Nonaktif
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                <button
                    type="button"
                    on:click={close}
                    class="flex-1 h-12 bg-slate-100 text-slate-700 rounded-xl font-semibold
                           hover:bg-slate-200 transition-colors"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !formData.nama_merk.trim()}
                    class="flex-1 h-12 bg-emerald-600 text-white rounded-xl font-semibold
                           hover:bg-emerald-700 transition-colors disabled:opacity-50 
                           disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {#if isSubmitting}
                        <Loader2 class="w-5 h-5 animate-spin" />
                    {/if}
                    <span>{mode === 'add' ? 'Simpan' : 'Update'}</span>
                </button>
            </div>
        </form>
    </div>
{/if}