import { mythologise } from '$lib/utils/mythologise';

type ChatNameEnv = {
	MYTHOLOGISE_SECRET?: string;
	SUPABASE_SERVICE_ROLE_KEY?: string;
};

const CHAT_NAME_SEPARATOR = '::';
const LOCAL_FALLBACK_SECRET = 'fogr-chat-display-name-fallback';

export type ChatIdentity = {
	displayName: string;
	tag: string;
	handle: string;
};

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

export function chatIdentityFromUserId(userId: string, platform?: App.Platform): ChatIdentity {
	const handle = mythologise(userId, resolveMythologiseSecret(platform), {
		separator: CHAT_NAME_SEPARATOR
	});
	const parts = handle.split(CHAT_NAME_SEPARATOR).filter(Boolean);
	const tag = parts.length > 0 ? (parts[parts.length - 1] ?? '').toLocaleUpperCase('en-US') : '';
	const lexical = parts.length > 1 ? parts.slice(0, -1) : parts;
	const displayName = titleCaseIrish(
		lexical.length > 0 ? lexical.join(' ') : handle.replaceAll(CHAT_NAME_SEPARATOR, ' ')
	);
	return {
		displayName,
		tag,
		handle
	};
}

export function chatDisplayNameFromUserId(userId: string, platform?: App.Platform): string {
	return chatIdentityFromUserId(userId, platform).displayName;
}

export function chatTagFromUserId(userId: string, platform?: App.Platform): string {
	return chatIdentityFromUserId(userId, platform).tag;
}
