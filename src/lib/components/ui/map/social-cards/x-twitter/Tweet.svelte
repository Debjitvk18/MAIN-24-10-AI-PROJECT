<script>
    import Icon from '@iconify/svelte';
    import * as Tooltip from '$lib/components/ui/tooltip';
    import TweetTooltip from './TweetTooltip.svelte';
    import TextTweet from "$lib/components/ui/map/social-cards/x-twitter/TextTweet.svelte";
    import ImageTweet from "$lib/components/ui/map/social-cards/x-twitter/ImageTweet.svelte";
    import VideoTweet from "$lib/components/ui/map/social-cards/x-twitter/VideoTweet.svelte";
    import {formatTwitterDate} from "$lib/utils/dateTimeUtils.js";

    export let tweet;

    const userClass = 'font-bold text-gray-900';
    const profileImageClass = 'w-10 h-10 rounded-full';
    const verifyIconClass = 'h-4 w-4 text-blue-500';
    const mutedTextClass = 'text-gray-500';
    const actionsClass = 'flex items-center justify-between text-gray-500 text-sm mt-3';
</script>

<div class="tweet p-4 border-b border-gray-200 {tweet.id}">
    <a href={tweet.url} target="_blank">
        <div class="flex items-start space-x-4">
            <!-- Profile Section -->
            <img alt="Profile" class={profileImageClass} src={tweet.userProfilePhoto}/>
            <div class="w-full">
                <!-- User Information Section -->
                <div class="flex items-center space-x-1">
                    <span class={userClass}>{tweet.userName}</span>
                    {#if tweet.isUserVerified}
                        <Icon icon="bitcoin-icons:verify-filled" class={verifyIconClass}/>
                    {/if}
                    <span class={mutedTextClass}>@{tweet.userScreenName} ·
                        <Tooltip.Root>
                            <Tooltip.Trigger>
                                {formatTwitterDate(tweet.postTime)}
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                                <p>{tweet.postTime}</p>
                            </Tooltip.Content>
                        </Tooltip.Root>
                    </span>
                </div>

                <!-- Post Content Section -->
                {#if tweet.type === "video"}
                    <VideoTweet content={tweet.content} media={tweet.postMedia}/>
                {:else if tweet.type === "photo"}
                    <ImageTweet content={tweet.content} media={tweet.postMedia}/>
                {:else}
                    <TextTweet content={tweet.content} />
                {/if}

                <!-- Actions Section -->
                <div class={actionsClass}>
                    <TweetTooltip count={tweet.replyCount} icon="lineicons:comment-1" text="Reply"/>
                    <TweetTooltip count={tweet.retweetCount} icon="garden:arrow-retweet-stroke-16" text="Repost"/>
                    <TweetTooltip count={tweet.favoriteCount} icon="material-symbols:favorite-outline-rounded" text="Like"/>
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