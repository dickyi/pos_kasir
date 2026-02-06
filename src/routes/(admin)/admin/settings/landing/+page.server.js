// ============================================
// ADMIN LANDING PAGE SERVER (UPDATED)
// File: src/routes/(admin)/admin/settings/landing/+page.server.js
// REMOVED: Testimonial actions (moved to /settings/testimonial)
// ============================================
import { updateStatsCache } from '$lib/data/statsCache.js';
import { query } from '$lib/db.js';
import { fail } from '@sveltejs/kit';

export async function load() {
    try {
        const [
            hero,
            stats,
            features,
            cta,
            faq,
            sections,
            settings,
            queryKeys
        ] = await Promise.all([
            loadHero(),
            loadStats(),
            loadFeatures(),
            loadCTA(),
            loadFAQ(),
            loadSections(),
            loadSettings(),
            loadQueryKeys()
        ]);

        return {
            hero,
            stats,
            features,
            cta,
            faq,
            sections,
            settings,
            queryKeys
        };
    } catch (error) {
        console.error('Error loading landing page data:', error);
        return {
            hero: {},
            stats: [],
            features: [],
            cta: {},
            faq: [],
            sections: [],
            settings: [],
            queryKeys: []
        };
    }
}

// ============================================
// LOAD FUNCTIONS
// ============================================

async function loadHero() {
    const results = await query(`SELECT * FROM landing_hero WHERE is_active = 1 LIMIT 1`);
    return results[0] || {};
}

async function loadStats() {
    return await query(`
        SELECT ls.*, sc.raw_value, sc.last_updated as cache_last_updated
        FROM landing_stats ls
        LEFT JOIN stats_cache sc ON ls.query_key = sc.cache_key
        ORDER BY ls.sort_order ASC
    `);
}

async function loadQueryKeys() {
    try {
        return await query(`SELECT * FROM stats_query_keys WHERE is_active = 1 ORDER BY query_name ASC`);
    } catch (e) {
        return [];
    }
}

async function loadFeatures() {
    return await query(`SELECT * FROM landing_features ORDER BY sort_order ASC`);
}

async function loadCTA() {
    const results = await query(`SELECT * FROM landing_cta WHERE section_name = 'main' LIMIT 1`);
    return results[0] || {};
}

async function loadFAQ() {
    return await query(`SELECT * FROM landing_faq ORDER BY sort_order ASC`);
}

async function loadSections() {
    return await query(`SELECT * FROM landing_sections ORDER BY sort_order ASC`);
}

async function loadSettings() {
    return await query(`SELECT * FROM platform_settings ORDER BY category, sort_order ASC`);
}

// ============================================
// FORM ACTIONS
// ============================================

export const actions = {
    // ==================== HERO ====================
    updateHero: async ({ request }) => {
        const data = await request.formData();
        
        try {
            const id = data.get('id') || 1;
            
            await query(`
                UPDATE landing_hero SET
                    badge_text = ?,
                    badge_icon = ?,
                    title_line1 = ?,
                    title_line2 = ?,
                    description = ?,
                    cta_primary_text = ?,
                    cta_primary_link = ?,
                    cta_secondary_text = ?,
                    cta_secondary_link = ?,
                    trust_text = ?,
                    rating = ?,
                    review_count = ?,
                    show_free_badge = ?,
                    free_badge_text = ?
                WHERE id = ?
            `, [
                data.get('badge_text'),
                data.get('badge_icon') || 'Gift',
                data.get('title_line1'),
                data.get('title_line2'),
                data.get('description'),
                data.get('cta_primary_text'),
                data.get('cta_primary_link'),
                data.get('cta_secondary_text'),
                data.get('cta_secondary_link'),
                data.get('trust_text'),
                data.get('rating'),
                data.get('review_count'),
                data.has('show_free_badge') ? 1 : 0,
                data.get('free_badge_text'),
                id
            ]);

            return { success: true, message: 'Hero berhasil diupdate!' };
        } catch (error) {
            console.error('Error updating hero:', error);
            return fail(500, { success: false, message: 'Gagal update hero' });
        }
    },

    // ==================== STATS ====================
    saveStat: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id');
        const sourceType = data.get('source_type') || 'manual';

        try {
            if (id === 'new') {
                await query(`
                    INSERT INTO landing_stats (value, label, icon, sort_order, is_active, source_type, query_key, manual_value, prefix, suffix, format_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    data.get('value') || data.get('manual_value'),
                    data.get('label'),
                    data.get('icon') || 'Users',
                    parseInt(data.get('sort_order')) || 0,
                    data.has('is_active') ? 1 : 0,
                    sourceType,
                    sourceType === 'auto' ? data.get('query_key') : null,
                    data.get('manual_value'),
                    data.get('prefix') || null,
                    data.get('suffix') || '+',
                    data.get('format_type') || 'number'
                ]);
            } else {
                await query(`
                    UPDATE landing_stats SET
                        value = ?,
                        label = ?,
                        icon = ?,
                        sort_order = ?,
                        is_active = ?,
                        source_type = ?,
                        query_key = ?,
                        manual_value = ?,
                        prefix = ?,
                        suffix = ?,
                        format_type = ?
                    WHERE id = ?
                `, [
                    data.get('value') || data.get('manual_value'),
                    data.get('label'),
                    data.get('icon') || 'Users',
                    parseInt(data.get('sort_order')) || 0,
                    data.has('is_active') ? 1 : 0,
                    sourceType,
                    sourceType === 'auto' ? data.get('query_key') : null,
                    data.get('manual_value'),
                    data.get('prefix') || null,
                    data.get('suffix') || '+',
                    data.get('format_type') || 'number',
                    id
                ]);
            }
            return { success: true, message: 'Statistik berhasil disimpan!' };
        } catch (error) {
            console.error('Error saving stat:', error);
            return fail(500, { success: false, message: 'Gagal menyimpan statistik' });
        }
    },

   refreshStatsCache: async () => {
    try {
        const result = await updateStatsCache();
        if (result.success) {
            return { success: true, message: result.message };
        } else {
            return fail(500, { success: false, message: result.message });
        }
    } catch (error) {
        console.error('Error refreshing stats cache:', error);
        return fail(500, { success: false, message: 'Gagal refresh cache: ' + error.message });
    }
},

    deleteStat: async ({ request }) => {
        const data = await request.formData();
        try {
            await query(`DELETE FROM landing_stats WHERE id = ?`, [data.get('id')]);
            return { success: true, message: 'Statistik berhasil dihapus!' };
        } catch (error) {
            console.error('Error deleting stat:', error);
            return fail(500, { success: false, message: 'Gagal menghapus statistik' });
        }
    },

    // ==================== FEATURES ====================
    saveFeature: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id');

        try {
            if (id === 'new') {
                await query(`
                    INSERT INTO landing_features (icon, title, description, badge, sort_order, is_active)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    data.get('icon') || 'Zap',
                    data.get('title'),
                    data.get('description'),
                    data.get('badge') || 'Gratis',
                    parseInt(data.get('sort_order')) || 0,
                    data.has('is_active') ? 1 : 0
                ]);
            } else {
                await query(`
                    UPDATE landing_features SET
                        icon = ?,
                        title = ?,
                        description = ?,
                        badge = ?,
                        sort_order = ?,
                        is_active = ?
                    WHERE id = ?
                `, [
                    data.get('icon') || 'Zap',
                    data.get('title'),
                    data.get('description'),
                    data.get('badge') || 'Gratis',
                    parseInt(data.get('sort_order')) || 0,
                    data.has('is_active') ? 1 : 0,
                    id
                ]);
            }
            return { success: true, message: 'Fitur berhasil disimpan!' };
        } catch (error) {
            console.error('Error saving feature:', error);
            return fail(500, { success: false, message: 'Gagal menyimpan fitur' });
        }
    },

    deleteFeature: async ({ request }) => {
        const data = await request.formData();
        try {
            await query(`DELETE FROM landing_features WHERE id = ?`, [data.get('id')]);
            return { success: true, message: 'Fitur berhasil dihapus!' };
        } catch (error) {
            console.error('Error deleting feature:', error);
            return fail(500, { success: false, message: 'Gagal menghapus fitur' });
        }
    },

    // ==================== FAQ ====================
    saveFaq: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id');

        try {
            if (id === 'new') {
                await query(`
                    INSERT INTO landing_faq (question, answer, category, sort_order, is_active)
                    VALUES (?, ?, ?, ?, ?)
                `, [
                    data.get('question'),
                    data.get('answer'),
                    data.get('category') || 'general',
                    parseInt(data.get('sort_order')) || 0,
                    data.has('is_active') ? 1 : 0
                ]);
            } else {
                await query(`
                    UPDATE landing_faq SET
                        question = ?,
                        answer = ?,
                        category = ?,
                        sort_order = ?,
                        is_active = ?
                    WHERE id = ?
                `, [
                    data.get('question'),
                    data.get('answer'),
                    data.get('category') || 'general',
                    parseInt(data.get('sort_order')) || 0,
                    data.has('is_active') ? 1 : 0,
                    id
                ]);
            }
            return { success: true, message: 'FAQ berhasil disimpan!' };
        } catch (error) {
            console.error('Error saving FAQ:', error);
            return fail(500, { success: false, message: 'Gagal menyimpan FAQ' });
        }
    },

    deleteFAQ: async ({ request }) => {
        const data = await request.formData();
        try {
            await query(`DELETE FROM landing_faq WHERE id = ?`, [data.get('id')]);
            return { success: true, message: 'FAQ berhasil dihapus!' };
        } catch (error) {
            console.error('Error deleting FAQ:', error);
            return fail(500, { success: false, message: 'Gagal menghapus FAQ' });
        }
    },

    // ==================== CTA ====================
    updateCTA: async ({ request }) => {
        const data = await request.formData();

        try {
            const id = data.get('id') || 1;

            await query(`
                UPDATE landing_cta SET
                    badge_text = ?,
                    title = ?,
                    description = ?,
                    primary_btn_text = ?,
                    primary_btn_link = ?,
                    secondary_btn_text = ?,
                    secondary_btn_link = ?,
                    show_trust_badges = ?,
                    trust_badge_1 = ?,
                    trust_badge_2 = ?,
                    trust_badge_3 = ?
                WHERE id = ?
            `, [
                data.get('badge_text'),
                data.get('title'),
                data.get('description'),
                data.get('primary_btn_text'),
                data.get('primary_btn_link'),
                data.get('secondary_btn_text'),
                data.get('secondary_btn_link'),
                data.has('show_trust_badges') ? 1 : 0,
                data.get('trust_badge_1'),
                data.get('trust_badge_2'),
                data.get('trust_badge_3'),
                id
            ]);

            return { success: true, message: 'CTA berhasil diupdate!' };
        } catch (error) {
            console.error('Error updating CTA:', error);
            return fail(500, { success: false, message: 'Gagal update CTA' });
        }
    },

    // ==================== SECTIONS TOGGLE ====================
    toggleSection: async ({ request }) => {
        const data = await request.formData();
        const sectionKey = data.get('section_key');
        const isVisible = data.has('is_visible') ? 1 : 0;

        try {
            await query(`
                UPDATE landing_sections SET is_visible = ? WHERE section_key = ?
            `, [isVisible, sectionKey]);

            return { success: true, message: `Section ${sectionKey} berhasil diupdate!` };
        } catch (error) {
            console.error('Error toggling section:', error);
            return fail(500, { success: false, message: 'Gagal update section' });
        }
    },

    // ==================== SETTINGS ====================
    updateSetting: async ({ request }) => {
        const data = await request.formData();
        const key = data.get('key');
        const value = data.get('value');

        try {
            await query(`
                UPDATE platform_settings SET setting_value = ? WHERE setting_key = ?
            `, [value, key]);

            return { success: true, message: 'Setting berhasil diupdate!' };
        } catch (error) {
            console.error('Error updating setting:', error);
            return fail(500, { success: false, message: 'Gagal update setting' });
        }
    }
};