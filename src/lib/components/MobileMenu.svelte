<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import BmcButton from './BmcButton.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { NAV_LINKS, hrefOf } from '#lib/nav.js';
	import { auth } from '#lib/state/auth.svelte.js';
	import { list } from '#lib/state/list.svelte.js';
	import { ui } from '#lib/state/ui.svelte.js';
	import CurrencyControl from './CurrencyControl.svelte';
	import Icon from './Icon.svelte';
	import LangSwitch from './LangSwitch.svelte';
	import Modal from './Modal.svelte';
	import SyncPill from './SyncPill.svelte';

	// Close the drawer after any navigation.
	$effect(() => {
		void page.url.pathname;
		ui.menuOpen = false;
	});
</script>

<Modal bind:open={ui.menuOpen} label={m.menu_label()} variant="drawer">
	<aside class="drawer">
		<div
			class="row-f"
			style="height:56px;padding:0 8px 0 16px;border-bottom:3px solid var(--sky);flex:none"
		>
			<a class="logo" href={resolve('/')} style="font-size:17px"><b>PS3</b><i>Digital Legacy</i></a>
			<button
				class="btn btn-icon right"
				type="button"
				style="border:0"
				aria-label={m.menu_close()}
				onclick={() => (ui.menuOpen = false)}
			>
				<Icon name="x" />
			</button>
		</div>
		<nav class="dl" style="padding:8px 0" aria-label={m.nav_main()}>
			{#each NAV_LINKS as link (link.route)}
				<a
					href={hrefOf(link.route)}
					aria-current={page.route.id === link.route ? 'page' : undefined}
				>
					{link.label()}
					{#if link.route === '/my-list' && list.wishlistCount > 0}
						<span class="cnt">{list.wishlistCount}</span>
					{/if}
				</a>
			{/each}
		</nav>
		<div
			style="border-top:1px solid var(--line);padding:16px 20px;display:flex;flex-direction:column;gap:14px"
		>
			<div>
				<span class="lbl">{m.language_label()}</span>
				<LangSwitch full />
			</div>
			<div>
				<span class="lbl">{m.currency_label()}</span>
				<CurrencyControl block />
			</div>
		</div>
		<div
			style="margin-top:auto;padding:16px 20px 24px;display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--line)"
		>
			<BmcButton block />
			{#if auth.user}
				<div class="row-f wrapf"><SyncPill /></div>
				<button class="btn btn-blk" type="button" onclick={() => void auth.signOut()}
					>{m.sign_out()}</button
				>
			{:else}
				<button class="btn btn-red btn-blk" type="button" onclick={() => ui.openSignIn()}>
					<Icon name="user" />{m.sign_in()}
				</button>
			{/if}
		</div>
	</aside>
</Modal>
