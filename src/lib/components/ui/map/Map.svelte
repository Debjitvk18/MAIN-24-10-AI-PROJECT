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
	import {
		API_BASE_URL,
		MAPBOX_THEMES,
		MARKER_FONT_SIZE,
		PANOID_BASE_URL,
		SOCIAL_MARKER_CLASS
	} from '$lib/constants/constants';

	// Utility functions
	import { getDataFromURL, putDataInURL, removeDataFromURL, toggleFullScreen } from '$lib/utils/generalUtils';
	import { handleMarkerHover, parseCoordinates } from '$lib/utils/mapUtils';

	// SVG icons
	import TwitterIcon from '$lib/assets/svg/marker/x-pin.svg?raw';
	import PanoidsIcon from '$lib/assets/svg/marker/panoids-pin.svg?raw';
	import PanoidsIconImg from '$lib/assets/svg/marker/panoids-pin.svg';
	import LinkedInIcon from '$lib/assets/svg/marker/linkedin-pin.svg?raw';

	// UI Components
	import LoadingOverlay from '$lib/components/ui/spinners/LoadingOverlay.svelte';

	// Icon Component
	import MapTopbar from '$lib/components/ui/map/MapTopbar.svelte';
	import MapSidebar from '$lib/components/ui/map/MapSidebar.svelte';
	import { searchRequestID } from '$lib/stores/mapStore';

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
	let reqId: number;
	let reqLat: number;
	let reqLong: number;
	let request_id: number;

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
				this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group cyberglobes-map-control';

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

	function twitterView(data) {
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

	function linkedInView(data) {
		const posts = data.posts.map((post) => {
			return {
				id: post.urn,
				title: post.text,
				description: post.text,
				image: post.post_image || post.author.image_url,
				lat: null,
				lng: null,
				url: post.url ?? '#'
			};
		});

		const linkedInData = {
			type: 'linkedin',
			count: posts.length,
			icon: LinkedInIcon,
			posts: posts
		};

		socialMediaJson.push(linkedInData);
	}

	function panoidView(data) {
		const posts = data.panoids.map((panoid) => {
			return {
				id: panoid.panoid,
				title: `panoid - ${panoid.panoid}`,
				description: `description - ${panoid.panoid}`,
				image: PanoidsIconImg,
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
		const rawRadius = getDataFromURL('radius');
		const radiusValue = [parseInt(rawRadius, 10) || 1];

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

				// create selected radius circle around the search result
				setTimeout(() => {
					overlayLoadingText = 'Creating radius circle to find the social media posts';
					circle = turf.circle(coordinates, radiusValue, { units: 'kilometers' });
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
							let preData = {
								address,
								latitude: lat,
								longitude: lng
							};
							if (getDataFromURL('features[]') && getDataFromURL('features[]').length > 0) {
								preData.features = getDataFromURL('features[]');
							} else {
								preData.features = ['streetview', 'x-twitter', 'linkedin'];
							}
							const response = await mapService.getMapResults(preData);
							if (!response.success) {
								// hide loader
								showLoadingOverlay = false;
								return false;
							}
							search_id = response.search_id;
						} else {
							search_id = reqId;
							removeDataFromURL('req_id');
						}

						searchRequestID.set(Number(search_id));

						const source = new EventSource(`${API_BASE_URL}map/search-sse/${search_id}`);

						// streeview.
						source.addEventListener('streetview', function(e) {
							const data = JSON.parse(e.data);
							panoidView(data);
						});

						// twitter.
						source.addEventListener('x-twitter', function(e) {
							const data = JSON.parse(e.data);
							twitterView(data);
						});

						// LinkedIn.
						source.addEventListener('linkedin', function(e) {
							const data = JSON.parse(e.data);
							linkedInView(data);
						});

						// LinkedIn error.
						source.addEventListener('linkedin_error', function(e) {
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

				} else {
					try {
						let apiService = new ApiService();
						const res = await apiService.makeApiCall(`search-requests/${request_id}`);
						if (res.success) {
							// twitter.
							const data = res;
							if (data.responses && data.responses['x-twitter']?.response) {
								const tweetsData = data.responses['x-twitter'].response;
								twitterView(tweetsData);
							}

							// linkedin
							if (data.responses && data.responses['linkedin']?.response) {
								const linkedinData = data.responses['linkedin'].response;
								linkedInView(linkedinData);
							}

							// panoids.
							if (data.responses && data.responses['streetview']?.response) {
								const panoidsData = data.responses['streetview'].response;
								panoidView(panoidsData);
							}

							setTimeout(async () => {
								showLoadingOverlay = false;
								await displaySocialMediaPosts();
							}, 4000);
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


	function createMarker(icon: string, coordinates: [number, number], isVisible: boolean, post: number): mapboxgl.Marker {
		const el = document.createElement('div');
		el.className = SOCIAL_MARKER_CLASS;
		el.innerHTML = icon;
		el.style.fontSize = MARKER_FONT_SIZE;
		if (!isVisible) el.style.display = 'none';

		// Create the marker
		const marker = new mapboxgl.Marker(el).setLngLat(coordinates).addTo(map);

		// Create the popup with post.id
		const popup = new mapboxgl.Popup({
			closeButton: false,
			closeOnClick: false,
			offset: 25 // Moves popup above marker
		}).setHTML(`
			<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
    		<img src="${post.image}" style="width: 50px; height: 50px; border-radius: 50%;" alt="post"/>
    		<p style="margin-top: 8px;">${post.title}</p>
  	</div>
		`);

		// Attach popup to marker
		marker.setPopup(popup);

		// Show popup on hover
		marker.getElement().addEventListener('mouseenter', () => {
			marker.togglePopup();
			handleMarkerHover(post.id);
		});

		marker.getElement().addEventListener('mouseleave', () => {
			marker.togglePopup();
			handleMarkerHover(null);
		});

		return marker;
	}

	function filterValidPosts(posts: { lat: number; lng: number }[], shape: any) {
		return posts.filter((post) => {
			if (post.lat !== null && post.lng !== null) {
				return true;

				// check if lat/lng is in the radius circle.
				// const point = turf.point([post.lng, post.lat]);
				// return turf.booleanPointInPolygon(point, shape);
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
	 * Displays social media posts on a map by positioning markers based on specified data types and counts.
	 * Prioritizes posts with lat/lng inside the circle for marker placement before randomly positioning.
	 *
	 * @return {void} Updates the map with markers for social media posts.
	 */
	function displaySocialMediaPosts() {
		socialMediaIcons = socialMediaJson.reduce((acc, { type, icon }) => {
			acc[type] = icon;
			return acc;
		}, {});

		// get the social media data
		socialMediaData = socialMediaJson.map(({ type, count, posts }) => ({ type, count, posts }));

		// Visibility state for social media types
		visibility = socialMediaData.reduce((acc, { type }) => {
			acc[type] = true;
			return acc;
		}, {});

		markers = {};

		// Add social media markers
		socialMediaData.forEach(({ type, count, posts }) => {
			let pointsAdded = 0;
			const validPosts = filterValidPosts(posts, circle);
			const markersForType = [];

			overlayLoadingText = 'Setting up the social icons on map';

			// Add posts marker having valid lat/lng inside the circle
			validPosts.forEach((post) => {
				if (pointsAdded < count) {
					markersForType[post.id] = createMarker(
						socialMediaIcons[type],
						[post.lng, post.lat],
						visibility[type],
						post
					);
					pointsAdded++;
				}
			});


			const invalidPosts = posts.filter((post) => !validPosts.some((validPost) => validPost.id === post.id));
			invalidPosts.forEach((post) => {
				if (pointsAdded < count) {
					const randomPoints = generateRandomValidPoints(1, circle);
					const randomPoint = randomPoints[0];
					if (randomPoint && randomPoint.length === 2) {
						markersForType[post.id] = createMarker(
							socialMediaIcons[type],
							[randomPoint[0], randomPoint[1]] as [number, number],
							visibility[type],
							post
						);
						pointsAdded++;
					}
				}
			});

			markers[type] = markersForType;
		});


		// finalizing the map
		setTimeout(() => {
			overlayLoadingText = 'Finalizing the map';
			const bounds = circle.geometry.coordinates[0].reduce(
				(bounds, coord) => bounds.extend(coord),
				new mapboxgl.LngLatBounds(
					circle.geometry.coordinates[0][0],
					circle.geometry.coordinates[0][0]
				)
			);
			map.fitBounds(bounds, { padding: 20 });
		}, 2000);

		setTimeout(() => {
			overlayLoadingText = 'Almost done';
		}, 3000);

		setTimeout(() => {
			overlayLoadingText = 'Almost done';
			showLoadingOverlay = false;
			showSidebar = true;
			isSidebarVisible = true;
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
	<MapTopbar
		isSidebarVisible={isSidebarVisible}
		showSidebar={showSidebar}
		socialMediaIcons={socialMediaIcons}
		toggleSidebarVisibility={toggleSidebar}
		toggleVisibility={toggleVisibility}
		visibility={visibility}
	/>

	<div class="flex h-full flex-1 relative">
		{#if showSidebar}
			<!-- Sidebar -->
			<div class="sidebar {isSidebarVisible ? 'visible' : ''}">
				<MapSidebar
					isSidebarVisible={isSidebarVisible}
					socialMediaData={socialMediaJson}
					markers={markers}
					visibility={visibility}
					map={map}
				/>
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
