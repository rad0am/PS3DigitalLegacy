import { error, json } from '@sveltejs/kit';
import { getCatalogBuild } from '#lib/server/catalog.js';
import type { EntryGenerator, RequestHandler } from './$types';

// One small file per currency (prices aligned with the catalog items), loaded on demand.
export const prerender = true;

export const entries: EntryGenerator = () =>
	getCatalogBuild().catalog.currencies.map((currency) => ({ currency }));

export const GET: RequestHandler = ({ params }) => {
	const values = getCatalogBuild().prices.get(params.currency);
	if (!values) error(404, 'Unknown currency');
	return json(values);
};
