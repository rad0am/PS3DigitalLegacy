import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function keys(locale: string): string[] {
	const file = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as Record<
		string,
		unknown
	>;
	return Object.keys(file)
		.filter((key) => !key.startsWith('$'))
		.sort();
}

describe('message catalogs', () => {
	it('have identical key sets in en and pl', () => {
		const en = keys('en');
		const pl = keys('pl');
		expect(
			pl.filter((key) => !en.includes(key)),
			'keys only in pl'
		).toEqual([]);
		expect(
			en.filter((key) => !pl.includes(key)),
			'keys only in en'
		).toEqual([]);
	});
});
