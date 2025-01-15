<script lang="ts">
    export let errorMessages: string[] = [];
</script>

{#if errorMessages.length > 0}
    <div class="mb-4">
        <div class="font-medium text-red-600">
            Whoops! Something went wrong.
        </div>
        <ul class="mt-3 list-disc list-inside text-sm text-red-600">
            {#each errorMessages as message}
                <li>{message}</li>
            {/each}
        </ul>
    </div>
{/if}