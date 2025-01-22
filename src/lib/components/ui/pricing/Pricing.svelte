<script lang="ts">
	import { onMount } from 'svelte';
	import { SubscriptionService } from '$lib/services/subscription-service';
	import Loader from '../spinners/Loader.svelte';

	let data = {};
	let loading = false;

	onMount(async () => {
		loading = true;
		const subscriptionService = new SubscriptionService();
		try {
			const response = await subscriptionService.getPricingPlans();

			if (!response.success) {
				throw new Error('Failed to fetch pricing data');
			}

			data = response.plans;
		} catch (error) {
			console.error('Error fetching pricing data:', error);
		} finally {
			loading = false;
		}
	});
</script>

<div class="py-40">
	<div
		class="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl"
		aria-hidden="true"
	>
		<div
			class="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
			style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"
		></div>
	</div>
	<div class="mx-auto max-w-4xl text-center">
		<h2 class="text-base/7 font-semibold text-[#2C7BE5]">Pricing</h2>
		<p class="mt-2 text-balance text-5xl font-semibold tracking-tight text-gray-900 sm:text-6xl">
			Choose the right plan for you
		</p>
	</div>
	<p
		class="mx-auto mt-6 max-w-2xl text-pretty text-center text-lg font-medium text-gray-600 sm:text-xl/8"
	>
		Choose an affordable plan that's packed with the best features for engaging your audience,
		creating customer loyalty, and driving sales.
	</p>

	{#if loading}
		<div class="flex justify-center mt-5">
			<div class="mx-auto text-center align-middle">
				<Loader />
			</div>
		</div>
	{/if}

	{#if data && !loading}
		<div
			class="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2"
		>
			{#each data as plan}
				{#if !plan.is_recommended}
					<div
						class="rounded-3xl rounded-t-3xl bg-white/60 p-8 ring-1 ring-gray-900/10 sm:mx-8 sm:p-10 lg:mx-0 lg:rounded-bl-3xl"
					>
						<h3 class="text-base font-semibold text-[#2C7BE5]">{plan.name}</h3>
						<p class="mt-4 flex items-baseline gap-x-2">
							<span class="text-5xl font-semibold tracking-tight text-gray-900"
								>{plan.currency_symbol}{plan.charge}</span
							>
							<span class="text-base text-gray-500">/{plan.billing_frequency}</span>
						</p>
						<p class="mt-6 text-base/7 text-gray-600">
							{plan.caption}
						</p>
						{#if plan.features}
							<ul role="list" class="mt-8 space-y-3 text-sm/6 text-gray-600 sm:mt-10">
								{#each plan.features as feature}
									<li class="flex gap-x-3">
										<svg
											class="h-6 w-5 flex-none text-[#2C7BE5]"
											viewBox="0 0 20 20"
											fill="currentColor"
											aria-hidden="true"
											data-slot="icon"
										>
											<path
												fill-rule="evenodd"
												d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
												clip-rule="evenodd"
											/>
										</svg>
										{feature}
									</li>
								{/each}
							</ul>
						{/if}
						<a
							href="#"
							aria-describedby="tier-hobby"
							class="mt-8 block rounded-md px-3.5 py-2.5 text-center text-sm font-semibold text-[#2C7BE5] ring-1 ring-inset ring-indigo-200 hover:text-[#FFFFFF] hover:bg-[#2C7BE5] hover:ring-[#2C7BE5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C7BE5] sm:mt-10"
						>
							Get started today
						</a>
					</div>
				{:else}
					<div
						class="relative rounded-3xl bg-gray-900 p-8 shadow-2xl ring-1 ring-gray-900/10 sm:p-10"
					>
						<h3 id="tier-enterprise" class="text-base/7 font-semibold text-[#2C7BE5]">
							{plan.name}
						</h3>
						<p class="mt-4 flex items-baseline gap-x-2">
							<span class="text-5xl font-semibold tracking-tight text-white"
								>{plan.currency_symbol}{plan.charge}</span
							>
							<span class="text-base text-gray-400">/{plan.billing_frequency}</span>
						</p>
						<p class="mt-6 text-base/7 text-gray-300">
							{plan.caption}
						</p>
						{#if plan.features}
							<ul role="list" class="mt-8 space-y-3 text-sm/6 text-gray-300 sm:mt-10">
								{#each plan.features as feature}
									<li class="flex gap-x-3">
										<svg
											class="h-6 w-5 flex-none text-[#2C7BE5]"
											viewBox="0 0 20 20"
											fill="currentColor"
											aria-hidden="true"
											data-slot="icon"
											><path
												fill-rule="evenodd"
												d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
												clip-rule="evenodd"
											></path></svg
										>
										{feature}
									</li>
								{/each}
							</ul>
						{/if}
						<a
							href="#"
							aria-describedby="tier-enterprise"
							class="mt-8 block rounded-md bg-[#2C7BE5] px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-[#000000] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C7BE5] hover:ring-1 hover:ring-[#2C7BE5] sm:mt-10"
							>Get started today</a
						>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>
