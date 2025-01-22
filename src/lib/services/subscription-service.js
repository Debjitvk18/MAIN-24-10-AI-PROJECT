import { ApiService } from './api-service';

export class SubscriptionService {
    constructor() {
        this.apiService = new ApiService();
    }

    /**
     * Get Plans.
     *
     * @returns {Promise<any>}
     */
    async getPricingPlans() {
        return this.apiService.makeApiCall('pricing-plans');
    }
}
