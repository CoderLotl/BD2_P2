<script>
    import Table from './Table.svelte';

    export let itemTypes = [];
</script>

<div class="w-full">
    <Table columns={['Name', 'Icon']} elements={itemTypes} elementsProperties={['name', 'icon']} />
</div>