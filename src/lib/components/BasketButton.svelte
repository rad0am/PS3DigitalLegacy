<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { settings } from '#lib/state/settings.svelte.js';
	import {
		WEB_CLIENT_ID,
		basketOptions,
		basketUrl,
		clientIdFrom,
		storeKeyForCurrency,
		type BasketOption
	} from '#lib/store.js';
	import { resolve } from '$app/paths';

	let { storeSkus, compact = false }: { storeSkus: Record<string, string>; compact?: boolean } =
		$props();

	// Pages are prerendered, so the optional `?clientid=` override is read in the browser only.
	let clientId = $state(WEB_CLIENT_ID);
	onMount(() => {
		clientId = clientIdFrom(location.search);
	});

	const options = $derived(basketOptions(storeSkus, settings.currency));
	const first = $derived(options[0]);
	const others = $derived(options.slice(1));
	/** true when the first option is not the store of the selected currency */
	const mismatch = $derived(
		first !== undefined && first.store !== storeKeyForCurrency(settings.currency)
	);

	function storeLabel(option: BasketOption): string {
		if (option.store === 'NA') return m.basket_store_na();
		if (option.store === 'EU') return m.basket_store_eu();
		if (option.store === 'JP') return m.basket_store_jp();
		return m.basket_store_currency({ currency: option.store });
	}
</script>

{#snippet row(option: BasketOption)}
	<div class="opt">
		<a
			class="btn btn-blk btn-sm"
			href={basketUrl(option.sku, clientId)}
			target="_blank"
			rel="external noopener noreferrer"
			aria-label={m.basket_add_aria({ store: storeLabel(option) })}
		>
			<Icon name="cart" />{m.basket_add()}<span class="store-in">{storeLabel(option)}</span><Icon
				name="ext"
				size="s"
			/>
		</a>
		<span class="xs muted store-below">{storeLabel(option)}</span>
	</div>
{/snippet}

{#if first && compact}
	<!-- DLC rows: icon-only buttons that sit in the actions group next to "want" and "bought". -->
	{#each options as option (option.store)}
		<a
			class="ib"
			href={basketUrl(option.sku, clientId)}
			target="_blank"
			rel="external noopener noreferrer"
			title={options.length > 1 ? `${m.basket_add()}: ${storeLabel(option)}` : m.basket_add()}
			aria-label={m.basket_add_aria({ store: storeLabel(option) })}
		>
			<Icon name="cart" />
		</a>
	{/each}
{:else if first}
	<div class="basket col-f">
		{@render row(first)}
		{#each others as option (option.store)}
			{@render row(option)}
		{/each}
		<p class="xs muted">
			{mismatch ? m.basket_store_mismatch() : m.basket_note()}
			<a href={resolve('/about') + '#basket'}>{m.basket_about_link()}</a>
		</p>
	</div>
{/if}

<style>
	.basket {
		gap: 10px;
		align-items: flex-start;
	}
	.opt {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
	}
	.store-in {
		display: none;
		font-weight: 400;
		color: var(--muted, inherit);
	}
	/* Touch layouts (up to 1023px): full-width buttons like the other actions, store name inside the button. */
	@media (max-width: 1023px) {
		.basket,
		.basket .opt {
			align-self: stretch;
			align-items: stretch;
			width: 100%;
		}
		.basket :global(.btn) {
			justify-content: center;
			min-height: 44px;
		}
		.basket .store-in {
			display: inline;
		}
		.basket .store-below {
			display: none;
		}
	}
</style>
