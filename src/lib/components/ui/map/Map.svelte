<script lang="ts">
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';
	import { onMount, onDestroy } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
	import * as turf from '@turf/turf';

	import InstagramIcon from '$lib/assets/svg/marker/insta-pin.svg?raw';
	import FacebookIcon from '$lib/assets/svg/marker/facebook-pin.svg?raw';
	import TwitterIcon from '$lib/assets/svg/marker/x-pin.svg?raw';
	import LinkedinIcon from '$lib/assets/svg/marker/linkedin-pin.svg?raw';
	import PanoidsIcon from '$lib/assets/svg/marker/panoids-pin.svg?raw';

	import FacebookPostImage from '$lib/assets/posts/facebook.jpg';
	import InstagramPostImage from '$lib/assets/posts/instagram.jpg';
	import LinkedinPostImage from '$lib/assets/posts/linkedin.webp';
	import TwitterPostImage from '$lib/assets/posts/twitter.jpg';
	import Modal from '../modal/Modal.svelte';
	import { MapService } from '$lib/services/map-service';
	import LoadingButton from '$lib/components/form/buttons/LoadingButton.svelte';

	import { showToast } from '$lib/stores/toastStore';
	import { page } from '$app/stores';

	// loading overlay
	import LoadingOverlay from '$lib/components/ui/spinners/LoadingOverlay.svelte';
	import { API_BASE_URL, PANOID_BASE_URL } from '$lib/constants/constants';
	import { truncateString } from '$lib/utils/generalUtils';
	let showLoadingOverlay = false;
	let overlayLoadingText = 'Loading';

	let searchQuery: string = '';

	const unsubscribe = page.subscribe(($page) => {
		searchQuery = $page.url.searchParams.get('search') || '';
	});

	onDestroy(() => {
		unsubscribe();
	});

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

	var socialMediaJson = [];
	var socialMediaIcons;
	var socialMediaData;
	var circle;
	var visibility: { [key: string]: boolean };

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

			geocoder.on('result', async (event: any) => {
				// Show loading overlay
				showLoadingOverlay = true;

				// Get the coordinates of the search result
				const coordinates = event.result.geometry.coordinates;
				const address = event.result.place_name;
				const lat = coordinates[1];
				const lng = coordinates[0];

				setTimeout(() => {
					overlayLoadingText = 'Getting Address coordinates';
				}, 1000);

				// Set the map's center to the search result coordinates
				setTimeout(() => {
					overlayLoadingText = 'Setting map to address';
					const singlePointSource = map.getSource('single-point');
					if (singlePointSource) {
						singlePointSource.setData(event.result.geometry);
					}
					map.flyTo({ center: coordinates });
				}, 2000);

				// create 1km radius circle around the search result
				setTimeout(() => {
					overlayLoadingText = 'Creating radius circle to find the social media posts';
					circle = turf.circle(coordinates, 1, { units: 'kilometers' });
					const circleSource = map.getSource('circle');
					if (circleSource) {
						circleSource.setData(circle);
					}

					// Clear existing markers
					Object.values(markers)
						.flat()
						.forEach((marker) => marker.remove());
				}, 3000);

				// make api call to get social media posts
				setTimeout(async () => {
					overlayLoadingText = 'Fetching social media posts';
					const mapService = new MapService();

					const response = await mapService.getMapResults({
						address,
						latitude: lat,
						longitude: lng
					});
					if (!response.success) {
						// hide loader
						showLoadingOverlay = false;
						return false;
					}

					const source = new EventSource(`${API_BASE_URL}map/search-sse/${response.search_id}`);

					// streeview.
					source.addEventListener('streetview', function (e) {
						const data = JSON.parse(e.data);

						const posts = data.panoids.map((panoid) => {
							return {
								id: panoid.panoid,
								title: `panoid - ${panoid.panoid}`,
								description: `description - ${panoid.panoid}`,
								image: '',
								lat: panoid.lat,
								lng: panoid.lon,
								url: `${PANOID_BASE_URL}${panoid.panoid}`
							};
						});

						const panoidsData = {
							type: 'panoids',
							count: posts.length,
							icon: PanoidsIcon,
							posts: posts
						};

						socialMediaJson.push(panoidsData);
					});

					// twitter.
					source.addEventListener('x-twitter', function (e) {
						const data = JSON.parse(e.data);
						const posts = data.tweets.map((tweetObj) => {
							const tweet = tweetObj.tweet;
							const user = tweet.user_details;
							const place = tweet.place ?? null;
							let lat = null;
							let lng = null;
							if (place) {
								lat = place.bounding_box.coordinates[0][0][1];
								lng = place.bounding_box.coordinates[0][0][0];
							}

							return {
								id: tweetObj.entryId,
								title: tweet.full_text,
								description: tweet.full_text,
								image: user.profile_image_url_https,
								lat,
								lng,
								url: tweet?.url ?? '#'
							};
						});

						const twitterData = {
							type: 'twitter',
							count: posts.length,
							icon: TwitterIcon,
							posts: posts
						};

						socialMediaJson.push(twitterData);
					});

					// streetview error.
					source.addEventListener('streetview_error', function (e) {
						const data = JSON.parse(e.data);
					});

					// Twitter error.
					source.addEventListener('x-twitter_error', function (e) {
						const data = JSON.parse(e.data);
					});

					// Error.
					source.addEventListener('error', function (e) {
						const data = JSON.parse(e.data);
						source.close();
						overlayLoadingText = 'Something went wrong, please try again';
					});

					// Done.
					source.addEventListener('done', function (e) {
						const data = JSON.parse(e.data);
						source.close();

						// socialMediaJson
						displaySocialMediaPosts();
					});
				}, 4000);
			});

			if (searchQuery) {
				geocoder.query(searchQuery);
				const activeSuggestion = document.querySelector('.suggestions');
				if (activeSuggestion) {
					setTimeout(() => {
						activeSuggestion.style.display = 'none';
					}, 500);
				}
			}
		});
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});

	function displaySocialMediaPosts() {
		socialMediaIcons = socialMediaJson.reduce((acc, { type, icon }) => {
			acc[type] = icon;
			return acc;
		}, {});

		// get the social media data
		socialMediaData = socialMediaJson.map(({ type, count }) => ({ type, count }));

		// Visibility state for social media types
		visibility = socialMediaData.reduce((acc, { type }) => {
			acc[type] = true;
			return acc;
		}, {});

		markers = {};
		// Add social media markers
		socialMediaData.forEach(({ type, count }) => {
			let pointsAdded = 0;
			const markersForType = [];

			overlayLoadingText = 'Setting up the social icons on map';
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

		// finalizing the map
		setTimeout(() => {
			overlayLoadingText = 'Finalizing the map';
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
		}, 2000);

		// hide the loading overlay
		setTimeout(() => {
			overlayLoadingText = 'Almost done';
		}, 3000);

		// hide the loading overlay
		setTimeout(() => {
			overlayLoadingText = 'Almost done';
			showLoadingOverlay = false;
			// Show the sidebar once the circle and icons are added
			showSidebar = true;
		}, 4000);
	}

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

<LoadingOverlay isLoading={showLoadingOverlay} loadingText={overlayLoadingText} />
<div class="h-screen flex flex-col">
	<div class="flex h-full flex-1 relative">
		<div class="h-full relative flex-1">
			{#if showSidebar}
				<div class="absolute top-0 md:pt-3 p-2 md:px-3 z-100 w-auto">
					<div class="flex items-center gap-2 max-md:gap-1 md:justify-between">
						<div class="flex gap-2 items-center">
							<div class="h-full">
								<div class="flex gap-1">
									<!-- <button
										class="rounded-lg block disabled:cursor-not-allowed transition-all duration-100 ease-in px-3 py-1.5 font-500 flex items-center justify-center gap-2 bg-black hover:bg-black disabled:bg-zinc-600 text-white max-md:size-9"
										on:click={() => (showSaveModal = !showSaveModal)}
									>
										<div class="md:hidden i-lucide-plus p-3"></div>
										<span>Save Results</span></button
									> -->
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
											<!-- <div class="flex items-center justify-end mt-4">
												{#if isLoading}
													<LoadingButton buttonText="Saving..." />
												{:else}
													<button
														type="submit"
														class="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring focus:ring-gray-300 disabled:opacity-25 transition ml-4"
														>Save results</button
													>
												{/if}
											</div> -->
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
						<div class="bg-neutral-800 rounded-lg p-3 flex justify-start gap-5 w-full">
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
											class="flex items-start border-b border-b-slate-800 p-4 hover:bg-neutral-800 rounded-lg {visibility[
												socialMedia.type
											]
												? ''
												: 'hidden'}"
											on:mouseover={() => highlightMarker(socialMedia.type, index)}
											on:mouseleave={() => highlightMarker(socialMedia.type, index, false)}
											on:mouseleave={() => highlightMarker(socialMedia.type, index, false)}
										>
											<a href={post.url} target="_blank" class="flex items-start">
												<img
													src={post.image}
													alt="Panorama"
													class="w-12 h-12 object-cover rounded-md shadow"
												/>
												<div class="ml-4">
													<h2 class="text-lg font-bold text-white">
														{truncateString(post.title, 50)}
													</h2>
													<p class="text-sm text-white">{truncateString(post.description, 250)}</p>
													<p class="text-sm text-white">Lat: {post.lat}, Lng: {post.lng}</p>
												</div>
											</a>
										</div>
									{/each}
								{/each}
							</div>
							<div class="max-md:col-span-5 col-span-2 mt-5">
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
