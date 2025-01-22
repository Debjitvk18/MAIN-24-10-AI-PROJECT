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