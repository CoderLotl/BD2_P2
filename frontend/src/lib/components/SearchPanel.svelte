<script>
    import { FetchJson } from '../api.js';
    import Table from './Table.svelte';

    let selectedCollection = 'items';

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
    let hasSearchedItems = false;

    $: isItemsTextEnabled = itemsField !== '';
    $: isItemsSearchReady = itemsField !== '' && itemsText.trim() !== '';
    $: isItemsAggregateFieldNeeded = itemsOperation !== '' && itemsOperation !== 'count';

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
            itemsError = null;
            hasSearchedItems = true;

            const searchQuery = BuildQueryString({
                field: isItemsSearchReady ? itemsField : '',
                text: isItemsSearchReady ? itemsText : '',
                sort: itemsSort,
                direction: itemsSort !== '' ? itemsDirection : ''
            });
            itemsSearchResults = await FetchJson(`/items/search${searchQuery}`);

            if (itemsOperation === '')
            {
                itemsSummaryResult = null;
                return;
            }

            const summaryQuery = BuildQueryString({
                field: isItemsSearchReady ? itemsField : '',
                text: isItemsSearchReady ? itemsText : '',
                operation: itemsOperation,
                aggregateField: isItemsAggregateFieldNeeded ? itemsAggregateField : ''
            });
            const summaryResponse = await FetchJson(`/items/search/summary${summaryQuery}`);
            itemsSummaryResult = summaryResponse.result;
        }
        catch (error)
        {
            itemsError = error.message;
            itemsSummaryResult = null;
        }
    }
</script>

<div class="bg-black/50 rounded-md p-4">
    <div class="flex gap-6 mb-4 border-b border-slate-700 pb-3">
        <label class="flex items-center gap-2 text-slate-300">
            <input type="radio" bind:group={selectedCollection} value="items" />
            Items
        </label>
        <label class="flex items-center gap-2 text-slate-300">
            <input type="radio" bind:group={selectedCollection} value="item-types" />
            Item Types
        </label>
        <label class="flex items-center gap-2 text-slate-300">
            <input type="radio" bind:group={selectedCollection} value="owners" />
            Owners
        </label>
    </div>

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
                    class="border border-slate-500 rounded px-3 py-1 text-slate-300 hover:bg-slate-700/50 duration-300"
                    on:click={RunItemsSearch}
                >
                    Search
                </button>
            </div>
        {/if}
    </div>
</div>
<div>
    {#if selectedCollection === 'owners'}
        {#if ownersError !== null}
            <p class="text-red-400 mt-2">{ownersError}</p>
        {:else}    
                <Table
                    columns={['Name', 'Kind']}
                    elements={ownersSearchResults}
                    elementsProperties={['name', 'kind']}
                    emptyMessage={hasSearchedOwners ? '0 results.' : 'Search anything.'}
                />
        {/if}
    {/if}
    {#if selectedCollection === 'item-types'}
        {#if itemTypesError !== null}
            <p class="text-red-400 mt-2">{itemTypesError}</p>
        {:else}
                <Table
                    columns={['Name', 'Icon']}
                    elements={itemTypesSearchResults}
                    elementsProperties={['name', 'icon']}
                    emptyMessage={hasSearchedItemTypes ? '0 results.' : 'Search anything.'}
                />
        {/if}
    {/if}
    {#if selectedCollection === 'items'}
        {#if itemsError !== null}
            <p class="text-red-400 mt-2">{itemsError}</p>
        {:else}
            {#if itemsSummaryResult !== null}
                <p class="text-slate-200 mt-2">Result: {itemsSummaryResult}</p>
            {/if}
                <Table
                    columns={['Name', 'Type', 'Owner', 'Volume', 'Capacity']}
                    elements={itemsSearchResults}
                    elementsProperties={['name', 'type_name', 'owner_name', 'volume', 'capacity']}
                    emptyMessage={hasSearchedItems ? '0 results.' : 'Search anything.'}
                />
        {/if}
    {/if}
</div>