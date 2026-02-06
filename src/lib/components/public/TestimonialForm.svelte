<script>
    import { enhance } from '$app/forms';
    import { Star, Send, CheckCircle, User, Building2, Mail, Phone, MessageSquare, X, MapPin, Briefcase } from 'lucide-svelte';
    
    export let show = false;
    export let onClose = () => {};
    export let onSuccess = () => {};
    
    let isSubmitting = false;
    let showSuccess = false;
    let rating = 5;
    let hoverRating = 0;
    
    let formData = {
        name: '',
        role: '',
        business_name: '',
        business_type: '',
        email: '',
        phone: '',
        location: '',
        testimonial: ''
    };
    
    function resetForm() {
        formData = {
            name: '',
            role: '',
            business_name: '',
            business_type: '',
            email: '',
            phone: '',
            location: '',
            testimonial: ''
        };
        rating = 5;
        hoverRating = 0;
    }
    
    function handleClose() {
        if (!isSubmitting) {
            showSuccess = false;
            resetForm();
            onClose();
        }
    }
    
    const businessTypes = [
        'Kuliner / F&B',
        'Retail / Toko',
        'Fashion',
        'Jasa',
        'Lainnya'
    ];
</script>

{#if show}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div 
            class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            on:click={handleClose}
        ></div>
        
        <!-- Modal -->
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-modal-in max-h-[90vh] overflow-y-auto">
                
                {#if showSuccess}
                    <!-- Success State -->
                    <div class="p-8 text-center">
                        <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={40} class="text-emerald-600" />
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 mb-2">Terima Kasih!</h3>
                        <p class="text-gray-600 mb-6">
                            Testimoni Anda telah dikirim dan sedang menunggu persetujuan admin. 
                            Kami sangat menghargai feedback Anda!
                        </p>
                        <button
                            on:click={handleClose}
                            class="px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                {:else}
                    <!-- Header -->
                    <div class="relative px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600">
                        <button 
                            on:click={handleClose}
                            class="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X size={20} class="text-white" />
                        </button>
                        <h3 class="text-xl font-bold text-white">Bagikan Pengalaman Anda</h3>
                        <p class="text-emerald-100 text-sm mt-1">Ceritakan bagaimana POS Platform membantu bisnis Anda</p>
                    </div>
                    
                    <!-- Form -->
                    <form
                        method="POST"
                        action="/api/testimonial"
                        use:enhance={() => {
                            isSubmitting = true;
                            return async ({ result }) => {
                                isSubmitting = false;
                                if (result.type === 'success' || result.type === 'redirect') {
                                    showSuccess = true;
                                    onSuccess();
                                }
                            };
                        }}
                        class="p-6 space-y-4"
                    >
                        <!-- Rating -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Rating <span class="text-red-500">*</span>
                            </label>
                            <div class="flex items-center gap-1">
                                {#each [1, 2, 3, 4, 5] as star}
                                    <button
                                        type="button"
                                        on:click={() => rating = star}
                                        on:mouseenter={() => hoverRating = star}
                                        on:mouseleave={() => hoverRating = 0}
                                        class="p-1 transition-transform hover:scale-110"
                                    >
                                        <Star 
                                            size={28} 
                                            class="{(hoverRating || rating) >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} transition-colors"
                                        />
                                    </button>
                                {/each}
                                <span class="ml-2 text-sm text-gray-500">
                                    {rating === 5 ? 'Sangat Baik!' : rating === 4 ? 'Baik' : rating === 3 ? 'Cukup' : rating === 2 ? 'Kurang' : 'Buruk'}
                                </span>
                            </div>
                            <input type="hidden" name="rating" value={rating} />
                        </div>
                        
                        <!-- Name & Role -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    Nama Lengkap <span class="text-red-500">*</span>
                                </label>
                                <div class="relative">
                                    <User size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="name"
                                        bind:value={formData.name}
                                        required
                                        class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm 
                                               focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        placeholder="Nama Anda"
                                    />
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    Jabatan
                                </label>
                                <div class="relative">
                                    <Briefcase size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="role"
                                        bind:value={formData.role}
                                        class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm 
                                               focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        placeholder="Pemilik / Manager"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <!-- Business Name & Type -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    Nama Usaha <span class="text-red-500">*</span>
                                </label>
                                <div class="relative">
                                    <Building2 size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="business_name"
                                        bind:value={formData.business_name}
                                        required
                                        class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm 
                                               focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        placeholder="Nama toko/usaha"
                                    />
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    Jenis Usaha
                                </label>
                                <select
                                    name="business_type"
                                    bind:value={formData.business_type}
                                    class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                    <option value="">Pilih jenis usaha</option>
                                    {#each businessTypes as type}
                                        <option value={type}>{type}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>
                        
                        <!-- Email & Phone -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email <span class="text-red-500">*</span>
                                </label>
                                <div class="relative">
                                    <Mail size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        bind:value={formData.email}
                                        required
                                        class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm 
                                               focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        placeholder="email@domain.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                    No. WhatsApp
                                </label>
                                <div class="relative">
                                    <Phone size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        bind:value={formData.phone}
                                        class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm 
                                               focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        placeholder="08xxxxxxxxxx"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <!-- Location -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                Lokasi
                            </label>
                            <div class="relative">
                                <MapPin size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="location"
                                    bind:value={formData.location}
                                    class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm 
                                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Kota/Kabupaten"
                                />
                            </div>
                        </div>
                        
                        <!-- Testimonial Content -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                Testimoni <span class="text-red-500">*</span>
                            </label>
                            <div class="relative">
                                <MessageSquare size={16} class="absolute left-3 top-3 text-gray-400" />
                                <textarea
                                    name="testimonial"
                                    bind:value={formData.testimonial}
                                    required
                                    rows="4"
                                    minlength="20"
                                    maxlength="500"
                                    class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm 
                                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                    placeholder="Ceritakan pengalaman Anda menggunakan POS Platform..."
                                ></textarea>
                            </div>
                            <p class="text-xs text-gray-400 mt-1 text-right">{formData.testimonial.length}/500</p>
                        </div>
                        
                        <!-- Note -->
                        <div class="p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
                            <p>💡 Testimoni Anda akan ditampilkan setelah disetujui oleh admin.</p>
                        </div>
                        
                        <!-- Submit -->
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            class="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium 
                                   rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all
                                   disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {#if isSubmitting}
                                <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Mengirim...
                            {:else}
                                <Send size={18} />
                                Kirim Testimoni
                            {/if}
                        </button>
                    </form>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    @keyframes modal-in {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-modal-in { animation: modal-in 0.3s ease-out; }
</style>