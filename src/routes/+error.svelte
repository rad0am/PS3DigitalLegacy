<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{page.status} · {m.app_title()}</title>
</svelte:head>

<main class="wrap" id="main">
	<div class="card card-empty" style="max-width:640px;margin:24px auto">
		<h1 class="h2">{page.status === 404 ? m.error_not_found() : m.error_generic()}</h1>
		<p class="muted" style="margin:8px 0 20px">{m.error_help()}</p>
		<a class="btn btn-red btn-lg" href={resolve('/')}>{m.error_back()}</a>
	</div>
</main>
