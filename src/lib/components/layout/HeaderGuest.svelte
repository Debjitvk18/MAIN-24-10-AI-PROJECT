<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Logo from "../general/Logo.svelte";
    import { isLoggedIn, checkAuth, logout } from '$lib/stores/authStore';
    import { page } from '$app/stores';

    onMount(() => {
        checkAuth();
    });

    function handleLogin() {
        goto('/login');
    }
    $: title = $page.url.pathname === '/' ? 'Dashboard' : $page.url.pathname.slice(1).replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
</script>

<nav class="bg-white border-b border-gray-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
            <div class="flex">
                <div class="shrink-0 flex items-center">
                    <a href="/">
                        <Logo width="200" />
                    </a>
                </div>
                <div class="hidden space-x-4 lg:-my-px lg:ml-10 lg:flex">
                    <a class="inline-flex items-center px-1 pt-1 border-b-2 border-indigo-400 text-sm font-medium leading-5 text-gray-900 focus:outline-none focus:border-indigo-700 transition" href="/">Home</a>
                    <a class="inline-flex items-center px-1 pt-1 text-sm font-medium leading-5 text-gray-900 focus:outline-none focus:border-indigo-700 transition" href="/about">About</a>
                </div>
            </div>

            <div class="hidden lg:flex lg:items-center lg:ml-6">
                {#if isLoggedIn}
                    <button class="inline-flex items-center px-1 pt-1 text-sm font-medium leading-5 text-gray-900 focus:outline-none focus:border-indigo-700 transition" on:click={logout}>Logout</button>
                {:else}
                    <button class="inline-flex items-center px-1 pt-1 text-sm font-medium leading-5 text-gray-900 focus:outline-none focus:border-indigo-700 transition" on:click={handleLogin}>Login</button>
                {/if}
            </div>
        </div>
    </div>
</nav>

<header class="bg-white shadow">
    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">{title}</h2>
    </div>
</header>