<script lang="ts">
	import { resolve } from '$app/paths';
	import BmcButton from './BmcButton.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { ui } from '#lib/state/ui.svelte.js';
	import AccountControl from './AccountControl.svelte';
	import CurrencyControl from './CurrencyControl.svelte';
	import Icon from './Icon.svelte';
	import LangSwitch from './LangSwitch.svelte';
</script>

<header class="top">
	<button
		class="btn btn-icon only-mobile"
		type="button"
		aria-label={m.menu_open()}
		onclick={() => (ui.menuOpen = true)}
	>
		<Icon name="menu" />
	</button>

	<a class="logo" href={resolve('/')}>
		<b>PS3</b><i>Digital Legacy</i>
		<svg class="wave only-desktop" viewBox="0 0 30 9" aria-hidden="true">
			<path d="M1 4.5c3-5 5-5 7 0s5 5 7 0 5-5 7 0 4 4 6 1" />
		</svg>
	</a>

	<button class="sbtn only-desktop" type="button" onclick={() => ui.openSearch()}>
		<Icon name="search" />
		<span>{m.search_placeholder()}</span>
		<kbd aria-hidden="true">/</kbd>
	</button>

	<div class="row-f right only-desktop" style="gap:12px">
		<LangSwitch />
		<CurrencyControl />
		<BmcButton />
		<AccountControl />
	</div>

	<div class="row-f only-mobile" style="gap:0">
		<button
			class="btn btn-icon"
			type="button"
			aria-label={m.search_open()}
			onclick={() => ui.openSearch()}
		>
			<Icon name="search" />
		</button>
		<AccountControl />
	</div>
</header>
