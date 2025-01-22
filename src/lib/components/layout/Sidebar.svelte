<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import Logo from '../general/Logo.svelte';
	import { slideDown, slideUp } from '$lib/utils/animation';

	// Menu functions.
	let Menu = {
		load: (elm, subparent) => {
			let parent = elm.parentElement;
			if (!parent.classList.contains(subparent)) {
				parent.classList.add(subparent);
			}
		},
		toggle: (elm, active) => {
			let parent = elm.parentElement;
			let nextelm = elm.nextElementSibling;
			let speed = nextelm.children.length > 5 ? 400 + nextelm.children.length * 10 : 400;
			if (!parent.classList.contains(active)) {
				parent.classList.add(active);
				slideDown(nextelm, speed);
			} else {
				parent.classList.remove(active);
				slideUp(nextelm, speed);
			}
		},
		closeSiblings: (elm, active, subparent, submenu) => {
			let parent = elm.parentElement;
			let siblings = parent.parentElement.children;
			Array.from(siblings).forEach((item) => {
				if (item !== parent) {
					item.classList.remove(active);
					if (item.classList.contains(subparent)) {
						let subitem = item.querySelectorAll(`.${submenu}`);
						subitem.forEach((child) => {
							child.parentElement.classList.remove(active);
							slideUp(child, 400);
						});
					}
				}
			});
		}
	};

	// Sidebar functions.
	let Sidebar = {
		compact: function () {
			let toggle = document.querySelectorAll('.sidebar-compact-toggle');
			let parent = document.querySelector('.serviceapp-sidebar');
			let body = parent && parent.querySelector('.serviceapp-sidebar-body');
			toggle.forEach((item) => {
				item.addEventListener('click', function (e) {
					e.preventDefault();
					item.classList.toggle('compact-active');
					parent.classList.toggle('is-compact');
					if (!parent.classList.contains('is-compact')) {
						parent.classList.remove('has-hover');
					}
				});
			});
			if (body) {
				body.addEventListener('mouseenter', function () {
					if (parent.classList.contains('is-compact')) {
						parent.classList.add('has-hover');
					}
				});
				body.addEventListener('mouseleave', function () {
					if (parent.classList.contains('is-compact')) {
						parent.classList.remove('has-hover');
					}
				});
			}
		},

		toggle: function () {
			let toggle = document.querySelectorAll('.sidebar-toggle');
			let parent = document.querySelector('.serviceapp-sidebar');
			toggle.forEach((item) => {
				item.addEventListener('click', function (e) {
					e.preventDefault();
					item.classList.toggle('active');
					if (parent) {
						parent.classList.toggle('sidebar-visible');
					}
					document.body.classList.toggle('overflow-hidden');
				});
			});
		},

		page_resize: function () {
			let toggle = document.querySelectorAll('.sidebar-toggle');
			let parent = document.querySelector('.serviceapp-sidebar');
			if (config.win.width > config.break.xl) {
				toggle.forEach((item) => {
					item.classList.remove('active');
				});
				if (parent) {
					parent.classList.remove('sidebar-visible');
				}
				document.body.classList.remove('overflow-hidden');
			}
		}
	};

	let classes = {
		menu: {
			main: 'serviceapp-menu',
			item: 'serviceapp-menu-item',
			link: 'serviceapp-menu-link',
			toggle: 'serviceapp-menu-toggle',
			sub: 'serviceapp-menu-sub',
			subparent: 'has-sub',
			active: 'active',
			current: 'current-page'
		}
	};

	onMount(() => {
		// Toggle sub menu visibility.
		const elm = document.querySelectorAll(`.${classes.menu.toggle}`);
		let active = classes.menu.active;
		let subparent = classes.menu.subparent;
		let submenu = classes.menu.sub;
		elm.forEach((item) => {
			Menu.load(item, subparent);
			item.addEventListener('click', function (e) {
				e.preventDefault();
				Menu.toggle(item, active);
				Menu.closeSiblings(item, active, subparent, submenu);
			});
		});

		// Sidebar toggle.
		Sidebar.compact();
		Sidebar.toggle();
		window.addEventListener('resize', function () {
			Sidebar.page_resize();
		});
	});
</script>

<div
	class="serviceapp-sidebar group/sidebar peer dark fixed w-72 [&.is-compact:not(.has-hover)]:w-[74px] min-h-screen max-h-screen overflow-hidden h-full start-0 top-0 z-[1031] transition-[transform,width] duration-300 -translate-x-full rtl:translate-x-full xl:translate-x-0 xl:rtl:translate-x-0 [&.sidebar-visible]:translate-x-0"
>
	<div
		class="flex items-center min-w-full w-72 h-16 border-b border-e bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-900 px-6 py-3 overflow-hidden"
	>
		<div class="-ms-1 me-4">
			<div class="hidden xl:block">
				<a
					href="/"
					class="sidebar-compact-toggle [&>*]:pointer-events-none inline-flex items-center isolate relative h-9 w-9 px-1.5 before:content-[''] before:absolute before:-z-[1] before:h-5 before:w-5 hover:before:h-10 hover:before:w-10 before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-300 before:-translate-x-1/2 before:-translate-y-1/2 before:top-1/2 before:left-1/2 before:bg-gray-200 dark:before:bg-gray-900"
				>
					<Icon class="text-2xl text-slate-600 dark:text-slate-300" icon="ic:round-menu" />
				</a>
			</div>

			<div class="xl:hidden">
				<a
					href="/"
					class="sidebar-toggle [&>*]:pointer-events-none inline-flex items-center isolate relative h-9 w-9 px-1.5 before:content-[''] before:absolute before:-z-[1] before:h-5 before:w-5 hover:before:h-10 hover:before:w-10 before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-300 before:-translate-x-1/2 before:-translate-y-1/2 before:top-1/2 before:left-1/2 before:bg-gray-200 dark:before:bg-gray-900"
				>
					<Icon
						class="text-2xl text-slate-600 dark:text-slate-300 rtl:-scale-x-100"
						icon="formkit:arrowleft"
					/>
				</a>
			</div>
		</div>

		<div class="relative flex flex-shrink-0">
			<a
				href="/"
				class="relative inline-block transition-opacity duration-300 h-9 group-[&.is-compact:not(.has-hover)]/sidebar:opacity-0"
			>
				<Logo />
			</a>
		</div>
	</div>
	<div
		class="serviceapp-sidebar-body max-h-full relative overflow-hidden w-full bg-white dark:bg-gray-950 border-e border-gray-200 dark:border-gray-900"
	>
		<div class="flex flex-col w-full h-[calc(100vh-theme(spacing.16))]">
			<div class="h-full pt-4 pb-10">
				<ul class="serviceapp-menu">
					<li
						class="relative first:pt-1 pt-10 pb-2 px-6 before:absolute before:h-px before:w-full before:start-0 before:top-1/2 before:bg-gray-200 dark:before:bg-gray-900 first:before:hidden before:opacity-0 group-[&.is-compact:not(.has-hover)]/sidebar:before:opacity-100"
					>
						<h6
							class="group-[&.is-compact:not(.has-hover)]/sidebar:opacity-0 text-slate-400 dark:text-slate-300 whitespace-nowrap uppercase font-bold text-xs tracking-relaxed leading-tight"
						>
							Dashboard
						</h6>
					</li>
					<li
						class="serviceapp-menu-item py-0.5 group/item {$page.url.pathname === '/dashboard'
							? 'active current-page'
							: ''}"
					>
						<a
							href="/dashboard"
							class="serviceapp-menu-link flex relative items-center align-middle py-2.5 ps-6 pe-10 font-heading font-bold tracking-snug group"
						>
							<span
								class="font-normal tracking-normal w-9 inline-flex flex-grow-0 flex-shrink-0 text-slate-400 group-[.active]/item:text-primary-500 group-hover:text-primary-500"
							>
								<Icon
									class="text-2xl leading-none text-current transition-all duration-300"
									icon="lucide:layout-dashboard"
								/>
							</span>
							<span
								class="group-[&.is-compact:not(.has-hover)]/sidebar:opacity-0 flex-grow-1 inline-block whitespace-nowrap transition-all duration-300 text-slate-600 dark:text-slate-500 group-[.active]/item:text-primary-500 group-hover:text-primary-500"
								>Dashboard</span
							>
						</a>
					</li>

					<li
						class="serviceapp-menu-item py-0.5 has-sub group/item {['/profile'].includes(
							$page.url.pathname
						)
							? 'active current-page show'
							: ''}"
					>
						<a
							href="javascript:void(0)"
							class="serviceapp-menu-link serviceapp-menu-toggle flex relative items-center align-middle py-2.5 ps-6 pe-10 font-heading font-bold tracking-snug group"
						>
							<span
								class="font-normal tracking-normal w-9 inline-flex flex-grow-0 flex-shrink-0 text-slate-400 group-[.active]/item:text-primary-500 group-hover:text-primary-500"
							>
								<Icon
									icon="bx:bxs-user"
									class="text-2xl leading-none text-current transition-all duration-300"
								/>
							</span>
							<span
								class="group-[&.is-compact:not(.has-hover)]/sidebar:opacity-0 flex-grow-1 inline-block whitespace-nowrap transition-all duration-300 text-slate-600 dark:text-slate-500 group-[.active]/item:text-primary-500 group-hover:text-primary-500"
								>My Account</span
							>
							<Icon
								icon="lucide:chevron-right"
								class="group-[&.is-compact:not(.has-hover)]/sidebar:opacity-0 text-base leading-none text-slate-400 group-[.active]/item:text-primary-500 absolute end-5 top-1/2 -translate-y-1/2 rtl:-scale-x-100 group-[.active]/item:rotate-90 group-[.active]/item:rtl:-rotate-90 transition-all duration-300"
							/>
						</a>
						<ul
							class="serviceapp-menu-sub mb-1 hidden group-[&.is-compact:not(.has-hover)]/sidebar:!hidden"
							style={['/profile'].includes($page.url.pathname) ? 'display: block' : ''}
						>
							<li
								class="serviceapp-menu-item py-px group/sub1 {$page.url.pathname === '/profile'
									? 'active current-page'
									: ''}"
							>
								<a
									href="/profile"
									class="serviceapp-menu-link flex relative items-center align-middle py-1.5 pe-10 ps-[calc(theme(spacing.6)+theme(spacing.9))] font-normal leading-5 text-sm tracking-normal normal-case"
								>
									<span
										class="text-slate-600 dark:text-slate-500 group-[.active]/sub1:text-primary-500 hover:text-primary-500 whitespace-nowrap flex-grow inline-block"
										>View Profile</span
									>
								</a>
							</li>
							<li class="serviceapp-menu-item py-px group/sub1">
								<a
									href="/profile"
									class="serviceapp-menu-link flex relative items-center align-middle py-1.5 pe-10 ps-[calc(theme(spacing.6)+theme(spacing.9))] font-normal leading-5 text-sm tracking-normal normal-case"
								>
									<span
										class="text-slate-600 dark:text-slate-500 group-[.active]/sub1:text-primary-500 hover:text-primary-500 whitespace-nowrap flex-grow inline-block"
										>Account Settings</span
									>
								</a>
							</li>
							<li class="serviceapp-menu-item py-px group/sub1">
								<a
									href="/profile"
									class="serviceapp-menu-link flex relative items-center align-middle py-1.5 pe-10 ps-[calc(theme(spacing.6)+theme(spacing.9))] font-normal leading-5 text-sm tracking-normal normal-case"
								>
									<span
										class="text-slate-600 dark:text-slate-500 group-[.active]/sub1:text-primary-500 hover:text-primary-500 whitespace-nowrap flex-grow inline-block"
										>My Subscription</span
									>
								</a>
							</li>
						</ul>
					</li>

					<li class="serviceapp-menu-item py-0.5 has-sub group/item">
						<a
							href="javascript:void(0)"
							class="serviceapp-menu-link serviceapp-menu-toggle flex relative items-center align-middle py-2.5 ps-6 pe-10 font-heading font-bold tracking-snug group"
						>
							<span
								class="font-normal tracking-normal w-9 inline-flex flex-grow-0 flex-shrink-0 text-slate-400 group-[.active]/item:text-primary-500 group-hover:text-primary-500"
							>
								<Icon
									class="text-2xl leading-none text-current transition-all duration-300"
									icon="lucide:star"
								/>
							</span>
							<span
								class="group-[&.is-compact:not(.has-hover)]/sidebar:opacity-0 flex-grow-1 inline-block whitespace-nowrap transition-all duration-300 text-slate-600 dark:text-slate-500 group-[.active]/item:text-primary-500 group-hover:text-primary-500"
								>Demo Menu</span
							>
							<Icon
								icon="lucide:chevron-right"
								class="group-[&.is-compact:not(.has-hover)]/sidebar:opacity-0 text-base leading-none text-slate-400 group-[.active]/item:text-primary-500 absolute end-5 top-1/2 -translate-y-1/2 rtl:-scale-x-100 group-[.active]/item:rotate-90 group-[.active]/item:rtl:-rotate-90 transition-all duration-300"
							/>
						</a>
						<ul
							class="serviceapp-menu-sub mb-1 hidden group-[&.is-compact:not(.has-hover)]/sidebar:!hidden"
						>
							<li class="serviceapp-menu-item py-px group/sub1">
								<a
									href="/demo"
									class="serviceapp-menu-link flex relative items-center align-middle py-1.5 pe-10 ps-[calc(theme(spacing.6)+theme(spacing.9))] font-normal leading-5 text-sm tracking-normal normal-case"
								>
									<span
										class="text-slate-600 dark:text-slate-500 group-[.active]/sub1:text-primary-500 hover:text-primary-500 whitespace-nowrap flex-grow inline-block"
										>Sub Demo Menu</span
									>
								</a>
							</li>
						</ul>
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>
<!-- sidebar -->
<div
	class="sidebar-toggle fixed inset-0 bg-slate-950 bg-opacity-20 z-[1030] opacity-0 invisible peer-[.sidebar-visible]:opacity-100 peer-[.sidebar-visible]:visible xl:!opacity-0 xl:!invisible"
></div>
