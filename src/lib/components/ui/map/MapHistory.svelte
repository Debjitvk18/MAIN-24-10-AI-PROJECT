<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.ts';
	import Icon from '@iconify/svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Sheet from '$lib/components/ui/sheet';
	import { MapService } from '$lib/services/map-service';
	import { getDataFromURL, removeDataFromURL } from '$lib/utils/generalUtils';
	import { onMount } from 'svelte';
	import {SOCIAL_MEDIA_PLATFORMS} from "$lib/constants/constants";
	import {Badge} from "$lib/components/ui/badge";

	let historyData = {};
	let location = "";
	let currentPage = 0;
	let hasNextPage = true;

	// const latitude = getDataFromURL('lat');
	// const longitude = getDataFromURL('long');
	const latitude = "26.920341";
	const longitude = "75.81248";

	onMount(() => {
		const mapService = new MapService();
		const payload = { latitude, longitude };
		mapService.getVersionHistory(payload).then((res) => {
			if(!res.success)
				return console.log(`Error fetching history data: ${res.message}`);

			if(res.versions.data.length == 0)
				return console.log("No history data found");

			historyData = res.versions.data;
			location = res.versions.data[0].address;
		});
	});
</script>

<Sheet.Root>
	<Sheet.Trigger>
		<Button variant="outline">
			<Icon class="w-6 h-6 md:me-2 sm:me-0" icon="solar:history-bold" />
			<span class="hidden md:inline">History</span>
		</Button>
	</Sheet.Trigger>
	<Sheet.Content class="flex flex-col h-full" side="right">
		<Sheet.Header class="mb-4">
			<Sheet.Title>Search History</Sheet.Title>
			<Sheet.Description>{location}</Sheet.Description>
		</Sheet.Header>


		<div class="flex-1 overflow-y-auto overflow-x-hidden border-t border-b border-gray-200 py-2">
			{#if historyData && historyData.length > 0}
				{#each historyData as item, index}
					<Card.Root class="mb-4 shadow-lg hover:shadow-xl border border-gray-200 rounded-lg transition-shadow duration-300">
						<Card.Content>
							<div class="flex flex-col md:flex-row md:justify-between md:items-center">
								<span class="text-sm text-gray-700">
									{new Date(item.created_at).toLocaleString('en-US', {
										month: 'long',
										day: 'numeric',
										year: 'numeric',
										hour: '2-digit',
										minute: '2-digit',
										hour12: true
									})}
								</span>
								<Badge class="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-1 rounded-md shadow-sm mt-2 md:mt-0">
									Active
								</Badge>
							</div>
							<hr class="my-4 border-gray-300">
							<div class="flex flex-wrap gap-2">
								{#each item.request_params.features as feature}
									{#if SOCIAL_MEDIA_PLATFORMS.some(platform => platform.slug === feature)}
										<div class="flex items-center space-x-2">
											<Icon
													class="w-8 h-8 text-gray-500 bg-gray-100 rounded-lg p-2 shadow-md hover:bg-gray-200 transition-all duration-200"
													title={feature}
													icon={SOCIAL_MEDIA_PLATFORMS.find(platform => platform.slug === feature)?.tabIcon}
											/>
										</div>
									{/if}
								{/each}
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			{:else}
				<div class="flex flex-col items-center justify-center h-full">
					<Icon class="w-16 h-16 text-gray-500" icon="solar:history-bold" />
					<span class="text-gray-500">No history available.</span>
				</div>
			{/if}
		</div>

		<Sheet.Footer>
			<Sheet.Close>
				<Button variant="ghost">Close</Button>
			</Sheet.Close>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
