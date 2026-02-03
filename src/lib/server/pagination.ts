export type Pagination = {
	page: number;
	limit: number;
	from: number;
	to: number;
};

export function getPagination(
	params: URLSearchParams,
	defaultLimit = 24,
	maxLimit = 100
): Pagination {
	const limitRaw = Number(params.get('limit') ?? String(defaultLimit));
	const pageRaw = Number(params.get('page') ?? '1');
	const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), maxLimit) : defaultLimit;
	const page = Number.isFinite(pageRaw) ? Math.max(Math.floor(pageRaw), 1) : 1;
	const from = (page - 1) * limit;
	const to = from + limit - 1;
	return { page, limit, from, to };
}
