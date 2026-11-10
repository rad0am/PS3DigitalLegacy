// localStorage access that never throws (private windows, blocked storage, SSR).

export const STORAGE_KEYS = {
	list: 'ps3dl:list',
	settings: 'ps3dl:settings',
	signedIn: 'ps3dl:signed-in'
} as const;

export function readStorage(key: string): string | null {
	try {
		return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
	} catch {
		return null;
	}
}

export function writeStorage(key: string, value: string | null): void {
	try {
		if (typeof localStorage === 'undefined') return;
		if (value === null) localStorage.removeItem(key);
		else localStorage.setItem(key, value);
	} catch {
		// Storage is full or blocked; the app keeps working in memory.
	}
}

export function readJson(key: string): unknown {
	const text = readStorage(key);
	if (text === null) return null;
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

export function writeJson(key: string, value: unknown): void {
	writeStorage(key, JSON.stringify(value));
}
