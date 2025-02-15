import { ApiService } from '$lib/services/api-service';

export async function load({ fetch, cookies, url, params }) {

    try {

        let apiService = new ApiService();

        const accessToken = cookies.get('serviceapp-token');

        if (!accessToken) {
            throw new Error('No authentication token found. Please log in.');
        }

        const res = await apiService.makeApiCall(`search-requests/${params.id}`, {}, 'GET', 'json', accessToken);

        if (!res.success) {
            throw new Error(res.message || 'API request failed.');
        }
        
        return { searchRequest: res.search_request || [] };


    } catch (error) {
        console.error('Error in load function:', error.message);
        return {
            error: error.message || 'Something went wrong while fetching search requests.'
        };
    }
}
