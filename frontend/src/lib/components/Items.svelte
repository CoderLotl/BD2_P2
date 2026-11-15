<script>
    import Table from './Table.svelte';

    export let items = [];

    $: topLevelItems = items.filter(item => item.container_id === null);
</script>

<div>
    <Table
        columns={['Name', 'Type', 'Owner', 'Volume', 'Capacity']}
        elements={topLevelItems}
        elementsProperties={['name', 'type_name', 'owner_name', 'volume', 'capacity']}
    >
        <svelte:fragment slot="detail" let:element>
            <div class="p-4 bg-black/70 text-[#ddd] rounded-md bg-emerald-900/50 my-2">
                <div class="grid grid-cols-3 mb-2">
                    <span class="text-[#999]">Type: <span class="text-slate-200">{element.type_name ?? '-'}</span></span>
                    <span class="text-[#999]">Owner: <span class="text-slate-200">{element.owner_name ?? '-'}</span></span>
                </div>

                <div class="grid grid-cols-3 {element.is_container ? "mb-8" : "mb-2"}">
                    <span class="text-[#999]">Container: <span class="text-slate-200">{element.is_container ? 'Yes' : 'No'}</span></span>
                    <span class="text-[#999]">Volume: <span class="text-slate-200">{element.volume}</span></span>
                    {#if element.is_container}
                        <span class="text-[#999] ml-4">Capacity: <span class="text-slate-200">{element.capacity}</span></span>
                    {/if}
                </div>               
                
                {#if element.is_container}
                    <div class="flex flex-col mb-2">
                        <span class="text-[#999] uppercase tracking-wider mb-2">
                            Contents
                        </span>
                        {#each items.filter(i => i.container_id === element._id) as containedItem}
                            <p>{containedItem.name} ({containedItem.type_name ?? '-'}) &mdash; volume {containedItem.volume}</p>
                        {:else}
                            <p class="italic text-[#999] mt-1">Empty.</p>
                        {/each}
                    </div>
                {/if}
            </div>
        </svelte:fragment>
    </Table>
</div>