<script>
	import Icon from '@iconify/svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Label } from '$lib/components/ui/label/index.ts';
	import { Switch } from '$lib/components/ui/switch/index.ts';
	import MapFilters from '$lib/components/ui/map/MapFilters.svelte';
	import SaveSearch from '$lib/components/ui/map/SaveSearch.svelte';
	import { isLoggedIn } from '$lib/stores/authStore';
	import { isMobile } from '$lib/utils/generalUtils.js';

	export let isSidebarVisible; // prop
	export let toggleSidebarVisibility;
	export let socialMediaIcons = {};
	export let toggleVisibility;
	export let showSidebar = false;
	export let visibility;

	const SOCIAL_MEDIA_TABS = {
		twitter: { icon: 'ri:twitter-x-fill', label: 'X (Twitter)' },
		panoids: { icon: 'lucide:map-pinned', label: 'Panoids' },
		linkedin: { icon: 'mdi:linkedin', label: 'Linkedin' },
		facebook: { icon: 'lucide:facebook', label: 'Facebook' },
		'facebook-marketplace': { icon: 'lucide:facebook', label: 'Marketplace' }
	};


	$: {
		if(isMobile() && Object.keys(socialMediaIcons).length > 0) {
			setTimeout(() => {
				isSidebarVisible = false;
				toggleSidebarVisibility();
			}, 4000);
		}
	}

		$:	console.log(Object.keys(socialMediaIcons).length, 'here')

	// Reactive settings visibility for mobile
	let showSettings = false;

	function toggleSettings() {
		showSettings = !showSettings;
	}
</script>

<div class="border-y border-gray-300 bg-white">
	<div class="flex items-center justify-between px-2 py-2 shadow-md md:flex-row flex-col md:space-x-6 space-y-0 md:space-y-0">
		
		<!-- Wrapper for Social Media Tabs + Fixed Cog Icon -->
		<div class="flex items-center w-full">
			
			<!-- Scrollable Social Media Tabs (Mobile) -->
			<div class="flex space-x-4 md:space-x-6 overflow-x-auto md:overflow-visible scrollbar-hide w-full">
				{#if socialMediaIcons && showSidebar}
					{#each Object.keys(socialMediaIcons) as type, i}
						{#if SOCIAL_MEDIA_TABS[type]}
							<Tooltip.Root>
								<Tooltip.Trigger>
									<button 
										on:click={() => toggleVisibility(type)}
										class="flex flex-col items-center transition-all ease-in-out duration-200
												{visibility[type] ? 'text-gray-700 hover:text-black' : 'text-gray-400 hover:text-gray-600'}
												p-2 rounded-md focus:outline-none"
									>
										<Icon class="w-7 h-7 md:w-6 md:h-6" icon={SOCIAL_MEDIA_TABS[type].icon} />
										<span class="text-xs md:text-sm">{SOCIAL_MEDIA_TABS[type].label}</span>
									</button>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>Click to toggle visibility</p>
								</Tooltip.Content>
							</Tooltip.Root>
							
							{#if i < Object.keys(socialMediaIcons).length - 1}
								<span class="border border-gray-200"></span>
							{/if}
						{/if}
					{/each}
				{/if}
			</div>
			

			<!-- Cog Icon (Only Visible on Mobile) -->
			<button 
				on:click={toggleSettings}
				class="ml-4 md:hidden flex-shrink-0 text-gray-600 hover:text-black transition-all"
			>
				<Icon class="w-7 h-7" icon="mdi:cog-outline" />
			</button>
		</div>

		<!-- Sidebar Settings (Always visible on desktop, toggled on mobile) -->
		<div 
		class="transition-all duration-300 ease-in-out transform
			{showSettings ? 'opacity-100 scale-100 h-auto flex pt-2' : 'opacity-0 scale-95 h-0 overflow-hidden'} 
			md:opacity-100 md:scale-100 md:h-auto md:overflow-visible md:flex 
			items-center md:space-x-4 sm:space-x-2 md:w-auto w-full 
			justify-between md:justify-center">
			<!-- Sidebar Visibility Toggle -->
			<div class="flex md:flex-row flex-col items-center space-x-0 md:space-x-2 space-y-1 md:space-y-0">
				<Switch
					bind:checked={isSidebarVisible}
					class="cursor-pointer"
					id="sidebar-visibility"
					on:click={() => toggleSidebarVisibility()}
				/>
				<Label class="cursor-pointer text-sm md:text-base" for="sidebar-visibility">Sidebar</Label>
			</div>
		
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
