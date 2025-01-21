import { ApiService } from './api-service';

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
}
