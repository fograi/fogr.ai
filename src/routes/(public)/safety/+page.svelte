<script lang="ts">
	import { FULL_SAFETY_SECTIONS } from '$lib/safety-tips';
</script>

<svelte:head>
	<title>Safety Tips | fogr.ai</title>
	<meta
		name="description"
		content="Stay safe buying and selling on fogr.ai. Tips for meeting sellers, payment safety, spotting scams, and protecting your information."
	/>
</svelte:head>

<section class="safety">
	<header class="hero">
		<p class="kicker">Safety</p>
		<h1>Stay Safe on Fogr.ai</h1>
		<p class="lead">Simple tips to buy and sell safely</p>
	</header>

	{#each FULL_SAFETY_SECTIONS as section (section.title)}
		<article class="card">
			<h2>{section.title}</h2>
			<ul>
				{#each section.tips as tip (tip)}
					<li>{tip}</li>
				{/each}
			</ul>
		</article>
	{/each}

	<section class="contact">
		<h2>Something not right?</h2>
		<p>
			Report the listing using the Report button on any ad, or email us at
			<a href="mailto:eolas@fogr.ai">eolas@fogr.ai</a>.
		</p>
		<p>
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href="/">Browse listings</a>
		</p>
	</section>
</section>

<style>
	.safety {
		max-width: 720px;
		margin: 0 auto;
		padding: 32px var(--page-pad) 72px;
		display: grid;
		gap: 24px;
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
	.card {
		background: var(--surface);
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 16px;
		display: grid;
		gap: 10px;
	}
	.card h2 {
		margin: 0;
		font-size: 1.1rem;
	}
	.card ul {
		margin: 0;
		padding-left: 1.25rem;
		display: grid;
		gap: 6px;
	}
	.card li {
		color: color-mix(in srgb, var(--fg) 75%, transparent);
		font-size: 0.95rem;
		line-height: 1.4;
	}
	.contact {
		display: grid;
		justify-items: center;
		gap: 10px;
		text-align: center;
	}
	.contact h2 {
		margin: 0;
	}
	.contact p {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 75%, transparent);
	}
</style>
