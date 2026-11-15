<script>
    import Table from './Table.svelte';

    export let owners = [];
</script>

<div class="">
    <Table columns={['Name', 'Kind']} elements={owners} elementsProperties={['name', 'kind']} />
</div>