<script>
    import Table from './Table.svelte';

    export let items = [];
</script>

<div>
    <Table
        columns={['Name', 'Type', 'Owner', 'Volume', 'Container', 'Capacity', 'Inside']}
        elements={items}
        elementsProperties={['name', 'type_name', 'owner_name', 'volume', 'is_container', 'capacity', 'container_name']}
    />
</div>