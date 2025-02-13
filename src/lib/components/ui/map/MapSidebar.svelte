<script>
	import MapNoData from '$lib/components/ui/map/MapNoData.svelte';

	export let isSidebarVisible = true; // prop

	let showNoData = false;
</script>

<!-- Sidebar -->
{#if isSidebarVisible}
	<div class="dark:bg-neutral-900 w-96 p-4 pt-0 h-full overflow-y-auto shadow-lg">
		<div class="pb-5 h-full">
			<div class="max-w-md mx-auto">
				{#if showNoData}
					<MapNoData />
				{/if}

				{#if !showNoData}
					<div
						class="bg-white p-4 rounded-lg shadow-md mt-4 hover:bg-gray-100 border border-gray-300">
						<a href="#" target="_blank" class="flex items-center gap-4">
							<img class="h-12 w-12 rounded-full" src="https://placehold.co/48" alt="post" />
							<div class="flex flex-col">
								<strong class="text-sm font-medium text-gray-900 dark:text-gray-200">Post Title</strong>
								<span class="text-sm font-medium text-gray-500 dark:text-gray-400">
							lorem ipsum dolor sit amet, consectetur adipiscing elit.
						</span>
							</div>
						</a>
					</div>

					<div
						class="bg-white p-4 rounded-lg shadow-md mt-4 hover:bg-gray-100 border border-gray-300">
						<a href="#" target="_blank" class="flex items-center gap-4">
							<img class="h-12 w-12 rounded-full" src="https://placehold.co/48" alt="post" />
							<div class="flex flex-col">
								<strong class="text-sm font-medium text-gray-900 dark:text-gray-200">Post Title</strong>
								<span class="text-sm font-medium text-gray-500 dark:text-gray-400">
							lorem ipsum dolor sit amet, consectetur adipiscing elit.
						</span>
							</div>
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}