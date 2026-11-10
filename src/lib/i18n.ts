// Locale-aware formatting helpers on top of the active Paraglide locale.
import { getLocale } from '#lib/paraglide/runtime.js';

/** BCP 47 tag for number and currency formatting. */
export function numberLocale(): string {
	return getLocale() === 'pl' ? 'pl-PL' : 'en-US';
}

/** BCP 47 tag for dates (day before month in English, to match the design). */
export function dateLocale(): string {
	return getLocale() === 'pl' ? 'pl-PL' : 'en-GB';
}

export function formatNumber(value: number): string {
	return new Intl.NumberFormat(numberLocale()).format(value);
}

export function formatDate(iso: string | null): string | null {
	if (!iso) return null;
	const date = new Date(`${iso}T00:00:00Z`);
	if (Number.isNaN(date.getTime())) return null;
	return new Intl.DateTimeFormat(dateLocale(), { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}

export function releaseYear(iso: string | null): string | null {
	return iso && /^\d{4}/.test(iso) ? iso.slice(0, 4) : null;
}

export function formatList(items: readonly string[]): string {
	return new Intl.ListFormat(numberLocale(), { style: 'short', type: 'conjunction' }).format(items);
}
