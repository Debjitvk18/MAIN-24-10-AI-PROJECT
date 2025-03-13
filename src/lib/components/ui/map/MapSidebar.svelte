<script>
	import MapNoData from '$lib/components/ui/map/MapNoData.svelte';
	import { highlightMarker } from '$lib/utils/mapUtils.js';
	import { sanitizeId, truncateString } from '$lib/utils/generalUtils.js';
	import {
		activeSocialMedia,
		hoveredPostId,
		socialMediaJson,
		visibility,
		searchRequestID
	} from '$lib/stores/mapStore.ts';
	import Icon from '@iconify/svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.ts';
	import TwitterCard from '$lib/components/ui/map/social-cards/x-twitter/TwitterCard.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { MapService } from '$lib/services/map-service';
	import { toast } from 'svelte-sonner';
	import FacebookCard from './social-cards/facebook/FacebookCard.svelte';
	import FacebookMarketplaceCard from './social-cards/facebook-marketplace/FacebookMarketplaceCard.svelte';

	export let isSidebarVisible = true;
	export let markers = {};
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

	function handleScroll(event) {
		const sections = event.target.querySelectorAll('.social-media-block');
		let active = null;

		sections.forEach((section) => {
			const { top, bottom } = section.getBoundingClientRect();

			// Check if the section is in the viewport
			if (top <= window.innerHeight / 2 && bottom >= window.innerHeight / 2) {
				active = section.dataset.type;
			}
		});

		// Update the active social media store
		activeSocialMedia.update((prev) => {
			if (prev !== active) {
				return active;
			}
			return prev;
		});
	}

	let downloadIcons = {};
	async function downloadPanoid(panoidID) {
		try {
			updateDownloadIcon(panoidID, 'line-md:downloading-loop');
			const response = await fetchPanoidData(panoidID);

			const url = createBlobUrl(response);
			triggerDownload(url, panoidID);
			URL.revokeObjectURL(url);

			updateDownloadIcon(panoidID, 'ic:round-download-done');
			toast.success('Downloaded successfully');

			resetDownloadIcon(panoidID);
		} catch (error) {
			console.error(error);
			toast.error('Download failed');
		}
	}

	function updateDownloadIcon(panoidID, icon) {
		downloadIcons[panoidID] = icon;
	}

	async function fetchPanoidData(panoidID) {
		const mapService = new MapService();
		return await mapService.downloadPanoid($searchRequestID, panoidID);
	}

	function createBlobUrl(data) {
		const blob = new Blob([data], { type: 'image/jpeg' });
		return URL.createObjectURL(blob);
	}

	function triggerDownload(url, panoidID) {
		const a = document.createElement('a');
		a.href = url;
		a.download = `${panoidID}.jpg`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	function resetDownloadIcon(panoidID) {
		setTimeout(() => {
			updateDownloadIcon(panoidID, 'line-md:downloading');
		}, 2000);
	}

	let twitterData;
	$: twitterData = $socialMediaJson?.socialData?.find(
		(socialMedia) => socialMedia.type === 'x-twitter'
	);

	let facebookData;
	$: facebookData = $socialMediaJson?.socialData?.find(
		(socialMedia) => socialMedia.type === 'facebook'
	);

	let facebookMarketplaceData;
	$: facebookMarketplaceData = $socialMediaJson?.socialData?.find(
		(socialMedia) => socialMedia.type === 'facebook-marketplace'
	);
</script>

<!-- Sidebar -->
{#if isSidebarVisible}
	<div
		class="dark:bg-neutral-900 w-100 p-4 pt-0 h-full overflow-y-auto shadow-lg sidebar-content"
		bind:this={sidebarElement}
		on:scroll={handleScroll}
	>
		<div class="pb-5 h-full">
			<div class="w-full mx-auto pb-5">
				{#if !$socialMediaJson || Object.values($visibility).every((val) => val === false)}
					<MapNoData />
				{/if}

				{#if $socialMediaJson}
					{#if twitterData && $visibility['x-twitter']}
						<div class="social-media-block" data-type="x-twitter">
							<TwitterCard {markers} {map} />
						</div>
					{/if}

					{#if facebookData && $visibility['facebook']}
						<div class="social-media-block" data-type="facebook">
							<FacebookCard {markers} {map} />
						</div>
					{/if}

					{#if facebookMarketplaceData && $visibility['facebook-marketplace']}
						<div class="social-media-block" data-type="facebook-marketplace">
							<FacebookMarketplaceCard {markers} {map} />
						</div>
					{/if}

					<!-- Call other data here -->
					{#each $socialMediaJson.socialData as socialMedia}
						{#if socialMedia.type !== 'x-twitter' && socialMedia.type !== 'facebook' && socialMedia.type !== 'facebook-marketplace'}
							<div class="social-media-block" data-type={socialMedia.type}>
								{#each socialMedia.posts as post}
									{#if $visibility[socialMedia.type] && post && post.id}
										<div
											data-type={socialMedia.type}
											class="post-row post-{sanitizeId(
												post.id
											)} bg-white p-4 rounded-lg shadow-md mt-4 border border-gray-300 post-section"
											class:highlighted={activeHoveredPostId === post.id}
											on:mouseover={() =>
												highlightMarker(markers[socialMedia.type]?.[post.id], map, true)}
											on:mouseleave={() =>
												highlightMarker(markers[socialMedia.type]?.[post.id], map, false)}
										>
											<div class="{socialMedia.type} p-4 relative">
												{#if socialMedia.type == 'streetview'}
													<div class="absolute top-3 right-2 z-50">
														<Tooltip.Root>
															<Tooltip.Trigger>
																<span on:click={() => downloadPanoid(post.id)}>
																	<Icon
																		icon={downloadIcons[post.id] || 'line-md:downloading'}
																		class="h-7 w-7 text-gray-500"
																	/></span
																>
															</Tooltip.Trigger>
															<Tooltip.Content>Download Image.</Tooltip.Content>
														</Tooltip.Root>
													</div>
												{/if}
												<a href={post.url} target="_blank" class="flex items-center gap-4">
													<Avatar.Root>
														<Avatar.Image src={post.image} alt="post" />
														<Avatar.Fallback>
															{#if post.fallback_image !== undefined && post.fallback_image !== null && post.fallback_image !== ''}
																<img src={post.fallback_image} alt="post" />
															{:else}
																P
															{/if}
														</Avatar.Fallback>
													</Avatar.Root>
													<div class="flex flex-col flex-grow">
														<strong class="text-sm font-medium text-gray-900 dark:text-gray-200"
															>{truncateString(post.title, 50)}</strong
														>
														<span class="text-sm font-medium text-gray-500 dark:text-gray-400">
															{truncateString(post.description, 250)}
														</span>
														{#if post.price}
															<span
																class="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1"
															>
																<Icon icon="grommet-icons:money" />
																{post.currency}{post.price}
															</span>
														{/if}
													</div>
												</a>
											</div>
										</div>
									{/if}
								{/each}
							</div>
						{/if}
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.post-row:hover,
	.highlighted {
		border: 1px solid #007bff;
		background-color: #f0f9ff;
	}
</style>
