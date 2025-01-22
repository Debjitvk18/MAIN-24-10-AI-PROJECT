<script>
	import { loadStripe } from '@stripe/stripe-js';
	import { CardCvc, CardExpiry, CardNumber, Elements } from 'svelte-stripe';
	import { onMount } from 'svelte';
	import { PUBLIC_STRIPE_KEY } from '$env/static/public';
	import { SubscriptionService } from '$lib/services/subscription-service';
	import { goto } from '$app/navigation';
	import Loader from '$lib/components/ui/spinners/Loader.svelte';

	let stripe = null;
	let cardElement = null;
	let clientSecret = null;
	let processing = false;
	let name = '';
	let errorMessage = [];
	let loadingPaymentForm = false;

	const subscriptionService = new SubscriptionService();
	onMount(async () => {
		loadingPaymentForm = true;
		// get the client secret from the server
		const response = await subscriptionService.getSetupIntent();
		if (!response.success) {
			throw new Error('Something went wrong, please try again.');
		}

		clientSecret = response.intent.client_secret;

		// load the stripe instance
		stripe = await loadStripe(PUBLIC_STRIPE_KEY);
		loadingPaymentForm = false;
	});

	async function submit() {
		// avoid processing duplicates
		if (processing) return;

		processing = true;

		// confirm payment with stripe
		const result = await stripe.confirmCardSetup(clientSecret, {
			payment_method: {
				card: cardElement,
				billing_details: {
					name
				}
			}
		});

		// log results, for debugging
		console.log({ result });

		if (result.error) {
			// payment failed, notify user
			errorMessage.push(result.error.message);
			processing = false;
		} else {
			// make api call to create a subscription and redirect on thank you page
			const subscriptionResponse = await subscriptionService.createSubscription({
				plan_id: 2,
				payment_method: result.setupIntent.payment_method
			});

			if (subscriptionResponse.success) {
				// redirect to thank you page
				goto('/thank-you');
			} else {
				// subscription creation failed, notify user
				errorMessage.push(subscriptionResponse.error);
				processing = false;
			}
		}
	}
</script>

<div class="flex flex-col items-center min-h-screen bg-gray-100 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md mt-6 px-6 py-4 bg-white shadow-md overflow-hidden sm:rounded-lg">
		{#if loadingPaymentForm}
			<div class="flex justify-center mt-5">
				<div class="mx-auto text-center align-middle">
					<Loader />
				</div>
			</div>
		{/if}

		<Elements {stripe}>
			<form on:submit|preventDefault={submit}>
				<div>
					<input
						name="name"
						class="input mt-1 block w-full"
						bind:value={name}
						placeholder="Your name"
						disabled={processing}
					/>
				</div>
				<div class="block mt-4">
					<CardNumber bind:element={cardElement} classes={{ base: 'input mt-1 block w-full' }} />
				</div>
				<div class="mt-4 flex space-x-4">
					<CardExpiry classes={{ base: 'input mt-1 block w-full' }} />
					<CardCvc classes={{ base: 'input mt-1 block w-full' }} />
				</div>

				<div class="flex items-center justify-end mt-4">
					<button
						disabled={processing}
						type="submit"
						class="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring focus:ring-gray-300 disabled:opacity-25 transition ml-4"
						>{#if processing}
							Processing...
						{:else}
							Pay
						{/if}</button
					>
				</div>
			</form>
		</Elements>
	</div>
</div>

<style>
	.input,
	:global(.input) {
		border: 1px solid #d1d5db;
		display: block;
		margin-top: 0.25rem;
		border-radius: 0.375rem;
		width: 100%;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		padding: 0.5rem 0.75rem !important;
	}
</style>
