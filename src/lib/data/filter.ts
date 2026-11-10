// Catalog filtering, sorting and facet counts. Pure functions, no framework imports.
import { matchScore, normalize, tokenize } from './search';
import { REGIONS, REGION_BIT, STORE_STATUSES, type Region, type StoreStatus } from './types';
import type { Catalog, Item } from './catalog';

export type ItemType = 'game' | 'dlc';

export const SORT_KEYS = [
	'name-asc',
	'name-desc',
	'price-asc',
	'price-desc',
	'date-desc',
	'date-asc'
] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export interface Filters {
	/** free-text search over title and alternative names */
	q: string;
	types: ItemType[];
	regions: Region[];
	/** genre names */
	genres: string[];
	statuses: StoreStatus[];
	/** hides games that have a disc release; DLC is never hidden */
	digitalOnly: boolean;
	/** price range in the selected currency, null = unbounded */
	priceMin: number | null;
	priceMax: number | null;
	sort: SortKey;
}

export interface FilterContext {
	catalog: Catalog;
	/** price in the selected currency only (no fallback), null when there is none */
	price: (item: Item) => number | null;
}

export type FacetGroup = 'type' | 'region' | 'genre' | 'status';

export function defaultFilters(types: ItemType[] = ['game', 'dlc']): Filters {
	return {
		q: '',
		types,
		regions: [],
		genres: [],
		statuses: [],
		digitalOnly: true,
		priceMin: null,
		priceMax: null,
		sort: 'name-asc'
	};
}

export function hasPriceFilter(f: Filters): boolean {
	return f.priceMin !== null || f.priceMax !== null;
}

export function matches(
	item: Item,
	f: Filters,
	ctx: FilterContext,
	skip?: FacetGroup,
	query?: { tokens: string[]; phrase: string }
): boolean {
	if (skip !== 'type' && f.types.length > 0 && !f.types.includes(item.kind)) return false;
	if (f.digitalOnly && item.kind === 'game' && !item.digitalOnly) return false;
	if (skip !== 'region' && f.regions.length > 0) {
		if (!f.regions.some((region) => (item.regions & REGION_BIT[region]) !== 0)) return false;
	}
	if (skip !== 'status' && f.statuses.length > 0 && !f.statuses.includes(item.status)) return false;
	if (skip !== 'genre' && f.genres.length > 0) {
		const names = item.genres.map((i) => ctx.catalog.genres[i]);
		if (!f.genres.some((genre) => names.includes(genre))) return false;
	}
	if (hasPriceFilter(f)) {
		const price = ctx.price(item);
		if (price === null) return false;
		if (f.priceMin !== null && price < f.priceMin) return false;
		if (f.priceMax !== null && price > f.priceMax) return false;
	}
	const q = query ?? { tokens: tokenize(f.q), phrase: normalize(f.q) };
	if (q.tokens.length > 0 && matchScore(item.search, item.titleNorm, q.tokens, q.phrase) === 0) {
		return false;
	}
	return true;
}

export function filterItems(f: Filters, ctx: FilterContext): Item[] {
	const query = { tokens: tokenize(f.q), phrase: normalize(f.q) };
	return ctx.catalog.items.filter((item) => matches(item, f, ctx, undefined, query));
}

const collators = new Map<string, Intl.Collator>();

function collator(locale: string): Intl.Collator {
	let existing = collators.get(locale);
	if (!existing) {
		existing = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
		collators.set(locale, existing);
	}
	return existing;
}

/** Returns a new sorted array. Items without a price or date always go last. */
export function sortItems(
	list: readonly Item[],
	key: SortKey,
	ctx: FilterContext,
	locale: string
): Item[] {
	const names = collator(locale);
	const byName = (a: Item, b: Item) => names.compare(a.title, b.title) || a.index - b.index;
	const sorted = [...list];

	if (key === 'name-asc') return sorted.sort(byName);
	if (key === 'name-desc') return sorted.sort((a, b) => -byName(a, b));

	if (key === 'price-asc' || key === 'price-desc') {
		const sign = key === 'price-asc' ? 1 : -1;
		const prices = new Map(sorted.map((item) => [item.index, ctx.price(item)]));
		return sorted.sort((a, b) => {
			const pa = prices.get(a.index) ?? null;
			const pb = prices.get(b.index) ?? null;
			if (pa === null || pb === null) return pa === pb ? byName(a, b) : pa === null ? 1 : -1;
			return sign * (pa - pb) || byName(a, b);
		});
	}

	const sign = key === 'date-asc' ? 1 : -1;
	return sorted.sort((a, b) => {
		if (a.releaseDate === null || b.releaseDate === null) {
			return a.releaseDate === b.releaseDate ? byName(a, b) : a.releaseDate === null ? 1 : -1;
		}
		return sign * a.releaseDate.localeCompare(b.releaseDate) || byName(a, b);
	});
}

export interface Facets {
	types: Record<ItemType, number>;
	regions: Record<Region, number>;
	/** by genre index */
	genres: number[];
	statuses: Record<StoreStatus, number>;
}

/** Counts per option, applying every filter except the option's own group. */
export function facetCounts(f: Filters, ctx: FilterContext): Facets {
	const query = { tokens: tokenize(f.q), phrase: normalize(f.q) };
	const pass = (skip: FacetGroup) =>
		ctx.catalog.items.filter((item) => matches(item, f, ctx, skip, query));

	const types: Facets['types'] = { game: 0, dlc: 0 };
	for (const item of pass('type')) types[item.kind]++;

	const regions = Object.fromEntries(REGIONS.map((r) => [r, 0])) as Facets['regions'];
	for (const item of pass('region')) {
		for (const region of REGIONS) if ((item.regions & REGION_BIT[region]) !== 0) regions[region]++;
	}

	const genres = new Array<number>(ctx.catalog.genres.length).fill(0);
	for (const item of pass('genre')) for (const g of item.genres) genres[g] = (genres[g] ?? 0) + 1;

	const statuses = Object.fromEntries(STORE_STATUSES.map((s) => [s, 0])) as Facets['statuses'];
	for (const item of pass('status')) statuses[item.status]++;

	return { types, regions, genres, statuses };
}
