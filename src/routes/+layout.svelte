<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
    import { auth } from '$lib/stores/auth';
    import type { LayoutData } from './$types';
	
	let { data, children }: {data: LayoutData, children: any} = $props();

  $effect(() => {
    if (data.user) {
      auth.setAuth('', data.user);
    } else {
      auth.clearAuth();
    }
  })
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
