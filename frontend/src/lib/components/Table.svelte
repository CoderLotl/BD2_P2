<script>
    export let columns = [];
    export let elements = [];
    export let elementsProperties = [];
</script>

<div class="px-[10%] bg-black/70 rounded-lg flex">
    <div class="bg-black/70 rounded-lg p-4 w-full h-svh overflow-y-auto">
        <table class="w-full border-collapse">
            <thead>
                <tr>
                    {#each columns as column}
                        <th class="text-left border-b border-[#333] p-2 text-[#999] uppercase tracking-wider text-sm">
                            {column}
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#each elements as element}
                    <tr>
                        {#each elementsProperties as elemProp}
                        <td class="text-left border-b border-[#333] p-2">
                            {element[elemProp] ?? '-'}
                        </td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>