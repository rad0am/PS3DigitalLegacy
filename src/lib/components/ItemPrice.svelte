<script lang="ts">
	import type { Item } from '#lib/data/catalog.js';
	import { formatPrice } from '#lib/currency/price.js';
	import { numberLocale } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { catalogStore } from '#lib/state/catalog.svelte.js';
	import { settings } from '#lib/state/settings.svelte.js';

	let { item }: { item: Item } = $props();

	// A game with a disc release has no digital price of its own: show its cheapest DLC instead.
	const discGame = $derived(item.kind === 'game' && !item.digitalOnly);
	const price = $derived(discGame ? catalogStore.cheapestDlc(item) : catalogStore.display(item));
	const ready = $derived(catalogStore.pricesReady);
	const locale = $derived(numberLocale());
</script>

{#if !ready}
	<div class="price" aria-hidden="true">
		<div class="sk" style="height:22px;width:80px;margin-left:auto"></div>
	</div>
{:else if price}
	<div class="price">
		{#if discGame}
			{m.price_dlc_from({ price: formatPrice(price, locale) })}
		{:else}
			{formatPrice(price, locale)}
		{/if}
		{#if price.fallback}
			<small>{m.price_fallback({ selected: settings.currency, shown: price.currency })}</small>
		{/if}
		{#if item.status === 'delisted'}
			<small>{m.price_may_unavailable()}</small>
		{/if}
	</div>
{:else}
	<div class="price na">{m.price_unavailable()}</div>
{/if}
