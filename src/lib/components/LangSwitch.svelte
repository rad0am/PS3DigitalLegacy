<script lang="ts">
	import { getLocale, setLocale, type Locale } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';

	let { full = false }: { full?: boolean } = $props();

	const LANGUAGES: { locale: Locale; short: string; long: string }[] = [
		{ locale: 'en', short: 'EN', long: 'English' },
		{ locale: 'pl', short: 'PL', long: 'Polski' }
	];

	const current = getLocale();
</script>

<div
	class="lang"
	role="group"
	aria-label={m.language_label()}
	style:display={full ? 'flex' : undefined}
>
	{#each LANGUAGES as language (language.locale)}
		<button
			type="button"
			lang={language.locale}
			aria-pressed={current === language.locale}
			style:flex={full ? '1' : undefined}
			onclick={() => {
				if (current !== language.locale) void setLocale(language.locale);
			}}
		>
			{full ? language.long : language.short}
		</button>
	{/each}
</div>
