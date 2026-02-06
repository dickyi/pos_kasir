<script>
    import { enhance } from '$app/forms';
    import { 
        Globe, Save, Plus, Trash2, Edit2, Eye, EyeOff,
        ChevronDown, Check, AlertCircle, ExternalLink,
        Sparkles, BarChart2, Zap, Gift, Star,
        HelpCircle, Layout, ToggleLeft
    } from 'lucide-svelte';

    export let data;
    export let form;

    $: hero = data?.hero || {};
    $: stats = data?.stats || [];
    $: features = data?.features || [];
    $: cta = data?.cta || {};
    $: faq = data?.faq || [];
    $: sections = data?.sections || [];
    $: queryKeys = data?.queryKeys || [];

    let activeTab = 'hero';
    let notification = null;
    let editModal = { show: false, type: '', data: null };

    // UPDATED: Hapus tab testimonials dan settings
    const tabs = [
        { id: 'hero', label: 'Hero', icon: Layout },
        { id: 'stats', label: 'Statistik', icon: BarChart2 },
        { id: 'features', label: 'Fitur', icon: Zap },
        { id: 'faq', label: 'FAQ', icon: HelpCircle },
        { id: 'cta', label: 'CTA', icon: Sparkles },
        { id: 'sections', label: 'On/Off', icon: ToggleLeft }
    ];

    const iconOptions = ['Zap', 'Package', 'BarChart3', 'Users', 'Tags', 'Smartphone', 'CreditCard', 'Shield', 'Server', 'Clock', 'Star', 'Heart', 'Gift', 'Check', 'ShoppingCart', 'DollarSign', 'TrendingUp', 'Activity', 'Database', 'Globe'];

    function showNotification(message, type = 'success') {
        notification = { message, type };
        setTimeout(() => notification = null, 3000);
    }

    $: if (form?.success) showNotification(form.message, 'success');
    $: if (form?.success === false) showNotification(form.message, 'error');

    function openEdit(type, item = null) {
        const defaultData = item ? {...item} : { source_type: 'manual' };
        editModal = { show: true, type, data: defaultData };
    }

    function closeEdit() {
        editModal = { show: false, type: '', data: null };
    }

    function handleToggleSection(event, sectionKey) {
        const form = event.target.closest('form');
        if (form) {
            form.requestSubmit();
        }
    }
</script>

<div class="p-6">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
            <h1 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Globe size={24} class="text-emerald-600" />
                Kelola Landing Page
            </h1>
            <p class="text-sm text-gray-500 mt-1">Kontrol konten halaman landing page</p>
        </div>
        <div class="flex items-center gap-3">
            <a href="/admin/settings/testimonial" class="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-medium border border-amber-200">
                <Star size={16} /> Kelola Testimonial
            </a>
            <a href="/" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
                <Eye size={16} /> Lihat Landing Page <ExternalLink size={14} />
            </a>
        </div>
    </div>

    <!-- Info Box -->
    <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p class="text-sm text-blue-700">
            <strong>💡 Tips:</strong> Pengaturan umum seperti nama aplikasi, kontak, social media, dan SEO 
            sudah dipindahkan ke <a href="/admin/settings" class="underline font-medium hover:text-blue-800">Pengaturan Umum</a>.
        </p>
    </div>

    <!-- Notification -->
    {#if notification}
        <div class="mb-4 p-3 rounded-lg flex items-center gap-2 {notification.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}">
            <Check size={18} />
            <span class="text-sm font-medium">{notification.message}</span>
        </div>
    {/if}

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200 overflow-x-auto">
        <div class="flex gap-1 min-w-max">
            {#each tabs as tab}
                <button
                    on:click={() => activeTab = tab.id}
                    class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                           {activeTab === tab.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
                >
                    <svelte:component this={tab.icon} size={16} />
                    {tab.label}
                </button>
            {/each}
        </div>
    </div>

    <!-- Content -->
    <div class="bg-white rounded-xl border border-gray-200 p-6">
        
        <!-- HERO -->
        {#if activeTab === 'hero'}
            <h2 class="text-lg font-semibold mb-4 flex items-center gap-2"><Layout size={20} class="text-emerald-600" /> Hero Section</h2>
            <form method="POST" action="?/updateHero" use:enhance class="space-y-4">
                <input type="hidden" name="id" value={hero.id || 1} />
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                        <input type="text" name="badge_text" value={hero.badge_text || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Judul Baris 1</label>
                        <input type="text" name="title_line1" value={hero.title_line1 || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Judul Baris 2 (Gradient)</label>
                        <input type="text" name="title_line2" value={hero.title_line2 || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Trust Text</label>
                        <input type="text" name="trust_text" value={hero.trust_text || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                    <textarea name="description" rows="3" class="w-full px-3 py-2 border rounded-lg text-sm">{hero.description || ''}</textarea>
                </div>
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">CTA Primary Text</label>
                        <input type="text" name="cta_primary_text" value={hero.cta_primary_text || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">CTA Primary Link</label>
                        <input type="text" name="cta_primary_link" value={hero.cta_primary_link || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">CTA Secondary Text</label>
                        <input type="text" name="cta_secondary_text" value={hero.cta_secondary_text || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">CTA Secondary Link</label>
                        <input type="text" name="cta_secondary_link" value={hero.cta_secondary_link || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                </div>
                <div class="grid md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                        <input type="text" name="rating" value={hero.rating || '4.9'} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Review Count</label>
                        <input type="text" name="review_count" value={hero.review_count || '500+'} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div class="flex items-end gap-2 pb-2">
                        <input type="checkbox" name="show_free_badge" id="show_free_badge" checked={hero.show_free_badge} class="rounded" />
                        <label for="show_free_badge" class="text-sm">Show Free Badge</label>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Free Badge Text</label>
                    <input type="text" name="free_badge_text" value={hero.free_badge_text || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                    <Save size={16} /> Simpan Hero
                </button>
            </form>
        {/if}

        <!-- STATS -->
        {#if activeTab === 'stats'}
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold flex items-center gap-2"><BarChart2 size={20} class="text-emerald-600" /> Statistik ({stats.length})</h2>
                <div class="flex gap-2">
                    <form method="POST" action="?/refreshStatsCache" use:enhance>
                        <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1" title="Refresh data dari database">
                            🔄 Refresh Cache
                        </button>
                    </form>
                    <button on:click={() => openEdit('stat')} class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm flex items-center gap-1">
                        <Plus size={16} /> Tambah
                    </button>
                </div>
            </div>
            
            <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <strong>💡 Tip:</strong> Statistik bisa diambil otomatis dari database (Auto) atau diisi manual. 
                Klik "Refresh Cache" untuk update data real-time dari database.
            </div>
            
            <div class="space-y-2">
                {#each stats as stat}
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center gap-4">
                            <span class="text-2xl font-bold text-emerald-600">
                                {#if stat.source_type === 'auto' && stat.cached_value}
                                    {stat.prefix || ''}{stat.cached_value}{stat.suffix || ''}
                                {:else}
                                    {stat.prefix || ''}{stat.manual_value || stat.value}{stat.suffix || ''}
                                {/if}
                            </span>
                            <div>
                                <span class="text-gray-600">{stat.label}</span>
                                <div class="flex items-center gap-2 mt-0.5">
                                    {#if stat.source_type === 'auto'}
                                        <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">🔄 Auto</span>
                                        {#if stat.raw_value}
                                            <span class="text-xs text-gray-400">Real: {Number(stat.raw_value).toLocaleString('id-ID')}</span>
                                        {/if}
                                    {:else}
                                        <span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">✏️ Manual</span>
                                    {/if}
                                    {#if !stat.is_active}
                                        <span class="text-xs bg-gray-200 px-2 py-0.5 rounded">Hidden</span>
                                    {/if}
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button on:click={() => openEdit('stat', stat)} class="p-1.5 hover:bg-gray-200 rounded"><Edit2 size={16} /></button>
                            <form method="POST" action="?/deleteStat" use:enhance>
                                <input type="hidden" name="id" value={stat.id} />
                                <button type="submit" class="p-1.5 hover:bg-red-100 text-red-600 rounded"><Trash2 size={16} /></button>
                            </form>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}

        <!-- FEATURES -->
        {#if activeTab === 'features'}
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold flex items-center gap-2"><Zap size={20} class="text-emerald-600" /> Fitur ({features.length})</h2>
                <button on:click={() => openEdit('feature')} class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm flex items-center gap-1">
                    <Plus size={16} /> Tambah
                </button>
            </div>
            <div class="grid md:grid-cols-2 gap-3">
                {#each features as feature}
                    <div class="p-4 border rounded-lg {feature.is_active ? '' : 'opacity-50'}">
                        <div class="flex items-start justify-between">
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">{feature.icon}</span>
                                    <span class="font-medium">{feature.title}</span>
                                </div>
                                <p class="text-sm text-gray-600">{feature.description}</p>
                            </div>
                            <div class="flex gap-1">
                                <button on:click={() => openEdit('feature', feature)} class="p-1 hover:bg-gray-100 rounded"><Edit2 size={14} /></button>
                                <form method="POST" action="?/deleteFeature" use:enhance>
                                    <input type="hidden" name="id" value={feature.id} />
                                    <button type="submit" class="p-1 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14} /></button>
                                </form>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}

        <!-- FAQ -->
        {#if activeTab === 'faq'}
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold flex items-center gap-2"><HelpCircle size={20} class="text-emerald-600" /> FAQ ({faq.length})</h2>
                <button on:click={() => openEdit('faq')} class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm flex items-center gap-1">
                    <Plus size={16} /> Tambah
                </button>
            </div>
            <div class="space-y-2">
                {#each faq as item}
                    <div class="p-3 border rounded-lg {item.is_active ? '' : 'opacity-50'}">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <p class="font-medium text-sm">{item.question}</p>
                                <p class="text-sm text-gray-600 mt-1">{item.answer}</p>
                            </div>
                            <div class="flex gap-1 ml-2">
                                <button on:click={() => openEdit('faq', item)} class="p-1 hover:bg-gray-100 rounded"><Edit2 size={14} /></button>
                                <form method="POST" action="?/deleteFAQ" use:enhance>
                                    <input type="hidden" name="id" value={item.id} />
                                    <button type="submit" class="p-1 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14} /></button>
                                </form>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}

        <!-- CTA -->
        {#if activeTab === 'cta'}
            <h2 class="text-lg font-semibold mb-4 flex items-center gap-2"><Sparkles size={20} class="text-emerald-600" /> Call to Action</h2>
            <form method="POST" action="?/updateCTA" use:enhance class="space-y-4">
                <input type="hidden" name="id" value={cta.id || 1} />
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                        <input type="text" name="badge_text" value={cta.badge_text || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input type="text" name="title" value={cta.title || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm">{cta.description || ''}</textarea>
                </div>
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Primary Button Text</label>
                        <input type="text" name="primary_btn_text" value={cta.primary_btn_text || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Primary Button Link</label>
                        <input type="text" name="primary_btn_link" value={cta.primary_btn_link || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Secondary Button Text</label>
                        <input type="text" name="secondary_btn_text" value={cta.secondary_btn_text || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Secondary Button Link</label>
                        <input type="text" name="secondary_btn_link" value={cta.secondary_btn_link || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <input type="checkbox" name="show_trust_badges" id="show_trust_badges" checked={cta.show_trust_badges} class="rounded" />
                    <label for="show_trust_badges" class="text-sm">Show Trust Badges</label>
                </div>
                <div class="grid md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Trust Badge 1</label>
                        <input type="text" name="trust_badge_1" value={cta.trust_badge_1 || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Trust Badge 2</label>
                        <input type="text" name="trust_badge_2" value={cta.trust_badge_2 || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Trust Badge 3</label>
                        <input type="text" name="trust_badge_3" value={cta.trust_badge_3 || ''} class="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                </div>
                <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                    <Save size={16} /> Simpan CTA
                </button>
            </form>
        {/if}

        <!-- SECTIONS ON/OFF -->
        {#if activeTab === 'sections'}
            <h2 class="text-lg font-semibold mb-4 flex items-center gap-2"><ToggleLeft size={20} class="text-emerald-600" /> Section Visibility</h2>
            <p class="text-sm text-gray-500 mb-4">Aktifkan atau nonaktifkan section yang tampil di landing page</p>
            <div class="space-y-2">
                {#each sections as section}
                    <form method="POST" action="?/toggleSection" use:enhance class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <input type="hidden" name="section_key" value={section.section_key} />
                        <div>
                            <p class="font-medium">{section.section_name}</p>
                            <p class="text-xs text-gray-500">{section.section_key}</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="is_visible" 
                                checked={section.is_visible} 
                                on:change={(e) => handleToggleSection(e, section.section_key)} 
                                class="sr-only peer" 
                            />
                            <div class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                    </form>
                {/each}
            </div>
        {/if}
    </div>
</div>

<!-- Edit Modal -->
{#if editModal.show}
<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div class="p-4 border-b flex items-center justify-between">
            <h3 class="font-semibold">{editModal.data?.id ? 'Edit' : 'Tambah'} {editModal.type}</h3>
            <button on:click={closeEdit} class="p-1 hover:bg-gray-100 rounded text-xl">&times;</button>
        </div>
        <form 
            method="POST" 
            action="?/save{editModal.type.charAt(0).toUpperCase() + editModal.type.slice(1)}" 
            use:enhance={() => { 
                return async ({ result, update }) => { 
                    closeEdit(); 
                    await update(); 
                }; 
            }} 
            class="p-4 space-y-4"
        >
            <input type="hidden" name="id" value={editModal.data?.id || 'new'} />
            
            {#if editModal.type === 'stat'}
                <div>
                    <label class="block text-sm font-medium mb-1">Mode Sumber Data</label>
                    <select name="source_type" class="w-full px-3 py-2 border rounded-lg" bind:value={editModal.data.source_type}>
                        <option value="manual">✏️ Manual (isi sendiri)</option>
                        <option value="auto">🔄 Auto (dari database)</option>
                    </select>
                </div>
                
                {#if editModal.data.source_type === 'auto'}
                    <div>
                        <label class="block text-sm font-medium mb-1">Query Key (Sumber Data)</label>
                        <select name="query_key" class="w-full px-3 py-2 border rounded-lg">
                            <option value="">-- Pilih sumber data --</option>
                            {#each queryKeys as qk}
                                <option value={qk.query_key} selected={editModal.data?.query_key === qk.query_key}>
                                    {qk.query_name}
                                </option>
                            {/each}
                        </select>
                        <p class="text-xs text-gray-500 mt-1">Data akan diambil otomatis dari database</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Nilai Fallback (jika cache kosong)</label>
                        <input type="text" name="manual_value" value={editModal.data?.manual_value || ''} class="w-full px-3 py-2 border rounded-lg" placeholder="Contoh: 10K" />
                    </div>
                {:else}
                    <div>
                        <label class="block text-sm font-medium mb-1">Nilai <span class="text-red-500">*</span></label>
                        <input type="text" name="manual_value" value={editModal.data?.manual_value || editModal.data?.value || ''} class="w-full px-3 py-2 border rounded-lg" required placeholder="Contoh: 10K, 1M, 99.9" />
                    </div>
                {/if}
                
                <div>
                    <label class="block text-sm font-medium mb-1">Label <span class="text-red-500">*</span></label>
                    <input type="text" name="label" value={editModal.data?.label || ''} class="w-full px-3 py-2 border rounded-lg" required placeholder="Contoh: UMKM Aktif" />
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Prefix</label>
                        <input type="text" name="prefix" value={editModal.data?.prefix || ''} class="w-full px-3 py-2 border rounded-lg" placeholder="Contoh: Rp " />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Suffix</label>
                        <input type="text" name="suffix" value={editModal.data?.suffix || '+'} class="w-full px-3 py-2 border rounded-lg" placeholder="Contoh: +, %" />
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1">Icon</label>
                    <select name="icon" class="w-full px-3 py-2 border rounded-lg">
                        {#each iconOptions as icon}
                            <option value={icon} selected={editModal.data?.icon === icon}>{icon}</option>
                        {/each}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Sort Order</label>
                    <input type="number" name="sort_order" value={editModal.data?.sort_order || 0} class="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div class="flex items-center gap-2">
                    <input type="checkbox" name="is_active" id="stat_active" checked={editModal.data?.is_active !== 0} />
                    <label for="stat_active">Aktif (tampilkan di landing page)</label>
                </div>
            {/if}

            {#if editModal.type === 'feature'}
                <div>
                    <label class="block text-sm font-medium mb-1">Icon</label>
                    <select name="icon" class="w-full px-3 py-2 border rounded-lg">
                        {#each iconOptions as icon}
                            <option value={icon} selected={editModal.data?.icon === icon}>{icon}</option>
                        {/each}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Title</label>
                    <input type="text" name="title" value={editModal.data?.title || ''} class="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Description</label>
                    <textarea name="description" rows="3" class="w-full px-3 py-2 border rounded-lg">{editModal.data?.description || ''}</textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Badge</label>
                    <input type="text" name="badge" value={editModal.data?.badge || 'Gratis'} class="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Sort Order</label>
                    <input type="number" name="sort_order" value={editModal.data?.sort_order || 0} class="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div class="flex items-center gap-2">
                    <input type="checkbox" name="is_active" id="feature_active" checked={editModal.data?.is_active !== 0} />
                    <label for="feature_active">Active</label>
                </div>
            {/if}

            {#if editModal.type === 'faq'}
                <div>
                    <label class="block text-sm font-medium mb-1">Question</label>
                    <input type="text" name="question" value={editModal.data?.question || ''} class="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Answer</label>
                    <textarea name="answer" rows="4" class="w-full px-3 py-2 border rounded-lg" required>{editModal.data?.answer || ''}</textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Category</label>
                    <input type="text" name="category" value={editModal.data?.category || 'general'} class="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Sort Order</label>
                    <input type="number" name="sort_order" value={editModal.data?.sort_order || 0} class="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div class="flex items-center gap-2">
                    <input type="checkbox" name="is_active" id="faq_active" checked={editModal.data?.is_active !== 0} />
                    <label for="faq_active">Active</label>
                </div>
            {/if}

            <div class="flex justify-end gap-2 pt-2">
                <button type="button" on:click={closeEdit} class="px-4 py-2 border rounded-lg text-sm">Batal</button>
                <button type="submit" class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">Simpan</button>
            </div>
        </form>
    </div>
</div>
{/if}