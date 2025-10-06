<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import mapboxgl from 'mapbox-gl';
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';
	import { MAP_DEFAULT_LOCATION } from '$lib/constants/constants';
	import { ApiService } from '$lib/services/api-service';
	import { getDataFromURL } from '$lib/utils/generalUtils';

	export let hasData = false;
	export let selectedStep = '';
	export let lastUserQuery = '';
	export let conversationResults: Array<any> = [];
	export let scripterResults: Array<any> = [];

	let mapContainer: HTMLDivElement;
	let map: mapboxgl.Map | null = null;
	
	// API service for scripter endpoints
	let apiService = new ApiService();
	let isLoadingTableData = false;
	let processedTableData: Array<any> = [];
	let processingError: string | null = null;

	// Declare variables before reactive statements
	let tableData: Array<any> = [];
	let tableHeaders: Array<string> = [];
	let tableKeys: Array<string> = [];

	// Chart type detection from user query
	function detectChartType(query: string): 'table' | 'bar' | 'pie' | 'line' | 'map' {
		const lowerQuery = query.toLowerCase();

		return 'table';
		
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
		// Default to table view
		return 'table';
	}

	// Get selected step data from conversation results
	function getSelectedStepData(): any {
		if (!selectedStep || !conversationResults.length) return null;
		
		const stepData = conversationResults.find(result => 
			(result.id || `step-${conversationResults.indexOf(result)}`) === selectedStep
		);
		
		return stepData;
	}

	// Process step data using scripter API for table generation
	async function processStepDataForTable(userQuery: string): Promise<any[]> {
		const stepData = getSelectedStepData();
		if (!stepData) {
			throw new Error('No step data found for selected step');
		}

		const conversationId = getDataFromURL('conversation_id');
		if (!conversationId) {
			throw new Error('No conversation ID found');
		}

		isLoadingTableData = true;
		processingError = null;

		try {
			console.log('Processing step data for table with query:', userQuery);
			console.log('Step data:', stepData);

			// Call scripter execute endpoint
			const executeResponse = await apiService.makeApiCall(
				'scripter/execute',
				{
					message: userQuery,
					result_id: stepData.id.toString(),
					conversation_id: conversationId,
					sync: '0'  // Async processing
				},
				'POST'
			);

			if (!executeResponse.success) {
				throw new Error(executeResponse.message || 'Failed to execute scripter');
			}

			const taskId = executeResponse.task_id;
			if (!taskId) {
				throw new Error('No task ID returned from scripter execute');
			}

			console.log('Scripter task started with ID:', taskId);

			// Poll for status until completion
			return await pollScripterStatus(taskId);

		} catch (error) {
			console.error('Error processing step data:', error);
			processingError = error.message;
			throw error;
		} finally {
			isLoadingTableData = false;
		}
	}

	// Poll scripter status endpoint until completion
	async function pollScripterStatus(taskId: string): Promise<any[]> {
		const maxAttempts = 30; // 5 minutes with 10-second intervals
		let attempts = 0;

		while (attempts < maxAttempts) {
			try {
				console.log(`Polling scripter status (attempt ${attempts + 1}/${maxAttempts})`);
				
				const statusResponse = await apiService.makeApiCall(
					`scripter/status/${taskId}`,
					{},
					'GET'
				);

				if (statusResponse.success) {
					const status = statusResponse.status;
					
					if (status === 'completed') {
						console.log('Scripter processing completed');
						const data = statusResponse.data || statusResponse.result || [];
						
						// Ensure we return an array for table display
						if (Array.isArray(data)) {
							return data;
						} else if (data && typeof data === 'object') {
							return [data];
						} else {
							return [];
						}
					} else if (status === 'failed') {
						throw new Error(statusResponse.error || 'Scripter processing failed');
					} else {
						// Still processing, wait and retry
						console.log(`Status: ${status}, waiting...`);
						await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
						attempts++;
						continue;
					}
				} else {
					throw new Error(statusResponse.message || 'Failed to get scripter status');
				}
			} catch (error) {
				console.error('Error polling scripter status:', error);
				attempts++;
				if (attempts < maxAttempts) {
					await new Promise(resolve => setTimeout(resolve, 10000));
				} else {
					throw error;
				}
			}
		}

		throw new Error('Scripter processing timeout - maximum polling attempts reached');
	}

	// Create table data from step's json_data URL
	async function createTableFromStepData(stepData: any): Promise<any[]> {
		if (!stepData) return [];
		
		try {
			console.log('Creating table from step data:', stepData);
			
			// Check if step has json_data URL
			if (stepData.json_data) {
				console.log('Fetching data from json_data URL:', stepData.json_data);
				isLoadingTableData = true;
				processingError = null;
				
				try {
					const response = await fetch(stepData.json_data);
					if (!response.ok) {
						throw new Error(`Failed to fetch JSON data: ${response.statusText}`);
					}
					
					const jsonData = await response.json();
					console.log('Fetched JSON data:', jsonData);
					
					// Handle different JSON structures
					if (Array.isArray(jsonData)) {
						return jsonData;
					} else if (jsonData && typeof jsonData === 'object') {
						// If it's an object with a data array property
						if (jsonData.data && Array.isArray(jsonData.data)) {
							return jsonData.data;
						}
						// If it's an object with results array property
						else if (jsonData.results && Array.isArray(jsonData.results)) {
							return jsonData.results;
						}
						// If it's a single object, wrap in array
						else {
							const flattened = flattenObject(jsonData);
							return [flattened];
						}
					}
					
					return [];
				} catch (fetchError) {
					console.error('Error fetching JSON data:', fetchError);
					processingError = `Failed to load data: ${fetchError.message}`;
					return [];
				} finally {
					isLoadingTableData = false;
				}
			}
			
			// Fallback to step data if no json_data URL
			if (stepData.data && Array.isArray(stepData.data)) {
				return stepData.data;
			}
			
			if (Array.isArray(stepData)) {
				return stepData;
			}
			
			if (typeof stepData === 'object' && stepData !== null) {
				const flattened = flattenObject(stepData);
				return [flattened];
			}
			
			return [];
		} catch (error) {
			console.error('Error creating table from step data:', error);
			processingError = `Error processing data: ${error.message}`;
			return [];
		}
	}
	
	// Flatten nested objects for table display
	function flattenObject(obj: any, prefix: string = ''): any {
		const flattened: any = {};
		
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				const newKey = prefix ? `${prefix}_${key}` : key;
				const value = obj[key];
				
				if (value && typeof value === 'object' && !Array.isArray(value)) {
					// Recursively flatten nested objects (limit depth to avoid infinite recursion)
					if (prefix.split('_').length < 3) {
						Object.assign(flattened, flattenObject(value, newKey));
					} else {
						flattened[newKey] = JSON.stringify(value);
					}
				} else {
					flattened[newKey] = value;
				}
			}
		}
		
		return flattened;
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

	// Get raw table keys for data mapping
	function getStepTableKeys() {
		console.log('getStepTableKeys called:', {
			scripterResultsLength: scripterResults.length,
			processedTableDataLength: processedTableData.length,
			selectedStep
		});

		// Priority 1: Use scripter results if available
		if (scripterResults && scripterResults.length > 0) {
			const firstRow = scripterResults[0];
			if (firstRow && typeof firstRow === 'object') {
				const keys = Object.keys(firstRow);
				console.log('Using scripter result keys:', keys);
				return keys;
			}
		}

		// Priority 2: Use processed data if available
		if (processedTableData && processedTableData.length > 0) {
			const firstRow = processedTableData[0];
			if (firstRow && typeof firstRow === 'object') {
				const keys = Object.keys(firstRow);
				console.log('Using processed data keys:', keys);
				return keys;
			}
		}

		// Priority 3: Fall back to default keys for mock data
		const mockKeys = (() => {
			switch (selectedStep) {
				case 'posts':
					return ['id', 'postType', 'timeSlot', 'likes', 'comments', 'shares', 'reach', 'engagement', 'date'];
				case 'likes':
					return ['id', 'demographic', 'location', 'totalLikes', 'avgLikesPerPost', 'peakHour', 'weekDay', 'growthRate', 'date'];
				case 'comments':
					return ['id', 'sentiment', 'language', 'commentCount', 'avgWordsPerComment', 'responseRate', 'topKeywords', 'engagement', 'date'];
				default:
					return [];
			}
		})();
		console.log('Using mock data keys:', mockKeys);
		return mockKeys;
	}

	function getStepTableHeaders() {
		console.log('getStepTableHeaders called:', {
			scripterResultsLength: scripterResults.length,
			processedTableDataLength: processedTableData.length,
			selectedStep
		});

		// Priority 1: Use scripter results if available
		if (scripterResults && scripterResults.length > 0) {
			const firstRow = scripterResults[0];
			if (firstRow && typeof firstRow === 'object') {
				const headers = Object.keys(firstRow).map(key => 
					// Convert camelCase/snake_case to Title Case
					key.replace(/([A-Z])/g, ' $1')
					   .replace(/_/g, ' ')
					   .replace(/^\w/, c => c.toUpperCase())
					   .trim()
				);
				console.log('Using scripter result headers:', headers);
				return headers;
			}
		}

		// Priority 2: Use processed data if available
		if (processedTableData && processedTableData.length > 0) {
			const firstRow = processedTableData[0];
			if (firstRow && typeof firstRow === 'object') {
				const headers = Object.keys(firstRow).map(key => 
					// Convert camelCase/snake_case to Title Case
					key.replace(/([A-Z])/g, ' $1')
					   .replace(/_/g, ' ')
					   .replace(/^\w/, c => c.toUpperCase())
					   .trim()
				);
				console.log('Using processed data headers:', headers);
				return headers;
			}
		}

		// Priority 3: Fall back to step-specific headers for mock data
		const mockHeaders = (() => {
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
		})();
		console.log('Using mock data headers:', mockHeaders);
		return mockHeaders;
	}

	// Use scripter results first, then processed data, then mock data
	$: {
		if (scripterResults && scripterResults.length > 0) {
			tableData = [...scripterResults]; // Create a copy to trigger reactivity
			console.log('Using scripter results for table data:', tableData.length, 'rows');
		} else if (processedTableData && processedTableData.length > 0) {
			tableData = [...processedTableData];
			console.log('Using processed table data:', tableData.length, 'rows');
		} else if (hasData && selectedStep) {
			tableData = getStepData();
			console.log('Using mock step data:', tableData.length, 'rows');
		} else {
			tableData = [];
			console.log('No table data available');
		}
	}

	// Auto-generate table data when a step is selected
	$: if (selectedStep && conversationResults.length > 0) {
		const stepData = getSelectedStepData();
		if (stepData && !scripterResults.length) {
			console.log('Auto-generating table data for selected step:', selectedStep);
			// Reset previous state
			processedTableData = [];
			processingError = null;
			// Create new table data asynchronously
			createTableFromStepData(stepData).then(data => {
				processedTableData = data;
				console.log('Table data updated:', data.length, 'rows');
			}).catch(error => {
				console.error('Failed to create table data:', error);
				processingError = error.message;
			});
		}
	}
	$: chartData = (hasData && selectedStep) || scripterResults.length > 0 ? generateChartData(selectedStep) : null;
	$: detectedChartType = lastUserQuery ? detectChartType(lastUserQuery) : 'table';
	
	// Force reactive updates when scripter results change
	$: {
		// Trigger recalculation when scripter results change
		const _ = scripterResults.length;
		tableHeaders = getStepTableHeaders();
		tableKeys = getStepTableKeys();
		console.log('Table structure updated:', { headers: tableHeaders.length, keys: tableKeys.length });
	}

	// Debug reactive statements
	$: console.log('Debug - VisualizationPanel reactive data:', {
		scripterResults: scripterResults.length,
		scripterResultsData: scripterResults,
		processedTableData: processedTableData.length,
		hasData,
		selectedStep,
		tableData: tableData.length,
		tableDataContent: tableData,
		tableHeaders: tableHeaders.length,
		tableHeadersContent: tableHeaders,
		tableKeys: tableKeys.length,
		tableKeysContent: tableKeys,
		firstRow: tableData[0]
	});

	// Additional debug for scripter results specifically
	$: if (scripterResults.length > 0) {
		console.log('Scripter Results Details:', {
			count: scripterResults.length,
			firstItem: scripterResults[0],
			allKeys: scripterResults[0] ? Object.keys(scripterResults[0]) : [],
			dataTypes: scripterResults[0] ? Object.entries(scripterResults[0]).map(([key, value]) => ({key, type: typeof value, sample: value})) : []
		});
	}

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

	function exportStepData(format: 'json') {
		const stepData = getSelectedStepData();
		if (!stepData || !stepData.json_data) return;
		
		// Open JSON file URL in a new tab
		window.open(stepData.json_data, '_blank');
	}
</script>

<Card class="h-full">
	<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
		<CardTitle class="text-lg font-semibold">Data Visualization</CardTitle>
		{#if getSelectedStepData()?.json_data}
			<div class="flex gap-2">
				<Button variant="outline" size="sm" on:click={() => exportStepData('json')}>
					<Icon icon="lucide:download" class="w-4 h-4 mr-2" />
					JSON
				</Button>
			</div>
		{/if}
	</CardHeader>
	
	<CardContent class="flex-1">
		{#if (!hasData || !selectedStep) && scripterResults.length === 0}
			<div class="flex flex-col items-center justify-center h-[400px] text-center">
				<Icon icon="lucide:bar-chart-3" class="w-16 h-16 text-muted-foreground mb-4" />
				<h3 class="text-lg font-medium text-muted-foreground mb-2">Select a Data Category</h3>
				<p class="text-sm text-muted-foreground max-w-md">
					Choose an Instagram data category from the sidebar, then ask questions like:
					<br><strong>"Show me a table"</strong>, <strong>"Create a bar chart"</strong>, or <strong>"Make a pie chart"</strong>
				</p>
			</div>
		{:else}
			<Tabs value={scripterResults.length > 0 ? 'table' : (detectedChartType === 'table' ? 'table' : detectedChartType === 'map' ? 'map' : 'chart')} class="w-full h-full">
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
					<div class="border rounded-lg overflow-hidden h-full flex flex-col">
						<!-- Table Header with Processing Controls -->
						<div class="border-b bg-muted/50 p-3 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<Icon icon="lucide:table" class="w-4 h-4" />
								<span class="font-medium">
									{processedTableData.length > 0 ? 'Processed Data' : 'Step Data'}
								</span>
								{#if processedTableData.length > 0}
									<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
										{processedTableData.length} rows
									</span>
								{/if}
							</div>
							<div class="flex items-center gap-2">
								{#if getSelectedStepData()}
									<Button 
										size="sm" 
										variant="outline"
										on:click={async () => {
											const stepData = getSelectedStepData();
											if (stepData) {
												// Reset state and create new table
												processedTableData = [];
												processingError = null;
												try {
													const data = await createTableFromStepData(stepData);
													processedTableData = data;
												} catch (error) {
													processingError = error.message;
												}
											}
										}}
										disabled={isLoadingTableData}
									>
										{#if isLoadingTableData}
											<Icon icon="lucide:loader-2" class="w-3 h-3 mr-1 animate-spin" />
											Loading...
										{:else}
											<Icon icon="lucide:refresh-cw" class="w-3 h-3 mr-1" />
											Refresh Table Data
										{/if}
									</Button>
								{/if}
								{#if processedTableData.length > 0}
									<Button 
										size="sm" 
										variant="ghost"
										on:click={() => { processedTableData = []; processingError = null; }}
									>
										<Icon icon="lucide:x" class="w-3 h-3 mr-1" />
										Clear
									</Button>
								{/if}
							</div>
						</div>

						<!-- Error Display -->
						{#if processingError}
							<div class="p-4 bg-red-50 border-b">
								<div class="flex items-center gap-2 text-red-800 text-sm">
									<Icon icon="lucide:alert-circle" class="w-4 h-4" />
									<span class="font-medium">Processing Error:</span>
									<span>{processingError}</span>
								</div>
							</div>
						{/if}

						<!-- Loading State -->
						{#if isLoadingTableData}
							<div class="flex-1 flex items-center justify-center">
								<div class="text-center">
									<Icon icon="lucide:loader-2" class="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
									<p class="text-sm text-muted-foreground">Processing step data...</p>
									<p class="text-xs text-muted-foreground mt-1">This may take a few minutes</p>
								</div>
							</div>
						{:else}
							<!-- Table Content -->
							<div class="flex-1 overflow-x-auto overflow-y-auto">
								<table class="w-full text-sm">
									<thead class="bg-muted sticky top-0">
										<tr>
											{#each tableHeaders as header}
												<th class="text-left p-3 font-medium">{header}</th>
											{/each}
										</tr>
									</thead>
									<tbody>
										{#each tableData as row, rowIndex}
											<tr class="border-t hover:bg-muted/50">
												{#each tableKeys as key, keyIndex}
													{@const value = row[key]}
													<td class="p-3">
														{#if key === 'image_url' || key === 'imageUrl'}
															<!-- Image thumbnail -->
															{#if value}
																<div class="flex items-center gap-2">
																	<img 
																		src={value} 
																		alt="Thumbnail" 
																		class="w-12 h-12 object-cover rounded-md border"
																		on:error={(e) => {
																			e.target.style.display = 'none';
																			e.target.nextElementSibling.style.display = 'flex';
																		}}
																	/>
																	<div class="w-12 h-12 bg-muted rounded-md border flex items-center justify-center text-xs text-muted-foreground" style="display: none;">
																		No Img
																	</div>
																	<a href={value} target="_blank" rel="noopener noreferrer" class="text-xs text-blue-600 hover:underline truncate max-w-[100px]">
																		View
																	</a>
																</div>
															{:else}
																<span class="text-muted-foreground text-xs">No Image</span>
															{/if}
														{:else if key.toLowerCase().includes('price') && value}
															<!-- Price formatting -->
															<span class="font-medium text-green-600">{value}</span>
														{:else if key.toLowerCase().includes('location') && value}
															<!-- Location formatting -->
															<span class="inline-flex items-center gap-1 text-sm">
																<Icon icon="lucide:map-pin" class="w-3 h-3 text-blue-500" />
																{value}
															</span>
														{:else if key.toLowerCase().includes('id') && value}
															<!-- ID formatting -->
															<span class="font-mono text-xs bg-muted px-2 py-1 rounded">{value}</span>
														{:else if typeof value === 'number' && value > 100}
															<!-- Large number formatting -->
															<span class="font-mono">{value.toLocaleString()}</span>
														{:else if value && value.toString().startsWith('http')}
															<!-- URL formatting -->
															<a href={value} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline text-sm truncate max-w-[150px] block">
																Link
															</a>
														{:else}
															<!-- Default value display -->
															{value || '-'}
														{/if}
													</td>
												{/each}
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
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