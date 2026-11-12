<script lang="ts">
	import type { Catalog } from '#lib/data/catalog.js';
	import type { Facets } from '#lib/data/filter.js';
	import { REGIONS, STORE_STATUSES, type Region, type StoreStatus } from '#lib/data/types.js';
	import { formatNumber } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { settings } from '#lib/state/settings.svelte.js';
	import type { FilterState } from '#lib/state/filters.svelte.js';
	import Icon from './Icon.svelte';
	import PriceRange from './PriceRange.svelte';

	let {
		filters,
		facets,
		catalog,
		priceBound,
		variant = 'side'
	}: {
		filters: FilterState;
		facets: Facets | null;
		catalog: Catalog | null;
		priceBound: number;
		/** side: sidebar on desktop; sheet: bottom sheet on touch layouts (regions as pills) */
		variant?: 'side' | 'sheet';
	} = $props();

	const uid = $props.id();
	const GENRES_SHOWN = 6;
	let allGenres = $state(false);

	const regionLabels: Record<Region, () => string> = {
		NA: () => m.region_na(),
		EU: () => m.region_eu(),
		JP: () => m.region_jp()
	};
	const statusLabels: Record<StoreStatus, () => string> = {
		available: () => m.status_available(),
		delisted: () => m.status_delisted(),
		unknown: () => m.status_unknown_short()
	};

	const genreOptions = $derived(
		(catalog?.genres ?? []).map((name, index) => ({ name, count: facets?.genres[index] ?? 0 }))
	);
	// Selected genres stay visible even when they are beyond the first few.
	const hiddenSelected = $derived(
		genreOptions.slice(GENRES_SHOWN).some((option) => filters.genres.includes(option.name))
	);
	const visibleGenres = $derived(
		allGenres || hiddenSelected ? genreOptions : genreOptions.slice(0, GENRES_SHOWN)
	);
	const moreGenres = $derived(genreOptions.length - GENRES_SHOWN);

	const count = (value: number | undefined) => (value === undefined ? '' : formatNumber(value));
</script>

<div class="fg">
	<h3>{m.filter_type()}</h3>
	<label class="opt">
		<input
			type="checkbox"
			checked={filters.types.includes('game')}
			onchange={() => filters.toggle('types', 'game')}
		/>
		<span class="cb"><Icon name="check" /></span>{m.type_games()}<span class="n"
			>{count(facets?.types.game)}</span
		>
	</label>
	<label class="opt">
		<input
			type="checkbox"
			checked={filters.types.includes('dlc')}
			onchange={() => filters.toggle('types', 'dlc')}
		/>
		<span class="cb"><Icon name="check" /></span>{m.type_dlc()}<span class="n"
			>{count(facets?.types.dlc)}</span
		>
	</label>
</div>

<div class="fg">
	<h3>{m.filter_region()}</h3>
	{#if variant === 'sheet'}
		<div class="row-f wrapf">
			{#each REGIONS as region (region)}
				<button
					class="pill"
					type="button"
					aria-pressed={filters.regions.includes(region)}
					onclick={() => filters.toggle('regions', region)}
				>
					{region}<span class="xs">{count(facets?.regions[region])}</span>
				</button>
			{/each}
		</div>
	{:else}
		{#each REGIONS as region (region)}
			<label class="opt">
				<input
					type="checkbox"
					checked={filters.regions.includes(region)}
					onchange={() => filters.toggle('regions', region)}
				/>
				<span class="cb"><Icon name="check" /></span>{regionLabels[region]()}<span class="n"
					>{count(facets?.regions[region])}</span
				>
			</label>
		{/each}
	{/if}
</div>

<div class="fg">
	<h3>{m.filter_genre()}</h3>
	{#each visibleGenres as option (option.name)}
		<label class="opt">
			<input
				type="checkbox"
				checked={filters.genres.includes(option.name)}
				onchange={() => filters.toggle('genres', option.name)}
			/>
			<span class="cb"><Icon name="check" /></span>{option.name}<span class="n"
				>{count(option.count)}</span
			>
		</label>
	{/each}
	{#if moreGenres > 0 && !hiddenSelected}
		<button
			class="link sm"
			type="button"
			style="margin-top:6px"
			onclick={() => (allGenres = !allGenres)}
		>
			{allGenres ? m.filter_genres_fewer() : m.filter_genres_more({ count: moreGenres })}
		</button>
	{/if}
</div>

<div class="fg">
	<h3>
		{m.filter_price()}
		<span class="muted" style="font-weight:500"
			>{m.filter_price_in({ currency: settings.currency })}</span
		>
	</h3>
	{#if priceBound > 0}
		<PriceRange
			bound={priceBound}
			min={filters.priceMin}
			max={filters.priceMax}
			onchange={(min, max) => {
				filters.priceMin = min;
				filters.priceMax = max;
			}}
		/>
	{/if}
	<p class="xs muted" style="margin-top:8px">{m.filter_price_note()}</p>
</div>

<div class="fg">
	<h3>{m.filter_status()}</h3>
	{#each STORE_STATUSES as status (status)}
		<label class="opt">
			<input
				type="checkbox"
				checked={filters.statuses.includes(status)}
				onchange={() => filters.toggle('statuses', status)}
			/>
			<span class="cb"><Icon name="check" /></span>{statusLabels[status]()}<span class="n"
				>{count(facets?.statuses[status])}</span
			>
		</label>
	{/each}
</div>

<div class="fg">
	<div class="opt" style="justify-content:space-between">
		<span id="platinum-label-{uid}" style="font-weight:600">{m.filter_platinum()}</span>
		<button
			class="tg"
			type="button"
			role="switch"
			aria-checked={filters.platinum}
			aria-labelledby="platinum-label-{uid}"
			onclick={() => (filters.platinum = !filters.platinum)}
		></button>
	</div>
	<div class="opt" style="justify-content:space-between">
		<span id="trophies-label-{uid}" style="font-weight:600">{m.filter_trophies()}</span>
		<button
			class="tg"
			type="button"
			role="switch"
			aria-checked={filters.trophies}
			aria-labelledby="trophies-label-{uid}"
			onclick={() => (filters.trophies = !filters.trophies)}
		></button>
	</div>
</div>

<div class="fg">
	<div class="opt" style="justify-content:space-between">
		<span id="digital-only-label-{uid}" style="font-weight:600">{m.filter_digital_only()}</span>
		<button
			class="tg"
			type="button"
			role="switch"
			aria-checked={filters.digitalOnly}
			aria-labelledby="digital-only-label-{uid}"
			aria-describedby="digital-only-help-{uid}"
			onclick={() => (filters.digitalOnly = !filters.digitalOnly)}
		></button>
	</div>
	<p class="xs muted" id="digital-only-help-{uid}" style="margin-top:4px">
		{m.filter_digital_only_help()}
	</p>
</div>
