import { ApiService } from './api-service';
import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';

export class MapService {
	constructor() {
		this.apiService = new ApiService();
	}

	/**
	 * Save results.
	 *
	 * @param {Object} payload
	 * @returns {Promise<any>}
	 */
	async saveResults(payload) {
		return this.apiService.makeApiCall('map/save-results', payload, 'POST');
	}

	/**
	 * Load map results.
	 *
	 * @param {Object} payload
	 * @returns {Promise<any>}
	 */
	async getMapResults(payload) {
		return this.apiService.makeApiCall('map/search', payload, 'POST');
	}

	/**
	 * Perform reverse geocoding using Mapbox Geocoding API.
	 * @returns The place name or null if not available
	 * @param {number} lng
	 * @param {number} lat
	 */
	async reverseGeocode(lng, lat) {
		const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${PUBLIC_MAPBOX_ACCESS_TOKEN}`;

		try {
			const response = await fetch(url);
			if (!response.ok) {
				console.error('Reverse geocoding API call failed:', response.statusText);
				return null;
			}
			const data = await response.json();
			if (data.features && data.features.length > 0) {
				return data;
			}
			return null;
		} catch (err) {
			console.error('Error during reverse geocoding:', err);
			return null;
		}
	}
}
