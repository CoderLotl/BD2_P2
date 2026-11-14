<script>
    import Table from './Table.svelte';

    export let owners = [];
</script>

<div>
    <Table columns={['Name', 'Kind']} elements={owners} elementsProperties={['name', 'kind']} />
</div>