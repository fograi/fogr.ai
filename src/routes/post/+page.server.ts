import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
    console.error('Loading post page');
  const session = await locals.getSession();
  console.log('Session:', session);
  if (!session) {
    throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
  }
  return {};
};