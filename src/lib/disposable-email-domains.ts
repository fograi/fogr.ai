const DISPOSABLE_EMAIL_DOMAINS = new Set([
	'10minutemail.com',
	'10minutemail.net',
	'10minutemail.org',
	'10minutemail.de',
	'10minutemail.co',
	'20minutemail.com',
	'30minutemail.com',
	'dispostable.com',
	'emailondeck.com',
	'fakeinbox.com',
	'getnada.com',
	'getnada.co',
	'guerrillamail.com',
	'guerrillamail.net',
	'guerrillamail.org',
	'guerrillamail.biz',
	'guerrillamail.de',
	'guerrillamail.info',
	'guerrillamailblock.com',
	'inboxbear.com',
	'maildrop.cc',
	'mailinator.com',
	'mailinator.net',
	'mailinator.org',
	'mailnesia.com',
	'minuteinbox.com',
	'mytemp.email',
	'sharklasers.com',
	'spam4.me',
	'spambog.com',
	'spambox.us',
	'spamgourmet.com',
	'tempmail.com',
	'temp-mail.com',
	'temp-mail.org',
	'temp-mail.net',
	'temp-mail.io',
	'tempr.email',
	'throwawaymail.com',
	'trashmail.com',
	'trashmail.de',
	'trashmail.me',
	'yopmail.com',
	'yopmail.net',
	'yopmail.org',
	'yopmail.fr'
]);

export function isDisposableEmail(email: string): boolean {
	const at = email.lastIndexOf('@');
	if (at === -1) return false;
	const domain = email.slice(at + 1).trim().toLowerCase();
	if (!domain) return false;
	if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;
	for (const blocked of DISPOSABLE_EMAIL_DOMAINS) {
		if (domain.endsWith(`.${blocked}`)) return true;
	}
	return false;
}
