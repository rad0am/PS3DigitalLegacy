import { describe, expect, it } from 'vitest';
import { matchScore, normalize, tokenize } from './search';

describe('normalize', () => {
	it('ignores case, diacritics, marks and punctuation', () => {
		expect(normalize('Pokémon™ Żółć')).toBe('pokemon zolc');
		expect(normalize("Assassin's Creed® III")).toBe('assassins creed iii');
		expect(normalize('  Ratchet &   Clank: Future  ')).toBe('ratchet clank future');
	});
});

describe('tokenize', () => {
	it('splits into normalized words', () => {
		expect(tokenize('Puzzle  GEM')).toEqual(['puzzle', 'gem']);
		expect(tokenize('   ')).toEqual([]);
	});
});

describe('matchScore', () => {
	const title = normalize('Puzzle gem');
	const haystack = normalize('Puzzle gem Gem Works');

	it('requires every word to be present', () => {
		expect(matchScore(haystack, title, ['puzzle', 'works'], 'puzzle works')).toBe(1);
		expect(matchScore(haystack, title, ['puzzle', 'racing'], 'puzzle racing')).toBe(0);
	});

	it('ranks prefix matches above word and substring matches', () => {
		expect(matchScore(haystack, title, ['puzzle'], 'puzzle')).toBe(3);
		expect(matchScore(haystack, title, ['gem'], 'gem')).toBe(2);
		expect(matchScore(haystack, title, ['uzz'], 'uzz')).toBe(1);
	});

	it('matches everything for an empty query', () => {
		expect(matchScore(haystack, title, [], '')).toBe(1);
	});
});
