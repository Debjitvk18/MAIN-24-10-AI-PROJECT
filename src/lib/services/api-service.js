import { API_BASE_URL, AUTH_TOKEN } from '$lib/constants/constants';

export class ApiService {
	/**
	 * @param {string} endpoint
	 * @param {Object} payload
	 * @param {string} method
	 * @param {string} requestType
	 *
	 * @returns {Promise<any>}
	 */
	async makeApiCall(
		endpoint,
		payload = {},
		method = 'GET',
		requestType = 'json',
		access_token = false
	) {
		let headers;
		let fetchOptions;
		let userToken = access_token || localStorage.getItem(AUTH_TOKEN) || false;

		if (requestType !== 'formdata') {
			headers = {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: `Bearer ${userToken}`
			};

			fetchOptions = {
				method,
				headers
			};
		} else {
			headers = {};
			fetchOptions = {
				method,
				headers
			};
		}

		if (userToken) {
			headers.Authorization = `Bearer ${userToken}`;
		}

		if (method !== 'GET') {
			fetchOptions.body = requestType === 'formdata' ? payload : JSON.stringify(payload);
		}

		const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

		if (requestType === 'blob') {
			return await response.blob();
		}

		return response.json();
	}
}
