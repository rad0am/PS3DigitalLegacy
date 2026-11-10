<script lang="ts">
	import { page } from '$app/state';
	import { siteConfig } from '#lib/config.js';
	import { m } from '#lib/paraglide/messages.js';

	type Props = {
		/** Page title without the site name; omit on the home page. */
		title?: string;
		description?: string;
		type?: 'website' | 'article';
	};

	let { title, description, type = 'website' }: Props = $props();

	const fullTitle = $derived(title ? `${title} · ${m.app_title()}` : m.app_title());
	const text = $derived(description ?? m.app_tagline());
	// Absolute URLs are required by crawlers. Pages are prerendered, so build them from the config.
	const url = $derived(`${siteConfig.siteOrigin}${page.url.pathname}`);
	const image = $derived(`${siteConfig.siteOrigin}${__BASE_PATH__}/og-image.png`);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={text} />
	<link rel="canonical" href={url} />

	<meta property="og:site_name" content={m.app_title()} />
	<meta property="og:type" content={type} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={text} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={image} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={m.og_image_alt()} />
	<meta property="og:locale" content="en_US" />
	<meta property="og:locale:alternate" content="pl_PL" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={text} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content={m.og_image_alt()} />
</svelte:head>
