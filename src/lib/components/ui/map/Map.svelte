<script lang="ts">
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

	let map: mapboxgl.Map;
	let mapContainer: HTMLElement;
	let showSidebar = false;

    const socialMediaJson = [
        { type: 'facebook', count: 5, icon: FacebookIcon, posts: [
            { id: 1, title: 'Post 1', description: 'Description 1', image: FacebookPostImage, lat: 35.6586, lng: 139.7454 },
            { id: 2, title: 'Post 2', description: 'Description 2', image: FacebookPostImage, lat: 35.6586, lng: 139.7454 },
            { id: 3, title: 'Post 3', description: 'Description 3', image: FacebookPostImage, lat: 35.6586, lng: 139.7454 },
            { id: 4, title: 'Post 4', description: 'Description 4', image: FacebookPostImage, lat: 35.6586, lng: 139.7454 },
            { id: 5, title: 'Post 5', description: 'Description 5', image: FacebookPostImage, lat: 35.6586, lng: 139.7454 }
        ] },
        { type: 'linkedin', count: 2, icon: LinkedinIcon, posts: [
            { id: 1, title: 'Post 1', description: 'Description 1', image: LinkedinPostImage, lat: 35.6586, lng: 139.7454 },
            { id: 2, title: 'Post 2', description: 'Description 2', image: LinkedinPostImage, lat: 35.6586, lng: 139.7454 }
        ] },
        { type: 'instagram', count: 8, icon: InstagramIcon, posts: [
            { id: 1, title: 'Post 1', description: 'Description 1', image: InstagramPostImage, lat: 35.6586, lng: 139.7454 },
            { id: 2, title: 'Post 2', description: 'Description 2', image: InstagramPostImage, lat: 35.6586, lng: 139.7454 },
            { id: 3, title: 'Post 3', description: 'Description 3', image: InstagramPostImage, lat: 35.6586, lng: 139.7454 },
            { id: 4, title: 'Post 4', description: 'Description 4', image: InstagramPostImage, lat: 35.6586, lng: 139.7454 },
            { id: 5, title: 'Post 5', description: 'Description 5', image: InstagramPostImage, lat: 35.6586, lng: 139.7454 },
            { id: 6, title: 'Post 6', description: 'Description 6', image: InstagramPostImage, lat: 35.6586, lng: 139.7454 },
            { id: 7, title: 'Post 7', description: 'Description 7', image: InstagramPostImage, lat: 35.6586, lng: 139.7454 },
            { id: 8, title: 'Post 8', description: 'Description 8', image: InstagramPostImage, lat: 35.6586, lng: 139.7454 }
        ] },
        { type: 'twitter', count: 1, icon: TwitterIcon, posts: [
            { id: 1, title: 'Post 1', description: 'Description 1', image: TwitterPostImage, lat: 35.6586, lng: 139.7454 }
        ] },
        { type: 'panoids', count: 15, icon: PanoidsIcon, posts: [
            { id: 1, title: 'Post 1', description: 'Description 1', image: "", lat: 35.6586, lng: 139.7454 },
            { id: 2, title: 'Post 2', description: 'Description 2', image: "", lat: 35.6586, lng: 139.7454 },
            { id: 3, title: 'Post 3', description: 'Description 3', image: "", lat: 35.6586, lng: 139.7454 },
            { id: 4, title: 'Post 4', description: 'Description 4', image: "", lat: 35.6586, lng: 139.7454 },
            { id: 5, title: 'Post 5', description: 'Description 5', image: "", lat: 35.6586, lng: 139.7454 },
            { id: 6, title: 'Post 6', description: 'Description 6', image: "", lat: 35.6586, lng: 139.7454 },
            { id: 7, title: 'Post 7', description: 'Description 7', image: "", lat: 35.6586, lng: 139.7454 },
            { id: 8, title: 'Post 8', description: 'Description 8', image: "", lat: 35.6586, lng: 139.7454 },
            { id: 9, title: 'Post 9', description: 'Description 9', image: "", lat: 35.6586, lng: 139.7454 },
            { id: 10, title: 'Post 10', description: 'Description 10', image: "", lat: 35.6586, lng: 139.7454 },
            { id: 11, title: 'Post 11', description: 'Description 11', image: "", lat: 35.6586, lng: 139.7454 },
            { id: 12, title: 'Post 12', description: 'Description 12', image: "", lat: 35.6586, lng: 139.7454 },
            { id: 13, title: 'Post 13', description: 'Description 13', image: "", lat: 35.6586, lng: 139.7454 },
            { id: 14, title: 'Post 14', description: 'Description 14', image: "", lat: 35.6586, lng: 139.7454 },
            { id: 15, title: 'Post 15', description: 'Description 15', image: "", lat: 35.6586, lng: 139.7454 }
        ] }
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
		mapboxgl.accessToken =
			'pk.eyJ1Ijoid2ViZGV2dHNwIiwiYSI6ImNsdTc1cmptajAycHIya28zNzdkNmYxdzgifQ.AOfG08tSLEzv3F38u3S6yQ';
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
					const randomPoints = turf.randomPoint(count, { bbox: turf.bbox(circle) });
					markers[type] = randomPoints.features
						.filter((feature) => turf.booleanPointInPolygon(feature, circle))
						.map((feature) => {
							const coords = feature.geometry.coordinates;
							const el = document.createElement('div');
							el.className = 'social-marker';
							el.innerHTML = socialMediaIcons[type];
							el.style.fontSize = '20px';

							const marker = new mapboxgl.Marker(el).setLngLat(coords).addTo(map);

							// Hide marker if the type is not visible
							if (!visibility[type]) marker.getElement().style.display = 'none';

							return marker;
						});
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
			<div class="absolute top-0 md:pt-3 w-full p-2 md:px-3 z-[100]">
				<div class="flex items-center gap-2 md:justify-between max-md:gap-1">
					<div class="flex gap-2 items-center max-md:flex-1 max-md:gap-1">
						<div class="hidden max-md:block">
							<a class="h-full" data-discover="true" href="/login">
								<button
									class="rounded-lg block disabled:cursor-not-allowed transition-all duration-100 ease-in px-3 py-1.5 font-medium flex items-center justify-center gap-2 bg-black hover:bg-black disabled:bg-zinc-600 text-white"
								>
									<img src="/geospy-white.png" alt="Login" width="20" class="rounded-lg" />
									Login
								</button>
							</a>
						</div>
						<a class="md:hidden shrink-0" data-discover="true" href="/login">
							<img src="/geospy.jpg" alt="Login" class="w-9 h-9 rounded-lg" />
						</a>
					</div>
				</div>
			</div>
			<div bind:this={mapContainer} id="map"></div>
		</div>

		{#if showSidebar}
			<div class="h-full">
				<div class="bg-neutral-900 w-96 p-4 pt-0 h-full overflow-y-auto">
					<div class='sticky top-0'>
                        <div class="bg-neutral-800 rounded-lg p-3 flex justify-between gap-5 w-full">
                            {#each Object.keys(socialMediaIcons) as type}
                                <button
                                    on:click={() => toggleVisibility(type)}
                                    class="relative rounded p-1 flex items-center justify-center gap-1 bg-white dark:hover:bg-neutral-500 shadow {visibility[type] ? '' : 'bg-neutral-500'}"
                                    >
                                    <span title={type}>{@html socialMediaIcons[type]}</span>
                                    <span class="absolute bg-blue-200 text-black px-2 py-1 text-xs font-bold rounded-full -top-3 -right-3">
                                        {socialMediaData.find((data) => data.type === type).count}
                                    </span>
                                </button>
                            {/each}
                        </div>
					</div>
					<div>
						<div class="pb-5 h-full">
                            <div class="max-w-md mx-auto p-4">
                                {#each socialMediaJson as socialMedia}
                                    {#each socialMedia.posts as post}
                                        <div class="flex items-center border-b border-b-slate-800 py-3 {visibility[socialMedia.type] ? '' : 'hidden'}">
                                            <img src={post.image} alt={post.title} class="w-12 h-12 object-cover rounded-md shadow">
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
										<button class="rounded-lg px-4 py-2 bg-gray-200 hover:bg-gray-300 duration-300">Login to explore more</button>
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
        fill: white!important;
    }
</style>
