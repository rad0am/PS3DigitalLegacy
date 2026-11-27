// Shared helpers for the PlayStation Store crawl scripts (unofficial API used by the store website).

export interface Sku {
	id: string;
	price?: number;
	display_price?: string;
}
export interface Link {
	id: string;
	name: string;
	title_name?: string;
	/** platforms the product can be played on, e.g. `PS3™`, `PS Vita`, `PS4™` */
	playable_platform?: string[];
	top_category?: string;
	default_sku?: Sku;
}

export const API = 'https://commerce1.api.np.km.playstation.net/store/api/chihiro/00_09_000';

/** `playable_platform` label per platform; a search also returns PS4-only listings, which must not match. */
export const PLATFORM_LABEL: Record<string, string> = { PS3: 'PS3™', 'PS VITA': 'PS Vita' };

export const PLATFORM_PARAM: Record<string, string> = { PS3: 'ps3', 'PS VITA': 'vita' };
export const GAME_CATEGORIES = new Set([
	'downloadable_game',
	'disc_based_game',
	'full_game',
	'psn_game',
	'bundle'
]);

// ---- HTTP ----

let lastRequest = 0;
const MIN_GAP_MS = 60;

export async function sleep(ms: number): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getJson(url: string): Promise<{ links?: Link[]; default_sku?: Sku } | null> {
	for (let attempt = 0; attempt < 5; attempt++) {
		const wait = lastRequest + MIN_GAP_MS - Date.now();
		lastRequest = Math.max(Date.now(), lastRequest + MIN_GAP_MS);
		if (wait > 0) await sleep(wait);
		try {
			const response = await fetch(url, {
				headers: { 'User-Agent': 'ps3-digital-legacy-data-script' }
			});
			if (response.status === 404) return null;
			if (response.ok) return await response.json();
			if (response.status !== 429 && response.status < 500) return null;
		} catch {
			// network error: retry below
		}
		await sleep(1000 * 2 ** attempt);
	}
	throw new Error(`Giving up on ${url}`);
}

export function normalize(text: string): string {
	// Marks first: NFKD would turn the trademark sign into the letters "TM".
	return text
		.replace(/[™®©]/g, '')
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/&/g, ' and ')
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();
}

export async function search(store: string, title: string, platform: string): Promise<Link[]> {
	const url = `${API}/search/${store}/19/${encodeURIComponent(title)}?platform=${PLATFORM_PARAM[platform]}&size=20`;
	const json = await getJson(url);
	return json?.links ?? [];
}

/**
 * Price in major units. The API gives `price` in minor units (999 = 9.99) but not every currency uses two decimals
 * (INR comes as 900 for "Rs 900"), so cross-check against the formatted `display_price`.
 */
export function amountFrom(price: unknown, display: unknown): number | null {
	if (typeof price !== 'number') return null;
	if (price === 0) return 0;
	const text = String(display ?? '');
	if (/[.,]\d{2}(?!\d)\D*$/.test(text)) return price / 100;
	const digits = Number(text.replace(/\D/g, ''));
	if (digits && digits * 100 === price) return price / 100;
	if (digits && digits === price) return price;
	return price / 100;
}

export function priceOf(container: { default_sku?: Sku } | null): number | null {
	const sku = container?.default_sku;
	if (!sku || typeof sku.price !== 'number') return null;
	return amountFrom(sku.price, sku.display_price);
}
