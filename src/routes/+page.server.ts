import { getCatalogBuild } from '#lib/server/catalog.js';
import type { PageServerLoad } from './$types';

export const prerender = true;

const GENRE_LIMIT = 10;

// Everything the start page shows without waiting for the catalog index: counts and the top
// genres. Computed at build time, so the prerendered HTML already has them.
export const load: PageServerLoad = () => {
	const { catalog } = getCatalogBuild();
	const digital = catalog.games.filter((game) => game.d === 1);

	const genreCount = new Map<number, number>();
	for (const game of digital) {
		for (const genre of game.g) genreCount.set(genre, (genreCount.get(genre) ?? 0) + 1);
	}
	const genres = [...genreCount.entries()]
		.sort((a, b) => b[1] - a[1] || a[0] - b[0])
		.slice(0, GENRE_LIMIT)
		.map(([index, count]) => ({ name: catalog.genres[index]!, count }));

	return {
		stats: {
			games: digital.length,
			dlc: catalog.dlc.length,
			available: digital.filter((game) => game.s === 0).length,
			delisted: digital.filter((game) => game.s === 1).length,
			unknown: digital.filter((game) => game.s === 2).length,
			platinum: digital.filter((game) => game.pl === 1).length
		},
		genres
	};
};
