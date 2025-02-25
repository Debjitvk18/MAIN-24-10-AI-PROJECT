<script>
	import TwitterCard from "$lib/components/ui/map/social-cards/twitter/TwitterCard.svelte";
</script>

<!-- Sidebar -->
<div class="dark:bg-neutral-900 w-96 p-4 pt-0 h-full overflow-y-auto shadow-lg" bind:this={sidebarElement}>
	<div class="pb-5 h-full">
		<div class="max-w-md mx-auto pb-5">

			<TwitterCard />

		</div>
	</div>
</div>
<style>
	.post-row:hover,
	.highlighted {
		border: 1px solid #007BFF;
		background-color: #f0f9ff;
	}
</style>
