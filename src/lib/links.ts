import { resolve } from '$app/paths';
import type { Catalog, Item } from '#lib/data/catalog.js';

export function gameHref(id: string): string {
	return resolve('/game/[id]', { id });
}

/** DLC has no page of its own: it links to its parent game, scrolled to the DLC list. */
export function itemHref(catalog: Catalog | null, item: Item): string {
	if (item.kind === 'game') return gameHref(item.id);
	const parent = catalog?.items[item.gameIndex];
	return parent ? `${gameHref(parent.id)}#dlc` : resolve('/');
}
