<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';

	export let hasData = false;
	export let selectedStep = '';
	export let lastUserQuery = '';

	// Chart type detection from user query
	function detectChartType(query: string): 'table' | 'bar' | 'pie' | 'line' {
		const lowerQuery = query.toLowerCase();
		
		if (lowerQuery.includes('table') || lowerQuery.includes('data') || lowerQuery.includes('list')) {
			return 'table';
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
			<Tabs value={detectedChartType === 'table' ? 'table' : 'chart'} class="w-full h-full">
				<TabsList class="grid w-full grid-cols-2 mb-4">
					<TabsTrigger value="table" class="flex items-center gap-2">
						<Icon icon="lucide:table" class="w-4 h-4" />
						Table View
					</TabsTrigger>
					<TabsTrigger value="chart" class="flex items-center gap-2">
						<Icon icon="lucide:bar-chart" class="w-4 h-4" />
						{detectedChartType === 'pie' ? 'Pie Chart' : detectedChartType === 'line' ? 'Line Chart' : 'Bar Chart'}
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
			</Tabs>
		{/if}
	</CardContent>
</Card>