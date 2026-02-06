<script>
    import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-svelte';
    
    export let message = '';
    export let type = 'success'; // success, error, warning, info
    export let duration = 3000;
    export let position = 'top-right'; // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
    
    const configs = {
        success: {
            bg: 'bg-emerald-600',
            icon: CheckCircle2
        },
        error: {
            bg: 'bg-red-600',
            icon: XCircle
        },
        warning: {
            bg: 'bg-amber-600',
            icon: AlertTriangle
        },
        info: {
            bg: 'bg-blue-600',
            icon: Info
        }
    };
    
    const positions = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
    };
    
    $: config = configs[type] || configs.success;
    $: positionClass = positions[position] || positions['top-right'];
</script>

<div class="fixed {positionClass} z-[100] animate-slide-in">
    <div class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg {config.bg} text-white">
        <svelte:component this={config.icon} size={18} />
        <span class="text-sm font-medium">{message}</span>
    </div>
</div>

<style>
    @keyframes slide-in {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .animate-slide-in {
        animation: slide-in 0.3s ease-out;
    }
</style>