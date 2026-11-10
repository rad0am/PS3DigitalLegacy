import { describe, expect, it } from 'vitest';
import { formatPrice, lookupInList, resolvePrice } from './price';

describe('resolvePrice', () => {
	const table = (prices: Record<string, number>) => (c: string) => prices[c] ?? null;

	it('uses the selected currency first', () => {
		expect(resolvePrice(table({ PLN: 24.99, USD: 6.99 }), 'PLN')).toEqual({
			amount: 24.99,
			currency: 'PLN',
			fallback: false
		});
	});

	it('falls back to USD, then EUR, and flags the fallback', () => {
		expect(resolvePrice(table({ USD: 19.99, EUR: 17 }), 'PLN')).toEqual({
			amount: 19.99,
			currency: 'USD',
			fallback: true
		});
		expect(resolvePrice(table({ EUR: 7.99 }), 'PLN')).toEqual({
			amount: 7.99,
			currency: 'EUR',
			fallback: true
		});
	});

	it('is not a fallback when USD is the selected currency', () => {
		expect(resolvePrice(table({ USD: 5 }), 'USD')?.fallback).toBe(false);
	});

	it('returns null when no price exists in the chain', () => {
		expect(resolvePrice(table({ GBP: 3 }), 'PLN')).toBeNull();
		expect(resolvePrice(table({}), 'USD')).toBeNull();
	});

	it('does not treat a zero price as missing', () => {
		expect(resolvePrice(table({ USD: 0 }), 'USD')?.amount).toBe(0);
	});
});

describe('lookupInList', () => {
	it('finds amounts by currency', () => {
		const lookup = lookupInList([{ currency: 'USD', amount: 1.5 }]);
		expect(lookup('USD')).toBe(1.5);
		expect(lookup('EUR')).toBeNull();
	});
});

describe('formatPrice', () => {
	it('formats the selected currency with the locale', () => {
		expect(formatPrice({ amount: 29.99, currency: 'USD', fallback: false }, 'en-US')).toBe(
			'$29.99'
		);
	});

	it('labels a fallback currency with its code', () => {
		expect(formatPrice({ amount: 7.99, currency: 'EUR', fallback: true }, 'en-US')).toBe(
			'7.99 EUR'
		);
		expect(formatPrice({ amount: 19.99, currency: 'USD', fallback: true }, 'en-US')).toBe(
			'19.99 USD'
		);
	});

	it('respects zero-decimal currencies', () => {
		expect(formatPrice({ amount: 1200, currency: 'JPY', fallback: true }, 'en-US')).toBe(
			'1,200 JPY'
		);
	});
});
