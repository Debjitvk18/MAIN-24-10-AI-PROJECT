import { MARKER_DEFAULT_COLOR, MARKER_HIGHLIGHT_COLOR } from '$lib/constants/constants.js';
import { MapService } from '$lib/services/map-service.js';
import { getDataFromURL } from '$lib/utils/generalUtils.js';
import { hoveredPostId } from '$lib/stores/mapStore.ts';

/**
 * Regular expression to match and extract latitude and longitude coordinates from a string.
 *
 * - The pattern allows optional "Lat: " and "Lng: " prefixes before the latitude and longitude values.
 * - It accepts both positive and negative decimal numbers for latitude and longitude.
 * - Coordinates can be separated by a comma, space, or both.
 * - Leading and trailing spaces around the input string are ignored.
 * - The match is case-insensitive.
 *
 * Groups:
 * 1. Latitude (as a signed decimal number)
 * 2. Longitude (as a signed decimal number)
 */
export const COORDINATES_REGEXP =
	/^\s*(?:Lat: )?(-?\d+(\.\d+)?)[,\s]+(?:Lng: )?(-?\d+(\.\d+)?)\s*$/i;

/**
 * Highlights a map marker by modifying its visual appearance. Optionally animates the map view
 * to center on the marker's location.
 *
 * @param {Object} marker The marker object to be highlighted. Must have methods like `getElement` and `getLngLat`.
 * @param {Object} mapInstance The map instance on which the marker resides. Must support `flyTo` method.
 * @param {boolean} [flyTo=false] Determines whether the map should animate to the marker's location.
 * @return {void}
 */
export function highlightMarker(marker, mapInstance, flyTo = false) {
	if (!marker || !mapInstance) return;

	const element = marker.getElement();

	// Find the SVG element inside the marker
	const svgElement = element.querySelector('svg');
	if (!svgElement) return;

	// Highlight the marker visually
	if (flyTo) {
		highlightSvgElement(svgElement);
	} else {
		resetSvgElement(svgElement);
	}

	if (flyTo) {
		// Fly to marker's location
		const [lng, lat] = marker.getLngLat().toArray();
		mapInstance.flyTo({
			center: [lng, lat],
			zoom: 18.5,
			speed: 1.2, // Adjust speed if necessary
			curve: 1.5,
			essential: true
		});
	}
}

/**
 * Highlights an SVG element by applying a scaling transformation and changing its fill color.
 *
 * @param {SVGElement} svgElement - The SVG element to be highlighted.
 * @return {void} This function does not return a value.
 */
function highlightSvgElement(svgElement) {
	svgElement.style.transition = 'transform 0.5s ease-out';
	svgElement.style.transform = 'scale(1.5)';
	svgElement.style.fill = MARKER_HIGHLIGHT_COLOR;
}

/**
 * Resets the transformation and fill color of an SVG element to its default state.
 *
 * @param {SVGElement} svgElement - The SVG element to be reset.
 * @return {void} No return value.
 */
function resetSvgElement(svgElement) {
	svgElement.style.transform = 'scale(1)';
	svgElement.style.fill = MARKER_DEFAULT_COLOR;
}

/**
 * Parses a query string to extract latitude and longitude coordinates, and performs reverse geocoding
 * to fetch associated geolocation features.
 *
 * @param {string} query - The input query containing coordinate data as a string.
 * @return {Array<Object>} An array of geocode features resulting from reverse geocoding. Returns an empty array if parsing fails.
 */
export function parseCoordinates(query) {
	const matches = query.match(COORDINATES_REGEXP);
	if (!matches) {
		return [];
	}

	const longitude = Number(matches[1]);
	const latitude = Number(matches[3]);
	const geocodes = [];

	const mapService = new MapService();
	mapService
		.reverseGeocode(longitude, latitude)
		.then((features) => {
			features.features.forEach((feature) => geocodes.push(feature));
		})
		.catch((error) => {
			console.error('Reverse geocoding failed:', error);
		});

	return geocodes;
}

/**
 * Handles the event when a marker is hovered over by setting the hovered post ID.
 *
 * @param {string|number} postId - The identifier of the post associated with the hovered marker.
 * @return {void} This function does not return a value.
 */
export function handleMarkerHover(postId) {
	hoveredPostId.set(postId);
}
