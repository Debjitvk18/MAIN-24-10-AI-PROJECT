<script lang="ts">
	// Svelte
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';

	// Mapbox
	import mapboxgl from 'mapbox-gl';
	import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
	import * as turf from '@turf/turf';

	// Environment variables
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';

	// Services
	import { MapService } from '$lib/services/map-service';

	// Constants
	import {
		API_BASE_URL,
		MAP_PRIMARY_COLOR,
		MAPBOX_THEMES,
		MARKER_FONT_SIZE,
		SOCIAL_MARKER_CLASS,
		SOCIAL_MEDIA_PLATFORMS
	} from '$lib/constants/constants';

	// Utility functions
	import {
		getDataFromURL,
		putDataInURL,
		removeDataFromURL,
		toggleFullScreen
	} from '$lib/utils/generalUtils';
	import {
		addCircleRadius,
		addPulsingDotAnimation,
		flyToMarker,
		handleMarkerHover,
		parseCoordinates,
		resetMap
	} from '$lib/utils/mapUtils';

	// UI Components
	import LoadingOverlay from '$lib/components/ui/spinners/LoadingOverlay.svelte';
	import { toast } from 'svelte-sonner';

	// Icon Component
	import MapTopbar from '$lib/components/ui/map/MapTopbar.svelte';
	import MapSidebar from '$lib/components/ui/map/MapSidebar.svelte';
	import {
		dataLoadingState,
		searchRequestID,
		socialMediaJson,
		visibility,
		hoveredPostId
	} from '$lib/stores/mapStore';
	import ErrorDialog from '$lib/components/general/dialog/ErrorDialog.svelte';
	import { parseSocialMediaResponse } from '$lib/utils/socialMediaUtils';
	import MapExportJson from '$lib/components/ui/map/MapExportJson.svelte';
	import MapDataInsights from './MapDataInsights.svelte';
	import { user } from '$lib/stores/authStore';

	// Default Data...
	let showLoadingOverlay = false;
	let overlayLoadingText = 'Loading';
	let searchQuery: string = '';
	let socialMediaIcons;
	let circle;
	let map: mapboxgl.Map;
	let mapContainer: HTMLElement;
	let showSidebar = false;
	let reqId: number;
	let reqLat: number;
	let reqLong: number;
	let request_id: number;
	let showErrorDialog = false;
	let errorResponse = {};
	let showExportDataButton = false;

	dataLoadingState.set(
		Object.fromEntries(SOCIAL_MEDIA_PLATFORMS.map(({ slug }) => [slug, 'initial']))
	);

	/**
	 * A boolean variable that indicates the visibility state of a sidebar component.
	 *
	 * When set to `true`, the sidebar is visible to the user.
	 * When set to `false`, the sidebar is hidden.
	 */
	let isSidebarVisible = false;

	let mapMarker = null; // set by onclick on map

	// Markers for social media types
	let markers: { [key: string]: mapboxgl.Marker[] } = {};

	// Map service
	const mapService = new MapService();

	/**
	 * A variable that holds the unsubscribe function returned by the subscription to the `page` store.
	 * The subscription listens to changes in the `$page` object, particularly to retrieve the `search`
	 * query parameter from the URL's `searchParams`. This value is assigned to the `searchQuery` variable.
	 *
	 * Calling the `unsubscribe` function stops the subscription and prevents further updates to the
	 * `$page` object.
	 */
	const unsubscribe = page.subscribe(($page) => {
		searchQuery = $page.url.searchParams.get('search') || '';
		reqId = $page.url.searchParams.get('req_id') || '';
		reqLat = $page.url.searchParams.get('lat') || '';
		reqLong = $page.url.searchParams.get('long') || '';
		request_id = $page.url.searchParams.get('request_id') || '';

		// save request id to store, to use in the save search popup.
		searchRequestID.set(Number(request_id || reqId));
	});

	/**
	 * Creates a custom style switcher control for a Mapbox map, allowing users
	 * to dynamically switch map styles from a dropdown menu.
	 *
	 * This control includes a dropdown selector populated with available themes
	 * and applies the selected style to the map. The control also updates the
	 * URL with the chosen theme for persistence and resets when removed from the map.
	 *
	 * @return {Object} A new instance of the StyleSwitcherControl class, which can
	 *         be added to a Mapbox map as a control to switch map styles.
	 */
	function createStyleSwitcherControl() {
		class StyleSwitcherControl {
			onAdd(map) {
				this.map = map;
				this.container = document.createElement('div');
				this.container.className =
					'mapboxgl-ctrl mapboxgl-ctrl-group cyberglobes-map-control relative bottom-9 sm:bottom-14';

				const mapActiveTheme = getDataFromURL('theme');
				const select = this.createStyleSelector(mapActiveTheme);
				this.container.appendChild(select);
				return this.container;
			}

			// Create Style Switch Dropdown
			createStyleSelector(mapActiveTheme) {
				const select = document.createElement('select');
				select.className = 'style-switcher p-3 shadow-md rounded-md bg-white dark:bg-gray-950';

				MAPBOX_THEMES.forEach(({ style, name }) => {
					const option = document.createElement('option');
					option.value = style;
					option.textContent = name;
					option.selected = `mapbox://styles/mapbox/${mapActiveTheme}` === style;
					select.appendChild(option);

					if (option.selected) {
						map.setStyle(style);
					}
				});

				select.addEventListener('change', this.handleStyleChange.bind(this));
				return select;
			}

			// Handle theme change
			handleStyleChange(event) {
				let selectedStyle = event.target.value;
				map.setStyle(selectedStyle);

				// Extract theme name and update URL
				const theme = selectedStyle.replace('mapbox://styles/mapbox/', '');
				putDataInURL('theme', theme);
			}

			// Reset when map removed!
			onRemove() {
				this.container.parentNode.removeChild(this.container);
				this.map = undefined;
			}
		}

		return new StyleSwitcherControl();
	}

	/**
	 * Creates a full-screen control for a Mapbox map.
	 *
	 * The full-screen control allows the user to toggle full-screen mode
	 * for the specified map container. It includes a button with an SVG icon
	 * that triggers the full-screen functionality when clicked.
	 *
	 * @return {Object} An instance of FullScreenControl, which can be added to a Mapbox map.
	 */
	function createFullScreenControl() {
		class FullScreenControl {
			onAdd(map) {
				this.map = map;
				this.container = document.createElement('div');
				this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group cyberglobes-map-control';
				const button = this.createFullScreenButton();
				this.container.appendChild(button);
				return this.container;
			}

			createFullScreenButton() {
				const button = document.createElement('button');
				button.className =
					'mapboxgl-ctrl-icon mapboxgl-ctrl-fullscreen cyberglobes-map-control-btn';
				button.type = 'button';
				button.title = 'Toggle Fullscreen';
				button.style.padding = '2px';
				button.innerHTML =
					'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 9V6a2 2 0 0 1 2-2h3m11 11v3a2 2 0 0 1-2 2h-3m0-16h3a2 2 0 0 1 2 2v3M9 20H6a2 2 0 0 1-2-2v-3"/></svg>';

				button.onclick = () => {
					toggleFullScreen('map-container');
				};

				return button;
			}

			onRemove() {
				this.container.parentNode.removeChild(this.container);
				this.map = undefined;
			}
		}

		return new FullScreenControl();
	}

	// Add Reset Map to Center controller
	function createResetMapControl() {
		class ResetMapControl {
			onAdd(map) {
				this.map = map;
				this.container = document.createElement('div');
				this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group cyberglobes-map-control';
				const button = this.createResetMapControlBtn();
				this.container.appendChild(button);
				return this.container;
			}

			createResetMapControlBtn() {
				const button = document.createElement('button');
				button.className = 'mapboxgl-ctrl-icon mapboxgl-ctrl-resetBtn cyberglobes-map-control-btn';
				button.type = 'button';
				button.title = 'Center Results';
				button.style.padding = '2px';
				button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 16v-2.5q0-.625.438-1.062T13.5 12H16v1.5h-2.5V16zm1.5 6q-.625 0-1.062-.437T12 20.5V18h1.5v2.5H16V22zm7-6v-2.5H18V12h2.5q.625 0 1.063.438T22 13.5V16zM18 22v-1.5h2.5V18H22v2.5q0 .625-.437 1.063T20.5 22zm2.775-12H18.7q-.65-2.2-2.475-3.6T12 5Q9.075 5 7.037 7.038T5 12q0 1.8.813 3.3T8 17.75V15h2v6H4v-2h2.35Q4.8 17.75 3.9 15.938T3 12q0-1.875.713-3.512t1.924-2.85t2.85-1.925T12 3q3.225 0 5.663 1.988T20.775 10"/></svg>`;

				button.onclick = () => {
					centerMapOnCircle();
				};

				return button;
			}

			onRemove() {
				this.container.parentNode.removeChild(this.container);
				this.map = undefined;
			}
		}

		return new ResetMapControl();
	}

	/**
	 * Centers the map view on a circular area defined by coordinates.
	 * This method ensures the map displays the entire circular area
	 * by fitting its bounds to the map view with padding applied.
	 *
	 * @return {void} No return value. Logs an error if the `circle` object
	 *                or its required properties are undefined or invalid.
	 */
	function centerMapOnCircle() {
		if (!circle || !circle.geometry || !circle.geometry.coordinates) {
			console.error('Error: circle is undefined or missing required properties.');
			return;
		}

		// Fit map bounds
		const bounds = circle.geometry.coordinates[0].reduce(
			(bounds, coord) => bounds.extend(coord),
			new mapboxgl.LngLatBounds(
				circle.geometry.coordinates[0][0],
				circle.geometry.coordinates[0][0]
			)
		);
		map.fitBounds(bounds, { padding: 20 });
	}

	onMount(() => {
		const rawRadius = getDataFromURL('radius');
		const radiusValue = [parseInt(rawRadius, 10) || 1];
		const radiusValueInMeters = radiusValue[0] * 1000;

		mapboxgl.accessToken = PUBLIC_MAPBOX_ACCESS_TOKEN;
		map = new mapboxgl.Map({
			container: mapContainer, // Container ID
			style: 'mapbox://styles/mapbox/streets-v12', // Map style to use
			center: [-122.25948, 37.87221], // Starting position [lng, lat]
			zoom: 12 // Starting zoom level
		});

		const geocoder = new MapboxGeocoder({
			accessToken: mapboxgl.accessToken,
			localGeocoder: parseCoordinates,
			mapboxgl: mapboxgl,
			marker: false,
			placeholder: 'Search by lng,lat or address...'
		});

		map.addControl(geocoder);

		map.on('click', (e) => {
			const mapFeatures = map.queryRenderedFeatures(e.point);
			// Ignore the click if it's on a marker
			if (mapFeatures.some((feature) => feature.layer?.type === 'symbol')) {
				return;
			}

			if (mapMarker) mapMarker.remove();

			// Add a marker at the clicked location
			mapMarker = new mapboxgl.Marker().setLngLat(e.lngLat).addTo(map);

			const lngLat = e.lngLat;
			geocoder.setInput(lngLat.lng + ',' + lngLat.lat);
			geocoder.query([lngLat.lng, lngLat.lat].join(','));
		});

		// add control to switch between map and satellite view
		map.addControl(
			new mapboxgl.NavigationControl({
				showCompass: false,
				showZoom: true
			}),
			'top-right'
		);

		map.addControl(createStyleSwitcherControl(), 'bottom-right');
		map.addControl(createFullScreenControl(), 'top-right');

		map.on('load', () => {
			showErrorDialog = false;
			errorResponse = {};

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
					'circle-color': MAP_PRIMARY_COLOR
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
					'line-color': MAP_PRIMARY_COLOR,
					'line-width': 2
				}
			});

			geocoder.on('result', async (event: any) => {
				if (event.result && event.result.center) {
					resetMap(map, mapMarker);

					// Clear previous markers
					Object.keys(markers).forEach((key) => {
						markers[key].forEach((marker) => marker.remove());
					});
					markers = {};

					// Clear previous markers
					Object.keys(markers).forEach((key) => {
						markers[key].forEach((marker) => marker.remove());
					});
					markers = {};

					// Reset visibility
					SOCIAL_MEDIA_PLATFORMS.forEach(({ slug }) => {
						visibility.update((state) => ({ ...state, [slug]: false }));
					});

					// Set loading state
					SOCIAL_MEDIA_PLATFORMS.forEach(({ slug }) => {
						dataLoadingState.update((state) => ({ ...state, [slug]: 'loading' }));
					});

					// extract lat/lng, address
					const address = event.result.place_name;
					const [lng, lat] = event.result.center;

					// update url
					putDataInURL('search', address);
					putDataInURL('lat', lat);
					putDataInURL('long', lng);

					// Fly to new location
					map.flyTo({
						center: [lng, lat],
						zoom: 14,
						essential: true // make animation smooth
					});

					// Add pulsing dot effect
					addPulsingDotAnimation(map, [lng, lat]);

					// Create radius circle
					circle = addCircleRadius(map, [lng, lat], turf, radiusValueInMeters);

					map.addControl(createResetMapControl(), 'top-right');

					// Prepare payload for API request
					let payload = {
						address,
						latitude: lat,
						longitude: lng,
						features: SOCIAL_MEDIA_PLATFORMS.map(({ slug }) => slug)
					};

					// Use features from URL if available
					if (getDataFromURL('features[]') && getDataFromURL('features[]').length > 0) {
						payload.features = getDataFromURL('features[]');
					}

					if (getDataFromURL('radius')) {
						payload.radius = getDataFromURL('radius');
					}

					if (getDataFromURL('resolution')) {
						payload.resolution = getDataFromURL('resolution');
					}

					if (getDataFromURL('timeframe')) {
						payload.timeframe = getDataFromURL('timeframe');
					}

					// xFilters from url
					// check if features are in url and contains x-twitter
					if (payload.features && payload.features.includes('x-twitter')) {
						if (getDataFromURL('xKeywords')) {
							payload.xKeywords = getDataFromURL('xKeywords');
						}
						if (getDataFromURL('xUsernames')) {
							payload.xUsernames = getDataFromURL('xUsernames');
						}
						if (getDataFromURL('xPostTypes[]') && getDataFromURL('xPostTypes[]').length > 0) {
							payload.xPostTypes = getDataFromURL('xPostTypes[]');
						}
					} else {
						removeDataFromURL('xKeywords');
						removeDataFromURL('xUsernames');
						removeDataFromURL('xPostTypes[]');
					}

					let searchId = 0;
					if (!request_id && !reqId) {
						// Fetch data
						const response = await mapService.getMapResults(payload);
						if (!response.success) {
							// show MapError Dialog
							showErrorDialog = true;
							errorResponse = response;
							return false;
						}

						searchId = response.search_id;
					}

					if (reqId && reqId > 0) {
						searchId = reqId;
					}

					if (request_id && request_id > 0) {
						searchId = request_id;
					}

					// Show sidebar
					showSidebar = true;
					isSidebarVisible = true;

					centerMapOnCircle();

					if (searchId < 1) {
						// show MapError Dialog
						showErrorDialog = true;
						errorResponse = {
							success: false,
							message: 'No search results found.',
							error: 'No search results found.'
						};
						return false;
					}

					searchRequestID.set(Number(searchId));

					// Start SSE
					const source = new EventSource(`${API_BASE_URL}map/search-sse/${searchId}`);
					let socialData = [];

					let addedPostIds = [];
					// update the respective state for each platform.
					SOCIAL_MEDIA_PLATFORMS.map(({ slug }) => {
						// Clear existing markers for the platform before adding new ones
						if (markers[slug]) {
							markers[slug].forEach((marker) => marker.remove());
						}
						markers[slug] = [];

						let markersForType: mapboxgl.Marker[] = [];

						source.addEventListener(slug, function (e) {
							// update loading state
							dataLoadingState.update((state) => ({ ...state, [slug]: 'done' }));

							// Parse data to display
							const data = JSON.parse(e.data);

							const parsedData = parseSocialMediaResponse(data, slug);
							socialData.push(parsedData);
							socialMediaJson.update((state) => {
								const updatedSocialData = [...(state.socialData || []), parsedData];
								return { ...state, socialData: updatedSocialData };
							});

							// Visibility
							visibility.update((state) => ({ ...state, [slug]: true }));

							// Add markers
							socialData.forEach(({ type, count, posts }) => {
								if (slug !== type) return;

								let pointsAdded = 0;
								if (slug === 'x-twitter') {
									const twitterPosts = Object.entries(posts);
									twitterPosts[0][1].forEach((post) => {
										if (slug !== type) return;
										if (addedPostIds.includes(post.id)) return false;

										const randomPoints = generateRandomValidPoints(1, circle);
										const randomPoint = randomPoints[0];
										if (randomPoint && randomPoint.length === 2) {
											const mapIcon = post?.historical
												? SOCIAL_MEDIA_PLATFORMS.find((platform) => platform.slug === slug)
														?.mapIconHistorical
												: SOCIAL_MEDIA_PLATFORMS.find((platform) => platform.slug === slug)
														?.mapIcon;
											markersForType[post.id] = createMarker(
												mapIcon,
												[randomPoint[0], randomPoint[1]] as [number, number],
												$visibility[slug],
												post
											);
											pointsAdded++;

											addedPostIds.push(post.id);
										}
									});
									markers[type] = markersForType;
								} else {
									const validPosts = filterValidPosts(posts, circle);
									validPosts.forEach((post) => {
										if (post && pointsAdded < count) {
											markersForType[post.id] = createMarker(
												SOCIAL_MEDIA_PLATFORMS.find((platform) => platform.slug === slug)?.mapIcon,
												[post.lng, post.lat],
												$visibility[slug],
												post
											);

											pointsAdded++;
										}
									});

									const invalidPosts = posts.filter(
										(post) => post && !validPosts.some((validPost) => validPost.id === post.id)
									);
									invalidPosts.forEach((post) => {
										if (slug !== type) return;
										if (post && pointsAdded < count) {
											const randomPoints = generateRandomValidPoints(1, circle);
											const randomPoint = randomPoints[0];
											if (randomPoint && randomPoint.length === 2) {
												markersForType[post.id] = createMarker(
													SOCIAL_MEDIA_PLATFORMS.find((platform) => platform.slug === slug)
														?.mapIcon,
													[randomPoint[0], randomPoint[1]] as [number, number],
													$visibility[slug],
													post
												);
												pointsAdded++;
											}
										}
									});

									markers[type] = markersForType;
								}
							});
						});

						// Handle errors
						source.addEventListener(`${slug}_error`, function (e) {
							dataLoadingState.update((state) => ({ ...state, [slug]: 'error' }));
						});
					});

					// SSE global error handler
					source.addEventListener('error', function (e) {
						const data = JSON.parse(e.data);
						source.close();
						showErrorDialog = true;
						errorResponse = {
							success: false,
							message: data.message,
							error: data.error
						};

						return false;
					});

					// SSE complete event
					source.addEventListener('done', function (e) {
						// close the SSE
						source.close();

						// show button to export the data into the JSON
						showExportDataButton = true;

						// notify user that, request fetching is done.
						toast('🚀 All set! Explore the data now.', { position: 'bottom-center' });

						// Add Static dot to indicate that response is complete.
						map.addSource('static-dot', {
							type: 'geojson',
							data: {
								type: 'FeatureCollection',
								features: [
									{
										type: 'Feature',
										geometry: {
											type: 'Point',
											coordinates: [lng, lat] // Longitude, latitude
										},
										properties: {}
									}
								]
							}
						});
						map.addLayer({
							id: 'static-dot-layer',
							source: 'static-dot',
							type: 'circle',
							paint: {
								'circle-radius': 10,
								'circle-color': MAP_PRIMARY_COLOR,
								width: 200,
								height: 200
							}
						});

						// Remove the animation dot
						map.removeLayer('layer-with-pulsing-dot');
					});
				}
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

			if ((reqId || request_id) && reqLat && reqLong) {
				const lat = reqLat;
				const lng = reqLong;
				const coordinatesString = `${lng},${lat}`;

				// Set input and trigger search
				geocoder.setInput(coordinatesString);
				geocoder.query(coordinatesString);

				let isQueryExecuted = false;

				const handleResults = (event) => {
					if (!isQueryExecuted && event.features.length > 0) {
						const firstSuggestion = event.features[0];

						geocoder.setInput(firstSuggestion.place_name);
						geocoder.query(firstSuggestion.place_name);

						isQueryExecuted = true;
						geocoder.off('results', handleResults);
					}
				};

				geocoder.off('results', handleResults);
				geocoder.on('results', handleResults);

				let activeSuggestion = document.querySelector('.suggestions');
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

		unsubscribe();
	});

	function createMarker(
		icon: string,
		coordinates: [number, number],
		isVisible: boolean,
		post: number
	): mapboxgl.Marker {
		const el = document.createElement('div');
		el.className = SOCIAL_MARKER_CLASS;
		el.innerHTML = icon;
		el.style.fontSize = MARKER_FONT_SIZE;
		el.style.display = !isVisible ? 'none' : 'block';
		el.style.cursor = 'pointer';
		el.id = post.toString();

		// Ensure the map instance is valid before adding marker
		if (!map || !map.getCanvasContainer()) {
			console.error('Map instance is not ready.');
			return null;
		}

		// Add click event to highlight the associated sidebar item
		el.addEventListener('click', (event) => {
			event.stopPropagation();
			hoveredPostId.set(post.id);
		});

		// Create the marker
		return new mapboxgl.Marker(el).setLngLat(coordinates).addTo(map);
	}

	function filterValidPosts(posts: { lat: number; lng: number }[], shape: any) {
		return posts.filter((post) => {
			if (post && post.lat !== null && post.lng !== null) {
				return true;
			}
		});
	}

	function generateRandomValidPoints(count: number, circle: any) {
		const points = [];
		const randomPoints = turf.randomPoint(count, { bbox: turf.bbox(circle) });

		randomPoints.features.forEach((feature) => {
			if (turf.booleanPointInPolygon(feature, circle)) {
				points.push(feature.geometry.coordinates);
			}
		});

		return points;
	}

	/**
	 * Toggles the visibility of markers for a specified type.
	 *
	 * @param {string} type - The type of markers whose visibility needs to be toggled.
	 * @return {void} This function does not return a value.
	 */
	function toggleVisibility(type: string) {
		// Update the visibility object
		$visibility[type] = !$visibility[type];

		// Show or hide markers
		Object.values(markers[type]).forEach((marker) => {
			marker.getElement().style.display = $visibility[type] ? 'block' : 'none';
		});
	}

	/**
	 * Toggles the visibility of the sidebar and adjusts the map size accordingly.
	 *
	 * @return {void} Does not return a value.
	 */
	function toggleSidebar() {
		isSidebarVisible = !isSidebarVisible;
		setTimeout(() => {
			map.resize();
		}, 100);
	}
</script>

<svelte:head>
	<link href="https://api.tiles.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet" />
	<link
		href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v4.7.2/mapbox-gl-geocoder.css"
		rel="stylesheet"
	/>
</svelte:head>

<ErrorDialog bind:isOpen={showErrorDialog} error={errorResponse} />
<LoadingOverlay isLoading={showLoadingOverlay} loadingText={overlayLoadingText} />
<div
	class={`h-screen flex flex-col ${isSidebarVisible ? 'sidebar-visible' : ''}`}
	id="map-container"
>
	<!-- Topbar -->
	<MapTopbar
		{isSidebarVisible}
		{showSidebar}
		{socialMediaIcons}
		toggleSidebarVisibility={toggleSidebar}
		{toggleVisibility}
	/>

	<div class="flex h-full flex-1 relative">
		{#if showSidebar}
			<!-- Sidebar -->
			<div class="sidebar {isSidebarVisible ? 'visible' : ''}">
				<MapSidebar {isSidebarVisible} {markers} {map} />
			</div>
		{/if}

		<div class="h-full relative flex-1">
			<!-- Map Area -->
			<div bind:this={mapContainer} id="map"></div>
		</div>
	</div>
</div>

{#if showExportDataButton && $user}
	<MapExportJson />
	<MapDataInsights />
{/if}

<style>
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

	.style-switcher {
		background: white;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 5px;
		font-size: 14px;
	}

	.sidebar {
		width: 30vw;
		top: 0;
		left: 0;
		height: 100%;
		background-color: #f9f9f9;
		transition: transform 0.3s ease;
		transform: translateX(-100%);
		box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
		z-index: 1;
		position: absolute;
		border-radius: 4px;
	}

	.sidebar.visible {
		transform: translateX(0);
	}

	#map {
		position: absolute;
		width: 100%;
		height: 100%;
		transition: margin-left 0.3s ease;
	}

	.sidebar-visible #map {
		width: calc(100% - 30vw);
		margin-left: 30vw; /* Same width as the sidebar */
	}
</style>
