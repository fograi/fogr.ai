const SAFE_REDIRECT_PREFIX = '/';

export function safeRedirectPath(input: string | null | undefined, fallback = '/'): string {
	if (!input) return fallback;
	if (!input.startsWith(SAFE_REDIRECT_PREFIX)) return fallback;
	// Disallow protocol-relative or backslash-prefixed paths
	if (input.startsWith('//') || input.startsWith('/\\')) return fallback;
	return input;
}
