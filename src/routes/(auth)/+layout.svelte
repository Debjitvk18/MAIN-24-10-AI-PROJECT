<script lang="ts">
	import { onMount } from 'svelte';
	import '../../app.css';
	import { checkAuth, isLoggedIn } from '$lib/stores/authStore';
	let { children } = $props();

	onMount(() => {
		checkAuth();
		const unsubscribe = isLoggedIn.subscribe((value) => {
			if (value) {
				window.location.href = '/dashboard';
			}
		});

		return () => {
			unsubscribe();
		};
	});
</script>

{@render children()}
