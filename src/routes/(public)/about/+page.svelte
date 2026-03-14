<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>About | fogr.ai -- Fograi</title>
	<meta
		name="description"
		content="Fogr.ai is an Irish classifieds platform for private sellers. No dealers, no clutter -- just honest ads from real people across all 32 counties."
	/>
</svelte:head>

<section class="about">
	<header class="hero">
		<p class="kicker">About fogr.ai &mdash; Fograi</p>
		<h1>Your local noticeboard, online.</h1>
		<p class="lead">
			Fogr.ai takes its name from the Irish word <em>fograi</em> &mdash; meaning
			advertisements or notices. It is a classifieds platform built in Ireland, for Ireland.
			A place where real people across all 32 counties can buy and sell second-hand goods
			without noise, without dealers, and without the usual hassle.
		</p>
	</header>

	<section class="section section--center">
		<h2>What makes this different</h2>
		<div class="grid">
			<article class="card">
				<h3>Private sellers only</h3>
				<p>
					No dealers, no showrooms, no commercial listings. Every ad is from a real person
					selling their own things.
				</p>
			</article>

			<article class="card">
				<h3>Clear, honest listings</h3>
				<p>
					Required fields and validation keep listings readable, complete, and quick to create.
				</p>
			</article>

			<article class="card">
				<h3>Price transparency</h3>
				<p>
					Fixed, Free, and POA prices enforced by category. No hidden costs, no bait-and-switch.
				</p>
			</article>

			<article class="card">
				<h3>Your privacy, your terms</h3>
				<p>
					Messages are anonymous in-app. Share contact details only if you choose to.
				</p>
			</article>

			<article class="card">
				<h3>Scam awareness built in</h3>
				<p>
					Safety tips on every ad, messages checked for common scam signals, and a proper
					reporting flow.
				</p>
			</article>

			<article class="card">
				<h3>An Irish platform for Irish people</h3>
				<p>
					Built in Ireland, for Ireland. All 32 counties, North and South.
				</p>
			</article>
		</div>
	</section>

	<section class="section">
		<h2>Why we built this</h2>
		<p class="prose">
			We were tired of scrolling through Facebook Marketplace, wondering which sellers were
			real people and which were dealers pretending to be. Cluttered interfaces, hidden
			commercial listings, and no accountability. We wanted somewhere simple and honest to
			buy and sell locally &mdash; so we built it.
		</p>
		<p class="prose">
			Fogr.ai is designed around one idea: classified ads should be brief, honest, and easy
			to browse. No algorithms pushing promoted content. No dealer showrooms mixed in with
			your neighbour selling a bike. Just a clean noticeboard for your county.
		</p>
	</section>

	<section class="section">
		<h2>Private sellers only</h2>
		<p class="prose">
			Trade and commercial listings are not allowed on fogr.ai and will be removed.
			This policy keeps the platform honest and fair for everyone. If you are buying here,
			you are buying from a real person. If you are selling, you are listing your own things
			&mdash; not running a business.
		</p>
	</section>

	<section class="contact">
		<h2>Contact</h2>
		<p>
			Questions or feedback? Email
			<a href="mailto:eolas@fogr.ai">eolas@fogr.ai</a>.
		</p>
		<p>
			<a href={resolve('/')}>Browse listings</a> or
			<a href={resolve('/(app)/post')}>post an ad</a>.
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
		line-height: 1.55;
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
	.prose {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 75%, transparent);
		line-height: 1.6;
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
