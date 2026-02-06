<section class="about">
	<header class="hero">
		<p class="kicker">About fogr.ai</p>
		<h1>Local classifieds with less hassle.</h1>
		<p class="lead">
			fogr.ai is a classifieds marketplace built for Ireland.
			It focuses on the real friction people hit when buying and selling locally,
			and addresses it with simple, practical product decisions.
		</p>
	</header>

	<section class="section section--center">
		<h2>What’s different here</h2>
		<div class="grid">
			<article class="card">
				<h3>Clear listings by default</h3>
				<p>
					Required fields and validation help keep listings readable,
					complete, and quick to create.
				</p>
			</article>

			<article class="card">
				<h3>Price filters you can trust</h3>
				<p>
					Fixed, Free, and POA prices are enforced by category,
					so search results stay meaningful and consistent.
				</p>
			</article>

			<article class="card">
				<h3>Fewer lowball offers</h3>
				<p>
					Set a firm price or minimum offer.
					Offers below your rules can be declined automatically.
				</p>
			</article>

			<article class="card">
				<h3>Keep your number private</h3>
				<p>
					Conversations start in-app.
					Direct contact is optional and only shared when you choose.
				</p>
			</article>

			<article class="card">
				<h3>Scam warnings in chat</h3>
				<p>
					Messages are checked for common scam signals,
					with clear warnings shown when something looks off.
				</p>
			</article>

			<article class="card">
				<h3>Reports that are reviewed</h3>
				<p>
					A proper reporting flow, moderation actions,
					and appeals handling provide a real path to recourse.
				</p>
			</article>
		</div>
	</section>

	<section class="contact">
		<h2>Contact</h2>
		<p>
			Questions or feedback? Email
			<a href="mailto:eolas@fogr.ai">eolas@fogr.ai</a>.
		</p>
		<p>
			<a href="/">Browse listings</a> or <a href="/post">post an ad</a>.
		</p>
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
	.section--center h2 {
		text-align: center;
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
	.contact {
		display: grid;
		justify-items: center;
		gap: 10px;
		text-align: center;
	}

	@media (max-width: 640px) {
		.why-name {
			max-width: 100%;
		}
	}
</style>
