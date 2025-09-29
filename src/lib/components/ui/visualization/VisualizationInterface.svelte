<script lang="ts">
	import { onMount } from 'svelte';
	import InstagramStepsSidebar from './InstagramStepsSidebar.svelte';
	import ChatBox from './ChatBox.svelte';
	import VisualizationPanel from './VisualizationPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';

	let sidebarVisible = true;
	let isMobile = false;
	let selectedStep = '';
	let currentMessages: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}> = [];
	let hasVisualizationData = false;
	let lastUserQuery = '';

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

	function handleStepSelect(stepId: string) {
		selectedStep = stepId;
		// Clear messages when switching steps
		currentMessages = [];
		hasVisualizationData = false;
		lastUserQuery = '';
		
		// Close sidebar on mobile after selection
		if (isMobile) {
			sidebarVisible = false;
		}
	}

	function handleNewMessage(message: {id: string, role: 'user' | 'assistant', content: string, timestamp: Date}) {
		// Track the last user query for chart type detection
		if (message.role === 'user') {
			lastUserQuery = message.content;
		}

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

		// Show visualization data when there are messages and a step is selected
		hasVisualizationData = currentMessages.length > 0 && selectedStep !== '';
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
					<h1 class="text-xl font-semibold">Instagram Analytics Studio</h1>
					{#if selectedStep}
						<p class="text-sm text-muted-foreground">
							Analyzing: {selectedStep.charAt(0).toUpperCase() + selectedStep.slice(1)} Data
						</p>
					{:else}
						<p class="text-sm text-muted-foreground">
							Please select a data category from the sidebar
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

		<!-- Split Content Area -->
		<div class="flex-1 flex flex-col lg:flex-row min-h-0">
			<!-- Chat Window (Top on mobile, Left on desktop) -->
			<div class="lg:w-2/5 h-1/2 lg:h-full border-b lg:border-b-0 lg:border-r">
				<ChatBox 
					messages={currentMessages}
					onNewMessage={handleNewMessage}
					{selectedStep}
				/>
			</div>

			<!-- Visualization Panel (Bottom on mobile, Right on desktop) -->
			<div class="lg:w-3/5 h-1/2 lg:h-full">
				<VisualizationPanel 
					hasData={hasVisualizationData} 
					{selectedStep}
					{lastUserQuery}
				/>
			</div>
		</div>
	</div>
</div>