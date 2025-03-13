<script>
	import { hoveredPostId, socialMediaJson } from '$lib/stores/mapStore.ts';
	import { highlightMarker } from '$lib/utils/mapUtils.js';
	import { sanitizeId } from '$lib/utils/generalUtils.js';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { flyToMarker } from '$lib/utils/mapUtils.js';
	import Icon from '@iconify/svelte';

	export let markers;
	export let map;

	let postIds = [];
	let posts = [];

	$: {
		const facebookMarketplaceSocialData = $socialMediaJson?.socialData?.filter(
			(socialMedia) => socialMedia.type === 'facebook-marketplace'
		);

		if (Array.isArray(facebookMarketplaceSocialData)) {
			postIds = [];
			posts = [];
			facebookMarketplaceSocialData.forEach((data) => {
				Object.entries(data.posts).forEach(([key, value]) => {
					posts.push(value);
				});
			});
		}
	}

	console.log(posts, 'posts');
</script>

<div>
	{#if posts}
		{#each posts as post}
			<div
				data-type="facebook-marketplace"
				class="post-row post-{sanitizeId(post.id)}"
				class:highlighted={$hoveredPostId === post.id}
				on:mouseover={() => highlightMarker(markers['facebook-marketplace']?.[post.id], map, true)}
				on:mouseleave={() =>
					highlightMarker(markers['facebook-marketplace']?.[post.id], map, false)}
			>
				<div class="fbmposts p-4 border-b border-gray-200 {post.id} relative">
					<div class="absolute top-3 right-2 z-50">
						<Tooltip.Root>
							<Tooltip.Trigger class="bg-white rounded-sm">
								<span on:click={() => flyToMarker(markers['facebook-marketplace']?.[post.id], map)}>
									<Icon icon="uil:map-marker" class="h-7 w-7 text-gray-500" />
								</span>
							</Tooltip.Trigger>
							<Tooltip.Content>Locate the marker on the map.</Tooltip.Content>
						</Tooltip.Root>
					</div>

					<a href={post.url} target="_blank" class="flex flex-col gap-4">
						<div>
							<img src={post.image} alt={post.title} class="w-full rounded" />
							<div class="p-4">
								<h2 class="text-lg font-bold flex flex-row gap-2 text-gray-800">
									{post.currency}
									{post.price}
								</h2>
								<p class="text-sm text-gray-600">
									{post.title}
								</p>
							</div>
						</div>
					</a>
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.fbmposts:hover {
		border-color: #007bff;
		background-color: #f0f9ff;
	}
</style>
