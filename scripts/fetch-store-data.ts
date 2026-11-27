// Crawls PlayStation Store prices and SKUs for the games in data/*.json and writes them to a results file.
// It never touches data/*.json; `scripts/apply-store-data.ts` merges the results afterwards.
//
// Usage: node scripts/fetch-store-data.ts --platform ps3|psvita [--limit N] [--offset N] [--out file]
//
// The store API is the same unofficial one the PlayStation Store website uses. Be polite: low concurrency, retries
// with backoff, and a resumable results file (games already in the file are skipped).

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import {
	API,
	GAME_CATEGORIES,
	PLATFORM_LABEL,
	getJson,
	normalize,
	priceOf,
	search,
	type Link
} from './store-api.ts';

interface InputGame {
	id: string;
	title: string;
	platform: 'PS3' | 'PS VITA';
	alternativeNames?: string[];
	regions?: string[];
}
interface CrawlResult {
	title: string;
	/** SKU per catalog: NA, EU, JP */
	skus: Record<string, string>;
	/** price per currency, major units */
	prices: Record<string, number>;
	/** product ids when one title matched several different products */
	ambiguous: Record<string, string[]>;
	/** SKU per currency for stores with their own catalog */
	own: Record<string, string>;
}
interface Results {
	games: Record<string, CrawlResult>;
}

/**
 * Stores that share one product catalog: a product id found in the first (search) store is valid in all of them,
 * so one `container` request per country gives that country's price.
 */
const FAMILIES: Record<string, { search: string; stores: Record<string, string> }> = {
	NA: {
		search: 'US/en',
		stores: { USD: 'US/en', CAD: 'CA/en', BRL: 'BR/pt', MXN: 'MX/es', HNL: 'HN/es' }
	},
	EU: {
		search: 'GB/en',
		stores: {
			GBP: 'GB/en',
			EUR: 'DE/de',
			PLN: 'PL/pl',
			AUD: 'AU/en',
			CHF: 'CH/de',
			CZK: 'CZ/en',
			DKK: 'DK/da',
			HUF: 'HU/en',
			ILS: 'IL/en',
			INR: 'IN/en',
			NOK: 'NO/en',
			NZD: 'NZ/en',
			RON: 'RO/en',
			RUB: 'RU/ru',
			SEK: 'SE/en',
			TRY: 'TR/en',
			UAH: 'UA/uk',
			ZAR: 'ZA/en'
		}
	}
};

/** Stores with their own catalog: no id can be reused there, so each one is searched by title. */
const OWN_CATALOG_STORES: Record<string, string> = {
	JPY: 'JP/ja',
	KRW: 'KR/ko',
	HKD: 'HK/en',
	SGD: 'SG/en',
	TWD: 'TW/en',
	THB: 'TH/en',
	MYR: 'MY/en',
	IDR: 'ID/en',
	AED: 'AE/en',
	SAR: 'SA/en'
};

/** Store regions per `regions` value in the data. JP is searched as an own-catalog store (JPY). */
const REGION_FAMILY: Record<string, string> = { NA: 'NA', EU: 'EU' };

const { values: args } = parseArgs({
	options: {
		platform: { type: 'string' },
		limit: { type: 'string' },
		offset: { type: 'string', default: '0' },
		out: { type: 'string' },
		concurrency: { type: 'string', default: '4' },
		'no-own': { type: 'boolean', default: false }
	}
});

if (args.platform !== 'ps3' && args.platform !== 'psvita') {
	console.error(
		'Usage: node scripts/fetch-store-data.ts --platform ps3|psvita [--limit N] [--offset N]'
	);
	process.exit(1);
}

const dataFile = new URL(`../data/${args.platform}-digital.json`, import.meta.url);
const outFile =
	args.out ?? fileURLToPath(new URL(`../.store-cache/${args.platform}.json`, import.meta.url));

// ---- Matching ----

/** Exact normalized title match among game-like results. Returns { link } or { ambiguous: [...] } or null. */
type Match = { link: Link; sku: string } | { ambiguous: string[] };

function pickMatch(links: Link[], names: string[], platform: string): Match | null {
	const wanted = new Set(names.map(normalize));
	const hits = links.filter(
		(link) =>
			GAME_CATEGORIES.has(link.top_category ?? '') &&
			link.playable_platform?.includes(PLATFORM_LABEL[platform] ?? '') &&
			link.default_sku?.id &&
			(wanted.has(normalize(link.name)) ||
				(link.title_name && wanted.has(normalize(link.title_name))))
	);
	const [first] = hits;
	const sku = first?.default_sku?.id;
	if (!first || !sku) return null;
	// Same title more than once (e.g. an edition and the base game): only accept when they are the same product.
	if (new Set(hits.map((link) => link.id)).size === 1) return { link: first, sku };
	return { ambiguous: hits.map((link) => link.id) };
}

// ---- Per game ----

async function crawlGame(game: InputGame): Promise<CrawlResult> {
	const names = [game.title, ...(game.alternativeNames ?? [])];
	const result: CrawlResult = { title: game.title, skus: {}, prices: {}, ambiguous: {}, own: {} };
	const wantedRegions = game.regions?.length ? game.regions : ['NA', 'EU', 'JP'];

	for (const region of wantedRegions) {
		const family = REGION_FAMILY[region];
		const catalog = family ? FAMILIES[family] : undefined;
		if (!family || !catalog) continue;
		const { search: searchStore, stores } = catalog;
		const match = pickMatch(
			await search(searchStore, game.title, game.platform),
			names,
			game.platform
		);
		if (!match) continue;
		if ('ambiguous' in match) {
			result.ambiguous[family] = match.ambiguous;
			continue;
		}
		const productId = match.link.id;
		result.skus[family] = match.sku;
		for (const [currency, store] of Object.entries(stores)) {
			const container =
				store === searchStore
					? match.link
					: await getJson(`${API}/container/${store}/19/${productId}`);
			const amount = priceOf(container);
			if (amount !== null) result.prices[currency] = amount;
		}
	}

	if (!args['no-own']) {
		for (const [currency, store] of Object.entries(OWN_CATALOG_STORES)) {
			const match = pickMatch(await search(store, game.title, game.platform), names, game.platform);
			if (!match || 'ambiguous' in match) continue;
			const amount = priceOf(match.link);
			if (amount === null) continue;
			result.prices[currency] = amount;
			if (currency === 'JPY') result.skus.JP = match.sku;
			else result.own[currency] = match.sku;
		}
	}
	return result;
}

async function loadJson<T>(file: string | URL, fallback: T): Promise<T> {
	try {
		return JSON.parse(await readFile(file, 'utf8'));
	} catch {
		return fallback;
	}
}

async function saveJson(file: string, value: unknown): Promise<void> {
	await mkdir(dirname(file), { recursive: true });
	const temp = `${file}.tmp`;
	await writeFile(temp, JSON.stringify(value));
	await rename(temp, file);
}

const data = await loadJson<{ games: InputGame[] }>(dataFile, { games: [] });
const results = await loadJson<Results>(outFile, { games: {} });
const offset = Number(args.offset);
const limit = args.limit ? Number(args.limit) : Infinity;
const todo = data.games.slice(offset, offset + limit).filter((game) => !(game.id in results.games));
console.log(
	`${todo.length} games to crawl (${Object.keys(results.games).length} already done) -> ${outFile}`
);

let done = 0;
let nextIndex = 0;
async function worker() {
	while (nextIndex < todo.length) {
		const game = todo[nextIndex++];
		if (!game) break;
		results.games[game.id] = await crawlGame(game);
		done++;
		if (done % 10 === 0) {
			await saveJson(outFile, results);
			console.log(`${done}/${todo.length}`);
		}
	}
}
await Promise.all(Array.from({ length: Number(args.concurrency) }, worker));
await saveJson(outFile, results);
console.log('Done.');
