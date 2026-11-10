// Client-side model of the catalog index: games and DLC as one flat list of items.
import {
	REGIONS,
	REGION_BIT,
	STORE_STATUSES,
	type CatalogWire,
	type Region,
	type StoreStatus
} from './types';
import { normalize } from './search';

export interface Item {
	/** position in `Catalog.items`; also the index into per-currency price arrays */
	index: number;
	id: string;
	kind: 'game' | 'dlc';
	title: string;
	platform: string;
	/** -1 for games, the parent game's item index for DLC */
	parent: number;
	/** the game this item belongs to (itself for games) */
	gameIndex: number;
	/** region bit set (DLC inherits the parent's) */
	regions: number;
	/** store status (DLC inherits the parent's) */
	status: StoreStatus;
	/** about the game itself; DLC is always digital only */
	digitalOnly: boolean;
	releaseDate: string | null;
	genres: number[];
	cover: string | null;
	dlcCount: number;
	hasPlatinum: boolean;
	trophiesSupported: boolean;
	/** DLC trophy count, 0 when none */
	dlcTrophies: number;
	/** normalized title + alternative names, for search */
	search: string;
	titleNorm: string;
}

export interface Catalog {
	items: Item[];
	/** number of games; games occupy `items[0 .. gameCount)` */
	gameCount: number;
	byId: Map<string, Item>;
	genres: string[];
	currencies: string[];
	generatedAt: string;
	/** item indexes of the DLC of each game, by game index */
	dlcOf: Map<number, number[]>;
	totals: { games: number; digitalOnlyGames: number; dlc: number };
}

export function regionsOf(mask: number): Region[] {
	return REGIONS.filter((region) => (mask & REGION_BIT[region]) !== 0);
}

export function buildClientCatalog(wire: CatalogWire): Catalog {
	const items: Item[] = [];
	const dlcOf = new Map<number, number[]>();

	for (const game of wire.games) {
		const title = game.t;
		items.push({
			index: items.length,
			id: game.id,
			kind: 'game',
			title,
			platform: game.f ?? 'PS3',
			parent: -1,
			gameIndex: items.length,
			regions: game.r,
			status: STORE_STATUSES[game.s] ?? 'unknown',
			digitalOnly: game.d === 1,
			releaseDate: game.y,
			genres: game.g,
			cover: game.c,
			dlcCount: game.n,
			hasPlatinum: game.pl === 1,
			trophiesSupported: game.tr === 1,
			dlcTrophies: 0,
			search: normalize([title, ...(game.a ?? [])].join(' ')),
			titleNorm: normalize(title)
		});
	}

	for (const dlc of wire.dlc) {
		const parent = items[dlc.p];
		if (!parent) continue;
		const index = items.length;
		items.push({
			index,
			id: dlc.id,
			kind: 'dlc',
			title: dlc.t,
			platform: parent.platform,
			parent: dlc.p,
			gameIndex: dlc.p,
			regions: parent.regions,
			status: parent.status,
			digitalOnly: true,
			releaseDate: parent.releaseDate,
			genres: parent.genres,
			cover: parent.cover,
			dlcCount: 0,
			hasPlatinum: false,
			trophiesSupported: dlc.tr > 0,
			dlcTrophies: dlc.tr,
			search: normalize(`${dlc.t} ${parent.title}`),
			titleNorm: normalize(dlc.t)
		});
		const list = dlcOf.get(dlc.p);
		if (list) list.push(index);
		else dlcOf.set(dlc.p, [index]);
	}

	const games = wire.games.length;
	return {
		items,
		gameCount: games,
		byId: new Map(items.map((item) => [item.id, item])),
		genres: wire.genres,
		currencies: wire.currencies,
		generatedAt: wire.generatedAt,
		dlcOf,
		totals: {
			games,
			digitalOnlyGames: wire.games.filter((game) => game.d === 1).length,
			dlc: wire.dlc.length
		}
	};
}
