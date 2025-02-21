<script>
	import MapNoData from '$lib/components/ui/map/MapNoData.svelte';
	import { highlightMarker } from '$lib/utils/mapUtils.js';
	import { sanitizeId, truncateString } from '$lib/utils/generalUtils.js';
	import { hoveredPostId } from '$lib/stores/mapStore.ts';
	import Icon from '@iconify/svelte';
	import * as Avatar from "$lib/components/ui/avatar/index.ts";

	export let isSidebarVisible = true; // prop
	export let socialMediaData = [];
	export let markers = {};
	export let visibility;
	export let map;

	let sidebarElement;

	// Reactively store the hovered post ID
	let activeHoveredPostId = null;
	hoveredPostId.subscribe((id) => {
		activeHoveredPostId = id;

		if (sidebarElement && id !== null) {
			// Scroll to the highlighted post in the sidebar
			const sanitizedId = `post-${sanitizeId(id)}`;
			const postElement = sidebarElement.querySelector(`.${sanitizedId}`);
			if (postElement) {
				postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}
	});

</script>

<!-- Sidebar -->
{#if isSidebarVisible}
	<div class="dark:bg-neutral-900 w-96 p-4 pt-0 h-full overflow-y-auto shadow-lg" bind:this={sidebarElement}>
		<div class="pb-5 h-full">
			<div class="max-w-md mx-auto pb-5">
				{#if !socialMediaData || Object.values(visibility).every(val => val === false) }
					<MapNoData />
				{/if}

				{#if socialMediaData}
					{#each socialMediaData as socialMedia}
						{#each socialMedia.posts as post}
							{#if (visibility[socialMedia.type]) && (post) && (post.id)}
								<div
									class="post-row post-{sanitizeId(post.id)} bg-white p-4 rounded-lg shadow-md mt-4 border border-gray-300"
									class:highlighted={activeHoveredPostId === post.id}
									on:mouseover={() => highlightMarker(markers[socialMedia.type]?.[post.id], map, true)}
									on:mouseleave={() => highlightMarker(markers[socialMedia.type]?.[post.id], map, false)}>
									<a href={post.url} target="_blank" class="flex items-center gap-4">
										<Avatar.Root>
											<Avatar.Image src="{post.image}" alt="post" />
											<Avatar.Fallback>
												{#if post.fallback_image !== undefined && post.fallback_image !== null && post.fallback_image !== ''}
													<img src="{post.fallback_image}" alt="post" />
												{:else}
													P
												{/if}
											</Avatar.Fallback>
										</Avatar.Root>
										<div class="flex flex-col">
											<strong
												class="text-sm font-medium text-gray-900 dark:text-gray-200">{truncateString(post.title, 50)}</strong>
											<span class="text-sm font-medium text-gray-500 dark:text-gray-400">
												{truncateString(post.description, 250)}
											</span>
											{#if post.price}
												<span class="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
													<Icon icon="grommet-icons:money" /> {post.currency}{post.price}
												</span>
											{/if}
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
<style>
    .post-row:hover,
    .highlighted {
        border: 1px solid #007BFF;
        background-color: #f0f9ff;
    }
</style>
