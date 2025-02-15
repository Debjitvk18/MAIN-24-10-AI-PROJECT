<script lang="ts">
	// Svelte
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ApiService } from '$lib/services/api-service';

	// Mapbox
	import mapboxgl from 'mapbox-gl';
	import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
	import * as turf from '@turf/turf';

	// Environment variables
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';

	// Services
	import { MapService } from '$lib/services/map-service';

	// Constants
	import { API_BASE_URL, MAPBOX_THEMES, PANOID_BASE_URL } from '$lib/constants/constants';

	// Utility functions
	import { getDataFromURL, putDataInURL, toggleFullScreen, truncateString } from '$lib/utils/generalUtils';
	import { highlightMarker, parseCoordinates } from '$lib/utils/mapUtils';

	// SVG icons
	import TwitterIcon from '$lib/assets/svg/marker/x-pin.svg?raw';
	import PanoidsIcon from '$lib/assets/svg/marker/panoids-pin.svg?raw';

	// UI Components
	import { showToast } from '$lib/stores/toastStore';
	import LoadingOverlay from '$lib/components/ui/spinners/LoadingOverlay.svelte';

	// Icon Component
	import MapTopbar from '$lib/components/ui/map/MapTopbar.svelte';
	import MapSidebar from '$lib/components/ui/map/MapSidebar.svelte';

	// Default Data...
	let showLoadingOverlay = false;
	let overlayLoadingText = 'Loading';
	let searchQuery: string = '';
	let socialMediaJson = [];
	let socialMediaIcons;
	let socialMediaData;
	let circle;
	let visibility: { [key: string]: boolean };
	let map: mapboxgl.Map;
	let mapContainer: HTMLElement;
	let showSidebar = false;
	let errorMessages: string[] = []; // validation errors
	const mapService = new MapService();
	let reqId: number;
	let reqLate: number;
	let reqLong: number;
	let request_id: number;

	/**
	 * A boolean variable that indicates the visibility state of a sidebar component.
	 *
	 * When set to `true`, the sidebar is visible to the user.
	 * When set to `false`, the sidebar is hidden.
	 */
	let isSidebarVisible = true;

	let mapMarker = null; // set by onclick on map

	// save results form data
	let saveResultsFormData = {
		title: '',
		refreshFrequency: 'No Refresh',
		autoUpdateEmail: false
	};

	// Markers for social media types
	let markers: { [key: string]: mapboxgl.Marker[] } = {};


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
		reqLate = $page.url.searchParams.get('lat') || '';
		reqLong = $page.url.searchParams.get('long') || '';
		request_id = $page.url.searchParams.get('request_id') || '';

	});

	/**
	 * Determines if the "Auto Update Email" functionality should be shown
	 * based on the refresh frequency setting in the form data. If the refresh
	 * frequency is not set to 'No Refresh', it returns true. Otherwise, it disables
	 * the auto update email option and returns false.
	 *
	 * @return {boolean} Returns true if the refresh frequency is not 'No Refresh', otherwise false.
	 */
	function showAutoUpdateEmail() {
		if (saveResultsFormData.refreshFrequency !== 'No Refresh') {
			return true;
		}

		saveResultsFormData.autoUpdateEmail = false;
		return false;
	}

	/**
	 * Handles the saving of results when triggered by a form event. Prevents the default action of the event,
	 * sends a request to save the results, and manages the UI state and notifications based on the response.
	 *
	 * @param {Event} event The event triggered by the user interaction, typically a form submission.
	 * @return {Promise<void>} A promise that resolves when the save operation completes, either successfully or with errors.
	 */
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

	/**
	 * Processes and formats error messages from a given response object.
	 *
	 * @param {object} data - The data containing error messages or information.
	 * @returns {void} This function does not return a value; it manipulates the errorMessages array directly.
	 */
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
				this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group cyberglobes-map-control';

				const themeFromUrl = getDataFromURL('theme');
				const select = this.createStyleSelector(themeFromUrl);
				this.container.appendChild(select);
				return this.container;
			}

			// Create Style Switch Dropdown
			createStyleSelector(themeFromUrl) {
				const select = document.createElement('select');
				select.className = 'style-switcher p-3 shadow-md rounded-md bg-white dark:bg-gray-950';

				MAPBOX_THEMES.forEach(({ style, name }) => {
					const option = document.createElement('option');
					option.value = style;
					option.textContent = name;
					option.selected = `mapbox://styles/mapbox/${themeFromUrl}` === style;
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

	function twitterView(data)
	{
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
	}

	function panoidView(data)
	{
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
	}

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
			localGeocoder: parseCoordinates,
			mapboxgl: mapboxgl,
			marker: false,
			placeholder: 'Search by lng,lat or address...'
		});

		map.addControl(geocoder);

		map.on('click', (e) => {
			if (mapMarker) mapMarker.remove();

			// Add a marker at the clicked location
			mapMarker = new mapboxgl.Marker()
				.setLngLat(e.lngLat)
				.addTo(map);


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

		map.addControl(createStyleSwitcherControl(), 'top-left');
		map.addControl(createFullScreenControl(), 'top-right');

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
				if (mapMarker) mapMarker.remove(); // Remove clicked map marker

				// Get the coordinates of the search result
				const coordinates = event.result.geometry.coordinates;
				const address = event.result.place_name;
				const lat = coordinates[1];
				const lng = coordinates[0];

				// pass values in the url
				putDataInURL('search', address);
				putDataInURL('lat', lat);
				putDataInURL('long', lng);

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
			  if (!request_id) {
				setTimeout(async () => {
					overlayLoadingText = 'Fetching social media posts';
					const mapService = new MapService();
					let search_id; 
					if (!reqId) {
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
						search_id = response.search_id
					} else{
						search_id = reqId;
						putDataInURL('req_id', '');
					}

					const source = new EventSource(`${API_BASE_URL}map/search-sse/${search_id}`);

					// streeview.
					source.addEventListener('streetview', function(e) {
						const data = JSON.parse(e.data);
						panoidView(data);
					});

					// twitter.
					source.addEventListener('x-twitter', function(e) {
						const data = JSON.parse(e.data);
						console.log(data, 'here')
						twitterView(data);
					});

					// streetview error.
					source.addEventListener('streetview_error', function(e) {
						const data = JSON.parse(e.data);
					});

					// Twitter error.
					source.addEventListener('x-twitter_error', function(e) {
						const data = JSON.parse(e.data);
					});

					// Error.
					source.addEventListener('error', function(e) {
						const data = JSON.parse(e.data);
						source.close();
						overlayLoadingText = 'Something went wrong, please try again';
					});

					// Done.
					source.addEventListener('done', function(e) {
						const data = JSON.parse(e.data);
						source.close();

						// socialMediaJson
						displaySocialMediaPosts();
					});
				}, 4000);

			  } else{
					try {
						let apiService = new ApiService();
						const res = await apiService.makeApiCall(`search-requests/${request_id}`);
						if (res.success) {
							// twitter.
							const data = res;
							if (data.responses && data.responses["x-twitter"]?.response) {
								const tweetsData = data.responses["x-twitter"].response; 
								twitterView(tweetsData)
								setTimeout( async () => {
									showLoadingOverlay = false;
									await displaySocialMediaPosts();
								}, 4000);
							}
							// panoids.
							if (data.responses && data.responses["streetview"]?.response) {
								const panoidsData = data.responses["streetview"].response; 
								panoidView(panoidsData);
							}
						}

					} catch (error) {
						console.error('Error in load function:', error.message);
					}
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

			if ((reqId || request_id) && reqLate && reqLong) {
				const lat = reqLate;
				const lng = reqLong;
				const coordinatesString = `${lng},${lat}`;
				
				// Set input and trigger search
				geocoder.setInput(coordinatesString);
				geocoder.query(coordinatesString);

				let isQueryExecuted = false; 

				const handleResults = (event) => {
					if (!isQueryExecuted && event.features.length > 0) {
						console.log("Suggestions:", event.features);
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

			// if(request_id) {
			// 	console.log("Request", request_id)
			// }

		});
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}

		unsubscribe();
	});

	/**
	 * Displays social media posts on a map by positioning markers based on specified data types and counts.
	 * The method initializes marker visibility, adds random points within a defined polygon, and updates the map state accordingly.
	 * Includes asynchronous steps to finalize map view and update the user interface.
	 *
	 * @return {void} Does not return a value; performs operations to display social media posts on a map.
	 */
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
				console.log(turf.bbox(circle), 'randomPoints')
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

	/**
	 * Toggles the visibility of markers for a specified type.
	 *
	 * @param {string} type - The type of markers whose visibility needs to be toggled.
	 * @return {void} This function does not return a value.
	 */
	function toggleVisibility(type: string) {
		// Update the visibility object
		visibility = { ...visibility, [type]: !visibility[type] };

		// Show or hide markers
		markers[type]?.forEach((marker) => {
			marker.getElement().style.display = visibility[type] ? 'block' : 'none';
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

<LoadingOverlay isLoading={showLoadingOverlay} loadingText={overlayLoadingText} />
<div class={`h-screen flex flex-col ${isSidebarVisible ? 'sidebar-visible' : ''}`} id="map-container">
	<!-- Topbar -->
	<MapTopbar isSidebarVisible={isSidebarVisible} toggleSidebarVisibility={toggleSidebar} />
	<div class="flex h-full flex-1 relative">

		<!-- Sidebar -->
		<div class="sidebar {isSidebarVisible ? 'visible' : ''}">
			<MapSidebar isSidebarVisible={isSidebarVisible} />
		</div>
		{#if showSidebar}
			<div class="h-full">
				<!-- Sidebar -->
				<div class="dark:bg-neutral-900 w-96 p-4 pt-0 h-full overflow-y-auto">
					<div class="sticky top-0">
						<!-- Tabs -->
						<div class="dark:bg-neutral-800 rounded-lg p-3 flex justify-start gap-5 w-full">
							<div class="flex overflow-x-auto">
								{#each Object.keys(socialMediaIcons) as type}
									<div class="flex-none px-3 py-6 first:pl-6 last:pr-6">
										<button
											on:click={() => toggleVisibility(type)}
											class="flex flex-col items-center justify-center gap-3 relative rounded p-1 bg-white dark:hover:bg-neutral-500 shadow"
										>
											<span class="h-18 w-18 rounded-full" title={type}
											>{@html socialMediaIcons[type]}</span
											>
											<strong class="text-xs font-medium text-gray-900 dark:text-gray-200"
											>{type}</strong
											>
											<span
												class="absolute bg-gray-900 text-gray-100 px-2 py-1 text-xs font-bold rounded-full -top-3 -right-3"
											>
												{socialMediaData.find((data) => data.type === type).count}
											</span>
										</button>
									</div>
									<!-- <button
										on:click={() => toggleVisibility(type)}
										class="relative rounded p-1 flex items-center justify-center gap-1 bg-white dark:hover:bg-neutral-500 shadow"
									>
										<span title={type}>{@html socialMediaIcons[type]}</span>
										<span
											class="absolute bg-blue-200 text-black px-2 py-1 text-xs font-bold rounded-full -top-3 -right-3"
										>
											{socialMediaData.find((data) => data.type === type).count}
										</span>
									</button> -->
								{/each}
							</div>
						</div>
					</div>
					<!-- Content -->
					<div>
						<div class="pb-5 h-full">
							<div class="max-w-md mx-auto">
								{#each socialMediaJson as socialMedia}
									{#each socialMedia.posts as post, index}
										<div
											class="bg-white p-4 rounded-lg shadow-md mt-4 hover:bg-gray-100"
											on:mouseover={() => highlightMarker(markers[socialMedia.type]?.[index])}
											on:mouseleave={() => highlightMarker(markers[socialMedia.type]?.[index], false)}
											on:mouseleave={() => highlightMarker(markers[socialMedia.type]?.[index], false)}
										>
											<a href={post.url} target="_blank" class="flex items-center gap-4">
												<img class="h-12 w-12 rounded-full" src={post.image} alt="" />
												<div class="flex flex-col">
													<strong class="text-sm font-medium text-gray-900 dark:text-gray-200"
													>{truncateString(post.title, 50)}</strong
													><span class="text-sm font-medium text-gray-500 dark:text-gray-400"
												>{truncateString(post.description, 250)}</span
												>
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

		<div class="h-full relative flex-1">
			<!-- Map Area -->
			<div bind:this={mapContainer} id="map"></div>
		</div>
	</div>
</div>

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
        width: 24rem;
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
        width: calc(100% - 24rem);
        margin-left: 24rem; /* Same width as the sidebar */
    }

</style>
