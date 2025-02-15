<script>
	import MapNoData from '$lib/components/ui/map/MapNoData.svelte';
	import { highlightMarker } from '$lib/utils/mapUtils.js';
	import { truncateString } from '$lib/utils/generalUtils.js';

	export let isSidebarVisible = true; // prop
	export let socialMediaData = [];
	export let markers = {};
	export let visibility;
</script>

<!-- Sidebar -->
{#if isSidebarVisible}
	<div class="dark:bg-neutral-900 w-96 p-4 pt-0 h-full overflow-y-auto shadow-lg">
		<div class="pb-5 h-full">
			<div class="max-w-md mx-auto pb-5">
				{#if !socialMediaData || Object.values(visibility).every(val => val === false) }
					<MapNoData />
				{/if}

				{#if socialMediaData}
					{#each socialMediaData as socialMedia}
						{#each socialMedia.posts as post, index}
							{#if (visibility[socialMedia.type])}
								<div
									class="bg-white p-4 rounded-lg shadow-md mt-4 hover:bg-gray-100 border border-gray-300"
									on:mouseover={() => highlightMarker(markers[socialMedia.type]?.[index])}
									on:mouseleave={() => highlightMarker(markers[socialMedia.type]?.[index], false)}
									on:mouseleave={() => highlightMarker(markers[socialMedia.type]?.[index], false)}>
									<a href={post.url} target="_blank" class="flex items-center gap-4">
										<img class="h-12 w-12 rounded-full" src="{post.image}" alt="post" />
										<div class="flex flex-col">
											<strong
												class="text-sm font-medium text-gray-900 dark:text-gray-200">{truncateString(post.title, 50)}</strong>
											<span class="text-sm font-medium text-gray-500 dark:text-gray-400">
											{truncateString(post.description, 250)}
										</span>
										</div>
									</a>
								</div>
							{/if}
						{/each}
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}