<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';

	// Mock chat data - will be replaced with real data later
	const mockChats = [
		{
			id: '1',
			title: 'Map Search Discussion',
			lastMessage: 'Can you help me find restaurants near Times Square?',
			timestamp: new Date('2024-01-15T14:30:00'),
			messageCount: 12
		},
		{
			id: '2', 
			title: 'Real Estate Inquiry',
			lastMessage: 'What are the property values in Manhattan?',
			timestamp: new Date('2024-01-15T10:15:00'),
			messageCount: 8
		},
		{
			id: '3',
			title: 'Traffic Analysis',
			lastMessage: 'Show me traffic patterns during rush hour',
			timestamp: new Date('2024-01-14T16:45:00'),
			messageCount: 5
		},
		{
			id: '4',
			title: 'Business Location Planning',
			lastMessage: 'Where should I open my coffee shop?',
			timestamp: new Date('2024-01-14T09:20:00'),
			messageCount: 15
		},
		{
			id: '5',
			title: 'Event Planning Help',
			lastMessage: 'Best venues for corporate events in NYC',
			timestamp: new Date('2024-01-13T13:10:00'),
			messageCount: 7
		}
	];

	export let selectedChatId = '';
	export let onChatSelect: (chatId: string) => void;

	function selectChat(chatId: string) {
		selectedChatId = chatId;
		onChatSelect(chatId);
	}

	function createNewChat() {
		const newChatId = Date.now().toString();
		selectedChatId = newChatId;
		onChatSelect(newChatId);
	}
</script>

<div class="h-full flex flex-col p-4 bg-muted/20">
	<!-- Header -->
	<div class="mb-6">
		<h2 class="text-lg font-semibold mb-2">Chat History</h2>
		<p class="text-sm text-muted-foreground">Your previous conversations with the AI assistant</p>
	</div>

	<!-- New Chat Button -->
	<Button 
		on:click={createNewChat}
		class="w-full mb-6 justify-start gap-2"
		variant="default"
	>
		<Icon icon="lucide:plus" class="w-4 h-4" />
		Start New Chat
	</Button>

	<!-- Chat List -->
	<div class="flex-1 overflow-y-auto space-y-1">
		{#each mockChats as chat (chat.id)}
			<div 
				class={`
					p-3 cursor-pointer transition-all rounded-lg border
					${selectedChatId === chat.id 
						? 'bg-primary/10 border-primary/20 text-primary' 
						: 'hover:bg-accent/50 border-transparent text-foreground'
					}
				`}
				on:click={() => selectChat(chat.id)}
				role="button"
				tabindex="0"
				on:keydown={(e) => e.key === 'Enter' && selectChat(chat.id)}
			>
				<div class="flex items-center justify-between">
					<h3 class="font-medium text-sm truncate flex-1">
						{chat.title}
					</h3>
					
					{#if selectedChatId === chat.id}
						<div class="w-2 h-2 bg-primary rounded-full ml-2 flex-shrink-0"></div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Sidebar Footer -->
	<div class="mt-6 pt-6 border-t border-border/50">
		<div class="text-xs text-muted-foreground text-center space-y-1">
			<div class="flex items-center justify-center gap-1">
				<Icon icon="lucide:sparkles" class="w-3 h-3" />
				<span>Powered by Cyberglobes AI</span>
			</div>
			<div>Advanced geospatial intelligence</div>
		</div>
	</div>
</div>