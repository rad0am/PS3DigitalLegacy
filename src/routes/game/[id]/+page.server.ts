import { error } from '@sveltejs/kit';
import { getRawGame, loadRawData, toGameDetail } from '#lib/server/catalog.js';
import type { EntryGenerator, PageServerLoad } from './$types';

// One prerendered page (and one small data file) per game: details load lazily per game.
export const prerender = true;

export const entries: EntryGenerator = () => loadRawData().games.map((game) => ({ id: game.id }));

export const load: PageServerLoad = ({ params }) => {
	const game = getRawGame(params.id);
	if (!game) error(404, 'Game not found');
	return { game: toGameDetail(game) };
};
