import type { User } from '@supabase/supabase-js';

type AdminEnv = {
	ADMIN_EMAILS?: string;
	ADMIN_EMAIL?: string;
};

export const getAdminEmailSet = (env?: AdminEnv): Set<string> => {
	const list = [
		env?.ADMIN_EMAIL?.trim() || '',
		...(env?.ADMIN_EMAILS?.split(',').map((entry) => entry.trim()) ?? [])
	]
		.filter(Boolean)
		.map((email) => email.toLowerCase());

	return new Set(list);
};

export const isAdminUser = (user: User | null, env?: AdminEnv): boolean => {
	if (!user?.email) return false;
	const admins = getAdminEmailSet(env);
	if (admins.size === 0) return false;
	return admins.has(user.email.toLowerCase());
};
