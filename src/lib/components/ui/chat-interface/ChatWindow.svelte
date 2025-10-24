<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import MessageItem from './MessageItem.svelte';
	import ProcessingMessage from './ProcessingMessage.svelte';
	import Icon from '@iconify/svelte';
	import { MapService } from '$lib/services/map-service.js';
	import Echo from 'laravel-echo';
	import Pusher from 'pusher-js';
	import { AUTH_TOKEN, USER_LAT, USER_LNG, MAP_DEFAULT_LOCATION } from '$lib/constants/constants.js';
	import {
		PUBLIC_VITE_PUSHER_APP_KEY,
		PUBLIC_VITE_PUSHER_APP_CLUSTER,
		PUBLIC_ECHO_BROADCASTER,
		PUBLIC_ECHO_PUSHER_HOST,
		PUBLIC_ECHO_PUSHER_PORT,
		PUBLIC_ECHO_PUSHER_SCHEME,
		PUBLIC_ECHO_PUSHER_ENCRYPTED,
		PUBLIC_API_URL
	} from '$env/static/public';
	import { putDataInURL, removeDataFromURL } from '$lib/utils/generalUtils';
	import { browser } from '$app/environment';
	import { nonpassive } from 'svelte/legacy';

	export let toggleSidebar: () => void;
	export let sidebarVisible: boolean;
	export let isMobile: boolean;
	export let messages: Array<{
		id: string;
		role: 'user' | 'assistant';
		content: string;
		timestamp: Date;
		isVoiceInput: boolean;
	}> = [];
	export let onNewMessage: (message: {
		id: string;
		role: 'user' | 'assistant';
		content: string;
		timestamp: Date;
		isVoiceInput: boolean;
	}) => void;
	export let conversationResults: Array<any> = [];
	export let selectedChatId: string = '';
	export let onConversationInitiated: ((conversationId: string) => void) | undefined = undefined;

	// **Added prop for new chat handling**
	export let onChatSelect: (chatId: string) => void;

	// Service instances
	const mapService = new MapService();

	// Conversation and real-time variables
	let conversationId: string | null = null;
	let echoInstance: Echo | null = null;

	let messageInput = '';
	let messagesContainer: HTMLElement;
	let textareaEl: HTMLTextAreaElement;
	let isProcessing = false;
	let currentProcessingStep = '';
	let hasUserSentMessage = false;
	let uploadedFile: File | null = null;
	let fileInputEl: HTMLInputElement;
	let completedSteps: string[] = [];

	// Helper function to check if step data is available in conversation results
	function hasStepData(results: Array<any> = []): boolean {
		if (!results || results.length === 0) return false;
		return results.some(
			(result) =>
				result.json_data ||
				result.step_name ||
				result.step_title ||
				result.step_type ||
				(result.status && result.status !== 'pending')
		);
	}

	function generateVisualizationLink(convId: string): string {
		return `/visualization?conversation_id=${convId}`;
	}

	function appendVisualizationLink(content: string, convId: string): string {
		const visualizationLink = generateVisualizationLink(convId);
		return `${content}\n\n---\n\n🗺️ **[View Visualization](${visualizationLink})** - Interactive map view of your results`;
	}

	// Setup Echo listener for real-time updates
	function setupEchoListener(id: string) {
		if (!browser) return;
		cleanupEchoListener();

		if (!echoInstance) {
			let authToken = localStorage.getItem(AUTH_TOKEN) || false;
			(window as any).Pusher = Pusher;
			echoInstance = new (Echo as any)({
				broadcaster: PUBLIC_ECHO_BROADCASTER as any,
				key: PUBLIC_VITE_PUSHER_APP_KEY,
				cluster: PUBLIC_VITE_PUSHER_APP_CLUSTER,
				auth: {
					headers: {
						Authorization: `Bearer ${authToken}`,
						Accept: 'application/json'
					},
					withCredentials: true
				} as any,
				authEndpoint: PUBLIC_API_URL + '/broadcasting/auth',
				encrypted: PUBLIC_ECHO_PUSHER_ENCRYPTED === 'true',
				disableStats: true,
				wsHost: PUBLIC_ECHO_PUSHER_HOST,
				wsPort: PUBLIC_ECHO_PUSHER_PORT,
				wssPort: PUBLIC_ECHO_PUSHER_PORT,
				forceTLS: PUBLIC_ECHO_PUSHER_SCHEME === 'https',
				enabledTransports: ['ws', 'wss']
			} as any);
		}

		echoInstance
			.private(`App.Models.Conversation.${id}`)
			.listen('.App\\Events\\TodoReceived', (event: any) => {
				if (event && event.todos) {
					conversationResults = event.todos.map((todo: any) => ({
						id: todo.id,
						step_name: todo.id,
						step_title: todo.title,
						step_type: todo.type,
						status: todo.status,
						created_at: todo.created_at,
						updated_at: todo.updated_at
					}));
				}
			})
			.listen('.App\\Events\\TodoStarted', (event: any) => {
				if (event && event.todo) {
					const todoIndex = conversationResults.findIndex(
						(result: any) => result.id === event.todo.id
					);
					if (todoIndex !== -1) {
						conversationResults[todoIndex] = {
							...conversationResults[todoIndex],
							status: 'inprogress',
							updated_at: event.todo.updated_at || new Date().toISOString()
						};
						conversationResults = [...conversationResults];
					}
				}
			})
			.listen('.App\\Events\\TodoFinished', (event: any) => {
				if (event && event.todo) {
					const todoIndex = conversationResults.findIndex(
						(result: any) => result.id === event.todo.id
					);
					if (todoIndex !== -1) {
						conversationResults[todoIndex] = {
							...conversationResults[todoIndex],
							status: event.todo.status || 'completed',
							error_details: event.todo.error_details,
							json_data: event.todo.json_data,
							updated_at: event.todo.updated_at || new Date().toISOString()
						};
						conversationResults = [...conversationResults];
					}
				}
			})
			.listen('.App\\Events\\FinalizingConversation', (event: any) => {
				if (event && event.result) {
					const finalizationStep = {
						id: event.result.id,
						step_name: event.result.id,
						step_title: event.result.title,
						step_type: event.result.type,
						status: event.result.status,
						error_details: event.result.error_details,
						json_data: event.result.json_data,
						created_at: event.result.created_at,
						updated_at: event.result.updated_at || new Date().toISOString()
					};
					conversationResults = [...conversationResults, finalizationStep];
				}
			})
			.listen('.App\\Events\\MessageReceived', (event: any) => {
				if (event && event.message) {
					if (event.result) {
						const resultIndex = conversationResults.findIndex(
							(result: any) => result.id === event.result.id
						);
						if (resultIndex !== -1) {
							conversationResults[resultIndex] = {
								...conversationResults[resultIndex],
								step_name: event.result.id,
								step_title: event.result.title,
								step_type: event.result.type,
								status: event.result.status || 'completed',
								error_details: event.result.error_details,
								json_data: event.result.json_data,
								updated_at: event.result.updated_at || new Date().toISOString()
							};
							conversationResults = [...conversationResults];
						} else {
							const finalResponseStep = {
								id: event.result.id,
								step_name: event.result.id,
								step_title: event.result.title,
								step_type: event.result.type,
								status: event.result.status || 'completed',
								error_details: event.result.error_details,
								json_data: event.result.json_data,
								created_at: event.result.created_at,
								updated_at: event.result.updated_at || new Date().toISOString()
							};
							conversationResults = [...conversationResults, finalResponseStep];
						}
					}

					isProcessing = false;
					let messageContent = event.message.content || event.message;

					if (conversationId && (hasStepData(conversationResults) || event.has_step_data)) {
						messageContent = appendVisualizationLink(messageContent, conversationId);
					}

					const assistantMessage = {
						id: `assistant-${Date.now()}`,
						role: 'assistant' as const,
						content: messageContent,
						timestamp: new Date(),
						isVoiceInput: false
					};
					onNewMessage(assistantMessage);
					currentProcessingStep = '';
				}
			});
	}

	function cleanupEchoListener() {
		if (echoInstance && conversationId) {
			echoInstance.leave(`App.Models.Conversation.${conversationId}`);
		}
	}

	$: processSteps = generateProcessSteps(conversationResults);

	$: if (conversationResults && conversationResults.length > 0 && !currentProcessingStep) {
		displayExistingResults();
	}

	function getStepIcon(stepType: string): string {
		const iconMap: Record<string, string> = {
			analysis: 'lucide:brain',
			planning: 'lucide:list-checks',
			ai: 'lucide:cpu',
			service: 'lucide:search',
			scripter: 'lucide:cog',
			'ai-image': 'lucide:image',
			default: 'lucide:play-circle'
		};
		return iconMap[stepType] || iconMap['default'];
	}

	function generateProcessSteps(results: Array<any>) {
		const steps = [];
		if (results && results.length > 0) {
			steps.push({
				title: 'Understanding the user input...',
				description: 'Analyzing your query and requirements to determine the best approach.',
				status: 'completed',
				icon: 'lucide:brain',
				stepType: 'analysis'
			});
			steps.push({
				title: `Creating ${results.length} Todos`,
				description: 'Breaking down the task into manageable steps for data collection and analysis.',
				status: 'completed',
				icon: 'lucide:list-checks',
				stepType: 'planning'
			});
			results.forEach((result, index) => {
				const stepType = result.step_type?.toLowerCase() || 'default';
				steps.push({
					title: `${result.step_name?.toUpperCase()}: ${result.step_title}`,
					description: result.step_type,
					status: result.status,
					error_details: result.error_details,
					json_data: result.json_data,
					icon: getStepIcon(stepType),
					stepType: stepType
				});
			});
		} else {
			steps.push(
				{
					title: 'Understanding the user input...',
					description: 'Analyzing your query and requirements to determine the best approach.',
					status: 'inprogress',
					icon: 'lucide:brain',
					stepType: 'analysis'
				},
				{
					title: 'Creating Todos',
					description:
						'Breaking down the task into manageable steps for data collection and analysis.',
					status: 'todo',
					icon: 'lucide:list-checks',
					stepType: 'planning'
				}
			);
		}
		return steps;
	}

	function formatStepWithStatus(step: any): string {
		let formattedTitle = `**${step.title}**`;
		let description = step.description;
		if (step.status === 'failed' && step.error_details) {
			description += `\n\n**Error:** ${step.error_details}`;
		}
		return `${formattedTitle}\n${description}`;
	}

	function displayExistingResults() {
		completedSteps = processSteps.map(step => formatStepWithStatus(step));
		currentProcessingStep = completedSteps.join('\n\n');

		const shouldAddVisualizationLink =
			hasStepData(conversationResults) ||
			(conversationResults && conversationResults.length > 0) ||
			currentProcessingStep.includes('View Step Data');

		let convId = conversationId || selectedChatId;
		if (!convId || String(convId).startsWith('new-')) {
			const resultWithId = conversationResults.find(result => result.conversation_id);
			if (resultWithId) convId = resultWithId.conversation_id.toString();
		}
		if (!convId || String(convId).startsWith('new-')) {
			const urlParams = new URLSearchParams(window.location.search);
			const urlConvId = urlParams.get('conversation_id');
			if (urlConvId) convId = urlConvId;
		}

		const convIdStr = String(convId);
		if (convId && !convIdStr.startsWith('new-')) {
			const visualizationLink = generateVisualizationLink(convIdStr);
			currentProcessingStep += `\n\n---\n\n🗺️ **[View Visualization](${visualizationLink})** - Interactive map view of your results`;
		}

		isProcessing = false;
	}

	function autoResize() {
		if (textareaEl) {
			textareaEl.style.height = 'auto';
			textareaEl.style.height = Math.min(textareaEl.scrollHeight, 120) + 'px';
		}
	}

	function handleFileUpload() {
		fileInputEl?.click();
	}

	function onFileSelected(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) uploadedFile = file;
	}

	function removeFile() {
		uploadedFile = null;
		if (fileInputEl) fileInputEl.value = '';
	}

	async function sendMessage() {
		if ((!messageInput.trim() && !uploadedFile) || isProcessing) return;

		const userQuery = messageInput.trim();
		const userMessage = {
			id: Date.now().toString(),
			role: 'user' as const,
			content: uploadedFile
				? `📎 **File uploaded:** ${uploadedFile.name}\n\n${userQuery || 'Please analyze this file.'}`
				: userQuery,
			timestamp: new Date(),
			isVoiceInput: false
		};

		onNewMessage(userMessage);
		messageInput = '';
		uploadedFile = null;
		if (fileInputEl) fileInputEl.value = '';
		isProcessing = true;
		completedSteps = [];
		if (textareaEl) textareaEl.style.height = 'auto';

		const authToken = localStorage.getItem(AUTH_TOKEN);
		const lat = localStorage.getItem(USER_LAT) || MAP_DEFAULT_LOCATION.lat.toString();
		const lng = localStorage.getItem(USER_LNG) || MAP_DEFAULT_LOCATION.lng.toString();

		try {
			const payload = {
				message: userQuery,
				latitude: parseFloat(lat),
				longitude: parseFloat(lng)
			};

			const response = await mapService.getInsights(payload);

			if (response && response.success && response.conversation_id) {
				conversationId = response.conversation_id;
				putDataInURL('conversation_id', conversationId);
				setupEchoListener(conversationId);

				if (onConversationInitiated) onConversationInitiated(conversationId);
			} else throw new Error(response?.message || 'Failed to initiate conversation');
		} catch (error) {
			isProcessing = false;
			const errorMessage = {
				id: `error-${Date.now()}`,
				role: 'assistant' as const,
				content: `❌ **Error starting conversation**\n\nSorry, I encountered an error while processing your request. Please try again.`,
				timestamp: new Date(),
				isVoiceInput: false
			};
			onNewMessage(errorMessage);
			return;
		}

		currentProcessingStep =
			"🤖 **Processing your request...**\n\nI'm analyzing your query and preparing the response. This may take a moment.";
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	afterUpdate(() => {
		if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
	});

	onMount(() => {
		if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
		if (selectedChatId && !selectedChatId.startsWith('new-')) {
			conversationId = selectedChatId;
			setupEchoListener(conversationId);
		}

		return () => cleanupEchoListener();
	});

	// Fixed function to start new chat
	async function createNewChat() {
		// Stop listening to old conversation
		cleanupEchoListener();

		// Remove conversation ID from URL
		removeDataFromURL('conversation_id');

		// Reset all chat-related state
		const newChatId = `new-${Date.now()}`;
		selectedChatId = newChatId;
		conversationId = null;
		messages = [];
		conversationResults = [];
		currentProcessingStep = '';
		completedSteps = [];
		isProcessing = false;

		// Notify parent component
		if (onChatSelect) onChatSelect(newChatId);

		console.log('New chat session started, ready for first message');
	}
</script>

<div class="h-full flex flex-col">
    <!-- Chat Header: only show when sidebar is hidden (floating/chat center) -->
    {#if !sidebarVisible}
    <div class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div class="flex items-center gap-3">
            <Button
                variant={sidebarVisible ? "ghost" : "default"}
                size="sm"
                on:click={toggleSidebar}
                class={`p-2 lg:flex ${!sidebarVisible ? 'ring-2 ring-primary/20' : ''}`}
                title={sidebarVisible ? 'Hide chat history' : 'Show chat history'}
            >
                <Icon icon={sidebarVisible ? 'lucide:sidebar-close' : 'lucide:sidebar-open'} class="w-4 h-4" />
            </Button>
<!--            
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                    <Icon icon="lucide:bot" class="w-5 h-5 text-primary-foreground" />
                </div> -->
                <!-- <div>
                    <h1 class="font-semibold text-xl">Cyberglobes AI Assistant</h1>
                    <p class="text-sm text-muted-foreground">Ask me anything about geospatial data and mapping</p>
                </div> -->
            <!-- </div> -->
        </div>
    </div>
    {/if}
 
    <!-- Messages Container -->
    <div class="flex flex-col h-full">
 
    <!-- Scrollable messages area -->
    <div
    bind:this={messagesContainer}
    class="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth hide-scrollbar"
>
    {#if messages.length === 0}
        <div class="flex items-center justify-center h-full">
            <div class="text-center max-w-md">
                <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 mt-0">
                    <Icon icon="lucide:bot" class="w-8 h-8 text-primary" />
                </div>
                <div class="text-xs text-muted-foreground text-center mt-2 italic">
                    Cyberglobes AI is ready to help. Ask anything!
                </div>
            </div>
        </div>
    {:else}
        {#each messages as message (message.id)}
            <MessageItem {message} />
        {/each}
 
        {#if currentProcessingStep}
            <ProcessingMessage
                content={currentProcessingStep}
                steps={processSteps}
                isComplete={!isProcessing}
            />
        {/if}
    {/if}  
</div>
 
<style>
.hide-scrollbar {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
}
 
.hide-scrollbar::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Edge */
}
</style>
 
    <div class="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 sticky bottom-0 z-10">
  <form on:submit|preventDefault={sendMessage} class="flex items-end gap-3">
   
    <input
      bind:this={fileInputEl}
      type="file"
      on:change={onFileSelected}
      accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.json,.xml"
      class="hidden"
    />
 
    <div class="flex-1 flex flex-col">
      {#if uploadedFile}
        <div class="mb-2 p-2 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Icon icon="lucide:paperclip" class="w-4 h-4 text-muted-foreground" />
            <span class="text-sm font-medium">{uploadedFile.name}</span>
            <span class="text-xs text-muted-foreground">({Math.round(uploadedFile.size / 1024)} KB)</span>
          </div>
          <button type="button" on:click={() => uploadedFile = null} class="text-muted-foreground hover:text-foreground">
            <Icon icon="lucide:x" class="w-4 h-4" />
          </button>
        </div>
      {/if}
 
      <div class="flex items-center gap-2 bg-muted/20 rounded-2xl p-3 border border-border/50 focus-within:border-primary/50 transition-colors">
        <textarea
          bind:this={textareaEl}
          bind:value={messageInput}
          on:input={autoResize}
          on:keydown={handleKeydown}
          placeholder="Ask anything..."
          class="flex-1 bg-transparent border-0 outline-none resize-none max-h-[120px] text-sm leading-6 py-1"
          rows="1"
          disabled={isProcessing}
        ></textarea>
 
        <button type="button" on:click={() => fileInputEl.click()} class="p-2 rounded-xl text-muted-foreground hover:text-foreground" title="Attach file">
          <Icon icon="lucide:paperclip" class="w-5 h-5" />
        </button>
 
        <button type="submit" class="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center">
          <Icon icon={isProcessing ? "lucide:loader-2" : "lucide:send"} class={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
 
  </form>
 
 
</div>
 
</div>
 
</div>