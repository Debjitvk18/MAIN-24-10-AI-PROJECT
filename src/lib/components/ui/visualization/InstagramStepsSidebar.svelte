<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';

	export let selectedStep = '';
	export let onStepSelect: (step: string) => void;

	const instagramSteps = [
		{
			id: 'posts',
			title: 'Instagram Posts',
			description: 'Analyze post engagement, reach, and performance metrics',
			icon: 'lucide:image',
			color: 'from-purple-500 to-pink-500'
		},
		{
			id: 'likes',
			title: 'Instagram Likes',
			description: 'Track likes patterns, trends, and user engagement',
			icon: 'lucide:heart',
			color: 'from-red-500 to-pink-500'
		},
		{
			id: 'comments',
			title: 'Instagram Comments',
			description: 'Analyze comment sentiment, frequency, and interactions',
			icon: 'lucide:message-circle',
			color: 'from-blue-500 to-purple-500'
		}
	];

	function selectStep(stepId: string) {
		onStepSelect(stepId);
	}

	function isStepCompleted(stepId: string): boolean {
		const currentIndex = instagramSteps.findIndex(step => step.id === stepId);
		const selectedIndex = instagramSteps.findIndex(step => step.id === selectedStep);
		return selectedIndex > currentIndex;
	}

	function isStepActive(stepId: string): boolean {
		return selectedStep === stepId;
	}
</script>

<div class="h-full flex flex-col p-4 bg-muted/20">
	<!-- Header -->
	<div class="mb-6">
		<h2 class="text-lg font-semibold mb-2">Instagram Analytics</h2>
		<p class="text-sm text-muted-foreground">Select a data category to analyze</p>
		{#if selectedStep}
			<div class="mt-2 px-3 py-1 bg-primary/10 text-primary text-xs rounded-full inline-block">
				✓ {selectedStep.charAt(0).toUpperCase() + selectedStep.slice(1)} Selected
			</div>
		{/if}
	</div>

	<!-- Steps -->
	<div class="flex-1 space-y-4">
		{#each instagramSteps as step, index (step.id)}
			<div 
				class={`
					cursor-pointer transition-all duration-200 hover:shadow-md border rounded-lg p-4 bg-card hover:bg-accent/50
					${isStepActive(step.id) ? 'ring-2 ring-primary border-primary bg-primary/5' : ''}
					${isStepCompleted(step.id) ? 'bg-muted/50' : ''}
				`}
				on:click={(e) => {
					e.preventDefault();
					e.stopPropagation();
					selectStep(step.id);
				}}
				on:keydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						selectStep(step.id);
					}
				}}
				role="button"
				tabindex="0"
				aria-label={`Select ${step.title}`}
			>
				<div class="flex items-start gap-3">
					<!-- Step Number -->
					<div class={`
						flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold
						${isStepActive(step.id) 
							? 'bg-primary text-primary-foreground' 
							: isStepCompleted(step.id)
							? 'bg-green-500 text-white'
							: 'bg-muted text-muted-foreground'
						}
					`}>
						{#if isStepCompleted(step.id)}
							<Icon icon="lucide:check" class="w-4 h-4" />
						{:else}
							{index + 1}
						{/if}
					</div>

					<!-- Content -->
					<div class="flex-1 min-w-0">
						<h3 class="text-base flex items-center gap-2 font-semibold">
							<div class={`
								w-8 h-8 rounded-lg bg-gradient-to-r ${step.color} 
								flex items-center justify-center text-white
							`}>
								<Icon icon={step.icon} class="w-4 h-4" />
							</div>
							{step.title}
						</h3>
						<p class="text-xs text-muted-foreground mt-1 leading-relaxed">
							{step.description}
						</p>
					</div>

					<!-- Status Indicator -->
					{#if isStepActive(step.id)}
						<div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
					{/if}
				</div>
			</div>

			<!-- Connector Line -->
			{#if index < instagramSteps.length - 1}
				<div class="flex justify-center">
					<div class={`
						w-0.5 h-4 
						${isStepCompleted(instagramSteps[index + 1].id) || isStepActive(instagramSteps[index + 1].id)
							? 'bg-primary' 
							: 'bg-muted'
						}
					`}></div>
				</div>
			{/if}
		{/each}
	</div>

	<!-- Info Section -->
	<div class="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
		<div class="flex items-start gap-2 mb-2">
			<Icon icon="lucide:info" class="w-4 h-4 text-blue-600 mt-0.5" />
			<div>
				<h3 class="text-sm font-medium text-blue-900 dark:text-blue-100">How to use</h3>
				<p class="text-xs text-blue-700 dark:text-blue-200 mt-1">
					1. Select a data category above<br>
					2. Ask questions like "show me a bar chart" or "create a table"<br>
					3. View your visualization in the panel
				</p>
			</div>
		</div>
	</div>

	<!-- Reset Button -->
	{#if selectedStep}
		<Button 
			variant="outline" 
			size="sm" 
			class="mt-4 w-full"
			on:click={() => selectStep('')}
		>
			<Icon icon="lucide:refresh-cw" class="w-4 h-4 mr-2" />
			Reset Selection
		</Button>
	{/if}
</div>