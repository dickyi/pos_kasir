<script>
    import { ArrowLeft } from 'lucide-svelte';
    import TermsContent from '$lib/components/public/TermsContent.svelte';
</script>

<svelte:head>
    <title>Syarat & Ketentuan - POSKasir</title>
    <meta name="description" content="Syarat dan Ketentuan penggunaan layanan POSKasir - Sistem kasir gratis untuk UMKM Indonesia.">
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 sm:py-12">
    <div class="max-w-3xl mx-auto px-4 sm:px-6">
        
        <!-- Back Button -->
        <a 
            href="/register" 
            class="inline-flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors mb-6 group"
        >
            <ArrowLeft class="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span class="text-sm font-medium">Kembali ke Pendaftaran</span>
        </a>
        
        <!-- Content Card -->
        <div class="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8 lg:p-10">
            <TermsContent appName="POSKasir" lastUpdated="1 Februari 2026" />
        </div>
        
        <!-- Footer Navigation -->
        <div class="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <a 
                href="/kebijakan-privasi" 
                class="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
            >
                Baca juga: Kebijakan Privasi →
            </a>
            <a 
                href="/register" 
                class="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
                Daftar Sekarang
            </a>
        </div>
    </div>
</div>