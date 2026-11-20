<script lang="ts">
	import { formatNumber } from '#lib/i18n.js';
	import { detectLanguage, LANGUAGES, languageOf, shortCode } from '#lib/languages.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, setLocale, type Locale } from '#lib/paraglide/runtime.js';
	import { normalize } from '#lib/data/search.js';
	import Icon from './Icon.svelte';
	import Popover from './Popover.svelte';

	let { full = false }: { full?: boolean } = $props();

	const current = getLocale();
	const currentLanguage = languageOf(current);

	let open = $state(false);
	let query = $state('');
	let input = $state<HTMLInputElement>();
	// Browser only: pages are prerendered, so this stays null until hydration.
	const detected: Locale | null =
		typeof navigator === 'undefined'
			? null
			: detectLanguage(navigator.languages ?? [navigator.language]);

	// Detected language first, then English, then the rest A to Z by English name.
	const options = $derived.by(() => {
		const rank = (locale: string) => (locale === detected ? 0 : locale === 'en' ? 1 : 2);
		const needle = normalize(query);
		return LANGUAGES.filter(
			(language) =>
				!needle ||
				normalize(
					`${language.native} ${language.english} ${language.locale} ${language.currencies.join(' ')}`
				).includes(needle)
		).sort((a, b) => rank(a.locale) - rank(b.locale) || a.english.localeCompare(b.english));
	});

	$effect(() => {
		if (open) input?.focus();
		else query = '';
	});

	function choose(locale: Locale) {
		open = false;
		if (locale !== current) void setLocale(locale);
	}
</script>

<Popover bind:open label={m.language_label()} sheetOnMobile block={full} width={380}>
	{#snippet trigger(props)}
		<button
			class="fld"
			type="button"
			lang={current}
			aria-label={m.language_current({ name: currentLanguage.native })}
			style:width={full ? '100%' : undefined}
			style:justify-content={full ? 'space-between' : undefined}
			{...props}
		>
			<span class="row-f">
				<Icon name="globe" size="s" />{full ? currentLanguage.native : shortCode(current)}
			</span>
			<Icon name="chev" size="s" />
		</button>
	{/snippet}

	<div class="grab only-mobile"></div>
	<div class="row-f only-mobile" style="padding:8px 8px 8px 20px">
		<h2 class="h3">{m.language_label()}</h2>
		<button
			class="btn btn-icon right"
			type="button"
			aria-label={m.close()}
			onclick={() => (open = false)}
		>
			<Icon name="x" />
		</button>
	</div>
	<div style="padding:12px 12px 8px">
		<div class="inp" style="display:flex;align-items:center;gap:8px;height:44px">
			<Icon name="search" size="s" />
			<input
				bind:this={input}
				bind:value={query}
				type="text"
				inputmode="search"
				placeholder={m.language_search()}
				aria-label={m.language_search()}
				style="flex:1;min-width:0;border:0;outline:none;background:none;font:inherit;color:inherit;height:100%"
			/>
		</div>
		<p class="xs muted" style="margin-top:8px">
			{m.language_count({ count: formatNumber(LANGUAGES.length) })}
		</p>
	</div>
	<div class="pop-list" role="listbox" aria-label={m.language_label()} style="flex:1">
		{#each options as language (language.locale)}
			<button
				class="it"
				type="button"
				role="option"
				lang={language.locale}
				aria-selected={language.locale === current}
				style="min-height:52px"
				onclick={() => choose(language.locale)}
			>
				{#if language.locale === current}
					<Icon name="check" size="s" />
				{:else}
					<span style="width:16px"></span>
				{/if}
				<span class="grow">
					{language.native}
					<small class="muted" lang="en" style="display:block;font-size:12px;line-height:16px">
						{language.english}
					</small>
				</span>
				{#if language.locale === detected}
					<span class="bd bd-sky">{m.language_detected()}</span>
				{:else}
					<span class="cur" dir="ltr">
						{#each language.currencies.slice(0, 3) as code (code)}<span>{code}</span>{/each}
						{#if language.currencies.length > 3}<span>+{language.currencies.length - 3}</span>{/if}
					</span>
				{/if}
			</button>
		{:else}
			<p class="muted sm" style="padding:12px 14px">{m.language_none()}</p>
		{/each}
	</div>
	<div class="xs muted" style="border-top:1px solid var(--line);margin-top:6px;padding:10px 14px">
		{m.language_note()}
	</div>
</Popover>
