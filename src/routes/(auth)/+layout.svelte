<script lang="ts">
	import { onMount } from 'svelte';
	import '../../app.css';
	import { checkAuth, isLoggedIn } from '$lib/stores/authStore';
	import Toast from '$lib/components/ui/toast/Toast.svelte';
	import { deleteCookie, getCookie } from '$lib/utils/cookies';
	import { ApiService } from '$lib/services/api-service';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	let { children } = $props();

	async function handlePendingSearch() {
		const pendingSearch = localStorage.getItem('pendingSearch');
		if (pendingSearch) {
			try {
				const searchParams = JSON.parse(pendingSearch);
				localStorage.removeItem('pendingSearch');

				if (['agent', 'address'].includes(searchParams.type)) {
					return searchParams.query;
				} else if (searchParams.type == 'image') {
					const response = await fetch(searchParams.file);
					const blob = await response.blob();
					const file = new File([blob], searchParams.fileName, { type: searchParams.fileType });
					const apiService = new ApiService();
					let formData = new FormData();
					formData.append('image', file);

					try {
						const res = await apiService.makeApiCall(
							`map/image-search/`,
							formData,
							'POST',
							'formdata'
						);

						if (res.success) {
							let lat = res.search_request.request_params.latitude;
							let long = res.search_request.request_params.longitude;
							let id = res.search_request.id;
							return `try-demo?req_id=${id}&lat=${lat}&long=${long}`;
						} else {
							toast.error(res.message);
							return '/dashboard';
						}
					} catch (error) {
						toast.error('Upload failed: ' + error);
						return '/dashboard';
					}
				}

				return '/dashboard';
			} catch (error) {
				console.error('Error processing pending search:', error);
				return '/dashboard';
			}
		}

		return '/dashboard';
	}

	onMount(() => {
		console.log(JSON.parse(localStorage.getItem('pendingSearch') || '{}'));
		checkAuth();
		const unsubscribe = isLoggedIn.subscribe(async (value) => {
			if (value) {
				const redirectUrl = await handlePendingSearch();
				if (redirectUrl) {
					window.location.href = redirectUrl;
				}
			}
		});

		return () => {
			unsubscribe();
		};
	});
</script>

<Toast />
{@render children()}
