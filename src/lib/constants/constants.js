import { PUBLIC_API_URL } from '$env/static/public';
import TwitterIcon from '$lib/assets/svg/marker/x-pin.svg?raw';
import PanoidsIcon from '$lib/assets/svg/marker/panoids-pin.svg?raw';
import LinkedInIcon from '$lib/assets/svg/marker/linkedin-pin.svg?raw';
import FacebookIcon from '$lib/assets/svg/marker/facebook-pin.svg?raw';
import FacebookMarketPlaceIcon from '$lib/assets/svg/marker/facebook-marketplace-pin.svg?raw';
import InstagramIcon from '$lib/assets/svg/marker/insta-pin.svg?raw';
import GoogleNewsIcon from '$lib/assets/svg/marker/google-news-pin.svg?raw';

// ================= API Constants =================
export const API_BASE_URL = `${PUBLIC_API_URL}/api/v1/`;

// ================= LocalStorage Keys =================
export const AUTH_TOKEN = 'serviceapp-token';
export const USER_KEY = 'serviceapp-user';

// ================= Defaults =================
export const NON_PANEL_ROUTES = ['login', 'register', 'forgot-password', 'reset-password'];

// ================= Fixed URLS =================
export const PANOID_BASE_URL = 'https://www.google.com/maps/@?api=1&map_action=pano&pano=';

// ================= Map Things =================
export const MAPBOX_THEMES = [
	{ name: 'Mapbox Streets', style: 'mapbox://styles/mapbox/streets-v12' },
	{ name: 'Mapbox Outdoors', style: 'mapbox://styles/mapbox/outdoors-v12' },
	{ name: 'Mapbox Light', style: 'mapbox://styles/mapbox/light-v10' },
	{ name: 'Mapbox Dark', style: 'mapbox://styles/mapbox/dark-v10' },
	{ name: 'Mapbox Satellite', style: 'mapbox://styles/mapbox/satellite-v9' },
	{ name: 'Mapbox Satellite Streets', style: 'mapbox://styles/mapbox/satellite-streets-v11' },
	{ name: 'Mapbox Navigation Day', style: 'mapbox://styles/mapbox/navigation-day-v1' },
	{ name: 'Mapbox Navigation Night', style: 'mapbox://styles/mapbox/navigation-night-v1' }
];

export const REFRESH_FREQUENCY_OPTIONS = [
	"No Refresh",
	"Daily",
	"Monthly",
];


export const MARKER_HIGHLIGHT_COLOR = '#448ee4';
export const MARKER_DEFAULT_COLOR = 'black';
export const SOCIAL_MARKER_CLASS = 'social-marker';
export const MARKER_FONT_SIZE = '20px';

export const MAP_PRIMARY_COLOR = '#2462ea';

export const SOCIAL_MEDIA_PLATFORMS = [
	{name: 'X (Twitter)', slug: 'x-twitter', tabIcon: 'ri:twitter-x-fill', mapIcon: TwitterIcon, visibility: true, tabs: ["Top", "Latest"]},
	{name: 'LinkedIn', slug: 'linkedin', tabIcon: 'mdi:linkedin', mapIcon: LinkedInIcon, visibility: true, tabs: []},
	{name: 'Facebook', slug: 'facebook', tabIcon: 'lucide:facebook', mapIcon: FacebookIcon, visibility: true, tabs: []},
	{name: 'Marketplace', slug: 'facebook-marketplace', tabIcon: 'lucide:facebook', mapIcon: FacebookMarketPlaceIcon, visibility: true, tabs: []},
	{name: 'Instagram', slug: 'instagram', tabIcon: 'lucide:instagram', mapIcon: InstagramIcon, visibility: true, tabs: []},
	{name: 'Google News', slug: 'google-news', tabIcon: 'simple-icons:googlenews', mapIcon: GoogleNewsIcon, visibility: true, tabs: []},
	{name: 'Panoids', slug: 'streetview', tabIcon: 'lucide:map-pinned', mapIcon: PanoidsIcon, visibility: true, tabs: []},
];
