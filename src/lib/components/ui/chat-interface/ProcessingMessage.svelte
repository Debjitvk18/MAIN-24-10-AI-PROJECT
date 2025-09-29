<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import Icon from '@iconify/svelte';

	export let content: string = '';

	let showMessage = false;

	// Simply display the content immediately when it changes
	$: displayText = content;

	onMount(() => {
		showMessage = true;
	});

	// Format the content for display
	function formatContent(text: string): string {
		return text
			.replace(/\*\*(.*?)\*\*/g, '<strong class="shimmer-text">$1</strong>')
			.replace(/\n/g, '<br>');
	}
</script>

{#if showMessage}
	<div 
		class="flex justify-center w-full my-6"
		in:fade={{ duration: 400 }}
	>
		<div class="p-2 max-w-2xl shadow-sm">
			<div class="flex items-start gap-3">
				<div class="flex-1 text-sm leading-relaxed">
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