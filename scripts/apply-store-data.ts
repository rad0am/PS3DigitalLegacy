// Merges the results of `scripts/fetch-store-data.ts` into data/<platform>-digital.json:
// - adds a price for every currency the game has no price in yet (existing prices are never changed),
// - sets `storeSkus` (the SKU ids used by the "Add to Basket" button).
//
// Usage: node scripts/apply-store-data.ts --platform ps3|psvita [--dry-run]
//
// The files keep their own formatting (indent, `42.0` style amounts, trailing newline), so the diff only contains
// the added data.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

interface Price {
	currency: string;
	amount: number;
}
interface Dlc {
	id: string;
	name: string;
	prices?: Price[];
	storeSkus?: Record<string, string>;
	[key: string]: unknown;
}
interface DlcCrawl {
	games: Record<
		string,
		{ dlc: Record<string, { skus: Record<string, string>; prices: Record<string, number> }> }
	>;
}
interface Game {
	id: string;
	title: string;
	dlc?: Dlc[];
	prices?: Price[];
	storeSkus?: Record<string, string>;
	[key: string]: unknown;
}
interface CrawlResult {
	skus: Record<string, string>;
	prices: Record<string, number>;
	own: Record<string, string>;
}

const { values: args } = parseArgs({
	options: {
		platform: { type: 'string' },
		out: { type: 'string' },
		'dry-run': { type: 'boolean', default: false }
	}
});
if (args.platform !== 'ps3' && args.platform !== 'psvita') {
	console.error(
		'Usage: node scripts/apply-store-data.ts --platform ps3|psvita [--out file] [--dry-run]'
	);
	process.exit(1);
}

const dataPath = fileURLToPath(new URL(`../data/${args.platform}-digital.json`, import.meta.url));
const cachePath = fileURLToPath(new URL(`../.store-cache/${args.platform}.json`, import.meta.url));

const SKU_ORDER = ['NA', 'EU', 'JP', 'KRW', 'HKD', 'SGD', 'TWD', 'THB', 'MYR', 'IDR', 'AED', 'SAR'];

const raw = await readFile(dataPath, 'utf8');
const data = JSON.parse(raw) as { games: Game[] };
const crawl = JSON.parse(await readFile(cachePath, 'utf8')) as {
	games: Record<string, CrawlResult>;
};

let gamesWithSku = 0;
let gamesWithNewPrices = 0;
let newPrices = 0;
const conflicted: string[] = [];

data.games = data.games.map((game) => {
	const result = crawl.games[game.id];
	if (!result) return game;

	// A price in the data that differs from the store means the store product may be another edition (or the price
	// changed). Adding that product's prices and SKU next to the existing ones would mix editions, so skip the game.
	const prices = [...(game.prices ?? [])];
	const differing = Object.entries(result.prices).filter(([currency, amount]) => {
		const existing = prices.find((price) => price.currency === currency);
		return existing !== undefined && Math.abs(existing.amount - amount) > 0.011;
	});
	if (differing.length) {
		conflicted.push(
			`${game.title}: ${differing
				.map(
					([currency, amount]) =>
						`${currency} ${prices.find((p) => p.currency === currency)?.amount} vs ${amount}`
				)
				.slice(0, 3)
				.join(', ')}`
		);
		return game;
	}
	let added = 0;
	for (const [currency, amount] of Object.entries(result.prices)) {
		if (!prices.some((price) => price.currency === currency)) {
			prices.push({ currency, amount });
			added++;
		}
	}
	if (added) {
		gamesWithNewPrices++;
		newPrices += added;
	}

	const found = { ...result.skus, ...result.own };
	const storeSkus: Record<string, string> = {};
	for (const key of SKU_ORDER) {
		const sku = found[key];
		// A store with its own entry but the same SKU as a shared catalog adds nothing.
		if (sku && !Object.values(storeSkus).includes(sku)) storeSkus[key] = sku;
	}
	if (Object.keys(storeSkus).length) gamesWithSku++;

	// Keep the key order of the file: `storeSkus` goes right after `storeStatus`.
	const next: Game = {} as Game;
	for (const [key, value] of Object.entries(game)) {
		if (key === 'storeSkus') continue;
		next[key] = key === 'prices' && game.prices ? prices : value;
		if (key === 'storeStatus' && Object.keys(storeSkus).length) next.storeSkus = storeSkus;
	}
	if (!('prices' in game) && prices.length) next.prices = prices;
	if (!('storeStatus' in game) && Object.keys(storeSkus).length) next.storeSkus = storeSkus;
	return next;
});

// ---- DLC (from fetch-dlc-store-data.ts, optional) ----

const dlcCachePath = fileURLToPath(
	new URL(`../.store-cache/${args.platform}-dlc.json`, import.meta.url)
);
let dlcCrawl: DlcCrawl | null = null;
try {
	dlcCrawl = JSON.parse(await readFile(dlcCachePath, 'utf8')) as DlcCrawl;
} catch {
	// no DLC results: DLC stay as they are
}
let dlcWithSku = 0;
let dlcNewPrices = 0;
let dlcSkipped = 0;

if (dlcCrawl) {
	const crawled = dlcCrawl;
	data.games = data.games.map((game) => {
		const found = crawled.games[game.id]?.dlc;
		if (!found || !game.dlc) return game;
		const dlc = game.dlc.map((entry) => {
			const result = found[entry.id];
			if (!result) return entry;
			const prices = [...(entry.prices ?? [])];
			const differs = Object.entries(result.prices).some(([currency, amount]) => {
				const existing = prices.find((price) => price.currency === currency);
				return existing !== undefined && Math.abs(existing.amount - amount) > 0.011;
			});
			if (differs) {
				dlcSkipped++;
				return entry;
			}
			for (const [currency, amount] of Object.entries(result.prices)) {
				if (!prices.some((price) => price.currency === currency)) {
					prices.push({ currency, amount });
					dlcNewPrices++;
				}
			}
			const storeSkus: Record<string, string> = {};
			for (const key of SKU_ORDER) {
				const sku = result.skus[key];
				if (sku) storeSkus[key] = sku;
			}
			if (Object.keys(storeSkus).length) dlcWithSku++;
			const next: Dlc = { ...entry, prices };
			delete next.storeSkus;
			if (Object.keys(storeSkus).length) next.storeSkus = storeSkus;
			return next;
		});
		return { ...game, dlc };
	});
}

// ---- Write in the file's own style ----

const indent = /^(\t+|( {2,8}))"/m.exec(raw)?.[1]?.startsWith('\t') ? '\t' : 4;
let out = JSON.stringify(data, null, indent);
if (/"amount": \d+\.0\b/.test(raw)) {
	// The PS3 file was written with floats ("amount": 42.0); keep that style for whole-number amounts.
	out = out.replace(
		/^(\s*"amount": \d+)(,?)$/gm,
		(_, head: string, comma: string) => `${head}.0${comma}`
	);
}
// The PS3 file escapes ' and & the way its generator wrote them; keep that too.
if (raw.includes('\\u0027')) out = out.replace(/'/g, '\\u0027');
if (raw.includes('\\u0026')) out = out.replace(/&/g, '\\u0026');
if (raw.endsWith('\n')) out += '\n';

console.log(
	`${gamesWithSku} games with SKUs, ${newPrices} new prices in ${gamesWithNewPrices} games, ` +
		`${conflicted.length} games skipped because a price differs from the store`
);
if (dlcCrawl) {
	console.log(
		`DLC: ${dlcWithSku} with SKUs, ${dlcNewPrices} new prices, ${dlcSkipped} skipped because a price differs`
	);
}
for (const line of conflicted) console.log(`  skipped ${line}`);
if (args['dry-run']) {
	console.log('Dry run: nothing written.');
} else {
	const target = args.out ?? dataPath;
	await writeFile(target, out);
	console.log(`Wrote ${target}`);
}
