import { describe, expect, it } from 'vitest';
import {
	mergeLists,
	parseImport,
	pruneTombstones,
	sanitizeList,
	serializeList,
	type ListMap
} from './list-merge';

const e = (status: 'wishlist' | 'bought' | 'none', updatedAt: number) => ({ status, updatedAt });

describe('mergeLists', () => {
	it('keeps the union of both sides', () => {
		const result = mergeLists({ a: e('wishlist', 1) }, { b: e('bought', 2) });
		expect(result.merged).toEqual({ a: e('wishlist', 1), b: e('bought', 2) });
		expect(result.conflicts).toBe(0);
		expect(result.changesLocal).toBe(true);
		expect(result.changesRemote).toBe(true);
	});

	it('lets the newer updatedAt win per game and counts conflicts', () => {
		const local: ListMap = { a: e('wishlist', 5), b: e('bought', 1) };
		const remote: ListMap = { a: e('bought', 3), b: e('wishlist', 9) };
		const result = mergeLists(local, remote);
		expect(result.merged).toEqual({ a: e('wishlist', 5), b: e('wishlist', 9) });
		expect(result.conflicts).toBe(2);
	});

	it('does not resurrect a game removed on the newer side', () => {
		const result = mergeLists({ a: e('none', 10) }, { a: e('wishlist', 5) });
		expect(result.merged.a).toEqual(e('none', 10));
	});

	it('reports no changes when both sides are equal', () => {
		const list: ListMap = { a: e('bought', 1) };
		const result = mergeLists(list, { ...list });
		expect(result.changesLocal).toBe(false);
		expect(result.changesRemote).toBe(false);
		expect(result.conflicts).toBe(0);
	});

	it('breaks timestamp ties deterministically', () => {
		const one = mergeLists({ a: e('wishlist', 1) }, { a: e('bought', 1) });
		const two = mergeLists({ a: e('bought', 1) }, { a: e('wishlist', 1) });
		expect(one.merged.a?.status).toBe('bought');
		expect(two.merged.a?.status).toBe('bought');
	});

	it('never mutates its inputs', () => {
		const local: ListMap = { a: e('wishlist', 1) };
		const remote: ListMap = { a: e('bought', 2) };
		mergeLists(local, remote);
		expect(local).toEqual({ a: e('wishlist', 1) });
		expect(remote).toEqual({ a: e('bought', 2) });
	});
});

describe('pruneTombstones', () => {
	it('removes only old tombstones', () => {
		const list: ListMap = {
			old: e('none', 0),
			fresh: e('none', 95),
			kept: e('bought', 0)
		};
		expect(pruneTombstones(list, 100, 10)).toEqual({ fresh: e('none', 95), kept: e('bought', 0) });
	});
});

describe('sanitizeList', () => {
	it('drops malformed entries', () => {
		expect(
			sanitizeList({
				ok: { status: 'bought', updatedAt: 1, extra: true },
				badStatus: { status: 'x', updatedAt: 1 },
				badTime: { status: 'bought', updatedAt: 'now' },
				nope: 5
			})
		).toEqual({ ok: e('bought', 1) });
		expect(sanitizeList(null)).toEqual({});
		expect(sanitizeList([1, 2])).toEqual({});
	});
});

describe('export and import', () => {
	it('round-trips without tombstones', () => {
		const list: ListMap = { a: e('wishlist', 1), b: e('none', 2), c: e('bought', 3) };
		const parsed = parseImport(serializeList(list, 123));
		expect(parsed).toEqual({ a: e('wishlist', 1), c: e('bought', 3) });
	});

	it('accepts a bare map and rejects garbage', () => {
		expect(parseImport(JSON.stringify({ a: e('bought', 1) }))).toEqual({ a: e('bought', 1) });
		expect(parseImport('not json')).toBeNull();
		expect(parseImport('[]')).toBeNull();
		expect(parseImport(JSON.stringify({ x: 1 }))).toBeNull();
	});
});
