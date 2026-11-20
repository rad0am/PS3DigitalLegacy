import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Catalog = Record<string, unknown>;

const settings = JSON.parse(readFileSync('project.inlang/settings.json', 'utf8')) as {
	baseLocale: string;
	locales: string[];
};

function load(locale: string): Catalog {
	return JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as Catalog;
}

function keys(catalog: Catalog): string[] {
	return Object.keys(catalog)
		.filter((key) => !key.startsWith('$'))
		.sort();
}

/** All `{name}` placeholders used by a message (plain string or plural variants). */
function placeholders(value: unknown): string[] {
	const text = JSON.stringify(value);
	const found = new Set<string>();
	for (const match of text.matchAll(/\{(\w+)\}/g)) found.add(match[1] ?? '');
	return [...found].sort();
}

const base = load(settings.baseLocale);

describe('message catalogs', () => {
	it('has a message file for every configured locale', () => {
		for (const locale of settings.locales) {
			expect(existsSync(`messages/${locale}.json`), `messages/${locale}.json`).toBe(true);
		}
	});

	for (const locale of settings.locales.filter((l) => l !== settings.baseLocale)) {
		describe(locale, () => {
			const catalog = load(locale);

			it('has the same keys as the base locale', () => {
				const expected = keys(base);
				const actual = keys(catalog);
				expect(
					actual.filter((key) => !expected.includes(key)),
					`keys only in ${locale}`
				).toEqual([]);
				expect(
					expected.filter((key) => !actual.includes(key)),
					`keys missing in ${locale}`
				).toEqual([]);
			});

			it('uses the same placeholders as the base locale', () => {
				const mismatched = keys(base).filter(
					(key) =>
						key in catalog &&
						JSON.stringify(placeholders(catalog[key])) !== JSON.stringify(placeholders(base[key]))
				);
				expect(mismatched, 'keys with different placeholders').toEqual([]);
			});
		});
	}
});
