<script>
    import { 
        Heart, TrendingUp, TrendingDown, Minus, AlertTriangle,
        CheckCircle, XCircle, Info, ChevronRight
    } from 'lucide-svelte';
    
    export let tenants = [];
    export let onViewDetail = (tenant) => {};
    
    function calcHealthScore(tenant) {
        let score = 100;
        const issues = [];
        
        // Penalti jika tidak ada transaksi
        if (!tenant.total_transaksi || tenant.total_transaksi === 0) {
            score -= 30;
            issues.push('Belum ada transaksi');
        }
        
        // Penalti jika tidak ada produk
        if (!tenant.total_produk || tenant.total_produk === 0) {
            score -= 25;
            issues.push('Belum ada produk');
        } else if (tenant.total_produk < 5) {
            score -= 10;
            issues.push('Produk masih sedikit');
        }
        
        // Penalti jika tidak aktif lama
        if (tenant.days_inactive) {
            if (tenant.days_inactive > 30) {
                score -= 25;
                issues.push('Tidak aktif > 30 hari');
            } else if (tenant.days_inactive > 14) {
                score -= 15;
                issues.push('Tidak aktif > 14 hari');
            } else if (tenant.days_inactive > 7) {
                score -= 5;
                issues.push('Tidak aktif > 7 hari');
            }
        }
        
        // Penalti jika status bukan aktif
        if (tenant.status !== 'aktif') {
            score -= 20;
            issues.push(`Status: ${tenant.status}`);
        }
        
        // Bonus jika ada user lebih dari 1
        if (tenant.total_user > 1) {
            score = Math.min(score + 5, 100);
        }
        
        return {
            score: Math.max(0, Math.min(100, score)),
            issues
        };
    }
    
    function getScoreConfig(score) {
        if (score >= 80) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-500', ring: 'ring-emerald-200' };
        if (score >= 60) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-500', ring: 'ring-blue-200' };
        if (score >= 40) return { label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-500', ring: 'ring-amber-200' };
        if (score >= 20) return { label: 'Poor', color: 'text-orange-600', bg: 'bg-orange-500', ring: 'ring-orange-200' };
        return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-500', ring: 'ring-red-200' };
    }
    
    // Sort by health score (lowest first to prioritize attention)
    $: sortedTenants = [...tenants]
        .map(t => ({ ...t, health: calcHealthScore(t) }))
        .sort((a, b) => a.health.score - b.health.score)
        .slice(0, 10);
    
    $: healthDistribution = {
        excellent: tenants.filter(t => calcHealthScore(t).score >= 80).length,
        good: tenants.filter(t => { const s = calcHealthScore(t).score; return s >= 60 && s < 80; }).length,
        fair: tenants.filter(t => { const s = calcHealthScore(t).score; return s >= 40 && s < 60; }).length,
        poor: tenants.filter(t => { const s = calcHealthScore(t).score; return s >= 20 && s < 40; }).length,
        critical: tenants.filter(t => calcHealthScore(t).score < 20).length
    };
    
    $: avgScore = tenants.length > 0 
        ? Math.round(tenants.reduce((sum, t) => sum + calcHealthScore(t).score, 0) / tenants.length)
        : 0;
</script>

<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
            <div>
                <h3 class="font-semibold text-gray-900 flex items-center gap-2">
                    <Heart size={18} class="text-red-400" />
                    Tenant Health Score
                </h3>
                <p class="text-sm text-gray-500 mt-0.5">Skor kesehatan bisnis tenant</p>
            </div>
            <div class="text-right">
                <p class="text-3xl font-bold {getScoreConfig(avgScore).color}">{avgScore}</p>
                <p class="text-xs text-gray-500">Avg Score</p>
            </div>
        </div>
    </div>
    
    <!-- Distribution -->
    <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <p class="text-xs text-gray-500 uppercase font-semibold mb-3">Health Distribution</p>
        <div class="flex items-center gap-1 h-3 rounded-full overflow-hidden bg-gray-200">
            {#if healthDistribution.excellent > 0}
                <div class="h-full bg-emerald-500" style="width: {(healthDistribution.excellent / tenants.length) * 100}%"></div>
            {/if}
            {#if healthDistribution.good > 0}
                <div class="h-full bg-blue-500" style="width: {(healthDistribution.good / tenants.length) * 100}%"></div>
            {/if}
            {#if healthDistribution.fair > 0}
                <div class="h-full bg-amber-500" style="width: {(healthDistribution.fair / tenants.length) * 100}%"></div>
            {/if}
            {#if healthDistribution.poor > 0}
                <div class="h-full bg-orange-500" style="width: {(healthDistribution.poor / tenants.length) * 100}%"></div>
            {/if}
            {#if healthDistribution.critical > 0}
                <div class="h-full bg-red-500" style="width: {(healthDistribution.critical / tenants.length) * 100}%"></div>
            {/if}
        </div>
        <div class="flex flex-wrap gap-4 mt-3 text-xs">
            <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                Excellent: {healthDistribution.excellent}
            </span>
            <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                Good: {healthDistribution.good}
            </span>
            <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                Fair: {healthDistribution.fair}
            </span>
            <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                Poor: {healthDistribution.poor}
            </span>
            <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                Critical: {healthDistribution.critical}
            </span>
        </div>
    </div>
    
    <!-- Needs Attention List -->
    <div class="divide-y divide-gray-100">
        <div class="px-6 py-3 bg-red-50 flex items-center gap-2">
            <AlertTriangle size={14} class="text-red-500" />
            <span class="text-sm font-medium text-red-700">Perlu Perhatian (skor terendah)</span>
        </div>
        
        {#if sortedTenants.length > 0}
            {#each sortedTenants as tenant (tenant.id)}
                {@const config = getScoreConfig(tenant.health.score)}
                <button 
                    on:click={() => onViewDetail(tenant)}
                    class="w-full px-6 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                >
                    <!-- Score Circle -->
                    <div class="relative w-12 h-12 flex-shrink-0">
                        <svg class="w-12 h-12 transform -rotate-90">
                            <circle cx="24" cy="24" r="20" stroke-width="4" fill="none" class="stroke-gray-100" />
                            <circle 
                                cx="24" cy="24" r="20" stroke-width="4" fill="none" 
                                class="{config.bg.replace('bg-', 'stroke-')}"
                                stroke-dasharray="{(tenant.health.score / 100) * 125.6} 125.6"
                                stroke-linecap="round"
                            />
                        </svg>
                        <span class="absolute inset-0 flex items-center justify-center text-sm font-bold {config.color}">
                            {tenant.health.score}
                        </span>
                    </div>
                    
                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <p class="font-medium text-gray-900 truncate">{tenant.nama_bisnis}</p>
                            <span class="px-2 py-0.5 rounded text-xs font-medium {config.color} {config.ring} ring-1">
                                {config.label}
                            </span>
                        </div>
                        {#if tenant.health.issues.length > 0}
                            <p class="text-xs text-gray-500 mt-1 truncate">
                                ⚠️ {tenant.health.issues.join(' • ')}
                            </p>
                        {/if}
                    </div>
                    
                    <!-- Arrow -->
                    <ChevronRight size={16} class="text-gray-400 flex-shrink-0" />
                </button>
            {/each}
        {:else}
            <div class="px-6 py-8 text-center text-gray-500">
                Tidak ada data tenant
            </div>
        {/if}
    </div>
</div>