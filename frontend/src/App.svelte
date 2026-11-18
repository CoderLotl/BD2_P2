<script>
    import { onMount, createEventDispatcher  } from 'svelte';
    import { FetchJson, SendJson } from './lib/api.js';

    import Owners from './lib/components/Owners.svelte';
    import ItemTypes from './lib/components/ItemTypes.svelte';
    import Items from './lib/components/Items.svelte';
    import Nav from './lib/components/Nav.svelte';
    import SearchPanel from './lib/components/SearchPanel.svelte';

    import background from './assets/backgrounds/1036321_4871.jpg';
    import vines from './assets/resources/liana-ivy.png';

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
            console.log('Data loaded:', { itemTypes, owners, items });
        }
    }

    async function SeedDB()
    {
        try
        {
            const response = await SendJson('/admin/seed', 'POST');
            if(response)
            {
                LoadAllData();
            }
        }
        catch (error)
        {
            loadError = error.message;
        }
        finally
        {
            isLoading = false;
            console.log('Data loaded:', { itemTypes, owners, items });
        }
    }

    function handleSwitchTab(e)
    {
        activeTab = e.detail.tab;
    }

    onMount(LoadAllData);
</script>

<main
    class="w-full h-full px-[15%] pt-4"
    style="background-image: url({background}); background-size: contain; background-position: center; background-attachment: fixed;"
>
    <div class="px-[10%]">
        <div class="mb-2">
            <h1 class='text-red-200 text-3xl font-bold font-metamorphous'>
                Misc Items Admin
            </h1>
            <div class="w-1/2 h-[40px]" style="background-image: url({vines}); background-repeat: repeat-x; background-size: 150px;">

            </div>
        </div>
    
        <Nav {activeTab} {LoadAllData} {SeedDB} on:switchTab={handleSwitchTab}/>
    </div>

    {#if loadError}        
        <p class="status error">Error: {loadError}</p>    
    {:else}
        {#if activeTab === 'item-types'}
            <ItemTypes {itemTypes} />
        {/if}

        {#if activeTab === 'owners'}
            <Owners {owners} />
        {/if}

        {#if activeTab === 'items'}
            <Items {items} {LoadAllData} />
        {/if}
    {/if}
</main>
