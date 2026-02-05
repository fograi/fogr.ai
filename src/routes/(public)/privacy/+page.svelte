<svelte:head>
	<title>Privacy Policy</title>
</svelte:head>

<article class="legal">
	<h1>Privacy Policy</h1>
	<p class="meta">Effective date: February 3, 2026</p>

	<h2>1. Who We Are</h2>
	<p>
		This Service is operated by Sionnach Solutions, a registered business name in Quebec,
		Canada ("we", "us", "our"). Contact: info.eolas@fogr.ai.
	</p>

	<h2>2. What We Collect</h2>
	<ul>
		<li>Account data: email address, authentication identifiers.</li>
		<li>Listings data: title, description, category, price, images, and any contact info you include.</li>
		<li>Communications: messages you send to support.</li>
		<li>Technical data: IP address, device and browser information, and basic logs for security.</li>
		<li>Payment data: handled by a payment provider if you purchase paid features; we receive limited
			transaction details (e.g., status, amount).</li>
	</ul>

	<h2>3. How We Use Data and Legal Bases</h2>
	<ul>
		<li>
			Provide the Service (create accounts, publish listings, authenticate users). Legal basis:
			contract.
		</li>
		<li>
			Moderate content and prevent abuse or fraud. Legal basis: legitimate interests.
		</li>
		<li>
			Process payments and maintain required records. Legal basis: contract and legal obligations.
		</li>
		<li>
			Communicate with you about the Service. Legal basis: contract or legitimate interests.
		</li>
		<li>
			Marketing (if you opt in). Legal basis: consent (you can withdraw at any time).
		</li>
	</ul>

	<h2>4. Sharing and Processors</h2>
	<p>
		We use service providers to operate the Service, such as hosting and storage providers,
		authentication and database services, content moderation tooling, and payment processors.
		These providers process data on our behalf under contract and only as needed to provide their
		services. Examples may include Cloudflare (hosting/CDN/storage), Supabase (auth/database),
		OpenAI (content moderation), and Stripe or another payment processor if payments are enabled.
	</p>

	<h2>5. International Transfers</h2>
	<p>
		We are based in Canada and use service providers in other countries, which may include the
		United States and the EU/EEA. Where required, we rely on appropriate safeguards such as
		standard contractual clauses or other lawful transfer mechanisms.
	</p>

	<h2>6. Retention</h2>
	<ul>
		<li>
			Listings are deleted after the selected duration (32 days by default), or sooner if you
			remove them.
		</li>
		<li>Account data is retained while your account is active.</li>
		<li>Backups are retained for a limited period (typically up to 30 days).</li>
		<li>Security logs are retained for a limited period (typically up to 90 days).</li>
		<li>Payment records are retained as required by law.</li>
	</ul>

	<h2>7. Your Rights</h2>
	<p>
		Depending on your location, you may have rights to access, correct, delete, or export your
		data, and to object to or restrict certain processing. You can request deletion or a copy of
		your data by contacting us at info.eolas@fogr.ai or through account settings where available.
		We aim to provide simple, self-serve tools for these requests.
	</p>
	<p>
		If you are in the EEA, you may also lodge a complaint with your local supervisory authority,
		such as the Data Protection Commission (Ireland).
	</p>

	<h2>8. Automated Decisions</h2>
	<p>
		We use automated tools to help detect prohibited content. If your content is restricted,
		you may contact us for review.
	</p>

	<h2>9. Children</h2>
	<p>
		The Service is not intended for users under 18. If you believe a child has provided us with
		personal data, contact us and we will remove it.
	</p>

	<h2>10. Security</h2>
	<p>
		We use reasonable technical and organizational safeguards to protect data. No system is
		completely secure, and you use the Service at your own risk.
	</p>

	<h2>11. Changes</h2>
	<p>
		We may update this policy from time to time. We will post an updated effective date when
		changes are made.
	</p>

	<h2>12. Contact</h2>
	<p>
		Questions? Contact us at info.eolas@fogr.ai.
	</p>
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
	.legal p {
		line-height: 1.6;
	}
	.legal ul {
		padding-left: 18px;
		line-height: 1.6;
	}
</style>
