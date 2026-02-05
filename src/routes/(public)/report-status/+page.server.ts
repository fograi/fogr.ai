import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const reportId = url.searchParams.get('reportId') ?? '';
	return { reportId };
};
