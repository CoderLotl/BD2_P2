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

/**
 * Sends a JSON body to a backend path with the given HTTP method and
 * returns the parsed response body (or null for a 204 response).
 * Throws if the response is not ok, so callers can catch it.
 * @param {string} path e.g. '/items/123/store'
 * @param {string} method e.g. 'POST', 'PUT', 'DELETE'
 * @param {object} [body]
 * @returns {Promise<*>}
 */
export async function SendJson(path, method, body)
{
    const response = await fetch(`${API_URL}${path}`, {
        method: method,
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });

    if (response.ok === false)
    {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody.error || `Request to ${path} failed with status ${response.status}.`;
        throw new Error(message);
    }

    const hasNoContent = response.status === 204;
    if (hasNoContent === true)
    {
        return true;
    }

    const data = await response.json();
    return data;
}
