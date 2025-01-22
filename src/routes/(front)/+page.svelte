<script>
	import FooterGuest from '$lib/components/layout/FooterGuest.svelte';
	import HeaderGuest from '$lib/components/layout/HeaderGuest.svelte';
	import BlogCard from '$lib/components/ui/card/BlogCard.svelte';
	import TestimoinalCard from '$lib/components/ui/card/TestimoinalCard.svelte';
	import Faq from '$lib/components/ui/home/Faq.svelte';
	import Pricing from '$lib/components/ui/pricing/Pricing.svelte';
</script>

<div class="relative isolate px-6 pt-14 lg:px-8">
	<div class="mx-auto max-w-2xl py-10 sm:py-48 lg:py-20">
		<div class="hidden sm:mb-8 sm:flex sm:justify-center">
			<div
				class="relative rounded-full px-3 py-1 text-sm/6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20"
			>
				Announcing our next round of funding. <a href="#" class="font-semibold text-[#2C7BE5]"
					><span class="absolute inset-0" aria-hidden="true"></span>Read more
					<span aria-hidden="true">&rarr;</span></a
				>
			</div>
		</div>
		<div class="text-center">
			<h1 class="text-balance text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl">
				Data to enrich your online business
			</h1>
			<p class="mt-8 text-pretty text-lg font-medium text-gray-500 sm:text-xl/8">
				Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo.
				Elit sunt amet fugiat veniam occaecat.
			</p>
			<div class="mt-10 flex items-center justify-center gap-x-6">
				<a
					href="/try-demo"
					class="rounded-md bg-[#2C7BE5] px-8 py-2.5 text-md font-semibold text-white shadow-sm hover:bg-[#2C7BE5]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C7BE5]"
					>Try Demo</a
				>
				<a href="#" class="text-md/6 font-semibold text-gray-900"
					>Learn more <span aria-hidden="true">→</span></a
				>
			</div>
		</div>
	</div>

	<!-- pricing card -->
	<Pricing />
</div>
<div class="mx-auto max-w-screen-xl mb-20">
	<div class="mx-auto max-w-screen-md text-center mb-8 lg:mb-12">
		<h2 class="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
			Explore the blog
		</h2>
		<p class="text-lg font-medium text-black text-gray-600 mb-5">
			Hear the latest from the The Social Proxy team
		</p>
	</div>
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3 py-">
		<BlogCard />
		<BlogCard />
		<BlogCard />
	</div>
</div>

<section class="py-12 text-[#2C7BE5] sm:py-16 lg:py-20">
	<div class="relative mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-0">
		<div class="flex flex-col items-center">
			<div class="text-center">
				<h2 class="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
					Client Testimonials
				</h2>
				<p class="text-lg font-medium text-black text-gray-600">
					What clients say about their experience with us
				</p>
			</div>
			<div class="order-3 mt-8 text-center md:mt-16">
				<button
					class="mb-20 rounded-lg border-2 border-[#2C7BE5] bg-[#2C7BE5] px-6 py-2 font-medium text-white transition hover:translate-y-1"
					>More reviews on TrustPilot</button
				>
			</div>

			<div
				class="relative mx-auto mt-20 grid max-w-lg grid-cols-1 gap-6 md:max-w-none md:grid-cols-3 lg:gap-10"
			>
				<TestimoinalCard />
				<TestimoinalCard />
				<TestimoinalCard />
			</div>
		</div>
	</div>
</section>

<Faq />
