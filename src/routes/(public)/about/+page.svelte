<section class="about">
	<header class="hero">
		<p class="kicker">About fogr.ai</p>
		<h1>Local classifieds with less hassle.</h1>
		<p class="lead">
			fogr.ai (from the Irish “fógraí” — ads) is built for Ireland. We focus on the specific pain
			points people hit on the big marketplaces and fix them with simple, practical product
			choices.
		</p>
	</header>

	<section class="section">
		<h2>What’s live today</h2>
		<div class="grid">
			<article class="card">
				<h3>Seller controls that reduce lowballing</h3>
				<p>
					Firm price, minimum offer, and auto‑decline messages. If you set rules, the platform
					enforces them.
				</p>
			</article>
			<article class="card">
				<h3>Privacy‑first contact</h3>
				<p>
					Conversations start in‑app. Direct contact is optional and only revealed after a
					message.
				</p>
			</article>
			<article class="card">
				<h3>Honest pricing rules</h3>
				<p>
					Fixed/Free/POA are validated by category so filters stay trustworthy and fake prices
					don’t pollute results.
				</p>
			</article>
			<article class="card">
				<h3>Short, clear listings</h3>
				<p>
					Required fields, validation, and a simple 0–1 photo rule keep listings readable and
					fast to create.
				</p>
			</article>
			<article class="card">
				<h3>Scam warning patterns</h3>
				<p>
					Messages are screened for common scam patterns and users get clear warnings when
					they appear.
				</p>
			</article>
			<article class="card">
				<h3>Reports, moderation, and appeals</h3>
				<p>
					A full report flow, admin actions, and appeals handling mean there’s a real path to
					recourse.
				</p>
			</article>
		</div>
	</section>

	<section class="section">
		<h2>How this tackles incumbent pain</h2>
		<ul class="list">
			<li><strong>Scams and off‑platform pressure:</strong> scam warnings + in‑app messaging.</li>
			<li><strong>Time‑wasters and lowballing:</strong> firm price, min offer, and auto‑declines.</li>
			<li><strong>Fake prices and broken filters:</strong> POA only where allowed; fixed/free rules enforced.</li>
			<li><strong>Weak accountability:</strong> reports, moderation actions, and appeals are live.</li>
			<li><strong>Bumping by repeated edits:</strong> exponential edit backoff per ad.</li>
		</ul>
	</section>

	<section class="section">
		<h2>Quality guardrails</h2>
		<ul class="list">
			<li><strong>Posting limits:</strong> one ad per day to reduce spam.</li>
			<li><strong>Preview before posting:</strong> fewer mistakes and faster corrections.</li>
			<li><strong>Expiry by default:</strong> listings stop showing once they expire.</li>
		</ul>
	</section>

	<section class="contact">
		<h2>Contact</h2>
		<p>Questions or feedback? Email us at eolas@fogr.ai.</p>
	</section>
</section>

<style>
	.about {
		max-width: 980px;
		margin: 0 auto;
		padding: 32px 16px 72px;
		display: grid;
		gap: 32px;
	}
	.hero {
		display: grid;
		gap: 10px;
		text-align: center;
	}
	.kicker {
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.75rem;
		color: color-mix(in srgb, var(--fg) 55%, transparent);
		margin: 0;
	}
	.hero h1 {
		margin: 0;
		font-size: clamp(1.8rem, 3.4vw, 2.6rem);
		line-height: 1.15;
		font-weight: 900;
	}
	.lead {
		margin: 0;
		font-size: 1.05rem;
		color: color-mix(in srgb, var(--fg) 75%, transparent);
	}

	.section {
		display: grid;
		gap: 14px;
	}
	.section h2 {
		margin: 0;
	}

	.grid {
		display: grid;
		gap: 16px;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}

	.card {
		background: var(--surface);
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 16px;
		display: grid;
		gap: 8px;
	}
	.card h3 {
		margin: 0;
		font-size: 1.02rem;
	}
	.card p {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 72%, transparent);
	}

	.list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 8px;
	}
	.list li {
		padding: 10px 12px;
		border-radius: 12px;
		background: color-mix(in srgb, var(--fg) 5%, var(--bg));
		border: 1px solid var(--hairline);
	}
	.list strong {
		font-weight: 700;
	}

	.contact {
		text-align: center;
	}
	.contact h2 {
		margin: 0 0 8px;
	}
	.contact p {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 75%, transparent);
	}
</style>
