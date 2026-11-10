import type { Price } from '#lib/data/types.js';

export interface ResolvedPrice {
	amount: number;
	currency: string;
	/** true when the selected currency had no price and USD or EUR is shown instead */
	fallback: boolean;
}

/** selected -> USD -> EUR (CLAUDE.md, "Currency selection"). Nothing is converted. */
export function resolvePrice(
	lookup: (currency: string) => number | null | undefined,
	selected: string
): ResolvedPrice | null {
	const chain = [...new Set([selected, 'USD', 'EUR'])];
	for (const currency of chain) {
		const amount = lookup(currency);
		if (amount !== null && amount !== undefined) {
			return { amount, currency, fallback: currency !== selected };
		}
	}
	return null;
}

export function lookupInList(prices: readonly Price[]): (currency: string) => number | null {
	return (currency) => prices.find((price) => price.currency === currency)?.amount ?? null;
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(key: string, create: () => Intl.NumberFormat): Intl.NumberFormat {
	let existing = formatters.get(key);
	if (!existing) {
		existing = create();
		formatters.set(key, existing);
	}
	return existing;
}

/**
 * Selected currency: locale-aware currency format ("$29.99", "119,99 zł").
 * Fallback currency: plain number plus the code ("7.99 EUR"), so it is never mistaken for the selected one.
 */
export function formatPrice(price: ResolvedPrice, locale: string): string {
	if (!price.fallback) {
		return formatter(
			`c:${locale}:${price.currency}`,
			() => new Intl.NumberFormat(locale, { style: 'currency', currency: price.currency })
		).format(price.amount);
	}
	const digits = formatter(
		`d:${locale}:${price.currency}`,
		() => new Intl.NumberFormat(locale, { style: 'currency', currency: price.currency })
	).resolvedOptions();
	return `${formatter(
		`n:${locale}:${digits.minimumFractionDigits}:${digits.maximumFractionDigits}`,
		() =>
			new Intl.NumberFormat(locale, {
				minimumFractionDigits: digits.minimumFractionDigits,
				maximumFractionDigits: digits.maximumFractionDigits
			})
	).format(price.amount)} ${price.currency}`;
}

/** Amount in the given currency regardless of fallback, e.g. for the all-currencies table. */
export function formatAmount(amount: number, currency: string, locale: string): string {
	return formatPrice({ amount, currency, fallback: false }, locale);
}

export function currencyName(code: string, locale: string): string {
	try {
		return new Intl.DisplayNames([locale], { type: 'currency' }).of(code) ?? code;
	} catch {
		return code;
	}
}
