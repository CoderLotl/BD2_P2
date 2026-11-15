<script>
    import { onMount, createEventDispatcher  } from 'svelte';

    export let LoadAllData;
    export let activeTab;
    let dispatch = createEventDispatcher();

    function SwitchTab(tab)
    {
        dispatch('switchTab', { tab: tab });
    }

    onMount(()=>
    {
        console.log(activeTab);
    });
</script>

<div>
    <nav class="flex gap-4 mb-4 border-b border-slate-700 pb-2 bg-black/50 rounded-md p-4">
        <button on:click={() => SwitchTab('items')}
        class="text-nowrap duration-300 hover:cursor-pointer
        {activeTab == 'items' ? 'text-slate-200 border-b-2 border-blue-500 font-bold' : 'text-slate-400 hover:text-red-400/70'}">
            Items
        </button>
        <button on:click={() => SwitchTab('item-types')}
        class="text-nowrap duration-300 hover:cursor-pointer
        {activeTab == 'item-types' ? 'text-slate-200 border-b-2 border-blue-500 font-bold' : 'text-slate-400 hover:text-red-400/70'}">
            Item Types
        </button>
        <button on:click={() => SwitchTab('owners')}
        class="text-nowrap duration-300 hover:cursor-pointer
        {activeTab == 'owners' ? 'text-slate-200 border-b-2 border-blue-500 font-bold' : 'text-slate-400 hover:text-red-400/70'}">
            Owners
        </button>
        <button on:click={() => SwitchTab('search')}
        class="text-nowrap duration-300 hover:cursor-pointer
        {activeTab == 'search' ? 'text-slate-200 border-b-2 border-blue-500 font-bold' : 'text-slate-400 hover:text-red-400/70'}">
            Search
        </button>
        <div class="w-full flex justify-end">
            <button class="text-slate-400 hover:text-slate-200 border border-slate-500 p-2 rounded-md hover:bg-red-400/50 duration-300"
            on:click={LoadAllData}>
                Reload
            </button>
        </div>
    </nav>
</div>