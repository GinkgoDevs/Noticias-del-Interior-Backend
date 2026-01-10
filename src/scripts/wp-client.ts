import fetch from 'node-fetch';

const WP_BASE_URL = 'https://noticiasdelinterior.com.ar';

export async function wpFetch<T>(endpoint: string): Promise<T[]> {
    const connector = endpoint.includes('?') ? '&' : '?';
    const url = `${WP_BASE_URL}/wp-json/wp/v2/${endpoint}`;

    const res = await fetch(url);
    if (!res.ok) {
        if (res.status === 400) return []; // Probable página fuera de rango
        throw new Error(`WP error: ${res.status} for ${url}`);
    }
    return res.json() as Promise<T[]>;
}
