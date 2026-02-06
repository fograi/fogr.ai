<svelte:head>
	<title>Privacy Policy</title>
</svelte:head>

<article class="legal">
	<h1>Privacy Policy</h1>
	<p class="meta">Last updated: February 6, 2026</p>

	<h2>1. Who We Are</h2>
	<p>fogr.ai is an online classifieds platform operated from Ireland.</p>
	<p>We are the data controller for personal data processed through the platform.</p>
	<p>Contact: <a href="mailto:eolas@fogr.ai">eolas@fogr.ai</a></p>

	<h2>2. Personal Data We Collect</h2>
	<h3>2.1 Account data</h3>
	<ul>
		<li>Email address</li>
		<li>Account identifiers</li>
		<li>Login metadata</li>
	</ul>

	<h3>2.2 Listings and messages</h3>
	<ul>
		<li>Ad text and images</li>
		<li>Messages sent through the platform</li>
	</ul>

	<h3>2.3 Technical data</h3>
	<ul>
		<li>IP address</li>
		<li>Device and browser information</li>
		<li>Security and log data</li>
	</ul>

	<h3>2.4 Moderation and reports</h3>
	<ul>
		<li>Reports submitted</li>
		<li>Moderation actions and outcomes</li>
	</ul>

	<h2>3. How We Use Your Data</h2>
	<p>We process personal data to:</p>
	<ul>
		<li>operate the platform,</li>
		<li>publish and manage ads,</li>
		<li>enable messaging,</li>
		<li>detect and prevent abuse,</li>
		<li>comply with legal obligations (including the Digital Services Act),</li>
		<li>respond to user requests.</li>
	</ul>

	<h2>4. Legal Bases (GDPR)</h2>
	<table>
		<thead>
			<tr>
				<th>Purpose</th>
				<th>Legal Basis</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>Account operation</td>
				<td>Contract</td>
			</tr>
			<tr>
				<td>Moderation &amp; safety</td>
				<td>Legitimate interests</td>
			</tr>
			<tr>
				<td>Legal compliance</td>
				<td>Legal obligation</td>
			</tr>
			<tr>
				<td>Communications</td>
				<td>Legitimate interests</td>
			</tr>
		</tbody>
	</table>

	<h2>5. Automated Moderation</h2>
	<p>We use automated systems to:</p>
	<ul>
		<li>detect prohibited language,</li>
		<li>assess images and text for policy compliance.</li>
	</ul>
	<p>Automated checks do not produce legal effects without human oversight where required.</p>

	<h2>6. Cookies and Similar Technologies</h2>
	<p>fogr.ai uses strictly necessary cookies only, including:</p>
	<ul>
		<li>authentication cookies (Supabase),</li>
		<li>security cookies (Cloudflare).</li>
	</ul>
	<p>We do not use advertising or analytics cookies. For this reason, we do not currently present a cookie consent banner.</p>

	<h2>7. Data Sharing</h2>
	<p>We share data only with:</p>
	<ul>
		<li>hosting and infrastructure providers,</li>
		<li>moderation service providers (including OpenAI as a processor for content moderation),</li>
		<li>legal authorities where required by law.</li>
	</ul>
	<p>Service providers act as processors under GDPR.</p>

	<h2>8. International Transfers</h2>
	<p>
		Where data is processed outside the EU/UK, appropriate safeguards are applied, such as
		standard contractual clauses.
	</p>

	<h2>9. Data Retention</h2>
	<ul>
		<li>Account data: retained until account deletion.</li>
		<li>
			Ads and messages: retained until you delete them or your account is deleted. Listings may be
			removed from public view after their listing duration ends and marked as expired.
		</li>
		<li>Logs and moderation records: retained for compliance and security purposes.</li>
	</ul>

	<h2>10. Your Rights</h2>
	<p>You have the right to:</p>
	<ul>
		<li>access your data,</li>
		<li>export your data,</li>
		<li>correct inaccuracies,</li>
		<li>delete your account,</li>
		<li>object to certain processing,</li>
		<li>lodge a complaint with the Data Protection Commission.</li>
	</ul>
	<p>
		You can request deletion or a copy of your data by contacting us at
		<a href="mailto:eolas@fogr.ai">eolas@fogr.ai</a>.
	</p>

	<h2>11. Security</h2>
	<p>We apply appropriate technical and organisational measures to protect personal data.</p>

	<h2>12. Changes to This Policy</h2>
	<p>We may update this Privacy Policy from time to time. Changes will be posted on this page.</p>

	<h2>13. Contact</h2>
	<p>Privacy enquiries: <a href="mailto:eolas@fogr.ai">eolas@fogr.ai</a></p>
</article>

<style>
	.legal {
		max-width: 820px;
		margin: 20px auto 48px;
		padding: 0 var(--page-pad);
	}
	.meta {
		color: color-mix(in srgb, var(--fg) 60%, transparent);
		margin: 4px 0 16px;
	}
	.legal h1 {
		margin: 0 0 8px;
		font-size: 2rem;
	}
	.legal h2 {
		margin: 20px 0 6px;
		font-size: 1.2rem;
	}
	.legal h3 {
		margin: 16px 0 6px;
		font-size: 1.05rem;
	}
	.legal p,
	.legal li {
		line-height: 1.6;
	}
	.legal ul {
		padding-left: 18px;
		line-height: 1.6;
	}
	.legal table {
		width: 100%;
		border-collapse: collapse;
		margin: 8px 0 0;
	}
	.legal th,
	.legal td {
		text-align: left;
		border-bottom: 1px solid color-mix(in srgb, var(--fg) 20%, transparent);
		padding: 6px 8px 6px 0;
	}
	.legal th {
		font-weight: 600;
	}
</style>
