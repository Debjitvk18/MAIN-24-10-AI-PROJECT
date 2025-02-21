<script lang="ts">
	import type { DateRange } from 'bits-ui';
	import { Button } from '$lib/components/ui/button/index.ts';
	import Icon from '@iconify/svelte';
	import { Switch } from '$lib/components/ui/switch';
	import * as Card from '$lib/components/ui/card';
	import * as Sheet from '$lib/components/ui/sheet';

	import {
		DateFormatter,
		type DateValue,
		getLocalTimeZone,
		today
	} from '@internationalized/date';
	import { RangeCalendar } from '$lib/components/ui/range-calendar/index.ts';

	import { cn } from '$lib/utils.ts';
	import * as Popover from '$lib/components/ui/popover/index.ts';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { MapService } from '$lib/services/map-service';
	import AlertError from '$lib/components/form/messages/AlertError.svelte';
	import MapSearchBox from '$lib/components/ui/map/MapSearchBox.svelte';
	import { getDataFromURL, removeDataFromURL } from '$lib/utils/generalUtils';
	import { onMount } from 'svelte';
	import { Input } from '$lib/components/ui/input';

	const df = new DateFormatter('en-US', {
		dateStyle: 'medium'
	});

	const todayDate = today(getLocalTimeZone());
	let datePickerValue = $state<DateRange | undefined>({
		start: todayDate,
		end: todayDate
	});

	let selectedSource = [];

	// Radius and Resolution slider
	let radiusValue = $state([1]);
	let resolutionValue = $state([5]);
	let keywordsOrHashtags = $state('');

	let selectedLocation = null;
	let timeFrame =  $state(['today']);

	// Function to initialize values from URL parameters
	function initializeURLData() {
		// check if data present in the url
		const selectedLocationFromURL = getDataFromURL('search');
		const selectedKeywordOrHashtags = getDataFromURL('keywords');
		const selectedLatitudeFromURL = getDataFromURL('lat');
		const selectedLongitudeFromURL = getDataFromURL('long');
		const selectedFeaturesFromURL = getDataFromURL('features[]');
		timeFrame = getDataFromURL('timeframe'); 
		
		if (selectedLocationFromURL && selectedLatitudeFromURL && selectedLongitudeFromURL) {
			selectedLocation = {
				place_name: selectedLocationFromURL,
				latitude: selectedLatitudeFromURL,
				longitude: selectedLongitudeFromURL
			};
		}

		if (selectedFeaturesFromURL) {
			selectedSource = selectedFeaturesFromURL;
		}

		// const rawStartDate = getDataFromURL('start_date');
		// const rawEndDate = getDataFromURL('end_date');
		//
		// const startDate = rawStartDate ? new Date(rawStartDate) : today(getLocalTimeZone());
		// const endDate = rawEndDate ? new Date(rawEndDate) : today(getLocalTimeZone());
		//
		// datePickerValue = {
		// 	start: startDate,
		// 	end: endDate
		// };

		// Radius and resolution value parsing
		const rawRadius = getDataFromURL('radius');
		const rawResolution = getDataFromURL('resolution');
		radiusValue = [parseInt(rawRadius, 10) || 1];
		resolutionValue = [parseInt(rawResolution, 10) || 5];

		if (selectedKeywordOrHashtags && keywordsOrHashtags == '') {
			keywordsOrHashtags = selectedKeywordOrHashtags;
		}
	}

	onMount(() => {
		// Listen for URL changes dynamically
		const observer = new MutationObserver(() => {
			if (getDataFromURL('search')) {
				initializeURLData();
			}
		});
		observer.observe(document.body, { childList: true, subtree: true });
	});

	let startValue = $state<DateValue | undefined>(undefined);

	function toggleSource(enable, source) {
		selectedSource = Array.isArray(selectedSource)
			? enable
				? [...selectedSource, source].filter((v, i, a) => a.indexOf(v) === i)
				: selectedSource.filter((s) => s !== source)
			: enable
				? [source]
				: [];
	}

	// Initialize MapService
	const mapService = new MapService();

	// filter values
	let enableTwitter = $state(true);
	$effect(() => toggleSource(enableTwitter, 'x-twitter'));

	let enablePanoids = $state(true);
	$effect(() => toggleSource(enablePanoids, 'streetview'));

	let enableLinkedin = $state(true);
	$effect(() => toggleSource(enableLinkedin, 'linkedin'));

	let enableFacebook = $state(true);
	$effect(() => toggleSource(enableFacebook, 'facebook'));

	let enableFacebookMarketPlace = $state(true);
	$effect(() => toggleSource(enableFacebookMarketPlace, 'facebook-marketplace'));

	let enableInstagram = $state(true);
	$effect(() => toggleSource(enableInstagram, 'instagram'));

	let enableGoogleNews = $state(true);
	$effect(() => toggleSource(enableGoogleNews, 'google-news'));

	$effect(() => {
		const features = getDataFromURL('features[]');
		if (Array.isArray(features) && features.length > 0) {
			enableTwitter = features.includes('x-twitter');
			enablePanoids = features.includes('streetview');
			enableLinkedin = features.includes('linkedin');
			enableFacebook = features.includes('facebook');
			enableFacebookMarketPlace = features.includes('facebook-marketplace');
			enableInstagram = features.includes('instagram');
			enableGoogleNews = features.includes('google-news');
		}
	});

	// apply filters
	let errorMessages = $state<string | null>(null);

	function handleLocationSelect(event) {
		selectedLocation = event.detail;
	}

	async function applyFilters() {
		// await initializeURLData();
		toggleSource(enableTwitter, 'x-twitter');
		toggleSource(enablePanoids, 'streetview');
		toggleSource(enableLinkedin, 'linkedin');
		toggleSource(enableFacebook, 'facebook');
		toggleSource(enableFacebookMarketPlace, 'facebook-marketplace');
		toggleSource(enableInstagram, 'instagram');
		toggleSource(enableGoogleNews, 'google-news');
		
		removeDataFromURL('request_id');
		removeDataFromURL('req_id');

		if (!selectedLocation) {
			errorMessages = { address: ['Please select a location to continue.'] };
			return;
		}

		// validate, at-least one data source is selected.
		if (!Array.isArray(selectedSource) || selectedSource.length === 0) {
			errorMessages = { features: ['Please select at least one data source to continue.'] };
			return;
		}

		const { place_name, latitude, longitude } = selectedLocation;

		const payload = {
			address: place_name,
			latitude: latitude,
			longitude: longitude,
			radius: radiusValue[0],
			resolution: resolutionValue[0],
			// start_date: datePickerValue?.start?.toDate(getLocalTimeZone()).toISOString().split('T')[0] ?? '',
			// end_date: datePickerValue?.end?.toDate(getLocalTimeZone()).toISOString().split('T')[0] ?? '',
			timeframe: timeFrame,
			features: selectedSource,
			keywords: keywordsOrHashtags
		};

		try {
			const response = await mapService.validateFilters(payload);
			if (!response.success) {
				errorMessages = response.errors ?? null;
			} else {
				errorMessages = null;
				// pass payload in URL
				const url = new URL(window.location.href);
				// payload.request_id = response.search_id;
				Object.entries(payload).forEach(([key, value]) => {
					if (key === 'features') {
						url.searchParams.delete('features[]');
						if (value?.length) {
							value.forEach(v => url.searchParams.append('features[]', v));
						}
					} else {
						if (key === 'longitude') key = 'long';
						if (key === 'latitude') key = 'lat';
						if (key === 'address') key = 'search';

						url.searchParams.set(key, value);
					}
				});
				window.history.replaceState({}, '', url);

				window.location.reload();
			}
		} catch (error) {
			console.error('Error applying filters:', error);
			errorMessages = { general: ['An unexpected error occurred while applying filters.'] };
		}
	}
</script>
<Sheet.Root>
	<Sheet.Trigger>
		<Button
		variant="outline">
			<Icon class="w-6 h-6 md:me-2 sm:me-0" icon="mage:filter" />
			<span class="hidden md:inline">Filters</span> 
		</Button>
	</Sheet.Trigger>
	<Sheet.Content class="flex flex-col h-full" side="right">
		<Sheet.Header class="mb-4">
			<Sheet.Title>Refine Your Search</Sheet.Title>
			<Sheet.Description>
				Adjust the filters below to customize your search results. Click "Apply Filters" once you are finished.
			</Sheet.Description>
		</Sheet.Header>

		<AlertError errors={errorMessages} />

		<div class="flex-1 overflow-y-auto overflow-x-hidden border-t border-b border-gray-200 py-2">
			<!-- Address Search -->
			<Card.Root class="mb-4 mt-2">
				<Card.Header>
					<Card.Title>Search Address</Card.Title>
					<Card.Description>Search by entering some address.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						<MapSearchBox
							on:select={handleLocationSelect}
							query={getDataFromURL('search')}
							redirectOnSelect={false}
							showSearchButton={false}
						/>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Keyword or Hashtag -->
			<Card.Root class="mb-4 mt-2">
				<Card.Header>
					<Card.Title>Keywords or Hashtags</Card.Title>
					<Card.Description>Enter keywords, e.g., <code class="text-pink-600">keyword1, keyword2</code>, or hashtags,
						e.g.,
						<code class="text-pink-600">#ElonMusk, #chatGPT</code>, separated by commas.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						<Input bind:value={keywordsOrHashtags} placeholder="Enter keyword or hashtags" />
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Social Media Selector -->
			<Card.Root class="mb-4 mt-2">
				<Card.Header>
					<Card.Title>Select Data Source</Card.Title>
					<Card.Description>Choose the platforms you want to include in your data view.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						<div class="grid gap-6">
							<!-- Twitter -->
							<div class="flex items-center justify-between space-x-4">
								<div class="flex items-center space-x-4">
									<Icon class="w-6 h-6" icon="ri:twitter-x-fill" />
									<div>
										<p class="text-sm font-medium leading-none">X (Twitter)</p>
									</div>
								</div>
								<Switch bind:enableTwitter checked={enableTwitter} on:click={enableTwitter = !enableTwitter} />
							</div>

							<!-- Linkedin -->
							<div class="flex items-center justify-between space-x-4">
								<div class="flex items-center space-x-4">
									<Icon class="w-6 h-6" icon="mdi:linkedin" />
									<div>
										<p class="text-sm font-medium leading-none">Linkedin</p>
									</div>
								</div>
								<Switch bind:enableLinkedin checked={enableLinkedin} on:click={enableLinkedin = !enableLinkedin} />
							</div>

							<!-- Facebook -->
							<div class="flex items-center justify-between space-x-4">
								<div class="flex items-center space-x-4">
									<Icon class="w-6 h-6" icon="lucide:facebook" />
									<div>
										<p class="text-sm font-medium leading-none">Facebook</p>
									</div>
								</div>
								<Switch bind:enableFacebook checked={enableFacebook} on:click={enableFacebook = !enableFacebook} />
							</div>

							<!-- Facebook Marketplace -->
							<div class="flex items-center justify-between space-x-4">
								<div class="flex items-center space-x-4">
									<Icon class="w-6 h-6" icon="lucide:facebook" />
									<div>
										<p class="text-sm font-medium leading-none">Facebook Marketplace</p>
									</div>
								</div>
								<Switch bind:enableFacebookMarketPlace checked={enableFacebookMarketPlace}
												on:click={enableFacebookMarketPlace = !enableFacebookMarketPlace} />
							</div>

							<!-- Instagram -->
							<div class="flex items-center justify-between space-x-4">
								<div class="flex items-center space-x-4">
									<Icon class="w-6 h-6" icon="lucide:instagram" />
									<div>
										<p class="text-sm font-medium leading-none">Instagram</p>
									</div>
								</div>
								<Switch bind:enableInstagram checked={enableInstagram}
												on:click={enableInstagram = !enableInstagram} />
							</div>


							<!-- Google news -->
							<div class="flex items-center justify-between space-x-4">
								<div class="flex items-center space-x-4">
									<Icon class="w-6 h-6" icon="simple-icons:googlenews" />
									<div>
										<p class="text-sm font-medium leading-none">Google News</p>
									</div>
								</div>
								<Switch bind:enableGoogleNews checked={enableGoogleNews}
												on:click={enableGoogleNews = !enableGoogleNews} />
							</div>


							<!-- Panoids -->
							<div class="flex items-center justify-between space-x-4">
								<div class="flex items-center space-x-4">
									<Icon class="w-6 h-6" icon="lucide:map-pinned" />
									<div>
										<p class="text-sm font-medium leading-none">Panoids</p>
									</div>
								</div>
								<Switch bind:enablePanoids checked={enablePanoids} on:click={enablePanoids = !enablePanoids} />
							</div>

						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Radius & Resolutions -->
			<Card.Root class="mb-4">
				<Card.Header>
					<Card.Title>Adjust Radius & Resolution</Card.Title>
					<Card.Description>Expand the search area to view more data points.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="grid gap-4">
						<div class="flex items-center justify-between">
							<Label for="radius">Search Radius</Label>
							<span
								class="text-muted-foreground hover:border-border w-24 rounded-md border border-transparent px-2 py-0.5 text-right text-sm">
										{radiusValue[0]} KM
							</span>
						</div>
						<Slider
							ariaLabel="Radius"
							bind:value={radiusValue}
							id="radius"
							max={50}
							min={1}
							step={1} />
					</div>

					<div class="grid gap-2 pt-2">
						<div class="flex items-center justify-between">
							<Label for="resolution">Search Resolution</Label>
							<span
								class="text-muted-foreground hover:border-border w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm">
								{resolutionValue[0]}
							</span>
						</div>
						<Slider
							ariaLabel="Resolution"
							bind:value={resolutionValue}
							id="resolution"
							max={100}
							min={5}
							step={5} />
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Date Range -->
			<Card.Root class="mb-4 hidden">
				<Card.Header>
					<Card.Title>Choose Date Range</Card.Title>
					<Card.Description>Select dates to include historical data within your search.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="grid gap-2">
						<Popover.Root openFocus>
							<Popover.Trigger asChild let:builder>
								<Button
									builders={[builder]}
									class={cn(
										"justify-start text-left font-normal",
										!datePickerValue && "text-muted-foreground"
									)}
									variant="outline">
									<Icon class="mr-2 h-4 w-4" icon="lucide:calendar-days" />
									{#if datePickerValue && datePickerValue.start}
										{#if datePickerValue.end}
											{df.format(datePickerValue.start.toDate(getLocalTimeZone()))} - {df.format(
											datePickerValue.end.toDate(getLocalTimeZone())
										)}
										{:else}
											{df.format(datePickerValue.start.toDate(getLocalTimeZone()))}
										{/if}
									{:else if startValue}
										{df.format(startValue.toDate(getLocalTimeZone()))}
									{:else}
										Pick a date
									{/if}
								</Button>
							</Popover.Trigger>
							<Popover.Content align="start" class="w-auto p-0">
								<RangeCalendar
									bind:startValue
									bind:value={datePickerValue}
									initialFocus
									maxValue={todayDate}
									numberOfMonths={2}
									placeholder={datePickerValue?.start}
								/>
							</Popover.Content>
						</Popover.Root>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Timeframe -->
			<Card.Root class="mb-4">
				<Card.Header>
					<Card.Title>Select a time frame</Card.Title>
					<Card.Description>Select time to include historical data within your search.</Card.Description>
				</Card.Header>
				<Card.Content>
					<select id="time-frame" name="time-frame"
						bind:value={timeFrame}
						class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						aria-label="Select a time frame">
						
						<option value="" disabled selected>Choose a time frame</option>
						<option value="today">Today</option>
						<option value="last_week">Last Week</option>
						<option value="last_month">Last Month</option>
					</select>
				</Card.Content>
			</Card.Root>

		</div>

		<Sheet.Footer>
			<Button on:click={applyFilters}>Apply Filters</Button>
			<Sheet.Close>
				<Button variant="ghost">Close</Button>
			</Sheet.Close>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>