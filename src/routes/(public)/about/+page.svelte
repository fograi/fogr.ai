<section class="about">
	<header class="hero">
		<p class="kicker">About fogr.ai</p>
		<h1>Local classifieds with less hassle.</h1>
		<p class="lead">
			Built for Ireland, fogr.ai focuses on the pain points people hit on big marketplaces and fixes
			them with simple, practical product choices.
		</p>
		<div class="cta-row">
			<a class="btn primary" href="/">Browse listings</a>
			<a class="btn" href="/post">Post an ad</a>
			<a class="btn ghost" href="/login">Sign in</a>
		</div>
		<details class="why-name">
			<summary>Why the name?</summary>
			<p>fogr.ai comes from the Irish word “fógraí” — ads.</p>
		</details>
	</header>

	<section class="section">
		<h2>How it works</h2>
		<div class="steps">
			<article class="step">
				<h3>Post</h3>
				<p>Required fields keep listings clear and searchable.</p>
			</article>
			<article class="step">
				<h3>Chat</h3>
				<p>In‑app messaging with offer controls reduces noise.</p>
			</article>
			<article class="step">
				<h3>Close</h3>
				<p>Privacy‑first contact and reporting tools keep you safer.</p>
			</article>
		</div>
	</section>

	<section class="section">
		<h2>What’s different here</h2>
		<div class="grid">
			<article class="card">
				<h3>Clearer listings</h3>
				<p>Required fields and validation make ads easier to trust.</p>
			</article>
			<article class="card">
				<h3>Price filters you can trust</h3>
				<p>Fixed/Free/POA are enforced by category.</p>
			</article>
			<article class="card">
				<h3>Keep contact private</h3>
				<p>Chat stays in‑app; direct contact is optional after a message.</p>
			</article>
			<article class="card">
				<h3>Fewer time‑wasters</h3>
				<p>Firm price, minimum offer, and auto‑declines reduce lowballing.</p>
			</article>
			<article class="card">
				<h3>Scam warnings built in</h3>
				<p>Messages are screened for common scam patterns.</p>
			</article>
			<article class="card">
				<h3>Reports with follow‑up</h3>
				<p>Report flow, admin actions, and appeals are live.</p>
			</article>
		</div>
	</section>

	<section class="section">
		<h2>Contact</h2>
		<p class="contact-text">Questions or feedback? Email us at eolas@fogr.ai.</p>
		<p class="contact-text">See something wrong? Use the report button on any listing.</p>
		<div class="cta-row">
			<a class="btn" href="/">Browse listings</a>
			<a class="btn primary" href="/post">Post an ad</a>
		</div>
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
		gap: 12px;
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
	.cta-row {
		display: flex;
		justify-content: center;
		gap: 10px;
		flex-wrap: wrap;
	}
	.btn {
		display: inline-grid;
		place-items: center;
		gap: 6px;
		padding: 10px 14px;
		border-radius: 10px;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		cursor: pointer;
		font-weight: 700;
		text-decoration: none;
		color: inherit;
	}
	.btn.primary {
		background: var(--fg);
		color: var(--bg);
		border-color: var(--fg);
	}
	.btn.ghost {
		background: transparent;
	}
	.why-name {
		margin: 0 auto;
		max-width: 520px;
		text-align: left;
	}
	.why-name summary {
		cursor: pointer;
		font-weight: 700;
	}
	.why-name p {
		margin: 8px 0 0;
		color: color-mix(in srgb, var(--fg) 75%, transparent);
	}

	.section {
		display: grid;
		gap: 14px;
	}
	.section h2 {
		margin: 0;
	}

	.steps {
		display: grid;
		gap: 16px;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	}
	.step {
		background: color-mix(in srgb, var(--fg) 4%, var(--bg));
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 14px 16px;
		display: grid;
		gap: 6px;
	}
	.step h3 {
		margin: 0;
	}
	.step p {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 72%, transparent);
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

	.contact-text {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 75%, transparent);
		text-align: center;
	}

	@media (max-width: 640px) {
		.why-name {
			max-width: 100%;
		}
	}
</style>
