// PlayStation Store SKUs and "Add to Basket" links (see "About" and CLAUDE.md, "Add to Basket").
//
// The store has separate catalogs per store region. A SKU found in one catalog is valid in every store that shares it,
// so `storeSkus` in the data has one entry per catalog: `NA` (US and Latin America), `EU` (Europe, Oceania, Africa and
// part of Asia), `JP`, and a currency code for stores with a catalog of their own (KRW, HKD, SGD, ...).

export const SHARED_CATALOGS = {
	NA: ['USD', 'CAD', 'BRL', 'MXN', 'HNL'],
	EU: [
		'GBP',
		'EUR',
		'PLN',
		'AUD',
		'CHF',
		'CZK',
		'DKK',
		'HUF',
		'ILS',
		'INR',
		'NOK',
		'NZD',
		'RON',
		'RUB',
		'SEK',
		'TRY',
		'UAH',
		'ZAR'
	]
} as const;

/** Currencies of stores with their own catalog; `JPY` is the `JP` entry. */
export const OWN_CATALOG_CURRENCIES = [
	'KRW',
	'HKD',
	'SGD',
	'TWD',
	'THB',
	'MYR',
	'IDR',
	'AED',
	'SAR'
] as const;

const STORE_KEYS: ReadonlySet<string> = new Set(['NA', 'EU', 'JP', ...OWN_CATALOG_CURRENCIES]);

export function isStoreKey(key: string): boolean {
	return STORE_KEYS.has(key);
}

/** Store key for a displayed currency, or null when the store of that currency is unknown. */
export function storeKeyForCurrency(currency: string): string | null {
	if (currency === 'JPY') return 'JP';
	if ((OWN_CATALOG_CURRENCIES as readonly string[]).includes(currency)) return currency;
	for (const [key, currencies] of Object.entries(SHARED_CATALOGS)) {
		if ((currencies as readonly string[]).includes(currency)) return key;
	}
	return null;
}

/** The same client id the PlayStation Store website uses when it adds an item to the basket. */
export const WEB_CLIENT_ID = '2eb25762-877f-4140-b341-7c7e14c19f98';

const CLIENT_ID_RE = /^[A-Za-z0-9-]{8,64}$/;

/** `?clientid=` can override the default client id; anything that is not a plain id is ignored. */
export function clientIdFrom(search: string): string {
	const value = new URLSearchParams(search).get('clientid');
	return value && CLIENT_ID_RE.test(value) ? value : WEB_CLIENT_ID;
}

export function basketUrl(sku: string, clientId: string = WEB_CLIENT_ID): string {
	return `https://checkout.playstation.com/add/${encodeURIComponent(sku)}?clientId=${encodeURIComponent(clientId)}`;
}

export interface BasketOption {
	/** store key: `NA`, `EU`, `JP` or a currency code */
	store: string;
	sku: string;
}

const STORE_ORDER = ['NA', 'EU', 'JP', ...OWN_CATALOG_CURRENCIES];

/** All stores that have a SKU for the game; the store of the selected currency comes first. */
export function basketOptions(
	storeSkus: Readonly<Record<string, string>>,
	currency: string
): BasketOption[] {
	const preferred = storeKeyForCurrency(currency);
	const keys = STORE_ORDER.filter((key) => key in storeSkus);
	keys.sort((a, b) => Number(b === preferred) - Number(a === preferred));
	return keys.flatMap((store) => {
		const sku = storeSkus[store];
		return sku ? [{ store, sku }] : [];
	});
}
