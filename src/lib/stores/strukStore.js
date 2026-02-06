/**
 * ============================================
 * Store: Pengaturan Struk
 * ============================================
 * File: src/lib/stores/strukStore.js
 * 
 * Menyimpan pengaturan struk di client-side
 * untuk akses cepat di halaman kasir
 * ============================================
 */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Default settings
const defaultSettings = {
    struk_logo: null,
    struk_header: '',
    struk_footer: 'Terima kasih atas kunjungan Anda!',
    tampilkan_logo: true,
    tampilkan_alamat: true,
    tampilkan_telepon: true,
    ukuran_kertas: '58mm',
    auto_print: false
};

// Create store
function createStrukStore() {
    // Try to get from localStorage
    let initial = defaultSettings;
    if (browser) {
        const stored = localStorage.getItem('strukSettings');
        if (stored) {
            try {
                initial = { ...defaultSettings, ...JSON.parse(stored) };
            } catch (e) {
                console.warn('Failed to parse strukSettings:', e);
            }
        }
    }

    const { subscribe, set, update } = writable(initial);

    return {
        subscribe,
        
        // Set settings dari server
        setFromServer: (settings) => {
            const merged = { ...defaultSettings, ...settings };
            set(merged);
            if (browser) {
                localStorage.setItem('strukSettings', JSON.stringify(merged));
            }
        },
        
        // Update individual setting
        updateSetting: (key, value) => {
            update(current => {
                const updated = { ...current, [key]: value };
                if (browser) {
                    localStorage.setItem('strukSettings', JSON.stringify(updated));
                }
                return updated;
            });
        },
        
        // Reset to defaults
        reset: () => {
            set(defaultSettings);
            if (browser) {
                localStorage.removeItem('strukSettings');
            }
        }
    };
}

export const strukSettings = createStrukStore();

// Store untuk info toko (untuk struk)
function createTokoStore() {
    const { subscribe, set } = writable({
        nama: '',
        alamat: '',
        telepon: ''
    });

    return {
        subscribe,
        setFromServer: (data) => {
            set({
                nama: data.nama_bisnis || data.nama || '',
                alamat: data.alamat || '',
                telepon: data.telepon || ''
            });
        }
    };
}

export const tokoInfo = createTokoStore();