import { MARKER_DEFAULT_COLOR, MARKER_HIGHLIGHT_COLOR } from '$lib/constants/constants.js';

/**
 * Highlights or resets the visual state of a given marker.
 *
 * @param {Object} marker - The marker object to be manipulated.
 * @param {boolean} [highlight=true] - Determines whether to highlight the marker or reset its state.
 * @return {void} This function does not return any value.
 */
export function highlightMarker(marker, highlight = true) {
	if (!marker) return;

	const markerElement = marker.getElement();
	const targetCoordinates = [marker.getLngLat().lng, marker.getLngLat().lat];

	// Find the SVG element inside the marker
	const svgElement = markerElement.querySelector('svg');
	if (!svgElement) return;

	highlight ? highlightSvgElement(svgElement) : resetSvgElement(svgElement);
	marker.setLngLat(targetCoordinates);
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
export const COORDINATES_REGEXP = /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i;

/**
 * Generates a GeoJSON feature object for a given latitude and longitude.
 *
 * @param {number} lng - The longitude of the coordinate.
 * @param {number} lat - The latitude of the coordinate.
 * @return {Object} A GeoJSON object containing the feature's geometry, type, place name, and properties.
 */
export function coordinateFeature(lng, lat) {
	return {
		center: [lng, lat],
		geometry: {
			type: 'Point',
			coordinates: [lng, lat],
		},
		place_name: `Lat: ${lat} Lng: ${lng}`,
		place_type: ['coordinate'],
		properties: {},
		type: 'Feature',
	};
}

/**
 * Parses a query string to extract geographic coordinates and determines their validity and potential coordinate orders.
 *
 * @param {string} query The input string that potentially contains coordinate values.
 * @return {Array|null} Returns an array of geocode objects if the query contains valid coordinates; otherwise, returns null.
 */
export function parseCoordinates(query) {
	const matches = query.match(COORDINATES_REGEXP);
	if (!matches) {
		return null;
	}

	const longitude = Number(matches[1]);
	const latitude = Number(matches[2]);

	// Collect valid geocodes based on coordinate ranges
	const geocodes = [];
	if (longitude < -90 || longitude > 90) {
		// longitude first
		geocodes.push(coordinateFeature(longitude, latitude));
	}
	if (latitude < -90 || latitude > 90) {
		// latitude first
		geocodes.push(coordinateFeature(latitude, longitude));
	}
	if (geocodes.length === 0) {
		// Ambiguous case: could be either order
		geocodes.push(coordinateFeature(longitude, latitude));
		geocodes.push(coordinateFeature(latitude, longitude));
	}

	return geocodes;
}