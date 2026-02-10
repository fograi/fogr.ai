import { mythologise } from '$lib/utils/mythologise';

type ChatNameEnv = {
	MYTHOLOGISE_SECRET?: string;
	SUPABASE_SERVICE_ROLE_KEY?: string;
};

const CHAT_NAME_SEPARATOR = '::';
const LOCAL_FALLBACK_SECRET = 'fogr-chat-display-name-fallback';

function resolveMythologiseSecret(platform?: App.Platform): string {
	const env = platform?.env as ChatNameEnv | undefined;
	const configured = env?.MYTHOLOGISE_SECRET?.trim();
	if (configured) return configured;

	const serviceKey = env?.SUPABASE_SERVICE_ROLE_KEY?.trim();
	if (serviceKey) return serviceKey;

	return LOCAL_FALLBACK_SECRET;
}

function titleCaseIrish(value: string): string {
	return value
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toLocaleUpperCase('ga-IE') + word.slice(1))
		.join(' ');
}

export function chatDisplayNameFromUserId(userId: string, platform?: App.Platform): string {
	const handle = mythologise(userId, resolveMythologiseSecret(platform), {
		separator: CHAT_NAME_SEPARATOR
	});
	const [noun, adjective] = handle.split(CHAT_NAME_SEPARATOR);
	if (noun && adjective) {
		return titleCaseIrish(`${noun} ${adjective}`);
	}
	return titleCaseIrish(handle.replaceAll(CHAT_NAME_SEPARATOR, ' '));
}
