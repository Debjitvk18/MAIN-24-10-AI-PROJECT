<script lang="ts">
	import { onMount } from 'svelte';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card/index.ts';
	import { page } from '$app/stores';
	import NotFound from '$lib/components/general/NotFound.svelte';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { ApiService } from '$lib/services/api-service';
	import GetBack from '$lib/components/general/GetBack.svelte';
	import TableShimmer from '$lib/components/general/shimmer/TableShimmer.svelte';

	$: id = $page.params.id;
	const slug = 'streetview';

	let loader = true

	export let data;
	let streetViews = data?.streetview?.response?.data || [];
	let meta = data?.streetview?.response || [];

	function getPaginationNumbers() {
		if (!meta || !meta.current_page || !meta.last_page) return [];

		const { current_page, last_page } = meta;
		const pages = [];
		const delta = 2;

		const range = [];
		for (
			let i = Math.max(1, current_page - delta);
			i <= Math.min(last_page, current_page + delta);
			i++
		) {
			range.push(i);
		}

		if (!range.includes(1)) {
			pages.push(1);
			if (range[0] > 2) pages.push('...');
		}

		pages.push(...range);

		if (!range.includes(last_page)) {
			if (range[range.length - 1] < last_page - 1) pages.push('...');
			pages.push(last_page);
		}

		return pages;
	}

	async function fetchStreetView(pageNumber = 1) {
		try {
			if (meta?.current_page == pageNumber) return;

			let apiService = new ApiService();
			let res = await apiService.makeApiCall(`search-requests/${id}/streetview?page=${pageNumber}`);
			
			if (!res.success) {
				throw new Error(res.error);
			}

			streetViews = [...(res?.response?.response?.data || [])];
			meta = { ...(res.response?.response || {}) };
		} catch (err) {
			console.error('Pagination Error:', err);
		} finally {
			loader = false;
		}
	}

	async function goToPage(pageNumber) {
		if (meta.current_page !== pageNumber) {
			goto(`?page=${pageNumber}`, { noScroll: true });
			await fetchStreetView(pageNumber);

			if (typeof window !== 'undefined') {
				setTimeout(() => {
					window.scrollTo({ top: 50, behavior: 'smooth' });
				}, 100);
			}
		}
	}

	onMount(async () => {
		await fetchStreetView();
  });

</script>

<div class="container max-w-100">
	<div class="flex-1 space-y-4">
		<h2 class="text-3xl font-bold tracking-tight text-dark dark:text-white">
			Search <span>{slug}</span>
		</h2>
		<GetBack url={`/my-requests/${id}`} />

		<Card.Root class="col-span-4">
			{#if !loader}
				<Card.Content>
					{#if streetViews.length == 0}
						<NotFound message={'No data found!!'} />
					{:else}
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Panoid</Table.Head>
									<Table.Head>Latitude</Table.Head>
									<Table.Head>Longitude</Table.Head>
									<Table.Head>Image</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each streetViews as streetView}
									<Table.Row>
										<Table.Cell class="font-medium">{streetView.panoid}</Table.Cell>
										<Table.Cell>{streetView.lat}</Table.Cell>
										<Table.Cell>{streetView.lon}</Table.Cell>
										<Table.Cell>
											{#if streetView.imageURL}
												<a href={streetView.imageURL} download>
													<Icon icon="lucide:download" class="text-blue-500 text-lg" />
												</a>
											{:else}
												<span class="text-gray-400">N/A</span>
											{/if}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
						<!-- Pagination Controls -->
						<div class="flex items-center justify-end space-x-2 py-4">
							<div class="text-muted-foreground flex-1 text-sm">
								{meta.to} of {meta.total} row(s) showing.
							</div>

							<!-- Previous Button -->
							<button
								class="px-3 py-1 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
								on:click={() => goToPage(meta.current_page - 1)}
								disabled={meta.current_page === 1}
							>
								Previous
							</button>

							<!-- Page Numbers -->
							{#each getPaginationNumbers() as page}
								<button
									class="px-3 py-1 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600  hover:bg-primary-200 dark:hover:bg-gray-700 {meta.current_page === page ? 'bg-primary dark:bg-gray-600 text-white' : ''}"
									on:click={() => goToPage(page)}
								>
									{page}
								</button>
							{/each}

							<!-- Next Button -->
							<button
								class="px-3 py-1 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
								on:click={() => goToPage(meta.current_page + 1)}
								disabled={meta.current_page === meta.last_page}
							>
								Next
							</button>
						</div>
					{/if}
				</Card.Content>
			{:else}
				<Card.Content>
					<div class="w-full">
						<TableShimmer rows={15} />
					  </div>
				</Card.Content>
			{/if}
		</Card.Root>
	</div>
</div>
