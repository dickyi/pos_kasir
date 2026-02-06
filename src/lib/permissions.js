// src/lib/permissions.js
// Helper untuk cek permission tenant users berdasarkan role

/**
 * Default permissions per role
 * Digunakan jika tidak ada custom permissions di database
 */
export const defaultPermissions = {
    owner: {
        dashboard: { view: true },
        pos: { view: true, create: true, void: true, discount: true, hold: true },
        produk: { view: true, create: true, update: true, delete: true, import: true, export: true },
        kategori: { view: true, create: true, update: true, delete: true },
        stok: { view: true, adjust: true, opname: true, history: true },
        transaksi: { view: true, detail: true, void: true, refund: true, export: true },
        laporan: { view: true, penjualan: true, keuangan: true, stok: true, laba_rugi: true, export: true },
        pelanggan: { view: true, create: true, update: true, delete: true },
        user: { view: true, create: true, update: true, delete: true, reset_password: true },
        pengaturan: { view: true, update: true, struk: true, pajak: true, pembayaran: true },
        notifikasi: { view: true, manage: true },
        activity_log: { view: true }
    },
    admin: {
        dashboard: { view: true },
        pos: { view: true, create: true, void: false, discount: true, hold: true },
        produk: { view: true, create: true, update: true, delete: true, import: true, export: true },
        kategori: { view: true, create: true, update: true, delete: true },
        stok: { view: true, adjust: true, opname: true, history: true },
        transaksi: { view: true, detail: true, void: false, refund: false, export: true },
        laporan: { view: true, penjualan: true, keuangan: false, stok: true, laba_rugi: false, export: true },
        pelanggan: { view: true, create: true, update: true, delete: false },
        user: { view: true, create: false, update: false, delete: false, reset_password: false },
        pengaturan: { view: true, update: false, struk: true, pajak: false, pembayaran: false },
        notifikasi: { view: true, manage: false },
        activity_log: { view: false }
    },
    kasir: {
        dashboard: { view: false },
        pos: { view: true, create: true, void: false, discount: false, hold: true },
        produk: { view: true, create: false, update: false, delete: false, import: false, export: false },
        kategori: { view: true, create: false, update: false, delete: false },
        stok: { view: true, adjust: false, opname: false, history: false },
        transaksi: { view: true, detail: true, void: false, refund: false, export: false },
        laporan: { view: false, penjualan: false, keuangan: false, stok: false, laba_rugi: false, export: false },
        pelanggan: { view: true, create: true, update: false, delete: false },
        user: { view: false, create: false, update: false, delete: false, reset_password: false },
        pengaturan: { view: false, update: false, struk: false, pajak: false, pembayaran: false },
        notifikasi: { view: true, manage: false },
        activity_log: { view: false }
    }
};

/**
 * Check if user has permission for specific action
 * @param {Object} user - Tenant user object
 * @param {string} module - Module name (e.g., 'produk', 'transaksi')
 * @param {string} action - Action name (e.g., 'view', 'create', 'delete')
 * @returns {boolean}
 */
export function hasPermission(user, module, action) {
    if (!user || !user.role) return false;
    
    // Owner always has all permissions
    if (user.role === 'owner') return true;
    
    // Check custom permissions first
    if (user.permissions) {
        try {
            const customPerms = typeof user.permissions === 'string' 
                ? JSON.parse(user.permissions) 
                : user.permissions;
            
            if (customPerms[module] && customPerms[module][action] !== undefined) {
                return customPerms[module][action];
            }
        } catch (e) {
            console.error('Error parsing custom permissions:', e);
        }
    }
    
    // Fall back to default permissions
    const rolePerms = defaultPermissions[user.role];
    if (!rolePerms) return false;
    
    const modulePerms = rolePerms[module];
    if (!modulePerms) return false;
    
    return modulePerms[action] === true;
}

/**
 * Check if user can access a specific route
 * @param {Object} user - Tenant user object
 * @param {string} path - Route path
 * @returns {boolean}
 */
export function canAccessRoute(user, path) {
    if (!user) return false;
    
    // Map routes to required permissions
    const routePermissions = {
        '/tenant/dashboard': { module: 'dashboard', action: 'view' },
        '/tenant/kasir': { module: 'pos', action: 'view' },
        '/tenant/produk': { module: 'produk', action: 'view' },
        '/tenant/kategori': { module: 'kategori', action: 'view' },
        '/tenant/transaksi': { module: 'transaksi', action: 'view' },
        '/tenant/laporan': { module: 'laporan', action: 'view' },
        '/tenant/users': { module: 'user', action: 'view' },
        '/tenant/pengaturan': { module: 'pengaturan', action: 'view' },
        '/tenant/notifikasi': { module: 'notifikasi', action: 'view' }
    };
    
    // Find matching route
    const routeConfig = routePermissions[path];
    if (!routeConfig) return true; // Allow if not configured
    
    return hasPermission(user, routeConfig.module, routeConfig.action);
}

/**
 * Get list of accessible menu items for user
 * @param {Object} user - Tenant user object
 * @returns {Array}
 */
export function getAccessibleMenus(user) {
    const allMenus = [
        { 
            path: '/tenant/dashboard', 
            label: 'Dashboard', 
            icon: 'LayoutDashboard',
            module: 'dashboard', 
            action: 'view' 
        },
        { 
            path: '/tenant/kasir', 
            label: 'Kasir / POS', 
            icon: 'ShoppingCart',
            module: 'pos', 
            action: 'view' 
        },
        { 
            path: '/tenant/produk', 
            label: 'Produk', 
            icon: 'Package',
            module: 'produk', 
            action: 'view' 
        },
        { 
            path: '/tenant/kategori', 
            label: 'Kategori', 
            icon: 'Tags',
            module: 'kategori', 
            action: 'view' 
        },
        { 
            path: '/tenant/transaksi', 
            label: 'Transaksi', 
            icon: 'Receipt',
            module: 'transaksi', 
            action: 'view' 
        },
        { 
            path: '/tenant/laporan', 
            label: 'Laporan', 
            icon: 'BarChart3',
            module: 'laporan', 
            action: 'view',
            children: [
                { path: '/tenant/laporan/penjualan', label: 'Penjualan', action: 'penjualan' },
                { path: '/tenant/laporan/keuangan', label: 'Keuangan', action: 'keuangan' },
                { path: '/tenant/laporan/stok', label: 'Stok', action: 'stok' }
            ]
        },
        { 
            path: '/tenant/users', 
            label: 'Kelola User', 
            icon: 'Users',
            module: 'user', 
            action: 'view' 
        },
        { 
            path: '/tenant/pengaturan', 
            label: 'Pengaturan', 
            icon: 'Settings',
            module: 'pengaturan', 
            action: 'view' 
        }
    ];
    
    return allMenus.filter(menu => hasPermission(user, menu.module, menu.action));
}

/**
 * Role labels in Indonesian
 */
export const roleLabels = {
    owner: 'Pemilik',
    admin: 'Admin',
    kasir: 'Kasir'
};

/**
 * Get role label
 * @param {string} role
 * @returns {string}
 */
export function getRoleLabel(role) {
    return roleLabels[role] || role;
}