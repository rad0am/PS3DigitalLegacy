import { json } from '@sveltejs/kit';
import { getCatalogBuild } from '#lib/server/catalog.js';
import type { RequestHandler } from './$types';

// Generated at build time from data/ps3-digital.json and served as a static file.
export const prerender = true;

export const GET: RequestHandler = () => json(getCatalogBuild().catalog);
