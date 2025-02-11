<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Badge } from '$lib/components/ui/badge';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Icon from '@iconify/svelte';

	export let searches = null;
	export let loading;
</script>

<div class="space-y-8">
	{#if loading}
		{#each Array(6) as _, i}
			<div class="flex items-center animate-pulse">
				<div class="ml-4 space-y-1">
					<Skeleton class="h-4 w-40" />
					<Skeleton class="h-4 w-32" />
				</div>
				<div class="ml-auto">
					<Skeleton class="h-4 w-10" />
				</div>
			</div>
		{/each}
	{:else if searches && searches.length > 0}
		{#each searches as search}
			<div class="flex items-center">
				<div class="ml-4 space-y-1">
					<p class="text-sm font-medium leading-none">{search.address}</p>
					<p class="text-muted-foreground text-sm">
						{search.request_params.latitude}, {search.request_params.longitude}
					</p>
				</div>
				<div class="ml-auto font-medium">{search.request_origin}</div>
				<div class="ml-auto font-medium">
					<Badge variant="outline">-{search.api_credits} credits</Badge>
				</div>
				<div class="ml-auto font-medium">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger><Icon icon="pepicons-pop:dots-y" /></DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Group>
								<DropdownMenu.Item>View</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</div>
		{/each}
	{:else}
		<p class="text-center text-gray-500">No data found</p>
	{/if}
</div>
