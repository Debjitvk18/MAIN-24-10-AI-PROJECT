<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Logo from "../general/Logo.svelte";
    import { checkAuth, logout, user } from '$lib/stores/authStore';
    import { page } from '$app/stores';

    onMount(() => {
        checkAuth();
    });

    function handleLogout(event: Event) {
        event.preventDefault();
        logout();
        goto('/');
    }

    // Page Title
    $: title = $page.url.pathname === '/' ? 'Home' : $page.url.pathname.slice(1).replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

    let open = false;

    function toggleDropdown() {
        open = !open;
    }

    function closeDropdown(event: MouseEvent) {
        if (event.target && !(event.target as Element).closest('.dropdown')) {
            open = false;
        }
    }

    // Add event listener to close the dropdown when clicking outside
    window.addEventListener('click', closeDropdown);
</script>

<nav class="bg-white border-b border-gray-100">
    <!-- Primary Navigation Menu -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
            <div class="flex">
                <!-- Logo -->
                <div class="shrink-0 flex items-center">
                    <a href="/">
                        <Logo width="200" />
                    </a>
                </div>
                <!-- Navigation Links -->
                <div class="hidden space-x-4 lg:-my-px lg:ml-10 lg:flex">
                    <a class="inline-flex items-center px-1 pt-1 border-b-2 border-indigo-400 text-sm font-medium leading-5 text-gray-900 focus:outline-none focus:border-indigo-700 transition" href="/dashboard">Dashboard</a>
                </div>
            </div>

            <div class="hidden lg:flex lg:items-center lg:ml-6">
                <!-- Settings Dropdown -->
                <div class="ml-3 relative dropdown">
                    <button class="relative" on:click={toggleDropdown} on:keydown={(event) => event.key === 'Enter' && toggleDropdown()} aria-haspopup="true" aria-expanded={open}>
                        <span class="sr-only">Open user menu</span>
                        {#if $user}
                            <img class="h-8 w-8 rounded-full object-cover" src="{$user.profile_photo_url}" alt="{$user.name}" />
                        {/if}
                    </button>
            
                    {#if open}
                        <div class="absolute z-50 mt-2 w-48 rounded-md shadow-lg origin-top-right right-0">
                            <div class="rounded-md ring-1 ring-black ring-opacity-5 py-1 bg-white">
                                <a class="block px-4 py-2 text-sm leading-5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition" href="/profile">Profile</a>
                                
                                <div class="border-t border-gray-100"></div>
            
                                <a href="/logout" class="block w-full text-left px-4 py-2 text-sm leading-5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition" on:click={handleLogout}>Log Out</a>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Hamburger -->
            <div class="-mr-2 flex items-center lg:hidden">
                <button on:click={() => open = !open} class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition" aria-label="Toggle navigation">
                    <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                        <path class:hidden={!open} class:inline-flex={open} stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        <path class:hidden={open} class:inline-flex={!open} stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        </div>
    </div>
</nav>

<header class="bg-white shadow">
    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">{title}</h2>
    </div>
</header>