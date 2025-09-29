<script lang="ts">
	import { onMount } from 'svelte';

	let loading = true;

	onMount(() => {
		// Simulate loading delay
		setTimeout(() => {
			loading = false;
		}, 2000);
	});
</script>

<svelte:head>
	<title>Visualization - Cyberglobes</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
	<div class="max-w-6xl mx-auto">
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold text-gray-800 mb-4">Data Visualization</h1>
			<p class="text-lg text-gray-600">Interactive geospatial analysis results</p>
		</div>

		{#if loading}
			<div class="flex items-center justify-center min-h-[400px]">
				<div class="text-center">
					<div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p class="text-lg text-gray-600">Loading visualization...</p>
				</div>
			</div>
		{:else}
			<div class="bg-white rounded-xl shadow-lg p-8">
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<!-- Mock Chart 1 -->
					<div class="bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg p-6 h-64 flex items-center justify-center">
						<div class="text-center">
							<div class="text-blue-600 mb-2">
								<svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
								</svg>
							</div>
							<h3 class="text-lg font-semibold text-gray-800">Geographic Distribution</h3>
							<p class="text-sm text-gray-600 mt-2">Data points analyzed across regions</p>
						</div>
					</div>

					<!-- Mock Chart 2 -->
					<div class="bg-gradient-to-r from-green-100 to-green-200 rounded-lg p-6 h-64 flex items-center justify-center">
						<div class="text-center">
							<div class="text-green-600 mb-2">
								<svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
									<path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
									<path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
								</svg>
							</div>
							<h3 class="text-lg font-semibold text-gray-800">Statistical Analysis</h3>
							<p class="text-sm text-gray-600 mt-2">Trends and patterns identified</p>
						</div>
					</div>

					<!-- Mock Chart 3 -->
					<div class="bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg p-6 h-64 flex items-center justify-center">
						<div class="text-center">
							<div class="text-purple-600 mb-2">
								<svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
								</svg>
							</div>
							<h3 class="text-lg font-semibold text-gray-800">Location Mapping</h3>
							<p class="text-sm text-gray-600 mt-2">Interactive map visualization</p>
						</div>
					</div>

					<!-- Mock Chart 4 -->
					<div class="bg-gradient-to-r from-orange-100 to-orange-200 rounded-lg p-6 h-64 flex items-center justify-center">
						<div class="text-center">
							<div class="text-orange-600 mb-2">
								<svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm-1 0h10V5a1 1 0 00-1-1H8a1 1 0 00-1 1v1z" clip-rule="evenodd" />
								</svg>
							</div>
							<h3 class="text-lg font-semibold text-gray-800">Data Insights</h3>
							<p class="text-sm text-gray-600 mt-2">Key findings and recommendations</p>
						</div>
					</div>
				</div>

				<!-- Summary Section -->
				<div class="mt-8 p-6 bg-gray-50 rounded-lg">
					<h2 class="text-2xl font-semibold text-gray-800 mb-4">Analysis Summary</h2>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="text-center">
							<div class="text-3xl font-bold text-blue-600">1,247</div>
							<div class="text-sm text-gray-600">Data Points</div>
						</div>
						<div class="text-center">
							<div class="text-3xl font-bold text-green-600">15</div>
							<div class="text-sm text-gray-600">Regions Analyzed</div>
						</div>
						<div class="text-center">
							<div class="text-3xl font-bold text-purple-600">98%</div>
							<div class="text-sm text-gray-600">Accuracy Rate</div>
						</div>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="mt-8 flex justify-center gap-4">
					<button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
						Download Report
					</button>
					<button class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
						Share Results
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>