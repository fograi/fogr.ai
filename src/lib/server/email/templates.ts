const BRAND_COLOR = '#1a73e8';

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
 * Produces a complete HTML document with header, body content, and footer.
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; background: #f5f5f5;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff;">
    <div style="padding: 24px 32px 16px; border-bottom: 2px solid ${BRAND_COLOR};">
      <strong style="font-size: 18px; color: ${BRAND_COLOR};">fogr.ai</strong>
    </div>
    <div style="padding: 24px 32px; line-height: 1.6; font-size: 15px;">
      ${bodyHtml}
    </div>
    <div style="padding: 16px 32px; font-size: 12px; color: #666; border-top: 1px solid #e5e5e5;">
      <p style="margin: 0 0 8px;">fogr.ai -- Classified ads for Ireland</p>
      <p style="margin: 0;"><a href="https://fogr.ai/privacy" style="color: #666;">Privacy</a> | <a href="https://fogr.ai/terms" style="color: #666;">Terms</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * "Your listing is live on fogr.ai"
 * Sent when an ad is approved. Suppressible via unsubscribe.
 */
export function buildAdApprovedEmailHtml(ctx: {
	adTitle: string;
	adUrl: string;
	unsubscribeUrl: string;
}): string {
	return `<p>Good news! Your listing has been approved and is now live.</p>
    <p><strong>${escapeHtml(ctx.adTitle)}</strong></p>
    <p><a href="${escapeHtml(ctx.adUrl)}" style="display: inline-block; padding: 10px 20px; background: ${BRAND_COLOR}; color: #fff; text-decoration: none; border-radius: 4px;">View your listing</a></p>
    <p style="margin-top: 24px; font-size: 13px; color: #666;">
      <a href="${escapeHtml(ctx.unsubscribeUrl)}" style="color: #666;">Unsubscribe</a> from listing approval emails.
    </p>`;
}

/**
 * "Your fogr.ai listing was not approved"
 * Sent when an ad is rejected. No unsubscribe (DSA/moderation email).
 */
export function buildAdRejectedEmailHtml(ctx: {
	adTitle: string;
	adId: string;
	reason: string;
}): string {
	return `<p>We were unable to approve your listing:</p>
    <p><strong>${escapeHtml(ctx.adTitle)}</strong> <span style="font-size: 13px; color: #666;">(ID: ${escapeHtml(ctx.adId)})</span></p>
    <p><strong>Reason:</strong> ${escapeHtml(ctx.reason)}</p>
    <p>If you believe this decision was made in error, you can appeal by signing in to fogr.ai and opening your listing.</p>
    <p style="font-size: 13px; color: #666;">Questions? Contact us at <a href="mailto:eolas@fogr.ai" style="color: ${BRAND_COLOR};">eolas@fogr.ai</a>.</p>`;
}

/**
 * "You have a new message on fogr.ai"
 * Does NOT reveal sender identity. Suppressible via unsubscribe.
 */
export function buildNewMessageEmailHtml(ctx: {
	adTitle: string;
	adUrl: string;
	unsubscribeUrl: string;
}): string {
	return `<p>Someone sent you a message about your listing:</p>
    <p><strong>${escapeHtml(ctx.adTitle)}</strong></p>
    <p><a href="${escapeHtml(ctx.adUrl)}" style="display: inline-block; padding: 10px 20px; background: ${BRAND_COLOR}; color: #fff; text-decoration: none; border-radius: 4px;">View conversation</a></p>
    <p style="font-size: 13px; color: #666;">Sign in to fogr.ai to read and reply to the message.</p>
    <p style="margin-top: 24px; font-size: 13px; color: #666;">
      <a href="${escapeHtml(ctx.unsubscribeUrl)}" style="color: #666;">Unsubscribe</a> from message notification emails.
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
          <a href="${escapeHtml(listing.url)}" style="color: ${BRAND_COLOR}; text-decoration: none;">${escapeHtml(listing.title)}</a>
          <span style="float: right; color: #666;">${escapeHtml(listing.price)}</span>
        </td>
      </tr>`
		)
		.join('\n');

	return `<p>New listings matching <strong>${escapeHtml(ctx.searchName)}</strong>:</p>
    <p style="font-size: 14px; color: #666;">${ctx.matchCount} new listing${ctx.matchCount === 1 ? '' : 's'} found</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      ${listingsHtml}
    </table>
    <p><a href="${escapeHtml(ctx.viewAllUrl)}" style="display: inline-block; padding: 10px 20px; background: ${BRAND_COLOR}; color: #fff; text-decoration: none; border-radius: 4px;">View all ${ctx.matchCount} match${ctx.matchCount === 1 ? '' : 'es'}</a></p>
    <p style="margin-top: 24px; font-size: 13px; color: #666;">
      <a href="${escapeHtml(ctx.unsubscribeUrl)}" style="color: #666;">Unsubscribe</a> from search alert emails.
    </p>`;
}
