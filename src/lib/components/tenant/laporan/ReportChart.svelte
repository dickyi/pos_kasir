<!--
    ReportChart.svelte
    ============================================
    Komponen chart reusable untuk laporan
    Mendukung: line, bar, pie, doughnut
    ============================================
-->
<script>
    import { onMount, onDestroy } from 'svelte';
    import { Chart, registerables } from 'chart.js';

    /** @type {'line'|'bar'|'pie'|'doughnut'} */
    export let type = 'line';
    
    /** @type {string} */
    export let title = '';
    
    /** @type {string} */
    export let subtitle = '';
    
    /** @type {string} */
    export let height = 'h-64';
    
    /** @type {Object|null} */
    export let data = null;
    
    /** @type {Object} */
    export let options = {};

    let chartElement;
    let chartInstance = null;

    onMount(() => {
        Chart.register(...registerables);
        if (data) {
            initChart();
        }
    });

    // Update chart when data changes
    $: if (chartInstance && data) {
        chartInstance.data = data;
        chartInstance.update();
    }

    // Reinitialize if data becomes available
    $: if (chartElement && data && !chartInstance) {
        initChart();
    }

    function initChart() {
        if (!chartElement || !data) return;

        if (chartInstance) {
            chartInstance.destroy();
        }

        const ctx = chartElement.getContext('2d');
        
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: type === 'pie' || type === 'doughnut',
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: '#1f2937',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { size: 12, weight: '500' },
                    bodyFont: { size: 13, weight: '600' },
                    displayColors: type === 'pie' || type === 'doughnut',
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y ?? context.parsed;
                            if (typeof value === 'number') {
                                return 'Rp ' + value.toLocaleString('id-ID');
                            }
                            return value;
                        }
                    }
                }
            },
            scales: type === 'line' || type === 'bar' ? {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        font: { size: 11 },
                        color: '#9ca3af',
                        maxRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    border: { display: false },
                    grid: { color: '#f3f4f6' },
                    ticks: {
                        font: { size: 11 },
                        color: '#9ca3af',
                        padding: 8,
                        callback: function(value) {
                            if (value >= 1000000) {
                                return 'Rp ' + (value / 1000000).toFixed(1) + 'jt';
                            } else if (value >= 1000) {
                                return 'Rp ' + (value / 1000).toFixed(0) + 'rb';
                            }
                            return 'Rp ' + value;
                        }
                    }
                }
            } : {},
            interaction: {
                intersect: false,
                mode: 'index'
            }
        };

        // Merge default options with custom options
        const mergedOptions = { ...defaultOptions, ...options };

        chartInstance = new Chart(ctx, {
            type,
            data,
            options: mergedOptions
        });
    }

    onDestroy(() => {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    });
</script>

<div class="bg-white rounded-xl border border-slate-200 p-5">
    {#if title || subtitle}
        <div class="mb-4">
            {#if title}
                <h3 class="text-base font-semibold text-slate-800">{title}</h3>
            {/if}
            {#if subtitle}
                <p class="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            {/if}
        </div>
    {/if}

    {#if data}
        <div class={height}>
            <canvas bind:this={chartElement}></canvas>
        </div>
    {:else}
        <div class="{height} flex items-center justify-center text-slate-400 text-sm">
            Data tidak tersedia
        </div>
    {/if}
</div>