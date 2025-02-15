<script>
	import Icon from '@iconify/svelte';
	import { Label } from '$lib/components/ui/label/index.ts';
	import { Switch } from '$lib/components/ui/switch/index.ts';
	import MapFilters from '$lib/components/ui/map/MapFilters.svelte';

	export let isSidebarVisible; // prop
	export let toggleSidebarVisibility;
	export let socialMediaIcons = {};
	export let toggleVisibility;
	export let showSidebar = false;
	export let visibility;
</script>

<div class="border-y border-gray-300 bg-white">
	<div class="flex items-center justify-between space-x-6 px-4 py-3 shadow-md">
		<!-- Left section -->
		<div class="flex space-x-6 items-center">

			{#if (socialMediaIcons && showSidebar) }
				{#each Object.keys(socialMediaIcons) as type}
					{#if type === "twitter"}
						<!-- Twitter -->
						<div
							class="flex flex-col items-center space-y-1 {visibility[type] ? 'text-gray-500 hover:text-black' : 'text-gray-300'} cursor-pointer">
							<button on:click={() => toggleVisibility(type)} class="flex flex-col items-center">
								<Icon class="w-6 h-6" icon="ri:twitter-x-fill" />
								<span class="text-sm">X (Twitter)</span>
							</button>
						</div>
						<!-- Separator Bar -->
						<div class="w-[1px] h-8 bg-gray-300"></div>
					{/if}

					{#if type === "panoids"}
						<!-- Panoids -->
						<div
							class="flex flex-col items-center space-y-1 {visibility[type] ? 'text-gray-500 hover:text-black' : 'text-gray-300'} cursor-pointer">
							<button on:click={() => toggleVisibility(type)} class="flex flex-col items-center">
								<Icon class="w-6 h-6" icon="lucide:map-pinned" />
								<span class="text-sm">Panoids</span>
							</button>
						</div>
					{/if}
				{/each}
			{/if}
		</div>

		<!-- Right section -->
		<div class="flex items-center space-x-4">
			{#if (socialMediaIcons && showSidebar) }
				<!-- Sidebar visibility -->
				<div class="flex items-center space-x-2">
					<Switch
						bind:checked={isSidebarVisible}
						class="cursor-pointer"
						id="sidebar-visibility"
						on:click={() => toggleSidebarVisibility()}
					/>
					<Label class="cursor-pointer" for="sidebar-visibility">Sidebar</Label>
				</div>
			{/if}

			<!-- Filters -->
			<MapFilters />
		</div>
	</div>
</div>