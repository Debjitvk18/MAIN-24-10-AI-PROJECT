<script lang="ts">
	import { onMount } from 'svelte';
	import InstagramStepsSidebar from './InstagramStepsSidebar.svelte';
	import VisualizationPanel from './VisualizationPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';

	let sidebarVisible = true;
	let isMobile = false;
	let selectedStep = 'comments';
	let hasVisualizationData = true;
	let sidebarMessages: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}> = [];

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
		
		// Initialize with default data for Step 3 (comments)
		if (selectedStep === 'comments') {
			const defaultMessage = {
				id: 'default-' + Date.now().toString(),
				role: 'assistant' as const,
				content: 'I\'ve created a detailed table analyzing your Instagram comments data. It includes sentiment analysis, language distribution, response rates, keyword analysis, and engagement metrics.',
				timestamp: new Date()
			};
			sidebarMessages = [defaultMessage];
		}
		
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
		// Clear previous messages when switching steps
		sidebarMessages = [];
		hasVisualizationData = false;
		
		// Close sidebar on mobile after selection
		if (isMobile) {
			sidebarVisible = false;
		}
	}

	function handleSidebarMessage(message: {id: string, role: 'user' | 'assistant', content: string, timestamp: Date}) {
		sidebarMessages = [...sidebarMessages, message];
		// Show visualization data only when there are messages and a step is selected
		hasVisualizationData = sidebarMessages.length > 0 && selectedStep !== '';
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
				messages={sidebarMessages}
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
						{@const step = selectedStep === 'posts' ? 'Step 1' : selectedStep === 'likes' ? 'Step 2' : 'Step 3'}
						<p class="text-sm text-muted-foreground">
							Analyzing: {step} Data
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

		<!-- Visualization Content Area -->
		<div class="flex-1 min-h-0">
			<VisualizationPanel 
				hasData={hasVisualizationData} 
				{selectedStep}
			/>
		</div>
	</div>
</div>