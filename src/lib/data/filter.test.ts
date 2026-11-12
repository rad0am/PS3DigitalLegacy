import { describe, expect, it } from 'vitest';
import { buildCatalog } from '#lib/server/catalog.js';
import type { RawData } from './types';
import { buildClientCatalog } from './catalog';
import { defaultFilters, facetCounts, filterItems, sortItems, type FilterContext } from './filter';

const raw: RawData = {
	schemaVersion: '1.0',
	generatedAt: '2026-11-02',
	games: [
		{
			id: 'g1',
			title: 'Puzzle Gem',
			regions: ['NA', 'EU'],
			digitalOnly: true,
			storeStatus: 'available',
			genres: ['Puzzle'],
			trophies: { supported: true, hasPlatinum: true },
			releaseDate: '2008-10-14',
			prices: [{ currency: 'USD', amount: 6.99 }],
			dlc: [{ id: 'd1', name: 'Map pack', prices: [{ currency: 'USD', amount: 1.99 }] }]
		},
		{
			id: 'g2',
			title: 'Racing Disc',
			regions: ['EU'],
			digitalOnly: false,
			storeStatus: 'delisted',
			genres: ['Racing'],
			releaseDate: '2010-01-01',
			prices: [],
			dlc: [{ id: 'd2', name: 'Extra cars', prices: [{ currency: 'USD', amount: 3 }] }]
		},
		{
			id: 'g3',
			title: 'Pokémon Indie',
			regions: ['JP'],
			digitalOnly: true,
			storeStatus: 'unknown',
			genres: ['Indie', 'Puzzle'],
			alternativeNames: ['Pocket Monsters'],
			trophies: { supported: true, hasPlatinum: false },
			releaseDate: null,
			prices: [{ currency: 'USD', amount: 20 }],
			dlc: []
		}
	]
};

const { catalog: wire, prices } = buildCatalog(raw);
const catalog = buildClientCatalog(wire);
const usd = prices.get('USD')!;
const ctx: FilterContext = { catalog, price: (item) => usd[item.index] ?? null };
const titles = (list: { title: string }[]) => list.map((i) => i.title);

describe('filterItems', () => {
	it('hides disc games with digital only on, but keeps their DLC', () => {
		const result = filterItems(defaultFilters(), ctx);
		expect(titles(result)).toEqual(['Puzzle Gem', 'Pokémon Indie', 'Map pack', 'Extra cars']);
	});

	it('shows disc games when digital only is off', () => {
		const result = filterItems({ ...defaultFilters(), digitalOnly: false, types: ['game'] }, ctx);
		expect(titles(result)).toEqual(['Puzzle Gem', 'Racing Disc', 'Pokémon Indie']);
	});

	it('filters by platinum and by trophies', () => {
		const base = { ...defaultFilters(['game']), digitalOnly: false };
		expect(titles(filterItems({ ...base, platinum: true }, ctx))).toEqual(['Puzzle Gem']);
		expect(titles(filterItems({ ...base, trophies: true }, ctx))).toEqual([
			'Puzzle Gem',
			'Pokémon Indie'
		]);
	});

	it('lets DLC inherit region, genre and status from its parent', () => {
		const f = {
			...defaultFilters(['dlc']),
			regions: ['EU' as const],
			statuses: ['delisted' as const]
		};
		expect(titles(filterItems(f, ctx))).toEqual(['Extra cars']);
		const g = { ...defaultFilters(['dlc']), genres: ['Puzzle'] };
		expect(titles(filterItems(g, ctx))).toEqual(['Map pack']);
	});

	it('searches titles, alternative names and ignores diacritics', () => {
		expect(titles(filterItems({ ...defaultFilters(['game']), q: 'pokemon' }, ctx))).toEqual([
			'Pokémon Indie'
		]);
		expect(titles(filterItems({ ...defaultFilters(['game']), q: 'pocket' }, ctx))).toEqual([
			'Pokémon Indie'
		]);
		expect(titles(filterItems({ ...defaultFilters(['game']), q: 'zzz' }, ctx))).toEqual([]);
	});

	it('filters by price in the selected currency and drops unpriced items', () => {
		const f = { ...defaultFilters(['game']), priceMin: 5, priceMax: 10 };
		expect(titles(filterItems(f, ctx))).toEqual(['Puzzle Gem']);
		const g = { ...defaultFilters(['game']), digitalOnly: false, priceMax: 100 };
		expect(titles(filterItems(g, ctx))).toEqual(['Puzzle Gem', 'Pokémon Indie']);
	});
});

describe('sortItems', () => {
	const games = filterItems({ ...defaultFilters(['game']), digitalOnly: false }, ctx);

	it('sorts by name', () => {
		expect(titles(sortItems(games, 'name-asc', ctx, 'en'))).toEqual([
			'Pokémon Indie',
			'Puzzle Gem',
			'Racing Disc'
		]);
		expect(titles(sortItems(games, 'name-desc', ctx, 'en'))).toEqual([
			'Racing Disc',
			'Puzzle Gem',
			'Pokémon Indie'
		]);
	});

	it('sorts by price with missing prices last in both directions', () => {
		expect(titles(sortItems(games, 'price-asc', ctx, 'en'))).toEqual([
			'Puzzle Gem',
			'Pokémon Indie',
			'Racing Disc'
		]);
		expect(titles(sortItems(games, 'price-desc', ctx, 'en'))).toEqual([
			'Pokémon Indie',
			'Puzzle Gem',
			'Racing Disc'
		]);
	});

	it('sorts by release date with missing dates last', () => {
		expect(titles(sortItems(games, 'date-desc', ctx, 'en'))).toEqual([
			'Racing Disc',
			'Puzzle Gem',
			'Pokémon Indie'
		]);
		expect(titles(sortItems(games, 'date-asc', ctx, 'en'))).toEqual([
			'Puzzle Gem',
			'Racing Disc',
			'Pokémon Indie'
		]);
	});

	it('does not mutate the input', () => {
		const copy = [...games];
		sortItems(games, 'name-desc', ctx, 'en');
		expect(games).toEqual(copy);
	});
});

describe('facetCounts', () => {
	it('counts each group ignoring its own filter', () => {
		const f = { ...defaultFilters(['game']), regions: ['JP' as const] };
		const facets = facetCounts(f, ctx);
		// regions ignore the region filter itself: NA 1 (Puzzle), EU 1, JP 1
		expect(facets.regions).toEqual({ NA: 1, EU: 1, JP: 1 });
		// types ignore the type filter: JP game + no JP DLC
		expect(facets.types).toEqual({ game: 1, dlc: 0 });
		expect(facets.statuses).toEqual({ available: 0, delisted: 0, unknown: 1 });
	});

	it('counts genres by index', () => {
		const facets = facetCounts(defaultFilters(['game']), ctx);
		const puzzle = catalog.genres.indexOf('Puzzle');
		expect(facets.genres[puzzle]).toBe(2);
	});
});
