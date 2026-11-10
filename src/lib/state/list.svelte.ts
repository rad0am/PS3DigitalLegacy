import {
	parseImport,
	sanitizeList,
	serializeList,
	mergeLists,
	type ListMap,
	type ListStatus
} from './list-merge';
import { STORAGE_KEYS, readJson, writeJson } from './storage';

/** The user's "want to buy" / "bought" list, local-first (localStorage). */
class ListStore {
	/** replaced as a whole on every change (never mutated) */
	entries = $state.raw<ListMap>({});
	loaded = $state(false);

	wishlistCount = $derived(this.#count('wishlist'));
	boughtCount = $derived(this.#count('bought'));

	load(): void {
		this.entries = sanitizeList(readJson(STORAGE_KEYS.list));
		this.loaded = true;
		// Keep several open tabs in step.
		window.addEventListener('storage', (event) => {
			if (event.key === STORAGE_KEYS.list) {
				this.entries = sanitizeList(readJson(STORAGE_KEYS.list));
			}
		});
	}

	#count(status: ListStatus): number {
		return Object.values(this.entries).filter((entry) => entry.status === status).length;
	}

	statusOf(id: string): 'wishlist' | 'bought' | null {
		const status = this.entries[id]?.status;
		return status === 'wishlist' || status === 'bought' ? status : null;
	}

	/** Ids with the given status, newest change first. */
	idsWith(status: 'wishlist' | 'bought'): string[] {
		return Object.entries(this.entries)
			.filter(([, entry]) => entry.status === status)
			.sort((a, b) => b[1].updatedAt - a[1].updatedAt)
			.map(([id]) => id);
	}

	set(id: string, status: ListStatus): void {
		const previous = this.entries[id]?.updatedAt ?? 0;
		this.#commit({
			...this.entries,
			[id]: { status, updatedAt: Math.max(Date.now(), previous + 1) }
		});
	}

	toggleWishlist(id: string): void {
		this.set(id, this.statusOf(id) === 'wishlist' ? 'none' : 'wishlist');
	}

	toggleBought(id: string): void {
		this.set(id, this.statusOf(id) === 'bought' ? 'none' : 'bought');
	}

	/** Replaces the list with an already merged one (used after sync). */
	replace(next: ListMap): void {
		this.#commit(next);
	}

	exportJson(): string {
		return serializeList(this.entries);
	}

	/** Merges an exported file into the list. Returns the number of entries read, or null if invalid. */
	importJson(text: string): number | null {
		const imported = parseImport(text);
		if (!imported) return null;
		this.#commit(mergeLists(this.entries, imported).merged);
		return Object.keys(imported).length;
	}

	#commit(next: ListMap): void {
		this.entries = next;
		writeJson(STORAGE_KEYS.list, next);
	}
}

export const list = new ListStore();
