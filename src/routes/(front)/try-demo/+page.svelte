<script lang="ts">
	import Map from '$lib/components/ui/map/Map.svelte';
	import Cta from '$lib/components/ui/home/Cta.svelte';
	import { onMount } from 'svelte';

	let locationRequested = false;
	let locationError = '';
	let isSecureContext = false;

	function isRunningOnSecureContext() {
		// Check if we're on HTTPS or localhost
		return window.isSecureContext;
	}

	function requestLocationPermission() {
		if (!locationRequested && navigator.geolocation) {
			locationRequested = true;
			console.log('Requesting location permission...');
			
			if (!isSecureContext) {
				locationError = 'Geolocation requires a secure context (HTTPS)';
				console.log(locationError);
				return;
			}
			
			// This is what triggers the browser permission dialog
			navigator.geolocation.getCurrentPosition(
				(position) => {
					// Permission granted - log location
					console.log('Location permission granted', {
						latitude: position.coords.latitude,
						longitude: position.coords.longitude
						});
					locationError = '';
				},
				(error) => {
					// Permission denied or error occurred
					locationError = 'Location permission denied or error: ' + error.message;
					console.log(locationError);
				},
				{
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 0
				}
			);
		}
	}

	onMount(() => {
			// Check if we're in a secure context
			isSecureContext = isRunningOnSecureContext();
			console.log('Is secure context:', isSecureContext);
			
			// Request permission after a short delay to ensure the page is fully loaded
			setTimeout(requestLocationPermission, 1000);
	});
</script>

<Map />
<Cta />

<!-- Adding a button as a fallback in case the automatic permission doesn't trigger -->
<div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 text-center">
	{#if locationError}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2">
			{locationError}
			{#if !isSecureContext}
				<p class="text-sm">Please access this page via localhost or HTTPS.</p>
			{/if}
		</div>
	{/if}
</div>
