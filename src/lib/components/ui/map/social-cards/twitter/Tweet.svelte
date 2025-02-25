<script>
    import Icon from '@iconify/svelte';
    import TweetTooltip from './TweetTooltip.svelte';
    import TextTweet from "$lib/components/ui/map/social-cards/twitter/TextTweet.svelte";
    import ImageTweet from "$lib/components/ui/map/social-cards/twitter/ImageTweet.svelte";
    import VideoTweet from "$lib/components/ui/map/social-cards/twitter/VideoTweet.svelte";

    export let id = 0;
    export let name = "Anonymous";
    export let handle = "@anonymous";
    export let profileImage = "https://placehold.co/40";
    export let verifedProfile = false;
    export let postTime = "0h";
    export let comments = 0;
    export let reposts = 0;
    export let likes = 0;
    export let postUrl = '#';
    export let postType = 'text';
    export let content = '';

    // Consolidated reusable class strings
    const userClass = 'font-bold text-gray-900';
    const profileImageClass = 'w-10 h-10 rounded-full';
    const verifyIconClass = 'h-4 w-4 text-blue-500';
    const mutedTextClass = 'text-gray-500';
    const actionsClass = 'flex items-center justify-between text-gray-500 text-sm mt-3';
</script>

<div class="tweet p-4 border-b border-gray-200 {id}">
    <a href={postUrl} target="_blank">
        <div class="flex items-start space-x-4">
            <!-- Profile Section -->
            <img alt="Profile" class={profileImageClass} src={profileImage}/>
            <div class="w-full">
                <!-- User Information Section -->
                <div class="flex items-center space-x-1">
                    <span class={userClass}>{name}</span>
                    {#if verifedProfile}
                        <Icon icon="bitcoin-icons:verify-filled" class={verifyIconClass}/>
                    {/if}
                    <span class={mutedTextClass}>{handle} · {postTime}</span>
                </div>

                <!-- Post Content Section -->
                {#if postType === "video"}
                    <VideoTweet postData={content}/>
                {:else if postType === "image"}
                    <ImageTweet postData={content}/>
                {:else}
                    <TextTweet postData={content}/>
                {/if}

                <!-- Actions Section -->
                <div class={actionsClass}>
                    <TweetTooltip count={comments} icon="lineicons:comment-1" text="Reply"/>
                    <TweetTooltip count={reposts} icon="garden:arrow-retweet-stroke-16" text="Repost"/>
                    <TweetTooltip count={likes} icon="material-symbols:favorite-outline-rounded" text="Like"/>
                </div>
            </div>
        </div>
    </a>
</div>

<style>
    .tweet:hover {
        border-color: #007BFF;
        background-color: #f0f9ff;
    }
</style>