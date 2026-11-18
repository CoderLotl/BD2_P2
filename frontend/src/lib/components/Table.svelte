<script>
    import { slide } from 'svelte/transition';
    import vine from '../../assets/resources/liana-ivy.png';
    import potion from '../../assets/resources/misc/potion.png';
    import potion2 from '../../assets/resources/misc/potion2.png';
    import purse from '../../assets/resources/misc/gold_purse2.png';

    export let columns = [];
    export let elements = [];
    export let elementsProperties = [];
    export let result = '';
    export let emptyMessage = 'No results.';

    let expandedElement = null;

    function ToggleRow(element)
    {
        if ($$slots.detail === undefined)
        {
            return;
        }

        expandedElement = (expandedElement === element) ? null : element;
    }
</script>

<div class="px-[10%] bg-black/50 flex min-h-[65vh] max-h-[80vh] rounded-3xl relative backdrop-blur-md z-1">
    <div class="bg-black/70 rounded-lg p-4 px-1 pt-0 w-full overflow-y-auto z-2">
        <div
            class="grid w-full"
            style="grid-template-columns: repeat({columns.length}, minmax(max-content, 1fr)) {$$slots.actions ? 'max-content' : ''};"
        >
            {#each columns as column}
                <div class="sticky top-0 bg-[#84191c] text-left border-b border-[#333] p-2 text-[#999] uppercase tracking-wider text-sm pt-8 z-20">
                    {column}
                </div>
            {/each}

            {#if $$slots.actions}
                <div class="sticky top-0 bg-[#84191c] text-left border-b border-[#333] p-2 text-[#999] uppercase tracking-wider text-sm pt-8 z-20">
                    Actions
                </div>
            {/if}
            <div class="col-span-full text-center">
                {#if result != ''}
                    {result}
                {:else}
                    Items in collection: {elements.length}
                {/if}
            </div>
            {#each elements as element}
                {#each elementsProperties as elemProp}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div
                        class="text-left border-b border-[#333] p-2 {$$slots.detail ? 'cursor-pointer' : ''}"
                        on:click={() => ToggleRow(element)}
                    >
                        {element[elemProp] ?? '-'}
                    </div>
                {/each}

                {#if $$slots.actions}
                    <div class="text-left border-b border-[#333] p-2">
                        <slot name="actions" {element}></slot>
                    </div>
                {/if}

                {#if expandedElement === element}
                    <div class="border-b border-[#333]" style="grid-column: 1 / -1;" transition:slide>
                        <slot name="detail" {element}></slot>
                    </div>
                {/if}
            {/each}

            {#if elements.length === 0}
                <div class="text-center italic text-[#999] p-4" style="grid-column: 1 / -1;">
                    {emptyMessage}
                </div>
            {/if}
        </div>
    </div>
    <img src={potion} class="absolute bottom-[10px] left-[50px] w-[6%] z-3" alt="potion">
    <img src={potion2} class="absolute bottom-[20px] left-[15px] w-[5%] z-2" alt="potion2">
    <img src={purse} class="absolute bottom-[0px] right-[10px] w-[8%]" alt="purse">
</div>