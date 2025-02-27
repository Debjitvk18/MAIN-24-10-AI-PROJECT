<script>
import {Button} from "$lib/components/ui/button/index.ts";
import Icon from '@iconify/svelte';
import {toast} from 'svelte-sonner';

let buttonIcon = 'line-md:downloading';
function exportJson() {
    // set button icon as downloading...
    buttonIcon = 'line-md:downloading-loop';

    // download done, show download done icon...
    setTimeout(() => {
        buttonIcon = 'ic:round-download-done';
        toast.success('Data Exported!.', {position: 'bottom-center'});
    }, 3000);

    // reset the button icon to its original state...
    setTimeout(() => {
        buttonIcon = 'line-md:downloading';
    }, 5000);
}

</script>

<!-- Floating Export JSON Button -->
<Button
    on:click={exportJson}
    aria-label="Export JSON"
    class="fixed bottom-4 right-4 z-50 w-12 h-12 p-0 rounded-full bg-primary text-white shadow-md hover:shadow-lg transition-transform duration-200 transform hover:scale-110"
    variant="primary"
    title="Export JSON">
    <Icon aria-hidden="true" class="w-6 h-6 text-white" icon={buttonIcon}/>
    <span class="sr-only">Export JSON</span>
</Button>