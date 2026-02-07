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
				<h3>Keep your info private</h3>
				<p>
					Messages in-app are anonymous.
					Share contact details only if you choose.
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

	.grid {
		display: grid;
		gap: 16px;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}
	@media (min-width: 900px) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
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

	.contact {
		display: grid;
		justify-items: center;
		gap: 10px;
		text-align: center;
	}
</style>
