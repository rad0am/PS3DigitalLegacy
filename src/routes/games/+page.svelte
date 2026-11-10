<script lang="ts">
	import SeoMeta from '#lib/components/SeoMeta.svelte';
	import Catalog from '#lib/components/Catalog.svelte';
	import { m } from '#lib/paraglide/messages.js';
</script>

<SeoMeta title={m.nav_games()} />

<Catalog title={m.nav_games()} preset={['game']} />
