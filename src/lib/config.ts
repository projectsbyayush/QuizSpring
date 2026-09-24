const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';
const isPlaceholder = !rawBaseUrl || /placeholder|your[-_ ]?(api|project)|<[^>]+>/i.test(rawBaseUrl);

export const API_BASE_URL = isPlaceholder ? '/api/v1' : rawBaseUrl.replace(/\/+$/, '');
export const isApiConfigured = !isPlaceholder;
