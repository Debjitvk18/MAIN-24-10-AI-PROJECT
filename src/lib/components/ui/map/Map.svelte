<script lang="ts">
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';
	import { onMount, onDestroy } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
	import * as turf from '@turf/turf';

	import InstagramIcon from '$lib/assets/svg/social-icons/instagram.svg?raw';
	import FacebookIcon from '$lib/assets/svg/social-icons/facebook.svg?raw';
	import TwitterIcon from '$lib/assets/svg/social-icons/x.svg?raw';
	import LinkedinIcon from '$lib/assets/svg/social-icons/linkedin.svg?raw';
	import PanoidsIcon from '$lib/assets/svg/social-icons/map.svg?raw';

	import FacebookPostImage from '$lib/assets/posts/facebook.jpg';
	import InstagramPostImage from '$lib/assets/posts/instagram.jpg';
	import LinkedinPostImage from '$lib/assets/posts/linkedin.webp';
	import TwitterPostImage from '$lib/assets/posts/twitter.jpg';
	import Modal from '../modal/Modal.svelte';
	import { MapService } from '$lib/services/map-service';
	import LoadingButton from '$lib/components/form/buttons/LoadingButton.svelte';

	import { showToast } from '$lib/stores/toastStore';

	let map: mapboxgl.Map;
	let mapContainer: HTMLElement;
	let showSidebar = false;
	let isLoading = false; // loader
	let errorMessages: string[] = []; // validation errors

	const mapService = new MapService();

	// show save report modal?
	let showSaveModal = false;

	// save results form data
	let saveResultsFormData = {
		title: '',
		refreshFrequency: 'No Refresh',
		autoUpdateEmail: false
	};

	// if refreshFrequency is not 'No Refresh', show autoUpdateEmail checkbox
	function showAutoUpdateEmail() {
		if (saveResultsFormData.refreshFrequency !== 'No Refresh') {
			return true;
		}

		saveResultsFormData.autoUpdateEmail = false;
		return false;
	}

	// api call to save results
	async function handleSaveResults(event: Event) {
		event.preventDefault();
		isLoading = true;

		try {
			const data = await mapService.saveResults({
				title: saveResultsFormData.title,
				refresh_frequency: saveResultsFormData.refreshFrequency,
				auto_update_email: saveResultsFormData.autoUpdateEmail
			});
			if (data.success) {
				showSaveModal = false;
				saveResultsFormData = {
					title: '',
					refreshFrequency: 'No Refresh',
					autoUpdateEmail: false
				};

				// show success message
				showToast({ message: data.message });
			} else {
				handleErrors(data);
			}
		} catch (error) {
			errorMessages.push('An unexpected error occurred.');
		} finally {
			isLoading = false;
		}
	}

	function handleErrors(data: any) {
		errorMessages = [];

		if (data.errors) {
			Object.keys(data.errors).forEach((key) => {
				errorMessages.push(...data.errors[key]);
			});
		} else {
			errorMessages.push(data.message || 'An error occurred');
		}
	}

	const socialMediaJson = [
		{
			type: 'facebook',
			count: 5,
			icon: FacebookIcon,
			posts: [
				{
					id: 1,
					title: 'Post 1',
					description: 'Description 1',
					image: FacebookPostImage,
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 2,
					title: 'Post 2',
					description: 'Description 2',
					image: FacebookPostImage,
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 3,
					title: 'Post 3',
					description: 'Description 3',
					image: FacebookPostImage,
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 4,
					title: 'Post 4',
					description: 'Description 4',
					image: FacebookPostImage,
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 5,
					title: 'Post 5',
					description: 'Description 5',
					image: FacebookPostImage,
					lat: 35.6586,
					lng: 139.7454
				}
			]
		},
		{
			type: 'linkedin',
			count: 2,
			icon: LinkedinIcon,
			posts: [
				{
					id: 1,
					title: 'Post 1',
					description: 'Description 1',
					image: LinkedinPostImage,
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 2,
					title: 'Post 2',
					description: 'Description 2',
					image: LinkedinPostImage,
					lat: 35.6586,
					lng: 139.7454
				}
			]
		},
		{
			type: 'instagram',
			count: 8,
			icon: InstagramIcon,
			posts: [
				{
					id: 1,
					title: 'Post 1',
					description: 'Description 1',
					image: InstagramPostImage,
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 2,
					title: 'Post 2',
					description: 'Description 2',
					image: InstagramPostImage,
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 3,
					title: 'Post 3',
					description: 'Description 3',
					image: InstagramPostImage,
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 4,
					title: 'Post 4',
					description: 'Description 4',
					image: InstagramPostImage,
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 5,
					title: 'Post 5',
					description: 'Description 5',
					image: InstagramPostImage,
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 6,
					title: 'Post 6',
					description: 'Description 6',
					image: InstagramPostImage,
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 7,
					title: 'Post 7',
					description: 'Description 7',
					image: InstagramPostImage,
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 8,
					title: 'Post 8',
					description: 'Description 8',
					image: InstagramPostImage,
					lat: 35.6586,
					lng: 139.7454
				}
			]
		},
		{
			type: 'twitter',
			count: 1,
			icon: TwitterIcon,
			posts: [
				{
					id: 1,
					title: 'Post 1',
					description: 'Description 1',
					image: TwitterPostImage,
					lat: 35.6586,
					lng: 139.7454
				}
			]
		},
		{
			type: 'panoids',
			count: 15,
			icon: PanoidsIcon,
			posts: [
				{
					id: 1,
					title: 'Post 1',
					description: 'Description 1',
					image: '',
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 2,
					title: 'Post 2',
					description: 'Description 2',
					image: '',
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 3,
					title: 'Post 3',
					description: 'Description 3',
					image: '',
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 4,
					title: 'Post 4',
					description: 'Description 4',
					image: '',
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 5,
					title: 'Post 5',
					description: 'Description 5',
					image: '',
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 6,
					title: 'Post 6',
					description: 'Description 6',
					image: '',
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 7,
					title: 'Post 7',
					description: 'Description 7',
					image: '',
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 8,
					title: 'Post 8',
					description: 'Description 8',
					image: '',
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 9,
					title: 'Post 9',
					description: 'Description 9',
					image: '',
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 10,
					title: 'Post 10',
					description: 'Description 10',
					image: '',
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 11,
					title: 'Post 11',
					description: 'Description 11',
					image: '',
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 12,
					title: 'Post 12',
					description: 'Description 12',
					image: '',
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 13,
					title: 'Post 13',
					description: 'Description 13',
					image: '',
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 14,
					title: 'Post 14',
					description: 'Description 14',
					image: '',
					lat: 35.6586,
					lng: 139.7454
				},
				{
					id: 15,
					title: 'Post 15',
					description: 'Description 15',
					image: '',
					lat: 35.6586,
					lng: 139.7454
				}
			]
		}
	];

	// get the social media icons
	const socialMediaIcons = socialMediaJson.reduce((acc, { type, icon }) => {
		acc[type] = icon;
		return acc;
	}, {});

	// get the social media data
	const socialMediaData = socialMediaJson.map(({ type, count }) => ({ type, count }));

	// Visibility state for social media types
	let visibility: { [key: string]: boolean } = socialMediaData.reduce((acc, { type }) => {
		acc[type] = true;
		return acc;
	}, {});

	// Markers for social media types
	let markers: { [key: string]: mapboxgl.Marker[] } = {};

	onMount(() => {
		mapboxgl.accessToken = PUBLIC_MAPBOX_ACCESS_TOKEN;
		map = new mapboxgl.Map({
			container: mapContainer, // Container ID
			style: 'mapbox://styles/mapbox/streets-v12', // Map style to use
			center: [-122.25948, 37.87221], // Starting position [lng, lat]
			zoom: 12 // Starting zoom level
		});

		const geocoder = new MapboxGeocoder({
			accessToken: mapboxgl.accessToken,
			mapboxgl: mapboxgl,
			marker: false,
			placeholder: 'Search for an address'
		});

		map.addControl(geocoder);

		map.on('load', () => {
			map.addSource('single-point', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: []
				}
			});

			map.addLayer({
				id: 'point',
				source: 'single-point',
				type: 'circle',
				paint: {
					'circle-radius': 10,
					'circle-color': '#448ee4'
				}
			});

			map.addSource('circle', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: []
				}
			});

			map.addLayer({
				id: 'line',
				source: 'circle',
				type: 'line',
				paint: {
					'line-color': '#00BCD4',
					'line-width': 2
				}
			});

			geocoder.on('result', (event: any) => {
				const coordinates = event.result.geometry.coordinates;
				map.getSource('single-point').setData(event.result.geometry);

				const circle = turf.circle(coordinates, 1, { units: 'kilometers' });
				map.getSource('circle').setData(circle);

				// Clear existing markers
				Object.values(markers)
					.flat()
					.forEach((marker) => marker.remove());
				markers = {};

				// Add social media markers
				socialMediaData.forEach(({ type, count }) => {
					let pointsAdded = 0;
					const markersForType = [];

					while (pointsAdded < count) {
						const randomPoints = turf.randomPoint(count - pointsAdded, { bbox: turf.bbox(circle) });
						randomPoints.features.forEach((feature) => {
							if (turf.booleanPointInPolygon(feature, circle) && pointsAdded < count) {
								const coords = feature.geometry.coordinates;
								const el = document.createElement('div');
								el.className = 'social-marker';
								el.innerHTML = socialMediaIcons[type];
								el.style.fontSize = '20px';

								const marker = new mapboxgl.Marker(el).setLngLat(coords).addTo(map);

								// Hide marker if the type is not visible
								if (!visibility[type]) marker.getElement().style.display = 'none';

								markersForType.push(marker);
								pointsAdded++;
							}
						});
					}

					markers[type] = markersForType;
				});

				// set map zoom to fit the circle
				const bounds = circle.geometry.coordinates[0].reduce(
					(bounds, coord) => {
						return bounds.extend(coord);
					},
					new mapboxgl.LngLatBounds(
						circle.geometry.coordinates[0][0],
						circle.geometry.coordinates[0][0]
					)
				);

				map.fitBounds(bounds, { padding: 20 });

				// Show the sidebar once the circle and icons are added
				showSidebar = true;
			});
		});
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});

	function toggleVisibility(type: string) {
		// Update the visibility object
		visibility = { ...visibility, [type]: !visibility[type] };

		// Show or hide markers
		markers[type]?.forEach((marker) => {
			marker.getElement().style.display = visibility[type] ? 'block' : 'none';
		});
	}

	function highlightMarker(type: string, id: string, highlight: boolean = true) {
		const marker = markers[type][id];
		if (!marker) return;
		const markerElement = marker.getElement();
		const targetLngLat = [marker.getLngLat().lng, marker.getLngLat().lat];

		// Find the SVG element inside the marker
		const svgElement = markerElement.querySelector('svg');

		if (svgElement) {
			if (highlight) {
				// Highlight the marker by changing its scale and style
				svgElement.style.transition = 'transform 0.5s ease-out';
				svgElement.style.transform = 'scale(1.5)';
				// change svg fill color to custom color
				svgElement.style.fill = '#448ee4';
			} else {
				// Reset the marker's scale and style
				svgElement.style.transform = 'scale(1)';
				// change svg fill color to white
				svgElement.style.fill = 'black';
			}
		}
		marker.setLngLat(targetLngLat);
	}
</script>

<svelte:head>
	<link href="https://api.tiles.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet" />
	<link
		href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v4.7.2/mapbox-gl-geocoder.css"
		rel="stylesheet"
	/>
</svelte:head>

<div class="h-screen flex flex-col">
	<div class="flex h-full flex-1 relative">
		<div class="h-full relative flex-1">
			{#if showSidebar}
				<div class="absolute top-0 md:pt-3 w-full p-2 md:px-3 z-100">
					<div class="flex items-center gap-2 max-md:gap-1 md:justify-between">
						<div class="flex gap-2 items-center">
							<div class="h-full">
								<div class="flex gap-1">
									<button
										class="rounded-lg block disabled:cursor-not-allowed transition-all duration-100 ease-in px-3 py-1.5 font-500 flex items-center justify-center gap-2 bg-black hover:bg-black disabled:bg-zinc-600 text-white max-md:size-9"
										on:click={() => (showSaveModal = !showSaveModal)}
									>
										<div class="md:hidden i-lucide-plus p-3"></div>
										<span>Save Results</span></button
									>
								</div>
								<Modal
									title="Save your results"
									open={showSaveModal}
									on:close={() => (showSaveModal = false)}
								>
									<svelte:fragment slot="body">
										<form on:submit={handleSaveResults}>
											<div>
												<label class="block font-medium text-sm text-gray-700" for="Title"
													>Title</label
												>
												<input
													class="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-md shadow-sm block mt-1 w-full"
													id="title"
													type="text"
													required
													bind:value={saveResultsFormData.title}
												/>
											</div>
											<div class="mt-4">
												<label
													class="block font-medium text-sm text-gray-700"
													for="refresh_frequency">Refresh Frequency</label
												>
												<select
													id="refresh_frequency"
													name="refresh_frequency"
													class="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-md shadow-sm block mt-1 w-full"
													bind:value={saveResultsFormData.refreshFrequency}
												>
													<option value="No Refresh">No Refresh</option>
													<option value="Daily">Daily</option>
													<option value="Monthly">Monthly</option>
												</select>
											</div>
											{#if showAutoUpdateEmail()}
												<div class="block mt-4">
													<label for="auto_update_email" class="flex items-center"
														><input
															type="checkbox"
															class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
															id="auto_update_email"
															name="auto_update_email"
															bind:checked={saveResultsFormData.autoUpdateEmail}
														/>
														<span class="ml-2 text-sm text-gray-600">Email me when auto-update</span
														></label
													>
												</div>
											{/if}
											<div class="flex items-center justify-end mt-4">
												{#if isLoading}
													<LoadingButton buttonText="Saving..." />
												{:else}
													<button
														type="submit"
														class="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring focus:ring-gray-300 disabled:opacity-25 transition ml-4"
														>Save results</button
													>
												{/if}
											</div>
										</form>
									</svelte:fragment>
								</Modal>
							</div>
						</div>
					</div>
				</div>
			{/if}
			<div bind:this={mapContainer} id="map"></div>
		</div>

		{#if showSidebar}
			<div class="h-full">
				<div class="bg-neutral-900 w-96 p-4 pt-0 h-full overflow-y-auto">
					<div class="sticky top-0">
						<div class="bg-neutral-800 rounded-lg p-3 flex justify-between gap-5 w-full">
							{#each Object.keys(socialMediaIcons) as type}
								<button
									on:click={() => toggleVisibility(type)}
									class="relative rounded p-1 flex items-center justify-center gap-1 bg-white dark:hover:bg-neutral-500 shadow {visibility[
										type
									]
										? ''
										: 'bg-neutral-500'}"
								>
									<span title={type}>{@html socialMediaIcons[type]}</span>
									<span
										class="absolute bg-blue-200 text-black px-2 py-1 text-xs font-bold rounded-full -top-3 -right-3"
									>
										{socialMediaData.find((data) => data.type === type).count}
									</span>
								</button>
							{/each}
						</div>
					</div>
					<div>
						<div class="pb-5 h-full">
							<div class="max-w-md mx-auto">
								{#each socialMediaJson as socialMedia}
									{#each socialMedia.posts as post, index}
										<div
											class="flex items-center border-b border-b-slate-800 p-4 hover:bg-neutral-800 rounded-lg {visibility[
												socialMedia.type
											]
												? ''
												: 'hidden'}"
											on:mouseover={() => highlightMarker(socialMedia.type, index)}
											on:mouseleave={() => highlightMarker(socialMedia.type, index, false)}
											on:mouseleave={() => highlightMarker(socialMedia.type, index, false)}
										>
											<img
												src={post.image}
												alt={post.title}
												class="w-12 h-12 object-cover rounded-md shadow"
											/>
											<div class="ml-4">
												<h2 class="text-lg font-bold text-white">{post.title}</h2>
												<p class="text-sm text-white">{post.description}</p>
												<p class="text-sm text-white">Lat: {post.lat}, Lng: {post.lng}</p>
											</div>
										</div>
									{/each}
								{/each}
							</div>
							<div class="max-md:col-span-5 col-span-2">
								<div class="flex gap-2">
									<div class="bg-white rounded-lg">
										<a
											href="/login"
											class="rounded-lg px-4 py-2 bg-gray-200 hover:bg-gray-300 duration-300"
											>Login to explore more</a
										>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	#map {
		position: absolute;
		width: 100%;
		height: 100%;
	}
	.sidebar {
		background-color: rgb(35 55 75 / 90%);
		color: #fff;
		padding: 10px;
		font-family: monospace;
		z-index: 1;
		position: absolute;
		top: 10px;
		left: 10px;
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.social-marker {
		display: flex;
		align-items: center;
		justify-content: center;
		background: white;
		border-radius: 50%;
		width: 30px;
		height: 30px;
		text-align: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}
	.icon {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.icon svg {
		fill: white !important;
	}

	.bounce-animation {
		animation: bounce 0.6s ease forwards;
	}

	@keyframes bounce {
		0% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px); /* Move up by 10px */
		}
		100% {
			transform: translateY(0); /* Return to original position */
		}
	}
</style>
