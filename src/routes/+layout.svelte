<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import Navbar from '$lib/components/Navbar.svelte';
	import { resolve } from '$app/paths';

	const year = new Date().getFullYear();
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Navbar title="fogr.ai" />

<main>
	{@render children()}
</main>

<footer class="site-footer">
	<div class="wrap">
		<div class="brand-line">
			<span class="brand-name"><i>fógraí</i></span>
			<span class="dot">•</span>
			<span>© {year}</span>
		</div>
		<nav class="legal" aria-label="Legal">
			<a href={resolve('/(public)/about')}>About</a>
			<a href={resolve('/(public)/terms')}>Terms</a>
			<a href={resolve('/(public)/privacy')}>Privacy</a>
			<a href={resolve('/(public)/report-status')}>Report status</a>
		</nav>
	</div>
</footer>

<style>
	main {
		padding-top: 4rem;
	}
	.site-footer {
		border-top: 1px solid var(--hairline);
		background: var(--surface);
	}
	.site-footer .wrap {
		max-width: 1100px;
		margin: 0 auto;
		padding: 1.25rem 1rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
		justify-content: space-between;
	}
	.brand-line {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 700;
		color: color-mix(in srgb, var(--fg) 80%, transparent);
	}
	.brand-name {
		letter-spacing: 0.2px;
	}
	.dot {
		opacity: 0.4;
	}
	.legal {
		display: inline-flex;
		gap: 1rem;
	}
	.legal a {
		text-decoration: none;
		color: color-mix(in srgb, var(--fg) 75%, transparent);
	}
	.legal a:hover {
		color: var(--fg);
	}
	@media (min-width: 768px) {
		.site-footer .wrap {
			flex-direction: row;
		}
	}
</style>
