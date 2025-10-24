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
	import { browser } from '$app/environment';

	// UI state
	let leftSidebarVisible = true;
	let rightSidebarVisible = false;
	let isMobile = false;
	let chatWindowHeight = 50;
	let isDragging = false;
	let startY = 0;
	let startHeight = 0;

	function startDrag(event: MouseEvent) {
		isDragging = true;
		startY = event.clientY;
		startHeight = chatWindowHeight;

		function onMouseMove(e: MouseEvent) {
			if (!isDragging) return;
			const delta = e.clientY - startY;
			const newHeight = Math.min(Math.max(30, startHeight + delta / 5), 70);
			chatWindowHeight = newHeight;
		}

		function onMouseUp() {
			isDragging = false;
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		}

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}

	// Chat state
	let selectedChatId = '';
	let currentMessages: Array<{
		id: string;
		role: 'user' | 'assistant';
		content: string;
		timestamp: Date;
		isVoiceInput: boolean;
	}> = [];
	let conversationResults: Array<any> = [];
	let chatSidebarRef: any;

	// Visualization state
	let selectedStep = '';
	let hasVisualizationData = false;
	let scripterResults: Array<any> = [];
	let selectedViewType = 'map';
	let visualizationSidebarRef: any;

	// Pusher state
	let echoInstance: any = null;
	let conversationId: string | null = null;

	// Fix #1: prevent auto sidebar reopening loop
	let hasOpenedVisualizationOnce = false;

	// Check if we're on mobile
	function checkMobile() {
		if (typeof window !== 'undefined') {
			const wasLastMobile = isMobile;
			isMobile = window.innerWidth < 1024;

			if (isMobile) {
				leftSidebarVisible = false;
				rightSidebarVisible = false;
			} else if (!wasLastMobile) {
				leftSidebarVisible = true;
				rightSidebarVisible = false;
			}
		}
	}

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
			.listen('.App\\Events\\VisualizationsDetected', async (event: any) => {
				if (event && event.visualizations) {
					rightSidebarVisible = false;
					await tick();
					if (visualizationSidebarRef?.handleAutoVisualizations) {
						visualizationSidebarRef.handleAutoVisualizations(
							event.visualizations,
							event.session_id
						);
					}
				}
			});
	}

	function cleanupEchoListener() {
		if (echoInstance && conversationId) {
			echoInstance.leave(`App.Models.Conversation.${conversationId}`);
		}
	}

	onMount(() => {
		checkMobile();
		const convFromUrl = getDataFromURL('conversation_id');
		conversationId = Array.isArray(convFromUrl)
			? String(convFromUrl[0])
			: (convFromUrl as string | null);
		if (conversationId) {
			setupEchoListener(conversationId);
		}

		const handleResize = () => checkMobile();
		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
			cleanupEchoListener();
		};
	});

	onDestroy(() => cleanupEchoListener());

	function toggleLeftSidebar() {
		leftSidebarVisible = !leftSidebarVisible;
	}

	function toggleRightSidebar() {
		rightSidebarVisible = !rightSidebarVisible;
	}

	function handleChatSelect(chatId: string) {
		selectedChatId = chatId;
		currentMessages = [];
		leftSidebarVisible = true;
		rightSidebarVisible = false;
		if (isMobile) leftSidebarVisible = false;
	}

	function hasStepData(results: Array<any> = []): boolean {
		if (!results || results.length === 0) return false;
		return results.some(
			(r) =>
				r.json_data ||
				r.step_name ||
				r.step_title ||
				r.step_type ||
				(r.status && r.status !== 'pending')
		);
	}

	function handleConversationLoaded(conversationData: any) {
		if (conversationData && conversationData.success && conversationData.data) {
			if (conversationData.data.results) {
				conversationResults = conversationData.data.results;
				hasVisualizationData = conversationResults.length > 0;
				leftSidebarVisible = true;
				rightSidebarVisible = false;
				if (conversationResults.length > 0 && !selectedStep) {
					selectedStep = conversationResults[0].id || 'step-0';
				}
			}

			if (conversationData.data.messages) {
				currentMessages = conversationData.data.messages.map((msg: any, i: number) => ({
					id: msg.id || `msg-${i}`,
					role: msg.role || 'user',
					content: msg.content || '',
					timestamp: new Date(msg.created_at || Date.now()),
					isVoiceInput: false
				}));
			}
		}
	}

	function handleNewMessage(message: any) {
		const existingIndex = currentMessages.findIndex((m) => m.id === message.id);
		if (existingIndex !== -1) {
			currentMessages[existingIndex] = message;
			currentMessages = [...currentMessages];
		} else {
			currentMessages = [...currentMessages, message];
		}
		if (!selectedChatId) selectedChatId = `new-${Date.now()}`;
		rightSidebarVisible = false;
	}

	async function handleConversationInitiated(convId: string) {
		selectedChatId = String(convId);
		setupEchoListener(convId);
		if (chatSidebarRef?.refreshConversations) {
			await new Promise((r) => setTimeout(r, 500));
			chatSidebarRef.refreshConversations();
		}
		rightSidebarVisible = false;
	}

	// ✅ FIXED Reactive block: opens sidebar only once when data first available
	$: {
		if (conversationResults.length > 0 && hasVisualizationData && !hasOpenedVisualizationOnce) {
			rightSidebarVisible = true;
			hasOpenedVisualizationOnce = true;
		}
	}

	function handleStepSelect(stepId: string) {
		selectedStep = stepId;
		const selectedStepData = conversationResults.find(
			(r) => (r.id || `step-${conversationResults.indexOf(r)}`) === stepId
		);
		hasVisualizationData = !!selectedStepData;
		if (isMobile) rightSidebarVisible = false;
	}

	function handleScripterResults(results: any[], viewType: string) {
		scripterResults = results;
		hasVisualizationData = results.length > 0;
		selectedViewType = viewType;
	}

	// ✅ FIXED dynamic class for top bar (evaluates correctly)
	$: topBarClasses = `
		fixed top-0 h-12 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b
		flex items-center justify-between px-4 z-20 transition-all duration-300 ease-in-out
		${isMobile ? '!left-0 !right-0' : `${leftSidebarVisible ? 'left-[400px]' : 'left-0'} ${rightSidebarVisible ? 'right-[360px]' : 'right-0'}`}
	`;
</script>

<div class="h-full flex bg-background max-h-full overflow-hidden">
	<!-- Mobile backdrop -->
	{#if isMobile && (leftSidebarVisible || rightSidebarVisible)}
		<div
			class="fixed inset-0 bg-black/50 z-40 lg:hidden"
			on:click={() => {
				if (leftSidebarVisible) toggleLeftSidebar();
				if (rightSidebarVisible) toggleRightSidebar();
			}}
			role="button"
			tabindex="0"
			on:keydown={(e) => {
				if (e.key === 'Escape') {
					if (leftSidebarVisible) toggleLeftSidebar();
					if (rightSidebarVisible) toggleRightSidebar();
				}
			}}
		></div>
	{/if}

	<!-- Left Sidebar -->
	<div
		class={`${
			isMobile ? 'fixed left-0' : ''
		} ${!isMobile && !leftSidebarVisible ? 'w-0' : 'w-[400px]'} ${
			isMobile ? 'z-50' : 'z-30'
		} transition-all duration-300 ease-in-out flex-shrink-0 h-full bg-background border-r shadow-lg overflow-hidden`}
	>
		<div
			class={`${
				!leftSidebarVisible ? '-translate-x-full' : 'translate-x-0'
			} transition-transform duration-300 w-[400px] h-full`}
		>
			{#if leftSidebarVisible}
				<div class="h-full flex flex-col">
					<!-- Header -->
					<div
						class="flex items-center gap-3 p-1 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
					>
						<div
							class="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center"
						>
							<Icon icon="lucide:bot" class="w-5 h-5 text-primary-foreground" />
						</div>
						<div>
							<h2 class="font-semibold">Cyberglobes AI Assistant</h2>
							<p class="text-xs text-muted-foreground">Chat and visualize geospatial data</p>
						</div>
					</div>

					<!-- Chat and History -->
					<div class="flex-1 flex flex-col overflow-hidden">
						<div class="border-b overflow-hidden" style="height: {chatWindowHeight}%">
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

						<div
							class="h-1.5 bg-muted/50 hover:bg-muted/70 cursor-ns-resize flex justify-center items-center relative"
							on:mousedown={startDrag}
						>
							<div class="w-10 h-0.5 bg-muted-foreground/50 rounded-full"></div>
						</div>

						<div class="flex-1 overflow-y-auto">
							<ChatSidebar
								bind:this={chatSidebarRef}
								{selectedChatId}
								onChatSelect={handleChatSelect}
								onConversationLoaded={handleConversationLoaded}
							/>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Main Content -->
	<div class="flex-1 flex flex-col min-w-0 relative bg-white">
		<!-- ✅ Top Bar -->
		<div class={topBarClasses}>
			<div>
				<Button
					variant="ghost"
					size="sm"
					on:click={toggleLeftSidebar}
					class="p-2"
					title={leftSidebarVisible ? 'Hide chat' : 'Show chat'}
				>
					<Icon icon={leftSidebarVisible ? 'lucide:chevrons-left' : 'lucide:menu'} class="w-7 h-7" />
				</Button>
			</div>

			<div class="font-medium">Data Visualization</div>

			<div class="flex items-center gap-2">
				<div class="hidden lg:flex items-center gap-2">
					<Button variant="ghost" size="sm" class="gap-2">
						<Icon icon="lucide:help-circle" class="w-4 h-4" />
			<span class="hidden xl:inline">Help</span>
					</Button>
					<Button variant="ghost" size="sm" class="gap-2">
						<Icon icon="lucide:settings" class="w-4 h-4" />
						<span class="hidden xl:inline">Settings</span>
					</Button>
				</div>

				<Button
					variant="ghost"
					size="sm"
					on:click={toggleRightSidebar}
					class="p-2"
					title={rightSidebarVisible ? 'Hide steps' : 'Show steps'}
				>
					<Icon icon={rightSidebarVisible ? 'lucide:x' : 'lucide:align-right'} class="w-7 h-7" />
				</Button>
			</div>
		</div>

		<!-- Visualization Panel -->
		<div class="flex-1 min-h-0 h-full pt-12">
			<VisualizationPanel
				hasData={hasVisualizationData}
				{selectedStep}
				lastUserQuery=""
				{conversationResults}
				{scripterResults}
				{selectedViewType}
			/>
		</div>
	</div>

	<!-- Right Sidebar -->
	<div
		class={`${
			isMobile ? 'fixed right-0' : ''
		} ${!isMobile && !rightSidebarVisible ? 'w-0' : 'w-[360px]'} ${
			isMobile ? 'z-50' : 'z-30'
		} transition-all duration-300 ease-in-out flex-shrink-0 h-full bg-background border-l shadow-lg overflow-hidden`}
	>
		<div
			class={`${
				!rightSidebarVisible ? 'translate-x-full pointer-events-none opacity-0' : 'translate-x-0 opacity-100'
			} transition-transform duration-300 w-[360px] h-full`}
		>
			<InstagramStepsSidebar
				bind:this={visualizationSidebarRef}
				{selectedStep}
				onStepSelect={handleStepSelect}
				onScripterResults={handleScripterResults}
				{conversationResults}
			/>
		</div>
	</div>
</div>
