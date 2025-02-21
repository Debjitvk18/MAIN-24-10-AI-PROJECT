<script>
	import Icon from '@iconify/svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Label } from '$lib/components/ui/label/index.ts';
	import { Switch } from '$lib/components/ui/switch/index.ts';
	import MapFilters from '$lib/components/ui/map/MapFilters.svelte';
	import SaveSearch from '$lib/components/ui/map/SaveSearch.svelte';
	import { isLoggedIn } from '$lib/stores/authStore';
	import { isMobile } from '$lib/utils/generalUtils.js';
	import { dataLoadingState, visibility } from '$lib/stores/mapStore';
	import { SOCIAL_MEDIA_PLATFORMS } from '$lib/constants/constants.js';

	export let isSidebarVisible; // prop
	export let toggleSidebarVisibility;
	export let socialMediaIcons = {};
	export let toggleVisibility;
	export let showSidebar = false;


	$: {
		if(isMobile() && Object.keys(socialMediaIcons).length > 0) {
			setTimeout(() => {
				isSidebarVisible = false;
				toggleSidebarVisibility();
			}, 4000);
		}
	}

	// Reactive settings visibility for mobile
	let showSettings = false;

	function toggleSettings() {
		showSettings = !showSettings;
	}
</script>

<div class="border-y border-gray-300 bg-white">
	<div class="flex flex-wrap items-center justify-between px-2 py-3 shadow-md space-x-4">
		
		<!-- Wrapper for Social Media Tabs + Fixed Cog Icon -->
		<div class="flex items-center w-full md:w-auto">
			
			<!-- Scrollable Social Media Tabs (Mobile) -->
			<div class="flex space-x-4 md:space-x-6 overflow-x-auto md:overflow-visible scrollbar-hide w-full">
				{#if showSidebar}
					{#each SOCIAL_MEDIA_PLATFORMS as platform, i}
						<div
							class="flex flex-col items-center space-y-1 {($visibility[platform.slug] && $dataLoadingState[platform.slug] !== 'loading') ? 'text-gray-500 hover:text-black' : 'text-gray-300'} cursor-pointer">
							<Tooltip.Root>
									<Tooltip.Trigger>
										<button on:click={() => toggleVisibility(platform.slug)} class="flex flex-col items-center">
											{#if $dataLoadingState && $dataLoadingState[platform.slug] === 'loading'}
											<Icon class="w-7 h-7 md:w-6 md:h-6" icon="line-md:loading-twotone-loop" />
											{:else if $dataLoadingState && $dataLoadingState[platform.slug] === 'error'}
												<Icon class="w-7 h-7 md:w-6 md:h-6" icon="mdi:clock-warning" />
											{:else if $dataLoadingState && $dataLoadingState[platform.slug] === "done"}
												<Icon class="w-7 h-7 md:w-6 md:h-6" icon={platform.tabIcon} />
											{:else }
												<Icon class="w-7 h-7 md:w-6 md:h-6" icon={platform.tabIcon} />
											{/if}
											<span class="text-xs md:text-sm">{platform.name}</span>
										</button>
									</Tooltip.Trigger>
								</Tooltip.Root>
						</div>
					{/each}
				{/if}
			</div>
			
			<!-- Cog Icon (Only for Mobile & Tablet) -->
			<button 
				on:click={toggleSettings}
				class="ml-4 md:ml-6 lg:hidden flex-shrink-0 text-gray-600 hover:text-black transition-all"
			>
				<Icon class="w-7 h-7" icon="mdi:cog-outline" />
			</button>
		</div>

		<!-- Sidebar, Filters & Save Search (Always Inline) -->
		<div 
			class="transition-all duration-300 ease-in-out transform w-full md:w-auto flex flex-wrap items-center space-x-4
			{showSettings ? 'opacity-100 scale-100 h-auto flex mt-2' : 'opacity-0 scale-95 h-0 overflow-hidden'}
			lg:opacity-100 lg:scale-100 lg:h-auto lg:overflow-visible">

			<!-- Sidebar Visibility Toggle -->
			{#if Object.keys(socialMediaIcons).length > 0}
				<div class="flex items-center space-x-2">
					<Switch
						bind:checked={isSidebarVisible}
						class="cursor-pointer"
						id="sidebar-visibility"
						on:click={() => toggleSidebarVisibility()}
					/>
					<Label class="cursor-pointer text-sm md:text-base" for="sidebar-visibility">Sidebar</Label>
				</div>
			{/if}

			<!-- Filters -->
			<MapFilters />

			<!-- Save Search (Only for Logged-in Users) -->
			{#if $isLoggedIn}
				<SaveSearch />
			{/if}
		</div>

	</div>
</div>

<style>
	/* Hide scrollbar for cleaner UI */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
