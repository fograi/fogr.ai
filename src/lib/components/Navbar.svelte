<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate, goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { createClient } from '@supabase/supabase-js';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
	import { user$ } from '$lib/stores/user';

	export let title = 'fogr.ai';
	// base links that are always shown
	type NavHref = '/' | '/(public)/about' | '/(app)/post';
	const baseLinks: Array<{ href: NavHref; label: string }> = [
		{ href: '/(public)/about', label: 'About' },
		{ href: '/', label: 'Ads' }
	];
	let authedLinks: Array<{ href: NavHref; label: string }> = baseLinks;

	// UI state (unchanged)
	let open = false;
	let hidden = false;
	let lastY = 0;
	let ticking = false;

	let menu: HTMLElement;
	let burgerEl: HTMLButtonElement;

	// supabase client (only needed for client-side signout UX)
	const supabase: SupabaseClient | null = browser
		? createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)
		: null;

	$: user = ($page.data.user as { id: string; email?: string | null } | null) ?? $user$;

	function closeMenu(focusBurger = false) {
		if (!open) return;
		open = false;
		if (focusBurger) burgerEl?.focus();
	}

	async function logout() {
		// sign out on client so next navigation has no client session…
		if (supabase) await supabase.auth.signOut().catch(() => {});
		// …and clear server cookies too if you have this endpoint
		await fetch('/auth/logout', { method: 'POST' }).catch(() => {});
		await invalidate('supabase:auth');
		await goto(resolve('/'), { replaceState: true });
	}

	function onScroll(y: number) {
		const dy = y - lastY;
		lastY = y;
		if (y < 10) hidden = false;
		else if (dy < 0)
			hidden = false; // up → show
		else if (dy > 6) hidden = true; // down → hide
	}

	afterNavigate(() => closeMenu(false));

	onMount(() => {
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

		const onDocPointer = (e: PointerEvent) => {
			if (!open) return;
			const t = e.target as Node;
			if (!menu?.contains(t) && !burgerEl?.contains(t)) closeMenu(false);
		};
		document.addEventListener('pointerdown', onDocPointer, { passive: true });

		const onDocKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				closeMenu(true);
			}
		};
		document.addEventListener('keydown', onDocKey);

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

	// Build the final nav items based on auth
	$: authedLinks = user ? [...baseLinks, { href: '/(app)/post', label: 'Post ad' }] : baseLinks;
</script>

<header class="nav" class:hidden>
	<div class="wrap">
		<a class="brand" href={resolve('/')}>{title}</a>

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
			{#each authedLinks as link (link.href)}
				<a href={resolve(link.href)} on:click={() => closeMenu(false)}>{link.label}</a>
			{/each}

			{#if user}
				<!-- Show Logout as a button that looks like a link -->
				<button class="as-link" type="button" on:click={() => (closeMenu(false), logout())}>
					Logout
				</button>
			{:else}
				<!-- Login link with redirect back to current page -->
				<a
					href={resolve(
						`/(public)/login?redirectTo=${encodeURIComponent($page.url.pathname + $page.url.search)}` as any
					)}
					on:click={() => closeMenu(false)}>Login</a
				>
			{/if}
		</nav>
	</div>
</header>

<style>
	.nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 50;
		background: var(--surface);
		border-bottom: 1px solid var(--hairline);
		transform: translateY(0);
		transition: transform 0.25s ease;
		will-change: transform;
	}
	.nav.hidden {
		transform: translateY(-100%);
		pointer-events: none;
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

	nav .as-link {
		appearance: none;
		background: transparent;
		border: 0;
		color: inherit;
		padding: 0.5rem 0.75rem;
		border-radius: 0.4rem;
		cursor: pointer;
		text-align: left;
	}
	nav .as-link:hover {
		background: var(--hover);
	}
</style>
