<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import Navbar from '$lib/components/Navbar.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';

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
		<div class="link-grid">
			<nav class="link-group" aria-label="Company">
				<p class="label">Company</p>
				<a href={resolve('/(public)/about')}>About</a>
				<a href={resolve('/(public)/terms')}>Terms</a>
				<a href={resolve('/(public)/privacy')}>Privacy</a>
			</nav>
			<nav class="link-group" aria-label="Support">
				<p class="label">Support</p>
				<a href={resolve('/(public)/report-status')}>Report status</a>
			</nav>
			{#if $page.data.isAdmin}
				<nav class="link-group" aria-label="Admin">
					<p class="label">Admin</p>
					<a href={resolve('/(app)/admin/reports')}>Reports</a>
					<a href={resolve('/(app)/admin/appeals')}>Appeals</a>
				</nav>
			{/if}
		</div>
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
		max-width: var(--page-max);
		margin: 0 auto;
		padding: 1.25rem var(--page-pad) 2rem;
		display: grid;
		gap: 1.25rem;
		align-items: start;
		justify-items: center;
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
	.link-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1.25rem;
		justify-items: center;
	}
	.link-group {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		align-items: center;
		text-align: center;
	}
	.link-group .label {
		margin: 0 0 0.25rem;
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--fg) 55%, transparent);
	}
	.link-group a {
		text-decoration: none;
		color: color-mix(in srgb, var(--fg) 75%, transparent);
	}
	.link-group a:hover {
		color: var(--fg);
	}
	@media (min-width: 768px) {
		.site-footer .wrap {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			gap: 3rem;
		}
		.link-grid {
			display: flex;
			align-items: flex-start;
			justify-content: flex-end;
			gap: 2.5rem;
		}
		.link-group {
			align-items: flex-start;
			text-align: left;
		}
	}
	@media (min-width: 1024px) {
		.link-grid {
			flex-wrap: nowrap;
		}
	}
</style>
