// "Picks of the day": the same random-looking selection for everyone, changing once a day.
// No server is involved: the day (UTC) seeds a shuffle of a fixed candidate list.

/** Day number in UTC, e.g. 20261112. */
export function daySeed(date: Date = new Date()): number {
	return date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
}

/** Small deterministic PRNG (mulberry32). */
function random(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Picks `count` distinct entries. The input is sorted by key first, so the result depends only on
 * the set of candidates, the seed and the salt, never on the input order. Use a different salt per
 * section so two sections of the same day do not show the same games.
 */
export function pickDaily<T>(
	candidates: readonly T[],
	key: (value: T) => string,
	count: number,
	seed: number,
	salt: number
): T[] {
	const pool = [...candidates].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
	const next = random(seed * 31 + salt);
	for (let i = pool.length - 1; i > 0; i--) {
		const j = Math.floor(next() * (i + 1));
		[pool[i], pool[j]] = [pool[j]!, pool[i]!];
	}
	return pool.slice(0, count);
}
