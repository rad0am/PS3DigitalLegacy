<script lang="ts">
	import { currencyName } from '#lib/currency/price.js';
	import { formatNumber, numberLocale } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { catalogStore } from '#lib/state/catalog.svelte.js';
	import { settings } from '#lib/state/settings.svelte.js';
	import { normalize } from '#lib/data/search.js';
	import Icon from './Icon.svelte';
	import Popover from './Popover.svelte';

	let { block = false }: { block?: boolean } = $props();

	const PREFERRED = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

	let open = $state(false);
	let query = $state('');
	let input = $state<HTMLInputElement>();

	const available = $derived(catalogStore.catalog?.currencies ?? []);
	const locale = $derived(numberLocale());

	const options = $derived.by(() => {
		const detected = settings.detected;
		const rank = (code: string) =>
			code === detected
				? -1
				: PREFERRED.includes(code)
					? PREFERRED.indexOf(code)
					: PREFERRED.length;
		const needle = normalize(query);
		return available
			.map((code) => ({ code, name: currencyName(code, locale) }))
			.filter((option) => !needle || normalize(`${option.code} ${option.name}`).includes(needle))
			.sort((a, b) => rank(a.code) - rank(b.code) || a.code.localeCompare(b.code));
	});

	$effect(() => {
		if (open) input?.focus();
		else query = '';
	});

	function choose(code: string) {
		settings.setCurrency(code);
		open = false;
	}
</script>

<Popover bind:open label={m.currency_label()} sheetOnMobile {block} width={380}>
	{#snippet trigger(props)}
		<button
			class="fld"
			type="button"
			aria-label={m.currency_current({ code: settings.currency })}
			style:width={block ? '100%' : undefined}
			style:justify-content={block ? 'space-between' : undefined}
			{...props}
		>
			<span class="row-f">
				<Icon name="globe" size="s" />{settings.currency}
				{#if block && settings.currencyChoice === null && settings.detected === settings.currency}
					<span class="bd bd-sky">{m.currency_detected_short()}</span>
				{/if}
			</span>
			<Icon name="chev" size="s" />
		</button>
	{/snippet}

	<div class="grab only-mobile"></div>
	<div class="row-f only-mobile" style="padding:8px 8px 8px 20px">
		<h2 class="h3">{m.currency_label()}</h2>
		<button
			class="btn btn-icon right"
			type="button"
			aria-label={m.close()}
			onclick={() => (open = false)}
		>
			<Icon name="x" />
		</button>
	</div>
	<div style="padding:12px 12px 8px">
		<div class="inp" style="display:flex;align-items:center;gap:8px;height:44px">
			<Icon name="search" size="s" />
			<input
				bind:this={input}
				bind:value={query}
				type="text"
				inputmode="search"
				placeholder={m.currency_search()}
				aria-label={m.currency_search()}
				style="flex:1;min-width:0;border:0;outline:none;background:none;font:inherit;color:inherit;height:100%"
			/>
		</div>
		<p class="xs muted" style="margin-top:8px">
			{m.currency_count({ count: formatNumber(available.length) })}
		</p>
	</div>
	<div class="pop-list" role="listbox" aria-label={m.currency_label()} style="flex:1">
		{#each options as option (option.code)}
			<button
				class="it"
				type="button"
				role="option"
				aria-selected={option.code === settings.currency}
				style="min-height:44px"
				onclick={() => choose(option.code)}
			>
				{#if option.code === settings.currency}
					<Icon name="check" size="s" />
				{:else}
					<span style="width:16px"></span>
				{/if}
				<span class="code3">{option.code}</span>
				<span class="grow">{option.name}</span>
				{#if option.code === settings.detected}
					<span class="bd bd-sky">{m.currency_detected()}</span>
				{:else if option.code === 'USD'}
					<span class="n">{m.currency_default()}</span>
				{/if}
			</button>
		{:else}
			<p class="muted sm" style="padding:12px 14px">
				{available.length === 0 ? m.loading() : m.currency_none()}
			</p>
		{/each}
	</div>
	<div class="xs muted" style="border-top:1px solid var(--line);margin-top:6px;padding:10px 14px">
		{m.currency_note()}
	</div>
</Popover>
