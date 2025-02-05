<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import Icon from '@iconify/svelte';
</script>

<div class="bg-white">
	<Tabs.Root value="all">
		<div class="flex flex-col">
			<div class="flex space-x-4 py-0 bg-white shadow-md">
				<Tabs.List>
					<Tabs.Trigger value="all">
						<div class="flex flex-col items-center">
							<Icon icon="bx:bxs-moon" class="text-lg leading-none w-7" />
							<span>All</span>
						</div>
					</Tabs.Trigger>

					<Tabs.Trigger value="twitter">
						<div class="flex flex-col items-center">
							<Icon icon="bx:bxs-sun" class="text-lg leading-none w-7" />
							<span>Twitter</span>
						</div>
					</Tabs.Trigger>

					<Tabs.Trigger value="panoids">
						<div class="flex flex-col items-center">
							<Icon icon="bx:bxs-sun" class="text-lg leading-none w-7" />
							<span>Panoids</span>
						</div>
					</Tabs.Trigger>
				</Tabs.List>
			</div>
		</div>

		<!-- Map contents -->
		<div class="flex flex-col md:flex-row">
			<!-- Map Sidebar -->
			<div class="map-sidebar w-full md:w-1/3 p-4 bg-red-400">
				<Tabs.Content value="all">
					<div class="bg-white p-4 rounded-lg shadow-md mt-4">
						<img
							src="https://via.placeholder.com/300x200"
							alt="Hotel image"
							class="w-full rounded-lg"
						/>
						<h3 class="mt-2 font-semibold">Hotel in Jaipur</h3>
						<p class="text-gray-500">Divine Stays - Studios - Raja Park</p>
						<p class="font-bold mt-1">₹1,140 night • ₹5,900 total</p>
					</div>
					<div class="bg-white p-4 rounded-lg shadow-md mt-4">
						<img
							src="https://via.placeholder.com/300x200"
							alt="Hotel image"
							class="w-full rounded-lg"
						/>
						<h3 class="mt-2 font-semibold">Hotel in Jaipur</h3>
						<p class="text-gray-500">Divine Stays - Studios - Raja Park</p>
						<p class="font-bold mt-1">₹1,140 night • ₹5,900 total</p>
					</div>
					<div class="bg-white p-4 rounded-lg shadow-md mt-4">
						<img
							src="https://via.placeholder.com/300x200"
							alt="Hotel image"
							class="w-full rounded-lg"
						/>
						<h3 class="mt-2 font-semibold">Hotel in Jaipur</h3>
						<p class="text-gray-500">Divine Stays - Studios - Raja Park</p>
						<p class="font-bold mt-1">₹1,140 night • ₹5,900 total</p>
					</div>
					<div class="bg-white p-4 rounded-lg shadow-md mt-4">
						<img
							src="https://via.placeholder.com/300x200"
							alt="Hotel image"
							class="w-full rounded-lg"
						/>
						<h3 class="mt-2 font-semibold">Hotel in Jaipur</h3>
						<p class="text-gray-500">Divine Stays - Studios - Raja Park</p>
						<p class="font-bold mt-1">₹1,140 night • ₹5,900 total</p>
					</div>
					<div class="bg-white p-4 rounded-lg shadow-md mt-4">
						<img
							src="https://via.placeholder.com/300x200"
							alt="Hotel image"
							class="w-full rounded-lg"
						/>
						<h3 class="mt-2 font-semibold">Hotel in Jaipur</h3>
						<p class="text-gray-500">Divine Stays - Studios - Raja Park</p>
						<p class="font-bold mt-1">₹1,140 night • ₹5,900 total</p>
					</div>
					<div class="bg-white p-4 rounded-lg shadow-md mt-4">
						<img
							src="https://via.placeholder.com/300x200"
							alt="Hotel image"
							class="w-full rounded-lg"
						/>
						<h3 class="mt-2 font-semibold">Hotel in Jaipur</h3>
						<p class="text-gray-500">Divine Stays - Studios - Raja Park</p>
						<p class="font-bold mt-1">₹1,140 night • ₹5,900 total</p>
					</div>
					<div class="bg-white p-4 rounded-lg shadow-md mt-4">
						<img
							src="https://via.placeholder.com/300x200"
							alt="Hotel image"
							class="w-full rounded-lg"
						/>
						<h3 class="mt-2 font-semibold">Hotel in Jaipur</h3>
						<p class="text-gray-500">Divine Stays - Studios - Raja Park</p>
						<p class="font-bold mt-1">₹1,140 night • ₹5,900 total</p>
					</div>
					<div class="bg-white p-4 rounded-lg shadow-md mt-4">
						<img
							src="https://via.placeholder.com/300x200"
							alt="Hotel image"
							class="w-full rounded-lg"
						/>
						<h3 class="mt-2 font-semibold">Hotel in Jaipur</h3>
						<p class="text-gray-500">Divine Stays - Studios - Raja Park</p>
						<p class="font-bold mt-1">₹1,140 night • ₹5,900 total</p>
					</div>
				</Tabs.Content>
				<Tabs.Content value="twitter">
					<div class="bg-white p-4 rounded-lg shadow-md mt-4">
						<img
							src="https://via.placeholder.com/300x200"
							alt="Hotel image"
							class="w-full rounded-lg"
						/>
						<h3 class="mt-2 font-semibold">Hotel in Jaipur</h3>
						<p class="text-gray-500">Divine Stays - Studios - Raja Park</p>
						<p class="font-bold mt-1">₹1,140 night • ₹5,900 total</p>
					</div>
					<div class="bg-white p-4 rounded-lg shadow-md mt-4">
						<img
							src="https://via.placeholder.com/300x200"
							alt="Hotel image"
							class="w-full rounded-lg"
						/>
						<h3 class="mt-2 font-semibold">Hotel in Jaipur</h3>
						<p class="text-gray-500">Divine Stays - Studios - Raja Park</p>
						<p class="font-bold mt-1">₹1,140 night • ₹5,900 total</p>
					</div>
					<div class="bg-white p-4 rounded-lg shadow-md mt-4">
						<img
							src="https://via.placeholder.com/300x200"
							alt="Hotel image"
							class="w-full rounded-lg"
						/>
						<h3 class="mt-2 font-semibold">Hotel in Jaipur</h3>
						<p class="text-gray-500">Divine Stays - Studios - Raja Park</p>
						<p class="font-bold mt-1">₹1,140 night • ₹5,900 total</p>
					</div>
				</Tabs.Content>
				<Tabs.Content value="panoids">
					<div class="bg-white p-4 rounded-lg shadow-md mt-4">
						<img
							src="https://via.placeholder.com/300x200"
							alt="Hotel image"
							class="w-full rounded-lg"
						/>
						<h3 class="mt-2 font-semibold">Hotel in Jaipur</h3>
						<p class="text-gray-500">Divine Stays - Studios - Raja Park</p>
						<p class="font-bold mt-1">₹1,140 night • ₹5,900 total</p>
					</div>
					<div class="bg-white p-4 rounded-lg shadow-md mt-4">
						<img
							src="https://via.placeholder.com/300x200"
							alt="Hotel image"
							class="w-full rounded-lg"
						/>
						<h3 class="mt-2 font-semibold">Hotel in Jaipur</h3>
						<p class="text-gray-500">Divine Stays - Studios - Raja Park</p>
						<p class="font-bold mt-1">₹1,140 night • ₹5,900 total</p>
					</div>
					<div class="bg-white p-4 rounded-lg shadow-md mt-4">
						<img
							src="https://via.placeholder.com/300x200"
							alt="Hotel image"
							class="w-full rounded-lg"
						/>
						<h3 class="mt-2 font-semibold">Hotel in Jaipur</h3>
						<p class="text-gray-500">Divine Stays - Studios - Raja Park</p>
						<p class="font-bold mt-1">₹1,140 night • ₹5,900 total</p>
					</div>
					<div class="bg-white p-4 rounded-lg shadow-md mt-4">
						<img
							src="https://via.placeholder.com/300x200"
							alt="Hotel image"
							class="w-full rounded-lg"
						/>
						<h3 class="mt-2 font-semibold">Hotel in Jaipur</h3>
						<p class="text-gray-500">Divine Stays - Studios - Raja Park</p>
						<p class="font-bold mt-1">₹1,140 night • ₹5,900 total</p>
					</div>
				</Tabs.Content>
			</div>
			<!-- Map Area -->
			<div class="map-area w-full md:w-2/3">
				<slot name="body"></slot>
			</div>
		</div>
	</Tabs.Root>
</div>
