<script lang="ts">
	import { onMount } from 'svelte';
	import '../../app.css';
	import { checkAuth, isLoggedIn } from '$lib/stores/authStore';
	import Toast from '$lib/components/ui/toast/Toast.svelte';
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

<Toast />
{@render children()}
