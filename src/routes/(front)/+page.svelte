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

	// Function to fetch location suggestions

	let chart;
	
	let agentQuery = "";
	let agentLat = null;
	let agentLong = null;
	

	onMount(async () => {
		getUserLocation()
            .then(position => {
                agentLong = position.coords.longitude;
                agentLat = position.coords.latitude;
				console.log('Longitude:', agentLong);
				console.log('Latitude:', agentLat);
				localStorage.setItem('lat', agentLat);
				localStorage.setItem('lng', agentLong);
			})
			.catch(error => {
				console.error("Geolocation error:", error.message);
                alert('Unable to retrieve your location: ' + error.message);
			});
		if (typeof window !== 'undefined') {
			const { default: ApexCharts } = await import('apexcharts');

			const options = {
				chart: {
					height: '120px',
					maxWidth: '100%',
					type: 'area',
					fontFamily: 'Inter, sans-serif',
					dropShadow: {
						enabled: false
					},
					toolbar: {
						show: false
					}
				},
				tooltip: {
					enabled: true,
					x: {
						show: false
					}
				},
				fill: {
					type: 'gradient',
					gradient: {
						opacityFrom: 0.55,
						opacityTo: 0,
						shade: '#1C64F2',
						gradientToColors: ['#1C64F2']
					}
				},
				dataLabels: {
					enabled: false
				},
				stroke: {
					width: 6
				},
				grid: {
					show: false,
					strokeDashArray: 4,
					padding: {
						left: 2,
						right: 2,
						top: 0
					}
				},
				series: [
					{
						name: 'New users',
						data: [6500, 6418, 6456, 6526, 6356, 6456],
						color: '#1A56DB'
					}
				],
				xaxis: {
					categories: [
						'01 February',
						'02 February',
						'03 February',
						'04 February',
						'05 February',
						'06 February',
						'07 February'
					],
					labels: {
						show: false
					},
					axisBorder: {
						show: false
					},
					axisTicks: {
						show: false
					}
				},
				yaxis: {
					show: false
				}
			};

			chart = new ApexCharts(document.querySelector('#chart'), options);
			chart.render();
		}

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
		if(!agentQuery) {
			toast.error('Please enter a search query');
			return;
		}
		if (!agentLat || !agentLong) {
			agentLat = localStorage.getItem('lat') || null;
			agentLong = localStorage.getItem('lng') || null;
		}

		let place = "";

		fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${agentLong},${agentLat}.json?access_token=${PUBLIC_MAPBOX_ACCESS_TOKEN}`)
		.then(res => res.json())
		.then(data => {
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

<section class="bg-white bg-gradient-to-b from-blue-50 to-blue-100">
	<div
		class="bg-cover bg-bottom lg:container md:container"
		style="background-image: url('{MapBg}');"
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
			class="grid max-w-screen-xl text-center xl:text-left px-4 py-8 mx-auto lg:gap-8 gap-8 xl:gap-0 lg:py-[100px] lg:pt-[60px] lg:pb-[130px] lg:grid-cols-12"
		>
			<div class="place-self-center lg:col-span-6 h-auto md:h-[350px] lg:h-[350px]">
				<Tabs.Root value="agent">
					<Tabs.List class="mb-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
						<Tabs.Trigger
							value="agent"
							class="px-6  text-white font-semibold rounded-md transition-all duration-300 ease-in-out data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md"
						>
							Search by Agent
						</Tabs.Trigger>

						<Tabs.Trigger
							value="address"
							class="px-6  text-white font-semibold rounded-md transition-all duration-300 ease-in-out data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md"
						>
							Search by Address
						</Tabs.Trigger>

						<Tabs.Trigger
							value="image"
							class="px-6  text-white font-semibold rounded-md transition-all duration-300 ease-in-out data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md"
						>
							Search by Image
						</Tabs.Trigger>
					</Tabs.List>

					<Tabs.Content value="agent">
						<h1
							class="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight text-gray-900 leading-none md:text-5xl xl:text-6xl"
						>
							Live Market Location Intelligence
						</h1>
						<h2
							class="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl text-gray-600"
						>
							Leverage advanced location analytics to gain real-time insights, optimize site
							selection, understand customer behavior, and drive data-driven growth.
						</h2>
						<form class="max-w-full xl:max-w-md">
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
						<h1
							class="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight text-gray-900 leading-none md:text-5xl xl:text-6xl"
						>
							Live Market Location Intelligence
						</h1>
						<h2
							class="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl text-gray-600"
						>
							Leverage advanced location analytics to gain real-time insights, optimize site
							selection, understand customer behavior, and drive data-driven growth.
						</h2>
						<MapSearchBox />
					</Tabs.Content>
					<Tabs.Content value="image">
						<div
							class="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight text-gray-900 leading-none md:text-5xl xl:text-6xl"
						>
							Live Market Location Intelligence
						</div>
						<div
							class="max-w-2xl w-f mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl text-gray-600"
						>
							Leverage advanced location analytics to gain real-time insights, optimize site
							selection, understand customer behavior, and drive data-driven growth.
						</div>
						<form class="max-w-md w-full">
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

			<div
				class="lg:col-span-6 flex items-center lg:place-self-end md:place-self-center justify-center"
			>
				<div class="absolute-x top-16 right-16 bg-white shadow-lg rounded-lg p-6 w-80">
					<h3 class="font-bold text-lg">Lorem</h3>
					<p class="text-sm text-gray-500">Lorem Ipsum, is simply dummy, text of the</p>
					<div class="mt-4">
						<h4 class="text-sm font-semibold">
							Lorem Ipsum <span class="text-gray-500">Jan 2023 to Dec 2023</span>
						</h4>
						<div id="chart" class="h-[135px]"></div>
						<div class="flex justify-between mt-4 text-sm">
							<div>
								<p class="font-bold text-gray-800">1.2M</p>
								<p class="text-gray-500">Twiter</p>
							</div>
							<div>
								<p class="font-bold text-gray-800">299.2K</p>
								<p class="text-gray-500">Panoids</p>
							</div>
							<div>
								<p class="font-bold text-gray-800">42K</p>
								<p class="text-gray-500">Others</p>
							</div>
						</div>
						<button
							on:click={() => goto('try-demo')}
							class="w-full mt-4 bg-[#2C7BE5] text-white font-bold py-2 rounded-lg hover:bg-blue-600"
						>
							Get Started
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
<Partners />
<Fetaures />
<Why />
<Insight />
<Poi />

<Cta />

<style>
	.poi-1 {
		left: 64%;
		top: 218px;
	}

	.poi-2 {
		top: 475px;
		left: 65%;
	}

	.poi-3 {
		left: 54%;
		top: 368px;
	}

	.poi-4 {
		top: 160px;
		left: 55%;
	}
	.poi-5 {
		top: 500px;
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
