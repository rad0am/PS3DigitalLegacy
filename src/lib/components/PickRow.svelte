<script lang="ts">
	import type { Item } from '#lib/data/catalog.js';
	import { releaseYear } from '#lib/i18n.js';
	import { gameHref } from '#lib/links.js';
	import { catalogStore } from '#lib/state/catalog.svelte.js';
	import Cover from './Cover.svelte';
	import ItemPrice from './ItemPrice.svelte';

	let { item }: { item: Item } = $props();

	const meta = $derived(
		[
			releaseYear(item.releaseDate),
			...item.genres.slice(0, 2).map((index) => catalogStore.catalog?.genres[index])
		]
			.filter(Boolean)
			.join(' · ')
	);
</script>

<a class="rk" href={gameHref(item.id)}>
	<Cover cover={item.cover} size="cover_small" />
	<div class="rk-b">
		<div class="ttl">{item.title}</div>
		<div class="meta">{meta}</div>
	</div>
	<div class="rk-r"><ItemPrice {item} /></div>
</a>
