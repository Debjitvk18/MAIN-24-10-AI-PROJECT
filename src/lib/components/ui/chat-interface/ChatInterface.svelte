<script lang="ts">
	import { onMount } from 'svelte';
	import ChatSidebar from './ChatSidebar.svelte';
	import ChatWindow from './ChatWindow.svelte';
	import { chatStore } from '$lib/stores/chatStore';

	let sidebarVisible = true;
	let isMobile = false;
	let selectedChatId = '';
	let currentMessages: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date, isVoiceInput: boolean}> = [];
	let conversationResults: Array<any> = [];
	let chatSidebarRef: any;

	// Mock conversation data
	const mockConversations: {[key: string]: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date, isVoiceInput: boolean}>} = {
		'1': [
			{
				id: '1-1',
				role: 'user',
				content: 'Can you help me find restaurants near Times Square?',
				timestamp: new Date('2024-01-15T14:31:00'),
				isVoiceInput: false
			},
			{
				id: '1-2',
				role: 'assistant',
				content: 'Absolutely! I can help you find restaurants near Times Square. There are many great options in that area.',
				timestamp: new Date('2024-01-15T14:31:30'),
				isVoiceInput: false
			}
		],
		'2': [
			{
				id: '2-1',
				role: 'user',
				content: 'What are the property values in Manhattan?',
				timestamp: new Date('2024-01-15T10:15:00'),
				isVoiceInput: false
			},
			{
				id: '2-2',
				role: 'assistant',
				content: 'Property values in Manhattan vary significantly by neighborhood. Let me provide you with current market data.',
				timestamp: new Date('2024-01-15T10:15:30'),
				isVoiceInput: false
			}
		],
		'3': [
			{
				id: '3-1',
				role: 'user',
				content: 'Show me traffic patterns during rush hour',
				timestamp: new Date('2024-01-14T16:45:00'),
				isVoiceInput: false
			},
			{
				id: '3-2',
				role: 'assistant',
				content: 'Here\'s the traffic analysis for rush hour patterns in your area of interest.',
				timestamp: new Date('2024-01-14T16:45:30'),
				isVoiceInput: false
			}
		]
	};

	// Check if we're on mobile screen
	function checkMobile() {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth < 1024; // Use larger breakpoint for better UX
			if (isMobile) {
				sidebarVisible = false;
			} else {
				sidebarVisible = true; // Always show on desktop in frontend layout
			}
		}
	}

	onMount(() => {
		checkMobile();
		
		const handleResize = () => {
			checkMobile();
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	function toggleSidebar() {
		sidebarVisible = !sidebarVisible;
	}

	function handleChatSelect(chatId: string) {
		console.log('handleChatSelect called with:', chatId);
		selectedChatId = chatId;
		console.log('selectedChatId updated to:', selectedChatId);
		currentMessages = mockConversations[chatId] || [];

		// Close sidebar on mobile after selection
		if (isMobile) {
			sidebarVisible = false;
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

	// Helper function to append visualization link to content
	function appendVisualizationLink(content: string, convId: string): string {
		const visualizationLink = `/visualization?conversation_id=${convId}`;
		return `${content}\n\n---\n\n🗺️ **[View Visualization](${visualizationLink})** - Interactive map view of your results`;
	}

	function handleConversationLoaded(conversationData: any) {
		console.log('Conversation loaded:', conversationData);
		if (conversationData && conversationData.success && conversationData.data) {
			// Store conversation results for processing steps first
			if (conversationData.data.results) {
				conversationResults = conversationData.data.results;
				console.log('Conversation results set:', conversationResults);
			}

			// Transform the API messages to match our component structure
			if (conversationData.data.messages) {
				console.log('Processing messages:', conversationData.data.messages);
				console.log('Conversation ID from data:', conversationData.data.conversation_id);
				console.log('Has step data:', hasStepData(conversationResults));
				
				currentMessages = conversationData.data.messages.map((msg: any, index: number) => {
					let content = msg.content || '';
					console.log(`Message ${index}: role=${msg.role}, isLast=${index === conversationData.data.messages.length - 1}`);
					
					// If this is the final assistant message and we have step data, append visualization link
					if (msg.role === 'assistant' && 
						index === conversationData.data.messages.length - 1 && 
						hasStepData(conversationResults)) {
						
						// Try to get conversation ID from multiple sources
						let convId = conversationData.data.conversation_id || 
									conversationData.data.id ||
									(conversationResults.length > 0 ? conversationResults[0].conversation_id : null);
						
						// Fallback: extract from URL
						if (!convId) {
							const urlParams = new URLSearchParams(window.location.search);
							convId = urlParams.get('conversation_id');
						}
						
						console.log('Final conversation ID for visualization:', convId);
						
						if (convId) {
							content = appendVisualizationLink(content, convId.toString());
							console.log('Added visualization link to final message');
						}
					}
					
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
		// Refresh the conversation list in the sidebar
		if (chatSidebarRef?.refreshConversations) {
			// Wait a bit to allow backend to persist the conversation
			await new Promise(resolve => setTimeout(resolve, 500));
			chatSidebarRef.refreshConversations();
		}
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
			<ChatSidebar
				bind:this={chatSidebarRef}
				{selectedChatId}
				onChatSelect={handleChatSelect}
				onConversationLoaded={handleConversationLoaded}
			/>
		{/if}
	</div>

	<!-- Main Chat Area -->
	<div class={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarVisible ? '' : 'ml-0'}`}>
		<ChatWindow
			{toggleSidebar}
			{sidebarVisible}
			{isMobile}
			messages={currentMessages}
			onNewMessage={handleNewMessage}
			{conversationResults}
			{selectedChatId}
			onConversationInitiated={handleConversationInitiated}
		/>
	</div>
</div>