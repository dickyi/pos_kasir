<script>
    import { Star, Quote, ChevronLeft, ChevronRight, Plus, MessageSquare, MapPin } from 'lucide-svelte';
    import TestimonialForm from './TestimonialForm.svelte';
    
    export let testimonials = [];
    export let title = 'Apa Kata Mereka?';
    export let subtitle = 'Testimoni dari pengguna POS Platform';
    
    let currentIndex = 0;
    let showForm = false;
    
    // Filter hanya yang approved dan is_active
    $: visibleTestimonials = testimonials.filter(t => t.is_active && t.status === 'approved');
    $: currentTestimonial = visibleTestimonials[currentIndex] || null;
    
    function next() {
        if (currentIndex < visibleTestimonials.length - 1) {
            currentIndex++;
        } else {
            currentIndex = 0;
        }
    }
    
    function prev() {
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = visibleTestimonials.length - 1;
        }
    }
    
    function goTo(index) {
        currentIndex = index;
    }
    
    function getInitials(name) {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
    }
    
    // Auto slide setiap 5 detik
    import { onMount, onDestroy } from 'svelte';
    let interval;
    
    onMount(() => {
        if (visibleTestimonials.length > 1) {
            interval = setInterval(next, 5000);
        }
    });
    
    onDestroy(() => {
        if (interval) clearInterval(interval);
    });
</script>

<section id="testimonials" class="py-20 bg-gradient-to-b from-gray-50 to-white">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
            <p class="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>
        
        {#if visibleTestimonials.length > 0}
            <!-- Testimonial Card -->
            <div class="relative max-w-4xl mx-auto">
                <!-- Quote Icon -->
                <div class="absolute -top-6 left-8 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center z-10">
                    <Quote size={24} class="text-emerald-600" />
                </div>
                
                <!-- Card -->
                <div class="bg-white rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
                    <!-- Background Pattern -->
                    <div class="absolute top-0 right-0 w-40 h-40 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                    <div class="absolute bottom-0 left-0 w-32 h-32 bg-teal-50 rounded-full translate-y-1/2 -translate-x-1/2 opacity-50"></div>
                    
                    {#if currentTestimonial}
                        <div class="relative z-10">
                            <!-- Rating -->
                            <div class="flex items-center gap-1 mb-6">
                                {#each Array(5) as _, i}
                                    <Star 
                                        size={20} 
                                        class="{i < currentTestimonial.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}"
                                    />
                                {/each}
                            </div>
                            
                            <!-- Content (gunakan kolom 'testimonial' bukan 'content') -->
                            <blockquote class="text-lg md:text-xl text-gray-700 leading-relaxed mb-8">
                                "{currentTestimonial.testimonial}"
                            </blockquote>
                            
                            <!-- Author -->
                            <div class="flex items-center gap-4">
                                {#if currentTestimonial.avatar}
                                    <img 
                                        src={currentTestimonial.avatar} 
                                        alt={currentTestimonial.name}
                                        class="w-14 h-14 rounded-full object-cover"
                                    />
                                {:else}
                                    <div class="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                                        {getInitials(currentTestimonial.name)}
                                    </div>
                                {/if}
                                <div>
                                    <p class="font-semibold text-gray-900">{currentTestimonial.name}</p>
                                    <p class="text-sm text-gray-500">
                                        {currentTestimonial.role ? `${currentTestimonial.role}, ` : ''}{currentTestimonial.business_name}
                                    </p>
                                    {#if currentTestimonial.location}
                                        <p class="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                            <MapPin size={10} />
                                            {currentTestimonial.location}
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
                
                <!-- Navigation Arrows -->
                {#if visibleTestimonials.length > 1}
                    <button 
                        on:click={prev}
                        class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 
                               w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center
                               hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <ChevronLeft size={24} class="text-gray-600" />
                    </button>
                    <button 
                        on:click={next}
                        class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 
                               w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center
                               hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <ChevronRight size={24} class="text-gray-600" />
                    </button>
                {/if}
            </div>
            
            <!-- Dots Indicator -->
            {#if visibleTestimonials.length > 1}
                <div class="flex items-center justify-center gap-2 mt-8">
                    {#each visibleTestimonials as _, i}
                        <button 
                            on:click={() => goTo(i)}
                            class="w-3 h-3 rounded-full transition-all 
                                   {i === currentIndex ? 'bg-emerald-600 w-8' : 'bg-gray-300 hover:bg-gray-400'}"
                        ></button>
                    {/each}
                </div>
            {/if}
        {:else}
            <!-- Empty State -->
            <div class="text-center py-12">
                <MessageSquare size={48} class="mx-auto text-gray-300 mb-4" />
                <p class="text-gray-500">Belum ada testimoni</p>
            </div>
        {/if}
        
        <!-- Submit Testimonial Button -->
        <div class="text-center mt-12">
            <button 
                on:click={() => showForm = true}
                class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 
                       text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 
                       transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
                <Plus size={20} />
                Bagikan Pengalaman Anda
            </button>
            <p class="text-sm text-gray-500 mt-2">Sudah menggunakan POS Platform? Ceritakan pengalaman Anda!</p>
        </div>
    </div>
</section>

<!-- Testimonial Form Modal -->
<TestimonialForm 
    show={showForm} 
    onClose={() => showForm = false}
    onSuccess={() => {
        // Optional: refresh testimonials
    }}
/>