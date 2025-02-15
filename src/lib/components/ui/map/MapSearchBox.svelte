<script>
	import Icon from '@iconify/svelte';
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';
	import { onMount, createEventDispatcher } from 'svelte';

	const accessToken = PUBLIC_MAPBOX_ACCESS_TOKEN;
	const dispatch = createEventDispatcher();

	export let redirectOnSelect = true;
	export let placeholder = 'Search for city or address';
	export let showSearchButton = true;
	export let query = '';

	let suggestions = [];
	let showSuggestions = false;
	let suggestionListRef;

	async function getLocationSuggestions() {
		if (query.length > 2) {
			const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${accessToken}&autocomplete=true&limit=5`;

			try {
				const response = await fetch(url);
				const data = await response.json();
				suggestions = data.features;
				showSuggestions = suggestions.length > 0;
			} catch (error) {
				console.error('Error fetching location data:', error);
			}
		} else {
			suggestions = [];
			showSuggestions = false;
		}
	}

	function handleClickOutside(event) {
		if (
			suggestionListRef &&
			!suggestionListRef.contains(event.target) &&
			!event.target.matches('#location-input')
		) {
			showSuggestions = false;
		}
	}

	// Handle when a suggestion is selected
	function handleSuggestionClick(suggestion) {
		// Redirect if redirectOnSelect is true
		if (redirectOnSelect) {
			window.location.href = `/try-demo?search=${encodeURIComponent(
				suggestion.place_name
			)}&lat=${suggestion.center[1]}&long=${suggestion.center[0]}`;
		} else {
			// Emit the selected value for Sidebar functionality
			query = suggestion.place_name;
			showSuggestions = false;
			dispatch('select', {
				place_name: suggestion.place_name,
				latitude: suggestion.center[1],
				longitude: suggestion.center[0]
			});
		}
	}


	onMount(async () => {
		if (typeof window !== 'undefined') {
			document.addEventListener('click', handleClickOutside);
		}

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

</script>

<form class="max-w-md">
	<label class="mb-2 text-sm font-medium text-gray-900 sr-only" for="default-search">
		Search
	</label>

	<div class="relative w-full">
		<input
			autocomplete="off"
			bind:value={query}
			class="block p-4 pr-14 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-0 placeholder-gray-500"
			id="location-input"
			on:input={getLocationSuggestions}
			placeholder={placeholder}
			required
			type="search"
		/>
		{#if showSearchButton}
			<button
				class="absolute right-0 top-0 bottom-0 p-4 text-sm font-medium text-white bg-[#2C7BE5] rounded-r-lg border-none hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
				disabled
				type="submit"
			>
				<Icon class="w-6 h-6" icon="ic:sharp-search" />

				<span class="sr-only">Search</span>
			</button>
		{/if}
	</div>

	{#if showSuggestions && suggestions.length > 0}
		<ul
			class="bg-white border border-gray-100 w-full z-2"
			bind:this={suggestionListRef}
		>
			{#each suggestions as suggestion (suggestion.id)}
				<li
					class="pl-8 pr-2 py-1 border-gray-100 relative cursor-pointer hover:bg-yellow-50 hover:text-gray-900"
					on:click={() => handleSuggestionClick(suggestion)}
				>
						<Icon icon="si:arrow-right-fill" class="absolute w-6 h-6 left-2 right-2" />
						{suggestion.place_name}
				</li>
			{/each}
		</ul>
	{/if}
</form>