<script>
    import { Shield, CheckCircle, AlertTriangle, FileText, Users, CreditCard, Lock, Scale } from 'lucide-svelte';
    
    export let appName = 'POSKasir';
    export let lastUpdated = '1 Februari 2026';
</script>

<div class="terms-content prose prose-slate max-w-none">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6 not-prose">
        <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <FileText class="w-6 h-6 text-white" />
        </div>
        <div>
            <h1 class="text-2xl font-bold text-slate-800 m-0">Syarat & Ketentuan</h1>
            <p class="text-sm text-slate-500 m-0">Terakhir diperbarui: {lastUpdated}</p>
        </div>
    </div>

    <!-- Intro -->
    <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 not-prose">
        <p class="text-sm text-emerald-800 m-0">
            Dengan mendaftar dan menggunakan layanan <strong>{appName}</strong>, Anda menyetujui syarat dan ketentuan berikut ini. Harap baca dengan seksama.
        </p>
    </div>

    <!-- Section 1 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Users class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">1. Definisi</h2>
        </div>
        <ul class="text-sm text-slate-600 space-y-2 ml-0 pl-5">
            <li><strong>"Layanan"</strong> merujuk pada aplikasi {appName} termasuk semua fitur, fungsi, dan konten yang disediakan.</li>
            <li><strong>"Pengguna"</strong> adalah individu atau badan usaha yang mendaftar dan menggunakan Layanan.</li>
            <li><strong>"Akun"</strong> adalah akses terdaftar yang dibuat oleh Pengguna untuk menggunakan Layanan.</li>
            <li><strong>"Data"</strong> adalah semua informasi yang dimasukkan, disimpan, atau diproses melalui Layanan.</li>
        </ul>
    </section>

    <!-- Section 2 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <CheckCircle class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">2. Pendaftaran Akun</h2>
        </div>
        <ul class="text-sm text-slate-600 space-y-2 ml-0 pl-5">
            <li>Pengguna wajib memberikan informasi yang akurat dan lengkap saat pendaftaran.</li>
            <li>Satu email hanya dapat digunakan untuk satu akun.</li>
            <li>Pengguna bertanggung jawab menjaga kerahasiaan password dan keamanan akun.</li>
            <li>Pengguna harus berusia minimal 18 tahun atau memiliki izin dari wali yang sah.</li>
            <li>Kami berhak menolak atau membatalkan pendaftaran tanpa pemberitahuan jika ditemukan pelanggaran.</li>
        </ul>
    </section>

    <!-- Section 3 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Shield class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">3. Penggunaan Layanan</h2>
        </div>
        <p class="text-sm text-slate-600 mb-3">Pengguna setuju untuk:</p>
        <ul class="text-sm text-slate-600 space-y-2 ml-0 pl-5">
            <li>Menggunakan Layanan sesuai dengan hukum dan peraturan yang berlaku di Indonesia.</li>
            <li>Tidak menyalahgunakan Layanan untuk aktivitas ilegal, penipuan, atau merugikan pihak lain.</li>
            <li>Tidak mencoba mengakses sistem tanpa izin atau mengganggu operasional Layanan.</li>
            <li>Tidak membagikan akses akun kepada pihak yang tidak berwenang.</li>
            <li>Bertanggung jawab penuh atas semua aktivitas yang dilakukan melalui akun.</li>
        </ul>
    </section>

    <!-- Section 4 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <CreditCard class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">4. Biaya dan Pembayaran</h2>
        </div>
        <ul class="text-sm text-slate-600 space-y-2 ml-0 pl-5">
            <li>Layanan dasar {appName} disediakan <strong>GRATIS</strong> untuk UMKM Indonesia.</li>
            <li>Fitur premium (jika ada) akan dikenakan biaya sesuai ketentuan yang berlaku.</li>
            <li>Perubahan harga akan diberitahukan minimal 30 hari sebelum berlaku.</li>
            <li>Pembayaran yang sudah dilakukan tidak dapat dikembalikan kecuali ditentukan lain.</li>
        </ul>
    </section>

    <!-- Section 5 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Lock class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">5. Data dan Privasi</h2>
        </div>
        <ul class="text-sm text-slate-600 space-y-2 ml-0 pl-5">
            <li>Pengguna memiliki hak penuh atas data bisnis yang dimasukkan ke dalam sistem.</li>
            <li>Kami tidak akan menjual atau membagikan data Pengguna kepada pihak ketiga untuk tujuan komersial.</li>
            <li>Pengumpulan dan penggunaan data diatur dalam <strong>Kebijakan Privasi</strong> terpisah.</li>
            <li>Kami melakukan backup data secara berkala, namun Pengguna disarankan menyimpan salinan data penting.</li>
        </ul>
    </section>

    <!-- Section 6 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <AlertTriangle class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">6. Batasan Tanggung Jawab</h2>
        </div>
        <ul class="text-sm text-slate-600 space-y-2 ml-0 pl-5">
            <li>Layanan disediakan "sebagaimana adanya" tanpa jaminan apapun.</li>
            <li>Kami tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan, atau kerusakan data.</li>
            <li>Kami tidak menjamin Layanan akan selalu tersedia tanpa gangguan.</li>
            <li>Pengguna bertanggung jawab atas keputusan bisnis yang dibuat berdasarkan data dari Layanan.</li>
        </ul>
    </section>

    <!-- Section 7 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Scale class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">7. Penghentian Layanan</h2>
        </div>
        <ul class="text-sm text-slate-600 space-y-2 ml-0 pl-5">
            <li>Pengguna dapat menghentikan penggunaan Layanan kapan saja.</li>
            <li>Kami berhak menangguhkan atau menghentikan akun jika terjadi pelanggaran.</li>
            <li>Setelah penghentian, data akan disimpan selama 30 hari sebelum dihapus permanen.</li>
            <li>Pengguna dapat meminta ekspor data sebelum penghentian akun.</li>
        </ul>
    </section>

    <!-- Section 8 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">8. Perubahan Ketentuan</h2>
        </div>
        <ul class="text-sm text-slate-600 space-y-2 ml-0 pl-5">
            <li>Kami dapat mengubah Syarat & Ketentuan ini sewaktu-waktu.</li>
            <li>Perubahan material akan diberitahukan melalui email atau notifikasi di aplikasi.</li>
            <li>Penggunaan Layanan setelah perubahan dianggap sebagai persetujuan atas ketentuan baru.</li>
        </ul>
    </section>

    <!-- Section 9 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Scale class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">9. Hukum yang Berlaku</h2>
        </div>
        <ul class="text-sm text-slate-600 space-y-2 ml-0 pl-5">
            <li>Syarat & Ketentuan ini tunduk pada hukum Republik Indonesia.</li>
            <li>Sengketa akan diselesaikan secara musyawarah, atau melalui pengadilan di Jakarta jika diperlukan.</li>
        </ul>
    </section>

    <!-- Contact -->
    <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 not-prose">
        <h3 class="text-sm font-semibold text-slate-800 mb-2">Pertanyaan?</h3>
        <p class="text-sm text-slate-600 m-0">
            Jika ada pertanyaan mengenai Syarat & Ketentuan ini, silakan hubungi kami di 
            <a href="mailto:support@poskasir.com" class="text-emerald-600 hover:underline">support@poskasir.com</a>
        </p>
    </div>
</div>

<style>
    .terms-content :global(ul) {
        list-style-type: disc;
    }
    
    .terms-content :global(li::marker) {
        color: #10b981;
    }
</style>