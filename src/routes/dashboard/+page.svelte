<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { isLoggedIn, checkAuth } from '$lib/stores/authStore';

    let loggedIn = false;

    onMount(() => {
        checkAuth();
        const unsubscribe = isLoggedIn.subscribe(value => {
            loggedIn = value;
            if (!loggedIn) {
                goto('/login');
            }
        });

        return () => {
            unsubscribe();
        };
    });
</script>

<main>
    <div class="py-12">
        <div>
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-6">Welcome to your Dashboard</h2>
                    <p class="text-gray-600 mt-2">Dashboard contents are coming soon...</p>
                </div>
            </div>
        </div>
    </div>
</main>