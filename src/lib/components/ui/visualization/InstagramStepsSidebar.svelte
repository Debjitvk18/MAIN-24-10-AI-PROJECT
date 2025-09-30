<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Icon from '@iconify/svelte';

	export let selectedStep = 'comments';
	export let onStepSelect: (step: string) => void;
	export let onNewMessage: (message: {id: string, role: 'user' | 'assistant', content: string, timestamp: Date}) => void;
	export let messages: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}> = [];

	// Chat functionality
	let inputMessage = '';
	let isLoading = false;

	const instagramSteps = [
		{
			id: 'posts',
			title: 'Step 1',
			description: 'Analyze post engagement, reach, and performance metrics',
			icon: 'lucide:image',
			color: 'from-purple-500 to-pink-500'
		},
		{
			id: 'likes',
			title: 'Step 2',
			description: 'Track likes patterns, trends, and user engagement',
			icon: 'lucide:heart',
			color: 'from-red-500 to-pink-500'
		},
		{
			id: 'comments',
			title: 'Step 3',
			description: 'Analyze comment sentiment, frequency, and interactions',
			icon: 'lucide:message-circle',
			color: 'from-blue-500 to-purple-500'
		}
	];

	function selectStep(stepId: string) {
		onStepSelect(stepId);
	}

	function getSelectedStepTitle(): string {
		const step = instagramSteps.find(s => s.id === selectedStep);
		return step ? step.title : 'Select a Step';
	}

	// Chat functionality
	function handleSubmit() {
		if (!inputMessage.trim() || isLoading) return;

		if (!selectedStep) {
			// Prompt user to select a step first
			const errorMessage = {
				id: Date.now().toString(),
				role: 'assistant' as const,
				content: 'Please select an Instagram data category from the dropdown first (Step 1, Step 2, or Step 3), then ask me to create visualizations.',
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

		onNewMessage(userMessage);

		// Clear input and show loading
		const currentQuery = inputMessage.trim();
		inputMessage = '';
		isLoading = true;

		// Simulate AI response
		setTimeout(() => {
			const aiResponse = {
				id: (Date.now() + 1).toString(),
				role: 'assistant' as const,
				content: generateContextualResponse(currentQuery, selectedStep),
				timestamp: new Date()
			};
			onNewMessage(aiResponse);
			isLoading = false;
		}, 1500);
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
		switch (selectedStep) {
			case 'posts':
				return [
					'Show me a table of post data',
					'Create a pie chart of post types',
					'Generate a bar chart of engagement',
					'Show posts on map by location'
				];
			case 'likes':
				return [
					'Display likes data in a table',
					'Make a pie chart of demographics',
					'Show daily likes in a bar chart',
					'Map likes by geographic location'
				];
			case 'comments':
				return [
					'Show comment data table',
					'Create a pie chart of sentiment',
					'Make a bar chart by language',
					'Map comments by global regions'
				];
			default:
				return ['Select a data category first'];
		}
	}

	function useSuggestion(suggestion: string) {
		inputMessage = suggestion;
		handleSubmit();
	}
</script>

<div class="h-full flex flex-col p-4 bg-muted/20">
	<!-- Header -->
	<div class="mb-6">
		<h2 class="text-lg font-semibold mb-2">Instagram Analytics</h2>
		<p class="text-sm text-muted-foreground">Select a data category to analyze</p>
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
				{#each instagramSteps as step}
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
								max-w-[80%] p-3 rounded-lg
								${message.role === 'user' 
									? 'bg-primary text-primary-foreground' 
									: 'bg-muted text-muted-foreground'
								}
							`}>
								<p class="text-sm">{message.content}</p>
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

				<!-- Input Form -->
				<form on:submit|preventDefault={handleSubmit} class="flex gap-2">
					<Input
						bind:value={inputMessage}
						placeholder={selectedStep 
							? `Ask about Instagram ${selectedStep}... (e.g., "show me a table", "create a pie chart")`
							: "Select a data category from the dropdown first..."
						}
						class="flex-1"
						disabled={isLoading || !selectedStep}
						on:keydown={handleKeyDown}
					/>
					<Button 
						type="submit" 
						disabled={!inputMessage.trim() || isLoading || !selectedStep}
						size="icon"
					>
						<Icon icon="lucide:send" class="w-4 h-4" />
					</Button>
				</form>
				
				<!-- Step Indicator -->
				{#if selectedStep}
					<div class="flex items-center gap-2 text-xs text-muted-foreground">
						<Icon icon="lucide:target" class="w-3 h-3" />
						<span>Analyzing: Instagram {getSelectedStepTitle()}</span>
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