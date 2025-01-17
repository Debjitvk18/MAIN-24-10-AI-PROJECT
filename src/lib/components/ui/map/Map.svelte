<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import mapboxgl from 'mapbox-gl';
    import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
    import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
    import * as turf from '@turf/turf';

    let map: mapboxgl.Map;
    let mapContainer: HTMLElement;

    onMount(() => {
        mapboxgl.accessToken = 'pk.eyJ1Ijoid2ViZGV2dHNwIiwiYSI6ImNsdTc1cmptajAycHIya28zNzdkNmYxdzgifQ.AOfG08tSLEzv3F38u3S6yQ';
        map = new mapboxgl.Map({
            container: mapContainer, // Container ID
            style: 'mapbox://styles/mapbox/streets-v12', // Map style to use
            center: [-122.25948, 37.87221], // Starting position [lng, lat]
            zoom: 12 // Starting zoom level
        });

        const marker = new mapboxgl.Marker() // Initialize a new marker
            .setLngLat([-122.25948, 37.87221]) // Marker [lng, lat] coordinates
            .addTo(map); // Add the marker to the map

        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken, // Set the access token
            mapboxgl: mapboxgl, // Set the mapbox-gl instance
            marker: false, // Do not use the default marker style
            placeholder: 'Search for places in Berkeley', // Placeholder text for the search bar
            bbox: [-122.30937, 37.84214, -122.23715, 37.89838], // Boundary for Berkeley
            proximity: {
                longitude: -122.25948,
                latitude: 37.87221
            } // Coordinates of UC Berkeley
        });

        // Add the geocoder to the map
        map.addControl(geocoder);

        // After the map style has loaded on the page,
        // add a source layer and default styling for a single point
        map.on('load', () => {
            // set zoom to 8
            map.setZoom(6);
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

            // Add a source and layer for the 1km radius circle
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

            // Listen for the `result` event from the Geocoder
            // `result` event is triggered when a user makes a selection
            // Add a marker at the result's coordinates and update the circle
            geocoder.on('result', (event: any) => {
                const coordinates = event.result.geometry.coordinates;
                map.getSource('single-point').setData(event.result.geometry);

                // Create a circle with a 1km radius around the point
                const circle = turf.circle(coordinates, 1, { units: 'kilometers' });
                map.getSource('circle').setData(circle);
            });
        });
    });

    onDestroy(() => {
        if (map) {
            map.remove();
        }
    });
</script>

<svelte:head>
    <link href="https://api.tiles.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet" />
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
        padding: 6px 12px;
        font-family: monospace;
        z-index: 1;
        position: absolute;
        top: 0;
        left: 0;
        margin: 12px;
        border-radius: 4px;
    }
</style>

<div bind:this={mapContainer} id="map"></div>
<div class="sidebar">
    sidebar content goes here..
</div>