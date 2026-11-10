import { loadRawData } from '#lib/server/catalog.js';
import type { PageServerLoad } from './$types';

export const prerender = true;

// Rounded counts for the intro text ("about 900 games and 3,100 DLC").
export const load: PageServerLoad = () => {
	const games = loadRawData().games;
	const dlc = games.reduce((sum, game) => sum + (game.dlc?.length ?? 0), 0);
	return {
		games: Math.round(games.length / 100) * 100,
		dlc: Math.round(dlc / 100) * 100
	};
};
