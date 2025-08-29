<script lang="ts">
    import { user$ } from '$lib/stores/user';
    export let data: { user: { id: string; email: string|null } | null };
  
    $: user$.set(data.user); // keep store in sync for app pages
  </script>
  
  <NavBar />
  <slot />
  