<script lang="ts">
	import '@fontsource-variable/inter';
	import '@fontsource/cookie/latin-400.css';
	import '#lib/styles/global.css';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import CountdownStrip from '#lib/components/CountdownStrip.svelte';
	import Footer from '#lib/components/Footer.svelte';
	import Header from '#lib/components/Header.svelte';
	import MobileMenu from '#lib/components/MobileMenu.svelte';
	import NavBar from '#lib/components/NavBar.svelte';
	import SearchModal from '#lib/components/SearchModal.svelte';
	import SignInDialog from '#lib/components/SignInDialog.svelte';
	import Sprite from '#lib/components/Sprite.svelte';
	import { detectLanguage, languageOf } from '#lib/languages.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, setLocale } from '#lib/paraglide/runtime.js';
	import { auth } from '#lib/state/auth.svelte.js';
	import { catalogStore } from '#lib/state/catalog.svelte.js';
	import { list } from '#lib/state/list.svelte.js';
	import { settings } from '#lib/state/settings.svelte.js';
	import { ui } from '#lib/state/ui.svelte.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Paraglide matches browser languages by exact tag or base language only, so it misses
	// `zh-TW` (zh-Hant) and `no`/`nn` (nb). With no saved choice, fix those up once (this reloads).
	function correctBrowserLocale(): boolean {
		try {
			if (localStorage.getItem('PARAGLIDE_LOCALE')) return false;
		} catch {
			return false;
		}
		const detected = detectLanguage(navigator.languages ?? [navigator.language]);
		if (!detected || detected === getLocale()) return false;
		void setLocale(detected);
		return true;
	}

	// Local-first: everything below runs in the browser only, after hydration.
	onMount(() => {
		if (correctBrowserLocale()) return;
		document.documentElement.lang = getLocale();
		document.documentElement.dir = languageOf(getLocale()).rtl ? 'rtl' : 'ltr';
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
	<link rel="icon" href={asset('favicon.svg')} type="image/svg+xml" />
	<link rel="icon" href={asset('favicon.ico')} sizes="48x48" />
	<link rel="apple-touch-icon" href={asset('apple-touch-icon.png')} />
	<meta name="theme-color" content="#b3201a" />
</svelte:head>

<svelte:window onkeydown={onKeydown} />

<Sprite />
<a class="skip" href="#main">{m.skip_to_content()}</a>

<div class="app" class:is-home={page.route.id === '/'}>
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
