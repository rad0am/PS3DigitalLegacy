import { untrack } from 'svelte';
import { getFirestoreDb } from '#lib/firebase/client.js';
import { getLocale } from '#lib/paraglide/runtime.js';
import { list } from './list.svelte';
import { mergeLists, pruneTombstones, sanitizeList, type ListMap } from './list-merge';
import { settings } from './settings.svelte';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'merged' | 'offline' | 'error';

// Firestore rules reject updates less than 10 s apart, so keep a safety margin.
const MIN_WRITE_GAP_MS = 11_000;
const DEBOUNCE_MS = 2_000;
const RETRY_MS = 15_000;
const TOMBSTONE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

interface Payload {
	games: ListMap;
	language: string;
	currency: string | null;
}

function fingerprint(payload: Payload): string {
	const games = Object.entries(payload.games).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
	return JSON.stringify([games, payload.language, payload.currency]);
}

function errorCode(error: unknown): string {
	return typeof error === 'object' && error !== null && 'code' in error
		? String((error as { code: unknown }).code)
		: '';
}

/**
 * Local-first sync with one Firestore document, `users/{uid}`:
 * one read after sign-in (merge, newer change wins), then debounced whole-document writes
 * at most every ~10 s. No realtime listeners. Local data is never dropped on a failed write.
 */
class SyncStore {
	state = $state<SyncState>('idle');
	/** games that differed between the device and the account at the last merge */
	conflicts = $state(0);
	lastSyncedAt = $state<number | null>(null);

	#uid: string | null = null;
	#timer: ReturnType<typeof setTimeout> | undefined;
	#dirty = false;
	#lastWriteAt = 0;
	#lastFingerprint = '';
	#stopEffects: (() => void) | undefined;
	#listening = false;

	get active(): boolean {
		return this.#uid !== null;
	}

	async attach(uid: string): Promise<void> {
		if (this.#uid === uid) return;
		this.detach();
		this.#uid = uid;
		this.#listenToPage();
		this.state = 'syncing';
		try {
			await this.#readAndMerge(uid);
		} catch (error) {
			if (this.#uid !== uid) return;
			this.#fail(error);
			this.#schedule(RETRY_MS);
		}
		if (this.#uid !== uid) return;
		// Start watching local changes only after the first merge.
		this.#stopEffects = $effect.root(() => {
			$effect(() => {
				void list.entries;
				void settings.currencyChoice;
				untrack(() => this.#localChanged());
			});
		});
	}

	detach(): void {
		this.#uid = null;
		this.#dirty = false;
		clearTimeout(this.#timer);
		this.#stopEffects?.();
		this.#stopEffects = undefined;
		this.state = 'idle';
		this.conflicts = 0;
		this.lastSyncedAt = null;
		this.#lastFingerprint = '';
	}

	dismissConflicts(): void {
		if (this.state === 'merged') this.state = 'synced';
	}

	#payload(): Payload {
		return {
			games: pruneTombstones(list.entries, Date.now(), TOMBSTONE_MAX_AGE_MS),
			language: getLocale(),
			currency: settings.currencyChoice
		};
	}

	async #readAndMerge(uid: string): Promise<void> {
		const [db, { doc, getDoc }] = await Promise.all([
			getFirestoreDb(),
			import('firebase/firestore')
		]);
		const snapshot = await getDoc(doc(db, 'users', uid));
		if (this.#uid !== uid) return;

		const data = snapshot.exists() ? snapshot.data() : null;
		const remote = sanitizeList(data?.games);
		const lastWrite = data?.lastWrite as { toMillis?: () => number } | undefined;
		this.#lastWriteAt = lastWrite?.toMillis?.() ?? 0;

		const result = mergeLists(list.entries, remote);
		if (result.changesLocal) list.replace(result.merged);
		this.conflicts = result.conflicts;

		// Adopt the account's currency only when this device has no choice of its own.
		if (settings.currencyChoice === null && typeof data?.currency === 'string') {
			settings.setCurrency(data.currency);
		}

		const payload = this.#payload();
		const needsWrite = !snapshot.exists() || result.changesRemote;
		this.#lastFingerprint = needsWrite ? '' : fingerprint(payload);
		this.#dirty = needsWrite;
		this.state = result.conflicts > 0 ? 'merged' : 'synced';
		this.lastSyncedAt = Date.now();
		if (needsWrite) this.#schedule();
	}

	#localChanged(): void {
		if (!this.#uid) return;
		if (fingerprint(this.#payload()) === this.#lastFingerprint) return;
		this.#dirty = true;
		this.#schedule();
	}

	#schedule(delay?: number): void {
		clearTimeout(this.#timer);
		const wait = delay ?? Math.max(DEBOUNCE_MS, this.#lastWriteAt + MIN_WRITE_GAP_MS - Date.now());
		this.#timer = setTimeout(() => void this.#write(), wait);
	}

	async #write(): Promise<void> {
		const uid = this.#uid;
		if (!uid || !this.#dirty) return;
		const payload = this.#payload();
		const print = fingerprint(payload);
		if (print === this.#lastFingerprint) {
			this.#dirty = false;
			return;
		}
		this.state = 'syncing';
		try {
			const [db, { doc, setDoc, serverTimestamp }] = await Promise.all([
				getFirestoreDb(),
				import('firebase/firestore')
			]);
			await setDoc(doc(db, 'users', uid), { ...payload, lastWrite: serverTimestamp() });
			if (this.#uid !== uid) return;
			this.#lastWriteAt = Date.now();
			this.#lastFingerprint = print;
			this.lastSyncedAt = Date.now();
			// A change made during the write keeps the flag set.
			this.#dirty = fingerprint(this.#payload()) !== print;
			this.state = this.conflicts > 0 ? 'merged' : 'synced';
			if (this.#dirty) this.#schedule();
		} catch (error) {
			if (this.#uid !== uid) return;
			this.#fail(error);
			this.#schedule(RETRY_MS);
		}
	}

	#fail(error: unknown): void {
		const code = errorCode(error);
		console.warn('Sync failed:', code || error);
		// Too-frequent writes and network trouble are retried; local data stays untouched.
		this.state = code === 'permission-denied' && !this.#dirty ? 'error' : 'offline';
	}

	/** Best effort: send pending changes when the page is hidden or the network is back. */
	#listenToPage(): void {
		if (this.#listening) return;
		this.#listening = true;
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden' && this.#dirty) void this.#write();
		});
		window.addEventListener('online', () => {
			if (this.#uid && this.#dirty) this.#schedule(DEBOUNCE_MS);
		});
		window.addEventListener('offline', () => {
			if (this.#uid) this.state = 'offline';
		});
	}
}

export const sync = new SyncStore();
