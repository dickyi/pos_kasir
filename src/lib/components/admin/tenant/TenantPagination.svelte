<script>
    import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-svelte';
    
    export let pagination = { page: 1, limit: 10, total: 0, totalPages: 1 };
    export let onPageChange = (page) => {};
    
    $: startItem = pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
    $: endItem = Math.min(pagination.page * pagination.limit, pagination.total);
    
    // Generate page numbers to display
    $: pageNumbers = generatePageNumbers(pagination.page, pagination.totalPages);
    
    function generatePageNumbers(current, total) {
        const pages = [];
        const maxVisible = 5;
        
        let start = Math.max(1, current - Math.floor(maxVisible / 2));
        let end = Math.min(total, start + maxVisible - 1);
        
        // Adjust start if we're near the end
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        
        return pages;
    }
</script>

{#if pagination.totalPages > 1}
    <div class="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <!-- Info -->
        <p class="text-sm text-gray-500">
            Menampilkan <span class="font-medium text-gray-700">{startItem}</span> - 
            <span class="font-medium text-gray-700">{endItem}</span> dari 
            <span class="font-medium text-gray-700">{pagination.total}</span> data
        </p>
        
        <!-- Navigation -->
        <div class="flex items-center gap-1">
            <!-- First Page -->
            <button
                on:click={() => onPageChange(1)}
                disabled={pagination.page === 1}
                class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-colors"
                title="Halaman pertama"
            >
                <ChevronsLeft size={16} class="text-gray-600" />
            </button>
            
            <!-- Previous Page -->
            <button
                on:click={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-colors"
                title="Halaman sebelumnya"
            >
                <ChevronLeft size={16} class="text-gray-600" />
            </button>
            
            <!-- Page Numbers -->
            {#each pageNumbers as pageNum}
                <button
                    on:click={() => onPageChange(pageNum)}
                    class="w-9 h-9 rounded-lg text-sm font-medium transition-colors
                           {pageNum === pagination.page 
                               ? 'bg-gray-900 text-white' 
                               : 'hover:bg-gray-100 text-gray-600'}"
                >
                    {pageNum}
                </button>
            {/each}
            
            <!-- Next Page -->
            <button
                on:click={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-colors"
                title="Halaman berikutnya"
            >
                <ChevronRight size={16} class="text-gray-600" />
            </button>
            
            <!-- Last Page -->
            <button
                on:click={() => onPageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-colors"
                title="Halaman terakhir"
            >
                <ChevronsRight size={16} class="text-gray-600" />
            </button>
        </div>
    </div>
{/if}