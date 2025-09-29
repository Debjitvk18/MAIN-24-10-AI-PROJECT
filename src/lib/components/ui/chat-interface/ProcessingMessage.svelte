<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import Icon from '@iconify/svelte';

	export let content: string = '';
	export let isComplete: boolean = false;

	let showMessage = false;

	// Simply display the content immediately when it changes
	$: displayText = content;

	onMount(() => {
		showMessage = true;
	});

	// Format the content for display
	function formatContent(text: string): string {
		// Split by double newlines to separate each step
		const steps = text.split('\n\n');
		
		return steps.map((step, index) => {
			// Each step has a title (in **) and description
			const lines = step.split('\n');
			const title = lines[0];
			const description = lines.slice(1).join(' ');
			
			// Only apply shimmer to the last (current) step and only if not complete
			const isCurrentStep = index === steps.length - 1;
			const shimmerClass = (isCurrentStep && !isComplete) ? 'shimmer-text' : '';
			
			const formattedTitle = title.replace(/\*\*(.*?)\*\*/g, `<div class="font-semibold text-primary mb-1 ${shimmerClass}">$1</div>`);
			const formattedDescription = description ? `<div class="text-muted-foreground text-xs leading-relaxed pl-2 border-l-2 border-primary/20">${description}</div>` : '';
			
			return `<div class="mb-4">${formattedTitle}${formattedDescription}</div>`;
		}).join('');
	}
</script>

{#if showMessage}
	<div 
		class="w-full my-6"
		in:fade={{ duration: 400 }}
	>
		<div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 
					rounded-xl p-6 max-w-2xl border border-blue-200/50 dark:border-blue-800/30
					shadow-sm">
			<div class="flex items-start gap-3">
				<div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
					<Icon icon="lucide:zap" class="w-4 h-4 text-primary {isComplete ? '' : 'animate-pulse'}" />
				</div>
				<div class="flex-1 text-sm leading-relaxed space-y-4">
					{@html formatContent(displayText)}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(.shimmer-text) {
		background: linear-gradient(
			90deg,
			hsl(var(--primary)) 0%,
			hsl(var(--muted-foreground)) 25%,
			hsl(var(--primary)) 50%,
			hsl(var(--muted-foreground)) 75%,
			hsl(var(--primary)) 100%
		);
		background-size: 200% 100%;
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: shimmer 2s infinite ease-in-out;
		font-weight: 600;
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}
</style>