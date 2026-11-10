<script lang="ts">
	import '@fontsource-variable/inter';
	import '@fontsource/cookie/latin-400.css';
	import '#lib/styles/global.css';
	import { onMount } from 'svelte';
	import favicon from '#lib/assets/favicon.svg';
	import CountdownStrip from '#lib/components/CountdownStrip.svelte';
	import Footer from '#lib/components/Footer.svelte';
	import Header from '#lib/components/Header.svelte';
	import MobileMenu from '#lib/components/MobileMenu.svelte';
	import NavBar from '#lib/components/NavBar.svelte';
	import SearchModal from '#lib/components/SearchModal.svelte';
	import SignInDialog from '#lib/components/SignInDialog.svelte';
	import Sprite from '#lib/components/Sprite.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { auth } from '#lib/state/auth.svelte.js';
	import { catalogStore } from '#lib/state/catalog.svelte.js';
	import { list } from '#lib/state/list.svelte.js';
	import { settings } from '#lib/state/settings.svelte.js';
	import { ui } from '#lib/state/ui.svelte.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Local-first: everything below runs in the browser only, after hydration.
	onMount(() => {
		document.documentElement.lang = getLocale();
		document.documentElement.removeAttribute('data-pending-locale');
		settings.load();
		list.load();
		void catalogStore.load();
		void auth.init();
	});

	// Prices load per currency: the selected one plus the USD and EUR fallbacks.
	$effect(() => {
		if (catalogStore.status !== 'ready') return;
		for (const currency of new Set([settings.currency, 'USD', 'EUR'])) {
			void catalogStore.ensurePrices(currency);
		}
	});

	function onKeydown(event: KeyboardEvent) {
		if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('input, textarea, select, [contenteditable], dialog[open]')) return;
		event.preventDefault();
		ui.openSearch();
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#b3201a" />
</svelte:head>

<svelte:window onkeydown={onKeydown} />

<Sprite />
<a class="skip" href="#main">{m.skip_to_content()}</a>

<div class="app">
	<Header />
	<NavBar />
	<CountdownStrip />
	{@render children()}
	<Footer />
</div>

<MobileMenu />
<SearchModal />
<SignInDialog />

<div class="sr-only" role="status" aria-live="polite">{ui.notice ?? ''}</div>
