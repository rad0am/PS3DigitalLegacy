// Shared types for the catalog data. The raw shape mirrors `data/ps3-digital.json`;
// the "wire" shapes are the compact formats generated at build time and loaded by the browser.

export const REGIONS = ['NA', 'EU', 'JP'] as const;
export type Region = (typeof REGIONS)[number];

/** Bit flags used to store a region set in one number. */
export const REGION_BIT: Record<Region, number> = { NA: 1, EU: 2, JP: 4 };

export const STORE_STATUSES = ['available', 'delisted', 'unknown'] as const;
export type StoreStatus = (typeof STORE_STATUSES)[number];

export interface Price {
	currency: string;
	amount: number;
}

// ---- Raw data (data/ps3-digital.json) ----

export interface RawDlc {
	id: string;
	name: string;
	trophies?: number | null;
	prices?: Price[];
}

export interface RawGame {
	id: string;
	platform?: string;
	title: string;
	alternativeNames?: string[];
	regions?: Region[];
	digitalOnly?: boolean;
	prices?: Price[];
	storeStatus?: StoreStatus;
	trophies?: { supported?: boolean; hasPlatinum?: boolean } | null;
	psnprofilesUrl?: string | null;
	dlc?: RawDlc[];
	notes?: string[];
	igdbId?: number | null;
	igdbUrl?: string | null;
	coverPhoto?: string | null;
	screenshots?: string[];
	genres?: string[];
	description?: string | null;
	developers?: string[];
	publishers?: string[];
	releaseDate?: string | null;
	playerPerspectives?: string[];
}

export interface RawData {
	schemaVersion: string | number;
	generatedAt: string;
	games: RawGame[];
}

// ---- Wire format: catalog index (`/data/catalog.json`) ----

export interface WireGame {
	id: string;
	/** title */
	t: string;
	/** alternative names (search only) */
	a?: string[];
	/** platform, omitted for PS3 */
	f?: string;
	/** region bit set */
	r: number;
	/** store status: 0 available, 1 delisted, 2 unknown */
	s: 0 | 1 | 2;
	/** digital only: 1 yes, 0 the game has a disc release */
	d: 0 | 1;
	/** release date, ISO yyyy-mm-dd */
	y: string | null;
	/** genre indexes into `CatalogWire.genres` */
	g: number[];
	/** IGDB cover file name, e.g. `co1abc.jpg` */
	c: string | null;
	/** DLC count */
	n: number;
	/** has a platinum trophy */
	pl: 0 | 1;
	/** trophies supported */
	tr: 0 | 1;
}

export interface WireDlc {
	id: string;
	/** name */
	t: string;
	/** index of the parent game in `games` */
	p: number;
	/** trophy count, 0 when none or unknown */
	tr: number;
}

export interface CatalogWire {
	v: 1;
	generatedAt: string;
	/** every currency that occurs in the data */
	currencies: string[];
	/** genre names, indexed by `WireGame.g` */
	genres: string[];
	games: WireGame[];
	dlc: WireDlc[];
}

// ---- Game details (prerendered per game page) ----

export interface GameDetail {
	id: string;
	platform: string;
	title: string;
	alternativeNames: string[];
	regions: Region[];
	digitalOnly: boolean;
	storeStatus: StoreStatus;
	prices: Price[];
	trophiesSupported: boolean;
	hasPlatinum: boolean;
	/** validated: only psnprofiles.com URLs */
	psnprofilesUrl: string | null;
	/** validated: only igdb.com URLs */
	igdbUrl: string | null;
	cover: string | null;
	screenshots: string[];
	genres: string[];
	description: string | null;
	developers: string[];
	publishers: string[];
	releaseDate: string | null;
	playerPerspectives: string[];
	notes: string[];
	dlc: { id: string; name: string; trophies: number | null; prices: Price[] }[];
}
