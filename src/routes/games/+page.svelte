<script lang="ts">
	import Catalog from '#lib/components/Catalog.svelte';
	import { m } from '#lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{m.nav_games()} · {m.app_title()}</title>
</svelte:head>

<Catalog title={m.nav_games()} preset={['game']} />
