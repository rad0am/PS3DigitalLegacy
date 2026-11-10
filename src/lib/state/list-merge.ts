// Pure logic for the user's "want to buy" / "bought" list: merging, pruning, import/export.
//
// An entry removed by the user is kept as a `none` tombstone (with a timestamp), otherwise a
// plain union merge would bring a deleted game back from the other side.

export type ListStatus = 'wishlist' | 'bought' | 'none';

export interface ListEntry {
	status: ListStatus;
	updatedAt: number;
}

export type ListMap = Record<string, ListEntry>;

export interface MergeResult {
	merged: ListMap;
	/** ids present on both sides with a different status */
	conflicts: number;
	/** merged differs from local */
	changesLocal: boolean;
	/** merged differs from remote */
	changesRemote: boolean;
}

const RANK: Record<ListStatus, number> = { none: 0, wishlist: 1, bought: 2 };

function same(a: ListEntry | undefined, b: ListEntry | undefined): boolean {
	return a?.status === b?.status && a?.updatedAt === b?.updatedAt;
}

/** Union of both sides; the newer `updatedAt` wins per id (ties: the "more owned" status). */
export function mergeLists(local: ListMap, remote: ListMap): MergeResult {
	const merged: ListMap = {};
	let conflicts = 0;

	for (const id of new Set([...Object.keys(local), ...Object.keys(remote)])) {
		const a = local[id];
		const b = remote[id];
		if (a && b) {
			if (a.status !== b.status) conflicts++;
			if (a.updatedAt !== b.updatedAt) merged[id] = a.updatedAt > b.updatedAt ? a : b;
			else merged[id] = RANK[a.status] >= RANK[b.status] ? a : b;
		} else {
			merged[id] = (a ?? b)!;
		}
	}

	let changesLocal = false;
	let changesRemote = false;
	for (const id of Object.keys(merged)) {
		if (!same(merged[id], local[id])) changesLocal = true;
		if (!same(merged[id], remote[id])) changesRemote = true;
	}
	return { merged, conflicts, changesLocal, changesRemote };
}

/** Drops old tombstones so the document does not grow forever. */
export function pruneTombstones(list: ListMap, now: number, maxAgeMs: number): ListMap {
	const result: ListMap = {};
	for (const [id, entry] of Object.entries(list)) {
		if (entry.status === 'none' && now - entry.updatedAt > maxAgeMs) continue;
		result[id] = entry;
	}
	return result;
}

function isEntry(value: unknown): value is ListEntry {
	if (typeof value !== 'object' || value === null) return false;
	const { status, updatedAt } = value as Record<string, unknown>;
	return (
		(status === 'wishlist' || status === 'bought' || status === 'none') &&
		typeof updatedAt === 'number' &&
		Number.isFinite(updatedAt)
	);
}

/** Keeps only well-formed entries from untrusted input (localStorage, Firestore, imported file). */
export function sanitizeList(value: unknown): ListMap {
	const result: ListMap = {};
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return result;
	for (const [id, entry] of Object.entries(value)) {
		if (id.length > 0 && id.length <= 64 && isEntry(entry)) {
			result[id] = { status: entry.status, updatedAt: entry.updatedAt };
		}
	}
	return result;
}

export const EXPORT_FORMAT = 'ps3-digital-legacy-list';

export function serializeList(list: ListMap, now = Date.now()): string {
	const entries = Object.fromEntries(Object.entries(list).filter(([, e]) => e.status !== 'none'));
	return JSON.stringify(
		{ format: EXPORT_FORMAT, version: 1, exportedAt: now, list: entries },
		null,
		2
	);
}

/** Parses an exported file. Returns null when it is not valid JSON or has no list. */
export function parseImport(text: string): ListMap | null {
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		return null;
	}
	if (typeof data !== 'object' || data === null) return null;
	const source = 'list' in data ? (data as { list: unknown }).list : data;
	const list = sanitizeList(source);
	return Object.keys(list).length > 0 || isEmptyObject(source) ? list : null;
}

function isEmptyObject(value: unknown): boolean {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		Object.keys(value).length === 0
	);
}
