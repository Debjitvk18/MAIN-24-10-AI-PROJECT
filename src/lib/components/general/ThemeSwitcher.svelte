<script lang="ts">
	import { toggleMode, mode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';
	import Icon from '@iconify/svelte';
    import * as Tooltip from "$lib/components/ui/tooltip";

</script>

<Tooltip.Root>
    <Tooltip.Trigger>
        <Button on:click={toggleMode} class="bg-trasnparent border-0" variant="outline" size="icon">
            <Icon
                icon="lucide:sun"
                class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
            />
            <Icon
                icon="radix-icons:moon"
                class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
            />
            <span class="sr-only">Toggle theme</span>
        </Button>
    </Tooltip.Trigger>
    <Tooltip.Content>
      <p>Switch to {$mode == 'dark'? 'light' : 'dark'} mode. </p>
    </Tooltip.Content>
  </Tooltip.Root>