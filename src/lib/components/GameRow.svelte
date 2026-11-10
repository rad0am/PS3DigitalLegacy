<script lang="ts">
	import { type Item } from '#lib/data/catalog.js';
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

	let { item, compact = false }: { item: Item; compact?: boolean } = $props();

	const catalog = $derived(catalogStore.catalog);
	const status = $derived(list.statusOf(item.id));
	const href = $derived(itemHref(catalog, item));
	const parent = $derived(item.kind === 'dlc' ? catalog?.items[item.gameIndex] : undefined);
	const genres = $derived(
		item.genres.map((i) => catalog?.genres[i]).filter((name): name is string => !!name)
	);
	const meta = $derived(
		[releaseYear(item.releaseDate), genres.join(', ')].filter(Boolean).join(' · ')
	);
</script>

<article
	class="row"
	class:want={status === 'wishlist'}
	class:bought={status === 'bought'}
	class:compact
>
	<a {href} tabindex="-1" aria-hidden="true"><Cover cover={item.cover} /></a>
	<div class="col-f" style="gap:6px;min-width:0">
		<div class="row-f wrapf">
			<h2 class="ttl"><a {href}>{item.title}</a></h2>
			{#if status === 'bought'}
				<span class="bd bd-bt"><Icon name="check" size="s" />{m.badge_bought()}</span>
			{:else if status === 'wishlist'}
				<span class="bd bd-want"><Icon name="heart" size="s" fill />{m.badge_want()}</span>
			{/if}
		</div>
		{#if parent}
			<div class="meta">
				{m.meta_dlc_for()} <a href={gameHref(parent.id)}>{parent.title}</a>{meta
					? ` · ${meta}`
					: ''}
			</div>
		{:else if meta}
			<div class="meta">{meta}</div>
		{/if}
		{#if !compact}<ItemTags {item} />{/if}
	</div>
	<div class="rbot">
		<ItemPrice {item} />
		<ItemActions id={item.id} title={item.title} />
	</div>
</article>
