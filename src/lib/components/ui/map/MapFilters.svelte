<script lang="ts">
	import type { DateRange } from 'bits-ui';
	import { Button } from '$lib/components/ui/button/index.ts';
	import Icon from '@iconify/svelte';
	import { Switch } from '$lib/components/ui/switch';
	import * as Card from '$lib/components/ui/card';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Separator } from '$lib/components/ui/separator';

	import CalendarIcon from 'lucide-svelte/icons/calendar';
	import {
		CalendarDate,
		DateFormatter,
		type DateValue,
		getLocalTimeZone
	} from '@internationalized/date';
	import { cn } from '$lib/utils.ts';
	import { RangeCalendar } from '$lib/components/ui/range-calendar/index.ts';
	import * as Popover from '$lib/components/ui/popover/index.ts';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';

	const df = new DateFormatter('en-US', {
		dateStyle: 'medium'
	});

	let value: DateRange | undefined = {
		start: new CalendarDate(2022, 1, 20),
		end: new CalendarDate(2022, 1, 20).add({ days: 20 })
	};

	let startValue: DateValue | undefined = undefined;

	// Radius and Resolutions
	let radiusValue = $state(1);
	let resolutionValue = $state(1);
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
		<div class="flex-1 overflow-y-auto">
			<!-- Social Media Selector -->
			<Card.Root>
				<Card.Header>
					<Card.Title>Select Data Source</Card.Title>
					<Card.Description>Choose the platforms you want to include in your data view.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						<div class="grid gap-6">
							<!-- Facebook -->
							<div class="flex items-center justify-between space-x-4">
								<div class="flex items-center space-x-4">
									<Icon class="w-6 h-6" icon="lucide:facebook" />
									<div>
										<p class="text-sm font-medium leading-none">Facebook</p>
									</div>
								</div>
								<Switch />
							</div>

							<!-- Twitter -->
							<div class="flex items-center justify-between space-x-4">
								<div class="flex items-center space-x-4">
									<Icon class="w-6 h-6" icon="ri:twitter-x-fill" />
									<div>
										<p class="text-sm font-medium leading-none">X (Twitter)</p>
									</div>
								</div>
								<Switch />
							</div>

							<!-- Panoids -->
							<div class="flex items-center justify-between space-x-4">
								<div class="flex items-center space-x-4">
									<Icon class="w-6 h-6" icon="lucide:map-pinned" />
									<div>
										<p class="text-sm font-medium leading-none">Panoids</p>
									</div>
								</div>
								<Switch />
							</div>

							<!-- Google News -->
							<div class="flex items-center justify-between space-x-4">
								<div class="flex items-center space-x-4">
									<Icon class="w-6 h-6" icon="simple-icons:googlenews" />
									<div>
										<p class="text-sm font-medium leading-none">Google News</p>
									</div>
								</div>
								<Switch />
							</div>

						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<Separator class="my-4" />

			<!-- Radius & Resolutions -->
			<Card.Root>
				<Card.Header>
					<Card.Title>Adjust Radius & Resolution</Card.Title>
					<Card.Description>Expand the search area to view more data points.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="grid gap-4">
						<div class="flex items-center justify-between">
							<Label for="radius">Search Radius</Label>
							<span
								class="text-muted-foreground hover:border-border w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm">
								{radiusValue}
							</span>
						</div>
						<Slider
							aria-label="Radius"
							bind:radiusValue
							class="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
							id="radius"
							max={50}
							min={1}
							step={1}
						/>
					</div>

					<div class="grid gap-2 pt-2">
						<div class="flex items-center justify-between">
							<Label for="resolution">Search Resolution</Label>
							<span
								class="text-muted-foreground hover:border-border w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm">
								{resolutionValue}
							</span>
						</div>
						<Slider
							aria-label="Resolution"
							bind:resolutionValue
							class="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
							id="resolution"
							max={50}
							min={1}
							step={1}
						/>
					</div>
				</Card.Content>
			</Card.Root>

			<Separator class="my-4" />

			<!-- Date Range -->
			<Card.Root>
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
									class={cn("w-[300px] justify-start text-left font-normal", !value && "text-muted-foreground")}
									variant="outline">
									<CalendarIcon class="mr-2 h-4 w-4" />
									{#if value && value.start}
										{#if value.end}
											{df.format(value.start.toDate(getLocalTimeZone()))} - {df.format(
											value.end.toDate(getLocalTimeZone())
										)}
										{:else}
											{df.format(value.start.toDate(getLocalTimeZone()))}
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
									bind:value
									initialFocus
									numberOfMonths={2}
									placeholder={value?.start}
								/>
							</Popover.Content>
						</Popover.Root>
					</div>
				</Card.Content>
			</Card.Root>

			<Separator class="my-4" />
		</div>

		<Sheet.Footer>
			<Button>Apply Filters</Button>
			<Sheet.Close>
				<Button variant="ghost">Close</Button>
			</Sheet.Close>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>