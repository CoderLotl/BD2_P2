<script>
    import Table from './Table.svelte';
    import SearchPanel from './SearchPanel.svelte';

    export let itemTypes = [];

    let displayedItemTypes = itemTypes;
    let result = '';
</script>

<div class="w-full">
    <SearchPanel selectedCollection={"item-types"}
        on:contentUpdate={(e) =>
        {
            displayedItemTypes = e.detail.elements;
            result = e.detail.result;
        }}
        on:reset={() =>
        {
            displayedItemTypes = itemTypes;
            result = '';
        }}
    />
    <Table columns={['Name', 'Icon']} elements={displayedItemTypes} elementsProperties={['name', 'icon']} result={result} />
</div>
