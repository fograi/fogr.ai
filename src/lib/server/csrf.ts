export function isSameOrigin(request: Request, url: URL): boolean {
	const origin = request.headers.get('origin');
	if (origin && origin === url.origin) return true;

	const referer = request.headers.get('referer');
	if (referer) {
		try {
			return new URL(referer).origin === url.origin;
		} catch {
			return false;
		}
	}

	const fetchSite = request.headers.get('sec-fetch-site');
	if (fetchSite === 'same-origin' || fetchSite === 'same-site') return true;

	return false;
}
