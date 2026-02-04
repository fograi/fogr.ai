<section class="about">
	<header class="hero">
		<p class="kicker">About fogr.ai</p>
		<h1>Clean, local-first classifieds for Ireland.</h1>
		<p class="lead">
			fogr.ai is built for short, honest listings. One image. One price. No noise. The goal is a
			feed that feels useful instead of overwhelming.
		</p>
	</header>

	<div class="grid">
		<article class="card">
			<h2>Why it exists</h2>
			<p>
				Most marketplaces reward volume and attention tricks. We do the opposite: fewer listings,
				clearer signals, and local relevance first.
			</p>
		</article>

		<article class="card">
			<h2>How it works</h2>
			<p>
				Ads are short by design, with a single image and a mandatory price. Listings expire
				automatically to keep the feed fresh.
			</p>
		</article>

		<article class="card">
			<h2>Trust & safety</h2>
			<p>
				We filter spam and abuse, rate-limit sensitive actions, and keep moderation simple. If a
				listing doesn’t meet the rules, it doesn’t go live.
			</p>
		</article>
	</div>

	<section class="principles">
		<h2>Design principles</h2>
		<ul>
			<li>Local-first by default</li>
			<li>Short ads, clear prices</li>
			<li>No engagement bait</li>
			<li>Fresh listings, no bumping</li>
			<li>Low friction, low noise</li>
		</ul>
	</section>

	<section class="contact">
		<h2>Contact</h2>
		<p>Questions or feedback? Email us at eolas@fogr.ai.</p>
	</section>
</section>

<style>
	.about {
		max-width: 920px;
		margin: 0 auto;
		padding: 32px 16px 72px;
		display: grid;
		gap: 28px;
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

	.grid {
		display: grid;
		gap: 16px;
		grid-template-columns: 1fr;
	}
	.card {
		background: var(--surface);
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 16px;
		display: grid;
		gap: 8px;
	}
	.card h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.card p {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 72%, transparent);
	}

	.principles {
		background: color-mix(in srgb, var(--fg) 4%, var(--bg));
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 16px;
	}
	.principles h2 {
		margin: 0 0 10px;
	}
	.principles ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 6px;
	}
	.principles li {
		padding: 6px 10px;
		border-radius: 999px;
		background: var(--surface);
		border: 1px solid var(--hairline);
		font-weight: 600;
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

	@media (min-width: 820px) {
		.grid {
			grid-template-columns: repeat(3, 1fr);
		}
		.principles ul {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
