<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{m.app_title()}</title>
</svelte:head>

<main>
	<h1>{m.app_title()}</h1>
	<p>{m.app_tagline()}</p>
	<p><small>{m.app_disclaimer()}</small></p>
</main>
