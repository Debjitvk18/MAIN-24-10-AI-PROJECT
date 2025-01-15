import { ApiService } from './api-service';

export class AuthService {
	constructor() {
		this.apiService = new ApiService();
	}

	/**
	 * Login user.
	 *
	 * @param {Object} payload
	 * @returns {Promise<any>}
	 */
	async login(payload) {
		return this.apiService.makeApiCall('login', payload, 'POST');
	}

	/**
	 * Register user.
	 *
	 * @param {Object} payload
	 * @returns {Promise<any>}
	 */
	async register(payload) {
		return this.apiService.makeApiCall('register', payload, 'POST');
	}

	/**
	 * Forgot password.
	 *
	 * @param {Object} payload
	 * @returns {Promise<any>}
	 */
	async forgotPassword(payload) {
		return this.apiService.makeApiCall('forgot-password', payload, 'POST');
	}
}
