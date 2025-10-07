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
	import { base } from '$app/paths';

	export let hasData = false;
	export let selectedStep = '';
	export let lastUserQuery = '';
	export let conversationResults: Array<any> = [];
	export let scripterResults: Array<any> = [];
	export let selectedViewType = 'datatable'; // View type from sidebar: 'datatable' or 'map'

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
		return [];
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

		return [];
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

		return [];
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
	// Map sidebar view types to tab values
	$: currentViewType = selectedViewType === 'map' ? 'map' : selectedViewType === 'chart' ? 'chart' : selectedViewType === 'datatable' ? 'table' : 'table';
	
	// Debug logging for view type
	$: {
		console.log('VisualizationPanel - View type:', {
			selectedViewType,
			currentViewType,
			scripterResultsLength: scripterResults.length
		});
	}
	
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
	$: if (mapContainer && !map && hasData && currentViewType === 'map') {
		console.log('Conditions met for map initialization:', { mapContainer: !!mapContainer, map: !!map, hasData, currentViewType });
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
			addDataPinsToMap();
		}, 100);
	}

	// Watch for scripter results changes to refresh map pins
	$: if (map && scripterResults && scripterResults.length > 0 && currentViewType === 'map') {
		console.log('Scripter results updated, refreshing map pins...');
		setTimeout(() => {
			// Clear existing markers
			const markers = document.querySelectorAll('.mapboxgl-marker');
			markers.forEach(marker => marker.remove());
			// Add new pins from updated scripter results
			addDataPinsToMap();
		}, 200);
	}

	// Alternative trigger - watch for tab changes
	let currentTabValue = currentViewType;
	$: {
		if (currentViewType !== currentTabValue) {
			currentTabValue = currentViewType;
			if (currentViewType === 'map' && mapContainer && !map && hasData) {
				console.log('Tab changed to map, initializing...');
				setTimeout(initializeMap, 500);
			}
		}
	}

	// Map functionality - Process scripter data for map pins
	function processDataForMapPins(): any[] {
		if (!scripterResults || scripterResults.length === 0) {
			console.log('No scripter results available for map pins');
			return [];
		}

		const pins = [];
		console.log('Processing scripter results for map pins:', scripterResults);
		console.log('Sample scripter result item:', scripterResults[0]);

		scripterResults.forEach((item, index) => {
			// Scripter returns data in format: { lat, lng, city, title, caption }
			// But also handle alternative formats from real scripter data
			let lat, lng, city, title, caption;

			// Primary format: direct lat/lng fields
			if (item.lat !== undefined && item.lng !== undefined) {
				lat = parseFloat(item.lat);
				lng = parseFloat(item.lng);
				city = item.city || 'Unknown Location';
				title = item.title || `Data Point ${index + 1}`;
				caption = item.caption || 'Generated from data analysis';
			}
			// Alternative format: location field
			else if (item.location && typeof item.location === 'object') {
				lat = parseFloat(item.location.lat || item.location.latitude);
				lng = parseFloat(item.location.lng || item.location.longitude);
				city = item.location.city || item.city || 'Unknown Location';
				title = item.title || item.name || `Data Point ${index + 1}`;
				caption = item.caption || item.description || 'Generated from data analysis';
			}
			// Alternative format: coordinates array [lng, lat]
			else if (item.coordinates && Array.isArray(item.coordinates) && item.coordinates.length >= 2) {
				lng = parseFloat(item.coordinates[0]);
				lat = parseFloat(item.coordinates[1]);
				city = item.city || item.name || 'Unknown Location';
				title = item.title || item.name || `Data Point ${index + 1}`;
				caption = item.caption || item.description || 'Generated from data analysis';
			}
			// Fallback: try common field names
			else {
				lat = parseFloat(item.latitude || item.lat);
				lng = parseFloat(item.longitude || item.lng || item.lon);
				city = item.city || item.location || item.place || 'Unknown Location';
				title = item.title || item.name || item.label || `Data Point ${index + 1}`;
				caption = item.caption || item.description || item.text || 'Generated from data analysis';
			}

			console.log(`Item ${index} coordinates:`, { lat, lng, city, title, item });

			// Validate coordinates
			if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
				pins.push({
					id: index + 1,
					lat: lat,
					lng: lng,
					city: city,
					title: title,
					caption: caption,
					data: item // Include original data for popup details
				});
				console.log(`✓ Valid pin created for item ${index}:`, { lat, lng, city, title });
			} else {
				console.warn(`✗ Invalid coordinates for item ${index}:`, { lat, lng, city, title, item });
			}
		});

		console.log(`Generated ${pins.length} map pins from ${scripterResults.length} data items`);
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
			addDataPinsToMap();
		});			map.on('error', (e) => {
				console.error('Map error:', e);
			});

			// Force trigger load event after timeout if it doesn't fire
			setTimeout(() => {
				if (map && map.loaded()) {
					console.log('Map was already loaded, adding pins');
					addDataPinsToMap();
				}
			}, 2000);

		} catch (error) {
			console.error('Failed to initialize map:', error);
		}
	}

	function addDataPinsToMap() {
		if (!map) {
			console.log('Map not initialized, cannot add pins');
			return;
		}

		console.log('Adding pins to map...');
		const pins = processDataForMapPins();

		if (pins.length === 0) {
			console.log('No valid coordinates found in data for map pins');
			return;
		}

		console.log(`Adding ${pins.length} pins to map`);
		pins.forEach((pin, index) => {
			// Create popup using the specific scripter format: title, caption, city
			const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
				<div class="p-3 max-w-xs">
					<h3 class="font-semibold text-sm mb-2">${pin.title}</h3>
					<p class="text-xs text-muted-foreground mb-2">${pin.caption}</p>
					<div class="flex items-center gap-1 text-xs text-blue-600 mb-2">
						<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
						</svg>
						${pin.city}
					</div>
					<div class="text-xs text-muted-foreground border-t pt-2">
						<p><strong>Coordinates:</strong> ${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}</p>
					</div>
				</div>
			`);

			// Create marker with dynamic color based on data or step
			const marker = new mapboxgl.Marker({
				color: selectedStep === 'posts' ? '#8B5CF6' : selectedStep === 'likes' ? '#EF4444' : '#3B82F6'
			})
				.setLngLat([pin.lng, pin.lat])
				.setPopup(popup)
				.addTo(map);

			console.log(`✓ Added marker ${index + 1} at [${pin.lng}, ${pin.lat}] for ${pin.title}`);
		});

		// Fit map to show all pins if there are multiple
		if (pins.length > 1) {
			const bounds = new mapboxgl.LngLatBounds();
			pins.forEach(pin => bounds.extend([pin.lng, pin.lat]));
			map.fitBounds(bounds, { padding: 50 });
		} else if (pins.length === 1) {
			// Center on single pin
			map.setCenter([pins[0].lng, pins[0].lat]);
			map.setZoom(10);
		}

		// Force map refresh to ensure markers are visible
		setTimeout(() => {
			if (map) {
				map.resize();
				map.triggerRepaint();
			}
		}, 100);
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
		if (currentViewType === 'map' && hasData) {
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
			<Tabs value={currentViewType} class="w-full h-full">
				<TabsList class="grid w-full grid-cols-3 mb-4">
					<TabsTrigger value="table" class="flex items-center gap-2">
						<Icon icon="lucide:table" class="w-4 h-4" />
						Table View
					</TabsTrigger>
					<TabsTrigger value="chart" class="flex items-center gap-2">
						<Icon icon="lucide:bar-chart" class="w-4 h-4" />
						Chart View
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
									{processedTableData.length > 0 ? 'Processed Data' : 'Data Table'}
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
									Instagram {selectedStep} {currentViewType === 'pie' ? 'Distribution' : 'Analysis'}
								</h3>
								
								{#if currentViewType === 'pie'}
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
								{:else if currentViewType === 'line'}
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
								{#if currentViewType === 'pie'}
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
						<div bind:this={mapContainer} class="w-full h-full min-h-[400px]" style="height: 400px;" use:autoInitMap>
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
									<span class="font-medium">{scripterResults.length || 0} locations</span>
								</div>
								<div class="flex justify-between gap-4">
									<span class="text-muted-foreground">Data Type:</span>
									<span class="font-medium capitalize">
										{selectedStep ? `Instagram ${selectedStep}` : 'Map Data'}
									</span>
								</div>
								<div class="flex justify-between gap-4">
									<span class="text-muted-foreground">Coverage:</span>
									<span class="font-medium">
										{scripterResults.length > 0 ? 'Dynamic' : 'No Data'}
									</span>
								</div>
								{#if scripterResults.length > 0}
									<div class="flex justify-between gap-4">
										<span class="text-muted-foreground">Status:</span>
										<span class="font-medium text-green-600">Live Data</span>
									</div>
								{/if}
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