<script>
    import { createEventDispatcher } from 'svelte';
    import { FetchJson } from '../api.js';
    import Table from './Table.svelte';

    export let selectedCollection = 'items';

    let dispatch = createEventDispatcher();

    // --- Owners search state ---
    let ownersNameInput = '';
    let ownersKindInput = '';
    let ownersSearchResults = [];
    let ownersCountResult = null;
    let ownersError = null;
    let hasSearchedOwners = false;

    // --- Item Types search state ---
    let itemTypesNameInput = '';
    let itemTypesSearchResults = [];
    let itemTypesCountResult = null;
    let itemTypesError = null;
    let hasSearchedItemTypes = false;

    // --- Items search state ---
    let itemsField = '';
    let itemsText = '';
    let itemsSort = '';
    let itemsDirection = 'asc';
    let itemsOperation = '';
    let itemsAggregateField = '';
    let itemsSearchResults = [];
    let itemsSummaryResult = null;
    let itemsError = null;

    $: isItemsTextEnabled = itemsField !== '';
    $: isItemsSearchReady = itemsField !== '' && itemsText.trim() !== '';
    $: isItemsAggregateFieldNeeded = itemsOperation !== '' && itemsOperation !== 'count';
    $: isItemsSearchInvalid = isItemsAggregateFieldNeeded && itemsAggregateField === '';

    /**
     * Builds a query string from an object, leaving out any key whose
     * value is empty or missing.
     * @param {Object<string, string>} params
     * @returns {string}
     */
    function BuildQueryString(params)
    {
        const searchParams = new URLSearchParams();

        for (const key in params)
        {
            const value = params[key];
            if (value !== undefined && value !== null && value !== '')
            {
                searchParams.set(key, value);
            }
        }

        const queryString = searchParams.toString();
        return queryString.length > 0 ? `?${queryString}` : '';
    }

    async function RunOwnersSearch()
    {
        try
        {
            ownersError = null;
            hasSearchedOwners = true;

            const query = BuildQueryString({ name: ownersNameInput, kind: ownersKindInput });
            ownersSearchResults = await FetchJson(`/owners/search${query}`);

            const countResponse = await FetchJson(`/owners/count${query}`);
            ownersCountResult = countResponse.result;

            dispatch('contentUpdate',
            {
                columns: ['Name', 'Kind'],
                elements: ownersSearchResults,
                elementsProperties: ['name', 'kind'],
                result: `Found ${ownersCountResult} owners.`
            });
        }
        catch (error)
        {
            ownersError = error.message;
            ownersCountResult = null;
        }
    }

    async function RunItemTypesSearch()
    {
        try
        {
            itemTypesError = null;
            hasSearchedItemTypes = true;

            const query = BuildQueryString({ name: itemTypesNameInput });
            itemTypesSearchResults = await FetchJson(`/item-types/search${query}`);

            const countResponse = await FetchJson(`/item-types/count${query}`);
            itemTypesCountResult = countResponse.result;

            dispatch('contentUpdate',
            {
                columns: ['Name', 'Icon'],
                elements: itemTypesSearchResults,
                elementsProperties: ['name', 'icon'],
                result: `Found ${itemTypesCountResult} item types.`
            });
        }
        catch (error)
        {
            itemTypesError = error.message;
            itemTypesCountResult = null;
        }
    }

    async function RunItemsSearch()
    {
        try
        {
            itemsSummaryResult = null;

            const searchQuery = BuildQueryString({
                field: isItemsSearchReady ? itemsField : '',
                text: isItemsSearchReady ? itemsText : '',
                sort: itemsSort,
                direction: itemsSort !== '' ? itemsDirection : ''
            });
            
            itemsSearchResults = await FetchJson(`/items/search${searchQuery}`);

            if (itemsOperation !== '')
            {
                const summaryQuery = BuildQueryString({
                    field: isItemsSearchReady ? itemsField : '',
                    text: isItemsSearchReady ? itemsText : '',
                    operation: itemsOperation,
                    aggregateField: isItemsAggregateFieldNeeded ? itemsAggregateField : ''
                });
                
                const summaryResponse = await FetchJson(`/items/search/summary${summaryQuery}`);

                switch(itemsOperation)
                {
                    case 'count':
                        itemsSummaryResult = `Count: ${summaryResponse.result} items.`;
                        break;
                    case 'sum':
                        itemsSummaryResult = `Sum of ${itemsAggregateField}: ${summaryResponse.result}.`;
                        break;
                    case 'average':
                        itemsSummaryResult = `Average ${itemsAggregateField}: ${summaryResponse.result}.`;
                        break;
                    case 'min':
                        itemsSummaryResult = `Minimum ${itemsAggregateField}: ${summaryResponse.result}.`;
                        break;
                    case 'max':
                        itemsSummaryResult = `Maximum ${itemsAggregateField}: ${summaryResponse.result}.`;
                        break;
                }
            }

            
            dispatch('contentUpdate',
            {
                columns: ['Name', 'Type', 'Owner', 'Volume', 'Capacity'],
                elements: itemsSearchResults,
                elementsProperties: ['name', 'type_name', 'owner_name', 'volume', 'capacity'],
                result: itemsSummaryResult != null ? itemsSummaryResult : `Found ${itemsSearchResults.length} elements.`
            })
        }
        catch (error)
        {
            itemsError = error.message;
            itemsSummaryResult = null;
        }
    }

    /**
     * Clears every search control of the active collection back to its
     * default and tells the parent to drop the search results, going
     * back to its own unfiltered data (no need to re-fetch anything here).
     */
    function Reset()
    {
        if (selectedCollection === 'owners')
        {
            ownersNameInput = '';
            ownersKindInput = '';
            ownersCountResult = null;
            ownersError = null;
            hasSearchedOwners = false;
        }
        else if (selectedCollection === 'item-types')
        {
            itemTypesNameInput = '';
            itemTypesCountResult = null;
            itemTypesError = null;
            hasSearchedItemTypes = false;
        }
        else
        {
            itemsField = '';
            itemsText = '';
            itemsSort = '';
            itemsDirection = 'asc';
            itemsOperation = '';
            itemsAggregateField = '';
            itemsSummaryResult = null;
            itemsError = null;
        }

        dispatch('reset');
    }
</script>

<div class="bg-black/50 rounded-md p-4">
    <div>
        {#if selectedCollection === 'owners'}
            <div class="flex flex-wrap gap-2 items-end">
                <label class="flex flex-col text-sm text-slate-400">
                    Name contains
                    <input
                        type="text"
                        class="bg-black/50 border border-slate-600 rounded px-2 py-1 text-slate-200"
                        bind:value={ownersNameInput}
                    />
                </label>
                <label class="flex flex-col text-sm text-slate-400">
                    Kind
                    <input
                        type="text"
                        class="bg-black/50 border border-slate-600 rounded px-2 py-1 text-slate-200"
                        bind:value={ownersKindInput}
                    />
                </label>
                <button
                    class="border border-slate-500 rounded px-3 py-1 text-slate-300 hover:bg-slate-700/50 duration-300"
                    on:click={RunOwnersSearch}
                >
                    Search
                </button>
                <button
                    class="border border-slate-500 rounded px-3 py-1 text-slate-300 hover:bg-slate-700/50 duration-300"
                    on:click={Reset}>
                    Reset
                </button>
                {#if ownersCountResult !== null}
                    <span class="text-slate-200">Count: {ownersCountResult}</span>
                {/if}
            </div>
        {/if}

        {#if selectedCollection === 'item-types'}
            <div class="flex flex-wrap gap-2 items-end">
                <label class="flex flex-col text-sm text-slate-400">
                    Name contains
                    <input
                        type="text"
                        class="bg-black/50 border border-slate-600 rounded px-2 py-1 text-slate-200"
                        bind:value={itemTypesNameInput}
                    />
                </label>
                <button
                    class="border border-slate-500 rounded px-3 py-1 text-slate-300 hover:bg-slate-700/50 duration-300"
                    on:click={RunItemTypesSearch}
                >
                    Search
                </button>
                <button
                    class="border border-slate-500 rounded px-3 py-1 text-slate-300 hover:bg-slate-700/50 duration-300"
                    on:click={Reset}>
                    Reset
                </button>
                {#if itemTypesCountResult !== null}
                    <span class="text-slate-200">Count: {itemTypesCountResult}</span>
                {/if}
            </div>
        {/if}

        {#if selectedCollection === 'items'}
            <div class="flex flex-wrap gap-2 items-end">
                <label class="flex flex-col text-sm text-slate-400">
                    Search in
                    <select
                        class="bg-black/50 border border-slate-600 rounded px-2 py-1 text-slate-200"
                        bind:value={itemsField}
                    >
                        <option value="">-- Any --</option>
                        <option value="name">Name</option>
                        <option value="owner">Owner</option>
                        <option value="type">Type</option>
                    </select>
                </label>
                <label class="flex flex-col text-sm text-slate-400">
                    Text
                    <input
                        type="text"
                        class="bg-black/50 border border-slate-600 rounded px-2 py-1 text-slate-200 disabled:opacity-40"
                        disabled={isItemsTextEnabled === false}
                        bind:value={itemsText}
                    />
                </label>
                <label class="flex flex-col text-sm text-slate-400">
                    Sort by
                    <select
                        class="bg-black/50 border border-slate-600 rounded px-2 py-1 text-slate-200"
                        bind:value={itemsSort}
                    >
                        <option value="">-- None --</option>
                        <option value="name">Name</option>
                        <option value="volume">Volume</option>
                    </select>
                </label>
                <label class="flex flex-col text-sm text-slate-400">
                    Direction
                    <select
                        class="bg-black/50 border border-slate-600 rounded px-2 py-1 text-slate-200 disabled:opacity-40"
                        disabled={itemsSort === ''}
                        bind:value={itemsDirection}
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </label>
                <label class="flex flex-col text-sm text-slate-400">
                    Compute
                    <select
                        class="bg-black/50 border border-slate-600 rounded px-2 py-1 text-slate-200"
                        bind:value={itemsOperation}
                    >
                        <option value="">-- None --</option>
                        <option value="count">Count</option>
                        <option value="sum">Sum</option>
                        <option value="average">Average</option>
                        <option value="min">Min</option>
                        <option value="max">Max</option>
                    </select>
                </label>
                <label class="flex flex-col text-sm text-slate-400">
                    Of field
                    <select
                        class="bg-black/50 border border-slate-600 rounded px-2 py-1 text-slate-200 disabled:opacity-40"
                        disabled={isItemsAggregateFieldNeeded === false}
                        bind:value={itemsAggregateField}
                    >
                        <option value="">-- None --</option>
                        <option value="volume">Volume</option>
                        <option value="capacity">Capacity</option>
                    </select>
                </label>
                <button
                    class="border border-slate-500 rounded px-3 py-1 text-slate-300 hover:bg-slate-700/50 duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    disabled={isItemsSearchInvalid}
                    title={isItemsSearchInvalid ? 'Choose "Of field" before computing a sum, average, min or max.' : ''}
                    on:click={RunItemsSearch}
                >
                    Search
                </button>
                <button
                    class="border border-slate-500 rounded px-3 py-1 text-slate-300 hover:bg-slate-700/50 duration-300"
                    on:click={Reset}>
                    Reset
                </button>
            </div>
        {/if}
    </div>
</div>