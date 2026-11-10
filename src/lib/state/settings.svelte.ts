import { FALLBACK_CURRENCY, detectCurrency } from '#lib/currency/region-currency.js';
import { STORAGE_KEYS, readJson, writeJson } from './storage';

export type ViewMode = 'list' | 'grid';

/** User preferences stored on the device: currency, list density and view mode. */
class Settings {
	/** the user's explicit choice, null = automatic */
	currencyChoice = $state<string | null>(null);
	/** currency derived from the browser language, null until detected */
	detected = $state<string | null>(null);
	compact = $state(false);
	view = $state<ViewMode>('list');

	currency = $derived(this.currencyChoice ?? this.detected ?? FALLBACK_CURRENCY);

	load(): void {
		const saved = readJson(STORAGE_KEYS.settings);
		if (typeof saved !== 'object' || saved === null) return;
		const { currency, compact, view } = saved as Record<string, unknown>;
		if (typeof currency === 'string' && /^[A-Z]{3}$/.test(currency)) this.currencyChoice = currency;
		if (typeof compact === 'boolean') this.compact = compact;
		if (view === 'list' || view === 'grid') this.view = view;
	}

	/** Called once the list of currencies in the data is known. */
	detect(available: readonly string[]): void {
		this.detected = detectCurrency(navigator.languages ?? [navigator.language], available);
		// A saved currency that no longer exists in the data would show no prices at all.
		if (this.currencyChoice && !available.includes(this.currencyChoice)) this.currencyChoice = null;
	}

	setCurrency(code: string | null): void {
		this.currencyChoice = code;
		this.#save();
	}

	setCompact(value: boolean): void {
		this.compact = value;
		this.#save();
	}

	setView(value: ViewMode): void {
		this.view = value;
		this.#save();
	}

	#save(): void {
		writeJson(STORAGE_KEYS.settings, {
			currency: this.currencyChoice,
			compact: this.compact,
			view: this.view
		});
	}
}

export const settings = new Settings();
