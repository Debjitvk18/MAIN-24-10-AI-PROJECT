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