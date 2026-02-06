<!-- ============================================
NOTIFICATION TOAST COMPONENT (OPTIMIZED)
File: src/lib/components/admin/email/components/NotificationToast.svelte

Toast notification for feedback messages with:
- Success (green)
- Error (red)  
- Info (blue)
- Warning (amber)

OPTIMIZED:
- Works perfectly with parent control
- No internal visibility conflicts
- Smooth animations
- Progress bar indicator
- Accessibility compliant
- High z-index for always visible
============================================ -->

<script>
    import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-svelte';
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    
    const dispatch = createEventDispatcher();
    
    // ============================================
    // PROPS
    // ============================================
    
    /** Message to display */
    export let message = '';
    
    /** Toast type: 'success' | 'error' | 'info' | 'warning' */
    export let type = 'success';
    
    /** Auto-dismiss duration in ms, 0 = no auto-dismiss */
    export let duration = 4000;
    
    /** Show dismiss button */
    export let dismissible = true;
    
    /** Position on screen */
    export let position = 'top-right'; // 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center'
    
    // ============================================
    // CONFIGURATION
    // ============================================
    
    // Type configurations
    const typeConfig = {
        success: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-800',
            icon: CheckCircle,
            iconColor: 'text-emerald-500',
            progressColor: 'bg-emerald-400'
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-800',
            icon: XCircle,
            iconColor: 'text-red-500',
            progressColor: 'bg-red-400'
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-800',
            icon: Info,
            iconColor: 'text-blue-500',
            progressColor: 'bg-blue-400'
        },
        warning: {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-800',
            icon: AlertTriangle,
            iconColor: 'text-amber-500',
            progressColor: 'bg-amber-400'
        }
    };
    
    // Position classes
    const positionClasses = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-center': 'top-4 left-1/2 -translate-x-1/2'
    };
    
    // ============================================
    // REACTIVE STATEMENTS
    // ============================================
    
    $: config = typeConfig[type] || typeConfig.info;
    $: Icon = config.icon;
    $: posClass = positionClasses[position] || positionClasses['top-right'];
    
    // ============================================
    // STATE
    // ============================================
    
    let dismissTimer = null;
    
    // ============================================
    // LIFECYCLE
    // ============================================
    
    onMount(() => {
        // Set auto-dismiss timer if duration > 0
        if (duration > 0) {
            dismissTimer = setTimeout(() => {
                handleDismiss();
            }, duration);
        }
    });
    
    onDestroy(() => {
        // Cleanup timer on component destroy
        if (dismissTimer) {
            clearTimeout(dismissTimer);
            dismissTimer = null;
        }
    });
    
    // ============================================
    // METHODS
    // ============================================
    
    /**
     * Handle dismiss action
     * Clears timer and dispatches dismiss event to parent
     */
    function handleDismiss() {
        // Clear timer if exists
        if (dismissTimer) {
            clearTimeout(dismissTimer);
            dismissTimer = null;
        }
        
        // Dispatch dismiss event to parent
        // Parent is responsible for removing the component
        dispatch('dismiss');
    }
</script>

<!-- ============================================
TOAST CONTAINER
Always render when component exists
Parent controls visibility with {#if notification}
============================================ -->
<div 
    class="fixed {posClass}"
    style="z-index: 9999;"
    in:fly={{ y: position.includes('bottom') ? 20 : -20, duration: 300, opacity: 0 }}
    out:fade={{ duration: 200 }}
    role="alert"
    aria-live="polite"
    aria-atomic="true"
>
    <!-- Toast Card -->
    <div class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm
                {config.bg} {config.border} {config.text}
                min-w-[280px] max-w-md">
        
        <!-- Icon -->
        <div class="flex-shrink-0">
            <svelte:component this={Icon} size={20} class={config.iconColor} />
        </div>
        
        <!-- Message -->
        <div class="flex-1 min-w-0">
            <p class="text-sm font-medium break-words">{message}</p>
        </div>
        
        <!-- Dismiss Button -->
        {#if dismissible}
            <button 
                type="button"
                on:click={handleDismiss}
                class="flex-shrink-0 p-1.5 rounded-lg hover:bg-black/10 active:bg-black/20
                       transition-colors opacity-60 hover:opacity-100 
                       focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                aria-label="Tutup notifikasi"
            >
                <X size={14} />
            </button>
        {/if}
    </div>
    
    <!-- Progress Bar (shows time remaining) -->
    {#if duration > 0}
        <div class="mt-1 mx-1 h-1 rounded-full overflow-hidden bg-black/10">
            <div 
                class="h-full rounded-full {config.progressColor} progress-bar"
                style="--duration: {duration}ms;"
            />
        </div>
    {/if}
</div>

<!-- ============================================
STYLES
============================================ -->
<style>
    /* Progress bar animation */
    .progress-bar {
        width: 100%;
        animation: shrink var(--duration) linear forwards;
    }
    
    @keyframes shrink {
        from { 
            width: 100%; 
            opacity: 1;
        }
        to { 
            width: 0%; 
            opacity: 0.5;
        }
    }
    
    /* Ensure text breaks properly on long messages */
    div {
        word-wrap: break-word;
        overflow-wrap: break-word;
    }
</style>