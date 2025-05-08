/**
 * Gets the user's current geolocation position
 * @param {Object} options - Geolocation options
 * @param {boolean} options.enableHighAccuracy - Whether to use high accuracy
 * @param {number} options.timeout - Timeout in milliseconds
 * @param {number} options.maximumAge - Maximum cached position age
 * @returns {Promise<GeolocationPosition>} A promise that resolves with the position
 */
export function getUserLocation(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
    
    const geolocationOptions = { ...defaultOptions, ...options };
  
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        geolocationOptions
      );
    });
}