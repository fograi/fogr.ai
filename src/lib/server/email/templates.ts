const LINK_COLOR = '#0a58ca';
const LOGO_URL = 'https://fogr.ai/fogr-logo-email.png';
const FOOTER_LOGO_URL = 'https://fogr.ai/fogr-logo-footer.png';

/**
 * Escape HTML special characters for safe insertion into templates.
 * Prevents XSS when user-supplied content is embedded in email HTML.
 */
export function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Wrap email body HTML in a branded full-document template.
 * Matches fogr.ai website styling: warm cream background, Sora font, minimal layout.
 * No tracking pixels. Inline CSS for maximum email client compatibility.
 */
export function renderEmail(subject: string, bodyHtml: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Sora', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #111; background: #fffdf6;">
  <div style="max-width: 580px; margin: 0 auto; padding: 32px 0;">
    <div style="padding: 24px 32px;">
      <a href="https://fogr.ai"><img src="${LOGO_URL}" alt="f\u00F3gr.a\u00ED" width="62" height="28" style="display: block; border: 0;" /></a>
    </div>
    <div style="padding: 8px 32px; line-height: 1.6; font-size: 15px; letter-spacing: -0.01em;">
      ${bodyHtml}
    </div>
    <div style="padding: 24px 32px 16px; font-size: 12px; color: #666; border-top: 1px solid #e5e5e5; margin-top: 24px;">
      <p style="margin: 0 0 6px; line-height: 24px;"><a href="https://fogr.ai" style="text-decoration: none;"><img src="${FOOTER_LOGO_URL}" alt="f\u00F3gr.a\u00ED" width="53" height="24" style="display: inline-block; border: 0; vertical-align: middle;" /></a> <span style="vertical-align: middle;">&middot; Buy. Sell. Done.</span></p>
      <p style="margin: 0;"><a href="https://fogr.ai/privacy" style="color: #666;">Privacy</a> · <a href="https://fogr.ai/terms" style="color: #666;">Terms</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * "Your listing is live"
 * Sent when an ad is approved. Suppressible via unsubscribe.
 */
export function buildAdApprovedEmailHtml(ctx: {
	adTitle: string;
	adUrl: string;
	unsubscribeUrl: string;
}): string {
	return `<p>Your listing <strong>${escapeHtml(ctx.adTitle)}</strong> is now live.</p>
    <p><a href="${escapeHtml(ctx.adUrl)}" style="display: inline-block; padding: 10px 20px; background: #111; color: #fff; text-decoration: none; border-radius: 8px;">View listing</a></p>
    <p style="margin-top: 24px; font-size: 13px; color: #666;">
      <a href="${escapeHtml(ctx.unsubscribeUrl)}" style="color: #666;">Unsubscribe</a>
    </p>`;
}

/**
 * "Listing not approved"
 * Sent when an ad is rejected. No unsubscribe (DSA/moderation email).
 */
export function buildAdRejectedEmailHtml(ctx: {
	adTitle: string;
	adId: string;
	reason: string;
}): string {
	return `<p>We couldn't approve <strong>${escapeHtml(ctx.adTitle)}</strong>.</p>
    <p><strong>Reason:</strong> ${escapeHtml(ctx.reason)}</p>
    <p>You can appeal by signing in to f&oacute;gr.a&iacute; and opening your listing.</p>
    <p style="font-size: 13px; color: #666;">Questions? <a href="mailto:eolas@fogr.ai" style="color: ${LINK_COLOR};">eolas@fogr.ai</a></p>`;
}

/**
 * "New message"
 * Does NOT reveal sender identity. Suppressible via unsubscribe.
 */
export function buildNewMessageEmailHtml(ctx: {
	adTitle: string;
	adUrl: string;
	unsubscribeUrl: string;
}): string {
	return `<p>New message about <strong>${escapeHtml(ctx.adTitle)}</strong>.</p>
    <p><a href="${escapeHtml(ctx.adUrl)}" style="display: inline-block; padding: 10px 20px; background: #111; color: #fff; text-decoration: none; border-radius: 8px;">View conversation</a></p>
    <p style="margin-top: 24px; font-size: 13px; color: #666;">
      <a href="${escapeHtml(ctx.unsubscribeUrl)}" style="color: #666;">Unsubscribe</a>
    </p>`;
}

/**
 * "New listings matching your search"
 * Daily digest for saved searches. Suppressible via unsubscribe.
 */
export function buildSearchAlertEmailHtml(ctx: {
	searchName: string;
	matchCount: number;
	topListings: Array<{ title: string; price: string; url: string }>;
	viewAllUrl: string;
	unsubscribeUrl: string;
}): string {
	const listingsHtml = ctx.topListings
		.map(
			(listing) =>
				`<tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
          <a href="${escapeHtml(listing.url)}" style="color: ${LINK_COLOR}; text-decoration: none;">${escapeHtml(listing.title)}</a>
          <span style="float: right; color: #666;">${escapeHtml(listing.price)}</span>
        </td>
      </tr>`
		)
		.join('\n');

	return `<p>${ctx.matchCount} new listing${ctx.matchCount === 1 ? '' : 's'} for <strong>${escapeHtml(ctx.searchName)}</strong>:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      ${listingsHtml}
    </table>
    <p><a href="${escapeHtml(ctx.viewAllUrl)}" style="display: inline-block; padding: 10px 20px; background: #111; color: #fff; text-decoration: none; border-radius: 8px;">View all ${ctx.matchCount} match${ctx.matchCount === 1 ? '' : 'es'}</a></p>
    <p style="margin-top: 24px; font-size: 13px; color: #666;">
      <a href="${escapeHtml(ctx.unsubscribeUrl)}" style="color: #666;">Unsubscribe</a>
    </p>`;
}
