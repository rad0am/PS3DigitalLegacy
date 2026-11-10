import {
	SORT_KEYS,
	defaultFilters,
	type Filters,
	type ItemType,
	type SortKey
} from '#lib/data/filter.js';
import { REGIONS, STORE_STATUSES, type Region, type StoreStatus } from '#lib/data/types.js';

function pick<T extends string>(values: string[], allowed: readonly T[]): T[] {
	return allowed.filter((value) => values.includes(value));
}

function number(value: string | null): number | null {
	if (value === null || value.trim() === '') return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/** Catalog filter state. It round-trips through the URL query, so a filtered view can be shared. */
export class FilterState {
	q = $state('');
	types = $state<ItemType[]>([]);
	regions = $state<Region[]>([]);
	genres = $state<string[]>([]);
	statuses = $state<StoreStatus[]>([]);
	digitalOnly = $state(true);
	priceMin = $state<number | null>(null);
	priceMax = $state<number | null>(null);
	sort = $state<SortKey>('name-asc');

	/** types shown by default on this page (all pages share one catalog view) */
	readonly preset: ItemType[];

	constructor(preset: ItemType[]) {
		this.preset = preset;
		this.reset();
	}

	snapshot(): Filters {
		return {
			q: this.q,
			types: this.types,
			regions: this.regions,
			genres: this.genres,
			statuses: this.statuses,
			digitalOnly: this.digitalOnly,
			priceMin: this.priceMin,
			priceMax: this.priceMax,
			sort: this.sort
		};
	}

	/** Back to the page defaults, with every optional filter off. */
	clear(): void {
		const base = defaultFilters(this.preset);
		this.q = base.q;
		this.types = [...base.types];
		this.regions = [];
		this.genres = [];
		this.statuses = [];
		this.digitalOnly = false;
		this.priceMin = null;
		this.priceMax = null;
	}

	/** Page defaults: digital only on. */
	reset(): void {
		this.clear();
		this.digitalOnly = true;
		this.sort = 'name-asc';
	}

	clearPrice(): void {
		this.priceMin = null;
		this.priceMax = null;
	}

	toggle<T extends string>(key: 'types' | 'regions' | 'genres' | 'statuses', value: T): void {
		const current = this[key] as string[];
		const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
		(this[key] as string[]) = next;
	}

	applyUrl(params: URLSearchParams): void {
		this.reset();
		const q = params.get('q');
		if (q) this.q = q.slice(0, 100);
		const types = pick<ItemType>(params.getAll('type'), ['game', 'dlc']);
		if (types.length > 0) this.types = types;
		this.regions = pick<Region>(
			params.getAll('region').map((r) => r.toUpperCase()),
			REGIONS
		);
		this.statuses = pick<StoreStatus>(params.getAll('status'), STORE_STATUSES);
		this.genres = params.getAll('genre');
		if (params.get('digital') === '0') this.digitalOnly = false;
		this.priceMin = number(params.get('pmin'));
		this.priceMax = number(params.get('pmax'));
		const sort = params.get('sort');
		if (sort && (SORT_KEYS as readonly string[]).includes(sort)) this.sort = sort as SortKey;
	}

	/** Only non-default values, so the plain catalog URL stays clean. */
	query(): string {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- builds a string, not reactive state
		const params = new URLSearchParams();
		if (this.q) params.set('q', this.q);
		const sameTypes =
			this.types.length === this.preset.length && this.preset.every((t) => this.types.includes(t));
		if (!sameTypes) for (const type of this.types) params.append('type', type);
		for (const region of this.regions) params.append('region', region);
		for (const genre of this.genres) params.append('genre', genre);
		for (const status of this.statuses) params.append('status', status);
		if (!this.digitalOnly) params.set('digital', '0');
		if (this.priceMin !== null) params.set('pmin', String(this.priceMin));
		if (this.priceMax !== null) params.set('pmax', String(this.priceMax));
		if (this.sort !== 'name-asc') params.set('sort', this.sort);
		return params.toString();
	}
}
