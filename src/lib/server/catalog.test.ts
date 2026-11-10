import { describe, expect, it } from 'vitest';
import type { RawData } from '#lib/data/types.js';
import { buildCatalog, coverFileName, safePsnUrl, toGameDetail } from './catalog';

const raw: RawData = {
	schemaVersion: '1.0',
	generatedAt: '2026-11-02',
	games: [
		{
			id: 'g1',
			title: 'Puzzle gem',
			regions: ['NA', 'EU'],
			digitalOnly: true,
			storeStatus: 'available',
			prices: [
				{ currency: 'USD', amount: 6.99 },
				{ currency: 'PLN', amount: 24.99 }
			],
			genres: ['Puzzle', 'Indie'],
			coverPhoto: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1abc.jpg',
			trophies: { supported: true, hasPlatinum: true },
			dlc: [
				{ id: 'd1', name: 'Map pack', trophies: null, prices: [{ currency: 'USD', amount: 1.99 }] }
			]
		},
		{
			id: 'g2',
			title: 'Disc game',
			regions: ['JP'],
			digitalOnly: false,
			prices: [],
			genres: ['Puzzle'],
			dlc: [
				{ id: 'd2', name: 'Skin', trophies: 5, prices: [{ currency: 'EUR', amount: 2 }] },
				{ id: 'd3', name: 'Level', prices: [] }
			]
		}
	]
};

describe('buildCatalog', () => {
	const { catalog, prices } = buildCatalog(raw);

	it('lays out games first, then DLC, with parent indexes', () => {
		expect(catalog.games.map((g) => g.id)).toEqual(['g1', 'g2']);
		expect(catalog.dlc.map((d) => [d.id, d.p, d.tr])).toEqual([
			['d1', 0, 0],
			['d2', 1, 5],
			['d3', 1, 0]
		]);
	});

	it('encodes regions, status, digital-only and genres', () => {
		const [g1, g2] = catalog.games;
		expect(g1?.r).toBe(3);
		expect(g1?.s).toBe(0);
		expect(g1?.d).toBe(1);
		expect(g1?.pl).toBe(1);
		expect(g2?.r).toBe(4);
		expect(g2?.s).toBe(2);
		expect(g2?.d).toBe(0);
		expect(g1?.g.map((i) => catalog.genres[i])).toEqual(
			expect.arrayContaining(['Puzzle', 'Indie'])
		);
		// most common genre first
		expect(catalog.genres[0]).toBe('Puzzle');
		expect(g1?.n).toBe(1);
		expect(g2?.n).toBe(2);
		expect(g1?.c).toBe('co1abc.jpg');
	});

	it('derives the currency list from the data and aligns price arrays', () => {
		expect(catalog.currencies).toEqual(['EUR', 'PLN', 'USD']);
		// items: g1, g2, d1, d2, d3
		expect(prices.get('USD')).toEqual([6.99, null, 1.99, null, null]);
		expect(prices.get('EUR')).toEqual([null, null, null, 2, null]);
		expect(prices.get('PLN')).toEqual([24.99, null, null, null, null]);
	});
});

describe('url validation', () => {
	it('accepts only psnprofiles.com links', () => {
		expect(safePsnUrl('https://psnprofiles.com/trophies/1-x')).toBe(
			'https://psnprofiles.com/trophies/1-x'
		);
		expect(safePsnUrl('https://evil.example/psnprofiles.com')).toBeNull();
		expect(safePsnUrl('http://psnprofiles.com/x')).toBeNull();
		expect(safePsnUrl('javascript:alert(1)')).toBeNull();
		expect(safePsnUrl(null)).toBeNull();
	});

	it('extracts the IGDB cover file name', () => {
		expect(coverFileName('https://images.igdb.com/igdb/image/upload/t_cover_big/abc123.jpg')).toBe(
			'abc123.jpg'
		);
		expect(coverFileName('https://example.com/a.jpg')).toBeNull();
		expect(coverFileName(undefined)).toBeNull();
	});
});

describe('toGameDetail', () => {
	it('fills defaults and drops non-IGDB screenshots', () => {
		const detail = toGameDetail({
			id: 'x',
			title: 'X',
			screenshots: ['https://images.igdb.com/a.jpg', 'https://evil.example/b.jpg']
		});
		expect(detail.platform).toBe('PS3');
		expect(detail.digitalOnly).toBe(true);
		expect(detail.storeStatus).toBe('unknown');
		expect(detail.screenshots).toEqual(['https://images.igdb.com/a.jpg']);
		expect(detail.dlc).toEqual([]);
	});
});
