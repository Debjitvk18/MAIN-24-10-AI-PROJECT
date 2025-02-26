<script>
    import Tweet from "$lib/components/ui/map/social-cards/x-twitter/Tweet.svelte";

    export let tweets = [];

    let activeTab = 'Top';

    function switchTab(tab) {
        activeTab = tab;
    }
</script>

<div>
    <!-- Tabs Header -->
    <div class="flex justify-start border-b border-gray-300 bg-white sticky top-0 z-10">
        <div
                class="cursor-pointer px-4 py-3 text-lg font-semibold text-gray-500 border-b-2 border-transparent transition-colors duration-200"
                class:!border-blue-500={activeTab === 'Top'}
                class:!text-blue-500={activeTab === 'Top'}
                on:click={() => switchTab('Top')}>
            Top
        </div>
        <div
                class="cursor-pointer px-4 py-3 text-lg font-semibold text-gray-500 border-b-2 border-transparent transition-colors duration-200"
                class:!border-blue-500={activeTab === 'Latest'}
                class:!text-blue-500={activeTab === 'Latest'}
                on:click={() => switchTab('Latest')}>
            Latest
        </div>
    </div>


    <!-- Tabs Content -->
    {#if activeTab === 'Top'}
        <div>
            {#each tweets.top as topTweet}
                <Tweet id={topTweet.id} name={topTweet.name} handle={topTweet.handle}
                       profileImage={topTweet.profileImage}
                       verifyIcon={topTweet.verifyIcon} postTime={topTweet.postTime} comments={topTweet.comments}
                       reposts={topTweet.reposts} likes={topTweet.likes} postUrl={topTweet.postUrl}
                       postType={topTweet.postType}
                       content={topTweet.content}/>
            {/each}
        </div>
    {:else if activeTab === 'Latest'}
        <div>
            {#each tweets.latest as latestTweet}
                <Tweet id={latestTweet.id} name={latestTweet.name} handle={latestTweet.handle}
                       profileImage={latestTweet.profileImage}
                       verifyIcon={latestTweet.verifyIcon} postTime={latestTweet.postTime}
                       comments={latestTweet.comments}
                       reposts={latestTweet.reposts} likes={latestTweet.likes} postUrl={latestTweet.postUrl}
                       postType={latestTweet.postType}
                       content={latestTweet.content}/>
            {/each}
        </div>
    {/if}
</div>