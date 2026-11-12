import { resolve } from '$app/paths';
import { m } from '#lib/paraglide/messages.js';

export type NavRoute = '/' | '/catalog' | '/games' | '/dlc' | '/my-list' | '/about';

export interface NavLink {
	route: NavRoute;
	label: () => string;
}

export const NAV_LINKS: readonly NavLink[] = [
	{ route: '/', label: () => m.nav_home() },
	{ route: '/catalog', label: () => m.nav_catalog() },
	{ route: '/games', label: () => m.nav_games() },
	{ route: '/dlc', label: () => m.nav_dlc() },
	{ route: '/my-list', label: () => m.nav_my_list() },
	{ route: '/about', label: () => m.nav_about() }
];

export function hrefOf(route: NavRoute): string {
	return resolve(route);
}
