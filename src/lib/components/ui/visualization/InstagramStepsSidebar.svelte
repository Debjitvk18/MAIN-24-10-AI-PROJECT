<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Icon from '@iconify/svelte';
	import { ApiService } from '$lib/services/api-service';
	import { getDataFromURL } from '$lib/utils/generalUtils';

	export let selectedStep = 'comments';
	export let onStepSelect: (step: string) => void;
	export let onNewMessage: (message: {id: string, role: 'user' | 'assistant', content: string, timestamp: Date}, viewType?: string) => void;
	export let onScripterResults: (results: any[], viewType: string) => void;
	export let messages: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}> = [];
	export let conversationResults: Array<any> = [];

	// Chat functionality
	let inputMessage = '';
	let isLoading = false;
	let selectedViewType = 'datatable'; // Default view type
	
	// API service instance
	const apiService = new ApiService();



	// Generate steps only from conversation results
	$: dynamicSteps = conversationResults.map((result, index) => ({
		id: result.id || `step-${index}`,
		title: getStepTitle(result, index),
		description: getResultDescription(result),
		icon: getResultIcon(result),
		color: getResultColor(index),
		data: result,
		type: result.step_type || 'data',
		stepName: result.step_name,
		status: result.status
	}));

	// Set first conversation step as default selected when available
	$: if (conversationResults.length > 0 && dynamicSteps.length > 0 && !selectedStep) {
		selectedStep = dynamicSteps[0].id;
	}
	
	// Reset selected step if no conversation results
	$: if (conversationResults.length === 0 && selectedStep) {
		selectedStep = '';
	}

	function getStepTitle(result: any, index: number): string {
		// Generate from step_type and step_name
		if (result.step_type && result.step_name) {
			switch (result.step_type.toLowerCase()) {
				case 'service': return `Service`;
				case 'scripter': return `Scripter`;
				case 'ai': return `AI Analysis`;
				case 'ai-image': return `AI Image Analysis`;
				case 'profiler': return `Profiler`;
				default: return `Step ${result.step_name}`;
			}
		}

		if (result.step_name) {
			// Truncate long titles for better UI display
			return result.step_name.length > 50 
				? result.step_name.substring(0, 50) + '...' 
				: result.step_name;
		}
		
		return `Step ${index + 1}`;
	}

	function getResultDescription(result: any): string {
		// Handle final response step
		if (result.step_name === 'finalizing') {
			return 'Final conversation results and processed data ready for visualization';
		}
		
		// Use step_title if available and different from title
		if (result.step_title) {
			// Show first 100 characters of step_title as description
			return result.step_title.length > 100 
				? result.step_title.substring(0, 100) + '...' 
				: result.step_title;
		}
		
		// Generate description based on step_type
		if (result.step_type) {
			switch (result.step_type.toLowerCase()) {
				case 'service': return 'External service call for data collection and processing';
				case 'scripter': return 'Data transformation and formatting operations';
				case 'analyzer': return 'Data analysis and insights generation';
				case 'ai': return 'AI-powered analysis and intelligent data processing';
				case 'ai-image': return 'AI image analysis and visual content processing';
				case 'profiler': return 'Data profiling and statistical analysis operations';
				default: return `${result.step_type} processing step`;
			}
		}
		
		return `Step ${result.step_name || 'N/A'} - Click to analyze and visualize data`;
	}

	function getResultIcon(result: any): string {
		// Handle final response step
		if (result.step_name === 'finalizing') {
			return 'lucide:check-circle';
		}
		
		// Determine icon based on step_type
		if (result.step_type) {
			switch (result.step_type.toLowerCase()) {
				case 'service': return 'lucide:globe';
				case 'scripter': return 'lucide:code';
				case 'analyzer': return 'lucide:bar-chart-3';
				case 'ai': return 'lucide:brain';
				case 'ai-image': return 'lucide:image';
				case 'profiler': return 'lucide:user-search';
				default: return 'lucide:settings';
			}
		}
		
		return 'lucide:circle-dot';
	}

	function getResultColor(index: number): string {
		const colors = [
			'from-purple-500 to-pink-500',
			'from-blue-500 to-purple-500',
			'from-green-500 to-blue-500',
			'from-yellow-500 to-orange-500',
			'from-red-500 to-pink-500'
		];
		return colors[index % colors.length];
	}

	function selectStep(stepId: string) {
		onStepSelect(stepId);
	}

	function getSelectedStepTitle(): string {
		if (conversationResults.length === 0) return 'No Conversation Data';
		const step = dynamicSteps.find(s => s.id === selectedStep);
		return step ? step.title : 'Select a Conversation Step';
	}

	function getSelectedStepData(): any {
		const step = dynamicSteps.find(s => s.id === selectedStep);
		return step ? step.data : null;
	}

	// Chat functionality
	async function handleSubmit() {
		if (!inputMessage.trim() || isLoading) return;

		if (!selectedStep) {
			// Prompt user to select a step first
			const errorMessage = {
				id: Date.now().toString(),
				role: 'assistant' as const,
				content: 'Please select a conversation step from the dropdown first, then ask me to create visualizations.',
				timestamp: new Date()
			};
			onNewMessage(errorMessage);
			inputMessage = '';
			return;
		}

		const userMessage = {
			id: Date.now().toString(),
			role: 'user' as const,
			content: inputMessage.trim(),
			timestamp: new Date()
		};

		onNewMessage(userMessage, selectedViewType);

		// Clear input and show loading
		const currentQuery = inputMessage.trim();
		inputMessage = '';
		isLoading = true;

		try {
			// Get conversation ID and selected step data
			const conversationId = getDataFromURL('conversation_id');
			if (!conversationId) {
				throw new Error('No conversation ID found');
			}

			const stepData = getSelectedStepData();
			if (!stepData) {
				throw new Error('No step data found for selected step');
			}

			// Execute scripter API call
			console.log('Executing scripter with query:', currentQuery);
			console.log('Step data:', stepData);
			console.log('Conversation ID:', conversationId);

			const executeResponse = await apiService.executeScripter(
				currentQuery,
				stepData.id.toString(),
				conversationId,
				'0'
			);

			if (!executeResponse.success) {
				throw new Error(executeResponse.message || 'Failed to execute scripter');
			}

			const sessionId = executeResponse.data?.session_id;
			if (!sessionId) {
				throw new Error('No session ID returned from scripter execute');
			}

			// Show processing message
			const processingMessage = {
				id: (Date.now() + 1).toString(),
				role: 'assistant' as const,
				content: 'Processing your request... This may take a few moments.',
				timestamp: new Date()
			};
			onNewMessage(processingMessage);

			// Poll for results
			const results = await pollScripterStatus(sessionId);
			
			// Show success message with results
			const successMessage = {
				id: (Date.now() + 2).toString(),
				role: 'assistant' as const,
				content: `Successfully processed your request! Generated ${results.length} records. The data is now available in the visualization panel.`,
				timestamp: new Date()
			};
			onNewMessage(successMessage);

			// Pass results to visualization panel
			console.log('Scripter results:', results);
			console.log('Selected view type:', selectedViewType);
			onScripterResults(results, selectedViewType);

		} catch (error) {
			console.error('Error processing scripter request:', error);
			const errorMessage = {
				id: (Date.now() + 3).toString(),
				role: 'assistant' as const,
				content: `Error: ${error.message}. Please try again or select a different step.`,
				timestamp: new Date()
			};
			onNewMessage(errorMessage);
		} finally {
			isLoading = false;
		}
	}

	// Poll scripter status until completion
	async function pollScripterStatus(sessionId: string): Promise<any[]> {
		const maxAttempts = 30; // 5 minutes with 10-second intervals
		let attempts = 0;

		while (attempts < maxAttempts) {
			try {
				console.log(`Polling scripter status (attempt ${attempts + 1}/${maxAttempts})`);
				
				const statusResponse = await apiService.getScripterStatus(sessionId);

				if (statusResponse.success) {
					const status = statusResponse.data?.status;
					
					if (status === 'completed') {
						console.log('Scripter processing completed');
						
						// Extract results from the response structure
						const responseData = statusResponse.data?.response;
						const results = responseData?.result?.results || responseData?.results || [];
						
						// Ensure we return an array
						if (Array.isArray(results)) {
							return results;
						} else if (results && typeof results === 'object') {
							return [results];
						} else {
							return [];
						}
						
					} else if (status === 'failed') {
						throw new Error(statusResponse.data?.error || 'Scripter processing failed');
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

	function generateContextualResponse(userPrompt: string, step: string): string {
		const lowerPrompt = userPrompt.toLowerCase();
		const stepName = step === 'posts' ? 'Posts' : step === 'likes' ? 'Likes' : 'Comments';
		
		// Detect chart type
		let chartType = 'bar chart';
		if (lowerPrompt.includes('table') || lowerPrompt.includes('data') || lowerPrompt.includes('list')) {
			chartType = 'data table';
		} else if (lowerPrompt.includes('map') || lowerPrompt.includes('location') || lowerPrompt.includes('geographic') || lowerPrompt.includes('global') || lowerPrompt.includes('region')) {
			chartType = 'map';
		} else if (lowerPrompt.includes('pie') || lowerPrompt.includes('round') || lowerPrompt.includes('circle') || lowerPrompt.includes('donut')) {
			chartType = 'pie chart';
		} else if (lowerPrompt.includes('line') || lowerPrompt.includes('trend') || lowerPrompt.includes('over time')) {
			chartType = 'line chart';
		}

		// Generate step-specific responses
		const responses = {
			posts: {
				table: `Here's a detailed data table showing Instagram post analytics. The table includes post types (Photo, Video, Carousel, Reel, Story), engagement metrics like likes and comments, reach data, and posting time analysis.`,
				'pie chart': `I've created a pie chart showing the distribution of your Instagram post types. You can see the breakdown between Photos, Videos, Carousels, Reels, and Stories to understand your content mix.`,
				'line chart': `This line chart displays your Instagram post engagement trends over time. You can track how your post performance has evolved and identify peak engagement periods.`,
				'bar chart': `Here's a bar chart analyzing your Instagram post performance by type. Compare engagement rates across Photos, Videos, Carousels, Reels, and Stories to optimize your content strategy.`,
				'map': `I've plotted your Instagram posts on a global map showing geographic distribution of your content engagement. Each pin represents a location with post data including likes, comments, and engagement rates.`
			},
			likes: {
				table: `I've generated a comprehensive table of your Instagram likes data. It shows demographic breakdowns, geographic distribution, peak engagement hours, weekly patterns, and growth rates.`,
				'pie chart': `This pie chart visualizes your Instagram likes distribution across different demographics. See which age groups and locations are most engaged with your content.`,
				'line chart': `The line chart shows your daily Instagram likes trends over the week. Identify your best-performing days and optimal posting times for maximum engagement.`,
				'bar chart': `Here's a bar chart comparing your Instagram likes across different time periods and demographics. Use this to understand your audience engagement patterns.`,
				'map': `The map displays Instagram likes data across global locations. Each marker shows regional engagement metrics, helping you understand where your content resonates most with audiences worldwide.`
			},
			comments: {
				table: `I've created a detailed table analyzing your Instagram comments data. It includes sentiment analysis, language distribution, response rates, keyword analysis, and engagement metrics.`,
				'pie chart': `This pie chart shows the sentiment distribution of your Instagram comments - Positive, Neutral, and Negative. Monitor your community's response to your content.`,
				'line chart': `The line chart tracks your Instagram comment engagement over time. See how your community interaction has grown and evolved.`,
				'bar chart': `Here's a bar chart analyzing your Instagram comments by language and sentiment. Understand your global audience and community feedback patterns.`,
				'map': `The global map visualization shows Instagram comments data by geographic regions. Each pin displays local comment statistics including sentiment analysis, engagement levels, and regional interaction patterns.`
			}
		};

		return responses[step]?.[chartType] || `I've analyzed your Instagram ${stepName} data and created a ${chartType} visualization. The ${chartType} shows key insights and patterns from your ${stepName.toLowerCase()} analytics.`;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	// Suggestion prompts based on selected step
	function getSuggestions(): string[] {
		if (conversationResults.length === 0) return ['No conversation data available'];
		if (!selectedStep) return ['Select a conversation step first'];
		
		const stepData = getSelectedStepData();
		const stepType = stepData?.type?.toLowerCase() || 'data';
		
		// Generate suggestions based on step type
		switch (stepType) {
			case 'service':
				return [
					'Show service results in table',
					'Display data on map',
					'Create chart from results',
					'Filter by location or criteria'
				];
			case 'scripter':
				return [
					'Display processed data table',
					'Show transformation results',
					'Create visualization from data',
					'Filter formatted data'
				];
			case 'analyzer':
				return [
					'Show analysis results',
					'Create insights chart',
					'Display data patterns',
					'Filter analytical data'
				];
			case 'ai':
				return [
					'Show AI analysis results',
					'Display intelligent insights',
					'Create AI-generated charts',
					'Filter AI predictions'
				];
			case 'ai-image':
				return [
					'Display image analysis results',
					'Show visual content data',
					'Create image insights chart',
					'Filter by image attributes'
				];
			case 'profiler':
				return [
					'Show profiling results table',
					'Display statistical summary',
					'Create profile charts',
					'Filter profile data'
				];
			default:
				// Handle finalizing and other types
				if (stepData?.step_name === 'finalizing') {
					return [
						'Show final results table',
						'Display all data on map',
						'Create summary charts',
						'Export final data'
					];
				}
				return [
					'Show me a data table',
					'Create a chart visualization',
					'Display on interactive map',
					'Filter and analyze data'
				];
		}
	}

	function useSuggestion(suggestion: string) {
		inputMessage = suggestion;
		handleSubmit();
	}

	function getPlaceholderExample(): string {
		switch (selectedViewType) {
			case 'datatable':
				return '"show me a table", "list all data", "display records"';
			case 'pie':
				return '"show pie chart", "distribution by category", "breakdown by type"';
			case 'line':
				return '"show trend over time", "line chart by date", "track changes"';
			case 'bar':
				return '"compare values", "bar chart by category", "show comparison"';
			case 'chart':
				return '"create a chart", "show trends", "visualize data"';
			case 'map':
				return '"show locations on map", "plot geographical data", "map pins by region"';
			default:
				return '"analyze this data"';
		}
	}
</script>

<div class="h-full flex flex-col p-4 bg-muted/20">
	<!-- Header -->
	<div class="mb-6">
		<h2 class="text-lg font-semibold mb-2">
			{conversationResults.length > 0 ? 'Conversation Steps' : 'Data Analytics'}
		</h2>
		<p class="text-sm text-muted-foreground">
			{conversationResults.length > 0 
				? `Select from ${conversationResults.length} conversation step${conversationResults.length > 1 ? 's' : ''} to analyze`
				: 'Select a data category to analyze'
			}
		</p>
		{#if selectedStep}
			<div class="mt-2 px-3 py-1 bg-primary/10 text-primary text-xs rounded-full inline-block">
				✓ {getSelectedStepTitle()} Selected
			</div>
		{/if}
	</div>

	<!-- Dropdown Menu -->
	<div class="mb-6">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button variant="outline" class="w-full justify-between" builders={[builder]}>
					{getSelectedStepTitle()}
					<Icon icon="lucide:chevron-down" class="ml-2 h-4 w-4" />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-[300px]">
				{#if dynamicSteps.length > 0}
					{#each dynamicSteps as step}
						<DropdownMenu.Item 
							class="cursor-pointer p-3"
							on:click={() => selectStep(step.id)}
						>
							<div class="flex items-center gap-3 w-full">
								<div class={`
									w-6 h-6 rounded-lg bg-gradient-to-r ${step.color} 
									flex items-center justify-center text-white flex-shrink-0
								`}>
									<Icon icon={step.icon} class="w-3 h-3" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="font-medium text-sm">{step.title}</div>
									<div class="text-xs text-muted-foreground line-clamp-2">{step.description}</div>
								</div>
							</div>
						</DropdownMenu.Item>
				{/each}
			{:else}
				<DropdownMenu.Item class="p-3 text-center text-muted-foreground">
					<div class="flex flex-col items-center gap-2">
						<Icon icon="lucide:database-x" class="w-6 h-6" />
						<div class="text-sm">No conversation steps available</div>
						<div class="text-xs">Please start a conversation first</div>
					</div>
				</DropdownMenu.Item>
			{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<!-- Chat Section -->
	<div class="flex-1 flex flex-col min-h-0">
		<Card class="flex-1 flex flex-col border-0 shadow-none">
			<!-- Messages Area -->
			<div class="flex-1 overflow-y-auto p-4 space-y-4 max-h-[300px]">
				{#if messages.length === 0}
					<div class="text-center text-muted-foreground py-8">
						<Icon icon="lucide:message-circle" class="w-12 h-12 mx-auto mb-2 opacity-50" />
						<p class="text-lg font-medium">Start a conversation</p>
						<p class="text-sm">Ask questions to generate data visualizations</p>
					</div>
				{:else}
					{#each messages as message (message.id)}
						<div class={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
							<div class={`
								max-w-[90%] p-3 rounded-lg
								${message.role === 'user'
									? 'bg-primary text-primary-foreground'
									: 'bg-muted text-muted-foreground'
								}
							`}>
								<p class="text-sm whitespace-pre-wrap">{message.content}</p>
								<p class="text-xs opacity-70 mt-1">{formatTime(message.timestamp)}</p>
							</div>
						</div>
					{/each}
				{/if}

				{#if isLoading}
					<div class="flex justify-start">
						<div class="bg-muted text-muted-foreground max-w-[80%] p-3 rounded-lg">
							<div class="flex items-center gap-2">
								<div class="flex space-x-1">
									<div class="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
									<div class="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
									<div class="w-2 h-2 bg-current rounded-full animate-bounce"></div>
								</div>
								<p class="text-xs">Analyzing...</p>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Input Area -->
			<div class="border-t p-4 space-y-3">
				<!-- Suggestions (only show when no messages and step is selected) -->
				{#if messages.length === 0 && selectedStep}
					<div class="space-y-2">
						<p class="text-xs text-muted-foreground">Try these suggestions:</p>
						<div class="flex flex-wrap gap-1">
							{#each getSuggestions() as suggestion}
								<Button 
									variant="outline" 
									size="sm" 
									class="text-xs h-7"
									on:click={() => useSuggestion(suggestion)}
									disabled={isLoading}
								>
									{suggestion}
								</Button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- View Type Selector -->
				<div class="space-y-2">
					<p class="text-xs text-muted-foreground">Select visualization type:</p>
					<div class="flex gap-1 flex-wrap">
						<label class="relative cursor-pointer">
							<input 
								type="radio" 
								bind:group={selectedViewType} 
								value="datatable" 
								class="sr-only"
							/>
							<div class={`
								px-2 py-1 rounded-md text-xs font-medium border transition-all
								${selectedViewType === 'datatable' 
									? 'bg-primary text-primary-foreground border-primary' 
									: 'bg-background text-muted-foreground border-border hover:bg-muted'
								}
							`}>
								<Icon icon="lucide:table" class="w-3 h-3 inline mr-1" />
								Table
							</div>
						</label>
						<label class="relative cursor-pointer">
							<input 
								type="radio" 
								bind:group={selectedViewType} 
								value="map" 
								class="sr-only"
							/>
							<div class={`
								px-2 py-1 rounded-md text-xs font-medium border transition-all
								${selectedViewType === 'map' 
									? 'bg-primary text-primary-foreground border-primary' 
									: 'bg-background text-muted-foreground border-border hover:bg-muted'
								}
							`}>
								<Icon icon="lucide:map-pin" class="w-3 h-3 inline mr-1" />
								Map
							</div>
						</label>
						<label class="relative cursor-pointer">
							<input 
								type="radio" 
								bind:group={selectedViewType} 
								value="pie" 
								class="sr-only"
							/>
							<div class={`
								px-2 py-1 rounded-md text-xs font-medium border transition-all
								${selectedViewType === 'pie' 
									? 'bg-primary text-primary-foreground border-primary' 
									: 'bg-background text-muted-foreground border-border hover:bg-muted'
								}
							`}>
								<Icon icon="lucide:pie-chart" class="w-3 h-3 inline mr-1" />
								Pie Chart
							</div>
						</label>
						<label class="relative cursor-pointer">
							<input 
								type="radio" 
								bind:group={selectedViewType} 
								value="line" 
								class="sr-only"
							/>
							<div class={`
								px-2 py-1 rounded-md text-xs font-medium border transition-all
								${selectedViewType === 'line' 
									? 'bg-primary text-primary-foreground border-primary' 
									: 'bg-background text-muted-foreground border-border hover:bg-muted'
								}
							`}>
								<Icon icon="lucide:line-chart" class="w-3 h-3 inline mr-1" />
								Line Chart
							</div>
						</label>
						<label class="relative cursor-pointer">
							<input 
								type="radio" 
								bind:group={selectedViewType} 
								value="bar" 
								class="sr-only"
							/>
							<div class={`
								px-2 py-1 rounded-md text-xs font-medium border transition-all
								${selectedViewType === 'bar' 
									? 'bg-primary text-primary-foreground border-primary' 
									: 'bg-background text-muted-foreground border-border hover:bg-muted'
								}
							`}>
								<Icon icon="lucide:bar-chart-3" class="w-3 h-3 inline mr-1" />
								Bar Chart
							</div>
						</label>
					</div>
				</div>

				<!-- Input Form -->
				<form on:submit|preventDefault={handleSubmit} class="relative">
					<textarea
						bind:value={inputMessage}
						placeholder={selectedStep
							? `Query ${getSelectedStepTitle()} data for ${selectedViewType}... (e.g., ${getPlaceholderExample()})`
							: "Select a conversation step from the dropdown first..."
						}
						class="w-full min-h-[80px] max-h-[200px] px-3 py-2 pr-12 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
						disabled={isLoading || !selectedStep}
						rows="4"
						on:keydown={handleKeyDown}
					></textarea>
					<Button
						type="submit"
						disabled={!inputMessage.trim() || isLoading || !selectedStep}
						size="icon"
						class="absolute bottom-2 right-0"
					>
						<Icon icon="lucide:send" class="w-4 h-4" />
					</Button>
				</form>
				
				<!-- Step Indicator -->
				{#if selectedStep}
					<div class="flex items-center gap-2 text-xs text-muted-foreground">
						<Icon icon="lucide:target" class="w-3 h-3" />
						<span>Analyzing: {getSelectedStepTitle()}</span>
						{#if getSelectedStepData()?.type}
							<span class="px-2 py-0.5 bg-muted rounded text-xs">({getSelectedStepData().type})</span>
						{/if}
					</div>
				{/if}

				<!-- Reset Button -->
				{#if selectedStep}
					<Button 
						variant="outline" 
						size="sm" 
						class="w-full"
						on:click={() => selectStep('')}
					>
						<Icon icon="lucide:refresh-cw" class="w-4 h-4 mr-2" />
						Reset Selection
					</Button>
				{/if}
			</div>
		</Card>
	</div>
</div>