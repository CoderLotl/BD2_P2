const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Fetches JSON data from a backend path and returns the parsed body.
 * Throws if the response is not ok, so callers can catch it.
 * @param {string} path e.g. '/item-types'
 * @returns {Promise<*>}
 */
export async function FetchJson(path)
{
    const response = await fetch(`${API_URL}${path}`);

    if (response.ok === false)
    {
        const body = await response.json().catch(() => ({}));
        const message = body.error || `Request to ${path} failed with status ${response.status}.`;
        throw new Error(message);
    }

    const data = await response.json();
    return data;
}
