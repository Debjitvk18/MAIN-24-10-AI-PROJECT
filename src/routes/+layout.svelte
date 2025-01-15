<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import { isLoggedIn } from '$lib/stores/authStore';
	import '../app.css';
	let { children } = $props();
</script>

{#if $isLoggedIn}
<Header />
{/if}
{@render children()}
