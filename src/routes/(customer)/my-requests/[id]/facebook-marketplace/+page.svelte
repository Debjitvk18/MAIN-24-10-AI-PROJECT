<script lang="ts">
	import { onMount } from 'svelte';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card/index.ts';
	import { page } from '$app/stores';
	import NotFound from '$lib/components/general/NotFound.svelte';
	import { ApiService } from '$lib/services/api-service';
	import GetBack from '$lib/components/general/GetBack.svelte';
	import TableShimmer from '$lib/components/general/shimmer/TableShimmer.svelte';
	import { formatDate } from '$lib/utils/generalUtils';
	import * as Avatar from '$lib/components/ui/avatar/index.js';

	const slug = 'facebook-marketplace';
	$: id = $page.params.id;
	let loader = true;
	let marketplaceData;

	async function fetchFacebookMarketPlace(pageNumber = 1) {
		try {
			let apiService = new ApiService();
			let res = await apiService.makeApiCall(`search-requests/${id}/${slug}`);
			if (!res.success) {
				throw new Error(res.error);
			}

			marketplaceData = [
				...(res?.response?.response?.data?.marketplace_search?.feed_units?.edges || [])
			];
		} catch (err) {
			console.error('Pagination Error:', err);
		} finally {
			loader = false;
		}
	}

	onMount(async () => {
		await fetchFacebookMarketPlace();
	});
</script>

<div class="container max-w-100">
	<div class="flex-1 space-y-4">
		<h2 class="text-3xl font-bold tracking-tight text-dark dark:text-white">
			 Facebook Marketplace
		</h2>
		<GetBack url={`/my-requests/${id}`} />
		<Card.Root class="col-span-4">
			<Card.Content>
				{#if !loader}
					{#if marketplaceData.length == 0}
						<NotFound message={'No data found!!'} />
					{:else}
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Image</Table.Head>
									<Table.Head>Product</Table.Head>
									<Table.Head>Price</Table.Head>
									<Table.Head>Location</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each marketplaceData as item}
									<Table.Row>
										<!-- Product Image -->
										<Table.Cell>
											<Avatar.Root class="h-8 w-8">
												<Avatar.Image
													src={item.node.photo?.image?.uri || 'fallback-image.jpg'}
													alt="Product Image"
												/>
												<Avatar.Fallback>📷</Avatar.Fallback>
											</Avatar.Root>
										</Table.Cell>
										<!-- Product Name with Link -->
										<Table.Cell class="font-medium">
											<a
												href={'https://www.facebook.com/marketplace/item/' + item.node.entity_id}
												target="_blank"
											>
												{item.node.data?.title || 'No Title'}
											</a>
										</Table.Cell>

										<!-- Price -->
                                        <Table.Cell>
                                            {#if item.node.data?.price?.amount_with_offset}
                                                {item.node.data?.price?.currency} 
                                                {(Number(item.node.data?.price?.amount_with_offset) / 100).toLocaleString()}
                                            {:else}
                                                N/A
                                            {/if}
                                        </Table.Cell>

										<!-- Location -->
										<Table.Cell>
											{item.node.row_3?.text || 'Unknown Location'}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					{/if}
				{:else}
					<div class="w-full">
						<TableShimmer rows={15} />
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
