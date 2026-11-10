<script lang="ts">
	import Catalog from '#lib/components/Catalog.svelte';
	import { m } from '#lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{m.app_title()}</title>
	<meta name="description" content={m.app_tagline()} />
</svelte:head>

<Catalog title={m.nav_catalog()} preset={['game', 'dlc']} />
