// Crawls PlayStation Store SKUs (and the price in the searched store) for the DLC of the games in data/*.json.
// A game's product page lists all its add-ons, so this takes one search and a few `container` requests per game
// and catalog instead of one request per DLC. DLC are matched by exact normalized name.
// It never touches data/*.json; `scripts/apply-store-data.ts` merges the results afterwards.
//
// Usage: node scripts/fetch-dlc-store-data.ts --platform ps3|psvita [--limit N] [--offset N] [--out file]

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

/** Catalogs searched for the parent game: the store that is searched and the currency of its prices. */
const CATALOGS: Record<string, { store: string; currency: string }> = {
	NA: { store: 'US/en', currency: 'USD' },
	EU: { store: 'GB/en', currency: 'GBP' },
	JP: { store: 'JP/ja', currency: 'JPY' }
};

const PAGE = 100;

interface InputGame {
	id: string;
	title: string;
	platform: 'PS3' | 'PS VITA';
	alternativeNames?: string[];
	regions?: string[];
	dlc?: { id: string; name: string }[];
}
interface DlcResult {
	/** SKU per catalog */
	skus: Record<string, string>;
	/** price in the currency of the searched store of each catalog */
	prices: Record<string, number>;
}
interface GameResult {
	/** catalogs where the parent game was found */
	parents: string[];
	dlc: Record<string, DlcResult>;
}
interface Results {
	games: Record<string, GameResult>;
}

const { values: args } = parseArgs({
	options: {
		platform: { type: 'string' },
		limit: { type: 'string' },
		offset: { type: 'string', default: '0' },
		out: { type: 'string' },
		concurrency: { type: 'string', default: '6' }
	}
});
if (args.platform !== 'ps3' && args.platform !== 'psvita') {
	console.error('Usage: node scripts/fetch-dlc-store-data.ts --platform ps3|psvita');
	process.exit(1);
}

const dataFile = new URL(`../data/${args.platform}-digital.json`, import.meta.url);
const outFile =
	args.out ?? fileURLToPath(new URL(`../.store-cache/${args.platform}-dlc.json`, import.meta.url));

/** Products with the game's exact title (an edition may share it, so more than one is possible). */
function parentProducts(links: Link[], game: InputGame): Link[] {
	const wanted = new Set([game.title, ...(game.alternativeNames ?? [])].map(normalize));
	const hits = links.filter(
		(link) =>
			GAME_CATEGORIES.has(link.top_category ?? '') &&
			link.playable_platform?.includes(PLATFORM_LABEL[game.platform] ?? '') &&
			(wanted.has(normalize(link.name)) ||
				(link.title_name !== undefined && wanted.has(normalize(link.title_name))))
	);
	return [...new Map(hits.map((link) => [link.id, link])).values()].slice(0, 3);
}

/** The name as is and without the game title in front ("Borderlands: Claptrap's ..." and "Claptrap's ..."). */
function nameKeys(name: string, titles: string[]): string[] {
	const keys = new Set([normalize(name)]);
	for (const title of titles) {
		const prefix = normalize(title);
		const full = normalize(name);
		if (prefix && full.startsWith(prefix + ' ')) keys.add(full.slice(prefix.length + 1));
	}
	return [...keys].filter(Boolean);
}

async function addOns(store: string, productId: string): Promise<Link[]> {
	const all: Link[] = [];
	for (let start = 0; ; start += PAGE) {
		const json = await getJson(
			`${API}/container/${store}/19/${productId}?size=${PAGE}&start=${start}`
		);
		const links = json?.links ?? [];
		all.push(...links);
		if (links.length < PAGE) return all;
	}
}

async function crawlGame(game: InputGame): Promise<GameResult> {
	const result: GameResult = { parents: [], dlc: {} };
	const titles = [game.title, ...(game.alternativeNames ?? [])];
	const byName = new Map<string, Set<string>>();
	for (const dlc of game.dlc ?? []) {
		for (const key of nameKeys(dlc.name, titles)) {
			byName.set(key, (byName.get(key) ?? new Set()).add(dlc.id));
		}
	}
	const regions = game.regions?.length ? game.regions : Object.keys(CATALOGS);

	/** Records the SKU and price of a store add-on when its name matches exactly one DLC of this game. */
	function record(region: string, currency: string, link: Link, extraTitles: string[]): void {
		const sku = link.default_sku?.id;
		if (!sku) return;
		const ids = new Set(
			nameKeys(link.name, [...titles, ...extraTitles]).flatMap((key) => [
				...(byName.get(key) ?? [])
			])
		);
		// A name used twice in the data is ambiguous; only a unique name gets a SKU.
		const [id] = ids;
		if (ids.size !== 1 || !id) return;
		const entry = (result.dlc[id] ??= { skus: {}, prices: {} });
		entry.skus[region] ??= sku;
		const amount = priceOf(link);
		if (amount !== null) entry.prices[currency] ??= amount;
	}

	for (const region of regions) {
		const catalog = CATALOGS[region];
		if (!catalog) continue;
		const found = await search(catalog.store, game.title, game.platform);
		const parents = parentProducts(found, game);
		if (parents.length) result.parents.push(region);
		for (const parent of parents) {
			for (const link of await addOns(catalog.store, parent.id)) {
				record(region, catalog.currency, link, [parent.name]);
			}
		}
		// Some add-ons belong to the disc product of the game, so the page of the digital product does not list
		// them (Dead Space 3 Awakened). The search lists them, but also add-ons of other games, so only names that
		// start with this game's title count.
		const prefixes = titles.map(normalize).filter(Boolean);
		for (const link of found) {
			if (link.top_category !== 'add_on') continue;
			const name = normalize(link.name);
			if (!prefixes.some((prefix) => name.startsWith(prefix + ' '))) continue;
			if (!link.playable_platform?.includes(PLATFORM_LABEL[game.platform] ?? '')) continue;
			record(region, catalog.currency, link, []);
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
const todo = data.games
	.slice(offset, offset + limit)
	.filter((game) => (game.dlc?.length ?? 0) > 0 && !(game.id in results.games));
console.log(`${todo.length} games with DLC to crawl -> ${outFile}`);

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
