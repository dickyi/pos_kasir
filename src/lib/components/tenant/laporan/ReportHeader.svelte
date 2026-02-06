<!--
    ReportHeader.svelte
    ============================================
    Header untuk halaman laporan dengan filter
    ============================================
-->
<script>
    import { Calendar, Download, RefreshCw, Filter } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';

    export let title = 'Laporan';
    export let subtitle = '';
    export let period = 'today';
    export let showCompare = false;
    export let loading = false;
    export let exportOptions = true;

    const dispatch = createEventDispatcher();

    let showCustomDate = false;
    let customStartDate = '';
    let customEndDate = '';

    const periods = [
        { value: 'today', label: 'Hari Ini' },
        { value: 'yesterday', label: 'Kemarin' },
        { value: 'week', label: '7 Hari Terakhir' },
        { value: 'month', label: '30 Hari Terakhir' },
        { value: 'year', label: '1 Tahun Terakhir' },
        { value: 'custom', label: 'Pilih Tanggal' }
    ];

    function handlePeriodChange(e) {
        const newPeriod = e.target.value;
        period = newPeriod;
        showCustomDate = newPeriod === 'custom';

        if (newPeriod !== 'custom') {
            dispatch('filter', {
                period: newPeriod,
                startDate: null,
                endDate: null
            });
        }
    }

    function handleCustomDateChange() {
        if (customStartDate && customEndDate) {
            dispatch('filter', {
                period: 'custom',
                startDate: customStartDate,
                endDate: customEndDate
            });
        }
    }

    function handleRefresh() {
        dispatch('refresh');
    }

    function handleExport(format) {
        dispatch('export', { format });
    }
</script>

<div class="bg-white rounded-xl border border-slate-200 p-5 mb-6">
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <!-- Title -->
        <div>
            <h1 class="text-xl font-semibold text-slate-800">{title}</h1>
            {#if subtitle}
                <p class="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            {/if}
        </div>

        <!-- Filters & Actions -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <!-- Period Selector -->
            <div class="flex items-center gap-2">
                <div class="relative">
                    <select
                        bind:value={period}
                        on:change={handlePeriodChange}
                        class="appearance-none pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg
                               text-sm font-medium text-slate-700 bg-white
                               hover:border-slate-300 focus:outline-none focus:ring-2
                               focus:ring-emerald-500 focus:border-transparent cursor-pointer"
                        disabled={loading}
                    >
                        {#each periods as p}
                            <option value={p.value}>{p.label}</option>
                        {/each}
                    </select>
                    <Calendar class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            </div>

            <!-- Custom Date Range -->
            {#if showCustomDate}
                <div class="flex items-center gap-2">
                    <input
                        type="date"
                        bind:value={customStartDate}
                        on:change={handleCustomDateChange}
                        class="px-3 py-2.5 border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        disabled={loading}
                    />
                    <span class="text-slate-400 text-sm">s/d</span>
                    <input
                        type="date"
                        bind:value={customEndDate}
                        on:change={handleCustomDateChange}
                        class="px-3 py-2.5 border border-slate-200 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        disabled={loading}
                    />
                </div>
            {/if}

            <!-- Actions -->
            <div class="flex items-center gap-2">
                <!-- Compare Toggle -->
                {#if showCompare !== false}
                    <label class="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer hover:border-slate-300 transition-colors">
                        <input
                            type="checkbox"
                            bind:checked={showCompare}
                            on:change={() => dispatch('toggleCompare', showCompare)}
                            class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            disabled={loading}
                        />
                        <span class="text-sm font-medium text-slate-700">Banding</span>
                    </label>
                {/if}

                <!-- Refresh Button -->
                <button
                    on:click={handleRefresh}
                    class="p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                    disabled={loading}
                    title="Refresh Data"
                >
                    <!-- Fix: wrap icon in span for conditional class -->
                    <span class={loading ? 'animate-spin inline-block' : 'inline-block'}>
                        <RefreshCw class="w-4 h-4 text-slate-600" />
                    </span>
                </button>

                <!-- Export Dropdown -->
                {#if exportOptions}
                    <div class="relative group">
                        <button
                            class="flex items-center gap-2 px-3 py-2.5 bg-emerald-600 text-white rounded-lg
                                   hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
                            disabled={loading}
                        >
                            <Download class="w-4 h-4" />
                            <span class="hidden sm:inline">Export</span>
                        </button>
                        <!-- Dropdown Menu -->
                        <div class="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg
                                    opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-32">
                            <button
                                on:click={() => handleExport('excel')}
                                class="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left flex items-center gap-2"
                            >
                                <span>📊</span> Excel
                            </button>
                            <button
                                on:click={() => handleExport('pdf')}
                                class="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left flex items-center gap-2"
                            >
                                <span>📄</span> PDF
                            </button>
                            <button
                                on:click={() => handleExport('csv')}
                                class="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left flex items-center gap-2"
                            >
                                <span>📝</span> CSV
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>