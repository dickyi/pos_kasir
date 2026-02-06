<!-- src/routes/(tenant)/tenant/users/+page.svelte -->
<!-- 
    KELOLA USER - REFACTORED VERSION
    =================================
    Menggunakan komponen terpisah untuk maintainability yang lebih baik
    
    Features: 
    - CRUD User (Create, Read, Update, Delete)
    - Archive & Restore
    - PIN Management (Set, Reset, Unlock)
    - Share via WhatsApp
    - Responsive (Desktop Table + Mobile Cards)
-->
<script>
    import { enhance } from '$app/forms';
    import { invalidateAll, goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { UserPlus, History } from 'lucide-svelte';
    
    // Import Components
    import UserStats from '$lib/components/tenant/users/UserStats.svelte';
    import UserAlerts from '$lib/components/tenant/users/UserAlerts.svelte';
    import UserFilters from '$lib/components/tenant/users/UserFilters.svelte';
    import UserTable from '$lib/components/tenant/users/UserTable.svelte';
    import UserCard from '$lib/components/tenant/users/UserCard.svelte';
    
    // Import Modals
    import AddUserModal from '$lib/components/tenant/users/modals/AddUserModal.svelte';
    import EditUserModal from '$lib/components/tenant/users/modals/EditUserModal.svelte';
    import SetPinModal from '$lib/components/tenant/users/modals/SetPinModal.svelte';
    import ResetPinModal from '$lib/components/tenant/users/modals/ResetPinModal.svelte';
    import UnlockModal from '$lib/components/tenant/users/modals/UnlockModal.svelte';
    import ArchiveModal from '$lib/components/tenant/users/modals/ArchiveModal.svelte';
    import DeleteModal from '$lib/components/tenant/users/modals/DeleteModal.svelte';
    import RestoreModal from '$lib/components/tenant/users/modals/RestoreModal.svelte';
    import ResetPasswordModal from '$lib/components/tenant/users/modals/ResetPasswordModal.svelte';
    import PinStatsModal from '$lib/components/tenant/users/modals/PinStatsModal.svelte';
    import MobileActionsSheet from '$lib/components/tenant/users/modals/MobileActionsSheet.svelte';
    import ShareModal from '$lib/components/tenant/users/modals/ShareModal.svelte';
    
    // Import Helpers
    import { formatPinAction, formatRelativeTime } from '$lib/components/tenant/users';

    // ==========================================
    // PROPS & DATA
    // ==========================================
    export let data;
    export let form;

    $: ({ 
        users, 
        activeUsers, 
        archivedUsers, 
        stats, 
        pinStats,
        usersWithoutPin, 
        recentActivities, 
        recentPinChanges,
        showArchived, 
        currentUser, 
        pinConfig,
        kodeToko,
        namaToko
    } = data);

    // Base URL for share links
    $: baseUrl = $page.url.origin;

    // ==========================================
    // STATE
    // ==========================================
    
    // Filter States
    let searchQuery = '';
    let filterRole = 'all';
    let filterStatus = 'all';
    let filterPinStatus = 'all';
    
    // Modal States
    let showAddModal = false;
    let showEditModal = false;
    let showResetPasswordModal = false;
    let showArchiveModal = false;
    let showRestoreModal = false;
    let showDeleteModal = false;
    let showSetPinModal = false;
    let showResetPinModal = false;
    let showUnlockModal = false;
    let showMobileActions = false;
    let showPinStatsModal = false;
    let showShareModal = false;
    
    // Selected User & Submit State
    let selectedUser = null;
    let isSubmitting = false;

    // ==========================================
    // COMPUTED - Filtered Users
    // ==========================================
    $: filteredUsers = users.filter(user => {
        // Search filter
        const matchSearch = !searchQuery || 
            user.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.kode_user.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Role filter
        const matchRole = filterRole === 'all' || user.role === filterRole;
        
        // Status filter (only for active users)
        let matchStatus = true;
        if (!user.is_archived) {
            matchStatus = filterStatus === 'all' || user.status === filterStatus;
        }
        
        // PIN Status filter
        let matchPinStatus = true;
        if (filterPinStatus !== 'all' && !user.is_archived) {
            if (filterPinStatus === 'has_pin') matchPinStatus = user.has_pin;
            else if (filterPinStatus === 'no_pin') matchPinStatus = !user.has_pin && user.pin_status !== 'not_needed';
            else if (filterPinStatus === 'weak_pin') matchPinStatus = user.is_pin_weak;
            else if (filterPinStatus === 'locked') matchPinStatus = user.is_locked;
        }
        
        return matchSearch && matchRole && matchStatus && matchPinStatus;
    });

    // Split filtered users into active and archived
    $: displayActiveUsers = filteredUsers.filter(u => !u.is_archived);
    $: displayArchivedUsers = filteredUsers.filter(u => u.is_archived);

    // ==========================================
    // MODAL HANDLERS
    // ==========================================
    
    function openAddModal() {
        showAddModal = true;
    }

    function openEditModal(user) {
        selectedUser = user;
        showMobileActions = false;
        showEditModal = true;
    }

    function openResetPasswordModal(user) {
        selectedUser = user;
        showMobileActions = false;
        showResetPasswordModal = true;
    }

    function openArchiveModal(user) {
        selectedUser = user;
        showMobileActions = false;
        showArchiveModal = true;
    }

    function openRestoreModal(user) {
        selectedUser = user;
        showRestoreModal = true;
    }

    function openDeleteModal(user) {
        selectedUser = user;
        showMobileActions = false;
        showDeleteModal = true;
    }

    function openSetPinModal(user) {
        selectedUser = user;
        showMobileActions = false;
        showSetPinModal = true;
    }

    function openResetPinModal(user) {
        selectedUser = user;
        showMobileActions = false;
        showResetPinModal = true;
    }

    function openUnlockModal(user) {
        selectedUser = user;
        showMobileActions = false;
        showUnlockModal = true;
    }

    function openMobileActions(user) {
        selectedUser = user;
        showMobileActions = true;
    }

    function openShareModal(user) {
        selectedUser = user;
        showMobileActions = false;
        showShareModal = true;
    }

    function closeAllModals() {
        showAddModal = false;
        showEditModal = false;
        showResetPasswordModal = false;
        showArchiveModal = false;
        showRestoreModal = false;
        showDeleteModal = false;
        showSetPinModal = false;
        showResetPinModal = false;
        showUnlockModal = false;
        showMobileActions = false;
        showPinStatsModal = false;
        showShareModal = false;
        selectedUser = null;
        isSubmitting = false;
    }

    // ==========================================
    // FORM HANDLERS
    // ==========================================
    
    async function handleSubmitted(event) {
        const result = event.detail;
        isSubmitting = false;
        
        if (result.type === 'success') {
            closeAllModals();
            await invalidateAll();
        }
    }

    function handleSubmitting() {
        isSubmitting = true;
    }

    // ==========================================
    // FILTER HANDLERS
    // ==========================================
    
    function handleFilterChange(event) {
        const { searchQuery: sq, filterRole: fr, filterStatus: fs, filterPinStatus: fps } = event.detail;
        searchQuery = sq;
        filterRole = fr;
        filterStatus = fs;
        filterPinStatus = fps;
    }

    function handleToggleArchived(event) {
        const newValue = event.detail;
        goto(`?showArchived=${newValue}`, { keepFocus: true, noScroll: true });
    }

    function handleResetFilters() {
        searchQuery = '';
        filterRole = 'all';
        filterStatus = 'all';
        filterPinStatus = 'all';
    }

    function dismissForm() {
        form = null;
    }
</script>

<svelte:head>
    <title>Kelola User | POS Kasir</title>
</svelte:head>

<div class="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
    
    <!-- ==========================================
         HEADER
    ========================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 class="text-2xl font-semibold text-gray-900">Kelola User</h1>
            <p class="text-gray-500 text-sm mt-1">Atur akses admin dan kasir untuk toko Anda</p>
        </div>
        <button 
            on:click={openAddModal}
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
            <UserPlus size={18} />
            <span>Tambah User</span>
        </button>
    </div>

    <!-- ==========================================
         ALERTS (Users tanpa PIN, Error, Success)
    ========================================== -->
    <UserAlerts 
        {usersWithoutPin}
        {pinStats}
        {form}
        on:dismissForm={dismissForm}
    />

    <!-- ==========================================
         STATS CARDS
    ========================================== -->
    <UserStats 
        {stats} 
        {pinStats}
        on:openPinStats={() => showPinStatsModal = true}
    />

    <!-- ==========================================
         FILTERS
    ========================================== -->
    <UserFilters 
        {searchQuery}
        {filterRole}
        {filterStatus}
        {filterPinStatus}
        {showArchived}
        archivedCount={stats.archived}
        filteredCount={filteredUsers.length}
        on:filterChange={handleFilterChange}
        on:toggleArchived={handleToggleArchived}
        on:reset={handleResetFilters}
    />

    <!-- ==========================================
         USER LIST - Desktop Table
    ========================================== -->
    <div class="hidden lg:block">
        <UserTable 
            activeUsers={displayActiveUsers}
            archivedUsers={displayArchivedUsers}
            {showArchived}
            on:edit={(e) => openEditModal(e.detail)}
            on:setPin={(e) => openSetPinModal(e.detail)}
            on:resetPin={(e) => openResetPinModal(e.detail)}
            on:unlock={(e) => openUnlockModal(e.detail)}
            on:archive={(e) => openArchiveModal(e.detail)}
            on:delete={(e) => openDeleteModal(e.detail)}
            on:restore={(e) => openRestoreModal(e.detail)}
            on:resetPassword={(e) => openResetPasswordModal(e.detail)}
            on:shareWA={(e) => openShareModal(e.detail)}
        />
    </div>

    <!-- ==========================================
         USER LIST - Mobile Cards
    ========================================== -->
    <div class="lg:hidden">
        <UserCard 
            activeUsers={displayActiveUsers}
            archivedUsers={displayArchivedUsers}
            {showArchived}
            on:openMobileActions={(e) => openMobileActions(e.detail)}
            on:restore={(e) => openRestoreModal(e.detail)}
            on:delete={(e) => openDeleteModal(e.detail)}
        />
    </div>

    <!-- ==========================================
         RECENT PIN CHANGES
    ========================================== -->
    {#if recentPinChanges && recentPinChanges.length > 0}
        <div class="bg-white border border-gray-200 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <History size={16} class="text-gray-500" />
                Aktivitas PIN Terbaru
            </h3>
            <div class="space-y-2">
                {#each recentPinChanges as activity}
                    <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center gap-2">
                            <span class="text-gray-600">{activity.user_name}</span>
                            <span class="text-gray-400">•</span>
                            <span class="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                {formatPinAction(activity.action)}
                            </span>
                            {#if activity.changed_by_name}
                                <span class="text-xs text-gray-400">oleh {activity.changed_by_name}</span>
                            {/if}
                        </div>
                        <span class="text-xs text-gray-400">{formatRelativeTime(activity.created_at)}</span>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<!-- ==========================================
     MODALS
========================================== -->

<!-- Add User Modal -->
<AddUserModal 
    show={showAddModal}
    {pinConfig}
    {isSubmitting}
    on:close={closeAllModals}
    on:submitting={handleSubmitting}
    on:submitted={handleSubmitted}
/>

<!-- Edit User Modal -->
<EditUserModal 
    show={showEditModal}
    user={selectedUser}
    {isSubmitting}
    on:close={closeAllModals}
    on:submitting={handleSubmitting}
    on:submitted={handleSubmitted}
/>

<!-- Set PIN Modal (with Share WA after success) -->
<SetPinModal 
    show={showSetPinModal}
    user={selectedUser}
    {pinConfig}
    {kodeToko}
    {namaToko}
    {baseUrl}
    {isSubmitting}
    on:close={closeAllModals}
    on:submitting={handleSubmitting}
    on:submitted={handleSubmitted}
/>

<!-- Reset PIN Modal -->
<ResetPinModal 
    show={showResetPinModal}
    user={selectedUser}
    {isSubmitting}
    on:close={closeAllModals}
    on:submitting={handleSubmitting}
    on:submitted={handleSubmitted}
/>

<!-- Unlock Modal -->
<UnlockModal 
    show={showUnlockModal}
    user={selectedUser}
    {isSubmitting}
    on:close={closeAllModals}
    on:submitting={handleSubmitting}
    on:submitted={handleSubmitted}
/>

<!-- Reset Password Modal -->
<ResetPasswordModal 
    show={showResetPasswordModal}
    user={selectedUser}
    {isSubmitting}
    on:close={closeAllModals}
    on:submitting={handleSubmitting}
    on:submitted={handleSubmitted}
/>

<!-- Archive Modal -->
<ArchiveModal 
    show={showArchiveModal}
    user={selectedUser}
    {isSubmitting}
    on:close={closeAllModals}
    on:submitting={handleSubmitting}
    on:submitted={handleSubmitted}
/>

<!-- Restore Modal -->
<RestoreModal 
    show={showRestoreModal}
    user={selectedUser}
    {isSubmitting}
    on:close={closeAllModals}
    on:submitting={handleSubmitting}
    on:submitted={handleSubmitted}
/>

<!-- Delete Modal -->
<DeleteModal 
    show={showDeleteModal}
    user={selectedUser}
    {isSubmitting}
    on:close={closeAllModals}
    on:submitting={handleSubmitting}
    on:submitted={handleSubmitted}
/>

<!-- PIN Stats Modal -->
<PinStatsModal 
    show={showPinStatsModal}
    {pinStats}
    on:close={closeAllModals}
/>

<!-- Share Modal (for existing users) -->
<ShareModal 
    show={showShareModal}
    user={selectedUser}
    {kodeToko}
    {namaToko}
    {baseUrl}
    on:close={closeAllModals}
/>

<!-- Mobile Actions Sheet -->
<MobileActionsSheet 
    show={showMobileActions}
    user={selectedUser}
    on:close={closeAllModals}
    on:edit={() => openEditModal(selectedUser)}
    on:setPin={() => openSetPinModal(selectedUser)}
    on:resetPin={() => openResetPinModal(selectedUser)}
    on:unlock={() => openUnlockModal(selectedUser)}
    on:resetPassword={() => openResetPasswordModal(selectedUser)}
    on:archive={() => openArchiveModal(selectedUser)}
    on:delete={() => openDeleteModal(selectedUser)}
    on:shareWA={() => openShareModal(selectedUser)}
/>