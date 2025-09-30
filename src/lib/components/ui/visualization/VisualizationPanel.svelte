<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import mapboxgl from 'mapbox-gl';
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';
	import { MAP_DEFAULT_LOCATION } from '$lib/constants/constants';

	export let hasData = false;
	export let selectedStep = '';
	export let lastUserQuery = '';

	let mapContainer: HTMLDivElement;
	let map: mapboxgl.Map | null = null;

	// Chart type detection from user query
	function detectChartType(query: string): 'table' | 'bar' | 'pie' | 'line' | 'map' {
		const lowerQuery = query.toLowerCase();
		
		if (lowerQuery.includes('table') || lowerQuery.includes('data') || lowerQuery.includes('list')) {
			return 'table';
		}
		if (lowerQuery.includes('map') || lowerQuery.includes('location') || lowerQuery.includes('geographic') || lowerQuery.includes('global') || lowerQuery.includes('region')) {
			return 'map';
		}
		if (lowerQuery.includes('pie') || lowerQuery.includes('round') || lowerQuery.includes('circle') || lowerQuery.includes('donut')) {
			return 'pie';
		}
		if (lowerQuery.includes('line') || lowerQuery.includes('trend') || lowerQuery.includes('over time')) {
			return 'line';
		}
		// Default to bar chart
		return 'bar';
	}

	// Instagram-specific mock data generators
	function generateInstagramPostsData() {
		const postTypes = ['Photo', 'Video', 'Carousel', 'Reel', 'Story'];
		const timeSlots = ['Morning', 'Afternoon', 'Evening', 'Night'];
		
		return Array.from({ length: 12 }, (_, i) => ({
			id: i + 1,
			postType: postTypes[Math.floor(Math.random() * postTypes.length)],
			timeSlot: timeSlots[Math.floor(Math.random() * timeSlots.length)],
			likes: Math.floor(Math.random() * 5000) + 500,
			comments: Math.floor(Math.random() * 200) + 10,
			shares: Math.floor(Math.random() * 100) + 5,
			reach: Math.floor(Math.random() * 10000) + 1000,
			engagement: (Math.random() * 10).toFixed(2),
			date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString()
		}));
	}

	function generateInstagramLikesData() {
		const demographics = ['18-24', '25-34', '35-44', '45-54', '55+'];
		const locations = ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'France'];
		
		return Array.from({ length: 15 }, (_, i) => ({
			id: i + 1,
			demographic: demographics[Math.floor(Math.random() * demographics.length)],
			location: locations[Math.floor(Math.random() * locations.length)],
			totalLikes: Math.floor(Math.random() * 2000) + 100,
			avgLikesPerPost: Math.floor(Math.random() * 500) + 50,
			peakHour: Math.floor(Math.random() * 24),
			weekDay: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][Math.floor(Math.random() * 7)],
			growthRate: (Math.random() * 20 - 10).toFixed(1),
			date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString()
		}));
	}

	function generateInstagramCommentsData() {
		const sentiments = ['Positive', 'Neutral', 'Negative'];
		const languages = ['English', 'Spanish', 'French', 'German', 'Italian'];
		
		return Array.from({ length: 10 }, (_, i) => ({
			id: i + 1,
			sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
			language: languages[Math.floor(Math.random() * languages.length)],
			commentCount: Math.floor(Math.random() * 100) + 5,
			avgWordsPerComment: Math.floor(Math.random() * 20) + 5,
			responseRate: (Math.random() * 100).toFixed(1),
			topKeywords: ['amazing', 'love', 'great', 'awesome', 'beautiful'][Math.floor(Math.random() * 5)],
			engagement: (Math.random() * 5).toFixed(2),
			date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString()
		}));
	}

	function generateChartData(step: string) {
		switch (step) {
			case 'posts':
				return {
					labels: ['Photo', 'Video', 'Carousel', 'Reel', 'Story'],
					datasets: [{
						label: 'Posts Count',
						data: [25, 19, 15, 20, 12],
						backgroundColor: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6']
					}]
				};
			case 'likes':
				return {
					labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
					datasets: [{
						label: 'Daily Likes',
						data: [1200, 1900, 800, 1500, 2000, 2400, 1800],
						backgroundColor: ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#06B6D4', '#3B82F6']
					}]
				};
			case 'comments':
				return {
					labels: ['Positive', 'Neutral', 'Negative'],
					datasets: [{
						label: 'Comment Sentiment',
						data: [65, 25, 10],
						backgroundColor: ['#22C55E', '#6B7280', '#EF4444']
					}]
				};
			default:
				return null;
		}
	}

	// Generate data based on selected step
	function getStepData() {
		switch (selectedStep) {
			case 'posts':
				return generateInstagramPostsData();
			case 'likes':
				return generateInstagramLikesData();
			case 'comments':
				return generateInstagramCommentsData();
			default:
				return [];
		}
	}

	function getStepTableHeaders() {
		switch (selectedStep) {
			case 'posts':
				return ['ID', 'Post Type', 'Time Slot', 'Likes', 'Comments', 'Shares', 'Reach', 'Engagement %', 'Date'];
			case 'likes':
				return ['ID', 'Demographic', 'Location', 'Total Likes', 'Avg/Post', 'Peak Hour', 'Week Day', 'Growth %', 'Date'];
			case 'comments':
				return ['ID', 'Sentiment', 'Language', 'Count', 'Avg Words', 'Response %', 'Top Keywords', 'Engagement', 'Date'];
			default:
				return [];
		}
	}

	$: tableData = hasData && selectedStep ? getStepData() : [];
	$: chartData = hasData && selectedStep ? generateChartData(selectedStep) : null;
	$: detectedChartType = lastUserQuery ? detectChartType(lastUserQuery) : 'bar';
	$: tableHeaders = getStepTableHeaders();

	// Initialize map when conditions are met
	$: if (mapContainer && !map && hasData && detectedChartType === 'map') {
		console.log('Conditions met for map initialization:', { mapContainer: !!mapContainer, map: !!map, hasData, detectedChartType });
		setTimeout(() => {
			if (mapContainer && !map) {
				console.log('Timeout: Initializing map');
				initializeMap();
			}
		}, 500);
	}

	// Watch for step changes to reinitialize map with new data
	$: if (map && selectedStep) {
		// Clear existing markers and add new ones
		setTimeout(() => {
			const markers = document.querySelectorAll('.mapboxgl-marker');
			markers.forEach(marker => marker.remove());
			addRandomPinsToMap();
		}, 100);
	}

	// Alternative trigger - watch for tab changes
	let currentTabValue = detectedChartType === 'table' ? 'table' : detectedChartType === 'map' ? 'map' : 'chart';
	$: {
		const newTabValue = detectedChartType === 'table' ? 'table' : detectedChartType === 'map' ? 'map' : 'chart';
		if (newTabValue !== currentTabValue) {
			currentTabValue = newTabValue;
			if (newTabValue === 'map' && mapContainer && !map && hasData) {
				console.log('Tab changed to map, initializing...');
				setTimeout(initializeMap, 500);
			}
		}
	}

	// Map functionality
	function generateRandomPins() {
		const pins = [];
		const baseLocations = [
			{ lat: 40.7128, lng: -74.0060, city: 'New York' },
			{ lat: 34.0522, lng: -118.2437, city: 'Los Angeles' },
			{ lat: 51.5074, lng: -0.1278, city: 'London' },
			{ lat: 48.8566, lng: 2.3522, city: 'Paris' },
			{ lat: 35.6762, lng: 139.6503, city: 'Tokyo' },
			{ lat: -33.8688, lng: 151.2093, city: 'Sydney' },
			{ lat: 52.5200, lng: 13.4050, city: 'Berlin' },
			{ lat: 55.7558, lng: 37.6173, city: 'Moscow' },
			{ lat: 19.4326, lng: -99.1332, city: 'Mexico City' },
			{ lat: -23.5505, lng: -46.6333, city: 'São Paulo' }
		];

		for (let i = 0; i < 15; i++) {
			const baseLocation = baseLocations[Math.floor(Math.random() * baseLocations.length)];
			const randomOffset = {
				lat: (Math.random() - 0.5) * 0.1, // Random offset within ~5km
				lng: (Math.random() - 0.5) * 0.1
			};

			pins.push({
				id: i + 1,
				lat: baseLocation.lat + randomOffset.lat,
				lng: baseLocation.lng + randomOffset.lng,
				city: baseLocation.city,
				likes: Math.floor(Math.random() * 1000) + 100,
				comments: Math.floor(Math.random() * 100) + 10,
				engagement: (Math.random() * 10).toFixed(1),
				type: selectedStep || 'posts'
			});
		}

		return pins;
	}

	function initializeMap() {
		if (!mapContainer || map) return;

		try {
			console.log('Initializing map with token:', PUBLIC_MAPBOX_ACCESS_TOKEN ? 'Token available' : 'No token');
			
			if (!PUBLIC_MAPBOX_ACCESS_TOKEN) {
				console.error('Mapbox access token is not available');
				return;
			}

			mapboxgl.accessToken = PUBLIC_MAPBOX_ACCESS_TOKEN;

			map = new mapboxgl.Map({
				container: mapContainer,
				style: 'mapbox://styles/mapbox/streets-v12',
				center: [MAP_DEFAULT_LOCATION.lng, MAP_DEFAULT_LOCATION.lat],
				zoom: 2,
				attributionControl: false
			});

			map.on('load', () => {
				console.log('Map loaded successfully');
				addRandomPinsToMap();
			});

			map.on('error', (e) => {
				console.error('Map error:', e);
			});

			// Force trigger load event after timeout if it doesn't fire
			setTimeout(() => {
				if (map && map.loaded()) {
					console.log('Map was already loaded, adding pins');
					addRandomPinsToMap();
				}
			}, 2000);

		} catch (error) {
			console.error('Failed to initialize map:', error);
		}
	}

	function addRandomPinsToMap() {
		if (!map) return;

		const pins = generateRandomPins();

		pins.forEach(pin => {
			// Create a popup
			const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
				<div class="p-2">
					<h3 class="font-semibold text-sm">${pin.city}</h3>
					<p class="text-xs text-muted-foreground">Instagram ${selectedStep}</p>
					<div class="mt-2 space-y-1">
						<div class="flex justify-between text-xs">
							<span>Likes:</span>
							<span class="font-medium">${pin.likes}</span>
						</div>
						<div class="flex justify-between text-xs">
							<span>Comments:</span>
							<span class="font-medium">${pin.comments}</span>
						</div>
						<div class="flex justify-between text-xs">
							<span>Engagement:</span>
							<span class="font-medium">${pin.engagement}%</span>
						</div>
					</div>
				</div>
			`);

			// Create marker
			const marker = new mapboxgl.Marker({
				color: selectedStep === 'posts' ? '#8B5CF6' : selectedStep === 'likes' ? '#EF4444' : '#3B82F6'
			})
				.setLngLat([pin.lng, pin.lat])
				.setPopup(popup)
				.addTo(map);
		});
	}

	function destroyMap() {
		if (map) {
			map.remove();
			map = null;
		}
	}

	onDestroy(() => {
		destroyMap();
	});

	// Auto-initialize map when container is available
	onMount(() => {
		if (detectedChartType === 'map' && hasData) {
			setTimeout(() => {
				if (mapContainer && !map) {
					console.log('OnMount: Initializing map');
					initializeMap();
				}
			}, 200);
		}
	});

	// Svelte action to auto-initialize map when element is visible
	function autoInitMap(node: HTMLElement) {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting && !map && hasData) {
					console.log('Map container is visible, initializing...');
					setTimeout(initializeMap, 100);
				}
			});
		}, { threshold: 0.1 });

		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	function exportData(format: 'csv' | 'json') {
		if (!hasData || !tableData.length) return;
		
		if (format === 'csv') {
			const headers = tableHeaders.join(',');
			const rows = tableData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
			const csv = [headers, ...rows].join('\n');
			
			const blob = new Blob([csv], { type: 'text/csv' });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `instagram-${selectedStep}-data.csv`;
			link.click();
			window.URL.revokeObjectURL(url);
		} else {
			const json = JSON.stringify(tableData, null, 2);
			const blob = new Blob([json], { type: 'application/json' });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `instagram-${selectedStep}-data.json`;
			link.click();
			window.URL.revokeObjectURL(url);
		}
	}
</script>

<Card class="h-full">
	<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
		<CardTitle class="text-lg font-semibold">Data Visualization</CardTitle>
		{#if hasData}
			<div class="flex gap-2">
				<Button variant="outline" size="sm" on:click={() => exportData('csv')}>
					<Icon icon="lucide:download" class="w-4 h-4 mr-2" />
					CSV
				</Button>
				<Button variant="outline" size="sm" on:click={() => exportData('json')}>
					<Icon icon="lucide:download" class="w-4 h-4 mr-2" />
					JSON
				</Button>
			</div>
		{/if}
	</CardHeader>
	
	<CardContent class="flex-1">
		{#if !hasData || !selectedStep}
			<div class="flex flex-col items-center justify-center h-[400px] text-center">
				<Icon icon="lucide:bar-chart-3" class="w-16 h-16 text-muted-foreground mb-4" />
				<h3 class="text-lg font-medium text-muted-foreground mb-2">Select a Data Category</h3>
				<p class="text-sm text-muted-foreground max-w-md">
					Choose an Instagram data category from the sidebar, then ask questions like:
					<br><strong>"Show me a table"</strong>, <strong>"Create a bar chart"</strong>, or <strong>"Make a pie chart"</strong>
				</p>
			</div>
		{:else}
			<Tabs value={detectedChartType === 'table' ? 'table' : detectedChartType === 'map' ? 'map' : 'chart'} class="w-full h-full">
				<TabsList class="grid w-full grid-cols-3 mb-4">
					<TabsTrigger value="table" class="flex items-center gap-2">
						<Icon icon="lucide:table" class="w-4 h-4" />
						Table View
					</TabsTrigger>
					<TabsTrigger value="chart" class="flex items-center gap-2">
						<Icon icon="lucide:bar-chart" class="w-4 h-4" />
						{detectedChartType === 'pie' ? 'Pie Chart' : detectedChartType === 'line' ? 'Line Chart' : 'Bar Chart'}
					</TabsTrigger>
					<TabsTrigger value="map" class="flex items-center gap-2">
						<Icon icon="lucide:map" class="w-4 h-4" />
						Map View
					</TabsTrigger>
				</TabsList>

				<TabsContent value="table" class="h-[400px] overflow-hidden">
					<div class="border rounded-lg overflow-hidden">
						<div class="overflow-x-auto overflow-y-auto h-full">
							<table class="w-full text-sm">
								<thead class="bg-muted sticky top-0">
									<tr>
										{#each tableHeaders as header}
											<th class="text-left p-3 font-medium">{header}</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each tableData as row}
										<tr class="border-t hover:bg-muted/50">
											{#each Object.values(row) as value, index}
												<td class="p-3">
													{#if index === 1 && selectedStep === 'posts'}
														<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
															{value}
														</span>
													{:else if index === 1 && selectedStep === 'comments'}
														<span class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
															${value === 'Positive' ? 'bg-green-100 text-green-800' : 
															  value === 'Negative' ? 'bg-red-100 text-red-800' : 
															  'bg-gray-100 text-gray-800'}`}>
															{value}
														</span>
													{:else if typeof value === 'number' && value > 100}
														<span class="font-mono">{value.toLocaleString()}</span>
													{:else}
														{value}
													{/if}
												</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="chart" class="h-[400px]">
					<div class="h-full border rounded-lg p-6 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
						{#if chartData}
							<div class="h-full flex flex-col">
								<h3 class="text-lg font-semibold mb-4 text-center capitalize">
									Instagram {selectedStep} {detectedChartType === 'pie' ? 'Distribution' : 'Analysis'}
								</h3>
								
								{#if detectedChartType === 'pie'}
									<!-- Pie Chart -->
									<div class="flex-1 flex items-center justify-center">
										<div class="relative w-64 h-64">
											<svg viewBox="0 0 200 200" class="w-full h-full">
												{#each chartData.datasets[0].data as value, i}
													{#if value !== undefined}
														{@const total = chartData.datasets[0].data.reduce((a, b) => a + b, 0)}
														{@const percentage = (value / total) * 100}
														{@const angle = (value / total) * 360}
														{@const prevAngles = chartData.datasets[0].data.slice(0, i).reduce((sum, val) => sum + (val / total) * 360, 0)}
														{@const startAngle = prevAngles - 90}
														{@const endAngle = startAngle + angle}
														{@const largeArcFlag = angle > 180 ? 1 : 0}
														{@const x1 = 100 + 80 * Math.cos(startAngle * Math.PI / 180)}
														{@const y1 = 100 + 80 * Math.sin(startAngle * Math.PI / 180)}
														{@const x2 = 100 + 80 * Math.cos(endAngle * Math.PI / 180)}
														{@const y2 = 100 + 80 * Math.sin(endAngle * Math.PI / 180)}
													
														<path 
															d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
															fill={chartData.datasets[0].backgroundColor[i]}
															class="hover:opacity-80 transition-opacity"
														/>
													{/if}
												{/each}
											</svg>
										</div>
									</div>
								{:else if detectedChartType === 'line'}
									<!-- Line Chart -->
									<div class="flex-1 flex items-center justify-center">
										<div class="w-full max-w-2xl">
											<svg viewBox="0 0 400 200" class="w-full h-48 border-b border-l border-muted">
												<!-- Grid lines -->
												{#each Array(5) as _, i}
													<line x1="0" y1={40 * i} x2="400" y2={40 * i} stroke="currentColor" stroke-opacity="0.1" />
												{/each}
												
												<!-- Line path -->
												{#if chartData && chartData.datasets && chartData.datasets[0]}
													{#if chartData.datasets[0].data}
														{@const points = chartData.datasets[0].data.map((value, i) => 
															`${(i / (chartData.datasets[0].data.length - 1)) * 380 + 10},${180 - (value / Math.max(...chartData.datasets[0].data)) * 160}`
														).join(' ')}
													
														<polyline 
															points={points}
															fill="none" 
															stroke="hsl(var(--primary))" 
															stroke-width="3"
															stroke-linecap="round"
															stroke-linejoin="round"
														/>
													{/if}
													
													<!-- Data points -->
													{#each chartData.datasets[0].data as value, i}
														{#if value !== undefined}
															{@const x = (i / (chartData.datasets[0].data.length - 1)) * 380 + 10}
															{@const y = 180 - (value / Math.max(...chartData.datasets[0].data)) * 160}
															<circle cx={x} cy={y} r="4" fill="hsl(var(--primary))" />
														{/if}
													{/each}
												{/if}
											</svg>											<!-- X-axis labels -->
											<div class="flex justify-around mt-2">
												{#each chartData.labels as label}
													<span class="text-xs text-muted-foreground">{label}</span>
												{/each}
											</div>
										</div>
									</div>
								{:else}
									<!-- Bar Chart -->
									<div class="flex-1 flex items-center justify-center">
										<div class="w-full max-w-2xl">
											<div class="flex items-end justify-around h-48 border-b border-l border-muted">
												{#each chartData.datasets[0].data as value, i}
													<div class="flex flex-col items-center gap-2">
														<div 
															class="rounded-t-sm transition-all duration-1000 ease-out"
															style={`
																height: ${(value / Math.max(...chartData.datasets[0].data)) * 160}px; 
																width: 32px;
																background-color: ${chartData.datasets[0].backgroundColor ? chartData.datasets[0].backgroundColor[i] : 'hsl(var(--primary))'}
															`}
														></div>
														<span class="text-xs text-muted-foreground">{chartData.labels[i]}</span>
													</div>
												{/each}
											</div>
										</div>
									</div>
								{/if}

								<!-- Legend -->
								{#if detectedChartType === 'pie'}
									<div class="grid grid-cols-2 gap-2 mt-4">
										{#each chartData.labels as label, i}
											<div class="flex items-center gap-2 text-sm">
												<div 
													class="w-4 h-4 rounded" 
													style={`background-color: ${chartData.datasets[0].backgroundColor[i]}`}
												></div>
												<span class="text-muted-foreground">{label}</span>
											</div>
										{/each}
									</div>
								{/if}

								<!-- Stats -->
								<div class="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
									<div class="text-center">
										<div class="text-xl font-bold text-primary">
											{Math.max(...chartData.datasets[0].data)}
										</div>
										<div class="text-xs text-muted-foreground">Max Value</div>
									</div>
									<div class="text-center">
										<div class="text-xl font-bold text-primary">
											{Math.round(chartData.datasets[0].data.reduce((a, b) => a + b, 0) / chartData.datasets[0].data.length)}
										</div>
										<div class="text-xs text-muted-foreground">Average</div>
									</div>
									<div class="text-center">
										<div class="text-xl font-bold text-primary">
											{chartData.datasets[0].data.length}
										</div>
										<div class="text-xs text-muted-foreground">Data Points</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</TabsContent>

				<TabsContent value="map" class="h-[400px]">
					<div class="h-full border rounded-lg overflow-hidden relative">
						<div bind:this={mapContainer} class="w-full h-full" use:autoInitMap>
							{#if mapContainer && !map}
								<div class="flex items-center justify-center h-full bg-muted/10">
									<div class="text-center">
										<Icon icon="lucide:map" class="w-12 h-12 mx-auto mb-2 opacity-50" />
										<p class="text-muted-foreground">Loading map...</p>
										<button 
											class="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded text-xs"
											on:click={initializeMap}
										>
											Initialize Map
										</button>
									</div>
								</div>
							{/if}
						</div>
						
						<!-- Map overlay with stats -->
						<div class="absolute top-4 right-4 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
							<h4 class="font-semibold text-sm mb-2">Map Overview</h4>
							<div class="space-y-1 text-xs">
								<div class="flex justify-between gap-4">
									<span class="text-muted-foreground">Data Points:</span>
									<span class="font-medium">15 locations</span>
								</div>
								<div class="flex justify-between gap-4">
									<span class="text-muted-foreground">Data Type:</span>
									<span class="font-medium capitalize">Instagram {selectedStep}</span>
								</div>
								<div class="flex justify-between gap-4">
									<span class="text-muted-foreground">Coverage:</span>
									<span class="font-medium">Global</span>
								</div>
							</div>
						</div>

						<!-- Map controls -->
						<div class="absolute bottom-4 left-4 flex gap-2">
							<Button 
								size="sm" 
								variant="secondary"
								class="bg-background/95 backdrop-blur-sm"
								on:click={() => {
									if (map) {
										destroyMap();
										setTimeout(initializeMap, 100);
									}
								}}
							>
								<Icon icon="lucide:refresh-cw" class="w-4 h-4 mr-1" />
								Refresh
							</Button>
							<Button 
								size="sm" 
								variant="secondary"
								class="bg-background/95 backdrop-blur-sm"
								on:click={() => {
									if (map) {
										map.flyTo({
											center: [MAP_DEFAULT_LOCATION.lng, MAP_DEFAULT_LOCATION.lat],
											zoom: 2,
											duration: 1000
										});
									}
								}}
							>
								<Icon icon="lucide:home" class="w-4 h-4 mr-1" />
								Reset View
							</Button>
						</div>
					</div>
				</TabsContent>
			</Tabs>
		{/if}
	</CardContent>
</Card>

<!-- Map CSS -->
<svelte:head>
	<link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
</svelte:head>