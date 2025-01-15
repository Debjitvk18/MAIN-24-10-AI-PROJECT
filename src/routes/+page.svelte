<script lang="ts">
    import Logo from "$lib/components/general/Logo.svelte";
    import { checkAuth, isLoggedIn, logout } from '$lib/stores/authStore';
    import { goto } from '$app/navigation';
    import { onMount } from "svelte";

    function handleLogout(event: Event) {
        event.preventDefault();
        logout();
        goto('/');
    }

    onMount(() => {
        checkAuth();
    });
</script>

<style>
    .full-height {
        height: 100vh;
    }

    .flex-center {
        align-items: center;
        display: flex;
        justify-content: center;
    }

    .position-ref {
        position: relative;
    }

    .top-right {
        position: absolute;
        right: 10px;
        top: 18px;
    }

    .content {
        text-align: center;
    }

    .title {
        font-size: 84px;
    }

    .links > a {
        color: #636b6f;
        padding: 0 25px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: .1rem;
        text-decoration: none;
        text-transform: uppercase;
    }

    .m-b-md {
        margin-bottom: 30px;
    }
</style>

<div class="flex-center position-ref full-height">
    <div class="top-right links">
        {#if $isLoggedIn}
            <a href="/dashboard">Dashboard</a>
            <a href="/logout" on:click={handleLogout}>Logout</a>
        {:else}
            <a href="/login">Login</a>
            <a href="/register">Register</a>
        {/if}
    </div>

    <div class="content">
        <div class="title m-b-md flex justify-center">
            <Logo />
        </div>

        <div class="links">
            <p class="text-[#636b6f] mb-5">Welcome to service app.<br/>Please use following links to continue.</p>
            {#if $isLoggedIn}
                <a href="/dashboard">Dashboard</a>
                <a href="/logout" on:click={handleLogout}>Logout</a>
            {:else}
                <a href="/login">Login</a>
                <a href="/register">Register</a>
            {/if}
        </div>
    </div>
</div>