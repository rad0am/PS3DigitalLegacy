<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { hrefOf } from '#lib/nav.js';
	import { auth } from '#lib/state/auth.svelte.js';
	import { sync } from '#lib/state/sync.svelte.js';
	import { ui } from '#lib/state/ui.svelte.js';
	import Icon from './Icon.svelte';
	import Popover from './Popover.svelte';
	import SyncPill from './SyncPill.svelte';

	let open = $state(false);

	const firstName = $derived(auth.user?.name?.split(' ')[0] ?? m.account_label());
</script>

{#if auth.user}
	<span class="only-desktop"><SyncPill /></span>
	<Popover bind:open label={m.account_label()}>
		{#snippet trigger(props)}
			<button class="btn acct" type="button" aria-label={m.account_menu()} {...props}>
				<Icon name="user" />
				<span class="acct-label">{firstName}</span>
			</button>
		{/snippet}
		<div style="padding:16px;width:290px;display:flex;flex-direction:column;gap:12px">
			<div>
				<div class="h4">{auth.user.name ?? m.account_label()}</div>
				{#if auth.user.email}<div class="muted sm" style="overflow-wrap:anywhere">
						{auth.user.email}
					</div>{/if}
			</div>
			<div><SyncPill /></div>
			{#if sync.state === 'merged'}
				<p class="muted sm">
					{m.sync_merged_detail({ count: sync.conflicts })}
					<a
						class="link"
						href={hrefOf('/my-list')}
						onclick={() => {
							sync.dismissConflicts();
							open = false;
						}}>{m.sync_review()}</a
					>
				</p>
			{/if}
			<button
				class="btn btn-blk"
				type="button"
				onclick={() => {
					open = false;
					void auth.signOut();
				}}>{m.sign_out()}</button
			>
		</div>
	</Popover>
{:else}
	<button class="btn acct" type="button" aria-label={m.sign_in()} onclick={() => ui.openSignIn()}>
		<Icon name="user" />
		<span class="acct-label">{m.sign_in()}</span>
	</button>
{/if}
