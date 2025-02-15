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
	import { getDataFromURL } from '$lib/utils/generalUtils';
	import { onMount } from 'svelte';

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

	let selectedLocation = null;

	onMount(() => {
		// check if data present in the url
		const selectedLocationFromURL = getDataFromURL('search');
		const selectedLatitudeFromURL = getDataFromURL('lat');
		const selectedLongitudeFromURL = getDataFromURL('long');
		const selectedFeaturesFromURL = getDataFromURL('features[]');
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
	});

	let startValue = $state<DateValue | undefined>(undefined);


	// Initialize MapService
	const mapService = new MapService();

	// filter values
	let enableTwitter = $state(true);
	$effect(() => {
		if (enableTwitter) {
			selectedSource = Array.isArray(selectedSource)
				? [...selectedSource, 'x-twitter'].filter((v, i, a) => a.indexOf(v) === i)
				: ['x-twitter'];
		} else {
			selectedSource = Array.isArray(selectedSource)
				? selectedSource.filter((source) => source !== 'x-twitter')
				: [];
		}
	});

	let enablePanoids = $state(true);
	$effect(() => {
		if (enablePanoids) {
			selectedSource = Array.isArray(selectedSource)
				? [...selectedSource, 'streetview'].filter((v, i, a) => a.indexOf(v) === i)
				: ['streetview'];
		} else {
			selectedSource = Array.isArray(selectedSource)
				? selectedSource.filter((source) => source !== 'streetview')
				: [];
		}
	});

	// apply filters
	let errorMessages = $state<string | null>(null);

	function handleLocationSelect(event) {
		selectedLocation = event.detail;
	}

	async function applyFilters() {
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
			start_date: datePickerValue?.start?.toDate(getLocalTimeZone()).toISOString().split('T')[0] ?? '',
			end_date: datePickerValue?.end?.toDate(getLocalTimeZone()).toISOString().split('T')[0] ?? '',
			features: selectedSource
		};

		try {
			const response = await mapService.getMapResults(payload);
			if (!response.success) {
				errorMessages = response.errors ?? null;
			} else {
				errorMessages = null;
				console.log('Filters applied successfully:', response);
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
			class="py-2.5 px-5 me-2 text-sm text-gray-500 hover:text-black bg-white hover:bg-gray-100 border rounded-lg border-gray-300 hover:border-black inline-flex items-center">
			<Icon class="w-6 h-6 me-2" icon="mage:filter" />
			Filters
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

		<div class="flex-1 overflow-y-auto border-t border-b border-gray-200 py-2">
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
			<Card.Root class="mb-4">
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
										"w-[300px] justify-start text-left font-normal",
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

		</div>

		<Sheet.Footer>
			<Button on:click={applyFilters}>Apply Filters</Button>
			<Sheet.Close>
				<Button variant="ghost">Close</Button>
			</Sheet.Close>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>