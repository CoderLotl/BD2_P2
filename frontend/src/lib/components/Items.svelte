<script>
    import Table from './Table.svelte';
    import SearchPanel from './SearchPanel.svelte';
    import { SendJson } from '../api.js';
    import putIcon from '../../assets/icons/put.png';
    import takeIcon from '../../assets/icons/take.png';
    import trashIcon from '../../assets/icons/trash.png';

    export let items = [];
    export let LoadAllData;

    let openPutMenuForId = null;
    let actionError = null;
    let result = '';

    let topLevelItems = items.filter(item => item.container_id === null);
    $: containers = items.filter(item => item.is_container === true);

    /**
     * Recomputes topLevelItems from the current items prop. Called by
     * hand right after LoadAllData refreshes items, instead of relying
     * on reactivity, so it never fights with the search/reset handlers
     * that also assign topLevelItems directly.
     */
    function SyncTopLevelItems()
    {
        topLevelItems = items.filter(item => item.container_id === null);
    }

    /**
     * Sums the volume of every item currently stored inside a container,
     * optionally ignoring one item (used when that item is the one being moved).
     * @param {string} containerId
     * @param {string | null} excludeItemId
     * @returns {number}
     */
    function GetUsedVolume(containerId, excludeItemId)
    {
        return items
            .filter(item => item.container_id === containerId && item._id !== excludeItemId)
            .reduce((total, item) => total + item.volume, 0);
    }

    /**
     * Containers where the given item could actually be put: not itself,
     * not the container it is already in, and with enough free space left.
     * @param {object} item
     * @returns {object[]}
     */
    function GetPossibleContainers(item)
    {
        return containers.filter(container =>
        {
            const isItself = container._id === item._id;
            const isCurrentContainer = container._id === item.container_id;
            const freeSpace = container.capacity - GetUsedVolume(container._id, item._id);

            return isItself === false && isCurrentContainer === false && item.volume <= freeSpace;
        });
    }

    function TogglePutMenu(itemId)
    {
        openPutMenuForId = (openPutMenuForId === itemId) ? null : itemId;
    }

    /**
     * Stores an item inside the chosen container (POST /items/:id/store).
     * @param {object} item
     * @param {string} containerId
     */
    async function PutItemInContainer(item, containerId)
    {
        try
        {
            actionError = null;
            openPutMenuForId = null;
            await SendJson(`/items/${item._id}/store`, 'POST', { container_id: containerId });
            await LoadAllData();
            SyncTopLevelItems();
        }
        catch (error)
        {
            actionError = error.message;
        }
    }

    /**
     * Takes an item out of whatever container it is in (POST /items/:id/retrieve).
     * @param {object} item
     */
    async function TakeItemOut(item)
    {
        try
        {
            actionError = null;
            await SendJson(`/items/${item._id}/retrieve`, 'POST');
            await LoadAllData();
            SyncTopLevelItems();
        }
        catch (error)
        {
            actionError = error.message;
        }
    }

    /**
     * Deletes an item (DELETE /items/:id).
     * @param {object} item
     */
    async function DeleteItem(item)
    {
        try
        {
            actionError = null;
            await SendJson(`/items/${item._id}`, 'DELETE');
            await LoadAllData();
            SyncTopLevelItems();
        }
        catch (error)
        {
            actionError = error.message;
        }
    }
</script>

{#if actionError !== null}
    <p class="status error mb-2">{actionError}</p>
{/if}

<div>
    <SearchPanel selectedCollection={"items"}
    on:contentUpdate={(e)=>
        {
            topLevelItems = e.detail.elements;
            result = e.detail.result;
        }}
    on:reset={() =>
        {
            SyncTopLevelItems();
            result = '';
        }}
    />
    <Table
        columns={['Name', 'Type', 'Owner', 'Volume', 'Capacity']}
        elements={topLevelItems}
        elementsProperties={['name', 'type_name', 'owner_name', 'volume', 'capacity']}
        result={result}
    >
        <svelte:fragment slot="actions" let:element>
            <div class="relative flex gap-2 items-center z-10">
                <button class="hover:opacity-70" title="Put in a container" on:click={() => TogglePutMenu(element._id)}>
                    <img src={putIcon} alt="Put" class="w-5 h-5" />
                </button>
                <button class="hover:opacity-70" title="Delete" on:click={() => DeleteItem(element)}>
                    <img src={trashIcon} alt="Delete" class="w-5 h-5" />
                </button>

                {#if openPutMenuForId === element._id}
                    <select
                        class="absolute top-full -left-[100px] z-10 bg-black border border-slate-600 text-slate-200 text-sm rounded"
                        on:change={(e) => PutItemInContainer(element, e.target.value)}
                    >
                        <option value="" selected disabled>Choose a container...</option>
                        {#each GetPossibleContainers(element) as container}
                            <option value={container._id}>{container.name}</option>
                        {/each}
                    </select>
                {/if}
            </div>
        </svelte:fragment>

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
                            <div class="flex items-center justify-between gap-2 py-1">
                                <p>{containedItem.name} ({containedItem.type_name ?? '-'}) &mdash; volume {containedItem.volume}</p>

                                <div class="relative flex gap-2 items-center">
                                    <button class="hover:opacity-70" title="Take out" on:click={() => TakeItemOut(containedItem)}>
                                        <img src={takeIcon} alt="Take" class="w-5 h-5" />
                                    </button>
                                    <button class="hover:opacity-70" title="Put in another container" on:click={() => TogglePutMenu(containedItem._id)}>
                                        <img src={putIcon} alt="Put" class="w-5 h-5" />
                                    </button>
                                    <button class="hover:opacity-70" title="Delete" on:click={() => DeleteItem(containedItem)}>
                                        <img src={trashIcon} alt="Delete" class="w-5 h-5" />
                                    </button>

                                    {#if openPutMenuForId === containedItem._id}
                                        <select
                                            class="absolute top-full right-0 z-10 bg-black border border-slate-600 text-slate-200 text-sm rounded"
                                            on:change={(e) => PutItemInContainer(containedItem, e.target.value)}
                                        >
                                            <option value="" selected disabled>Choose a container...</option>
                                            {#each GetPossibleContainers(containedItem) as container}
                                                <option value={container._id}>{container.name}</option>
                                            {/each}
                                        </select>
                                    {/if}
                                </div>
                            </div>
                        {:else}
                            <p class="italic text-[#999] mt-1">Empty.</p>
                        {/each}
                    </div>
                {/if}
            </div>
        </svelte:fragment>
    </Table>
</div>
