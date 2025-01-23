<script>
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { logout, user } from '$lib/stores/authStore';
	import { initDropdown } from '$lib/utils/dropdown.js';
	import { toggleTheme, theme } from '$lib/stores/themeStore';
	import { truncateString } from '$lib/utils/generalUtils';
	import Logo from '../general/Logo.svelte';
	import Toast from '../ui/toast/Toast.svelte';

	$: currentTheme = $theme;

	onMount(() => {
		initDropdown();
	});
</script>

<div
	class="serviceapp-header fixed start-0 w-full h-16 top-0 z-[1021] transition-all duration-300 min-w-[320px]"
>
	<Toast />
	<div
		class="h-16 border-b bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-900 px-1.5 sm:px-5"
	>
		<div class="container max-w-none">
			<div class="relative flex items-center -mx-1">
				<div class="px-1 me-4 -ms-1.5 xl:hidden">
					<a
						href="#"
						class="sidebar-toggle [&>*]:pointer-events-none inline-flex items-center isolate relative h-9 w-9 px-1.5 before:content-[''] before:absolute before:-z-[1] before:h-5 before:w-5 hover:before:h-10 hover:before:w-10 before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-300 before:-translate-x-1/2 before:-translate-y-1/2 before:top-1/2 before:left-1/2 before:bg-gray-200 dark:before:bg-gray-900"
					>
						<Icon class="text-2xl text-slate-600 dark:text-slate-300" icon="ic:round-menu" />
					</a>
				</div>
				<div class="px-1 py-3.5 flex xl:hidden">
					<a href="/" class="relative inline-block transition-opacity duration-300 h-9">
						<Logo />
					</a>
				</div>
				<div class="px-1 py-3.5 ms-auto">
					<ul class="flex item-center -mx-1.5 sm:-mx-2.5">
						<li class="dropdown px-1.5 sm:px-2.5 relative inline-flex">
							<a
								tabindex="0"
								href="#"
								class="dropdown-toggle [&>*]:pointer-events-none peer inline-flex items-center group"
								data-offset="0,10"
								data-placement="bottom-end"
								data-rtl-placement="bottom-start"
							>
								<div class="flex items-center">
									<div
										class="relative flex-shrink-0 flex items-center justify-center text-xs text-white bg-primary-500 h-8 w-8 rounded-full font-medium"
									>
										{#if $user?.profile_photo_url}
											<img
												src={$user.profile_photo_url}
												alt="user"
												class="h-full w-full object-cover rounded-full"
											/>
										{/if}
									</div>
									<div class="hidden md:block ms-4">
										<div
											class="text-xs font-medium leading-none pt-0.5 pb-1.5 text-primary-500 group-hover:text-primary-600"
										>
											Hello!
										</div>
										<div
											class="text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center"
										>
											{$user?.name ? $user.name : 'User'}
											<Icon icon="lucide:chevron-down" class="text-sm leading-none ms-1" />
										</div>
									</div>
								</div>
							</a>
							<div
								tabindex="0"
								class="dropdown-menu clickable absolute max-xs:min-w-[240px] max-xs:max-w-[240px] min-w-[280px] max-w-[280px] border border-t-3 border-gray-200 dark:border-gray-800 border-t-primary-600 dark:border-t-primary-600 bg-white dark:bg-gray-950 rounded shadow hidden peer-[.show]:block z-[1000]"
							>
								<div
									class="hidden sm:block px-7 py-5 bg-slate-50 dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800"
								>
									<div class="flex items-center">
										<div
											class="relative flex-shrink-0 flex items-center justify-center text-sm text-white bg-primary-500 h-10 w-10 rounded-full font-medium"
										>
											{#if $user?.profile_photo_url}
												<img
													src={$user.profile_photo_url}
													alt="user"
													class="h-full w-full object-cover rounded-full"
												/>
											{/if}
										</div>
										<div class="ms-4 flex flex-col">
											<span class="text-sm font-bold text-slate-700 dark:text-white"
												>{$user?.name ? $user.name : 'User'}</span
											>
											<span class="text-xs text-slate-400 mt-1"
												>{$user?.email
													? truncateString($user.email, 25)
													: 'someone@example.com'}</span
											>
										</div>
									</div>
								</div>
								<ul class="py-3">
									<li>
										<a
											class="relative px-7 py-2.5 flex items-center rounded-[inherit] text-sm leading-5 font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 hover:dark:text-primary-600 transition-all duration-300"
											href="/profile"
										>
											<Icon icon="bx:bxs-user" class="text-lg leading-none w-7" />
											<span>View Profile</span>
										</a>
									</li>
									<!-- <li>
										<a
											class="relative px-7 py-2.5 flex items-center rounded-[inherit] text-sm leading-5 font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 hover:dark:text-primary-600 transition-all duration-300"
											href="#"
										>
											<Icon icon="bx:bxs-cog" class="text-lg leading-none w-7" />
											<span>Account Setting</span>
										</a>
									</li> -->
									<li>
										<a
											class="relative px-7 py-2.5 flex items-center rounded-[inherit] text-sm leading-5 font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 hover:dark:text-primary-600 transition-all duration-300"
											href="my-subscription"
										>
											<Icon icon="bx:credit-card-alt" class="text-lg leading-none w-7" />
											<span>My Subscription</span>
										</a>
									</li>
									<li>
										<a
											class="theme-toggle [&>*]:pointer-events-none relative px-7 py-2.5 flex items-center rounded-[inherit] text-sm leading-5 font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 hover:dark:text-primary-600 transition-all duration-300"
											href="javascript:void(0)"
											on:click={toggleTheme}
										>
											{#if currentTheme === 'light'}
												<div class="flex items-center">
													<Icon icon="bx:bxs-sun" class="text-lg leading-none w-7" />
													<span>Light Mode</span>
												</div>
											{:else if currentTheme === 'dark'}
												<div class="flex items-center">
													<Icon icon="bx:bxs-moon" class="text-lg leading-none w-7" />
													<span>Dark Mode</span>
												</div>
											{:else}
												<div class="flex items-center">
													<Icon icon="bx:bxs-adjust" class="text-lg leading-none w-7" />
													<span>System Mode</span>
												</div>
											{/if}
										</a>
									</li>
									<li class="block border-t border-gray-200 dark:border-gray-800 my-3"></li>
									<li>
										<a
											class="relative px-7 py-2.5 flex items-center rounded-[inherit] text-sm leading-5 font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 hover:dark:text-primary-600 transition-all duration-300"
											href="javascript:void(0)"
											on:click={logout()}
										>
											<Icon icon="lucide:log-out" class="text-lg leading-none w-7" />
											<span>Sign out</span>
										</a>
									</li>
								</ul>
							</div>
						</li>
					</ul>
				</div>
			</div>
		</div>
		<!-- container -->
	</div>
</div>

<!-- header -->

<style>
	.dropdown-menu {
		position: absolute;
		inset: 0px 0px auto auto;
		margin: 0px;
		transform: translate3d(-9.6px, 46.4px, 0px);
	}
</style>
