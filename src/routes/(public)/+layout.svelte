<script lang="ts">
	import { onMount } from 'svelte';
	import { user$ } from '$lib/stores/user';

	onMount(async () => {
		try {
			const res = await fetch('/api/me', { credentials: 'include' });
			if (res.ok) {
				const { user } = await res.json();
				user$.set(user ?? null);
			} else {
				user$.set(null);
			}
		} catch {
			user$.set(null);
		}
	});
</script>

<slot />
