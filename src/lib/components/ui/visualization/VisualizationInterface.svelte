<script lang="ts">
	import { onMount } from 'svelte';
	import { getDataFromURL } from '$lib/utils/generalUtils';
	import { ConversationService } from '$lib/services/conversation-service';
	import InstagramStepsSidebar from './InstagramStepsSidebar.svelte';
	import VisualizationPanel from './VisualizationPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';

	// API data
	let conversationService = new ConversationService();
	let conversationData = null;
	let conversationResults = [];
	let isLoading = true;
	let error = null;

	// UI state
	let sidebarVisible = true;
	let isMobile = false;
	let selectedStep = 'comments';
	let hasVisualizationData = false;
	let sidebarMessages: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}> = [];
	let lastUserQuery = '';
	let scripterResults: Array<any> = [];
	let selectedViewType = 'datatable'; // Track view type from sidebar

	// Check if we're on mobile screen
	function checkMobile() {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth < 1024;
			if (isMobile) {
				sidebarVisible = false;
			} else {
				sidebarVisible = true;
			}
		}
	}

	onMount(async () => {
		checkMobile();
		await loadConversationData();
		
		const handleResize = () => {
			checkMobile();
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	async function loadConversationData() {
		const conversationId = getDataFromURL('conversation_id');
		
		if (!conversationId) {
			console.warn('No conversation_id found in URL');
			// Use default data when no conversation ID
			initializeDefaultData();
			isLoading = false;
			return;
		}

		try {
			console.log('Loading conversation data for ID:', conversationId);
			const response = await conversationService.retrieveConversation(conversationId);
			
			if (response && response.success) {
				conversationData = response.data;
				// Fix: Get results from conversationData.results, not response.results
				conversationResults = conversationData?.results || response.results || [];
				
				// Keep sidebar messages empty - visualization page will handle new queries separately
				sidebarMessages = [];
				
				hasVisualizationData = conversationResults.length > 0;
				
				// Set user query from conversation if available
				if (conversationData && conversationData.user_query) {
					lastUserQuery = conversationData.user_query;
				}
				
				// Auto-select first step if available and no step is currently selected
				if (conversationResults.length > 0 && !selectedStep) {
					selectedStep = conversationResults[0].id || 'step-0';
				}
				
				console.log('Conversation loaded:', {
					data: conversationData,
					results: conversationResults.length,
					selectedStep: selectedStep,
					note: 'Messages kept empty for visualization queries'
				});
			} else {
				error = 'Failed to load conversation data';
				console.error('API response error:', response);
				initializeDefaultData();
			}
		} catch (err) {
			error = 'Error loading conversation: ' + err.message;
			console.error('Error loading conversation:', err);
			initializeDefaultData();
		}
		
		isLoading = false;
	}

	function initializeDefaultData() {
		// Don't initialize any default data - wait for conversation data
		hasVisualizationData = false;
		selectedStep = '';
		sidebarMessages = [];
	}

	function toggleSidebar() {
		sidebarVisible = !sidebarVisible;
	}

	function handleStepSelect(stepId: string) {
		selectedStep = stepId;
		
		// Find the selected step data
		const selectedStepData = conversationResults.find(result => 
			(result.id || `step-${conversationResults.indexOf(result)}`) === stepId
		);
		
		// Clear previous messages when switching steps
		sidebarMessages = [];
		
		// Set visualization data availability based on step data
		hasVisualizationData = !!selectedStepData;
		
		// Update last user query based on step data
		if (selectedStepData) {
			lastUserQuery = selectedStepData.query || selectedStepData.message || selectedStepData.content || lastUserQuery;
		}
		
		// Close sidebar on mobile after selection
		if (isMobile) {
			sidebarVisible = false;
		}
		
		console.log('Step selected:', {
			stepId,
			stepData: selectedStepData,
			hasData: hasVisualizationData
		});
	}

	function handleSidebarMessage(message: {id: string, role: 'user' | 'assistant', content: string, timestamp: Date}, viewType?: string) {
		sidebarMessages = [...sidebarMessages, message];
		// Track the last user query and set view type from sidebar selection
		if (message.role === 'user') {
			lastUserQuery = message.content;
			// Use the view type passed from sidebar (user's explicit selection)
			if (viewType) {
				selectedViewType = viewType;
				console.log('Set view type from sidebar selection:', selectedViewType, 'for query:', message.content);
			}
		}
		// Show visualization data when there are conversation results and a step is selected
		hasVisualizationData = conversationResults.length > 0 && selectedStep !== '';
	}

	function handleScripterResults(results: any[], viewType: string) {
		scripterResults = results;
		// Show visualization data when we have scripter results
		hasVisualizationData = results.length > 0;
		// Store the selected view type directly from sidebar
		selectedViewType = viewType;
		console.log('Received scripter results:', results);
		console.log('Selected view type:', viewType);
	}
</script>

<div class="h-full flex bg-background max-h-full overflow-hidden">
	<!-- Mobile backdrop -->
	{#if isMobile && sidebarVisible}
		<div 
			class="fixed inset-0 bg-black/50 z-40 lg:hidden"
			on:click={toggleSidebar}
			role="button"
			tabindex="0"
			on:keydown={(e) => e.key === 'Escape' && toggleSidebar()}
		></div>
	{/if}

	<!-- Sidebar -->
	<div class={`
		${isMobile ? 'fixed' : 'relative'} 
		${sidebarVisible ? 'translate-x-0' : '-translate-x-full'} 
		${isMobile ? 'z-50' : 'z-10'}
		transition-all duration-300 ease-in-out
		${sidebarVisible ? 'w-80' : 'w-0'}
		h-full bg-muted/30 border-r overflow-hidden
	`}>
		{#if sidebarVisible}
			<InstagramStepsSidebar 
				selectedStep={selectedStep} 
				onStepSelect={handleStepSelect}
				onNewMessage={handleSidebarMessage}
				onScripterResults={handleScripterResults}
				messages={sidebarMessages}
				{conversationResults}
			/>
		{/if}
	</div>

	<!-- Main Content Area -->
	<div class={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarVisible ? '' : 'ml-0'}`}>
		<!-- Header with sidebar toggle -->
		<div class="flex items-center justify-between p-4 border-b bg-background">
			<div class="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					on:click={toggleSidebar}
					class="lg:hidden"
				>
					<Icon icon="lucide:menu" class="w-5 h-5" />
				</Button>
				<div>
					<h1 class="text-xl font-semibold">
						{conversationResults.length > 0 ? 'Data Visualization Studio' : 'Analytics Studio'}
					</h1>
					{#if selectedStep && conversationResults.length > 0}
						{@const stepData = conversationResults.find(r => (r.id || `step-${conversationResults.indexOf(r)}`) === selectedStep)}
						{@const stepIndex = conversationResults.findIndex(r => (r.id || `step-${conversationResults.indexOf(r)}`) === selectedStep)}
						<p class="text-sm text-muted-foreground">
							Analyzing: {stepData?.title || stepData?.name || `Step ${stepIndex + 1}`} 
							{stepData?.type ? `(${stepData.type})` : ''}
						</p>
					{:else if conversationResults.length > 0}
						<p class="text-sm text-muted-foreground">
							Select a conversation step from the sidebar to analyze
						</p>
					{:else}
						<p class="text-sm text-muted-foreground">
							{isLoading ? 'Loading conversation data...' : 'Please select a data category from the sidebar'}
						</p>
					{/if}
				</div>
			</div>
			<div class="hidden lg:flex items-center gap-2">
				<Button variant="outline" size="sm">
					<Icon icon="lucide:help-circle" class="w-4 h-4 mr-2" />
					Help
				</Button>
				<Button variant="outline" size="sm">
					<Icon icon="lucide:settings" class="w-4 h-4 mr-2" />
					Settings
				</Button>
			</div>
		</div>

		<!-- Visualization Content Area -->
		<div class="flex-1 min-h-0">
			{#if isLoading}
				<div class="flex items-center justify-center h-full">
					<div class="flex flex-col items-center gap-4">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
						<p class="text-muted-foreground">Loading conversation data...</p>
					</div>
				</div>
			{:else if error}
				<div class="flex items-center justify-center h-full">
					<div class="flex flex-col items-center gap-4 text-center max-w-md">
						<Icon icon="lucide:alert-circle" class="w-12 h-12 text-destructive" />
						<div>
							<h3 class="text-lg font-semibold mb-2">Error Loading Data</h3>
							<p class="text-muted-foreground">{error}</p>
						</div>
						<Button on:click={loadConversationData} variant="outline">
							<Icon icon="lucide:refresh-cw" class="w-4 h-4 mr-2" />
							Retry
						</Button>
					</div>
				</div>
			{:else}
				<VisualizationPanel 
					hasData={hasVisualizationData} 
					{selectedStep}
					{lastUserQuery}
					{conversationResults}
					{scripterResults}
					{selectedViewType}
				/>
			{/if}
		</div>
	</div>
</div>