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

	const slug = 'x-twitter';
	$: id = $page.params.id;
	let loader = true;
	let tweets;

	async function fetchTwitter(pageNumber = 1) {
		try {
			let apiService = new ApiService();
			let res = await apiService.makeApiCall(`search-requests/${id}/${slug}`);

			if (!res.success) {
				throw new Error(res.error);
			}

			tweets = [...(res?.response?.response?.tweets || [])];
		} catch (err) {
			console.error('Pagination Error:', err);
		} finally {
			loader = false;
		}
	}

	onMount(async () => {
		await fetchTwitter();
	});

</script>

<div class="container max-w-100">
	<div class="flex-1 space-y-4">
		<h2 class="text-3xl font-bold tracking-tight text-dark dark:text-white">
			X (Twitter)
		</h2>
		<GetBack url={`/my-requests/${id}`} />
		<Card.Root class="col-span-4">
			<Card.Content>
				{#if !loader}
					{#if tweets.length == 0}
						<NotFound message={'No data found!!'} />
					{:else}
					<Table.Root>
						<Table.Header>
						  <Table.Row>
							<Table.Head>User</Table.Head>
							<Table.Head>Tweet</Table.Head>
							<Table.Head>Date</Table.Head>
							<Table.Head>Tweet Views</Table.Head>
						  </Table.Row>
						</Table.Header>
						<Table.Body>
						  {#each tweets as data}
							<Table.Row>
							  <Table.Cell class="font-medium">
								<a href={`https://x.com/${data.tweet.user_details.screen_name}`} target="_blank">
								  <img src={data.tweet.user_details.profile_image_url_https} alt="User Profile" class="rounded-full" width="40" height="40" />
								</a>
							  </Table.Cell>
							  <Table.Cell>
								<a href={data.tweet.url} target="_blank">{data.tweet.full_text}</a>
							  </Table.Cell>
							  <Table.Cell>{formatDate(data.tweet.created_at)}</Table.Cell>
							  <Table.Cell>{data.tweet.view_count || 0}</Table.Cell>
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
