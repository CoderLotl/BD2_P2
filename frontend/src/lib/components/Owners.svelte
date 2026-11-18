<script>
    import Table from './Table.svelte';
    import SearchPanel from './SearchPanel.svelte';

    export let owners = [];

    let displayedOwners = owners;
    let result = '';
</script>

<div>
    <SearchPanel selectedCollection={"owners"}
        on:contentUpdate={(e) =>
        {
            displayedOwners = e.detail.elements;
            result = e.detail.result;
        }}
        on:reset={() =>
        {
            displayedOwners = owners;
            result = '';
        }}
    />
    <Table columns={['Name', 'Kind']} elements={displayedOwners} elementsProperties={['name', 'kind']} result={result} />
</div>
