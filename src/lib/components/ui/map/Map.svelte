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

    let map: mapboxgl.Map;
    let mapContainer: HTMLElement;
    let showSidebar = false;

    const socialMediaIcons = {
        facebook: FacebookIcon,
        linkedin: LinkedinIcon,
        instagram: InstagramIcon,
        twitter: TwitterIcon,
        panoids: PanoidsIcon
    };

    // Social media data
    const socialMediaData = [
        { type: 'facebook', count: 5 },
        { type: 'linkedin', count: 2 },
        { type: 'instagram', count: 8 },
        { type: 'twitter', count: 1 },
        { type: 'panoids', count: 15 }
    ];

    // Visibility state for social media types
    let visibility = {
        facebook: true,
        linkedin: true,
        instagram: true,
        twitter: true,
        panoids: true
    };

    // Markers for social media types
    let markers: { [key: string]: mapboxgl.Marker[] } = {};

    onMount(() => {
        mapboxgl.accessToken = 'pk.eyJ1Ijoid2ViZGV2dHNwIiwiYSI6ImNsdTc1cmptajAycHIya28zNzdkNmYxdzgifQ.AOfG08tSLEzv3F38u3S6yQ';
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
            placeholder: 'Search for places in Berkeley',
            bbox: [-122.30937, 37.84214, -122.23715, 37.89838],
            proximity: {
                longitude: -122.25948,
                latitude: 37.87221
            }
        });

        map.addControl(geocoder);

        map.on('load', () => {
            map.addSource('single-point', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': []
                }
            });

            map.addLayer({
                'id': 'point',
                'source': 'single-point',
                'type': 'circle',
                'paint': {
                    'circle-radius': 10,
                    'circle-color': '#448ee4'
                }
            });

            map.addSource('circle', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': []
                }
            });

            map.addLayer({
                'id': 'line',
                'source': 'circle',
                'type': 'line',
                'paint': {
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
                Object.values(markers).flat().forEach(marker => marker.remove());
                markers = {};

                // Add social media markers
                socialMediaData.forEach(({ type, count }) => {
                    const randomPoints = turf.randomPoint(count, { bbox: turf.bbox(circle) });
                    markers[type] = randomPoints.features
                        .filter(feature => turf.booleanPointInPolygon(feature, circle))
                        .map(feature => {
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
    markers[type]?.forEach(marker => {
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
</style>

<div bind:this={mapContainer} id="map"></div>

{#if showSidebar}
    <div class="sidebar">
        <h3>Toggle Markers</h3>
        {#each Object.keys(socialMediaIcons) as type}
            <div class="icon">
                <input
                    type="checkbox"
                    id={type}
                    checked={visibility[type]}
                    on:change={() => toggleVisibility(type)}
                />
                <label for={type}>
                    <span>{@html socialMediaIcons[type]}</span> {type.charAt(0).toUpperCase() + type.slice(1)}
                </label>
            </div>
        {/each}
    </div>
{/if}
