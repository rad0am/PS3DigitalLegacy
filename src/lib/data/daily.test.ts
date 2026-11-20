import { describe, expect, it } from 'vitest';
import { daySeed, pickDaily, pickDailyBalanced } from './daily';

const ids = Array.from({ length: 100 }, (_, i) => `id-${String(i).padStart(3, '0')}`);
const pick = (list: string[], seed: number, salt = 1, count = 6) =>
	pickDaily(list, (id) => id, count, seed, salt);

describe('daySeed', () => {
	it('uses the UTC date', () => {
		expect(daySeed(new Date('2026-11-12T23:30:00Z'))).toBe(20261112);
		expect(daySeed(new Date('2026-01-05T00:00:00Z'))).toBe(20260105);
	});
});

describe('pickDaily', () => {
	it('is stable for the same day and independent of the input order', () => {
		expect(pick(ids, 20261112)).toEqual(pick([...ids].reverse(), 20261112));
	});

	it('changes from one day to the next', () => {
		expect(pick(ids, 20261112)).not.toEqual(pick(ids, 20261113));
	});

	it('differs between sections of the same day', () => {
		expect(pick(ids, 20261112, 1)).not.toEqual(pick(ids, 20261112, 2));
	});

	it('returns distinct entries and handles short lists', () => {
		const result = pick(ids, 20261112, 1, 10);
		expect(new Set(result).size).toBe(10);
		expect(pick(['a', 'b'], 1)).toHaveLength(2);
		expect(pick([], 1)).toEqual([]);
	});
});

describe('pickDailyBalanced', () => {
	const items = [
		...Array.from({ length: 10 }, (_, i) => ({ id: `a${i}`, p: 'PS3' })),
		...Array.from({ length: 10 }, (_, i) => ({ id: `b${i}`, p: 'PS VITA' }))
	];
	const run = (pool = items, count = 6) =>
		pickDailyBalanced(
			pool,
			(x) => x.id,
			(x) => x.p,
			['PS3', 'PS VITA'],
			count,
			20261112,
			2
		);

	it('gives every platform an equal share, alternating', () => {
		const picks = run();
		expect(picks).toHaveLength(6);
		expect(picks.map((x) => x.p)).toEqual(['PS3', 'PS VITA', 'PS3', 'PS VITA', 'PS3', 'PS VITA']);
		expect(new Set(picks.map((x) => x.id)).size).toBe(6);
	});

	it('does not depend on the input order', () => {
		expect(run([...items].reverse())).toEqual(run());
	});

	it('hands unused slots to the other platform', () => {
		const pool = [...items.filter((x) => x.p === 'PS3'), items[10]!];
		const picks = run(pool);
		expect(picks).toHaveLength(6);
		expect(picks.filter((x) => x.p === 'PS VITA')).toHaveLength(1);
	});
});
