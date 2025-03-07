<script>
	import { hoveredPostId, socialMediaJson } from '$lib/stores/mapStore.ts';
	import { highlightMarker } from '$lib/utils/mapUtils.js';
	import { sanitizeId } from '$lib/utils/generalUtils.js';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Avatar from '$lib/components/ui/avatar';
	import { flyToMarker } from '$lib/utils/mapUtils.js';
	import Icon from '@iconify/svelte';
	import FbPosts from './FBPosts.svelte';

	export let markers;
	export let map;

	let postIds = [];
	let posts = [];

	$: {
		const facebookSocialData = $socialMediaJson?.socialData?.filter(
			(socialMedia) => socialMedia.type === 'facebook'
		);
		if (Array.isArray(facebookSocialData)) {
			postIds = [];
			posts = [];
			facebookSocialData.forEach((data) => {
				Object.entries(data.posts).forEach(([key, value]) => {
					value.forEach((post) => {
						if (!postIds.includes(post.id)) {
							postIds.push(post.id);
							if (!posts[key]) {
								posts[key] = [];
							}
							posts[key].push(post);
						}
					});
				});
			});
		}
	}
</script>

<div class="facebook">
	{#if posts}
		{#each Object.keys(posts) as key}
			{#if posts[key].length > 0}
				{#each posts[key] as post}
					<div
						data-type="facebook"
						class="post-row post-{sanitizeId(post.id)}"
						class:highlighted={$hoveredPostId === post.id}
						on:mouseover={() => highlightMarker(markers['facebook']?.[post.id], map, true)}
						on:mouseleave={() => highlightMarker(markers['facebook']?.[post.id], map, false)}
					>
						{#if post.type === 'users'}
							<div class="fbposts p-4 border-b border-gray-200 {post.id} relative">
								<div class="absolute top-3 right-2 z-50">
									<Tooltip.Root>
										<Tooltip.Trigger>
											<span on:click={() => flyToMarker(markers['facebook']?.[post.id], map)}>
												<Icon icon="uil:map-marker" class="h-7 w-7 text-gray-500" />
											</span>
										</Tooltip.Trigger>
										<Tooltip.Content>Locate the marker on the map.</Tooltip.Content>
									</Tooltip.Root>
								</div>
								<a href={post.url} target="_blank" class="flex items-center gap-4">
									<div class="flex items-start space-x-4 relative">
										<Avatar.Root class="w-14 h-14 rounded-full">
											<Avatar.Image src={post.image} alt={post.name} />
											<Avatar.Fallback>P</Avatar.Fallback>
										</Avatar.Root>
									</div>
									<div class="flex flex-col flex-grow">
										<h6 class="text-black text-lg">{post.name}</h6>
										<p class="text-gray-600 text-sm">{post.info}</p>
									</div>
								</a>
							</div>
						{/if}

						{#if post.type === 'pages'}
							<div class="fbposts p-4 border-b border-gray-200 {post.id} relative">
								<div class="absolute top-3 right-2 z-50">
									<Tooltip.Root>
										<Tooltip.Trigger>
											<span on:click={() => flyToMarker(markers['facebook']?.[post.id], map)}>
												<Icon icon="uil:map-marker" class="h-7 w-7 text-gray-500" />
											</span>
										</Tooltip.Trigger>
										<Tooltip.Content>Locate the marker on the map.</Tooltip.Content>
									</Tooltip.Root>
								</div>
								<a href={post.url} target="_blank" class="flex items-center gap-4">
									<div class="flex items-start space-x-4 relative">
										<Avatar.Root class="w-14 h-14 rounded-full">
											<Avatar.Image src={post.image} alt={post.name} />
											<Avatar.Fallback>P</Avatar.Fallback>
										</Avatar.Root>
									</div>
									<div class="flex flex-col flex-grow">
										<h6 class="text-black text-lg">{post.name}</h6>
										<p class="text-gray-600 text-sm">
											{post.followers} followers · {post.postsFrequency}
										</p>
										<p class="text-gray-600 text-xs">{post.info}</p>
									</div>
								</a>
							</div>
						{/if}

						{#if post.type === 'groups'}
							<div class="fbposts p-4 border-b border-gray-200 {post.id} relative">
								<div class="absolute top-3 right-2 z-50">
									<Tooltip.Root>
										<Tooltip.Trigger>
											<span on:click={() => flyToMarker(markers['facebook']?.[post.id], map)}>
												<Icon icon="uil:map-marker" class="h-7 w-7 text-gray-500" />
											</span>
										</Tooltip.Trigger>
										<Tooltip.Content>Locate the marker on the map.</Tooltip.Content>
									</Tooltip.Root>
								</div>
								<a href={post.url} target="_blank" class="flex items-center gap-4">
									<div class="flex items-start space-x-4 relative">
										<Avatar.Root class="w-14 h-14 rounded-md">
											<Avatar.Image src={post.image} alt={post.name} />
											<Avatar.Fallback>P</Avatar.Fallback>
										</Avatar.Root>
									</div>
									<div class="flex flex-col flex-grow">
										<h6 class="text-black text-base">{post.name}</h6>
										<p class="text-gray-600 text-sm">{post.info}</p>
									</div>
								</a>
							</div>
						{/if}

						{#if post.type === 'events'}
							<div class="fbposts p-4 border-b border-gray-200 {post.id} relative">
								<div class="absolute top-3 right-2 z-50">
									<Tooltip.Root>
										<Tooltip.Trigger>
											<span on:click={() => flyToMarker(markers['facebook']?.[post.id], map)}>
												<Icon icon="uil:map-marker" class="h-7 w-7 text-gray-500" />
											</span>
										</Tooltip.Trigger>
										<Tooltip.Content>Locate the marker on the map.</Tooltip.Content>
									</Tooltip.Root>
								</div>
								<a href={post.url} target="_blank" class="flex items-center gap-4">
									<div class="flex items-start space-x-4 relative">
										<Avatar.Root class="w-14 h-14 rounded-md">
											<Avatar.Image src={post.image} alt={post.name} />
											<Avatar.Fallback>P</Avatar.Fallback>
										</Avatar.Root>
									</div>
									<div class="flex flex-col flex-grow">
										<span class="text-gray-600 text-xs">{post.startText}</span>
										<h6 class="text-black text-base">{post.name}</h6>
										<p class="text-gray-600 text-sm">{post.attendings} · {post.location}</p>
									</div>
								</a>
							</div>
						{/if}

						<!-- {#if post.type === 'posts'}
							<FbPosts {post} {map} marker={markers['facebook']?.[post.id]} />
						{/if} -->
					</div>
				{/each}
			{/if}
		{/each}
	{/if}
</div>

<style>
	.fbposts:hover {
		border-color: #007bff;
		background-color: #f0f9ff;
	}
</style>
