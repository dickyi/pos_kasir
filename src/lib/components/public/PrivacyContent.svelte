<script>
    import { Shield, Eye, Database, Share2, Lock, Bell, UserCheck, Mail, Trash2 } from 'lucide-svelte';
    
    export let appName = 'POSKasir';
    export let lastUpdated = '1 Februari 2026';
</script>

<div class="privacy-content prose prose-slate max-w-none">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6 not-prose">
        <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield class="w-6 h-6 text-white" />
        </div>
        <div>
            <h1 class="text-2xl font-bold text-slate-800 m-0">Kebijakan Privasi</h1>
            <p class="text-sm text-slate-500 m-0">Terakhir diperbarui: {lastUpdated}</p>
        </div>
    </div>

    <!-- Intro -->
    <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 not-prose">
        <p class="text-sm text-emerald-800 m-0">
            <strong>{appName}</strong> berkomitmen melindungi privasi Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda sesuai dengan UU Perlindungan Data Pribadi (UU PDP) Indonesia.
        </p>
    </div>

    <!-- Section 1 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Database class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">1. Data yang Kami Kumpulkan</h2>
        </div>
        
        <h4 class="text-sm font-semibold text-slate-700 mt-4 mb-2">a. Data yang Anda Berikan</h4>
        <ul class="text-sm text-slate-600 space-y-1 ml-0 pl-5">
            <li>Nama lengkap dan nama bisnis</li>
            <li>Alamat email dan nomor telepon/WhatsApp</li>
            <li>Alamat bisnis (provinsi, kota, alamat lengkap)</li>
            <li>Jenis usaha</li>
            <li>Data transaksi dan produk yang Anda masukkan</li>
        </ul>
        
        <h4 class="text-sm font-semibold text-slate-700 mt-4 mb-2">b. Data yang Dikumpulkan Otomatis</h4>
        <ul class="text-sm text-slate-600 space-y-1 ml-0 pl-5">
            <li>Alamat IP dan informasi perangkat</li>
            <li>Jenis browser dan sistem operasi</li>
            <li>Waktu akses dan halaman yang dikunjungi</li>
            <li>Data penggunaan fitur aplikasi</li>
        </ul>
    </section>

    <!-- Section 2 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Eye class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">2. Penggunaan Data</h2>
        </div>
        <p class="text-sm text-slate-600 mb-3">Kami menggunakan data Anda untuk:</p>
        <ul class="text-sm text-slate-600 space-y-2 ml-0 pl-5">
            <li><strong>Menyediakan Layanan</strong> — Memproses pendaftaran, mengelola akun, dan menjalankan fitur aplikasi.</li>
            <li><strong>Komunikasi</strong> — Mengirim notifikasi penting, update fitur, dan dukungan pelanggan.</li>
            <li><strong>Peningkatan Layanan</strong> — Menganalisis penggunaan untuk meningkatkan performa dan pengalaman pengguna.</li>
            <li><strong>Keamanan</strong> — Mendeteksi dan mencegah aktivitas mencurigakan atau penipuan.</li>
            <li><strong>Kewajiban Hukum</strong> — Memenuhi persyaratan hukum dan peraturan yang berlaku.</li>
        </ul>
    </section>

    <!-- Section 3 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Share2 class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">3. Berbagi Data</h2>
        </div>
        
        <div class="bg-red-50 border border-red-100 rounded-lg p-3 mb-3 not-prose">
            <p class="text-sm text-red-800 m-0 font-medium">
                ❌ Kami TIDAK menjual data pribadi Anda kepada pihak ketiga.
            </p>
        </div>
        
        <p class="text-sm text-slate-600 mb-3">Data mungkin dibagikan hanya dalam kondisi berikut:</p>
        <ul class="text-sm text-slate-600 space-y-2 ml-0 pl-5">
            <li><strong>Penyedia Layanan</strong> — Pihak ketiga yang membantu operasional kami (hosting, email, analitik) dengan perjanjian kerahasiaan.</li>
            <li><strong>Kewajiban Hukum</strong> — Jika diwajibkan oleh hukum, perintah pengadilan, atau proses hukum yang sah.</li>
            <li><strong>Perlindungan Hak</strong> — Untuk melindungi hak, keamanan, atau properti kami dan pengguna lain.</li>
            <li><strong>Persetujuan Anda</strong> — Dengan persetujuan eksplisit dari Anda untuk tujuan tertentu.</li>
        </ul>
    </section>

    <!-- Section 4 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Lock class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">4. Keamanan Data</h2>
        </div>
        <p class="text-sm text-slate-600 mb-3">Kami menerapkan langkah keamanan berikut:</p>
        <ul class="text-sm text-slate-600 space-y-2 ml-0 pl-5">
            <li><strong>Enkripsi</strong> — Data sensitif dienkripsi saat transit (HTTPS/TLS) dan saat disimpan.</li>
            <li><strong>Hashing Password</strong> — Password disimpan dalam bentuk hash yang tidak dapat dibaca.</li>
            <li><strong>Akses Terbatas</strong> — Hanya personel berwenang yang dapat mengakses data pengguna.</li>
            <li><strong>Monitoring</strong> — Sistem dipantau untuk mendeteksi aktivitas mencurigakan.</li>
            <li><strong>Backup Rutin</strong> — Data di-backup secara berkala untuk mencegah kehilangan.</li>
        </ul>
    </section>

    <!-- Section 5 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <UserCheck class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">5. Hak Anda</h2>
        </div>
        <p class="text-sm text-slate-600 mb-3">Sesuai UU PDP Indonesia, Anda memiliki hak untuk:</p>
        <ul class="text-sm text-slate-600 space-y-2 ml-0 pl-5">
            <li><strong>Akses</strong> — Meminta salinan data pribadi yang kami miliki tentang Anda.</li>
            <li><strong>Koreksi</strong> — Memperbarui atau memperbaiki data yang tidak akurat.</li>
            <li><strong>Penghapusan</strong> — Meminta penghapusan data pribadi Anda (dengan batasan tertentu).</li>
            <li><strong>Portabilitas</strong> — Meminta data Anda dalam format yang dapat dibaca mesin.</li>
            <li><strong>Keberatan</strong> — Menolak penggunaan data untuk tujuan tertentu seperti pemasaran.</li>
            <li><strong>Penarikan Persetujuan</strong> — Mencabut persetujuan yang sebelumnya diberikan.</li>
        </ul>
        <p class="text-sm text-slate-600 mt-3">
            Untuk menggunakan hak-hak ini, hubungi kami di <a href="mailto:privacy@poskasir.com" class="text-emerald-600 hover:underline">privacy@poskasir.com</a>
        </p>
    </section>

    <!-- Section 6 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Bell class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">6. Cookie dan Teknologi Pelacakan</h2>
        </div>
        <p class="text-sm text-slate-600 mb-3">Kami menggunakan cookie untuk:</p>
        <ul class="text-sm text-slate-600 space-y-2 ml-0 pl-5">
            <li><strong>Cookie Esensial</strong> — Diperlukan untuk fungsi dasar seperti login dan keamanan.</li>
            <li><strong>Cookie Analitik</strong> — Membantu kami memahami bagaimana pengguna menggunakan aplikasi.</li>
            <li><strong>Cookie Preferensi</strong> — Menyimpan pengaturan dan preferensi Anda.</li>
        </ul>
        <p class="text-sm text-slate-600 mt-3">
            Anda dapat mengatur preferensi cookie melalui pengaturan browser Anda.
        </p>
    </section>

    <!-- Section 7 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Trash2 class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">7. Penyimpanan Data</h2>
        </div>
        <ul class="text-sm text-slate-600 space-y-2 ml-0 pl-5">
            <li>Data disimpan selama akun Anda aktif atau selama diperlukan untuk menyediakan layanan.</li>
            <li>Setelah penghapusan akun, data akan dihapus dalam 30 hari kecuali diperlukan untuk kewajiban hukum.</li>
            <li>Data transaksi mungkin disimpan lebih lama untuk keperluan akuntansi dan audit.</li>
            <li>Data server disimpan di Indonesia atau negara dengan perlindungan data yang memadai.</li>
        </ul>
    </section>

    <!-- Section 8 -->
    <section class="mb-6">
        <div class="flex items-center gap-2 mb-3 not-prose">
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Mail class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-800 m-0">8. Perubahan Kebijakan</h2>
        </div>
        <ul class="text-sm text-slate-600 space-y-2 ml-0 pl-5">
            <li>Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu.</li>
            <li>Perubahan signifikan akan diberitahukan melalui email atau notifikasi dalam aplikasi.</li>
            <li>Tanggal "Terakhir diperbarui" di bagian atas menunjukkan revisi terbaru.</li>
            <li>Penggunaan berkelanjutan setelah perubahan dianggap sebagai persetujuan.</li>
        </ul>
    </section>

    <!-- Contact -->
    <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 not-prose">
        <h3 class="text-sm font-semibold text-slate-800 mb-2">Hubungi Kami</h3>
        <p class="text-sm text-slate-600 mb-3">
            Jika ada pertanyaan tentang Kebijakan Privasi ini atau cara kami menangani data Anda:
        </p>
        <ul class="text-sm text-slate-600 space-y-1">
            <li>📧 Email: <a href="mailto:privacy@poskasir.com" class="text-emerald-600 hover:underline">privacy@poskasir.com</a></li>
            <li>📞 WhatsApp: <a href="https://wa.me/6281234567890" class="text-emerald-600 hover:underline">0812-3456-7890</a></li>
        </ul>
    </div>
</div>

<style>
    .privacy-content :global(ul) {
        list-style-type: disc;
    }
    
    .privacy-content :global(li::marker) {
        color: #10b981;
    }
</style>