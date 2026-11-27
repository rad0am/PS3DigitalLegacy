import { describe, expect, it } from 'vitest';
import {
	WEB_CLIENT_ID,
	basketOptions,
	basketUrl,
	clientIdFrom,
	isStoreKey,
	storeKeyForCurrency
} from './store.js';

describe('storeKeyForCurrency', () => {
	it('maps currencies to the catalog of their store', () => {
		expect(storeKeyForCurrency('USD')).toBe('NA');
		expect(storeKeyForCurrency('PLN')).toBe('EU');
		expect(storeKeyForCurrency('JPY')).toBe('JP');
		expect(storeKeyForCurrency('KRW')).toBe('KRW');
		expect(storeKeyForCurrency('XYZ')).toBeNull();
	});
});

describe('basketUrl', () => {
	it('builds the same link the store website uses', () => {
		expect(basketUrl('EP9000-NPEA00445_00-GOWADIGITALVERS1-E002')).toBe(
			`https://checkout.playstation.com/add/EP9000-NPEA00445_00-GOWADIGITALVERS1-E002?clientId=${WEB_CLIENT_ID}`
		);
	});
	it('encodes the parts', () => {
		expect(basketUrl('a b', 'c&d')).toBe(
			'https://checkout.playstation.com/add/a%20b?clientId=c%26d'
		);
	});
});

describe('clientIdFrom', () => {
	it('uses the default and ignores malformed values', () => {
		expect(clientIdFrom('')).toBe(WEB_CLIENT_ID);
		expect(clientIdFrom('?clientid=a%26b')).toBe(WEB_CLIENT_ID);
		expect(clientIdFrom('?clientid=another-client-id')).toBe('another-client-id');
	});
});

describe('basketOptions', () => {
	const skus = { EU: 'EU-SKU-0001', NA: 'NA-SKU-0001', KRW: 'KR-SKU-0001' };
	it('puts the store of the selected currency first', () => {
		expect(basketOptions(skus, 'PLN').map((o) => o.store)).toEqual(['EU', 'NA', 'KRW']);
		expect(basketOptions(skus, 'KRW').map((o) => o.store)).toEqual(['KRW', 'NA', 'EU']);
	});
	it('is empty without SKUs', () => {
		expect(basketOptions({}, 'USD')).toEqual([]);
	});
});

describe('isStoreKey', () => {
	it('accepts only known keys', () => {
		expect(isStoreKey('NA')).toBe(true);
		expect(isStoreKey('KRW')).toBe(true);
		expect(isStoreKey('__proto__')).toBe(false);
	});
});
