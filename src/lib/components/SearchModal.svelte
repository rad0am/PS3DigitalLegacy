<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { regionsOf, type Item } from '#lib/data/catalog.js';
	import { matchScore, normalize, tokenize } from '#lib/data/search.js';
	import { formatPrice } from '#lib/currency/price.js';
	import { issueUrl } from '#lib/config.js';
	import { formatNumber, numberLocale, releaseYear } from '#lib/i18n.js';
	import { itemHref } from '#lib/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { catalogStore } from '#lib/state/catalog.svelte.js';
	import { list } from '#lib/state/list.svelte.js';
	import { ui } from '#lib/state/ui.svelte.js';
	import Cover from './Cover.svelte';
	import Icon from './Icon.svelte';
	import Modal from './Modal.svelte';
	import StatusBadge from './StatusBadge.svelte';

	const LIMIT = 8;

	let query = $state('');
	let tab = $state<'game' | 'dlc'>('game');
	let active = $state(0);
	let input = $state<HTMLInputElement>();

	const catalog = $derived(catalogStore.catalog);
	const locale = $derived(numberLocale());

	const matches = $derived.by(() => {
		const found: Record<'game' | 'dlc', Item[]> = { game: [], dlc: [] };
		const tokens = tokenize(query);
		if (!catalog || tokens.length === 0) return found;
		const phrase = normalize(query);
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- local to this computation
		const scores = new Map<number, number>();
		for (const item of catalog.items) {
			const score = matchScore(item.search, item.titleNorm, tokens, phrase);
			if (score > 0) {
				scores.set(item.index, score);
				found[item.kind].push(item);
			}
		}
		const byScore = (a: Item, b: Item) =>
			(scores.get(b.index) ?? 0) - (scores.get(a.index) ?? 0) || a.title.localeCompare(b.title);
		found.game.sort(byScore);
		found.dlc.sort(byScore);
		return found;
	});

	const shown = $derived(matches[tab].slice(0, LIMIT));
	const hasQuery = $derived(normalize(query).length > 0);

	// Keep the highlighted row valid as results change.
	$effect(() => {
		void query;
		void tab;
		active = 0;
	});

	$effect(() => {
		if (ui.searchOpen) input?.focus();
		else query = '';
	});

	function close() {
		ui.searchOpen = false;
	}

	function advancedHref(): string {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- builds a string, not reactive state
		const params = new URLSearchParams();
		if (query.trim()) params.set('q', query.trim());
		params.set('type', tab);
		return `${resolve('/')}?${params.toString()}`;
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			active = Math.min(active + 1, shown.length - 1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			active = Math.max(active - 1, 0);
		} else if (event.key === 'Enter') {
			const item = shown[active];
			if (item) {
				event.preventDefault();
				close();
				void goto(itemHref(catalog, item));
			}
		}
	}

	$effect(() => {
		document.getElementById(`search-result-${active}`)?.scrollIntoView({ block: 'nearest' });
	});
</script>

<Modal bind:open={ui.searchOpen} label={m.search_title()} width={680} top={110}>
	<div class="modal">
		<div class="row-f" style="margin-bottom:16px">
			<h2 class="h2">{m.search_title()}</h2>
			<button
				class="btn btn-icon right"
				type="button"
				style="border:0"
				aria-label={m.search_close()}
				onclick={close}
			>
				<Icon name="x" />
			</button>
		</div>

		<div class="pills" role="group" aria-label={m.search_type()} style="margin-bottom:16px">
			<button
				class="pill"
				type="button"
				aria-pressed={tab === 'game'}
				onclick={() => (tab = 'game')}
			>
				{m.search_tab_games()}<span class="xs" style:opacity={tab === 'game' ? 0.9 : undefined}
					>{hasQuery ? formatNumber(matches.game.length) : ''}</span
				>
			</button>
			<button class="pill" type="button" aria-pressed={tab === 'dlc'} onclick={() => (tab = 'dlc')}>
				{m.search_tab_dlc()}<span class="xs" style:opacity={tab === 'dlc' ? 0.9 : undefined}
					>{hasQuery ? formatNumber(matches.dlc.length) : ''}</span
				>
			</button>
		</div>

		<div class="bigin">
			<Icon name="search" />
			<input
				bind:this={input}
				bind:value={query}
				type="text"
				inputmode="search"
				role="combobox"
				aria-expanded={shown.length > 0}
				aria-controls="search-results"
				aria-activedescendant={shown.length > 0 ? `search-result-${active}` : undefined}
				aria-label={m.search_placeholder()}
				placeholder={m.search_placeholder()}
				autocomplete="off"
				spellcheck="false"
				onkeydown={onKeydown}
			/>
			{#if query}
				<button
					class="btn btn-icon btn-sm"
					type="button"
					style="border:0;min-height:0;height:32px;width:32px"
					aria-label={m.search_clear()}
					onclick={() => {
						query = '';
						input?.focus();
					}}
				>
					<Icon name="x" />
				</button>
			{/if}
		</div>

		<p class="muted sm" style="margin:12px 0 4px" aria-live="polite">
			{#if !catalog}
				{m.loading()}
			{:else if !hasQuery}
				{m.search_hint_start()}
			{:else if matches[tab].length === 0}
				{m.search_no_results()}
			{:else}
				{tab === 'game'
					? m.search_showing_games({ shown: shown.length, total: matches.game.length })
					: m.search_showing_dlc({ shown: shown.length, total: matches.dlc.length })}
			{/if}
		</p>

		<div
			class="stack"
			id="search-results"
			role="listbox"
			aria-label={m.search_title()}
			style="gap:2px"
		>
			{#each shown as item, i (item.id)}
				{@const status = list.statusOf(item.id)}
				{@const price = catalogStore.display(item)}
				{@const parent = item.kind === 'dlc' ? catalog?.items[item.gameIndex] : undefined}
				<a
					class="res"
					class:act={i === active}
					id="search-result-{i}"
					role="option"
					aria-selected={i === active}
					href={itemHref(catalog, item)}
					onclick={close}
					onmouseenter={() => (active = i)}
				>
					<Cover cover={item.cover} size="cover_small" />
					<div class="grow">
						<div class="row-f wrapf" style="gap:6px">
							<span class="h4">{item.title}</span>
							{#if status === 'bought'}
								<span class="bd bd-bt"><Icon name="check" size="s" />{m.badge_bought()}</span>
							{:else if status === 'wishlist'}
								<span class="bd bd-want"><Icon name="heart" size="s" fill />{m.badge_want()}</span>
							{/if}
						</div>
						<div class="meta">
							{#if parent}
								{m.meta_dlc_for()} <span>{parent.title}</span>
							{:else}
								{[
									releaseYear(item.releaseDate),
									regionsOf(item.regions).join(', '),
									item.genres[0] !== undefined ? catalog?.genres[item.genres[0]] : null
								]
									.filter(Boolean)
									.join(' · ')}
							{/if}
						</div>
					</div>
					{#if item.hasPlatinum}
						<span class="bd bd-gold res-status"
							><Icon name="trophy" size="s" />{m.badge_platinum()}</span
						>
					{/if}
					<span class="res-status"><StatusBadge status={item.status} variant="short" /></span>
					{#if price}
						<span class="price" class:dim={status === 'bought'}>{formatPrice(price, locale)}</span>
					{:else}
						<span class="price na">{m.price_unavailable()}</span>
					{/if}
				</a>
			{/each}
		</div>

		<div
			class="row-f wrapf"
			style="margin-top:16px;padding-top:16px;border-top:1px solid var(--line)"
		>
			<span class="muted xs only-desktop">{m.search_keys()}</span>
			<a
				class="link xs"
				href={issueUrl('missing-game')}
				target="_blank"
				rel="external noopener noreferrer"
				style="margin-left:16px"
			>
				{m.report_cant_find()}
			</a>
			<a
				class="link right row-f"
				href={advancedHref()}
				onclick={close}
				style="gap:6px;text-decoration:none"
			>
				{m.search_advanced()}<Icon name="arrow" size="s" />
			</a>
		</div>
	</div>
</Modal>
