<script lang="ts">
import { onMount, onDestroy, tick } from 'svelte';
import { Button } from '$lib/components/ui/button';
import ChatSidebar from '$lib/components/ui/chat-interface/ChatSidebar.svelte';
import ChatWindow from '$lib/components/ui/chat-interface/ChatWindow.svelte';
import InstagramStepsSidebar from '$lib/components/ui/visualization/InstagramStepsSidebar.svelte';
import VisualizationPanel from '$lib/components/ui/visualization/VisualizationPanel.svelte';
import Icon from '@iconify/svelte';
	import { getDataFromURL } from '$lib/utils/generalUtils';
	import Echo from 'laravel-echo';
	import Pusher from 'pusher-js';
	import { AUTH_TOKEN } from '$lib/constants/constants.js';
	import { PUBLIC_VITE_PUSHER_APP_KEY, PUBLIC_VITE_PUSHER_APP_CLUSTER, PUBLIC_ECHO_BROADCASTER, PUBLIC_ECHO_PUSHER_HOST, PUBLIC_ECHO_PUSHER_PORT, PUBLIC_ECHO_PUSHER_SCHEME, PUBLIC_ECHO_PUSHER_ENCRYPTED, PUBLIC_API_URL } from '$env/static/public';
	import { browser } from '$app/environment';

	// UI state
	let leftSidebarVisible = true;
	let rightSidebarVisible = false; // start collapsed by default per user request
	let isMobile = false;

	// Chat state
	let selectedChatId = '';
	let currentMessages: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date, isVoiceInput: boolean}> = [];
	let conversationResults: Array<any> = [];
	let chatSidebarRef: any;

	// Visualization state
	let selectedStep = '';
	let hasVisualizationData = false;
	let scripterResults: Array<any> = [];
	let selectedViewType = 'map'; // Default to map view
	let visualizationSidebarRef: any;

	// Pusher state
	let echoInstance: any = null;
	let conversationId: string | null = null;

	// Check if we're on mobile screen
	function checkMobile() {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth < 1024;
			if (isMobile) {
				leftSidebarVisible = false;
				rightSidebarVisible = false;
			} else {
				leftSidebarVisible = true;
				// keep right sidebar collapsed by default on desktop (user requested)
				rightSidebarVisible = false;
			}
		}
	}

	// Setup Echo listener for VisualizationsDetected event
	function setupEchoListener(id: string) {
		if (!browser) {
			return;
		}

		// Clean up any existing listener
		cleanupEchoListener();

		// Initialize new Echo instance if needed
		if (!echoInstance) {
			let authToken = localStorage.getItem(AUTH_TOKEN) || false;
			(window as any).Pusher = Pusher;
			// Cast the config to any to avoid strict typing issues with the Echo generic
			echoInstance = new (Echo as any)({
				broadcaster: PUBLIC_ECHO_BROADCASTER as any,
				key: PUBLIC_VITE_PUSHER_APP_KEY,
				cluster: PUBLIC_VITE_PUSHER_APP_CLUSTER,
				auth: ({
					headers: {
						Authorization: `Bearer ${authToken}`,
						'Accept': 'application/json'
					},
					withCredentials: true
				} as any),
				authEndpoint: PUBLIC_API_URL+'/broadcasting/auth',
				encrypted: PUBLIC_ECHO_PUSHER_ENCRYPTED === 'true',
				disableStats: true,
				wsHost: PUBLIC_ECHO_PUSHER_HOST,
				wsPort: PUBLIC_ECHO_PUSHER_PORT,
				wssPort: PUBLIC_ECHO_PUSHER_PORT,
				forceTLS: PUBLIC_ECHO_PUSHER_SCHEME === 'https',
				enabledTransports: ['ws', 'wss']
			} as any);
		}

		// Listen for VisualizationsDetected event
		echoInstance.private(`App.Models.Conversation.${id}`)
			.listen('.App\\Events\\VisualizationsDetected', async (event: any) => {
				if (event && event.visualizations) {
					// Open the visualization sidebar so the user can see chart features
					rightSidebarVisible = true;

					// Wait for DOM update so the sidebar component is mounted and the ref exists
					await tick();

					// Pass auto-generated visualizations to visualization sidebar (if present)
					if (visualizationSidebarRef && visualizationSidebarRef.handleAutoVisualizations) {
						visualizationSidebarRef.handleAutoVisualizations(event.visualizations, event.session_id);
					}
				}
			});
	}

	// Cleanup function for Echo
	function cleanupEchoListener() {
		if (echoInstance && conversationId) {
			echoInstance.leave(`App.Models.Conversation.${conversationId}`);
		}
	}

	onMount(() => {
		checkMobile();

		// Setup Echo listener if we have a conversation ID
		const convFromUrl = getDataFromURL('conversation_id');
		conversationId = Array.isArray(convFromUrl) ? String(convFromUrl[0]) : (convFromUrl as string | null);
		if (conversationId) {
			setupEchoListener(conversationId);
		}

		const handleResize = () => {
			checkMobile();
		};

		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
			cleanupEchoListener();
		};
	});

	onDestroy(() => {
		cleanupEchoListener();
	});

	function toggleLeftSidebar() {
		leftSidebarVisible = !leftSidebarVisible;
	}

	function toggleRightSidebar() {
		rightSidebarVisible = !rightSidebarVisible;
	}

	function handleChatSelect(chatId: string) {
		console.log('handleChatSelect called with:', chatId);
		selectedChatId = chatId;
		console.log('selectedChatId updated to:', selectedChatId);
		currentMessages = [];

		// Ensure the left sidebar is visible when a chat is selected (helps desktop + mobile UX)
		leftSidebarVisible = true;

		// Close left sidebar on mobile after selection
		if (isMobile) {
			leftSidebarVisible = false;
		}
	}

	// Helper function to check if step data is available in conversation results
	function hasStepData(results: Array<any> = []): boolean {
		if (!results || results.length === 0) return false;
		return results.some(result => 
			result.json_data || 
			result.step_name || 
			result.step_title ||
			result.step_type ||
			(result.status && result.status !== 'pending')
		);
	}

	function handleConversationLoaded(conversationData: any) {
		console.log('Conversation loaded:', conversationData);
		if (conversationData && conversationData.success && conversationData.data) {
			// Store conversation results for processing steps first
			if (conversationData.data.results) {
				conversationResults = conversationData.data.results;
				console.log('Conversation results set:', conversationResults);
				hasVisualizationData = conversationResults.length > 0;

				// Ensure left sidebar is visible so users see the loaded conversation history
				leftSidebarVisible = true;

				// Auto-select first step if available
				if (conversationResults.length > 0 && !selectedStep) {
					selectedStep = conversationResults[0].id || 'step-0';
				}
			}

			// Transform the API messages to match our component structure
			if (conversationData.data.messages) {
				console.log('Processing messages:', conversationData.data.messages);
				
				currentMessages = conversationData.data.messages.map((msg: any, index: number) => {
					let content = msg.content || '';
					
					return {
						id: msg.id || `msg-${index}`,
						role: msg.role || 'user',
						content: content,
						timestamp: new Date(msg.created_at || Date.now()),
						isVoiceInput: false
					};
				});
				console.log('Messages set:', currentMessages);
			}
		}
	}

	function handleNewMessage(message: {id: string, role: 'user' | 'assistant', content: string, timestamp: Date, isVoiceInput: boolean}) {
		// Check if message with same ID exists (for replacing processing messages)
		const existingIndex = currentMessages.findIndex(m => m.id === message.id);

		if (existingIndex !== -1) {
			// Replace existing message
			currentMessages[existingIndex] = message;
			currentMessages = [...currentMessages];
		} else {
			// Add new message
			currentMessages = [...currentMessages, message];
		}

		// If no chat is selected, create a new one
		if (!selectedChatId) {
			selectedChatId = `new-${Date.now()}`;
		}
	}

	async function handleConversationInitiated(conversationId: string) {
		console.log('Conversation initiated, refreshing sidebar:', conversationId);
		// Update selected chat ID - convert to string to ensure consistency
		selectedChatId = String(conversationId);
		console.log('Updated selectedChatId to:', selectedChatId);
		
		// Setup Echo listener for new conversation
		setupEchoListener(conversationId);
		
		// Refresh the conversation list in the sidebar
		if (chatSidebarRef?.refreshConversations) {
			// Wait a bit to allow backend to persist the conversation
			await new Promise(resolve => setTimeout(resolve, 500));
			chatSidebarRef.refreshConversations();
		}
	}

	function handleStepSelect(stepId: string) {
		selectedStep = stepId;
		
		// Find the selected step data
		const selectedStepData = conversationResults.find(result =>
			(result.id || `step-${conversationResults.indexOf(result)}`) === stepId
		);

		// Set visualization data availability based on step data
		hasVisualizationData = !!selectedStepData;
		
		// Close right sidebar on mobile after selection
		if (isMobile) {
			rightSidebarVisible = false;
		}
		
		console.log('Step selected:', {
			stepId,
			stepData: selectedStepData,
			hasData: hasVisualizationData
		});
	}

	function handleScripterResults(results: any[], viewType: string, cardId: string) {
		scripterResults = results;
		// Show visualization data when we have scripter results
		hasVisualizationData = results.length > 0;
		// Store the selected view type directly from sidebar
		selectedViewType = viewType;
		console.log('Received scripter results from card:', cardId);
		console.log('Results:', results);
		console.log('Selected view type:', viewType);
	}
</script>

<div class="h-full flex bg-background max-h-full overflow-hidden">
	<!-- Mobile backdrop for left sidebar -->
	{#if isMobile && leftSidebarVisible}
		<div 
			class="fixed inset-0 bg-black/50 z-40 lg:hidden"
			on:click={toggleLeftSidebar}
			role="button"
			tabindex="0"
			on:keydown={(e) => e.key === 'Escape' && toggleLeftSidebar()}
		></div>
	{/if}

	<!-- Mobile backdrop for right sidebar -->
	{#if isMobile && rightSidebarVisible}
		<div 
			class="fixed inset-0 bg-black/50 z-40 lg:hidden"
			on:click={toggleRightSidebar}
			role="button"
			tabindex="0"
			on:keydown={(e) => e.key === 'Escape' && toggleRightSidebar()}
		></div>
	{/if}

	<!-- Left Sidebar - Chat History -->
	<div class={`
		${isMobile ? 'fixed' : 'relative'}
		${leftSidebarVisible ? 'translate-x-0' : '-translate-x-full'}
		${isMobile ? 'z-50' : 'z-10'}
		transition-all duration-300 ease-in-out
		${leftSidebarVisible ? 'w-80' : 'w-0'}
		flex-shrink-0 min-h-0 h-full bg-muted/30 border-r overflow-hidden
	`}>
		{#if leftSidebarVisible}
			<div class="h-full flex flex-col">
				<!-- Sidebar header with assistant title -->
				<div class="flex items-center gap-3 p-4 border-b">
					<div class="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
						<Icon icon="lucide:bot" class="w-5 h-5 text-primary-foreground" />
					</div>
					<div>
						<h2 class="font-semibold">Cyberglobes AI Assistant</h2>
						<p class="text-xs text-muted-foreground">Chat and visualize geospatial data</p>
					</div>
				</div>
				<!-- Chat list -->
				<div class="flex-1 overflow-auto">
					<ChatSidebar
						bind:this={chatSidebarRef}
						{selectedChatId}
						onChatSelect={handleChatSelect}
						onConversationLoaded={handleConversationLoaded}
					/>
				</div>
				<!-- Chat window at bottom of sidebar -->
				<div class="border-t">
					<ChatWindow
						toggleSidebar={toggleLeftSidebar}
						sidebarVisible={leftSidebarVisible}
						{isMobile}
						messages={currentMessages}
						onNewMessage={handleNewMessage}
						{conversationResults}
						{selectedChatId}
						onConversationInitiated={handleConversationInitiated}
					/>
				</div>
			</div>
		{/if}
	</div>

	<!-- Main Content Area - Chat + Visualization -->
	<div class="flex-1 flex flex-col min-w-0">
		<!-- Only sidebar toggles in header -->
		<div class="flex items-center justify-between p-2 border-b bg-background">
			<Button
				variant={leftSidebarVisible ? "ghost" : "default"}
				size="sm"
				on:click={toggleLeftSidebar}
				class={`p-2 ${!leftSidebarVisible ? 'ring-2 ring-primary/20' : ''}`}
				title={leftSidebarVisible ? 'Hide chat history' : 'Show chat history'}
			>
				<Icon icon={leftSidebarVisible ? 'lucide:sidebar-close' : 'lucide:sidebar-open'} class="w-4 h-4" />
			</Button>

			<Button
				variant={rightSidebarVisible ? "ghost" : "default"}
				size="sm"
				on:click={toggleRightSidebar}
				class={`p-2 ${!rightSidebarVisible ? 'ring-2 ring-primary/20' : ''}`}
				title={rightSidebarVisible ? 'Hide visualization panel' : 'Show visualization panel'}
			>
				<Icon icon={rightSidebarVisible ? 'lucide:panel-right-close' : 'lucide:panel-right-open'} class="w-4 h-4" />
			</Button>
		</div>

		<!-- Main Content Area -->
		<div class="flex-1 flex min-h-0">
			<!-- Visualization Panel (Center) -->
			<div class="flex-1 flex flex-col min-w-0 relative">
				<VisualizationPanel 
					hasData={hasVisualizationData} 
					{selectedStep}
					lastUserQuery=""
					{conversationResults}
					{scripterResults}
					{selectedViewType}
				/>

				<!-- Center only contains VisualizationPanel (chat moved to left sidebar) -->
			</div>
		</div>
	</div>

	<!-- Right Sidebar - Visualization Steps -->
	<div class={`
		${isMobile ? 'fixed' : 'relative'} 
		${rightSidebarVisible ? 'translate-x-0' : 'translate-x-full'} 
		${isMobile ? 'z-50' : 'z-10'}
		transition-all duration-300 ease-in-out
		${rightSidebarVisible ? 'w-80' : 'w-0'}
		h-full bg-muted/30 border-l overflow-hidden
	`}>
		{#if rightSidebarVisible}
			<InstagramStepsSidebar
				bind:this={visualizationSidebarRef}
				{selectedStep}
				onStepSelect={handleStepSelect}
				onScripterResults={handleScripterResults}
				{conversationResults}
			/>
		{/if}
	</div>
</div>
