import { ApiService } from '$lib/services/api-service';

export async function load({ fetch, cookies, url }) {
    let apiService = new ApiService();
    const queryParams = Object.fromEntries(url.searchParams);
    try {
        const accessToken = cookies.get('serviceapp-token');

        if (!accessToken) {
            throw new Error('No authentication token found. Please log in.');
        }
        let pageNumber = '';
        if(queryParams.page != undefined && queryParams.page) {
            pageNumber = '?page='+queryParams.page;
        }

        const res = await apiService.makeApiCall(`search-requests${pageNumber}`, {}, 'GET', 'json', accessToken);

        if (!res.success) {
            throw new Error(res.message || 'API request failed.');
        }

        if (res.search_requests.data.length && res.search_requests.data.length > 0) {
            return { searchRequests: res.search_requests };
        }

        return { searchRequests: [] };

    } catch (error) {
        console.error('Error in load function:', error.message);
        return {
            error: error.message || 'Something went wrong while fetching search requests.'
        };
    }
}
