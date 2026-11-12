import { describe, expect, it } from 'vitest';
import { daySeed, pickDaily } from './daily';

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
