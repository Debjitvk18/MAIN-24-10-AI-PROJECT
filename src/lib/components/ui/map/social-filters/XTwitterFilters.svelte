<script>
	import { Switch } from '$lib/components/ui/switch';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import * as Select from '$lib/components/ui/select';
	import { DateFormatter, getLocalTimeZone, today } from '@internationalized/date';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import { Button } from '$lib/components/ui/button/index.ts';
	import Icon from '@iconify/svelte';
	import { cn } from '$lib/utils';
	import * as Popover from '$lib/components/ui/popover';

	let { xKeywords, xUsernames, xPostTypes } = $props();

	const df = new DateFormatter('en-US', {
		dateStyle: 'medium'
	});

	const todayDate = today(getLocalTimeZone());
	let datePickerValue = $state({
		start: todayDate,
		end: todayDate
	});

	let startValue = $state(undefined);
</script>

<Card.Root class="bg-blue-50 shadow-lg rounded-lg">
	<Card.Header>
		<Card.Title class="text-blue-700">Filters</Card.Title>
		<Card.Description class="text-gray-600">
			Customize your search criteria
			<Separator class="my-2" />
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="space-y-4 mb-4">
			<div class="flex flex-col space-y-1">
				<label for="keyword-input" class="text-sm font-medium leading-none text-blue-700"
					>Keywords or Hashtags</label
				>
				<p class="text-xs text-gray-500">
					Enter keywords, e.g., <code class="text-pink-600">keyword1, keyword2</code>, or hashtags,
					e.g., <code class="text-pink-600">#ElonMusk, #chatGPT</code>, separated by commas.
				</p>
				<Input
					id="keyword-input"
					placeholder="Enter keyword or hashtags"
					class="border-blue-300 focus:border-blue-500"
					bind:value={xKeywords}
				/>
			</div>
			<div class="flex flex-col space-y-1">
				<label for="username-input" class="text-sm font-medium leading-none text-blue-700"
					>Usernames</label
				>
				<p class="text-xs text-gray-500">
					Enter usernames, e.g., <code class="text-pink-600">username1, username2</code>, separated
					by commas.
				</p>
				<Input
					id="username-input"
					placeholder="Enter comma-separated usernames"
					class="border-blue-300 focus:border-blue-500"
					bind:value={xUsernames}
				/>
			</div>
		</div>
		<Separator class="my-2" />
		{#each xPostTypes as filter, index}
			<div class="flex items-center justify-between space-x-4 mb-4">
				<div class="flex flex-col space-y-1">
					<p class="text-sm font-medium leading-none text-blue-700">{filter.label}</p>
					<p class="text-xs text-gray-500">{filter.description}</p>
				</div>
				<Switch class="bg-blue-500" bind:checked={xPostTypes[index].enabled} />
			</div>
		{/each}

		<Separator class="my-4" />
		<div class="flex flex-col space-y-2">
			<label for="date-filter" class="text-sm font-medium leading-none text-blue-700">
				Date Range
			</label>
			<p class="text-xs text-gray-500">Select a predefined date range or specify a custom range.</p>
			<Select.Root>
				<Select.Trigger class="w-full border border-blue-300 focus:border-blue-500 rounded-md p-2">
					<Select.Value placeholder="Select Date Range" />
				</Select.Trigger>
				<Select.Content class="bg-white border border-blue-300 rounded-md shadow-lg mt-1">
					<Select.Item value="1_hour" class="hover:bg-blue-100">1 hour</Select.Item>
					<Select.Item value="12_hours" class="hover:bg-blue-100">12 hours</Select.Item>
					<Select.Item value="24_hours" class="hover:bg-blue-100">24 hours</Select.Item>
					<Select.Item value="72_hours" class="hover:bg-blue-100">72 hours</Select.Item>
					<Select.Item value="1_week" class="hover:bg-blue-100">1 week</Select.Item>
					<Select.Item value="2_weeks" class="hover:bg-blue-100">2 weeks</Select.Item>
					<Select.Item value="1_month" class="hover:bg-blue-100">1 month</Select.Item>
					<Select.Item value="6_months" class="hover:bg-blue-100">6 months</Select.Item>
					<Select.Item value="1_year" class="hover:bg-blue-100">1 year</Select.Item>
					<Select.Item value="custom" class="hover:bg-blue-100">Custom Range</Select.Item>
				</Select.Content>
			</Select.Root>
			<div class="grid gap-2">
				<Popover.Root openFocus>
					<Popover.Trigger asChild let:builder>
						<Button
							builders={[builder]}
							class={cn(
								'justify-start text-left font-normal',
								!datePickerValue && 'text-muted-foreground'
							)}
							variant="outline"
						>
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
		</div>
	</Card.Content>
</Card.Root>
