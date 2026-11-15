<script>
    import { onMount, createEventDispatcher  } from 'svelte';
    import { FetchJson } from './lib/api.js';

    import Owners from './lib/components/Owners.svelte';
    import ItemTypes from './lib/components/ItemTypes.svelte';
    import Items from './lib/components/Items.svelte';
    import Nav from './lib/components/Nav.svelte';

    import background from './assets/backgrounds/1036321_4871.jpg';

    let activeTab = 'items';
    let itemTypes = [];
    let owners = [];
    let items = [];
    let isLoading = true;
    let loadError = null;
    let dispatch = createEventDispatcher();

    async function LoadAllData()
    {
        try
        {
            isLoading = true;
            loadError = null;

            const results = await Promise.all([
                FetchJson('/item-types'),
                FetchJson('/owners'),
                FetchJson('/items/stats/enriched')
            ]);

            itemTypes = results[0];
            owners = results[1];
            items = results[2];
        }
        catch (error)
        {
            loadError = error.message;
        }
        finally
        {
            isLoading = false;
        }
    }

    function handleSwitchTab(e)
    {
        activeTab = e.detail.tab;
    }

    onMount(LoadAllData);
</script>

<main
    class="w-full h-full px-[15%]"
    style="background-image: url({background}); background-size: contain; background-position: center; background-attachment: fixed;"
>
    <div class="px-[10%]">
        <h1 class='text-red-200 text-3xl font-bold mb-4'>
            Misc Items Admin
        </h1>
    
        <Nav {activeTab} {LoadAllData} on:switchTab={handleSwitchTab}/>
    </div>

    {#if isLoading}
        <p class="status">Loading...</p>
    {:else if loadError}
        <p class="status error">Error: {loadError}</p>
    {:else}
        {#if activeTab === 'item-types'}
            <ItemTypes {itemTypes} />
        {/if}

        {#if activeTab === 'owners'}
            <Owners {owners} />
        {/if}

        {#if activeTab === 'items'}
            <Items {items} />
        {/if}
    {/if}
</main>
