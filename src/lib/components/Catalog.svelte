<script lang="ts">
	import { afterNavigate, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { issueUrl } from '#lib/config.js';
	import {
		SORT_KEYS,
		facetCounts,
		filterItems,
		sortItems,
		type FilterContext,
		type ItemType,
		type SortKey
	} from '#lib/data/filter.js';
	import { formatNumber, numberLocale } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { catalogStore } from '#lib/state/catalog.svelte.js';
	import { FilterState } from '#lib/state/filters.svelte.js';
	import { settings } from '#lib/state/settings.svelte.js';
	import { ui } from '#lib/state/ui.svelte.js';
	import FilterPanel from './FilterPanel.svelte';
	import GameCard from './GameCard.svelte';
	import GameRow from './GameRow.svelte';
	import Icon from './Icon.svelte';
	import Modal from './Modal.svelte';
	import Popover from './Popover.svelte';

	let { title, preset }: { title: string; preset: ItemType[] } = $props();

	const PAGE_SIZE = 50;

	const filters = new FilterState(untrack(() => preset));

	let urlReady = $state(false);
	let shown = $state(PAGE_SIZE);
	let sortOpen = $state(false);
	let sortOpenMobile = $state(false);

	// ---- URL <-> filters ----
	afterNavigate(({ to }) => {
		if (to) filters.applyUrl(to.url.searchParams);
		urlReady = true;
	});

	$effect(() => {
		if (!urlReady) return;
		const query = filters.query();
		const target = `${location.pathname}${query ? `?${query}` : ''}${location.hash}`;
		if (target !== `${location.pathname}${location.search}${location.hash}`) {
			replaceState(target, page.state);
		}
	});

	// ---- a price range only makes sense in the currency it was set in ----
	let lastCurrency: string | null = null;
	$effect(() => {
		if (catalogStore.status !== 'ready') return;
		const currency = settings.currency;
		untrack(() => {
			if (lastCurrency !== null && currency !== lastCurrency) filters.clearPrice();
			lastCurrency = currency;
		});
	});

	// ---- results ----
	const catalog = $derived(catalogStore.catalog);
	const ctx = $derived<FilterContext | null>(
		catalog ? { catalog, price: (item) => catalogStore.priceIn(settings.currency, item) } : null
	);
	const snapshot = $derived(filters.snapshot());
	const results = $derived(
		ctx ? sortItems(filterItems(snapshot, ctx), snapshot.sort, ctx, numberLocale()) : []
	);
	const facets = $derived(ctx ? facetCounts(snapshot, ctx) : null);
	const visible = $derived(results.slice(0, shown));
	const priceBound = $derived.by(() => {
		const table = catalogStore.tables[settings.currency];
		if (!table) return 0;
		let max = 0;
		for (const value of table) if (value !== null && value > max) max = value;
		return Math.ceil(max);
	});

	// Back to the first page whenever the filters change.
	$effect(() => {
		void filters.query();
		shown = PAGE_SIZE;
	});

	// ---- active filter chips ----
	interface Chip {
		key: string;
		label: string;
		remove: () => void;
	}

	const chips = $derived.by(() => {
		const list: Chip[] = [];
		const f = filters;
		if (f.q) list.push({ key: 'q', label: m.chip_search({ q: f.q }), remove: () => (f.q = '') });
		if (f.types.length === 1) {
			const type = f.types[0]!;
			list.push({
				key: `type-${type}`,
				label: type === 'game' ? m.type_games() : m.type_dlc(),
				remove: () => (f.types = [])
			});
		}
		for (const region of f.regions) {
			list.push({
				key: `region-${region}`,
				label: m.chip_region({ region }),
				remove: () => f.toggle('regions', region)
			});
		}
		for (const genre of f.genres) {
			list.push({ key: `genre-${genre}`, label: genre, remove: () => f.toggle('genres', genre) });
		}
		for (const status of f.statuses) {
			const label =
				status === 'available'
					? m.status_available()
					: status === 'delisted'
						? m.status_delisted()
						: m.status_unknown_short();
			list.push({
				key: `status-${status}`,
				label: m.chip_status({ status: label }),
				remove: () => f.toggle('statuses', status)
			});
		}
		if (f.priceMin !== null || f.priceMax !== null) {
			list.push({
				key: 'price',
				label: m.chip_price({
					min: String(f.priceMin ?? 0),
					max: f.priceMax === null ? '∞' : String(f.priceMax),
					currency: settings.currency
				}),
				remove: () => f.clearPrice()
			});
		}
		if (f.digitalOnly) {
			list.push({
				key: 'digital',
				label: m.filter_digital_only(),
				remove: () => (f.digitalOnly = false)
			});
		}
		return list;
	});

	const sortLabels: Record<SortKey, () => string> = {
		'name-asc': () => m.sort_name_asc(),
		'name-desc': () => m.sort_name_desc(),
		'price-asc': () => m.sort_price_asc(),
		'price-desc': () => m.sort_price_desc(),
		'date-desc': () => m.sort_date_desc(),
		'date-asc': () => m.sort_date_asc()
	};

	const remaining = $derived(results.length - visible.length);
</script>

<main class="wrap" id="main">
	<div class="row-f" style="align-items:baseline;gap:12px;margin-bottom:16px;flex-wrap:wrap">
		<h1 class="h1">{title}</h1>
		{#if catalog}
			<span class="muted" style="font-size:16px" aria-live="polite"
				>{m.results_count({ count: results.length })}</span
			>
		{/if}
		<span class="muted right sm only-desktop">{m.prices_note()}</span>
	</div>

	<div class="cols">
		<aside class="side" aria-label={m.filters_title()}>
			<FilterPanel {filters} {facets} {catalog} {priceBound} />
		</aside>

		<section class="main" aria-label={m.results_title()}>
			<!-- touch layout: filter and sort buttons -->
			<div class="row-f only-mobile" style="gap:8px;margin-bottom:12px">
				<button class="btn grow" type="button" onclick={() => (ui.filtersOpen = true)}>
					<Icon name="filter" />{m.filters_title()}
					{#if chips.length > 0}<span class="bd bd-bt" style="background:var(--red);padding:0 7px"
							>{chips.length}</span
						>{/if}
				</button>
				<div class="grow" style="min-width:0">
					<Popover bind:open={sortOpenMobile} label={m.sort_label()} align="left" block>
						{#snippet trigger(props)}
							<button class="btn" style="width:100%" type="button" {...props}>
								<Icon name="sort" />{sortLabels[filters.sort]()}
							</button>
						{/snippet}
						<div style="padding:6px 0;min-width:220px" role="listbox" aria-label={m.sort_label()}>
							{#each SORT_KEYS as key (key)}
								<button
									class="it"
									type="button"
									role="option"
									aria-selected={filters.sort === key}
									onclick={() => {
										filters.sort = key;
										sortOpenMobile = false;
									}}
								>
									{sortLabels[key]()}
								</button>
							{/each}
						</div>
					</Popover>
				</div>
				<div class="seg" role="group" aria-label={m.view_label()}>
					<button
						type="button"
						aria-label={m.view_list()}
						aria-pressed={settings.view === 'list'}
						onclick={() => settings.setView('list')}><Icon name="list" /></button
					>
					<button
						type="button"
						aria-label={m.view_grid()}
						aria-pressed={settings.view === 'grid'}
						onclick={() => settings.setView('grid')}><Icon name="grid" /></button
					>
				</div>
			</div>

			<div class="tools" style="margin-bottom:12px">
				<div
					class="hs"
					style="flex:1;min-width:0;align-items:center;padding-bottom:0;flex-wrap:wrap;overflow:visible"
				>
					{#each chips as chip (chip.key)}
						<span class="chip">
							{chip.label}
							<button
								type="button"
								aria-label={m.chip_remove({ filter: chip.label })}
								onclick={chip.remove}
							>
								<Icon name="x" size="s" />
							</button>
						</span>
					{/each}
					{#if chips.length > 0}
						<button
							class="link sm"
							type="button"
							style="margin-left:4px;flex:none"
							onclick={() => filters.clear()}
						>
							{m.clear_all()}
						</button>
					{/if}
				</div>
				<div class="row-f only-desktop" style="gap:12px;margin-left:auto">
					{#if settings.view === 'list'}
						<div class="row-f sm muted" style="gap:8px">
							<button
								class="tg"
								type="button"
								role="switch"
								id="compact-switch"
								aria-label={m.view_compact()}
								aria-checked={settings.compact}
								onclick={() => settings.setCompact(!settings.compact)}
							></button>
							<label for="compact-switch">{m.view_compact()}</label>
						</div>
					{/if}
					<Popover bind:open={sortOpen} label={m.sort_label()}>
						{#snippet trigger(props)}
							<button class="fld" type="button" aria-label={m.sort_label()} {...props}>
								<Icon name="sort" size="s" /><span class="muted" style="font-weight:500"
									>{m.sort_prefix()}</span
								>
								{sortLabels[filters.sort]()}<Icon name="chev" size="s" />
							</button>
						{/snippet}
						<div style="padding:6px 0;min-width:230px" role="listbox" aria-label={m.sort_label()}>
							{#each SORT_KEYS as key (key)}
								<button
									class="it"
									type="button"
									role="option"
									aria-selected={filters.sort === key}
									onclick={() => {
										filters.sort = key;
										sortOpen = false;
									}}
								>
									{sortLabels[key]()}
								</button>
							{/each}
						</div>
					</Popover>
					<div class="seg" role="group" aria-label={m.view_label()}>
						<button
							type="button"
							aria-label={m.view_list()}
							aria-pressed={settings.view === 'list'}
							onclick={() => settings.setView('list')}><Icon name="list" /></button
						>
						<button
							type="button"
							aria-label={m.view_grid()}
							aria-pressed={settings.view === 'grid'}
							onclick={() => settings.setView('grid')}><Icon name="grid" /></button
						>
					</div>
				</div>
			</div>

			{#if catalogStore.status === 'error'}
				<div class="card card-empty" role="alert">
					<h2 class="h3">{m.error_catalog()}</h2>
					<p class="muted" style="margin:8px 0 20px">{m.error_catalog_help()}</p>
					<button class="btn btn-red btn-lg" type="button" onclick={() => void catalogStore.retry()}
						>{m.retry()}</button
					>
				</div>
			{:else if !catalog}
				<div class="stack-s" aria-busy="true" aria-label={m.loading()}>
					{#each [0, 1, 2, 3, 4, 5] as n (n)}
						<div class="row">
							<div class="sk" style="width:72px;height:96px;border-radius:8px"></div>
							<div class="col-f" style="gap:10px">
								<div class="sk" style="height:18px;width:60%"></div>
								<div class="sk" style="height:14px;width:30%"></div>
								<div class="sk" style="height:18px;width:50%"></div>
							</div>
							<div class="sk" style="height:22px;width:80px;margin-left:auto"></div>
							<div class="acts">
								<div class="sk" style="width:40px;height:40px"></div>
								<div class="sk" style="width:40px;height:40px"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else if results.length === 0}
				<div class="card card-empty">
					<h2 class="h3">{m.empty_results()}</h2>
					<p class="muted" style="margin:8px 0 20px">{m.empty_results_help()}</p>
					<div class="row-f wrapf" style="justify-content:center">
						{#if chips.length > 0}
							<button class="btn" type="button" onclick={() => filters.clear()}
								>{m.clear_all()}</button
							>
						{/if}
						<a
							class="btn btn-out"
							href={issueUrl('missing-game')}
							target="_blank"
							rel="external noopener noreferrer"
						>
							{m.report_cant_find()}<Icon name="ext" size="s" />
						</a>
					</div>
				</div>
			{:else}
				{#if settings.view === 'grid'}
					<div class="gcards">
						{#each visible as item (item.id)}
							<GameCard {item} />
						{/each}
					</div>
				{:else}
					<div class="stack-s">
						{#each visible as item (item.id)}
							<GameRow {item} compact={settings.compact} />
						{/each}
					</div>
				{/if}
				<div class="more">
					<p class="muted sm">
						{m.results_showing({
							shown: formatNumber(visible.length),
							total: formatNumber(results.length)
						})}
					</p>
					{#if remaining > 0}
						<button class="btn btn-lg" type="button" onclick={() => (shown += PAGE_SIZE)}>
							{m.show_more({ count: Math.min(PAGE_SIZE, remaining) })}
						</button>
					{/if}
				</div>
			{/if}
		</section>
	</div>
</main>

<Modal bind:open={ui.filtersOpen} label={m.filters_title()} variant="sheet">
	<section class="sheet" style="height:min(744px,92dvh)">
		<div class="grab"></div>
		<div
			class="row-f"
			style="padding:8px 16px 8px 20px;border-bottom:1px solid var(--line);flex:none"
		>
			<h2 class="h3">{m.filters_title()}</h2>
			<span class="muted sm">{m.filters_active({ count: chips.length })}</span>
			<button
				class="btn btn-icon right"
				type="button"
				style="border:0"
				aria-label={m.filters_close()}
				onclick={() => (ui.filtersOpen = false)}
			>
				<Icon name="x" />
			</button>
		</div>
		<div style="padding:0 20px;flex:1;overflow-y:auto">
			<FilterPanel {filters} {facets} {catalog} {priceBound} variant="sheet" />
		</div>
		<div
			class="row-f"
			style="padding:12px 16px;border-top:1px solid var(--line);background:#fff;gap:12px;flex:none"
		>
			<button class="btn btn-lg" type="button" onclick={() => filters.clear()}
				>{m.clear_all()}</button
			>
			<button
				class="btn btn-red btn-lg grow"
				type="button"
				onclick={() => (ui.filtersOpen = false)}
			>
				{m.filters_show_results({ count: results.length })}
			</button>
		</div>
	</section>
</Modal>
