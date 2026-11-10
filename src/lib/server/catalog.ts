// Build-time only: turns data/ps3-digital.json into the compact catalog index, per-currency price
// arrays and per-game details. Never imported by browser code.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
	REGION_BIT,
	STORE_STATUSES,
	type CatalogWire,
	type GameDetail,
	type RawData,
	type RawGame,
	type WireDlc,
	type WireGame
} from '#lib/data/types.js';

const COVER_RE =
	/^https:\/\/images\.igdb\.com\/igdb\/image\/upload\/t_[a-z0-9_]+\/([A-Za-z0-9_-]+\.[a-z]+)$/;
const IGDB_HOSTS = new Set(['images.igdb.com']);

export interface CatalogBuild {
	catalog: CatalogWire;
	/** currency -> price per catalog item, aligned with `games` followed by `dlc` (null = no price) */
	prices: Map<string, (number | null)[]>;
}

export function coverFileName(url: string | null | undefined): string | null {
	if (!url) return null;
	return COVER_RE.exec(url)?.[1] ?? null;
}

function hostOf(url: string): string | null {
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'https:' ? parsed.hostname : null;
	} catch {
		return null;
	}
}

/** Only psnprofiles.com links are rendered (CLAUDE.md, "PSNProfiles link"). */
export function safePsnUrl(url: string | null | undefined): string | null {
	if (!url) return null;
	const host = hostOf(url);
	return host === 'psnprofiles.com' || host === 'www.psnprofiles.com' ? url : null;
}

export function safeIgdbUrl(url: string | null | undefined): string | null {
	if (!url) return null;
	const host = hostOf(url);
	return host === 'igdb.com' || host === 'www.igdb.com' ? url : null;
}

export function buildCatalog(raw: RawData): CatalogBuild {
	const games = raw.games;

	const genreCount = new Map<string, number>();
	const currencies = new Set<string>();
	for (const game of games) {
		for (const genre of game.genres ?? []) genreCount.set(genre, (genreCount.get(genre) ?? 0) + 1);
		for (const price of game.prices ?? []) currencies.add(price.currency);
		for (const dlc of game.dlc ?? []) {
			for (const price of dlc.prices ?? []) currencies.add(price.currency);
		}
	}
	// Most common genres first, so the sidebar can show the top few.
	const genres = [...genreCount.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.map(([name]) => name);
	const genreIndex = new Map(genres.map((name, i) => [name, i]));
	const currencyList = [...currencies].sort();

	const wireGames: WireGame[] = [];
	const wireDlc: WireDlc[] = [];
	const total = games.reduce((sum, g) => sum + 1 + (g.dlc?.length ?? 0), 0);
	const prices = new Map<string, (number | null)[]>(
		currencyList.map((c) => [c, new Array<number | null>(total).fill(null)])
	);

	// Items are laid out as all games first, then all DLC.
	games.forEach((game, gameIndex) => {
		const status = STORE_STATUSES.indexOf(game.storeStatus ?? 'unknown');
		const wire: WireGame = {
			id: game.id,
			t: game.title,
			r: (game.regions ?? []).reduce((mask, region) => mask | REGION_BIT[region], 0),
			s: (status < 0 ? 2 : status) as 0 | 1 | 2,
			d: game.digitalOnly === false ? 0 : 1,
			y: game.releaseDate ?? null,
			g: (game.genres ?? []).map((name) => genreIndex.get(name)).filter((i) => i !== undefined),
			c: coverFileName(game.coverPhoto),
			n: game.dlc?.length ?? 0,
			pl: game.trophies?.hasPlatinum ? 1 : 0,
			tr: game.trophies?.supported ? 1 : 0
		};
		if (game.alternativeNames?.length) wire.a = game.alternativeNames;
		if (game.platform && game.platform !== 'PS3') wire.f = game.platform;
		wireGames.push(wire);
		for (const price of game.prices ?? []) prices.get(price.currency)![gameIndex] = price.amount;
	});

	let dlcIndex = games.length;
	games.forEach((game, gameIndex) => {
		for (const dlc of game.dlc ?? []) {
			wireDlc.push({ id: dlc.id, t: dlc.name, p: gameIndex, tr: dlc.trophies ?? 0 });
			for (const price of dlc.prices ?? []) prices.get(price.currency)![dlcIndex] = price.amount;
			dlcIndex++;
		}
	});

	return {
		catalog: {
			v: 1,
			generatedAt: raw.generatedAt,
			currencies: currencyList,
			genres,
			games: wireGames,
			dlc: wireDlc
		},
		prices
	};
}

export function toGameDetail(game: RawGame): GameDetail {
	return {
		id: game.id,
		platform: game.platform ?? 'PS3',
		title: game.title,
		alternativeNames: game.alternativeNames ?? [],
		regions: game.regions ?? [],
		digitalOnly: game.digitalOnly !== false,
		storeStatus: game.storeStatus ?? 'unknown',
		prices: game.prices ?? [],
		trophiesSupported: game.trophies?.supported === true,
		hasPlatinum: game.trophies?.hasPlatinum === true,
		psnprofilesUrl: safePsnUrl(game.psnprofilesUrl),
		igdbUrl: safeIgdbUrl(game.igdbUrl),
		cover: coverFileName(game.coverPhoto),
		screenshots: (game.screenshots ?? []).filter((url) => {
			const host = hostOf(url);
			return host !== null && IGDB_HOSTS.has(host);
		}),
		genres: game.genres ?? [],
		description: game.description ?? null,
		developers: game.developers ?? [],
		publishers: game.publishers ?? [],
		releaseDate: game.releaseDate ?? null,
		playerPerspectives: game.playerPerspectives ?? [],
		notes: game.notes ?? [],
		dlc: (game.dlc ?? []).map((dlc) => ({
			id: dlc.id,
			name: dlc.name,
			trophies: dlc.trophies ?? null,
			prices: dlc.prices ?? []
		}))
	};
}

// ---- cached access to the data file ----

let rawCache: RawData | undefined;
let buildCache: CatalogBuild | undefined;
let gameCache: Map<string, RawGame> | undefined;

export function loadRawData(): RawData {
	rawCache ??= JSON.parse(
		readFileSync(path.resolve(process.cwd(), 'data/ps3-digital.json'), 'utf8')
	) as RawData;
	return rawCache;
}

export function getCatalogBuild(): CatalogBuild {
	buildCache ??= buildCatalog(loadRawData());
	return buildCache;
}

export function getRawGame(id: string): RawGame | undefined {
	gameCache ??= new Map(loadRawData().games.map((game) => [game.id, game]));
	return gameCache.get(id);
}
