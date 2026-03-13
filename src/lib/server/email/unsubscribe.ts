const ALGORITHM: HmacKeyGenParams = { name: 'HMAC', hash: 'SHA-256' };

async function importKey(secret: string): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	return crypto.subtle.importKey('raw', encoder.encode(secret), ALGORITHM, false, [
		'sign',
		'verify'
	]);
}

function bufferToBase64url(buf: ArrayBuffer): string {
	const bytes = new Uint8Array(buf);
	let binary = '';
	for (const b of bytes) binary += String.fromCharCode(b);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBuffer(str: string): ArrayBuffer {
	const padded = str.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes.buffer;
}

/**
 * Generate an HMAC-signed unsubscribe token encoding user ID and email type.
 * Token format: {base64url_signature}.{base64_payload}
 */
export async function generateUnsubscribeToken(
	secret: string,
	userId: string,
	emailType: string
): Promise<string> {
	const key = await importKey(secret);
	const payload = `${userId}:${emailType}`;
	const encoder = new TextEncoder();
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
	return `${bufferToBase64url(signature)}.${btoa(payload).replace(/=+$/, '')}`;
}

/**
 * Verify an HMAC-signed unsubscribe token.
 * Uses crypto.subtle.verify for timing-safe comparison.
 * Returns the decoded payload on success, or null on invalid/tampered tokens.
 */
export async function verifyUnsubscribeToken(
	secret: string,
	token: string
): Promise<{ userId: string; emailType: string } | null> {
	try {
		const dotIndex = token.indexOf('.');
		if (dotIndex === -1) return null;

		const sig = token.slice(0, dotIndex);
		const payloadB64 = token.slice(dotIndex + 1);
		if (!sig || !payloadB64) return null;

		const payload = atob(payloadB64);
		const colonIndex = payload.indexOf(':');
		if (colonIndex === -1) return null;

		const userId = payload.slice(0, colonIndex);
		const emailType = payload.slice(colonIndex + 1);
		if (!userId || !emailType) return null;

		const key = await importKey(secret);
		const encoder = new TextEncoder();
		const valid = await crypto.subtle.verify(
			'HMAC',
			key,
			base64urlToBuffer(sig),
			encoder.encode(payload)
		);

		return valid ? { userId, emailType } : null;
	} catch {
		return null;
	}
}

/**
 * Build RFC 8058 List-Unsubscribe headers for one-click unsubscribe.
 * Required by Gmail (Jun 2024), Yahoo (Jun 2024), Microsoft/Outlook (May 2025).
 */
export function buildUnsubscribeHeaders(unsubscribeUrl: string): Record<string, string> {
	return {
		'List-Unsubscribe': `<${unsubscribeUrl}>`,
		'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
	};
}
