/**
 * Truncate a string to a certain length.
 * 
 * @param {string} string - The string to truncate.
 * @param {number} number - The number of characters to truncate the string to.
 * @returns {string} The truncated string.
 */
export function truncateString(string, number = 50) {
    if (string.length > number) {
        return string.slice(0, number) + '...';
    }
    return string;
}

/**
 * Toggle full screen mode.
 * 
 * @param {string} elementId - The ID of the element to toggle full screen mode on.
 * @returns {void} Nothing.
 */
export function toggleFullScreen(elementId) {
    const elem = document.getElementById(elementId);

    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { // Firefox
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { // Chrome, Safari, Edge, Opera
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { // IE/Edge
            elem.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // Chrome, Safari, Edge, Opera
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
        }
    }
}

/**
 * Get data from the URL.
 * 
 * @param {string} queryString - The query string to get data from.
 * @returns {string} The data from the URL.
 */
export function getDataFromURL(queryString) {
    const url = new URL(window.location.href);
    return url.searchParams.get(queryString) || '';
}

/**
 * Put data in the URL.
 * 
 * @param {string} queryString - The query string to put data in.
 * @param {string} data - The data to put in the URL.
 * 
 * @returns {void} Nothing.
 */
export function putDataInURL(queryString, data) {
    const url = new URL(window.location.href);
    url.searchParams.set(queryString, data);
    window.history.replaceState({}, '', url);
}