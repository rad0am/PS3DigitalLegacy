import { describe, expect, it } from 'vitest';
import { REGION_CURRENCY, detectCurrency, regionOf } from './region-currency';

const available = ['USD', 'EUR', 'PLN', 'GBP', 'CAD', 'JPY'];

describe('regionOf', () => {
	it('reads the region from a language tag', () => {
		expect(regionOf('pl-PL')).toBe('PL');
		expect(regionOf('en-GB')).toBe('GB');
		expect(regionOf('de-DE')).toBe('DE');
		expect(regionOf('zh-Hant-TW')).toBe('TW');
	});

	it('returns null without a region or for invalid tags', () => {
		expect(regionOf('en')).toBeNull();
		expect(regionOf('pl')).toBeNull();
		expect(regionOf('not a tag!')).toBeNull();
	});
});

describe('REGION_CURRENCY', () => {
	it('maps eurozone countries to EUR', () => {
		for (const region of ['DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'IE', 'FI', 'PT', 'GR', 'HR', 'BG']) {
			expect(REGION_CURRENCY[region]).toBe('EUR');
		}
	});

	it('maps a few well-known regions', () => {
		expect(REGION_CURRENCY.PL).toBe('PLN');
		expect(REGION_CURRENCY.GB).toBe('GBP');
		expect(REGION_CURRENCY.US).toBe('USD');
		expect(REGION_CURRENCY.JP).toBe('JPY');
	});
});

describe('detectCurrency', () => {
	it('maps the first usable language to a currency', () => {
		expect(detectCurrency(['pl-PL', 'en-US'], available)).toBe('PLN');
		expect(detectCurrency(['en-GB'], available)).toBe('GBP');
		expect(detectCurrency(['de-DE'], available)).toBe('EUR');
	});

	it('skips languages without a region or whose currency is not in the data', () => {
		expect(detectCurrency(['en', 'pl-PL'], available)).toBe('PLN');
		expect(detectCurrency(['sv-SE', 'en-CA'], available)).toBe('CAD');
	});

	it('returns null when nothing matches', () => {
		expect(detectCurrency(['en', 'pl'], available)).toBeNull();
		expect(detectCurrency(['xx-ZZ'], available)).toBeNull();
		expect(detectCurrency([], available)).toBeNull();
	});
});
