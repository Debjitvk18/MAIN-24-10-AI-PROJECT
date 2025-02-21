import { PANOID_BASE_URL, SOCIAL_MEDIA_PLATFORMS } from '$lib/constants/constants.js';
import PanoidsIconImg from '$lib/assets/svg/marker/panoids-pin.svg';
import LinkedInIconImg from '$lib/assets/svg/marker/linkedin-pin.svg';
import FacebookIconImg from '$lib/assets/svg/marker/facebook-pin.svg';
import FacebookMarketPlaceIconImg from '$lib/assets/svg/marker/facebook-marketplace-pin.svg';

/**
 * Generates a formatted object containing post data based on the input data and platform details.
 *
 * @param {Array} data - The array of input data to be processed into posts.
 * @param {Object} platformDetails - Details about the platform used to map the data.
 * @param {Function} platformDetails.mapFunction - A function to transform each item in the data array into a post.
 * @param {string} platformDetails.type - The type of platform for which the posts are generated.
 * @param {string} platformDetails.icon - The icon associated with the platform.
 * @return {Object} - An object containing the type, count of posts, platform icon, and the generated posts.
 */
function generatePostData(data, platformDetails) {
	const { mapFunction, type, icon } = platformDetails;
	const posts = mapFunction(data);

	return {
		type,
		count: posts.length,
		icon,
		posts
	};
}

/**
 * A collection of parsers for transforming raw data from various platforms into a standardized format.
 * Each key in the object represents a platform, and the associated value is a function that processes the input data
 * and returns an array of objects containing the parsed information.
 *
 * Platforms and their respective parsers:
 * - `x-twitter`: Processes data from Twitter, extracting information about tweets including text, user details, and geolocation if available.
 * - `linkedin`: Processes data from LinkedIn, extracting post content, associated images, and basic metadata.
 * - `facebook`: Processes data from Facebook, extracting user posts, geolocation, and associated images.
 * - `facebook-marketplace`: Processes data from Facebook Marketplace, extracting product details such as title, description, price, and currency.
 * - `streetview`: Processes data from Street View APIs, extracting panorama IDs, locations, and related information.
 *
 * Each parser function adheres to a common structure in its return objects:
 * - `id` (String): A unique identifier for the item.
 * - `title` (String): Title or main headline of the item.
 * - `description` (String): Additional descriptive text for the item.
 * - `image` (String): URL or path to a representative image.
 * - `lat` (Number | null): Latitude coordinate, if available.
 * - `lng` (Number | null): Longitude coordinate, if available.
 * - `url` (String): Link for further details about the item.
 *
 * For Facebook Marketplace parser, additional fields included:
 * - `price` (String | null): The price of the product.
 * - `currency` (String | null): The currency of the product's price.
 */
const PLATFORM_PARSERS = {
	'x-twitter': (data) =>
		data.tweets.map((tweetObj) => {
			const tweet = tweetObj.tweet;
			const user = tweet.user_details;
			const place = tweet.place ?? null;
			const [lng, lat] = place?.bounding_box.coordinates[0][0] || [null, null];

			return {
				id: tweetObj.entryId,
				title: tweet.full_text,
				description: tweet.full_text,
				image: user.profile_image_url_https,
				lat,
				lng,
				url: tweet?.url ?? '#'
			};
		}),
	linkedin: (data) =>
		data.posts.map((post) => ({
			id: post.urn,
			title: post.text,
			description: post.text,
			image: post.post_image || post.author.image_url || LinkedInIconImg,
			lat: null,
			lng: null,
			url: post.url ?? '#'
		})),
	facebook: (data) =>
		data.results.map((post) => ({
			id: post.id,
			title: post.message,
			description: post.message,
			image: post.actors[0]?.profile_picture || FacebookIconImg,
			lat: post.explicit_place?.latitude ?? null,
			lng: post.explicit_place?.longitude ?? null,
			url: post.url ?? '#'
		})),
	'facebook-marketplace': (data) =>
		data.data.marketplace_search.feed_units.edges
			.map((post) => {
				if (post.node?.data?.title) {
					return {
						id: post.node.id,
						title: post.node?.data?.title || '',
						description: post.node?.data?.description || '',
						image: post.node?.photo?.image?.uri || FacebookMarketPlaceIconImg,
						lat: null,
						lng: null,
						url: post.node?.link ?? '#',
						price: post.node?.data?.price?.amount_with_offset || null,
						currency: post.node?.data?.price?.currency || null
					};
				}
			})
			.filter(Boolean),
	streetview: (data) =>
		data.panoids.map((panoid) => ({
			id: panoid.panoid,
			title: `panoid - ${panoid.panoid}`,
			description: `description - ${panoid.panoid}`,
			image: PanoidsIconImg,
			lat: panoid.lat,
			lng: panoid.lon,
			url: `${PANOID_BASE_URL}${panoid.panoid}`
		}))
};

/**
 * Parses the social media response data based on the specified platform.
 *
 * @param {Object} data - The raw response data from the social media platform.
 * @param {string} platform - The name of the social media platform to parse the data for.
 * @return {Object} An object containing parsed post data, platform type, icon, and post count.
 */
export function parseSocialMediaResponse(data, platform) {
	const platformDetails = {
		mapFunction: PLATFORM_PARSERS[platform],
		type: platform,
		icon: SOCIAL_MEDIA_PLATFORMS.find((p) => p.slug === platform)?.mapIcon,
	};

	if (!platformDetails.mapFunction) {
		return { type: platform, count: 0, icon: null, posts: [] };
	}

	return generatePostData(data, platformDetails);
}