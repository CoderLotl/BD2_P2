<script>
    import vine from '../../assets/resources/liana-ivy.png';
    import potion from '../../assets/resources/misc/potion.png';
    import purse from '../../assets/resources/misc/gold_purse2.png';

    export let columns = [];
    export let elements = [];
    export let elementsProperties = [];
</script>

<div class="px-[10%] bg-black/50 flex max-h-[85vh] rounded-3xl relative backdrop-blur-md z-1">
    <div class="bg-black/70 rounded-lg p-4 px-1 pt-0 w-full overflow-y-auto z-2">
        <table class="w-full border-collapse">
            <thead>
                <tr>
                    {#each columns as column}
                        <th class="sticky top-0 bg-[#84191c] text-left border-b border-[#333] p-2 text-[#999] uppercase tracking-wider text-sm pt-8">
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
    <img src={potion} class="absolute bottom-[10px] left-[20px] w-[6%]" alt="potion">
    <img src={purse} class="absolute bottom-[0px] right-[10px] w-[8%]" alt="purse">
</div>