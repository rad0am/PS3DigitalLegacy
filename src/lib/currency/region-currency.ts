// Browsers expose no currency API, so the default currency comes from the region of the
// browser language (e.g. `pl-PL` -> PL -> PLN) through this static table.

const EUR_REGIONS = [
	'AD',
	'AT',
	'BE',
	'BG',
	'CY',
	'DE',
	'EE',
	'ES',
	'FI',
	'FR',
	'GR',
	'HR',
	'IE',
	'IT',
	'LT',
	'LU',
	'LV',
	'MC',
	'ME',
	'MT',
	'NL',
	'PT',
	'SI',
	'SK',
	'SM',
	'VA',
	'XK'
];

const OTHER: Record<string, string> = {
	AE: 'AED',
	AR: 'ARS',
	AU: 'AUD',
	BR: 'BRL',
	CA: 'CAD',
	CH: 'CHF',
	CL: 'CLP',
	CN: 'CNY',
	CO: 'COP',
	CZ: 'CZK',
	DK: 'DKK',
	GB: 'GBP',
	HK: 'HKD',
	HN: 'HNL',
	HU: 'HUF',
	ID: 'IDR',
	IL: 'ILS',
	IN: 'INR',
	JP: 'JPY',
	KR: 'KRW',
	LI: 'CHF',
	MX: 'MXN',
	MY: 'MYR',
	NO: 'NOK',
	NZ: 'NZD',
	PH: 'PHP',
	PL: 'PLN',
	RO: 'RON',
	RU: 'RUB',
	SA: 'SAR',
	SE: 'SEK',
	SG: 'SGD',
	TH: 'THB',
	TR: 'TRY',
	TW: 'TWD',
	UA: 'UAH',
	US: 'USD',
	ZA: 'ZAR'
};

export const REGION_CURRENCY: Readonly<Record<string, string>> = {
	...OTHER,
	...Object.fromEntries(EUR_REGIONS.map((region) => [region, 'EUR']))
};

export const FALLBACK_CURRENCY = 'USD';

/** Region part of a BCP 47 tag (`pl-PL` -> `PL`), or null when the tag has none. */
export function regionOf(tag: string): string | null {
	try {
		return new Intl.Locale(tag).region ?? null;
	} catch {
		return null;
	}
}

/**
 * First language in the list whose region maps to a currency that exists in the data.
 * Returns null when nothing matches (the caller then falls back to USD).
 */
export function detectCurrency(
	languages: readonly string[],
	available: readonly string[]
): string | null {
	for (const tag of languages) {
		const region = regionOf(tag);
		const currency = region ? REGION_CURRENCY[region] : undefined;
		if (currency && available.includes(currency)) return currency;
	}
	return null;
}
