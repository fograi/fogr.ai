<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	export let title = 'fogr.ai';
	export let links: { href: string; label: string }[] = [
		{ href: '/', label: 'Home' },
		{ href: '/browse', label: 'Browse' },
		{ href: '/post', label: 'Post ad' },
		{ href: '/about', label: 'About' }
	];

	let open = false;
	let hidden = false;
	let lastY = 0;
	let ticking = false;

	let menu: HTMLElement;
	let burgerEl: HTMLButtonElement;

	function closeMenu(focusBurger = false) {
		if (!open) return;
		open = false;
		if (focusBurger) burgerEl?.focus();
	}

	function onScroll(y: number) {
		const dy = y - lastY;
		lastY = y;
		if (y < 10) {
			hidden = false;
			return;
		}
		if (dy > 6)
			hidden = true; // down → hide
		else if (dy < -6) hidden = false; // up → show
	}

	afterNavigate(() => closeMenu(false)); // close on route change

	onMount(() => {
		// hide-on-scroll
		lastY = window.scrollY;
		const onWinScroll = () => {
			if (!ticking) {
				requestAnimationFrame(() => {
					onScroll(window.scrollY);
					ticking = false;
				});
				ticking = true;
			}
		};
		addEventListener('scroll', onWinScroll, { passive: true });

		// outside click
		const onDocPointer = (e: PointerEvent) => {
			if (!open) return;
			const t = e.target as Node;
			if (!menu?.contains(t) && !burgerEl?.contains(t)) closeMenu(false);
		};
		document.addEventListener('pointerdown', onDocPointer, { passive: true });

		// ESC to close
		const onDocKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				closeMenu(true);
			}
		};
		document.addEventListener('keydown', onDocKey);

		// focus leaving menu closes it
		const onFocusIn = (e: FocusEvent) => {
			if (!open) return;
			const t = e.target as Node;
			if (!menu?.contains(t) && !burgerEl?.contains(t)) closeMenu(false);
		};
		document.addEventListener('focusin', onFocusIn);

		return () => {
			removeEventListener('scroll', onWinScroll);
			document.removeEventListener('pointerdown', onDocPointer);
			document.removeEventListener('keydown', onDocKey);
			document.removeEventListener('focusin', onFocusIn);
		};
	});

	// focus first link on open
	$: if (open) queueMicrotask(() => menu?.querySelector<HTMLAnchorElement>('a')?.focus());
</script>

<header class="nav" class:hidden>
	<div class="wrap">
		<a class="brand" href="/">{title}</a>

		<button
			class="burger"
			bind:this={burgerEl}
			aria-label="Toggle navigation"
			aria-haspopup="true"
			aria-controls="site-menu"
			aria-expanded={open}
			on:click={() => (open = !open)}
		>
			<span></span><span></span><span></span>
		</button>

		<nav id="site-menu" bind:this={menu} class:open aria-hidden={!open}>
			{#each links as { href, label }}
				<a {href} on:click={() => closeMenu(false)}>{label}</a>
			{/each}
		</nav>
	</div>
</header>

<style>
	.nav {
		position: sticky;
		top: 0;
		z-index: 50;
		background: var(--surface);
		border-bottom: 1px solid var(--hairline);
		transform: translateY(0);
		transition: transform 0.25s ease;
	}
	.nav.hidden {
		transform: translateY(-100%);
	}

	.wrap {
		position: relative;
		max-width: 1100px;
		margin: 0 auto;
		padding: 0.6rem 1rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.brand {
		font-weight: 700;
		text-decoration: none;
		color: inherit;
		letter-spacing: 0.2px;
	}

	.burger {
		margin-left: auto;
		display: inline-flex;
		width: 40px;
		height: 40px;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 4px;
	}

	.burger span {
		display: block;
		width: 22px;
		height: 2px;
		background: currentColor;
		margin: 0;
	}

	nav {
		display: none;
	}
	nav a {
		text-decoration: none;
		color: inherit;
		padding: 0.5rem 0.75rem;
		border-radius: 0.4rem;
		display: block;
	}
	nav a:hover {
		background: var(--hover);
	}

	/* right-aligned popup menu on mobile */
	nav.open {
		position: absolute;
		top: 100%;
		right: 1rem;
		left: auto;
		display: grid;
		gap: 0.25rem;
		padding: 0.5rem;
		width: max-content;
		min-width: 12rem;
		justify-items: end;
		text-align: right;
		background: var(--surface);
		border: 1px solid var(--hairline);
		border-top: none;
		border-radius: 0.5rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
	}

	@media (min-width: 768px) {
		.burger {
			display: none;
		}
		nav {
			display: flex;
			margin-left: auto;
			gap: 0.5rem;
			position: static;
			background: transparent;
			padding: 0;
			border: 0;
		}
	}

	/* focus styles */
	nav a:focus-visible {
		outline: 2px solid var(--link);
		outline-offset: 2px;
	}
</style>
