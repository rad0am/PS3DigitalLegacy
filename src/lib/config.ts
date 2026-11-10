// Single place for site-wide configuration values.

export const siteConfig = {
	/** Repository that hosts the issue forms (see "Community reports" in CLAUDE.md). */
	repoUrl: 'https://github.com/rad0am/PS3DigitalLegacy',
	/** Buy Me a Coffee page, shown as a plain link (no third-party script is loaded). */
	coffeeUrl: 'https://www.buymeacoffee.com/rad0',
	/**
	 * Store closing date (ISO 8601). Keep `null` until PlayStation announces an official date.
	 * null: "not announced", future: countdown, past: "store closed" archive state.
	 */
	closingDate: null as string | null,
	/**
	 * Announced closing month (yyyy-mm) while the exact day is unknown. Sony's notice
	 * (https://www.playstation.com/en-us/support/important-notice/) says the PS3 and PS Vita
	 * stores close "starting July 2027". Set `closingDate` once a day is announced.
	 */
	closingMonth: '2027-07' as string | null,
	igdbUrl: 'https://www.igdb.com/',
	psnProfilesUrl: 'https://psnprofiles.com/'
} as const;

export type IssueTemplate = 'missing-game' | 'remove-game' | 'bug';

/** Link to a GitHub issue form, optionally with a prefilled title. */
export function issueUrl(template: IssueTemplate, title?: string): string {
	const params = new URLSearchParams({ template: `${template}.yml` });
	if (title) params.set('title', title);
	return `${siteConfig.repoUrl}/issues/new?${params.toString()}`;
}

/** IGDB images, sizes per https://api-docs.igdb.com/#images */
const IGDB_IMAGE_BASE = 'https://images.igdb.com/igdb/image/upload';

export function coverUrl(cover: string, size: 'cover_small' | 'cover_big' = 'cover_big'): string {
	return `${IGDB_IMAGE_BASE}/t_${size}/${cover}`;
}
