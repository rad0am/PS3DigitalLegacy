// UI languages, tied to the currencies in the catalog data (see CLAUDE.md, "Internationalization").
// The tag in `locale` must match a file in `messages/` and an entry in `project.inlang/settings.json`.
import type { Locale } from '#lib/paraglide/runtime.js';

export interface Language {
	locale: Locale;
	/** Name in the language itself, the main label in the picker. */
	native: string;
	/** English name, the secondary label. */
	english: string;
	/** BCP 47 tag handed to `Intl` for numbers, dates and lists. */
	intl: string;
	/** Currencies this language is the main one for (display only). */
	currencies: readonly string[];
	/** Right-to-left script. */
	rtl?: boolean;
}

const ENGLISH: Language = {
	locale: 'en',
	native: 'English',
	english: 'English',
	intl: 'en-US',
	currencies: ['USD', 'GBP', 'AUD', 'CAD', 'NZD', 'SGD', 'ZAR']
};

export const LANGUAGES: readonly Language[] = [
	ENGLISH,
	{ locale: 'pl', native: 'Polski', english: 'Polish', intl: 'pl-PL', currencies: ['PLN'] },
	{
		locale: 'ar',
		native: 'العربية',
		english: 'Arabic',
		intl: 'ar-u-nu-latn',
		currencies: ['AED', 'SAR'],
		rtl: true
	},
	{ locale: 'cs', native: 'Čeština', english: 'Czech', intl: 'cs-CZ', currencies: ['CZK'] },
	{ locale: 'da', native: 'Dansk', english: 'Danish', intl: 'da-DK', currencies: ['DKK'] },
	{ locale: 'de', native: 'Deutsch', english: 'German', intl: 'de-DE', currencies: ['EUR', 'CHF'] },
	{ locale: 'el', native: 'Ελληνικά', english: 'Greek', intl: 'el-GR', currencies: ['EUR'] },
	{
		locale: 'es',
		native: 'Español',
		english: 'Spanish',
		intl: 'es-ES',
		currencies: ['EUR', 'MXN', 'HNL']
	},
	{
		locale: 'fr',
		native: 'Français',
		english: 'French',
		intl: 'fr-FR',
		currencies: ['EUR', 'CHF', 'CAD']
	},
	{
		locale: 'id',
		native: 'Bahasa Indonesia',
		english: 'Indonesian',
		intl: 'id-ID',
		currencies: ['IDR']
	},
	{
		locale: 'it',
		native: 'Italiano',
		english: 'Italian',
		intl: 'it-IT',
		currencies: ['EUR', 'CHF']
	},
	{ locale: 'hu', native: 'Magyar', english: 'Hungarian', intl: 'hu-HU', currencies: ['HUF'] },
	{ locale: 'ms', native: 'Bahasa Melayu', english: 'Malay', intl: 'ms-MY', currencies: ['MYR'] },
	{ locale: 'nl', native: 'Nederlands', english: 'Dutch', intl: 'nl-NL', currencies: ['EUR'] },
	{
		locale: 'nb',
		native: 'Norsk bokmål',
		english: 'Norwegian',
		intl: 'nb-NO',
		currencies: ['NOK']
	},
	{
		locale: 'pt',
		native: 'Português (Brasil)',
		english: 'Portuguese',
		intl: 'pt-BR',
		currencies: ['BRL']
	},
	{ locale: 'ro', native: 'Română', english: 'Romanian', intl: 'ro-RO', currencies: ['RON'] },
	{ locale: 'fi', native: 'Suomi', english: 'Finnish', intl: 'fi-FI', currencies: ['EUR'] },
	{ locale: 'sv', native: 'Svenska', english: 'Swedish', intl: 'sv-SE', currencies: ['SEK'] },
	{ locale: 'tr', native: 'Türkçe', english: 'Turkish', intl: 'tr-TR', currencies: ['TRY'] },
	{ locale: 'ru', native: 'Русский', english: 'Russian', intl: 'ru-RU', currencies: ['RUB'] },
	{ locale: 'uk', native: 'Українська', english: 'Ukrainian', intl: 'uk-UA', currencies: ['UAH'] },
	{
		locale: 'he',
		native: 'עברית',
		english: 'Hebrew',
		intl: 'he-IL',
		currencies: ['ILS'],
		rtl: true
	},
	{ locale: 'hi', native: 'हिन्दी', english: 'Hindi', intl: 'hi-IN', currencies: ['INR'] },
	{ locale: 'th', native: 'ไทย', english: 'Thai', intl: 'th-TH-u-nu-latn', currencies: ['THB'] },
	{ locale: 'ja', native: '日本語', english: 'Japanese', intl: 'ja-JP', currencies: ['JPY'] },
	{ locale: 'ko', native: '한국어', english: 'Korean', intl: 'ko-KR', currencies: ['KRW'] },
	{
		locale: 'zh-Hant',
		native: '繁體中文',
		english: 'Chinese (Traditional)',
		intl: 'zh-TW',
		currencies: ['TWD', 'HKD']
	}
];

const BY_LOCALE = new Map<string, Language>(
	LANGUAGES.map((language) => [language.locale, language])
);

export function languageOf(locale: string): Language {
	return BY_LOCALE.get(locale) ?? ENGLISH;
}

/** Short code for the header trigger (`pt` -> `PT`, `zh-Hant` -> `ZH`). */
export function shortCode(locale: string): string {
	return (locale.split('-')[0] ?? locale).toUpperCase();
}

/**
 * The first browser language that maps to a supported UI language, or null.
 * Used only for the "Detected" badge; Paraglide does the real detection.
 */
export function detectLanguage(tags: readonly string[]): Locale | null {
	for (const tag of tags) {
		const lower = tag.toLowerCase();
		const base = lower.split('-')[0] ?? '';
		if (base === 'zh') {
			if (/-(hant|tw|hk|mo)\b/.test(lower)) return 'zh-Hant';
			continue;
		}
		const base2 = base === 'no' || base === 'nn' ? 'nb' : base;
		const found = LANGUAGES.find((language) => language.locale.toLowerCase() === base2);
		if (found) return found.locale;
	}
	return null;
}
