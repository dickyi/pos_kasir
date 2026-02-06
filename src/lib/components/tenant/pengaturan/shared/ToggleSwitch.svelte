<!--
    ToggleSwitch.svelte - Toggle Switch Component
    ============================================
    Reusable toggle switch untuk on/off settings
-->
<script>
    export let name = '';
    export let checked = false;
    export let disabled = false;
</script>

<label class="relative inline-flex items-center cursor-pointer {disabled ? 'opacity-50 cursor-not-allowed' : ''}">
    <input
        type="checkbox"
        {name}
        bind:checked
        {disabled}
        class="sr-only peer"
    />
    <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 
                peer-focus:ring-emerald-500/20 rounded-full peer 
                peer-checked:after:translate-x-full peer-checked:after:border-white 
                after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                after:bg-white after:border-slate-300 after:border after:rounded-full 
                after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600
                {disabled ? '' : 'peer-hover:bg-slate-300 peer-checked:peer-hover:bg-emerald-700'}">
    </div>
</label>