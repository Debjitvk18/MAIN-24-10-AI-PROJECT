<script>
    import TwitterTabs from "$lib/components/ui/map/social-cards/twitter/TwitterTabs.svelte";

    // Example array of tweets
    let tweetsData = {
        latest: [
            {
                id: 2,
                name: "Jane Smith",
                handle: "@janesmith",
                profileImage: "https://placehold.co/40",
                verifyIcon: null,
                postTime: "1h",
                comments: 24,
                reposts: 47,
                likes: 78,
                postUrl: "#",
                postType: "image",
                content: "https://via.placeholder.com/400"
            },
            {
                id: 3,
                name: "Example User",
                handle: "@exampleuser",
                profileImage: "https://placehold.co/40",
                verifyIcon: "material-symbols:verified",
                postTime: "30m",
                comments: 5,
                reposts: 15,
                likes: 25,
                postUrl: "#",
                postType: "video",
                content: "https://www.example.com/video.mp4"
            }
        ],
        top: [
            {
                id: 1,
                name: "John Doe",
                handle: "@johndoe",
                profileImage: "https://placehold.co/40",
                verifyIcon: "material-symbols:verified",
                postTime: "2h",
                comments: 12,
                reposts: 34,
                likes: 56,
                postUrl: "#",
                postType: "text",
                content: "This is a sample text tweet!"
            }
        ]
    };
</script>

<div class="tweets max-w-lg w-full">
    <TwitterTabs tweets={tweetsData}/>
</div>