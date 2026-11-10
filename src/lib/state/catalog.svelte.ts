import { resolve } from '$app/paths';
import { buildClientCatalog, type Catalog, type Item } from '#lib/data/catalog.js';
import type { CatalogWire } from '#lib/data/types.js';
import { resolvePrice, type ResolvedPrice } from '#lib/currency/price.js';
import { settings } from './settings.svelte';

type Status = 'idle' | 'loading' | 'ready' | 'error';

/** Loads the catalog index and the per-currency price files on demand. */
class CatalogStore {
	status = $state<Status>('idle');
	catalog = $state.raw<Catalog | null>(null);
	/** loaded price tables by currency, aligned with `catalog.items` */
	tables = $state.raw<Record<string, (number | null)[]>>({});
	#loading = new Set<string>();

	/** true once the selected currency and the USD and EUR fallbacks are loaded */
	get pricesReady(): boolean {
		return [settings.currency, 'USD', 'EUR'].every((currency) => this.tables[currency]);
	}

	async load(): Promise<void> {
		if (this.status === 'loading' || this.status === 'ready') return;
		this.status = 'loading';
		try {
			const response = await fetch(resolve('/data/catalog.json'));
			if (!response.ok) throw new Error(`catalog: ${response.status}`);
			const catalog = buildClientCatalog((await response.json()) as CatalogWire);
			settings.detect(catalog.currencies);
			this.catalog = catalog;
			this.status = 'ready';
		} catch (error) {
			console.error(error);
			this.status = 'error';
		}
	}

	retry(): Promise<void> {
		if (this.status === 'error') this.status = 'idle';
		return this.load();
	}

	async ensurePrices(currency: string): Promise<void> {
		if (this.tables[currency] || this.#loading.has(currency)) return;
		if (this.catalog && !this.catalog.currencies.includes(currency)) return;
		this.#loading.add(currency);
		try {
			const response = await fetch(resolve('/data/prices/[currency].json', { currency }));
			if (!response.ok) throw new Error(`prices ${currency}: ${response.status}`);
			const values = (await response.json()) as (number | null)[];
			this.tables = { ...this.tables, [currency]: values };
		} catch (error) {
			console.error(error);
		} finally {
			this.#loading.delete(currency);
		}
	}

	/** Price of an item in exactly this currency (null while loading or when there is none). */
	priceIn(currency: string, item: Item): number | null {
		return this.tables[currency]?.[item.index] ?? null;
	}

	/** Price to display: selected currency, then USD, then EUR (labeled as a fallback). */
	display(item: Item): ResolvedPrice | null {
		return resolvePrice((currency) => this.priceIn(currency, item), settings.currency);
	}

	/**
	 * Cheapest DLC of a game, for disc games that have no digital price of their own.
	 * Uses the first currency of the fallback chain that has any DLC price.
	 */
	cheapestDlc(game: Item): ResolvedPrice | null {
		const dlc = this.catalog?.dlcOf.get(game.index) ?? [];
		for (const currency of new Set([settings.currency, 'USD', 'EUR'])) {
			const table = this.tables[currency];
			if (!table) continue;
			let min: number | null = null;
			for (const index of dlc) {
				const amount = table[index];
				if (amount !== null && amount !== undefined && (min === null || amount < min)) min = amount;
			}
			if (min !== null) return { amount: min, currency, fallback: currency !== settings.currency };
		}
		return null;
	}
}

export const catalogStore = new CatalogStore();
