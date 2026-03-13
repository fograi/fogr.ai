export type EmailEnv = {
	RESEND_API_KEY: string;
	PUBLIC_SUPABASE_URL: string;
	SUPABASE_SERVICE_ROLE_KEY: string;
	UNSUBSCRIBE_SECRET: string;
};

export type SendEmailParams = {
	to: string;
	subject: string;
	html: string;
	text?: string;
	headers?: Record<string, string>;
};

/**
 * Fire-and-forget email sender via Resend REST API.
 * Returns the Resend email ID on success, or null on failure.
 * Never throws -- all errors are logged and swallowed.
 */
export async function sendEmail(env: EmailEnv, params: SendEmailParams): Promise<string | null> {
	try {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${env.RESEND_API_KEY}`
			},
			body: JSON.stringify({
				from: 'fogr.ai <eolas@fogr.ai>',
				to: [params.to],
				subject: params.subject,
				html: params.html,
				text: params.text,
				headers: params.headers
			})
		});

		if (!res.ok) {
			const body = await res.text();
			console.error('email_send_failed', { status: res.status, body });
			return null;
		}

		const data = (await res.json()) as { id: string };
		console.log('email_sent', { id: data.id, to: params.to });
		return data.id;
	} catch (error) {
		console.error('email_send_error', { error: String(error), to: params.to });
		return null;
	}
}
