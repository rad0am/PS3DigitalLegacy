// Text search helpers: case, diacritics and punctuation are ignored (so "pokemon" finds "Pokémon",
// "assassins creed" finds "Assassin's Creed®").

export function normalize(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{M}+/gu, '')
		.replace(/ł/g, 'l')
		.replace(/ø/g, 'o')
		.replace(/ß/g, 'ss')
		.replace(/['’`]/g, '')
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();
}

export function tokenize(query: string): string[] {
	const normalized = normalize(query);
	return normalized ? normalized.split(' ') : [];
}

/**
 * 0 means no match. Higher is better: the title starts with the query (3), a title word starts
 * with it (2), anything else that contains every word (1).
 */
export function matchScore(
	haystack: string,
	title: string,
	tokens: readonly string[],
	phrase: string
): number {
	if (tokens.length === 0) return 1;
	for (const token of tokens) {
		if (!haystack.includes(token)) return 0;
	}
	if (title.startsWith(phrase)) return 3;
	if (title.includes(` ${phrase}`)) return 2;
	return 1;
}
