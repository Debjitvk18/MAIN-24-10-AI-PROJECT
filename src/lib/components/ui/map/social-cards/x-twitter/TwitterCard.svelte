<script>
    import Tweet from "$lib/components/ui/map/social-cards/x-twitter/Tweet.svelte";
    import { getSocialMediaTabs } from "$lib/utils/socialMediaUtils.js";
    import { socialMediaJson } from '$lib/stores/mapStore.ts';

    // Get the X (Twitter) platform
    const xTwitterTabs = getSocialMediaTabs('x-twitter');
    let activeTab = xTwitterTabs[0] || '';

    function switchTab(tab) {
        activeTab = tab;
    }

    let postIds = [];
    let posts = [];

    $: {
        const twitterSocialData = $socialMediaJson?.socialData?.filter(socialMedia => socialMedia.type === 'x-twitter');
        if (Array.isArray(twitterSocialData)) {
            postIds = [];
            posts = [];
            twitterSocialData.forEach(data => {
                Object.entries(data.posts).forEach(([key, value]) => {
                    value.forEach(post => {
                        if (!postIds.includes(post.id)) {
                            postIds.push(post.id);
                            if (!posts[key]) {
                                posts[key] = [];
                            }
                            posts[key].push(post);
                        }
                    });
                });
            });
        }
    }
</script>

<div class="tweets">
    <div>
        <!-- Tabs Header -->
        <div class="flex justify-start border-b border-gray-300 bg-white sticky top-0 z-10">
            {#each xTwitterTabs as tab}
                <div
                        class="cursor-pointer px-4 py-3 text-lg font-semibold text-gray-500 border-b-2 border-transparent transition-colors duration-200"
                        class:!border-blue-500={activeTab === tab}
                        class:!text-blue-500={activeTab === tab}
                        on:click={() => switchTab(tab)}>
                    {tab}
                </div>
            {/each}
        </div>

        <!-- Tabs Content -->
        <div>
            {#if posts[activeTab.toLowerCase()]}
                {#each posts[activeTab.toLowerCase()] as post}
                    <Tweet tweet={post} key={post.id}/>
                {/each}
            {/if}
        </div>
    </div>
</div>