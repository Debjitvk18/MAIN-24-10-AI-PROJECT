<script>
	import BlogCard from '$lib/components/ui/card/BlogCard.svelte';
	import TestimoinalCard from '$lib/components/ui/card/TestimoinalCard.svelte';
	import Faq from '$lib/components/ui/home/Faq.svelte';
	import Pricing from '$lib/components/ui/pricing/Pricing.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import FacebookIcon from '$lib/assets/svg/marker/fb-mark.svg?raw';
	import TwitterIcon from '$lib/assets/svg/marker/x-mark.svg?raw';
	import InstaIcon from '$lib/assets/svg/marker/insta-mark.svg?raw';
	import LinkedinIcon from '$lib/assets/svg/marker/linkedin-mark.svg?raw';
	import GoogleNewsIcon from '$lib/assets/svg/marker/google-news-mark.svg?raw';
	import MapBg from '$lib/assets/svg/map/map-view.svg';
	import Cta from '$lib/components/ui/home/Cta.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import Icon from '@iconify/svelte';
	import { ApiService } from '$lib/services/api-service';
	import { toast } from 'svelte-sonner';
	import MapSearchBox from '$lib/components/ui/map/MapSearchBox.svelte';
	import Fetaures from '$lib/components/ui/home/Fetaures.svelte';
	import Why from '$lib/components/ui/home/Why.svelte';
	import Partners from '$lib/components/ui/home/Partners.svelte';
	import Insight from '$lib/components/ui/home/Insight.svelte';
	import Poi from '$lib/components/ui/home/Poi.svelte';
	import { getUserLocation } from '$lib/utils/locationUtils';
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';
	import BreakingLimit from '$lib/components/ui/home/BreakingLimit.svelte';
	import Hero from '$lib/components/ui/home/Hero.svelte';

	// Function to fetch location suggestions

	let chart;

	let agentQuery = '';
	let agentLat = null;
	let agentLong = null;

	onMount(async () => {
		getUserLocation()
			.then((position) => {
				agentLong = position.coords.longitude;
				agentLat = position.coords.latitude;
				console.log('Longitude:', agentLong);
				console.log('Latitude:', agentLat);
				localStorage.setItem('lat', agentLat);
				localStorage.setItem('lng', agentLong);
			})
			.catch((error) => {
				console.error('Geolocation error:', error.message);
				alert('Unable to retrieve your location: ' + error.message);
			});

		return () => {
			if (chart) chart.destroy();
		};
	});

	let file = null;
	let isDragging = false;

	function handleDrop(event) {
		event.preventDefault();
		isDragging = false;

		const droppedFile = event.dataTransfer.files[0];
		if (droppedFile && (droppedFile.type === 'image/png' || droppedFile.type === 'image/jpeg')) {
			file = droppedFile;
		}
	}

	function handleDragOver(event) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleFileSelect(event) {
		file = event.target.files[0];
	}

	function validateFile(selectedFile) {
		if (!selectedFile) return;

		const allowedTypes = ['image/png', 'image/jpeg'];
		if (allowedTypes.includes(selectedFile.type)) {
			return true;
		} else {
			toast.error('Invalid file type. Please upload a PNG or JPG.');
			return false;
		}
	}

	$: if (file) {
		if (validateFile(file)) {
			uploadFile(file);
		}
	}

	let fileLoader = false;
	async function uploadFile(file) {
		if (!file) return;
		fileLoader = true;
		let apiService = new ApiService();
		let formData = new FormData();
		formData.append('image', file);

		try {
			const res = await apiService.makeApiCall(`map/image-search/`, formData, 'POST', 'formdata');
			if (res.success) {
				let lat = res.search_request.request_params.latitude;
				let long = res.search_request.request_params.longitude;
				let id = res.search_request.id;
				goto(`try-demo?req_id=${id}&lat=${lat}&long=${long}`);
			} else {
				toast.error(res.message);
			}
		} catch (error) {
			toast.error('Upload failed:' + error);
		} finally {
			fileLoader = false;
		}
	}

	function adjustTextareaHeight(event) {
		const textarea = event.target;
		textarea.style.height = 'auto';
		textarea.style.height = textarea.scrollHeight + 'px';
	}

	function handleAgentSearch() {
		agentQuery = document.getElementById('location-input').value;
		if (!agentQuery) {
			toast.error('Please enter a search query');
			return;
		}
		if (!agentLat || !agentLong) {
			agentLat = localStorage.getItem('lat') || null;
			agentLong = localStorage.getItem('lng') || null;
		}

		let place = '';

		fetch(
			`https://api.mapbox.com/geocoding/v5/mapbox.places/${agentLong},${agentLat}.json?access_token=${PUBLIC_MAPBOX_ACCESS_TOKEN}`
		)
			.then((res) => res.json())
			.then((data) => {
				if (data.features && data.features.length > 0) {
					agentLat = data.features[0].center[1];
					agentLong = data.features[0].center[0];

					place = data.features[0].place_name; // Store the place name
					// toast.success(`Location found: ${place}`); // Notify user of the found location
				} else {
					console.log('No location found with the given coordinates');
					// toast.error('No location found');
					return;
				}

				window.location.href = `/try-demo?query=${agentQuery}&lat=${agentLat}&long=${agentLong}&mode=agent&search=${place}`;
			});
	}
</script>

<Hero />

<section class="bg-white bg-gradient-to-b from-blue-50 to-blue-100">
	<div
		class="bg-cover bg-bottom lg:container md:container"
		style="background-image: url('{MapBg}');background-position: 311px 0;"
	>
		<div class="relative bg-gray-200 rounded-lg">
			<!-- Marker 1 -->
			<div
				class="hidden xl:block absolute bottom-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 group poi-1"
			>
				<div
					class="w-10 h-10 cursor-pointer group-hover:animate-bounce transition-all duration-200 ease-in-out"
				>
					<!-- Location 1 Popup -->

					{@html FacebookIcon}

					<div
						class="absolute hidden group-hover:block bg-white shadow-lg rounded-md p-2 text-center text-gray-800 w-40 -top-16 left-1/2 transform -translate-x-1/2"
					>
						<span class="font-semibold">Location 1</span>
						<p class="text-xs">Details about Location 1</p>
					</div>
				</div>
			</div>

			<!-- Marker 2 -->
			<div
				class="hidden xl:block absolute bottom-1/3 left-3/4 transform -translate-x-1/2 -translate-y-1/2 group poi-2"
			>
				<div
					class="w-10 h-10 cursor-pointer group-hover:animate-bounce transition-all duration-200 ease-in-out"
				>
					<!-- Location 2 Popup -->
					{@html TwitterIcon}

					<div
						class="absolute hidden group-hover:block bg-white shadow-lg rounded-md p-2 text-center text-gray-800 w-40 -top-16 left-1/2 transform -translate-x-1/2"
					>
						<span class="font-semibold">Location 2</span>
						<p class="text-xs">Details about Location 2</p>
					</div>
				</div>
			</div>

			<!-- Marker 3 -->
			<div
				class="hidden xl:block cursor-pointer absolute bottom-2/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 group poi-3"
			>
				<div class="w-10 h-10 group-hover:animate-bounce transition-all duration-200 ease-in-out">
					<!-- Location 3 Popup -->
					{@html InstaIcon}
					<div
						class="absolute hidden group-hover:block bg-white shadow-lg rounded-md p-2 text-center text-gray-800 w-40 -top-16 left-1/2 transform -translate-x-1/2"
					>
						<span class="font-semibold">Location 3</span>
						<p class="text-xs">Details about Location 3</p>
					</div>
				</div>
			</div>

			<!-- Marker 4 -->
			<div
				class="hidden xl:block cursor-pointer absolute bottom-2/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 group poi-4"
			>
				<div class="w-10 h-10 group-hover:animate-bounce transition-all duration-200 ease-in-out">
					<!-- Location 7 Popup -->
					{@html LinkedinIcon}
					<div
						class="absolute hidden group-hover:block bg-white shadow-lg rounded-md p-2 text-center text-gray-800 w-40 -top-16 left-1/2 transform -translate-x-1/2"
					>
						<span class="font-semibold">Location 4</span>
						<p class="text-xs">Details about Location 4</p>
					</div>
				</div>
			</div>

			<!-- Marker 5 -->
			<div
				class="hidden xl:block cursor-pointer absolute bottom-2/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 group poi-5"
			>
				<div class="w-10 h-10 group-hover:animate-bounce transition-all duration-200 ease-in-out">
					{@html GoogleNewsIcon}
					<div
						class="absolute hidden group-hover:block bg-white shadow-lg rounded-md p-2 text-center text-gray-800 w-40 -top-16 left-1/2 transform -translate-x-1/2"
					>
						<span class="font-semibold">Location 5</span>
						<p class="text-xs">Details about Location 4</p>
					</div>
				</div>
			</div>
		</div>

		<div
			class="grid max-w-screen-xl text-center xl:text-left md:px-0 px-4 py-8 lg:gap-8 gap-8 xl:gap-0 lg:py-[100px] lg:pt-[60px] lg:pb-[130px] lg:grid-cols-12"
		>
	<div class="col-span-12 lg:col-span-10 text-center xl:text-left flex flex-col justify-center items-center xl:items-start space-y-6">
		<div class="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-900 md:leading-tight">
			CyberGlobes <br>Live Real-Time Geo-Location data
		</div>
		<p class="text-lg md:text-xl text-gray-900 max-w-2xl">
			Cyberglobes bridges the gap in AI-driven search, delivering real-time, location-based data designed for your needs.
			Search on your own or let our intelligent chatbot do the work. Stay ahead with the latest updates—while others rely on outdated information.
		</p>
				<Tabs.Root value="agent">
					<Tabs.List class="mb-5 bg-white rounded-lg md:h-14">
						<Tabs.Trigger
							value="agent"
							class="flex-1 py-2 px-2 sm:px-4 md:px-4 md:mx-1 hover:bg-gray-200 hover:text-black text-black font-semibold rounded-md transition-all duration-300 ease-in-out data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=active]:shadow-md text-xs sm:text-sm md:text-base"
						>
							<span class="block truncate">Search by Agent</span>
						</Tabs.Trigger>

						<Tabs.Trigger
							value="address"
							class="flex-1 py-2 px-2 sm:px-4 md:px-4 md:mx-1 hover:bg-gray-200 hover:text-black text-black font-semibold rounded-md transition-all duration-300 ease-in-out data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=active]:shadow-md text-xs sm:text-sm md:text-base"
						>
							<span class="block truncate">Search by Address</span>
						</Tabs.Trigger>

						<Tabs.Trigger
							value="image"
							class="flex-1 py-2 px-2 sm:px-4 md:px-4 md:mx-1 hover:bg-gray-200 hover:text-black text-black font-semibold rounded-md transition-all duration-300 ease-in-out data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=active]:shadow-md text-xs sm:text-sm md:text-base"
						>
							<span class="block truncate">Search by Image</span>
						</Tabs.Trigger>
					</Tabs.List>

					<Tabs.Content value="agent">
						<form class="max-w-full">
							<label class="mb-2 text-sm font-medium text-gray-900 sr-only" for="default-search">
								Search
							</label>

							<div class="relative w-full">
								<textarea
									autocomplete="off"
									class="block p-4 pr-14 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-0 placeholder-gray-500 resize-none overflow-hidden leading-normal"
									id="location-input"
									required
									placeholder="Please enter your query..."
									rows="1"
									on:input={adjustTextareaHeight}
								></textarea>
								<button
									on:click={handleAgentSearch}
									class="absolute right-0 top-0 p-4 text-sm font-medium text-white bg-[#2C7BE5] rounded-r-lg border-none hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 h-[calc(100%-0px)]"
									type="button"
								>
									<Icon class="w-6 h-6" icon="ic:sharp-search" />
									<span class="sr-only">Search</span>
								</button>
							</div>
						</form>
					</Tabs.Content>
					<Tabs.Content value="address">
						<MapSearchBox />
					</Tabs.Content>
					<Tabs.Content value="image">
						<form class="max-w-full">
							<div
								class="flex items-center justify-center w-full"
								on:drop={handleDrop}
								on:dragover={handleDragOver}
								on:dragleave={handleDragLeave}
							>
								<label
									for="dropzone-file"
									class="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50
									dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600
									transition-all duration-300"
									class:border-blue-500={isDragging}
									class:border-gray-300={!isDragging && !fileLoader}
									class:border-gray-500={fileLoader}
								>
									<div class="flex flex-col items-center justify-center pt-5 pb-6">
										{#if fileLoader}
											<Icon icon="line-md:uploading-loop" class="text-5xl text-primary" />
											<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Uploading...</p>
										{:else}
											<Icon
												icon="icon-park-outline:upload-one"
												class="w-8 h-8 mb-4 text-primary dark:text-gray-400"
											/>
											<p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
												<span class="font-semibold">Click to upload</span> or drag and drop
											</p>
											<p class="text-xs text-gray-500 dark:text-gray-400">PNG, JPG</p>
										{/if}
									</div>
									{#if !fileLoader}
										<input
											id="dropzone-file"
											accept="image/png, image/jpeg"
											type="file"
											class="hidden"
											on:change={handleFileSelect}
										/>
									{/if}
								</label>
							</div>
						</form>
					</Tabs.Content>
				</Tabs.Root>
			</div>
		</div>
	</div>
</section>
<Partners />
<Fetaures />
<BreakingLimit />
<Why />
<Insight />
<Poi />

<Cta />

<style>
	.poi-1 {
		left: 70%;
		top: 50px;
	}

	.poi-2 {
		top: 475px;
		left: 65%;
	}

	.poi-3 {
		top: 200px;
		left: 80%;
	}

	.poi-4 {
		left: 75%;
		top: 368px;
	}
	.poi-5 {
		top: 400px;
		left: 45%;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.group-hover\:animate-bounce:hover {
		animation: bounce 0.6s ease-out;
	}
</style>
