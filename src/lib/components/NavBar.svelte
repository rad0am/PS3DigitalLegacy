<script lang="ts">
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { NAV_LINKS, hrefOf } from '#lib/nav.js';
	import { list } from '#lib/state/list.svelte.js';
</script>

<nav class="nav only-desktop" aria-label={m.nav_main()}>
	{#each NAV_LINKS as link (link.route)}
		<a href={hrefOf(link.route)} aria-current={page.route.id === link.route ? 'page' : undefined}>
			{link.label()}
			{#if link.route === '/my-list' && list.wishlistCount > 0}
				<span class="cnt">{list.wishlistCount}</span>
			{/if}
		</a>
	{/each}
</nav>
