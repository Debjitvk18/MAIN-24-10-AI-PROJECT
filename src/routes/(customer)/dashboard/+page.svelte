<script>
	import SubscriptionNotice from '$lib/components/general/subscription/SubscriptionNotice.svelte';
	import BoxCard from '$lib/components/ui/card/BoxCard.svelte';
	import { user } from '$lib/stores/authStore';
</script>

<div class="container max-w-none">
	<div class="flex justify-between items-center pb-5 md:pb-7 relative">
		<div>
			<h3
				class="font-heading font-bold text-2xl lg:text-3xl leading-tighter tracking-tight text-slate-700 dark:text-white mb-2"
			>
				Hello {$user?.name}
			</h3>
			<p class="text-slate-400">Welcome to ServiceApp!</p>
		</div>
	</div>

	<!-- Subscription Notice -->
	<SubscriptionNotice />

	<!-- block head -->
	<div class="grid grid-flow-dense grid-cols-12 gap-7">
		<BoxCard title="Total Requests" value="54" />
		<BoxCard title="Saved Search" value="5" />
		<BoxCard title="Active Subscription" value="N/A" />
		<BoxCard title="Last Login" value="3 days ago" />
	</div>
</div>
