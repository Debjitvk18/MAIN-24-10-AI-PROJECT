<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import MessageItem from './MessageItem.svelte';
	import ProcessingMessage from './ProcessingMessage.svelte';
	import Icon from '@iconify/svelte';

	export let toggleSidebar: () => void;
	export let sidebarVisible: boolean;
	export let isMobile: boolean;
	export let messages: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date, isVoiceInput: boolean}> = [];
	export let onNewMessage: (message: {id: string, role: 'user' | 'assistant', content: string, timestamp: Date, isVoiceInput: boolean}) => void;

	let messageInput = '';
	let messagesContainer: HTMLElement;
	let textareaEl: HTMLTextAreaElement;
	let isProcessing = false;
	let currentProcessingStep = '';
	let hasUserSentMessage = false;
	let uploadedFile: File | null = null;
	let fileInputEl: HTMLInputElement;
	let completedSteps: string[] = [];

	const processSteps = [
		{
			title: "Understanding the user input...",
			description: "Analyzing your query and requirements to determine the best approach."
		},
		{
			title: "Creating 5 Todos",
			description: "Breaking down the task into manageable steps for data collection and analysis."
		},
		{
			title: "1. Scrapping Instagram Posts",
			description: "Collecting relevant Instagram posts based on your criteria."
		},
		{
			title: "2. Scrapping Instagram Likes", 
			description: "Gathering engagement data and like patterns from the posts."
		},
		{
			title: "3. Scrapping Instagram Comments",
			description: "Extracting comments and user interactions for sentiment analysis."
		},
		{
			title: "4. Analyzing using AI",
			description: "Processing collected data through our AI models for insights."
		},
		{
			title: "5. Finalizing the output",
			description: "Compiling results and preparing your comprehensive analysis report."
		}
	];

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
		if (file) {
			uploadedFile = file;
		}
	}

	function removeFile() {
		uploadedFile = null;
		if (fileInputEl) {
			fileInputEl.value = '';
		}
	}

	async function sendMessage() {
		if ((!messageInput.trim() && !uploadedFile) || isProcessing || hasUserSentMessage) return;

		const userMessage = {
			id: Date.now().toString(),
			role: 'user' as const,
			content: uploadedFile 
				? `📎 **File uploaded:** ${uploadedFile.name}\n\n${messageInput.trim() || 'Please analyze this file.'}` 
				: messageInput.trim(),
			timestamp: new Date(),
			isVoiceInput: false
		};

		onNewMessage(userMessage);
		messageInput = '';
		uploadedFile = null;
		if (fileInputEl) {
			fileInputEl.value = '';
		}
		isProcessing = true;
		hasUserSentMessage = true;
		completedSteps = [];

		// Reset textarea height
		if (textareaEl) {
			textareaEl.style.height = 'auto';
		}

		// Show processing steps progressively
		for (let i = 0; i < processSteps.length; i++) {
			const step = processSteps[i];
			completedSteps = [...completedSteps, `**${step.title}**\n${step.description}`];
			currentProcessingStep = completedSteps.join('\n\n');
			await new Promise(resolve => setTimeout(resolve, 3000));
		}

		// Keep the processing display visible - don't clear it
		// The final message will appear below the processing steps
		
		// Small delay before showing final message
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		const finalMessage = {
			id: `final-${Date.now()}`,
			role: 'assistant' as const,
			content: `**Here's the final output**

Your comprehensive analysis is ready! 🎯

<a href="/visualization" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium no-underline">
	📊 View Visualization
</a>`,
			timestamp: new Date(),
			isVoiceInput: false
		};

		onNewMessage(finalMessage);
		isProcessing = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	// Scroll to bottom when new messages are added
	afterUpdate(() => {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	});

	onMount(() => {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	});
</script>

<div class="h-full flex flex-col">
	<!-- Chat Header -->
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
			
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
					<Icon icon="lucide:bot" class="w-5 h-5 text-primary-foreground" />
				</div>
				<div>
					<h1 class="font-semibold text-xl">Cyberglobes AI Assistant</h1>
					<p class="text-sm text-muted-foreground">Ask me anything about geospatial data and mapping</p>
				</div>
			</div>
			
			<div class="ml-auto flex items-center gap-2">
				<Button variant="ghost" size="sm" class="p-2" title="Clear conversation">
					<Icon icon="lucide:trash-2" class="w-4 h-4" />
				</Button>
				<Button variant="ghost" size="sm" class="p-2" title="More options">
					<Icon icon="lucide:more-horizontal" class="w-4 h-4" />
				</Button>
			</div>
		</div>
	</div>

	<!-- Messages Container -->
	<div 
		bind:this={messagesContainer}
		class="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
	>
		{#if messages.length === 0}
			<!-- Welcome/Empty State -->
			<div class="flex items-center justify-center h-full">
				<div class="text-center max-w-md">
					<div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
						<Icon icon="lucide:bot" class="w-8 h-8 text-primary" />
					</div>
					<h2 class="text-xl font-semibold text-foreground mb-2">Cyberglobes AI Assistant</h2>
					<p class="text-muted-foreground mb-6">Ask me anything about geospatial data, mapping, and location-based insights. I'm here to help!</p>
					<div class="text-sm text-muted-foreground">
						<p>Try asking about:</p>
						<ul class="mt-2 space-y-1">
							<li>• Location analysis and mapping</li>
							<li>• Geographic data visualization</li>
							<li>• Spatial patterns and trends</li>
						</ul>
					</div>
				</div>
			</div>
		{:else}
			{#each messages as message (message.id)}
				{#if message.role === 'user'}
					<MessageItem {message} />
				{/if}
			{/each}
			
			<!-- Processing Display -->
			{#if currentProcessingStep}
				<ProcessingMessage content={currentProcessingStep} isComplete={!isProcessing} />
			{/if}
			
			{#each messages as message (message.id)}
				{#if message.role === 'assistant'}
					<MessageItem {message} />
				{/if}
			{/each}
		{/if}
	</div>

	<!-- Input Area -->
	<div class="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-6">
		<!-- File Upload Preview -->
		{#if uploadedFile}
			<div class="mb-4 p-3 bg-muted/50 rounded-lg border border-border/50 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Icon icon="lucide:paperclip" class="w-4 h-4 text-muted-foreground" />
					<span class="text-sm font-medium">{uploadedFile.name}</span>
					<span class="text-xs text-muted-foreground">({Math.round(uploadedFile.size / 1024)} KB)</span>
				</div>
				<Button
					variant="ghost"
					size="sm"
					type="button"
					on:click={removeFile}
					class="p-1 h-auto text-muted-foreground hover:text-foreground"
				>
					<Icon icon="lucide:x" class="w-3 h-3" />
				</Button>
			</div>
		{/if}
		
		<form on:submit|preventDefault={sendMessage} class="relative">
			<!-- Hidden file input -->
			<input
				bind:this={fileInputEl}
				type="file"
				on:change={onFileSelected}
				accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.json,.xml"
				class="hidden"
			/>
			
			<div class="flex items-end gap-3 bg-muted/30 rounded-2xl p-4 border border-border/50 focus-within:border-primary/50 transition-colors">
				<div class="flex-1 relative">
					<textarea
						bind:this={textareaEl}
						bind:value={messageInput}
						on:input={autoResize}
						on:keydown={handleKeydown}
						placeholder={hasUserSentMessage 
							? "Chat completed. Start a new conversation to ask more questions." 
							: uploadedFile 
								? "Ask questions about the uploaded file..."
								: "Ask about locations, maps, or geospatial data analysis..."}
						class="w-full bg-transparent border-0 outline-none resize-none max-h-[120px] placeholder:text-muted-foreground text-sm leading-6 py-1"
						rows="1"
						disabled={isProcessing || hasUserSentMessage}
					></textarea>
				</div>
				
				<div class="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						type="button"
						on:click={handleFileUpload}
						disabled={isProcessing || hasUserSentMessage}
						class="p-2 text-muted-foreground hover:text-foreground rounded-xl"
						title="Upload file"
					>
						<Icon icon="lucide:paperclip" class="w-4 h-4" />
					</Button>
					
					<Button
						variant="default"
						size="sm"
						type="submit"
						disabled={(!messageInput.trim() && !uploadedFile) || isProcessing || hasUserSentMessage}
						class="p-2 rounded-xl min-w-[36px] min-h-[36px]"
					>
						<Icon icon={isProcessing ? "lucide:loader-2" : "lucide:send"} class={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
					</Button>
				</div>
			</div>
		</form>
		
		<div class="text-xs text-muted-foreground text-center mt-3">
			Cyberglobes AI can make mistakes. Please verify important information.
		</div>
	</div>
</div>