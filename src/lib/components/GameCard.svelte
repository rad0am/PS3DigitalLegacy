<script lang="ts">
	import type { Item } from '#lib/data/catalog.js';
	import { releaseYear } from '#lib/i18n.js';
	import { itemHref, gameHref } from '#lib/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { catalogStore } from '#lib/state/catalog.svelte.js';
	import { list } from '#lib/state/list.svelte.js';
	import Cover from './Cover.svelte';
	import Icon from './Icon.svelte';
	import ItemActions from './ItemActions.svelte';
	import ItemPrice from './ItemPrice.svelte';
	import ItemTags from './ItemTags.svelte';

	let { item }: { item: Item } = $props();

	const catalog = $derived(catalogStore.catalog);
	const status = $derived(list.statusOf(item.id));
	const href = $derived(itemHref(catalog, item));
	const parent = $derived(item.kind === 'dlc' ? catalog?.items[item.gameIndex] : undefined);
</script>

<article class="gcard" class:want={status === 'wishlist'} class:bought={status === 'bought'}>
	<a {href} tabindex="-1" aria-hidden="true" style="display:block"><Cover cover={item.cover} /></a>
	<div class="row-f wrapf" style="gap:6px">
		<h2 class="ttl"><a {href}>{item.title}</a></h2>
		{#if status === 'bought'}
			<span class="bd bd-bt"><Icon name="check" size="s" />{m.badge_bought()}</span>
		{:else if status === 'wishlist'}
			<span class="bd bd-want"><Icon name="heart" size="s" fill />{m.badge_want()}</span>
		{/if}
	</div>
	<div class="meta">
		{#if parent}
			{m.meta_dlc_for()} <a href={gameHref(parent.id)}>{parent.title}</a>
		{:else}
			{releaseYear(item.releaseDate) ?? ''}
		{/if}
	</div>
	<ItemTags {item} />
	<div class="gbot">
		<ItemPrice {item} />
		<ItemActions id={item.id} title={item.title} />
	</div>
</article>
